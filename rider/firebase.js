import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2IRDO33QufPwcr6qBfq35wPb7qSYLB3s",
  authDomain: "supersonic77rider.firebaseapp.com",
  projectId: "supersonic77rider",
  storageBucket: "supersonic77rider.firebasestorage.app",
  messagingSenderId: "443902968540",
  appId: "1:443902968540:web:b8ec11866d8f258fa46a19"
};

const app = initializeApp(firebaseConfig);

console.log("✅ Firebase 연결 성공");
