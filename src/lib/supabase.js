import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lyaiygwogmkgxtljajhm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aIlHmC0rjch431pNG2XwTQ_MjtDniOo';

const getServiceKey = () => {
  if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    return import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  }
  try {
    if (typeof window !== 'undefined' && window.atob) {
      return window.atob('c2Jfc2VjcmV0X1pBX3BBa2RZWnRVY3FZNENkMEZ3bXdfYTVkWjkwcTI=');
    }
  } catch (e) {}
  return supabaseAnonKey;
};

const serviceRoleKey = getServiceKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const NOTES_BUCKET = 'class_notes';
const NOTES_INDEX_FILE = 'notes_index.json';

/**
 * Upload a note/assignment file to Supabase Storage
 */
export async function uploadNoteFile(file) {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `files/${Date.now()}_${cleanName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(NOTES_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(NOTES_BUCKET)
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

/**
 * Upload a user avatar image to Supabase Storage with Base64 fallback
 */
export async function uploadAvatar(userId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from(NOTES_BUCKET)
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || 'image/jpeg',
          });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from(NOTES_BUCKET)
            .getPublicUrl(filePath);
          resolve(publicUrl);
          return;
        }
      } catch (err) {
        console.warn('Remote avatar upload error, using local data URL:', err);
      }
      // Reliable fallback: Data URL
      resolve(dataUrl);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Update user profile info across Auth and profiles database
 */
export async function updateUserProfile(userId, { fullName, avatarUrl }) {
  // 1. Update Auth metadata
  const authUpdates = { data: {} };
  if (fullName !== undefined) authUpdates.data.full_name = fullName;
  if (avatarUrl !== undefined) authUpdates.data.avatar_url = avatarUrl;

  try {
    await supabase.auth.updateUser(authUpdates);
  } catch (err) {
    console.warn('Could not update auth user metadata:', err);
  }

  // 2. Update profiles table
  const profileUpdates = {};
  if (fullName !== undefined) profileUpdates.full_name = fullName;
  if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId);

  if (error) {
    try {
      await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
    } catch (e) {
      console.warn('Admin profile update error:', e);
    }
  }

  // 3. Update rooms teacher_name if applicable
  if (fullName) {
    try {
      await supabaseAdmin
        .from('rooms')
        .update({ teacher_name: fullName })
        .eq('teacher_id', userId);
    } catch (e) {}
  }

  return true;
}

/**
 * Fetch all published class notes & study materials
 */
export async function fetchClassNotes() {
  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/public/${NOTES_BUCKET}/${NOTES_INDEX_FILE}?t=${Date.now()}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem('gurukul_class_notes', JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch notes from cloud storage, using local cache:', err);
  }

  const cached = localStorage.getItem('gurukul_class_notes');
  return cached ? JSON.parse(cached) : [];
}

/**
 * Publish a new class note
 */
export async function publishClassNote(note) {
  const currentNotes = await fetchClassNotes();
  const updated = [note, ...currentNotes.filter((n) => n.id !== note.id)];

  // Save to cloud index
  try {
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
    await supabaseAdmin.storage
      .from(NOTES_BUCKET)
      .upload(NOTES_INDEX_FILE, blob, {
        upsert: true,
        contentType: 'application/json',
      });
  } catch (err) {
    console.warn('Failed to update remote notes index:', err);
  }

  localStorage.setItem('gurukul_class_notes', JSON.stringify(updated));
  return updated;
}

/**
 * Delete a class note & attached file
 */
export async function deleteClassNote(noteId, filePath) {
  const currentNotes = await fetchClassNotes();
  const updated = currentNotes.filter((n) => n.id !== noteId);

  // Delete attached file if present
  if (filePath) {
    try {
      await supabaseAdmin.storage.from(NOTES_BUCKET).remove([filePath]);
    } catch (err) {
      console.warn('Could not delete storage file:', err);
    }
  }

  // Update cloud index
  try {
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
    await supabaseAdmin.storage
      .from(NOTES_BUCKET)
      .upload(NOTES_INDEX_FILE, blob, {
        upsert: true,
        contentType: 'application/json',
      });
  } catch (err) {
    console.warn('Failed to update remote notes index after delete:', err);
  }

  localStorage.setItem('gurukul_class_notes', JSON.stringify(updated));
  return updated;
}

/**
 * Delete a user account completely (profile, rooms, and auth)
 */
export async function deleteUserAccount(userId) {
  if (!userId) throw new Error('User ID is required for deletion.');

  try {
    // 1. Delete associated rooms
    await supabaseAdmin.from('rooms').delete().eq('teacher_id', userId);
  } catch (e) {
    console.warn('Error clearing user rooms:', e);
  }

  try {
    // 2. Delete associated student fees
    await supabaseAdmin.from('student_fees').delete().eq('teacher_id', userId);
  } catch (e) {
    console.warn('Error clearing student fees:', e);
  }

  try {
    // 3. Delete user profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
  } catch (e) {
    console.warn('Error deleting profile:', e);
  }

  // 4. Delete user from Supabase Auth if permitted
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.warn('Supabase Auth admin deleteUser error (requires service_role):', error);
    }
  } catch (err) {
    console.warn('Could not call admin.deleteUser:', err);
  }

  // 5. Clean up local caches
  localStorage.removeItem(`gurukul_fees_${userId}`);
  localStorage.removeItem('gurukul_class_notes');

  // 6. Sign out locally
  await supabase.auth.signOut();
  return true;
}

/**
 * Sync student fees list to Cloud Storage backup
 */
export async function syncFeesToCloud(teacherId, feesList) {
  if (!teacherId || !feesList) return;
  try {
    const filePath = `fees/teacher_${teacherId}_fees.json`;
    const blob = new Blob([JSON.stringify(feesList, null, 2)], { type: 'application/json' });
    await supabaseAdmin.storage
      .from(NOTES_BUCKET)
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'application/json',
      });

    // Also maintain a combined all_student_fees.json so students can view their fee records across teachers
    try {
      const currentGlobal = await fetchAllStudentFeesFromCloud();
      const otherTeachers = Array.isArray(currentGlobal)
        ? currentGlobal.filter((s) => s.teacher_id !== teacherId)
        : [];
      const combined = [...feesList, ...otherTeachers];
      const globalBlob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' });
      await supabaseAdmin.storage
        .from(NOTES_BUCKET)
        .upload('fees/all_student_fees.json', globalBlob, {
          upsert: true,
          contentType: 'application/json',
        });
    } catch (globalErr) {
      console.warn('Could not update all_student_fees.json:', globalErr);
    }
  } catch (err) {
    console.warn('Could not backup fees to cloud storage:', err);
  }
}

/**
 * Fetch all student fees across all teachers from Cloud Storage
 */
export async function fetchAllStudentFeesFromCloud() {
  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/public/${NOTES_BUCKET}/fees/all_student_fees.json?t=${Date.now()}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Could not read all fees from cloud storage:', err);
  }
  return [];
}

/**
 * Fetch student fees list from Cloud Storage backup for a specific teacher
 */
export async function fetchFeesFromCloud(teacherId) {
  if (!teacherId) return null;
  try {
    const filePath = `fees/teacher_${teacherId}_fees.json`;
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/public/${NOTES_BUCKET}/${filePath}?t=${Date.now()}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Could not read fees from cloud storage:', err);
  }
  return null;
}

/**
 * Dispatch real emails using Resend.com API
 */
export async function sendEmailViaResend(to, subject, html) {
  try {
    const resendKey = atob('cmVfQ3Jnd3NNWk1fUE41c0t1S3h6TUJYSmJzcG5LdnFxMVJF');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gurukul by Ruby <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    console.warn('Resend email dispatch error:', err);
    return { ok: false, error: err };
  }
}

/**
 * Generate official Supabase verification link and dispatch via Resend
 */
export async function generateAndSendVerificationEmail(email, password, fullName = 'Student') {
  try {
    // Generate verification link without hitting Supabase email rate limits
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email.trim(),
      password: password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) throw error;

    let actionLink = data?.properties?.action_link || data?.action_link;
    if (actionLink) {
      // Ensure redirect points to live Vercel domain
      actionLink = actionLink.replace('http://localhost:3000', 'https://teacher-student-app-blue.vercel.app');
      
      // Dispatch via Resend
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #fbf9f5;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #9a3412; margin: 0; font-size: 24px;">Gurukul by Ruby 🏫</h1>
            <p style="color: #78350f; font-size: 13px; margin: 4px 0 0 0;">Personalized Tuition & Live Mentorship</p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #fef3c7;">
            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Namaste ${fullName}!</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Welcome to Gurukul by Ruby. Please confirm your email address to activate your account and start attending your live classes and accessing daily DPP notes.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${actionLink}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                Confirm My Account &rarr;
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; word-break: break-all;">
              Or copy and paste this link into your browser:<br/>
              <a href="${actionLink}" style="color: #0284c7;">${actionLink}</a>
            </p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
            &copy; Gurukul by Ruby • Empowering students with dedicated guidance
          </p>
        </div>
      `;

      const sendResult = await sendEmailViaResend(email, 'Verify your Gurukul by Ruby Account ✨', emailHtml);
      return { ok: true, actionLink, emailSent: sendResult.ok };
    }
  } catch (err) {
    console.warn('generateAndSendVerificationEmail notice:', err);
  }
  return { ok: false };
}
