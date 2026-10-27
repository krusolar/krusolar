import { TeacherProfile, Subject, TeachingLog, StudentBehaviorNote, Student } from '../types';

export const initialTeacherProfile: TeacherProfile = {
  name: "ครู ซอลาฮุดดิน แยะแย",
  position: "ครู คศ.2",
  academicStanding: "ชำนาญการ",
  schoolName: "โรงเรียนสาธิตวิทยาการ",
  department: "กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี",
  academicYear: "2567",
  term: "1",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
};

export const initialSubjects: Subject[] = [
  {
    id: "sub-1",
    code: "ว23101",
    name: "วิทยาศาสตร์พื้นฐาน 5",
    gradeLevel: "ม.3",
    classes: ["ม.3/1", "ม.3/2", "ม.3/3"],
    classDetails: [
      { className: "ม.3/1", studentCount: 36 },
      { className: "ม.3/2", studentCount: 34 },
      { className: "ม.3/3", studentCount: 35 },
    ],
    department: "วิทยาศาสตร์และเทคโนโลยี",
    hoursPerWeek: 3,
    totalStudents: 105,
  },
  {
    id: "sub-2",
    code: "ว21103",
    name: "วิทยาการคำนวณ 1",
    gradeLevel: "ม.1",
    classes: ["ม.1/1", "ม.1/2"],
    classDetails: [
      { className: "ม.1/1", studentCount: 36 },
      { className: "ม.1/2", studentCount: 36 },
    ],
    department: "วิทยาศาสตร์และเทคโนโลยี",
    hoursPerWeek: 2,
    totalStudents: 72,
  },
  {
    id: "sub-3",
    code: "ท16101",
    name: "ภาษาไทย 6",
    gradeLevel: "ป.6",
    classes: ["ป.6/1"],
    classDetails: [
      { className: "ป.6/1", studentCount: 35 },
    ],
    department: "ภาษาไทย",
    hoursPerWeek: 4,
    totalStudents: 35,
  },
  {
    id: "sub-4",
    code: "ค21101",
    name: "คณิตศาสตร์พื้นฐาน 1",
    gradeLevel: "ม.1",
    classes: ["ม.1/1"],
    classDetails: [
      { className: "ม.1/1", studentCount: 36 },
    ],
    department: "คณิตศาสตร์",
    hoursPerWeek: 3,
    totalStudents: 36,
  },
  {
    id: "sub-5",
    code: "ว6101",
    name: "เทคโนโลยี (วิทยาการคำนวณ)",
    gradeLevel: "ม.6",
    classes: ["ม.6/1", "ม.6/2"],
    classDetails: [
      { className: "ม.6/1", studentCount: 35 },
      { className: "ม.6/2", studentCount: 35 },
    ],
    department: "วิทยาศาสตร์และเทคโนโลยี",
    hoursPerWeek: 2,
    totalStudents: 70,
  }
];

export const initialTeachingLogs: TeachingLog[] = [
  {
    id: "log-101",
    date: "2026-07-22",
    period: "คาบที่ 2-3 (09:20 - 11:00 น.)",
    subjectId: "sub-1",
    subjectCode: "ว23101",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5",
    gradeLevel: "ม.3",
    className: "ม.3/1",
    unitTitle: "หน่วยที่ 2 พันธุศาสตร์และการถ่ายทอดลักษณะ",
    topic: "เรื่อง การแบ่งเซลล์แบบไมโทซิสและไมโอซิส (Mitosis vs Meiosis)",
    learningObjectives: [
      "อธิบายและเปรียบเทียบขั้นตอนการแบ่งเซลล์แบบไมโทซิสและไมโอซิสได้ถูกต้อง",
      "ปฏิบัติการส่องกล้องจุลทรรศน์สังเกตเซลล์รากหอมได้",
      "มีความใฝ่เรียนรู้และทำงานร่วมกับผู้อื่นได้อย่างมีประสิทธิภาพ"
    ],
    teachingMethod: "Active Learning (กระบวนการสืบเสาะหาความรู้ 5E + การทดลองปฏิบัติจริง)",
    mediaTools: [
      "สไลด์การสอน Interactive Canva",
      "กล้องจุลทรรศน์ใช้แสงและสไลด์ถาวรเซลล์รากหอม",
      "คลิปวิดีโอ 3D Animation การแบ่งนิวเคลียส",
      "ใบงานการทดลองและบันทึกผลกลุ่ม"
    ],
    assessmentMethods: [
      "ตรวจแบบบันทึกผลการส่องกล้องจุลทรรศน์",
      "การสังเกตพฤติกรรมทำงานกลุ่มและการแก้ปัญหา",
      "การตอบคำถามกระตุ้นความคิดระหว่างคาบ"
    ],
    studentStats: {
      totalCount: 35,
      presentCount: 33,
      absentCount: 0,
      sickCount: 1,
      leaveCount: 1,
      lateCount: 0
    },
    reflection: {
      outcomes: "นักเรียนส่วนใหญ่ (ประมาณ 88%) สามารถระบุความแตกต่างระหว่างการแบ่งเซลล์ไมโทซิสและไมโอซิสได้ถูกต้องจากการทำใบงานกลุ่ม นักเรียนมีความตื่นเต้นและสนใจการส่องกล้องจุลทรรศน์สไลด์รากหอม สามารถบันทึกภาพวาดขั้นตอนระยะโพรเฟสและเมทาเฟสได้ชัดเจน",
      problems: "มีนักเรียน 4 คนยังปรับความคมชัดของกล้องจุลทรรศน์เลนส์วัตถุกำลังขยาย 40x ไม่คล่อง ทำให้เสียเวลาในขั้นตอนปฏิบัติการส่องสไลด์ และกลุ่มที่ 3 ทำกิจกรรมล่าช้ากว่ากำหนด 10 นาที",
      solutions: "ครูได้เข้าไปประกบช่วยแนะนำการปรับปุ่มปรับภาพละเอียดสำหรับนักเรียนทั้ง 4 คน และในคาบถัดไปจะจับคู่เพื่อนช่วยเพื่อน (Peer Buddy) ให้คนที่มีทักษะกล้องช่วยแนะนำเพื่อนเพิ่มเติม"
    },
    imageUrls: [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80"
    ],
    status: "completed",
    createdAt: "2026-07-22T11:15:00Z",
    updatedAt: "2026-07-22T11:15:00Z"
  },
  {
    id: "log-102",
    date: "2026-07-21",
    period: "คาบที่ 5 (13:00 - 13:50 น.)",
    subjectId: "sub-2",
    subjectCode: "ว21103",
    subjectName: "วิทยาการคำนวณ 1",
    gradeLevel: "ม.1",
    className: "ม.1/2",
    unitTitle: "หน่วยที่ 1 การคิดเชิงคำนวณ (Computational Thinking)",
    topic: "เรื่อง การแยกส่วนประกอบและการย่อยปัญหา (Decomposition)",
    learningObjectives: [
      "อธิบายแนวคิดการแยกย่อยปัญหา (Decomposition) ในชีวิตประจำวันได้",
      "วิเคราะห์ระบบการทำงานของอุปกรณ์ในบ้านออกเป็นส่วนย่อยได้"
    ],
    teachingMethod: "Problem-Based Learning (PBL) + การระดมสมอง (Brainstorming)",
    mediaTools: [
      "แผ่นกระดาษฟลิปชาร์ทและปากกาเคมี",
      "ระบบใบงานออนไลน์ Google Classroom",
      "ตัวอย่างพัดลมและจักรยานจำลอง"
    ],
    assessmentMethods: [
      "การนำเสนอผลงานกลุ่มหน้าชั้นเรียน",
      "แบบประเมินทักษะการคิดเชิงคำนวณ"
    ],
    studentStats: {
      totalCount: 36,
      presentCount: 36,
      absentCount: 0,
      sickCount: 0,
      leaveCount: 0,
      lateCount: 2
    },
    reflection: {
      outcomes: "นักเรียนสามารถแบ่งกลุ่มและแยกย่อยองค์ประกอบของระบบจักรยานและพัดลมไอเย็นได้ครบถ้วน มีการอภิปรายถกเถียงในกลุ่มอย่างมีเหตุผล แสดงถึงความเข้าใจแนวคิด Decomposition ได้ดีมาก",
      problems: "นักเรียนมาสาย 2 คนเนื่องจากคาบก่อนหน้าเรียนพละศึกษา ทำให้ต้องปฐมนิเทศกติกาซ้ำเล็กน้อย",
      solutions: "ประสานงานกับครูผู้สอนวิชาพละให้ปล่อยนักเรียนล้างหน้าเปลี่ยนชุดตรงเวลามากขึ้น และปรับการเริ่มสไลด์ intro ให้มีกิจกรรมละลายพฤติกรรมสั้นๆ"
    },
    imageUrls: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
    ],
    status: "completed",
    createdAt: "2026-07-21T14:10:00Z",
    updatedAt: "2026-07-21T14:10:00Z"
  },
  {
    id: "log-103",
    date: "2026-07-20",
    period: "คาบที่ 1 (08:30 - 09:20 น.)",
    subjectId: "sub-3",
    subjectCode: "ท16101",
    subjectName: "ภาษาไทย 6",
    gradeLevel: "ป.6",
    className: "ป.6/1",
    unitTitle: "หน่วยที่ 3 การอ่านจับใจความสำคัญ",
    topic: "เรื่อง การอ่านวิเคราะห์บทความข่าวสารและการเขียนสรุปความ",
    learningObjectives: [
      "จับใจความสำคัญจากบทความข่าวสั้นได้ถูกต้อง",
      "เขียนสรุปความความยาวไม่เกิน 5 บรรทัดด้วยภาษาตนเองได้"
    ],
    teachingMethod: "Think-Pair-Share + กิจกรรมเกมค้นหาคำสำคัญ",
    mediaTools: [
      "ตัวอย่างข่าวสิ่งแวดล้อมจากหนังสือพิมพ์เด็ก",
      "บัตรคำและแผนภาพความคิด Mind Map"
    ],
    assessmentMethods: [
      "แบบฝึกหัดจับใจความสำคัญ",
      "แบบประเมินการเขียนสรุปความ"
    ],
    studentStats: {
      totalCount: 35,
      presentCount: 34,
      absentCount: 1,
      sickCount: 0,
      leaveCount: 0,
      lateCount: 1
    },
    reflection: {
      outcomes: "นักเรียนกลุ่มใหญ่สามารถจับประเด็น ใคร ทำอะไร ที่ไหน เมื่อไหร่ อย่างไร ได้ถูกต้อง และเขียนแผนภาพความคิดได้สมบูรณ์",
      problems: "นักเรียนประมาณ 5 คนยังมีปัญหาเรื่องการสะกดคำยากบางคำในบทข่าว เช่น 'ทรัพยากร' และ 'สิ่งแวดล้อม'",
      solutions: "ครูรวบรวมคำยากทำเป็นคลังคำศัพท์ติดไว้ที่มุมภาษาไทยในห้องเรียนเพื่อให้นักเรียนฝึกทบทวนคัดเขียน"
    },
    status: "completed",
    createdAt: "2026-07-20T10:00:00Z",
    updatedAt: "2026-07-20T10:00:00Z"
  }
];

export const initialBehaviorNotes: StudentBehaviorNote[] = [
  {
    id: "beh-1",
    studentName: "ด.ช. นพดล ใจดี",
    studentNo: 12,
    className: "ม.3/1",
    date: "2026-07-22",
    behaviorType: "positive",
    note: "ช่วยอาสาจัดเตรียมและทำความสะอาดสไลด์กล้องจุลทรรศน์ให้เพื่อนร่วมชั้นอย่างมีน้ำใจ",
    subjectName: "วิทยาศาสตร์พื้นฐาน 5"
  },
  {
    id: "beh-2",
    studentName: "ด.ญ. กานดา วงศ์สว่าง",
    studentNo: 5,
    className: "ม.1/2",
    date: "2026-07-21",
    behaviorType: "positive",
    note: "นำเสนอแนวคิดการย่อยปัญหาในงานกลุ่มได้อย่างโดดเด่น มีภาวะผู้นำสูง",
    subjectName: "วิทยาการคำนวณ 1"
  },
  {
    id: "beh-3",
    studentName: "ด.ช. ชัยวัฒน์ รุ่งเรือง",
    studentNo: 19,
    className: "ป.6/1",
    date: "2026-07-20",
    behaviorType: "needs_improvement",
    note: "สมาธิสั้นระหว่างฟังบรรยาย ต้องกระตุ้นด้วยกิจกรรมจับคู่สะกดคำสั้นๆ",
    subjectName: "ภาษาไทย 6"
  }
];

export const initialStudents: Student[] = [
  // ห้อง ม.3/1
  { id: "std-301-01", studentNo: 1, studentIdCode: "6630101", prefix: "เด็กชาย", firstName: "กิตติพงษ์", lastName: "สุขสว่าง", className: "ม.3/1", gender: "male" },
  { id: "std-301-02", studentNo: 2, studentIdCode: "6630102", prefix: "เด็กชาย", firstName: "ชินวัตร", lastName: "มั่นคง", className: "ม.3/1", gender: "male" },
  { id: "std-301-03", studentNo: 3, studentIdCode: "6630103", prefix: "เด็กชาย", firstName: "ณัฐดนย์", lastName: "ประเสริฐศิลป์", className: "ม.3/1", gender: "male" },
  { id: "std-301-04", studentNo: 4, studentIdCode: "6630104", prefix: "เด็กชาย", firstName: "ธนกฤต", lastName: "เจริญสุข", className: "ม.3/1", gender: "male" },
  { id: "std-301-05", studentNo: 5, studentIdCode: "6630105", prefix: "เด็กชาย", firstName: "นพดล", lastName: "ใจดี", className: "ม.3/1", gender: "male" },
  { id: "std-301-06", studentNo: 6, studentIdCode: "6630106", prefix: "เด็กหญิง", firstName: "กนกวรรณ", lastName: "แสงทอง", className: "ม.3/1", gender: "female" },
  { id: "std-301-07", studentNo: 7, studentIdCode: "6630107", prefix: "เด็กหญิง", firstName: "จิราพร", lastName: "สายชล", className: "ม.3/1", gender: "female" },
  { id: "std-301-08", studentNo: 8, studentIdCode: "6630108", prefix: "เด็กหญิง", firstName: "ชลธิชา", lastName: "รักการเรียน", className: "ม.3/1", gender: "female" },
  { id: "std-301-09", studentNo: 9, studentIdCode: "6630109", prefix: "เด็กหญิง", firstName: "ณิชานันท์", lastName: "ภักดี", className: "ม.3/1", gender: "female" },
  { id: "std-301-10", studentNo: 10, studentIdCode: "6630110", prefix: "เด็กหญิง", firstName: "ธันย์ชนก", lastName: "ศรีสมบูรณ์", className: "ม.3/1", gender: "female" },

  // ห้อง ม.1/1
  { id: "std-101-01", studentNo: 1, studentIdCode: "6610101", prefix: "เด็กชาย", firstName: "กรวิชญ์", lastName: "วงศ์สว่าง", className: "ม.1/1", gender: "male" },
  { id: "std-101-02", studentNo: 2, studentIdCode: "6610102", prefix: "เด็กชาย", firstName: "เขมทัต", lastName: "มีพร้อม", className: "ม.1/1", gender: "male" },
  { id: "std-101-03", studentNo: 3, studentIdCode: "6610103", prefix: "เด็กหญิง", firstName: "กานดา", lastName: "สุวรรณโณ", className: "ม.1/1", gender: "female" },
  { id: "std-101-04", studentNo: 4, studentIdCode: "6610104", prefix: "เด็กหญิง", firstName: "ขวัญข้าว", lastName: "อุดมทรัพย์", className: "ม.1/1", gender: "female" },
  { id: "std-101-05", studentNo: 5, studentIdCode: "6610105", prefix: "เด็กหญิง", firstName: "จิดาภา", lastName: "เกียรตินิยม", className: "ม.1/1", gender: "female" },

  // ห้อง ม.6/1
  { id: "std-601-01", studentNo: 1, studentIdCode: "6660101", prefix: "นาย", firstName: "กษิดิ์เดช", lastName: "ปัญญาวงศ์", className: "ม.6/1", gender: "male" },
  { id: "std-601-02", studentNo: 2, studentIdCode: "6660102", prefix: "นาย", firstName: "จิรภัทร", lastName: "พิชิตชัย", className: "ม.6/1", gender: "male" },
  { id: "std-601-03", studentNo: 3, studentIdCode: "6660103", prefix: "นาย", firstName: "ชยธร", lastName: "เกียรติไพศาล", className: "ม.6/1", gender: "male" },
  { id: "std-601-04", studentNo: 4, studentIdCode: "6660104", prefix: "นางสาว", firstName: "กัญญารัตน์", lastName: "รัตนโชติ", className: "ม.6/1", gender: "female" },
  { id: "std-601-05", studentNo: 5, studentIdCode: "6660105", prefix: "นางสาว", firstName: "ชลดา", lastName: "สุขเจริญ", className: "ม.6/1", gender: "female" },
  { id: "std-601-06", studentNo: 6, studentIdCode: "6660106", prefix: "นางสาว", firstName: "ณัฐณิชา", lastName: "ศิริทรัพย์", className: "ม.6/1", gender: "female" },

  // ห้อง ม.6/2
  { id: "std-602-01", studentNo: 1, studentIdCode: "6660201", prefix: "นาย", firstName: "ธนวัฒน์", lastName: "เจริญพร", className: "ม.6/2", gender: "male" },
  { id: "std-602-02", studentNo: 2, studentIdCode: "6660202", prefix: "นางสาว", firstName: "ปาณิสรา", lastName: "วงศ์สว่าง", className: "ม.6/2", gender: "female" },
  { id: "std-602-03", studentNo: 3, studentIdCode: "6660203", prefix: "นางสาว", firstName: "ภัทราภรณ์", lastName: "งามวิไล", className: "ม.6/2", gender: "female" },

  // ห้อง ม.3/2
  { id: "std-302-01", studentNo: 1, studentIdCode: "6630201", prefix: "เด็กชาย", firstName: "คณิน", lastName: "ปรีดากุล", className: "ม.3/2", gender: "male" },
  { id: "std-302-02", studentNo: 2, studentIdCode: "6630202", prefix: "เด็กหญิง", firstName: "พิชชาภา", lastName: "งามทวี", className: "ม.3/2", gender: "female" },

  // ห้อง ป.6/1
  { id: "std-601p-01", studentNo: 1, studentIdCode: "6660101p", prefix: "เด็กชาย", firstName: "ชัยวัฒน์", lastName: "รุ่งเรือง", className: "ป.6/1", gender: "male" },
  { id: "std-601p-02", studentNo: 2, studentIdCode: "6660102p", prefix: "เด็กหญิง", firstName: "อารียา", lastName: "ใจดี", className: "ป.6/1", gender: "female" }
];
