import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- TUS LLAVES REALES (Ya insertadas) ---
const firebaseConfig = {
  apiKey: "AIzaSyA-TlTDSd4Fw_mDfnrMBJLfzf0Tqw5kFY4",
  authDomain: "creadorqr-alquimista.firebaseapp.com",
  projectId: "creadorqr-alquimista",
  storageBucket: "creadorqr-alquimista.firebasestorage.app",
  messagingSenderId: "783256621906",
  appId: "1:783256621906:web:b963ce6825e03dd17e608b",
  measurementId: "G-SC2ED178FC"
};

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };