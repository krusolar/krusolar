import React, { useState, useEffect } from 'react';
import { TeachingLog, Subject, PostTeachingReflection, StudentStats } from '../types';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Loader2, 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  School,
  Image as ImageIcon
} from 'lucide-react';

// Helper function to extract student count specifically for a selected room/class
const getRoomStudentCount = (subject: Subject, roomName: string): number => {
  if (subject.classDetails && subject.classDetails.length > 0) {
    const detail = subject.classDetails.find(cd => cd.className === roomName);
    if (detail && detail.studentCount > 0) {
      return detail.studentCount;
    }
  }
  if (subject.classes && subject.classes.length > 0) {
    const avg = Math.round(subject.totalStudents / subject.classes.length);
    return avg > 0 ? avg : 35;
  }
  return subject.totalStudents || 35;
};

interface LogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Partial<TeachingLog>) => void;
  subjects: Subject[];
  initialLog?: TeachingLog | null;
}

export const LogFormModal: React.FC<LogFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subjects,
  initialLog,
}) => {
  if (!isOpen) return null;

  // Selected subject
  const defaultSubject = subjects[0] || {
    id: 'sub-1',
    code: 'ว23101',
    name: 'วิทยาศาสตร์พื้นฐาน 5',
    gradeLevel: 'ม.3',
    classes: ['ม.3/1'],
    department: 'วิทยาศาสตร์',
    hoursPerWeek: 3,
    totalStudents: 35
  };

  const [subjectId, setSubjectId] = useState<string>(initialLog?.subjectId || defaultSubject.id);
  const selectedSubject = subjects.find(s => s.id === subjectId) || defaultSubject;

  const [className, setClassName] = useState<string>(initialLog?.className || selectedSubject.classes[0] || 'ม.3/1');
  const [date, setDate] = useState<string>(initialLog?.date || new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>(initialLog?.period || 'คาบที่ 1 (08:30 - 09:20 น.)');
  const [unitTitle, setUnitTitle] = useState<string>(initialLog?.unitTitle || '');
  const [topic, setTopic] = useState<string>(initialLog?.topic || '');
  
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    initialLog?.learningObjectives || ['อธิบายความหมายและแนวคิดสำคัญได้ถูกต้อง', 'ปฏิบัติกิจกรรมกลุ่มร่วมกับเพื่อนได้']
  );
  
  const [teachingMethod, setTeachingMethod] = useState<string>(
    initialLog?.teachingMethod || 'Active Learning (กระบวนการสืบเสาะหาความรู้ 5E)'
  );

  const [mediaToolsInput, setMediaToolsInput] = useState<string>(
    initialLog?.mediaTools?.join(', ') || 'สไลด์การสอน Canva, แบบฝึกหัด'
  );

  const [assessmentInput, setAssessmentInput] = useState<string>(
    initialLog?.assessmentMethods?.join(', ') || 'แบบประเมินพฤติกรรมกลุ่ม, ตรวจแบบฝึกหัด'
  );

  // Initial room-specific student count
  const initialRoomCount = getRoomStudentCount(selectedSubject, initialLog?.className || selectedSubject.classes[0] || 'ม.3/1');

  // Student stats
  const [studentStats, setStudentStats] = useState<StudentStats>(
    initialLog?.studentStats || {
      totalCount: initialRoomCount,
      presentCount: initialRoomCount - 2,
      absentCount: 0,
      sickCount: 1,
      leaveCount: 1,
      lateCount: 0,
    }
  );

  // Reflection
  const [reflection, setReflection] = useState<PostTeachingReflection>(
    initialLog?.reflection || {
      outcomes: '',
      problems: '',
      solutions: '',
    }
  );

  // Image URLs
  const [imageUrls, setImageUrls] = useState<string[]>(initialLog?.imageUrls || []);
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  // AI Loading State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiRawNotes, setAiRawNotes] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Update class and room student stats when subject or selected room changes
  useEffect(() => {
    if (!selectedSubject) return;

    let targetClass = className;
    if (!selectedSubject.classes.includes(className)) {
      targetClass = selectedSubject.classes[0] || 'ม.3/1';
      setClassName(targetClass);
    }

    const roomCount = getRoomStudentCount(selectedSubject, targetClass);

    // If creating a new log, OR if subject/class was edited by user from initial log
    if (!initialLog || initialLog.subjectId !== subjectId || initialLog.className !== targetClass) {
      setStudentStats(prev => {
        const absent = prev.absentCount || 0;
        const sick = prev.sickCount || 0;
        const leave = prev.leaveCount || 0;
        const present = Math.max(0, roomCount - (absent + sick + leave));
        return {
          ...prev,
          totalCount: roomCount,
          presentCount: present,
        };
      });
    }
  }, [subjectId, className]);

  // Objective Handlers
  const handleAddObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const handleUpdateObjective = (index: number, val: string) => {
    const updated = [...learningObjectives];
    updated[index] = val;
    setLearningObjectives(updated);
  };

  const handleRemoveObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  // Image Handlers
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // AI Reflection Call
  const handleGenerateAiReflection = async () => {
    if (!topic.trim()) {
      alert('กรุณากรอก "เรื่อง/หัวข้อที่สอน" ก่อนเรียกใช้ AI');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/generate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selectedSubject.name,
          gradeLevel: selectedSubject.gradeLevel,
          topic: topic,
          teachingMethod: teachingMethod,
          rawNotes: aiRawNotes || 'สอนสนุก นักเรียนสนใจทำกิจกรรมกลุ่ม แต่มีบางคนยังปรับโฟกัสอุปกรณ์ล่าช้า',
          studentStats: studentStats,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างบันทึก');
      }

      setReflection({
        outcomes: data.reflection.outcomes || '',
        problems: data.reflection.problems || '',
        solutions: data.reflection.solutions || '',
      });

    } catch (err: any) {
      console.error('Error generating AI reflection:', err);
      setAiError(err.message || 'ไม่สามารถเชื่อมต่อ AI ได้');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mediaTools = mediaToolsInput.split(',').map(s => s.trim()).filter(Boolean);
    const assessmentMethods = assessmentInput.split(',').map(s => s.trim()).filter(Boolean);

    const logData: Partial<TeachingLog> = {
      id: initialLog?.id || `log-${Date.now()}`,
      subjectId: selectedSubject.id,
      subjectCode: selectedSubject.code,
      subjectName: selectedSubject.name,
      gradeLevel: selectedSubject.gradeLevel,
      className,
      date,
      period,
      unitTitle,
      topic,
      learningObjectives: learningObjectives.filter(o => o.trim().length > 0),
      teachingMethod,
      mediaTools,
      assessmentMethods,
      studentStats,
      reflection,
      imageUrls,
      status: 'completed',
      createdAt: initialLog?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(logData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialLog ? 'แก้ไขบันทึกการจัดกิจกรรมการเรียนรู้' : 'เขียนบันทึกหลังการสอนใหม่'}
              </h2>
              <p className="text-xs text-slate-400">
                กรอกรายละเอียดการสอนและใช้ AI ช่วยร่างบันทึกหลังสอนอย่างมืออาชีพ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          
          {/* Section 1: Subject & Class Information */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4" />
              <span>1. ข้อมูลรายวิชาและเวลาสอน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รายวิชา</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {selectedSubject.classes.map((c) => (
                    <option key={c} value={c}>
                      ห้อง {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่สอน</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คาบเรียน / เวลา</label>
                <input
                  type="text"
                  placeholder="เช่น คาบที่ 2-3 (09:20 - 11:00 น.)"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Topic & Objectives */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4" />
              <span>2. เนื้อหาและจุดประสงค์การเรียนรู้</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยการเรียนรู้</label>
                <input
                  type="text"
                  placeholder="เช่น หน่วยที่ 2 พันธุศาสตร์และการถ่ายทอด"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เรื่องที่สอน (Topic)</label>
                <input
                  type="text"
                  placeholder="เช่น การแบ่งเซลล์แบบไมโทซิสและไมโอซิส"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>
            </div>

            {/* Learning Objectives Dynamic List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">ตัวชี้วัด / จุดประสงค์การเรียนรู้</label>
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="text-xs text-indigo-600 hover:underline font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มจุดประสงค์</span>
                </button>
              </div>

              {learningObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-400 w-4 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleUpdateObjective(idx, e.target.value)}
                    placeholder="ระบุจุดประสงค์การเรียนรู้..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  {learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Teaching Method & Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รูปแบบ/เทคนิคการสอน</label>
                <input
                  type="text"
                  placeholder="เช่น Active Learning 5E, PBL"
                  value={teachingMethod}
                  onChange={(e) => setTeachingMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สื่อ/อุปกรณ์ที่ใช้ (คั่นด้วย comma)</label>
                <input
                  type="text"
                  placeholder="เช่น Canva, กล้องจุลทรรศน์, ใบงาน"
                  value={mediaToolsInput}
                  onChange={(e) => setMediaToolsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">การวัดและประเมินผล</label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจใบงาน, สังเกตพฤติกรรมกลุ่ม"
                  value={assessmentInput}
                  onChange={(e) => setAssessmentInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Student Attendance Stats */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>3. สถิติการเข้าเรียนของนักเรียน</span>
              </div>
              <div className="text-xs font-semibold text-indigo-900 bg-indigo-50/90 px-3 py-1 rounded-xl border border-indigo-200/70 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>เฉพาะนักเรียนห้อง <strong className="text-indigo-900 font-bold underline decoration-indigo-300">ห้อง {className}</strong> (จำนวนเต็มตามทะเบียน: {studentStats.totalCount} คน)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  จำนวนเต็ม (ห้อง {className})
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.totalCount}
                  onChange={(e) => {
                    const total = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => ({
                      ...prev,
                      totalCount: total,
                      presentCount: Math.max(0, total - (prev.absentCount + prev.sickCount + prev.leaveCount))
                    }));
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                  มาเรียน
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.presentCount}
                  onChange={(e) => {
                    const present = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => ({ ...prev, presentCount: present }));
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 font-bold bg-emerald-50 text-emerald-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                  ขาดเรียน
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.absentCount}
                  onChange={(e) => {
                    const absent = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => {
                      const present = Math.max(0, prev.totalCount - (absent + prev.sickCount + prev.leaveCount));
                      return { ...prev, absentCount: absent, presentCount: present };
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-rose-700 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  ลาป่วย
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.sickCount}
                  onChange={(e) => {
                    const sick = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => {
                      const present = Math.max(0, prev.totalCount - (prev.absentCount + sick + prev.leaveCount));
                      return { ...prev, sickCount: sick, presentCount: present };
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-amber-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  ลากิจ
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.leaveCount}
                  onChange={(e) => {
                    const leave = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => {
                      const present = Math.max(0, prev.totalCount - (prev.absentCount + prev.sickCount + leave));
                      return { ...prev, leaveCount: leave, presentCount: present };
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-amber-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-700 mb-1">
                  มาสาย
                </label>
                <input
                  type="number"
                  min={0}
                  value={studentStats.lateCount}
                  onChange={(e) => {
                    const late = Math.max(0, Number(e.target.value) || 0);
                    setStudentStats(prev => ({ ...prev, lateCount: late }));
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-purple-700 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              * ระบบแสดงเฉพาะสถิติจำนวนนักเรียนของ<strong className="text-indigo-800 font-medium">ห้อง {className}</strong> และคำนวณจำนวนมาเรียนให้อัตโนมัติ ({studentStats.totalCount} - ขาด/ลา)
            </p>
          </div>

          {/* Section 4: Post-Teaching Reflection (บันทึกหลังสอน) with AI ASSISTANT */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 p-5 rounded-2xl border-2 border-indigo-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div>
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>4. บันทึกหลังการจัดกิจกรรมการเรียนรู้ (Post-Lesson Reflection)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  พิมพ์ด้วยตนเอง หรือป้อนโน้ตสั้นๆ แล้วให้ AI ช่วยวิเคราะห์เขียนให้อย่างเป็นทางการ
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateAiReflection}
                  disabled={isAiGenerating}
                  className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI กำลังเขียนร่าง...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ AI ช่วยร่างบันทึกหลังสอน</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional AI Prompt Helper Input */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5">
              <label className="block text-[11px] font-bold text-indigo-900">
                โน้ตสั้นๆ สำหรับให้ AI ช่วยขยายความ (ตัวเลือก):
              </label>
              <input
                type="text"
                placeholder="เช่น สอนสนุก นักเรียนกลุ่ม 2 ทำทดลองเสร็จเร็ว แต่มี 3 คนปรับกล้องไม่ได้"
                value={aiRawNotes}
                onChange={(e) => setAiRawNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
              {aiError && (
                <p className="text-[11px] text-rose-600 font-medium">{aiError}</p>
              )}
            </div>

            {/* 3 Reflection Text Areas */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1) ผลการจัดการเรียนรู้ (Student Achievements & Outcomes)
                </label>
                <textarea
                  rows={3}
                  value={reflection.outcomes}
                  onChange={(e) => setReflection({ ...reflection, outcomes: e.target.value })}
                  placeholder="อธิบายความรู้ ความเข้าใจ ทักษะ และพฤติกรรมที่เกิดขึ้นกับนักเรียน..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2) ปัญหา / อุปสรรค (Problems & Obstacles)
                </label>
                <textarea
                  rows={2}
                  value={reflection.problems}
                  onChange={(e) => setReflection({ ...reflection, problems: e.target.value })}
                  placeholder="อธิบายอุปสรรคเชิงเทคนิค เวลา สื่อ หรือกลุ่มนักเรียนที่ยังไม่ผ่านจุดประสงค์..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3) ข้อเสนอแนะ / แนวทางการแก้ไข (Solutions & Remediation Action Plan)
                </label>
                <textarea
                  rows={2}
                  value={reflection.solutions}
                  onChange={(e) => setReflection({ ...reflection, solutions: e.target.value })}
                  placeholder="ระบุแนวทางปรับปรุงในคาบถัดไป การสอนซ่อมเสริม หรือการติดตามรายบุคคล..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: Image Attachments */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4" />
              <span>5. แนบรูปภาพบรรยากาศการเรียนรู้ / ผลงานนักเรียน</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="url"
                placeholder="ป้อน URL รูปภาพ (เช่น https://images.unsplash.com/...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                + เพิ่มรูป
              </button>
            </div>

            {/* Image Preview List */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100">
                    <img src={url} alt={`แนบรูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการสอน</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
