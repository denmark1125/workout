
import React, { useMemo } from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon, ShieldCheck, LogOut, Package, Star } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  memberId: string;
  isAdmin: boolean;
  onLogout: () => void;
  hasPendingReward?: boolean; // 新增：是否有待領取獎勵
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, memberId, isAdmin, onLogout, hasPendingReward = false }) => {
  const navItems = [
    { id: 'dashboard', label: '健身數據', icon: <LayoutDashboard size={18} /> },
    { id: 'journal', label: '訓練日誌', icon: <Dumbbell size={18} /> },
    { id: 'scan', label: '體態診斷', icon: <Camera size={18} /> },
    { id: 'report', label: '健身週報', icon: <ScrollText size={18} /> },
    { id: 'vault', label: '收藏金庫', icon: <Package size={18} />, badge: hasPendingReward }, 
    { id: 'settings', label: '系統設定', icon: <SettingsIcon size={18} /> },
    ...(isAdmin ? [{ id: 'admin', label: '管理面板', icon: <ShieldCheck size={18} /> }] : []),
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 z-10">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-black text-[#bef264] flex items-center justify-center font-black text-sm italic">M</div>
          <h1 className="text-xl font-black tracking-tighter">MATRIX</h1>
        </div>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest pl-11">Fitness Analysis</p>
      </div>

      <nav className="flex-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-8 py-4 transition-all relative ${
              activeTab === item.id 
                ? 'sidebar-active font-black' 
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
            }`}
          >
            <span className={`relative ${activeTab === item.id ? 'text-black' : 'text-gray-300'}`}>
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#bef264] border-2 border-black rounded-full animate-ping"></span>
              )}
            </span>
            <span className="text-[11px] uppercase tracking-wider flex items-center gap-2">
              {item.label}
              {item.badge && <span className="text-[8px] font-black text-black bg-[#bef264] px-1 rounded-sm animate-pulse">REWARD</span>}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-50 bg-gray-50/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-7 h-7 bg-white border border-gray-200 flex items-center justify-center text-[7px] font-black text-gray-400 shrink-0">USR</div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase truncate text-black">{memberId}</p>
              <p className="text-[7px] text-lime-600 font-mono font-bold tracking-widest">CONNECTED</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
            title="登出 Disconnect"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
