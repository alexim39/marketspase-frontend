
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyD91TxVyx2IFPJBbAWpdeAewvtsrFnDRiA",
  authDomain: "marketspase-22a2c.firebaseapp.com",
  projectId: "marketspase-22a2c",
  storageBucket: "marketspase-22a2c.firebasestorage.app",
  messagingSenderId: "207036489332",
  appId: "1:207036489332:web:27d0174fcc53d992463b21",
  measurementId: "G-FVDG11VKDV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);