import React, { useState, useMemo } from 'react';
import { 
  StudentBehaviorNote, 
  Subject, 
  Student, 
  AttendanceSession, 
  AttendanceStatus 
} from '../types';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserX, 
  UserCheck, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  BarChart3, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  GraduationCap, 
  AlertCircle,
  FileText,
  Info,
  RotateCcw,
  QrCode,
  Smartphone
} from 'lucide-react';
import { QRCodePresenterModal } from './QRCodePresenterModal';
import { StudentQRCardsPrintModal } from './StudentQRCardsPrintModal';
import { StudentQRCheckinPortal } from './StudentQRCheckinPortal';
import { TeacherProfile } from '../types';

interface AttendanceTrackerProps {
  sessions?: AttendanceSession[];
  students: Student[];
  subjects: Subject[];
  notes: StudentBehaviorNote[];
  profile?: TeacherProfile;
  onSaveSession?: (session: AttendanceSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onAddNote: (note: StudentBehaviorNote) => void;
  onDeleteNote: (id: string) => void;
  onSaveBatchStudents?: (students: Student[], targetClass: string, isOverwrite: boolean) => void;
}

// Helper: Get array of recent Sunday dates (YYYY-MM-DD)
const getRecentSundays = (count = 10): { dateStr: string; label: string }[] => {
  const result: { dateStr: string; label: string }[] = [];
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  
  // Find most recent Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - currentDay);

  const monthsThai = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  for (let i = 0; i < count; i++) {
    const d = new Date(lastSunday);
    d.setDate(lastSunday.getDate() - (i * 7));
    const yearBE = d.getFullYear() + 543;
    const dateStr = d.toISOString().split('T')[0];
    const label = `อา. ${d.getDate()} ${monthsThai[d.getMonth()]} ${yearBE}`;
    result.push({ dateStr, label });
  }

  return result;
};

// Helper: Check if date is Sunday
const isSunday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.getDay() === 0;
};

// Helper: Get Thai Day Name
const getThaiDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  return days[d.getDay()];
};

// Helper: Check if grade is Secondary
const checkIsSecondary = (gradeLevel: string, className: string): boolean => {
  const text = `${gradeLevel} ${className}`.toLowerCase();
  return text.includes('ม.') || text.includes('มัธยม') || text.includes('m.');
};

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  sessions = [],
  students = [],
  subjects = [],
  notes = [],
  profile,
  onSaveSession,
  onDeleteSession,
  onAddNote,
  onDeleteNote,
  onSaveBatchStudents,
}) => {
  const teacherProfile: TeacherProfile = profile || {
    name: "ครู ซอลาฮุดดิน แยะแย",
    position: "ครู คศ.2",
    academicStanding: "ชำนาญการ",
    schoolName: "โรงเรียนสาธิตวิทยาการ",
    department: "กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี",
    academicYear: "2567",
    term: "1"
  };

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'sheet' | 'notes' | 'qr_checkin'>('dashboard');

  // QR Modal States
  const [isQRPresenterOpen, setIsQRPresenterOpen] = useState<boolean>(false);
  const [isPrintQRCardsOpen, setIsPrintQRCardsOpen] = useState<boolean>(false);
  const [qrModalClass, setQrModalClass] = useState<string>('ม.6/1');

  // Filters for Dashboard & Sheet
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, warning, normal

  // State for Check-in Sheet
  const [sheetSubjectId, setSheetSubjectId] = useState<string>(subjects[0]?.id || '');

  // Selected subject object
  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === sheetSubjectId) || subjects[0];
  }, [subjects, sheetSubjectId]);

  // Available classes for selected subject
  const availableClasses = useMemo(() => {
    if (!activeSubject) return ['ม.3/1'];
    return activeSubject.classes && activeSubject.classes.length > 0
      ? activeSubject.classes
      : ['ม.3/1'];
  }, [activeSubject]);

  const [sheetClass, setSheetClass] = useState<string>(() => availableClasses[0] || 'ม.3/1');

  // Auto-sync sheetClass whenever availableClasses or sheetSubjectId changes
  React.useEffect(() => {
    if (availableClasses.length > 0) {
      if (!sheetClass || !availableClasses.includes(sheetClass)) {
        setSheetClass(availableClasses[0]);
      }
    }
  }, [availableClasses, sheetSubjectId]);
  const [sheetDate, setSheetDate] = useState<string>(() => {
    // Default to most recent Sunday
    const sundays = getRecentSundays(1);
    return sundays[0]?.dateStr || new Date().toISOString().split('T')[0];
  });
  const [sheetPeriod, setSheetPeriod] = useState<string>('คาบที่ 1-2 (08:30 - 10:10 น.)');
  const [sheetTopic, setSheetTopic] = useState<string>('');

  // Active attendance records for current sheet [studentId] -> status
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});
  const [currentRemarks, setCurrentRemarks] = useState<Record<string, string>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Student Detail Modal for Attendance Audit
  const [selectedStudentAudit, setSelectedStudentAudit] = useState<Student | null>(null);

  // Behavior Note Modal
  const [isBehaviorModalOpen, setIsBehaviorModalOpen] = useState(false);
  const [behaviorStudentName, setBehaviorStudentName] = useState('');
  const [behaviorStudentNo, setBehaviorStudentNo] = useState(1);
  const [behaviorClass, setBehaviorClass] = useState('ม.3/1');
  const [behaviorSubject, setBehaviorSubject] = useState(subjects[0]?.name || 'วิทยาศาสตร์พื้นฐาน 5');
  const [behaviorType, setBehaviorType] = useState<'positive' | 'needs_improvement' | 'general'>('positive');
  const [behaviorText, setBehaviorText] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Is current sheet for secondary level?
  const isSecondary = useMemo(() => {
    const level = activeSubject?.gradeLevel || 'ม.3';
    return checkIsSecondary(level, sheetClass);
  }, [activeSubject, sheetClass]);

  // Get students for current sheet class
  const classStudents = useMemo(() => {
    return students
      .filter(st => !sheetClass || st.className === sheetClass)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, sheetClass]);

  // Load existing session data when changing subject, class, date
  React.useEffect(() => {
    const existing = sessions.find(s => 
      s.subjectId === sheetSubjectId && 
      s.className === sheetClass && 
      s.date === sheetDate
    );

    if (existing) {
      setEditingSessionId(existing.id);
      setCurrentRecords(existing.records || {});
      setCurrentRemarks(existing.remarks || {});
      setSheetPeriod(existing.period || 'คาบที่ 1-2 (08:30 - 10:10 น.)');
      setSheetTopic(existing.topic || '');
    } else {
      setEditingSessionId(null);
      // Auto fill all students as present by default
      const defaultRecs: Record<string, AttendanceStatus> = {};
      classStudents.forEach(st => {
        defaultRecs[st.id] = 'present';
      });
      setCurrentRecords(defaultRecs);
      setCurrentRemarks({});
      setSheetTopic('');
    }
  }, [sheetSubjectId, sheetClass, sheetDate, sessions, classStudents]);

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    const newRecs: Record<string, AttendanceStatus> = {};
    classStudents.forEach(st => {
      newRecs[st.id] = 'present';
    });
    setCurrentRecords(newRecs);
    showToast('ทำรายการ: เช็คมาเรียนทุกคนสำเร็จ');
  };

  // Handle Save Attendance Session
  const handleSaveSheet = () => {
    if (!activeSubject) return;

    const isSun = isSunday(sheetDate);
    const dayName = getThaiDayName(sheetDate);

    const sessionData: AttendanceSession = {
      id: editingSessionId || `att-${sheetSubjectId}-${sheetClass}-${sheetDate}`,
      subjectId: sheetSubjectId,
      subjectCode: activeSubject.code,
      subjectName: activeSubject.name,
      className: sheetClass,
      gradeLevel: activeSubject.gradeLevel,
      date: sheetDate,
      dayOfWeek: dayName,
      isSundaySession: isSun,
      period: sheetPeriod,
      topic: sheetTopic,
      records: currentRecords,
      remarks: currentRemarks,
      updatedAt: new Date().toISOString()
    };

    if (onSaveSession) {
      onSaveSession(sessionData);
      showToast(`บันทึกการเช็คชื่อ ${activeSubject.name} (${sheetClass}) ประจำ${dayName} เรียบร้อยแล้ว`);
    }
  };

  // Dashboard Aggregations
  const dashboardData = useMemo(() => {
    // Filter sessions by selectedSubjectId and selectedClass
    const filteredSessions = sessions.filter(s => {
      const matchSub = !selectedSubjectId || selectedSubjectId === 'all' || s.subjectId === selectedSubjectId;
      const matchClass = !selectedClass || selectedClass === 'all' || s.className === selectedClass;
      return matchSub && matchClass;
    });

    let totalPresent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    let totalSick = 0;
    let totalAbsent = 0;
    let totalEntries = 0;

    filteredSessions.forEach(sess => {
      Object.values(sess.records || {}).forEach(status => {
        totalEntries++;
        if (status === 'present') totalPresent++;
        else if (status === 'late') totalLate++;
        else if (status === 'leave') totalLeave++;
        else if (status === 'sick') totalSick++;
        else if (status === 'absent') totalAbsent++;
      });
    });

    const overallRate = totalEntries > 0 
      ? Math.round(((totalPresent + totalLate + totalLeave + totalSick) / totalEntries) * 100) 
      : 100;

    // Aggregate per-student stats
    // Determine target students
    const targetStudents = students.filter(st => {
      const matchClass = !selectedClass || selectedClass === 'all' || st.className === selectedClass;
      const matchSearch = !searchStudent || 
        `${st.prefix || ''}${st.firstName} ${st.lastName}`.toLowerCase().includes(searchStudent.toLowerCase()) ||
        st.studentNo.toString() === searchStudent ||
        (st.studentIdCode && st.studentIdCode.includes(searchStudent));
      return matchClass && matchSearch;
    });

    const studentStatsList = targetStudents.map(st => {
      let stPresent = 0;
      let stLate = 0;
      let stLeave = 0;
      let stSick = 0;
      let stAbsent = 0;
      let stTotalSessions = 0;

      filteredSessions.forEach(sess => {
        if (sess.records && sess.records[st.id]) {
          stTotalSessions++;
          const status = sess.records[st.id];
          if (status === 'present') stPresent++;
          else if (status === 'late') stLate++;
          else if (status === 'leave') stLeave++;
          else if (status === 'sick') stSick++;
          else if (status === 'absent') stAbsent++;
        }
      });

      // Attendance rate formula: (Present + Late + Sick + Leave) / Total
      // Or strict attendance: Present / Total
      const stRate = stTotalSessions > 0
        ? Math.round(((stPresent + stLate + stSick + stLeave) / stTotalSessions) * 100)
        : 100;

      const isWarning = stRate < 80;

      return {
        student: st,
        present: stPresent,
        late: stLate,
        leave: stLeave,
        sick: stSick,
        absent: stAbsent,
        totalSessions: stTotalSessions,
        rate: stRate,
        isWarning
      };
    });

    // Filter by warning status
    const finalStudentStats = studentStatsList.filter(item => {
      if (filterStatus === 'warning') return item.isWarning;
      if (filterStatus === 'normal') return !item.isWarning;
      return true;
    });

    const warningCount = studentStatsList.filter(i => i.isWarning).length;

    return {
      sessionsCount: filteredSessions.length,
      totalEntries,
      totalPresent,
      totalLate,
      totalLeave: totalLeave + totalSick,
      totalAbsent,
      overallRate,
      warningCount,
      studentStats: finalStudentStats,
      filteredSessions
    };
  }, [sessions, students, selectedSubjectId, selectedClass, searchStudent, filterStatus]);

  // Handle Behavior Note Submit
  const handleBehaviorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!behaviorStudentName || !behaviorText) return;

    const newNote: StudentBehaviorNote = {
      id: `beh-${Date.now()}`,
      studentName: behaviorStudentName,
      studentNo: Number(behaviorStudentNo),
      className: behaviorClass,
      subjectName: behaviorSubject,
      date: new Date().toISOString().split('T')[0],
      behaviorType,
      note: behaviorText,
    };

    onAddNote(newNote);
    setIsBehaviorModalOpen(false);
    setBehaviorStudentName('');
    setBehaviorText('');
    showToast('บันทึกพฤติกรรมนักเรียนเรียบร้อย');
  };

  // Recent Sundays dropdown list
  const recentSundays = useMemo(() => getRecentSundays(10), []);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "เลขที่,รหัสนักเรียน,ชื่อ-นามสกุล,ห้องเรียน,มาเรียน (ครั้ง),สาย (ครั้ง),ลา (ครั้ง),ขาด (ครั้ง),รวมคาบ,อัตราการเข้าเรียน (%),สถานะ\n";

    dashboardData.studentStats.forEach(({ student, present, late, leave, sick, absent, totalSessions, rate, isWarning }) => {
      const name = `${student.prefix || ''}${student.firstName} ${student.lastName}`;
      const statusText = isWarning ? 'เสี่ยงหมดสิทธิ์สอบ (<80%)' : 'ปกติ';
      csvContent += `"${student.studentNo}","${student.studentIdCode || ''}","${name}","${student.className}","${present}","${late}","${leave + sick}","${absent}","${totalSessions}","${rate}%","${statusText}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานการเข้าเรียน_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ส่งออกไฟล์ CSV สรุปการเข้าเรียนสำเร็จ');
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center space-x-3 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>ระบบเช็คชื่อ & สรุปเวลาเรียน</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>มัธยมศึกษา: เรียนทุกวันอาทิตย์</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ศูนย์บันทึกการเข้าเรียน & แดชบอร์ดวิเคราะห์เวลาเรียน
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed">
              เช็คชื่อเข้าเรียนรายวัน/วันอาทิตย์ คำนวณเปอร์เซ็นต์การมาเรียนอัตโนมัติ 
              และแจ้งเตือนนักเรียนกลุ่มเสี่ยงขาดเรียนเกิน 20% (หมดสิทธิ์สอบ) ตามระเบียบการวัดผล
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ดสรุป</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sheet')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'sheet'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>เช็คชื่อเข้าเรียน</span>
            </button>

            <button
              onClick={() => setActiveSubTab('notes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>สังเกตพฤติกรรม</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('qr_checkin');
                setQrModalClass(sheetClass.includes('ม.6') ? sheetClass : 'ม.6/1');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'qr_checkin'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-amber-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>สแกน QR มือถือ (ม.6)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ATTENDANCE DASHBOARD & ANALYTICS                   */}
      {/* ========================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Dashboard Filters Bar */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">ตัวกรองรายงานการเข้าเรียน</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออก CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์รายงาน</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">เลือกรายวิชา</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedClass('all');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">ทุกรายวิชา ({subjects.length} วิชา)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} {s.name} ({s.gradeLevel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">เลือกห้องเรียน</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">ทุกห้องเรียน</option>
                  {Array.from(new Set(students.map(st => st.className))).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">สถานะสิทธิ์สอบ</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">นักเรียนทุกคน</option>
                  <option value="warning">🚨 เสี่ยงหมดสิทธิ์สอบ (&lt;80%)</option>
                  <option value="normal">🟢 เวลาเรียนปกติ (≥80%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ค้นหาชื่อ / เลขที่</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ นามสกุล เลขที่..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Analytics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* KPI 1: Overall Rate */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">อัตราเข้าเรียนรวม</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{dashboardData.overallRate}%</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${dashboardData.overallRate >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${dashboardData.overallRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 2: Present */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">มาเรียนปกติ</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-600">{dashboardData.totalPresent}</div>
                <span className="text-[10px] font-bold text-slate-400">ครั้ง</span>
              </div>
            </div>

            {/* KPI 3: Late */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">มาสาย</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-amber-600">{dashboardData.totalLate}</div>
                <span className="text-[10px] font-bold text-slate-400">ครั้ง</span>
              </div>
            </div>

            {/* KPI 4: Leave */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">ลากิจ / ลาป่วย</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-blue-600">{dashboardData.totalLeave}</div>
                <span className="text-[10px] font-bold text-slate-400">ครั้ง</span>
              </div>
            </div>

            {/* KPI 5: Absent */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">ขาดเรียน</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <UserX className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-rose-600">{dashboardData.totalAbsent}</div>
                <span className="text-[10px] font-bold text-slate-400">ครั้ง</span>
              </div>
            </div>

            {/* KPI 6: Warning Alert Count */}
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 p-4 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800">เสี่ยงหมดสิทธิ์สอบ</span>
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-rose-700">{dashboardData.warningCount}</div>
                <span className="text-[10px] font-bold text-rose-600">&lt; 80% ของเวลาเรียน</span>
              </div>
            </div>
          </div>

          {/* Secondary Sunday Special Schedule Notice */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 p-4 rounded-2xl border border-amber-300/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                ☀️
              </div>
              <div>
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>กำหนดการเรียนระดับมัธยมศึกษา: เรียนทุกวันอาทิตย์ (Sunday Session)</span>
                </h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  สำหรับการเรียนการสอนระดับมัธยมศึกษา การเช็คชื่อจะอ้างอิงรอบวันอาทิตย์เป็นหลัก ระบบเปิดให้กดเลือกวันอาทิตย์ด่วนและบันทึกเวลาเรียนได้ทันที
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSubTab('sheet');
                const sundays = getRecentSundays(1);
                if (sundays[0]) setSheetDate(sundays[0].dateStr);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
            >
              เช็คชื่อวันอาทิตย์ล่าสุด →
            </button>
          </div>

          {/* Student Roster Attendance Matrix & Risk Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>สรุปเวลาเรียนรายบุคคล (Student Attendance Roster)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คำนวณสถิติสะสมจากทุกคาบเช็คชื่อ (ตามเกณฑ์ต้องมาเรียนไม่น้อยกว่า 80% จึงจะมีสิทธิ์เข้าสอบ)
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                แสดงผล <span className="font-bold text-indigo-600">{dashboardData.studentStats.length}</span> คน
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">เลขที่</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล นักเรียน</th>
                    <th className="py-3 px-4 w-24">ห้องเรียน</th>
                    <th className="py-3 px-4 text-center text-emerald-700">มาเรียน</th>
                    <th className="py-3 px-4 text-center text-amber-700">สาย</th>
                    <th className="py-3 px-4 text-center text-blue-700">ลา</th>
                    <th className="py-3 px-4 text-center text-rose-700">ขาด</th>
                    <th className="py-3 px-4 text-center w-20">รวมคาบ</th>
                    <th className="py-3 px-4 text-center w-32">% เวลาเรียน</th>
                    <th className="py-3 px-4 text-center w-36">สถานะสิทธิ์สอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {dashboardData.studentStats.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold">ไม่พบข้อมูลนักเรียนตามเงื่อนไขตัวกรอง</p>
                      </td>
                    </tr>
                  ) : (
                    dashboardData.studentStats.map(({ student, present, late, leave, sick, absent, totalSessions, rate, isWarning }) => {
                      const fullName = `${student.prefix || ''}${student.firstName} ${student.lastName}`;
                      return (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${isWarning ? 'bg-rose-50/30' : ''}`}
                        >
                          <td className="py-3 px-4 text-center font-bold text-slate-500">
                            {student.studentNo}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <button
                              onClick={() => setSelectedStudentAudit(student)}
                              className="hover:text-indigo-600 hover:underline text-left cursor-pointer flex items-center space-x-1.5"
                            >
                              <span>{fullName}</span>
                              {student.studentIdCode && (
                                <span className="text-[10px] font-normal text-slate-400">({student.studentIdCode})</span>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {student.className}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">{present}</td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600">{late}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">{leave + sick}</td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600">{absent}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">{totalSessions}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <span className={`font-extrabold ${isWarning ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {rate}%
                              </span>
                            </div>
                            <div className="w-16 bg-slate-200 rounded-full h-1 mx-auto mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isWarning ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, rate)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isWarning ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>เสี่ยงหมดสิทธิ์สอบ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>มีสิทธิ์สอบ (ปกติ)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAILY & SUNDAY ATTENDANCE CHECK-IN SHEET           */}
      {/* ========================================================= */}
      {activeSubTab === 'sheet' && (
        <div className="space-y-6">

          {/* Session Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  ตั้งค่าคาบเรียนและวันเช็คชื่อ
                </h2>
              </div>

              {/* Sunday Badge Indicator */}
              {isSunday(sheetDate) && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5 shadow-2xs">
                  <span>☀️ คาบวันอาทิตย์ (Sunday Session)</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Select Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">รายวิชา</label>
                <select
                  value={sheetSubjectId}
                  onChange={(e) => {
                    const selectedSubId = e.target.value;
                    setSheetSubjectId(selectedSubId);
                    const sub = subjects.find(s => s.id === selectedSubId);
                    if (sub && sub.classes && sub.classes.length > 0) {
                      setSheetClass(sub.classes[0]);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.gradeLevel})</option>
                  ))}
                </select>
              </div>

              {/* Select Class */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ห้องเรียน</label>
                <select
                  value={sheetClass}
                  onChange={(e) => setSheetClass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">วันที่เช็คชื่อ</label>
                <input
                  type="date"
                  value={sheetDate}
                  onChange={(e) => setSheetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Select Period */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">คาบเรียน / เวลา</label>
                <input
                  type="text"
                  value={sheetPeriod}
                  onChange={(e) => setSheetPeriod(e.target.value)}
                  placeholder="เช่น คาบที่ 1-2 (08:30 - 10:10 น.)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Sunday Quick Picker for Secondary level */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 flex items-center space-x-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>เลือกวันอาทิตย์ด่วน (สำหรับระดับมัธยม):</span>
              </span>

              {recentSundays.slice(0, 6).map(({ dateStr, label }) => {
                const isSelected = sheetDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSheetDate(dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs scale-105'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Topic / Note Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">หัวข้อ / กิจกรรมการเรียนในคาบนี้ (ระบุเพื่อความสมบูรณ์ของบันทึก)</label>
              <input
                type="text"
                placeholder="เช่น การแบ่งเซลล์แบบไมโทซิส, ปฏิบัติการทดลอง..."
                value={sheetTopic}
                onChange={(e) => setSheetTopic(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Attendance Roster Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-900 shadow-md">
            <div>
              <h3 className="font-bold text-sm md:text-base flex items-center space-x-2">
                <span>ใบเช็คชื่อนักเรียนห้อง {sheetClass}</span>
                <span className="text-xs font-normal text-indigo-300">({classStudents.length} คน)</span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {getThaiDayName(sheetDate)} ที่ {sheetDate} • {activeSubject?.name}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQrModalClass(sheetClass);
                  setIsQRPresenterOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer ring-2 ring-amber-300/50"
              >
                <QrCode className="w-4 h-4" />
                <span>เปิด QR ให้ นร. สแกน</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrModalClass(sheetClass);
                  setIsPrintQRCardsOpen(true);
                }}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                title="พิมพ์บัตร QR Code ประจำตัวนักเรียน หรือโปสเตอร์ติดหน้าห้อง"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์บัตร QR</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>มาเรียนทุกคน</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSheet}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกผลการเช็คชื่อ</span>
              </button>
            </div>
          </div>

          {/* Student Roster Check-in List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-slate-700">ยังไม่มีรายชื่อนักเรียนในห้อง {sheetClass}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    สามารถเพิ่มหรือนำเข้ารายชื่อนักเรียนเพิ่มเติมได้ที่เมนู "รายชื่อนักเรียน" หรือกดสร้างรายชื่อตัวอย่างด้านล่าง
                  </p>
                  {onSaveBatchStudents && (
                    <button
                      type="button"
                      onClick={() => {
                        const classNum = sheetClass.replace(/[^0-9]/g, '') || '01';
                        const sampleStds: Student[] = Array.from({ length: 6 }).map((_, idx) => ({
                          id: `std-${sheetClass.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${idx + 1}`,
                          studentNo: idx + 1,
                          studentIdCode: `66${classNum.padStart(2, '0')}${(idx + 1).toString().padStart(2, '0')}`,
                          prefix: idx % 2 === 0 ? (sheetClass.includes('ม.6') || sheetClass.includes('ม.5') || sheetClass.includes('ม.4') ? 'นาย' : 'เด็กชาย') : (sheetClass.includes('ม.6') || sheetClass.includes('ม.5') || sheetClass.includes('ม.4') ? 'นางสาว' : 'เด็กหญิง'),
                          firstName: idx % 2 === 0 ? `กิตติพงษ์${idx + 1}` : `ณิชานันท์${idx + 1}`,
                          lastName: `สมบูรณ์แบบ (${sheetClass})`,
                          className: sheetClass,
                          gender: idx % 2 === 0 ? 'male' : 'female'
                        }));
                        onSaveBatchStudents(sampleStds, sheetClass, false);
                        showToast(`เพิ่มรายชื่อนักเรียนตัวอย่าง 6 คนสำหรับห้อง ${sheetClass} เรียบร้อยแล้ว`);
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>สร้างรายชื่อนักเรียนตัวอย่างสำหรับห้อง {sheetClass}</span>
                    </button>
                  )}
                </div>
              ) : (
                classStudents.map((st) => {
                  const status = currentRecords[st.id] || 'present';
                  const remark = currentRemarks[st.id] || '';
                  const fullName = `${st.prefix || ''}${st.firstName} ${st.lastName}`;

                  return (
                    <div 
                      key={st.id} 
                      className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                        status === 'absent' ? 'bg-rose-50/40' : status === 'late' ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Left: Student Identity */}
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                          {st.studentNo}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            รหัส {st.studentIdCode || '-'} • ห้อง {st.className}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Status Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => setCurrentRecords(prev => ({ ...prev, [st.id]: 'present' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>มาเรียน</span>
                        </button>

                        {/* Late */}
                        <button
                          type="button"
                          onClick={() => setCurrentRecords(prev => ({ ...prev, [st.id]: 'late' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>สาย</span>
                        </button>

                        {/* Leave */}
                        <button
                          type="button"
                          onClick={() => setCurrentRecords(prev => ({ ...prev, [st.id]: 'leave' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            status === 'leave'
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ลากิจ</span>
                        </button>

                        {/* Sick */}
                        <button
                          type="button"
                          onClick={() => setCurrentRecords(prev => ({ ...prev, [st.id]: 'sick' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            status === 'sick'
                              ? 'bg-purple-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>ลาป่วย</span>
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => setCurrentRecords(prev => ({ ...prev, [st.id]: 'absent' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>ขาดเรียน</span>
                        </button>
                      </div>

                      {/* Right: Remark Note */}
                      <div className="w-full md:w-56 shrink-0">
                        <input
                          type="text"
                          placeholder="หมายเหตุ (เช่น ป่วยมีใบลา)..."
                          value={remark}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentRemarks(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Save Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                เมื่อตรวจเช็คเสร็จแล้ว กดปุ่มบันทึกเพื่ออัปเดตระบบ
              </span>

              <button
                type="button"
                onClick={handleSaveSheet}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกผลการเช็คชื่อ</span>
              </button>
            </div>
          </div>

          {/* Historical Saved Sessions List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs md:text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>ประวัติการเช็คชื่อที่บันทึกแล้ว ({sessions.length} เซกชัน)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map(sess => {
                const total = Object.keys(sess.records || {}).length;
                const presents = Object.values(sess.records || {}).filter(v => v === 'present').length;
                const absents = Object.values(sess.records || {}).filter(v => v === 'absent').length;

                return (
                  <div key={sess.id} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{sess.subjectName} ({sess.className})</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {sess.dayOfWeek || 'วัน'}ที่ {sess.date} • {sess.period || 'ไม่ระบุคาบ'}
                        </div>
                      </div>

                      {sess.isSundaySession && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          ☀️ วันอาทิตย์
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                      <div className="flex items-center space-x-2 font-semibold">
                        <span className="text-emerald-700">มา {presents}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-rose-600">ขาด {absents}</span>
                        <span className="text-slate-400">({total} คน)</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSheetSubjectId(sess.subjectId);
                            setSheetClass(sess.className);
                            setSheetDate(sess.date);
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold cursor-pointer"
                        >
                          แก้ไข
                        </button>

                        {onDeleteSession && (
                          <button
                            onClick={() => onDeleteSession(sess.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="ลบรายการเช็คชื่อนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STUDENT BEHAVIOR OBSERVER & NOTES                  */}
      {/* ========================================================= */}
      {activeSubTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>บันทึกสังเกตพฤติกรรมและพัฒนาการนักเรียน</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                บันทึกการสังเกตพฤติกรรม จุดเด่น หรือข้อควรปรับปรุงเพื่อประกอบการดูแลช่วยเหลือผู้เรียนรายบุคคล
              </p>
            </div>

            <button
              onClick={() => setIsBehaviorModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกพฤติกรรมใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n) => (
              <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{n.studentName}</span>
                    <span className="text-xs text-slate-500 ml-1.5">เลขที่ {n.studentNo} ({n.className})</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    n.behaviorType === 'positive'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : n.behaviorType === 'needs_improvement'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {n.behaviorType === 'positive' ? 'ด้านชื่นชม' : n.behaviorType === 'needs_improvement' ? 'ควรปรับปรุง' : 'ทั่วไป'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{n.note}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>{n.subjectName}</span>
                  <div className="flex items-center space-x-2">
                    <span>{n.date}</span>
                    <button
                      onClick={() => onDeleteNote(n.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SMARTPHONE QR CODE CHECK-IN HUB (SPECIAL FOR M.6)  */}
      {/* ========================================================= */}
      {activeSubTab === 'qr_checkin' && (
        <div className="space-y-6">
          {/* Header Feature Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-800/80 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center space-x-1.5 shadow-md">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMARTPHONE QR CHECK-IN</span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    ออกแบบพิเศษสำหรับระดับชั้นมัธยมศึกษาปีที่ 6 (ม.6)
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  ระบบเช็คชื่อเข้าเรียนด้วยสมาร์ทโฟนผ่าน QR Code
                </h2>

                <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
                  เนื่องจากนักเรียนชั้น ม.6 พกสมาร์ทโฟนมาโรงเรียน ครูสามารถฉาย QR Code ขึ้นจอโปรเจกเตอร์หน้าห้องเรียน หรือส่งลิงก์ในกลุ่ม LINE ให้นักเรียนสแกนและยืนยันตนเองได้ทันที ระบบจะบันทึกเวลาจริงและแจ้งสถานะ "มาเรียน" หรือ "มาสาย" พร้อมซิงค์เข้าฐานข้อมูลครูแบบเรียลไทม์
                </p>
              </div>

              {/* Quick Launch Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalClass(sheetClass.includes('ม.6') ? sheetClass : 'ม.6/1');
                    setIsQRPresenterOpen(true);
                  }}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs md:text-sm shadow-xl transition-all active:scale-95 cursor-pointer ring-2 ring-amber-300/60"
                >
                  <QrCode className="w-4 h-4 md:w-5 md:h-5" />
                  <span>เปิดจอใหญ่ฉายโปรเจกเตอร์</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQrModalClass(sheetClass.includes('ม.6') ? sheetClass : 'ม.6/1');
                      setIsPrintQRCardsOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์บัตร QR นักเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?checkin=auto&class=${encodeURIComponent(sheetClass)}&subject=${encodeURIComponent(sheetSubjectId)}`;
                      navigator.clipboard.writeText(url);
                      showToast('คัดลอกลิงก์สำหรับส่งเข้า LINE กลุ่มสำเร็จแล้ว');
                    }}
                    className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    title="คัดลอกลิงก์ส่ง LINE"
                  >
                    <span>คัดลอกลิงก์ LINE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Target Class & Subject */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  เลือกห้องเรียนและวิชาสำหรับเปิดเซสชัน QR Code
                </h3>
              </div>

              <span className="text-xs text-slate-500">
                วันที่ปัจจุบัน: <strong className="text-slate-800">{sheetDate}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ห้องเรียนเป้าหมาย (แนะนำ ม.6)</label>
                <select
                  value={sheetClass}
                  onChange={(e) => {
                    setSheetClass(e.target.value);
                    setQrModalClass(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>ห้อง {cls} {cls.includes('ม.6') ? '⭐ (ม.ปลายมีสมาร์ทโฟน)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายวิชา</label>
                <select
                  value={sheetSubjectId}
                  onChange={(e) => setSheetSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.gradeLevel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คาบเรียน / วันที่</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={sheetDate}
                    onChange={(e) => setSheetDate(e.target.value)}
                    className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={sheetPeriod}
                    onChange={(e) => setSheetPeriod(e.target.value)}
                    className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    placeholder="คาบเรียน"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Roster & Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Quick QR Card (Col 5) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                QR CODE ประจำคาบนี้
              </span>

              <div className="p-3 bg-slate-50 border-2 border-indigo-200 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalClass(sheetClass);
                    setIsQRPresenterOpen(true);
                  }}
                  className="group relative cursor-pointer block"
                  title="คลิกเพื่อขยายเต็มจอ"
                >
                  <div className="w-52 h-52 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner border border-slate-200">
                    <QrCode className="w-44 h-44 text-slate-900 group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-xs transition-opacity">
                    🔍 คลิกเพื่อเปิดจอโปรเจกเตอร์
                  </div>
                </button>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">
                  ห้อง {sheetClass} • {activeSubject?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  นักเรียนสแกนแล้วเลือกชื่อตนเองเพื่อบันทึกการเข้าเรียน
                </p>
              </div>

              <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">สถานะการเช็ค:</span>
                <span className="font-black text-emerald-600">
                  เช็คแล้ว {classStudents.filter(st => currentRecords[st.id] === 'present' || currentRecords[st.id] === 'late').length} / {classStudents.length} คน
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQrModalClass(sheetClass);
                  setIsQRPresenterOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                เปิดหน้าต่างฉาย Projector หน้าห้อง
              </button>
            </div>

            {/* Right: Live Roster with Status Badges (Col 7) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    รายชื่อนักเรียนห้อง {sheetClass} ({classStudents.length} คน)
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    มาเรียนทุกคน
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSheet}
                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    บันทึกผล
                  </button>
                </div>
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto max-h-96 divide-y divide-slate-100 pr-1">
                {classStudents.map((st) => {
                  const status = currentRecords[st.id] || 'present';
                  const remark = currentRemarks[st.id];

                  return (
                    <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                          {st.studentNo}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-900">
                            {st.prefix || ''}{st.firstName} {st.lastName}
                          </span>
                          {st.studentIdCode && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                              ({st.studentIdCode})
                            </span>
                          )}
                          {remark && (
                            <p className="text-[10px] text-indigo-600 font-medium">
                              {remark}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status toggle buttons */}
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        {(['present', 'late', 'leave', 'absent'] as AttendanceStatus[]).map(stKey => (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => {
                              setCurrentRecords(prev => ({ ...prev, [st.id]: stKey }));
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              status === stKey
                                ? stKey === 'present'
                                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                                  : stKey === 'late'
                                  ? 'bg-amber-500 text-white font-black shadow-xs'
                                  : stKey === 'leave'
                                  ? 'bg-blue-600 text-white font-black shadow-xs'
                                  : 'bg-rose-600 text-white font-black shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {stKey === 'present' ? 'มา' : stKey === 'late' ? 'สาย' : stKey === 'leave' ? 'ลา' : 'ขาด'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD BEHAVIOR NOTE                                  */}
      {/* ========================================================= */}
      {isBehaviorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="text-base font-bold text-slate-900">บันทึกพฤติกรรมนักเรียน</h3>

            <form onSubmit={handleBehaviorSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล นักเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น ด.ช. นพดล ใจดี"
                  value={behaviorStudentName}
                  onChange={(e) => setBehaviorStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เลขที่</label>
                  <input
                    type="number"
                    value={behaviorStudentNo}
                    onChange={(e) => setBehaviorStudentNo(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
                  <input
                    type="text"
                    value={behaviorClass}
                    onChange={(e) => setBehaviorClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทพฤติกรรม</label>
                <select
                  value={behaviorType}
                  onChange={(e) => setBehaviorType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                >
                  <option value="positive">ด้านบวก / คำชื่นชม</option>
                  <option value="needs_improvement">ควรดูแลปรับปรุง</option>
                  <option value="general">สังเกตพฤติกรรมทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อความสังเกต</label>
                <textarea
                  rows={3}
                  placeholder="ระบุพฤติกรรมที่สังเกตพบ..."
                  value={behaviorText}
                  onChange={(e) => setBehaviorText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBehaviorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: STUDENT ATTENDANCE AUDIT DRAWER                    */}
      {/* ========================================================= */}
      {selectedStudentAudit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 space-y-4 text-xs sm:text-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  ประวัติการเข้าเรียน: {selectedStudentAudit.prefix}{selectedStudentAudit.firstName} {selectedStudentAudit.lastName}
                </h3>
                <p className="text-xs text-slate-500">
                  เลขที่ {selectedStudentAudit.studentNo} • ห้อง {selectedStudentAudit.className} • รหัส {selectedStudentAudit.studentIdCode || '-'}
                </p>
              </div>

              <button
                onClick={() => setSelectedStudentAudit(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-600 cursor-pointer"
              >
                ปิด
              </button>
            </div>

            {/* Attendance history timeline */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-700">รายการเวลาเรียนตามวันที่:</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {sessions
                  .filter(sess => sess.className === selectedStudentAudit.className)
                  .map(sess => {
                    const status = sess.records?.[selectedStudentAudit.id] || 'not_recorded';
                    const remark = sess.remarks?.[selectedStudentAudit.id];

                    return (
                      <div key={sess.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{sess.subjectName}</div>
                          <div className="text-[11px] text-slate-400">
                            {sess.dayOfWeek || ''} {sess.date} {sess.period ? `(${sess.period})` : ''}
                          </div>
                          {remark && <p className="text-[10px] text-amber-700 mt-0.5">หมายเหตุ: {remark}</p>}
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : status === 'late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : status === 'leave' || status === 'sick'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {status === 'present' ? '🟢 มาเรียน' : status === 'late' ? '🟡 สาย' : status === 'leave' ? '🔵 ลากิจ' : status === 'sick' ? '🟣 ลาป่วย' : '🔴 ขาดเรียน'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudentAudit(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LIVE QR CODE PRESENTER FOR PROJECTOR               */}
      {/* ========================================================= */}
      {isQRPresenterOpen && (() => {
        const existingSess = sessions.find(s => 
          s.id === editingSessionId || 
          (s.subjectId === sheetSubjectId && s.className === qrModalClass && s.date === sheetDate)
        );

        return (
          <QRCodePresenterModal
            isOpen={isQRPresenterOpen}
            onClose={() => setIsQRPresenterOpen(false)}
            session={{
              id: editingSessionId || existingSess?.id || `att-${sheetSubjectId}-${qrModalClass}-${sheetDate}`,
              subjectId: sheetSubjectId,
              subjectCode: activeSubject?.code || 'ว6101',
              subjectName: activeSubject?.name || 'เทคโนโลยี',
              className: qrModalClass,
              gradeLevel: activeSubject?.gradeLevel || 'ม.6',
              date: sheetDate,
              period: sheetPeriod,
              topic: sheetTopic || 'เช็คชื่อด้วยสมาร์ทโฟน',
              records: currentRecords,
              remarks: currentRemarks,
              deviceRecords: existingSess?.deviceRecords || {},
              securityConfig: existingSess?.securityConfig,
              headcountInRoom: existingSess?.headcountInRoom,
              updatedAt: new Date().toISOString()
            }}
            students={students}
            subjects={subjects}
            profile={teacherProfile}
            onSaveSession={(updatedSession) => {
              if (onSaveSession) onSaveSession(updatedSession);
              setCurrentRecords(updatedSession.records || {});
              setCurrentRemarks(updatedSession.remarks || {});
              showToast('อัปเดตข้อมูลการเช็คชื่อสดเรียบร้อย');
            }}
            onPrintQRCards={() => setIsPrintQRCardsOpen(true)}
          />
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL: PRINT STUDENT QR BADGES & CLASSROOM POSTER         */}
      {/* ========================================================= */}
      {isPrintQRCardsOpen && (
        <StudentQRCardsPrintModal
          isOpen={isPrintQRCardsOpen}
          onClose={() => setIsPrintQRCardsOpen(false)}
          students={students}
          subjects={subjects}
          profile={teacherProfile}
          initialClass={qrModalClass}
        />
      )}

    </div>
  );
};
