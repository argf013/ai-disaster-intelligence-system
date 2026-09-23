import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Activity,
  Image as ImageIcon,
  Layers,
  MessageSquareWarning,
  MapPin,
  History,
  FileText,
  UserCheck,
  LogOut,
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'image-analysis', label: 'Image Analysis', icon: ImageIcon },
    { id: 'damage-assessment', label: 'Damage Assessment', icon: Layers },
    { id: 'emergency-messages', label: 'Emergency Messages', icon: MessageSquareWarning },
    { id: 'shelter-map', label: 'Shelter Map', icon: MapPin },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'SitRep Reports', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: UserCheck });
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-lg text-red-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-wide">
                DISASTER<span className="text-red-500">INTEL</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded">
                Operations Console v1.0
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-300">{user.email}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  {user.role} ACCESS
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
