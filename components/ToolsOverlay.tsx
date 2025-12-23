
import React, { useState, useRef } from 'react';
import { AppMode, CityInfo } from '../App';
import { GoogleGenAI } from '@google/genai';

interface ToolsOverlayProps {
  onClose: () => void;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  countdownTarget: number;
  setCountdownTarget: (n: number) => void;
  isCountdownRunning: boolean;
  setIsCountdownRunning: (b: boolean) => void;
  stopwatchTime: number;
  setStopwatchTime: (n: number) => void;
  isStopwatchRunning: boolean;
  setIsStopwatchRunning: (b: boolean) => void;
  alarms: {id: string, time: string, active: boolean}[];
  setAlarms: React.Dispatch<React.SetStateAction<{id: string, time: string, active: boolean}[]>>;
  selectedCity: CityInfo | null;
  setSelectedCity: (c: CityInfo | null) => void;
  customAlarmUrl: string | null;
  setCustomAlarmUrl: (url: string | null) => void;
  testAlarm: () => void;
}

const ToolsOverlay: React.FC<ToolsOverlayProps> = ({ 
  onClose, mode, setMode, 
  countdownTarget, setCountdownTarget, isCountdownRunning, setIsCountdownRunning,
  stopwatchTime, setStopwatchTime, isStopwatchRunning, setIsStopwatchRunning,
  alarms, setAlarms, selectedCity, setSelectedCity,
  customAlarmUrl, setCustomAlarmUrl, testAlarm
}) => {
  const [activeTab, setActiveTab] = useState<AppMode>(mode);
  const [worldCities, setWorldCities] = useState<CityInfo[]>([
    { name: '北京', zone: 'Asia/Shanghai' },
    { name: '纽约', zone: 'America/New_York' },
    { name: '伦敦', zone: 'Europe/London' },
    { name: '东京', zone: 'Asia/Tokyo' },
    { name: '巴黎', zone: 'Europe/Paris' },
    { name: '悉尼', zone: 'Australia/Sydney' },
    { name: '迪拜', zone: 'Asia/Dubai' },
    { name: '莫斯科', zone: 'Europe/Moscow' },
    { name: '新加坡', zone: 'Asia/Singapore' },
    { name: '洛杉矶', zone: 'America/Los_Angeles' },
  ]);
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (m: AppMode) => {
    setActiveTab(m);
    setMode(m);
  };

  const handleAddAlarm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const time = formData.get('time') as string;
    if (time) {
      setAlarms(prev => [...prev, { id: Date.now().toString(), time, active: true }]);
      e.currentTarget.reset();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAlarmUrl(url);
    }
  };

  const handleSearchWorld = async () => {
    if (!searchCity.trim()) return;
    
    // 如果没有配置 API_KEY，则不执行搜索，避免报错
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
      alert("当前未配置 API Key，暂不支持搜索全球时区。请手动在代码中添加。");
      return;
    }

    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Find the most standard IANA Timezone string for "${searchCity}". Respond ONLY with the timezone string like "Asia/Shanghai". If completely unknown, respond with "UTC".`;
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { systemInstruction: "你是一个地理信息专家。只输出IANA时区字符串。" }
      });
      const zone = result.text?.trim() || 'UTC';
      const newCity = { name: searchCity, zone };
      setWorldCities(prev => [newCity, ...prev.filter(c => c.name !== searchCity)].slice(0, 15));
      setSearchCity('');
    } catch (e) {
      console.error(e);
      alert("搜索失败，请重试。");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
        {/* Header Tabs */}
        <div className="flex border-b border-white/5 bg-black/40">
          {(['clock', 'countdown', 'stopwatch', 'alarm', 'world'] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-4 text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-300 font-bold ${
                activeTab === m ? 'text-blue-400 bg-blue-500/5' : 'text-white/20 hover:text-white/50'
              }`}
            >
              {m === 'clock' && '时钟'}
              {m === 'countdown' && '倒计时'}
              {m === 'stopwatch' && '秒表'}
              {m === 'alarm' && '闹钟'}
              {m === 'world' && '世界'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'countdown' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[1, 5, 10, 15, 30, 60].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => { setCountdownTarget(mins * 60); setIsCountdownRunning(true); onClose(); }}
                    className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl text-xs transition-colors border border-white/5"
                  >
                    {mins} 分钟
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">自定义秒数</p>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="输入秒数" 
                    className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                    onChange={(e) => setCountdownTarget(parseInt(e.target.value) || 0)}
                  />
                  <button 
                    onClick={() => { setIsCountdownRunning(!isCountdownRunning); if(!isCountdownRunning) onClose(); }}
                    className={`px-8 rounded-xl text-sm font-bold transition-all ${isCountdownRunning ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}
                  >
                    {isCountdownRunning ? '停止' : '开始'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stopwatch' && (
            <div className="flex flex-col items-center gap-10 py-4">
              <div className="text-6xl font-black font-mono tracking-tighter text-white/90">
                {Math.floor(stopwatchTime/3600).toString().padStart(2,'0')}:
                {Math.floor((stopwatchTime%3600)/60).toString().padStart(2,'0')}:
                {(stopwatchTime%60).toString().padStart(2,'0')}
              </div>
              <div className="flex gap-8">
                <button 
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isStopwatchRunning ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} hover:scale-105 active:scale-95 border border-current/10`}
                >
                  {isStopwatchRunning ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button 
                  onClick={() => { setStopwatchTime(0); setIsStopwatchRunning(false); }}
                  className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 text-white/40 border border-white/5"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'alarm' && (
            <div className="space-y-6">
              {/* Ringtone Selection */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">闹钟铃声</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={testAlarm}
                      className="text-[10px] px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                    >
                      试听
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors"
                    >
                      上传自定义
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/60 truncate">
                  {customAlarmUrl ? "🎵 自定义音频" : "🔔 默认警报音 (强烈)"}
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*"
                  onChange={handleFileUpload} 
                />
              </div>

              <form onSubmit={handleAddAlarm} className="flex gap-3">
                <input type="time" name="time" required className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                <button type="submit" className="bg-blue-500/10 text-blue-400 px-6 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all">添加</button>
              </form>
              
              <div className="space-y-3">
                {alarms.length === 0 && <p className="text-center py-8 text-white/10 text-sm">暂无闹钟</p>}
                {alarms.map(alarm => (
                  <div key={alarm.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                    <span className="text-2xl font-black font-mono tracking-tight">{alarm.time}</span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setAlarms(alarms.map(a => a.id === alarm.id ? {...a, active: !a.active} : a))}
                        className={`text-sm font-bold tracking-widest ${alarm.active ? 'text-blue-400' : 'text-white/20'}`}
                      >
                        {alarm.active ? '已开启' : '已关闭'}
                      </button>
                      <button onClick={() => setAlarms(alarms.filter(a => a.id !== alarm.id))} className="text-red-400/30 hover:text-red-400 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'world' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="搜索城市, 例如: 东京, 巴黎..." 
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchWorld()}
                  className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={handleSearchWorld}
                  disabled={isSearching}
                  className="bg-blue-500/10 text-blue-400 px-6 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-blue-500/20 transition-all"
                >
                  {isSearching ? '...' : '搜索'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { setSelectedCity(null); setMode('clock'); onClose(); }}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${!selectedCity ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                   <div className="text-left">
                     <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">系统时区 (本地)</p>
                     <p className="text-lg font-bold">本地时间</p>
                   </div>
                   {!selectedCity && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">当前使用</span>}
                </button>
                
                {worldCities.map(city => {
                   const isActive = selectedCity?.zone === city.zone;
                   const timeStr = new Intl.DateTimeFormat('zh-CN', {
                     timeZone: city.zone,
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: false
                   }).format(new Date());
                   
                   return (
                     <div key={city.zone + city.name} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                       <div className="flex flex-col">
                         <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{city.name}</span>
                         <span className="text-xl font-mono font-bold tracking-tight">{timeStr}</span>
                       </div>
                       <button 
                        onClick={() => { setSelectedCity(city); setMode('world'); onClose(); }}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                       >
                         {isActive ? '正在使用' : '设为显示'}
                       </button>
                     </div>
                   )
                })}
              </div>
            </div>
          )}

          {activeTab === 'clock' && (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-blue-500/5 rounded-full flex items-center justify-center text-blue-500/40">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <p className="text-white/30 text-sm font-light tracking-widest">
                当前处于禅定翻页时钟模式。
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">ZEN CLOCK v2.2</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            完成并退出
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolsOverlay;
