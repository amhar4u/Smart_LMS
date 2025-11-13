# Assignment Submission Evaluation - Testing Checklist

## Prerequisites
- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] OpenAI API key is configured in `.env` file
- [ ] MongoDB is connected
- [ ] At least one assignment exists with student submissions

## Backend Testing

### 1. API Endpoints Testing

#### Get Submissions List
```bash
GET /api/assignments/:assignmentId/submissions
```
- [ ] Returns submissions list
- [ ] Pagination works correctly
- [ ] Statistics are calculated properly
- [ ] Filters work (status, level, percentage range, search)

#### Get Single Submission
```bash
GET /api/assignments/:assignmentId/submissions/:submissionId
```
- [ ] Returns submission details
- [ ] Includes assignment information
- [ ] Student data is populated

#### Evaluate Single Submission
```bash
POST /api/assignments/:assignmentId/submissions/:submissionId/evaluate
```
- [ ] Updates evaluation status to 'evaluating'
- [ ] Calls OpenAI API successfully
- [ ] Returns marks, percentage, and level
- [ ] Level is calculated correctly (0-40%, 41-70%, 71-100%)
- [ ] Feedback is generated
- [ ] Updates evaluation status to 'completed'
- [ ] Handles errors gracefully

#### Evaluate All Submissions
```bash
POST /api/assignments/:assignmentId/submissions/evaluate-all
```
- [ ] Finds all pending submissions
- [ ] Evaluates each one sequentially
- [ ] Returns summary of results
- [ ] Handles partial failures

#### Publish Single Evaluation
```bash
POST /api/assignments/:assignmentId/submissions/:submissionId/publish
```
- [ ] Sets status to 'graded'
- [ ] Sets isPublished to true
- [ ] Only works for completed evaluations

#### Publish All Evaluations
```bash
POST /api/assignments/:assignmentId/submissions/publish-all
```
- [ ] Updates all completed evaluations
- [ ] Returns count of published evaluations

### 2. AI Service Testing

- [ ] `determineLevel()` returns 'beginner' for 0-40%
- [ ] `determineLevel()` returns 'intermediate' for 41-70%
- [ ] `determineLevel()` returns 'advanced' for 71-100%
- [ ] `evaluateAssignment()` constructs proper prompt
- [ ] Response parsing handles JSON correctly
- [ ] Error handling works for API failures

### 3. Database Testing

- [ ] AssignmentSubmission model saves correctly
- [ ] Indexes are created properly
- [ ] `isPublished` field is stored
- [ ] `level` field accepts only valid values
- [ ] `evaluationStatus` transitions correctly

## Frontend Testing

### 1. Component Loading

- [ ] Navigate to `/admin/manage-assignments`
- [ ] Click "View Submissions" icon on an assignment
- [ ] Component loads without errors
- [ ] Page displays with correct assignment title

### 2. UI Elements

#### Header Section
- [ ] Back button navigates correctly
- [ ] Assignment title and details display
- [ ] "Evaluate All" button shows pending count
- [ ] "Publish All" button is enabled when evaluations exist

#### Statistics Cards
- [ ] Total Submissions count is correct
- [ ] Evaluated count is accurate
- [ ] Pending count matches
- [ ] Average percentage calculates correctly
- [ ] Beginner count is accurate
- [ ] Intermediate count is accurate
- [ ] Advanced count is accurate
- [ ] Cards have correct colors

#### Filters Section
- [ ] Search input filters by name
- [ ] Search filters by email
- [ ] Search filters by registration number
- [ ] Evaluation status dropdown works
- [ ] Level dropdown filters correctly
- [ ] Min percentage filter works
- [ ] Max percentage filter works
- [ ] Clear button resets all filters

#### Submissions Grid
- [ ] Cards display in grid layout
- [ ] Student information shows correctly
- [ ] Submission timestamp is formatted
- [ ] Time taken displays in minutes
- [ ] Status badge has correct color
- [ ] Level badge has correct color (if evaluated)
- [ ] Score circle shows percentage
- [ ] Score circle has correct border color

### 3. Evaluation Functionality

#### Single Evaluation
- [ ] Click "Evaluate" button on pending submission
- [ ] Confirmation prompt appears
- [ ] Loading indicator shows during evaluation
- [ ] Evaluation completes successfully
- [ ] Marks are displayed correctly
- [ ] Percentage is calculated correctly
- [ ] Level is assigned correctly:
  - [ ] Red badge for 0-40% (Beginner)
  - [ ] Yellow badge for 41-70% (Intermediate)
  - [ ] Green badge for 71-100% (Advanced)
- [ ] Statistics update automatically
- [ ] Success message displays

#### Batch Evaluation
- [ ] Click "Evaluate All" button
- [ ] Confirmation prompt appears
- [ ] Button shows "Evaluating..." during process
- [ ] All pending submissions are evaluated
- [ ] Summary message shows counts
- [ ] Statistics update after completion

### 4. Submission Details Modal

#### Opening Modal
- [ ] Click on a submission card
- [ ] Modal opens with smooth animation
- [ ] Click outside closes modal
- [ ] Close button works

#### Student Information Section
- [ ] Name displays correctly
- [ ] Email displays correctly
- [ ] Registration number shows
- [ ] Submitted timestamp is formatted
- [ ] Time taken displays in minutes

#### Evaluation Results Section
- [ ] Only shows for completed evaluations
- [ ] Score displays correctly
- [ ] Percentage shows with correct color
- [ ] Level badge appears with correct color
- [ ] Feedback text displays
- [ ] Grading timestamp shows
- [ ] "AI Evaluated" indicator appears

#### Answers Section
- [ ] All questions are listed
- [ ] Question numbers are correct
- [ ] Student answers display
- [ ] Correct/Incorrect chips show (if evaluated)
- [ ] Marks awarded per question display

### 5. Publishing Functionality

#### Single Publish
- [ ] "Publish" button appears for completed evaluations
- [ ] Confirmation prompt shows
- [ ] Status changes to "graded"
- [ ] "Published" chip appears
- [ ] Student can now see results

#### Batch Publish
- [ ] "Publish All" button is enabled
- [ ] Confirmation prompt appears
- [ ] All completed evaluations are published
- [ ] Success message shows count
- [ ] Cards update to show published status

### 6. Pagination

- [ ] Paginator displays at bottom
- [ ] Page size options work (5, 10, 25, 50)
- [ ] Navigation buttons work
- [ ] Current page updates correctly
- [ ] Total count displays accurately

### 7. Responsive Design

#### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] All elements are visible
- [ ] No horizontal scrolling

#### Tablet (768x1024)
- [ ] Cards resize appropriately
- [ ] Statistics stack vertically
- [ ] Filters stack properly
- [ ] Modal fits screen

#### Mobile (375x667)
- [ ] Single column layout
- [ ] Statistics cards stack
- [ ] Filters are in single column
- [ ] Modal is scrollable
- [ ] Buttons are touch-friendly

### 8. Error Handling

#### Network Errors
- [ ] Failed API calls show error message
- [ ] User can retry operations
- [ ] Loading states clear on error

#### Validation Errors
- [ ] Can't publish without evaluation
- [ ] Can't evaluate already evaluated submission
- [ ] Error messages are user-friendly

#### Edge Cases
- [ ] No submissions shows empty state
- [ ] No pending submissions disables "Evaluate All"
- [ ] No completed evaluations disables "Publish All"
- [ ] Search with no results shows message

## Integration Testing

### 1. Admin to Student Flow
- [ ] Admin evaluates submission
- [ ] Admin publishes evaluation
- [ ] Student logs in
- [ ] Student can see marks
- [ ] Student can see level
- [ ] Student can see feedback

### 2. Multiple Assignment Flow
- [ ] Navigate between different assignments
- [ ] Each shows correct submissions
- [ ] Statistics are assignment-specific
- [ ] Filters reset when switching

### 3. Real-time Updates
- [ ] Statistics update after evaluation
- [ ] Cards update after publish
- [ ] Filters work after updates

## Performance Testing

- [ ] Page loads in under 2 seconds
- [ ] Single evaluation completes in 5-15 seconds
- [ ] Batch evaluation handles 10+ submissions
- [ ] No memory leaks during long sessions
- [ ] Smooth animations and transitions

## Security Testing

- [ ] Only admins can access page
- [ ] Students can't access submission management
- [ ] API endpoints require authentication
- [ ] Unauthorized requests are rejected

## Level Assignment Verification

### Test Cases:
1. **Beginner Level (0-40%)**
   - [ ] 0% → Beginner + Red badge
   - [ ] 20% → Beginner + Red badge
   - [ ] 40% → Beginner + Red badge

2. **Intermediate Level (41-70%)**
   - [ ] 41% → Intermediate + Yellow badge
   - [ ] 55% → Intermediate + Yellow badge
   - [ ] 70% → Intermediate + Yellow badge

3. **Advanced Level (71-100%)**
   - [ ] 71% → Advanced + Green badge
   - [ ] 85% → Advanced + Green badge
   - [ ] 100% → Advanced + Green badge

## AI Evaluation Quality Testing

- [ ] MCQ answers are evaluated correctly
- [ ] Short answer questions get reasonable scores
- [ ] Essay questions receive detailed feedback
- [ ] Feedback is constructive and helpful
- [ ] Marks align with answer quality
- [ ] No bias in evaluation

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Final Checklist

- [ ] All API endpoints work
- [ ] All UI components render correctly
- [ ] Level detection follows 0-40%, 41-70%, 71-100% logic
- [ ] Colors match design (red, yellow, green)
- [ ] Publishing system works end-to-end
- [ ] Students see results only after publish
- [ ] AI evaluation provides meaningful feedback
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable
- [ ] Documentation is complete

## Known Issues / Notes

(Add any issues discovered during testing)

---

## Test Results Summary

**Date:** __________
**Tester:** __________
**Environment:** __________

**Total Tests:** _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Overall Status:** ☐ PASS ☐ FAIL

**Notes:**
_____________________________________________________
_____________________________________________________
_____________________________________________________

**Sign-off:**
- Developer: _________________ Date: _______
- Tester: ___________________ Date: _______
- Admin: ____________________ Date: _______
