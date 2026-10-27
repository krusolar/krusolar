import React, { useState, useMemo } from 'react';
import { TeachingLog, Subject, TeacherProfile, ActiveTab, Gradebook, Student, StudentScoreRecord } from '../types';
import { calculateStudentGrade, getGradeBadgeStyle } from '../utils/gradeCalculator';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell, 
  PieChart, 
  Pie
} from 'recharts';
import { 
  FileCheck2, 
  Clock, 
  Users, 
  Sparkles, 
  BookOpen, 
  Plus, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Award,
  GraduationCap,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Filter,
  Check,
  Search,
  X,
  Presentation
} from 'lucide-react';

interface DashboardProps {
  logs: TeachingLog[];
  subjects: Subject[];
  profile: TeacherProfile;
  gradebooks?: Gradebook[];
  students?: Student[];
  onOpenNewLog: () => void;
  onOpenLogDetail: (log: TeachingLog) => void;
  onOpenAIModal: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenProfileModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  logs,
  subjects,
  profile,
  gradebooks = [],
  students = [],
  onOpenNewLog,
  onOpenLogDetail,
  onOpenAIModal,
  onNavigateTab,
  onOpenProfileModal
}) => {
  // Compute Teaching Stats
  const totalLogs = logs.length;
  const completedLogs = logs.filter(l => l.status === 'completed').length;
  
  const totalPeriods = logs.reduce((acc, log) => {
    return acc + (log.period.includes('2-3') ? 2 : 1);
  }, 0);

  const totalStudentsEnrolled = logs.reduce((acc, l) => acc + l.studentStats.totalCount, 0);
  const totalStudentsPresent = logs.reduce((acc, l) => acc + l.studentStats.presentCount, 0);
  const averageAttendanceRate = totalStudentsEnrolled > 0 
    ? Math.round((totalStudentsPresent / totalStudentsEnrolled) * 100) 
    : 100;

  const recentLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  // -------------------------------------------------------------
  // GRADE DISTRIBUTION & CLASSROOM GPA ANALYTICS ENGINE
  // -------------------------------------------------------------
  
  // Extract all unique classrooms across subjects, students, and gradebooks
  const allClassrooms = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach(s => (s.classes || []).forEach(c => set.add(c)));
    students.forEach(st => { if (st.className) set.add(st.className); });
    gradebooks.forEach(g => { if (g.className) set.add(g.className); });
    const list = Array.from(set).sort();
    return list;
  }, [subjects, students, gradebooks]);

  // Active filter state
  const [selectedClass, setSelectedClass] = useState<string>('ม.3/1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'subjects' | 'classrooms'>('distribution');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // If initial selectedClass is not in list, set to first available or 'all'
  React.useEffect(() => {
    if (allClassrooms.length > 0 && selectedClass !== 'all' && !allClassrooms.includes(selectedClass)) {
      setSelectedClass(allClassrooms[0]);
    }
  }, [allClassrooms, selectedClass]);

  // Compute calculated grades for the selected filters
  const evaluatedRecords = useMemo(() => {
    const list: Array<{
      studentId: string;
      studentName: string;
      studentNo: number;
      className: string;
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      netScore: number;
      grade: number;
      gradeLabel: string;
      isPassed: boolean;
    }> = [];

    const relevantGradebooks = gradebooks.filter(gb => {
      const matchClass = selectedClass === 'all' || gb.className === selectedClass;
      const matchSubject = selectedSubjectId === 'all' || gb.subjectId === selectedSubjectId;
      return matchClass && matchSubject;
    });

    relevantGradebooks.forEach(gb => {
      const scores = gb.studentScores || {};
      Object.entries(scores).forEach(([stId, record]) => {
        const studentInfo = students.find(s => s.id === stId || (s.className === gb.className && s.studentNo === (record as any)?.studentNo));
        const calc = calculateStudentGrade(record as StudentScoreRecord, gb.assignments || [], gb.config);
        const name = studentInfo 
          ? `${studentInfo.prefix || ''}${studentInfo.firstName} ${studentInfo.lastName}`.trim()
          : ((record as any)?.studentName || `นักเรียนเลขที่ ${(record as any)?.studentNo || stId.split('-').pop() || stId}`);
        const stNo = studentInfo?.studentNo || (record as any)?.studentNo || 0;

        list.push({
          studentId: stId,
          studentName: name,
          studentNo: stNo,
          className: gb.className,
          subjectId: gb.subjectId,
          subjectCode: gb.subjectCode,
          subjectName: gb.subjectName,
          netScore: calc.netScore,
          grade: calc.grade,
          gradeLabel: calc.gradeLabel,
          isPassed: calc.isPassed
        });
      });
    });

    return list;
  }, [gradebooks, students, selectedClass, selectedSubjectId]);

  // Overall KPI metrics
  const totalEvaluated = evaluatedRecords.length;
  const overallGPA = totalEvaluated > 0 
    ? (evaluatedRecords.reduce((acc, r) => acc + r.grade, 0) / totalEvaluated).toFixed(2) 
    : '0.00';
  const overallAvgScore = totalEvaluated > 0 
    ? Math.round(evaluatedRecords.reduce((acc, r) => acc + r.netScore, 0) / totalEvaluated) 
    : 0;
  const passCount = evaluatedRecords.filter(r => r.isPassed).length;
  const passRate = totalEvaluated > 0 
    ? Math.round((passCount / totalEvaluated) * 100) 
    : 100;
  const excellentCount = evaluatedRecords.filter(r => r.grade >= 3.5).length;
  const excellentRate = totalEvaluated > 0 
    ? Math.round((excellentCount / totalEvaluated) * 100) 
    : 0;
  const remediationRecords = evaluatedRecords.filter(r => r.grade === 0 || r.grade < 1.5);
  const topRecords = evaluatedRecords.filter(r => r.grade === 4);

  // Grade Distribution (8 Tiers: 4, 3.5, 3, 2.5, 2, 1.5, 1, 0)
  const gradeDistributionData = useMemo(() => {
    const tiers = [4, 3.5, 3, 2.5, 2, 1.5, 1, 0];
    const total = evaluatedRecords.length;

    return tiers.map(g => {
      const records = evaluatedRecords
        .filter(r => r.grade === g)
        .sort((a, b) => b.netScore - a.netScore || a.studentNo - b.studentNo);
      const count = records.length;
      const percent = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
      let label = 'ปรับปรุง';
      let color = '#ef4444';
      if (g === 4) { label = 'ดีเยี่ยม (80-100)'; color = '#10b981'; }
      else if (g === 3.5) { label = 'ดีมาก (75-79)'; color = '#06b6d4'; }
      else if (g === 3) { label = 'ดี (70-74)'; color = '#6366f1'; }
      else if (g === 2.5) { label = 'ค่อนข้างดี (65-69)'; color = '#3b82f6'; }
      else if (g === 2) { label = 'น่าพอใจ (60-64)'; color = '#f59e0b'; }
      else if (g === 1.5) { label = 'พอใช้ (55-59)'; color = '#f97316'; }
      else if (g === 1) { label = 'ผ่านเกณฑ์ (50-54)'; color = '#fb7185'; }
      else { label = 'ไม่ผ่าน/ปรับปรุง (<50)'; color = '#ef4444'; }

      return {
        grade: `เกรด ${g}`,
        gradeVal: g,
        count,
        percent,
        label,
        color,
        students: records
      };
    });
  }, [evaluatedRecords]);

  // Filtered grade groups according to search & grade filter
  const displayedGradeGroups = useMemo(() => {
    return gradeDistributionData
      .filter(g => {
        if (selectedGradeFilter === 'all') return true;
        return g.gradeVal === selectedGradeFilter;
      })
      .map(g => {
        let studentsList = g.students || [];
        if (studentSearchTerm.trim()) {
          const term = studentSearchTerm.trim().toLowerCase();
          studentsList = studentsList.filter(s => 
            s.studentName.toLowerCase().includes(term) ||
            (s.studentNo && s.studentNo.toString().includes(term)) ||
            (s.className && s.className.toLowerCase().includes(term))
          );
        }
        return {
          ...g,
          students: studentsList
        };
      })
      .filter(g => {
        if (studentSearchTerm.trim()) {
          return g.students.length > 0;
        }
        return true;
      });
  }, [gradeDistributionData, selectedGradeFilter, studentSearchTerm]);

  // Performance Tiers (Pie Chart Data)
  const performanceTiersData = useMemo(() => {
    const total = evaluatedRecords.length;
    const tierExcellent = evaluatedRecords.filter(r => r.grade >= 3.5).length;
    const tierGood = evaluatedRecords.filter(r => r.grade >= 2.0 && r.grade < 3.5).length;
    const tierPass = evaluatedRecords.filter(r => r.grade >= 1.0 && r.grade < 2.0).length;
    const tierRemediation = evaluatedRecords.filter(r => r.grade === 0).length;

    const data = [
      { name: 'กลุ่มดีเยี่ยม (3.5 - 4.0)', value: tierExcellent, color: '#10b981' },
      { name: 'กลุ่มดี-ปานกลาง (2.0 - 3.0)', value: tierGood, color: '#6366f1' },
      { name: 'กลุ่มผ่านเกณฑ์ (1.0 - 1.5)', value: tierPass, color: '#f59e0b' },
      { name: 'กลุ่มต้องพัฒนา (เกรด 0)', value: tierRemediation, color: '#ef4444' }
    ];

    if (total === 0) {
      return [{ name: 'ยังไม่มีข้อมูลคะแนน', value: 1, color: '#e2e8f0' }];
    }
    return data.filter(d => d.value > 0);
  }, [evaluatedRecords]);

  // Subject GPA comparison for active classroom/all
  const subjectGpaData = useMemo(() => {
    const map = new Map<string, { code: string; name: string; totalGrade: number; totalScore: number; count: number }>();
    evaluatedRecords.forEach(r => {
      const existing = map.get(r.subjectId) || { code: r.subjectCode, name: r.subjectName, totalGrade: 0, totalScore: 0, count: 0 };
      existing.totalGrade += r.grade;
      existing.totalScore += r.netScore;
      existing.count += 1;
      map.set(r.subjectId, existing);
    });

    return Array.from(map.values()).map(item => ({
      subject: item.code,
      fullName: item.name,
      avgGpa: Math.round((item.totalGrade / Math.max(1, item.count)) * 100) / 100,
      avgScore: Math.round((item.totalScore / Math.max(1, item.count)) * 10) / 10,
      studentCount: item.count
    }));
  }, [evaluatedRecords]);

  // Classroom Comparison Data across all classrooms
  const classroomComparisonData = useMemo(() => {
    const map = new Map<string, { className: string; totalGrade: number; totalScore: number; count: number; passCount: number }>();
    gradebooks.forEach(gb => {
      if (selectedSubjectId !== 'all' && gb.subjectId !== selectedSubjectId) return;
      const scores = gb.studentScores || {};
      Object.values(scores).forEach(record => {
        const calc = calculateStudentGrade(record as StudentScoreRecord, gb.assignments || [], gb.config);
        const existing = map.get(gb.className) || { className: gb.className, totalGrade: 0, totalScore: 0, count: 0, passCount: 0 };
        existing.totalGrade += calc.grade;
        existing.totalScore += calc.netScore;
        existing.count += 1;
        if (calc.isPassed) existing.passCount += 1;
        map.set(gb.className, existing);
      });
    });

    return Array.from(map.values()).map(c => ({
      className: c.className,
      avgGpa: Math.round((c.totalGrade / Math.max(1, c.count)) * 100) / 100,
      avgScore: Math.round((c.totalScore / Math.max(1, c.count)) * 10) / 10,
      passRate: Math.round((c.passCount / Math.max(1, c.count)) * 100),
      studentCount: c.count
    })).sort((a, b) => b.avgGpa - a.avgGpa);
  }, [gradebooks, selectedSubjectId]);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden liquid-glass-dark rounded-3xl p-6 border border-white/15 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start sm:items-center space-x-4">
            {/* Avatar Badge with edit button */}
            <div className="relative shrink-0 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-indigo-500/30 shadow-lg bg-slate-800 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-xl font-bold text-indigo-300">
                    {profile.name.slice(0, 2)}
                  </span>
                )}
              </div>
              {onOpenProfileModal && (
                <button
                  onClick={onOpenProfileModal}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-90 border border-indigo-400/40"
                  title="แก้ไขข้อมูลส่วนตัวและเปลี่ยนรูปประจำตัว"
                >
                  <Award className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {profile.position || 'ครูผู้สอน'} • {profile.schoolName}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  สวัสดีครับ {profile.name} 👋
                </h1>
                {onOpenProfileModal && (
                  <button
                    onClick={onOpenProfileModal}
                    className="text-xs text-indigo-300 hover:text-white underline font-medium hover:bg-indigo-900/40 px-2 py-0.5 rounded-md transition-colors"
                  >
                    [แก้ไขชื่อ/รูป]
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                สถิติบันทึกการสอนของคุณวันนี้สมบูรณ์แล้ว {completedLogs}/{totalLogs} รายการ พร้อมกราฟวิเคราะห์ผลการเรียนเฉลี่ยรายวิชา (Grade Distribution) ของนักเรียนในแต่ละห้องเรียน
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guide')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                title="เปิดสไลด์และคู่มือสำหรับนำเสนอผลงาน"
              >
                <Presentation className="w-4 h-4" />
                <span>คู่มือนำเสนอ & สไลด์</span>
              </button>
            )}
            <button
              id="dash-ai-btn"
              onClick={onOpenAIModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ใช้ AI ช่วยเขียน</span>
            </button>
            <button
              id="dash-new-log-btn"
              onClick={onOpenNewLog}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกหลังสอน</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary Teaching Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="gsap-metric-card glow-rainbow-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนคาบที่บันทึกแล้ว</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalPeriods} คาบ</h3>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center font-bold">
              <TrendingUp className="w-3 h-3 mr-1" /> ครบถ้วนตามตารางสอน
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="gsap-metric-card glow-rainbow-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">อัตราการเข้าเรียนเฉลี่ย</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{averageAttendanceRate}%</h3>
            <p className="text-[11px] text-indigo-600 mt-1 flex items-center font-bold">
              <CheckCircle2 className="w-3 h-3 mr-1" /> บันทึกเช็คชื่อครบทุกคาบ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="gsap-metric-card glow-rainbow-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">เกรดเฉลี่ยรวม (GPA)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{overallGPA}</h3>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center font-bold">
              <GraduationCap className="w-3 h-3 mr-1" /> คะแนนเฉลี่ย {overallAvgScore} / 100
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50/90 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="gsap-metric-card glow-rainbow-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">อัตราผ่านเกณฑ์ประเมิน</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{passRate}%</h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center font-semibold">
              <Check className="w-3 h-3 mr-1 text-emerald-500" /> นักเรียน {passCount}/{totalEvaluated} คน
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50/90 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* RECHARTS: GRADE DISTRIBUTION & SUBJECT GPA DASHBOARD SECTION */}
      {/* ============================================================= */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/80 shadow-md space-y-6">
        
        {/* Section Header & Interactive Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                สรุปผลการเรียนเฉลี่ยรายวิชา (Grade Distribution) แต่ละห้องเรียน
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              วิเคราะห์การแจกแจงระดับผลการเรียน เกรดเฉลี่ย (GPA) และกลุ่มคุณภาพการเรียนรู้ของนักเรียนรายห้อง
            </p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Classroom Select */}
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <label htmlFor="filter-classroom" className="text-xs font-semibold text-slate-600 shrink-0">ห้องเรียน:</label>
              <select
                id="filter-classroom"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">ทุกห้องเรียน (รวมทั้งหมด)</option>
                {allClassrooms.map(c => (
                  <option key={c} value={c}>ห้อง {c}</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <label htmlFor="filter-subject" className="text-xs font-semibold text-slate-600 shrink-0">วิชา:</label>
              <select
                id="filter-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">ทุกรายวิชา</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} {s.name}</option>
                ))}
              </select>
            </div>

            {/* Jump to Gradebook Button */}
            <button
              onClick={() => onNavigateTab('grades')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>จัดการ ปพ.5</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Highlight KPI Pills for Selected Classroom */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">ห้องเรียนที่เลือก</span>
            <span className="text-base font-extrabold text-indigo-700 mt-0.5 block truncate">
              {selectedClass === 'all' ? 'ทุกห้องเรียน' : `ห้อง ${selectedClass}`}
            </span>
            <span className="text-[10px] text-slate-400">ประเมินแล้ว {totalEvaluated} คน</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">เกรดเฉลี่ย (GPA)</span>
            <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">
              {overallGPA} / 4.00
            </span>
            <span className="text-[10px] text-slate-400">เฉลี่ย {overallAvgScore} คะแนน</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">กลุ่มเกรด 3.5 - 4.0</span>
            <span className="text-base font-extrabold text-purple-700 mt-0.5 block">
              {excellentCount} คน ({excellentRate}%)
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">ระดับคุณภาพดีเยี่ยม</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">กลุ่มต้องซ่อมเสริม (&lt;1.5)</span>
            <span className={`text-base font-extrabold mt-0.5 block ${remediationRecords.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {remediationRecords.length} คน
            </span>
            <span className="text-[10px] text-slate-400">
              {remediationRecords.length > 0 ? 'ควรจัดแผนซ่อมเสริม' : 'ไม่มีนักเรียนตกค้าง'}
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'distribution'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. กราฟแจกแจงเกรด (Grade Distribution)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('subjects')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. เปรียบเทียบเกรดเฉลี่ยรายวิชา (Subject GPA)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('classrooms')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'classrooms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. เปรียบเทียบระหว่างห้องเรียน (Classroom GPA)</span>
          </button>
        </div>

        {/* -------------------------------------------------------- */}
        {/* TAB 1: GRADE DISTRIBUTION (Bar Chart + Donut Tier Chart + Student Names Roster) */}
        {/* -------------------------------------------------------- */}
        {activeChartTab === 'distribution' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Main Bar Chart: Grade Distribution */}
              <div className="lg:col-span-2 bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                        <span>จำนวนนักเรียนแยกตามระดับผลการเรียน (เกรด 0 ถึง 4)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        แสดงจำนวนนักเรียนและสัดส่วนร้อยละในแต่ละระดับผลการเรียน (คลิกแท่งกราฟหรือปุ่มเกรดเพื่อดูรายชื่อนักเรียน)
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      รวม {totalEvaluated} คน
                    </span>
                  </div>

                  {/* Recharts Bar Chart */}
                  <div className="h-64 sm:h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={gradeDistributionData}
                        margin={{ top: 15, right: 15, left: -15, bottom: 20 }}
                        onClick={(e: any) => {
                          if (e && e.activePayload && e.activePayload.length) {
                            const gVal = e.activePayload[0].payload.gradeVal;
                            setSelectedGradeFilter(prev => prev === gVal ? 'all' : gVal);
                            const el = document.getElementById('student-grade-roster');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="grade" 
                          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const studentsList: Array<any> = data.students || [];
                              return (
                                <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-white/20 text-xs space-y-2 max-w-xs sm:max-w-sm pointer-events-none">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80">
                                    <div className="font-extrabold text-sm flex items-center space-x-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                      <span>{data.grade}</span>
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                                      {data.count} คน ({data.percent}%)
                                    </span>
                                  </div>
                                  <div className="text-slate-300 text-[11px] font-medium">{data.label}</div>

                                  <div className="pt-1 space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      รายชื่อนักเรียน ({studentsList.length} คน):
                                    </span>
                                    {studentsList.length > 0 ? (
                                      <div className="space-y-1 max-h-44 overflow-hidden">
                                        {studentsList.slice(0, 6).map((st: any, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-800/80 px-2 py-0.5 rounded">
                                            <span className="truncate pr-2">
                                              {st.studentNo > 0 ? `เลขที่ ${st.studentNo} ` : ''}{st.studentName}
                                            </span>
                                            <span className="text-emerald-400 font-bold shrink-0">
                                              {st.netScore} คะแนน
                                            </span>
                                          </div>
                                        ))}
                                        {studentsList.length > 6 && (
                                          <div className="text-[10px] text-indigo-300 text-center font-medium pt-0.5">
                                            + อีก {studentsList.length - 6} คน (คลิกดูรายชื่อเต็มด้านล่าง)
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 italic">ไม่มีนักเรียนในเกรดนี้</p>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[6, 6, 0, 0]}
                          animationDuration={800}
                        >
                          {gradeDistributionData.map((entry, index) => {
                            const isSelected = selectedGradeFilter === entry.gradeVal;
                            const isDimmed = selectedGradeFilter !== 'all' && !isSelected;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                opacity={isDimmed ? 0.35 : 1}
                                stroke={isSelected ? '#1e293b' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bottom Quick Grade Cards - Clickable with Student Count & Name Trigger */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                    <span>คลิกเพื่อกรองดูรายชื่อนักเรียนในแต่ละเกรด:</span>
                    {selectedGradeFilter !== 'all' && (
                      <button
                        onClick={() => setSelectedGradeFilter('all')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>แสดงทุกเกรด</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
                    {gradeDistributionData.map((g) => {
                      const isSelected = selectedGradeFilter === g.gradeVal;
                      return (
                        <button
                          key={g.grade}
                          type="button"
                          onClick={() => {
                            setSelectedGradeFilter(prev => prev === g.gradeVal ? 'all' : g.gradeVal);
                            const el = document.getElementById('student-grade-roster');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className={`p-1.5 rounded-xl border transition-all text-center cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs' 
                              : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                          }`}
                          title={`คลิกเพื่อดูรายชื่อนักเรียนเกรด ${g.gradeVal}`}
                        >
                          <span className="text-[10px] font-bold text-slate-700 block">{g.grade}</span>
                          <span className="text-xs font-black block" style={{ color: g.color }}>{g.count} คน</span>
                          <span className="text-[9px] text-slate-400 block">{g.percent}%</span>
                          <span className={`text-[9px] mt-0.5 block font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {isSelected ? '✓ ดูชื่อ' : 'ดูชื่อ'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Performance Tiers Donut Chart */}
              <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      สัดส่วนกลุ่มคุณภาพการเรียนรู้
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    จำแนกตามมาตรฐานเกณฑ์ประเมิน 4 ระดับ
                  </p>

                  {/* Donut Chart */}
                  <div className="h-52 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-white/20 text-xs">
                                  <div className="font-bold flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                    <span>{data.name}</span>
                                  </div>
                                  <div className="mt-1 text-slate-200">
                                    {data.value} คน
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Pie
                          data={performanceTiersData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {performanceTiersData.map((entry, index) => (
                            <Cell key={`tier-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text Indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400 font-semibold">เกรดเฉลี่ย</span>
                      <span className="text-xl font-black text-slate-800">{overallGPA}</span>
                    </div>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>ดีเยี่ยม (3.5 - 4.0)</span>
                    </span>
                    <span className="font-bold text-slate-800">{excellentCount} คน</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span>ดี-ปานกลาง (2.0 - 3.0)</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {evaluatedRecords.filter(r => r.grade >= 2 && r.grade < 3.5).length} คน
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>ผ่านเกณฑ์ (1.0 - 1.5)</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {evaluatedRecords.filter(r => r.grade >= 1 && r.grade < 2).length} คน
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>ต้องซ่อมเสริม (0)</span>
                    </span>
                    <span className="font-bold text-rose-600">
                      {remediationRecords.length} คน
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* ---------------------------------------------------- */}
            {/* STUDENT ROSTER BY GRADE BREAKDOWN (Clear & Detailed) */}
            {/* ---------------------------------------------------- */}
            <div id="student-grade-roster" className="bg-white/90 p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              {/* Header with Search and Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>รายชื่อนักเรียนแยกตามเกรดที่ได้รับ</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      ห้อง {selectedClass === 'all' ? 'ทุกห้องเรียน' : selectedClass} ({totalEvaluated} คน)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    แสดงรายชื่อนักเรียน เลขที่ คะแนน และเกรดที่ได้ เพื่อให้เห็นภาพนักเรียนในแต่ละระดับผลการเรียนอย่างชัดเจน
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[220px] sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อนักเรียน หรือเลขที่..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
                  />
                  {studentSearchTerm && (
                    <button
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grade Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedGradeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ทั้งหมด ({totalEvaluated} คน)
                </button>
                {gradeDistributionData.map(g => {
                  const isSelected = selectedGradeFilter === g.gradeVal;
                  return (
                    <button
                      key={g.gradeVal}
                      type="button"
                      onClick={() => setSelectedGradeFilter(g.gradeVal)}
                      className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                      <span>{g.grade}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {g.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Display Students by Grade Groups */}
              <div className="space-y-4 pt-1">
                {displayedGradeGroups.map(group => (
                  <div key={group.grade} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3.5 space-y-2.5">
                    {/* Grade Group Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="flex items-center space-x-2.5">
                        <span 
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-2xs"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.gradeVal}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-slate-800">{group.grade} - {group.label}</h4>
                            <span 
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${group.color}20`, color: group.color }}
                            >
                              {group.students.length} คน ({group.percent}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {group.students.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          คะแนนเฉลี่ยกลุ่มนี้: <strong className="text-slate-700">{Math.round(group.students.reduce((a, s) => a + s.netScore, 0) / group.students.length)}</strong> คะแนน
                        </span>
                      )}
                    </div>

                    {/* Student Cards Grid */}
                    {group.students.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {group.students.map((st, idx) => (
                          <div
                            key={st.studentId + '-' + idx}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2 min-w-0 pr-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                                {st.studentNo > 0 ? st.studentNo : idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={st.studentName}>
                                  {st.studentName}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {st.className} {st.subjectCode ? `• ${st.subjectCode}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black block" style={{ color: group.color }}>
                                {st.netScore} <span className="text-[9px] font-normal text-slate-400">คะแนน</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-500">
                                เกรด {st.grade}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2 pl-2">
                        {studentSearchTerm ? 'ไม่พบนักเรียนที่ค้นหาในระดับเกรดนี้' : 'ไม่มีนักเรียนในระดับเกรดนี้'}
                      </p>
                    )}
                  </div>
                ))}

                {displayedGradeGroups.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    ไม่พบข้อมูลนักเรียนที่ตรงกับคำค้นหา &ldquo;{studentSearchTerm}&rdquo;
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: SUBJECT GPA COMPARISON (Bar Chart per Subject)    */}
        {/* -------------------------------------------------------- */}
        {activeChartTab === 'subjects' && (
          <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  เปรียบเทียบเกรดเฉลี่ย (GPA) และคะแนนเฉลี่ยรายวิชา
                </h3>
                <p className="text-[11px] text-slate-500">
                  ดูแนวโน้มผลสัมฤทธิ์ในแต่ละรายวิชาที่จัดการเรียนการสอน
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {subjectGpaData.length} รายวิชาที่มีข้อมูล
              </span>
            </div>

            {subjectGpaData.length > 0 ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectGpaData}
                    margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 4]} 
                      ticks={[0, 1, 2, 3, 4]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/20 text-xs space-y-1">
                              <div className="font-bold text-sm text-indigo-300">{item.subject}</div>
                              <div className="text-slate-300">{item.fullName}</div>
                              <div className="pt-1.5 border-t border-slate-700 space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span>เกรดเฉลี่ย (GPA):</span>
                                  <strong className="text-emerald-400 font-extrabold">{item.avgGpa} / 4.00</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>คะแนนเฉลี่ย:</span>
                                  <strong className="text-amber-300">{item.avgScore} / 100</strong>
                                </div>
                                <div className="flex justify-between gap-4 text-slate-400">
                                  <span>นักเรียนที่ประเมิน:</span>
                                  <span>{item.studentCount} คน</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Bar 
                      dataKey="avgGpa" 
                      name="เกรดเฉลี่ยรายวิชา (GPA เต็ม 4.00)" 
                      fill="#6366f1" 
                      radius={[6, 6, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลคะแนนรายวิชาสำหรับห้องเรียนที่เลือก
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: CLASSROOM GPA COMPARISON                          */}
        {/* -------------------------------------------------------- */}
        {activeChartTab === 'classrooms' && (
          <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  เปรียบเทียบเกรดเฉลี่ย (GPA) และอัตราผ่านเกณฑ์ระหว่างห้องเรียน
                </h3>
                <p className="text-[11px] text-slate-500">
                  ช่วยครูผู้สอนวางแผนกิจกรรมเสริมสร้างการเรียนรู้ให้สอดคล้องกับบริบทแต่ละห้อง
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                เปรียบเทียบ {classroomComparisonData.length} ห้องเรียน
              </span>
            </div>

            {classroomComparisonData.length > 0 ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classroomComparisonData}
                    margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="className" 
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 4]} 
                      ticks={[0, 1, 2, 3, 4]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/20 text-xs space-y-1">
                              <div className="font-bold text-sm text-indigo-300">ห้อง {item.className}</div>
                              <div className="pt-1.5 border-t border-slate-700 space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span>เกรดเฉลี่ย (GPA):</span>
                                  <strong className="text-emerald-400">{item.avgGpa} / 4.00</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>อัตราผ่านเกณฑ์:</span>
                                  <strong className="text-purple-300">{item.passRate}%</strong>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>คะแนนเฉลี่ย:</span>
                                  <span className="text-slate-300">{item.avgScore} / 100</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar 
                      dataKey="avgGpa" 
                      name="เกรดเฉลี่ยประจำห้อง (GPA)" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลคะแนนในระบบสำหรับเปรียบเทียบห้องเรียน
              </div>
            )}
          </div>
        )}

        {/* Actionable Student Insights: Top Performers & Remediation Need */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Top Performers Card */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>นักเรียนผลการเรียนยอดเยี่ยม (เกรด 4.00)</span>
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {evaluatedRecords.filter(r => r.grade === 4).length} คน
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {topRecords.length > 0 ? (
                topRecords.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-emerald-100">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{st.studentName}</span>
                      <span className="text-[10px] text-slate-400">({st.className})</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] text-slate-500">{st.netScore} คะแนน</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white">
                        เกรด 4
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">ยังไม่มีนักเรียนเกรด 4 ในเกณฑ์นี้</p>
              )}
            </div>
          </div>

          {/* Remediation Action Card */}
          <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>กลุ่มนักเรียนที่ควรได้รับการซ่อมเสริม</span>
                </span>
                <span className="text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  {remediationRecords.length} คน
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {remediationRecords.length > 0 ? (
                  remediationRecords.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-rose-100">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          !
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{st.studentName}</span>
                        <span className="text-[10px] text-slate-400">({st.className})</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] text-slate-500">{st.netScore} คะแนน</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500 text-white">
                          เกรด {st.grade}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-emerald-600 font-medium py-3 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยินดีด้วย! นักเรียนทุกคนผ่านเกณฑ์ประเมิน ไม่มีนักเรียนติด 0 หรือต่ำกว่า 1.5</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action: Open AI Remediation Assistant */}
            <div className="pt-2">
              <button
                onClick={onOpenAIModal}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-200 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>เปิด AI ช่วยออกแบบแผนซ่อมเสริม &amp; เกมปรับพื้นฐาน</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Middle Grid: Subject Log Progress & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject Progress Card */}
        <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 border border-white/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>ความคืบหน้าการบันทึกแยกรายวิชา</span>
              </h2>
              <p className="text-xs text-slate-500">เปรียบเทียบคาบเรียนที่บันทึกแล้วในภาคเรียนนี้</p>
            </div>
            <button
              onClick={() => onNavigateTab('subjects')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>ดูรายวิชาทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => {
              const logsForSubject = logs.filter(l => l.subjectCode === sub.code || l.subjectId === sub.id);
              const totalTarget = sub.hoursPerWeek * 8; // target for half term
              const percent = Math.min(100, Math.round((logsForSubject.length / Math.max(1, totalTarget)) * 100));

              return (
                <div key={sub.id} className="p-3.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-lg text-[11px]">
                        {sub.code}
                      </span>
                      <span className="font-bold text-slate-800">{sub.name}</span>
                      <span className="text-slate-400">({sub.gradeLevel})</span>
                    </div>
                    <span className="font-extrabold text-slate-700">
                      {logsForSubject.length} / {totalTarget} คาบ ({percent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className="gsap-progress-bar bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500 shadow-2xs"
                      data-target-width={`${percent}%`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>ห้องเรียน: {sub.classes.join(', ')}</span>
                    <span>นักเรียนทั้งหมด {sub.totalStudents} คน</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Quick Pedagogy Suggestion Box */}
        <div className="liquid-glass-dark text-white rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">ผู้ช่วย AI นิเทศการสอน</span>
            </div>
            
            <h3 className="text-lg font-extrabold leading-snug">
              แนะนำการเขียนบันทึกหลังสอนยุคใหม่ด้วย AI
            </h3>

            <p className="text-xs text-indigo-200 leading-relaxed">
              เพียงป้อนสรุปสั้นๆ 1-2 ประโยคเกี่ยวกับสิ่งที่เกิดขึ้นในห้องเรียน AI จะช่วยสังเคราะห์เป็นภาษาทางราชการ 3 ประเด็น:
            </p>

            <ul className="text-xs space-y-2 text-indigo-100 pl-1">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>1. ผลสัมฤทธิ์ทางการเรียนของนักเรียน</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>2. ปัญหาและอุปสรรคที่พบระหว่างสอน</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>3. แนวทางแก้ไขและกิจกรรม Active Learning</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAIModal}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>เปิดสตูดิโอผู้ช่วย AI ครู</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Teaching Logs Section */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>รายการบันทึกการสอนล่าสุด</span>
            </h2>
            <p className="text-xs text-slate-500">คลิกที่รายการเพื่อดูรายละเอียด พิมพ์รายงาน หรือแก้ไข</p>
          </div>

          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>ดูทั้งหมด ({logs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => onOpenLogDetail(log)}
              className="gsap-log-card group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700">
                    {log.subjectCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    ห้อง {log.className}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {log.date} ({log.period})
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {log.topic}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {log.unitTitle}
                </p>
              </div>

              {/* Reflection preview snippet */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-2 italic">
                "{log.reflection.outcomes}"
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เข้าเรียน {log.studentStats.presentCount}/{log.studentStats.totalCount} คน</span>
                </span>

                <span className="text-indigo-600 font-semibold group-hover:underline flex items-center">
                  ดูและพิมพ์แบบฟอร์ม <ArrowRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
