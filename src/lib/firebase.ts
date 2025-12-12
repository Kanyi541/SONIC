
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "sonic-motor-valuers-7762-ca361",
  "appId": "1:1027273230674:web:fd5d893651f8a9f299528b",
  "apiKey": "AIzaSyAN-VFoZp5RlBJfvA_opilmUIWvxM6oSW0",
  "authDomain": "sonic-motor-valuers-7762-ca361.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1027273230674",
  "storageBucket": "sonic-motor-valuers-7762-ca361.appspot.com"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db);
  } catch (error) {
    if (error.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (error.code == 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support it.');
    }
  }
}


export { app, auth, db };
