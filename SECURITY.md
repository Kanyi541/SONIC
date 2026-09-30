# Security Guide for SONIC Motor Valuers

## Overview
This document outlines the security measures implemented in the SONIC Motor Valuers application and provides guidelines for maintaining a secure system.

## Implemented Security Measures

### 1. Rate Limiting
- **Middleware**: `src/middleware.ts` implements IP-based rate limiting
- **Limits**: 100 requests per 15 minutes per IP address
- **Purpose**: Prevents brute force attacks and DDoS attempts

### 2. Security Headers
The following security headers are automatically added to all responses:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features (camera, microphone, geolocation)
- `Content-Security-Policy` - Controls content sources
- `Strict-Transport-Security` - Enforces HTTPS (production only)

### 3. Input Validation
- **Location**: `src/lib/security.ts`
- **Features**:
  - XSS prevention through input sanitization
  - Email validation
  - Phone number validation
  - Username validation
  - Password strength checking
  - SQL injection detection
  - NoSQL injection prevention

### 4. Authentication Security
- Firebase Authentication with secure configuration
- Password reset email functionality
- Session management with sessionStorage
- Role-based access control (Admin, Client, Valuer, Staff, Agent)

### 5. Data Protection
- Firebase Firestore with proper security rules (to be configured)
- Encrypted connections (HTTPS required in production)
- IndexedDB persistence for offline capability with error handling

## Firebase Security Rules (Required)

You must configure Firebase Firestore security rules. Below is a recommended configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.role == 'Super Admin';
    }
    
    function isStaff() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.active == true;
    }
    
    function isActiveInsurer() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/insurers/$(request.auth.uid)).data.active == true;
    }
    
    function isActiveValuer() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/valuers/$(request.auth.uid)).data.active == true;
    }
    
    // Staff collection - only admins can read/write
    match /staff/{userId} {
      allow read, write: if isAdmin();
    }
    
    // Insurers collection
    match /insurers/{insurerId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isStaff() || 
        isActiveInsurer() ||
        request.auth.uid == insurerId
      );
      allow write: if isAdmin() || request.auth.uid == insurerId;
    }
    
    // Valuers collection
    match /valuers/{valuerId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isStaff() || 
        isActiveValuer() ||
        request.auth.uid == valuerId
      );
      allow write: if isAdmin() || request.auth.uid == valuerId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isAdmin() || isActiveInsurer());
      allow update: if isAuthenticated() && (isAdmin() || isStaff() || isActiveValuer());
      allow delete: if isAdmin();
    }
    
    // Valuations collection
    match /valuations/{valuationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isAdmin() || isActiveValuer());
      allow update: if isAuthenticated() && (isAdmin() || isActiveValuer());
      allow delete: if isAdmin();
    }
    
    // Branches collection
    match /branches/{branchId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

## Recommended Firebase Authentication Settings

1. **Email/Password Authentication**:
   - Enable email verification
   - Set strong password requirements (8+ characters, mixed case, numbers, special chars)
   - Enable account blocking after multiple failed attempts

2. **Session Management**:
   - Set session timeout to 30 minutes
   - Enable multi-factor authentication for admin accounts
   - Implement device fingerprinting

3. **Email Templates**:
   - Customize password reset emails
   - Add branding to verification emails
   - Set expiration times for reset links (1 hour recommended)

## Additional Security Recommendations

### 1. Environment Variables
Move sensitive configuration to environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Password Policies
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords
- Password history (prevent reuse)

### 3. Audit Logging
Implement audit logging for:
- Login attempts (success/failure)
- Password changes
- Role changes
- Data modifications
- Access to sensitive data

### 4. Regular Security Updates
- Keep dependencies updated
- Monitor security advisories
- Run `npm audit` regularly
- Update Firebase SDK versions

### 5. Backup and Recovery
- Regular database backups
- Backup encryption
- Recovery plan testing
- Document recovery procedures

## Security Checklist

- [ ] Firebase Firestore security rules configured
- [ ] Firebase Authentication settings configured
- [ ] Environment variables set for sensitive data
- [ ] HTTPS enabled in production
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] Password policies enforced
- [ ] Audit logging implemented
- [ ] Backup procedures in place
- [ ] Regular security reviews scheduled
- [ ] Team trained on security best practices

## Incident Response Plan

1. **Detection**:
   - Monitor error logs
   - Track failed login attempts
   - Monitor unusual activity patterns

2. **Response**:
   - Immediately disable compromised accounts
   - Change passwords for affected users
   - Review and rotate API keys
   - Notify stakeholders

3. **Recovery**:
   - Restore from clean backups
   - Update security measures
   - Conduct post-incident review
   - Document lessons learned

## Contact
For security concerns or to report vulnerabilities, contact the system administrator.
