import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-player-container">
      <div class="video-wrapper" *ngIf="videoUrl">
        <iframe
          *ngIf="isYouTube"
          [src]="sanitizedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
        
        <video
          *ngIf="!isYouTube"
          [src]="videoUrl"
          controls
          class="video-element">
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div class="no-video" *ngIf="!videoUrl">
        <p>No video available</p>
      </div>
    </div>
  `,
  styles: [`
    .video-player-container {
      width: 100%;
      margin: 1rem 0;
    }

    .video-wrapper {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      overflow: hidden;
      background: #000;
      border-radius: 8px;
    }

    .video-wrapper iframe,
    .video-wrapper .video-element {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .no-video {
      text-align: center;
      padding: 2rem;
      background: #f5f5f5;
      border-radius: 8px;
      color: #666;
    }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input() videoUrl: string = '';
  
  sanitizedUrl: SafeResourceUrl | null = null;
  isYouTube: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.videoUrl) {
      this.isYouTube = this.checkIfYouTube(this.videoUrl);
      
      if (this.isYouTube) {
        const embedUrl = this.convertToEmbedUrl(this.videoUrl);
        this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
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
