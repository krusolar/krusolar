import React, { useState } from 'react';
import { Subject, ClassRoomDetail } from '../types';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  Clock, 
  School, 
  Check, 
  X,
  Layers,
  GraduationCap,
  Sparkles,
  Calculator
} from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  onSaveSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

// Helper to normalize or derive class details from legacy data
export function getClassDetails(subject: Subject): ClassRoomDetail[] {
  if (subject.classDetails && subject.classDetails.length > 0) {
    return subject.classDetails;
  }
  if (subject.classes && subject.classes.length > 0) {
    const avg = Math.round(subject.totalStudents / subject.classes.length) || 35;
    return subject.classes.map(c => ({ className: c, studentCount: avg }));
  }
  return [{ className: `${subject.gradeLevel}/1`, studentCount: 35 }];
}

export function calculateTotalStudents(subject: Subject): number {
  const details = getClassDetails(subject);
  return details.reduce((sum, item) => sum + (Number(item.studentCount) || 0), 0);
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  onSaveSubject,
  onDeleteSubject,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ม.3');
  const [department, setDepartment] = useState('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
  const [hoursPerWeek, setHoursPerWeek] = useState(3);
  const [classDetails, setClassDetails] = useState<ClassRoomDetail[]>([
    { className: 'ม.3/1', studentCount: 36 },
    { className: 'ม.3/2', studentCount: 34 },
    { className: 'ม.3/3', studentCount: 35 },
  ]);

  // Overall Statistics
  const totalSubjectsCount = subjects.length;
  const totalRoomsCount = subjects.reduce((sum, s) => sum + getClassDetails(s).length, 0);
  const totalStudentsOverall = subjects.reduce((sum, s) => sum + calculateTotalStudents(s), 0);

  const handleOpenAddModal = () => {
    setEditingSubjectId(null);
    setCode('');
    setName('');
    setGradeLevel('ม.3');
    setDepartment('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
    setHoursPerWeek(3);
    setClassDetails([
      { className: 'ม.3/1', studentCount: 36 },
      { className: 'ม.3/2', studentCount: 34 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setGradeLevel(subject.gradeLevel);
    setDepartment(subject.department);
    setHoursPerWeek(subject.hoursPerWeek);
    setClassDetails(getClassDetails(subject));
    setIsModalOpen(true);
  };

  // Class detail rows handlers inside modal
  const handleAddClassRow = () => {
    const nextRoomNum = classDetails.length + 1;
    setClassDetails([
      ...classDetails,
      { className: `${gradeLevel}/${nextRoomNum}`, studentCount: 35 }
    ]);
  };

  const handleRemoveClassRow = (index: number) => {
    if (classDetails.length <= 1) {
      alert('รายวิชาต้องมีอย่างน้อย 1 ห้องเรียน');
      return;
    }
    setClassDetails(classDetails.filter((_, i) => i !== index));
  };

  const handleClassChange = (index: number, field: keyof ClassRoomDetail, value: string | number) => {
    const updated = [...classDetails];
    if (field === 'studentCount') {
      updated[index].studentCount = Math.max(0, Number(value) || 0);
    } else {
      updated[index].className = String(value);
    }
    setClassDetails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('กรุณาระบุรหัสวิชาและชื่อรายวิชา');
      return;
    }

    const computedTotal = classDetails.reduce((sum, item) => sum + (Number(item.studentCount) || 0), 0);
    const classesList = classDetails.map(item => item.className.trim()).filter(Boolean);

    const updatedSubject: Subject = {
      id: editingSubjectId || `sub-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      gradeLevel: gradeLevel.trim(),
      classes: classesList,
      classDetails: classDetails,
      department: department.trim(),
      hoursPerWeek: Number(hoursPerWeek) || 1,
      totalStudents: computedTotal,
    };

    onSaveSubject(updatedSubject);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Krusolar EduLog Module
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>จัดการรายวิชาและห้องเรียน (Subjects & Classes)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ระบุรายละเอียดรายวิชา จัดการห้องเรียน และกำหนดจำนวนนักเรียนแต่ละห้องเพื่อคำนวณยอดรวมทั้งชั้นอย่างเที่ยงตรง
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มรายวิชาใหม่</span>
        </button>
      </div>

      {/* Top Aggregate Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">จำนวนรายวิชาที่รับผิดชอบ</span>
            <span className="text-lg font-black text-slate-900">{totalSubjectsCount} รายวิชา</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">จำนวนห้องเรียนรวมทั้งหมด</span>
            <span className="text-lg font-black text-slate-900">{totalRoomsCount} ห้องเรียน</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">จำนวนนักเรียนรวมทุกชั้นวิชา</span>
            <span className="text-lg font-black text-emerald-700">{totalStudentsOverall} คน</span>
          </div>
        </div>

      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {subjects.map((s) => {
          const details = getClassDetails(s);
          const computedTotal = calculateTotalStudents(s);

          return (
            <div 
              key={s.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                      {s.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                      ชั้น {s.gradeLevel}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(s)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                      title="แก้ไขรายวิชาและจำนวนนักเรียน"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => onDeleteSubject(s.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="ลบรายวิชา"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>{s.department}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {s.hoursPerWeek} คาบ/สัปดาห์
                    </span>
                  </p>
                </div>
              </div>

              {/* Class Rooms & Individual Student Count Breakdown */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                    <School className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ห้องเรียนและจำนวนนักเรียนรายห้อง ({details.length} ห้อง)</span>
                  </span>
                </div>

                {/* Badges for each class room with student count */}
                <div className="flex flex-wrap gap-2">
                  {details.map((room, idx) => (
                    <div 
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center space-x-2 text-xs"
                    >
                      <span className="font-bold text-slate-900">{room.className}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded text-[11px]">
                        {room.studentCount} คน
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Class Summary Footer Bar */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">สรุปจำนวนนักเรียนทั้งชั้นวิชา:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>รวมทั้งหมด {computedTotal} คน</span>
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSubjectId ? 'แก้ไขข้อมูลรายวิชาและห้องเรียน' : 'เพิ่มรายวิชาใหม่'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ระบุรหัสวิชา ระดับชั้น และจำนวนนักเรียนในแต่ละห้องเรียน
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสวิชา <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ว23101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับชั้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ม.3"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรายวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น วิทยาศาสตร์พื้นฐาน 5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    กลุ่มสาระการเรียนรู้
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์..."
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชั่วโมง/สัปดาห์ (คาบ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Dynamic Class Rooms & Student Count Section */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <School className="w-4 h-4 text-indigo-600" />
                      <span>จัดการห้องเรียนและจำนวนนักเรียนแต่ละห้อง</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เพิ่ม/แก้ไขชื่อห้องเรียน และระบุจำนวนนักเรียนสำหรับห้องนั้นๆ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddClassRow}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center space-x-1 border border-indigo-200/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มห้องเรียน</span>
                  </button>
                </div>

                {/* Class Rows List */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 max-h-56 overflow-y-auto">
                  {classDetails.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="w-6 text-center text-xs font-bold text-slate-400">
                        {index + 1}.
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="ชื่อห้อง เช่น ม.3/1"
                          value={item.className}
                          onChange={(e) => handleClassChange(index, 'className', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 font-semibold text-slate-900"
                          required
                        />
                      </div>

                      <div className="w-32 flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="จำนวนคน"
                          value={item.studentCount}
                          onChange={(e) => handleClassChange(index, 'studentCount', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 font-bold text-indigo-900 text-center"
                          required
                        />
                        <span className="text-xs text-slate-500 font-medium shrink-0">คน</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveClassRow(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบห้องเรียนนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Student Calculation Banner */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="flex items-center space-x-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>รวมจำนวนนักเรียนทั้งชั้น ({classDetails.length} ห้อง):</span>
                  </span>
                  <span className="text-sm font-black text-emerald-800">
                    {classDetails.reduce((sum, item) => sum + (Number(item.studentCount) || 0), 0)} คน
                  </span>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  บันทึกข้อมูล
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
