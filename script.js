// ══════════════════════════════════════════
// GARAGE J57 — SCRIPT
// script.js
// ══════════════════════════════════════════

// ──────────────────────────────────────
// Logo Upload
// Picks an image file and updates every
// .logo-target <img> on the page at once.
// ──────────────────────────────────────
const fileInput = document.getElementById('logo-file-input');
const logoTargets = document.querySelectorAll('.logo-target');

fileInput.addEventListener('change', function () {
    const file = fileInput.files[0];
    if (!file) return;

    const objectURL = URL.createObjectURL(file);

    logoTargets.forEach(function (img) {
        img.src = objectURL;
        img.style.display = '';
    });

    // Hide any fallback text in the nav
    document.querySelectorAll('.nav__logo-fallback').forEach(function (el) {
        el.style.display = 'none';
    });
});