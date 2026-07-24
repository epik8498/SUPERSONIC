import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2IRDO33QufPwcr6qBfq35wPb7qSYLB3s",
  authDomain: "supersonic77rider.firebaseapp.com",
  projectId: "supersonic77rider",
  storageBucket: "supersonic77rider.firebasestorage.app",
  messagingSenderId: "443902968540",
  appId: "1:443902968540:web:b8ec11866d8f258fa46a19"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword
};

console.log("✅ Firebase + Firestore 연결 성공");
