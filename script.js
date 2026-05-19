const members = [
  { name: "신유", img: "https://i.imgur.com/8lxKnM6.png" },
  { name: "도훈", img: "https://i.imgur.com/NF4m1XA.png" },
  { name: "영재", img: "https://i.imgur.com/KaQFYKg.png" },
  { name: "한진", img: "https://i.imgur.com/qN0r6TN.png" },
  { name: "지훈", img: "https://i.imgur.com/PemQ3OI.png" },
  { name: "경민", img: "https://i.imgur.com/7g25gdQ.png" }
];

const STEP = 10;
const FIXED_WIDTH = 50;
const MAX_CHARS = 95;
const TEXT_FONT_PX = 20;
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

// ====== 슬라이더 실시간 표시 ======
members.forEach((_, i) => {
  const r = document.getElementById(`range${i}`);
  const gPct = document.getElementById(`gPct${i}`);
  const sPct = document.getElementById(`sPct${i}`);

  const sync = () => {
    const g = Math.round(Number(r.value) / STEP) * STEP;
    r.value = g;
    gPct.textContent = `${g}%`;
    sPct.textContent = `${100 - g}%`;
  };

  r.addEventListener("input", sync);
  sync();
});

// ====== 결과 텍스트 ======
function setTextClamped(el, text) {
  el.textContent = text || " ";
  el.style.fontSize = `${TEXT_FONT_PX}px`;
  el.style.overflow = "hidden";
}

// ====== 프리뷰 축소 ======
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

// ====== 단기 저장 (sessionStorage) ======
function saveToSession() {
  const data = {
    otp: document.getElementById("otpIn")?.value || "",
    members: members.map((_, i) => ({
      range: document.getElementById(`range${i}`)?.value || "50",
      text: document.getElementById(`text${i}`)?.value || ""
    }))
  };
  sessionStorage.setItem("gongsoo_draft", JSON.stringify(data));
}

function loadFromSession() {
  const raw = sessionStorage.getItem("gongsoo_draft");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const otpIn = document.getElementById("otpIn");
    if (otpIn && data.otp) otpIn.value = data.otp;

    (data.members || []).forEach((m, i) => {
      const range = document.getElementById(`range${i}`);
      const text = document.getElementById(`text${i}`);
      if (range) {
        range.value = m.range;
        const g = Number(m.range);
        const gPct = document.getElementById(`gPct${i}`);
        const sPct = document.getElementById(`sPct${i}`);
        if (gPct) gPct.textContent = `${g}%`;
        if (sPct) sPct.textContent = `${100 - g}%`;
      }
      if (text) text.value = m.text;
    });
  } catch (e) {
    console.error("불러오기 실패", e);
  }
}

// ====== 수정하기 ======
function goBack() {
  document.getElementById("result").style.display = "none";
  document.getElementById("controls").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ====== 결과 생성 ======
function generate() {
  saveToSession();

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

    const gPct = document.getElementById(`gPct${i}`);
    const sPct = document.getElementById(`sPct${i}`);
    if (gPct && sPct) {
      gPct.textContent = `${g}%`;
      sPct.textContent = `${s}%`;
    }

    const gNum = document.getElementById(`gNum${i}`);
    const sNum = document.getElementById(`sNum${i}`);
    if (gNum) gNum.textContent = String(g);
    if (sNum) sNum.textContent = String(s);

    const bar = document.getElementById(`bar${i}`);
    const left = (100 - g) / 2;
    bar.style.width = `${FIXED_WIDTH}%`;
    bar.style.left = `${left}%`;

    const raw = (document.getElementById(`text${i}`).value || "").slice(0, MAX_CHARS);
    setTextClamped(document.getElementById(`resultText${i}`), raw);
  });

  document.getElementById("controls").style.display = "none";
  document.getElementById("result").style.display = "block";
  updatePreviewScale();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ====== 이미지 저장 ======
async function saveImage() {
  const capture = document.getElementById("capture");
  const otpIn = document.getElementById("otpIn");
  const otpText = (otpIn?.value || "").trim().slice(0, 8);
  const otpOut = document.getElementById("otpOut");
  if (otpOut) otpOut.textContent = otpText;

  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  const prevTransform = capture.style.transform;
  const prevOrigin = capture.style.transformOrigin;
  capture.style.transform = "none";
  capture.style.transformOrigin = "top left";

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // 고해상도로 캡처 후 1200px로 부드럽게 리사이즈
  const CAPTURE_SCALE = 3;

  try {
    const rawCanvas = await html2canvas(capture, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#fff",
      width: capture.scrollWidth,
      height: capture.scrollHeight,
      windowWidth: capture.scrollWidth,
      windowHeight: capture.scrollHeight,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedOtpOut = clonedDoc.getElementById("otpOut");
        if (clonedOtpOut) clonedOtpOut.textContent = otpText;
      }
    });

    // 1200px 기준으로 비율 유지하며 리사이즈
    const resized = document.createElement("canvas");
    resized.width = CAPTURE_W;
    resized.height = Math.round(rawCanvas.height * (CAPTURE_W / rawCanvas.width));
    const ctx = resized.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(rawCanvas, 0, 0, resized.width, resized.height);

    // Blob URL 방식으로 저장 (삼성 인터넷 호환)
    const blob = await new Promise(resolve => resized.toBlob(resolve, "image/png"));
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "twsrps.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  } catch (err) {
    alert("이미지 저장 실패: 렌더링 문제일 수 있어요.");
    console.error(err);
  } finally {
    capture.style.transform = prevTransform;
    capture.style.transformOrigin = prevOrigin;
  }
}

// ====== defer 환경에서 onclick이 함수를 못 찾는 문제 해결 ======
window.generate = generate;
window.goBack = goBack;
window.saveImage = saveImage;

// ====== 페이지 로드 시 복원 ======
loadFromSession();
