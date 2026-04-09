import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  User, 
  History, 
  PlusCircle,
  Flame,
  Activity,
  Beef,
  Droplets,
  ChevronRight,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Scanner from './components/Scanner';
import ManualEntry from './components/ManualEntry';
import { UserProfile, MealLog } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'profile' | 'manual'>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_APP_URL || '';
      const [profileRes, logsRes] = await Promise.all([
        fetch(`${baseUrl}/api/profile`),
        fetch(`${baseUrl}/api/logs`)
      ]);
      const profileData = await profileRes.json();
      const logsData = await logsRes.json();
      setProfile(profileData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveTab('dashboard');
  };

  const handleLogAdded = (newLog: MealLog) => {
    setLogs(prev => [...prev, newLog]);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan Food', icon: Camera },
    { id: 'manual', label: 'Manual', icon: PlusCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-24 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 p-6 z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">NutrientApk</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === tab.id 
                  ? "bg-emerald-50 text-emerald-600 font-semibold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                activeTab === tab.id ? "text-emerald-600" : "text-gray-400"
              )} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg">NutrientApk</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard profile={profile} logs={logs} onNavigateToProfile={() => setActiveTab('profile')} />
            )}
            {activeTab === 'scan' && (
              <Scanner profile={profile} onLogAdded={handleLogAdded} />
            )}
            {activeTab === 'manual' && (
              <ManualEntry onLogAdded={handleLogAdded} />
            )}
            {activeTab === 'profile' && (
              <Profile profile={profile} onUpdate={handleProfileUpdate} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around items-center z-50 pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors duration-200",
              activeTab === tab.id ? "text-emerald-600" : "text-gray-400"
            )}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
