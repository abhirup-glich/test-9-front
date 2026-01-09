import { endpoints } from '../src/config/apiEndpoints.js';

function apiFetch(path, opts) {
    const token = sessionStorage.getItem('adminToken');
    const headers = opts && opts.headers ? opts.headers : {};
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    const newOpts = Object.assign({ mode: 'cors' }, opts || {});
    newOpts.headers = Object.assign(newOpts.headers || {}, headers);
    
    // Construct URL
    let url = path;
    if (path.startsWith('/')) {
        // Fix: Use endpoints.admin.baseUrl explicitly
        // Also check if we are calling attendance service
        if (path.startsWith('/api/mark-attendance')) {
             url = endpoints.attendance.baseUrl + path;
        } else {
             url = endpoints.admin.baseUrl + path;
        }
    } else if (path.startsWith('http')) {
        url = path;
    }
    
    return fetch(url, newOpts);
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check session
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initial setup
    const copyrightYear = document.getElementById('copyrightYear');
    if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();
    
    // Remove page loader
    const loader = document.getElementById('pageLoader');
    if(loader) loader.style.display = 'none';

    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    const registerStudentBtn = document.getElementById('registerStudentBtn');
    const editDatabaseBtn = document.getElementById('editDatabaseBtn');
    const cameraSelection = document.getElementById('cameraSelection');
    const cameraList = document.getElementById('cameraList');
    const startAttendanceBtn = document.getElementById('startAttendanceBtn');
    const backFromCameraBtn = document.getElementById('backFromCameraBtn');
    
    // Manual Attendance Elements
    const manualCourse = document.getElementById('manualCourse');
    const manualStudent = document.getElementById('manualStudent');
    const markManualBtn = document.getElementById('markManualBtn');
    
    // Camera related variables
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let selectedDeviceId = null;
    let allStudents = []; // Cache for manual attendance

    // Mark Attendance Button Click
    if (markAttendanceBtn) {
        markAttendanceBtn.addEventListener('click', async () => {
            // Hide action buttons, show camera selection
            document.querySelector('.action-buttons').style.display = 'none';
            if (cameraSelection) cameraSelection.style.display = 'block';
            
            // Populate manual attendance dropdowns
            await loadStudentsForManualAttendance();

            // Enumerate devices
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                
                if (cameraList) {
                    cameraList.innerHTML = '';
                    if (videoDevices.length === 0) {
                        cameraList.innerHTML = '<p class="no-cameras">No cameras found.</p>';
                        return;
                    }
                    
                    videoDevices.forEach((device, index) => {
                        const div = document.createElement('div');
                        div.className = 'camera-item';
                        div.innerHTML = `<i class="fas fa-video"></i> <span>${device.label || `Camera ${index + 1}`}</span>`;
                        div.onclick = () => {
                            document.querySelectorAll('.camera-item').forEach(item => {
                                item.style.borderColor = 'transparent';
                                item.style.background = 'var(--light)';
                            });
                            div.style.borderColor = 'var(--blue1)';
                            div.style.background = 'white';
                            selectedDeviceId = device.deviceId;
                        };
                        cameraList.appendChild(div);
                    });
                    
                    // Select first camera by default
                    if (videoDevices.length > 0) {
                        cameraList.firstChild.click();
                    }
                }
            } catch (err) {
                console.error('Error listing cameras:', err);
                if (cameraList) cameraList.innerHTML = '<p class="error-message">Error accessing cameras. Please ensure permissions are granted.</p>';
            }
        });
    }

    // Back Button from Camera Selection
    if (backFromCameraBtn) {
        backFromCameraBtn.addEventListener('click', () => {
            if (cameraSelection) cameraSelection.style.display = 'none';
            document.querySelector('.action-buttons').style.display = 'grid';
            
            // Stop camera if running (preview) - though we don't have a preview running yet
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
        });
    }

    // Manual Attendance Logic
    async function loadStudentsForManualAttendance() {
        try {
            const response = await apiFetch('/students');
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (response.ok && data.students) {
                    allStudents = data.students;
                    populateCourseDropdown();
                }
            } else {
                 throw new Error("Server returned non-JSON response");
            }
        } catch (e) {
            console.error('Error loading students:', e);
            alert('Error loading students: ' + e.message);
        }
    }

    function populateCourseDropdown() {
        if (!manualCourse) return;
        const courses = [...new Set(allStudents.map(s => s.course))].filter(Boolean).sort();
        manualCourse.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            manualCourse.appendChild(opt);
        });
        
        // Reset student dropdown
        if (manualStudent) manualStudent.innerHTML = '<option value="">Select Student</option>';
    }

    if (manualCourse) {
        manualCourse.addEventListener('change', () => {
            const selectedCourse = manualCourse.value;
            if (!manualStudent) return;
            
            manualStudent.innerHTML = '<option value="">Select Student</option>';
            if (!selectedCourse) return;
            
            const filteredStudents = allStudents.filter(s => s.course === selectedCourse);
            filteredStudents.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.roll; // Assuming roll is the student_id or we use unique_id
                opt.textContent = `${s.name} (${s.roll})`;
                manualStudent.appendChild(opt);
            });
        });
    }

    if (markManualBtn) {
        markManualBtn.addEventListener('click', async () => {
            const studentId = manualStudent.value;
            if (!studentId) {
                alert('Please select a student');
                return;
            }
            
            try {
                // Call attendance service to mark attendance
                // Use endpoints.attendance.mark which is a full URL usually
                const url = endpoints.attendance.mark; 
                
                const response = await apiFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student_id: studentId })
                });
                
                const contentType = response.headers.get("content-type");
                let result;
                if (contentType && contentType.includes("application/json")) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    console.error("Non-JSON response:", text);
                    throw new Error("Server error: " + response.statusText);
                }

                if (response.ok) {
                    alert('Attendance marked successfully!');
                    // Optionally reset selection
                    manualStudent.value = '';
                } else {
                    alert('Failed: ' + (result.message || result.error || 'Unknown error'));
                }
            } catch (e) {
                console.error(e);
                alert('Error marking attendance: ' + e.message);
            }
        });
    }


    // Register Student Button Click
    if (registerStudentBtn) {
        registerStudentBtn.addEventListener('click', () => {
            const modal = document.getElementById('registrationModal');
            if(modal) {
                modal.style.display = 'block';
                startRegistrationCamera();
            }
        });
    }

    // Edit Database Button Click
    if (editDatabaseBtn) {
        editDatabaseBtn.addEventListener('click', async () => {
            try {
                const response = await apiFetch('/students');
                let data;
                const contentType = response.headers.get("content-type");

                if (contentType && contentType.includes("application/json")) {
                     data = await response.json();
                } else {
                       const text = await response.text();
                       console.error("Server returned HTML instead of JSON:", text);
                       throw new Error("Server error. Please try again.");
                }

                displayStudentDatabase(Array.isArray(data.students) ? data.students : []);
            } catch (err) {
                alert('Failed to load database: ' + err.message);
            }
        });
    }

    // Registration Modal Close
    const closeModal = document.querySelector('.close-modal');
    const modal = document.getElementById('registrationModal');
    if(closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            stopRegistrationCamera();
        });
        window.addEventListener('click', (e) => {
            if (e.target == modal) {
                modal.style.display = 'none';
                stopRegistrationCamera();
            }
        });
    }

    // Registration Camera Logic
    let regStream = null;
    async function startRegistrationCamera() {
        try {
            const video = document.getElementById('regVideo');
            if (video) {
                regStream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = regStream;
            }
        } catch (err) {
            console.error('Registration camera error:', err);
            alert('Could not start camera for registration');
        }
    }

    function stopRegistrationCamera() {
        if (regStream) {
            regStream.getTracks().forEach(track => track.stop());
            regStream = null;
        }
    }
    
    // Expose captureImage globally so onclick works
    window.captureImage = async function(angle) {
        const video = document.getElementById('regVideo');
        if (!video) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        // Convert to blob/file and store (simulated here, would typically upload or store in variable)
        // For this demo/revision, we'll mark as captured
        const statusElem = document.getElementById('status' + angle.charAt(0).toUpperCase() + angle.slice(1));
        if (statusElem) statusElem.textContent = `${angle.charAt(0).toUpperCase() + angle.slice(1)}: ✅`;
        
        const btnElem = document.getElementById('cap' + angle.charAt(0).toUpperCase() + angle.slice(1));
        if (btnElem) btnElem.classList.add('captured');
        
        checkRegistrationReady();
    };
    
    function checkRegistrationReady() {
        const center = document.getElementById('capCenter').classList.contains('captured');
        const left = document.getElementById('capLeft').classList.contains('captured');
        const right = document.getElementById('capRight').classList.contains('captured');
        const btn = document.getElementById('submitRegistration');
        
        if (center && left && right && btn) {
            btn.classList.add('ready');
        }
    }
    
    const submitRegBtn = document.getElementById('submitRegistration');
    if(submitRegBtn) {
        submitRegBtn.addEventListener('click', async () => {
            const name = document.getElementById('regName').value;
            const roll = document.getElementById('regRoll').value;
            const course = document.getElementById('regCourse').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            
            if (!name || !roll || !email || !password) {
                alert('Name, Roll Number, Email and Password are required');
                return;
            }
            
            try {
                const response = await apiFetch('/register_student', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name, roll, course, email, password })
                });
                
                const res = await response.json();
                if (response.ok) {
                    alert(`Student Registered Successfully!\nUnique ID: ${res.unique_id || 'Generated'}`);
                    if (modal) modal.style.display = 'none';
                    stopRegistrationCamera();
                    // Reset form
                    document.getElementById('regRoll').value = '';
                    document.getElementById('regName').value = '';
                    document.getElementById('regCourse').value = '';
                    document.getElementById('regEmail').value = '';
                    document.getElementById('regPassword').value = '';
                    document.querySelectorAll('.capture-controls button').forEach(b => b.classList.remove('captured'));
                    document.querySelectorAll('.status-indicators span').forEach(s => s.textContent = s.textContent.split(':')[0] + ': ❌');
                    document.getElementById('submitRegistration').classList.remove('ready');
                } else {
                    console.error("Registration Error:", res);
                    // Check for various error fields (flask-smorest uses 'message', jwt uses 'msg')
                    const errorMsg = res.message || res.msg || res.error || 'Unknown error';
                    alert('Registration failed: ' + errorMsg);
                }
            } catch (e) {
                console.error(e);
                alert('Error registering student: ' + e.message);
            }
        });
    }

    // Start Attendance (Recording) Logic
    if (startAttendanceBtn) {
        startAttendanceBtn.addEventListener('click', async () => {
            if (!selectedDeviceId) {
                alert('Please select a camera first');
                return;
            }
            
            startAttendanceBtn.disabled = true;
            startAttendanceBtn.textContent = 'Initializing...';
            
            try {
                const hiddenVideo = document.getElementById('hiddenVideo');
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedDeviceId } }
                });
                
                hiddenVideo.srcObject = mediaStream;
                await hiddenVideo.play();
                
                const options = { mimeType: 'video/webm;codecs=vp9' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                     // Fallback
                     delete options.mimeType;
                }
                
                recordedChunks = [];
                mediaRecorder = new MediaRecorder(mediaStream, options);
                
                mediaRecorder.onstart = () => {
                    startAttendanceBtn.textContent = 'Recording...';
                    setTimeout(() => {
                        if (mediaRecorder && mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 8000); // 8 seconds limit (Task 3)
                };
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) recordedChunks.push(e.data);
                };
                
                mediaRecorder.onstop = async () => {
                    startAttendanceBtn.textContent = 'Processing...';
                    const blob = new Blob(recordedChunks, { type: 'video/webm' });
                    
                    // Validate size (6MB limit) (Task 3)
                    const maxSize = 6 * 1024 * 1024; // 6MB
                    if (blob.size > maxSize) {
                        alert(`Video too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). Limit is 6MB.`);
                        startAttendanceBtn.disabled = false;
                        startAttendanceBtn.textContent = 'Start Attendance';
                        return;
                    }

                    await uploadVideo(blob);
                    
                    if (mediaStream) {
                        mediaStream.getTracks().forEach(track => track.stop());
                    }
                    startAttendanceBtn.disabled = false;
                    startAttendanceBtn.textContent = 'Start Attendance';
                };
                
                mediaRecorder.start();
                
            } catch (e) {
                console.error('Recording error:', e);
                alert('Failed to start recording: ' + e.message);
                startAttendanceBtn.disabled = false;
                startAttendanceBtn.textContent = 'Start Attendance';
            }
        });
    }

    async function uploadVideo(blob) {
        try {
            // Task 2: Stream video directly without FormData (upload folder avoidance)
            const filename = `attendance_${Date.now()}.webm`;
            
            const response = await apiFetch('/upload', { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'video/webm',
                    'X-Filename': filename
                },
                body: blob 
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an unexpected response format.');
            }
            
            if (response.ok) {
                 // Create result view
                 displayAttendanceResult(result);
            } else {
                alert('Attendance failed: ' + (result.error || result.message || 'Unknown error'));
            }
        } catch (e) {
            alert('Upload error: ' + e.message);
        }
    }
    
    function displayAttendanceResult(result) {
         // Simply reload or show a success message and then show table
         if(result && result.data) {
             alert(`Attendance Marked for ${result.data.name} (${result.data.roll})`);
         } else {
             alert(result.message || 'Processing complete');
         }
         // Fetch and show attendance table
         fetchAttendance();
    }
});

// Global functions for database/attendance management
async function fetchAttendance() {
    try {
        const response = await apiFetch('/check_attendance', { method: 'GET' });
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            if (response.ok) {
                displayAttendanceData(Array.isArray(result.attendance) ? result.attendance : []);
            } else {
                alert(result.error || 'Failed to check attendance');
            }
        } else {
             const text = await response.text();
             console.error("Non-JSON response:", text);
             throw new Error("Server returned non-JSON response");
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function displayAttendanceData(attendanceData) {
    const actionButtons = document.querySelector('.action-buttons');
    const cameraSelection = document.getElementById('cameraSelection');
    const dynamicContent = document.getElementById('dynamicContent');
    
    if (actionButtons) actionButtons.style.display = 'none';
    if (cameraSelection) cameraSelection.style.display = 'none';
    if (dynamicContent) {
        dynamicContent.style.display = 'block';
        dynamicContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Attendance Records</h2>
                <div style="display: flex; gap: 10px;">
                     <button id="backFromAttendance" style="background: var(--blue1); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Back</button>
                </div>
            </div>
            <div class="table-responsive">
            <table class="attendance-table" style="width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden;">
                <thead>
                    <tr style="background:var(--blue1); color:white;">
                        <th style="padding:15px;">Name</th>
                        <th style="padding:15px;">Date</th>
                        <th style="padding:15px;">Time</th>
                        <th style="padding:15px;">Course</th>
                        <th style="padding:15px;">Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendanceData.length ? attendanceData.map(r => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:15px;">${r.name}</td>
                            <td style="padding:15px;">${new Date(r.time).toLocaleDateString()}</td>
                            <td style="padding:15px;">${new Date(r.time).toLocaleTimeString()}</td>
                            <td style="padding:15px;">${r.course}</td>
                            <td style="padding:15px;">${(r.confidence * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" style="padding:15px; text-align:center;">No records</td></tr>'}
                </tbody>
            </table>
            </div>
        `;
        
        document.getElementById('backFromAttendance').addEventListener('click', () => {
            dynamicContent.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'grid';
        });
    }
}

function displayStudentDatabase(students) {
    const actionButtons = document.querySelector('.action-buttons');
    const cameraSelection = document.getElementById('cameraSelection');
    const dynamicContent = document.getElementById('dynamicContent');
    
    if (actionButtons) actionButtons.style.display = 'none';
    if (cameraSelection) cameraSelection.style.display = 'none';
    if (dynamicContent) {
        dynamicContent.style.display = 'block';
        dynamicContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Student Database</h2>
                <button id="backFromDatabase" style="background: var(--blue1); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Back</button>
            </div>
            <div class="table-responsive">
            <table style="width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden;">
                <thead>
                    <tr style="background:var(--blue1); color:white;">
                        <th style="padding:15px;">Roll</th>
                        <th style="padding:15px;">Name</th>
                        <th style="padding:15px;">Course</th>
                        <th style="padding:15px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:15px;">${s.roll}</td>
                            <td style="padding:15px;"><input type="text" value="${s.name}" id="name-${s.roll}" style="padding:5px; border:1px solid #ddd; border-radius:4px;"></td>
                            <td style="padding:15px;"><input type="text" value="${s.course}" id="course-${s.roll}" style="padding:5px; border:1px solid #ddd; border-radius:4px;"></td>
                            <td style="padding:15px;">
                                <button onclick="updateStudent('${s.roll}')" style="background:var(--success); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Save</button>
                                <button onclick="deleteStudent('${s.roll}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
        
        document.getElementById('backFromDatabase').addEventListener('click', () => {
            dynamicContent.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'grid';
        });
    }
}

window.updateStudent = async function(roll) {
    const name = document.getElementById(`name-${roll}`).value;
    const course = document.getElementById(`course-${roll}`).value;
    try {
        const response = await apiFetch(`/students/${roll}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, course})
        });
        if (response.ok) alert('Student updated');
        else alert('Update failed');
    } catch (e) { alert('Error: ' + e.message); }
};

window.deleteStudent = async function(roll) {
    if(!confirm('Delete this student?')) return;
    try {
        const response = await apiFetch(`/students/${roll}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Student deleted');
            // Refresh
            const r = await apiFetch('/students');
            const contentType = r.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                 const d = await r.json();
                 displayStudentDatabase(d.students);
            } else {
                 throw new Error("Failed to refresh database: Non-JSON response");
            }
        } else alert('Delete failed');
    } catch (e) { alert('Error: ' + e.message); }
};

// Make apiFetch global so inline handlers (like fetchAttendance which calls it) can work if needed
// Actually fetchAttendance is defined here so it has access.
// But updateStudent and deleteStudent are global, they need apiFetch.
window.apiFetch = apiFetch;
