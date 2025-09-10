________________________________________
CASA Motor Valuers & Assessors Dashboard Documentation
This document provides a comprehensive overview of the functionalities, workflows, and technical architecture for the Admin, Client, and Valuer dashboards.
________________________________________
1. Admin Dashboard (/admin/dashboard)
The Admin Dashboard is the central control panel for managing the system, user accounts, and the entire valuation lifecycle. It supports a two-tiered admin system: Super Admin and Admin.
1.1 Roles & Permissions
•	Super Admin (Full access):
o	Add, manage, and delete all user types (Institutions, Staff, Valuers).
o	Promote staff to Admin.
o	Activate/deactivate accounts.
o	Manage company branches.
o	Access and manage the full valuation lifecycle.
•	Admin (Limited access):
o	Manage bookings and valuation workflows.
o	Cannot register new staff, promote staff, or change account statuses.
1.2 Key Features & Workflows
Dashboard Home
•	Statistics Cards: Pending Approval, Pending Valuation, Valuated, Completed, Rejected, Total Valuers.
•	Completed Cars Table: Searchable and sortable (by plate, booking ID, customer).
•	Notifications: Bell icon with alerts for new pending approvals.
User Management
•	Institutions: Add/edit/delete client companies (e.g., insurers).
•	Staff: Manage staff profiles.
o	Super Admin can toggle Active/Inactive.
o	Super Admin can Promote to Admin → creates Firebase Auth account and assigns Admin privileges.
•	Valuers: Manage valuer accounts and statuses.
•	Branches: Manage company branches.
Booking & Valuation Lifecycle
1.	Pending Approval → Review new requests → Approve & Assign to valuer OR Reject with reason.
2.	Pending Valuation → Monitor bookings with valuers.
3.	Valuated → Review valuer’s submission → Enter official assessment values → Status → Completed.
4.	Completed → Historical archive of finalized valuations (reports downloadable).
5.	Rejected → Archive of declined requests.
________________________________________
2. Client Dashboard (/client/dashboard)
Used by institutions (e.g., insurers) and their agents to create and track valuation requests.
2.1 Roles & Permissions
•	Client (Main Account):
o	Manage staff, agents, and customer lists.
o	View all bookings and reports.
•	Agent/Staff (Sub-accounts):
o	Create bookings.
o	Cannot manage users.
2.2 Key Features
•	Dashboard Home: Statistics + all institution’s bookings.
•	New Booking: Comprehensive booking form.
•	User Management (Main Client only):
o	Customers
o	Agents
o	Staff
•	Booking Views: Pending, Completed, Rejected.
•	Reports: View/print Booking Report (Assessment Authorization Letter).
________________________________________
3. Valuer Dashboard (/valuer/dashboard)
A streamlined workspace for valuers to complete assigned tasks.
3.1 Key Features
•	Personalized view → Only see assigned bookings.
•	Sorted workflow table: Pending Valuation → Valuated → Completed → Rejected.
3.2 Workflow
1.	Login → Secure valuer credentials.
2.	Assignments → Sorted by priority (newest first).
3.	Valuation → Fill valuation form (Assessment Date, Photos, Comments).
4.	Submit → Status updates to Valuated → Sent to Admin for review.
________________________________________
4. Database Schema (Firestore)
The platform uses Google Firestore for structured, scalable data management.
4.1 bookings Collection
Stores all valuation booking requests.
Field	Type	Description
bookingNumber	string	Unique identifier (BKG-1757162046684-Q21CX).
customerName	string	Vehicle owner’s full name.
customerEmail	string	Vehicle owner’s email.
customerPhone	string	Vehicle owner’s phone number.
plateNumber	string	Vehicle registration plate.
carMake	string	Manufacturer (e.g., Toyota).
carModel	string	Model (e.g., Corolla).
policyNumber	string	Insurance policy number.
createdAt	timestamp	Date/time created.
status	string	One of: Pending Approval, Pending Valuation, Valuated, Completed, Rejected.
insurerId	string	Institution username (creator).
insurerName	string	Institution name.
authorisedBy	string	Agent/staff who created booking.
branch	string	Related branch.
comments	string	(Optional) Notes from booking agent.
assignedValuerId	string	(Optional) Assigned valuer username.
assignedValuerName	string	(Optional) Assigned valuer name.
assignmentDate	timestamp	(Optional) Date/time of assignment.
rejectionReason	string	(Optional) Reason for rejection.
________________________________________
4.2 valuations Collection
Stores valuation reports from valuers.
Field	Type	Description
bookingId	string	Reference to bookings doc.
assessmentDate	timestamp	Date assessed.
imageUrls	array	Uploaded photo URLs.
comments	string	Valuer’s comments.
valuedBy	string	Valuer’s name.
valuedAt	timestamp	Submission time.
status	string	Approved or Rejected.
assessmentValue	string	Admin-set official value.
forcedValue	string	Forced sale value.
wsValue	string	WS value.
rsValue	string	RS value.
rejectionReason	string	(Optional) Rejection explanation.
________________________________________
4.3 insurers Collection
Stores client institutions and their agents.
Field	Type	Description
name	string	Institution/agent name.
username	string	Unique login username.
email	string	Contact email.
phone	string	Contact phone.
password	string	Password (agents only; institutions use Firebase Auth).
active	boolean	Account status.
role	string	Agent if sub-account.
clientId	string	Parent institution username (for agents).
createdAt	timestamp	Date created.
________________________________________
4.4 valuers Collection
Stores valuer accounts.
Field	Type	Description
name	string	Valuer’s full name.
username	string	Unique login.
email	string	Email.
phone	string	Phone.
password	string	Password (if not Firebase Auth).
active	boolean	Account status.
createdAt	timestamp	Date created.
________________________________________
4.5 staff Collection
Stores internal staff and admins.
Field	Type	Description
name	string	Staff full name.
username	string	Unique reference username.
email	string	Email (Firebase Auth).
phone	string	Phone.
active	boolean	If false, cannot log in.
isAdmin	boolean	true if promoted to Admin.
role	string	Super Admin / Admin.
uid	string	Firebase Auth UID (for login).
createdAt	timestamp	Date created.
________________________________________
4.6 branches Collection
Stores branch details.
Field	Type	Description
name	string	Branch name (e.g., Nairobi).
manager	string	Branch manager name.
location	string	Physical address.
createdAt	timestamp	Date added.
________________________________________
5. Technical Notes
•	Authentication: Firebase Authentication with role-based access via Firestore.
•	Storage: Firebase Storage used for vehicle image uploads.
•	Indexes: Recommended for:
o	bookings.status
o	bookings.assignedValuerId
o	valuations.bookingId
•	Security Rules:
o	Valuers → can only read/write their assigned bookings & valuations.
o	Clients → can only access their own bookings.
o	Admins → unrestricted access.
________________________________________
