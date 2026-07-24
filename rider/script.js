document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("workStatus");
    const startBtn = document.getElementById("startButton");
    const endBtn = document.getElementById("endButton");

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
});
