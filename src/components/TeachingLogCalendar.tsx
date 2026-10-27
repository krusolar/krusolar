import React, { useState, useMemo } from 'react';
import { TeachingLog } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Printer, 
  Trash2, 
  Users, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';

interface TeachingLogCalendarProps {
  logs: TeachingLog[];
  onOpenNewLogWithDate?: (dateStr: string) => void;
  onOpenLogDetail: (log: TeachingLog) => void;
  onEditLog: (log: TeachingLog) => void;
  onPrintLog: (log: TeachingLog) => void;
  onDuplicateLog: (log: TeachingLog) => void;
  onDeleteLog: (logId: string) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = [
  { short: 'อา', full: 'อาทิตย์', isWeekend: true },
  { short: 'จ', full: 'จันทร์', isWeekend: false },
  { short: 'อ', full: 'อังคาร', isWeekend: false },
  { short: 'พ', full: 'พุธ', isWeekend: false },
  { short: 'พฤ', full: 'พฤหัสบดี', isWeekend: false },
  { short: 'ศ', full: 'ศุกร์', isWeekend: false },
  { short: 'ส', full: 'เสาร์', isWeekend: true },
];

export const TeachingLogCalendar: React.FC<TeachingLogCalendarProps> = ({
  logs,
  onOpenNewLogWithDate,
  onOpenLogDetail,
  onEditLog,
  onPrintLog,
  onDuplicateLog,
  onDeleteLog,
}) => {
  // Current calendar month view state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11

  // Format today as YYYY-MM-DD string
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Selected date state (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Map logs by YYYY-MM-DD date string for O(1) fast lookup
  const logsByDate = useMemo(() => {
    const map: Record<string, TeachingLog[]> = {};
    logs.forEach((log) => {
      if (!map[log.date]) {
        map[log.date] = [];
      }
      map[log.date].push(log);
    });
    return map;
  }, [logs]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Build calendar matrix (days array)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      logs: TeachingLog[];
    }> = [];

    // Previous month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: prevDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        logs: logsByDate[dateStr] || []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        logs: logsByDate[dateStr] || []
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        logs: logsByDate[dateStr] || []
      });
    }

    return days;
  }, [currentYear, currentMonth, logsByDate, todayStr]);

  // Selected date logs list
  const selectedLogs = logsByDate[selectedDateStr] || [];

  // Monthly stats
  const monthlyLogsCount = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return logs.filter(l => l.date.startsWith(monthPrefix)).length;
  }, [logs, currentYear, currentMonth]);

  // Helper to format date nicely in Thai e.g. "23 กรกฎาคม 2569"
  const formatThaiDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10) + 543;
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${THAI_MONTHS[m] || ''} ${y}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Calendar Header Card */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/70 shadow-sm space-y-4">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <span>ปฏิทินบันทึกหลังการสอน</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {THAI_MONTHS[currentMonth]} {currentYear + 543}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกเลือกวันที่ในปฏิทินเพื่อดูรายการบันทึกการสอน หรือกดเพิ่มบันทึกสำหรับวันนั้นๆ
              </p>
            </div>
          </div>

          {/* Month Nav Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleGoToToday}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              title="ไปยังวันนี้"
            >
              วันนี้
            </button>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition-colors shadow-2xs"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-extrabold text-slate-800 min-w-[110px] text-center">
                {THAI_MONTHS[currentMonth]} {currentYear + 543}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition-colors shadow-2xs"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Month Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="font-semibold text-slate-700">มีบันทึกการสอน</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              <span className="font-semibold text-slate-700">วันที่เลือกอยู่</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-700">
              รวมในเดือนนี้: <strong className="text-indigo-600 font-extrabold">{monthlyLogsCount}</strong> คาบบันทึก
            </span>
          </div>
        </div>

        {/* Calendar Day Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-600 pb-1">
          {WEEKDAYS.map((wd) => (
            <div 
              key={wd.short} 
              className={`py-2 rounded-xl border ${wd.isWeekend ? 'bg-rose-50/60 text-rose-700 border-rose-100' : 'bg-slate-100/70 text-slate-700 border-slate-200/60'}`}
            >
              <span className="hidden sm:inline">{wd.full}</span>
              <span className="sm:hidden">{wd.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const hasLogs = cell.logs.length > 0;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md z-10'
                    : cell.isCurrentMonth
                    ? hasLogs 
                      ? 'bg-white hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/70'
                    : 'bg-slate-50/50 text-slate-300 border-slate-100 hover:bg-slate-100/50'
                }`}
              >
                {/* Cell Header: Day Number + Badges */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    cell.isToday
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isSelected
                      ? 'bg-indigo-200 text-indigo-900'
                      : cell.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}>
                    {cell.dayNum}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-md">
                      วันนี้
                    </span>
                  )}
                </div>

                {/* Log Indicators Inside Cell */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {hasLogs ? (
                    cell.logs.slice(0, 2).map((log) => (
                      <div
                        key={log.id}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate flex items-center justify-between border ${
                          log.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                        title={`${log.subjectCode} (${log.className}) ${log.topic}`}
                      >
                        <span className="truncate">{log.subjectCode} ({log.className})</span>
                      </div>
                    ))
                  ) : (
                    cell.isCurrentMonth && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center pt-2">
                        <span className="text-[10px] text-indigo-500 font-medium hover:underline">
                          + เพิ่ม
                        </span>
                      </div>
                    )
                  )}

                  {cell.logs.length > 2 && (
                    <div className="text-[9px] font-extrabold text-indigo-600 text-right pr-1">
                      +{cell.logs.length - 2} รายการ
                    </div>
                  )}
                </div>

                {/* Bottom Log Counter Pill */}
                {hasLogs && (
                  <div className="pt-1 flex justify-end">
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>{cell.logs.length} คาบ</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Date Log Details Container */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/70 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              <span>รายการบันทึกการสอนประจำวันที่</span>
              <span className="text-indigo-600 font-black">{formatThaiDateStr(selectedDateStr)}</span>
            </h3>
            <p className="text-xs text-slate-500">
              พบ {selectedLogs.length} รายการบันทึกจัดกิจกรรมการเรียนรู้ในวันนี้
            </p>
          </div>

          <button
            onClick={() => onOpenNewLogWithDate && onOpenNewLogWithDate(selectedDateStr)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มบันทึกการสอน (วันที่ {selectedDateStr})</span>
          </button>
        </div>

        {/* Selected Date Log Cards */}
        {selectedLogs.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">ไม่มีบันทึกการสอนในวันที่ {formatThaiDateStr(selectedDateStr)}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              คุณสามารถคลิกปุ่มด้านล่างเพื่อสร้างบันทึกการจัดกิจกรรมการเรียนรู้ย้อนหลังหรือล่วงหน้าสำหรับวันนี้ได้ทันที
            </p>
            <div className="pt-1">
              <button
                onClick={() => onOpenNewLogWithDate && onOpenNewLogWithDate(selectedDateStr)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มบันทึกการสอนสำหรับวันนี้</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                        {log.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {log.subjectName} (ห้อง {log.className})
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      log.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {log.status === 'completed' ? 'สมบูรณ์' : 'ฉบับร่าง'}
                    </span>
                  </div>

                  <div>
                    <h4 
                      onClick={() => onOpenLogDetail(log)}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {log.topic}
                    </h4>
                    <p className="text-xs text-slate-500">{log.unitTitle}</p>
                  </div>
                </div>

                {/* Reflection snippet */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="font-bold text-slate-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ผลการจัดการเรียนรู้:</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">
                    {log.reflection.outcomes}
                  </p>
                </div>

                {/* Period & Attendance */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center space-x-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{log.period}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-bold text-emerald-700">
                    <Users className="w-3.5 h-3.5" />
                    <span>มาเรียน {log.studentStats.presentCount}/{log.studentStats.totalCount} คน</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onOpenLogDetail(log)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 text-xs font-medium flex items-center space-x-1"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">ดูรายละเอียด</span>
                    </button>

                    <button
                      onClick={() => onEditLog(log)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 text-xs font-medium flex items-center space-x-1"
                      title="แก้ไข"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">แก้ไข</span>
                    </button>

                    <button
                      onClick={() => onDuplicateLog(log)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 text-xs font-medium flex items-center space-x-1"
                      title="คัดลอกเป็นบันทึกใหม่"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">คัดลอก</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPrintLog(log)}
                      className="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 shadow-xs"
                      title="พิมพ์แบบฟอร์มบันทึกหลังสอนเป็นทางการ (A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์ A4</span>
                    </button>

                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
