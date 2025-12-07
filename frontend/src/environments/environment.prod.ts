// Production environment - uses production backend on Render.com

export const environment = {
  production: true,
  
  // PRODUCTION BACKEND
  apiUrl: 'https://smart-lms-pqp2.onrender.com/api',
  socketUrl: 'https://smart-lms-pqp2.onrender.com',
  
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
