
import React, { useState, useEffect, useMemo } from 'react';
import { getRecentAiLogs } from '../services/dbService.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Cpu, Zap, Activity, AlertCircle, Clock, Database, Terminal, ShieldAlert, BadgeDollarSign, Scissors } from 'lucide-react';

const AIConsole: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getRecentAiLogs(200);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const dailyData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const date = log.timestamp.substring(5, 10); 
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count })).reverse();
  }, [logs]);

  const modelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    logs.forEach(log => {
      const model = log.model.includes('flash') ? 'Flash (低成本)' : 
                    log.model.includes('pro') ? 'Pro (高成本)' : 
                    log.model.includes('vision') || log.model.includes('image') ? 'Vision (影像)' : '其他';
      stats[model] = (stats[model] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const COLORS = ['#bef264', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-40 px-4 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-8 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Resource Monitoring Terminal</p>
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none flex items-center gap-4">
             AI 指揮中心 <Cpu size={40} />
          </h2>
        </div>
        <div className="flex gap-3">
           <div className="bg-[#bef264] text-black px-4 py-2 flex items-center gap-2 rounded-sm font-black text-[10px] uppercase shadow-lg">
              <Scissors size={14} /> 已啟動圖片壓縮 (800PX)
           </div>
           <button onClick={fetchLogs} className="bg-black text-[#bef264] px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-lime-400 hover:text-black transition-all">
             重新整理數據
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 指標概覽 */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Activity size={18} /> 每日 AI 請求頻率 (7D TREND)
              </h3>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis dataKey="date" fontSize={10} fontStyle="bold" />
                       <YAxis fontSize={10} fontStyle="bold" />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0' }}
                          itemStyle={{ color: '#bef264', fontSize: '12px', fontWeight: '900' }}
                       />
                       <Line type="stepAfter" dataKey="count" stroke="#000" strokeWidth={4} dot={{ r: 6, fill: '#bef264' }} activeDot={{ r: 8 }} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-black text-white p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={80}/></div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-[#bef264] flex items-center gap-2">
                 <BadgeDollarSign size={18} /> 省錢操作指南 (COST_SAVING_PROTOCOL)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-4">
                    <div className="p-4 border-l-4 border-[#bef264] bg-white/5">
                       <p className="text-xs font-black text-[#bef264] uppercase">精簡傳輸 (IMAGE_OPTIM)</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1">系統會自動將圖片壓縮至 800x800px。請避免重複上傳相同的食物照片。</p>
                    </div>
                    <div className="p-4 border-l-4 border-blue-500 bg-white/5">
                       <p className="text-xs font-black text-blue-500 uppercase">限制圖片張數 (BATCH_LIMIT)</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1">飲食辨識建議單次不超過 3 張。圖片張數與 Token 消耗呈正比增加。</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-4 border-l-4 border-orange-500 bg-white/5">
                       <p className="text-xs font-black text-orange-500 uppercase">低成本 Flash 優先</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1">日常操作與美食推薦已強制使用 Flash 模型，這是目前最省錢的方案。</p>
                    </div>
                    <div className="p-4 border-l-4 border-red-500 bg-white/5">
                       <p className="text-xs font-black text-red-500 uppercase">Pro 模型節制使用</p>
                       <p className="text-[10px] text-gray-400 font-bold mt-1">「戰略週報」使用高成本 Pro 模型。建議一週生成 1 次即可掌握全局。</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 模型分佈 */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">模型資源佔用分佈</h3>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={modelStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {modelStats.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                       <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                 <Clock size={16} className="text-gray-400" />
                 <span className="text-[10px] font-black uppercase text-gray-400">最新 AI 行動日誌 (LAST 5)</span>
              </div>
              <div className="space-y-3">
                 {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="text-[10px] font-bold border-b border-gray-100 pb-2">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-black uppercase tracking-tighter">{log.feature}</span>
                          <span className={`px-1.5 py-0.5 rounded-sm ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {log.status}
                          </span>
                       </div>
                       <p className="text-gray-400 font-mono">{log.timestamp.substring(11, 19)} - {log.model.substring(0, 15)}...</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AIConsole;
