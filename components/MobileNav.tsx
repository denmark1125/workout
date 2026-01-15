
import React from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: '數據', icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
    { id: 'journal', label: '訓練', icon: <Dumbbell size={18} strokeWidth={2.5} /> },
    { id: 'scan', label: '診斷', icon: <Camera size={18} strokeWidth={2.5} /> },
    { id: 'report', label: '報告', icon: <ScrollText size={18} strokeWidth={2.5} /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon size={18} strokeWidth={2.5} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center p-3 pb-8 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 relative ${
            activeTab === item.id ? 'text-black scale-110' : 'text-gray-300'
          }`}
        >
          <span className="mb-0.5">{item.icon}</span>
          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          {activeTab === item.id && (
            <div className="absolute -top-1 w-1 h-1 bg-[#bef264] rounded-full shadow-[0_0_10px_rgba(190,242,100,1)]"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default MobileNav;
