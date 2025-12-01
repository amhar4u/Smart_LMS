import { Injectable } from '@angular/core';
import Daily, { DailyCall, DailyEvent, DailyEventObjectParticipant, DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

export interface ParticipantInfo {
  session_id: string;
  user_id: string;
  user_name: string;
  tracks: {
    video?: any;
    audio?: any;
    screenVideo?: any;
    screenAudio?: any;
  };
  local: boolean;
}

export interface CallState {
  isJoined: boolean;
  isLoading: boolean;
  error: string | null;
  participants: Map<string, ParticipantInfo>;
  localVideo: boolean;
  localAudio: boolean;
  activeSpeaker: string | null;
  screenShare: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DailyCallManagerService {
  private call: DailyCall | null = null;
  private callStateSubject = new BehaviorSubject<CallState>({
    isJoined: false,
    isLoading: false,
    error: null,
    participants: new Map(),
    localVideo: true,
    localAudio: true,
    activeSpeaker: null,
    screenShare: false
  });

  // Observable streams
  public callState$: Observable<CallState> = this.callStateSubject.asObservable();
  
  // Event subjects for specific actions
  public participantJoined$ = new Subject<ParticipantInfo>();
  public participantLeft$ = new Subject<string>();
  public participantUpdated$ = new Subject<ParticipantInfo>();
  public activeSpeakerChanged$ = new Subject<string>();
  public trackStarted$ = new Subject<{ participantId: string; trackType: string; track: any }>();
  public trackStopped$ = new Subject<{ participantId: string; trackType: string }>();

  constructor() {}

  /**
   * Initialize and create the Daily call object
   */
  createCallObject(): void {
    if (!this.call) {
      this.call = Daily.createCallObject({
        audioSource: true,
        videoSource: true
      });
      this.setupEventListeners();
    }
  }

  /**
   * Join a Daily room with token
   */
  async join(roomUrl: string, token: string, userName?: string): Promise<void> {
    if (!this.call) {
      this.createCallObject();
    }

    this.updateState({ isLoading: true, error: null });

    try {
      const joinOptions: any = {
        url: roomUrl,
        token: token
      };

      if (userName) {
        joinOptions.userName = userName;
      }

      await this.call!.join(joinOptions);
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      this.updateState({
        isLoading: false,
        error: error.message || 'Failed to join meeting'
      });
      throw error;
    }
  }

  /**
   * Leave the current call
   */
  async leave(): Promise<void> {
    if (this.call) {
      try {
        await this.call.leave();
      } catch (error) {
        console.error('Error leaving meeting:', error);
      }
    }
  }

  /**
   * Destroy the call object and cleanup
   */
  destroy(): void {
    if (this.call) {
      try {
        this.call.destroy();
      } catch (error) {
        console.error('Error destroying call:', error);
      }
      this.call = null;
    }

    // Reset state
    this.callStateSubject.next({
      isJoined: false,
      isLoading: false,
      error: null,
      participants: new Map(),
      localVideo: true,
      localAudio: true,
      activeSpeaker: null,
      screenShare: false
    });
  }

  /**
   * Toggle local video on/off
   */
  toggleVideo(): void {
    if (this.call) {
      const newState = !this.call.localVideo();
      this.call.setLocalVideo(newState);
      this.updateState({ localVideo: newState });
    }
  }

  /**
   * Toggle local audio on/off
   */
  toggleAudio(): void {
    if (this.call) {
      const newState = !this.call.localAudio();
      this.call.setLocalAudio(newState);
      this.updateState({ localAudio: newState });
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<void> {
    if (this.call) {
      try {
        await this.call.startScreenShare();
        this.updateState({ screenShare: true });
        console.log('✅ Screen share started successfully');
      } catch (error) {
        console.error('❌ Error starting screen share:', error);
        throw error;
      }
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (this.call) {
      this.call.stopScreenShare();
      this.updateState({ screenShare: false });
      console.log('✅ Screen share stopped');
    }
  }

  /**
   * Get available devices (cameras, microphones, speakers)
   */
  async getDevices(): Promise<any> {
    if (this.call) {
      return await this.call.enumerateDevices();
    }
    return { devices: [] };
  }

  /**
   * Get current input devices
   */
  async getCurrentDevices(): Promise<any> {
    if (this.call) {
      return await this.call.getInputDevices();
    }
    return {};
  }

  /**
   * Set camera device
   */
  async setCameraDevice(deviceId: string): Promise<void> {
    if (this.call) {
      await this.call.setInputDevicesAsync({ videoDeviceId: deviceId });
    }
  }

  /**
   * Set microphone device
   */
  async setMicrophoneDevice(deviceId: string): Promise<void> {
    if (this.call) {
      await this.call.setInputDevicesAsync({ audioDeviceId: deviceId });
    }
  }

  /**
   * Get current call statistics
   */
  getStats(): any {
    if (this.call) {
      return this.call.getNetworkStats();
    }
    return null;
  }

  /**
   * Get participant counts
   */
  getParticipantCounts(): any {
    if (this.call) {
      return this.call.participantCounts();
    }
    return { present: 0, hidden: 0 };
  }

  /**
   * Get all participants
   */
  getParticipants(): any {
    if (this.call) {
      return this.call.participants();
    }
    return {};
  }

  /**
   * Setup event listeners for Daily events
   */
  private setupEventListeners(): void {
    if (!this.call) return;

    // Joined meeting
    this.call.on('joined-meeting', (event?: any) => {
      console.log('✅ Joined meeting successfully');
      this.handleJoinedMeeting(event);
    });

    // Left meeting
    this.call.on('left-meeting', (event?: any) => {
      console.log('👋 Left meeting');
      this.handleLeftMeeting(event);
    });

    // Participant joined
    this.call.on('participant-joined', (event?: DailyEventObjectParticipant) => {
      if (event?.participant) {
        console.log('👤 Participant joined:', event.participant.user_name);
        this.handleParticipantJoined(event);
      }
    });

    // Participant left
    this.call.on('participant-left', (event?: any) => {
      if (event?.participant) {
        console.log('👋 Participant left:', event.participant.user_name);
        this.handleParticipantLeft(event);
      }
    });

    // Participant updated
    this.call.on('participant-updated', (event?: DailyEventObjectParticipant) => {
      if (event?.participant) {
        this.handleParticipantUpdated(event);
      }
    });

    // Active speaker change
    this.call.on('active-speaker-change', (event?: DailyEventObjectActiveSpeakerChange) => {
      if (event?.activeSpeaker) {
        this.handleActiveSpeakerChange(event);
      }
    });

    // Track started
    this.call.on('track-started', (event?: any) => {
      if (event) {
        this.handleTrackStarted(event);
      }
    });

    // Track stopped
    this.call.on('track-stopped', (event?: any) => {
      if (event) {
        this.handleTrackStopped(event);
      }
    });

    // Error
    this.call.on('error', (event?: any) => {
      console.error('❌ Daily call error:', event);
      this.updateState({ error: event?.errorMsg || 'An error occurred' });
    });
  }

  /**
   * Handle joined meeting event
   */
  private handleJoinedMeeting(event: any): void {
    const participants = this.call?.participants() || {};
    const participantsMap = new Map<string, ParticipantInfo>();

    Object.entries(participants).forEach(([id, participant]: [string, any]) => {
      participantsMap.set(id, this.mapParticipant(participant));
    });

    this.updateState({
      isJoined: true,
      isLoading: false,
      error: null,
      participants: participantsMap,
      localVideo: this.call?.localVideo() || false,
      localAudio: this.call?.localAudio() || false
    });
  }

  /**
   * Handle left meeting event
   */
  private handleLeftMeeting(event: any): void {
    this.updateState({
      isJoined: false,
      participants: new Map()
    });
  }

  /**
   * Handle participant joined event
   */
  private handleParticipantJoined(event: DailyEventObjectParticipant): void {
    const participant = this.mapParticipant(event.participant);
    
    const currentState = this.callStateSubject.value;
    const newParticipants = new Map(currentState.participants);
    newParticipants.set(participant.session_id, participant);

    this.updateState({ participants: newParticipants });
    this.participantJoined$.next(participant);
  }

  /**
   * Handle participant left event
   */
  private handleParticipantLeft(event: DailyEventObjectParticipant): void {
    const participantId = event.participant.session_id;

    const currentState = this.callStateSubject.value;
    const newParticipants = new Map(currentState.participants);
    newParticipants.delete(participantId);

    this.updateState({ participants: newParticipants });
    this.participantLeft$.next(participantId);
  }

  /**
   * Handle participant updated event
   */
  private handleParticipantUpdated(event: DailyEventObjectParticipant): void {
    const participant = this.mapParticipant(event.participant);

    const currentState = this.callStateSubject.value;
    const newParticipants = new Map(currentState.participants);
    newParticipants.set(participant.session_id, participant);

    // Update local audio/video state if it's the local participant
    if (participant.local) {
      this.updateState({
        participants: newParticipants,
        localVideo: this.call?.localVideo() || false,
        localAudio: this.call?.localAudio() || false
      });
    } else {
      this.updateState({ participants: newParticipants });
    }

    this.participantUpdated$.next(participant);
  }

  /**
   * Handle active speaker change event
   */
  private handleActiveSpeakerChange(event: DailyEventObjectActiveSpeakerChange): void {
    const speakerId = event.activeSpeaker?.peerId || null;
    this.updateState({ activeSpeaker: speakerId });
    if (speakerId) {
      this.activeSpeakerChanged$.next(speakerId);
    }
  }

  /**
   * Handle track started event
   */
  private handleTrackStarted(event: any): void {
    this.trackStarted$.next({
      participantId: event.participant?.session_id,
      trackType: event.track?.kind,
      track: event.track
    });
  }

  /**
   * Handle track stopped event
   */
  private handleTrackStopped(event: any): void {
    this.trackStopped$.next({
      participantId: event.participant?.session_id,
      trackType: event.track?.kind
    });
  }

  /**
   * Map Daily participant to our ParticipantInfo interface
   */
  private mapParticipant(participant: any): ParticipantInfo {
    return {
      session_id: participant.session_id,
      user_id: participant.user_id || participant.session_id,
      user_name: participant.user_name || 'Unknown',
      tracks: participant.tracks || {},
      local: participant.local || false
    };
  }

  /**
   * Update call state
   */
  private updateState(partialState: Partial<CallState>): void {
    const currentState = this.callStateSubject.value;
    this.callStateSubject.next({ ...currentState, ...partialState });
  }

  /**
   * Get current state
   */
  getCurrentState(): CallState {
    return this.callStateSubject.value;
  }
}
