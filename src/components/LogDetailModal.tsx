import React from 'react';
import { TeachingLog } from '../types';
import { 
  X, 
  Printer, 
  Edit, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb,
  FileText,
  Share2
} from 'lucide-react';

interface LogDetailModalProps {
  log: TeachingLog | null;
  onClose: () => void;
  onEdit: (log: TeachingLog) => void;
  onPrint: (log: TeachingLog) => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({
  log,
  onClose,
  onEdit,
  onPrint,
}) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {log.subjectCode}
              </span>
              <span className="text-xs text-slate-400">ห้องเรียน {log.className}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{log.topic}</h2>
            <p className="text-xs text-slate-400">{log.unitTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-800">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">วันที่สอน</span>
              <span className="font-bold text-slate-900 flex items-center mt-0.5">
                <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-600" /> {log.date}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">คาบเรียน</span>
              <span className="font-semibold text-slate-900 flex items-center mt-0.5">
                <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" /> {log.period}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">การเข้าเรียน</span>
              <span className="font-bold text-emerald-700 flex items-center mt-0.5">
                <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {log.studentStats.presentCount}/{log.studentStats.totalCount} คน
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">เทคนิคการสอน</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {log.teachingMethod}
              </span>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>ตัวชี้วัด / จุดประสงค์การเรียนรู้</span>
            </h4>
            <ul className="space-y-1.5 pl-2">
              {log.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start space-x-2 text-slate-700 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reflection Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>บันทึกหลังการจัดกิจกรรมการเรียนรู้</span>
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                <span className="font-bold text-emerald-900 text-xs flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  1. ผลการจัดการเรียนรู้
                </span>
                <p className="text-slate-700 text-xs leading-relaxed pl-5">
                  {log.reflection.outcomes}
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-1">
                <span className="font-bold text-rose-900 text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600" />
                  2. ปัญหา / อุปสรรค
                </span>
                <p className="text-slate-700 text-xs leading-relaxed pl-5">
                  {log.reflection.problems}
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-1">
                <span className="font-bold text-indigo-900 text-xs flex items-center">
                  <Lightbulb className="w-4 h-4 mr-1.5 text-indigo-600" />
                  3. ข้อเสนอแนะ / แนวทางการแก้ไข
                </span>
                <p className="text-slate-700 text-xs leading-relaxed pl-5">
                  {log.reflection.solutions}
                </p>
              </div>
            </div>
          </div>

          {/* Attached Images */}
          {log.imageUrls && log.imageUrls.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                ภาพบรรยากาศการเรียนรู้ ({log.imageUrls.length} ภาพ)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {log.imageUrls.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
                    <img src={url} alt={`รูปภาพการเรียนรู้ที่ ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            ปิด
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(log);
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl flex items-center space-x-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>แก้ไขบันทึก</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onPrint(log);
              }}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center space-x-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แบบฟอร์ม A4</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
