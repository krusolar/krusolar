import { Assignment, GradebookConfig, StudentScoreRecord } from '../types';

/**
 * Determine if a grade level string corresponds to Primary (ประถมศึกษา) or Secondary (มัธยมศึกษา)
 */
export function getLevelTypeFromGradeLevel(gradeLevel: string): 'primary' | 'secondary' {
  if (!gradeLevel) return 'secondary';
  const clean = gradeLevel.trim();
  if (clean.includes('ป.') || clean.includes('ประถม') || /^ป/i.test(clean)) {
    return 'primary';
  }
  return 'secondary';
}

/**
 * Get default config for a given level type
 */
export function getDefaultGradebookConfig(levelType: 'primary' | 'secondary', term: '1' | '2' | 'yearly' = '1'): GradebookConfig {
  if (levelType === 'primary') {
    return {
      levelType: 'primary',
      term: 'yearly',
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    };
  } else {
    return {
      levelType: 'secondary',
      term: term === 'yearly' ? '1' : term,
      workWeightRatio: 70,
      examWeightRatio: 30,
      midtermMaxScore: 15,
      finalMaxScore: 15
    };
  }
}

export interface StudentCalculatedGrade {
  studentId: string;
  totalRawWorkScore: number;
  totalMaxRawWorkScore: number;
  scaledWorkScore: number; // คะแนนเก็บถ่วงน้ำหนัก (มัธยม 70, ประถม 70)
  midtermScore: number;
  finalScore: number;
  totalExamScore: number;
  netScore: number; // คะแนนสุทธิเต็ม 100
  grade: number; // 0, 1, 1.5, 2, 2.5, 3, 3.5, 4
  gradeLabel: string; // เช่น ดีเยี่ยม, ดีมาก
  isPassed: boolean;
}

/**
 * Calculate complete student grade metrics
 */
export function calculateStudentGrade(
  studentScoreRecord: StudentScoreRecord | undefined,
  assignments: Assignment[],
  config: GradebookConfig
): StudentCalculatedGrade {
  const scores = studentScoreRecord?.assignmentScores || {};
  
  let totalRawWorkScore = 0;
  let totalMaxRawWorkScore = 0;

  assignments.forEach((assignment) => {
    totalMaxRawWorkScore += (assignment.maxScore || 0);
    const score = scores[assignment.id];
    if (typeof score === 'number' && !isNaN(score)) {
      totalRawWorkScore += Math.max(0, score);
    }
  });

  // Calculate scaled work score (70% for secondary and primary)
  let scaledWorkScore = 0;
  if (totalMaxRawWorkScore > 0) {
    scaledWorkScore = (totalRawWorkScore / totalMaxRawWorkScore) * config.workWeightRatio;
  }
  scaledWorkScore = Math.min(config.workWeightRatio, Math.round(scaledWorkScore * 100) / 100);

  const midtermScore = Math.max(0, Math.min(config.midtermMaxScore, studentScoreRecord?.midtermScore ?? 0));
  const finalScore = Math.max(0, Math.min(config.finalMaxScore, studentScoreRecord?.finalScore ?? 0));
  
  const totalExamScore = midtermScore + finalScore;

  // Net total score out of 100
  const rawNet = scaledWorkScore + totalExamScore;
  const netScore = Math.min(100, Math.round(rawNet * 10) / 10);

  // Grade Cutoff Logic
  let grade = 0;
  let gradeLabel = 'ไม่ผ่านเกณฑ์';

  if (netScore >= 80) {
    grade = 4;
    gradeLabel = 'ดีเยี่ยม';
  } else if (netScore >= 75) {
    grade = 3.5;
    gradeLabel = 'ดีมาก';
  } else if (netScore >= 70) {
    grade = 3;
    gradeLabel = 'ดี';
  } else if (netScore >= 65) {
    grade = 2.5;
    gradeLabel = 'ค่อนข้างดี';
  } else if (netScore >= 60) {
    grade = 2;
    gradeLabel = 'น่าพอใจ';
  } else if (netScore >= 55) {
    grade = 1.5;
    gradeLabel = 'พอใช้';
  } else if (netScore >= 50) {
    grade = 1;
    gradeLabel = 'ผ่านเกณฑ์ขั้นต่ำ';
  } else {
    grade = 0;
    gradeLabel = 'ปรับปรุง';
  }

  const isPassed = grade >= 1;

  return {
    studentId: studentScoreRecord?.studentId || '',
    totalRawWorkScore,
    totalMaxRawWorkScore,
    scaledWorkScore,
    midtermScore,
    finalScore,
    totalExamScore,
    netScore,
    grade,
    gradeLabel,
    isPassed
  };
}

/**
 * Color badge styling helper for grade
 */
export function getGradeBadgeStyle(grade: number): { bg: string; text: string; border: string } {
  if (grade === 4) {
    return { bg: 'bg-emerald-100/90', text: 'text-emerald-800', border: 'border-emerald-300' };
  } else if (grade >= 3) {
    return { bg: 'bg-indigo-100/90', text: 'text-indigo-800', border: 'border-indigo-300' };
  } else if (grade >= 2) {
    return { bg: 'bg-sky-100/90', text: 'text-sky-800', border: 'border-sky-300' };
  } else if (grade >= 1) {
    return { bg: 'bg-amber-100/90', text: 'text-amber-800', border: 'border-amber-300' };
  } else {
    return { bg: 'bg-rose-100/90', text: 'text-rose-800', border: 'border-rose-300' };
  }
}
