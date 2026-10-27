import { Gradebook } from '../types';

export const initialGradebooks: Gradebook[] = [
  {
    id: "sub-1_ม.3-1_2567_1",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    className: "ม.3/1",
    academicYear: "2567",
    config: {
      levelType: "secondary",
      term: "1",
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    },
    assignments: [
      { id: "asg-101", title: "งานที่ 1: แบบฝึกหัดเรื่องโครงสร้างเซลล์", maxScore: 10, category: "work" },
      { id: "asg-102", title: "งานที่ 2: ผลการส่องกล้องจุลทรรศน์", maxScore: 10, category: "work" },
      { id: "asg-103", title: "งานที่ 3: ใบงานการแบ่งเซลล์แบบไมโทซิส", maxScore: 15, category: "work" },
      { id: "asg-104", title: "งานที่ 4: แบบทดสอบย่อยเรื่องพันธุศาสตร์", maxScore: 15, category: "quiz" }
    ],
    studentScores: {
      "std-301-01": {
        studentId: "std-301-01",
        assignmentScores: { "asg-101": 9, "asg-102": 9, "asg-103": 14, "asg-104": 13 },
        midtermScore: 13,
        finalScore: 14
      },
      "std-301-02": {
        studentId: "std-301-02",
        assignmentScores: { "asg-101": 8, "asg-102": 8, "asg-103": 12, "asg-104": 11 },
        midtermScore: 12,
        finalScore: 12
      },
      "std-301-03": {
        studentId: "std-301-03",
        assignmentScores: { "asg-101": 10, "asg-102": 10, "asg-103": 15, "asg-104": 14 },
        midtermScore: 15,
        finalScore: 15
      },
      "std-301-04": {
        studentId: "std-301-04",
        assignmentScores: { "asg-101": 7, "asg-102": 8, "asg-103": 11, "asg-104": 10 },
        midtermScore: 11,
        finalScore: 12
      },
      "std-301-05": {
        studentId: "std-301-05",
        assignmentScores: { "asg-101": 9, "asg-102": 9, "asg-103": 13, "asg-104": 12 },
        midtermScore: 12,
        finalScore: 13
      },
      "std-301-06": {
        studentId: "std-301-06",
        assignmentScores: { "asg-101": 10, "asg-102": 10, "asg-103": 14, "asg-104": 15 },
        midtermScore: 14,
        finalScore: 14
      },
      "std-301-07": {
        studentId: "std-301-07",
        assignmentScores: { "asg-101": 8, "asg-102": 7, "asg-103": 10, "asg-104": 11 },
        midtermScore: 10,
        finalScore: 11
      },
      "std-301-08": {
        studentId: "std-301-08",
        assignmentScores: { "asg-101": 9, "asg-102": 9, "asg-103": 13, "asg-104": 14 },
        midtermScore: 12,
        finalScore: 13
      },
      "std-301-09": {
        studentId: "std-301-09",
        assignmentScores: { "asg-101": 10, "asg-102": 10, "asg-103": 15, "asg-104": 14 },
        midtermScore: 15,
        finalScore: 14
      },
      "std-301-10": {
        studentId: "std-301-10",
        assignmentScores: { "asg-101": 7, "asg-102": 8, "asg-103": 11, "asg-104": 10 },
        midtermScore: 9,
        finalScore: 10
      }
    },
    updatedAt: new Date().toISOString()
  },
  {
    id: "sub-3_ป.6-1_2567_yearly",
    subjectId: "sub-3",
    subjectCode: "ท16101",
    subjectName: "ภาษาไทย 6",
    className: "ป.6/1",
    academicYear: "2567",
    config: {
      levelType: "primary",
      term: "yearly",
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    },
    assignments: [
      { id: "asg-301", title: "งานที่ 1: คัดลายมือและเขียนคำยาก", maxScore: 10, category: "work" },
      { id: "asg-302", title: "งานที่ 2: แผนภาพความคิดจับใจความ", maxScore: 15, category: "work" },
      { id: "asg-303", title: "งานที่ 3: เขียนสรุปความบทความข่าว", maxScore: 15, category: "work" },
      { id: "asg-304", title: "งานที่ 4: แบบทดสอบหลักการใช้ภาษา", maxScore: 20, category: "quiz" }
    ],
    studentScores: {
      "std-601p-01": {
        studentId: "std-601p-01",
        assignmentScores: { "asg-301": 7, "asg-302": 11, "asg-303": 10, "asg-304": 12 },
        midtermScore: 9,
        finalScore: 10
      },
      "std-601p-02": {
        studentId: "std-601p-02",
        assignmentScores: { "asg-301": 10, "asg-302": 14, "asg-303": 14, "asg-304": 18 },
        midtermScore: 14,
        finalScore: 14
      }
    },
    updatedAt: new Date().toISOString()
  },
  {
    id: "sub-1_ม.3-2_2567_1",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    className: "ม.3/2",
    academicYear: "2567",
    config: {
      levelType: "secondary",
      term: "1",
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    },
    assignments: [
      { id: "asg-101", title: "งานที่ 1: แบบฝึกหัดเรื่องโครงสร้างเซลล์", maxScore: 10, category: "work" },
      { id: "asg-102", title: "งานที่ 2: ผลการส่องกล้องจุลทรรศน์", maxScore: 10, category: "work" },
      { id: "asg-103", title: "งานที่ 3: ใบงานการแบ่งเซลล์แบบไมโทซิส", maxScore: 15, category: "work" },
      { id: "asg-104", title: "งานที่ 4: แบบทดสอบย่อยเรื่องพันธุศาสตร์", maxScore: 15, category: "quiz" }
    ],
    studentScores: {
      "std-302-01": {
        studentId: "std-302-01",
        assignmentScores: { "asg-101": 6, "asg-102": 6, "asg-103": 8, "asg-104": 7 },
        midtermScore: 7,
        finalScore: 8
      },
      "std-302-02": {
        studentId: "std-302-02",
        assignmentScores: { "asg-101": 9, "asg-102": 10, "asg-103": 14, "asg-104": 14 },
        midtermScore: 13,
        finalScore: 14
      }
    },
    updatedAt: new Date().toISOString()
  },
  {
    id: "sub-2_ม.1-1_2567_1",
    subjectId: "sub-2",
    subjectCode: "ว21103",
    subjectName: "วิทยาการคำนวณ 1",
    className: "ม.1/1",
    academicYear: "2567",
    config: {
      levelType: "secondary",
      term: "1",
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    },
    assignments: [
      { id: "asg-201", title: "งานที่ 1: การแยกย่อยปัญหา Decomposition", maxScore: 15, category: "work" },
      { id: "asg-202", title: "งานที่ 2: ผังงาน Flowchart", maxScore: 15, category: "work" },
      { id: "asg-203", title: "งานที่ 3: แบบทดสอบการคิดเชิงคำนวณ", maxScore: 20, category: "quiz" }
    ],
    studentScores: {
      "std-101-01": {
        studentId: "std-101-01",
        assignmentScores: { "asg-201": 14, "asg-202": 13, "asg-203": 18 },
        midtermScore: 14,
        finalScore: 13
      },
      "std-101-02": {
        studentId: "std-101-02",
        assignmentScores: { "asg-201": 11, "asg-202": 10, "asg-203": 14 },
        midtermScore: 10,
        finalScore: 11
      },
      "std-101-03": {
        studentId: "std-101-03",
        assignmentScores: { "asg-201": 15, "asg-202": 15, "asg-203": 19 },
        midtermScore: 15,
        finalScore: 15
      },
      "std-101-04": {
        studentId: "std-101-04",
        assignmentScores: { "asg-201": 9, "asg-202": 9, "asg-203": 12 },
        midtermScore: 8,
        finalScore: 9
      },
      "std-101-05": {
        studentId: "std-101-05",
        assignmentScores: { "asg-201": 13, "asg-202": 12, "asg-203": 16 },
        midtermScore: 12,
        finalScore: 13
      }
    },
    updatedAt: new Date().toISOString()
  },
  {
    id: "sub-5_ม.6-1_2567_1",
    subjectId: "sub-5",
    subjectCode: "ว33101",
    subjectName: "วิทยาศาสตร์กายภาพ",
    className: "ม.6/1",
    academicYear: "2567",
    config: {
      levelType: "secondary",
      term: "1",
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    },
    assignments: [
      { id: "asg-501", title: "งานที่ 1: รายงานพลังงานนิวเคลียร์", maxScore: 20, category: "work" },
      { id: "asg-502", title: "งานที่ 2: การทดลองคลื่นแม่เหล็กไฟฟ้า", maxScore: 15, category: "work" },
      { id: "asg-503", title: "งานที่ 3: สอบย่อยทฤษฎีควอนตัมเบื้องต้น", maxScore: 15, category: "quiz" }
    ],
    studentScores: {
      "std-601-01": {
        studentId: "std-601-01",
        assignmentScores: { "asg-501": 18, "asg-502": 14, "asg-503": 14 },
        midtermScore: 14,
        finalScore: 14
      },
      "std-601-02": {
        studentId: "std-601-02",
        assignmentScores: { "asg-501": 16, "asg-502": 12, "asg-503": 11 },
        midtermScore: 11,
        finalScore: 12
      },
      "std-601-03": {
        studentId: "std-601-03",
        assignmentScores: { "asg-501": 19, "asg-502": 15, "asg-503": 15 },
        midtermScore: 15,
        finalScore: 14
      },
      "std-601-04": {
        studentId: "std-601-04",
        assignmentScores: { "asg-501": 17, "asg-502": 13, "asg-503": 13 },
        midtermScore: 13,
        finalScore: 13
      },
      "std-601-05": {
        studentId: "std-601-05",
        assignmentScores: { "asg-501": 15, "asg-502": 11, "asg-503": 10 },
        midtermScore: 10,
        finalScore: 11
      },
      "std-601-06": {
        studentId: "std-601-06",
        assignmentScores: { "asg-501": 20, "asg-502": 15, "asg-503": 15 },
        midtermScore: 15,
        finalScore: 15
      }
    },
    updatedAt: new Date().toISOString()
  }
];
