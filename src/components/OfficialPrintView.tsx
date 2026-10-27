import React, { useState, useMemo } from 'react';
import { TeachingLog, TeacherProfile, Subject, Student, Gradebook } from '../types';
import { 
  Printer, 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Award, 
  Users, 
  CheckCircle2, 
  XCircle, 
  BarChart2, 
  Filter,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  getLevelTypeFromGradeLevel, 
  getDefaultGradebookConfig, 
  calculateStudentGrade 
} from '../utils/gradeCalculator';
import { exportPP5ToExcel } from '../utils/pp5ExcelExport';

interface OfficialPrintViewProps {
  logs: TeachingLog[];
  profile: TeacherProfile;
  subjects: Subject[];
  students?: Student[];
  gradebooks?: Gradebook[];
  selectedLogId?: string | null;
  onBack: () => void;
}

export const OfficialPrintView: React.FC<OfficialPrintViewProps> = ({
  logs,
  profile,
  subjects,
  students = [],
  gradebooks = [],
  selectedLogId,
  onBack
}) => {
  // Report Mode: 'teaching_log' (บันทึกหลังกิจกรรม) | 'grades_summary' (คะแนนและผลการเรียน)
  const [reportType, setReportType] = useState<'teaching_log' | 'grades_summary'>('teaching_log');

  // Teaching Log State
  const [activeLogId, setActiveLogId] = useState<string>(selectedLogId || logs[0]?.id || '');
  const activeLog = logs.find(l => l.id === activeLogId) || logs[0];

  // Grade & Academic Performance State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  const availableClasses = useMemo(() => {
    if (!currentSubject) return ['ม.3/1'];
    return currentSubject.classes && currentSubject.classes.length > 0
      ? currentSubject.classes
      : ['ม.3/1'];
  }, [currentSubject]);

  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || 'ม.3/1');

  // Keep selectedClass synchronized if availableClasses changes
  React.useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  const [academicYear, setAcademicYear] = useState<string>(profile.academicYear || '2567');
  const [term, setTerm] = useState<'1' | '2' | 'yearly'>('1');

  const detectedLevelType = useMemo(() => {
    return getLevelTypeFromGradeLevel(currentSubject?.gradeLevel || 'ม.3');
  }, [currentSubject]);

  // Students in selected class
  const classStudents = useMemo(() => {
    return students
      .filter(st => st.className === selectedClass)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, selectedClass]);

  // Current Gradebook data for the subject & class
  const currentGradebook = useMemo(() => {
    const safeClassStr = selectedClass.replace(/[\/\\#?]/g, '-');
    const targetId = `${selectedSubjectId}_${safeClassStr}_${academicYear}_${detectedLevelType === 'primary' ? 'yearly' : term}`;
    const legacyId = `${selectedSubjectId}_${selectedClass}_${academicYear}_${detectedLevelType === 'primary' ? 'yearly' : term}`;
    
    const existing = gradebooks.find(gb => 
      gb.id === targetId || 
      gb.id === legacyId || 
      (gb.subjectId === selectedSubjectId && gb.className === selectedClass)
    );

    if (existing) {
      return existing;
    }

    const defaultConfig = getDefaultGradebookConfig(detectedLevelType, term);
    return {
      id: targetId,
      subjectId: selectedSubjectId,
      subjectCode: currentSubject?.code || 'ว00000',
      subjectName: currentSubject?.name || 'รายวิชาตัวอย่าง',
      className: selectedClass,
      academicYear,
      term: detectedLevelType === 'primary' ? 'yearly' : term,
      config: defaultConfig,
      assignments: [
        { id: 'asg-1', title: 'แบบฝึกหัดที่ 1 (ภาระงาน)', maxScore: 20, category: 'work' },
        { id: 'asg-2', title: 'แบบทดสอบย่อย (ชิ้นงาน)', maxScore: 20, category: 'work' },
        { id: 'asg-3', title: 'จิตพฤติกรรมและการร่วมกิจกรรม', maxScore: 20, category: 'work' },
      ],
      studentScores: {},
      updatedAt: new Date().toISOString()
    } as Gradebook;
  }, [gradebooks, selectedSubjectId, selectedClass, academicYear, term, detectedLevelType, currentSubject]);

  // Calculated Grades for students in the class
  const studentGradeResults = useMemo(() => {
    return classStudents.map(student => {
      const record = currentGradebook.studentScores?.[student.id];
      const calc = calculateStudentGrade(record, currentGradebook.assignments, currentGradebook.config);
      return {
        student,
        calc
      };
    });
  }, [classStudents, currentGradebook]);

  // Grade Distribution & Statistics Summary
  const gradeStats = useMemo(() => {
    const total = studentGradeResults.length;
    const passed = studentGradeResults.filter(r => r.calc.isPassed).length;
    const failed = total - passed;
    const passedPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

    const counts: Record<string, number> = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0
    };

    studentGradeResults.forEach(r => {
      const gStr = r.calc.grade.toString();
      if (counts[gStr] !== undefined) {
        counts[gStr]++;
      }
    });

    return {
      total,
      passed,
      failed,
      passedPercent,
      counts
    };
  }, [studentGradeResults]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportPP5ToExcel({
      gradebook: currentGradebook,
      students,
      subject: currentSubject,
      profile,
      academicYear,
      term
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Non-Printable Top Action Toolbar */}
      <div className="print:hidden no-print bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        
        {/* Upper Toolbar: Title & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="ย้อนกลับ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>พิมพ์รายงานเอกสารทางการ (A4 Official)</span>
              </h2>
              <p className="text-xs text-slate-400">
                ระบบออกเอกสารรายงานตามรูปแบบมาตรฐานกระทรวงศึกษาธิการ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Report Mode Tabs Selector */}
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setReportType('teaching_log')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  reportType === 'teaching_log'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. บันทึกหลังกิจกรรม</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('grades_summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  reportType === 'grades_summary'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>2. คะแนนและผลการเรียน (ปพ.5)</span>
              </button>
            </div>

            {/* Export Excel Button for PP5 */}
            {reportType === 'grades_summary' && (
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer"
                title="ส่งออกเอกสาร ปพ.5 เป็นไฟล์ Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>ส่งออกไฟล์ Excel (ปพ.5)</span>
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-white text-slate-900 flex items-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>สั่งพิมพ์ / ออกรายงาน PDF</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar based on active report type */}
        <div className="pt-3 border-t border-slate-800/80">
          {reportType === 'teaching_log' ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-300 font-semibold flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>เลือกรายการบันทึกหลังสอน:</span>
              </label>
              {logs.length > 0 ? (
                <select
                  value={activeLogId}
                  onChange={(e) => setActiveLogId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-full sm:max-w-md"
                >
                  {logs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.date} - {l.subjectCode} ({l.topic}) - ห้อง {l.className}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-rose-400 font-medium">ยังไม่มีรายการบันทึกหลังสอน</span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Subject Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">รายวิชา</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ห้องเรียน</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ปีการศึกษา</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                />
              </div>

              {/* Term */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ภาคเรียน</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="yearly">ประเมินทั้งปี (ประถม)</option>
                </select>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* REPORT TYPE 1: บันทึกหลังการจัดกิจกรรมการเรียนรู้ (Teaching Log) */}
      {/* ========================================================= */}
      {reportType === 'teaching_log' && (
        activeLog ? (
          <div className="official-a4-sheet max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900 leading-relaxed text-sm">
            
            {/* Document Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                บันทึกหลังการจัดกิจกรรมการเรียนรู้
              </h1>
              <p className="text-sm font-semibold">
                {profile.schoolName}
              </p>
              <p className="text-xs text-slate-700">
                {profile.department} • ภาคเรียนที่ {profile.term} ปีการศึกษา {profile.academicYear}
              </p>
            </div>

            {/* Lesson Information Section */}
            <div className="space-y-4 mb-6 text-xs sm:text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-lg border border-slate-300 print:bg-transparent print:border-slate-400">
                <div>
                  <span className="font-bold">กลุ่มสาระฯ:</span> {profile.department}
                </div>
                <div>
                  <span className="font-bold">รหัสวิชา:</span> {activeLog.subjectCode}
                </div>
                <div>
                  <span className="font-bold">ชื่อวิชา:</span> {activeLog.subjectName}
                </div>
                <div>
                  <span className="font-bold">ระดับชั้น/ห้อง:</span> {activeLog.gradeLevel} ({activeLog.className})
                </div>
                <div>
                  <span className="font-bold">วันที่สอน:</span> {activeLog.date}
                </div>
                <div>
                  <span className="font-bold">คาบ/เวลา:</span> {activeLog.period}
                </div>
              </div>

              <div>
                <span className="font-bold">หน่วยการเรียนรู้:</span> {activeLog.unitTitle}
              </div>
              <div>
                <span className="font-bold">เรื่องที่สอน:</span> {activeLog.topic}
              </div>

              <div>
                <span className="font-bold">ตัวชี้วัด / จุดประสงค์การเรียนรู้:</span>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {activeLog.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold">รูปแบบการสอน / สื่อการเรียนรู้:</span> {activeLog.teachingMethod} ({activeLog.mediaTools.join(', ')})
              </div>

              {/* Student Stats Table */}
              <div className="pt-2">
                <span className="font-bold">สถิติการเข้าเรียนของนักเรียน:</span>
                <table className="w-full mt-1.5 text-center text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-400 font-bold">
                      <th className="p-1.5 border-r border-slate-400">จำนวนทั้งหมด</th>
                      <th className="p-1.5 border-r border-slate-400">มาเรียน</th>
                      <th className="p-1.5 border-r border-slate-400">ขาดเรียน</th>
                      <th className="p-1.5 border-r border-slate-400">ลาป่วย</th>
                      <th className="p-1.5 border-r border-slate-400">ลากิจ</th>
                      <th className="p-1.5">มาสาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border-r border-slate-400 font-bold">{activeLog.studentStats.totalCount} คน</td>
                      <td className="p-1.5 border-r border-slate-400">{activeLog.studentStats.presentCount} คน</td>
                      <td className="p-1.5 border-r border-slate-400">{activeLog.studentStats.absentCount} คน</td>
                      <td className="p-1.5 border-r border-slate-400">{activeLog.studentStats.sickCount} คน</td>
                      <td className="p-1.5 border-r border-slate-400">{activeLog.studentStats.leaveCount} คน</td>
                      <td className="p-1.5">{activeLog.studentStats.lateCount} คน</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reflection Block */}
            <div className="space-y-4 pt-2 border-t border-slate-400">
              <h2 className="font-bold text-sm sm:text-base underline">
                ผลการจัดการเรียนรู้ (บันทึกหลังสอน)
              </h2>

              <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <div>
                  <h3 className="font-bold text-slate-900">1. ผลการเรียนรู้และพฤติกรรมนักเรียน:</h3>
                  <p className="pl-4 text-justify mt-0.5">
                    {activeLog.reflection.outcomes}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">2. ปัญหา / อุปสรรค:</h3>
                  <p className="pl-4 text-justify mt-0.5">
                    {activeLog.reflection.problems}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">3. ข้อเสนอแนะ / แนวทางการแก้ไข:</h3>
                  <p className="pl-4 text-justify mt-0.5">
                    {activeLog.reflection.solutions}
                  </p>
                </div>
              </div>
            </div>

            {/* Attached Photos Layout if present */}
            {activeLog.imageUrls && activeLog.imageUrls.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-300">
                <h3 className="font-bold text-xs mb-2">ภาพบรรยากาศการจัดกิจกรรมการเรียนรู้:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {activeLog.imageUrls.map((url, i) => (
                    <div key={i} className="border border-slate-300 rounded overflow-hidden h-40">
                      <img src={url} alt="ภาพประกอบการสอน" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Sign-off Blocks */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
              
              {/* Teacher Signature */}
              <div className="space-y-6">
                <p>ลงชื่อ........................................................ครูผู้สอน</p>
                <p className="font-bold">({profile.name})</p>
                <p>ตำแหน่ง {profile.position} ({profile.academicStanding})</p>
                <p>วันที่.........เดือน..........................พ.ศ............</p>
              </div>

              {/* Head of Department Signature */}
              <div className="space-y-6">
                <p>ลงชื่อ........................................................หัวหน้ากลุ่มสาระฯ</p>
                <p className="font-bold">(........................................................)</p>
                <p>ความเห็น: [  ] ทราบ  [  ] อนุมัติ  [  ] อื่นๆ........................</p>
                <p>วันที่.........เดือน..........................พ.ศ............</p>
              </div>

            </div>

          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">ไม่พบรายการบันทึกการสอนสำหรับพิมพ์</p>
          </div>
        )
      )}

      {/* ========================================================= */}
      {/* REPORT TYPE 2: สรุปคะแนนและผลการเรียนรายวิชา (ปพ.5 Style) */}
      {/* ========================================================= */}
      {reportType === 'grades_summary' && (
        <div className="official-a4-sheet max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900 leading-relaxed text-xs sm:text-sm">
          
          {/* Document Header */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              แบบรายงานสรุปคะแนนและผลการประเมินการเรียนรู้ (ปพ.5)
            </h1>
            <p className="text-sm font-semibold">
              {profile.schoolName}
            </p>
            <p className="text-xs text-slate-700">
              กลุ่มสาระการเรียนรู้{profile.department} • ภาคเรียนที่ {term === 'yearly' ? 'ประเมินทั้งปี' : term} ปีการศึกษา {academicYear}
            </p>
          </div>

          {/* Subject & Class Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-lg border border-slate-300 print:bg-transparent print:border-slate-400 mb-6 text-xs sm:text-sm">
            <div>
              <span className="font-bold">รหัสวิชา:</span> {currentSubject?.code || '-'}
            </div>
            <div>
              <span className="font-bold">ชื่อวิชา:</span> {currentSubject?.name || '-'}
            </div>
            <div>
              <span className="font-bold">ระดับชั้น/ห้อง:</span> {currentSubject?.gradeLevel} ({selectedClass})
            </div>
            <div>
              <span className="font-bold">ครูผู้สอน:</span> {profile.name}
            </div>
            <div>
              <span className="font-bold">ตำแหน่ง:</span> {profile.position}
            </div>
            <div>
              <span className="font-bold">สัดส่วนประเมิน:</span> คะแนนเก็บ {currentGradebook.config.workWeightRatio} : คะแนนสอบ {currentGradebook.config.examWeightRatio}
            </div>
          </div>

          {/* Table Explanation Notice & In-Page Action */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 print:text-slate-800">
            <div>
              * หมายเหตุ: แสดงเฉพาะคะแนนรวมของคะแนนเก็บ คะแนนรวมคะแนนสอบ คะแนนรวมสุทธิ และระดับผลการเรียน (เกรด) ตามระเบียบการประเมินผล
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="print:hidden inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer w-fit"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ดาวน์โหลด ปพ.5 (Excel .xlsx)</span>
            </button>
          </div>

          {/* Main Student Grade Summary Table */}
          {studentGradeResults.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl my-4 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-bold text-slate-700">ยังไม่มีรายชื่อนักเรียนในห้อง {selectedClass}</p>
              <p className="text-xs mt-1">สามารถเพิ่มนักเรียนได้ที่เมนู "รายชื่อนักเรียนเข้าห้องเรียน"</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-900 text-center text-xs mb-6">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b-2 border-slate-900 font-bold">
                  <th className="border border-slate-800 p-2 w-10">เลขที่</th>
                  <th className="border border-slate-800 p-2 w-28">รหัสประจำตัว</th>
                  <th className="border border-slate-800 p-2 text-left">ชื่อ - นามสกุล</th>
                  
                  {/* คะแนนรวมของคะแนนเก็บ (Scaled Work Score) */}
                  <th className="border border-slate-800 p-2 w-28 bg-slate-50 print:bg-transparent">
                    คะแนนรวมคะแนนเก็บ
                    <div className="text-[10px] font-normal text-slate-700">(เต็ม {currentGradebook.config.workWeightRatio})</div>
                  </th>

                  {/* คะแนนรวมคะแนนสอบ (Total Exam Score) */}
                  <th className="border border-slate-800 p-2 w-28 bg-slate-50 print:bg-transparent">
                    คะแนนรวมคะแนนสอบ
                    <div className="text-[10px] font-normal text-slate-700">
                      (เต็ม {currentGradebook.config.examWeightRatio})
                    </div>
                  </th>

                  {/* คะแนนรวมสุทธิ (Total Net Score 100) */}
                  <th className="border border-slate-800 p-2 w-24 font-black bg-indigo-50/50 print:bg-transparent">
                    คะแนนรวมสุทธิ
                    <div className="text-[10px] font-normal text-slate-700">(เต็ม 100)</div>
                  </th>

                  {/* เกรด / ระดับผลการเรียน */}
                  <th className="border border-slate-800 p-2 w-20 font-black">
                    ระดับผลการเรียน
                    <div className="text-[10px] font-normal text-slate-700">(เกรด)</div>
                  </th>

                  {/* ผลการประเมิน */}
                  <th className="border border-slate-800 p-2 w-20">
                    ผลการตัดสิน
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentGradeResults.map(({ student, calc }) => (
                  <tr key={student.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="border border-slate-800 p-2 text-center">{student.studentNo}</td>
                    <td className="border border-slate-800 p-2 font-mono text-center">{student.studentIdCode || '-'}</td>
                    <td className="border border-slate-800 p-2 text-left font-sans font-medium">
                      {student.prefix || ''}{student.firstName} {student.lastName}
                    </td>

                    {/* คะแนนรวมคะแนนเก็บ */}
                    <td className="border border-slate-800 p-2 font-mono font-bold text-slate-800">
                      {calc.scaledWorkScore}
                    </td>

                    {/* คะแนนรวมคะแนนสอบ */}
                    <td className="border border-slate-800 p-2 font-mono font-bold text-slate-800">
                      {calc.totalExamScore}
                    </td>

                    {/* คะแนนรวมสุทธิ 100 */}
                    <td className="border border-slate-800 p-2 font-mono font-black text-sm bg-slate-50/60 print:bg-transparent">
                      {calc.netScore}
                    </td>

                    {/* เกรด */}
                    <td className="border border-slate-800 p-2 font-mono font-black text-base">
                      {calc.grade}
                    </td>

                    {/* ผลการตัดสิน */}
                    <td className="border border-slate-800 p-2 font-sans font-bold">
                      {calc.isPassed ? (
                        <span className="text-emerald-800 print:text-black">ผ่าน</span>
                      ) : (
                        <span className="text-rose-700 print:text-black">ไม่ผ่าน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Grade Distribution & Summary Statistics Table */}
          <div className="my-6 border border-slate-800 rounded-lg p-4 bg-slate-50/50 print:bg-transparent space-y-3 break-inside-avoid">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 underline">
              สรุปตารางการกระจายระดับผลการเรียน (Grade Distribution)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-800 text-center text-xs">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-200 font-bold border-b border-slate-800">
                    <th className="border border-slate-800 p-1.5">ระดับผลการเรียน</th>
                    <th className="border border-slate-800 p-1.5">4</th>
                    <th className="border border-slate-800 p-1.5">3.5</th>
                    <th className="border border-slate-800 p-1.5">3</th>
                    <th className="border border-slate-800 p-1.5">2.5</th>
                    <th className="border border-slate-800 p-1.5">2</th>
                    <th className="border border-slate-800 p-1.5">1.5</th>
                    <th className="border border-slate-800 p-1.5">1</th>
                    <th className="border border-slate-800 p-1.5">0</th>
                    <th className="border border-slate-800 p-1.5 font-black">รวมทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold bg-slate-100">จำนวน (คน)</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['4']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['3.5']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['3']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['2.5']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['2']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['1.5']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['1']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{gradeStats.counts['0']}</td>
                    <td className="border border-slate-800 p-1.5 font-mono font-black">{gradeStats.total}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold bg-slate-100">คิดเป็นร้อยละ</td>
                    {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].map((gKey) => {
                      const cnt = gradeStats.counts[gKey] || 0;
                      const pct = gradeStats.total > 0 ? ((cnt / gradeStats.total) * 100).toFixed(1) : '0.0';
                      return (
                        <td key={gKey} className="border border-slate-800 p-1.5 font-mono text-[11px]">
                          {pct}%
                        </td>
                      );
                    })}
                    <td className="border border-slate-800 p-1.5 font-mono font-black text-[11px]">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs pt-1 font-semibold text-slate-800">
              <div>
                จำนวนนักเรียนเข้าประเมินทั้งหมด: <span className="font-bold">{gradeStats.total}</span> คน
              </div>
              <div>
                ผ่านเกณฑ์: <span className="font-bold text-emerald-800 print:text-black">{gradeStats.passed}</span> คน ({gradeStats.passedPercent}%)
              </div>
              <div>
                ไม่ผ่านเกณฑ์: <span className="font-bold text-rose-700 print:text-black">{gradeStats.failed}</span> คน
              </div>
            </div>
          </div>

          {/* Signatures Official Section */}
          <div className="mt-10 pt-6 border-t border-slate-400 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid space-y-0">
            
            <div className="space-y-6">
              <p>ลงชื่อ........................................................ครูผู้สอน</p>
              <p className="font-bold">({profile.name})</p>
              <p>ตำแหน่ง {profile.position}</p>
              <p>วันที่.........เดือน..........................พ.ศ............</p>
            </div>

            <div className="space-y-6">
              <p>ลงชื่อ........................................................หัวหน้ากลุ่มสาระฯ</p>
              <p className="font-bold">(........................................................)</p>
              <p>ตำแหน่ง หัวหน้ากลุ่มสาระการเรียนรู้{profile.department}</p>
              <p>วันที่.........เดือน..........................พ.ศ............</p>
            </div>

            <div className="space-y-6 pt-4">
              <p>ลงชื่อ........................................................นายทะเบียน / วัดผล</p>
              <p className="font-bold">(........................................................)</p>
              <p>วันที่.........เดือน..........................พ.ศ............</p>
            </div>

            <div className="space-y-6 pt-4">
              <p>ลงชื่อ........................................................ผู้อำนวยการโรงเรียน</p>
              <p className="font-bold">(........................................................)</p>
              <p>ผู้อำนวยการ{profile.schoolName}</p>
              <p>วันที่.........เดือน..........................พ.ศ............</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
