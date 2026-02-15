# Requirements Document

## Introduction

DeepFetch AI is an AI-powered document search and analysis platform designed for the Department of Higher Education under the Ministry of Education (MoE), India. The system enables officials to upload various document types, perform AI-powered searches across uploaded documents, track search history, view analytics, and receive real-time notifications. The platform provides a comprehensive dashboard with statistics, charts, and system monitoring capabilities.

## Glossary

- **System**: The DeepFetch AI platform
- **User**: An authenticated individual using the platform
- **Document**: Any uploaded file (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, JSON, CSV)
- **Search_Query**: A text-based question or request submitted by a user
- **AI_Assistant**: The OpenAI-powered service that processes search queries
- **Upload**: The process of storing a document in the system
- **Search_History**: A record of past search queries and their responses
- **Notification**: A system-generated message informing users of events
- **Dashboard**: The main interface displaying statistics and analytics
- **Firebase**: The backend service providing authentication and storage
- **Extraction**: The process of converting document content to searchable text

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely authenticate with the system, so that I can access my documents and search history.

#### Acceptance Criteria

1. WHEN a user provides valid email and password credentials, THE System SHALL authenticate the user and grant access
2. WHEN a user provides invalid credentials, THE System SHALL reject authentication and display an error message
3. WHEN a new user registers with email, password, and display name, THE System SHALL create a user account and store user data
4. WHEN an authenticated user logs out, THE System SHALL terminate the session and redirect to the login page
5. WHEN an unauthenticated user attempts to access protected routes, THE System SHALL redirect to the authentication page
6. WHEN a user updates their profile display name, THE System SHALL persist the change to both Firebase Auth and Firestore

### Requirement 2: Document Upload and Management

**User Story:** As a user, I want to upload and manage various document types, so that I can search across my document collection.

#### Acceptance Criteria

1. WHEN a user uploads a supported file type (PDF, DOC, DOCX, XLS, XLSX, TXT, MD, JSON, CSV), THE System SHALL store the file in Firebase Storage
2. WHEN a file is uploaded, THE System SHALL save file metadata (name, URL, size, type, upload timestamp, uploader ID, description) to Firestore
3. WHEN a file upload completes, THE System SHALL create a notification for the user
4. WHEN a user requests their uploaded files, THE System SHALL retrieve and display all files uploaded by that user
5. WHEN a user deletes a file, THE System SHALL remove the file from both Firebase Storage and Firestore
6. WHEN displaying file information, THE System SHALL format file sizes in human-readable units (Bytes, KB, MB, GB)
7. WHEN a user provides an optional description during upload, THE System SHALL store and display the description with the file metadata

### Requirement 3: Document Text Extraction

**User Story:** As a user, I want the system to extract text from my uploaded documents, so that the AI can search and analyze the content.

#### Acceptance Criteria

1. WHEN a text file (TXT, MD, JSON, CSV) is processed, THE System SHALL read the content directly as UTF-8 text
2. WHEN a PDF file is processed, THE System SHALL extract text from all pages using PDF parsing
3. WHEN a Word document (DOC, DOCX) is processed, THE System SHALL extract raw text content
4. WHEN an Excel file (XLS, XLSX) is processed, THE System SHALL extract data from all sheets in CSV format
5. WHEN text extraction fails, THE System SHALL return an error message indicating the failure
6. WHEN processing multiple files, THE System SHALL combine extracted content with file name headers
7. WHEN extracted content exceeds length limits, THE System SHALL truncate the content and indicate truncation

### Requirement 4: AI-Powered Search

**User Story:** As a user, I want to search across my documents using natural language queries, so that I can quickly find relevant information.

#### Acceptance Criteria

1. WHEN a user submits a search query with attached documents, THE System SHALL extract text from the documents and include it in the AI context
2. WHEN the AI processes a query, THE System SHALL use a system prompt specific to the Ministry of Education domain
3. WHEN the AI generates a response, THE System SHALL return the response along with query metadata (query text, number of files attached)
4. WHEN the OpenAI API is unavailable or returns an error, THE System SHALL return an appropriate error message to the user
5. WHEN a search request times out after 30 seconds, THE System SHALL abort the request and return a timeout error
6. WHEN file content is included in the search, THE System SHALL truncate content to 8000 characters to avoid token limits
7. WHEN a search completes successfully, THE System SHALL save the search to history and create a notification

### Requirement 5: Search History Management

**User Story:** As a user, I want to view and manage my search history, so that I can reference past queries and results.

#### Acceptance Criteria

1. WHEN a search completes, THE System SHALL save the query, response, attached file names, and timestamp to Firestore
2. WHEN a user requests their search history, THE System SHALL retrieve and display searches ordered by timestamp (most recent first)
3. WHEN retrieving search history, THE System SHALL limit results to a configurable maximum (default 50 items)
4. WHEN a user deletes a history item, THE System SHALL remove it from Firestore
5. WHEN a user searches within their history, THE System SHALL filter results by matching query or response text (case-insensitive)
6. WHEN displaying timestamps, THE System SHALL format them as relative time (e.g., "5 minutes ago", "2 hours ago", "3 days ago")
7. WHEN calculating user statistics, THE System SHALL count total searches, searches this week, and searches this month

### Requirement 6: Analytics and Dashboard

**User Story:** As a user, I want to view analytics and statistics about my usage, so that I can understand my search and upload patterns.

#### Acceptance Criteria

1. WHEN a user views the dashboard, THE System SHALL display total searches, total uploads, and active users count
2. WHEN calculating weekly trends, THE System SHALL compare current week activity to previous week and display percentage change
3. WHEN generating chart data, THE System SHALL provide daily counts of searches and uploads for the last 7 days
4. WHEN retrieving recent activity, THE System SHALL combine searches and uploads, sort by timestamp, and limit to a configurable maximum
5. WHEN a Firestore index is missing, THE System SHALL fall back to client-side sorting and filtering
6. WHEN displaying activity timestamps, THE System SHALL format them in a compact format (e.g., "5m ago", "2h ago", "3d ago")
7. WHEN calculating trends with zero previous activity, THE System SHALL display 100% increase if current activity exists, otherwise 0%

### Requirement 7: Notification System

**User Story:** As a user, I want to receive notifications about system events, so that I stay informed about document processing and search completion.

#### Acceptance Criteria

1. WHEN a document is successfully processed, THE System SHALL create a success notification with the document name
2. WHEN a search completes, THE System SHALL create a notification with the query text (truncated to 50 characters if longer)
3. WHEN a user requests their notifications, THE System SHALL retrieve notifications ordered by timestamp (most recent first)
4. WHEN a user marks a notification as read, THE System SHALL update the read status in Firestore
5. WHEN a user marks all notifications as read, THE System SHALL update all unread notifications for that user
6. WHEN a user deletes a notification, THE System SHALL remove it from Firestore
7. WHEN counting unread notifications, THE System SHALL query for notifications where read equals false
8. WHEN displaying notification timestamps, THE System SHALL format them as relative time with full date for older items

### Requirement 8: File Processing API

**User Story:** As a developer, I want a server-side API to extract text from binary files, so that the system can process documents that cannot be read in the browser.

#### Acceptance Criteria

1. WHEN the API receives a base64-encoded PDF file, THE System SHALL extract text from all pages and return the combined text
2. WHEN the API receives a base64-encoded Word document, THE System SHALL extract raw text content
3. WHEN the API receives a base64-encoded Excel file, THE System SHALL extract data from all sheets with sheet name headers
4. WHEN the API receives an unsupported file type, THE System SHALL return an error indicating the unsupported type
5. WHEN text extraction fails, THE System SHALL return an error with the failure reason
6. WHEN the API request is missing required parameters, THE System SHALL return a 400 error with parameter requirements

### Requirement 9: Search API

**User Story:** As a developer, I want a server-side API to process search queries with AI, so that users can get intelligent responses to their questions.

#### Acceptance Criteria

1. WHEN the API receives a search request without query or files, THE System SHALL return a 400 error
2. WHEN the OpenAI API key is not configured, THE System SHALL return a 500 error indicating missing configuration
3. WHEN processing file data, THE System SHALL extract text from URLs or use provided content
4. WHEN calling OpenAI, THE System SHALL use the gpt-4o-mini model with temperature 0.7 and max tokens 1500
5. WHEN the OpenAI request times out after 30 seconds, THE System SHALL abort and return a 504 timeout error
6. WHEN the OpenAI API returns an error, THE System SHALL log the error and return a generic failure message
7. WHEN the AI generates a response, THE System SHALL return success status, response text, query, and file count

### Requirement 10: Protected Routes

**User Story:** As a system administrator, I want to ensure only authenticated users can access protected features, so that user data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE System SHALL display the authentication wrapper
2. WHEN authentication state is loading, THE System SHALL display a loading indicator
3. WHEN a user is authenticated, THE System SHALL render the protected content
4. WHEN Firebase is not initialized, THE System SHALL handle the error gracefully and stop loading

### Requirement 11: Client-Side File Reading

**User Story:** As a user, I want the system to read text files directly in my browser, so that searches are faster and don't require server uploads.

#### Acceptance Criteria

1. WHEN reading a text file (TXT, MD, JSON, CSV), THE System SHALL use FileReader to read content as UTF-8 text
2. WHEN reading a binary file for server processing, THE System SHALL convert to base64 encoding
3. WHEN reading a file as ArrayBuffer, THE System SHALL return the binary data for further processing
4. WHEN file reading fails, THE System SHALL reject the promise with an error message
5. WHEN checking file type support, THE System SHALL validate against the list of supported extensions
6. WHEN formatting file sizes, THE System SHALL convert bytes to appropriate units (Bytes, KB, MB, GB)

### Requirement 12: Real-Time Data Synchronization

**User Story:** As a user, I want my dashboard to reflect real-time changes, so that I see up-to-date statistics after performing actions.

#### Acceptance Criteria

1. WHEN a user completes a search, THE System SHALL reload dashboard statistics and chart data
2. WHEN a user uploads a file, THE System SHALL update the uploads list immediately
3. WHEN a user deletes a file, THE System SHALL remove it from the display without page refresh
4. WHEN a user deletes a history item, THE System SHALL update statistics to reflect the change
5. WHEN loading data fails, THE System SHALL log the error and continue with cached or default data

### Requirement 13: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and loading indicators, so that I understand what the system is doing and when issues occur.

#### Acceptance Criteria

1. WHEN an operation is in progress, THE System SHALL display a loading indicator
2. WHEN an error occurs, THE System SHALL display a user-friendly error message
3. WHEN a network error occurs connecting to OpenAI, THE System SHALL provide specific guidance about connectivity issues
4. WHEN Firebase is not initialized, THE System SHALL throw an error with a clear message
5. WHEN file operations fail, THE System SHALL display the error without breaking the UI
6. WHEN search history cannot be loaded due to missing indexes, THE System SHALL fall back to client-side operations and log a warning

### Requirement 14: Responsive Design

**User Story:** As a user, I want the application to work on both desktop and mobile devices, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN viewing on mobile devices, THE System SHALL display a mobile-optimized header and navigation
2. WHEN viewing on desktop, THE System SHALL display a full sidebar and desktop layout
3. WHEN the viewport changes size, THE System SHALL adapt the layout responsively
4. WHEN displaying data tables or lists, THE System SHALL ensure horizontal scrolling or wrapping on small screens
5. WHEN displaying charts, THE System SHALL scale appropriately for the viewport size

### Requirement 15: Data Persistence and Storage

**User Story:** As a system administrator, I want all user data persisted reliably, so that users don't lose their work.

#### Acceptance Criteria

1. WHEN a user uploads a file, THE System SHALL store the file in Firebase Storage with a unique path
2. WHEN saving metadata, THE System SHALL use Firestore collections (uploads, searchHistory, notifications, users)
3. WHEN a user account is created, THE System SHALL save user data with uid, email, displayName, createdAt, and role
4. WHEN updating user profiles, THE System SHALL merge changes without overwriting other fields
5. WHEN deleting files, THE System SHALL remove both the storage object and Firestore document
6. WHEN querying data, THE System SHALL handle missing Firestore indexes by falling back to client-side operations
