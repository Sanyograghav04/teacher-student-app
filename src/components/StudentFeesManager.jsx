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
  IndianRupee,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  FileSpreadsheet,
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
      const local = localStorage.getItem(`gurukul_fees_${user.id}`);
      if (local) setStudents(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.class_name.trim()) return;

    setSaving(true);
    const total = parseFloat(formData.total_fees) || 0;
    const paid = parseFloat(formData.paid_fees) || 0;

    let status = 'pending';
    if (paid >= total && total > 0) status = 'paid';
    else if (paid > 0 && paid < total) status = 'partial';

    const newRecord = {
      teacher_id: user.id,
      student_name: formData.student_name.trim(),
      student_email: formData.student_email.trim(),
      phone: formData.phone.trim(),
      class_name: formData.class_name.trim(),
      total_fees: total,
      paid_fees: paid,
      status: status,
      due_date: formData.due_date,
      notes: formData.notes.trim(),
    };

    try {
      if (editingStudent) {
        await supabase
          .from('student_fees')
          .update(newRecord)
          .eq('id', editingStudent.id);

        const updated = students.map((s) => (s.id === editingStudent.id ? { ...s, ...newRecord } : s));
        setStudents(updated);
        localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
      } else {
        const { data } = await supabase
          .from('student_fees')
          .insert(newRecord)
          .select()
          .single();

        const createdItem = data || { ...newRecord, id: 'temp_' + Date.now() };
        const updated = [createdItem, ...students];
        setStudents(updated);
        localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
      }

      setShowAddModal(false);
      setEditingStudent(null);
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount) return;

    const addPaid = parseFloat(paymentAmount) || 0;
    const currentPaid = parseFloat(showPaymentModal.paid_fees) || 0;
    const newPaid = currentPaid + addPaid;
    const total = parseFloat(showPaymentModal.total_fees) || 0;

    let status = 'pending';
    if (newPaid >= total && total > 0) status = 'paid';
    else if (newPaid > 0) status = 'partial';

    try {
      await supabase
        .from('student_fees')
        .update({ paid_fees: newPaid, status: status })
        .eq('id', showPaymentModal.id);

      const updated = students.map((s) => 
        s.id === showPaymentModal.id ? { ...s, paid_fees: newPaid, status } : s
      );
      setStudents(updated);
      localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
      setShowPaymentModal(null);
      setPaymentAmount('');
    } catch (err) {
      console.error('Payment record error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student fee record?')) return;
    try {
      await supabase.from('student_fees').delete().eq('id', id);
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
    } catch (err) {
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      localStorage.setItem(`gurukul_fees_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = 'Student Name,Email,Phone,Class,Total Fees,Paid Fees,Pending Balance,Status,Due Date,Notes\n';
    const rows = students.map((s) => {
      const pending = Math.max(0, (s.total_fees || 0) - (s.paid_fees || 0));
      return `"${s.student_name}","${s.student_email || ''}","${s.phone || ''}","${s.class_name}","${s.total_fees || 0}","${s.paid_fees || 0}","${pending}","${s.status}","${s.due_date || ''}","${s.notes || ''}"`;
    });

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Gurukul_Student_Fees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Metrics
  const totalStudentsCount = students.length;
  const totalRevenue = students.reduce((acc, s) => acc + (parseFloat(s.paid_fees) || 0), 0);
  const totalPending = students.reduce((acc, s) => {
    const total = parseFloat(s.total_fees) || 0;
    const paid = parseFloat(s.paid_fees) || 0;
    return acc + Math.max(0, total - paid);
  }, 0);
  const paidCount = students.filter((s) => s.status === 'paid').length;

  const uniqueClasses = ['all', ...new Set(students.map((s) => s.class_name).filter(Boolean))];

  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesClass = filterClass === 'all' || s.class_name === filterClass;

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Enrolled
            </p>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalStudentsCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all classes</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Collected Fees
            </p>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{paidCount} fully paid</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Balance
            </p>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            ₹{totalPending.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting payment</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Actions
            </p>
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                resetForm();
                setEditingStudent(null);
                setShowAddModal(true);
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={students.length === 0}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, email, class, phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">🟢 Fully Paid</option>
            <option value="partial">🟡 Partial Paid</option>
            <option value="pending">🔴 Pending Fees</option>
          </select>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Classes' : `📚 ${c}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No student records found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
              Add your students to track their class enrollments, fee structures, and payment history.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5">Student Info</th>
                  <th className="py-3.5 px-4">Class / Subject</th>
                  <th className="py-3.5 px-4">Fee Breakdown</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredStudents.map((s) => {
                  const total = parseFloat(s.total_fees) || 0;
                  const paid = parseFloat(s.paid_fees) || 0;
                  const pending = Math.max(0, total - paid);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{s.student_name}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-rose-500" />
                              {s.phone}
                            </span>
                          )}
                          {s.student_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {s.student_email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                          <BookOpen className="w-3 h-3 text-rose-500" />
                          {s.class_name}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Total: ₹{total.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Paid: ₹{paid.toLocaleString()}
                          </p>
                          {pending > 0 && (
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              Pending: ₹{pending.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {s.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Fully Paid
                          </span>
                        )}
                        {s.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        )}
                        {s.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {s.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{s.due_date}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowPaymentModal(s)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] transition-colors"
                            title="Record Payment"
                          >
                            + Payment
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Edit Student Record' : 'Add New Student'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Class / Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    placeholder="e.g. Grade 10 Math"
                    className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Email
                </label>
                <input
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                  placeholder="student@gmail.com"
                  className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
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
                    className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Monthly instalment, scholarship, etc."
                  className="block w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Record Fee Payment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Student: <strong className="text-slate-800 dark:text-slate-200">{showPaymentModal.student_name}</strong>
              <br />
              Pending Balance: <strong className="text-amber-600 dark:text-amber-400">₹{Math.max(0, (showPaymentModal.total_fees || 0) - (showPaymentModal.paid_fees || 0)).toLocaleString()}</strong>
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
                  className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30"
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
