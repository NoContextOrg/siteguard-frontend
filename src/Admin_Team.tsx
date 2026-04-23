import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, getPersonsByTeam, type PersonResponse } from './api/person';
import { assignWorkersToTeam, createTeam, deleteTeam, getAllTeams, updateTeam, type Team, type TeamResponse } from './api/team';
import { createPersonUi, deletePersonById, updatePersonUi } from './api/person';
import { setPersonPassword } from './api/person';

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
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24} /></button>
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

const TeamCard = ({ title, engineer, count, borderColor, accentGradient, onAddWorker, onOpen, onEditTeam, onDeleteTeam }: { title: string, engineer: string, count: string, borderColor: string, accentGradient: string, onAddWorker: () => void, onOpen: () => void, onEditTeam: () => void, onDeleteTeam: () => void }) => (
  <div
    className={`bg-white p-8 rounded-xl shadow-sm border-l-[6px] ${borderColor} flex flex-col justify-between h-52 relative cursor-pointer
      transition-all duration-200 ease-out
      hover:-translate-y-1 hover:shadow-xl hover:border-slate-100
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
      group overflow-hidden`}
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onOpen();
    }}
  >
    {/* soft glow */}
    <div className={`pointer-events-none absolute -inset-24 opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-70 bg-gradient-to-r ${accentGradient} to-transparent`} />

    {/* top-right actions */}
    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditTeam();
        }}
        className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-200 hover:bg-slate-50 shadow-sm"
        aria-label="Edit team"
        title="Edit team"
      >
        <Pencil size={16} className="text-slate-700" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteTeam();
        }}
        className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-200 hover:bg-red-50 shadow-sm"
        aria-label="Delete team"
        title="Delete team"
      >
        <Trash2 size={16} className="text-red-700" />
      </button>
    </div>

    <div className="relative">
      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter transition-colors duration-200 group-hover:text-slate-900">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 transition-colors duration-200 group-hover:text-slate-500">Engr. {engineer}</p>
    </div>
    <div className="relative flex items-center gap-3">
      <Users size={32} className="text-slate-200 transition-colors duration-200 group-hover:text-slate-300" />
      <span className="text-4xl font-black text-slate-300 transition-colors duration-200 group-hover:text-slate-400">{count}</span>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAddWorker();
      }}
      className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter"
      type="button"
    >
      Add Worker <span className="text-lg">→</span>
    </button>
  </div>
);

// Skeleton cell for table loading state
const SkeletonCell = () => (
  <td className="p-3">
    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
  </td>
);

// ========== Main Page Component ========== //

const AdminTeam = () => {
  const [modalType, setModalType] = useState<'account' | 'team' | 'worker' | 'teamEdit' | 'teamDelete' | null>(null);
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
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  const [selectedTeamIdForWorkerAdd, setSelectedTeamIdForWorkerAdd] = useState<number | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  // Create account form state
  const [newAccountRole, setNewAccountRole] = useState<'WORKER' | 'ENGINEER' | 'NURSE' | 'ADMIN'>('WORKER');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [newAccountDepartment, setNewAccountDepartment] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  // Add Account password state
  const [addAccountPassword, setAddAccountPassword] = useState('');

  // Edit/delete state
  const [editingPerson, setEditingPerson] = useState<PersonResponse | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<PersonResponse | null>(null);
  const [teamEditing, setTeamEditing] = useState<TeamResponse | null>(null);
  const [teamDeleting, setTeamDeleting] = useState<TeamResponse | null>(null);

  // Search and filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'WORKER' | 'ENGINEER' | 'NURSE' | 'ADMIN'>('ALL');

  // Team detail modal state
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<PersonResponse[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);

  // Password modal state
  const [passwordModalPersonId, setPasswordModalPersonId] = useState<number | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  // Add Worker password state
  const [addWorkerPassword, setAddWorkerPassword] = useState('');

  const closeModal = () => {
    if (teamSubmitting || accountSubmitting) return;
    setModalType(null);
    setSelectedTeamIdForWorkerAdd(null);
    setSelectedWorkerId(null);
    setEditingPerson(null);
    setDeletingPerson(null);
    setTeamEditing(null);
    setTeamDeleting(null);
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
      setTeamSubmitting(true);

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

      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamLocation('');
      setNewTeamSiteEngineerId(null);

      await load();
      setModalType(null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to create team');
    } finally {
      setTeamSubmitting(false);
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
      if (addWorkerPassword && addWorkerPassword.length >= 6) {
        await setPersonPassword(selectedWorkerId, addWorkerPassword);
      }
      setAddWorkerPassword('');
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

      if (!addAccountPassword || addAccountPassword.length < 6) {
        setError('Password is required and must be at least 6 characters.');
        setAccountSubmitting(false);
        return;
      }

      const payload = {
        name: newAccountName.trim(),
        email: newAccountEmail.trim(),
        phone: newAccountPhone.trim(),
        position: newAccountRole === 'WORKER' ? 'Worker' : newAccountRole === 'ENGINEER' ? 'Site Engineer' : newAccountRole === 'NURSE' ? 'Nurse' : 'Admin',
        department: newAccountDepartment.trim(),
        role: newAccountRole,
        password: addAccountPassword,
      };

      if (!payload.name || !payload.email) {
        setError('Name and email are required');
        setAccountSubmitting(false);
        return;
      }

      await createPersonUi(payload);

      setNewAccountName('');
      setNewAccountEmail('');
      setNewAccountPhone('');
      setNewAccountDepartment('');
      setAddAccountPassword('');
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

  const loadTeamMembers = async (teamId: number) => {
    try {
      setTeamMembersLoading(true);
      setError(null);

      const members = await getPersonsByTeam(teamId);
      setTeamMembers(Array.isArray(members) ? members : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team members');
      setTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  };

  const openTeamDetail = async (t: TeamResponse) => {
    setSelectedTeam(t);
    await loadTeamMembers(t.id);
  };

  const closeTeamDetail = () => {
    setSelectedTeam(null);
    setTeamMembers([]);
  };

  const startEditTeam = (t: TeamResponse) => {
    setError(null);
    setTeamEditing(t);
    setNewTeamName(String(t.name ?? ''));
    setNewTeamDescription(String(t.description ?? ''));
    setNewTeamLocation(String((t as any).projectArea ?? t.location ?? ''));
    setNewTeamSiteEngineerId((t as any).siteEngineerId != null ? Number((t as any).siteEngineerId) : null);
    setModalType('teamEdit');
  };

  const startDeleteTeam = (t: TeamResponse) => {
    setError(null);
    setTeamDeleting(t);
    setModalType('teamDelete');
  };

  const handleSaveTeamEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamEditing) return;

    try {
      setError(null);
      setTeamSubmitting(true);

      if (!newTeamName.trim()) {
        setError('Team name is required');
        return;
      }
      if (!newTeamSiteEngineerId) {
        setError('Please select a site engineer');
        return;
      }

      await updateTeam(teamEditing.id, {
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || 'N/A',
        location: newTeamLocation.trim() || 'N/A',
        projectArea: newTeamLocation.trim() || 'N/A',
        siteEngineerId: newTeamSiteEngineerId,
      });

      setTeamEditing(null);
      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamLocation('');
      setNewTeamSiteEngineerId(null);

      await load();
      setModalType(null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to update team');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamDeleting) return;
    try {
      setError(null);
      setTeamSubmitting(true);
      await deleteTeam(teamDeleting.id);
      setTeamDeleting(null);
      await load();
      setModalType(null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to delete team');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const engineerNameById = useMemo(() => {
    const map = new Map<number, string>();
    persons.forEach((p) => {
      const anyP = p as any;
      if (p.id != null) map.set(p.id, String(anyP.name ?? '').trim() || String(anyP.email ?? '') || `ID-${p.id}`);
    });
    return map;
  }, [persons]);

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

  const teamBorderColor = (_t: TeamResponse, index: number) => {
    const palette = [
      'border-l-blue-600',
      'border-l-fuchsia-600',
      'border-l-emerald-600',
      'border-l-amber-600',
      'border-l-cyan-600',
      'border-l-violet-600',
      'border-l-rose-600',
      'border-l-indigo-600',
      'border-l-sky-600',
      'border-l-lime-600',
    ];
    return palette[index % palette.length];
  };

  const teamAccentBg = (index: number) => {
    const palette = [
      'from-blue-100 via-blue-50',
      'from-fuchsia-100 via-fuchsia-50',
      'from-emerald-100 via-emerald-50',
      'from-amber-100 via-amber-50',
      'from-cyan-100 via-cyan-50',
      'from-violet-100 via-violet-50',
      'from-rose-100 via-rose-50',
      'from-indigo-100 via-indigo-50',
      'from-sky-100 via-sky-50',
      'from-lime-100 via-lime-50',
    ];
    return palette[index % palette.length];
  };

  const handleSetPassword = async () => {
    if (!passwordModalPersonId) return;
    if (!passwordValue || passwordValue.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await setPersonPassword(passwordModalPersonId, passwordValue);
      setPasswordSuccess('Password updated successfully.');
      setTimeout(() => closePasswordModal(), 1200);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Failed to set password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openPasswordModal = (personId: number) => {
    setPasswordModalPersonId(personId);
    setPasswordValue('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };
  const closePasswordModal = () => {
    setPasswordModalPersonId(null);
    setPasswordValue('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  // Skeleton rows shown while loading
  const skeletonRows = [...Array(5)].map((_, i) => (
    <tr key={`skel-${i}`} className="border-b border-slate-100">
      <SkeletonCell />
      <SkeletonCell />
      <SkeletonCell />
      <SkeletonCell />
      <SkeletonCell />
      <td className="p-3">
        <div className="flex items-center justify-end gap-2">
          <div className="h-6 w-10 bg-slate-100 rounded animate-pulse" />
          <div className="h-6 w-14 bg-slate-100 rounded animate-pulse" />
          <div className="h-6 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
      </td>
    </tr>
  ));

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
              teams.map((t, idx) => (
                <TeamCard
                  key={t.id}
                  title={t.name}
                  engineer={
                    (t as any).siteEngineerId
                      ? (engineerNameById.get(Number((t as any).siteEngineerId)) ?? 'N/A')
                      : (t as any).siteEngineerName ?? 'N/A'
                  }
                  count={(teamCounts[t.id] ?? (t as any).members ?? 0).toLocaleString()}
                  borderColor={teamBorderColor(t, idx)}
                  accentGradient={teamAccentBg(idx)}
                  onAddWorker={() => {
                    setSelectedTeamIdForWorkerAdd(t.id);
                    setModalType('worker');
                  }}
                  onOpen={() => void openTeamDetail(t)}
                  onEditTeam={() => startEditTeam(t)}
                  onDeleteTeam={() => startDeleteTeam(t)}
                />
              ))
            )}
          </div>
          {!loading && teams.length === 0 && (
            <div className="mt-4 text-center text-slate-500 text-sm font-bold">No teams found.</div>
          )}
        </section>

        {/* GENERAL MANAGEMENT — always visible; rows show skeletons while loading */}
        <section className="mt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">GENERAL MANAGEMENT</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name/email/role/department…"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"
                disabled={loading}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700"
                disabled={loading}
              >
                <option value="ALL">All Roles</option>
                <option value="WORKER">Workers</option>
                <option value="ENGINEER">Engineers</option>
                <option value="NURSE">Nurses</option>
                <option value="ADMIN">Admins</option>
              </select>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#1a2e5a] text-white text-sm font-black uppercase tracking-widest hover:bg-[#132142] disabled:opacity-50"
                disabled={loading}
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
                  {loading
                    ? skeletonRows
                    : filteredUsers.length === 0
                      ? (
                        <tr key="empty">
                          <td className="p-6 text-slate-500" colSpan={6}>No users found.</td>
                        </tr>
                      )
                      : filteredUsers.map((p) => {
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
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100"
                                  onClick={() => openPasswordModal(p.id)}
                                >
                                  Change Password
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Note: Delete requires ADMIN role (backend enforces).
          </div>
        </section>
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

            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Set Password</label>
              <input
                type="password"
                value={addAccountPassword}
                onChange={e => setAddAccountPassword(e.target.value)}
                placeholder="Set password for this user"
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={accountSubmitting}
              />
              <div className="text-xs text-slate-400 mt-1">Minimum 6 characters.</div>
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
              disabled={teamSubmitting}
            />
          </div>

          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Site Engineer</label>
            <select
              required
              value={newTeamSiteEngineerId ?? ''}
              onChange={(e) => setNewTeamSiteEngineerId(Number(e.target.value))}
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
              disabled={teamSubmitting}
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
              disabled={teamSubmitting}
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
              disabled={teamSubmitting}
            />
          </div>
          <button
            className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition disabled:opacity-50"
            type="submit"
            disabled={teamSubmitting}
          >
            {teamSubmitting ? 'Registering…' : 'Register Team'}
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
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Assign Date</label>
            <input
              type="date"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
            />
          </div>
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Set Password (optional)</label>
            <input
              type="password"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
              value={addWorkerPassword}
              onChange={e => setAddWorkerPassword(e.target.value)}
              placeholder="Set password for this worker"
              autoComplete="new-password"
            />
            <div className="text-xs text-slate-400 mt-1">Leave blank to skip</div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition mt-4"
          >
            Confirm Addition
          </button>
        </form>
      </Modal>

      {/* Password Modal for member */}
      {passwordModalPersonId !== null && (
        <Modal isOpen={true} onClose={closePasswordModal} title="Set/Reset Worker Password">
          <form onSubmit={e => { e.preventDefault(); handleSetPassword(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={passwordValue}
                onChange={e => setPasswordValue(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={passwordLoading}
              />
              <div className="text-xs text-slate-400 mt-1">Minimum 6 characters</div>
              {passwordError && <div className="text-xs text-red-600 mt-1">{passwordError}</div>}
              {passwordSuccess && <div className="text-xs text-green-600 mt-1">{passwordSuccess}</div>}
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closePasswordModal}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                disabled={passwordLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Saving…' : 'Save Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Team detail modal */}
      <Modal
        isOpen={Boolean(selectedTeam)}
        onClose={closeTeamDetail}
        title={selectedTeam ? `Team: ${selectedTeam.name}` : 'Team'}
      >
        {!selectedTeam ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team ID</div>
                <div className="mt-1 font-black text-slate-800">{selectedTeam.id}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Members</div>
                <div className="mt-1 font-black text-slate-800">{teamMembersLoading ? '…' : teamMembers.length}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engineer</div>
                <div className="mt-1 font-black text-slate-800">
                  {(selectedTeam as any).siteEngineerId
                    ? (engineerNameById.get(Number((selectedTeam as any).siteEngineerId)) ?? 'N/A')
                    : (selectedTeam as any).siteEngineerName ?? 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team members (from backend)</div>
                <div className="text-xs text-slate-500 mt-1">
                  Loaded via <span className="font-mono">GET /api/teams/{'{id}'}/members</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void loadTeamMembers(selectedTeam.id)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest"
                disabled={teamMembersLoading}
              >
                {teamMembersLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="max-h-[360px] overflow-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembersLoading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 font-bold">Loading members…</td>
                    </tr>
                  ) : teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 font-bold">No members found.</td>
                    </tr>
                  ) : (
                    teamMembers.map((m) => {
                      const anyM = m as any;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{anyM.name ?? '—'}</td>
                          <td className="p-3 text-slate-700">{String(anyM.role ?? '—').toUpperCase()}</td>
                          <td className="p-3 text-slate-700">{anyM.email ?? '—'}</td>
                          <td className="p-3">
                            <button
                              onClick={() => openPasswordModal(m.id)}
                              className="p-2 text-orange-600 hover:text-orange-700 transition-colors"
                              title="Change Password"
                            >
                              Change Password
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={modalType === 'teamEdit'} onClose={closeModal} title="Edit Team Details">
        <form className="space-y-4" onSubmit={handleSaveTeamEdit}>
          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Team Name</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Carpentry"
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
              required
              disabled={teamSubmitting}
            />
          </div>

          <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Site Engineer</label>
            <select
              required
              value={newTeamSiteEngineerId ?? ''}
              onChange={(e) => setNewTeamSiteEngineerId(Number(e.target.value))}
              className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
              disabled={teamSubmitting}
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
              disabled={teamSubmitting}
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
              disabled={teamSubmitting}
            />
          </div>
          <button
            className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition disabled:opacity-50"
            type="submit"
            disabled={teamSubmitting}
          >
            {teamSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Delete Team Confirmation Modal */}
      <Modal isOpen={modalType === 'teamDelete'} onClose={closeModal} title="Confirm Delete Team">
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Delete team <span className="font-bold">{teamDeleting?.name}</span>? This action cannot be undone.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTeamDeleting(null)}
              className="flex-1 border border-slate-200 rounded-2xl py-3 font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteTeam}
              className="flex-1 bg-red-600 text-white rounded-2xl py-3 font-black uppercase tracking-widest hover:bg-red-700"
            >
              Delete Team
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminTeam;