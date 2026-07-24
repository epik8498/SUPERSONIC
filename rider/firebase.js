import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "여기에 apiKey",
  authDomain: "여기에 authDomain",
  projectId: "여기에 projectId",
  storageBucket: "여기에 storageBucket",
  messagingSenderId: "여기에 messagingSenderId",
  appId: "여기에 appId"
};

const app = initializeApp(firebaseConfig);

console.log("Firebase 연결 완료");
