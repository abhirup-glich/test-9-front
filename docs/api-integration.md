# API Integration Guide

This document outlines how to integrate with the modular backend services.

## Configuration

Import endpoints from `src/config/apiEndpoints.js`.

```javascript
import { endpoints } from '../config/apiEndpoints.js';

fetch(endpoints.auth.login, { ... });
```

## Services

### Auth Service
- **Base URL**: `http://localhost:5002` (Dev)
- **Endpoints**:
  - `POST /auth/login`: Login
  - `POST /auth/register`: Register
  - `POST /auth/admin-login-init`: OTP
  - `POST /auth/admin-login-verify`: Verify OTP

### Attendance Service
- **Base URL**: `http://localhost:5003` (Dev)
- **Endpoints**:
  - `POST /identify`: Send base64 image, get student info.

### Admin Service
- **Base URL**: `http://localhost:5001` (Dev)
- **Endpoints**:
  - `GET /api/students`: List students.
  - `POST /api/students`: Create student.
  - `PUT /api/students/<student_id>`: Update student.
  - `DELETE /api/students/<student_id>`: Delete student.
  - `GET /api/check_attendance`: List attendance logs.

## Error Handling

All services return standard HTTP status codes.
- 200/201: Success
- 400: Bad Request
- 401: Unauthorized
- 500: Server Error
