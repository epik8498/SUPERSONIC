import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc
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

/**
 * 출퇴근 기록 공통 저장 함수
 * status에는 "출근" 또는 "퇴근"이 들어갑니다.
 */
async function saveAttendance(email, status) {
    if (!email) {
        throw new Error("로그인된 사용자 이메일이 없습니다.");
    }

    if (status !== "출근" && status !== "퇴근") {
        throw new Error("출퇴근 상태가 올바르지 않습니다.");
    }

    const now = new Date();

    await addDoc(collection(db, "attendance"), {
        email: email,
        status: status,
        time: now.toISOString(),
        date: now.toLocaleDateString("ko-KR"),
        localTime: now.toLocaleTimeString("ko-KR")
    });
}

export {
    auth,
    db,
    signInWithEmailAndPassword,
    saveAttendance
};

console.log("✅ Firebase + Firestore 연결 성공");
