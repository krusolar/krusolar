import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceSession, AttendanceStatus, Student, Subject, TeacherProfile } from '../types';
import { 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  Clock, 
  Calendar, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Search, 
  School, 
  ArrowLeft,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  RefreshCw,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface StudentQRCheckinPortalProps {
  sessionId?: string;
  defaultClassName?: string;
  defaultSubjectId?: string;
  sessions: AttendanceSession[];
  students: Student[];
  subjects: Subject[];
  profile: TeacherProfile;
  onSaveAttendanceSession: (session: AttendanceSession) => void;
  onClose?: () => void;
  isSimulator?: boolean;
  expectedToken?: string;
  expectedPin?: string;
}

// Generate or retrieve persistent Device ID
const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'mock-device';
  try {
    let id = localStorage.getItem('edulog_student_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('edulog_student_device_id', id);
    }
    return id;
  } catch (e) {
    return 'dev-temp-' + Math.random().toString(36).substring(2, 8);
  }
};

export const StudentQRCheckinPortal: React.FC<StudentQRCheckinPortalProps> = ({
  sessionId,
  defaultClassName = 'ม.6/1',
  defaultSubjectId,
  sessions,
  students,
  subjects,
  profile,
  onSaveAttendanceSession,
  onClose,
  isSimulator = false,
  expectedToken,
  expectedPin,
}) => {
  // Determine URL parameters if available
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return { session: '', className: '', subjectId: '', token: '', tms: '', reqPin: '', devLock: '' };
    const params = new URLSearchParams(window.location.search);
    return {
      session: params.get('checkin') || params.get('session') || sessionId || '',
      className: params.get('class') || defaultClassName,
      subjectId: params.get('subject') || defaultSubjectId || '',
      token: params.get('token') || '',
      tms: params.get('tms') || '',
      reqPin: params.get('reqPin') || '',
      devLock: params.get('devLock') || '',
    };
  }, [sessionId, defaultClassName, defaultSubjectId]);

  // Selected class
  const [selectedClass, setSelectedClass] = useState<string>(urlParams.className || defaultClassName);
  
  // Available classes (prefer M.6 if exists)
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach(st => classSet.add(st.className));
    const sorted = Array.from(classSet).sort();
    return sorted.length > 0 ? sorted : ['ม.6/1', 'ม.6/2', 'ม.3/1', 'ม.1/1'];
  }, [students]);

  // Find or create active session
  const activeSubject = useMemo(() => {
    if (urlParams.subjectId) {
      const found = subjects.find(s => s.id === urlParams.subjectId);
      if (found) return found;
    }
    const foundForClass = subjects.find(s => s.classes?.includes(selectedClass));
    if (foundForClass) return foundForClass;
    return subjects[0];
  }, [subjects, urlParams.subjectId, selectedClass]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Find existing session for today + subject + class
  const currentSession = useMemo(() => {
    if (urlParams.session) {
      const byId = sessions.find(s => s.id === urlParams.session);
      if (byId) return byId;
    }
    const byContext = sessions.find(s => 
      s.className === selectedClass && 
      (s.date === todayStr || !s.date) &&
      (!activeSubject || s.subjectId === activeSubject.id)
    );
    return byContext || null;
  }, [sessions, urlParams.session, selectedClass, todayStr, activeSubject]);

  // Students in this class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, selectedClass]);

  // Device ID for anti-buddy punching
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());

  // Security checks: Is PIN required?
  const isPinRequired = useMemo(() => {
    if (urlParams.reqPin === '1') return true;
    if (currentSession?.securityConfig?.pinCodeEnabled) return true;
    if (expectedPin) return true;
    return false;
  }, [urlParams.reqPin, currentSession, expectedPin]);

  const activeRequiredPin = useMemo(() => {
    return expectedPin || currentSession?.securityConfig?.currentPin || '';
  }, [expectedPin, currentSession]);

  // Security checks: Check if dynamic token has expired (screenshot / forwarded QR protection)
  const isTokenExpired = useMemo(() => {
    // If token and timestamp exist in URL params
    if (urlParams.tms && !isSimulator) {
      const scanTime = Number(urlParams.tms);
      if (!isNaN(scanTime)) {
        const ageSeconds = (Date.now() - scanTime) / 1000;
        // Expire after 50 seconds to prevent forwarding
        if (ageSeconds > 50) {
          return true;
        }
      }
    }
    // If simulator or expectedToken provided, verify match
    if (expectedToken && urlParams.token && expectedToken !== urlParams.token) {
      return true;
    }
    return false;
  }, [urlParams.tms, urlParams.token, isSimulator, expectedToken]);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');

  // Status message
  const [checkinSuccessStudent, setCheckinSuccessStudent] = useState<Student | null>(null);
  const [checkinTimestamp, setCheckinTimestamp] = useState<string>('');
  const [checkinStatus, setCheckinStatus] = useState<AttendanceStatus>('present');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Device Lock Detection: Has this device already checked in someone else in this session?
  const devicePriorStudentId = useMemo(() => {
    if (!currentSession?.deviceRecords) return null;
    const entries = Object.entries(currentSession.deviceRecords);
    const found = entries.find(([_, devId]) => devId === deviceId);
    return found ? found[0] : null;
  }, [currentSession, deviceId]);

  const priorCheckedStudent = useMemo(() => {
    if (!devicePriorStudentId) return null;
    return classStudents.find(s => s.id === devicePriorStudentId) || null;
  }, [devicePriorStudentId, classStudents]);

  // Is device locked from choosing a DIFFERENT student?
  const isDeviceLockedToOther = useMemo(() => {
    const isLockActive = currentSession?.securityConfig?.deviceLockEnabled ?? true;
    if (!isLockActive) return false;
    if (isSimulator) return false; // allow switching in simulator mode for teacher demo
    if (devicePriorStudentId && selectedStudentId && devicePriorStudentId !== selectedStudentId) {
      return true;
    }
    return false;
  }, [devicePriorStudentId, selectedStudentId, currentSession, isSimulator]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase().trim();
    return classStudents.filter(st => {
      const fullName = `${st.prefix || ''}${st.firstName} ${st.lastName}`.toLowerCase();
      const numStr = st.studentNo.toString();
      const codeStr = (st.studentIdCode || '').toLowerCase();
      return fullName.includes(q) || numStr === q || codeStr.includes(q);
    });
  }, [classStudents, searchQuery]);

  // Find selected student object
  const selectedStudent = useMemo(() => {
    return classStudents.find(s => s.id === selectedStudentId) || null;
  }, [classStudents, selectedStudentId]);

  // Check if student already checked in
  const alreadyCheckedInMap = useMemo(() => {
    const map: Record<string, { status: AttendanceStatus; remark?: string; isSelfDevice?: boolean }> = {};
    if (currentSession && currentSession.records) {
      Object.entries(currentSession.records).forEach(([stdId, st]) => {
        if (st) {
          map[stdId] = { 
            status: st as AttendanceStatus, 
            remark: currentSession.remarks?.[stdId],
            isSelfDevice: currentSession.deviceRecords?.[stdId] === deviceId
          };
        }
      });
    }
    return map;
  }, [currentSession, deviceId]);

  // Auto-select student if this device already registered them previously
  useEffect(() => {
    if (devicePriorStudentId && !selectedStudentId) {
      setSelectedStudentId(devicePriorStudentId);
    }
  }, [devicePriorStudentId, selectedStudentId]);

  // Handle Form Submission
  const handleCheckin = () => {
    setErrorMessage(null);

    // Check token expiration
    if (isTokenExpired) {
      setErrorMessage('QR Code นี้หมดอายุแล้ว (เนื่องจากรหัส QR หมุนเวียนเปลี่ยนทุก 20 วินาทีเพื่อป้องกันการส่งต่อภาพ) กรุณาสแกนรหัสสดบนจอหน้าห้องใหม่อีกครั้ง');
      return;
    }

    if (!selectedStudent) {
      setErrorMessage('กรุณาเลือกชื่อของตนเองก่อนกดเช็คชื่อ');
      return;
    }

    // Anti-Proxy Check 1: 1-Device Lockdown
    if (isDeviceLockedToOther && priorCheckedStudent) {
      setErrorMessage(`โทรศัพท์เครื่องนี้ได้ใช้เช็คชื่อให้ "${priorCheckedStudent.prefix || ''}${priorCheckedStudent.firstName} ${priorCheckedStudent.lastName}" ไปแล้ว ไม่อนุญาตให้ใช้เครื่องเดียวกันเช็คชื่อแทนเพื่อน`);
      return;
    }

    // Anti-Proxy Check 2: 4-digit PIN verification
    if (isPinRequired && activeRequiredPin) {
      if (!pinInput.trim()) {
        setErrorMessage('กรุณากรอกรหัส PIN 4 หลักที่แสดงอยู่บนจอโปรเจกเตอร์หน้าห้อง');
        return;
      }
      if (pinInput.trim() !== activeRequiredPin) {
        setErrorMessage('รหัส PIN 4 หลักไม่ถูกต้อง กรุณาดูรหัสบนจอหน้าห้องของครูอีกครั้ง');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const isLateCheckin = (currentHour > 8 || (currentHour === 8 && currentMin >= 45));
      const assignedStatus: AttendanceStatus = isLateCheckin ? 'late' : 'present';

      // Build session data
      const subjectToUse = activeSubject || {
        id: 'sub-6101',
        code: 'ว6101',
        name: 'เทคโนโลยี (วิทยาการคำนวณ)',
        gradeLevel: 'ม.6',
      };

      const sessionIdToUse = currentSession?.id || urlParams.session || `att-${subjectToUse.id}-${selectedClass}-${todayStr}`;
      
      const updatedRecords: Record<string, AttendanceStatus> = {
        ...(currentSession?.records || {}),
        [selectedStudent.id]: assignedStatus,
      };

      const updatedRemarks: Record<string, string> = {
        ...(currentSession?.remarks || {}),
        [selectedStudent.id]: `สแกน QR เวลา ${timeStr} น.`,
      };

      // Store deviceId bound to this student
      const updatedDeviceRecords: Record<string, string> = {
        ...(currentSession?.deviceRecords || {}),
        [selectedStudent.id]: deviceId,
      };

      const updatedSession: AttendanceSession = {
        id: sessionIdToUse,
        subjectId: subjectToUse.id,
        subjectCode: subjectToUse.code,
        subjectName: subjectToUse.name,
        className: selectedClass,
        gradeLevel: subjectToUse.gradeLevel || 'ม.6',
        date: currentSession?.date || todayStr,
        period: currentSession?.period || 'คาบเรียนปกติ',
        topic: currentSession?.topic || 'เช็คชื่อด้วยสมาร์ทโฟนผ่าน QR Code',
        records: updatedRecords,
        remarks: updatedRemarks,
        deviceRecords: updatedDeviceRecords,
        securityConfig: currentSession?.securityConfig,
        headcountInRoom: currentSession?.headcountInRoom,
        updatedAt: now.toISOString(),
      };

      onSaveAttendanceSession(updatedSession);

      setCheckinSuccessStudent(selectedStudent);
      setCheckinTimestamp(timeStr);
      setCheckinStatus(assignedStatus);
      setIsSubmitting(false);

      // Audio chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // silent fail
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between ${isSimulator ? 'p-0' : 'p-3 sm:p-6'}`}>
      
      {/* Container Card */}
      <div className="max-w-md w-full mx-auto bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 p-5 text-white relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
                <School className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">
                  {profile.schoolName || 'โรงเรียนสาธิตวิทยาการ'}
                </span>
                <h1 className="text-base font-black leading-tight flex items-center space-x-1.5">
                  <span>เช็คชื่อเข้าเรียนสมาร์ทโฟน</span>
                </h1>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Security Badge Pill */}
          <div className="flex items-center justify-between bg-black/25 backdrop-blur-md rounded-xl px-3 py-1.5 mt-2 text-[10px] text-indigo-200 border border-white/10">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>ระบบความปลอดภัย: ล็อก 1 เครื่องต่อ 1 คน</span>
            </div>
            <span className="font-mono text-emerald-300 font-bold">
              ID: {deviceId.substring(4, 9)}
            </span>
          </div>

          {/* Subject & Teacher Info Pill */}
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-2.5 mt-2 flex items-center justify-between text-xs border border-white/10">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs">
                  {activeSubject?.code} {activeSubject?.name}
                </div>
                <div className="text-[10px] text-indigo-200">
                  ครูผู้สอน: {profile.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {selectedClass}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">

          {/* Token Expired Warning (Photo Screenshot forwarded to friend) */}
          {isTokenExpired && (
            <div className="p-4 bg-rose-950/70 border-2 border-rose-600 rounded-2xl text-rose-200 text-xs space-y-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-2 font-black text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>QR Code นี้หมดอายุแล้ว!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200">
                คุณครูได้เปิดระบบ <strong>Dynamic Rolling QR</strong> เพื่อป้องกันการถ่ายภาพส่งต่อให้เพื่อนนอกห้องเรียน โค้ดแต่ละชุดมีอายุเพียง 20-30 วินาที
              </p>
              <div className="p-2.5 bg-black/40 rounded-xl text-[11px] text-amber-300 font-bold flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>วิธีแก้ไข: เงยหน้าขึ้นมองจอโปรเจกเตอร์ของครู และเปิดกล้องสแกนรหัสสดใหม่อีกครั้ง</span>
              </div>
            </div>
          )}

          {/* Success Screen if checked in */}
          {checkinSuccessStudent ? (
            <div className="space-y-4 text-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mb-2 ${
                  checkinStatus === 'present' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {checkinStatus === 'present' ? '🟢 เช็คชื่อสำเร็จ (มาเรียนตรงเวลา)' : '🟡 เช็คชื่อสำเร็จ (มาสาย)'}
                </span>
                <h2 className="text-xl font-black text-white">
                  {checkinSuccessStudent.prefix || ''}{checkinSuccessStudent.firstName} {checkinSuccessStudent.lastName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  เลขที่ {checkinSuccessStudent.studentNo} • ห้อง {selectedClass} • รหัส {checkinSuccessStudent.studentIdCode || '-'}
                </p>
              </div>

              {/* Digital Attendance Ticket */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">วิชาที่เข้าเรียน:</span>
                  <span className="font-bold text-slate-200">{activeSubject?.name} ({activeSubject?.code})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">วันที่:</span>
                  <span className="font-bold text-slate-200">{todayStr}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">เวลาที่บันทึก:</span>
                  <span className="font-black text-emerald-400">{checkinTimestamp} น.</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">สถานะ:</span>
                  <span className="font-black text-slate-200">
                    {checkinStatus === 'present' ? 'มาเรียน (Present)' : 'มาสาย (Late)'}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5 text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>ผูกอุปกรณ์เครื่องนี้:</span>
                  </span>
                  <span className="font-mono text-emerald-400">สำเร็จ (1 เครื่อง/1 คน)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 text-left flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  ข้อมูลบันทึกส่งตรงถึงจอคุณครูแล้ว เครื่องนี้ถูกล็อกกับชื่อของคุณเพื่อความโปร่งใส ปิดหน้านี้และเตรียมเรียนได้เลยครับ
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckinSuccessStudent(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
              >
                ดูรายละเอียดการเช็คชื่ออีกครั้ง
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Instructions */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-indigo-200">
                <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">
                    ยินดีต้อนรับนักเรียนชั้น {selectedClass}!
                  </p>
                  <p className="text-[11px] text-indigo-200/90 mt-0.5">
                    เลือกชื่อตนเองจากรายการด้านล่าง และยืนยันเพื่อบันทึกเวลาเข้าเรียน (ไม่อนุญาตให้ใช้เครื่องเดียวกันเช็คแทนเพื่อน)
                  </p>
                </div>
              </div>

              {/* Anti-Proxy Alert: If this phone already checked in someone else */}
              {isDeviceLockedToOther && priorCheckedStudent && (
                <div className="p-3.5 bg-rose-950/70 border border-rose-600 rounded-2xl text-rose-200 text-xs space-y-1.5 animate-in shake duration-300">
                  <div className="flex items-center space-x-1.5 font-black text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>คำเตือน: ไม่อนุญาตให้เช็คชื่อแทนเพื่อน!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-200">
                    โทรศัพท์เครื่องนี้ได้บันทึกการเข้าเรียนให้ <strong>"{priorCheckedStudent.prefix || ''}{priorCheckedStudent.firstName} {priorCheckedStudent.lastName}"</strong> ไปแล้วในคาบนี้
                  </p>
                  <div className="text-[10px] text-rose-300/80">
                    ระบบเปิดใช้งานการล็อกอุปกรณ์เพื่อความโปร่งใส หากมีเหตุจำเป็นต้องยืมเครื่อง ให้ติดต่อคุณครูผู้สอนโดยตรง
                  </div>
                </div>
              )}

              {/* Optional Classroom 4-Digit PIN Input */}
              {isPinRequired && (
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 space-y-2">
                  <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>กรอกรหัส PIN 4 หลักประจำคาบ</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (ดูบนจอโปรเจกเตอร์หน้าห้อง)
                    </span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="• • • •"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono font-black text-amber-300 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Search Box */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ค้นหารายชื่อ / เลขที่
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ นามสกุล หรือเลขที่..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-300 absolute right-3 top-2.5"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              {/* Student List Grid / Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    เลือกชื่อตนเอง ({classStudents.length} คนในห้อง)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    เช็คแล้ว {Object.keys(alreadyCheckedInMap).length}/{classStudents.length} คน
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-2xl p-2 bg-slate-900/50">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      ไม่พบชื่อนักเรียนที่ตรงกับการค้นหา
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const isSelected = selectedStudentId === st.id;
                      const checkinInfo = alreadyCheckedInMap[st.id];
                      const isChecked = !!checkinInfo;
                      const isRegisteredOnThisPhone = devicePriorStudentId === st.id;

                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setErrorMessage(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                              : isRegisteredOnThisPhone
                              ? 'bg-indigo-950/30 border-indigo-700/60 text-indigo-200'
                              : isChecked
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200 hover:bg-emerald-900/30'
                              : 'bg-slate-900/90 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-500 text-white'
                                : isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {st.studentNo}
                            </span>
                            <div className="truncate">
                              <span className="font-bold">
                                {st.prefix || ''}{st.firstName} {st.lastName}
                              </span>
                              {st.studentIdCode && (
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                  ({st.studentIdCode})
                                </span>
                              )}
                              {isRegisteredOnThisPhone && (
                                <span className="ml-2 text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/40">
                                  เครื่องของคุณ
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isChecked ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                <span>เช็คแล้ว</span>
                              </span>
                            ) : isSelected ? (
                              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">เลือก</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected Student Confirmation Preview */}
              {selectedStudent && (
                <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-3 text-xs space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                    ยืนยันข้อมูลผู้เช็คชื่อ:
                  </div>
                  <div className="text-sm font-black text-white">
                    {selectedStudent.prefix || ''}{selectedStudent.firstName} {selectedStudent.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                    <span>เลขที่: <strong className="text-slate-200">{selectedStudent.studentNo}</strong></span>
                    <span>ห้อง: <strong className="text-slate-200">{selectedClass}</strong></span>
                    <span>รหัส: <strong className="text-slate-200">{selectedStudent.studentIdCode || '-'}</strong></span>
                  </div>
                </div>
              )}

              {/* Check-in Action Button */}
              <button
                type="button"
                onClick={handleCheckin}
                disabled={!selectedStudent || isSubmitting || isDeviceLockedToOther || isTokenExpired}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                  !selectedStudent || isSubmitting || isDeviceLockedToOther || isTokenExpired
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 active:scale-[0.98]'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {isSubmitting 
                    ? 'กำลังบันทึกข้อมูล...' 
                    : isDeviceLockedToOther 
                    ? 'ล็อกเครื่องแล้ว (เช็คแทนเพื่อนไม่ได้)' 
                    : isTokenExpired 
                    ? 'QR Code หมดอายุ (สแกนใหม่)' 
                    : 'ยืนยันการเช็คชื่อเข้าเรียนทันที'}
                </span>
              </button>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>EduLog Anti-Proxy Security • ป้องกันการเช็คชื่อแทนกัน</span>
        </div>

      </div>

    </div>
  );
};
