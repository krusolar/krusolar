import React from 'react';
import { ActiveTab, TeacherProfile } from '../types';
import { 
  LayoutDashboard, 
  FileCheck2, 
  BookMarked, 
  Sparkles, 
  Users, 
  Printer, 
  PlusCircle,
  BarChart3,
  LogOut,
  User,
  Settings,
  GraduationCap,
  Award,
  Presentation
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  logCount: number;
  subjectCount: number;
  studentCount?: number;
  onOpenNewLog: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  profile?: TeacherProfile;
  onOpenProfileModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  logCount,
  subjectCount,
  studentCount,
  onOpenNewLog,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
  profile,
  onOpenProfileModal
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'ภาพรวมการสอน (Dashboard)',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'logs' as ActiveTab,
      label: 'บันทึกการสอน (Lesson Logs)',
      icon: FileCheck2,
      badge: logCount
    },
    {
      id: 'subjects' as ActiveTab,
      label: 'รายวิชา & ห้องเรียน',
      icon: BookMarked,
      badge: subjectCount
    },
    {
      id: 'students' as ActiveTab,
      label: 'รายชื่อนักเรียนเข้าห้องเรียน',
      icon: GraduationCap,
      badge: studentCount ?? null
    },
    {
      id: 'grades' as ActiveTab,
      label: 'สมุดบันทึกคะแนน & ตัดเกรด',
      icon: Award,
      badge: 'ใหม่',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'ai_assistant' as ActiveTab,
      label: 'สตูดิโอผู้ช่วย AI ครู',
      icon: Sparkles,
      badge: 'AI Special',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'attendance' as ActiveTab,
      label: 'เช็คชื่อ & สแกน QR (ม.6)',
      icon: Users,
      badge: 'QR สแกน',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
    },
    {
      id: 'guide' as ActiveTab,
      label: 'คู่มือนำเสนอ & สไลด์ (Guide)',
      icon: Presentation,
      badge: 'คู่มือ/สไลด์',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
    },
    {
      id: 'print_preview' as ActiveTab,
      label: 'พิมพ์รายงานเป็นทางการ (A4)',
      icon: Printer,
      badge: null
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 text-slate-300 w-64 p-4 space-y-5">
      
      {/* Teacher Profile Card */}
      {profile && (
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center space-x-3 group relative shadow-xs">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-400/50"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-indigo-900 text-indigo-200 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400/30">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-200 transition-colors">
              {profile.name}
            </h4>
            <p className="text-[10px] text-slate-300 truncate">
              {profile.position}
            </p>
          </div>

          {onOpenProfileModal && (
            <button
              onClick={() => {
                onOpenProfileModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="แก้ไขข้อมูลส่วนตัวและเปลี่ยนรูปประจำตัว"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Quick Action Button */}
      <div>
        <button
          id="sidebar-new-log-btn"
          onClick={() => {
            onOpenNewLog();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-600/20 transition-all duration-150 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เขียนบันทึกหลังสอน</span>
        </button>
      </div>

      {/* Main Nav Section */}
      <div className="flex-1 space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          เมนูหลัก
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`gsap-nav-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-indigo-700 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Card */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 font-medium mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>สรุปการบันทึกประจำเดือน</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          บันทึกการสอนแล้ว {logCount} คาบ • ครอบคลุม {subjectCount} รายวิชา
        </p>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 min-h-[calc(100vh-4rem)] print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile} 
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
