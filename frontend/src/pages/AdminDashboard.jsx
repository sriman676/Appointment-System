import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ClipboardList, CheckCircle2, AlertCircle, Trash2,
  RefreshCw, Shield, UserX, TrendingUp, BarChart3, Settings, Plus, Edit2, ScrollText, Download, Clock
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonCard';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // User Filtering & Pagination
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  
  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Requests Tab State
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [reqFilterCategory, setReqFilterCategory] = useState('');
  const [reqFilterStatus, setReqFilterStatus] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchCategories();
    fetchAuditLogs();
    fetchRequests();

    const interval = setInterval(() => {
      fetchAnalytics();
      fetchAuditLogs();
    }, 60000); // Background refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userPage, userSearch]);

  useEffect(() => {
    fetchRequests();
  }, [requestsPage, reqFilterCategory, reqFilterStatus]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${userPage}&search=${userSearch}`);
      setUsers(res.data.users || []);
      setUserTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const query = `page=${requestsPage}&categoryId=${reqFilterCategory}&status=${reqFilterStatus}`;
      const res = await api.get(`/admin/requests?${query}`);
      setRequests(res.data.requests || []);
      setRequestsTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export/requests', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Requests_Export_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, catForm);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', catForm);
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deactivated');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Prepare graph data
  const statusData = analytics ? [
    { name: 'Pending', value: analytics.requests?.pending || 0 },
    { name: 'Accepted', value: analytics.requests?.accepted || 0 },
    { name: 'Completed', value: analytics.appointments?.completed || 0 },
    { name: 'Rejected', value: analytics.requests?.rejected || 0 },
  ].filter(d => d.value > 0) : [];

  const categoryData = analytics?.categoryPopularity?.map(c => ({
    name: c.name || 'Other',
    requests: c.count,
  })) || [];

  const tabs = [
    { key: 'overview', label: 'Overview', Icon: TrendingUp },
    { key: 'requests', label: 'Requests', Icon: ClipboardList },
    { key: 'users', label: 'Users', Icon: Users },
    { key: 'categories', label: 'Categories', Icon: Settings },
    { key: 'audit', label: 'Audit Logs', Icon: ScrollText },
  ];

  return (
    <div className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">System analytics & management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-2 text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <Download size={16} />
              Export CSV
            </button>
            <button onClick={() => { fetchAnalytics(); fetchUsers(); fetchCategories(); fetchAuditLogs(); }}
              className="flex items-center gap-2 text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.Icon size={16} />
              {t.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {loading ? [0,1,2,3].map(i => <SkeletonStat key={i} />) : (
                  <>
                    {[
                      { label: 'Total Requests', value: analytics?.requests?.total || 0, Icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'Students', value: analytics?.students?.total || 0, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Completed', value: analytics?.appointments?.completed || 0, Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Avg Rating', value: analytics?.avgFeedbackRating || '0.0', Icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map(s => (
                      <motion.div key={s.label} whileHover={{ y: -4 }} className="glass-panel p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                            <s.Icon size={20} className={s.color} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="glass-panel p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-600" /> Requests by Status
                  </h3>
                  {loading ? <SkeletonCard height="h-48" lines={1} /> : statusData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                          {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600" /> Activity by Category
                  </h3>
                  {loading ? <SkeletonCard height="h-48" lines={1} /> : categoryData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No category data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="requests" radius={[6,6,0,0]}>
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {tab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-blue-600" /> Requests Management</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Full system oversight</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select 
                      className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-blue-500/20 bg-white"
                      value={reqFilterCategory}
                      onChange={(e) => { setReqFilterCategory(e.target.value); setRequestsPage(1); }}
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <select 
                      className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-blue-500/20 bg-white"
                      value={reqFilterStatus}
                      onChange={(e) => { setReqFilterStatus(e.target.value); setRequestsPage(1); }}
                    >
                      <option value="">All Statuses</option>
                      {['Pending', 'Accepted', 'Rejected', 'Expired', 'Escalated'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {requestsLoading ? <div className="p-10 space-y-4">{[0,1,2].map(i => <SkeletonCard key={i} lines={2} />)}</div> : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="py-4 px-6">Student / Subject</th>
                            <th className="py-4 px-6">Category</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {requests.length === 0 ? (
                            <tr><td colSpan="4" className="py-10 text-center text-slate-400">No requests found matching filters</td></tr>
                          ) : requests.map(req => (
                            <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <p className="font-bold text-slate-800">{req.subject}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">{req.studentId?.name || 'Unknown'}</p>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-xs text-slate-600 font-medium">{req.categoryId?.name || 'N/A'}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                  req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                  req.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                  req.status === 'Escalated' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{req.status}</span>
                              </td>
                              <td className="py-4 px-6 text-xs text-slate-400">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <p className="text-xs text-slate-500 font-medium">Page {requestsPage} of {requestsTotalPages}</p>
                      <div className="flex gap-2">
                        <button disabled={requestsPage === 1} onClick={() => setRequestsPage(p => p - 1)} className="px-3 py-1 border rounded bg-white text-xs font-bold disabled:opacity-50">Prev</button>
                        <button disabled={requestsPage === requestsTotalPages} onClick={() => setRequestsPage(p => p + 1)} className="px-3 py-1 border rounded bg-white text-xs font-bold disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Shield size={18} className="text-indigo-600" /> User Directory</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{users.length} showing</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Search name/email..." 
                      className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-blue-500/20"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    />
                  </div>
                </div>
                {usersLoading ? <div className="p-5 space-y-3">{[0,1,2,3].map(i => <SkeletonCard key={i} lines={2} height="h-16" />)}</div> : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs font-semibold">
                          <tr>
                            <th className="py-3 px-5">Name</th>
                            <th className="py-3 px-5">Email</th>
                            <th className="py-3 px-5">Role</th>
                            <th className="py-3 px-5">Verified</th>
                            <th className="py-3 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map(u => (
                            <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-5 font-medium text-slate-800">{u.name}</td>
                              <td className="py-3 px-5 text-slate-500">{u.email}</td>
                              <td className="py-3 px-5">
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${u.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                              </td>
                              <td className="py-3 px-5">{u.emailVerified ? '✅' : '❌'}</td>
                              <td className="py-3 px-5 text-right">
                                {u._id !== user?._id && <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <p className="text-xs text-slate-500 font-medium">Page {userPage} of {userTotalPages}</p>
                      <div className="flex gap-2">
                        <button 
                          disabled={userPage === 1}
                          onClick={() => setUserPage(p => p - 1)}
                          className="px-3 py-1 border rounded bg-white text-xs font-bold disabled:opacity-50"
                        >Prev</button>
                        <button 
                          disabled={userPage === userTotalPages}
                          onClick={() => setUserPage(p => p + 1)}
                          className="px-3 py-1 border rounded bg-white text-xs font-bold disabled:opacity-50"
                        >Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Settings size={18} className="text-blue-600" /> Categories</h3>
                  <button onClick={() => { setEditingCategory(null); setCatForm({ name: '', description: '' }); setShowCategoryModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"><Plus size={16} /> Add New</button>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriesLoading ? [0,1].map(i => <SkeletonCard key={i} lines={2} />) : categories.map(cat => (
                    <div key={cat._id} className="p-4 border border-slate-100 rounded-2xl bg-white/50 hover:bg-white transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{cat.name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description }); setShowCategoryModal(true); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteCategory(cat._id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{cat.description || 'No description'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><ScrollText size={18} className="text-indigo-600" /> System Audit Logs</h3>
                </div>
                <div className="p-5 max-h-[600px] overflow-y-auto">
                  {auditLoading ? [0,1,2].map(i => <SkeletonCard key={i} lines={2} />) : auditLogs.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">No logs recorded yet</div>
                  ) : (
                    <div className="space-y-4">
                      {auditLogs.map((log, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white transition-all">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase mt-2 tracking-wider">BY: {log.adminId?.name || 'SYSTEM'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
              <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Delete {deleteTarget.name}?</h3>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border rounded-xl">Cancel</button>
                <button onClick={() => handleDeleteUser(deleteTarget._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl">Delete</button>
              </div>
            </motion.div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-6">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <input required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Category Name" className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 ring-blue-500" />
                <textarea rows={3} value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} placeholder="Description" className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 ring-blue-500 resize-none" />
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
