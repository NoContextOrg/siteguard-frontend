import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  X
} from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, getPersonsByTeam, type PersonResponse } from './api/person';
import { assignWorkersToTeam, createTeam, getAllTeams, type Team, type TeamResponse } from './api/team';
import { createPersonUi, deletePersonById, updatePersonUi } from './api/person';

// ========== Types & Sub-Components ========== //

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[30px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24}/></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

const AccountCard = ({ title, count, onAdd }: { title: string, count: string, onAdd: () => void }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border-l-[6px] border-l-blue-400 flex flex-col justify-between h-44 relative group hover:shadow-md transition">
    <div className="flex justify-between items-start">
      <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex items-center gap-3">
        <Users size={32} className="text-blue-200" />
        <span className="text-4xl font-black text-blue-200">{count}</span>
    </div>
    <button onClick={onAdd} className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
      Add Account <span className="text-lg">→</span>
    </button>
  </div>
);

const TeamCard = ({ title, engineer, count, borderColor, onAddWorker }: { title: string, engineer: string, count: string, borderColor: string, onAddWorker: () => void }) => (
  <div className={`bg-white p-8 rounded-xl shadow-sm border-l-[6px] ${borderColor} flex flex-col justify-between h-52 relative hover:shadow-md transition`}>
    <div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{title}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Engr. {engineer}</p>
    </div>
    <div className="flex items-center gap-3">
        <Users size={32} className="text-slate-200" />
        <span className="text-4xl font-black text-slate-300">{count}</span>
    </div>
    <button onClick={onAddWorker} className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
      Add Worker <span className="text-lg">→</span>
    </button>
  </div>
);

// ========== Main Page Component ========== //

const AdminTeam = () => {
  const [modalType, setModalType] = useState<'account' | 'team' | 'worker' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<number, number>>({});

  // Modal form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLocation, setNewTeamLocation] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamSiteEngineerId, setNewTeamSiteEngineerId] = useState<number | null>(null);

  const [selectedTeamIdForWorkerAdd, setSelectedTeamIdForWorkerAdd] = useState<number | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  // Create account form state
  const [newAccountRole, setNewAccountRole] = useState<'WORKER' | 'ENGINEER' | 'NURSE' | 'ADMIN'>('WORKER');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [newAccountDepartment, setNewAccountDepartment] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  // Edit/delete state
  const [editingPerson, setEditingPerson] = useState<PersonResponse | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<PersonResponse | null>(null);

  // Search and filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'WORKER' | 'ENGINEER' | 'NURSE' | 'ADMIN'>('ALL');

  const closeModal = () => {
    setModalType(null);
    setSelectedTeamIdForWorkerAdd(null);
    setSelectedWorkerId(null);
    setEditingPerson(null);
    setDeletingPerson(null);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamsData, personsData] = await Promise.all([getAllTeams(), getAllPersons()]);
      setTeams(teamsData);
      setPersons(personsData);

      const pairs = await Promise.all(
        teamsData.map(async (t) => {
          try {
            const members = await getPersonsByTeam(t.id);
            return [t.id, Array.isArray(members) ? members.length : 0] as const;
          } catch {
            return [t.id, 0] as const;
          }
        })
      );
      setTeamCounts(Object.fromEntries(pairs));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const isWorker = (p: PersonResponse) => String((p as any).role ?? '').toUpperCase() === 'WORKER';
  const isEngineer = (p: PersonResponse) => String((p as any).role ?? '').toUpperCase() === 'ENGINEER';
  const isNurse = (p: PersonResponse) => String((p as any).role ?? '').toUpperCase() === 'NURSE';

  const workerCount = useMemo(() => persons.filter(isWorker).length, [persons]);
  const engineerCount = useMemo(() => persons.filter(isEngineer).length, [persons]);
  const nurseCount = useMemo(() => persons.filter(isNurse).length, [persons]);

  const workers = useMemo(() => persons.filter(isWorker), [persons]);
  const engineers = useMemo(() => persons.filter(isEngineer), [persons]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!newTeamSiteEngineerId) {
        setError('Please select a site engineer');
        return;
      }

      const payload: Team = {
        name: newTeamName.trim(),
        classification: 'GENERAL',
        projectArea: newTeamLocation.trim() || 'N/A',
        siteEngineerId: newTeamSiteEngineerId,
        description: newTeamDescription.trim() || 'N/A',
        location: newTeamLocation.trim() || 'N/A',
      };

      if (!payload.name) {
        setError('Team name is required');
        return;
      }

      await createTeam(payload);
      closeModal();
      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamLocation('');
      setNewTeamSiteEngineerId(null);
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to create team');
    }
  };

  const handleAddWorkerToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamIdForWorkerAdd || !selectedWorkerId) {
      setError('Please select a team and worker');
      return;
    }

    try {
      setError(null);
      await assignWorkersToTeam(selectedTeamIdForWorkerAdd, [selectedWorkerId]);
      closeModal();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to add worker to team');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setAccountSubmitting(true);

      const payload = {
        name: newAccountName.trim(),
        email: newAccountEmail.trim(),
        phone: newAccountPhone.trim(),
        position: newAccountRole === 'WORKER' ? 'Worker' : newAccountRole === 'ENGINEER' ? 'Site Engineer' : newAccountRole === 'NURSE' ? 'Nurse' : 'Admin',
        department: newAccountDepartment.trim(),
        role: newAccountRole,
      };

      if (!payload.name || !payload.email) {
        setError('Name and email are required');
        return;
      }

      await createPersonUi(payload);

      setNewAccountName('');
      setNewAccountEmail('');
      setNewAccountPhone('');
      setNewAccountDepartment('');
      closeModal();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to create account');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const startEditPerson = (p: PersonResponse) => {
    const anyP = p as any;
    setEditingPerson(p);
    setNewAccountRole(((anyP.role as any) || 'WORKER') as any);
    setNewAccountName(anyP.name ?? '');
    setNewAccountEmail(anyP.email ?? '');
    setNewAccountPhone(anyP.phoneNumber ?? anyP.phone ?? '');
    setNewAccountDepartment(anyP.department ?? '');
    setModalType('account');
  };

  const handleSavePersonEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;

    try {
      setError(null);
      setAccountSubmitting(true);

      await updatePersonUi(editingPerson.id, {
        name: newAccountName.trim(),
        email: newAccountEmail.trim(),
        phone: newAccountPhone.trim(),
        position: newAccountRole === 'WORKER' ? 'Worker' : newAccountRole === 'ENGINEER' ? 'Site Engineer' : newAccountRole === 'NURSE' ? 'Nurse' : 'Admin',
        department: newAccountDepartment.trim(),
        role: newAccountRole as any,
      });

      setEditingPerson(null);
      setNewAccountName('');
      setNewAccountEmail('');
      setNewAccountPhone('');
      setNewAccountDepartment('');
      closeModal();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to update account');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleConfirmDeletePerson = async () => {
    if (!deletingPerson) return;
    try {
      setError(null);
      await deletePersonById(deletingPerson.id);
      setDeletingPerson(null);
      closeModal();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to delete account');
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return persons
      .filter((p) => {
        const anyP = p as any;
        const role = String(anyP.role || '').toUpperCase();
        if (userRoleFilter === 'ALL') return true;
        return role === userRoleFilter;
      })
      .filter((p) => {
        if (!q) return true;
        const anyP = p as any;
        const name = String(anyP.name || '').toLowerCase();
        const email = String(anyP.email || '').toLowerCase();
        const role = String(anyP.role || '').toLowerCase();
        const dept = String(anyP.department || '').toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
      });
  }, [persons, userSearch, userRoleFilter]);

  return (
    <DashboardLayout title="Team">
      <div className="max-w-7xl mx-auto px-6">
        {error && (
          <div className="mt-6 mb-2 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800" type="button">
              <X size={18} />
            </button>
          </div>
        )}

        {/* ACCOUNTS SECTION */}
        <section className="mt-8">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">ACCOUNTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AccountCard title="Workers" count={loading ? '—' : workerCount.toLocaleString()} onAdd={() => {
              setEditingPerson(null);
              setNewAccountRole('WORKER');
              setModalType('account');
            }} />
            <AccountCard title="Site Engineers" count={loading ? '—' : engineerCount.toLocaleString()} onAdd={() => {
              setEditingPerson(null);
              setNewAccountRole('ENGINEER');
              setModalType('account');
            }} />
            <AccountCard title="Nurses" count={loading ? '—' : nurseCount.toLocaleString()} onAdd={() => {
              setEditingPerson(null);
              setNewAccountRole('NURSE');
              setModalType('account');
            }} />
          </div>
        </section>

        {/* TEAMS SECTION */}
        <section className="mt-12">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">TEAMS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Add New Team Trigger */}
            <div
              className="bg-white p-8 rounded-xl shadow-sm border-l-[6px] border-l-orange-900 flex flex-col justify-center items-center h-52 relative group cursor-pointer"
              onClick={() => setModalType('team')}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-md font-black text-slate-800 uppercase tracking-tighter">ADD NEW TEAM</span>
                  <UserPlus size={28} className="text-slate-800" />
                </div>
              </div>
              <button className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter" type="button">
                Create Team <span className="text-lg">→</span>
              </button>
            </div>

            {loading ? (
              <div className="col-span-full text-center py-10 text-slate-400 font-bold">Loading teams…</div>
            ) : (
              teams.map((t) => (
                <TeamCard
                  key={t.id}
                  title={t.name}
                  engineer={'N/A'}
                  count={(teamCounts[t.id] ?? t.members ?? 0).toLocaleString()}
                  borderColor="border-l-slate-300"
                  onAddWorker={() => {
                    setSelectedTeamIdForWorkerAdd(t.id);
                    setModalType('worker');
                  }}
                />
              ))
            )}
          </div>
        </section>

        {/* All users table with CRUD */}
        {!loading && (
          <section className="mt-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">GENERAL MANAGEMENT</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name/email/role/department…"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"
                >
                  <option value="ALL">All Roles</option>
                  <option value="WORKER">Workers</option>
                  <option value="ENGINEER">Engineers</option>
                  <option value="NURSE">Nurses</option>
                  <option value="ADMIN">Admins</option>
                </select>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#1a2e5a] text-white text-sm font-black uppercase tracking-widest hover:bg-[#132142]"
                  onClick={() => {
                    setEditingPerson(null);
                    setNewAccountRole('WORKER');
                    setNewAccountName('');
                    setNewAccountEmail('');
                    setNewAccountPhone('');
                    setNewAccountDepartment('');
                    setModalType('account');
                  }}
                >
                  Add User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Name</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Email</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Role</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Phone</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]">Department</th>
                      <th className="p-3 font-black uppercase tracking-widest text-[10px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={6}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((p) => {
                        const anyP = p as any;
                        const role = String(anyP.role || '').toUpperCase() || '—';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{anyP.name ?? '—'}</td>
                            <td className="p-3 text-slate-700 whitespace-nowrap">{anyP.email ?? '—'}</td>
                            <td className="p-3 text-slate-700 whitespace-nowrap">{role}</td>
                            <td className="p-3 text-slate-700 whitespace-nowrap">{anyP.phoneNumber ?? anyP.phone ?? '—'}</td>
                            <td className="p-3 text-slate-700 whitespace-nowrap">{anyP.department ?? '—'}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200"
                                  onClick={() => startEditPerson(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => {
                                    setDeletingPerson(p);
                                    setModalType('account');
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Note: Delete requires ADMIN role (backend enforces).
            </div>
          </section>
        )}
      </div>

      {/* ========== MODAL FORMS ========== */}

      {/* 1. Add Account Form */}
      <Modal isOpen={modalType === 'account'} onClose={closeModal} title={deletingPerson ? 'Delete Account' : editingPerson ? 'Edit Account' : 'Create New Account'}>
        {deletingPerson ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              Delete <span className="font-bold">{deletingPerson.name}</span>? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                className="flex-1 border border-slate-200 rounded-2xl py-3 font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePerson}
                className="flex-1 bg-red-600 text-white rounded-2xl py-3 font-black uppercase tracking-widest hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={editingPerson ? handleSavePersonEdit : handleCreateAccount}>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Account Type</label>
              <select
                value={newAccountRole}
                onChange={(e) => setNewAccountRole(e.target.value as any)}
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                disabled={accountSubmitting}
              >
                <option value="WORKER">Worker</option>
                <option value="ENGINEER">Site Engineer</option>
                <option value="NURSE">Nurse</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Full Name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                required
                disabled={accountSubmitting}
              />
            </div>

            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Email</label>
              <input
                type="email"
                value={newAccountEmail}
                onChange={(e) => setNewAccountEmail(e.target.value)}
                placeholder="e.g. juan@example.com"
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                required
                disabled={accountSubmitting}
              />
            </div>

            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Phone (optional)</label>
              <input
                type="text"
                value={newAccountPhone}
                onChange={(e) => setNewAccountPhone(e.target.value)}
                placeholder="e.g. 09xxxxxxxxx"
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                disabled={accountSubmitting}
              />
            </div>

            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Department (optional)</label>
              <input
                type="text"
                value={newAccountDepartment}
                onChange={(e) => setNewAccountDepartment(e.target.value)}
                placeholder="e.g. Structural"
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                disabled={accountSubmitting}
              />
            </div>

            <button
              className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition disabled:opacity-50"
              type="submit"
              disabled={accountSubmitting}
            >
              {accountSubmitting ? 'Saving…' : editingPerson ? 'Save Changes' : 'Create Account'}
            </button>
          </form>
        )}
      </Modal>

      {/* 2. Create Team Form */}
      <Modal isOpen={modalType === 'team'} onClose={closeModal} title="Register New Team">
        <form className="space-y-4" onSubmit={handleCreateTeam}>
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Team Name</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Carpentry"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
              required
            />
          </div>

          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Site Engineer</label>
            <select
              required
              value={newTeamSiteEngineerId ?? ''}
              onChange={(e) => setNewTeamSiteEngineerId(Number(e.target.value))}
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
            >
              <option value="">-- Choose a site engineer --</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} ({eng.email})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Description</label>
            <input
              type="text"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              placeholder="e.g. Concrete works"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
            />
          </div>
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Project Area / Location</label>
            <input
              type="text"
              value={newTeamLocation}
              onChange={(e) => setNewTeamLocation(e.target.value)}
              placeholder="e.g. Site A"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
            />
          </div>
          <button className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition" type="submit">
            Register Team
          </button>
        </form>
      </Modal>

      {/* 3. Add Worker to Team Form */}
      <Modal isOpen={modalType === 'worker'} onClose={closeModal} title="Add Worker to Team">
        <form className="space-y-4" onSubmit={handleAddWorkerToTeam}>
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Select Worker</label>
            <select
              required
              value={selectedWorkerId ?? ''}
              onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
            >
              <option value="">-- Choose a worker --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.email})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Worker must already exist as a Person record.</p>
          <button className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition" type="submit">
            Add to Team
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminTeam;