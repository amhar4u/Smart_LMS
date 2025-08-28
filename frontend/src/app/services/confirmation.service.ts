import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'delete' | 'warning' | 'info';
}

export interface ConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(private dialog: MatDialog) { }

  private openDialog(data: ConfirmationDialogData): Observable<boolean> {
    // Use a simple approach - we'll manually import when needed
    // For now, return a simple confirmation
    return new Observable(observer => {
      const result = confirm(`${data.title}\n\n${data.message}`);
      observer.next(result);
      observer.complete();
    });
  }

  confirm(data: ConfirmationData): Observable<boolean> {
    const dialogData: ConfirmationDialogData = {
      title: data.title,
      message: data.message,
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      type: data.type || 'info'
    };
    
    return this.openDialog(dialogData);
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete'
    });
  }

  confirmUpdate(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Update',
      message: `Are you sure you want to update "${itemName}"?`,
      confirmText: 'Update',
      cancelText: 'Cancel',
      type: 'warning'
    });
  }
}
