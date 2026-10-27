import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TeachingLog, Subject, TeacherProfile, StudentBehaviorNote, Student, Gradebook, AttendanceSession } from '../types';
import { initialTeachingLogs, initialSubjects, initialTeacherProfile, initialBehaviorNotes, initialStudents } from '../data/initialData';
import { initialGradebooks } from '../data/initialGradebooks';
import { initialAttendanceSessions } from '../data/initialAttendance';

// Firestore collection names
const LOGS_COLLECTION = 'teaching_logs';
const SUBJECTS_COLLECTION = 'subjects';
const BEHAVIOR_NOTES_COLLECTION = 'behavior_notes';
const STUDENTS_COLLECTION = 'students';
const GRADEBOOKS_COLLECTION = 'gradebooks';
const ATTENDANCE_SESSIONS_COLLECTION = 'attendance_sessions';
const SETTINGS_DOC = 'settings/teacher_profile';

/**
 * Sanitize document ID to prevent invalid path segments in Firestore (e.g. slashes in class names)
 */
const sanitizeDocId = (id: string): string => {
  return id ? id.replace(/[\/\\#?]/g, '-') : id;
};

/**
 * Subscribe to teaching logs real-time changes
 */
export const subscribeLogs = (onData: (logs: TeachingLog[]) => void) => {
  const q = query(collection(db, LOGS_COLLECTION), orderBy('date', 'desc'));

  return onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore logs empty, seeding logs...');
      const local = localStorage.getItem('edulog_logs');
      const logsToSeed: TeachingLog[] = local ? JSON.parse(local) : initialTeachingLogs;
      for (const log of logsToSeed) {
        await setDoc(doc(db, LOGS_COLLECTION, log.id), log);
      }
      onData(logsToSeed);
    } else {
      const logs = snapshot.docs.map(doc => doc.data() as TeachingLog);
      onData(logs);
    }
  }, (error) => {
    console.error('Error listening to logs in Firestore:', error);
  });
};

/**
 * Save or update a teaching log in Firestore
 */
export const saveLogToFirestore = async (log: TeachingLog) => {
  try {
    const safeId = sanitizeDocId(log.id);
    const docRef = doc(db, LOGS_COLLECTION, safeId);
    await setDoc(docRef, { ...log, id: safeId }, { merge: true });
  } catch (error) {
    console.error('Failed to save log to Firestore:', error);
    throw error;
  }
};

/**
 * Delete a teaching log from Firestore
 */
export const deleteLogFromFirestore = async (logId: string) => {
  try {
    const docRef = doc(db, LOGS_COLLECTION, sanitizeDocId(logId));
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete log from Firestore:', error);
    throw error;
  }
};

/**
 * Subscribe to subjects real-time changes
 */
export const subscribeSubjects = (onData: (subjects: Subject[]) => void) => {
  const colRef = collection(db, SUBJECTS_COLLECTION);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore subjects empty, seeding subjects...');
      const local = localStorage.getItem('edulog_subjects');
      const subjectsToSeed: Subject[] = local ? JSON.parse(local) : initialSubjects;
      for (const subject of subjectsToSeed) {
        await setDoc(doc(db, SUBJECTS_COLLECTION, subject.id), subject);
      }
      onData(subjectsToSeed);
    } else {
      const subjects = snapshot.docs.map(doc => doc.data() as Subject);
      onData(subjects);
    }
  }, (error) => {
    console.error('Error listening to subjects in Firestore:', error);
  });
};

/**
 * Save or update subject in Firestore
 */
export const saveSubjectToFirestore = async (subject: Subject) => {
  try {
    const safeId = sanitizeDocId(subject.id);
    const docRef = doc(db, SUBJECTS_COLLECTION, safeId);
    await setDoc(docRef, { ...subject, id: safeId }, { merge: true });
  } catch (error) {
    console.error('Failed to save subject to Firestore:', error);
    throw error;
  }
};

/**
 * Delete subject from Firestore
 */
export const deleteSubjectFromFirestore = async (subjectId: string) => {
  try {
    const docRef = doc(db, SUBJECTS_COLLECTION, sanitizeDocId(subjectId));
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete subject from Firestore:', error);
    throw error;
  }
};

/**
 * Save all subjects
 */
export const saveAllSubjectsToFirestore = async (subjects: Subject[]) => {
  try {
    for (const sub of subjects) {
      const safeId = sanitizeDocId(sub.id);
      await setDoc(doc(db, SUBJECTS_COLLECTION, safeId), { ...sub, id: safeId }, { merge: true });
    }
  } catch (error) {
    console.error('Failed to save all subjects to Firestore:', error);
  }
};

/**
 * Subscribe to Teacher Profile
 */
export const subscribeProfile = (onData: (profile: TeacherProfile) => void) => {
  const docRef = doc(db, SETTINGS_DOC);

  return onSnapshot(docRef, async (docSnap) => {
    if (!docSnap.exists()) {
      console.log('Firestore profile empty, seeding profile...');
      const local = localStorage.getItem('edulog_teacher_profile');
      const profileToSeed: TeacherProfile = local ? JSON.parse(local) : initialTeacherProfile;
      await setDoc(docRef, profileToSeed);
      onData(profileToSeed);
    } else {
      onData(docSnap.data() as TeacherProfile);
    }
  }, (error) => {
    console.error('Error listening to teacher profile in Firestore:', error);
  });
};

/**
 * Save teacher profile
 */
export const saveProfileToFirestore = async (profile: TeacherProfile) => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, profile, { merge: true });
  } catch (error) {
    console.error('Failed to save teacher profile to Firestore:', error);
    throw error;
  }
};

/**
 * Subscribe to Behavior Notes
 */
export const subscribeBehaviorNotes = (onData: (notes: StudentBehaviorNote[]) => void) => {
  const colRef = collection(db, BEHAVIOR_NOTES_COLLECTION);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore behavior notes empty, seeding notes...');
      const local = localStorage.getItem('edulog_behavior_notes');
      const notesToSeed: StudentBehaviorNote[] = local ? JSON.parse(local) : initialBehaviorNotes;
      for (const note of notesToSeed) {
        await setDoc(doc(db, BEHAVIOR_NOTES_COLLECTION, note.id), note);
      }
      onData(notesToSeed);
    } else {
      const notes = snapshot.docs.map(doc => doc.data() as StudentBehaviorNote);
      onData(notes);
    }
  }, (error) => {
    console.error('Error listening to behavior notes in Firestore:', error);
  });
};

/**
 * Save behavior note
 */
export const saveBehaviorNoteToFirestore = async (note: StudentBehaviorNote) => {
  try {
    const docRef = doc(db, BEHAVIOR_NOTES_COLLECTION, note.id);
    await setDoc(docRef, note, { merge: true });
  } catch (error) {
    console.error('Failed to save behavior note to Firestore:', error);
    throw error;
  }
};

/**
 * Delete behavior note
 */
export const deleteBehaviorNoteFromFirestore = async (id: string) => {
  try {
    const docRef = doc(db, BEHAVIOR_NOTES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete behavior note from Firestore:', error);
    throw error;
  }
};

/**
 * Subscribe to Student Roster
 */
export const subscribeStudents = (onData: (students: Student[]) => void) => {
  const colRef = collection(db, STUDENTS_COLLECTION);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore students empty, seeding initial students...');
      const local = localStorage.getItem('edulog_students');
      const studentsToSeed: Student[] = local ? JSON.parse(local) : initialStudents;
      for (const std of studentsToSeed) {
        await setDoc(doc(db, STUDENTS_COLLECTION, std.id), std);
      }
      onData(studentsToSeed);
    } else {
      const students = snapshot.docs.map(doc => doc.data() as Student);
      onData(students);
    }
  }, (error) => {
    console.error('Error listening to students in Firestore:', error);
  });
};

/**
 * Save single student to Firestore
 */
export const saveStudentToFirestore = async (student: Student) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, student.id);
    await setDoc(docRef, student, { merge: true });
  } catch (error) {
    console.error('Failed to save student to Firestore:', error);
    throw error;
  }
};

/**
 * Save batch students to Firestore
 */
export const saveBatchStudentsToFirestore = async (students: Student[]) => {
  try {
    for (const std of students) {
      const docRef = doc(db, STUDENTS_COLLECTION, std.id);
      await setDoc(docRef, std, { merge: true });
    }
  } catch (error) {
    console.error('Failed to save batch students to Firestore:', error);
    throw error;
  }
};

/**
 * Delete single student from Firestore
 */
export const deleteStudentFromFirestore = async (studentId: string) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete student from Firestore:', error);
    throw error;
  }
};

/**
 * Clear all students in a classroom from Firestore
 */
export const clearStudentsInClassFromFirestore = async (studentsInClass: Student[]) => {
  try {
    for (const std of studentsInClass) {
      const docRef = doc(db, STUDENTS_COLLECTION, std.id);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error('Failed to clear class students from Firestore:', error);
    throw error;
  }
};

/**
 * Helper to ensure secondary gradebooks use the updated 70:30 ratio (70 work, 15 midterm, 15 final)
 */
const normalizeGradebookConfig = (gb: Gradebook): Gradebook => {
  if (!gb) return gb;
  if (gb.config && gb.config.levelType === 'secondary' && (gb.config.workWeightRatio === 60 || gb.config.examWeightRatio === 40)) {
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
};

/**
 * Subscribe to Gradebooks real-time changes
 */
export const subscribeGradebooks = (onData: (gradebooks: Gradebook[]) => void) => {
  const colRef = collection(db, GRADEBOOKS_COLLECTION);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore gradebooks empty, seeding initial gradebooks...');
      const local = localStorage.getItem('edulog_gradebooks');
      const gbToSeed: Gradebook[] = (local ? JSON.parse(local) : initialGradebooks).map(normalizeGradebookConfig);
      for (const gb of gbToSeed) {
        const safeId = sanitizeDocId(gb.id);
        const cleanGb = { ...gb, id: safeId };
        await setDoc(doc(db, GRADEBOOKS_COLLECTION, safeId), cleanGb);
      }
      onData(gbToSeed);
    } else {
      const gradebooks = snapshot.docs.map(doc => normalizeGradebookConfig(doc.data() as Gradebook));
      onData(gradebooks);
    }
  }, (error) => {
    console.error('Error listening to gradebooks in Firestore:', error);
  });
};

/**
 * Save or update gradebook in Firestore
 */
export const saveGradebookToFirestore = async (gradebook: Gradebook) => {
  try {
    const safeId = sanitizeDocId(gradebook.id);
    const cleanGb = { ...gradebook, id: safeId };
    const docRef = doc(db, GRADEBOOKS_COLLECTION, safeId);
    await setDoc(docRef, cleanGb, { merge: true });
  } catch (error) {
    console.error('Failed to save gradebook to Firestore:', error);
    throw error;
  }
};

/**
 * Delete gradebook from Firestore
 */
export const deleteGradebookFromFirestore = async (gradebookId: string) => {
  try {
    const safeId = sanitizeDocId(gradebookId);
    const docRef = doc(db, GRADEBOOKS_COLLECTION, safeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete gradebook from Firestore:', error);
    throw error;
  }
};

/**
 * Subscribe to Attendance Sessions real-time changes
 */
export const subscribeAttendanceSessions = (onData: (sessions: AttendanceSession[]) => void) => {
  const colRef = collection(db, ATTENDANCE_SESSIONS_COLLECTION);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Firestore attendance sessions empty, seeding initial sessions...');
      const local = localStorage.getItem('edulog_attendance_sessions');
      const sessionsToSeed: AttendanceSession[] = local ? JSON.parse(local) : initialAttendanceSessions;
      for (const sess of sessionsToSeed) {
        const safeId = sanitizeDocId(sess.id);
        await setDoc(doc(db, ATTENDANCE_SESSIONS_COLLECTION, safeId), { ...sess, id: safeId });
      }
      onData(sessionsToSeed);
    } else {
      const sessions = snapshot.docs.map(doc => doc.data() as AttendanceSession);
      onData(sessions);
    }
  }, (error) => {
    console.error('Error listening to attendance sessions in Firestore:', error);
  });
};

/**
 * Save or update Attendance Session in Firestore
 */
export const saveAttendanceSessionToFirestore = async (session: AttendanceSession) => {
  try {
    const safeId = sanitizeDocId(session.id);
    const docRef = doc(db, ATTENDANCE_SESSIONS_COLLECTION, safeId);
    await setDoc(docRef, { ...session, id: safeId }, { merge: true });
  } catch (error) {
    console.error('Failed to save attendance session to Firestore:', error);
    throw error;
  }
};

/**
 * Delete Attendance Session from Firestore
 */
export const deleteAttendanceSessionFromFirestore = async (sessionId: string) => {
  try {
    const safeId = sanitizeDocId(sessionId);
    const docRef = doc(db, ATTENDANCE_SESSIONS_COLLECTION, safeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete attendance session from Firestore:', error);
    throw error;
  }
};


