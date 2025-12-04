import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVnF_K2j0J5pLw_yYl5x8bFh-4b-1XnC8",
  authDomain: "sonic-motor-valuers.firebaseapp.com",
  projectId: "sonic-motor-valuers",
  storageBucket: "sonic-motor-valuers.appspot.com",
  messagingSenderId: "956627584102",
  appId: "1:956627584102:web:37175344b1c9c73336f3a7",
  measurementId: "G-R4S4X4R8DC"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
