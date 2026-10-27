export interface TeacherProfile {
  name: string;
  position: string;
  academicStanding: string; // เช่น ครูชำนาญการพิเศษ
  schoolName: string;
  department: string; // เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี
  academicYear: string; // เช่น 2567
  term: string; // เช่น 1
  avatarUrl?: string;
}

export interface ClassRoomDetail {
  className: string; // เช่น ม.3/1
  studentCount: number; // เช่น 35
}

export interface Subject {
  id: string;
  code: string; // เช่น ว23101
  name: string; // เช่น วิทยาศาสตร์พื้นฐาน 5
  gradeLevel: string; // เช่น ม.3
  classes: string[]; // เช่น ['ม.3/1', 'ม.3/2']
  classDetails?: ClassRoomDetail[];
  department: string;
  hoursPerWeek: number;
  totalStudents: number;
}

export interface StudentStats {
  totalCount: number;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  leaveCount: number;
  lateCount: number;
}

export interface PostTeachingReflection {
  outcomes: string; // ผลการจัดการเรียนรู้
  problems: string; // ปัญหา / อุปสรรค
  solutions: string; // ข้อเสนอแนะ / แนวทางการแก้ไข
}

export interface TeachingLog {
  id: string;
  date: string; // YYYY-MM-DD
  period: string; // เช่น คาบที่ 1-2 (08:30 - 10:10 น.)
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  gradeLevel: string;
  className: string; // เช่น ม.3/1
  unitTitle: string; // เช่น หน่วยที่ 2 พันธุศาสตร์
  topic: string; // เรื่อง การถ่ายทอดลักษณะทางพันธุกรรม
  learningObjectives: string[]; // ตัวชี้วัด / จุดประสงค์
  teachingMethod: string; // เช่น Active Learning (5E)
  mediaTools: string[]; // เช่น สื่อสไลด์ Canva, กล้องจุลทรรศน์, แบบฝึกหัด
  assessmentMethods: string[]; // เช่น การสังเกตพฤติกรรม, ตรวจแบบฝึกหัด
  studentStats: StudentStats;
  reflection: PostTeachingReflection;
  imageUrls?: string[];
  status: 'completed' | 'draft' | 'needs_review';
  createdAt: string;
  updatedAt: string;
}

export interface StudentBehaviorNote {
  id: string;
  studentName: string;
  studentNo: number;
  className: string;
  date: string;
  behaviorType: 'positive' | 'needs_improvement' | 'general';
  note: string;
  subjectName: string;
}

export interface Student {
  id: string;
  studentNo: number; // เลขที่
  studentIdCode?: string; // รหัสนักเรียน เช่น 66101
  prefix?: string; // เช่น เด็กชาย, เด็กหญิง, นาย, นางสาว
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  className: string; // เช่น ม.3/1
  gender?: 'male' | 'female' | 'other';
  note?: string; // หมายเหตุ
}

export type ActiveTab = 'dashboard' | 'logs' | 'subjects' | 'students' | 'grades' | 'ai_assistant' | 'attendance' | 'print_preview' | 'guide';

export interface Assignment {
  id: string;
  title: string; // เช่น งานที่ 1: แบบฝึกหัดเรื่องเซลล์
  maxScore: number; // คะแนนเต็ม เช่น 10
  term?: '1' | '2' | 'yearly'; // เทอม/ปีการศึกษา
  category?: 'work' | 'quiz' | 'project' | 'midterm' | 'final';
}

export interface StudentScoreRecord {
  studentId: string;
  assignmentScores: Record<string, number>; // assignmentId -> score (คะแนนดิบ)
  midtermScore?: number; // คะแนนสอบกลางภาค/กลางปี
  finalScore?: number; // คะแนนสอบปลายภาค/ปลายปี
  notes?: string;
}

export interface GradebookConfig {
  levelType: 'secondary' | 'primary'; // 'secondary' (มัธยม 70:30) หรือ 'primary' (ประถม 70:30)
  term: '1' | '2' | 'yearly'; // '1', '2' หรือ 'yearly'
  workWeightRatio: number; // 70 สำหรับมัธยม (คะแนนเก็บ/งานมอบหมาย), 70 สำหรับประถม
  examWeightRatio: number; // 30 สำหรับมัธยม (สอบกลางภาค 15 + สอบปลายภาค 15), 30 สำหรับประถม
  midtermMaxScore: number; // 15 (มัธยม สอบกลางภาค) หรือ 15 (ประถม สอบกลางปี)
  finalMaxScore: number; // 15 (มัธยม สอบปลายภาค) หรือ 15 (ประถม สอบปลายปี)
}

export interface Gradebook {
  id: string; // e.g. "sub-1_ม.3/1_2567_1"
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  academicYear: string; // เช่น 2567
  config: GradebookConfig;
  assignments: Assignment[]; // ช่องงานที่ครูเพิ่ม
  studentScores: Record<string, StudentScoreRecord>; // studentId -> StudentScoreRecord
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  subjectId: string;
  className: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month';
  status: 'all' | 'completed' | 'draft';
}

export type AttendanceStatus = 'present' | 'late' | 'leave' | 'sick' | 'absent';

export interface StudentAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface AttendanceSecurityConfig {
  dynamicQrEnabled: boolean; // หมุนเวียน QR ทุก 15-20 วินาที ป้องกันการถ่ายรูปส่งต่อ
  deviceLockEnabled: boolean; // ล็อก 1 เครื่องต่อ 1 คน ป้องกันการกดแทนกัน
  pinCodeEnabled: boolean; // รหัส 4 หลักบนจอโปรเจกเตอร์
  currentPin?: string; // รหัส 4 หลักปัจจุบัน
  qrTokenIntervalSeconds?: number; // วินาทีในการหมุนเวียน QR เช่น 20s
  geoCheckEnabled?: boolean; // ตรวจพิกัดบริเวณโรงเรียน
}

export interface AttendanceSession {
  id: string; // e.g. "att-sub-1-ม.3/1-2026-08-09"
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  gradeLevel: string; // e.g. "ม.3" or "ป.6"
  date: string; // YYYY-MM-DD
  dayOfWeek?: string; // e.g. "วันอาทิตย์", "วันจันทร์"
  isSundaySession?: boolean; // true for secondary classes on Sundays
  period?: string; // e.g. "คาบ 1-2 (08:30 - 10:10 น.)"
  topic?: string;
  records: Record<string, AttendanceStatus>; // studentId -> AttendanceStatus
  remarks?: Record<string, string>; // studentId -> remark text
  deviceRecords?: Record<string, string>; // studentId -> deviceId (fingerprint) ป้องกันเครื่องเดียวเช็คหลายคน
  securityConfig?: AttendanceSecurityConfig; // การตั้งค่าความปลอดภัย
  headcountInRoom?: number; // จำนวนนักเรียนที่ครูนับได้จริงในห้อง
  updatedAt: string;
}

