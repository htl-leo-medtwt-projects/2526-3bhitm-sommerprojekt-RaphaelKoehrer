/* ===================================================================
 * KöhrerGainz - Profile Page
 * =================================================================== */

const Profile = (() => {
    let activeSection = 'overview';
    let currentUser = null;

    async function init() {
        const userId = localStorage.getItem('kg_user_id');
        if (!userId) {
            window.location.href = 'auth.html';
            return;
        }

        try {
            const result = await Api.getCurrentUser(userId);
            if (!result.success || !result.user) {
                // API says user is invalid -> clear storage and redirect
                localStorage.removeItem('kg_user_id');
                localStorage.removeItem('kg_current_user');
                window.location.href = 'auth.html';
                return;
            }
            currentUser = result.user;
            localStorage.setItem('kg_current_user', JSON.stringify(currentUser));
        } catch (error) {
            // Network/server error: fall back to cached user data instead of redirecting
            const cached = localStorage.getItem('kg_current_user');
            if (cached) {
                try {
                    currentUser = JSON.parse(cached);
                } catch (e) {
                    localStorage.removeItem('kg_user_id');
                    localStorage.removeItem('kg_current_user');
                    window.location.href = 'auth.html';
                    return;
                }
            } else {
                // No cache available, user must log in again
                localStorage.removeItem('kg_user_id');
                window.location.href = 'auth.html';
                return;
            }
        }

        renderSidebar(currentUser);
        bindMenuEvents();
        showSection('overview');
        await loadOrders();
    }

    function renderSidebar(user) {
        const avatar = document.getElementById('profileAvatar');
        const name = document.getElementById('profileName');
        const email = document.getElementById('profileEmail');

        const displayName = user.full_name || user.username || user.name || 'User';
        if (avatar) avatar.textContent = displayName.charAt(0).toUpperCase();
        if (name) name.textContent = displayName;
        if (email) email.textContent = user.email;
    }

    function bindMenuEvents() {
        document.querySelectorAll('.profile-menu-item').forEach(item => {
            item.onclick = () => {
                const section = item.dataset.section;
                if (section === 'logout') {
                    handleLogout();
                    return;
                }
                showSection(section);
            };
        });

        const profileForm = document.getElementById('profileUpdateForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }
    }

    function showSection(section) {
        activeSection = section;

        document.querySelectorAll('.profile-menu-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.profile-menu-item[data-section="${section}"]`)?.classList.add('active');

        document.querySelectorAll('.profile-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(`section-${section}`)?.classList.remove('d-none');

        if (section === 'orders') loadOrders();
        if (section === 'settings') loadSettings();
    }

    async function loadOrders() {
        const container = document.getElementById('ordersList');
        if (!container) return;

        const userId = localStorage.getItem('kg_user_id');
        
        try {
            const orders = await Api.getOrders(userId);
            
            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>Noch keine Bestellungen</h3>
                        <p>Zeit für deine erste Bestellung!</p>
                        <a href="products.html" class="btn btn-primary">Jetzt shoppen</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = orders.map(order => `
                <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-family: var(--font-heading); font-weight: 600;">Bestellung #${order.order_id || order.id}</span>
                        <span class="status-badge ${order.status || 'pending'}">${getStatusText(order.status)}</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
                        ${new Date(order.created_at || order.createdAt).toLocaleDateString('de-AT')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${order.items ? order.items.map(i => i.product_name || i.productName).join(', ') : 'Bestellung'}
                        </div>
                        <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem;">€${parseFloat(order.total_amount || order.total).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<p style="color: var(--text-muted);">Fehler beim Laden der Bestellungen.</p>';
        }
    }

    function loadSettings() {
        if (!currentUser) return;
        const nameField = document.getElementById('settingsName');
        const emailField = document.getElementById('settingsEmail');
        if (nameField) nameField.value = currentUser.full_name || currentUser.username || '';
        if (emailField) emailField.value = currentUser.email || '';
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        const userId = localStorage.getItem('kg_user_id');
        
        const name = document.getElementById('settingsName')?.value.trim();
        const email = document.getElementById('settingsEmail')?.value.trim();
        const password = document.getElementById('settingsPassword')?.value;

        const data = {};
        if (name) data.full_name = name;
        if (email) data.email = email;
        if (password && password.length >= 6) data.password = password;

        try {
            const result = await Api.updateProfile(userId, data);
            if (result.success) {
                App.showToast('Profil aktualisiert! 💪', 'success');
                currentUser = result.user;
                renderSidebar(currentUser);
                document.getElementById('settingsPassword').value = '';
            } else {
                App.showToast(result.message || 'Fehler beim Aktualisieren.', 'error');
            }
        } catch (error) {
            App.showToast('Fehler beim Aktualisieren.', 'error');
        }
    }

    function handleLogout() {
        Api.logout();
        localStorage.removeItem('kg_user_id');
        localStorage.removeItem('kg_current_user');
        App.showToast('Erfolgreich ausgeloggt!', 'info');
        setTimeout(() => window.location.href = 'index.html', 500);
    }

    function getStatusText(status) {
        const map = {
            'pending': 'In Bearbeitung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert',
            'shipped': 'Versendet',
            'processing': 'In Bearbeitung'
        };
        return map[status] || status || 'In Bearbeitung';
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('profileAvatar')) {
            init();
        }
    });

    return { init, showSection };
})();