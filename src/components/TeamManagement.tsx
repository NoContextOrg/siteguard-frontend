import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, Users } from 'lucide-react';
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addPersonToTeam,
  removePersonFromTeam,
  type Team,
  type TeamResponse,
} from '../api/team';
import { getAllPersons, getPersonsByTeam, setPersonPassword, type PersonResponse } from '../api/person';

interface FormData {
  name: string;
  classification: string;
  description: string;
  location: string;
}

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [teamMembers, setTeamMembers] = useState<PersonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    classification: 'GENERAL',
    description: '',
    location: '',
  });
  const [selectedPersonForTeam, setSelectedPersonForTeam] = useState<number | null>(null);
  const [addMemberPassword, setAddMemberPassword] = useState('');
  const [passwordModalPersonId, setPasswordModalPersonId] = useState<number | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Load teams and persons on component mount
  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsData, personsData] = await Promise.all([getAllTeams(), getAllPersons()]);
      setTeams(teamsData);
      setPersons(personsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const teamMemberCountById = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of teams) map.set(t.id, t.members ?? 0);
    return map;
  }, [teams]);

  const handleCreateClick = () => {
    setFormData({
      name: '',
      classification: 'GENERAL',
      description: '',
      location: '',
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (team: TeamResponse) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      classification: (team as any)?.classification ?? 'GENERAL',
      description: team.description,
      location: team.location,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (team: TeamResponse) => {
    setSelectedTeam(team);
    setShowDeleteConfirm(true);
  };

  const handleViewMembers = async (team: TeamResponse) => {
    try {
      setError(null);
      setSelectedTeam(team);
      const members = await getPersonsByTeam(team.id);
      setTeamMembers(members);
      setShowMembersModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createTeam(formData as unknown as Team);
      setSuccess('Team created successfully!');
      setShowCreateModal(false);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      setError(null);
      await updateTeam(selectedTeam.id, formData as unknown as Team);
      setSuccess('Team updated successfully!');
      setShowEditModal(false);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeam) return;
    try {
      setError(null);
      await deleteTeam(selectedTeam.id);
      setSuccess('Team deleted successfully!');
      setShowDeleteConfirm(false);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedPersonForTeam) {
      setError('Please select a person');
      return;
    }
    if (addMemberPassword && addMemberPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setError(null);
      await addPersonToTeam(selectedTeam.id, selectedPersonForTeam);
      if (addMemberPassword) {
        await setPersonPassword(selectedPersonForTeam, addMemberPassword);
      }
      setSuccess('Person added to team successfully!');
      const members = await getPersonsByTeam(selectedTeam.id);
      setTeamMembers(members);
      setSelectedPersonForTeam(null);
      setAddMemberPassword('');
      setShowAddMemberModal(false);
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add person to team');
    }
  };

  const handleRemoveMember = async (personId: number) => {
    if (!selectedTeam) return;
    try {
      setError(null);
      await removePersonFromTeam(selectedTeam.id, personId);
      setSuccess('Person removed from team successfully!');
      const members = await getPersonsByTeam(selectedTeam.id);
      setTeamMembers(members);
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove person from team');
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

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availablePersons = persons.filter((person) => !teamMembers.some((member) => member.id === person.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Management</h1>
            <p className="text-slate-600 mt-1">Manage teams and their members</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add Team
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Team Management</h1>
              <p className="text-slate-600 mt-1">Manage teams and their members</p>
            </div>
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus size={20} />
              Add Team
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="h-6 w-1/2 bg-slate-200 rounded mb-4" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded mb-4" />
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-4 w-12 bg-slate-100 rounded" />
                    </div>
                    <div className="h-4 w-1/3 bg-slate-100 rounded mb-4" />
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <div className="h-8 w-20 bg-slate-100 rounded" />
                    <div className="h-8 w-8 bg-slate-100 rounded" />
                    <div className="h-8 w-8 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600 text-lg">No teams found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{team.name}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{team.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={16} className="text-blue-600" />
                      <span className="text-sm text-slate-600">
                        {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" /> : (teamMemberCountById.get(team.id) ?? 0)} members
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      <span className="font-medium">Location:</span> {team.location}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                      onClick={() => handleViewMembers(team)}
                      className="flex-1 text-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      View Members
                    </button>
                    <button
                      onClick={() => handleEditClick(team)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(team)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <Modal
            title="Add New Team"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleSubmitCreate}
          >
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmitCreate}
              submitLabel="Create Team"
            />
          </Modal>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedTeam && (
          <Modal
            title="Edit Team"
            onClose={() => setShowEditModal(false)}
            onSubmit={handleSubmitEdit}
          >
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmitEdit}
              submitLabel="Update Team"
            />
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedTeam && (
          <ConfirmModal
            title="Delete Team"
            message={`Are you sure you want to delete "${selectedTeam.name}"? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmLabel="Delete"
            confirmColor="red"
          />
        )}

        {/* Members Modal */}
        {showMembersModal && selectedTeam && (
          <Modal
            title={`${selectedTeam.name} - Members`}
            onClose={() => setShowMembersModal(false)}
            onSubmit={() => {}}
          >
            <div className="space-y-4">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Add Member
              </button>

              {teamMembers.length === 0 ? (
                <p className="text-center py-6 text-slate-600">No members in this team</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-600">{member.email}</p>
                        <p className="text-sm text-slate-500">{member.position}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => openPasswordModal(member.id)}
                          className="p-2 text-orange-600 hover:text-orange-700 transition-colors"
                          title="Change Password"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && selectedTeam && (
          <Modal
            title="Add Member to Team"
            onClose={() => {
              setShowAddMemberModal(false);
              setSelectedPersonForTeam(null);
              setAddMemberPassword('');
            }}
            onSubmit={handleAddMember}
          >
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Person *
                </label>
                <select
                  required
                  value={selectedPersonForTeam ?? ''}
                  onChange={(e) => setSelectedPersonForTeam(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose a person --</option>
                  {availablePersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} - {person.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Set Password (optional)</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={addMemberPassword}
                  onChange={e => setAddMemberPassword(e.target.value)}
                  placeholder="Set password for this member"
                  autoComplete="new-password"
                />
                <div className="text-xs text-slate-400 mt-1">Leave blank to skip</div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedPersonForTeam(null);
                    setAddMemberPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Member
                </button>
              </div>
            </form>
          </Modal>
        )}
        {/* Password Modal for member */}
        {passwordModalPersonId !== null && (
          <Modal
            title="Set/Reset Member Password"
            onClose={closePasswordModal}
            onSubmit={e => { e.preventDefault(); handleSetPassword(); }}
          >
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
      </div>
    </div>
  );
};

interface TeamFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

const TeamForm: React.FC<TeamFormProps> = ({ formData, setFormData, onSubmit, submitLabel }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Team Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Classification *</label>
        <select
          required
          value={formData.classification}
          onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="GENERAL">GENERAL</option>
          <option value="WORKER">WORKER</option>
          <option value="ENGINEER">ENGINEER</option>
          <option value="NURSE">NURSE</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  confirmColor: 'red' | 'blue' | 'green';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  confirmColor,
}) => {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onCancel}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors font-medium ${colorClasses[confirmColor]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
