import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-overlay" *ngIf="(loadingService.loading$ | async) || show">
      <div class="loading-content">
        <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
        <p class="loading-text" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-text {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() show = false;
  @Input() message = '';
  @Input() diameter = 40;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';

  constructor(public loadingService: LoadingService) {}
}
