import time
import json
import subprocess
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

# =========================
# 달서T 명단
# 여기 있는 사람 = 달서T
# 여기 없는 달서A 기사 = 소닉T
# =========================
DALSEO_T_RIDERS = [
    "김민승", "윤창근", "김병국", "신호준", "김영빈",
    "김용우", "박지원", "김탁기", "김병철", "정영훈",
    "김태광", "배재현", "김형민", "문승수", "이상민",
    "정성훈", "이주철", "박기홍", "정판호", "나미영",
    "황호용", "김영철", "남승훈", "남수현", "김민서",
    "신진관", "임선미", "여재환", "정주현", "김기현",
    "김범준", "이윤석", "양혜진", "김민우", "김혜성",
    "김기헌", "조대영", "정승덕", "임상완", "김우진"
]

AUTO_GIT_PUSH = False

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data.json"
HTML_FILE = BASE_DIR / "index.html"

API_URL = "https://api-deliverycenter.baemin.com/v2/management/delivery-status"


def collect_data(page):
    all_riders = []

    first_data = page.evaluate(
        """
        async (url) => {
            const res = await fetch(url + "?page=0&size=100&orderName=name&orderBy=asc&name=&userId=&phoneNumber=&riderStatus=", {
                credentials: "include"
            });
            return await res.json();
        }
        """,
        API_URL,
    )

    total_page = first_data.get("totalPage", 1)
    all_riders.extend(first_data.get("data", []))

    for page_no in range(1, total_page):
        data = page.evaluate(
            """
            async ({url, pageNo}) => {
                const res = await fetch(url + `?page=${pageNo}&size=100&orderName=name&orderBy=asc&name=&userId=&phoneNumber=&riderStatus=`, {
                    credentials: "include"
                });
                return await res.json();
            }
            """,
            {"url": API_URL, "pageNo": page_no},
        )
        all_riders.extend(data.get("data", []))

    return all_riders


def team_of(name):
    if name in DALSEO_T_RIDERS:
        return "달서T"
    return "소닉T"


def make_dashboard_data(riders):
    result = []

    for rider in riders:
        name = rider.get("name", "").strip()

        acc = rider.get("deliveryAcceptanceCount", {})
        peak = rider.get("deliveryPeakTimeCount", {})

        item = {
            "name": name,
            "team": team_of(name),
            "status": rider.get("status", {}).get("desc", ""),
            "complete": acc.get("complete", 0),
            "reject": acc.get("reject", 0),
            "cancel": acc.get("cancel", 0),
            "riderFault": acc.get("riderFault", 0),
            "morning": peak.get("morning", 0),
            "afternoon": peak.get("afternoon", 0),
            "evening": peak.get("evening", 0),
            "midnight": peak.get("midnight", 0),
        }

        result.append(item)

    result.sort(key=lambda x: x["complete"], reverse=True)

    dalseo_team = [r for r in result if r["team"] == "달서T"]
    sonic_team = [r for r in result if r["team"] == "소닉T"]

    def summary(rows):
        return {
            "complete": sum(r["complete"] for r in rows),
            "reject": sum(r["reject"] for r in rows),
            "cancel": sum(r["cancel"] for r in rows),
            "riderFault": sum(r["riderFault"] for r in rows),
            "morning": sum(r["morning"] for r in rows),
            "afternoon": sum(r["afternoon"] for r in rows),
            "evening": sum(r["evening"] for r in rows),
            "midnight": sum(r["midnight"] for r in rows),
            "count": len(rows),
        }

    return {
        "area": "달서A",
        "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total": summary(result),
        "dalseoT": summary(dalseo_team),
        "sonicT": summary(sonic_team),
        "riders": result,
    }


def save_json(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def save_html():
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>달서A 실시간 실적</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #f5f6fa;
    margin: 0;
    padding: 20px;
}
h1 { margin-bottom: 5px; }
.updated { color: #666; margin-bottom: 20px; }

.section-title {
    margin-top: 28px;
    margin-bottom: 12px;
}

.cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
}
.card {
    background: white;
    padding: 18px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.card .title {
    color: #666;
    font-size: 14px;
}
.card .value {
    font-size: 34px;
    font-weight: bold;
    margin-top: 8px;
}
.big-card {
    background: #111827;
    color: white;
}
.team-dalseo {
    background: #2563eb;
    color: white;
}
.team-sonic {
    background: #16a34a;
    color: white;
}
table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 12px;
    overflow: hidden;
}
th, td {
    padding: 11px;
    border-bottom: 1px solid #eee;
    text-align: center;
}
th {
    background: #222;
    color: white;
}
.rank {
    font-weight: bold;
}
.badge {
    padding: 4px 8px;
    border-radius: 8px;
    color: white;
    font-size: 12px;
}
.badge-dalseo {
    background: #2563eb;
}
.badge-sonic {
    background: #16a34a;
}
@media (max-width: 900px) {
    .cards {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
</head>
<body>

<h1>달서A 실시간 실적</h1>
<div class="updated" id="updated"></div>

<h2 class="section-title">전체 실적</h2>
<div class="cards">
    <div class="card big-card"><div class="title">전체 완료</div><div class="value" id="totalComplete">0</div></div>
    <div class="card"><div class="title">전체 거절</div><div class="value" id="totalReject">0</div></div>
    <div class="card"><div class="title">전체 배차취소</div><div class="value" id="totalCancel">0</div></div>
    <div class="card"><div class="title">전체 기사수</div><div class="value" id="totalCount">0</div></div>
</div>

<h2 class="section-title">연합팀별 실적</h2>
<div class="cards">
    <div class="card team-dalseo"><div class="title">달서T 완료</div><div class="value" id="dalseoComplete">0</div></div>
    <div class="card team-dalseo"><div class="title">달서T 기사수</div><div class="value" id="dalseoCount">0</div></div>
    <div class="card team-sonic"><div class="title">소닉T 완료</div><div class="value" id="sonicComplete">0</div></div>
    <div class="card team-sonic"><div class="title">소닉T 기사수</div><div class="value" id="sonicCount">0</div></div>
</div>

<h2 class="section-title">피크별 실적</h2>
<div class="cards">
    <div class="card"><div class="title">아침</div><div class="value" id="morning">0</div></div>
    <div class="card"><div class="title">점심</div><div class="value" id="afternoon">0</div></div>
    <div class="card"><div class="title">저녁</div><div class="value" id="evening">0</div></div>
    <div class="card"><div class="title">심야</div><div class="value" id="midnight">0</div></div>
</div>

<h2 class="section-title">기사별 실적</h2>
<table>
<thead>
<tr>
    <th>순위</th>
    <th>팀</th>
    <th>기사명</th>
    <th>상태</th>
    <th>완료</th>
    <th>거절</th>
    <th>배차취소</th>
    <th>아침</th>
    <th>점심</th>
    <th>저녁</th>
    <th>심야</th>
</tr>
</thead>
<tbody id="riderTable"></tbody>
</table>

<script>
async function loadData() {
    const res = await fetch("data.json?time=" + new Date().getTime());
    const data = await res.json();

    document.getElementById("updated").innerText = "마지막 업데이트: " + data.updatedAt;

    document.getElementById("totalComplete").innerText = data.total.complete;
    document.getElementById("totalReject").innerText = data.total.reject;
    document.getElementById("totalCancel").innerText = data.total.cancel;
    document.getElementById("totalCount").innerText = data.total.count;

    document.getElementById("dalseoComplete").innerText = data.dalseoT.complete;
    document.getElementById("dalseoCount").innerText = data.dalseoT.count;
    document.getElementById("sonicComplete").innerText = data.sonicT.complete;
    document.getElementById("sonicCount").innerText = data.sonicT.count;

    document.getElementById("morning").innerText = data.total.morning;
    document.getElementById("afternoon").innerText = data.total.afternoon;
    document.getElementById("evening").innerText = data.total.evening;
    document.getElementById("midnight").innerText = data.total.midnight;

    const tbody = document.getElementById("riderTable");
    tbody.innerHTML = "";

    data.riders.forEach((r, i) => {
        const badgeClass = r.team === "달서T" ? "badge-dalseo" : "badge-sonic";

        tbody.innerHTML += `
            <tr>
                <td class="rank">${i + 1}</td>
                <td><span class="badge ${badgeClass}">${r.team}</span></td>
                <td>${r.name}</td>
                <td>${r.status}</td>
                <td>${r.complete}</td>
                <td>${r.reject}</td>
                <td>${r.cancel}</td>
                <td>${r.morning}</td>
                <td>${r.afternoon}</td>
                <td>${r.evening}</td>
                <td>${r.midnight}</td>
            </tr>
        `;
    });
}

loadData();
setInterval(loadData, 30000);
</script>

</body>
</html>
"""
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)


def git_push():
    if not AUTO_GIT_PUSH:
        return

    subprocess.run(["git", "add", "index.html", "data.json"], cwd=BASE_DIR)
    subprocess.run(["git", "commit", "-m", "update dalseo A data"], cwd=BASE_DIR)
    subprocess.run(["git", "push"], cwd=BASE_DIR)


def main():
    print("배민비즈 창을 엽니다.")

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=str(BASE_DIR / "chrome_profile"),
            headless=False,
            viewport={"width": 1400, "height": 900},
        )

        page = browser.new_page()
        page.goto("https://deliverycenter.baemin.com")

        print("")
        print("1. 열린 창에서 배민비즈 로그인하세요.")
        print("2. 기사 실적 페이지까지 이동하세요.")
        print("3. 준비되면 이 CMD 창에서 Enter 누르세요.")
        input("Enter 대기 중...")

        while True:
            try:
                print("")
                print("===================================")
                print("데이터 수집 시작")
                print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

                riders = collect_data(page)

                dashboard_data = make_dashboard_data(riders)

                print(f"전체 완료: {dashboard_data['total']['complete']}건")
                print(f"달서T 완료: {dashboard_data['dalseoT']['complete']}건")
                print(f"소닉T 완료: {dashboard_data['sonicT']['complete']}건")

                save_json(dashboard_data)
                save_html()

                git_push()

                print("업데이트 완료")
                print("60초 후 다시 수집합니다.")

            except Exception as e:
                print("오류 발생:")
                print(e)

            time.sleep(60)


if __name__ == "__main__":
    main()
