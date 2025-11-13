import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="video-player-dialog">
      <div class="dialog-header">
        <h2>{{ data.title || 'Video Player' }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="video-player-container">
        <div class="video-wrapper" *ngIf="data.url">
          <iframe
            *ngIf="isYouTube"
            [src]="sanitizedUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
          
          <video
            *ngIf="!isYouTube"
            [src]="data.url"
            controls
            autoplay
            class="video-element">
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div class="no-video" *ngIf="!data.url">
          <mat-icon>videocam_off</mat-icon>
          <p>No video available</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-player-dialog {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .video-player-container {
      flex: 1;
      width: 100%;
      padding: 1rem;
      background: #000;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }

    .video-wrapper iframe,
    .video-wrapper .video-element {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .no-video {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      text-align: center;
      color: #fff;
    }

    .no-video mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-video p {
      font-size: 1.125rem;
      opacity: 0.7;
    }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  sanitizedUrl: SafeResourceUrl | null = null;
  isYouTube: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<VideoPlayerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string; title: string }
  ) {}

  ngOnInit() {
    if (this.data?.url) {
      this.isYouTube = this.checkIfYouTube(this.data.url);
      
      if (this.isYouTube) {
        const embedUrl = this.convertToEmbedUrl(this.data.url);
        this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  close() {
    this.dialogRef.close();
  }

  private checkIfYouTube(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  private convertToEmbedUrl(url: string): string {
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  }
}
