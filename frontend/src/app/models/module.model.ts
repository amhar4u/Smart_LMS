export interface Module {
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
  documents: ModuleDocument[];
  video?: ModuleVideo;
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

export interface ModuleDocument {
  _id: string;
  name: string;
  uniqueName: string;
  localPath: string;
  fileType: string;
  size?: number;
  uploadedAt: string;
}

export interface ModuleVideo {
  name: string;
  uniqueName: string;
  localPath: string;
  fileType: string;
  duration?: string;
  uploadedAt: string;
}

export interface CreateModuleRequest {
  name: string;
  code: string;
  description: string;
  subject: string;
  order?: number;
}

export interface UpdateModuleRequest {
  name?: string;
  code?: string;
  description?: string;
  subject?: string;
  order?: number;
  isActive?: boolean;
}
