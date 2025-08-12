import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzmWG1NUaltbiR_mhyGQK3nGIGqrQLHQs",
  authDomain: "casa-f9685.firebaseapp.com",
  projectId: "casa-f9685",
  storageBucket: "casa-f9685.appspot.com",
  messagingSenderId: "355044924770",
  appId: "1:355044924770:web:fd4caceffbe4a83257e03b",
  measurementId: "G-TCWSNWC8VD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
