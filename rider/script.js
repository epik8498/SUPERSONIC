import {
    auth,
    signInWithEmailAndPassword
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("workStatus");
    const startBtn = document.getElementById("startButton");
    const endBtn = document.getElementById("endButton");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");

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

        if (email === "" || password === "") {
            alert("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);

            alert("로그인에 성공했습니다.");
        } catch (error) {
            console.error(error);

            alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
        }
    });
});
