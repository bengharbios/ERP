# HR Module Enhancement - Global Standards

## Summary
Significantly enhanced the HR module by implementing a comprehensive "Global Standard" Employee Profile and a Leave Management system.

## Key Changes

### 1. Employee Profile (`/employees/:id`)
-   **Rich Interface**: Implemented a modern, tabbed profile view.
-   **Data Sections**:
    -   **Overview**: Key stats, contact info, document alerts.
    -   **Personal**: Identity documents, nationality, emergency contacts.
    -   **Employment**: Job title, department, contract details, joining dates.
    -   **Financial**: Salary breakdown (Basic, Allowances, Deductions), bank details.
    -   **Documents**: Visual grid of employee documents with expiry status.
    -   **Assets**: Table of assigned assets and their status.
-   **Backend**: Added `getEmployeeById` endpoint to fetch deep nested data efficiently.

### 2. Leave Management (`/leaves`)
-   **Admin Dashboard**: Dedicated page for managing leave requests.
-   **Features**:
    -   **Stats Grid**: Quick view of Pending, Approved, and Rejected requests.
    -   **Filtering**: Filter requests by status.
    -   **Actions**: Approve or Reject requests with optional comments.
    -   **Visuals**: Status badges and clean table layout.

### 3. Navigation & Integration
-   **Sidebar**: Added shortcuts to "Leaves" under HR section.
-   **Employee List**: Updated "folder" icon and "Full Profile" buttons to navigate to the new profile page.

## Next Steps
1.  **File Uploads**: Implement `multer` backend and frontend upload component for documents.
2.  **Performance Reviews**: Implement the UI for creating and viewing performance reviews.
3.  **Payroll Calculation**: Implement the logic to auto-calculate payroll based on attendance and salary config.
