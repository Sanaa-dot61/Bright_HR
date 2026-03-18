// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYZK6vJjveodigbcSKuxe_D8Gybk-eblI",
  authDomain: "hr-system-8e4a1.firebaseapp.com",
  databaseURL: "https://hr-system-8e4a1-default-rtdb.firebaseio.com",
  projectId: "hr-system-8e4a1",
  storageBucket: "hr-system-8e4a1.firebasestorage.app",
  messagingSenderId: "393621084880",
  appId: "1:393621084880:web:276a3c217a44a289cadcd5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };