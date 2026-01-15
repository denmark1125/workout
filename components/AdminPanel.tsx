
import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser } from '../services/dbService';
import { ShieldAlert, Users, History, Trash2, Search, RefreshCcw, Lock } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [u, l] = await Promise.all([getAllUsers(), getAllAuthLogs()]);
    setUsers(u);
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (uid: string) => {
    if (confirm(`警告：即將抹除用戶 [${uid}] 的所有數據。此動作不可逆，確定執行？`)) {
      await purgeUser(uid);
      loadData();
    }
  };

  const filteredUsers = Object.values(users).filter((u: any) => 
    u.memberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-40 px-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-red-500/20 pb-8 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-red-500 uppercase tracking-[0.4em] mb-2">最高權限存取 (Root Access)</p>
          <h2 className="text-5xl font-black text-black tracking-tighter uppercase leading-none">戰略管理中心</h2>
        </div>
        <button 
          onClick={loadData}
          className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center gap-4 shadow-xl"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新節點狀態
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 會員列表 */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-10 space-y-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <h3 className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-4">
              <Users className="text-red-500" size={18} /> 會員矩陣註冊表
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="搜尋代號..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-[11px] font-bold py-3 pl-12 pr-4 outline-none focus:border-red-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="py-5 px-4">代號</th>
                  <th className="py-5 px-4">最後活動</th>
                  <th className="py-5 px-4">系統狀態</th>
                  <th className="py-5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u: any) => (
                  <tr key={u.memberId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-5 px-4 font-mono text-black text-sm font-black tracking-tight">{u.memberId.toUpperCase()}</td>
                    <td className="py-5 px-4 text-[11px] text-gray-400 font-mono">{new Date(u.lastActive).toLocaleString('zh-TW')}</td>
                    <td className="py-5 px-4">
                      <span className="bg-lime-400/10 text-lime-600 text-[9px] font-black px-3 py-1 border border-lime-400/20 uppercase">運作中</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <button 
                        onClick={() => handleDelete(u.memberId)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-3"
                        title="移除會員數據"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-300 font-black uppercase text-sm italic">無匹配節點數據</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 安全日誌 */}
        <div className="bg-white border border-gray-100 p-10 flex flex-col h-[650px] shadow-2xl">
          <h3 className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-4 mb-8">
            <Lock className="text-red-500" size={18} /> 安全存取日誌
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="p-5 bg-gray-50 border-l-4 border-red-500/20 text-[10px] space-y-2 group">
                <div className="flex justify-between">
                  <span className="text-black font-black uppercase tracking-tight">{log.memberId}</span>
                  <span className="text-gray-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('zh-TW')}</span>
                </div>
                <p className="text-gray-500 font-mono leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">{log.userAgent}</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-lime-400 rounded-full"></div>
                   <p className="text-[8px] text-gray-400 font-mono uppercase tracking-widest">授權通過 (AUTH_GRANTED)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
