import React, { useState } from 'react';
import { TeachingLog, Gradebook, Subject, Student, TeacherProfile } from '../types';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  Award, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { exportPP5ToExcel, exportAllPP5ToExcel } from '../utils/pp5ExcelExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TeachingLog[];
  onResetData: () => void;
  gradebooks?: Gradebook[];
  subjects?: Subject[];
  students?: Student[];
  profile?: TeacherProfile;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  logs,
  onResetData,
  gradebooks = [],
  subjects = [],
  students = [],
  profile = {
    name: 'ครูผู้สอน',
    position: 'ครู',
    academicStanding: '',
    schoolName: 'โรงเรียน',
    department: 'วิทยาศาสตร์และเทคโนโลยี',
    academicYear: '2567',
    term: '1'
  }
}) => {
  const [selectedGbId, setSelectedGbId] = useState<string>(gradebooks[0]?.id || '');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EduLog_TeachingLogs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotice('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ');
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Period", "SubjectCode", "SubjectName", "GradeLevel", "Class", "Topic", "Outcomes", "Problems", "Solutions"];
    const rows = logs.map(l => [
      l.id,
      l.date,
      `"${l.period}"`,
      l.subjectCode,
      `"${l.subjectName}"`,
      l.gradeLevel,
      l.className,
      `"${l.topic}"`,
      `"${l.reflection.outcomes.replace(/"/g, '""')}"`,
      `"${l.reflection.problems.replace(/"/g, '""')}"`,
      `"${l.reflection.solutions.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `EduLog_TeachingLogs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotice('ดาวน์โหลดไฟล์บันทึกหลังสอน CSV สำเร็จ');
  };

  const handleExportSinglePP5 = () => {
    const targetGb = gradebooks.find(g => g.id === selectedGbId) || gradebooks[0];
    if (!targetGb) {
      alert('ไม่พบข้อมูลสมุดบันทึกคะแนน');
      return;
    }
    const subj = subjects.find(s => s.id === targetGb.subjectId);
    exportPP5ToExcel({
      gradebook: targetGb,
      students,
      subject: subj,
      profile,
      academicYear: targetGb.academicYear || profile.academicYear,
      term: targetGb.term || profile.term
    });
    triggerNotice(`ส่งออกไฟล์ ปพ.5 (${targetGb.className}) สำเร็จ`);
  };

  const handleExportAllPP5 = () => {
    if (gradebooks.length === 0) {
      alert('ยังไม่มีข้อมูลสมุดบันทึกคะแนน');
      return;
    }
    exportAllPP5ToExcel({
      gradebooks,
      students,
      subjects,
      profile,
      academicYear: profile.academicYear,
      term: profile.term
    });
    triggerNotice(`ส่งออกไฟล์ ปพ.5 รวมทุกห้องเรียน (${gradebooks.length} ห้อง) สำเร็จ`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 text-xs sm:text-sm max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <span>สำรองข้อมูล & ส่งออกเอกสารทางการ</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {exportNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center space-x-2 animate-fadeIn text-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* Section 1: PP.5 Excel Export */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-950">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span className="font-black text-sm">ส่งออกเอกสารรายงาน ปพ.5 (Excel .xlsx)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900">
                มาตรฐาน ศธ.
              </span>
            </div>
            
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              ไฟล์ Excel (.xlsx) จัดรูปแบบตารางสรุปคะแนน สัดส่วน 70:30, ตารางแจกแจงเกรด 0-4, และช่องลงลายมือชื่อถูกต้องตามระเบียบ
            </p>

            {gradebooks.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedGbId}
                    onChange={(e) => setSelectedGbId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {gradebooks.map(gb => (
                      <option key={gb.id} value={gb.id}>
                        {gb.subjectCode} - ห้อง {gb.className} (ปี {gb.academicYear || profile.academicYear})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportSinglePP5}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดห้องนี้</span>
                  </button>
                </div>

                {gradebooks.length > 1 && (
                  <button
                    onClick={handleExportAllPP5}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ส่งออกรวมทุกห้องเรียน ({gradebooks.length} ห้องใน 1 ไฟล์)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ยังไม่มีข้อมูลสมุดบันทึกคะแนนในระบบ
              </div>
            )}
          </div>

          {/* Section 2: Teaching Logs Export */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              ส่งออกบันทึกการสอน (Teaching Logs)
            </label>

            <button
              onClick={handleExportCSV}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl font-semibold flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <div className="text-left">
                  <div className="font-bold text-xs">บันทึกหลังสอน (CSV สำหรับ Excel)</div>
                  <div className="text-[11px] text-slate-500 font-normal">ตารางข้อมูลบันทึกหลังสอน ({logs.length} รายการ)</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl font-semibold flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <div className="text-left">
                  <div className="font-bold text-xs">สำรองข้อมูลแบบ JSON Backup</div>
                  <div className="text-[11px] text-slate-500 font-normal">ไฟล์สำรองฐานข้อมูลดิบทั้งหมด</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              if (confirm('คุณต้องการรีเซ็ตฐานข้อมูลเป็นข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?')) {
                onResetData();
                onClose();
              }
            }}
            className="w-full py-2 px-3 text-xs text-slate-500 hover:text-rose-600 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น</span>
          </button>
        </div>

      </div>
    </div>
  );
};
