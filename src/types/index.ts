// ==================== AUTH ====================
export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPERADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  studentId?: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  features?: Record<string, boolean> | null;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// ==================== STUDENT ====================
export interface StudentProfile {
  id: string;
  userId: string;
  phone?: string;
  parentPhone?: string;
  xp: number;
  level: number;
  user: User;
}

// ==================== TEACHER ====================
export interface TeacherProfile {
  id: string;
  userId: string;
  subject?: string;
  phone?: string;
  bio?: string;
  user: User;
}

// ==================== GROUP ====================
export interface Group {
  id: string;
  name: string;
  subject: string;
  schedule?: string;
  startDate: string;
  endDate?: string;
  monthlyFee: number;
  isActive: boolean;
  teacher: TeacherProfile;
  _count?: { enrollments: number };
}

// ==================== PAYMENT ====================
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface Payment {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  paidAt?: string;
  note?: string;
  group?: Group;
}

// ==================== HOMEWORK ====================
export type HomeworkStatus = 'PENDING' | 'CHECKED';

export interface Homework {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
  group?: Group;
  mySubmission?: HomeworkSubmission;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  score?: number;
  xpEarned: number;
  status: HomeworkStatus;
  feedback?: string;
  checkedAt?: string;
}

// ==================== ATTENDANCE ====================
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface Lesson {
  id: string;
  groupId: string;
  title: string;
  date: string;
}

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  xpEarned: number;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ==================== RATING ====================
export interface RatingEntry {
  rank: number;
  studentId: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  avatar?: string;
  xp: number;
  level: number;
}

// ==================== PAGINATION ====================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== TEACHER OF MONTH ====================
export interface TeacherScoreBreakdown {
  ratingScore: number;       // 0–35
  consistencyScore: number;  // 0–10
  activityScore: number;     // 0–30
  voteScore: number;         // 0–25
}

export interface TeacherRanking {
  rank: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  subject?: string;
  totalStudents: number;
  voteCount: number;
  votePercentage: number;
  activityScore: number;
  totalScore: number;
  // Extended scoring fields (populated by new backend formula)
  avgLessonRating?: number;        // Raw 1–5 average from students
  ratedLessonsCount?: number;      // How many lessons received ratings
  totalLessonsCount?: number;      // Total lessons taught this month
  ratingTrend?: 'up' | 'flat' | 'down'; // Rating trajectory over the month
  ratingConsistency?: number;      // 0–100 (100 = zero variance)
  isEligible?: boolean;            // Meets MIN_RATED_LESSONS threshold
  scoreBreakdown?: TeacherScoreBreakdown;
}

export interface MyVoteStatus {
  hasVoted: boolean;
  votedTeacherId?: string;
  month: number;
  year: number;
}
