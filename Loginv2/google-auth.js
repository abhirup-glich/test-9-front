// Handle Google Sign In
async function handleGoogleSignIn() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Send to backend for verification
    const response = await fetch('/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken })
    });

    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Signed in with Google successfully!');
      // Store token/user data if needed
      if (data.access_token) {
        sessionStorage.setItem('token', data.access_token);
      }
      if (data.user) {
        sessionStorage.setItem('studentData', JSON.stringify(data.user));
      }
      
      setTimeout(() => {
        window.location.href = '/WebPage/Student page/studentdashboard.html';
      }, 1000);
    } else {
      showError(data.message || 'Google sign in failed on server');
    }
  } catch (error) {
    console.error('Google Sign In Error:', error);
    showError(error.message);
  }
}
