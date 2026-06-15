/* ===================================================================
 * KöhrerGainz - Global App Logic
 * Theme toggle, navigation, toast notifications, scroll animations,
 * cart badge updates, newsletter handling
 * =================================================================== */

const App = (() => {
    // ===== THEME =====
    function initTheme() {
        const saved = localStorage.getItem('kg_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('kg_theme', next);
        updateThemeIcon(next);
    }

    function updateThemeIcon(theme) {
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.title = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    // ===== NAVIGATION =====
    function initNav() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close on link click
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        }

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        // Active link highlighting
        highlightActiveNav();
    }

    function highlightActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const pageLabels = {
            'index.html': 'Home',
            'products.html': 'Produkte',
            'product.html': 'Produkt',
            'cart.html': 'Warenkorb',
            'checkout.html': 'Checkout',
            'calculator.html': 'Rechner',
            'auth.html': 'Account',
            'profile.html': 'Profil',
            'order-success.html': 'Danke',
            'faq.html': 'FAQ',
            'ueber-uns.html': 'Über uns',
            'kontakt.html': 'Kontakt',
            'impressum.html': 'Impressum',
            'datenschutz.html': 'Datenschutz',
            'agb.html': 'AGB',
            'versand.html': 'Versand',
            '404.html': 'Fehler',
            'admin.html': 'Admin'
        };
        
        const currentPageLabel = pageLabels[currentPage] || 'Seite';
        const currentPageEl = document.querySelector('.nav-current-page');
        if (currentPageEl) {
            currentPageEl.textContent = currentPageLabel;
        }
        
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '✅',
            error: '❌',
            info: '💪'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    // ===== CART BADGE =====
    function updateCartBadge() {
        const badge = document.querySelector('.cart-count');
        if (badge) {
            const count = Cart.getCartCount();
            badge.textContent = count;
            badge.setAttribute('data-count', count);
            if (count > 0) {
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ===== PUMP ANIMATION (Add to cart) =====
    function showPumpAnimation() {
        const overlay = document.createElement('div');
        overlay.className = 'pump-overlay';
        overlay.textContent = '💪';
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 900);
    }

    // ===== ADD TO CART (Global helper) =====
    async function addToCart(productId, quantity = 1) {
        // Ensure products are cached
        if (!window.productsCache || window.productsCache.length === 0) {
            try {
                window.productsCache = await Api.getProducts();
            } catch(e) {}
        }
        const result = Cart.addToCart(productId, quantity);
        if (result.success) {
            const products = window.productsCache || [];
            const product = products.find(p => parseInt(p.id || p.product_id) === parseInt(productId));
            showToast(`${product ? product.name : 'Produkt'} zum Warenkorb hinzugefügt!`, 'success');
            showPumpAnimation();
            updateCartBadge();
        } else {
            showToast(result.message || 'Fehler', 'error');
        }
        return result;
    }

    // ===== SCROLL REVEAL =====
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // ===== NEWSLETTER =====
    function initNewsletter() {
        const form = document.querySelector('.newsletter-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                if (!email) return;

                const result = await Api.subscribeNewsletter(email);
                if (result.success) {
                    showToast('Newsletter abonniert! Willkommen bei der Köhrer-Family! 💪', 'success');
                    form.reset();
                } else {
                    showToast(result.message, 'info');
                }
            });
        }
    }

    // ===== USER NAV UPDATE =====
    async function updateUserNav() {
    const userId = localStorage.getItem('kg_user_id');
    if (!userId) {
        // Nicht eingeloggt
        return;
    }
    
    try {
        const result = await Api.getCurrentUser(userId);
        if (result.success && result.user) {
            // User ist eingeloggt
            localStorage.setItem('kg_current_user', JSON.stringify(result.user));
        }
    } catch(e) {
        console.error('User not logged in');
    }
}

    // ===== INIT =====
    function init() {
        initTheme();
        initNav();
        initScrollReveal();
        initNewsletter();
        updateCartBadge();
        updateUserNav();
    }

    // Auto-init on DOM ready
    document.addEventListener('DOMContentLoaded', init);

    return {
        toggleTheme,
        showToast,
        updateCartBadge,
        showPumpAnimation,
        addToCart,
        updateUserNav,
        initScrollReveal
    };
})();
