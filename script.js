const members = [
  { name: "신유", img: "https://i.imgur.com/5L6wDru.png" },
  { name: "도훈", img: "https://i.imgur.com/hPrDoAd.png" },
  { name: "영재", img: "https://i.imgur.com/jaBqdU9.png" },
  { name: "한진", img: "https://i.imgur.com/dlN47CT.png" },
  { name: "지훈", img: "https://i.imgur.com/3jElNXL.png" },
  { name: "경민", img: "https://i.imgur.com/0qLTCdv.png" }
];

const STEP = 10;            // 10% 단위
const FIXED_WIDTH = 50;     // 결과 바 길이 항상 50%
const MAX_CHARS = 95;      // 입력 최대 글자수(한글 100자 기준)
const TEXT_FONT_PX = 20;    // 결과 텍스트 폰트 고정(잘리게)
const CAPTURE_W = 1200;
const CAPTURE_H = 900;

const inputs = document.getElementById("inputs");
const resultList = document.getElementById("resultList");

// ====== 입력/결과 UI 생성 ======
members.forEach((m, i) => {
  inputs.insertAdjacentHTML("beforeend", `
    <div class="member-control">
      <div class="member-header">
        <img src="${m.img}" crossorigin="anonymous" referrerpolicy="no-referrer">
        <strong>${m.name}</strong>
      </div>

      <div class="range-row">
        <span class="side">공 <b id="gPct${i}">50%</b></span>
        <input type="range" min="0" max="100" value="50" step="${STEP}" id="range${i}" aria-label="${m.name} 공수 비율">
        <span class="side">수 <b id="sPct${i}">50%</b></span>
      </div>

      <textarea id="text${i}" placeholder="텍스트 입력 (최대95자)" maxlength="${MAX_CHARS}"></textarea>
    </div>
  `);

  // ✅ 결과 카드에 숫자 표시 영역 추가 (공/수 라벨 아래 숫자)
  resultList.insertAdjacentHTML("beforeend", `
    <div class="card">
      <img src="${m.img}" crossorigin="anonymous" referrerpolicy="no-referrer">
      <div class="content">
        <div class="bar-wrap">
          <div class="sidecol">
            <div class="label">공</div>
            <div class="num" id="gNum${i}">50</div>
          </div>

          <div class="bar">
            <div class="bar-inner" id="bar${i}"></div>
          </div>

          <div class="sidecol">
            <div class="label">수</div>
            <div class="num" id="sNum${i}">50</div>
          </div>
        </div>

        <div class="result-text" id="resultText${i}">텍스트 작성</div>
      </div>
    </div>
  `);
});

// ====== 입력 슬라이더 실시간 표시(좌/우 퍼센트) ======
members.forEach((_, i) => {
  const r = document.getElementById(`range${i}`);
  const gPct = document.getElementById(`gPct${i}`);
  const sPct = document.getElementById(`sPct${i}`);

  const sync = () => {
    const g = Math.round(Number(r.value) / STEP) * STEP;
    r.value = g;
    const s = 100 - g;
    gPct.textContent = `${g}%`;
    sPct.textContent = `${s}%`;
  };

  r.addEventListener("input", sync);
  sync();
});

// ====== 결과 텍스트: 폰트 고정 + 넘치면 잘리게 ======
function setTextClamped(el, text) {
  el.textContent = text || " ";
  el.style.fontSize = `${TEXT_FONT_PX}px`;
  el.style.overflow = "hidden";
}

// ====== 프리뷰 축소(화면에서만) ======
function updatePreviewScale() {
  const preview = document.getElementById("preview");
  const capture = document.getElementById("capture");
  if (!preview || !capture) return;

  const scale = Math.min(1, preview.clientWidth / CAPTURE_W);
  capture.style.transformOrigin = "top left";
  capture.style.transform = `scale(${scale})`;
  preview.style.height = (CAPTURE_H * scale) + "px";
}

window.addEventListener("resize", () => {
  const result = document.getElementById("result");
  if (result && getComputedStyle(result).display !== "none") updatePreviewScale();
});

// ====== 결과 생성 ======
function generate() {
  // ✅ OTP 반영
  const otpIn = document.getElementById("otpIn");
  const otpOut = document.getElementById("otpOut");
  const otpText = (otpIn?.value || "").trim().slice(0, 8);
  if (otpOut) otpOut.textContent = otpText;

  members.forEach((_, i) => {
    const r = document.getElementById(`range${i}`);
    let g = Math.round(Number(r.value) / STEP) * STEP;
    g = Math.max(0, Math.min(100, g));
    r.value = g;

    const s = 100 - g;

    // 입력 퍼센트 재동기화
    const gPct = document.getElementById(`gPct${i}`);
    const sPct = document.getElementById(`sPct${i}`);
    if (gPct && sPct) {
      gPct.textContent = `${g}%`;
      sPct.textContent = `${s}%`;
    }

    // ✅ 결과 숫자(퍼센트 없이 숫자만)
    const gNum = document.getElementById(`gNum${i}`);
    const sNum = document.getElementById(`sNum${i}`);
    if (gNum) gNum.textContent = String(g);
    if (sNum) sNum.textContent = String(s);

    // ✅ 결과 바: 길이 고정 50% + 위치만 이동
    const bar = document.getElementById(`bar${i}`);
    const left = (100 - g) / 2;
    bar.style.width = `${FIXED_WIDTH}%`;
    bar.style.left = `${left}%`;

    // 텍스트 반영 (고정 + 넘치면 잘림)
    const raw = (document.getElementById(`text${i}`).value || "").slice(0, MAX_CHARS);
    setTextClamped(document.getElementById(`resultText${i}`), raw);
  });

  document.getElementById("controls").style.display = "none";
  document.getElementById("result").style.display = "block";

  updatePreviewScale();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ====== 저장: 1200x900 고정 ======
async function saveImage() {
  const capture = document.getElementById("capture");

  // OTP 텍스트 보장 반영
  const otpIn = document.getElementById("otpIn");
  const otpText = (otpIn?.value || "").trim().slice(0, 8);
  const otpOut = document.getElementById("otpOut");
  if (otpOut) otpOut.textContent = otpText;

  // 폰트 로딩 대기(폰트 깨짐 방지)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // 프리뷰 transform 제거
  const prevTransform = capture.style.transform;
  const prevOrigin = capture.style.transformOrigin;
  capture.style.transform = "none";
  capture.style.transformOrigin = "top left";

  // 레이아웃 안정화: 2프레임 대기
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // === 3MP 제한에 맞춰 scale 계산 ===
  // 기본: 1200 x 900 = 1.08MP
  // 목표: <= 3MP → scale ≈ 1.6
  const MAX_MP = 3_000_000;
  const basePixels = CAPTURE_W * CAPTURE_H; // 1200*900
  const maxScale = Math.sqrt(MAX_MP / basePixels);
  const scale = Math.min(1.6, maxScale); // 안전값

  try {
    const canvas = await html2canvas(capture, {
      scale,                   // ✅ 확대 캡처만 하고
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#fff",
      width: CAPTURE_W,
      height: CAPTURE_H,
      windowWidth: CAPTURE_W,
      windowHeight: CAPTURE_H,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // 클론 DOM에도 OTP 반영
        const clonedOtpOut = clonedDoc.getElementById("otpOut");
        if (clonedOtpOut) clonedOtpOut.textContent = otpText;
      }
    });

    // ✅ 확대된 캔버스를 그대로 PNG로 저장 (축소/재그리기 없음)
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "twsrps.png";
    a.click();

  } catch (err) {
    alert("이미지 저장 실패: 렌더링 문제일 수 있어요.");
    console.error(err);
  } finally {
    capture.style.transform = prevTransform;
    capture.style.transformOrigin = prevOrigin;
  }
}








