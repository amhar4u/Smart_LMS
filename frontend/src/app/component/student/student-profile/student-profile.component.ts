import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentLayout } from '../student-layout/student-layout';
import { ProfileService, UserProfile } from '../../../services/profile.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StudentLayout
  ],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  saving = false;
  currentUser: UserProfile | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      address: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data.user) {
          this.currentUser = response.data.user;
          this.profileForm.patchValue({
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            phone: this.currentUser.phone || '',
            address: this.currentUser.address || ''
          });
          if (this.currentUser.profilePicture) {
            this.imagePreview = this.currentUser.profilePicture;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select an image file', 'Close', { duration: 3000 });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('Image size should not exceed 5MB', 'Close', { duration: 3000 });
        return;
      }
      
      this.selectedFile = file;
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelSelection(): void {
    this.selectedFile = null;
    this.imagePreview = this.currentUser?.profilePicture || null;
  }

  deleteProfilePicture(): void {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    this.saving = true;
    this.profileService.deleteProfilePicture().subscribe({
      next: (response) => {
        if (response.success) {
          this.currentUser = response.data.user;
          this.imagePreview = null;
          
          this.authService.updateCurrentUser(response.data.user as any);
          
          this.snackBar.open('Profile picture deleted successfully', 'Close', { duration: 3000 });
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error deleting profile picture:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to delete profile picture',
          'Close',
          { duration: 3000 }
        );
        this.saving = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    const formData = this.profileForm.value;
    
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      address: formData.address
    };

    if (this.selectedFile) {
      updateData.profilePicture = this.selectedFile;
    }

    this.profileService.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentUser = response.data.user;
          this.selectedFile = null;
          
          // Update user in auth service
          this.authService.updateCurrentUser(response.data.user as any);
          
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to update profile',
          'Close',
          { duration: 3000 }
        );
        this.saving = false;
      }
    });
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
  }

  getDepartmentName(): string {
    if (!this.currentUser?.department) return 'N/A';
    return typeof this.currentUser.department === 'object' 
      ? this.currentUser.department.name 
      : this.currentUser.department;
  }

  getCourseName(): string {
    if (!this.currentUser?.course) return 'N/A';
    return typeof this.currentUser.course === 'object' 
      ? this.currentUser.course.name 
      : this.currentUser.course;
  }

  getBatchName(): string {
    if (!this.currentUser?.batch) return 'N/A';
    return typeof this.currentUser.batch === 'object' 
      ? this.currentUser.batch.name 
      : this.currentUser.batch;
  }

  getSemesterName(): string {
    if (!this.currentUser?.semester) return 'N/A';
    const sem = this.currentUser.semester;
    return typeof sem === 'object' 
      ? `${sem.name} - Year ${sem.year}` 
      : sem;
  }
}
