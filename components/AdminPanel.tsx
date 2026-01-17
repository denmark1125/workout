
import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser, syncToCloud, fetchFromCloud } from '../services/dbService';
import { UserProfile, FitnessGoal, FoodItem } from '../types';
import { FOOD_DATABASE } from '../utils/foodDatabase';
import { 
  Users, Trash2, Search, RefreshCcw, Lock, 
  Edit3, X, Save, UserPlus, ShieldCheck, UserCircle, 
  Terminal, Activity, Key, Utensils, CheckCircle
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'USERS' | 'FOODS'>('USERS');

  // 模擬自定義食物列表
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [u] = await Promise.all([getAllUsers()]);
    setUsers(u || {});
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsers = useMemo(() => {
    return Object.values(users)
      .filter((u: any) => u.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a: any, b: any) => a.memberId.localeCompare(b.memberId));
  }, [users, searchTerm]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-40 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-black pb-8">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-black text-[#bef264] shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Root Terminal</p>
            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">管理中心</h2>
          </div>
        </div>
      </header>

      <div className="flex border-b border-gray-100">
         <button onClick={() => setActiveView('USERS')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeView === 'USERS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>成員管理</button>
         <button onClick={() => setActiveView('FOODS')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeView === 'FOODS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>飲食資料庫審核</button>
      </div>

      {activeView === 'USERS' ? (
        <div className="space-y-6">
           <div className="flex bg-white border border-gray-100 p-2 items-center shadow-sm">
            <Search className="text-gray-300 ml-4" size={18} />
            <input 
              type="text" placeholder="搜尋帳號..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold py-3 px-4 outline-none placeholder:text-gray-200" 
            />
          </div>
          <div className="bg-white border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                  <tr>
                     <th className="p-6">成員 IDENTITY</th>
                     <th className="p-6">權限 ROLE</th>
                     <th className="p-6 text-right">ACTION</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.memberId}>
                       <td className="p-6">
                          <p className="font-black text-lg text-black">{u.name || u.memberId}</p>
                          <p className="text-[10px] font-mono text-gray-400">@{u.memberId}</p>
                       </td>
                       <td className="p-6">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase border ${u.role === 'admin' ? 'bg-black text-[#bef264] border-black' : 'text-gray-400 border-gray-100'}`}>
                             {u.role || 'USER'}
                          </span>
                       </td>
                       <td className="p-6 text-right">
                          <button className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-white border border-gray-100 p-8 space-y-6 shadow-xl">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                 <Utensils size={24} /> 待審核食物清單
              </h3>
              <p className="text-gray-400 text-sm font-bold italic">David 管理提醒：請務必核對營養成分之合理性，避免錯誤數據進入全局資料庫。</p>
              
              <div className="grid grid-cols-1 gap-4">
                 {FOOD_DATABASE.slice(0, 3).map(food => (
                    <div key={food.id} className="flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-sm">
                       <div>
                          <p className="text-lg font-black text-black">{food.name}</p>
                          <p className="text-xs text-gray-400">來源: {food.source || '用戶自建'} • {food.macros.calories} kcal</p>
                       </div>
                       <div className="flex gap-4">
                          <button className="flex items-center gap-2 px-6 py-2 bg-black text-[#bef264] text-[10px] font-black uppercase hover:bg-lime-400 hover:text-black transition-all shadow-md">
                             <CheckCircle size={14} /> 審核通過
                          </button>
                          <button className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
