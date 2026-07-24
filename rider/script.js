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

    const locationStatus = document.getElementById("locationStatus");
    const distanceText = document.getElementById("distanceText");
    const currentLocationButton = document.getElementById("currentLocationButton");
    const clearRouteButton = document.getElementById("clearRouteButton");

    let map = null;
    let currentMarker = null;
    let routePolyline = null;
    let watchId = null;
    let currentPosition = null;
    let routePath = [];
    let totalDistanceMeters = 0;

    const ROUTE_STORAGE_KEY = "supersonicRoutePath";
    const DISTANCE_STORAGE_KEY = "supersonicTotalDistanceMeters";

    app.style.display = "none";
    restoreWorkStatus();
    restoreRouteData();

    loginBtn.addEventListener("click", login);

    passwordInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            login();
        }
    });

    startBtn.addEventListener("click", startWork);
    endBtn.addEventListener("click", endWork);

    currentLocationButton.addEventListener("click", () => {
        if (!map || !currentPosition) {
            alert("아직 현재 위치를 확인하지 못했습니다.");
            return;
        }

        const movePosition = new kakao.maps.LatLng(
            currentPosition.latitude,
            currentPosition.longitude
        );

        map.panTo(movePosition);
    });

    clearRouteButton.addEventListener("click", () => {
        if (!confirm("저장된 이동 경로와 거리를 초기화할까요?")) {
            return;
        }

        routePath = [];
        totalDistanceMeters = 0;

        localStorage.removeItem(ROUTE_STORAGE_KEY);
        localStorage.removeItem(DISTANCE_STORAGE_KEY);

        if (routePolyline) {
            routePolyline.setPath([]);
        }

        updateDistanceText();
        alert("이동 경로가 초기화되었습니다.");
    });

    async function login() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "로그인 중...";

        try {
            await signInWithEmailAndPassword(auth, email, password);

            loginBox.style.display = "none";
            app.style.display = "block";

            initializeKakaoMap();
            alert("로그인 성공");
        } catch (error) {
            console.error("로그인 오류:", error);
            alert("로그인 실패: 이메일과 비밀번호를 확인해주세요.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "로그인";
        }
    }

    async function startWork() {
        if (!auth.currentUser) {
            alert("먼저 로그인해주세요.");
            return;
        }

        if (localStorage.getItem("workStatus") === "working") {
            alert("이미 출근 상태입니다.");
            return;
        }

        startBtn.disabled = true;

        try {
            await saveAttendance(auth.currentUser.email, "출근");

            status.textContent = "출근 상태입니다.";
            localStorage.setItem("workStatus", "working");

            startLocationTracking();
            alert("출근 기록이 저장되었습니다.");
        } catch (error) {
            console.error("출근 저장 오류:", error);
            alert("출근 기록 저장에 실패했습니다.");
        } finally {
            startBtn.disabled = false;
        }
    }

    async function endWork() {
        if (!auth.currentUser) {
            alert("먼저 로그인해주세요.");
            return;
        }

        if (localStorage.getItem("workStatus") !== "working") {
            alert("현재 퇴근 상태입니다.");
            return;
        }

        endBtn.disabled = true;

        try {
            await saveAttendance(auth.currentUser.email, "퇴근");

            status.textContent = "퇴근 상태입니다.";
            localStorage.setItem("workStatus", "off");

            stopLocationTracking();
            alert("퇴근 기록이 저장되었습니다.");
        } catch (error) {
            console.error("퇴근 저장 오류:", error);
            alert("퇴근 기록 저장에 실패했습니다.");
        } finally {
            endBtn.disabled = false;
        }
    }

    function restoreWorkStatus() {
        status.textContent =
            localStorage.getItem("workStatus") === "working"
                ? "출근 상태입니다."
                : "퇴근 상태입니다.";
    }

    function initializeKakaoMap() {
        if (!window.kakao || !window.kakao.maps) {
            locationStatus.textContent =
                "카카오맵 SDK를 불러오지 못했습니다. 카카오 개발자 사이트의 도메인 등록을 확인해주세요.";
            return;
        }

        kakao.maps.load(() => {
            const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780);

            map = new kakao.maps.Map(document.getElementById("map"), {
                center: defaultPosition,
                level: 4
            });

            currentMarker = new kakao.maps.Marker({
                position: defaultPosition,
                map: map
            });

            routePolyline = new kakao.maps.Polyline({
                map: map,
                path: routePath.map(
                    (point) => new kakao.maps.LatLng(point.latitude, point.longitude)
                ),
                strokeWeight: 5,
                strokeColor: "#ff0000",
                strokeOpacity: 0.85,
                strokeStyle: "solid"
            });

            setTimeout(() => map.relayout(), 100);
            updateDistanceText();
            startLocationTracking();
        });
    }

    function startLocationTracking() {
        if (!map || watchId !== null) {
            return;
        }

        if (!navigator.geolocation) {
            locationStatus.textContent =
                "이 기기 또는 브라우저에서는 위치 기능을 지원하지 않습니다.";
            return;
        }

        locationStatus.textContent = "현재 위치를 확인하는 중입니다...";

        watchId = navigator.geolocation.watchPosition(
            handlePositionSuccess,
            handlePositionError,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 3000
            }
        );
    }

    function stopLocationTracking() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        locationStatus.textContent = "퇴근하여 위치 추적을 중지했습니다.";
    }

    function handlePositionSuccess(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        currentPosition = { latitude, longitude };

        const kakaoPosition = new kakao.maps.LatLng(latitude, longitude);

        currentMarker.setPosition(kakaoPosition);

        if (routePath.length === 0) {
            map.setCenter(kakaoPosition);
        }

        addRoutePoint(latitude, longitude, accuracy);

        locationStatus.textContent =
            `현재 위치 확인 완료 · 정확도 약 ${Math.round(accuracy)}m`;
    }

    function handlePositionError(error) {
        const messages = {
            1: "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.",
            2: "현재 위치를 확인할 수 없습니다.",
            3: "위치 확인 시간이 초과되었습니다."
        };

        locationStatus.textContent =
            messages[error.code] || "위치 정보를 불러오는 중 오류가 발생했습니다.";

        console.error("위치 확인 오류:", error);
    }

    function addRoutePoint(latitude, longitude, accuracy) {
        if (accuracy > 100) {
            return;
        }

        const newPoint = {
            latitude,
            longitude,
            timestamp: Date.now()
        };

        const previousPoint = routePath[routePath.length - 1];

        if (previousPoint) {
            const distance = calculateDistanceMeters(previousPoint, newPoint);

            if (distance < 5 || distance > 2000) {
                return;
            }

            totalDistanceMeters += distance;
        }

        routePath.push(newPoint);

        if (routePath.length > 5000) {
            routePath = routePath.slice(-5000);
        }

        routePolyline.setPath(
            routePath.map(
                (point) => new kakao.maps.LatLng(point.latitude, point.longitude)
            )
        );

        saveRouteData();
        updateDistanceText();
    }

    function calculateDistanceMeters(pointA, pointB) {
        const earthRadius = 6371000;
        const latitude1 = toRadians(pointA.latitude);
        const latitude2 = toRadians(pointB.latitude);
        const latitudeDifference = toRadians(pointB.latitude - pointA.latitude);
        const longitudeDifference = toRadians(pointB.longitude - pointA.longitude);

        const haversine =
            Math.sin(latitudeDifference / 2) ** 2 +
            Math.cos(latitude1) *
                Math.cos(latitude2) *
                Math.sin(longitudeDifference / 2) ** 2;

        return (
            earthRadius *
            2 *
            Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
        );
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    function saveRouteData() {
        localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routePath));
        localStorage.setItem(
            DISTANCE_STORAGE_KEY,
            String(totalDistanceMeters)
        );
    }

    function restoreRouteData() {
        try {
            const savedRoute = JSON.parse(
                localStorage.getItem(ROUTE_STORAGE_KEY) || "[]"
            );

            routePath = Array.isArray(savedRoute) ? savedRoute : [];
            totalDistanceMeters = Number(
                localStorage.getItem(DISTANCE_STORAGE_KEY) || 0
            );

            if (!Number.isFinite(totalDistanceMeters)) {
                totalDistanceMeters = 0;
            }
        } catch (error) {
            console.error("저장된 이동 경로 복원 오류:", error);
            routePath = [];
            totalDistanceMeters = 0;
        }

        updateDistanceText();
    }

    function updateDistanceText() {
        distanceText.textContent =
            `오늘 이동거리: ${(totalDistanceMeters / 1000).toFixed(2)} km`;
    }
});
