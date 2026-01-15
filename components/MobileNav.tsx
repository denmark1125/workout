
import React from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon, LogOut } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  // Changed (tab: void) to (tab: string) to correctly match the navigation item IDs
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: '數據', icon: <LayoutDashboard size={18} /> },
    { id: 'journal', label: '訓練', icon: <Dumbbell size={18} /> },
    { id: 'scan', label: '診斷', icon: <Camera size={18} /> },
    { id: 'report', label: '報告', icon: <ScrollText size={18} /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-3 pb-8 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${
            activeTab === item.id ? 'text-black scale-110' : 'text-gray-300'
          }`}
        >
          {item.icon}
          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
      <button
        onClick={onLogout}
        className="p-2 text-gray-200 hover:text-red-400"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default MobileNav;
