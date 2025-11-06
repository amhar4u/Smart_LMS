import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  ExtraModule, 
  CreateExtraModuleRequest, 
  UpdateExtraModuleRequest,
  StudentLevel 
} from '../models/extra-module.model';

@Injectable({
  providedIn: 'root'
})
export class ExtraModuleService {
  private apiUrl = `${environment.apiUrl}/extra-modules`;

  constructor(private http: HttpClient) { }

  /**
   * Get all extra modules with optional filters
   */
  getExtraModules(filters?: { 
    subject?: string; 
    studentLevel?: StudentLevel;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.subject) {
      params = params.set('subject', filters.subject);
    }
    if (filters?.studentLevel) {
      params = params.set('studentLevel', filters.studentLevel);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Get extra modules by subject
   */
  getExtraModulesBySubject(subjectId: string, studentLevel?: StudentLevel): Observable<any> {
    let params = new HttpParams();
    if (studentLevel) {
      params = params.set('studentLevel', studentLevel);
    }
    return this.http.get<any>(`${this.apiUrl}/subject/${subjectId}`, { params });
  }

  /**
   * Get extra modules by student level
   */
  getExtraModulesByLevel(studentLevel: StudentLevel): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/level/${studentLevel}`);
  }

  /**
   * Get single extra module by ID
   */
  getExtraModuleById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new extra module with files
   */
  createExtraModuleWithFiles(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  /**
   * Update extra module with files
   */
  updateExtraModuleWithFiles(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Delete extra module
   */
  deleteExtraModule(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Add document to existing extra module
   */
  addDocument(extraModuleId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post<any>(`${this.apiUrl}/${extraModuleId}/documents`, formData);
  }

  /**
   * Delete document from extra module
   */
  deleteDocument(extraModuleId: string, documentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${extraModuleId}/documents/${documentId}`);
  }

  /**
   * Update extra module video
   */
  updateVideo(extraModuleId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);
    return this.http.put<any>(`${this.apiUrl}/${extraModuleId}/video`, formData);
  }

  /**
   * Delete video from extra module
   */
  deleteVideo(extraModuleId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${extraModuleId}/video`);
  }

  /**
   * Toggle extra module status (active/inactive)
   */
  toggleStatus(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  /**
   * View document in new tab
   */
  viewDocument(cloudinaryURL: string): void {
    window.open(cloudinaryURL, '_blank');
  }

  /**
   * Download document
   */
  downloadDocument(cloudinaryURL: string, filename: string): void {
    const link = document.createElement('a');
    link.href = cloudinaryURL;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Play video in new tab
   */
  playVideo(cloudinaryURL: string): void {
    window.open(cloudinaryURL, '_blank');
  }

  /**
   * Format file size from bytes to readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format video duration from seconds to readable format (HH:MM:SS)
   */
  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get student level badge color
   */
  getStudentLevelColor(level: StudentLevel): string {
    const colors: { [key in StudentLevel]: string } = {
      'Beginner': 'primary',
      'Intermediate': 'accent',
      'Advanced': 'warn',
      'All': 'default'
    };
    return colors[level] || 'default';
  }

  /**
   * Get student level icon
   */
  getStudentLevelIcon(level: StudentLevel): string {
    const icons: { [key in StudentLevel]: string } = {
      'Beginner': 'school',
      'Intermediate': 'trending_up',
      'Advanced': 'military_tech',
      'All': 'groups'
    };
    return icons[level] || 'help';
  }
}
