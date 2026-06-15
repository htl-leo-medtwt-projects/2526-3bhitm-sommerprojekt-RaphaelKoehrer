/* ===================================================================
 * KöhrerGainz - Discount Codes & Animations
 * =================================================================== */

const Discount = (() => {
    function playAnimation(animationType, percent) {
        switch (animationType) {
            case 'confetti':
                showConfetti();
                showDiscountBanner(`-${percent}% RABATT!`);
                break;
            case 'fireworks':
                showFireworks();
                showDiscountBanner(`-${percent}% MEGA DEAL!`);
                break;
            case 'shake':
                shakeScreen();
                showDiscountBanner(`-${percent}%!`);
                break;
            default:
                showDiscountBanner(`-${percent}%!`);
        }
    }

    function showConfetti() {
        const container = document.createElement('div');
        container.className = 'discount-celebration';
        document.body.appendChild(container);

        const colors = ['#e94560', '#ff6b81', '#ff9f1c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f'];

        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 1 + 's';
            confetti.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
            confetti.style.width = (Math.random() * 8 + 5) + 'px';
            confetti.style.height = (Math.random() * 8 + 5) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(confetti);
        }

        setTimeout(() => container.remove(), 3000);
    }

    function showFireworks() {
        const container = document.createElement('div');
        container.className = 'discount-celebration';
        document.body.appendChild(container);

        const colors = ['#e94560', '#ff9f1c', '#f1c40f', '#2ecc71', '#3498db'];

        // Multiple burst points
        for (let burst = 0; burst < 5; burst++) {
            const cx = Math.random() * 80 + 10;
            const cy = Math.random() * 60 + 10;

            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'confetti';
                particle.style.left = cx + '%';
                particle.style.top = cy + '%';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.borderRadius = '50%';
                particle.style.width = '6px';
                particle.style.height = '6px';

                const angle = (Math.PI * 2 / 20) * i;
                const distance = Math.random() * 200 + 100;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;

                particle.style.animation = 'none';
                particle.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                particle.style.opacity = '1';

                container.appendChild(particle);

                setTimeout(() => {
                    particle.style.transform = `translate(${dx}px, ${dy}px)`;
                    particle.style.opacity = '0';
                }, 50 + burst * 200);
            }
        }

        setTimeout(() => container.remove(), 3000);
    }

    function shakeScreen() {
        document.body.style.animation = 'shake 0.4s ease 3';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 1200);
    }

    function showDiscountBanner(text) {
        // Remove any existing banner first
        const existing = document.querySelector('.discount-banner');
        if (existing) {
            existing.classList.add('animate-out');
            setTimeout(() => existing.remove(), 400);
        }

        const banner = document.createElement('div');
        banner.className = 'discount-banner';
        banner.innerHTML = `<span class="discount-banner-icon">🏷️</span><span>${text}</span>`;
        document.body.appendChild(banner);

        // Double rAF ensures transition triggers after mount
        requestAnimationFrame(() => {
            requestAnimationFrame(() => banner.classList.add('animate-in'));
        });

        setTimeout(() => {
            banner.classList.add('animate-out');
            setTimeout(() => banner.remove(), 450);
        }, 2800);
    }

    return { playAnimation };
})();
