import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Fingerprint } from 'lucide-react';
import { 
  getAllPersons, 
  createPerson, 
  updatePerson, 
  deletePerson,
  registerFingerprint,
  type Person,
  type PersonResponse
} from '../api/person';
import DashboardLayout from './DashboardLayout';

interface FormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
}

const PersonManagement: React.FC = () => {
  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  
  const [selectedPerson, setSelectedPerson] = useState<PersonResponse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
  });
  const [fingerprintData, setFingerprintData] = useState('');

  // Load persons on component mount
  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPersons();
      setPersons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load persons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (person: PersonResponse) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name,
      email: person.email,
      phone: person.phone,
      position: person.position,
      department: person.department,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (person: PersonResponse) => {
    setSelectedPerson(person);
    setShowDeleteConfirm(true);
  };

  const handleFingerprintClick = (person: PersonResponse) => {
    setSelectedPerson(person);
    setFingerprintData('');
    setShowFingerprintModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createPerson(formData as Person);
      setSuccess('Person created successfully!');
      setShowCreateModal(false);
      await loadPersons();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    try {
      setError(null);
      await updatePerson(selectedPerson.id, formData);
      setSuccess('Person updated successfully!');
      setShowEditModal(false);
      await loadPersons();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPerson) return;
    try {
      setError(null);
      await deletePerson(selectedPerson.id);
      setSuccess('Person deleted successfully!');
      setShowDeleteConfirm(false);
      await loadPersons();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person');
    }
  };

  const handleSubmitFingerprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !fingerprintData.trim()) {
      setError('Please enter fingerprint data');
      return;
    }
    try {
      setError(null);
      await registerFingerprint(selectedPerson.id, fingerprintData);
      setSuccess('Fingerprint registered successfully!');
      setShowFingerprintModal(false);
      await loadPersons();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register fingerprint');
    }
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Person Management">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Person Management</h1>
            <p className="text-slate-600 mt-1">Manage system persons and their details</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add Person
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
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-600 text-lg">No persons found</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Fingerprint</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPersons.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.position}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.department}</td>
                    <td className="px-6 py-4 text-sm">
                      {person.fingerprint ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Fingerprint size={14} />
                          Registered
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleFingerprintClick(person)}
                          className="text-purple-600 hover:text-purple-700 transition-colors"
                          title="Register Fingerprint"
                        >
                          <Fingerprint size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(person)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(person)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title="Add New Person"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmitCreate}
        >
          <PersonForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitCreate}
            submitLabel="Create Person"
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPerson && (
        <Modal
          title="Edit Person"
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSubmitEdit}
        >
          <PersonForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitEdit}
            submitLabel="Update Person"
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPerson && (
        <ConfirmModal
          title="Delete Person"
          message={`Are you sure you want to delete ${selectedPerson.name}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmLabel="Delete"
          confirmColor="red"
        />
      )}

      {/* Fingerprint Modal */}
      {showFingerprintModal && selectedPerson && (
        <Modal
          title="Register Fingerprint"
          onClose={() => setShowFingerprintModal(false)}
          onSubmit={handleSubmitFingerprint}
        >
          <FingerprintForm
            personName={selectedPerson.name}
            fingerprintData={fingerprintData}
            setFingerprintData={setFingerprintData}
            onSubmit={handleSubmitFingerprint}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

interface PersonFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

const PersonForm: React.FC<PersonFormProps> = ({ formData, setFormData, onSubmit, submitLabel }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
          <input
            type="text"
            required
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
        <input
          type="text"
          required
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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

interface FingerprintFormProps {
  personName: string;
  fingerprintData: string;
  setFingerprintData: (data: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const FingerprintForm: React.FC<FingerprintFormProps> = ({
  personName,
  fingerprintData,
  setFingerprintData,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Register fingerprint for <span className="font-semibold">{personName}</span>
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fingerprint Data *</label>
        <textarea
          required
          value={fingerprintData}
          onChange={(e) => setFingerprintData(e.target.value)}
          placeholder="Enter fingerprint data (base64 encoded or biometric template)"
          rows={6}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Register Fingerprint
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

export default PersonManagement;
