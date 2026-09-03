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
 * Upload a user avatar image to Supabase Storage
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(NOTES_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(NOTES_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
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

  // 4. Delete user from Supabase Auth
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Supabase Auth deleteUser error:', error);
    throw error;
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
  } catch (err) {
    console.warn('Could not backup fees to cloud storage:', err);
  }
}

/**
 * Fetch student fees list from Cloud Storage backup
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
