________________________________________
CASA Motor Valuers & Assessors Dashboard Documentation
This document provides a detailed overview of the Admin, Client, and Valuer dashboards. It explains roles, permissions, workflows, and core functionalities for effective use of the CASA Motor Valuers & Assessors platform.
________________________________________
1. Admin Dashboard (/admin/dashboard)
The Admin Dashboard is the control center for managing the entire valuation system. It supports a two-tiered administrative structure: Super Admin and Admin.
1.1 Roles & Permissions
•	Super Admin (Full Access):
o	Create, edit, and delete all user types (Institutions, Staff, Valuers).
o	Promote staff members to Admin role.
o	Activate/deactivate any account.
o	Manage company branches.
o	Full access to bookings, reports, and valuation lifecycle.
•	Admin (Limited Access):
o	Manage the booking and valuation workflows.
o	Cannot register new staff, promote staff, or change staff account status.
1.2 Key Features & Workflow
Dashboard Home
•	Statistics Cards: Quick overview of system activity:
o	Pending Approval
o	Pending Valuation
o	Valuated
o	Completed (Approved)
o	Rejected
o	Total Valuers
•	Completed Cars Table: Searchable, sortable, newest-first list of finalized bookings.
o	Search by plate number, booking ID, or customer name.
o	Quick actions: Open Booking Report and Valuation Report in new tabs.
•	Notifications Center: Bell icon in header displays new pending approvals with direct navigation.
User Management (Sidebar)
•	Institutions: Manage client companies (e.g., insurers, banks).
•	Staff: Manage internal team members.
o	Super Admin-only actions:
	Status Toggle (Active/Inactive).
	Promote to Admin (set initial password → create Firebase account → assign Admin privileges).
•	Branches: Add or delete company branches.
Booking & Valuation Lifecycle
1.	New Bookings (Pending Approval)
o	Review and approve or reject new requests.
o	Approve → Assign valuer via dropdown.
o	Reject → Provide rejection reason.
2.	Pending Valuations
o	Track bookings currently with valuers.
o	No direct actions, serves as monitoring.
3.	Valuated Bookings
o	Review valuer-submitted reports and media.
o	Complete valuation by entering final official figures:
	Assessment Value
	Forced Sale Value
	Other financial metrics
o	Status updates to Completed.
4.	Completed Valuations
o	Historical archive of finalized bookings.
o	Reports accessible and downloadable.
5.	Rejected Bookings
o	Historical record of rejected requests with reasons.
________________________________________
2. Client Dashboard (/client/dashboard)
The Client Dashboard enables institutions (e.g., insurance companies) to request, track, and manage vehicle valuations.
2.1 Roles & Permissions
•	Client (Main Account)
o	Institution’s primary account.
o	Can manage agents, staff, and customer lists.
o	Full visibility of institution’s bookings and reports.
•	Agent / Staff (Sub-accounts)
o	Created by the Client.
o	Limited to creating and managing bookings only.
o	Cannot manage users.
2.2 Key Features
•	Dashboard Home
o	Booking statistics (Pending, Completed, Rejected, etc.).
o	Table summarizing all booked vehicles.
•	New Booking
o	Comprehensive booking form for vehicle valuation requests.
o	Captures: customer details, vehicle details, insurance/policy information.
•	User Management (Main Client only)
o	Customers: Manage database of vehicle owners.
o	Agents: Create/manage agent sub-accounts.
o	Staff: Manage internal staff accounts.
•	Booking Views
o	Filtered tables: Pending, Completed, Rejected.
•	Reports
o	Clients can view, download, and print Booking Reports (Assessment Authorization Letters).
________________________________________
3. Valuer Dashboard (/valuer/dashboard)
The Valuer Dashboard provides valuers with a focused workspace for assigned valuation tasks.
3.1 Key Features
•	Personalized Task List: Valuers only see bookings explicitly assigned to them.
•	Sorted Workflow Table ("All Cars")
1.	Pending Valuation (New tasks)
2.	Valuated (Submitted, awaiting admin approval)
3.	Completed (Approved valuations)
4.	Rejected (Rejected tasks with feedback)
3.2 Workflow
1.	Login: Secure login with unique credentials.
2.	View Assignments: Bookings sorted by priority (newest at top).
3.	Perform Valuation:
o	Click Valuate on a Pending booking.
o	System opens detailed booking view.
o	Required inputs:
	Date of Assessment (future/present only).
	Vehicle photos (multiple uploads supported).
	Comments / Observations.
4.	Submit Report:
o	Submission changes booking status to Valuated.
o	Booking moves to "awaiting admin approval."
________________________________________
4. System-Wide Features
•	Authentication: Firebase Authentication for secure logins across all dashboards.
•	Role-Based Access: Permissions enforced at the role level (Super Admin, Admin, Client, Agent/Staff, Valuer).
•	Search & Filters: Available in all tables for quick navigation.
•	Reports: Booking and Valuation reports are standardized, printable, and downloadable in PDF format.
•	Audit Trail (optional extension): Logs actions by user role for accountability.
________________________________________
