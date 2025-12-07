import { Component } from '@angular/core';
import { StudentLayout } from '../student-layout/student-layout';
import { FeedbackFormComponent } from '../../shared/feedback-form/feedback-form.component';

@Component({
  selector: 'app-student-feedback',
  standalone: true,
  imports: [StudentLayout, FeedbackFormComponent],
  template: `
    <app-student-layout>
      <app-feedback-form></app-feedback-form>
    </app-student-layout>
  `
})
export class StudentFeedbackComponent {}
