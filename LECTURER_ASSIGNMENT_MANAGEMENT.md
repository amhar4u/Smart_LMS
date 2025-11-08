# Lecturer Assignment Management Feature

## Overview
The Lecturer Assignment Management feature allows lecturers to create, edit, delete, and manage assignments for their subjects using AI-generated questions. This feature mirrors the admin assignment management but is restricted to only the subjects taught by the lecturer.

## Implementation Date
November 8, 2025

## Features Implemented

### 1. Assignment Management Interface
- **Create Assignments**: Generate AI-powered assignments with multiple question types
- **Edit Assignments**: Update existing assignments with full form pre-population
- **Delete Assignments**: Remove assignments with confirmation dialog
- **Toggle Status**: Activate/deactivate assignments
- **Filter & Search**: Filter assignments by subject, type, level, and status

### 2. AI-Powered Question Generation
- **Multiple Question Types**: 
  - Multiple Choice Questions (MCQ)
  - Short Answer Questions
  - Essay Questions
- **Difficulty Levels**: Easy, Medium, Hard
- **Content Sources**:
  - Generate from module names
  - Provide custom content for question generation
- **Preview Questions**: Review AI-generated questions before saving
- **Automatic Scoring**: Auto-calculate total marks based on questions

### 3. Assignment Configuration
- Due date selection with date picker
- Number of questions (1-100)
- Maximum marks (auto-calculated)
- Submission type (Online/File Upload/Both)
- Time limit (optional)
- Late submission settings with penalty percentage
- Custom instructions for students

### 4. Subject-Specific Access Control
- Lecturers can only manage assignments for their own subjects
- Automatic filtering based on lecturer ID
- Subject selection limited to lecturer's teaching subjects
- Department, course, batch, and semester auto-populated from subject

## File Structure

```
frontend/src/app/component/lecturer/manage-assignments/
├── manage-assignments.component.ts   (510 lines)
├── manage-assignments.component.html (480 lines)
└── manage-assignments.component.css  (369 lines)
```

## Key Components

### TypeScript Component (`manage-assignments.component.ts`)

**Key Properties:**
- `assignments`: Array of Assignment objects
- `lecturerSubjects`: Filtered subjects taught by the lecturer
- `filteredModules`: Modules for selected subject
- `previewQuestions`: AI-generated questions preview
- `currentUser`: Authenticated lecturer information

**Key Methods:**
- `loadLecturerSubjects()`: Fetch subjects taught by the lecturer
- `loadAssignments()`: Load assignments filtered by lecturer's subjects
- `showCreateForm()`: Display assignment creation form
- `showEditForm(assignment)`: Edit existing assignment
- `previewQuestionsAction()`: Generate AI questions
- `saveAssignment()`: Create or update assignment
- `deleteAssignment()`: Remove assignment with confirmation
- `toggleAssignmentStatus()`: Activate/deactivate assignment

### HTML Template (`manage-assignments.component.html`)

**Sections:**
1. **Header Card**: Title, subtitle, and "Create Assignment" button
2. **Assignment Form** (2 tabs):
   - Tab 1: Assignment Details (subject, modules, configuration, settings)
   - Tab 2: Questions Preview (AI-generated questions with answer key)
3. **Filters Card**: Subject, type, level, and status filters
4. **Assignments Table**: Displays assignments with actions

**Table Columns:**
- Title (with description)
- Subject
- Batch
- Semester
- Type (MCQ/Short Answer/Essay)
- Level (Easy/Medium/Hard)
- Due Date
- Question Count & Marks
- Status (Active/Inactive toggle)
- Actions (Edit/Delete)

### CSS Styling (`manage-assignments.component.css`)

**Design Features:**
- Blue gradient header (`#2196F3` to `#1976D2`)
- Responsive grid layouts (2-column, 3-column)
- Color-coded badges for types and levels
- Expansion panels for question preview
- Loading spinner animations
- Mobile-responsive design with media queries

## Routes

Added to `app.routes.ts`:
```typescript
{
  path: 'lecturer/assignments',
  loadComponent: () => import('./component/lecturer/manage-assignments/manage-assignments.component')
    .then(m => m.LecturerManageAssignmentsComponent),
  canActivate: [teacherGuard]
}
```

## Navigation

Added to `lecturer-layout.html`:
```html
<div class="nav-item" routerLinkActive="active" routerLink="/lecturer/assignments">
  <div class="nav-content">
    <mat-icon class="nav-icon">assignment</mat-icon>
    <span *ngIf="!sidebarCollapsed" class="nav-text">Assignments</span>
  </div>
</div>
```

## Backend Integration

### Endpoints Used:
1. **GET `/api/assignments`**: Fetch assignments with filters
2. **POST `/api/assignments`**: Create new assignment
3. **PUT `/api/assignments/:id`**: Update assignment
4. **DELETE `/api/assignments/:id`**: Delete assignment
5. **PATCH `/api/assignments/:id/toggle-status`**: Toggle active status
6. **POST `/api/assignments/preview-questions`**: Generate AI questions

### Data Flow:
1. Lecturer selects subject from their teaching subjects
2. System auto-populates department, course, batch, semester from subject
3. Lecturer configures assignment details and selects modules
4. AI service generates questions based on module content
5. Lecturer previews and confirms questions
6. Assignment saved with all questions and metadata

## Access Control

### Subject Filtering:
```typescript
// Fetch only lecturer's subjects
const response = await this.subjectService.getSubjects({
  lecturer: this.currentUser._id
}).toPromise();

// Filter assignments to lecturer's subjects only
const lecturerSubjectIds = this.lecturerSubjects.map(s => s._id);
this.assignments = response.data.filter((assignment: Assignment) => {
  const subjectId = typeof assignment.subject === 'object' 
    ? assignment.subject._id 
    : assignment.subject;
  return lecturerSubjectIds.includes(subjectId);
});
```

## UI/UX Features

### Form Validation:
- Required fields marked with asterisk
- Real-time validation with error messages
- Field constraints (min/max length, number ranges)
- Disabled state for buttons during loading

### Loading States:
- Spinner during question generation
- Loading overlay during data fetch
- Disabled buttons during save operations
- Progress indicators

### User Feedback:
- Success notifications (SnackBar)
- Error messages for failed operations
- Confirmation dialogs for destructive actions
- No data states with helpful messages

## Differences from Admin Version

| Feature | Admin Version | Lecturer Version |
|---------|--------------|------------------|
| Subject Selection | All subjects with dept/course filters | Only lecturer's subjects |
| Department Field | Required dropdown | Auto-populated from subject |
| Course Field | Required dropdown | Auto-populated from subject |
| Batch Field | Required dropdown | Auto-populated from subject |
| Semester Field | Required dropdown | Auto-populated from subject |
| Table Columns | Includes dept, course, batch, subject | Subject, batch, semester only |
| Filters | Dept, course, type, level, status | Subject, type, level, status |
| Color Theme | Purple gradient | Blue gradient |
| Layout | AdminLayout | LecturerLayout |

## Testing Checklist

- [ ] Lecturer can see only their subjects in dropdown
- [ ] Assignment creation with AI question generation works
- [ ] All question types generate correctly (MCQ, Short Answer, Essay)
- [ ] Edit functionality pre-populates all fields
- [ ] Delete confirmation dialog appears
- [ ] Status toggle updates database
- [ ] Filters work correctly
- [ ] Pagination functions properly
- [ ] Mobile responsive design
- [ ] Error handling for API failures
- [ ] Late submission penalty field shows/hides correctly
- [ ] Custom content field shows/hides based on radio selection

## Dependencies

### Angular Material Components:
- MatCardModule
- MatButtonModule
- MatTableModule
- MatPaginatorModule
- MatSortModule
- MatIconModule
- MatDialogModule
- MatSnackBarModule
- MatFormFieldModule
- MatInputModule
- MatSelectModule
- MatDatepickerModule
- MatNativeDateModule
- MatChipsModule
- MatSlideToggleModule
- MatProgressSpinnerModule
- MatTabsModule
- MatExpansionModule
- MatRadioModule
- MatCheckboxModule
- MatTooltipModule

### Services:
- AssignmentService
- AuthService
- SubjectService
- ModuleService
- ConfirmationService
- LoadingService

## Future Enhancements

1. **Assignment Analytics**:
   - View submission statistics
   - Track student performance
   - Generate reports

2. **Bulk Operations**:
   - Create multiple assignments at once
   - Copy existing assignments
   - Import assignments from templates

3. **Advanced AI Features**:
   - Difficulty auto-detection
   - Question diversity analysis
   - Plagiarism detection

4. **Student View Integration**:
   - Preview assignment as student sees it
   - Test mode for verification

5. **Grading Features**:
   - Auto-grading for MCQs
   - Rubric creation for essays
   - Peer review assignments

## Support

For issues or questions:
- Check console for error messages
- Verify backend API is running
- Ensure OpenAI API key is configured
- Check user permissions and authentication

## Changelog

### Version 1.0.0 (November 8, 2025)
- Initial implementation
- Full CRUD operations
- AI question generation
- Subject-based filtering
- Responsive design
- Blue theme for lecturer interface
