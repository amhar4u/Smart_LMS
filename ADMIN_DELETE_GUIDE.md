# Admin Submission Management - Frontend Implementation Guide

## Quick Solution (You Can Use Right Now)

### Option 1: Using the Script (Recommended for Now)

```bash
# 1. Check which submissions exist
cd backend
node testSubmissionFix.js <assignmentId>

# 2. Delete a specific submission
node quickDelete.js <submissionId>

# 3. Verify deletion
node testSubmissionFix.js <assignmentId> <studentId>
```

**Example for your case:**
```bash
cd backend
node quickDelete.js 691529f7f13daa4328da620d
```

✅ **Done! I already deleted it for you. The student can now resubmit.**

---

## Option 2: Using API (Postman/Insomnia)

### Delete Single Submission

**Request:**
```http
DELETE http://localhost:3000/api/assignments/6915077a286195b201837eea/submissions/691529f7f13daa4328da620d
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Submission deleted successfully. Student can now resubmit.",
  "data": {
    "deletedSubmissionId": "691529f7f13daa4328da620d",
    "assignmentId": "6915077a286195b201837eea",
    "student": {
      "id": "69103624ee2215bc2dbc56e8",
      "name": "Test stu",
      "email": "teststu@gmail.com"
    }
  }
}
```

### Delete All Submissions for Assignment

**Request:**
```http
DELETE http://localhost:3000/api/assignments/6915077a286195b201837eea/submissions
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## Option 3: Add UI to Admin Panel (Future Enhancement)

### 1. Update Assignment Service

**File: `frontend/src/app/services/assignment.service.ts`**

```typescript
// Add this method
deleteSubmission(assignmentId: string, submissionId: string): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/assignments/${assignmentId}/submissions/${submissionId}`
  );
}

deleteAllSubmissions(assignmentId: string): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/assignments/${assignmentId}/submissions`
  );
}
```

### 2. Update Admin Submissions Component

**File: `frontend/src/app/component/admin/assignment-submissions/assignment-submissions.component.ts`**

```typescript
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export class AssignmentSubmissionsComponent {
  // ... existing code ...

  deleteSubmission(submission: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Submission',
        message: `Delete submission by ${submission.student.firstName} ${submission.student.lastName}? They will be able to resubmit.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.assignmentService.deleteSubmission(this.assignmentId, submission._id)
          .subscribe({
            next: (response) => {
              this.snackBar.open('Submission deleted. Student can now resubmit.', 'OK', {
                duration: 3000
              });
              this.loadSubmissions(); // Refresh list
            },
            error: (error) => {
              this.snackBar.open('Error deleting submission', 'OK', {
                duration: 3000
              });
              console.error('Delete error:', error);
            }
          });
      }
    });
  }

  deleteAllSubmissions() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete All Submissions',
        message: `Delete ALL submissions for this assignment? All students will be able to resubmit. This action cannot be undone!`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.assignmentService.deleteAllSubmissions(this.assignmentId)
          .subscribe({
            next: (response) => {
              this.snackBar.open(
                `Deleted ${response.data.deletedCount} submission(s)`, 
                'OK', 
                { duration: 3000 }
              );
              this.loadSubmissions();
            },
            error: (error) => {
              this.snackBar.open('Error deleting submissions', 'OK', {
                duration: 3000
              });
            }
          });
      }
    });
  }
}
```

### 3. Update Template

**File: `frontend/src/app/component/admin/assignment-submissions/assignment-submissions.component.html`**

```html
<!-- Add to toolbar -->
<mat-toolbar>
  <span>Assignment Submissions</span>
  <span class="spacer"></span>
  <button mat-raised-button color="warn" (click)="deleteAllSubmissions()"
          *ngIf="submissions.length > 0">
    <mat-icon>delete_sweep</mat-icon>
    Delete All Submissions
  </button>
</mat-toolbar>

<!-- Add to each submission row -->
<table mat-table [dataSource]="submissions">
  <!-- ... existing columns ... -->
  
  <!-- Actions Column -->
  <ng-container matColumnDef="actions">
    <th mat-header-cell *matHeaderCellDef>Actions</th>
    <td mat-cell *matCellDef="let submission">
      <button mat-icon-button 
              [matMenuTriggerFor]="menu" 
              color="primary">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="viewSubmission(submission)">
          <mat-icon>visibility</mat-icon>
          <span>View Details</span>
        </button>
        <button mat-menu-item (click)="deleteSubmission(submission)">
          <mat-icon color="warn">delete</mat-icon>
          <span>Delete Submission</span>
        </button>
      </mat-menu>
    </td>
  </ng-container>

  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
```

### 4. Create Confirm Dialog Component (if not exists)

**File: `frontend/src/app/shared/confirm-dialog/confirm-dialog.component.ts`**

```typescript
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button mat-raised-button 
              [color]="data.isDangerous ? 'warn' : 'primary'"
              (click)="onConfirm()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
```

---

## Quick Reference Card

### For Immediate Use (CLI)

```bash
# Check submission status
node testSubmissionFix.js <assignmentId>

# Delete submission
node quickDelete.js <submissionId>
```

### For API Testing (Postman)

```
DELETE /api/assignments/:assignmentId/submissions/:submissionId
Headers: Authorization: Bearer <admin_token>
```

### Your Specific Case (Already Done ✅)

```bash
cd backend
node quickDelete.js 691529f7f13daa4328da620d
```

**Status:** ✅ Deleted successfully
**Student:** Can now resubmit the assignment

---

## Troubleshooting

### "Submission not found"
- Check the submission ID is correct
- Use `testSubmissionFix.js` to get the correct ID

### "Access denied"
- Make sure you're using an admin or lecturer token
- Check the role in the JWT token

### Student still can't submit
- Verify deletion: `node testSubmissionFix.js <assignmentId> <studentId>`
- Check server logs for errors
- Restart backend server if needed

---

**Current Status:** The submission has been deleted. Student can now resubmit! 🎉
