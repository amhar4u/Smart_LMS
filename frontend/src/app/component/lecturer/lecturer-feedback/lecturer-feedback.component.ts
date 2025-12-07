import { Component } from '@angular/core';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { FeedbackFormComponent } from '../../shared/feedback-form/feedback-form.component';

@Component({
  selector: 'app-lecturer-feedback',
  standalone: true,
  imports: [LecturerLayout, FeedbackFormComponent],
  template: `
    <app-lecturer-layout>
      <app-feedback-form></app-feedback-form>
    </app-lecturer-layout>
  `
})
export class LecturerFeedbackComponent {}
