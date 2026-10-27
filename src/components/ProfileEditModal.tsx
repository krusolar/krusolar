import React, { useState, useRef } from 'react';
import { TeacherProfile } from '../types';
import { 
  X, 
  Upload, 
  User, 
  Camera, 
  Check, 
  School, 
  Award, 
  BookOpen, 
  Calendar,
  Sparkles,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';

interface ProfileEditModalProps {
  profile: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updatedProfile: TeacherProfile) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [position, setPosition] = useState(profile.position);
  const [academicStanding, setAcademicStanding] = useState(profile.academicStanding);
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [department, setDepartment] = useState(profile.department);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [term, setTerm] = useState(profile.term);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file upload converting to base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพเกิน 5MB กรุณาใช้ไฟล์ภาพขนาดเล็กลง');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatarUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setAvatarUrl(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อ-นามสกุลครู');
      return;
    }

    const updated: TeacherProfile = {
      ...profile,
      name: name.trim(),
      position: position.trim(),
      academicStanding: academicStanding.trim(),
      schoolName: schoolName.trim(),
      department: department.trim(),
      academicYear: academicYear.trim(),
      term: term.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                แก้ไขข้อมูลส่วนตัวครู (Teacher Profile)
              </h3>
              <p className="text-xs text-slate-400">
                เปลี่ยนรูปประจำตัว (Avatar) และแก้ไขชื่อ-ตำแหน่งสำหรับแสดงในระบบและแบบรายงาน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Avatar Image Upload Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-indigo-500/30 shadow-md bg-slate-200 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Camera icon badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-500 transition-transform active:scale-95"
                title="เปลี่ยนรูปภาพ"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Avatar Action Controls */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold text-slate-900 block">รูปโปรไฟล์ครู (Teacher Avatar)</span>
                <span className="text-[11px] text-slate-500">รองรับไฟล์ภาพ JPG, PNG, WebP หรืออัปโหลดรูปตรงจากเครื่อง</span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดรูปจากเครื่อง</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>ใส่ลิงก์รูปภาพ (URL)</span>
                </button>
              </div>

              {/* URL Input Box Toggle */}
              {showUrlInput && (
                <div className="flex items-center space-x-1.5 pt-2">
                  <input
                    type="url"
                    placeholder="วาง URL รูปภาพ https://..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                  >
                    ใช้รูปนี้
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Form Inputs Grid */}
          <div className="space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>ชื่อ - นามสกุล ครู <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ครู ซอลาฮุดดิน แยะแย"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Position Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ตำแหน่ง</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="เช่น ครู คศ.2"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Academic Standing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>วิทยฐานะ</span>
                </label>
                <input
                  type="text"
                  value={academicStanding}
                  onChange={(e) => setAcademicStanding(e.target.value)}
                  placeholder="เช่น ชำนาญการ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* School Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>ชื่อโรงเรียน / สถานศึกษา</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="เช่น โรงเรียนสาธิตวิทยาการ"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Department Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>กลุ่มสาระการเรียนรู้</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Term & Year Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ปีการศึกษา</span>
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="เช่น 2567"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ภาคเรียนที่</span>
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="เช่น 1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
