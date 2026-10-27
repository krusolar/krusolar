import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { AttendanceSession, Student, Subject, TeacherProfile, AttendanceSecurityConfig } from '../types';
import { 
  QrCode, 
  X, 
  Smartphone, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Users, 
  UserCheck, 
  Sparkles, 
  Printer, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  Eye,
  Sliders,
  Settings,
  HelpCircle,
  Hash
} from 'lucide-react';
import { StudentQRCheckinPortal } from './StudentQRCheckinPortal';

interface QRCodePresenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AttendanceSession;
  students: Student[];
  subjects: Subject[];
  profile: TeacherProfile;
  onSaveSession: (session: AttendanceSession) => void;
  onPrintQRCards?: () => void;
}

// Generate random 4-digit PIN
const generateRandomPin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const QRCodePresenterModal: React.FC<QRCodePresenterModalProps> = ({
  isOpen,
  onClose,
  session,
  students,
  subjects,
  profile,
  onSaveSession,
  onPrintQRCards,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPhoneSimulator, setShowPhoneSimulator] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSecurityDrawer, setShowSecurityDrawer] = useState<boolean>(false);

  // Security Configuration
  const [securityConfig, setSecurityConfig] = useState<AttendanceSecurityConfig>(() => ({
    dynamicQrEnabled: session.securityConfig?.dynamicQrEnabled ?? true,
    deviceLockEnabled: session.securityConfig?.deviceLockEnabled ?? true,
    pinCodeEnabled: session.securityConfig?.pinCodeEnabled ?? false,
    currentPin: session.securityConfig?.currentPin || generateRandomPin(),
    qrTokenIntervalSeconds: session.securityConfig?.qrTokenIntervalSeconds || 20,
    geoCheckEnabled: session.securityConfig?.geoCheckEnabled ?? false,
  }));

  // Dynamic Rolling Token for Anti-Proxy (Screenshot protection)
  const [currentToken, setCurrentToken] = useState<string>(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<number>(20);
  const [tokenTimestamp, setTokenTimestamp] = useState<number>(Date.now());

  // Headcount verification (Physical students in room vs System count)
  const [physicalHeadcount, setPhysicalHeadcount] = useState<number | string>(
    session.headcountInRoom !== undefined ? session.headcountInRoom : ''
  );

  // Timer state for projector presentation
  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Target class students
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === session.className)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, session.className]);

  // Rolling token countdown & rotation
  useEffect(() => {
    if (!securityConfig.dynamicQrEnabled) return;

    const interval = setInterval(() => {
      setTokenTimeRemaining(prev => {
        if (prev <= 1) {
          // Generate new token
          const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
          setCurrentToken(newToken);
          setTokenTimestamp(Date.now());
          return securityConfig.qrTokenIntervalSeconds || 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [securityConfig.dynamicQrEnabled, securityConfig.qrTokenIntervalSeconds]);

  // Update session security config when changed
  const handleUpdateSecurity = (newConfig: Partial<AttendanceSecurityConfig>) => {
    const updated = { ...securityConfig, ...newConfig };
    setSecurityConfig(updated);
    onSaveSession({
      ...session,
      securityConfig: updated,
      headcountInRoom: physicalHeadcount !== '' ? Number(physicalHeadcount) : undefined,
    });
  };

  // Generate URL for check-in with security parameters
  const checkinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('checkin', session.id);
    params.set('class', session.className);
    params.set('subject', session.subjectId);
    
    if (securityConfig.dynamicQrEnabled) {
      params.set('token', currentToken);
      params.set('tms', tokenTimestamp.toString());
    }
    if (securityConfig.pinCodeEnabled && securityConfig.currentPin) {
      params.set('reqPin', '1');
    }
    if (securityConfig.deviceLockEnabled) {
      params.set('devLock', '1');
    }

    return `${base}?${params.toString()}`;
  }, [session.id, session.className, session.subjectId, securityConfig, currentToken, tokenTimestamp]);

  // Generate QR Code data URL whenever checkinUrl changes
  useEffect(() => {
    if (!checkinUrl) return;
    QRCode.toDataURL(checkinUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR Code:', err));
  }, [checkinUrl]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Checked-in students count and live list
  const { checkedInCount, checkedInList, duplicateDevices } = useMemo(() => {
    const list: { student: Student; status: string; remark?: string; deviceId?: string; isDuplicateDevice?: boolean }[] = [];
    let count = 0;
    const deviceOccurrences: Record<string, string[]> = {}; // deviceId -> studentIds

    // Track devices to detect proxy check-in from same device
    if (session.deviceRecords) {
      Object.entries(session.deviceRecords).forEach(([sId, devId]) => {
        const dId = String(devId);
        if (!deviceOccurrences[dId]) deviceOccurrences[dId] = [];
        deviceOccurrences[dId].push(sId);
      });
    }

    const dupDevices = new Set<string>();
    Object.entries(deviceOccurrences).forEach(([devId, studentIds]) => {
      if (studentIds.length > 1) {
        dupDevices.add(devId);
      }
    });

    classStudents.forEach(st => {
      const rec = session.records?.[st.id];
      if (rec && rec !== 'absent') {
        count++;
        const devId = session.deviceRecords?.[st.id];
        list.push({
          student: st,
          status: rec,
          remark: session.remarks?.[st.id],
          deviceId: devId,
          isDuplicateDevice: devId ? dupDevices.has(devId) : false,
        });
      }
    });

    return { 
      checkedInCount: count, 
      checkedInList: list,
      duplicateDevices: dupDevices.size
    };
  }, [classStudents, session.records, session.remarks, session.deviceRecords]);

  // Headcount Discrepancy Calculation
  const headcountDiff = useMemo(() => {
    if (physicalHeadcount === '' || isNaN(Number(physicalHeadcount))) return null;
    const physical = Number(physicalHeadcount);
    return checkedInCount - physical; // > 0 means someone scanned from outside or proxy!
  }, [physicalHeadcount, checkedInCount]);

  // Play audio when checkedInCount increments
  const prevCountRef = useRef(checkedInCount);
  useEffect(() => {
    if (checkedInCount > prevCountRef.current && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // audio context silent fail
      }
    }
    prevCountRef.current = checkedInCount;
  }, [checkedInCount, soundEnabled]);

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Format time mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Refresh PIN code
  const handleRegeneratePin = () => {
    const newPin = generateRandomPin();
    handleUpdateSecurity({ currentPin: newPin });
  };

  // Immediate token refresh
  const handleForceRefreshToken = () => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCurrentToken(newToken);
    setTokenTimestamp(Date.now());
    setTokenTimeRemaining(securityConfig.qrTokenIntervalSeconds || 20);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Modal Card */}
      <div className={`w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-2 z-50' : 'max-w-6xl max-h-[94vh]'
      }`}>
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 py-4 border-b border-indigo-700/50 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  LIVE SECURE QR
                </span>
                <span className="text-xs text-indigo-200">
                  ห้อง {session.className} • {session.subjectCode} {session.subjectName}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5 flex items-center space-x-2">
                <span>สแกน QR Code เช็คชื่อด้วยสมาร์ทโฟน</span>
                {securityConfig.dynamicQrEnabled && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ระบบป้องกันสแกนแทนเพื่อน เปิดใช้งาน</span>
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Anti-Proxy Security Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowSecurityDrawer(!showSecurityDrawer)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showSecurityDrawer
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
              }`}
              title="ตั้งค่าระบบป้องกันนักเรียนสแกนแทนกัน"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ความปลอดภัย & ป้องกันแอบสแกน</span>
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-indigo-600/50 border-indigo-500 text-indigo-200' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือนเมื่อนักเรียนเช็คชื่อ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Phone simulator button */}
            <button
              type="button"
              onClick={() => setShowPhoneSimulator(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>ทดสอบมือถือ</span>
            </button>

            {/* Print QR Cards button */}
            {onPrintQRCards && (
              <button
                type="button"
                onClick={onPrintQRCards}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>บัตร QR</span>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'ย่อหน้าต่าง' : 'เต็มจอสำหรับฉายโปรเจกเตอร์'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Settings Dropdown Panel */}
        {showSecurityDrawer && (
          <div className="bg-slate-950 border-b border-amber-500/30 p-4 sm:p-5 text-slate-200 animate-in slide-in-from-top duration-200">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm text-white">
                    ตั้งค่าระบบป้องกันนักเรียนสแกนแทนเพื่อน (Anti-Proxy Buddy Punching Suite)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecurityDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ปิดแผงตั้งค่า ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Dynamic Rolling QR */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  securityConfig.dynamicQrEnabled 
                    ? 'bg-indigo-950/40 border-indigo-500/50' 
                    : 'bg-slate-900 border-slate-800 opacity-70'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-indigo-300 flex items-center space-x-1.5">
                      <RefreshCw className="w-4 h-4" />
                      <span>1. QR สดเปลี่ยนทุก 20 วินาที</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={securityConfig.dynamicQrEnabled}
                      onChange={(e) => handleUpdateSecurity({ dynamicQrEnabled: e.target.checked })}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ป้องกันนักเรียนถ่ายรูป QR แล้วส่งต่อใน LINE/แชท ให้เพื่อนที่อยู่บ้านสแกน เพราะ QR Code จะหมดอายุทันทีภายใน 20-30 วินาที
                  </p>
                </div>

                {/* 2. Device Lockdown */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  securityConfig.deviceLockEnabled 
                    ? 'bg-emerald-950/40 border-emerald-500/50' 
                    : 'bg-slate-900 border-slate-800 opacity-70'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                      <Lock className="w-4 h-4" />
                      <span>2. ล็อก 1 เครื่องต่อ 1 คน</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={securityConfig.deviceLockEnabled}
                      onChange={(e) => handleUpdateSecurity({ deviceLockEnabled: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ป้องกันเพื่อนคนเดียวในห้องใช้มือถือกดเลือกชื่อเพื่อนที่ขาดเรียนแล้วกดยืนยันวนหลายๆ รอบ ระบบจะผูกรหัสเครื่อง (Device ID) บล็อกทันที
                  </p>
                </div>

                {/* 3. Classroom 4-Digit PIN */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  securityConfig.pinCodeEnabled 
                    ? 'bg-amber-950/40 border-amber-500/50' 
                    : 'bg-slate-900 border-slate-800 opacity-70'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>3. รหัส 4 หลักหน้าห้อง</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={securityConfig.pinCodeEnabled}
                      onChange={(e) => handleUpdateSecurity({ pinCodeEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                    นักเรียนต้องกรอกรหัส 4 หลักที่แสดงบนจอโปรเจกเตอร์หน้าห้องเท่านั้น คนที่ไม่ได้อยู่ในห้องจะไม่รู้รหัสนี้
                  </p>
                  {securityConfig.pinCodeEnabled && (
                    <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/30">
                      <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                        PIN: {securityConfig.currentPin}
                      </span>
                      <button
                        type="button"
                        onClick={handleRegeneratePin}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded cursor-pointer"
                      >
                        สุ่มรหัสใหม่
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Headcount match tool */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-200">
                    นับยอดคนจริงในห้อง (Fast Headcount Cross-Check):
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={classStudents.length}
                    placeholder="เช่น 38"
                    value={physicalHeadcount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhysicalHeadcount(val);
                      onSaveSession({
                        ...session,
                        headcountInRoom: val !== '' ? Number(val) : undefined,
                      });
                    }}
                    className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-slate-400">คน</span>
                </div>

                {headcountDiff !== null && (
                  <div className="flex items-center space-x-2">
                    {headcountDiff > 0 ? (
                      <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>ยอดในระบบ ({checkedInCount}) เกินคนจริงในห้อง ({physicalHeadcount}) อยู่ {headcountDiff} คน! มีการสแกนแทนกัน</span>
                      </span>
                    ) : headcountDiff === 0 ? (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center space-x-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>ยอดในระบบตรงกับคนจริงในห้องพอดี ({checkedInCount} คน)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        คนในห้อง {physicalHeadcount} คน (ยังสแกนไม่ครบอีก {Math.abs(headcountDiff)} คน)
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Big QR Code for Projector (Col 7) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 relative">
            
            {/* Top instruction pill */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>นักเรียนเปิดกล้อง หรือสแกนผ่าน LINE บนหน้าจอนี้</span>
                </span>
                
                {securityConfig.dynamicQrEnabled && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic QR สด</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                วิชา {session.subjectName} ({session.subjectCode})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {session.className} • วันที่ {session.date} • {session.period || 'คาบเรียนปกติ'}
              </p>
            </div>

            {/* Dynamic Rolling Token Live Indicator */}
            {securityConfig.dynamicQrEnabled && (
              <div className="w-full max-w-sm mb-3 bg-slate-900 border border-indigo-500/30 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="relative flex items-center justify-center w-7 h-7">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">รหัสหมุนเวียน (Dynamic Token):</div>
                    <div className="font-mono font-black text-emerald-300 text-sm tracking-wider">
                      {currentToken}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">หมดอายุใน:</div>
                  <div className="font-mono font-black text-amber-300 text-sm">
                    {tokenTimeRemaining}s
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleForceRefreshToken}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 text-[10px] font-bold border border-indigo-500/40 cursor-pointer"
                  title="หมุนรหัส QR ทันที"
                >
                  เปลี่ยนรหัส
                </button>
              </div>
            )}

            {/* The QR Code Card */}
            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/40 relative group">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code สำหรับเช็คชื่อเข้าเรียน" 
                  className="w-56 h-56 sm:w-72 sm:h-72 object-contain rounded-2xl"
                />
              ) : (
                <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center text-slate-400 text-xs">
                  กำลังสร้าง QR Code...
                </div>
              )}

              {/* Logo / Badge in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
                  ม.6
                </div>
              </div>
            </div>

            {/* Optional 4-Digit Classroom PIN Badge on screen */}
            {securityConfig.pinCodeEnabled && (
              <div className="mt-4 bg-amber-400 text-slate-950 px-5 py-2 rounded-2xl shadow-xl flex items-center space-x-3 border-2 border-white animate-bounce" style={{ animationDuration: '2.5s' }}>
                <KeyRound className="w-6 h-6 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider">
                    รหัส PIN ประจำห้องเรียน
                  </div>
                  <div className="font-mono text-2xl font-black tracking-widest leading-none">
                    {securityConfig.currentPin}
                  </div>
                </div>
              </div>
            )}

            {/* Timer and Progress */}
            <div className="w-full max-w-sm mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>เวลาเปิดรับเช็คชื่อ:</span>
                </span>
                <span className={`font-mono text-sm font-black ${
                  secondsRemaining < 180 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}>
                  {formatTimer(secondsRemaining)} นาที
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    secondsRemaining < 180 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-indigo-500'
                  }`}
                  style={{ width: `${Math.max(0, (secondsRemaining / (timerDurationMinutes * 60)) * 100)}%` }}
                />
              </div>

              {/* Timer controls */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title={isTimerRunning ? 'หยุดเวลาชั่วคราว' : 'เดินเวลาต่อ'}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsRemaining(timerDurationMinutes * 60)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="รีเซ็ตเวลา"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span>ปรับเวลา:</span>
                  {[5, 10, 15, 20].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setTimerDurationMinutes(m);
                        setSecondsRemaining(m * 60);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        timerDurationMinutes === m
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {m}น.
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Anti-Proxy Quick Security Badges */}
            <div className="w-full max-w-sm mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">1 เครื่องต่อ 1 คน: {securityConfig.deviceLockEnabled ? 'เปิด' : 'ปิด'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-300 truncate">รหัสสดหมดอายุ: 20 วินาที</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Real-time Check-in Feed & Fraud Detection (Col 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Live Stats KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>สแกนเช็คชื่อแล้ว</span>
                </span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {checkedInCount} <span className="text-sm font-bold text-slate-400">/ {classStudents.length} คน</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {classStudents.length > 0 ? Math.round((checkedInCount / classStudents.length) * 100) : 0}% ของนักเรียนในห้อง
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>ยังไม่ได้เช็ค</span>
                </span>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  {Math.max(0, classStudents.length - checkedInCount)} <span className="text-sm font-bold text-slate-400">คน</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {classStudents.length - checkedInCount === 0 ? 'มาครบทุกคนแล้ว 🎉' : 'รอนักเรียนสแกนเพิ่ม'}
                </div>
              </div>
            </div>

            {/* Suspicious Proxy Activity Warning if duplicate devices found */}
            {duplicateDevices > 0 && (
              <div className="p-3 bg-rose-950/60 border border-rose-600/80 rounded-2xl text-rose-200 text-xs flex items-start space-x-2.5 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-rose-200">
                    ตรวจพบเครื่องสมาร์ทโฟนซ้ำกัน ({duplicateDevices} เครื่อง)!
                  </div>
                  <div className="text-[11px] text-rose-300 mt-0.5">
                    มีนักเรียนใช้มือถือเครื่องเดียวกันเช็คชื่อมากกว่า 1 คน กรุณาดูรายการที่มีแถบเตือนสีแดงด้านล่าง
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Feed List */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[320px]">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black text-slate-200">
                    ความเคลื่อนไหวสด (Live Feed)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800">
                    อัปเดตอัตโนมัติ
                  </span>
                </div>
              </div>

              {/* Feed Items Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {checkedInList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                    <p className="font-bold text-slate-400">กำลังรอให้นักเรียนสแกน QR Code...</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      เมื่อนักเรียนกดยืนยันผ่านสมาร์ทโฟน รายชื่อและรหัสเครื่องจะปรากฏขึ้นที่นี่ทันที
                    </p>
                  </div>
                ) : (
                  checkedInList.map(({ student, status, remark, deviceId, isDuplicateDevice }) => (
                    <div 
                      key={student.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all duration-300 ${
                        isDuplicateDevice
                          ? 'bg-rose-950/40 border-rose-700/80 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isDuplicateDevice
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                        }`}>
                          {student.studentNo}
                        </span>
                        <div className="truncate">
                          <div className="font-bold truncate flex items-center space-x-1.5">
                            <span>{student.prefix || ''}{student.firstName} {student.lastName}</span>
                            {isDuplicateDevice && (
                              <span className="text-[9px] font-black bg-rose-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                                เครื่องซ้ำ!
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                            <span>{remark || 'สแกน QR สำเร็จ'}</span>
                            {deviceId && (
                              <span className="text-slate-500 font-mono text-[9px]">
                                • Dev: {deviceId.substring(0, 6)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          status === 'present' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {status === 'present' ? 'มาเรียน' : 'มาสาย'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Security info footer */}
              <div className="p-2.5 bg-slate-900/80 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center space-x-1 text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>ระบบตรวจจับเครื่องซ้ำแบบเรียลไทม์</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityDrawer(true)}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  ปรับการตั้งค่าความปลอดภัย
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Embedded Mobile Phone Simulator Modal */}
      {showPhoneSimulator && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-[40px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl">
            {/* Phone notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2" />
            
            <StudentQRCheckinPortal
              sessionId={session.id}
              defaultClassName={session.className}
              defaultSubjectId={session.subjectId}
              sessions={[session]}
              students={students}
              subjects={subjects}
              profile={profile}
              onSaveAttendanceSession={onSaveSession}
              onClose={() => setShowPhoneSimulator(false)}
              isSimulator={true}
              expectedToken={currentToken}
              expectedPin={securityConfig.pinCodeEnabled ? securityConfig.currentPin : undefined}
            />
          </div>
        </div>
      )}

    </div>
  );
};
