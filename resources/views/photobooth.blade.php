<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photobooth Raka</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="stylesheet" href="{{ asset('css/photobooth.css') }}">
</head>
<body>
    <script>
        window.photoboothConfig = {
            isPaid: @json($isPaid),
            frames: @json($frames),
            paymentConfirmUrl: @json(route('photobooth.payment.confirm')),
        };
    </script>

    <div class="container">
        <div class="topbar">
            <div class="brand">
                <div class="brand-badge"></div>
                <div>
                    <h1>Photobooth Raka Aditya</h1>
                    <p>Modern web photobooth with payment-first experience</p>
                </div>
            </div>

            <div class="status-chip" id="paymentStatusChip">
                {{ $isPaid ? 'Pembayaran Terkonfirmasi' : 'Menunggu Konfirmasi Pembayaran' }}
            </div>
        </div>

        <div class="layout">
            <aside class="card sidebar">
                <h3 class="section-title">1. Pembayaran QRIS</h3>
                <p class="section-desc">
                    Scan QRIS di bawah ini. Sesuai alur yang kamu mau, QRIS ini hanya formalitas
                    untuk membuka akses sesi photobooth. User cukup klik konfirmasi pembayaran
                    untuk lanjut ke kamera.
                </p>

                <div class="qris-box">
                    <img src="{{ $qrisImage }}" alt="QRIS Payment">
                </div>

                <div class="payment-note">
                    Nominal pembayaran bisa kamu ubah bebas. Untuk versi MVP ini,
                    konfirmasi pembayaran masih berupa tombol manual sebelum user
                    boleh mengaktifkan kamera.
                </div>

                <div class="action-stack">
                    <button class="btn btn-primary" id="confirmPaymentBtn">
                        Konfirmasi Pembayaran
                    </button>

                    <button class="btn btn-secondary" id="activateCameraBtn" disabled>
                        Aktifkan Kamera
                    </button>
                </div>

                <div class="steps">
                    <div class="step">
                        <div class="step-index">1</div>
                        <div>
                            <h4>Bayar / Konfirmasi</h4>
                            <p>Setelah klik konfirmasi, sistem membuka akses ke sesi kamera.</p>
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-index">2</div>
                        <div>
                            <h4>Pilih Frame</h4>
                            <p>User memilih overlay photobooth yang ingin dipakai.</p>
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-index">3</div>
                        <div>
                            <h4>Ambil 3 Foto</h4>
                            <p>Setelah selesai, hasil digabung jadi photostrip dan bisa di-download.</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="card main">
                <div class="hero">
                    <div>
                        <h2>Photobooth Session</h2>
                        <p>
                            Preview kamera portrait, pilih frame modern, ambil 3 foto otomatis,
                            lalu tampilkan hasil photostrip siap download.
                        </p>
                    </div>

                    <div class="pill">
                        <span class="pill-dot {{ $isPaid ? 'ok' : '' }}" id="accessDot"></span>
                        <span id="accessText">{{ $isPaid ? 'Akses Kamera Terbuka' : 'Akses Kamera Terkunci' }}</span>
                    </div>
                </div>

                <div class="camera-layout">
                    <div>
                        <div class="preview-shell">
                            <div class="camera-badge" id="cameraBadge">Belum Aktif</div>
                            <video id="camera" autoplay playsinline muted></video>
                            <img id="frameOverlay" class="frame-overlay" alt="Frame Overlay">
                            <div class="countdown" id="countdown">3</div>

                            <div class="camera-placeholder" id="cameraPlaceholder">
                                <div class="camera-placeholder-inner">
                                    <h3>Kamera Belum Aktif</h3>
                                    <p>
                                        Klik konfirmasi pembayaran dulu, lalu aktifkan kamera.
                                        Setelah kamera terbuka, pilih frame dan mulai sesi foto.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="camera-controls">
                            <button class="btn btn-success" id="startSessionBtn" disabled>
                                Mulai Sesi 3 Foto
                            </button>
                            <button class="btn btn-secondary" id="retakeBtn" disabled>
                                Ulang Ambil Foto
                            </button>
                            <button class="btn btn-secondary" id="downloadBtn" disabled>
                                Download Hasil
                            </button>
                        </div>

                        <div class="result-panel">
                            <div class="result-top">
                                <div>
                                    <h3 class="section-title section-title-tight">Hasil Photostrip</h3>
                                    <p class="helper helper-no-margin">
                                        Setelah 3 foto selesai, hasil akan muncul di sini dengan rasio yang tetap proporsional.
                                    </p>
                                </div>
                            </div>

                            <div class="result-strip-wrap">
                                <canvas id="resultCanvas"></canvas>
                                <div class="helper" id="emptyResult">
                                    Belum ada hasil. Selesaikan sesi 3 foto untuk melihat preview photostrip.
                                </div>
                            </div>

                            <div class="thumb-row">
                                <div class="shot-thumb" id="thumb1"><img alt="Shot 1"></div>
                                <div class="shot-thumb" id="thumb2"><img alt="Shot 2"></div>
                                <div class="shot-thumb" id="thumb3"><img alt="Shot 3"></div>
                            </div>
                        </div>
                    </div>

                    <div class="frames-panel">
                        <h3 class="section-title">2. Pilih Frame</h3>
                        <p class="section-desc">
                            Frame di bawah langsung tampil sebagai overlay pada preview kamera
                            dan ikut masuk ke hasil akhir photobooth.
                        </p>

                        <div class="frames-grid" id="framesGrid"></div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script src="{{ asset('js/photobooth.js') }}"></script>
</body>
</html>