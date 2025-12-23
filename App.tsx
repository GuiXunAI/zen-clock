
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import FlipUnit from './components/FlipUnit';
import DateInfo from './components/DateInfo';
import Footer from './components/Footer';
import ToolsOverlay from './components/ToolsOverlay';

export type AppMode = 'clock' | 'countdown' | 'stopwatch' | 'alarm' | 'world';

export interface CityInfo {
  name: string;
  zone: string;
}

const DEFAULT_ALARM_URL = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';

const STATIC_QUOTES = [
  "时间是伟大的作者，她能写出未来的结局。",
  "一寸光阴一寸金，寸金难买寸光阴。",
  "逝者如斯夫，不舍昼夜。",
  "把握当下，便是对时间最好的尊重。",
  "你热爱生命吗？那么别浪费时间。",
  "昨日已成历史，明日还是未知。",
  "时间会平息一切纷争。",
  "平庸的人操心该怎么消磨时间。",
  "最严重的浪费是时间的浪费。",
  "专注当下，未来不期而至。",
  "静坐常思己过，闲谈莫论人非。",
  "心若不惊，岁月无恙。",
  "万物有时，一切都是最好的安排。",
  "与其沉迷过去，不如点亮现在。",
  "时间公平地分给每一个人。",
  "流水不争先，争的是滔滔不绝。",
  "纵有疾风起，人生不言弃。",
  "山中无甲子，寒尽不知年。",
  "当下的每一秒，都是余生最年轻的时刻。",
  "时间终究会证明一切。",
  "在时间的废墟中，寻找永恒的瞬间。",
  "所谓的英雄，就是超越时间的人。",
  "不乱于心，不困于情，不畏将来，不念过往。",
  "愿你历尽千帆，归来仍是少年。",
  "慢下来，是为了更快地到达。",
  "生活不在别处，就在每一个当下。",
  "时间能治愈一切，也能遗忘一切。",
  "此时此刻，即是永恒。",
  "世界原本简单，复杂的是人心。",
  "你若盛开，蝴蝶自来；你若精彩，天自安排。",
  "时间是一场有去无回的旅行。"
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('clock');
  const [time, setTime] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState<CityInfo | null>(null);
  const [insight, setInsight] = useState<string>(STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)]);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const [countdownTarget, setCountdownTarget] = useState<number>(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [alarms, setAlarms] = useState<{id: string, time: string, active: boolean}[]>([]);
  const [customAlarmUrl, setCustomAlarmUrl] = useState<string | null>(null);
  const lastAlarmMinute = useRef<string>('');
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    alarmAudio.current = new Audio(customAlarmUrl || DEFAULT_ALARM_URL);
    alarmAudio.current.loop = true;
    
    const primeAudio = () => {
      if (alarmAudio.current) {
        alarmAudio.current.play().then(() => {
          alarmAudio.current?.pause();
          if (alarmAudio.current) alarmAudio.current.currentTime = 0;
        }).catch(() => {});
      }
      window.removeEventListener('mousedown', primeAudio);
      window.removeEventListener('touchstart', primeAudio);
    };
    window.addEventListener('mousedown', primeAudio);
    window.addEventListener('touchstart', primeAudio);

    return () => {
      window.removeEventListener('mousedown', primeAudio);
      window.removeEventListener('touchstart', primeAudio);
    };
  }, [customAlarmUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      if (isCountdownRunning && countdownTarget > 0) {
        setCountdownTarget(prev => {
          if (prev <= 1) {
            setIsCountdownRunning(false);
            alarmAudio.current?.play().catch(() => {});
            setTimeout(() => {
              alert('⏰ 倒计时结束！');
              alarmAudio.current?.pause();
              if (alarmAudio.current) alarmAudio.current.currentTime = 0;
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }

      if (isStopwatchRunning) {
        setStopwatchTime(prev => prev + 1);
      }

      const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      if (currentTimeStr !== lastAlarmMinute.current) {
        const triggeredAlarm = alarms.find(a => a.active && a.time === currentTimeStr);
        if (triggeredAlarm) {
          lastAlarmMinute.current = currentTimeStr;
          alarmAudio.current?.play().catch(e => console.error("Alarm Audio play blocked", e));
          setTimeout(() => {
             const confirm = window.confirm(`🔔 闹钟响了: ${triggeredAlarm.time}\n点击确认停止铃声`);
             if (confirm || !confirm) {
                alarmAudio.current?.pause();
                if (alarmAudio.current) alarmAudio.current.currentTime = 0;
             }
          }, 200);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCountdownRunning, countdownTarget, isStopwatchRunning, alarms]);

  const fetchDailyInsight = useCallback(async () => {
    setIsInsightLoading(true);
    const fallback = STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)];
    
    try {
      // 隐私增强：不发送 Cookie，不发送 Referrer，彻底杜绝追踪
      const response = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k', {
        method: 'GET',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      const quote = data.from_who 
        ? `${data.hitokoto} —— ${data.from_who}` 
        : `${data.hitokoto} —— 《${data.from}》`;
      
      setInsight(quote.length > 35 ? data.hitokoto : quote);
    } catch (error) {
      setInsight(fallback);
    } finally {
      setIsInsightLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyInsight();
  }, [fetchDailyInsight]);

  const displayTime = useMemo(() => {
    let h = '00', m = '00', s = '00';
    if (mode === 'clock' || mode === 'alarm' || mode === 'world') {
      const targetDate = selectedCity 
        ? new Date(time.toLocaleString('en-US', { timeZone: selectedCity.zone }))
        : time;
      h = targetDate.getHours().toString().padStart(2, '0');
      m = targetDate.getMinutes().toString().padStart(2, '0');
      s = targetDate.getSeconds().toString().padStart(2, '0');
    } else if (mode === 'countdown') {
      const total = countdownTarget;
      h = Math.floor(total / 3600).toString().padStart(2, '0');
      m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
      s = (total % 60).toString().padStart(2, '0');
    } else if (mode === 'stopwatch') {
      h = Math.floor(stopwatchTime / 3600).toString().padStart(2, '0');
      m = Math.floor((stopwatchTime % 3600) / 60).toString().padStart(2, '0');
      s = (stopwatchTime % 60).toString().padStart(2, '0');
    }
    return { h, m, s };
  }, [mode, time, countdownTarget, stopwatchTime, selectedCity]);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 select-none overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-8 md:gap-12">
        <div className="flex flex-col items-center gap-2">
          {selectedCity && (
            <span className="text-blue-400 text-xs md:text-sm uppercase tracking-[0.3em] font-bold mb-1">
              {selectedCity.name}
            </span>
          )}
          <DateInfo date={time} timezone={selectedCity?.zone} />
        </div>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-8 w-full justify-center">
          <FlipUnit value={displayTime.h} label="H" />
          <div className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-4 opacity-30">
            <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-white"></div>
          </div>
          <FlipUnit value={displayTime.m} label="M" />
          <div className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-4 opacity-30">
            <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-white"></div>
          </div>
          <FlipUnit value={displayTime.s} label="S" />
        </div>

        <div className="mt-4 md:mt-8 px-6 text-center max-w-xl min-h-[4rem] flex items-center justify-center">
          <p className="text-white/40 text-xs md:text-sm lg:text-base font-light tracking-widest leading-relaxed italic animate-pulse-slow">
            {isInsightLoading ? '载入中...' : insight}
          </p>
        </div>
      </div>

      <Footer 
        onRefresh={fetchDailyInsight} 
        onOpenTools={() => setIsToolsOpen(true)}
      />

      {isToolsOpen && (
        <ToolsOverlay 
          onClose={() => setIsToolsOpen(false)}
          mode={mode}
          setMode={setMode}
          countdownTarget={countdownTarget}
          setCountdownTarget={setCountdownTarget}
          isCountdownRunning={isCountdownRunning}
          setIsCountdownRunning={setIsCountdownRunning}
          stopwatchTime={stopwatchTime}
          setStopwatchTime={setStopwatchTime}
          isStopwatchRunning={isStopwatchRunning}
          setIsStopwatchRunning={setIsStopwatchRunning}
          alarms={alarms}
          setAlarms={setAlarms}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          customAlarmUrl={customAlarmUrl}
          setCustomAlarmUrl={setCustomAlarmUrl}
          testAlarm={() => {
            if (alarmAudio.current) {
              alarmAudio.current.currentTime = 0;
              alarmAudio.current.play();
              setTimeout(() => {
                alarmAudio.current?.pause();
                if (alarmAudio.current) alarmAudio.current.currentTime = 0;
              }, 3000);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
