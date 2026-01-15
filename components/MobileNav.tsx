
import React from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon, LogOut, Package, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onLogout, isAdmin = false }) => {
  const navItems = [
    { id: 'dashboard', label: '數據', icon: <LayoutDashboard size={18} /> },
    { id: 'journal', label: '訓練', icon: <Dumbbell size={18} /> },
    { id: 'scan', label: '診斷', icon: <Camera size={18} /> },
    { id: 'vault', label: '金庫', icon: <Package size={18} /> },
    { id: 'report', label: '報告', icon: <ScrollText size={18} /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon size={18} /> },
    ...(isAdmin ? [{ id: 'admin', label: '管理', icon: <ShieldCheck size={18} /> }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex-1 flex overflow-x-auto no-scrollbar py-2 px-1 gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all min-w-[64px] shrink-0 ${
              activeTab === item.id ? 'text-black font-black' : 'text-gray-300'
            }`}
          >
            <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeTab === item.id && <div className="w-1 h-1 bg-black rounded-full mt-0.5"></div>}
          </button>
        ))}
      </div>
      
      <div className="border-l border-gray-100 p-2 ml-1 shrink-0 bg-white">
        <button
          onClick={onLogout}
          className="p-3 text-gray-200 hover:text-red-400 active:scale-90 transition-all"
          title="登出 Disconnect"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
