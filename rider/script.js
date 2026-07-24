import {
    auth,
    signInWithEmailAndPassword
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

    startBtn.addEventListener("click", () => {
        status.textContent = "출근 상태입니다.";
        localStorage.setItem("workStatus", "working");
    });

    endBtn.addEventListener("click", () => {
        status.textContent = "퇴근 상태입니다.";
        localStorage.setItem("workStatus", "off");
    });

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

            alert("로그인 실패");

            console.error(error);

        }

    });

});
