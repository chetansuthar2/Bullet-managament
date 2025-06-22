import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBBps0shZrHL6b8lC-8uDb6rE9UA6VxvS8",
  authDomain: "bullet-mangement.firebaseapp.com",
  projectId: "bullet-mangement",
  storageBucket: "bullet-mangement.firebasestorage.app",
  messagingSenderId: "826320800761",
  appId: "1:826320800761:web:a8d9433e53953601be4b28",
  measurementId: "G-ZNPHT8H2EL"
};

// ✅ Always ensure db is initialized or throw
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
export const isFirebaseAvailable = true;
