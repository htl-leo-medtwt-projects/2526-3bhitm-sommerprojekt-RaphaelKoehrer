const App = (() => {
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
            btn.innerHTML = theme === 'dark' ? 'â˜€ï¸' : 'ðŸŒ™';
            btn.title = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    function initNav() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });

            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        }

        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

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

    function showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '',
            error: '',
            info: ''
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">âœ•</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    function updateCartBadge() {
        const badge = document.querySelector('.cart-count');
        if (badge) {
            const count = DataStore.getCartCount();
            badge.textContent = count;
            badge.setAttribute('data-count', count);
            if (count > 0) {
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function showPumpAnimation() {
        const overlay = document.createElement('div');
        overlay.className = 'pump-overlay';
        overlay.textContent = 'ðŸ’ª';
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 900);
    }

    function addToCart(productId, quantity = 1) {
        const result = DataStore.addToCart(productId, quantity);
        if (result.success) {
            const product = DataStore.getProductById(productId);
            showToast(`${product.name} zum Warenkorb hinzugefÃ¼gt!`, 'success');
            showPumpAnimation();
            updateCartBadge();
        } else {
            showToast(result.message, 'error');
        }
        return result;
    }

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

    function initNewsletter() {
        const form = document.querySelector('.newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                if (!email) return;

                const result = DataStore.subscribeNewsletter(email);
                if (result.success) {
                    showToast('Newsletter abonniert! Willkommen bei der Köhrer-Family!', 'success');
                    form.reset();
                } else {
                    showToast(result.message, 'info');
                }
            });
        }
    }

    function updateUserNav() {
        const user = DataStore.getCurrentUser();
        const userBtn = document.querySelector('.nav-user-btn');
        if (userBtn) {
            if (user) {
                userBtn.innerHTML = `<span>ðŸ‘¤</span>`;
                userBtn.title = user.name;
                userBtn.onclick = () => window.location.href = 'profile.html';
            } else {
                userBtn.innerHTML = `<span>ðŸ‘¤</span>`;
                userBtn.title = 'Login / Registrieren';
                userBtn.onclick = () => window.location.href = 'auth.html';
            }
        }
    }

    function init() {
        initTheme();
        initNav();
        initScrollReveal();
        initNewsletter();
        updateCartBadge();
        updateUserNav();
    }

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

