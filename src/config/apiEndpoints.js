// Centralized API Gateway Configuration
const ENV = window.APP_ENV || 'prod'; // Default to prod for now as requested

const RENDER_URLS = {
    auth: 'https://test-4-api-auth.onrender.com',
    attendance: 'https://test-4-api-attendance.onrender.com',
    admin: 'https://test-4-api-admin.onrender.com'
};

const LOCAL_URLS = {
    auth: 'http://localhost:5002',
    attendance: 'http://localhost:5003',
    admin: 'http://localhost:5001'
};

const BASE_URLS = ENV === 'prod' ? RENDER_URLS : LOCAL_URLS;

export const endpoints = {
    auth: {
        baseUrl: BASE_URLS.auth,
        login: `${BASE_URLS.auth}/auth/login`,
        register: `${BASE_URLS.auth}/auth/register`,
        adminLoginInit: `${BASE_URLS.auth}/auth/admin-login-init`,
        adminLoginVerify: `${BASE_URLS.auth}/auth/admin-login-verify`,
        changePassword: `${BASE_URLS.auth}/auth/change-password`,
    },
    attendance: {
        baseUrl: BASE_URLS.attendance,
        identify: `${BASE_URLS.attendance}/api/identify`,
        mark: `${BASE_URLS.attendance}/api/mark-attendance`,
    },
    admin: {
        baseUrl: BASE_URLS.admin,
        students: `${BASE_URLS.admin}/api/students`,
        checkAttendance: `${BASE_URLS.admin}/api/check_attendance`,
        updateStudent: (roll) => `${BASE_URLS.admin}/api/students/${roll}`,
        deleteStudent: (roll) => `${BASE_URLS.admin}/api/students/${roll}`,
    }
};

export default endpoints;
