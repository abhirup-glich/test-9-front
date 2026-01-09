import { endpoints } from '../src/config/apiEndpoints.js';

let videoStream = null;

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', () => {
    initCamera();
    createParticles();
});

// Initialize camera (Hidden but active)
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });
        const video = document.getElementById('video');
        video.srcObject = stream;
        videoStream = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
        showError('Camera access denied. Please enable camera permissions.');
    }
}

// Handle "Identify Me" Click
window.handleIdentify = async function(event) {
    event.preventDefault();
    const btn = document.getElementById('identify-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-text">Scanning...</span>';

    try {
        // Capture frame
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        
        if (!video.srcObject) {
            throw new Error('Camera not initialized');
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        // Send to API
        const response = await fetch(endpoints.attendance.identify, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            // Using data.name because backend returns { "status": "success", "data": { "name": "...", "attendance_marked": true } }
            showWelcome(result.data.name, result.data.attendance_marked);
        } else {
            // Check for specific error message
            showError(result.message || 'Identification failed');
        }

    } catch (error) {
        console.error(error);
        showError('An error occurred. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

function showWelcome(name, isAttendanceMarked) {
    const box = document.getElementById('welcome-message-box');
    const nameEl = document.getElementById('welcome-name');
    const textEl = document.getElementById('welcome-text');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('identify-btn');

    box.classList.remove('hidden');
    title.classList.add('hidden');
    subtitle.classList.add('hidden');
    
    // Hide button to prevent re-submission immediately
    btn.style.display = 'none';

    if (isAttendanceMarked) {
        nameEl.textContent = `Welcome, ${name}`;
        textEl.textContent = "Your attendance is marked.";
        nameEl.style.color = '#10b981';
        box.style.background = 'rgba(16, 185, 129, 0.1)';
        box.style.border = '1px solid rgba(16, 185, 129, 0.2)';
    } else {
        nameEl.textContent = `Hello, ${name}`;
        textEl.textContent = "Attendance already marked for today.";
        nameEl.style.color = '#3b82f6'; // Blue for info
        box.style.background = 'rgba(59, 130, 246, 0.1)';
        box.style.border = '1px solid rgba(59, 130, 246, 0.2)';
    }
}

function showError(message) {
    const errorBox = document.getElementById('error-message-box');
    const errorText = document.getElementById('error-text');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('identify-btn');

    errorBox.classList.remove('hidden');
    title.classList.add('hidden');
    subtitle.classList.add('hidden');
    btn.style.display = 'none';

    errorText.textContent = message;
}

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(particle);
    }
}
