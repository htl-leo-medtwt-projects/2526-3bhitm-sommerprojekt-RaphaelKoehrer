/* ===================================================================
 * KöhrerGainz - Cookie Consent (DSGVO / GDPR)
 * =================================================================== */

const CookieConsent = (() => {
    const KEY = 'kg_cookie_consent';

    function hasConsent() {
        return localStorage.getItem(KEY) !== null;
    }

    function getConsent() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveConsent(analytics, marketing) {
        localStorage.setItem(KEY, JSON.stringify({
            essential: true,
            analytics,
            marketing,
            timestamp: new Date().toISOString()
        }));
    }

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-inner">
                <div class="cookie-text">
                    <div class="cookie-icon">🍪</div>
                    <div>
                        <strong>Wir verwenden Cookies!</strong>
                        <p>Diese Website nutzt Cookies um dir die beste Erfahrung zu bieten. Essentielle Cookies sind immer aktiv. Weitere Infos in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
                    </div>
                </div>
                <div class="cookie-options">
                    <label class="cookie-toggle">
                        <input type="checkbox" id="cookie-essential" checked disabled>
                        <span class="toggle-slider"></span>
                        <span>Essentiell</span>
                    </label>
                    <label class="cookie-toggle">
                        <input type="checkbox" id="cookie-analytics" checked>
                        <span class="toggle-slider"></span>
                        <span>Analyse</span>
                    </label>
                    <label class="cookie-toggle">
                        <input type="checkbox" id="cookie-marketing">
                        <span class="toggle-slider"></span>
                        <span>Marketing</span>
                    </label>
                </div>
                <div class="cookie-actions">
                    <button class="btn btn-outline btn-sm" id="cookie-reject">Nur essentiell</button>
                    <button class="btn btn-secondary btn-sm" id="cookie-custom">Auswahl bestätigen</button>
                    <button class="btn btn-primary btn-sm" id="cookie-accept">Alle akzeptieren 💪</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Animate in
        setTimeout(() => banner.classList.add('visible'), 300);

        // Buttons
        document.getElementById('cookie-accept').onclick = () => {
            saveConsent(true, true);
            hideBanner(banner);
        };

        document.getElementById('cookie-reject').onclick = () => {
            saveConsent(false, false);
            hideBanner(banner);
        };

        document.getElementById('cookie-custom').onclick = () => {
            const analytics = document.getElementById('cookie-analytics').checked;
            const marketing = document.getElementById('cookie-marketing').checked;
            saveConsent(analytics, marketing);
            hideBanner(banner);
        };
    }

    function hideBanner(banner) {
        banner.classList.remove('visible');
        banner.classList.add('hiding');
        setTimeout(() => banner.remove(), 400);
    }

    function init() {
        if (!hasConsent()) {
            // Delay slightly so page loads first
            setTimeout(createBanner, 800);
        }
    }

    // Allow reinvoking consent settings
    function resetConsent() {
        localStorage.removeItem(KEY);
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init, resetConsent, getConsent, hasConsent };
})();
