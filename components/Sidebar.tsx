
import React from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: '數據中心', icon: <LayoutDashboard size={20} strokeWidth={2.5} /> },
    { id: 'journal', label: '訓練日誌', icon: <Dumbbell size={20} strokeWidth={2.5} /> },
    { id: 'scan', label: '視覺診斷', icon: <Camera size={20} strokeWidth={2.5} /> },
    { id: 'report', label: '戰略週報', icon: <ScrollText size={20} strokeWidth={2.5} /> },
    { id: 'settings', label: '系統設定', icon: <SettingsIcon size={20} strokeWidth={2.5} /> },
  ];

  return (
    <div className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-10">
      <div className="p-10">
        <h1 className="text-3xl font-black tracking-tighter text-black flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-center text-white text-lg">M</div>
          MATRIX
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1 h-1 bg-[#bef264] rounded-full"></div>
          <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-mono font-bold">Physique Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 transition-all group relative overflow-hidden ${
              activeTab === item.id 
                ? 'bg-[#bef264] text-black font-black border-l-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.05)]' 
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
              {item.icon}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute right-4 w-1 h-1 bg-black rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 p-1">
             <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-mono text-[10px]">USR</div>
          </div>
          <div>
            <p className="text-[10px] font-black text-black uppercase tracking-tighter">OPERATOR_01</p>
            <p className="text-[8px] text-gray-400 uppercase font-mono mt-0.5">V2.5 :: 待命 (STANDBY)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
