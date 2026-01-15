
import React from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  memberId: string;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, memberId, isAdmin }) => {
  const navItems = [
    { id: 'dashboard', label: '數據中心', icon: <LayoutDashboard size={18} /> },
    { id: 'journal', label: '訓練日誌', icon: <Dumbbell size={18} /> },
    { id: 'scan', label: '視覺診斷', icon: <Camera size={18} /> },
    { id: 'report', label: '戰略週報', icon: <ScrollText size={18} /> },
    { id: 'settings', label: '系統設定', icon: <SettingsIcon size={18} /> },
    ...(isAdmin ? [{ id: 'admin', label: '管理面板', icon: <ShieldCheck size={18} /> }] : []),
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 z-10">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-sm italic">M</div>
          <h1 className="text-xl font-black tracking-tighter">MATRIX</h1>
        </div>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest pl-11">Physique Intelligence</p>
      </div>

      <nav className="flex-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-8 py-4 transition-all ${
              activeTab === item.id 
                ? 'sidebar-active font-black' 
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span className={activeTab === item.id ? 'text-black' : 'text-gray-300'}>{item.icon}</span>
            <span className="text-[11px] uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white border border-gray-200 flex items-center justify-center text-[8px] font-black text-gray-400">USR</div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black uppercase truncate">{memberId}</p>
            <p className="text-[8px] text-gray-400 font-mono">V2.4 :: 待命 (STANDBY)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
