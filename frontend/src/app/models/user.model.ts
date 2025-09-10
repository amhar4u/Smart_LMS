export interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  profilePicture?: string;
  teacherId?: string;
  employeeId?: string;
  studentId?: string;
  department?: string | {
    _id: string;
    name: string;
    code: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export interface StudentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  studentId?: string;
  department: string;
  course: string;
  batch: string;
}

export interface TeacherRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  employeeId?: string;
  department: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
