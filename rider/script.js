document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("workStatus");
    const startBtn = document.getElementById("startButton");
    const endBtn = document.getElementById("endButton");

    startBtn.addEventListener("click", () => {
        status.textContent = "출근 상태입니다.";
    });

    endBtn.addEventListener("click", () => {
        status.textContent = "퇴근 상태입니다.";
    });
});
