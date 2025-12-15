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

export interface EducationalState {
  confused: number;
  bored: number;
  engaged: number;
  thinking: number;
  frustrated: number;
  interested: number;
  distracted: number;
}

export interface BehaviorData {
  attentionSpan: number;
  lookAwayCount: number;
  averageConfidence: number;
  sessionDuration: number;
  focusScore: number;
}

export interface EmotionResult {
  emotions: EmotionData;
  dominantEmotion: string;
  faceDetected: boolean;
  confidence: number;
  timestamp: Date;
  educationalState?: EducationalState;
  behavior?: BehaviorData;
  dominantEducationalState?: string;
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
  
  // Behavioral tracking
  private trackingStartTime: number = 0;
  private totalDetections: number = 0;
  private successfulDetections: number = 0;
  private lookAwayCount: number = 0;
  private confidenceHistory: number[] = [];
  private lastFaceDetected: boolean = true;

  constructor() {}

  /**
   * Load Face-API models
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    try {
      // Use CDN models to avoid Vite parsing issues
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('Loading Face-API models from CDN:', MODEL_URL);
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      console.log('✅ All Face-API models loaded successfully');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('❌ Error loading Face-API models:', error);
      throw new Error('Failed to load emotion detection models from CDN');
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
          resolve(this.videoElement!);
        };
        this.videoElement!.onerror = (error) => {
          console.error('Error starting webcam:', error);
          reject(new Error('Failed to start webcam'));
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
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
      // Validate video element is ready
      if (this.videoElement.readyState !== 4) {
        console.warn('Video element not ready for detection');
        return null;
      }

      const detections = await faceapi
        .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.3
        }))
        .withFaceExpressions();

      this.totalDetections++;

      if (detections && detections.expressions && detections.detection) {
        const expressions = detections.expressions;
        const detection = detections.detection;

        // Validate detection bounding box
        if (!detection.box || 
            detection.box.x == null || 
            detection.box.y == null || 
            detection.box.width == null || 
            detection.box.height == null) {
          console.warn('Invalid bounding box in detection');
          return null;
        }

        this.successfulDetections++;
        this.confidenceHistory.push(detection.score);
        if (this.confidenceHistory.length > 10) {
          this.confidenceHistory.shift();
        }

        // Track look away behavior
        if (!this.lastFaceDetected) {
          this.lookAwayCount++;
        }
        this.lastFaceDetected = true;

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

        // Calculate educational states
        const educationalState = this.calculateEducationalStates(emotions, detection.score);
        const behavior = this.calculateBehavior();
        const dominantEducationalState = this.getDominantEducationalState(educationalState);

        return {
          emotions,
          dominantEmotion,
          faceDetected: true,
          confidence: detection.score,
          timestamp: new Date(),
          educationalState,
          behavior,
          dominantEducationalState
        };
      } else {
        // No face detected
        if (this.lastFaceDetected) {
          this.lookAwayCount++;
        }
        this.lastFaceDetected = false;

        const educationalState = this.calculateEducationalStates({
          happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0
        }, 0);
        const behavior = this.calculateBehavior();

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
          timestamp: new Date(),
          educationalState,
          behavior,
          dominantEducationalState: 'distracted'
        };
      }
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return null;
    }
  }

  /**
   * 🎓 Calculate educational states from base emotions
   */
  private calculateEducationalStates(emotions: EmotionData, confidence: number): EducationalState {
    // CONFUSED: High neutral + surprised, low happy (student unsure/puzzled)
    const confused = Math.min(1, (
      (emotions.neutral * 0.4) +
      (emotions.surprised * 0.4) +
      ((1 - emotions.happy) * 0.2)
    ));

    // BORED: Very high neutral, low everything else (disengaged)
    const bored = Math.min(1, (
      (emotions.neutral * 0.6) +
      ((1 - emotions.happy) * 0.2) +
      ((1 - confidence) * 0.2)
    ));

    // ENGAGED: High confidence + positive emotions + face present
    const engaged = Math.min(1, (
      (confidence * 0.4) +
      (emotions.happy * 0.3) +
      ((1 - emotions.neutral) * 0.3)
    ));

    // THINKING: High neutral + high confidence (deep concentration)
    const thinking = Math.min(1, (
      (emotions.neutral * 0.5) +
      (confidence * 0.5)
    ));

    // FRUSTRATED: Angry + fearful + sad (struggling)
    const frustrated = Math.min(1, (
      (emotions.angry * 0.4) +
      (emotions.fearful * 0.3) +
      (emotions.sad * 0.3)
    ));

    // INTERESTED: Happy + surprised + high attention (actively learning)
    const interested = Math.min(1, (
      (emotions.happy * 0.4) +
      (emotions.surprised * 0.3) +
      (confidence * 0.3)
    ));

    // DISTRACTED: Low confidence + face not detected frequently
    const distracted = Math.min(1, (1 - confidence));

    return {
      confused,
      bored,
      engaged,
      thinking,
      frustrated,
      interested,
      distracted
    };
  }

  /**
   * 📊 Calculate behavioral indicators
   */
  private calculateBehavior(): BehaviorData {
    const sessionDuration = this.trackingStartTime > 0 
      ? Math.floor((Date.now() - this.trackingStartTime) / 1000) 
      : 0;

    const attentionSpan = this.totalDetections > 0
      ? Math.round((this.successfulDetections / this.totalDetections) * 100)
      : 0;

    const averageConfidence = this.confidenceHistory.length > 0
      ? this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length
      : 0;

    const focusScore = Math.round((attentionSpan * 0.6) + (averageConfidence * 100 * 0.4));

    return {
      attentionSpan,
      lookAwayCount: this.lookAwayCount,
      averageConfidence,
      sessionDuration,
      focusScore
    };
  }

  /**
   * 🎯 Get dominant educational state
   */
  private getDominantEducationalState(state: EducationalState): string {
    const states = Object.entries(state);
    const dominant = states.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    return dominant[0];
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

    // Reset tracking stats
    this.trackingStartTime = Date.now();
    this.totalDetections = 0;
    this.successfulDetections = 0;
    this.lookAwayCount = 0;
    this.confidenceHistory = [];
    this.lastFaceDetected = true;

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
