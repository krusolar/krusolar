import React, { useState } from 'react';
import { Student, Subject } from '../types';
import { StudentUploadModal } from './StudentUploadModal';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Search, 
  School, 
  Check, 
  X, 
  Plus, 
  Filter, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  subjects: Subject[];
  onSaveStudent: (student: Student) => void;
  onSaveBatchStudents: (students: Student[], targetClass: string, isOverwrite: boolean) => void;
  onDeleteStudent: (studentId: string) => void;
  onClearClassStudents: (className: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  subjects,
  onSaveStudent,
  onSaveBatchStudents,
  onDeleteStudent,
  onClearClassStudents,
}) => {
  // Get all unique classes from subjects
  const allClassSet = new Set<string>();
  subjects.forEach(s => {
    s.classes.forEach(c => allClassSet.add(c));
  });
  // Add any classes already present in students list
  students.forEach(std => allClassSet.add(std.className));

  const availableClasses = Array.from(allClassSet).sort();
  const defaultClass = availableClasses[0] || 'ม.3/1';

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State for Single Add / Edit
  const [formData, setFormData] = useState<Partial<Student>>({
    studentNo: 1,
    studentIdCode: '',
    prefix: 'เด็กชาย',
    firstName: '',
    lastName: '',
    className: defaultClass,
    gender: 'male',
    note: ''
  });

  // Filter students based on selected class and search query
  const filteredStudents = students.filter(std => {
    const matchesClass = selectedClass === 'all' || std.className === selectedClass;
    const fullName = `${std.prefix || ''}${std.firstName} ${std.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      fullName.includes(query) || 
      (std.studentIdCode && std.studentIdCode.includes(query)) ||
      std.studentNo.toString().includes(query);

    return matchesClass && matchesSearch;
  }).sort((a, b) => a.studentNo - b.studentNo);

  // Statistics for selected class
  const classStudents = selectedClass === 'all' 
    ? students 
    : students.filter(s => s.className === selectedClass);

  const totalCount = classStudents.length;
  const maleCount = classStudents.filter(s => s.gender === 'male' || s.prefix === 'เด็กชาย' || s.prefix === 'นาย').length;
  const femaleCount = classStudents.filter(s => s.gender === 'female' || s.prefix === 'เด็กหญิง' || s.prefix === 'นางสาว' || s.prefix === 'นาง').length;

  // Handlers
  const handleOpenAddModal = () => {
    const nextNo = classStudents.length > 0 ? Math.max(...classStudents.map(s => s.studentNo)) + 1 : 1;
    setEditingStudent(null);
    setFormData({
      studentNo: nextNo,
      studentIdCode: '',
      prefix: 'เด็กชาย',
      firstName: '',
      lastName: '',
      className: selectedClass !== 'all' ? selectedClass : defaultClass,
      gender: 'male',
      note: ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setIsEditModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert('กรุณากรอกชื่อและนามสกุลนักเรียน');
      return;
    }

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentNo: Number(formData.studentNo) || 1,
      studentIdCode: formData.studentIdCode || '',
      prefix: formData.prefix || 'เด็กชาย',
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      className: formData.className || defaultClass,
      gender: formData.gender || 'male',
      note: formData.note || ''
    };

    onSaveStudent(studentToSave);
    setIsEditModalOpen(false);
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนสำหรับส่งออก');
      return;
    }

    let csvContent = "\uFEFFเลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล,ห้องเรียน,เพศ,หมายเหตุ\n";
    filteredStudents.forEach(s => {
      const g = s.gender === 'female' ? 'หญิง' : 'ชาย';
      csvContent += `${s.studentNo},"${s.studentIdCode || ''}","${s.prefix || ''}","${s.firstName}","${s.lastName}","${s.className}","${g}","${s.note || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายชื่อนักเรียน_ห้อง_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">ระบบจัดการรายชื่อนักเรียนตามห้องเรียน</h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              จัดเก็บข้อมูลทะเบียนนักเรียน เพิ่มรายบุคคล อัปโหลดไฟล์ Excel / CSV หรือคัดลอกวาง
            </p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center space-x-2 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดรายชื่อ (Excel/CSV/Text)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>เพิ่มนักเรียนรายบุคคล</span>
          </button>
        </div>
      </div>

      {/* Classroom Filter & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Class Selection dropdown card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>เลือกห้องเรียน</span>
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="all">แสดงทุกห้องเรียน ({students.length} คน)</option>
            {availableClasses.map((cls) => {
              const count = students.filter(s => s.className === cls).length;
              return (
                <option key={cls} value={cls}>ห้อง {cls} ({count} คน)</option>
              );
            })}
          </select>
        </div>

        {/* Total Metric Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500">จำนวนนักเรียนทั้งหมด</span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {totalCount} <span className="text-xs font-normal text-slate-500">คน</span>
            </h3>
          </div>
        </div>

        {/* Male Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            👨
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500">ชาย</span>
            <h3 className="text-xl font-extrabold text-blue-700">
              {maleCount} <span className="text-xs font-normal text-slate-500">คน</span>
            </h3>
          </div>
        </div>

        {/* Female Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            👩
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500">หญิง</span>
            <h3 className="text-xl font-extrabold text-pink-700">
              {femaleCount} <span className="text-xs font-normal text-slate-500">คน</span>
            </h3>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        
        {/* Table Top Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, นามสกุล, หรือรหัสนักเรียน..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="ดาวน์โหลดรายชื่อเป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ส่งออก CSV</span>
            </button>

            {selectedClass !== 'all' && (
              <button
                onClick={() => {
                  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อนักเรียนทั้งหมดในห้อง ${selectedClass}?`)) {
                    onClearClassStudents(selectedClass);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="ล้างรายชื่อนักเรียนทั้งหมดในห้องนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างรายชื่อห้องนี้</span>
              </button>
            )}
          </div>

        </div>

        {/* Student Roster Table */}
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">ไม่พบรายชื่อนักเรียน</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา กรุณาลองค้นหาด้วยคำอื่น'
                : 'ยังไม่มีรายชื่อนักเรียนในห้องเรียนนี้ คุณสามารถคลิกปุ่ม "อัปโหลดรายชื่อ" เพื่ออัปโหลดไฟล์ Excel/CSV หรือเพิ่มรายบุคคลได้'}
            </p>
            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>นำเข้ารายชื่อนักเรียน</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-14">เลขที่</th>
                  <th className="p-3 w-28">รหัสนักเรียน</th>
                  <th className="p-3 w-24">คำนำหน้า</th>
                  <th className="p-3">ชื่อ - นามสกุล</th>
                  <th className="p-3 w-24 text-center">ห้องเรียน</th>
                  <th className="p-3 w-20 text-center">เพศ</th>
                  <th className="p-3">หมายเหตุ</th>
                  <th className="p-3 w-20 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-800">{std.studentNo}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px] font-medium">
                      {std.studentIdCode || '-'}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{std.prefix}</td>
                    <td className="p-3 text-slate-900 font-bold">
                      {std.firstName} {std.lastName}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {std.className}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        std.gender === 'female' || std.prefix === 'เด็กหญิง' || std.prefix === 'นางสาว'
                          ? 'bg-pink-100 text-pink-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {std.gender === 'female' || std.prefix === 'เด็กหญิง' || std.prefix === 'นางสาว' ? 'หญิง' : 'ชาย'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">
                      {std.note || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(std)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันการลบนักเรียน ${std.prefix || ''}${std.firstName} ${std.lastName}?`)) {
                              onDeleteStudent(std.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Upload Modal */}
      <StudentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        availableClasses={availableClasses}
        selectedClassDefault={selectedClass}
        onSaveBatch={onSaveBatchStudents}
      />

      {/* Single Add / Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
            
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>{editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนรายบุคคล'}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">เลขที่</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.studentNo || 1}
                    onChange={(e) => setFormData({ ...formData, studentNo: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    value={formData.studentIdCode || ''}
                    onChange={(e) => setFormData({ ...formData, studentIdCode: e.target.value })}
                    placeholder="เช่น 66101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">คำนำหน้า</label>
                  <select
                    value={formData.prefix || 'เด็กชาย'}
                    onChange={(e) => {
                      const pref = e.target.value;
                      const gen = pref.includes('หญิง') || pref.includes('สาว') || pref.includes('นาง') ? 'female' : 'male';
                      setFormData({ ...formData, prefix: pref, gender: gen });
                    }}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ชื่อ</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="ชื่อจริง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="นามสกุล"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ห้องเรียน</label>
                  <select
                    value={formData.className || defaultClass}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>ห้อง {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">เพศ</label>
                  <select
                    value={formData.gender || 'male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="เช่น หัวหน้าห้อง, นักเรียนทุน"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
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
