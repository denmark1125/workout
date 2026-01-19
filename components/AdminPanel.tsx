
import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser } from '../services/dbService.ts';
import { UserProfile, FitnessGoal, FoodItem } from '../types.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { 
  Users, Trash2, Search, RefreshCcw, ShieldCheck, 
  Utensils, CheckCircle, AlertTriangle, XCircle, Info, Tag, Store, User as UserIcon, ShieldAlert, Edit3, ShieldHalf, UserPlus
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
     alert("數據已校準，同步至全體矩陣中心。");
     setCurrentFoods(prev => prev.map(f => f.id === id ? { ...f, isPending: false } : f));
  };

  const updateFoodMacro = (id: string, field: string, value: string) => {
    setCurrentFoods(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, macros: { ...f.macros, [field]: parseInt(value) || 0 } };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-40 px-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-8 border-black pb-10">
        <div className="flex items-start gap-8">
          <div className="p-6 bg-black text-[#bef264] shadow-2xl">
            <ShieldCheck size={48} />
          </div>
          <div>
            <p className="text-xs font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Root Terminal System</p>
            <h2 className="text-5xl font-black text-black tracking-tighter uppercase leading-none">管理權限矩陣</h2>
          </div>
        </div>
      </header>

      <div className="flex border-b-4 border-gray-100 gap-10">
         <button onClick={() => setActiveView('USERS')} className={`px-10 py-6 text-sm font-black uppercase tracking-widest border-b-8 transition-all flex items-center gap-3 ${activeView === 'USERS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
           <Users size={20} /> 成員戰略清單
         </button>
         <button onClick={() => setActiveView('FOODS')} className={`px-10 py-6 text-sm font-black uppercase tracking-widest border-b-8 transition-all flex items-center gap-3 ${activeView === 'FOODS' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
           <Utensils size={20} /> 資料庫協作審核
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
                 <h4 className="text-lg font-black uppercase text-orange-900">審核注意：DB_SECURITY_PROTOCOL</h4>
                 <p className="text-sm font-bold text-orange-800">請監控由用戶協作新增的資料。檢查「建立者 ID」以識別信譽。惡意數值會影響全體數據矩陣的精準度。</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {currentFoods.map(food => (
                 <div key={food.id} className={`bg-white border-2 p-8 flex flex-col items-stretch gap-6 hover:border-black transition-all group rounded-2xl shadow-md ${food.isPending ? 'border-orange-200 ring-2 ring-orange-50' : 'border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-6 flex-1">
                          <div className={`w-20 h-20 text-black border flex items-center justify-center font-black text-[10px] shrink-0 transition-colors rounded-xl uppercase ${food.isPending ? 'bg-orange-100 border-orange-200' : 'bg-gray-50 border-gray-100 group-hover:bg-[#bef264]'}`}>{food.category}</div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-4">
                                <h4 className="text-2xl font-black text-black tracking-tight">{food.name}</h4>
                                {food.isPending && <span className="bg-orange-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">待審核</span>}
                             </div>
                             <div className="flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase"><UserPlus size={14} className="text-gray-300"/> 建立者: <span className="text-black">{food.createdBy || 'SYSTEM_CORE'}</span></div>
                                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest"><Tag size={12}/> {food.id}</div>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-3 w-full md:w-auto">
                          {food.isPending && (
                             <button onClick={() => handleApproveFood(food.id)} className="flex-1 md:flex-none px-8 py-4 bg-[#bef264] text-black text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-[#bef264] transition-all rounded-xl shadow-lg border-2 border-transparent">核准入庫</button>
                          )}
                          <button onClick={() => handleDeleteFood(food.id)} className="flex-1 md:flex-none px-8 py-4 border-2 border-red-50 text-red-400 hover:bg-red-50 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl">刪除作廢</button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                       {[
                         {l:'熱量 (K)', f:'calories'}, {l:'蛋白質 (G)', f:'protein'}, {l:'碳水 (G)', f:'carbs'}, {l:'脂肪 (G)', f:'fat'}
                       ].map(macro => (
                          <div key={macro.f} className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Edit3 size={10}/> {macro.l}</label>
                             <input 
                               type="number" 
                               value={food.macros[macro.f as keyof typeof food.macros]} 
                               onChange={(e) => updateFoodMacro(food.id, macro.f, e.target.value)}
                               className="w-full bg-white border border-gray-100 p-3 font-mono font-black text-lg rounded-lg outline-none focus:border-black"
                             />
                          </div>
                       ))}
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
