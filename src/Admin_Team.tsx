import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BellRing, LogOut, Search, Bell, 
  ChevronDown, UserPlus, Users2, X
} from 'lucide-react';

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

const Team = () => {
  const navigate = useNavigate();
  
  // Modal States
  const [modalType, setModalType] = useState<'account' | 'team' | 'worker' | null>(null);

  const closeModal = () => setModalType(null);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* ========== SIDEBAR ========== */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
             <img src="/logo.png" alt="SG" className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteGuard</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => navigate('/admin_dashboard')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <LayoutDashboard size={20} /> <span className="text-sm font-semibold uppercase">Dashboard</span>
          </button>
          <button onClick={() => navigate('/workers')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Workers</span>
          </button>
          <button className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <BellRing size={20} /> <span className="text-sm font-semibold uppercase">Alerts</span>
          </button>
          <button className="flex items-center gap-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <Users2 size={20} /> <span className="text-sm font-semibold uppercase">Team</span>
          </button>
        </nav>
        <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white transition mt-auto border-t border-slate-700">
          <LogOut size={20} /> <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Search size={20} className="opacity-50" />
            <span className="text-xl font-bold uppercase tracking-widest">SiteGuard</span>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="cursor-pointer" />
            <div className="flex items-center gap-3 border-l border-white/20 pl-6">
              <div className="text-right">
                <p className="text-xs font-bold">Ysa Dela Fuente</p>
                <p className="text-[10px] opacity-70">ysadelafuente@gmail.com</p>
              </div>
              <div className="w-10 h-10 bg-slate-300 rounded-full border-2 border-white/50"></div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6">

          {/* ACCOUNTS SECTION */}
          <section className="mt-8">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">ACCOUNTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AccountCard title="Workers" count="1,000" onAdd={() => setModalType('account')} />
              <AccountCard title="Site Engineers" count="50" onAdd={() => setModalType('account')} />
              <AccountCard title="Nurses" count="15" onAdd={() => setModalType('account')} />
            </div>
          </section>

          {/* TEAMS SECTION */}
          <section className="mt-12">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">TEAMS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Add New Team Trigger */}
              <div className="bg-white p-8 rounded-xl shadow-sm border-l-[6px] border-l-orange-900 flex flex-col justify-center items-center h-52 relative group cursor-pointer" onClick={() => setModalType('team')}>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4">
                        <span className="text-md font-black text-slate-800 uppercase tracking-tighter">ADD NEW TEAM</span>
                        <UserPlus size={28} className="text-slate-800" />
                    </div>
                </div>
                <button className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
                  Create Team <span className="text-lg">→</span>
                </button>
              </div>

              <TeamCard title="MASONRY" engineer="ALBERT SANTOS" count="80" borderColor="border-l-green-700" onAddWorker={() => setModalType('worker')} />
              <TeamCard title="MEPF" engineer="MELVIN MACASPAC" count="45" borderColor="border-l-red-900" onAddWorker={() => setModalType('worker')} />
              <TeamCard title="FINISHING" engineer="BERNADETTE CRUZ" count="60" borderColor="border-l-slate-300" onAddWorker={() => setModalType('worker')} />
              <TeamCard title="LINE & GRADE" engineer="OSCAR LIMUNOZ" count="150" borderColor="border-l-blue-500" onAddWorker={() => setModalType('worker')} />
              <TeamCard title="STRUCTURAL" engineer="SARAH FLORES" count="30" borderColor="border-l-red-500" onAddWorker={() => setModalType('worker')} />
            </div>
          </section>
        </div>
      </main>

      {/* ========== MODAL FORMS ========== */}

      {/* 1. Add Account Form */}
      <Modal isOpen={modalType === 'account'} onClose={closeModal} title="Create New Account">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Full Name</label>
                <input type="text" placeholder="e.g. Juan Luna" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
            </div>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Role</label>
                <select className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm">
                    <option>Worker</option>
                    <option>Site Engineer</option>
                    <option>Nurse</option>
                </select>
            </div>
            <button onClick={closeModal} className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition">Create Account</button>
        </form>
      </Modal>

      {/* 2. Create Team Form */}
      <Modal isOpen={modalType === 'team'} onClose={closeModal} title="Register New Team">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Team Name</label>
                <input type="text" placeholder="e.g. Carpentry" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
            </div>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Assign Site Engineer</label>
                <input type="text" placeholder="Search Engineer Name..." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
            </div>
            <button onClick={closeModal} className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition">Register Team</button>
        </form>
      </Modal>

      {/* 3. Add Worker to Team Form */}
      <Modal isOpen={modalType === 'worker'} onClose={closeModal} title="Add Worker to Team">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Select Worker</label>
                <input type="text" placeholder="Search by name or ID..." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Worker must already have an account registered.</p>
            <button onClick={closeModal} className="w-full bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition">Add to Team</button>
        </form>
      </Modal>

    </div>
  );
};

export default Team;