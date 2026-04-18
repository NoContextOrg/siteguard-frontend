import { useEffect, useState, cloneElement } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css'
import NurseDashboard from './Nurse_Dashboard'; 
import Workers from './Workers';
import WorkerProfile from './Worker_Profile';
import AdminDashboard from './Admin_Dashboard';
import AdminTeam from './Admin_Team';
import AdminTeamDetail from './Admin_Team_Detail';
import EngineerDashboard from './Engineer_Dashboard';
import EngineerTeam from './Engineer_Team';
import { ShieldCheck, Clock, FileBarChart, Fingerprint, Lock, Send, Moon } from 'lucide-react';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// ========== Sub-Components ========== //

const Navbar = ({ onOpenSignIn }: { onOpenSignIn: () => void }) => (
  <nav className="flex items-center justify-between px-8 md:px-16 lg:px-24 py-6 w-full absolute top-0 left-0 right-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-white p-1.5 rounded-full shadow-lg">
        <ShieldCheck className="text-blue-600 w-7 h-7" />
      </div>
      <span className="text-white font-semibold text-2xl tracking-tighter hidden md:block">
        SiteGuard
      </span>
    </div>

    <div className="hidden md:flex gap-12 text-white font-semibold text-lg">
      <a href="#" className="hover:text-blue-200 transition-colors">Home</a>
      <a href="#" className="hover:text-blue-200 transition-colors">Features</a>
      <a href="#" className="hover:text-blue-200 transition-colors">About Us</a>
    </div>

    <div className="flex items-center gap-4">
      <button onClick={onOpenSignIn} className="bg-white text-blue-900 px-8 py-2.5 rounded-full font-bold shadow-xl hover:scale-105 transition active:scale-95">
        Get Started
      </button>
      <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition">
        <Moon size={20} />
      </button>
    </div>
  </nav>
);

const FeatureCard = ({ title, desc, dark = false }: { title: string, desc: string, dark?: boolean }) => (
  <div className={`${dark ? 'bg-slate-900 text-white' : 'bg-blue-100 text-slate-900'} p-8 rounded-lg shadow-md h-full transition-transform hover:scale-105`}>
    <h3 className="font-bold text-xl mb-4 uppercase tracking-wider">{title}</h3>
    <p className="text-sm leading-relaxed opacity-90">{desc}</p>
  </div>
);

const ProjectCard = ({ title, category, img }: { title: string, category: string, img: string }) => (
  <div className="relative group overflow-hidden rounded-xl h-96">
    <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
      <h4 className="text-white font-bold text-lg">{title}</h4>
      <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">{category}</p>
      <p className="text-white text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">A modern townhouse development offering efficient residential units.</p>
    </div>
  </div>
);

const TeamMember = ({ name, role, img }: { name: string, role: string, img: string }) => (
  <div className="text-center group">
    <div className="bg-slate-300 rounded-lg overflow-hidden mb-3 aspect-[3/4]">
      <img src={img} alt={name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-300" />
    </div>
    <h5 className="text-white font-bold text-sm">{name}</h5>
    <p className="text-slate-400 text-xs">{role}</p>
  </div>
);

const SignInModal = ({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean; onClose: () => void; onLoginSuccess: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 hover:bg-white/20 p-2 rounded-full transition">
            <span className="text-2xl font-bold leading-none">&times;</span>
          </button>
          <h2 className="text-blue-100 text-3xl tracking-tight">Welcome Back</h2>
          <p className="text-blue-100 mt-2">Please sign in to your SiteGuard account</p>
        </div>

        <div className="p-8">
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onLoginSuccess(); }}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input type="email" placeholder="name@construction.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
              Sign In
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            Use your registered email address and password
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== Main Page Component ========== //

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleLoginSuccess = () => {
    setIsModalOpen(false);
    navigate('/dashboard'); 
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900 overflow-x-hidden">
      <Navbar onOpenSignIn={() => setIsModalOpen(true)}/>
      <SignInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
      
      {/* ========== Hero Section ========== */}
      <section className="relative w-full bg-[#4fa3ff] min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[100px] fill-white">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C51.17,105.84,142.1,126.78,321.39,56.44Z"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center z-10">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">SiteGuard</h1>
            <p className="text-xl md:text-2xl text-blue-100 font-semibold mb-4 leading-snug">
              Guarding Lives. Securing Sites.<br />
              Where Workforce Security Meets Site Safety.
            </p>
            <p className="text-blue-100">
              SiteGuard is a biometric attendance and construction safety system that ensures accurate workforce tracking and safer construction sites.
            </p>
          </div>
          <div className="flex justify-center group cursor-pointer">
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-blue-400/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-700 ease-in-out group-hover:scale-110">  
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center overflow-hidden h-[90%] w-[90%] transition-all duration-500 group-hover:rotate-2">
                <img src="/lock_shield.png" alt="SiteGuard Logo" className="w-full h-full object-contain drop-shadow-2xl animate-float transition-transform duration-500 group-hover:scale-110"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Benefits Bar ========== */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center font-bold text-slate-800 mb-10 text-xl tracking-wider">Key System Benefits</h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: <ShieldCheck />, label: "Verification" },
              { icon: <Clock />, label: "Real-Time Tracking" },
              { icon: <FileBarChart />, label: "Automated Reports" },
              { icon: <Fingerprint />, label: "Fingerprint Recognition" },
              { icon: <Lock />, label: "Data Privacy" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="p-4 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                  {cloneElement(item.icon as React.ReactElement, { size: 28 } as any)}
                </div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter text-center max-w-[100px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Offer Section ========== */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-6">What we offer?</h2>
          <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
            We deliver reliable industrial, commercial, and residential projects with a strong commitment to quality, safety, and efficiency. Backed by skilled professionals and modern construction practices, it ensures timely project completion while meeting industry standards and client expectations.
          </p>
          <div className="mb-6"></div>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-700 transition">Inquire Now!</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ProjectCard title="Vista Alegre" category="RESIDENTIAL" img="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400" />
          <ProjectCard title="Vista Alegre" category="COMMERCIAL" img="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" />
          <ProjectCard title="Vista Alegre" category="COMMERCIAL" img="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=400" />
          <ProjectCard title="Vista Alegre" category="INDUSTRIAL" img="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400" />
          <ProjectCard title="Vista Alegre" category="COMMERCIAL" img="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" />
        </div>
      </section>

 {/* ========== Features Section ========== */}
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="text-center text-4xl font-extrabold mb-16">Features</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <FeatureCard dark title="Biometric Attendance System" desc="Utilizes fingerprint or biometric verification to ensure accurate worker identification and prevent attendance fraud. This feature enhances site security by allowing access only to authorized personnel." />
        <FeatureCard title="Real-Time Tracking" desc="Enables continuous monitoring of worker attendance and on-site activity across construction projects. Site Engineers can quickly respond to manpower issues, delays, or irregularities as they occur." />
        <FeatureCard dark title="SMS Notification" desc="Automatically sends important alerts and updates to managers and supervisors regarding attendance, safety violations, or emergency announcements." />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <FeatureCard title="Hotlist Monitoring" desc="Identifies and restricts individuals who are flagged as unauthorized, suspended, or under monitoring. This feature strengthens site safety by preventing high-risk or banned personnel from entering construction areas." />
        <FeatureCard dark title="Construction Management" desc="Provides a centralized platform for managing projects, workers, and attendance records. It improves coordination, accountability, and overall efficiency in construction operations." />
      </div>
    </div>
  </section>

 {/* ========== About Us Section ========== */}
  <section className="py-24 bg-slate-900 w-full overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-6xl font-black mb-8 !text-white uppercase tracking-tighter">About Us</h2>
      <p className="mb-8 !text-white tracking-tighter">
        Our goal is to deliver safe, high-quality construction projects through efficient processes, skilled expertise, and innovative solutions that support sustainable development and client trust.
      </p>
      <div className="mb-12"></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <TeamMember name="Burgos, Janna Mae O." role="Researcher" img="/Burgos.jpg" />
        <TeamMember name="Barretto, Kaela Joy I." role="Researcher" img="/Barretto.jpg" />
        <TeamMember name="Ison, Brianna Ysabel A." role="Researcher" img="/Ison.jpg" />
        <TeamMember name="Magturo, Anne Joycebelle C." role="Researcher" img="/Magturo.png" />
        <TeamMember name="Vicuña, Vircel Renzo R." role="Researcher" img="/Vicuña.png" />
      </div>
    </div>
  </section>

  {/* ========== Footer ========== */}
  <footer className="bg-slate-950 text-white py-16">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
      <div className="col-span-1">
        <h3 className="text-2xl font-bold mb-6">SiteGuard</h3>
        <div className="relative max-w-xs">
          <input type="email" placeholder="Enter your email" className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-blue-500" />
          <button className="absolute right-3 top-3 text-blue-500"><Send size={18} /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-1">
        <div>
          <h4 className="font-bold mb-4 text-slate-300">Home</h4>
          <ul className="text-slate-500 text-sm space-y-2">
            <li><a href="#">Features</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contacts</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-slate-300">Services</h4>
          <ul className="text-slate-500 text-sm space-y-2">
            <li><a href="#">Construction</a></li>
          </ul>
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-slate-300">Follow Us!</h4>
        <p className="mt-8 text-xs text-slate-600">© 2026 SiteGuard. All rights reserved.</p>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-slate-300">Location</h4>
        <div className="rounded-lg overflow-hidden h-32 w-full grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition">
          <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="Map" />
        </div>
      </div>
    </div>
  </footer>
    </div>
  );
};

// ========== Router Configuration (The App) ========== //

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landingpage" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <NurseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workers" 
            element={
              <ProtectedRoute>
                <Workers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin_dashboard" 
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin_team" 
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminTeam />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin_team_detail" 
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminTeamDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/engineer_dashboard" 
            element={
              <ProtectedRoute requiredRoles={['engineer']}>
                <EngineerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/engineer_team" 
            element={
              <ProtectedRoute requiredRoles={['engineer']}>
                <EngineerTeam />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/worker-profile" 
            element={
              <ProtectedRoute>
                <WorkerProfile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;