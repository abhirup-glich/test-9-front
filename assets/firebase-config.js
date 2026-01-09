const firebaseConfig = {
  apiKey: "AlzaSyDS_wqcg4WNSdApBGnRP7-6aqf9bl6uYXA",
  authDomain: "test-2-cd21b.firebaseapp.com",
  projectId: "test-2-cd21b",
  storageBucket: "test-2-cd21b.firebasestorage.app",
  messagingSenderId: "885150583604",
  appId: "1:885150583604:web:d671afc15f7320bff57361"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
