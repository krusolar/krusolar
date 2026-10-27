import React, { useState, useMemo } from 'react';
import { 
  Subject, 
  Student, 
  TeacherProfile, 
  Gradebook, 
  Assignment, 
  StudentScoreRecord,
  GradebookConfig
} from '../types';
import { 
  getLevelTypeFromGradeLevel, 
  getDefaultGradebookConfig, 
  calculateStudentGrade,
  getGradeBadgeStyle 
} from '../utils/gradeCalculator';
import { exportPP5ToExcel } from '../utils/pp5ExcelExport';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Printer, 
  Download, 
  Calculator, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  X,
  Save,
  Check,
  RefreshCw,
  Info,
  FileSpreadsheet
} from 'lucide-react';

interface GradebookManagerProps {
  subjects: Subject[];
  students: Student[];
  profile: TeacherProfile;
  gradebooks: Gradebook[];
  onSaveGradebook: (gradebook: Gradebook) => void;
  onDeleteGradebook?: (gradebookId: string) => void;
}

export const GradebookManager: React.FC<GradebookManagerProps> = ({
  subjects,
  students,
  profile,
  gradebooks,
  onSaveGradebook,
  onDeleteGradebook
}) => {
  // Selection State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  const availableClasses = useMemo(() => {
    return currentSubject?.classes || [];
  }, [currentSubject]);

  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || 'ม.3/1');

  // Update selected class if subject changes
  React.useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  const [academicYear, setAcademicYear] = useState<string>(profile.academicYear || '2567');
  const [term, setTerm] = useState<'1' | '2' | 'yearly'>('1');

  // Auto-detect level type based on subject's grade level
  const detectedLevelType = useMemo(() => {
    return getLevelTypeFromGradeLevel(currentSubject?.gradeLevel || 'ม.3');
  }, [currentSubject]);

  // Find or create current gradebook for selection
  const safeClassStr = selectedClass.replace(/[\/\\#?]/g, '-');
  const gradebookId = `${selectedSubjectId}_${safeClassStr}_${academicYear}_${detectedLevelType === 'primary' ? 'yearly' : term}`;

  const currentGradebook = useMemo(() => {
    const rawLegacyId = `${selectedSubjectId}_${selectedClass}_${academicYear}_${detectedLevelType === 'primary' ? 'yearly' : term}`;
    const existing = gradebooks.find(gb => gb.id === gradebookId || gb.id === rawLegacyId || (gb.subjectId === selectedSubjectId && gb.className === selectedClass));
    if (existing) {
      // Ensure the returned gradebook uses the sanitized id
      return { ...existing, id: gradebookId };
    }

    // Default Fallback Initial Gradebook
    const defaultConfig = getDefaultGradebookConfig(detectedLevelType, term);
    return {
      id: gradebookId,
      subjectId: selectedSubjectId,
      subjectCode: currentSubject?.code || 'ว00000',
      subjectName: currentSubject?.name || 'วิชาเรียน',
      className: selectedClass,
      academicYear,
      config: defaultConfig,
      assignments: [
        { id: 'asg-default-1', title: 'งานที่ 1: ใบงานประจำหน่วย', maxScore: 10, category: 'work' },
        { id: 'asg-default-2', title: 'งานที่ 2: แบบทดสอบย่อย', maxScore: 10, category: 'quiz' }
      ],
      studentScores: {},
      updatedAt: new Date().toISOString()
    } as Gradebook;
  }, [gradebooks, gradebookId, selectedSubjectId, selectedClass, academicYear, term, currentSubject, detectedLevelType]);

  // Filter students for the active class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .sort((a, b) => a.studentNo - b.studentNo);
  }, [students, selectedClass]);

  // Modal States
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState<number>(10);

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Quick feedback toast/status
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const triggerSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Score Input Change Handler
  const handleAssignmentScoreChange = (studentId: string, assignmentId: string, valueStr: string) => {
    const num = parseFloat(valueStr);
    const scoreVal = isNaN(num) ? 0 : Math.max(0, num);

    const existingStudentRecord = currentGradebook.studentScores[studentId] || {
      studentId,
      assignmentScores: {},
      midtermScore: 0,
      finalScore: 0
    };

    const updatedRecord: StudentScoreRecord = {
      ...existingStudentRecord,
      assignmentScores: {
        ...existingStudentRecord.assignmentScores,
        [assignmentId]: scoreVal
      }
    };

    const updatedGb: Gradebook = {
      ...currentGradebook,
      studentScores: {
        ...currentGradebook.studentScores,
        [studentId]: updatedRecord
      },
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
  };

  // Exam Score Handler
  const handleExamScoreChange = (studentId: string, field: 'midtermScore' | 'finalScore', valueStr: string) => {
    const num = parseFloat(valueStr);
    const max = field === 'midtermScore' ? currentGradebook.config.midtermMaxScore : currentGradebook.config.finalMaxScore;
    const scoreVal = isNaN(num) ? 0 : Math.max(0, Math.min(max, num));

    const existingStudentRecord = currentGradebook.studentScores[studentId] || {
      studentId,
      assignmentScores: {},
      midtermScore: 0,
      finalScore: 0
    };

    const updatedRecord: StudentScoreRecord = {
      ...existingStudentRecord,
      [field]: scoreVal
    };

    const updatedGb: Gradebook = {
      ...currentGradebook,
      studentScores: {
        ...currentGradebook.studentScores,
        [studentId]: updatedRecord
      },
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
  };

  // Add Assignment Handler
  const handleAddAssignment = () => {
    if (!newAssignmentTitle.trim()) return;

    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      title: newAssignmentTitle.trim(),
      maxScore: Math.max(1, newAssignmentMaxScore),
      category: 'work'
    };

    const updatedGb: Gradebook = {
      ...currentGradebook,
      assignments: [...currentGradebook.assignments, newAssignment],
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
    setIsAddAssignmentOpen(false);
    setNewAssignmentTitle('');
    setNewAssignmentMaxScore(10);
    triggerSaveNotification('เพิ่มช่องงานเรียบร้อยแล้ว');
  };

  // Edit Assignment
  const handleUpdateAssignment = () => {
    if (!editingAssignment || !editingAssignment.title.trim()) return;

    const updatedAssignments = currentGradebook.assignments.map(a => 
      a.id === editingAssignment.id ? editingAssignment : a
    );

    const updatedGb: Gradebook = {
      ...currentGradebook,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
    setEditingAssignment(null);
    triggerSaveNotification('อัปเดตข้อมูลงานเรียบร้อย');
  };

  // Delete Assignment
  const handleDeleteAssignment = (assignmentId: string) => {
    if (!confirm('คุณต้องการลบช่องงานนี้หรือไม่? คะแนนที่บันทึกไว้ในช่องนี้จะถูกลบออกด้วย')) return;

    const updatedAssignments = currentGradebook.assignments.filter(a => a.id !== assignmentId);
    
    // Clean up scores
    const updatedScores = { ...currentGradebook.studentScores };
    Object.keys(updatedScores).forEach(stdId => {
      if (updatedScores[stdId]?.assignmentScores) {
        delete updatedScores[stdId].assignmentScores[assignmentId];
      }
    });

    const updatedGb: Gradebook = {
      ...currentGradebook,
      assignments: updatedAssignments,
      studentScores: updatedScores,
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
    triggerSaveNotification('ลบช่องงานเรียบร้อยแล้ว');
  };

  // Bulk fill full scores button helper
  const handleFillMaxScores = (assignmentId: string, maxScore: number) => {
    if (!confirm(`คุณต้องการเติมคะแนนเต็ม (${maxScore} คะแนน) ให้กับนักเรียนทุกคนในช่องนี้หรือไม่?`)) return;

    const updatedStudentScores = { ...currentGradebook.studentScores };

    classStudents.forEach(std => {
      const rec = updatedStudentScores[std.id] || {
        studentId: std.id,
        assignmentScores: {},
        midtermScore: 0,
        finalScore: 0
      };

      updatedStudentScores[std.id] = {
        ...rec,
        assignmentScores: {
          ...rec.assignmentScores,
          [assignmentId]: maxScore
        }
      };
    });

    const updatedGb: Gradebook = {
      ...currentGradebook,
      studentScores: updatedStudentScores,
      updatedAt: new Date().toISOString()
    };

    onSaveGradebook(updatedGb);
    triggerSaveNotification(`กำหนดคะแนนเต็ม (${maxScore}) ให้ทุกคนเรียบร้อยแล้ว`);
  };

  // Calculated Results for All Students
  const studentResults = useMemo(() => {
    return classStudents.map(std => {
      const record = currentGradebook.studentScores[std.id];
      const calc = calculateStudentGrade(record, currentGradebook.assignments, currentGradebook.config);
      return {
        student: std,
        calc
      };
    });
  }, [classStudents, currentGradebook]);

  // Overall Class Stats
  const classStats = useMemo(() => {
    if (studentResults.length === 0) {
      return {
        averageNetScore: 0,
        passCount: 0,
        passPercentage: 0,
        gradeDistribution: { 4: 0, 3.5: 0, 3: 0, 2.5: 0, 2: 0, 1.5: 0, 1: 0, 0: 0 } as Record<number, number>
      };
    }

    let sumNet = 0;
    let passCount = 0;
    const dist: Record<number, number> = { 4: 0, 3.5: 0, 3: 0, 2.5: 0, 2: 0, 1.5: 0, 1: 0, 0: 0 };

    studentResults.forEach(res => {
      sumNet += res.calc.netScore;
      if (res.calc.isPassed) passCount++;
      dist[res.calc.grade] = (dist[res.calc.grade] || 0) + 1;
    });

    return {
      averageNetScore: Math.round((sumNet / studentResults.length) * 10) / 10,
      passCount,
      passPercentage: Math.round((passCount / studentResults.length) * 100),
      gradeDistribution: dist
    };
  }, [studentResults]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (studentResults.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนสำหรับการส่งออก');
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM for Thai Language in Excel
    csvContent += `แบบบันทึกคะแนนและตัดเกรด,วิชา: ${currentSubject?.code} ${currentSubject?.name},ห้อง: ${selectedClass},ปีการศึกษา: ${academicYear},เทอม: ${term}\n`;
    csvContent += `ระดับการศึกษา: ${detectedLevelType === 'primary' ? 'ประถมศึกษา (คะแนนเก็บ 70 : สอบ 30)' : 'มัธยมศึกษา (คะแนนเก็บ 70 : สอบ 30)'}\n\n`;

    // Header Row
    const headers = ['เลขที่', 'รหัสนักเรียน', 'คำนำหน้า', 'ชื่อ', 'นามสกุล'];
    currentGradebook.assignments.forEach(a => {
      headers.push(`"${a.title} (เต็ม ${a.maxScore})"`);
    });
    headers.push(`"รวมคะแนนเก็บดิบ"`);
    headers.push(`"คะแนนเก็บถ่วงน้ำหนัก (${currentGradebook.config.workWeightRatio}%)"`);
    headers.push(`"สอบกลางภาค (${currentGradebook.config.midtermMaxScore})"`);
    headers.push(`"สอบปลายภาค (${currentGradebook.config.finalMaxScore})"`);
    headers.push(`"รวมคะแนนสุทธิ (100)"`);
    headers.push(`"เกรด"`);
    headers.push(`"ผลประเมิน"`);

    csvContent += headers.join(',') + '\n';

    // Data Rows
    studentResults.forEach(({ student, calc }) => {
      const record = currentGradebook.studentScores[student.id]?.assignmentScores || {};
      const row = [
        student.studentNo,
        student.studentIdCode || '',
        student.prefix || '',
        student.firstName,
        student.lastName
      ];

      currentGradebook.assignments.forEach(a => {
        row.push(record[a.id] ?? 0);
      });

      row.push(calc.totalRawWorkScore);
      row.push(calc.scaledWorkScore);
      row.push(calc.midtermScore);
      row.push(calc.finalScore);
      row.push(calc.netScore);
      row.push(calc.grade);
      row.push(calc.isPassed ? 'ผ่าน' : 'ไม่ผ่าน');

      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gradebook_${currentSubject?.code}_${selectedClass}_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPP5Excel = () => {
    exportPP5ToExcel({
      gradebook: currentGradebook,
      students,
      subject: currentSubject,
      profile,
      academicYear,
      term
    });
    triggerSaveNotification('ส่งออกเอกสาร ปพ.5 เป็นไฟล์ Excel (.xlsx) สำเร็จ');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Save Feedback */}
      {saveStatus && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Main Gradebook Interface - Hidden during printing */}
      <div className="space-y-6 print:hidden">
        {/* Main Header Banner */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle decorative gradient top accent border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-t-3xl" />
          
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center space-x-1.5 shadow-2xs">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>ระบบคำนวณและตัดเกรดอัตโนมัติ</span>
              </span>

              {detectedLevelType === 'secondary' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center space-x-1.5 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>ระดับมัธยมศึกษา (คะแนนเก็บ 70 : คะแนนสอบ 30)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center space-x-1.5 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ระดับประถมศึกษา (คะแนนเก็บ 70 : คะแนนสอบ 30)</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              สมุดบันทึกคะแนน & ตัดเกรดนักเรียน
            </h1>
            <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
              เพิ่มช่องชิ้นงาน บันทึกคะแนนคำนวณถ่วงน้ำหนักตามระเบียบกระทรวงศึกษาธิการ 
              <span className="inline-block px-2 py-0.5 mx-1 rounded-md bg-indigo-50/80 text-indigo-950 font-bold border border-indigo-100">
                ({detectedLevelType === 'secondary' ? 'มัธยมศึกษา: งานมอบหมาย/คะแนนเก็บ 70% + กลางภาค 15% + ปลายภาค 15%' : 'ประถมศึกษา: เก็บ 70% + กลางปี 15% + ปลายปี 15%'})
              </span>
              พร้อมสรุปผลเกรด 0 - 4
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/90 text-slate-800 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>พิมพ์รายงาน ปพ.5</span>
            </button>

            <button
              onClick={handleExportPP5Excel}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-200 active:scale-95 cursor-pointer"
              title="ส่งออกรายงาน ปพ.5 เป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>ส่งออก ปพ.5 (Excel)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-all active:scale-95 cursor-pointer"
              title="ส่งออกคะแนนดิบทุกช่องงานเป็นไฟล์ CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV คะแนนดิบ</span>
            </button>
          </div>
        </div>

      {/* Filter & Configuration Bar */}
      <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Select Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>รายวิชาที่สอน</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Select Classroom */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>ห้องเรียน</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>ห้อง {cls}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">ปีการศึกษา</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-800 shadow-2xs"
              placeholder="2567"
            />
          </div>

          {/* Term Selection (Secondary) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">ภาคเรียน / การประเมิน</label>
            {detectedLevelType === 'secondary' ? (
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value as '1' | '2')}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
              </select>
            ) : (
              <div className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-between">
                <span>ประเมินทั้งปีการศึกษา</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold">ประถม</span>
              </div>
            )}
          </div>

        </div>

        {/* Evaluation Ratio Info Banner */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-700">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentGradebook.config.workWeightRatio}:{currentGradebook.config.examWeightRatio}
            </div>
            <div>
              <p className="font-bold text-slate-900">
                สัดส่วนการตัดเกรด: คะแนนเก็บ {currentGradebook.config.workWeightRatio}% : คะแนนสอบ {currentGradebook.config.examWeightRatio}%
              </p>
              <p className="text-[11px] text-slate-500">
                {currentGradebook.config.levelType === 'secondary' 
                  ? `(คะแนนเก็บรวมย่อยจะถูกแปลงถ่วงน้ำหนักเป็น ${currentGradebook.config.workWeightRatio} คะแนน + สอบกลางภาค ${currentGradebook.config.midtermMaxScore} คะแนน + สอบปลายภาค ${currentGradebook.config.finalMaxScore} คะแนน)`
                  : `(คะแนนเก็บรวมย่อยจะถูกแปลงถ่วงน้ำหนักเป็น ${currentGradebook.config.workWeightRatio} คะแนน + ประเมินกลางปี ${currentGradebook.config.midtermMaxScore} คะแนน + ปลายปี ${currentGradebook.config.finalMaxScore} คะแนน)`
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddAssignmentOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มช่องงาน/ชิ้นงาน</span>
          </button>
        </div>

      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">จำนวนนักเรียนในห้อง</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900">{classStudents.length} คน</h3>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">ห้อง {selectedClass}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">คะแนนเฉลี่ยทั้งห้อง</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-indigo-600">{classStats.averageNetScore} / 100</h3>
            <span className="text-[11px] font-bold text-slate-500">จาก 100 คะแนน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">อัตราการผ่านเกณฑ์</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-emerald-600">{classStats.passPercentage}%</h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
              {classStats.passCount} / {classStudents.length} คน
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">จำนวนงานที่เก็บคะแนน</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-purple-600">{currentGradebook.assignments.length} ชิ้นงาน</h3>
            <button
              onClick={() => setIsAddAssignmentOpen(true)}
              className="text-[11px] font-bold text-purple-700 hover:underline flex items-center space-x-1"
            >
              <span>+ เพิ่มงาน</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Score Spreadsheet Table */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/80 shadow-md space-y-4 overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>ตารางบันทึกคะแนนและประเมินผลการเรียน</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กรอกคะแนนดิบของแต่ละชิ้นงาน ระบบจะแปลงถ่วงน้ำหนักและคำนวณเกรดสุทธิให้อัตโนมัติ
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>บันทึกแบบเรียลไทม์ไปยัง Firestore แล้ว</span>
          </div>
        </div>

        {/* Table Wrapper with horizontal scrolling */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-100/90 backdrop-blur-md sticky top-0 z-20 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center sticky left-0 bg-slate-100 z-30 border-r border-slate-200">
                  เลขที่
                </th>
                <th className="p-3 w-28 sticky left-12 bg-slate-100 z-30 border-r border-slate-200">
                  รหัส / ชื่อ-นามสกุล
                </th>

                {/* Dynamic Work Assignment Columns */}
                {currentGradebook.assignments.map((asg, idx) => (
                  <th key={asg.id} className="p-3 min-w-[140px] border-r border-slate-200 text-center bg-indigo-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded font-bold">
                          งาน #{idx + 1}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingAssignment(asg)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                            title="แก้ไขชื่อ/คะแนนเต็มงานนี้"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(asg.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                            title="ลบช่องงานนี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-800 line-clamp-1" title={asg.title}>
                        {asg.title}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>เต็ม {asg.maxScore}</span>
                        <button
                          onClick={() => handleFillMaxScores(asg.id, asg.maxScore)}
                          className="text-indigo-600 font-semibold hover:underline text-[9px]"
                          title="เติมคะแนนเต็มให้ทุกคน"
                        >
                          [ให้เต็ม]
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Scaled Work Score */}
                <th className="p-3 min-w-[110px] text-center bg-indigo-100/60 border-r border-slate-200 text-indigo-900">
                  <span>รวมคะแนนเก็บ</span>
                  <p className="text-[10px] text-indigo-700">ถ่วง ({currentGradebook.config.workWeightRatio}%)</p>
                </th>

                {/* Exam Midterm */}
                <th className="p-3 min-w-[110px] text-center bg-amber-50/70 border-r border-slate-200 text-amber-900">
                  <span>กลางภาค</span>
                  <p className="text-[10px] text-amber-700">(เต็ม {currentGradebook.config.midtermMaxScore})</p>
                </th>

                {/* Exam Final */}
                <th className="p-3 min-w-[110px] text-center bg-amber-50/70 border-r border-slate-200 text-amber-900">
                  <span>ปลายภาค</span>
                  <p className="text-[10px] text-amber-700">(เต็ม {currentGradebook.config.finalMaxScore})</p>
                </th>

                {/* Net Total Score */}
                <th className="p-3 min-w-[100px] text-center bg-purple-100/60 border-r border-slate-200 text-purple-900">
                  <span>รวมสุทธิ</span>
                  <p className="text-[10px] text-purple-700">(เต็ม 100)</p>
                </th>

                {/* Grade */}
                <th className="p-3 w-20 text-center bg-slate-200/80 border-r border-slate-200">
                  เกรด
                </th>

                {/* Status */}
                <th className="p-3 w-24 text-center">
                  ผลประเมิน
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs bg-white">
              {studentResults.length === 0 ? (
                <tr>
                  <td colSpan={10 + currentGradebook.assignments.length} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลรายชื่อนักเรียนในห้อง {selectedClass} สามารถไปเพิ่มนักเรียนได้ที่เมนู "รายชื่อนักเรียนเข้าห้องเรียน"
                  </td>
                </tr>
              ) : (
                studentResults.map(({ student, calc }) => {
                  const record = currentGradebook.studentScores[student.id]?.assignmentScores || {};
                  const badgeStyle = getGradeBadgeStyle(calc.grade);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Student No */}
                      <td className="p-3 text-center font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200">
                        {student.studentNo}
                      </td>

                      {/* Student Name */}
                      <td className="p-3 sticky left-12 bg-white z-10 border-r border-slate-200">
                        <div className="font-bold text-slate-900 truncate max-w-[160px]">
                          {student.prefix || ''}{student.firstName} {student.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.studentIdCode || '-'}
                        </div>
                      </td>

                      {/* Dynamic Assignment Inputs */}
                      {currentGradebook.assignments.map(asg => {
                        const currentScore = record[asg.id] ?? '';
                        return (
                          <td key={asg.id} className="p-2 border-r border-slate-200 text-center bg-indigo-50/20">
                            <input
                              type="number"
                              min="0"
                              max={asg.maxScore}
                              step="0.5"
                              value={currentScore}
                              onChange={(e) => handleAssignmentScoreChange(student.id, asg.id, e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                            />
                          </td>
                        );
                      })}

                      {/* Scaled Work Score */}
                      <td className="p-3 text-center font-extrabold text-indigo-700 bg-indigo-50/50 border-r border-slate-200">
                        <span className="text-sm">{calc.scaledWorkScore}</span>
                        <p className="text-[9px] text-slate-400 font-normal">
                          ({calc.totalRawWorkScore}/{calc.totalMaxRawWorkScore})
                        </p>
                      </td>

                      {/* Midterm Exam Input */}
                      <td className="p-2 text-center border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="number"
                          min="0"
                          max={currentGradebook.config.midtermMaxScore}
                          step="0.5"
                          value={currentGradebook.studentScores[student.id]?.midtermScore ?? ''}
                          onChange={(e) => handleExamScoreChange(student.id, 'midtermScore', e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center font-bold bg-white border border-amber-200 rounded-lg text-amber-900 focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </td>

                      {/* Final Exam Input */}
                      <td className="p-2 text-center border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="number"
                          min="0"
                          max={currentGradebook.config.finalMaxScore}
                          step="0.5"
                          value={currentGradebook.studentScores[student.id]?.finalScore ?? ''}
                          onChange={(e) => handleExamScoreChange(student.id, 'finalScore', e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center font-bold bg-white border border-amber-200 rounded-lg text-amber-900 focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </td>

                      {/* Net Total Score */}
                      <td className="p-3 text-center font-black text-purple-900 bg-purple-50/50 border-r border-slate-200 text-sm">
                        {calc.netScore}
                      </td>

                      {/* Grade Badge */}
                      <td className="p-3 text-center border-r border-slate-200">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shadow-2xs`}>
                          {calc.grade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {calc.isPassed ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ผ่าน</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>ปรับปรุง</span>
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

      {/* Grade Distribution Breakdown Bar */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>การกระจายตัวของระดับผลการเรียน (Grade Distribution)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {[4, 3.5, 3, 2.5, 2, 1.5, 1, 0].map(g => {
            const count = classStats.gradeDistribution[g] || 0;
            const style = getGradeBadgeStyle(g);
            return (
              <div key={g} className={`p-3 rounded-2xl border text-center space-y-1 ${style.bg} ${style.border}`}>
                <p className={`text-xs font-black ${style.text}`}>เกรด {g}</p>
                <p className="text-lg font-black text-slate-900">{count} คน</p>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* MODAL: Add New Assignment */}
      {isAddAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>เพิ่มช่องงาน / ชิ้นงานเก็บคะแนน</span>
              </h3>
              <button 
                onClick={() => setIsAddAssignmentOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">ชื่อชิ้นงาน / แบบฝึกหัด *</label>
                <input
                  type="text"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  placeholder="เช่น งานที่ 3: รายงานการทดลองกลุ่ม"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">คะแนนเต็มของชิ้นงานนี้ *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newAssignmentMaxScore}
                  onChange={(e) => setNewAssignmentMaxScore(parseInt(e.target.value) || 10)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[11px] text-slate-600 leading-relaxed">
                ℹ️ ระบบจะนำคะแนนดิบทุกชิ้นงานมารวมกัน แล้วแปลงคำนวณถ่วงน้ำหนักอัตโนมัติให้เข้าสัดส่วนคะแนนเก็บ ({currentGradebook.config.workWeightRatio} คะแนน)
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsAddAssignmentOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddAssignment}
                disabled={!newAssignmentTitle.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md"
              >
                บันทึกช่องงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Assignment */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <span>แก้ไขชิ้นงานเก็บคะแนน</span>
              </h3>
              <button 
                onClick={() => setEditingAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">ชื่อชิ้นงาน *</label>
                <input
                  type="text"
                  value={editingAssignment.title}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">คะแนนเต็ม *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editingAssignment.maxScore}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, maxScore: parseInt(e.target.value) || 10 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingAssignment(null)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateAssignment}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                อัปเดตข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable Official A4 Grade Report View (ปพ.5 Style) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:block">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl my-8 border border-slate-200 max-h-[90vh] overflow-y-auto print:max-h-none print:h-auto print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:max-w-none print:w-full print:block">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">ตัวอย่างรายงานสรุปคะแนนและประเมินผลการเรียน (แบบ ปพ.5)</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportPP5Excel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                  title="ส่งออกเอกสาร ปพ.5 เป็นไฟล์ Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>ส่งออก Excel (ปพ.5)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์รายงาน (A4)</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Body */}
            <div className="printable-report p-6 border border-slate-300 rounded-2xl bg-white text-slate-900 space-y-6 text-xs font-serif leading-relaxed">
              
              {/* Header */}
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <h2 className="text-lg font-bold">แบบบันทึกผลการเรียนและการประเมินผลรายวิชา (ปพ.5)</h2>
                <p className="font-bold">{profile.schoolName}</p>
                <p>
                  รายวิชา {currentSubject?.code} {currentSubject?.name} ชั้น{selectedClass} ปีการศึกษา {academicYear}
                  {detectedLevelType === 'secondary' ? ` (ภาคเรียนที่ ${term})` : ' (ประเมินทั้งปีการศึกษา)'}
                </p>
                <p className="text-[11px] text-slate-600">
                  ครูผู้สอน: {profile.name} ({profile.position}) • กลุ่มสาระการเรียนรู้{profile.department}
                </p>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-slate-400 text-center text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-2 w-10">เลขที่</th>
                    <th className="border border-slate-400 p-2 w-28">รหัสประจำตัว</th>
                    <th className="border border-slate-400 p-2 text-left">ชื่อ - นามสกุล</th>
                    <th className="border border-slate-400 p-2 w-28">คะแนนรวมคะแนนเก็บ ({currentGradebook.config.workWeightRatio})</th>
                    <th className="border border-slate-400 p-2 w-28">คะแนนรวมคะแนนสอบ ({currentGradebook.config.examWeightRatio})</th>
                    <th className="border border-slate-400 p-2 w-24 font-black">รวมสุทธิ (100)</th>
                    <th className="border border-slate-400 p-2 w-20 font-black">ระดับผลการเรียน</th>
                    <th className="border border-slate-400 p-2 w-20">ผลประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map(({ student, calc }) => (
                    <tr key={student.id}>
                      <td className="border border-slate-400 p-2">{student.studentNo}</td>
                      <td className="border border-slate-400 p-2 font-mono">{student.studentIdCode || '-'}</td>
                      <td className="border border-slate-400 p-2 text-left font-sans font-medium">
                        {student.prefix || ''}{student.firstName} {student.lastName}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold">{calc.scaledWorkScore}</td>
                      <td className="border border-slate-400 p-2 font-mono font-bold">{calc.totalExamScore}</td>
                      <td className="border border-slate-400 p-2 font-mono font-black">{calc.netScore}</td>
                      <td className="border border-slate-400 p-2 font-mono font-black text-sm">{calc.grade}</td>
                      <td className="border border-slate-400 p-2 font-sans font-bold">
                        {calc.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-12">
                  <p>ลงชื่อ.........................................................ครูผู้สอน</p>
                  <p>({profile.name})</p>
                  <p>ตำแหน่ง {profile.position}</p>
                </div>
                <div className="space-y-12">
                  <p>ลงชื่อ.........................................................หัวหน้ากลุ่มสาระฯ</p>
                  <p>(.........................................................)</p>
                  <p>วันที่........./......................../...........</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
