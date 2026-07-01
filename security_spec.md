# Security Specification for Booking System

This document outlines the zero-trust security specification, data invariants, and negative test cases ("Dirty Dozen") designed to test our Firestore Security Rules.

## 1. Data Invariants

For any Document in the `bookings` collection:
- **Completeness**: Every record must contain exactly the 12 required keys (`fullName`, `department`, `startDate`, `endDate`, `startTime`, `endTime`, `room`, `purpose`, `attendeesCount`, `status`, `userEmail`, `createdAt`). No shadow/phantom fields are permitted.
- **Type Safety**:
  - All textual fields must be strings with reasonable size limits.
  - `attendeesCount` must be an integer > 0 and <= 200.
  - `status` must be exactly one of: `"pending"`, `"approved"`, or `"rejected"`.
- **State Transition Control**:
  - Non-admin users can only create bookings in `"pending"` status.
  - Non-admin users cannot approve or reject bookings.
  - Immutability: Once created, `createdAt` and `userEmail` cannot be altered.

---

## 2. The "Dirty Dozen" Payloads (Negative Tests)

The following payloads represent malicious or invalid operations that must be rejected with `PERMISSION_DENIED`.

### Payload 1: Missing Required Field (`fullName`)
```json
{
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": 30,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z"
}
```

### Payload 2: Invalid Status Value (`"super_approved"`)
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": 30,
  "status": "super_approved",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z"
}
```

### Payload 3: Negative Attendees Count
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": -5,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z"
}
```

### Payload 4: Excessively Large Attendees Count
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": 999999,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z"
}
```

### Payload 5: Non-string Type for `createdAt`
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": 30,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": 1719777600000
}
```

### Payload 6: Ghost Fields injection (`isAdmin: true`)
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "ห้อง Resource Center",
  "purpose": "อบรม Python",
  "attendeesCount": 30,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z",
  "isAdmin": true
}
```

### Payload 7: Update modifying Immutable `createdAt`
- **Existing**: `createdAt: "2026-06-30T12:00:00Z"`
- **Payload**: `createdAt: "2026-07-01T12:00:00Z"`

### Payload 8: Update modifying Immutable `userEmail`
- **Existing**: `userEmail: "sompong.v@pwk.ac.th"`
- **Payload**: `userEmail: "hacker@pwk.ac.th"`

### Payload 9: Non-Admin attempting Status modification directly to `"approved"`
- **Action**: A non-admin user attempts to create or update status to `"approved"`.

### Payload 10: Empty string values for Room
```json
{
  "fullName": "สมพงษ์ รักเรียน",
  "department": "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "startDate": "2026-07-02",
  "endDate": "2026-07-02",
  "startTime": "09:00",
  "endTime": "12:00",
  "room": "",
  "purpose": "อบรม Python",
  "attendeesCount": 30,
  "status": "pending",
  "userEmail": "sompong.v@pwk.ac.th",
  "createdAt": "2026-06-30T12:00:00Z"
}
```

### Payload 11: Maliciously long field values (PII Injection / DoS)
- **Payload**: `purpose` set to a 500KB string of text.

### Payload 12: Orphaned/Stale status values on update
- **Payload**: Attempting to update a booking's status field to any other arbitrary keys.

---

## 3. Test Runner Design

While we execute rule deployment directly, the security spec ensures all dirty dozen payloads return permission denied by verifying type boundaries, key counts, and immutable properties during validation.
