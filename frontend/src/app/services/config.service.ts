import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EmotionTrackingConfig {
  interval: number;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = environment.apiUrl;
  private emotionConfigSubject = new BehaviorSubject<EmotionTrackingConfig>({
    interval: 300000, // Default 5 minutes
    enabled: true
  });

  public emotionConfig$ = this.emotionConfigSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadEmotionConfig();
  }

  /**
   * Load emotion tracking configuration from backend
   */
  loadEmotionConfig(): void {
    this.http.get<EmotionTrackingConfig>(`${this.apiUrl}/config/emotion-tracking`)
      .subscribe({
        next: (config) => {
          this.emotionConfigSubject.next(config);
        },
        error: (error) => {
          console.error('Error loading emotion config:', error);
          // Keep default values
        }
      });
  }

  /**
   * Get current emotion tracking interval
   */
  getEmotionTrackingInterval(): number {
    return this.emotionConfigSubject.value.interval;
  }

  /**
   * Check if emotion tracking is enabled
   */
  isEmotionTrackingEnabled(): boolean {
    return this.emotionConfigSubject.value.enabled;
  }

  /**
   * Get emotion tracking config as observable
   */
  getEmotionConfig(): Observable<EmotionTrackingConfig> {
    return this.emotionConfig$;
  }

  /**
   * Refresh configuration from server
   */
  refreshConfig(): void {
    this.loadEmotionConfig();
  }
}
