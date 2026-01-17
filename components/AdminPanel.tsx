
import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser, syncToCloud, fetchFromCloud } from '../services/dbService';
import { UserProfile, FitnessGoal } from '../types';
import { 
  Users, Trash2, Search, RefreshCcw, Lock, 
  Edit3, X, Save, UserPlus, ShieldCheck, UserCircle, 
  Terminal, Activity, Key
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user'); // Added role state

  const [newMember, setNewMember] = useState({ id: '', name: '', password: '', gender: 'M' as 'M'|'F' });

  const loadData = async () => {
    setLoading(true);
    const [u, l] = await Promise.all([getAllUsers(), getAllAuthLogs()]);
    setUsers(u || {});
    setLogs(l || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (uid: string) => {
    if (uid === 'admin_roots') { alert("無法刪除根帳號。"); return; }
    if (confirm(`警告：確定抹除 [${uid}] 的所有數據？`)) {
      await purgeUser(uid);
      loadData();
    }
  };

  const startEdit = async (uid: string) => {
    const profile = await fetchFromCloud('profiles', uid);
    setEditingId(uid);
    setEditName(profile?.name || uid);
    setEditPass(''); // Don't show existing password for security, only if changing
    setEditRole(profile?.role || 'user'); // Load current role
  };

  const handleUpdate = async (uid: string) => {
    if (uid === 'admin_roots' && editRole !== 'admin') {
      alert("根帳號必須保留管理員權限。");
      return;
    }

    const profile = await fetchFromCloud('profiles', uid);
    const updated = { 
      ...profile, 
      name: editName.trim() || uid,
      role: editRole 
    };
    if (editPass.trim()) updated.password = editPass.trim();
    
    await syncToCloud('profiles', updated, uid);

    // 修正：手動更新本地 state，避免重新 loadData 造成畫面閃爍或跳動
    setUsers((prev: any) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        memberId: uid,
        name: updated.name,
        role: updated.role,
        lastActive: prev[uid]?.lastActive || new Date().toISOString()
      }
    }));
    
    setEditingId(null);
    // 移除 loadData() 以保持 UI 穩定
  };

  const handleAddMember = async () => {
    if (!newMember.id || !newMember.password) return;
    const profile: UserProfile = {
      memberId: newMember.id.toLowerCase(),
      name: newMember.name || newMember.id,
      password: newMember.password,
      gender: newMember.gender,
      age: 25, height: 175,
      goal: FitnessGoal.HYPERTROPHY,
      equipment: [], loginStreak: 0,
      role: 'user'
    };
    await syncToCloud('profiles', profile, profile.memberId);
    setShowAddModal(false);
    setNewMember({ id: '', name: '', password: '', gender: 'M' });
    loadData();
  };

  // 修正：加入 .sort() 確保列表順序固定，不會因狀態更新而亂跑
  const filteredUsers = Object.values(users)
    .filter((u: any) => 
      u.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => a.memberId.localeCompare(b.memberId));

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-40 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-black pb-8">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-black text-[#bef264] shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Root Terminal</p>
            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">健身成員管理</h2>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-[#bef264] hover:text-black transition-all flex items-center justify-center gap-4 shadow-xl rounded-none"
        >
          <UserPlus size={16} /> 新增成員
        </button>
      </header>

      <div className="flex bg-white border border-gray-100 p-2 items-center shadow-sm">
        <Search className="text-gray-300 ml-4" size={18} />
        <input 
          type="text" 
          placeholder="搜尋帳號..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent text-sm font-bold py-3 px-4 outline-none placeholder:text-gray-200" 
        />
        <button onClick={loadData} className="p-3 text-gray-300 hover:text-black transition-all">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white border border-gray-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fcfcfc] text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="py-6 px-10">身份 IDENTITY</th>
                <th className="py-6 px-10">角色權限 ROLE</th>
                <th className="py-6 px-10">密碼重置 SECURITY</th>
                <th className="py-6 px-10 text-right">執行 ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u: any) => {
                const isEditing = editingId === u.memberId;
                const isRoot = u.memberId === 'admin_roots';
                
                return (
                  <tr key={u.memberId} className={`transition-all ${isEditing ? 'bg-gray-50' : 'hover:bg-[#fcfcfc]'}`}>
                    <td className="py-8 px-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 flex items-center justify-center font-black text-[10px] border ${isRoot ? 'bg-black text-[#bef264]' : 'bg-gray-50 text-gray-400'}`}>
                          {isRoot ? 'ROOT' : 'USR'}
                        </div>
                        <div className="space-y-1">
                          {isEditing ? (
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="bg-white border-b-2 border-black px-0 py-1 text-lg font-black w-40 outline-none" />
                          ) : (
                            <p className="font-black text-black text-lg tracking-tighter uppercase">{isRoot ? (editName || '超級管理員') : (u.name || u.memberId)}</p>
                          )}
                          <p className="text-[9px] font-mono text-gray-300 uppercase tracking-widest">@{u.memberId}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Role Editing Section */}
                    <td className="py-8 px-10">
                      {isEditing && !isRoot ? (
                        <select 
                          value={editRole} 
                          onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                          className="bg-white border border-gray-300 text-sm font-bold py-2 px-3 outline-none focus:border-black"
                        >
                          <option value="user">USER (一般)</option>
                          <option value="admin">ADMIN (管理)</option>
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 text-[8px] font-black uppercase tracking-widest border ${u.role === 'admin' || isRoot ? 'border-black bg-black text-[#bef264]' : 'border-gray-100 bg-white text-gray-400'}`}>
                          {(u.role === 'admin' || isRoot) ? <Terminal size={10} /> : <UserCircle size={10} />}
                          {(u.role === 'admin' || isRoot) ? 'System Root' : 'Member'}
                        </div>
                      )}
                    </td>

                    <td className="py-8 px-10">
                      {isEditing ? (
                        <div className="flex items-center gap-3 bg-white border px-4 py-2">
                          <Key size={12} className="text-gray-300" />
                          <input type="text" value={editPass} onChange={e => setEditPass(e.target.value)} className="text-[10px] font-black w-32 outline-none" placeholder="輸入新密碼..." />
                        </div>
                      ) : (
                        <p className="text-[10px] font-black text-gray-300 flex items-center gap-2"><Lock size={10}/> ENCRYPTED</p>
                      )}
                    </td>

                    <td className="py-8 px-10 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <button onClick={() => handleUpdate(u.memberId)} className="w-10 h-10 bg-black text-[#bef264] flex items-center justify-center hover:bg-lime-400 hover:text-black"><Save size={16} /></button>
                        ) : (
                          <button onClick={() => startEdit(u.memberId)} className="w-10 h-10 text-gray-300 hover:text-black flex items-center justify-center"><Edit3 size={16} /></button>
                        )}
                        {!isRoot && <button onClick={() => handleDelete(u.memberId)} className="w-10 h-10 text-gray-200 hover:text-red-600 flex items-center justify-center"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md border-4 border-black p-10 space-y-8 animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-start">
               <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">新增成員</h3>
               <button onClick={() => setShowAddModal(false)} className="text-gray-300 hover:text-black"><X size={24}/></button>
             </div>
             <div className="space-y-6">
                {['id', 'name', 'password'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{field.toUpperCase()}</label>
                    <input 
                      value={(newMember as any)[field]} 
                      onChange={e => setNewMember({...newMember, [field]: e.target.value})} 
                      className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-black px-4 py-3 font-black outline-none" 
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
                <button onClick={handleAddMember} className="w-full bg-black text-white py-5 font-black text-xs tracking-[0.4em] hover:bg-[#bef264] hover:text-black transition-all uppercase">初始化連結</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
