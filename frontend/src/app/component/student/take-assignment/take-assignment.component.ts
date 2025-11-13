import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';

import { StudentAssignment, StudentAssignmentService, Question } from '../../../services/student-assignment.service';

@Component({
  selector: 'app-take-assignment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './take-assignment.component.html',
  styleUrls: ['./take-assignment.component.css']
})
export class TakeAssignmentComponent implements OnInit, OnDestroy {
  assignmentId: string = '';
  assignment: StudentAssignment | null = null;
  assignmentForm!: FormGroup;
  
  // Expose Math to template
  Math = Math;
  
  // Timer properties
  timeRemaining: number = 0; // in seconds
  endTime: Date | null = null;
  timerSubscription?: Subscription;
  timerDisplay: string = '00:00:00';
  progressPercentage: number = 100;
  
  // State
  isLoading = false;
  isSubmitting = false;
  isStarting = false;
  hasStarted = false;
  hasSubmitted = false; // Track if already successfully submitted
  showWarning = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private studentAssignmentService: StudentAssignmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.assignmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.assignmentId) {
      this.loadAssignment();
    } else {
      this.snackBar.open('Invalid assignment ID', 'Close', { duration: 3000 });
      this.router.navigate(['/student/assignments']);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  loadAssignment() {
    this.isLoading = true;
    this.studentAssignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response) => {
        this.assignment = response.data;
        this.isLoading = false;
        
        // Check if can start
        if (this.assignment.hasSubmitted) {
          this.snackBar.open('You have already submitted this assignment', 'View Results', { duration: 5000 })
            .onAction().subscribe(() => {
              this.router.navigate(['/student/assignment-result', this.assignmentId]);
            });
        }
      },
      error: (error) => {
        console.error('Error loading assignment:', error);
        this.snackBar.open(error.error?.message || 'Error loading assignment', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/student/assignments']);
      }
    });
  }

  startAssignment() {
    if (!this.assignment) return;

    this.isStarting = true;
    this.studentAssignmentService.startAssignment(this.assignmentId).subscribe({
      next: (response) => {
        this.hasStarted = true;
        this.endTime = new Date(response.data.endTime);
        const startTime = new Date(response.data.startTime);
        const totalTime = this.assignment!.timeLimit * 60; // Convert minutes to seconds
        
        // Calculate remaining time based on server time
        const serverTime = new Date(response.data.serverTime);
        this.timeRemaining = Math.floor((this.endTime.getTime() - serverTime.getTime()) / 1000);
        
        // Initialize form
        this.initializeForm();
        
        // Start timer
        this.startTimer(totalTime);
        
        this.isStarting = false;
        this.snackBar.open('Assignment started! Good luck!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error starting assignment:', error);
        this.snackBar.open(error.error?.message || 'Error starting assignment', 'Close', { duration: 3000 });
        this.isStarting = false;
      }
    });
  }

  initializeForm() {
    if (!this.assignment || !this.assignment.questions) return;

    const answersArray = this.assignment.questions.map(question => {
      if (question.type === 'MCQ') {
        return this.fb.group({
          questionId: [question._id],
          questionText: [question.question],
          type: [question.type],
          selectedOption: ['', Validators.required],
          answer: ['']
        });
      } else {
        return this.fb.group({
          questionId: [question._id],
          questionText: [question.question],
          type: [question.type],
          selectedOption: [''],
          answer: ['', Validators.required]
        });
      }
    });

    this.assignmentForm = this.fb.group({
      answers: this.fb.array(answersArray)
    });
    
    console.log('=== FORM INITIALIZED ===');
    console.log('Number of questions:', this.assignment.questions.length);
    console.log('Form structure:', this.assignmentForm.value);
  }

  get answersArray(): FormArray {
    return this.assignmentForm?.get('answers') as FormArray;
  }

  startTimer(totalTime: number) {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining--;
      
      // Update timer display
      this.updateTimerDisplay();
      
      // Update progress bar
      this.progressPercentage = (this.timeRemaining / totalTime) * 100;
      
      // Show warnings
      if (this.timeRemaining === 300) { // 5 minutes
        this.showWarning = true;
        this.snackBar.open('⚠️ 5 minutes remaining!', 'Close', { duration: 5000 });
      } else if (this.timeRemaining === 60) { // 1 minute
        this.showWarning = true;
        this.snackBar.open('⚠️ 1 minute remaining!', 'Close', { duration: 5000 });
      }
      
      // Auto submit when time expires
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.snackBar.open('⏰ Time expired! Submitting automatically...', 'Close', { duration: 3000 });
        this.submitAssignment(true);
      }
    });
  }

  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  updateTimerDisplay() {
    const hours = Math.floor(this.timeRemaining / 3600);
    const minutes = Math.floor((this.timeRemaining % 3600) / 60);
    const seconds = this.timeRemaining % 60;
    
    this.timerDisplay = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  submitAssignment(autoSubmit: boolean = false) {
    if (!this.assignment || !this.assignmentForm) return;

    // Prevent double submission
    if (this.isSubmitting) {
      console.log('⚠️ Submission already in progress, ignoring duplicate request');
      return;
    }

    // Prevent submission if already submitted
    if (this.hasSubmitted) {
      console.log('⚠️ Assignment already submitted, ignoring request');
      this.snackBar.open('This assignment has already been submitted.', 'Close', { duration: 3000 });
      return;
    }

    // Disable form
    this.assignmentForm.disable();
    this.isSubmitting = true;
    
    // Stop timer
    this.stopTimer();

    const answers = this.assignmentForm.value.answers;
    
    console.log('=== FRONTEND SUBMISSION DEBUG ===');
    console.log('Assignment Form Value:', this.assignmentForm.value);
    console.log('Answers to submit:', answers);
    console.log('Number of answers:', answers ? answers.length : 0);
    console.log('First answer sample:', answers && answers.length > 0 ? answers[0] : 'No answers');
    console.log('Answers detailed:', JSON.stringify(answers, null, 2));

    if (!answers || answers.length === 0) {
      this.snackBar.open('No answers to submit. Please answer at least one question.', 'Close', { 
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.isSubmitting = false;
      this.assignmentForm.enable();
      return;
    }

    // Check if there are any actual answers (not just empty form controls)
    const hasActualAnswers = answers.some((a: any) => 
      (a.answer && a.answer.trim() !== '') || 
      (a.selectedOption !== undefined && a.selectedOption !== null && a.selectedOption !== '')
    );

    if (!hasActualAnswers) {
      this.snackBar.open('Please provide answers to at least one question before submitting.', 'Close', { 
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.isSubmitting = false;
      this.assignmentForm.enable();
      return;
    }

    console.log('✅ Validation passed. Submitting to backend...');

    this.studentAssignmentService.submitAssignment(this.assignmentId, answers).subscribe({
      next: (response) => {
        this.hasSubmitted = true; // Mark as submitted
        this.snackBar.open('✅ Assignment submitted successfully! Evaluation in progress...', 'Close', { 
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        
        // Navigate to assignments page after short delay
        setTimeout(() => {
          this.router.navigate(['/student/assignments']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error submitting assignment:', error);
        
        // Check if already submitted
        if (error.error?.message === 'You have already submitted this assignment') {
          this.hasSubmitted = true; // Mark as submitted
          this.snackBar.open('This assignment has already been submitted. Redirecting...', 'Close', { 
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          // Navigate back to assignments page
          setTimeout(() => {
            this.router.navigate(['/student/assignments']);
          }, 1500);
        } else {
          this.snackBar.open(error.error?.message || 'Error submitting assignment. Please try again.', 'Close', { 
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.isSubmitting = false;
          this.assignmentForm.enable();
          
          // Restart timer if not auto-submit
          if (!autoSubmit && this.timeRemaining > 0) {
            this.startTimer(this.assignment!.timeLimit * 60);
          }
        }
      }
    });
  }

  confirmSubmit() {
    if (!this.assignmentForm.valid) {
      this.snackBar.open('Please answer all required questions', 'Close', { duration: 3000 });
      return;
    }

    const confirmed = confirm('Are you sure you want to submit? You cannot change your answers after submission.');
    if (confirmed) {
      this.submitAssignment();
    }
  }

  getTimerClass(): string {
    if (this.timeRemaining <= 60) return 'critical';
    if (this.timeRemaining <= 300) return 'warning';
    return 'normal';
  }

  getProgressBarColor(): string {
    if (this.progressPercentage <= 10) return 'warn';
    if (this.progressPercentage <= 25) return 'accent';
    return 'primary';
  }

  goBack() {
    if (this.hasStarted) {
      const confirmed = confirm('Are you sure you want to leave? Your progress will be lost and the timer will keep running.');
      if (confirmed) {
        this.router.navigate(['/student/assignments']);
      }
    } else {
      this.router.navigate(['/student/assignments']);
    }
  }
}
