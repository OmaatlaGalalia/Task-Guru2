// Import the functions you need from the SDKs you need
import { getStorage } from "firebase/storage";

import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCs3BismK2Z9sUTB4RD2TZVdUotTiQT0UU",
  authDomain: "task-guru-267.firebaseapp.com",
  projectId: "task-guru-267",
  storageBucket: "task-guru-267.firebasestorage.app",
  messagingSenderId: "304014179916",
  appId: "1:304014179916:web:6f782ade141d5bebd57ee9",
  measurementId: "G-9XDKXKBS7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

  export { auth, db, storage };