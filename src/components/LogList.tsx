import React, { useState, useMemo } from 'react';
import { TeachingLog, Subject, FilterState } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Printer, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Users, 
  Sparkles,
  Calendar as CalendarIcon,
  BookOpen,
  CheckCircle2,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { TeachingLogCalendar } from './TeachingLogCalendar';

interface LogListProps {
  logs: TeachingLog[];
  subjects: Subject[];
  onOpenNewLog: () => void;
  onOpenNewLogWithDate?: (dateStr: string) => void;
  onOpenLogDetail: (log: TeachingLog) => void;
  onEditLog: (log: TeachingLog) => void;
  onPrintLog: (log: TeachingLog) => void;
  onDuplicateLog: (log: TeachingLog) => void;
  onDeleteLog: (logId: string) => void;
}

export const LogList: React.FC<LogListProps> = ({
  logs,
  subjects,
  onOpenNewLog,
  onOpenNewLogWithDate,
  onOpenLogDetail,
  onEditLog,
  onPrintLog,
  onDuplicateLog,
  onDeleteLog,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    subjectId: 'all',
    className: 'all',
    dateRange: 'all',
    status: 'all',
  });

  // Extract all unique class names across subjects
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach(s => s.classes.forEach(c => set.add(c)));
    return Array.from(set);
  }, [subjects]);

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesQuery = 
          log.topic.toLowerCase().includes(q) ||
          log.unitTitle.toLowerCase().includes(q) ||
          log.subjectName.toLowerCase().includes(q) ||
          log.subjectCode.toLowerCase().includes(q) ||
          log.reflection.outcomes.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Subject
      if (filter.subjectId !== 'all') {
        if (log.subjectId !== filter.subjectId && log.subjectCode !== filter.subjectId) {
          return false;
        }
      }

      // Class Name
      if (filter.className !== 'all') {
        if (log.className !== filter.className) return false;
      }

      // Status
      if (filter.status !== 'all') {
        if (log.status !== filter.status) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filter]);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>รายการบันทึกการสอน (Lesson Recording Logs)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ค้นหา ตรวจสอบ พิมพ์รายงานแบบเป็นทางการ เลือกดูแบบปฏิทิน หรือแก้ไขข้อมูลการจัดกิจกรรมการเรียนรู้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>รายการ/การ์ด</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>ปฏิทินบันทึกสอน</span>
            </button>
          </div>

          <button
            id="loglist-new-btn"
            onClick={onOpenNewLog}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มบันทึกการสอน</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <TeachingLogCalendar
          logs={logs}
          onOpenNewLogWithDate={onOpenNewLogWithDate || ((d) => onOpenNewLog())}
          onOpenLogDetail={onOpenLogDetail}
          onEditLog={onEditLog}
          onPrintLog={onPrintLog}
          onDuplicateLog={onDuplicateLog}
          onDeleteLog={onDeleteLog}
        />
      ) : (
        <>
          {/* Filter Bar */}
      <div className="liquid-glass p-4 rounded-3xl border border-white/70 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อเรื่อง วิชา หรือบันทึกหลังสอน..."
              value={filter.searchQuery}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl liquid-glass-input focus:outline-none"
            />
          </div>

          {/* Subject Select */}
          <div>
            <select
              value={filter.subjectId}
              onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700"
            >
              <option value="all">ทุกรายวิชา</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Class Select */}
          <div>
            <select
              value={filter.className}
              onChange={(e) => setFilter({ ...filter, className: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700"
            >
              <option value="all">ทุกห้องเรียน</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  ห้อง {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="completed">เสร็จสมบูรณ์</option>
              <option value="draft">ฉบับร่าง</option>
            </select>
          </div>

        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>พบทั้งหมด <strong className="text-slate-900">{filteredLogs.length}</strong> รายการบันทึก</span>
          {(filter.searchQuery || filter.subjectId !== 'all' || filter.className !== 'all' || filter.status !== 'all') && (
            <button
              onClick={() => setFilter({ searchQuery: '', subjectId: 'all', className: 'all', dateRange: 'all', status: 'all' })}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              ล้างการกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Logs Grid */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">ไม่พบรายการบันทึกการสอน</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา ตัวกรองวิชา หรือเพิ่มบันทึกการสอนรายการใหม่
          </p>
          <button
            onClick={onOpenNewLog}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
          >
            + บันทึกการสอนใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="liquid-glass rounded-3xl border border-white/70 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                      {log.subjectCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {log.subjectName} ({log.className})
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    log.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {log.status === 'completed' ? 'สมบูรณ์' : 'ฉบับร่าง'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                      onClick={() => onOpenLogDetail(log)}>
                    {log.topic}
                  </h3>
                  <p className="text-xs text-slate-500">{log.unitTitle}</p>
                </div>
              </div>

              {/* Teaching Reflection Snippet */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ผลการเรียนรู้:</span>
                </div>
                <p className="text-slate-600 line-clamp-2 leading-relaxed">
                  {log.reflection.outcomes}
                </p>
              </div>

              {/* Stats & Tools Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.date} ({log.period})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>มาเรียน {log.studentStats.presentCount}/{log.studentStats.totalCount} คน</span>
                  </span>
                </div>
              </div>

              {/* Actions Button Bar */}
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
                    className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 shadow-xs"
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
        </>
      )}

    </div>
  );
};
