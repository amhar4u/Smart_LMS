import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Module, CreateModuleRequest, UpdateModuleRequest } from '../models/module.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

interface ModulesResponse {
  modules: Module[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private readonly API_URL = 'http://localhost:5000/api/modules';

  constructor(private http: HttpClient) {}

  // Get all modules with optional filtering
  getModules(params?: {
    subject?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<ApiResponse<ModulesResponse>> {
    let httpParams = new HttpParams();
    
    if (params?.subject) httpParams = httpParams.set('subject', params.subject);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ApiResponse<ModulesResponse>>(this.API_URL, { params: httpParams });
  }

  // Get single module
  getModule(id: string): Observable<ApiResponse<Module>> {
    return this.http.get<ApiResponse<Module>>(`${this.API_URL}/${id}`);
  }

  // Create new module
  createModule(moduleData: CreateModuleRequest): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(this.API_URL, moduleData);
  }

  // Create new module with files
  createModuleWithFiles(formData: FormData): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(this.API_URL, formData);
  }

  // Update module
  updateModule(id: string, moduleData: UpdateModuleRequest): Observable<ApiResponse<Module>> {
    return this.http.put<ApiResponse<Module>>(`${this.API_URL}/${id}`, moduleData);
  }

  // Update module with files
  updateModuleWithFiles(id: string, formData: FormData): Observable<ApiResponse<Module>> {
    return this.http.put<ApiResponse<Module>>(`${this.API_URL}/${id}`, formData);
  }

  // Upload documents
  uploadDocuments(moduleId: string, files: File[]): Observable<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${moduleId}/documents`, formData);
  }

  // Upload video
  uploadVideo(moduleId: string, file: File, duration?: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('video', file);
    if (duration) {
      formData.append('duration', duration);
    }
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${moduleId}/video`, formData);
  }

  // Delete document
  deleteDocument(moduleId: string, documentId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${moduleId}/documents/${documentId}`);
  }

  // Delete video
  deleteVideo(moduleId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${moduleId}/video`);
  }

  // Delete module
  deleteModule(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  // Helper method to get file icon based on file type
  getFileIcon(fileType: string): string {
    const iconMap: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'ppt': 'slideshow',
      'pptx': 'slideshow',
      'txt': 'description',
      'mp4': 'videocam',
      'avi': 'videocam',
      'mov': 'videocam',
      'mkv': 'videocam'
    };
    
    return iconMap[fileType.toLowerCase()] || 'insert_drive_file';
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
