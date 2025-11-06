export interface ExtraModule {
  _id: string;
  title: string;
  name: string;
  code: string;
  description: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  studentLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All';
  documents: ExtraModuleDocument[];
  video?: ExtraModuleVideo;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ExtraModuleDocument {
  _id: string;
  name: string;
  uniqueName: string;
  cloudinaryURL: string; // Cloudinary secure URL
  publicId: string; // Cloudinary public ID
  resourceType: 'image' | 'video' | 'raw';
  fileType: string;
  size?: number;
  uploadedAt: string;
}

export interface ExtraModuleVideo {
  name: string;
  uniqueName: string;
  cloudinaryURL: string; // Cloudinary secure URL
  publicId: string; // Cloudinary public ID
  resourceType: 'image' | 'video' | 'raw';
  fileType: string;
  duration?: number; // Duration in seconds
  uploadedAt: string;
}

export interface CreateExtraModuleRequest {
  title: string;
  name: string;
  code: string;
  description: string;
  subject: string;
  studentLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All';
  order?: number;
}

export interface UpdateExtraModuleRequest {
  title?: string;
  name?: string;
  code?: string;
  description?: string;
  subject?: string;
  studentLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All';
  order?: number;
  isActive?: boolean;
}

export type StudentLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All';

export const STUDENT_LEVELS: StudentLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All'];
