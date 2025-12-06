import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  profilePicture?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  role: string;
  department?: any;
  course?: any;
  batch?: any;
  semester?: any;
  studentId?: string;
  teacherId?: string;
  employeeId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<ApiResponse<{ user: UserProfile }>> {
    return this.http.get<ApiResponse<{ user: UserProfile }>>(
      `${this.apiUrl}/profile`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update user profile
   * @param profileData - Profile data to update
   */
  updateProfile(profileData: ProfileUpdateData): Observable<ApiResponse<{ user: UserProfile }>> {
    const formData = new FormData();

    // Append text fields
    if (profileData.firstName !== undefined) {
      formData.append('firstName', profileData.firstName);
    }
    if (profileData.lastName !== undefined) {
      formData.append('lastName', profileData.lastName);
    }
    if (profileData.phone !== undefined) {
      formData.append('phone', profileData.phone);
    }
    if (profileData.address !== undefined) {
      formData.append('address', profileData.address);
    }

    // Append profile picture file if provided
    if (profileData.profilePicture) {
      formData.append('profilePicture', profileData.profilePicture);
    }

    // Note: Don't set Content-Type header when using FormData
    // The browser will automatically set it with the correct boundary
    const headers = this.authService.getAuthHeaders().delete('Content-Type');

    return this.http.put<ApiResponse<{ user: UserProfile }>>(
      `${this.apiUrl}/profile`,
      formData,
      { headers }
    );
  }

  /**
   * Delete profile picture
   */
  deleteProfilePicture(): Observable<ApiResponse<{ user: UserProfile }>> {
    return this.http.delete<ApiResponse<{ user: UserProfile }>>(
      `${this.apiUrl}/profile/picture`,
      { headers: this.getHeaders() }
    );
  }
}
