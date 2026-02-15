# Design Document: DeepFetch AI Platform

## Overview

DeepFetch AI is a full-stack web application that provides AI-powered document search and analysis capabilities for the Department of Higher Education under the Ministry of Education, India. The platform enables users to upload various document types, perform intelligent searches across their document collections using natural language queries, and track their usage through comprehensive analytics.

The system is built on Firebase infrastructure (Authentication, Firestore, Storage) with a Next-based frontend and serverless API functions. The AI capabilities are powered by OpenAI's GPT-4o-mini model, which processes user queries in the context of uploaded document content.

### Key Features

- Secure user authentication and profile management
- Multi-format document upload and storage (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, JSON, CSV)
- AI-powered natural language search across documents
- Search history tracking and management
- Real-time notifications for system events
- Analytics dashboard with usage statistics and trends
- Responsive design for desktop and mobile devices

### Technology Stack

- **Frontend**: Next with TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI**: OpenAI GPT-4o-mini API
- **Document Processing**: PDF parsing, Office document extraction
- **Deployment**: Firebase Hosting and Cloud Functions

## Architecture

### System Architecture

The DeepFetch AI platform follows a serverless architecture pattern with clear separation between client-side and server-side responsibilities:

```
┌───────────────────────────────────────────────────────────┐
│                     Next Frontend (SPA)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Upload  │  │  Search  │  │ History  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │    │
│         └──────────────┴──────────────┴──────────────┘    │
│                          │                                │
│                   ┌──────▼──────┐                         │
│                   │   Services  │                         │
│                   │   Layer     │                         │
│                   └──────┬──────┘                         │
└──────────────────────────┼────────────────────────────────┘
                           │
        ┌──────────────────┼────────────────┐
        │                  │                │
┌───────▼────────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Firebase     │  │  Firebase   │  │  Firebase   │
│     Auth       │  │  Firestore  │  │   Storage   │
└────────────────┘  └─────────────┘  └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Cloud     │
                    │  Functions  │
                    │  (API)      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   OpenAI    │
                    │     API     │
                    └─────────────┘
```

### Component Architecture

The frontend follows a layered architecture:

1. **Presentation Layer**: Next components for UI rendering
2. **Service Layer**: Business logic and Firebase interactions
3. **Utility Layer**: Helper functions for formatting, validation, and file processing

The backend consists of:

1. **API Functions**: Serverless functions for document processing and AI search
2. **Firebase Services**: Managed services for authentication, database, and storage

### Data Flow

#### Document Upload Flow
```
User selects file → Client validates type → Upload to Storage → 
Save metadata to Firestore → Create notification → Update UI
```

#### Search Flow
```
User enters query → Select documents → Extract text (client or server) →
Call search API → OpenAI processes query → Save to history → 
Create notification → Display results
```

#### Authentication Flow
```
User provides credentials → Firebase Auth validates → 
Create/update user document → Redirect to dashboard
```

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components

**LoginForm**
- Purpose: Handle user login
- Props: None (uses Firebase Auth context)
- State: email, password, loading, error
- Methods: handleLogin(), handleRegister()

**ProtectedRoute**
- Purpose: Wrap protected pages and enforce authentication
- Props: children (Next nodes)
- Behavior: Redirect to login if unauthenticated, show loading during auth check

#### 2. Dashboard Components

**Dashboard**
- Purpose: Display analytics, statistics, and recent activity
- State: stats, chartData, recentActivity, loading
- Methods: loadDashboardData(), refreshData()
- Sub-components: StatsCards, ActivityChart, RecentActivityList

**StatsCards**
- Purpose: Display key metrics (searches, uploads, users)
- Props: totalSearches, totalUploads, activeUsers, weeklyTrend
- Displays: Current values and percentage change from previous week

**ActivityChart**
- Purpose: Visualize daily search and upload trends
- Props: chartData (array of {date, searches, uploads})
- Library: Chart.js or similar charting library

#### 3. Upload Components

**FileUpload**
- Purpose: Handle document uploads
- State: selectedFile, description, uploading, progress
- Methods: handleFileSelect(), handleUpload(), validateFileType()
- Validation: Check file type against supported formats

**FileList**
- Purpose: Display user's uploaded documents
- State: files, loading
- Methods: loadFiles(), deleteFile(), formatFileSize()
- Display: File name, size, type, upload date, description

#### 4. Search Components

**SearchInterface**
- Purpose: Main search UI with query input and file selection
- State: query, selectedFiles, searching, result
- Methods: handleSearch(), handleFileSelection(), extractFileContent()

**SearchResults**
- Purpose: Display AI-generated search results
- Props: result (query, response, fileCount, timestamp)
- Display: Formatted response with metadata

#### 5. History Components

**SearchHistory**
- Purpose: Display and manage past searches
- State: history, loading, searchFilter
- Methods: loadHistory(), deleteHistoryItem(), filterHistory()
- Features: Search within history, delete items, view details

#### 6. Notification Components

**NotificationCenter**
- Purpose: Display and manage notifications
- State: notifications, unreadCount, loading
- Methods: loadNotifications(), markAsRead(), markAllAsRead(), deleteNotification()
- Display: Notification list with read/unread status

### Service Layer

#### AuthService

```typescript
interface AuthService {
  // Authentication
  login(email: string, password: string): Promise<UserCredential>
  register(email: string, password: string, displayName: string): Promise<UserCredential>
  logout(): Promise<void>
  getCurrentUser(): User | null
  
  // Profile management
  updateProfile(displayName: string): Promise<void>
  updateUserDocument(uid: string, data: Partial<UserData>): Promise<void>
}
```

#### UploadService

```typescript
interface UploadService {
  // File operations
  uploadFile(file: File, userId: string, description?: string): Promise<UploadResult>
  getUploadedFiles(userId: string): Promise<FileMetadata[]>
  deleteFile(fileId: string, storagePath: string): Promise<void>
  
  // Validation
  isSupportedFileType(filename: string): boolean
  formatFileSize(bytes: number): string
}

interface FileMetadata {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: Timestamp
  uploadedBy: string
  description?: string
}
```

#### SearchService

```typescript
interface SearchService {
  // Search operations
  performSearch(query: string, files: FileData[]): Promise<SearchResult>
  extractTextFromFiles(files: File[]): Promise<FileData[]>
  
  // History management
  getSearchHistory(userId: string, limit?: number): Promise<SearchHistoryItem[]>
  deleteHistoryItem(historyId: string): Promise<void>
  searchHistory(userId: string, searchTerm: string): Promise<SearchHistoryItem[]>
}

interface SearchResult {
  success: boolean
  response: string
  query: string
  fileCount: number
  error?: string
}

interface SearchHistoryItem {
  id: string
  userId: string
  query: string
  response: string
  fileNames: string[]
  timestamp: Timestamp
}
```

#### AnalyticsService

```typescript
interface AnalyticsService {
  // Dashboard data
  getDashboardStats(userId: string): Promise<DashboardStats>
  getChartData(userId: string, days: number): Promise<ChartDataPoint[]>
  getRecentActivity(userId: string, limit: number): Promise<ActivityItem[]>
  
  // Statistics calculation
  calculateWeeklyTrend(current: number, previous: number): number
  getUserSearchCount(userId: string, startDate: Date, endDate: Date): Promise<number>
}

interface DashboardStats {
  totalSearches: number
  totalUploads: number
  activeUsers: number
  searchesThisWeek: number
  uploadsThisWeek: number
  weeklySearchTrend: number
  weeklyUploadTrend: number
}

interface ChartDataPoint {
  date: string
  searches: number
  uploads: number
}
```

#### NotificationService

```typescript
interface NotificationService {
  // Notification operations
  createNotification(userId: string, type: NotificationType, message: string): Promise<void>
  getNotifications(userId: string): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(notificationId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number>
}

interface Notification {
  id: string
  userId: string
  type: 'upload' | 'search' | 'system'
  message: string
  read: boolean
  createdAt: Timestamp
}

type NotificationType = 'upload' | 'search' | 'system'
```

### Backend API Functions

#### File Processing API

**Endpoint**: `/api/extractText`

**Request**:
```typescript
interface ExtractTextRequest {
  fileData: string  // base64-encoded file content
  fileType: string  // file extension (pdf, docx, xlsx, etc.)
}
```

**Response**:
```typescript
interface ExtractTextResponse {
  success: boolean
  text?: string
  error?: string
}
```

**Processing Logic**:
- PDF: Use pdf-parse library to extract text from all pages
- DOCX: Use mammoth library to extract raw text
- XLSX: Use xlsx library to parse sheets and convert to CSV format
- Error handling: Return descriptive errors for unsupported types or extraction failures

#### Search API

**Endpoint**: `/api/search`

**Request**:
```typescript
interface SearchRequest {
  query: string
  files: FileData[]
  userId: string
}

interface FileData {
  name: string
  content?: string
  url?: string
}
```

**Response**:
```typescript
interface SearchResponse {
  success: boolean
  response?: string
  query?: string
  fileCount?: number
  error?: string
}
```

**Processing Logic**:
1. Validate request parameters (query and files required)
2. Extract text from file URLs or use provided content
3. Truncate combined content to 8000 characters
4. Build OpenAI messages with system prompt and user query
5. Call OpenAI API with timeout (30 seconds)
6. Return formatted response or error

**OpenAI Configuration**:
- Model: gpt-4o-mini
- Temperature: 0.7
- Max tokens: 1500
- System prompt: Ministry of Education domain-specific instructions

### Utility Functions

#### File Processing Utilities

```typescript
// Client-side file reading
function readFileAsText(file: File): Promise<string>
function readFileAsBase64(file: File): Promise<string>
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer>

// File validation
function isSupportedFileType(filename: string): boolean
function getFileExtension(filename: string): string

// File formatting
function formatFileSize(bytes: number): string
function formatTimestamp(timestamp: Timestamp): string
function formatRelativeTime(date: Date): string
```

#### Text Processing Utilities

```typescript
// Content extraction
function extractTextFromPDF(buffer: ArrayBuffer): Promise<string>
function extractTextFromDocx(buffer: ArrayBuffer): Promise<string>
function extractTextFromXlsx(buffer: ArrayBuffer): Promise<string>

// Content manipulation
function truncateText(text: string, maxLength: number): string
function combineFileContents(files: FileData[]): string
```

#### Formatting Utilities

```typescript
// Time formatting
function formatRelativeTime(date: Date): string  // "5m ago", "2h ago", "3d ago"
function formatFullTimestamp(date: Date): string  // "Jan 15, 2024 at 3:45 PM"

// Number formatting
function formatPercentageChange(current: number, previous: number): string
function formatCount(count: number): string
```

## Data Models

### Firestore Collections

#### users Collection

```typescript
interface UserDocument {
  uid: string              // Firebase Auth UID
  email: string           // User email
  displayName: string     // User display name
  createdAt: Timestamp    // Account creation timestamp
  role: string            // User role (default: "user")
}
```

**Collection Path**: `/users/{uid}`

#### uploads Collection

```typescript
interface UploadDocument {
  id: string              // Auto-generated document ID
  name: string            // Original filename
  url: string             // Firebase Storage download URL
  size: number            // File size in bytes
  type: string            // File extension
  uploadedAt: Timestamp   // Upload timestamp
  uploadedBy: string      // User UID
  description?: string    // Optional file description
}
```

**Collection Path**: `/uploads/{uploadId}`

**Indexes Required**:
- uploadedBy (ascending), uploadedAt (descending)

#### searchHistory Collection

```typescript
interface SearchHistoryDocument {
  id: string              // Auto-generated document ID
  userId: string          // User UID
  query: string           // Search query text
  response: string        // AI-generated response
  fileNames: string[]     // Names of attached files
  timestamp: Timestamp    // Search timestamp
}
```

**Collection Path**: `/searchHistory/{historyId}`

**Indexes Required**:
- userId (ascending), timestamp (descending)

#### notifications Collection

```typescript
interface NotificationDocument {
  id: string              // Auto-generated document ID
  userId: string          // User UID
  type: NotificationType  // Notification type
  message: string         // Notification message
  read: boolean           // Read status
  createdAt: Timestamp    // Creation timestamp
}

type NotificationType = 'upload' | 'search' | 'system'
```

**Collection Path**: `/notifications/{notificationId}`

**Indexes Required**:
- userId (ascending), createdAt (descending)
- userId (ascending), read (ascending), createdAt (descending)

### Firebase Storage Structure

```
/uploads/{userId}/{timestamp}_{filename}
```

**Example**: `/uploads/abc123/1705334400000_document.pdf`

### Client-Side State Models

#### Authentication State

```typescript
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
```

#### Upload State

```typescript
interface UploadState {
  files: FileMetadata[]
  uploading: boolean
  progress: number
  error: string | null
}
```

#### Search State

```typescript
interface SearchState {
  query: string
  selectedFiles: File[]
  searching: boolean
  result: SearchResult | null
  error: string | null
}
```

#### Dashboard State

```typescript
interface DashboardState {
  stats: DashboardStats
  chartData: ChartDataPoint[]
  recentActivity: ActivityItem[]
  loading: boolean
  error: string | null
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Authentication Properties

**Property 1: Valid credentials grant access**

*For any* valid email and password combination, authenticating with those credentials should result in successful authentication and access to protected resources.

**Validates: Requirements 1.1**

**Property 2: Invalid credentials are rejected**

*For any* invalid credential combination (wrong password, non-existent email, malformed email), authentication should be rejected with an appropriate error message.

**Validates: Requirements 1.2**

**Property 3: Registration creates complete user records**

*For any* valid registration data (email, password, display name), creating a new account should result in a user document in Firestore containing all required fields (uid, email, displayName, createdAt, role).

**Validates: Requirements 1.3, 15.3**

**Property 4: Logout terminates access**

*For any* authenticated user, logging out should terminate their session such that they can no longer access protected resources without re-authenticating.

**Validates: Requirements 1.4**

**Property 5: Protected routes enforce authentication**

*For any* protected route, attempting to access it without authentication should result in redirect to the authentication page, and accessing it with authentication should render the protected content.

**Validates: Requirements 1.5, 10.1, 10.3**

**Property 6: Profile updates persist to both systems**

*For any* authenticated user and any new display name, updating the profile should result in the display name being updated in both Firebase Auth and the Firestore user document.

**Validates: Requirements 1.6**

### Document Upload Properties

**Property 7: Supported file types are stored**

*For any* supported file type (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, JSON, CSV), uploading a file of that type should result in the file being stored in Firebase Storage with a unique path.

**Validates: Requirements 2.1, 15.1**

**Property 8: Upload metadata is complete**

*For any* uploaded file, the Firestore metadata document should contain all required fields (name, URL, size, type, uploadedAt, uploadedBy) and optional description if provided.

**Validates: Requirements 2.2, 2.7**

**Property 9: User files are isolated**

*For any* user, querying their uploaded files should return only files where uploadedBy matches their user ID.

**Validates: Requirements 2.4**

**Property 10: File deletion is complete**

*For any* uploaded file, deleting it should result in removal from both Firebase Storage and Firestore, such that subsequent queries do not return the file.

**Validates: Requirements 2.5, 15.5**

**Property 11: File sizes are formatted correctly**

*For any* byte value, formatting it as a file size should produce a human-readable string with appropriate units (Bytes, KB, MB, GB) and reasonable precision.

**Validates: Requirements 2.6, 11.6**

### Text Extraction Properties

**Property 12: Text file extraction preserves content**

*For any* text file (TXT, MD, JSON, CSV) with UTF-8 content, extracting text from the file should return content that matches the original file content.

**Validates: Requirements 3.1, 11.1**

**Property 13: PDF extraction captures all pages**

*For any* PDF file with text content across multiple pages, extracting text should return content from all pages combined.

**Validates: Requirements 3.2**

**Property 14: Word document extraction preserves text**

*For any* Word document (DOC, DOCX) with text content, extracting text should return the raw text content from the document.

**Validates: Requirements 3.3**

**Property 15: Excel extraction includes all sheets**

*For any* Excel file (XLS, XLSX) with multiple sheets, extracting data should return content from all sheets in CSV format with sheet name headers.

**Validates: Requirements 3.4**

**Property 16: Extraction errors are reported**

*For any* corrupted or invalid file, attempting text extraction should return an error message indicating the failure reason.

**Validates: Requirements 3.5, 8.5**

**Property 17: Multi-file extraction includes headers**

*For any* set of multiple files, extracting and combining their content should include file name headers for each file's content.

**Validates: Requirements 3.6**

**Property 18: Content truncation is indicated**

*For any* extracted content exceeding the length limit (8000 characters), the content should be truncated to the limit and include an indicator of truncation.

**Validates: Requirements 3.7, 4.6**

**Property 19: Base64 encoding round-trip**

*For any* binary file, encoding it to base64 and then decoding should produce content equivalent to the original file.

**Validates: Requirements 11.2**

### Search Properties

**Property 20: Search includes document context**

*For any* search query with attached documents, the AI request should include the extracted text from all attached documents in the context.

**Validates: Requirements 4.1**

**Property 21: Domain-specific system prompt is used**

*For any* search query, the OpenAI API call should include a system prompt specific to the Ministry of Education domain.

**Validates: Requirements 4.2**

**Property 22: Search response is complete**

*For any* successful search, the response should include the AI-generated response text, the original query, and the count of attached files.

**Validates: Requirements 4.3, 9.7**

**Property 23: API errors are handled gracefully**

*For any* OpenAI API error or unavailability, the system should return an appropriate error message to the user without crashing.

**Validates: Requirements 4.4, 9.6**

**Property 24: Search creates history and notification**

*For any* successfully completed search, both a search history entry and a notification should be created in Firestore.

**Validates: Requirements 4.7, 5.1, 7.2**

### Search History Properties

**Property 25: History entries are ordered by recency**

*For any* user with multiple search history entries, retrieving their history should return entries ordered by timestamp in descending order (most recent first).

**Validates: Requirements 5.2**

**Property 26: History results are limited**

*For any* user with more than the maximum number of history entries (default 50), retrieving their history should return at most the maximum number of entries.

**Validates: Requirements 5.3**

**Property 27: History deletion removes entry**

*For any* search history entry, deleting it should result in the entry no longer appearing in Firestore or in subsequent history queries.

**Validates: Requirements 5.4**

**Property 28: History search filters correctly**

*For any* search term and user history, filtering history by the search term should return only entries where the query or response text contains the search term (case-insensitive).

**Validates: Requirements 5.5**

**Property 29: User statistics are accurate**

*For any* user, calculating their statistics should return correct counts for total searches, searches this week, and searches this month based on timestamp filtering.

**Validates: Requirements 5.7**

### Analytics Properties

**Property 30: Dashboard aggregations are correct**

*For any* user, the dashboard should display accurate counts for total searches, total uploads, and active users based on Firestore data.

**Validates: Requirements 6.1**

**Property 31: Weekly trends are calculated correctly**

*For any* current week activity count and previous week activity count, the percentage change should be calculated as ((current - previous) / previous) * 100, with special handling for zero previous activity.

**Validates: Requirements 6.2**

**Property 32: Chart data covers correct time range**

*For any* user, generating chart data should provide daily counts of searches and uploads for each of the last 7 days.

**Validates: Requirements 6.3**

**Property 33: Recent activity is merged and sorted**

*For any* user, retrieving recent activity should combine searches and uploads, sort them by timestamp in descending order, and limit to the configured maximum.

**Validates: Requirements 6.4**

**Property 34: Timestamps are formatted consistently**

*For any* timestamp, formatting it should produce a relative time string (e.g., "5m ago", "2h ago", "3d ago") for recent times, with appropriate formatting for older timestamps.

**Validates: Requirements 5.6, 6.6, 7.8**

### Notification Properties

**Property 35: Upload notifications are created**

*For any* successfully processed document, a notification should be created with type 'upload' and a message containing the document name.

**Validates: Requirements 2.3, 7.1**

**Property 36: Search notifications include truncated query**

*For any* completed search, a notification should be created with the query text, truncated to 50 characters if the query is longer.

**Validates: Requirements 7.2**

**Property 37: Notifications are ordered by recency**

*For any* user with multiple notifications, retrieving their notifications should return entries ordered by timestamp in descending order (most recent first).

**Validates: Requirements 7.3**

**Property 38: Mark as read updates status**

*For any* notification, marking it as read should update the read field to true in Firestore.

**Validates: Requirements 7.4**

**Property 39: Mark all as read updates all unread**

*For any* user with multiple unread notifications, marking all as read should update all notifications where read=false to read=true.

**Validates: Requirements 7.5**

**Property 40: Notification deletion removes entry**

*For any* notification, deleting it should result in the notification no longer appearing in Firestore or in subsequent queries.

**Validates: Requirements 7.6**

**Property 41: Unread count is accurate**

*For any* user, counting unread notifications should return the number of notifications where read=false.

**Validates: Requirements 7.7**

### API Properties

**Property 42: API extracts text from PDFs**

*For any* base64-encoded PDF file sent to the extraction API, the response should contain text extracted from all pages.

**Validates: Requirements 8.1**

**Property 43: API extracts text from Word documents**

*For any* base64-encoded Word document sent to the extraction API, the response should contain the raw text content.

**Validates: Requirements 8.2**

**Property 44: API extracts data from Excel files**

*For any* base64-encoded Excel file sent to the extraction API, the response should contain data from all sheets with sheet name headers.

**Validates: Requirements 8.3**

**Property 45: API rejects unsupported file types**

*For any* unsupported file type sent to the extraction API, the response should be an error indicating the unsupported type.

**Validates: Requirements 8.4**

**Property 46: API validates required parameters**

*For any* API request missing required parameters, the response should be a 400 error with information about parameter requirements.

**Validates: Requirements 8.6, 9.1**

**Property 47: Search API handles file data flexibly**

*For any* search request with files, the API should correctly process files whether they provide URLs or direct content.

**Validates: Requirements 9.3**

**Property 48: Search API uses correct OpenAI configuration**

*For any* search request, the OpenAI API call should use model gpt-4o-mini with temperature 0.7 and max tokens 1500.

**Validates: Requirements 9.4**

### File Operations Properties

**Property 49: File type validation is correct**

*For any* filename, validating whether it's a supported type should return true only if the extension is in the list of supported extensions (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, JSON, CSV).

**Validates: Requirements 11.5**

**Property 50: File reading errors are reported**

*For any* file reading operation that fails, the promise should be rejected with an error message describing the failure.

**Validates: Requirements 11.4**

### Data Synchronization Properties

**Property 51: Search triggers dashboard refresh**

*For any* completed search, the dashboard statistics and chart data should be reloaded to reflect the new search.

**Validates: Requirements 12.1**

**Property 52: UI updates reflect data changes immediately**

*For any* data modification (upload, delete), the UI should update to reflect the change without requiring a page refresh.

**Validates: Requirements 12.2, 12.3**

**Property 53: History deletion updates statistics**

*For any* deleted history item, the user statistics should be recalculated to reflect the deletion.

**Validates: Requirements 12.4**

### Error Handling Properties

**Property 54: Errors display user-friendly messages**

*For any* error that occurs during operations, the system should display a user-friendly error message without breaking the UI.

**Validates: Requirements 13.2, 13.5**

**Property 55: Network errors provide specific guidance**

*For any* network error when connecting to OpenAI, the error message should provide specific guidance about connectivity issues.

**Validates: Requirements 13.3**

### Data Persistence Properties

**Property 56: Metadata is saved to correct collections**

*For any* data-modifying operation, the metadata should be saved to the appropriate Firestore collection (uploads, searchHistory, notifications, users).

**Validates: Requirements 15.2**

**Property 57: Profile updates are partial**

*For any* user profile update, only the specified fields should be modified while other fields remain unchanged.

**Validates: Requirements 15.4**

## Error Handling

### Client-Side Error Handling

**Authentication Errors**
- Invalid credentials: Display clear error message indicating authentication failure
- Network errors: Inform user of connectivity issues and suggest retry
- Session expiration: Redirect to login with message about expired session

**Upload Errors**
- Unsupported file type: Display list of supported formats
- File too large: Inform user of size limit
- Storage errors: Display generic error and suggest retry
- Network errors: Inform user and allow retry

**Search Errors**
- No query provided: Prompt user to enter a query
- No files selected: Allow search without files (general query)
- API timeout: Inform user and suggest retry with fewer/smaller files
- API error: Display user-friendly error message
- Extraction failure: Inform user which files failed to process

**Data Loading Errors**
- Firestore errors: Display error and offer retry
- Missing indexes: Fall back to client-side operations with warning
- Network errors: Display cached data if available, otherwise show error

### Server-Side Error Handling

**API Function Errors**
- Missing parameters: Return 400 with parameter requirements
- Invalid file data: Return 400 with validation error
- Extraction failures: Return 500 with error details
- OpenAI API errors: Log error, return generic failure message
- Timeout errors: Return 504 with timeout message
- Configuration errors: Return 500 with configuration issue message

**Error Logging**
- Log all server-side errors with context (user ID, operation, timestamp)
- Log OpenAI API errors with request details (excluding sensitive data)
- Log extraction failures with file type and error details

### Error Recovery Strategies

**Retry Logic**
- Implement exponential backoff for transient failures
- Allow user-initiated retry for failed operations
- Automatic retry for network errors (up to 3 attempts)

**Graceful Degradation**
- Fall back to client-side operations when Firestore indexes are missing
- Continue with cached data when real-time updates fail
- Allow search without files if file processing fails

**User Feedback**
- Always provide clear, actionable error messages
- Include suggestions for resolution when possible
- Display loading indicators during operations
- Show success confirmations for completed operations

## Testing Strategy

### Dual Testing Approach

The DeepFetch AI platform requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific authentication scenarios (valid login, invalid password, etc.)
- Edge cases in file size formatting (0 bytes, exactly 1024 bytes, etc.)
- Error conditions (network failures, invalid inputs, etc.)
- Integration points between components
- UI component rendering and interactions

**Property Tests**: Verify universal properties across all inputs
- Authentication works for all valid credential combinations
- File operations maintain data consistency across all file types
- Text extraction preserves content for all valid files
- Search functionality works correctly for all query types
- Data persistence maintains integrity for all operations

Both testing approaches are complementary and necessary. Unit tests catch specific bugs and validate concrete scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Testing Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: deepfetch-ai-platform, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: deepfetch-ai-platform, Property 11: File sizes are formatted correctly
test('Property 11: File sizes are formatted correctly', () => {
  fc.assert(
    fc.property(
      fc.nat(), // Generate random byte values
      (bytes) => {
        const formatted = formatFileSize(bytes);
        // Verify format is correct
        expect(formatted).toMatch(/^\d+(\.\d+)?\s+(Bytes|KB|MB|GB)$/);
        // Verify value is reasonable
        if (bytes < 1024) {
          expect(formatted).toContain('Bytes');
        } else if (bytes < 1024 * 1024) {
          expect(formatted).toContain('KB');
        }
        // ... more assertions
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Areas

**Authentication Tests**
- Unit: Specific login scenarios, registration validation, logout behavior
- Property: All valid credentials authenticate, all invalid credentials reject

**Upload Tests**
- Unit: Specific file types, size limits, metadata validation
- Property: All supported file types upload successfully, metadata is always complete

**Text Extraction Tests**
- Unit: Specific document formats, edge cases (empty files, large files)
- Property: Extraction preserves content for all valid files, errors are reported for invalid files

**Search Tests**
- Unit: Specific queries, file combinations, error scenarios
- Property: All searches create history and notifications, responses are always complete

**History Tests**
- Unit: Specific filtering scenarios, deletion, statistics calculation
- Property: History is always ordered correctly, filtering works for all search terms

**Analytics Tests**
- Unit: Specific date ranges, edge cases (no data, single data point)
- Property: Aggregations are correct for all data sets, trends calculate correctly

**Notification Tests**
- Unit: Specific notification types, read/unread states
- Property: Notifications are created for all events, ordering is always correct

**API Tests**
- Unit: Specific file types, error conditions, timeout scenarios
- Property: All supported file types are processed correctly, all errors are handled

**Data Persistence Tests**
- Unit: Specific CRUD operations, collection structure
- Property: All operations maintain data consistency, deletions are complete

### Integration Testing

**End-to-End Flows**
- Complete user journey: Register → Login → Upload → Search → View History
- Error recovery: Failed upload → Retry → Success
- Multi-user scenarios: Data isolation between users

**Firebase Integration**
- Authentication flow with Firebase Auth
- Data persistence with Firestore
- File storage with Firebase Storage
- Cloud Functions execution

**External API Integration**
- OpenAI API calls with various query types
- Error handling for API failures
- Timeout handling for slow responses

### Testing Best Practices

**Property Test Design**
- Focus on invariants that should always hold
- Use appropriate generators for test data
- Verify both positive and negative cases
- Test round-trip properties for serialization/deserialization

**Unit Test Design**
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Test edge cases explicitly

**Test Data Management**
- Use Firebase Emulator Suite for local testing
- Clean up test data after each test
- Use realistic test data that matches production patterns
- Avoid hardcoded test data when possible

**Continuous Testing**
- Run tests on every commit
- Maintain high test coverage (>80%)
- Monitor test execution time
- Fix flaky tests immediately

