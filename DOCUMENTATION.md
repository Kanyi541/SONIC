
# CASA Motor Valuers & Assessors Dashboard Documentation

This document provides a comprehensive overview of the functionalities and workflows for the Admin, Client, and Valuer dashboards.

---

## 1. Admin Dashboard (`/admin/dashboard`)

The Admin Dashboard is the central control panel for managing the entire application, from user accounts to the full valuation lifecycle. It features a two-tiered admin system: **Super Admin** and **Admin**.

### 1.1. Roles and Permissions

-   **Super Admin**: The primary administrator account. This role has unrestricted access to all features, including:
    -   Adding, managing, and deleting all user types (Institutions, Staff, Valuers).
    -   Promoting staff members to the "Admin" role.
    -   Activating or deactivating any user account.
    -   Managing company branches.
    -   Full access to all booking and valuation workflows.

-   **Admin**: A promoted staff member with limited administrative privileges. An Admin **cannot**:
    -   Register new staff members.
    -   Promote other staff to Admins.
    -   Change the active/inactive status of any staff member.
    They **can** manage the core booking and valuation workflows.

### 1.2. Key Features & Workflow

#### **Dashboard Home**

-   **At-a-Glance Statistics**: Displays key metrics like "Pending Approval," "Pending Valuation," "Valuated," "Approved," "Rejected," and "Total Valuers." These cards act as quick links to the respective tables.
-   **All Completed Cars Table**: A searchable and sortable list of all bookings with a "Completed" status. It is sorted by the newest first.
    -   **Search**: Filter cars by plate number, booking ID, or customer name.
    -   **Actions**: Each row has a button to view the associated **Booking Report** and **Valuation Report** in a new tab.
-   **Notifications**: A bell icon in the header shows a count of new bookings awaiting approval and provides quick links to them.

#### **User Management (Sidebar)**

-   **Institutions**: Manage client companies (e.g., insurance firms, banks).
-   **Staff**: Manage internal staff members.
    -   **Status Switch**: A Super Admin can toggle a staff member's account between "Active" and "Inactive."
    -   **Promote to Admin (Super Admin only)**: A Super Admin can click "Promote" on a staff member. This opens a dialog to set an initial password, which creates an account in Firebase Authentication and grants them "Admin" privileges.
-   **Branches**: Add or delete company branches.

#### **Booking & Valuation Workflow**

This workflow is accessed via the statistic cards on the dashboard home.

1.  **New Bookings (`Pending Approval`)**
    -   Admin reviews new booking requests.
    -   Action: Clicks **"Assign & Approve"**.
    -   In the dialog, the Admin selects an active valuer from a dropdown list and confirms the assignment. The booking status changes to **"Pending Valuation"**.
    -   Alternatively, the Admin can reject the booking, providing a reason.

2.  **Pending Valuations (`Pending Valuation`)**
    -   This view shows all bookings currently assigned to valuers. It's a monitoring step for the admin.

3.  **Valuated Bookings (`Valuated`)**
    -   This table lists submissions received from valuers.
    -   Action: Clicks **"Complete Valuation"**.
    -   In the dialog, the Admin reviews the valuer's submitted photos and comments, then enters the final official values (Assessment Value, Forced Sale Value, etc.).
    -   Upon saving, the booking status changes to **"Completed"**.

4.  **All Valuations / Approved Bookings (`Completed`)**
    -   Shows a history of all finalized and approved valuations. Reports can be accessed from here.

5.  **Rejected Bookings (`Rejected`)**
    -   Shows a history of all bookings that were rejected by the admin.

---

## 2. Client Dashboard (`/client/dashboard`)

This dashboard is for institutions (e.g., insurance companies) and their agents/staff to manage their valuation requests.

### 2.1. Roles and Permissions

-   **Client (Main Account)**: The primary account for the institution. Can manage their own staff and agents.
-   **Agent/Staff**: Sub-accounts created by the Client. They can create new bookings on behalf of the institution but cannot manage other users.

### 2.2. Key Features

-   **Dashboard Home**: Provides statistics on the institution's bookings (Pending, Approved, Rejected, etc.). The main table shows a summary of all cars booked by the institution.
-   **New Booking**: A primary action to open a detailed form and create a new valuation request.
-   **User Management (Main Client Account only)**:
    -   **Customers**: Manage a list of their customers (the vehicle owners).
    -   **Agents**: Create and manage agent sub-accounts.
    -   **Staff**: Create and manage internal staff sub-accounts.
-   **Booking Views**: Tables to view bookings based on their status (Pending, Completed, Rejected).
-   **View Report**: Clients can view and print the official **Booking Report** (Assessment Authorization Letter) for any of their bookings.

---

## 3. Valuer Dashboard (`/valuer/dashboard`)

This dashboard is a streamlined interface for valuers to manage and submit their assigned valuation reports.

### 3.1. Core Functionality

-   **Personalized View**: A valuer can **only** see bookings that have been explicitly assigned to them by an admin.
-   **Sorted Task List**: The main table, "All Cars," is sorted by status to prioritize work:
    1.  `Pending Valuation` (New assignments)
    2.  `Valuated` (Submitted, awaiting admin approval)
    3.  `Completed` (Approved by admin)
    4.  `Rejected` (Rejected by admin)

### 3.2. Workflow

1.  **Log In**: The valuer logs in with their unique username and password.
2.  **View Assignments**: The dashboard displays all assigned bookings, with new assignments at the top.
3.  **Perform Valuation**: The valuer clicks the **"Valuate"** button for a "Pending Valuation" booking.
4.  **Fill Valuation Form**: A dialog appears showing all relevant booking details (customer, vehicle, policy, etc.). The valuer must:
    -   Select the **Date of Assessment** (cannot be a past date).
    -   Upload one or more photos of the vehicle.
    -   Add any relevant comments.
5.  **Submit**: Upon submission, the report is sent to the admin for approval, and the booking status changes to **"Valuated"**. The booking moves down the priority list on the valuer's dashboard.
