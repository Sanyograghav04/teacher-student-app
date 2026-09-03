import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchClassNotes, 
  publishClassNote, 
  deleteClassNote, 
  uploadNoteFile 
} from '../lib/supabase';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  ExternalLink, 
  Trash2, 
  UploadCloud, 
  Loader2, 
  X, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  File, 
  Sparkles,
  Filter
} from 'lucide-react';

const SUBJECT_LIST = [
  'All',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'English',
  'Computer Science',
  'Social Science'
];

export default function ClassNotesManager({ isTeacher = false }) {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'

  // Upload Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    description: '',
    externalLink: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');

  const displayName = profile?.full_name || user?.email?.split('@')[0] || (isTeacher ? 'Teacher' : 'Student');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await fetchClassNotes();
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setFormError('File size exceeds 25MB limit. Please choose a smaller file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setFormError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please enter a note title.');
      return;
    }

    if (uploadType === 'file' && !selectedFile) {
      setFormError('Please select a file to upload.');
      return;
    }

    if (uploadType === 'link' && !formData.externalLink.trim()) {
      setFormError('Please enter a valid URL or resource link.');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      let fileData = null;
      if (uploadType === 'file' && selectedFile) {
        fileData = await uploadNoteFile(selectedFile);
      }

      const notePayload = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: formData.title.trim(),
        subject: formData.subject,
        description: formData.description.trim(),
        upload_type: uploadType,
        file_name: fileData?.fileName || (uploadType === 'link' ? 'Resource Link' : 'Attachment'),
        file_url: fileData?.publicUrl || formData.externalLink.trim(),
        file_path: fileData?.filePath || null,
        file_size: fileData?.fileSize || null,
        file_type: fileData?.fileType || null,
        teacher_id: user?.id,
        teacher_name: displayName,
        created_at: new Date().toISOString(),
      };

      const updated = await publishClassNote(notePayload);
      setNotes(updated);
      setShowUploadModal(false);
      resetForm();
    } catch (err) {
      console.error('Upload error:', err);
      setFormError(err.message || 'Failed to upload note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) return;
    try {
      const updated = await deleteClassNote(note.id, note.file_path);
      setNotes(updated);
    } catch (err) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: 'Physics',
      description: '',
      externalLink: '',
    });
    setSelectedFile(null);
    setFormError('');
    setUploadType('file');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
    const matchesSearch = 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const getSubjectColor = (subj) => {
    switch (subj?.toLowerCase()) {
      case 'physics':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'chemistry':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'mathematics':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      case 'biology':
        return 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 border-teal-200 dark:border-teal-500/20';
      case 'english':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      default:
        return 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 border-brand-200 dark:border-brand-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, topic, subject, or teacher..."
            className="w-full pl-10 pr-4 py-2.5 bg-brand-50/50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'Material' : 'Materials'}
          </span>

          {isTeacher && (
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Notes / Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SUBJECT_LIST.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedSubject === subj
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-brand-100/60 dark:border-slate-700'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading study materials...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {searchQuery || selectedSubject !== 'All' ? 'No matching notes found' : 'No Class Notes Uploaded Yet 📚'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {isTeacher 
              ? 'Share PDF notes, lecture slides, assignments, or external reference links with your students.' 
              : 'Your teachers have not uploaded any notes yet. Check back soon!'}
          </p>
          {isTeacher && (
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Note</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const isOwner = isTeacher && (note.teacher_id === user?.id || !note.teacher_id);
            const isExternalLink = note.upload_type === 'link';

            return (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft hover:shadow-card-hover transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSubjectColor(note.subject)}`}>
                      {note.subject}
                    </span>

                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(note)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                    {note.title}
                  </h4>

                  {note.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {note.description}
                    </p>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      {isExternalLink ? (
                        <ExternalLink className="w-4 h-4 text-brand-500 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {note.file_name}
                      </span>
                    </div>
                    {note.file_size && (
                      <span className="text-[11px] text-slate-400 shrink-0 font-mono ml-2">
                        {formatFileSize(note.file_size)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>By {note.teacher_name || 'Teacher'}</span>
                    <span>
                      {new Date(note.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={!isExternalLink}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {isExternalLink ? (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Resource Link</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Note</span>
                      </>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Note Modal (Teachers only) */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-brand-100 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all shadow-sm"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                  Upload Class Notes 📝
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share study materials, PDFs, or assignments with students
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                  Subject / Category *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUBJECT_LIST.filter((s) => s !== 'All').map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormData({ ...formData, subject: sub })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        formData.subject === sub
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-brand-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-brand-100 dark:border-slate-700 hover:bg-brand-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                  Topic / Note Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Thermodynamics Formula Sheet & Practice Set"
                  className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                  Material Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      uploadType === 'file'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Upload File (PDF/Doc/Image)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('link')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      uploadType === 'link'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    External Web / Drive Link
                  </button>
                </div>
              </div>

              {uploadType === 'file' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                    Select File (Max 25MB) *
                  </label>
                  <div className="border-2 border-dashed border-brand-200 dark:border-slate-700 rounded-2xl p-5 text-center hover:border-brand-500 transition-colors bg-brand-50/30 dark:bg-slate-800/40 relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                    />
                    <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Click to browse or drag and drop file here
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PDF, Word Docs, Presentations, Text, Images (up to 25MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                    Resource Link (URL) *
                  </label>
                  <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    placeholder="https://drive.google.com/... or https://..."
                    className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                  Description / Remarks (Optional)
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Please solve the exercise on page 4 before Friday's live lecture."
                  className="w-full px-4 py-2.5 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Gurukul...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Publish Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
