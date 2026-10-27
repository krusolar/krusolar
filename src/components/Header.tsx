import React from 'react';
import { TeacherProfile } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  PlusCircle, 
  School, 
  Calendar,
  User,
  Menu,
  X,
  LogOut,
  Presentation
} from 'lucide-react';

interface HeaderProps {
  profile: TeacherProfile;
  onOpenNewLog: () => void;
  onOpenAIModal: () => void;
  onOpenExportModal: () => void;
  onToggleSidebarMobile?: () => void;
  isMobileMenuOpen?: boolean;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  onOpenGuideModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenNewLog,
  onOpenAIModal,
  onOpenExportModal,
  onToggleSidebarMobile,
  isMobileMenuOpen,
  onLogout,
  onOpenProfileModal,
  onOpenGuideModal
}) => {
  return (
    <div className="print:hidden no-print">
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800/90 shadow-sm print:hidden no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4rem] py-2 sm:py-0 gap-2 sm:gap-4">
          
          {/* Left Brand Area */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
            <button
              id="mobile-menu-btn"
              onClick={onToggleSidebarMobile}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 shrink-0 border border-indigo-400/20">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center space-x-2 flex-nowrap">
                  <span className="font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                    Krusolar EduLog
                  </span>
                  <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 whitespace-nowrap shrink-0">
                    บันทึกหลังสอน
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate max-w-[160px] xs:max-w-[220px] sm:max-w-xs md:max-w-md hidden sm:block leading-snug mt-0.5">
                  {profile.name} <span className="text-slate-500">•</span> {profile.schoolName}
                </p>
              </div>
            </div>
          </div>

          {/* Center Info / Academic term badge */}
          <div className="hidden lg:flex items-center space-x-3 bg-slate-800/70 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-300 shrink-0">
            <div className="flex items-center space-x-1.5">
              <School className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-medium">{profile.department}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">ปีการศึกษา {profile.academicYear} (ภาคเรียน {profile.term})</span>
            </div>
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {onOpenGuideModal && (
              <button
                type="button"
                onClick={onOpenGuideModal}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="เปิดสไลด์และคู่มือสำหรับนำเสนอผลงาน"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>คู่มือนำเสนอ</span>
              </button>
            )}

            <button
              id="header-ai-btn"
              onClick={onOpenAIModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">ผู้ช่วย AI ครู</span>
              <span className="sm:hidden">AI</span>
            </button>

            <button
              id="header-export-btn"
              onClick={onOpenExportModal}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="ส่งออก / สำรองข้อมูล"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>ส่งออก</span>
            </button>

            <button
              id="header-new-log-btn"
              onClick={onOpenNewLog}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">บันทึกการสอนใหม่</span>
              <span className="sm:hidden">บันทึก</span>
            </button>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <button
                onClick={onOpenProfileModal}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-800 transition-all text-left group cursor-pointer"
                title="คลิกเพื่อแก้ไขข้อมูลและอัปโหลดรูปประจำตัว"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40 group-hover:ring-indigo-400 group-hover:scale-105 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/30 group-hover:ring-indigo-400">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{profile.name}</div>
                  <div className="text-[10px] text-slate-400">{profile.position} (แก้ไข)</div>
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
    </div>
  );
};
