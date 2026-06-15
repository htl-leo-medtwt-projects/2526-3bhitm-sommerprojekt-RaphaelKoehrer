/* ===================================================================
 * KöhrerGainz - Advanced Animation System
 * Particles, counters, tilt, parallax, typewriter, stagger, cursor
 * =================================================================== */

const Animations = (() => {

    // ===== PARTICLE BACKGROUND =====
    function initParticles(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animId;

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                color: Math.random() > 0.7 ? '#e94560' : '#ffffff'
            };
        }

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(233,69,96,${0.12 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawConnections();
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color.replace(')', `,${p.alpha})`).replace('rgb', 'rgba').replace('#e94560', `rgba(233,69,96,${p.alpha})`).replace('#ffffff', `rgba(255,255,255,${p.alpha})`);
                ctx.fill();
            });
            animId = requestAnimationFrame(animate);
        }

        resize();
        const count = Math.floor((canvas.width * canvas.height) / 8000);
        for (let i = 0; i < Math.min(count, 80); i++) {
            particles.push(createParticle());
        }
        animate();

        window.addEventListener('resize', () => {
            cancelAnimationFrame(animId);
            particles = [];
            resize();
            const newCount = Math.floor((canvas.width * canvas.height) / 8000);
            for (let i = 0; i < Math.min(newCount, 80); i++) {
                particles.push(createParticle());
            }
            animate();
        });
    }

    // ===== TYPEWRITER EFFECT =====
    function typeWriter(elementId, texts, speed = 80, pause = 2000) {
        const el = document.getElementById(elementId);
        if (!el) return;
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function tick() {
            const currentText = texts[textIndex];
            if (!isDeleting) {
                el.textContent = currentText.slice(0, charIndex + 1);
                charIndex++;
                if (charIndex === currentText.length) {
                    isDeleting = true;
                    setTimeout(tick, pause);
                    return;
                }
            } else {
                el.textContent = currentText.slice(0, charIndex - 1);
                charIndex--;
                if (charIndex === 0) {
                    isDeleting = false;
                    textIndex = (textIndex + 1) % texts.length;
                }
            }
            setTimeout(tick, isDeleting ? speed / 2 : speed);
        }
        tick();
    }

    // ===== NUMBER COUNTER ANIMATION =====
    function animateCounter(element, target, duration = 1500, suffix = '', prefix = '') {
        const start = 0;
        const startTime = performance.now();
        const isFloat = target % 1 !== 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = start + (target - start) * eased;
            element.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (!counters.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    const target = parseFloat(entry.target.dataset.count);
                    const suffix = entry.target.dataset.suffix || '';
                    const prefix = entry.target.dataset.prefix || '';
                    animateCounter(entry.target, target, 1800, suffix, prefix);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
    }

    // ===== 3D CARD TILT =====
    function initTilt(selector = '.product-card, .feature-card, .calculator-card') {
        document.querySelectorAll(selector).forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rotateX = ((y - cy) / cy) * -6;
                const rotateY = ((x - cx) / cx) * 6;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
                card.style.transition = 'transform 0.1s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
                card.style.transition = 'transform 0.4s ease';
            });
        });
    }

    // ===== STAGGER ANIMATION =====
    function initStagger(containerSelector, childSelector = ':scope > *', delay = 80) {
        document.querySelectorAll(containerSelector).forEach(container => {
            const children = container.querySelectorAll(childSelector);
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        children.forEach((child, i) => {
                            setTimeout(() => {
                                child.classList.add('stagger-visible');
                            }, i * delay);
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.1 });

            children.forEach(child => child.classList.add('stagger-child'));
            observer.observe(container);
        });
    }

    // ===== PARALLAX SCROLL =====
    function initParallax() {
        const elements = document.querySelectorAll('[data-parallax]');
        if (!elements.length) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            elements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.3;
                const rect = el.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const offset = (centerY - window.innerHeight / 2) * speed;
                el.style.transform = `translateY(${offset}px)`;
            });
        }, { passive: true });
    }

    // ===== MAGNETIC BUTTONS =====
    function initMagneticButtons() {
        document.querySelectorAll('.btn-primary, .btn-magnetic').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s ease';
            });
        });
    }

    // ===== RIPPLE EFFECT ON BUTTONS =====
    function initRipple() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // ===== GLITCH TEXT EFFECT =====
    function glitchText(elementId, duration = 300) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const original = el.textContent;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let iteration = 0;
        const interval = setInterval(() => {
            el.textContent = original.split('').map((char, i) => {
                if (i < iteration) return original[i];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            if (iteration >= original.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
    }

    // ===== PROGRESS BAR ANIMATION =====
    function animateProgressBars() {
        document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        bar.style.width = bar.dataset.width + '%';
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(bar);
        });
    }

    // ===== SCROLL PROGRESS BAR =====
    function initScrollProgress() {
        const bar = document.createElement('div');
        bar.className = 'scroll-progress-bar';
        document.body.appendChild(bar);

        window.addEventListener('scroll', () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            bar.style.width = scrolled + '%';
        }, { passive: true });
    }

    // ===== FLOATING PARTICLES (CSS-based) =====
    function createFloatingParticles(containerId, count = 15) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const particles = ['💪', '🔥', '⚡', '🏋️', '⚽', '💯'];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'floating-particle';
            p.textContent = particles[Math.floor(Math.random() * particles.length)];
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 8}s;
                animation-duration: ${6 + Math.random() * 6}s;
                font-size: ${0.8 + Math.random() * 1.2}rem;
                opacity: ${0.1 + Math.random() * 0.2};
            `;
            container.appendChild(p);
        }
    }

    // ===== REVEAL ON SCROLL (enhanced) =====
    function initReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
            observer.observe(el);
        });
    }

    // ===== SMOOTH HOVER GLOW =====
    function initHoverGlow() {
        document.querySelectorAll('.product-card, .stat-card, .feature-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(233,69,96,0.07) 0%, transparent 60%), var(--gradient-card)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = '';
            });
        });
    }

    // ===== FLY TO CART =====
    function flyToCart(sourceEl) {
        if (!sourceEl) return;
        const cartIcon = document.querySelector('.cart-icon, .nav-cart, [href="cart.html"]');
        if (!cartIcon) return;

        const srcRect = sourceEl.getBoundingClientRect();
        const dstRect = cartIcon.getBoundingClientRect();

        const fly = document.createElement('div');
        fly.className = 'fly-to-cart-item';
        fly.textContent = sourceEl.querySelector('span')?.textContent || '🛒';
        fly.style.cssText = `
            position: fixed;
            left: ${srcRect.left + srcRect.width / 2 - 20}px;
            top: ${srcRect.top + srcRect.height / 2 - 20}px;
            width: 40px; height: 40px;
            font-size: 1.8rem;
            text-align: center;
            line-height: 40px;
            border-radius: 50%;
            background: var(--accent);
            z-index: 9999;
            pointer-events: none;
            transition: left 0.75s cubic-bezier(0.25,0.46,0.45,0.94),
                        top 0.75s cubic-bezier(0.25,0.46,0.45,0.94),
                        transform 0.75s ease,
                        opacity 0.75s ease;
        `;
        document.body.appendChild(fly);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fly.style.left = `${dstRect.left + dstRect.width / 2 - 20}px`;
                fly.style.top = `${dstRect.top + dstRect.height / 2 - 20}px`;
                fly.style.transform = 'scale(0.3)';
                fly.style.opacity = '0';
            });
        });

        setTimeout(() => {
            fly.remove();
            // Bump the cart icon
            cartIcon.classList.add('cart-icon-bump');
            setTimeout(() => cartIcon.classList.remove('cart-icon-bump'), 400);
        }, 780);
    }

    // ===== ANIMATE CART ITEM REMOVE =====
    function animateCartRemove(itemEl, callback) {
        if (!itemEl) { callback(); return; }
        itemEl.classList.add('cart-item-removing');
        setTimeout(callback, 360);
    }

    // ===== ANIMATE PRICE / NUMBER BUMP =====
    function animatePriceBump(el) {
        if (!el) return;
        el.classList.remove('price-bump');
        void el.offsetWidth; // reflow
        el.classList.add('price-bump');
        setTimeout(() => el.classList.remove('price-bump'), 500);
    }

    // ===== ADD SUCCESS BUTTON STATE =====
    function animateAddSuccess(btnEl) {
        if (!btnEl) return;
        const original = btnEl.innerHTML;
        const originalBg = btnEl.style.background;
        btnEl.innerHTML = '✓';
        btnEl.classList.add('btn-add-success');
        btnEl.disabled = true;
        setTimeout(() => {
            btnEl.innerHTML = original;
            btnEl.classList.remove('btn-add-success');
            btnEl.style.background = originalBg;
            btnEl.disabled = false;
        }, 1400);
    }

    // ===== SHAKE ELEMENT =====
    function shakeElement(el) {
        if (!el) return;
        el.classList.remove('shake-anim');
        void el.offsetWidth;
        el.classList.add('shake-anim');
        setTimeout(() => el.classList.remove('shake-anim'), 500);
    }

    // ===== STAGGER REVEAL (for dynamic re-renders) =====
    function staggerReveal(containerEl, childSelector, delay) {
        if (!containerEl) return;
        delay = delay || 60;
        const children = containerEl.querySelectorAll(childSelector || '*');
        children.forEach((child, i) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(22px)';
            child.style.transition = `opacity 0.35s ease ${i * delay}ms, transform 0.35s ease ${i * delay}ms`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    child.style.opacity = '1';
                    child.style.transform = 'translateY(0)';
                });
            });
        });
    }

    // ===== ANIMATE HEART PULSE =====
    function animateHeart(el) {
        if (!el) return;
        el.classList.remove('heart-anim');
        void el.offsetWidth;
        el.classList.add('heart-anim');
        setTimeout(() => el.classList.remove('heart-anim'), 500);
    }

    // ===== INIT ALL =====
    function init() {
        initReveal();
        initCounters();
        initScrollProgress();
        initRipple();
        initParallax();
        setTimeout(() => {
            initTilt();
            initMagneticButtons();
            initHoverGlow();
            initStagger('.products-grid', '.product-card');
            initStagger('.features-grid', '.feature-card');
            initStagger('.categories-grid', '.category-card');
            animateProgressBars();
        }, 100);
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        initParticles,
        typeWriter,
        animateCounter,
        initCounters,
        initTilt,
        glitchText,
        createFloatingParticles,
        initStagger,
        staggerReveal,
        animateProgressBars,
        flyToCart,
        animateCartRemove,
        animatePriceBump,
        animateAddSuccess,
        shakeElement,
        animateHeart
    };
})();
