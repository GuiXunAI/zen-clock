
import React from 'react';

interface DateInfoProps {
  date: Date;
  timezone?: string;
}

const DateInfo: React.FC<DateInfoProps> = ({ date, timezone }) => {
  // Use the timezone for calculations if provided, otherwise local
  const targetDate = timezone 
    ? new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    : date;

  // Format Gregorian Date
  const formattedDate = targetDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format Weekday
  const weekday = targetDate.toLocaleDateString('zh-CN', { weekday: 'long' });

  const getLunarDayString = (day: number): string => {
    const chineseNumbers = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    if (day <= 10) return "初" + (day === 10 ? "十" : chineseNumbers[day]);
    if (day < 20) return "十" + chineseNumbers[day % 10];
    if (day === 20) return "二十";
    if (day < 30) return "廿" + (day % 10 === 0 ? "十" : chineseNumbers[day % 10]);
    if (day === 30) return "三十";
    return day.toString();
  };

  const getLunarMonthString = (month: number): string => {
    const months = ["", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
    return months[month] || `${month}月`;
  };

  // Get Lunar components
  const lunarParts = new Intl.DateTimeFormat('zh-u-ca-chinese', {
    month: 'numeric',
    day: 'numeric',
    timeZone: timezone // Ensure lunar also reflects the timezone
  }).formatToParts(date);

  const monthVal = parseInt(lunarParts.find(p => p.type === 'month')?.value || '1', 10);
  const dayVal = parseInt(lunarParts.find(p => p.type === 'day')?.value || '1', 10);

  const lunarMonthStr = getLunarMonthString(monthVal);
  const lunarDayStr = getLunarDayString(dayVal);
  const lunarInfo = `${lunarMonthStr}${lunarDayStr}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/60 tracking-widest">
      <span className="font-medium text-white/80">{formattedDate}</span>
      <span className="w-px h-3 md:h-4 bg-white/20 hidden sm:block"></span>
      <span className="text-white/40">{lunarInfo}</span>
      <span className="w-px h-3 md:h-4 bg-white/20 hidden sm:block"></span>
      <span className="text-white/50">{weekday}</span>
    </div>
  );
};

export default DateInfo;
