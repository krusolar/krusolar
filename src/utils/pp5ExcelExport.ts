import * as XLSX from 'xlsx';
import { Gradebook, Student, Subject, TeacherProfile } from '../types';
import { calculateStudentGrade } from './gradeCalculator';

export interface PP5ExportOptions {
  gradebook: Gradebook;
  students: Student[];
  subject?: Subject;
  profile: TeacherProfile;
  academicYear?: string;
  term?: string;
}

/**
 * Export a single Gradebook to an official Phor Phor 5 (ปพ.5) Excel (.xlsx) file
 */
export function exportPP5ToExcel({
  gradebook,
  students,
  subject,
  profile,
  academicYear = profile.academicYear || '2567',
  term = profile.term || '1',
}: PP5ExportOptions) {
  // 1. Filter and sort students for this class
  const classStudents = students
    .filter(s => s.className === gradebook.className)
    .sort((a, b) => a.studentNo - b.studentNo);

  // 2. Calculate grades for each student
  const studentResults = classStudents.map(student => {
    const record = gradebook.studentScores?.[student.id];
    const calc = calculateStudentGrade(record, gradebook.assignments, gradebook.config);
    return {
      student,
      calc,
    };
  });

  // 3. Compute statistics & grade distribution
  const totalStudents = studentResults.length;
  const passedStudents = studentResults.filter(r => r.calc.isPassed).length;
  const failedStudents = totalStudents - passedStudents;
  const passedPercentage = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;

  const counts: Record<string, number> = {
    '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0
  };
  studentResults.forEach(r => {
    const gKey = r.calc.grade.toString();
    if (counts[gKey] !== undefined) {
      counts[gKey]++;
    }
  });

  // Calculate Average Net Score
  const avgNetScore = totalStudents > 0
    ? Math.round((studentResults.reduce((acc, curr) => acc + curr.calc.netScore, 0) / totalStudents) * 10) / 10
    : 0;

  // --------------------------------------------------------------------------
  // SHEET 1: แบบสรุปผลการเรียน ปพ.5 (Summary Report)
  // --------------------------------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    ['แบบรายงานสรุปคะแนนและผลการประเมินการเรียนรู้ (ปพ.5)'],
    [profile.schoolName || 'โรงเรียน'],
    [
      `กลุ่มสาระการเรียนรู้${profile.department || ''}`,
      '',
      `ปีการศึกษา ${academicYear}`,
      '',
      `ภาคเรียนที่ ${term === 'yearly' ? 'ประเมินทั้งปี' : term}`
    ],
    [
      `รหัสวิชา: ${subject?.code || gradebook.subjectCode}`,
      '',
      `ชื่อวิชา: ${subject?.name || gradebook.subjectName}`,
      '',
      `ระดับชั้น/ห้อง: ${subject?.gradeLevel || ''} (${gradebook.className})`
    ],
    [
      `ครูผู้สอน: ${profile.name} (${profile.position || 'ครู'})`,
      '',
      `สัดส่วนประเมิน: คะแนนเก็บ ${gradebook.config.workWeightRatio}% : สอบ ${gradebook.config.examWeightRatio}% (กลางภาค ${gradebook.config.midtermMaxScore} + ปลายภาค ${gradebook.config.finalMaxScore})`
    ],
    [], // Blank line
    // Table Headers
    [
      'เลขที่',
      'รหัสประจำตัว',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ชื่อ - นามสกุล',
      `คะแนนรวมคะแนนเก็บ (เต็ม ${gradebook.config.workWeightRatio})`,
      `คะแนนสอบกลางภาค (เต็ม ${gradebook.config.midtermMaxScore})`,
      `คะแนนสอบปลายภาค (เต็ม ${gradebook.config.finalMaxScore})`,
      `คะแนนรวมสอบ (เต็ม ${gradebook.config.examWeightRatio})`,
      'คะแนนรวมสุทธิ (เต็ม 100)',
      'ระดับผลการเรียน (เกรด)',
      'ความหมายผลการเรียน',
      'ผลการตัดสิน'
    ]
  ];

  // Data rows
  studentResults.forEach(({ student, calc }) => {
    const fullName = `${student.prefix || ''}${student.firstName} ${student.lastName}`.trim();
    sheet1Data.push([
      student.studentNo,
      student.studentIdCode || '',
      student.prefix || '',
      student.firstName,
      student.lastName,
      fullName,
      calc.scaledWorkScore,
      calc.midtermScore,
      calc.finalScore,
      calc.totalExamScore,
      calc.netScore,
      calc.grade,
      calc.gradeLabel,
      calc.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'
    ]);
  });

  // Empty separator
  sheet1Data.push([]);
  sheet1Data.push(['สรุปสถิติผลสัมฤทธิ์ทางการเรียน']);
  sheet1Data.push(['จำนวนนักเรียนเข้าประเมินทั้งหมด (คน)', totalStudents]);
  sheet1Data.push(['คะแนนเฉลี่ยรวมสุทธิ', avgNetScore]);
  sheet1Data.push(['จำนวนนักเรียนที่ผ่านเกณฑ์ (คน)', passedStudents, `คิดเป็นร้อยละ ${passedPercentage}%`]);
  sheet1Data.push(['จำนวนนักเรียนที่ไม่ผ่านเกณฑ์ (คน)', failedStudents, `คิดเป็นร้อยละ ${100 - passedPercentage}%`]);

  sheet1Data.push([]);
  sheet1Data.push(['ตารางการกระจายระดับผลการเรียน (Grade Distribution)']);
  sheet1Data.push([
    'ระดับผลการเรียน',
    '4',
    '3.5',
    '3',
    '2.5',
    '2',
    '1.5',
    '1',
    '0',
    'รวมทั้งหมด'
  ]);

  const countRow: (string | number)[] = ['จำนวน (คน)'];
  ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].forEach(g => {
    countRow.push(counts[g] || 0);
  });
  countRow.push(totalStudents);
  sheet1Data.push(countRow);

  const pctRow: (string | number)[] = ['คิดเป็นร้อยละ (%)'];
  ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].forEach(g => {
    const cnt = counts[g] || 0;
    const pct = totalStudents > 0 ? Number(((cnt / totalStudents) * 100).toFixed(1)) : 0;
    sheet1Data.push();
    pctRow.push(pct);
  });
  pctRow.push(100);
  sheet1Data.push(pctRow);

  sheet1Data.push([]);
  sheet1Data.push(['ลงชื่อครูผู้สอน', `(${profile.name})`, 'ตำแหน่ง', profile.position || 'ครู']);
  sheet1Data.push(['ลงชื่อหัวหน้ากลุ่มสาระฯ', '(................................................)', 'กลุ่มสาระการเรียนรู้', profile.department || '']);
  sheet1Data.push(['ลงชื่อผู้อำนวยการโรงเรียน', '(................................................)', 'ผู้อำนวยการ', profile.schoolName || '']);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Set column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 8 },  // เลขที่
    { wch: 14 }, // รหัสประจำตัว
    { wch: 10 }, // คำนำหน้า
    { wch: 16 }, // ชื่อ
    { wch: 16 }, // นามสกุล
    { wch: 26 }, // ชื่อ - นามสกุล
    { wch: 22 }, // คะแนนเก็บถ่วงน้ำหนัก
    { wch: 18 }, // กลางภาค
    { wch: 18 }, // ปลายภาค
    { wch: 18 }, // รวมสอบ
    { wch: 18 }, // รวมสุทธิ 100
    { wch: 16 }, // เกรด
    { wch: 16 }, // ความหมาย
    { wch: 14 }  // ผลการตัดสิน
  ];

  // --------------------------------------------------------------------------
  // SHEET 2: รายละเอียดคะแนนเก็บรายชิ้นงาน (Assignments Breakdown)
  // --------------------------------------------------------------------------
  const assignments = gradebook.assignments || [];
  const totalMaxRaw = assignments.reduce((acc, a) => acc + (a.maxScore || 0), 0);

  const sheet2Data: (string | number)[][] = [
    [`รายละเอียดคะแนนเก็บรายภาระงาน/ชิ้นงาน - ${subject?.code || gradebook.subjectCode} ${subject?.name || gradebook.subjectName}`],
    [`ห้อง ${gradebook.className} | ปีการศึกษา ${academicYear} | ภาคเรียนที่ ${term === 'yearly' ? 'ทั้งปี' : term}`],
    []
  ];

  // Header row for sheet 2
  const sheet2Headers = ['เลขที่', 'รหัสประจำตัว', 'ชื่อ - นามสกุล'];
  assignments.forEach((asg, idx) => {
    sheet2Headers.push(`งานที่ ${idx + 1}: ${asg.title} (เต็ม ${asg.maxScore})`);
  });
  sheet2Headers.push(`รวมคะแนนดิบ (เต็ม ${totalMaxRaw})`);
  sheet2Headers.push(`คะแนนเก็บแปลงเทียบ (เต็ม ${gradebook.config.workWeightRatio})`);
  sheet2Data.push(sheet2Headers);

  // Data rows for sheet 2
  studentResults.forEach(({ student, calc }) => {
    const scores = gradebook.studentScores?.[student.id]?.assignmentScores || {};
    const fullName = `${student.prefix || ''}${student.firstName} ${student.lastName}`.trim();
    const row: (string | number)[] = [
      student.studentNo,
      student.studentIdCode || '',
      fullName
    ];

    assignments.forEach(asg => {
      row.push(scores[asg.id] ?? 0);
    });

    row.push(calc.totalRawWorkScore);
    row.push(calc.scaledWorkScore);
    sheet2Data.push(row);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  const sheet2Cols: { wch: number }[] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 26 },
  ];
  assignments.forEach(() => {
    sheet2Cols.push({ wch: 22 });
  });
  sheet2Cols.push({ wch: 20 }, { wch: 22 });
  ws2['!cols'] = sheet2Cols;

  // 4. Create Workbook and Append Sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'ปพ.5 สรุปผลการเรียน');
  XLSX.utils.book_append_sheet(wb, ws2, 'คะแนนเก็บรายชิ้นงาน');

  // 5. Generate clean file name and download
  const safeClass = gradebook.className.replace(/[\/\\#?*:]/g, '-');
  const safeCode = (subject?.code || gradebook.subjectCode || 'Grade').replace(/[\/\\#?*:]/g, '-');
  const fileName = `ปพ5_${safeCode}_${safeClass}_ปีการศึกษา${academicYear}_ภาคเรียน${term}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Export all Gradebooks across classes into a single master Excel workbook
 */
export function exportAllPP5ToExcel({
  gradebooks,
  students,
  subjects,
  profile,
  academicYear = profile.academicYear || '2567',
  term = profile.term || '1',
}: {
  gradebooks: Gradebook[];
  students: Student[];
  subjects: Subject[];
  profile: TeacherProfile;
  academicYear?: string;
  term?: string;
}) {
  if (!gradebooks || gradebooks.length === 0) return;

  const wb = XLSX.utils.book_new();

  gradebooks.forEach((gb) => {
    const classStudents = students
      .filter(s => s.className === gb.className)
      .sort((a, b) => a.studentNo - b.studentNo);

    const subject = subjects.find(s => s.id === gb.subjectId);

    const studentResults = classStudents.map(student => {
      const record = gb.studentScores?.[student.id];
      const calc = calculateStudentGrade(record, gb.assignments, gb.config);
      return { student, calc };
    });

    const totalStudents = studentResults.length;
    const passedStudents = studentResults.filter(r => r.calc.isPassed).length;
    const passedPercentage = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;

    const sheetData: (string | number)[][] = [
      ['แบบรายงานสรุปคะแนนและผลการประเมินการเรียนรู้ (ปพ.5)'],
      [profile.schoolName || 'โรงเรียน'],
      [
        `กลุ่มสาระการเรียนรู้${profile.department || ''}`,
        '',
        `ปีการศึกษา ${academicYear}`,
        '',
        `ภาคเรียนที่ ${term === 'yearly' ? 'ประเมินทั้งปี' : term}`
      ],
      [
        `รหัสวิชา: ${subject?.code || gb.subjectCode}`,
        '',
        `ชื่อวิชา: ${subject?.name || gb.subjectName}`,
        '',
        `ระดับชั้น/ห้อง: ${subject?.gradeLevel || ''} (${gb.className})`
      ],
      [
        `ครูผู้สอน: ${profile.name} (${profile.position || 'ครู'})`,
        '',
        `สัดส่วนประเมิน: คะแนนเก็บ ${gb.config.workWeightRatio}% : สอบ ${gb.config.examWeightRatio}% (กลางภาค ${gb.config.midtermMaxScore} + ปลายภาค ${gb.config.finalMaxScore})`
      ],
      [],
      [
        'เลขที่',
        'รหัสประจำตัว',
        'คำนำหน้า',
        'ชื่อ',
        'นามสกุล',
        'ชื่อ - นามสกุล',
        `คะแนนเก็บ (${gb.config.workWeightRatio})`,
        `กลางภาค (${gb.config.midtermMaxScore})`,
        `ปลายภาค (${gb.config.finalMaxScore})`,
        `รวมสอบ (${gb.config.examWeightRatio})`,
        'รวมสุทธิ (100)',
        'เกรด',
        'ความหมาย',
        'ผลการตัดสิน'
      ]
    ];

    studentResults.forEach(({ student, calc }) => {
      sheetData.push([
        student.studentNo,
        student.studentIdCode || '',
        student.prefix || '',
        student.firstName,
        student.lastName,
        `${student.prefix || ''}${student.firstName} ${student.lastName}`.trim(),
        calc.scaledWorkScore,
        calc.midtermScore,
        calc.finalScore,
        calc.totalExamScore,
        calc.netScore,
        calc.grade,
        calc.gradeLabel,
        calc.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'
      ]);
    });

    sheetData.push([]);
    sheetData.push(['จำนวนนักเรียนทั้งหมด', totalStudents, 'ผ่านเกณฑ์', passedStudents, `คิดเป็นร้อยละ ${passedPercentage}%`]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 26 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }
    ];

    const safeSheetName = `${gb.className || 'Class'}`.replace(/[\/\\?*:[\]]/g, '-').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  const fileName = `รวมปพ5_ทุกห้องเรียน_ปีการศึกษา${academicYear}_ภาคเรียน${term}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
