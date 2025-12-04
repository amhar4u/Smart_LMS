import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DoubtReply {
  author: {
    _id: string;
    name: string;
    role: string;
  };
  authorRole: 'student' | 'teacher';
  message: string;
  createdAt: Date;
}

export interface Doubt {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lecturer: {
    _id: string;
    name: string;
    email: string;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  meeting?: {
    _id: string;
    topic: string;
    meetingDate: Date;
  };
  batch?: {
    _id: string;
    name: string;
  };
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'resolved';
  visibility: 'private' | 'public';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments: Array<{
    url: string;
    publicId: string;
    type: string;
  }>;
  replies: DoubtReply[];
  isReadByLecturer: boolean;
  isReadByStudent: boolean;
  answeredAt?: Date;
  resolvedAt?: Date;
  responseTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoubtStatistics {
  total: number;
  pending: number;
  answered: number;
  resolved: number;
  averageResponseTime: number;
}

export interface CreateDoubtRequest {
  lecturer: string;
  subject: string;
  meeting?: string;
  question: string;
  visibility: 'private' | 'public';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface DoubtFilters {
  status?: 'pending' | 'answered' | 'resolved';
  subject?: string;
  visibility?: 'private' | 'public';
  priority?: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class DoubtService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/doubts`;
  
  // Real-time doubt updates
  private doubtsSubject = new BehaviorSubject<Doubt[]>([]);
  public doubts$ = this.doubtsSubject.asObservable();
  
  private statisticsSubject = new BehaviorSubject<DoubtStatistics | null>(null);
  public statistics$ = this.statisticsSubject.asObservable();

  // Get all doubts with optional filters
  getDoubts(filters?: DoubtFilters): Observable<Doubt[]> {
    let params = new HttpParams();
    
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.subject) params = params.set('subject', filters.subject);
    if (filters?.visibility) params = params.set('visibility', filters.visibility);
    if (filters?.priority) params = params.set('priority', filters.priority);
    
    return this.http.get<Doubt[]>(this.apiUrl, { params }).pipe(
      tap(doubts => this.doubtsSubject.next(doubts))
    );
  }

  // Get doubt statistics
  getStatistics(): Observable<DoubtStatistics> {
    return this.http.get<DoubtStatistics>(`${this.apiUrl}/statistics`).pipe(
      tap(stats => this.statisticsSubject.next(stats))
    );
  }

  // Get a single doubt by ID
  getDoubtById(id: string): Observable<Doubt> {
    return this.http.get<Doubt>(`${this.apiUrl}/${id}`);
  }

  // Create a new doubt (Student)
  createDoubt(doubtData: CreateDoubtRequest): Observable<Doubt> {
    return this.http.post<Doubt>(this.apiUrl, doubtData).pipe(
      tap(newDoubt => {
        const currentDoubts = this.doubtsSubject.value;
        this.doubtsSubject.next([newDoubt, ...currentDoubts]);
      })
    );
  }

  // Reply to a doubt (Lecturer)
  replyToDoubt(id: string, answer: string): Observable<Doubt> {
    return this.http.post<Doubt>(`${this.apiUrl}/${id}/reply`, { answer }).pipe(
      tap(updatedDoubt => {
        const currentDoubts = this.doubtsSubject.value;
        const index = currentDoubts.findIndex(d => d._id === id);
        if (index !== -1) {
          currentDoubts[index] = updatedDoubt;
          this.doubtsSubject.next([...currentDoubts]);
        }
      })
    );
  }

  // Update doubt status
  updateDoubtStatus(id: string, status: 'pending' | 'answered' | 'resolved'): Observable<Doubt> {
    return this.http.patch<Doubt>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      tap(updatedDoubt => {
        const currentDoubts = this.doubtsSubject.value;
        const index = currentDoubts.findIndex(d => d._id === id);
        if (index !== -1) {
          currentDoubts[index] = updatedDoubt;
          this.doubtsSubject.next([...currentDoubts]);
        }
      })
    );
  }

  // Update doubt (Edit question - Student)
  updateDoubt(id: string, updates: Partial<CreateDoubtRequest>): Observable<Doubt> {
    return this.http.put<Doubt>(`${this.apiUrl}/${id}`, updates).pipe(
      tap(updatedDoubt => {
        const currentDoubts = this.doubtsSubject.value;
        const index = currentDoubts.findIndex(d => d._id === id);
        if (index !== -1) {
          currentDoubts[index] = updatedDoubt;
          this.doubtsSubject.next([...currentDoubts]);
        }
      })
    );
  }

  // Delete doubt
  deleteDoubt(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentDoubts = this.doubtsSubject.value;
        this.doubtsSubject.next(currentDoubts.filter(d => d._id !== id));
      })
    );
  }

  // Get public doubts for a subject
  getPublicDoubtsBySubject(subjectId: string): Observable<Doubt[]> {
    return this.http.get<Doubt[]>(`${this.apiUrl}/subject/${subjectId}/public`);
  }

  // Get single doubt with full details
  getDoubtDetails(id: string): Observable<Doubt> {
    return this.http.get<Doubt>(`${this.apiUrl}/${id}/details`);
  }

  // Add follow-up reply to a doubt
  addFollowUpReply(id: string, message: string): Observable<Doubt> {
    return this.http.post<Doubt>(`${this.apiUrl}/${id}/follow-up`, { message }).pipe(
      tap(updatedDoubt => {
        const currentDoubts = this.doubtsSubject.value;
        const index = currentDoubts.findIndex(d => d._id === id);
        if (index !== -1) {
          currentDoubts[index] = updatedDoubt;
          this.doubtsSubject.next([...currentDoubts]);
        }
      })
    );
  }

  // Handle real-time socket updates
  handleSocketUpdate(data: { action: string; doubt?: Doubt; doubtId?: string }) {
    const currentDoubts = this.doubtsSubject.value;
    
    switch (data.action) {
      case 'created':
        if (data.doubt) {
          this.doubtsSubject.next([data.doubt, ...currentDoubts]);
        }
        break;
      
      case 'answered':
      case 'statusChanged':
        if (data.doubt) {
          const index = currentDoubts.findIndex(d => d._id === data.doubt!._id);
          if (index !== -1) {
            currentDoubts[index] = data.doubt;
            this.doubtsSubject.next([...currentDoubts]);
          }
        }
        break;
      
      case 'deleted':
        if (data.doubtId) {
          this.doubtsSubject.next(currentDoubts.filter(d => d._id !== data.doubtId));
        }
        break;
    }
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warn';
      case 'answered': return 'accent';
      case 'resolved': return 'primary';
      default: return 'basic';
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#757575';
    }
  }

  // Helper method to format response time
  formatResponseTime(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  }
}
