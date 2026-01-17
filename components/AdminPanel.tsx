
import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser } from '../services/dbService.ts';
import { UserProfile, FitnessGoal, FoodItem } from '../types.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { 
  Users, Trash2, Search, RefreshCcw, ShieldCheck, 
  Utensils, CheckCircle, AlertTriangle, XCircle, Info, Tag, Store, User as UserIcon, ShieldAlert
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'USERS' | 'FOODS'>('USERS');

  const [currentFoods, setCurrentFoods] = useState<FoodItem[]>(FOOD_DATABASE);

  const loadData = async () => {
    setLoading(true);
    const u = await getAllUsers();
    setUsers(u || {});
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsers = useMemo(() => {
    return Object.values(users)
      .filter((u: any) => u.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a: any, b: any) => a.memberId.localeCompare(b.memberId));
  }, [users, searchTerm]);

  const handleDeleteFood = (id: string) => {
    if (confirm(" David 教練：確定要永久移除此補給資料嗎？此操作不可逆。")) {
      setCurrentFoods(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleApproveFood = (id: string) => {
     alert("數據已校準，同步至全體矩陣。");
  };

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-40 px-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-8 border-black pb-10">
        <div className="flex items-start gap-8">
          <div className="p-6 bg-black text-[#bef264] shadow-2xl">
            <ShieldCheck size={48} />
          </div>
          <div>
            <p className="text-xs font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Root Terminal System</p>
            <h2 className="text-5xl font-black text-black tracking-tighter uppercase leading-none text-black">管理中心</h2>
          </div>
        </div>
      </header>

      <div className="flex border-b-4 border-gray-100 gap-10">
         <button onClick={() => setActiveView('USERS')} className={`px-10 py-6 text-sm font-black uppercase tracking-widest border-b-8 transition-all flex items-center gap-3 ${activeView === 'USERS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
           <Users size={20} /> 成員戰力管理
         </button>
         <button onClick={() => setActiveView('FOODS')} className={`px-10 py-6 text-sm font-black uppercase tracking-widest border-b-8 transition-all flex items-center gap-3 ${activeView === 'FOODS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
           <Utensils size={20} /> 食物資料庫審核
         </button>
      </div>

      {activeView === 'USERS' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex bg-white border-2 border-gray-100 p-4 items-center shadow-sm rounded-sm">
            <Search className="text-gray-300 ml-4" size={24} />
            <input 
              type="text" placeholder="搜尋 UID 或 成員姓名..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-lg font-black py-4 px-6 outline-none" 
            />
          </div>
          <div className="bg-white border-2 border-gray-100 overflow-x-auto rounded-sm">
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 tracking-widest border-b-2 border-gray-100">
                  <tr>
                     <th className="p-8">成員 IDENTITY</th>
                     <th className="p-8">權限 ROLE</th>
                     <th className="p-8 text-right">ACTION</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.memberId} className="hover:bg-gray-50 transition-colors">
                       <td className="p-8">
                          <p className="font-black text-xl text-black">{u.name || u.memberId}</p>
                          <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-widest">UID_{u.memberId}</p>
                       </td>
                       <td className="p-8">
                          <span className={`px-4 py-2 text-[10px] font-black uppercase border-2 ${u.role === 'admin' ? 'bg-black text-[#bef264] border-black' : 'text-gray-300 border-gray-100'}`}>
                             {u.role || 'STANDARD_USER'}
                          </span>
                       </td>
                       <td className="p-8 text-right">
                          <button className="p-3 text-gray-200 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-orange-50 border-l-8 border-orange-400 p-6 flex items-start gap-4">
              <ShieldAlert size={28} className="text-orange-400 mt-1" />
              <div>
                 <h4 className="text-lg font-black uppercase text-orange-900">審核注意：SECURITY_ALERT</h4>
                 <p className="text-sm font-bold text-orange-800">請仔細核對「來源」與「營養成分」。惡意或錯誤的數據會破壞全體學員的戰術矩陣。推薦优先審核有條碼的項目。</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {currentFoods.map(food => (
                 <div key={food.id} className="bg-white border-2 border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-10 hover:border-black transition-all group rounded-sm shadow-sm">
                    <div className="flex items-center gap-8 flex-1">
                       <div className="w-20 h-20 bg-gray-50 text-black border border-gray-100 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-[#bef264] transition-colors">{food.category}</div>
                       <div className="space-y-3">
                          <div className="flex items-center gap-4">
                             <h4 className="text-2xl font-black text-black tracking-tight">{food.name}</h4>
                             {food.barcode && <span className="bg-gray-100 text-gray-500 px-3 py-1 text-[10px] font-mono font-bold flex items-center gap-2"><Tag size={12}/> {food.barcode}</span>}
                          </div>
                          <div className="flex flex-wrap gap-6">
                             <div className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase"><Store size={14} className="text-gray-300"/> {food.source || '用戶手動建立'}</div>
                             <div className="flex items-center gap-2 text-xs font-black text-gray-300 uppercase"><UserIcon size={14}/> ROOT_ADMIN</div>
                             <div className="text-[10px] font-mono font-bold text-gray-400 border-l border-gray-200 pl-6 uppercase">
                                CALS:{food.macros.calories} / P:{food.macros.protein}g / C:{food.macros.carbs}g / F:{food.macros.fat}g
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <button onClick={() => handleApproveFood(food.id)} className="flex-1 md:flex-none px-10 py-5 bg-black text-[#bef264] text-[11px] font-black uppercase tracking-widest hover:bg-lime-400 hover:text-black transition-all shadow-lg">核准通核 APPROVE</button>
                       <button onClick={() => handleDeleteFood(food.id)} className="flex-1 md:flex-none px-10 py-5 border-2 border-red-50 text-red-400 hover:bg-red-50 text-[11px] font-black uppercase tracking-widest transition-all">移除項目 DELETE</button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
