
import React from 'react';
import { FitnessGoal, GoalMetadata, UserProfile } from '../types';
import { LayoutDashboard as DashboardIcon, Dumbbell as DumbbellIcon, Camera as CameraIcon, ScrollText as ReportIcon, Settings as SettingsIconLucide, ShieldCheck as AdminIcon, LogOut as LogoutIcon, Package as VaultIcon, Utensils as UtensilsIcon, Cpu, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  memberId: string;
  isAdmin: boolean;
  onLogout: () => void;
  hasPendingReward?: boolean;
  profile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, memberId, isAdmin, onLogout, hasPendingReward = false, profile }) => {
  const navItems = [
    { id: 'dashboard', label: '健身數據', icon: <DashboardIcon size={18} /> },
    { id: 'diet', label: '飲食控制', icon: <UtensilsIcon size={18} /> },
    { id: 'journal', label: '訓練日誌', icon: <DumbbellIcon size={18} /> },
    { id: 'scan', label: '體態診斷', icon: <CameraIcon size={18} /> },
    { id: 'report', label: '戰略週報', icon: <ReportIcon size={18} /> },
    { id: 'vault', label: '收藏金庫', icon: <VaultIcon size={18} />, badge: hasPendingReward }, 
    { id: 'aiconsole', label: 'AI 指揮中心', icon: <Cpu size={18} /> },
    { id: 'settings', label: '系統設定', icon: <SettingsIconLucide size={18} /> },
    ...(isAdmin ? [{ id: 'admin', label: '管理面板', icon: <AdminIcon size={18} /> }] : []),
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 z-10 shadow-sm">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-[#bef264] flex items-center justify-center font-black text-lg italic shadow-[0_4px_15px_rgba(0,0,0,0.15)] transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">M</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">MATRIX</h1>
            <p className="text-[8px] font-black text-[#bef264] bg-black px-1 mt-1 inline-block uppercase tracking-widest">TACTICAL AI</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-all rounded-lg group relative ${
                isActive 
                  ? 'bg-black text-white shadow-xl scale-[1.02]' 
                  : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`transition-transform group-hover:scale-110 ${isActive ? 'text-[#bef264]' : 'text-gray-300'}`}>
                  {item.icon}
                </span>
                <span className="text-[14px] font-bold tracking-tight uppercase">
                  {item.label}
                </span>
              </div>
              {isActive ? (
                <ChevronRight size={14} className="text-[#bef264]" />
              ) : item.badge ? (
                <div className="w-2 h-2 bg-[#bef264] rounded-full animate-pulse shadow-[0_0_5px_#bef264]"></div>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mx-4 mb-6 rounded-xl bg-gray-50 border border-gray-100 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 rounded-full shrink-0 shadow-inner">USR</div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-black uppercase truncate text-black tracking-tighter">{memberId}</p>
            <p className="text-[8px] text-lime-600 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse"></span> ONLINE
            </p>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <LogoutIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
