import { AttendanceSession } from '../types';

export const initialAttendanceSessions: AttendanceSession[] = [
  // Sunday Session 1: Secondary level (ม.3/1) - 9 Aug 2026 (Sunday)
  {
    id: "att-sub-1-ม.3/1-2026-08-09",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    className: "ม.3/1",
    gradeLevel: "ม.3",
    date: "2026-08-09",
    dayOfWeek: "วันอาทิตย์",
    isSundaySession: true,
    period: "คาบที่ 1-2 (08:30 - 10:10 น.)",
    topic: "การแบ่งเซลล์แบบไมโทซิสและไมโอซิส",
    records: {
      "std-301-01": "present",
      "std-301-02": "present",
      "std-301-03": "present",
      "std-301-04": "late",
      "std-301-05": "present",
      "std-301-06": "present",
      "std-301-07": "leave",
      "std-301-08": "present",
      "std-301-09": "present",
      "std-301-10": "present",
    },
    remarks: {
      "std-301-04": "เข้าชั้นเรียนสาย 15 นาที",
      "std-301-07": "ลากิจไปร่วมการแข่งขันวิทยาศาสตร์"
    },
    updatedAt: "2026-08-09T10:15:00Z"
  },
  // Sunday Session 2: Secondary level (ม.3/1) - 2 Aug 2026 (Sunday)
  {
    id: "att-sub-1-ม.3/1-2026-08-02",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    className: "ม.3/1",
    gradeLevel: "ม.3",
    date: "2026-08-02",
    dayOfWeek: "วันอาทิตย์",
    isSundaySession: true,
    period: "คาบที่ 1-2 (08:30 - 10:10 น.)",
    topic: "โครโมโซมและสารพันธุกรรม DNA",
    records: {
      "std-301-01": "present",
      "std-301-02": "present",
      "std-301-03": "absent",
      "std-301-04": "present",
      "std-301-05": "present",
      "std-301-06": "present",
      "std-301-07": "present",
      "std-301-08": "present",
      "std-301-09": "present",
      "std-301-10": "present",
    },
    remarks: {
      "std-301-03": "ไม่ได้แจ้งผู้สอนล่วงหน้า"
    },
    updatedAt: "2026-08-02T10:15:00Z"
  },
  // Sunday Session 3: Secondary level (ม.3/1) - 26 Jul 2026 (Sunday)
  {
    id: "att-sub-1-ม.3/1-2026-07-26",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    className: "ม.3/1",
    gradeLevel: "ม.3",
    date: "2026-07-26",
    dayOfWeek: "วันอาทิตย์",
    isSundaySession: true,
    period: "คาบที่ 1-2 (08:30 - 10:10 น.)",
    topic: "ปฐมนิเทศรายวิชาและโครงสร้างพันธุศาสตร์",
    records: {
      "std-301-01": "present",
      "std-301-02": "present",
      "std-301-03": "present",
      "std-301-04": "present",
      "std-301-05": "present",
      "std-301-06": "present",
      "std-301-07": "present",
      "std-301-08": "present",
      "std-301-09": "sick",
      "std-301-10": "present",
    },
    remarks: {
      "std-301-09": "ลาป่วย มีใบรับรองแพทย์"
    },
    updatedAt: "2026-07-26T10:15:00Z"
  },
  // Sunday Session: Secondary level (ม.1/1) - 9 Aug 2026 (Sunday)
  {
    id: "att-sub-2-ม.1/1-2026-08-09",
    subjectId: "sub-2",
    subjectCode: "ว21103",
    subjectName: "วิทยาการคำนวณ 1",
    className: "ม.1/1",
    gradeLevel: "ม.1",
    date: "2026-08-09",
    dayOfWeek: "วันอาทิตย์",
    isSundaySession: true,
    period: "คาบที่ 3-4 (10:20 - 12:00 น.)",
    topic: "การแก้ปัญหาด้วยแนวคิดเชิงคำนวณ",
    records: {
      "std-101-01": "present",
      "std-101-02": "present",
      "std-101-03": "present",
      "std-101-04": "present",
      "std-101-05": "present",
    },
    remarks: {},
    updatedAt: "2026-08-09T12:05:00Z"
  }
];
