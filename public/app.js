
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const scanBtn = document.getElementById("scanBtn");
const toggle = document.getElementById("cameraToggle");
const msg = document.getElementById("cameraMessage");
const thinking = document.getElementById("thinking");
const result = document.getElementById("result");
const resultLetter = document.getElementById("resultLetter");
const resultLabel = document.getElementById("resultLabel");
const photoInput = document.getElementById("photoInput");

let stream = null;
let busy = false;

const colors = {
  A: "#e53935",
  B: "#fb8c00",
  C: "#fdd835",
  D: "#43a047",
  "?": "#8e8e93"
};

async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }

    msg.textContent = "Starting front camera…";
    msg.style.display = "grid";
    scanBtn.disabled = true;

    // FRONT / SELFIE camera
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1600 },
        height: { ideal: 1200 }
      }
    });

    video.srcObject = stream;
    await video.play();

    msg.style.display = "none";
    scanBtn.disabled = false;
    toggle.textContent = "Restart";
  } catch (e) {
    msg.textContent = "Front camera could not start. Check Safari/Chrome camera permission.";
    msg.style.display = "grid";
    scanBtn.disabled = true;
  }
}

function captureVideo() {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 960;

  if (!vw || !vh) throw new Error("Camera frame is not ready yet.");

  const maxW = 1400;
  const scale = Math.min(1, maxW / vw);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);

  const ctx = canvas.getContext("2d");

  // Draw the raw camera frame as-is.
  // IMPORTANT: do not mirror the uploaded frame, even if the local preview appears mirrored.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.8);
}

function fileToDataURL(file) {
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function ask(image) {
  if (busy) return;
  busy = true;

  thinking.hidden = false;
  result.classList.remove("show");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const r = await fetch("/api/answer", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({image}),
      signal: controller.signal
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw new Error(data.error || `Server returned ${r.status}`);
    }

    showResult(data.answer, data.debug || "");
  } catch (e) {
    const reason = e.name === "AbortError"
      ? "Timed out after 22 seconds"
      : (e.message || "Request failed");
    showError(reason);
  } finally {
    clearTimeout(timeout);
    thinking.hidden = true;
    busy = false;
  }
}

function showResult(answer) {
  const a = ["A","B","C","D"].includes(String(answer).toUpperCase())
    ? String(answer).toUpperCase() : "?";

  resultLetter.textContent = a;
  result.style.background = colors[a];
  resultLabel.textContent = a === "?" ? "COULDN'T READ • TAP TO CLEAR" : "TAP TO CLEAR";
  result.classList.add("show");
}

function showError(reason) {
  resultLetter.textContent = "!";
  result.style.background = "#8e8e93";
  resultLabel.textContent = `${reason} • TAP TO CLEAR`;
  result.classList.add("show");
}

toggle.addEventListener("click", startCamera);

scanBtn.addEventListener("click", async () => {
  if (!stream) return;
  try {
    await ask(captureVideo());
  } catch (e) {
    showError(e.message || "Capture failed");
  }
});

photoInput.addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  await ask(await fileToDataURL(file));
  photoInput.value = "";
});

result.addEventListener("click", () => result.classList.remove("show"));

if (navigator.mediaDevices?.getUserMedia) {
  startCamera();
} else {
  msg.textContent = "Live camera unavailable. Use “Use photo instead.”";
  msg.style.display = "grid";
}
