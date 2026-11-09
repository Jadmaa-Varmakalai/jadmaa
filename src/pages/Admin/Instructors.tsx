import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import {
  Search,
  Plus,
  X,
  Percent,
  UserMinus,
  DollarSign,
  Edit3
} from 'lucide-react';
import { ImageUpload } from '../../components/common/ImageUpload';

export const Instructors: React.FC = () => {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    displayName: '',
    title: '',
    specialization: '',
    experience: '',
    avatarUrl: ''
  });
  const [submitError, setSubmitError] = useState('');

  // Financials & Commission Management State
  const [financialsModalInstructor, setFinancialsModalInstructor] = useState<any | null>(null);
  const [financialsData, setFinancialsData] = useState<any | null>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  const [editingCommission, setEditingCommission] = useState<{ id: string; name: string; currentRate: number } | null>(null);
  const [commissionInput, setCommissionInput] = useState<string>('20');
  const [savingCommission, setSavingCommission] = useState(false);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInstructors({ page: pagination.page, limit: pagination.limit, search });
      setInstructors(res.data.items);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInstructors();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, pagination.page, pagination.limit]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this instructor?`)) return;
    try {
      await adminApi.updateInstructorStatus(id, !currentStatus);
      fetchInstructors();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Remove person as instructor (demote back to student)
  const handleRemoveInstructor = async (instructor: any) => {
    const confirmMsg = `Are you sure you want to remove "${instructor.displayName}" from the instructor role?\n\nThis will revoke their instructor dashboard access and revert their account back to a standard Student. Their courses will remain safe in the system.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminApi.removeInstructor(instructor.id);
      alert(res.message || 'Instructor role removed successfully.');
      fetchInstructors();
    } catch (err: any) {
      alert(err.message || 'Failed to remove instructor');
    }
  };

  // View Course Sales & Financials Modal
  const handleOpenFinancials = async (instructor: any) => {
    setFinancialsModalInstructor(instructor);
    setLoadingFinancials(true);
    setFinancialsData(null);
    try {
      const res = await adminApi.getInstructorFinancials(instructor.id);
      if (res.success) {
        setFinancialsData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load instructor financials:', err);
      alert(err.message || 'Failed to load course financial details.');
    } finally {
      setLoadingFinancials(false);
    }
  };

  // Commission Edit Modal Handlers
  const handleStartEditCommission = (instructor: any) => {
    setEditingCommission({
      id: instructor.id,
      name: instructor.displayName,
      currentRate: instructor.commissionRate ?? 20
    });
    setCommissionInput(String(instructor.commissionRate ?? 20));
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommission) return;

    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }

    try {
      setSavingCommission(true);
      await adminApi.updateInstructorCommission(editingCommission.id, rate);
      setEditingCommission(null);
      fetchInstructors();
    } catch (err: any) {
      alert(err.message || 'Failed to update commission rate.');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await adminApi.createInstructor(formData);
      setIsModalOpen(false);
      setFormData({
        name: '', email: '', phone: '', password: '', displayName: '', title: '', specialization: '', experience: '', avatarUrl: ''
      });
      fetchInstructors();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create instructor');
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'INSTRUCTORS' | 'APPLICATIONS'>('INSTRUCTORS');
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await adminApi.getInstructorApplications();
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch instructor applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApproveApp = async (userId: string) => {
    if (!window.confirm('Approve this candidate as an active Instructor? Their role will immediately upgrade to Instructor.')) return;
    setActionInProgress(userId);
    try {
      await adminApi.approveInstructorApplication(userId);
      await fetchApplications();
      await fetchInstructors();
    } catch (err: any) {
      alert(err.message || 'Failed to approve application');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectApp = async (userId: string) => {
    if (!window.confirm('Reject this instructor application? The user will remain as a student.')) return;
    setActionInProgress(userId);
    try {
      await adminApi.rejectInstructorApplication(userId);
      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setActionInProgress(null);
    }
  };

  const validApplications = applications.filter(a => a && a.userId && (a.name || a.email));
  const pendingApps = validApplications.filter(a => a.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-900">Manage Instructors</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure commission percentage deals, monitor course earnings &amp; payouts, and manage certified instructors.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          {activeSubTab === 'INSTRUCTORS' && (
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search instructors..." 
                className="pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:border-jadmaa-red w-full sm:w-64 bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-jadmaa-red text-white text-sm font-bold rounded-lg hover:bg-red-800 transition-colors shrink-0 w-full sm:w-auto cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Instructor
          </button>
        </div>
      </div>

      {/* Sub Tabs: Active Instructors vs Pending Applications */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('INSTRUCTORS')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'INSTRUCTORS'
              ? 'border-jadmaa-red text-jadmaa-red'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Active Instructors ({instructors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('APPLICATIONS')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'APPLICATIONS'
              ? 'border-jadmaa-red text-jadmaa-red'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Instructor Requests</span>
          {pendingApps.length > 0 && (
            <span className="bg-amber-500 text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-full">
              {pendingApps.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'APPLICATIONS' ? (
        <div className="space-y-4">
          {loadingApps ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl">Loading applications...</div>
          ) : validApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl">
              No instructor requests received yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validApplications.map((app) => {
                const isPending = app.status === 'PENDING';
                return (
                  <div
                    key={app.key || app.userId}
                    className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 ${
                      isPending ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-heading font-bold text-base text-gray-900">{app.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Applied on: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status || 'PENDING'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-semibold">Email:</span>
                        <a href={`mailto:${app.email}`} className="text-jadmaa-red hover:underline truncate block">{app.email}</a>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Phone:</span>
                        <a href={`tel:${app.phone}`} className="hover:underline">{app.phone || '-'}</a>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Title / Specialization:</span>
                        <span>{app.title || app.specialization || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Experience:</span>
                        <span>{app.experience || '-'}</span>
                      </div>
                    </div>

                    {app.bio && (
                      <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 italic">
                        "{app.bio}"
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      {isPending ? (
                        <>
                          <button
                            disabled={actionInProgress === app.userId}
                            onClick={() => handleRejectApp(app.userId)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            disabled={actionInProgress === app.userId}
                            onClick={() => handleApproveApp(app.userId)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            {actionInProgress === app.userId ? 'Approving...' : '✓ Approve as Instructor'}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Application {app.status?.toLowerCase()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-gray-700">Instructor Name</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700">Specialization / Title</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-center">JADMAA Commission %</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-right">Admin Commission Earned</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-right">Instructor Payout</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-center">Status</th>
                  <th className="px-5 py-3.5 font-bold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && instructors.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading instructors...</td></tr>
                ) : instructors.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No instructors found</td></tr>
                ) : (
                  instructors.map(instructor => {
                    const isProtected = instructor.user?.isAdmin || instructor.user?.role === 'SUPER_ADMIN' || instructor.isPlatformAdmin || instructor.displayName?.toLowerCase().includes('bojagarajan');
                    const commRate = instructor.commissionRate ?? 20;

                    return (
                      <tr key={instructor.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{instructor.displayName}</span>
                              {isProtected && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                                  Platform Admin
                                </span>
                              )}
                            </div>
                            {!isProtected && instructor.user?.email && (
                              <span className="text-xs text-gray-400 mt-0.5">{instructor.user.email}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs">
                          {instructor.title || instructor.specialization || 'Instructor'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isProtected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold" title="Platform Owner - Direct platform revenue">
                              <span>Platform Owner</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartEditCommission(instructor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Click to edit commission percentage deal"
                            >
                              <Percent className="w-3 h-3 text-amber-600" />
                              <span>{commRate}%</span>
                              <Edit3 className="w-3 h-3 text-gray-400 ml-0.5" />
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">
                          {isProtected ? (
                            <span className="text-gray-400 font-normal">—</span>
                          ) : (
                            `₹${(instructor.adminCommission ?? 0).toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold text-gray-800">
                          {isProtected ? (
                            <div>
                              <span>₹{(instructor.totalSales ?? instructor.instructorPayout ?? 0).toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-gray-400 block font-sans font-normal">Direct (100%)</span>
                            </div>
                          ) : (
                            `₹${(instructor.instructorPayout ?? 0).toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${instructor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {instructor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Courses & Sales Financials */}
                            <button
                              onClick={() => handleOpenFinancials(instructor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                              title="View courses, true price & payment breakdown"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Courses &amp; Sales</span>
                            </button>

                            {/* Status toggle */}
                            {!isProtected ? (
                              <button
                                onClick={() => toggleStatus(instructor.id, instructor.isActive)}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                  instructor.isActive 
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {instructor.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            ) : null}

                            {/* Remove as Instructor button */}
                            {!isProtected ? (
                              <button
                                onClick={() => handleRemoveInstructor(instructor)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                                title="Demote back to regular Student"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Owner</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {loading && instructors.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">Loading...</div>
            ) : instructors.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">No instructors found</div>
            ) : (
              instructors.map(instructor => {
                const isProtected = instructor.user?.isAdmin || instructor.user?.role === 'SUPER_ADMIN' || instructor.isPlatformAdmin || instructor.displayName?.toLowerCase().includes('bojagarajan');
                const commRate = instructor.commissionRate ?? 20;

                return (
                  <div key={instructor.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-gray-900 leading-tight">{instructor.displayName}</h3>
                          {isProtected && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{instructor.title || instructor.specialization || 'Instructor'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${instructor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {instructor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-semibold">Commission Deal:</span>
                        {isProtected ? (
                          <span className="font-bold text-gray-700 text-xs">Platform Owner</span>
                        ) : (
                          <button
                            onClick={() => handleStartEditCommission(instructor)}
                            className="font-bold text-amber-900 inline-flex items-center gap-1 underline text-xs"
                          >
                            {commRate}% Deal <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Admin Cut:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {isProtected ? '—' : `₹${(instructor.adminCommission ?? 0).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Instructor Payout:</span>
                        <span className="font-mono font-bold text-gray-800">
                          ₹{(isProtected ? (instructor.totalSales ?? instructor.instructorPayout ?? 0) : (instructor.instructorPayout ?? 0)).toLocaleString('en-IN')}
                          {isProtected && <span className="text-[10px] text-gray-400 font-sans font-normal ml-1">(Direct)</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Courses Created:</span>
                        <span className="font-semibold text-gray-700">{instructor.coursesCount ?? 0}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleOpenFinancials(instructor)}
                        className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sales Breakdown</span>
                      </button>

                      {!isProtected && (
                        <>
                          <button
                            onClick={() => toggleStatus(instructor.id, instructor.isActive)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold ${instructor.isActive ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}
                          >
                            {instructor.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleRemoveInstructor(instructor)}
                            className="py-1.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-gray-600 pt-2">
            <div>Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)</div>
            <div className="flex space-x-2">
              <button 
                disabled={pagination.page <= 1} 
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
              >Prev</button>
              <button 
                disabled={pagination.page >= pagination.totalPages} 
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
              >Next</button>
            </div>
          </div>
        </>
      )}

      {/* ── Modal 1: Edit Commission Deal ───────────────────────────── */}
      {editingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#FAF6F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">Edit Commission Deal</h3>
                  <p className="text-xs text-gray-500">{editingCommission.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingCommission(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommission} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  JADMAA Commission Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-lg font-bold text-gray-900 focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none"
                    placeholder="20"
                  />
                  <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Example: At <strong>{commissionInput || 0}%</strong>, if a course sells for ₹1,000, JADMAA takes <strong>₹{((parseFloat(commissionInput || '0') * 1000) / 100).toFixed(0)}</strong> and the instructor receives <strong>₹{(1000 - (parseFloat(commissionInput || '0') * 1000) / 100).toFixed(0)}</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCommission(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCommission}
                  className="px-5 py-2 bg-jadmaa-red hover:bg-red-800 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingCommission ? 'Saving...' : 'Save Commission Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: View Courses & Payment Breakdown ───────────────── */}
      {financialsModalInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            {(() => {
              const isModalAdmin = financialsModalInstructor.user?.isAdmin || financialsModalInstructor.user?.role === 'SUPER_ADMIN' || financialsModalInstructor.isPlatformAdmin || financialsModalInstructor.displayName?.toLowerCase().includes('bojagarajan') || financialsData?.summary?.isPlatformAdmin;

              return (
                <>
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#FAF6F0] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-gray-900">
                          Courses &amp; Payment Breakdown: {financialsModalInstructor.displayName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {isModalAdmin ? (
                            <span className="text-amber-800 font-semibold">Platform Owner / Founder — 100% Direct Platform Revenue</span>
                          ) : (
                            `Deal: ${financialsModalInstructor.commissionRate ?? 20}% JADMAA Platform Commission`
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFinancialsModalInstructor(null)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6">
                    {loadingFinancials ? (
                      <div className="py-16 text-center text-gray-500">
                        <div className="inline-block w-6 h-6 border-2 border-jadmaa-red border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs font-semibold">Calculating course payments &amp; commissions...</p>
                      </div>
                    ) : financialsData ? (
                      <>
                        {/* Financial KPI Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                              Total Course Sales
                            </span>
                            <p className="text-2xl font-black text-gray-900 mt-1">
                              ₹{(financialsData.summary?.totalGrossRevenue ?? 0).toLocaleString('en-IN')}
                            </p>
                            <span className="text-[11px] text-gray-500 mt-0.5 block">
                              {financialsData.summary?.totalPaidEnrollees ?? 0} paid enrollees across {financialsData.summary?.totalCourses ?? 0} courses
                            </span>
                          </div>

                          {isModalAdmin ? (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                Platform Commission Deducted
                              </span>
                              <p className="text-2xl font-black text-gray-600 mt-1 font-mono">
                                ₹0 (0%)
                              </p>
                              <span className="text-[11px] text-gray-500 mt-0.5 block">
                                Not applicable (Platform Owner)
                              </span>
                            </div>
                          ) : (
                            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                                Admin Commission ({financialsData.summary?.commissionRate}%)
                              </span>
                              <p className="text-2xl font-black text-amber-900 mt-1 font-mono">
                                ₹{(financialsData.summary?.totalAdminCommission ?? 0).toLocaleString('en-IN')}
                              </p>
                              <span className="text-[11px] text-amber-700 mt-0.5 block">
                                Retained by JADMAA
                              </span>
                            </div>
                          )}

                          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                              {isModalAdmin ? 'Net Platform Revenue' : 'Instructor Net Payout'}
                            </span>
                            <p className="text-2xl font-black text-emerald-800 mt-1 font-mono">
                              ₹{(financialsData.summary?.totalInstructorPayout ?? 0).toLocaleString('en-IN')}
                            </p>
                            <span className="text-[11px] text-emerald-700 mt-0.5 block">
                              {isModalAdmin ? '100% direct platform revenue' : 'Amount to be delivered to instructor'}
                            </span>
                          </div>
                        </div>

                        {/* Course Details Table */}
                        <div>
                          <h4 className="font-heading font-bold text-sm text-gray-800 mb-2">
                            Courses Created by {financialsModalInstructor.displayName}
                          </h4>

                          {financialsData.courses?.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border text-xs text-gray-500">
                              This instructor has not published any courses with payments yet.
                            </div>
                          ) : (
                            <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-2xs">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Course Title</th>
                                    <th className="px-4 py-3 text-right">True Price</th>
                                    <th className="px-4 py-3 text-center">Paid Students</th>
                                    <th className="px-4 py-3 text-right">Total Revenue</th>
                                    <th className="px-4 py-3 text-right">
                                      {isModalAdmin ? 'Platform Commission' : `Admin Commission (${financialsData.summary?.commissionRate}%)`}
                                    </th>
                                    <th className="px-4 py-3 text-right font-bold text-emerald-700">
                                      {isModalAdmin ? 'Net Revenue' : 'Instructor Final Payout'}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {financialsData.courses.map((course: any) => (
                                    <tr key={course.id} className="hover:bg-gray-50/60">
                                      <td className="px-4 py-3 font-semibold text-gray-900 max-w-xs truncate">
                                        {course.title}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                                        ₹{course.truePrice?.toLocaleString('en-IN') ?? 0}
                                      </td>
                                      <td className="px-4 py-3 text-center text-gray-600">
                                        {course.paidStudentsCount}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                                        ₹{course.totalSales.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-amber-800">
                                        {isModalAdmin ? '—' : `₹${course.adminCommission.toLocaleString('en-IN')}`}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700">
                                        ₹{(isModalAdmin ? course.totalSales : course.instructorPayout).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              );
            })()}

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button
                onClick={() => setFinancialsModalInstructor(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Add New Instructor ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-lg font-heading">Add New Instructor</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateInstructor} className="p-6 space-y-4">
              {submitError && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                  {submitError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Full Name *</label>
                  <input required type="text" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Display Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Email *</label>
                  <input required type="email" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Phone</label>
                  <input type="text" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <input type="password" placeholder="Defaults to Jadmaa@123" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Title</label>
                  <input type="text" placeholder="e.g. Master Instructor" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Specialization</label>
                  <input type="text" placeholder="e.g. Varma Therapy" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Experience</label>
                <input type="text" placeholder="e.g. 15+ years in Varma Kalai" className="w-full px-3 py-2 border rounded focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none text-xs" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Profile Photo</label>
                <ImageUpload 
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData({...formData, avatarUrl: url})}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-jadmaa-red text-white text-sm font-bold rounded hover:bg-red-800 cursor-pointer">Create Instructor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
