// Development environment - uses local backend
// To test with production backend locally, change URLs below to production values

export const environment = {
  production: false,
  
  // LOCAL BACKEND (default for development)
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  
  // PRODUCTION BACKEND (uncomment to test with production backend locally)
  // apiUrl: 'https://smart-lms-pqp2.onrender.com/api',
  // socketUrl: 'https://smart-lms-pqp2.onrender.com',
  
  firebase: {
    apiKey: "AIzaSyD_B3ZDSsycZyJKeAesmcqAKzC_BK8zNLI",
    authDomain: "smart-lms-d5ce5.firebaseapp.com",
    projectId: "smart-lms-d5ce5",
    storageBucket: "smart-lms-d5ce5.firebasestorage.app",
    messagingSenderId: "1048951192303",
    appId: "1:1048951192303:web:9d3528e4e97e1e1207b91a",
    measurementId: "G-G5PGXF5WJV"
  }
};
