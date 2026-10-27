import React, { useState, useEffect } from 'react';
import { 
  TeacherProfile, 
  Subject, 
  TeachingLog, 
  StudentBehaviorNote, 
  Student,
  Gradebook,
  AttendanceSession,
  ActiveTab 
} from './types';
import { 
  initialTeacherProfile, 
  initialSubjects, 
  initialTeachingLogs, 
  initialBehaviorNotes,
  initialStudents
} from './data/initialData';
import { initialGradebooks } from './data/initialGradebooks';
import { initialAttendanceSessions } from './data/initialAttendance';
import { 
  subscribeLogs, 
  saveLogToFirestore, 
  deleteLogFromFirestore, 
  subscribeSubjects, 
  saveSubjectToFirestore, 
  deleteSubjectFromFirestore,
  saveAllSubjectsToFirestore, 
  subscribeProfile, 
  saveProfileToFirestore,
  subscribeBehaviorNotes,
  saveBehaviorNoteToFirestore,
  deleteBehaviorNoteFromFirestore,
  subscribeStudents,
  saveStudentToFirestore,
  saveBatchStudentsToFirestore,
  deleteStudentFromFirestore,
  clearStudentsInClassFromFirestore,
  subscribeGradebooks,
  saveGradebookToFirestore,
  deleteGradebookFromFirestore,
  subscribeAttendanceSessions,
  saveAttendanceSessionToFirestore,
  deleteAttendanceSessionFromFirestore
} from './services/firestoreService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LogList } from './components/LogList';
import { LogFormModal } from './components/LogFormModal';
import { LogDetailModal } from './components/LogDetailModal';
import { OfficialPrintView } from './components/OfficialPrintView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { SubjectManager } from './components/SubjectManager';
import { StudentManager } from './components/StudentManager';
import { GradebookManager } from './components/GradebookManager';
import { AttendanceTracker } from './components/AttendanceTracker';
import { ExportModal } from './components/ExportModal';
import { LoginModal } from './components/LoginModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { StudentQRCheckinPortal } from './components/StudentQRCheckinPortal';
import { PresentationGuideModal } from './components/PresentationGuideModal';

export default function App() {
  // Check if URL indicates student QR check-in mode
  const [isStudentPortalMode, setIsStudentPortalMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('checkin=') || 
           window.location.search.includes('class=') ||
           window.location.hash.includes('checkin');
  });

  // Authentication State - Always require fresh login when opening or pasting the link
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogout = () => {
    sessionStorage.removeItem('krusolar_edulog_session');
    localStorage.removeItem('krusolar_edulog_session');
    localStorage.removeItem('krusolar_edulog_user');
    setIsAuthenticated(false);
  };

  // State initialization with localStorage fallback
  const [profile, setProfile] = useState<TeacherProfile>(() => {
    const saved = localStorage.getItem('edulog_teacher_profile');
    return saved ? JSON.parse(saved) : initialTeacherProfile;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSaveProfile = (updatedProfile: TeacherProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('edulog_teacher_profile', JSON.stringify(updatedProfile));
    saveProfileToFirestore(updatedProfile);
  };

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('edulog_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  const [logs, setLogs] = useState<TeachingLog[]>(() => {
    const saved = localStorage.getItem('edulog_logs');
    return saved ? JSON.parse(saved) : initialTeachingLogs;
  });

  const [behaviorNotes, setBehaviorNotes] = useState<StudentBehaviorNote[]>(() => {
    const saved = localStorage.getItem('edulog_behavior_notes');
    return saved ? JSON.parse(saved) : initialBehaviorNotes;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edulog_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [gradebooks, setGradebooks] = useState<Gradebook[]>(() => {
    const saved = localStorage.getItem('edulog_gradebooks');
    const list: Gradebook[] = saved ? JSON.parse(saved) : initialGradebooks;
    return list.map(gb => {
      if (gb?.config?.levelType === 'secondary' && (gb.config.workWeightRatio === 60 || gb.config.examWeightRatio === 40)) {
        return {
          ...gb,
          config: {
            ...gb.config,
            workWeightRatio: 70,
            examWeightRatio: 30,
            midtermMaxScore: 15,
            finalMaxScore: 15
          }
        };
      }
      return gb;
    });
  });

  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('edulog_attendance_sessions');
    return saved ? JSON.parse(saved) : initialAttendanceSessions;
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubscribeProfile = subscribeProfile((cloudProfile) => {
      setProfile(cloudProfile);
      localStorage.setItem('edulog_teacher_profile', JSON.stringify(cloudProfile));
    });

    const unsubscribeSubjects = subscribeSubjects((cloudSubjects) => {
      setSubjects(cloudSubjects);
      localStorage.setItem('edulog_subjects', JSON.stringify(cloudSubjects));
    });

    const unsubscribeLogs = subscribeLogs((cloudLogs) => {
      setLogs(cloudLogs);
      localStorage.setItem('edulog_logs', JSON.stringify(cloudLogs));
    });

    const unsubscribeBehaviorNotes = subscribeBehaviorNotes((cloudNotes) => {
      setBehaviorNotes(cloudNotes);
      localStorage.setItem('edulog_behavior_notes', JSON.stringify(cloudNotes));
    });

    const unsubscribeStudents = subscribeStudents((cloudStudents) => {
      setStudents(cloudStudents);
      localStorage.setItem('edulog_students', JSON.stringify(cloudStudents));
    });

    const unsubscribeGradebooks = subscribeGradebooks((cloudGradebooks) => {
      setGradebooks(cloudGradebooks);
      localStorage.setItem('edulog_gradebooks', JSON.stringify(cloudGradebooks));
    });

    const unsubscribeAttendanceSessions = subscribeAttendanceSessions((cloudSessions) => {
      setAttendanceSessions(cloudSessions);
      localStorage.setItem('edulog_attendance_sessions', JSON.stringify(cloudSessions));
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSubjects();
      unsubscribeLogs();
      unsubscribeBehaviorNotes();
      unsubscribeStudents();
      unsubscribeGradebooks();
      unsubscribeAttendanceSessions();
    };
  }, []);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals & Active Selections
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TeachingLog | null>(null);
  
  const [selectedDetailLog, setSelectedDetailLog] = useState<TeachingLog | null>(null);
  const [printLog, setPrintLog] = useState<TeachingLog | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('edulog_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('edulog_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('edulog_behavior_notes', JSON.stringify(behaviorNotes));
  }, [behaviorNotes]);

  // Log Actions
  const handleSaveLog = (logData: Partial<TeachingLog>) => {
    let targetLog: TeachingLog;
    if (editingLog) {
      targetLog = { ...editingLog, ...logData } as TeachingLog;
      setLogs(logs.map(l => l.id === editingLog.id ? targetLog : l));
    } else {
      targetLog = logData as TeachingLog;
      setLogs([targetLog, ...logs]);
    }
    saveLogToFirestore(targetLog);
    setEditingLog(null);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการบันทึกการสอนนี้?')) {
      setLogs(logs.filter(l => l.id !== logId));
      deleteLogFromFirestore(logId);
    }
  };

  const handleDuplicateLog = (log: TeachingLog) => {
    const duplicated: TeachingLog = {
      ...log,
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      topic: `${log.topic} (คัดลอก)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLogs([duplicated, ...logs]);
    saveLogToFirestore(duplicated);
  };

  const handlePrintLog = (log: TeachingLog) => {
    setPrintLog(log);
    setActiveTab('print_preview');
  };

  // Subject Actions
  const handleSaveSubject = (savedSubject: Subject) => {
    const exists = subjects.some(s => s.id === savedSubject.id);
    if (exists) {
      setSubjects(subjects.map(s => s.id === savedSubject.id ? savedSubject : s));
    } else {
      setSubjects([...subjects, savedSubject]);
    }
    saveSubjectToFirestore(savedSubject);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (confirm('ยืนยันการลบรายวิชานี้?')) {
      setSubjects(subjects.filter(s => s.id !== subjectId));
      deleteSubjectFromFirestore(subjectId);
    }
  };

  // Behavior Note Actions
  const handleAddBehaviorNote = (note: StudentBehaviorNote) => {
    setBehaviorNotes([note, ...behaviorNotes]);
    saveBehaviorNoteToFirestore(note);
  };

  const handleDeleteBehaviorNote = (id: string) => {
    setBehaviorNotes(behaviorNotes.filter(n => n.id !== id));
    deleteBehaviorNoteFromFirestore(id);
  };

  // Attendance Session Actions
  const handleSaveAttendanceSession = (session: AttendanceSession) => {
    const exists = attendanceSessions.some(s => s.id === session.id);
    let updatedSessions: AttendanceSession[];
    if (exists) {
      updatedSessions = attendanceSessions.map(s => s.id === session.id ? session : s);
    } else {
      updatedSessions = [session, ...attendanceSessions];
    }
    setAttendanceSessions(updatedSessions);
    localStorage.setItem('edulog_attendance_sessions', JSON.stringify(updatedSessions));
    saveAttendanceSessionToFirestore(session);
  };

  const handleDeleteAttendanceSession = (sessionId: string) => {
    if (confirm('ยืนยันการลบบันทึกการเช็คชื่อเซกชันนี้?')) {
      const updated = attendanceSessions.filter(s => s.id !== sessionId);
      setAttendanceSessions(updated);
      localStorage.setItem('edulog_attendance_sessions', JSON.stringify(updated));
      deleteAttendanceSessionFromFirestore(sessionId);
    }
  };

  // Student Roster Actions
  const handleSaveStudent = (student: Student) => {
    const exists = students.some(s => s.id === student.id);
    if (exists) {
      setStudents(students.map(s => s.id === student.id ? student : s));
    } else {
      setStudents([...students, student]);
    }
    saveStudentToFirestore(student);
  };

  const handleSaveBatchStudents = (newStudents: Student[], targetClass: string, isOverwrite: boolean) => {
    let updatedList: Student[];
    if (isOverwrite) {
      const others = students.filter(s => s.className !== targetClass);
      updatedList = [...others, ...newStudents];
      const toDelete = students.filter(s => s.className === targetClass);
      clearStudentsInClassFromFirestore(toDelete);
    } else {
      updatedList = [...students, ...newStudents];
    }
    setStudents(updatedList);
    saveBatchStudentsToFirestore(newStudents);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
    deleteStudentFromFirestore(studentId);
  };

  const handleClearClassStudents = (className: string) => {
    const toDelete = students.filter(s => s.className === className);
    setStudents(students.filter(s => s.className !== className));
    clearStudentsInClassFromFirestore(toDelete);
  };

  // Gradebook Actions
  const handleSaveGradebook = (updatedGb: Gradebook) => {
    const exists = gradebooks.some(g => g.id === updatedGb.id);
    if (exists) {
      setGradebooks(gradebooks.map(g => g.id === updatedGb.id ? updatedGb : g));
    } else {
      setGradebooks([...gradebooks, updatedGb]);
    }
    saveGradebookToFirestore(updatedGb);
  };

  // Reset to default sample data
  const handleResetData = () => {
    setSubjects(initialSubjects);
    setLogs(initialTeachingLogs);
    setBehaviorNotes(initialBehaviorNotes);
    saveAllSubjectsToFirestore(initialSubjects);
    for (const log of initialTeachingLogs) {
      saveLogToFirestore(log);
    }
    for (const note of initialBehaviorNotes) {
      saveBehaviorNoteToFirestore(note);
    }
    saveProfileToFirestore(initialTeacherProfile);
    localStorage.removeItem('edulog_subjects');
    localStorage.removeItem('edulog_logs');
    localStorage.removeItem('edulog_behavior_notes');
  };

  if (isStudentPortalMode && !isAuthenticated) {
    return (
      <div className="relative">
        <div className="fixed top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => setIsStudentPortalMode(false)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer"
          >
            🔒 สำหรับครูผู้สอน: เข้าสู่ระบบ
          </button>
        </div>
        <StudentQRCheckinPortal
          sessions={attendanceSessions}
          students={students}
          subjects={subjects}
          profile={profile}
          onSaveAttendanceSession={handleSaveAttendanceSession}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <LoginModal onLoginSuccess={() => setIsAuthenticated(true)} />
        <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => setIsStudentPortalMode(true)}
            className="pointer-events-auto px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xl border border-amber-300 hover:scale-105 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>📲 สำหรับนักเรียน (ม.6): เช็คชื่อด้วยสมาร์ทโฟน</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 font-sans flex flex-col antialiased relative overflow-x-hidden selection:bg-indigo-500 selection:text-white print:bg-white print:text-black print:p-0 print:m-0">
      
      {/* Liquid Glass Background Ambient Morphing Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden no-print liquid-blob-container">
        <div className="absolute top-[-10%] left-[-10%] w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 blur-3xl liquid-blob-1" />
        <div className="absolute top-[35%] right-[-10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-cyan-400/20 via-sky-400/15 to-indigo-500/20 blur-3xl liquid-blob-2" />
        <div className="absolute bottom-[-10%] left-[15%] w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-purple-500/18 via-pink-400/15 to-sky-400/20 blur-3xl liquid-blob-3" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Bar */}
        <Header
          profile={profile}
          onOpenNewLog={() => {
            setEditingLog(null);
            setIsLogFormOpen(true);
          }}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileMenuOpen={isMobileSidebarOpen}
          onLogout={handleLogout}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenGuideModal={() => setActiveTab('guide')}
        />

        {/* Main Layout Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto flex print:max-w-none print:w-full print:p-0 print:m-0 print:block">
          
          {/* Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            logCount={logs.length}
            subjectCount={subjects.length}
            studentCount={students.length}
            onOpenNewLog={() => {
              setEditingLog(null);
              setIsLogFormOpen(true);
            }}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            onLogout={handleLogout}
            profile={profile}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />

          {/* Main Content View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 print:p-0 print:m-0 print:overflow-visible">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              logs={logs}
              subjects={subjects}
              profile={profile}
              gradebooks={gradebooks}
              students={students}
              onOpenNewLog={() => {
                setEditingLog(null);
                setIsLogFormOpen(true);
              }}
              onOpenLogDetail={(log) => setSelectedDetailLog(log)}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onNavigateTab={setActiveTab}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
            />
          )}

          {activeTab === 'logs' && (
            <LogList
              logs={logs}
              subjects={subjects}
              onOpenNewLog={() => {
                setEditingLog(null);
                setIsLogFormOpen(true);
              }}
              onOpenNewLogWithDate={(dateStr) => {
                setEditingLog({ date: dateStr } as any);
                setIsLogFormOpen(true);
              }}
              onOpenLogDetail={(log) => setSelectedDetailLog(log)}
              onEditLog={(log) => {
                setEditingLog(log);
                setIsLogFormOpen(true);
              }}
              onPrintLog={handlePrintLog}
              onDuplicateLog={handleDuplicateLog}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectManager
              subjects={subjects}
              onSaveSubject={handleSaveSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {activeTab === 'students' && (
            <StudentManager
              students={students}
              subjects={subjects}
              onSaveStudent={handleSaveStudent}
              onSaveBatchStudents={handleSaveBatchStudents}
              onDeleteStudent={handleDeleteStudent}
              onClearClassStudents={handleClearClassStudents}
            />
          )}

          {activeTab === 'grades' && (
            <GradebookManager
              subjects={subjects}
              students={students}
              profile={profile}
              gradebooks={gradebooks}
              onSaveGradebook={handleSaveGradebook}
              onDeleteGradebook={deleteGradebookFromFirestore}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">สตูดิโอผู้ช่วย AI ครู (EduLog AI Pedagogy Studio)</h2>
                  <p className="text-xs text-indigo-200 mt-1">
                    ใช้ AI ช่วยร่างบันทึกหลังสอน วิเคราะห์แนวทางแก้ปัญหาการเรียน และสร้างไอเดียกิจกรรม Warm-up
                  </p>
                </div>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  เปิดเครื่องมือ AI
                </button>
              </div>

              {/* Show AIAssistant component inline as well */}
              <AIAssistantModal
                isOpen={true}
                onClose={() => setActiveTab('dashboard')}
                subjects={subjects}
              />
            </div>
          )}

          {activeTab === 'attendance' && (
            <AttendanceTracker
              sessions={attendanceSessions}
              students={students}
              subjects={subjects}
              notes={behaviorNotes}
              profile={profile}
              onSaveSession={handleSaveAttendanceSession}
              onDeleteSession={handleDeleteAttendanceSession}
              onAddNote={handleAddBehaviorNote}
              onDeleteNote={handleDeleteBehaviorNote}
              onSaveBatchStudents={handleSaveBatchStudents}
            />
          )}

          {activeTab === 'print_preview' && (
            <OfficialPrintView
              logs={logs}
              profile={profile}
              subjects={subjects}
              students={students}
              gradebooks={gradebooks}
              selectedLogId={printLog?.id}
              onBack={() => setActiveTab('logs')}
            />
          )}

          {activeTab === 'guide' && (
            <PresentationGuideModal
              profile={profile}
              onClose={() => setActiveTab('dashboard')}
            />
          )}

        </main>

      </div>

      {/* Log Entry / Edit Form Modal */}
      <LogFormModal
        isOpen={isLogFormOpen}
        onClose={() => {
          setIsLogFormOpen(false);
          setEditingLog(null);
        }}
        onSave={handleSaveLog}
        subjects={subjects}
        initialLog={editingLog}
      />

      {/* Log Detail Drawer Modal */}
      <LogDetailModal
        log={selectedDetailLog}
        onClose={() => setSelectedDetailLog(null)}
        onEdit={(log) => {
          setEditingLog(log);
          setIsLogFormOpen(true);
        }}
        onPrint={handlePrintLog}
      />

      {/* AI Assistant Modal */}
      {activeTab !== 'ai_assistant' && (
        <AIAssistantModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          subjects={subjects}
        />
      )}

      {/* Export / Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        logs={logs}
        onResetData={handleResetData}
        gradebooks={gradebooks}
        subjects={subjects}
        students={students}
        profile={profile}
      />

      {/* Edit Profile & Avatar Modal */}
      <ProfileEditModal
        profile={profile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      </div>
    </div>
  );
}
