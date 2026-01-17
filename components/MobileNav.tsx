
import React, { useState } from 'react';
import { LayoutDashboard, Dumbbell, Camera, ScrollText, Settings as SettingsIcon, LogOut, Package, ShieldCheck, Menu, X, ChevronRight, Utensils } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onLogout, isAdmin = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 核心高頻功能 (常駐底部) - 增加飲食控制
  const primaryNav = [
    { id: 'dashboard', label: '數據', icon: <LayoutDashboard size={20} /> },
    { id: 'diet', label: '飲食', icon: <Utensils size={20} /> }, // New
    { id: 'journal', label: '訓練', icon: <Dumbbell size={20} /> },
    { id: 'scan', label: '診斷', icon: <Camera size={20} /> },
  ];

  // 次要功能 (收入選單)
  const secondaryNav = [
    { id: 'report', label: '戰略週報', icon: <ScrollText size={18} /> },
    { id: 'vault', label: '收藏金庫', icon: <Package size={18} /> },
    { id: 'settings', label: '系統設定', icon: <SettingsIcon size={18} /> },
    ...(isAdmin ? [{ id: 'admin', label: '管理後台', icon: <ShieldCheck size={18} /> }] : []),
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  // 判斷當前是否在次要功能頁面
  const isSecondaryActive = secondaryNav.some(item => item.id === activeTab);

  return (
    <>
      {/* Overlay Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="absolute bottom-20 right-4 left-4 bg-white border-2 border-black shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
             <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Extended Modules</span>
                <button onClick={() => setIsMenuOpen(false)}><X size={16} /></button>
             </div>
             <div className="p-2 grid grid-cols-1 gap-1">
                {secondaryNav.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center justify-between p-4 transition-all hover:bg-gray-50 border border-transparent ${activeTab === item.id ? 'bg-[#bef264] border-black text-black' : 'text-gray-600'}`}
                  >
                     <div className="flex items-center gap-4">
                       {item.icon}
                       <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                     </div>
                     {activeTab === item.id && <div className="w-2 h-2 bg-black rounded-full"></div>}
                  </button>
                ))}
                
                <div className="h-px bg-gray-100 my-1"></div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center justify-between p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                   <div className="flex items-center gap-4">
                     <LogOut size={18} />
                     <span className="text-xs font-black uppercase tracking-widest">系統登出 (DISCONNECT)</span>
                   </div>
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Bottom Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
        {/* Primary Items */}
        {primaryNav.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all relative ${
              activeTab === item.id ? 'text-black' : 'text-gray-300'
            }`}
          >
            {activeTab === item.id && (
               <div className="absolute top-0 inset-x-0 h-0.5 bg-black"></div>
            )}
            <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-100 mx-1"></div>

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all relative ${
            isMenuOpen || isSecondaryActive ? 'text-black' : 'text-gray-300'
          }`}
        >
          {isSecondaryActive && !isMenuOpen && (
             <div className="absolute top-0 inset-x-0 h-0.5 bg-[#bef264]"></div>
          )}
          <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}>
             <Menu size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">更多</span>
        </button>
      </div>
    </>
  );
};

export default MobileNav;
