import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  Phone,
  Mail,
  Calendar,
  X,
  Loader2
} from 'lucide-react';

export default function StudentFeesManager() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    phone: '',
    class_name: '',
    total_fees: '',
    paid_fees: '0',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        const local = localStorage.getItem(`gurukul_fees_${user.id}`);
        if (local) setStudents(JSON.parse(local));
      } else {
        setStudents(data || []);
        localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(data || []));
      }
    } catch (err) {
      console.error('Error loading students:', err);
      const local = localStorage.getItem(`gurukul_fees_${user.id}`);
      if (local) setStudents(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      teacher_id: user.id,
      student_name: formData.student_name.trim(),
      student_email: formData.student_email.trim(),
      phone: formData.phone.trim(),
      class_name: formData.class_name.trim(),
      total_fees: Number(formData.total_fees) || 0,
      paid_fees: Number(formData.paid_fees) || 0,
      due_date: formData.due_date || null,
      notes: formData.notes.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('student_fees')
          .update(payload)
          .eq('id', editingStudent.id);

        if (error) throw error;
        const updated = students.map((s) => (s.id === editingStudent.id ? { ...s, ...payload } : s));
        setStudents(updated);
        localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
      } else {
        const { data, error } = await supabase
          .from('student_fees')
          .insert([payload])
          .select()
          .single();

        if (error) {
          const newStudent = { ...payload, id: Date.now().toString(), created_at: new Date().toISOString() };
          const updated = [newStudent, ...students];
          setStudents(updated);
          localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
        } else {
          const updated = [data, ...students];
          setStudents(updated);
          localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
        }
      }

      setShowAddModal(false);
      setEditingStudent(null);
      resetForm();
    } catch (err) {
      alert(err.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount) return;

    const addedAmount = Number(paymentAmount);
    if (isNaN(addedAmount) || addedAmount <= 0) return;

    const newPaid = Number(showPaymentModal.paid_fees || 0) + addedAmount;
    try {
      const { error } = await supabase
        .from('student_fees')
        .update({ paid_fees: newPaid, updated_at: new Date().toISOString() })
        .eq('id', showPaymentModal.id);

      if (error) throw error;

      const updated = students.map((s) => (s.id === showPaymentModal.id ? { ...s, paid_fees: newPaid } : s));
      setStudents(updated);
      localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
      setShowPaymentModal(null);
      setPaymentAmount('');
    } catch (err) {
      alert(err.message || 'Failed to record payment.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student record?')) return;
    try {
      const { error } = await supabase
        .from('student_fees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  const resetForm = () => {
    setFormData({
      student_name: '',
      student_email: '',
      phone: '',
      class_name: '',
      total_fees: '',
      paid_fees: '0',
      due_date: '',
      notes: '',
    });
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_name: student.student_name || '',
      student_email: student.student_email || '',
      phone: student.phone || '',
      class_name: student.class_name || '',
      total_fees: student.total_fees || '',
      paid_fees: student.paid_fees || '0',
      due_date: student.due_date || '',
      notes: student.notes || '',
    });
    setShowAddModal(true);
  };

  const exportCSV = () => {
    const headers = ['Student Name', 'Email', 'Phone', 'Class/Batch', 'Total Fees', 'Paid Fees', 'Pending', 'Status', 'Due Date', 'Notes'];
    const rows = filteredStudents.map((s) => {
      const total = Number(s.total_fees || 0);
      const paid = Number(s.paid_fees || 0);
      const pending = Math.max(0, total - paid);
      const status = paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
      return [
        `"${s.student_name}"`,
        `"${s.student_email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.class_name || ''}"`,
        total,
        paid,
        pending,
        status,
        s.due_date || 'N/A',
        `"${s.notes || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gurukul_student_fees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalTarget = students.reduce((acc, curr) => acc + Number(curr.total_fees || 0), 0);
  const totalCollected = students.reduce((acc, curr) => acc + Number(curr.paid_fees || 0), 0);
  const totalPending = Math.max(0, totalTarget - totalCollected);
  const collectionPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const filteredStudents = students.filter((s) => {
    const total = Number(s.total_fees || 0);
    const paid = Number(s.paid_fees || 0);
    const isPaid = paid >= total && total > 0;
    const isPartial = paid > 0 && paid < total;
    const isPending = paid === 0;

    const matchesSearch =
      s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.class_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && isPaid) ||
      (filterStatus === 'partial' && isPartial) ||
      (filterStatus === 'pending' && (isPending || isPartial));

    const matchesClass = filterClass === 'all' || s.class_name === filterClass;

    return matchesSearch && matchesStatus && matchesClass;
  });
  return (
    <div className="space-y-6">
      {/* Top Stat Progress Visualizer (Filoo App Media 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Target
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ₹{totalTarget.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Across all enrolled students</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Collected Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{totalCollected.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {collectionPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, collectionPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              ₹{totalPending.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pending collection</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Records
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {students.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total managed students</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, phone, or class..."
            className="w-full pl-10 pr-4 py-2.5 bg-brand-50/50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'paid', label: 'Paid' },
            { id: 'partial', label: 'Partial' },
            { id: 'pending', label: 'Pending' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-brand-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-brand-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
            title="Export Records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingStudent(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/15 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Student Records Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading student records...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">No Student Records Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery ? 'No students match your active filters.' : 'Add your first student to easily track their fees & batch records.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-600 text-white font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const total = Number(student.total_fees || 0);
            const paid = Number(student.paid_fees || 0);
            const pending = Math.max(0, total - paid);
            const isPaid = paid >= total && total > 0;
            const isPartial = paid > 0 && paid < total;
            const progress = total > 0 ? Math.round((paid / total) * 100) : 0;

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {student.student_name ? student.student_name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {student.student_name}
                        </h4>
                        {student.class_name && (
                          <span className="inline-block text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 px-2 py-0.5 rounded-full mt-0.5">
                            {student.class_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {isPaid ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        PAID
                      </span>
                    ) : isPartial ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        PARTIAL
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                        DUE
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-3 text-xs text-slate-600 dark:text-slate-400">
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{student.phone}</span>
                      </div>
                    )}
                    {student.student_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{student.student_email}</span>
                      </div>
                    )}
                    {student.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]">Due: {student.due_date}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-brand-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 my-2">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Paid: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">₹{paid.toLocaleString()}</strong></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total: <strong className="text-slate-800 dark:text-slate-200 font-bold">₹{total.toLocaleString()}</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-brand-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    {pending > 0 && (
                      <div className="mt-1 text-right text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        Pending: ₹{pending.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setShowPaymentModal(student);
                      setPaymentAmount('');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Payment</span>
                  </button>

                  <button
                    onClick={() => openEdit(student)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Edit Record"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(student.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
              {editingStudent ? 'Edit Student Record' : 'Add New Student'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Enter student details and fee agreement
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="e.g. Cameron Williamson"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Class / Batch
                  </label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    placeholder="e.g. Class 10 - Math"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={formData.student_email}
                    onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                    placeholder="student@gurukul.com"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Fees (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.total_fees}
                    onChange={(e) => setFormData({ ...formData, total_fees: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Paid Fees (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paid_fees}
                    onChange={(e) => setFormData({ ...formData, paid_fees: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Fee Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3.5 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Monthly instalment, scholarship, etc."
                  className="w-full px-3.5 py-2.5 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/15 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Student</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Quick Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
              Record Fee Payment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Student: <strong className="text-slate-800 dark:text-slate-200">{showPaymentModal.student_name}</strong>
              <br />
              Pending Balance: <strong className="text-rose-600 dark:text-rose-400">₹{Math.max(0, (showPaymentModal.total_fees || 0) - (showPaymentModal.paid_fees || 0)).toLocaleString()}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Amount Received (₹)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
