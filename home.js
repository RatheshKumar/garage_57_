// ══════════════════════════════════════════════════════
//  GARAGE J57 — home.js
// ══════════════════════════════════════════════════════

// ── Cart count ──
let cartCount = 0;

document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', function () {
        cartCount++;
        document.querySelector('.nav__cart-count').textContent = cartCount;

        // Button feedback
        this.textContent = '✓ Added!';
        this.style.background = '#27ae60';
        setTimeout(() => {
            this.textContent = 'Add to Cart';
            this.style.background = '';
        }, 1500);
    });
});

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ── Scroll reveal animation ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.cat-card, .product-card, .feature').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
});