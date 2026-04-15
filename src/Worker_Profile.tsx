import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard,  Users, BellRing,  LogOut, Search, Bell, ChevronDown, SquarePen, X, ShieldAlert } from 'lucide-react';

const WorkerProfile = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ========== Sidebar ========== */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
              <ShieldAlert className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">SiteGuard</span>
          </div>
  
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
              <LayoutDashboard size={20} /> <span className="text-sm font-semibold uppercase">Dashboard</span>
            </button>
            <button onClick={() => navigate('/workers')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
              <Users size={20} /> <span className="text-sm font-semibold uppercase">Workers</span>
            </button>
            <button className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
              <BellRing size={20} /> <span className="text-sm font-semibold uppercase">Alerts</span>
            </button>
          </nav>
  
          <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white transition mt-auto border-t border-slate-700">
            <LogOut size={20} /> <span className="font-semibold">Logout</span>
          </button>
        </aside>  

      {/* ========== Main Content Area ========== */}
      <main className="flex-1 ml-64">
        {/* ========== Header ========== */}
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 invert" />
            <span className="text-xl font-bold uppercase tracking-widest">SiteGuard</span>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="cursor-pointer" />
            <div className="flex items-center gap-3 border-l border-white/20 pl-6">
              <div className="text-right">
                <p className="text-xs font-bold">Ysa Dela Fuente</p>
                <p className="text-[10px] opacity-70">ysadelafuente@gmail.com</p>
              </div>
              <div className="w-10 h-10 bg-slate-300 rounded-full overflow-hidden border-2 border-white/50">
                 <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="User" />
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="p-8">
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">Worker Profile</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ========== Left Column: Personal_Info ========== */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col items-center mb-10">
                  <div className="w-40 h-40 rounded-full border-4 border-slate-100 overflow-hidden mb-6">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="Worker" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* ========== Form Fields ========== */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Name</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-lg text-center">Maria Manuel Lopez</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Address</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">04-A Pabel St. DM-3A Subd. Brgy. San Mariano Marikina City</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Contact Number</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">09123456789</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Age</label>
                      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">36</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Birthdate</label>
                      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">01/15/1990</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Position</label>
                      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">Electrician</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Year of Employment</label>
                      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">2025</div>
                    </div>
                  </div>
                </div>

                {/* ========== Attendance Grid ========== */}
                <div className="mt-12 bg-[#1e293b] p-8 rounded-xl text-white shadow-2xl">
                <h3 className="text-lg font-bold uppercase mb-6 tracking-widest text-blue-100">Attendance Overview</h3>
                
                <div className="overflow-x-auto pb-4">
                    <div className="min-w-200">
                    
                    <div className="grid grid-cols-[60px_repeat(12,1fr)] mb-4 border-b border-slate-700 pb-2">
                        <div /> 
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                        <div key={m} className="text-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                            {m}
                        </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="grid grid-cols-[60px_repeat(12,1fr)] items-center gap-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{day}</div>
                            {Array.from({ length: 12 }).map((_, mIdx) => (
                            <div key={mIdx} className="flex justify-center gap-0.5">
                                {[1, 2, 3, 4].map((dotIdx) => {
                                const rand = Math.random();
                                let color = "bg-blue-400"; 

                                if (rand < 0.03) {
                                    color = "bg-red-500"; 
                                } else if (rand < 0.08) {
                                    color = "bg-yellow-400"; 
                                } else if (rand < 0.15) {
                                    color = "bg-green-400"; 
                                }

                                return (
                                    <div key={dotIdx} className={`w-3 h-3 rounded-full ${color} shadow-sm transition hover:scale-150 cursor-pointer`} title={`${day} - Week ${dotIdx}`}/>
                                );
                                })}
                            </div>
                            ))}
                        </div>
                        ))}
                    </div>
                    </div>
                </div>

                {/* ========== Legend Section ========== */}
                <div className="flex justify-center gap-8 mt-10 text-[10px] font-black border-t border-slate-700/50 pt-6 tracking-widest">
                    <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-blue-400 rounded-full" /> PRESENT
                    </div>
                    <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" /> ABSENT
                    </div>
                    <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-green-400 rounded-full" /> OVERTIME
                    </div>
                    <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full" /> ON LEAVE
                    </div>
                </div>
                </div>
            </div>
            </div>

            {/* ========== Right Column: Medical_Form ========== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
              <div className="p-6 text-center border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Medical Form</h2>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 text-blue-900 font-bold mt-2 mx-auto hover:text-blue-600 transition"
                >
                  <SquarePen size={18} /> ADD CHECKUP LOG
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-[16px] font-bold text-red-900 leading-tight uppercase text-center">Stage 1 Hypertension</p>
                  <p className="text-[12px] text-slate-500 mt-1 text-center">01/03/2026</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-[16px] font-bold text-green-900 leading-tight uppercase text-center">Normal Checkup</p>
                  <p className="text-[12px] text-slate-500 mt-1 text-center">01/06/2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    {/* ========== Medical Form Modal (Inline Overlay) ========== */}
    {isModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Blurred Backdrop */}
        <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={() => setIsModalOpen(false)}
        ></div>

        <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
        <div className="relative p-6 flex justify-center items-center border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Medical Form</h2>
            <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute right-8 top-6 p-2 hover:bg-slate-100 rounded-full transition"
            >
            <X size={28} className="text-slate-800" />
            </button>
        </div>

        {/* Modal Body */}
        <form className="px-10 py-8 space-y-4 max-h-[85vh] overflow-y-auto" onSubmit={(e) => e.preventDefault()}>
            
            {/* Row 1: Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
                { label: 'Temperature', placeholder: '36.5 °C', type: 'text' },
                { label: 'Blood Pressure', placeholder: '120/80', type: 'text' },
                { label: 'Heart Rate / Pulse', placeholder: '72 bpm', type: 'text' },
                { label: 'Time', type: 'time' },
                { label: 'Date', type: 'date' },
            ].map((field) => (
                <div key={field.label} className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">{field.label}</label>
                <input 
                    type={field.type} 
                    placeholder={field.placeholder}
                    className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm cursor-pointer" 
                />
                </div>
            ))}
            </div>

            {/* Row 2: Physicals */}
            <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Height</label>
                <input type="text" placeholder="170 cm" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Weight</label>
                <input type="text" placeholder="65 kg" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            <div className="col-span-2 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Bmi</label>
                <input type="text" placeholder="22.4" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            <div className="col-span-4 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Respiratory Rate</label>
                <input type="text" placeholder="16 breaths/min" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            </div>

            {/* Row 3: History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Taken Medications</label>
                <input type="text" placeholder="Paracetamol, Amoxicillin, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Allergies</label>
                <input type="text" placeholder="Peanuts, Penicillin, Dust, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>
            </div>

            {/* Row 4: Conditions */}
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Existing Medical Conditions</label>
            <input type="text" placeholder="Hypertension, Asthma, Diabetes, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
            </div>

            {/* Row 5: Findings */}
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 min-h-[100px] transition-focus focus-within:border-blue-400">
            <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Findings</label>
            <textarea 
                placeholder="Enter physical observations or diagnosis findings here..."
                className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm resize-none h-16 placeholder:font-normal" 
            />
            </div>

            {/* Row 6: Classification */}
            <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-black text-blue-900 uppercase">Classification:</span>
            <div className="flex items-center gap-10">
                <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="class" className="w-5 h-5 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Hotlist</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="class" className="w-5 h-5 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Normal</span>
                </label>
            </div>
            </div>

            <div className="flex justify-center pt-4">
            <button 
                type="submit"
                onClick={() => setIsModalOpen(false)}
                className="bg-[#1a2e5a] text-white px-20 py-4 rounded-2xl font-semibold uppercase tracking-widest hover:bg-[#132142] hover:scale-105 transition-all shadow-xl active:scale-95"
            >
                Submit Log
            </button>
            </div>
        </form>
        </div>
    </div>
    )}
    </div>
  );
};

export default WorkerProfile;