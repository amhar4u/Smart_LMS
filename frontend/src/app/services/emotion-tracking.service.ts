import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';

export interface EmotionData {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fearful: number;
  disgusted: number;
  neutral: number;
}

export interface EmotionResult {
  emotions: EmotionData;
  dominantEmotion: string;
  faceDetected: boolean;
  confidence: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EmotionTrackingService {
  private modelsLoaded = false;
  private isTracking = false;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private detectionInterval: any = null;

  constructor() {}

  /**
   * Load Face-API models
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    try {
      const MODEL_URL = '/assets/models'; // Store models in assets/models folder
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      this.modelsLoaded = true;
      console.log('✅ Face-API models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Face-API models:', error);
      throw new Error('Failed to load emotion detection models');
    }
  }

  /**
   * Start webcam and initialize video element
   */
  async startWebcam(): Promise<HTMLVideoElement> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;

      return new Promise((resolve, reject) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          console.log('✅ Webcam started successfully');
          resolve(this.videoElement!);
        };
        this.videoElement!.onerror = (error) => {
          console.error('❌ Error starting webcam:', error);
          reject(new Error('Failed to start webcam'));
        };
      });
    } catch (error) {
      console.error('❌ Error accessing webcam:', error);
      throw new Error('Failed to access webcam. Please grant camera permissions.');
    }
  }

  /**
   * Detect emotions from current video frame
   */
  async detectEmotions(): Promise<EmotionResult | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    if (!this.videoElement) {
      throw new Error('Video element not initialized');
    }

    try {
      const detections = await faceapi
        .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.expressions) {
        const expressions = detections.expressions;
        const detection = detections.detection;

        const emotions: EmotionData = {
          happy: expressions.happy,
          sad: expressions.sad,
          angry: expressions.angry,
          surprised: expressions.surprised,
          fearful: expressions.fearful,
          disgusted: expressions.disgusted,
          neutral: expressions.neutral
        };

        // Find dominant emotion
        const dominantEmotion = Object.keys(emotions).reduce((a, b) =>
          emotions[a as keyof EmotionData] > emotions[b as keyof EmotionData] ? a : b
        );

        return {
          emotions,
          dominantEmotion,
          faceDetected: true,
          confidence: detection.score,
          timestamp: new Date()
        };
      } else {
        // No face detected
        return {
          emotions: {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            fearful: 0,
            disgusted: 0,
            neutral: 0
          },
          dominantEmotion: 'unknown',
          faceDetected: false,
          confidence: 0,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return null;
    }
  }

  /**
   * Start continuous emotion tracking
   * @param callback Function to call with emotion data
   * @param interval Detection interval in milliseconds (default: from env or 300000 = 5 minutes)
   */
  startTracking(callback: (result: EmotionResult) => void, interval?: number): void {
    if (this.isTracking) {
      console.warn('Emotion tracking is already running');
      return;
    }

    // Use provided interval or default (5 minutes)
    const trackingInterval = interval || 300000;

    this.isTracking = true;

    // Detect immediately
    this.detectEmotions().then(result => {
      if (result) {
        callback(result);
      }
    });

    // Then detect at intervals
    this.detectionInterval = setInterval(async () => {
      if (document.hidden) {
        // Skip detection if tab is not active
        return;
      }

      const result = await this.detectEmotions();
      if (result) {
        callback(result);
      }
    }, trackingInterval);

    console.log(`✅ Emotion tracking started (interval: ${trackingInterval}ms = ${trackingInterval / 60000} minutes)`);
  }

  /**
   * Stop emotion tracking
   */
  stopTracking(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    this.isTracking = false;
    console.log('⏹️ Emotion tracking stopped');
  }

  /**
   * Stop webcam and release resources
   */
  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    console.log('📷 Webcam stopped');
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.stopTracking();
    this.stopWebcam();
  }

  /**
   * Check if tracking is currently active
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Check if models are loaded
   */
  areModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  /**
   * Get video element for display (optional)
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Check if webcam access is available
   */
  async checkWebcamAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
}
