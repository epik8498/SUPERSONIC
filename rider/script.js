import {
    auth,
    signInWithEmailAndPassword,
    saveAttendance
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginBox = document.getElementById("login-box");
    const app = document.getElementById("app");

    const status = document.getElementById("workStatus");
    const startBtn = document.getElementById("startButton");
    const endBtn = document.getElementById("endButton");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");

    app.style.display = "none";

    const savedStatus = localStorage.getItem("workStatus");

    if (savedStatus === "working") {
        status.textContent = "출근 상태입니다.";
    } else {
        status.textContent = "퇴근 상태입니다.";
    }

    loginBtn.addEventListener("click", async () => {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);

            loginBox.style.display = "none";
            app.style.display = "block";

            alert("로그인 성공");

        } catch (error) {
            console.error("로그인 오류:", error);
            alert("로그인 실패");
        }
    });

    startBtn.addEventListener("click", async () => {

        if (!auth.currentUser) {
            alert("먼저 로그인해주세요.");
            return;
        }

        const savedStatus = localStorage.getItem("workStatus");

        if (savedStatus === "working") {
            alert("이미 출근 상태입니다.");
            return;
        }

        try {
            await saveAttendance(
                auth.currentUser.email,
                "출근"
            );

            status.textContent = "출근 상태입니다.";
            localStorage.setItem("workStatus", "working");

            alert("출근 기록이 저장되었습니다.");

        } catch (error) {
            console.error("출근 저장 오류:", error);
            alert("출근 기록 저장에 실패했습니다.");
        }
    });

    endBtn.addEventListener("click", async () => {

        if (!auth.currentUser) {
            alert("먼저 로그인해주세요.");
            return;
        }

        const savedStatus = localStorage.getItem("workStatus");

        if (savedStatus !== "working") {
            alert("현재 퇴근 상태입니다.");
            return;
        }

        try {
            await saveAttendance(
                auth.currentUser.email,
                "퇴근"
            );

            status.textContent = "퇴근 상태입니다.";
            localStorage.setItem("workStatus", "off");

            alert("퇴근 기록이 저장되었습니다.");

        } catch (error) {
            console.error("퇴근 저장 오류:", error);
            alert("퇴근 기록 저장에 실패했습니다.");
        }
    });

});
