
import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllAuthLogs, purgeUser } from '../services/dbService';
import { ShieldAlert, Users, History, Trash2, Search, ExternalLink, RefreshCcw } from 'lucide-react';

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
    if (confirm(`警告：即將抹除用戶 [${uid}] 的所有生理矩陣數據。此動作不可逆，確定執行？`)) {
      await purgeUser(uid);
      loadData();
    }
  };

  const filteredUsers = Object.values(users).filter((u: any) => 
    u.memberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-red-500/30 pb-8 gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-red-500 uppercase tracking-[0.4em] mb-2 animate-pulse">Root Access Level: High</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h2>
        </div>
        <button 
          onClick={loadData}
          className="bg-white/5 text-white border border-white/10 px-6 py-4 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all flex items-center gap-3"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 重新整理節點
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 會員清單 */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/5 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-mono font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
              <Users className="text-red-500" size={16} /> 會員矩陣註冊表
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={14} />
              <input 
                type="text" 
                placeholder="搜尋代號..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-black/40 border-white/5 text-[10px] font-bold py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-2">ID</th>
                  <th className="py-4 px-2">最後活動</th>
                  <th className="py-4 px-2">狀態</th>
                  <th className="py-4 px-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u: any) => (
                  <tr key={u.memberId} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-2 font-mono text-[#bef264] text-xs font-black">{u.memberId.toUpperCase()}</td>
                    <td className="py-4 px-2 text-[10px] text-gray-500 font-mono">{new Date(u.lastActive).toLocaleString()}</td>
                    <td className="py-4 px-2">
                      <span className="bg-[#bef264]/10 text-[#bef264] text-[8px] font-black px-2 py-0.5 border border-[#bef264]/30 uppercase">Active</span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => handleDelete(u.memberId)}
                        className="text-gray-700 hover:text-red-500 transition-colors p-2"
                        title="抹除數據"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 登入日誌 */}
        <div className="bg-[#141414] border border-white/5 p-8 flex flex-col h-[600px]">
          <h3 className="text-[11px] font-mono font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 mb-8">
            <History className="text-red-500" size={16} /> 存取日誌 (Audit Log)
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="p-4 bg-black/40 border-l-2 border-red-500/30 text-[9px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-white font-black">{log.memberId.toUpperCase()}</span>
                  <span className="text-gray-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-500 font-mono leading-tight truncate">{log.userAgent}</p>
                <p className="text-[8px] text-red-500/50 font-mono uppercase tracking-tighter">SUCCESSFUL_AUTH_PROTOCOL</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
