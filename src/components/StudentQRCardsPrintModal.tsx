import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Student, Subject, TeacherProfile } from '../types';
import { 
  Printer, 
  X, 
  QrCode, 
  Download, 
  School, 
  UserCheck, 
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';

interface StudentQRCardsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  subjects: Subject[];
  profile: TeacherProfile;
  initialClass?: string;
}

export const StudentQRCardsPrintModal: React.FC<StudentQRCardsPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  subjects,
  profile,
  initialClass = 'ม.6/1',
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [printMode, setPrintMode] = useState<'individual_cards' | 'classroom_poster'>('individual_cards');
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [posterQrUrl, setPosterQrUrl] = useState<string>('');

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => set.add(s.className));
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['ม.6/1', 'ม.6/2', 'ม.3/1', 'ม.1/1'];
  }, [students]);

  // Students in selected class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, selectedClass]);

  // Subject matching class
  const matchingSubject = useMemo(() => {
    return subjects.find(s => s.classes?.includes(selectedClass)) || subjects[0];
  }, [subjects, selectedClass]);

  // Generate individual QR codes for each student in the class
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window === 'undefined') return;
    const base = window.location.origin + window.location.pathname;

    // Generate Classroom Poster QR
    const posterUrl = `${base}?checkin=auto&class=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(matchingSubject?.id || '')}`;
    QRCode.toDataURL(posterUrl, { width: 400, margin: 2, errorCorrectionLevel: 'H' })
      .then(url => setPosterQrUrl(url))
      .catch(console.error);

    // Generate Individual Student QR Badges
    const map: Record<string, string> = {};
    const promises = classStudents.map(st => {
      const studentUrl = `${base}?checkin=auto&class=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(matchingSubject?.id || '')}&studentId=${encodeURIComponent(st.id)}`;
      return QRCode.toDataURL(studentUrl, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
        .then(url => {
          map[st.id] = url;
        });
    });

    Promise.all(promises).then(() => {
      setQrCodeMap({ ...map });
    });
  }, [isOpen, selectedClass, classStudents, matchingSubject]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      
      {/* Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-w-none print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white">
        
        {/* Top Header (Hidden when printing) */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">พิมพ์บัตรและโปสเตอร์ QR Code เช็คชื่อ</h2>
              <p className="text-xs text-slate-400">
                สำหรับนักเรียนมัธยมศึกษาปีที่ 6 (ม.6) หรือทุกระดับชั้น พิมพ์ติดโต๊ะเรียนหรือพกติดตัว
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Class Selector */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>ห้อง {cls}</option>
              ))}
            </select>

            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('individual_cards')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  printMode === 'individual_cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                บัตรประจำตัวรายคน
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('classroom_poster')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  printMode === 'classroom_poster' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                โปสเตอร์ติดหน้าห้อง
              </button>
            </div>

            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ (Print)</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 text-slate-900 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          {printMode === 'individual_cards' ? (
            <div>
              {/* Note on top of printable cards */}
              <div className="mb-4 text-center text-xs text-slate-500 print:mb-2">
                <span className="font-bold text-slate-800">บัตร QR Code เช็คชื่อนักเรียนชั้น {selectedClass}</span> • {profile.schoolName || 'โรงเรียนสาธิตวิทยาการ'} • วิชา {matchingSubject?.name || 'เทคโนโลยี'}
              </div>

              {/* Grid of Badges: 4 or 6 per page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
                {classStudents.map(st => (
                  <div
                    key={st.id}
                    className="bg-white rounded-2xl border-2 border-slate-300 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden print:border-slate-400 print:shadow-none print:break-inside-avoid"
                  >
                    {/* Top colored stripe */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 to-sky-500" />
                    
                    <div>
                      {/* Header in card */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <div className="flex items-center space-x-1.5">
                          <School className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-black text-slate-700 uppercase">
                            บัตรเช็คชื่อดิจิทัล
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {st.className}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="text-center my-1">
                        <div className="text-sm font-black text-slate-900 leading-tight">
                          {st.prefix || ''}{st.firstName} {st.lastName}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          เลขที่ {st.studentNo} {st.studentIdCode ? `• รหัส ${st.studentIdCode}` : ''}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex justify-center my-2">
                        {qrCodeMap[st.id] ? (
                          <img
                            src={qrCodeMap[st.id]}
                            alt={`QR Code ${st.firstName}`}
                            className="w-28 h-28 object-contain rounded-lg border border-slate-200 p-1 bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                            สร้าง QR...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Instructions */}
                    <div className="text-center pt-2 border-t border-slate-100 text-[9px] text-slate-400">
                      สแกนด้วยสมาร์ทโฟนเพื่อเช็คชื่อเข้าเรียนอัตโนมัติ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Classroom Poster Mode */
            <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border-4 border-indigo-600 shadow-xl text-center space-y-6 print:border-4 print:shadow-none print:p-8">
              
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-md">
                  <School className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-black text-slate-800">
                  {profile.schoolName || 'โรงเรียนสาธิตวิทยาการ'}
                </h2>
                <div className="inline-block px-4 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900">
                  ระบบเช็คชื่อด้วยสมาร์ทโฟน (Smart Classroom Attendance)
                </div>
              </div>

              <div className="border-y-2 border-dashed border-slate-200 py-4">
                <h3 className="text-2xl font-black text-indigo-950">
                  ห้องเรียน {selectedClass}
                </h3>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  วิชา {matchingSubject?.name} ({matchingSubject?.code})
                </p>
                <p className="text-xs text-slate-500">
                  ครูผู้สอน: {profile.name}
                </p>
              </div>

              {/* Big Poster QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-lg">
                  {posterQrUrl ? (
                    <img 
                      src={posterQrUrl} 
                      alt="Classroom QR Code Poster" 
                      className="w-64 h-64 object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">
                      กำลังสร้าง QR Code โปสเตอร์...
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1">
                  <div className="text-base font-black text-slate-900">
                    ให้นักเรียนเปิดกล้องสมาร์ทโฟน แล้วสแกนเพื่อเช็คชื่อ
                  </div>
                  <div className="text-xs text-slate-500">
                    1. สแกน QR Code &nbsp;|&nbsp; 2. เลือกชื่อตนเอง &nbsp;|&nbsp; 3. กดยืนยันการเข้าเรียน
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                EduLog Attendance System • ข้อมูลจะถูกบันทึกเข้าระบบครูผู้สอนแบบเรียลไทม์ทันที
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
