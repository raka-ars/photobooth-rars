const APP = {
    isPaid: window.photoboothConfig?.isPaid ?? false,
    frames: window.photoboothConfig?.frames ?? [],
    paymentConfirmUrl: window.photoboothConfig?.paymentConfirmUrl ?? '',
    selectedFrame: null,
    stream: null,
    shots: [],
    resultDataUrl: null,
    cameraReady: false,
};

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

const camera = document.getElementById('camera');
const frameOverlay = document.getElementById('frameOverlay');
const countdownEl = document.getElementById('countdown');
const framesGrid = document.getElementById('framesGrid');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const activateCameraBtn = document.getElementById('activateCameraBtn');
const startSessionBtn = document.getElementById('startSessionBtn');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const paymentStatusChip = document.getElementById('paymentStatusChip');
const accessText = document.getElementById('accessText');
const accessDot = document.getElementById('accessDot');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraBadge = document.getElementById('cameraBadge');
const resultCanvas = document.getElementById('resultCanvas');
const emptyResult = document.getElementById('emptyResult');

const thumbs = [
    document.querySelector('#thumb1 img'),
    document.querySelector('#thumb2 img'),
    document.querySelector('#thumb3 img'),
];

const thumbWrappers = [
    document.getElementById('thumb1'),
    document.getElementById('thumb2'),
    document.getElementById('thumb3'),
];

function initialize() {
    renderFrames();
    updatePaymentUI();

    if (APP.frames.length > 0) {
        selectFrame(APP.frames[0].id);
    }

    bindEvents();
}

function bindEvents() {
    confirmPaymentBtn?.addEventListener('click', confirmPayment);
    activateCameraBtn?.addEventListener('click', startCamera);
    startSessionBtn?.addEventListener('click', runPhotoSession);
    retakeBtn?.addEventListener('click', resetSession);
    downloadBtn?.addEventListener('click', downloadResult);
}

function updatePaymentUI() {
    if (APP.isPaid) {
        paymentStatusChip.textContent = 'Pembayaran Terkonfirmasi';
        accessText.textContent = 'Akses Kamera Terbuka';
        accessDot.classList.add('ok');
        activateCameraBtn.disabled = false;
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.textContent = 'Pembayaran Terkonfirmasi';
    } else {
        paymentStatusChip.textContent = 'Menunggu Konfirmasi Pembayaran';
        accessText.textContent = 'Akses Kamera Terkunci';
        accessDot.classList.remove('ok');
        activateCameraBtn.disabled = true;
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = 'Konfirmasi Pembayaran';
    }
}

async function confirmPayment() {
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = 'Memproses...';

    try {
        const response = await fetch(APP.paymentConfirmUrl, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ confirm: true }),
        });

        const data = await response.json();

        if (data.success) {
            APP.isPaid = true;
            updatePaymentUI();
        } else {
            alert('Konfirmasi pembayaran gagal.');
            confirmPaymentBtn.disabled = false;
            confirmPaymentBtn.textContent = 'Konfirmasi Pembayaran';
        }
    } catch (error) {
        console.error(error);
        alert('Terjadi kendala saat konfirmasi pembayaran.');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = 'Konfirmasi Pembayaran';
    }
}

function renderFrames() {
    framesGrid.innerHTML = '';

    APP.frames.forEach((frame) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'frame-item';
        item.dataset.id = frame.id;

        item.innerHTML = `
            <img class="frame-thumb" src="${frame.path}" alt="${frame.name}">
            <div>
                <h4>${frame.name}</h4>
                <p>Modern photobooth overlay</p>
            </div>
        `;

        item.addEventListener('click', () => selectFrame(frame.id));
        framesGrid.appendChild(item);
    });
}

function selectFrame(frameId) {
    APP.selectedFrame = APP.frames.find((frame) => frame.id === frameId) || null;

    document.querySelectorAll('.frame-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.id === frameId);
    });

    if (APP.selectedFrame) {
        frameOverlay.src = APP.selectedFrame.path;
        frameOverlay.style.display = 'block';
    }
}

async function startCamera() {
    if (!APP.isPaid) {
        alert('Konfirmasi pembayaran dulu ya.');
        return;
    }

    try {
        if (APP.stream) {
            stopCamera();
        }

        APP.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1080 },
                height: { ideal: 1440 },
            },
            audio: false,
        });

        camera.srcObject = APP.stream;
        APP.cameraReady = true;

        cameraPlaceholder.style.display = 'none';
        cameraBadge.textContent = 'Kamera Aktif';
        startSessionBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Kamera gagal diakses. Pastikan izin kamera sudah diizinkan di browser.');
    }
}

function stopCamera() {
    if (APP.stream) {
        APP.stream.getTracks().forEach((track) => track.stop());
        APP.stream = null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showCountdown(from = 3) {
    countdownEl.style.display = 'flex';

    for (let i = from; i >= 1; i--) {
        countdownEl.textContent = i;
        await sleep(1000);
    }

    countdownEl.textContent = '📸';
    await sleep(500);
    countdownEl.style.display = 'none';
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function drawContainImage(ctx, img, boxX, boxY, boxWidth, boxHeight) {
    const imgRatio = img.width / img.height;
    const boxRatio = boxWidth / boxHeight;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imgRatio > boxRatio) {
        drawWidth = boxWidth;
        drawHeight = boxWidth / imgRatio;
        drawX = boxX;
        drawY = boxY + (boxHeight - drawHeight) / 2;
    } else {
        drawHeight = boxHeight;
        drawWidth = boxHeight * imgRatio;
        drawX = boxX + (boxWidth - drawWidth) / 2;
        drawY = boxY;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

async function captureSingleShot() {
    const width = 1080;
    const height = 1440;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0b0f18');
    gradient.addColorStop(1, '#05070d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = camera.videoWidth;
    tempCanvas.height = camera.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.save();
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(camera, 0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.restore();

    drawContainImage(ctx, tempCanvas, 0, 0, width, height);

    if (APP.selectedFrame?.path) {
        const overlayImage = await loadImage(APP.selectedFrame.path);
        ctx.drawImage(overlayImage, 0, 0, width, height);
    }

    return canvas.toDataURL('image/png');
}

async function runPhotoSession() {
    if (!APP.cameraReady) {
        alert('Aktifkan kamera dulu.');
        return;
    }

    startSessionBtn.disabled = true;
    retakeBtn.disabled = true;
    downloadBtn.disabled = true;

    APP.shots = [];
    APP.resultDataUrl = null;
    resetThumbs();
    clearResult();

    try {
        for (let i = 0; i < 3; i++) {
            cameraBadge.textContent = `Mengambil foto ${i + 1} dari 3`;
            await showCountdown(3);
            const shot = await captureSingleShot();
            APP.shots.push(shot);
            setThumb(i, shot);
            await sleep(500);
        }

        cameraBadge.textContent = 'Sesi Selesai';
        await buildPhotostrip();
        retakeBtn.disabled = false;
        downloadBtn.disabled = false;
    } catch (error) {
        console.error(error);
        alert('Gagal mengambil foto.');
    } finally {
        startSessionBtn.disabled = false;
    }
}

function setThumb(index, dataUrl) {
    thumbs[index].src = dataUrl;
    thumbWrappers[index].style.display = 'block';
}

function resetThumbs() {
    thumbWrappers.forEach((wrapper) => {
        wrapper.style.display = 'none';
    });

    thumbs.forEach((img) => {
        img.src = '';
    });
}

function clearResult() {
    resultCanvas.style.display = 'none';
    emptyResult.style.display = 'block';
    const ctx = resultCanvas.getContext('2d');
    ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
}

async function buildPhotostrip() {
    const stripWidth = 1080;
    const headerHeight = 190;
    const photoHeight = 1440;
    const footerHeight = 170;
    const sidePadding = 46;
    const gap = 26;
    const stripHeight = headerHeight + (photoHeight * 3) + (gap * 4) + footerHeight;

    resultCanvas.width = stripWidth;
    resultCanvas.height = stripHeight;

    const ctx = resultCanvas.getContext('2d');

    ctx.fillStyle = '#f8f8fb';
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    const headerGradient = ctx.createLinearGradient(0, 0, stripWidth, 0);
    headerGradient.addColorStop(0, '#111827');
    headerGradient.addColorStop(1, '#312e81');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, stripWidth, headerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Arial';
    ctx.fillText('PHOTOBOOTH RAKA', 52, 82);

    ctx.font = '30px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillText(new Date().toLocaleString('id-ID'), 52, 130);

    let currentY = headerHeight + gap;

    for (let i = 0; i < APP.shots.length; i++) {
        const img = await loadImage(APP.shots[i]);

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, sidePadding, currentY, stripWidth - (sidePadding * 2), photoHeight, 28, true, false);

        ctx.save();
        roundRect(ctx, sidePadding, currentY, stripWidth - (sidePadding * 2), photoHeight, 28, false, false);
        ctx.clip();
        drawContainImage(
            ctx,
            img,
            sidePadding,
            currentY,
            stripWidth - (sidePadding * 2),
            photoHeight
        );
        ctx.restore();

        currentY += photoHeight + gap;
    }

    const footerY = stripHeight - footerHeight;
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(0, footerY, stripWidth, footerHeight);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 34px Arial';
    ctx.fillText('Thanks for capturing your moment ✨', 52, footerY + 70);

    ctx.fillStyle = '#6b7280';
    ctx.font = '28px Arial';
    ctx.fillText('Photobooth session by Raka Aditya', 52, footerY + 118);

    APP.resultDataUrl = resultCanvas.toDataURL('image/png');
    resultCanvas.style.display = 'block';
    emptyResult.style.display = 'none';
}

function downloadResult() {
    if (!APP.resultDataUrl) {
        return;
    }

    const link = document.createElement('a');
    link.href = APP.resultDataUrl;
    link.download = `photobooth-raka-${Date.now()}.png`;
    link.click();
}

function resetSession() {
    APP.shots = [];
    APP.resultDataUrl = null;
    resetThumbs();
    clearResult();
    cameraBadge.textContent = APP.cameraReady ? 'Kamera Aktif' : 'Belum Aktif';
    retakeBtn.disabled = true;
    downloadBtn.disabled = true;
}

window.addEventListener('beforeunload', stopCamera);

initialize();