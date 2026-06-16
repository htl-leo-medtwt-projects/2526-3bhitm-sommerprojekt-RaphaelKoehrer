/* ===================================================================
 * KöhrerGainz - Admin Panel
 * =================================================================== */

const Admin = (() => {
    const BASE = 'http://localhost:8083/php/api/';
    let activeSection = 'dashboard';

    async function init() {
        const userId = localStorage.getItem('kg_user_id');
        let user = null;
        try { user = JSON.parse(localStorage.getItem('kg_current_user')); } catch(e) {}

        if (!userId || !user || user.role !== 'admin') {
            App.showToast('Kein Zugriff. Admin-Rechte erforderlich.', 'error');
            setTimeout(() => window.location.href = 'index.html', 1000);
            return;
        }

        bindMenuEvents();
        await showSection('dashboard');
    }

    function bindMenuEvents() {
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', () => showSection(item.dataset.section));
        });
    }

    async function showSection(section) {
        activeSection = section;
        document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.admin-menu-item[data-section="${section}"]`)?.classList.add('active');
        document.querySelectorAll('.admin-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(`admin-${section}`)?.classList.remove('d-none');

        switch (section) {
            case 'dashboard':  renderDashboard();     break;
            case 'products':   renderProductList();   break;
            case 'orders':     renderOrderList();     break;
            case 'users':      renderUserList();      break;
            case 'newsletter': renderNewsletterList();break;
        }
    }

    // ===== DASHBOARD =====
    async function renderDashboard() {
        try {
            const [products, orders, users, newsletter] = await Promise.all([
                fetch(BASE + 'products.php').then(r => r.json()),
                fetch(BASE + 'orders.php?user_id=all').then(r => r.json()).catch(() => []),
                fetch(BASE + 'admin/users.php').then(r => r.json()).catch(() => []),
                fetch(BASE + 'newsletter.php').then(r => r.json()).catch(() => [])
            ]);

            const allOrders = Array.isArray(orders) ? orders : [];
            const allUsers  = Array.isArray(users)  ? users  : [];
            const allNews   = Array.isArray(newsletter) ? newsletter : [];
            const allProds  = products.products || [];

            const revenue = allOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

            document.getElementById('statProducts').textContent  = allProds.length;
            document.getElementById('statOrders').textContent    = allOrders.length;
            document.getElementById('statUsers').textContent     = allUsers.length;
            document.getElementById('statRevenue').textContent   = `€${revenue.toFixed(2)}`;
            document.getElementById('statNewsletter').textContent = allNews.length;

            const recentContainer = document.getElementById('recentOrders');
            if (recentContainer) {
                const recent = allOrders.slice(0, 5);
                if (recent.length === 0) {
                    recentContainer.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Noch keine Bestellungen.</p>';
                } else {
                    recentContainer.innerHTML = `
                        <table class="data-table">
                            <thead><tr><th>#</th><th>Kunde</th><th>Gesamt</th><th>Status</th><th>Datum</th></tr></thead>
                            <tbody>
                                ${recent.map(o => `
                                    <tr>
                                        <td>#${o.id}</td>
                                        <td>${o.customer_name}</td>
                                        <td>€${parseFloat(o.total_amount).toFixed(2)}</td>
                                        <td><span class="status-badge status-${o.status}">${statusLabel(o.status)}</span></td>
                                        <td>${new Date(o.created_at).toLocaleDateString('de-AT')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`;
                }
            }
        } catch(e) {
            console.error('Dashboard error:', e);
        }
    }

    // ===== ORDERS =====
    async function renderOrderList() {
        const container = document.getElementById('adminOrderList');
        if (!container) return;
        container.innerHTML = '<p style="color:var(--text-muted);">Lade Bestellungen…</p>';

        try {
            const res = await fetch(BASE + 'orders.php');
            const orders = await res.json();
            const list = Array.isArray(orders) ? orders : [];

            if (list.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);">Noch keine Bestellungen vorhanden.</p>';
                return;
            }

            container.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;">Bestellungen (${list.length})</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Kunde</th>
                            <th>E-Mail</th>
                            <th>Gesamt</th>
                            <th>Zahlung</th>
                            <th>Status</th>
                            <th>Datum</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(o => `
                            <tr id="order-row-${o.id}">
                                <td><strong>#${o.id}</strong></td>
                                <td>${o.customer_name}</td>
                                <td style="font-size:0.85rem;">${o.customer_email}</td>
                                <td><strong>€${parseFloat(o.total_amount).toFixed(2)}</strong></td>
                                <td style="font-size:0.85rem;">${paymentLabel(o.payment_method)}</td>
                                <td>
                                    <select class="form-control" style="padding:0.2rem 0.5rem;font-size:0.8rem;width:auto;"
                                        onchange="Admin.changeOrderStatus(${o.id}, this.value)">
                                        ${['pending','processing','shipped','completed','cancelled'].map(s =>
                                            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`
                                        ).join('')}
                                    </select>
                                </td>
                                <td style="font-size:0.85rem;">${new Date(o.created_at).toLocaleDateString('de-AT')}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="Admin.showOrderDetails(${o.id})">Details</button>
                                </td>
                            </tr>
                            <tr id="order-details-${o.id}" class="d-none">
                                <td colspan="8" style="background:var(--bg-secondary);padding:1rem;">
                                    <strong>Lieferadresse:</strong> ${o.shipping_address}, ${o.shipping_zip} ${o.shipping_city}, ${o.shipping_country}<br>
                                    <strong>Artikel:</strong> ${(o.items||[]).map(i => `${i.product_name} x${i.quantity} (€${parseFloat(i.unit_price).toFixed(2)})`).join(', ') || '–'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch(e) {
            container.innerHTML = '<p style="color:var(--danger);">Fehler beim Laden der Bestellungen.</p>';
        }
    }

    function showOrderDetails(id) {
        const row = document.getElementById(`order-details-${id}`);
        if (row) row.classList.toggle('d-none');
    }

    async function changeOrderStatus(orderId, status) {
        try {
            const res = await fetch(BASE + 'orders.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status })
            });
            const result = await res.json();
            if (result.success) {
                App.showToast('Status aktualisiert.', 'success');
            } else {
                App.showToast(result.message || 'Fehler.', 'error');
            }
        } catch(e) {
            App.showToast('Fehler beim Aktualisieren.', 'error');
        }
    }

    // ===== USERS =====
    async function renderUserList() {
        const container = document.getElementById('adminUserList');
        if (!container) return;
        container.innerHTML = '<p style="color:var(--text-muted);">Lade Benutzer…</p>';

        try {
            const res = await fetch(BASE + 'admin/users.php');
            const users = await res.json();

            if (!Array.isArray(users) || users.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);">Keine Benutzer gefunden.</p>';
                return;
            }

            container.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;">Benutzer (${users.length})</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Benutzername</th>
                            <th>E-Mail</th>
                            <th>Rolle</th>
                            <th>Registriert</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr id="user-row-${u.id}">
                                <td>#${u.id}</td>
                                <td>${u.full_name || '–'}</td>
                                <td>${u.username}</td>
                                <td style="font-size:0.85rem;">${u.email}</td>
                                <td>
                                    <select class="form-control" style="padding:0.2rem 0.5rem;font-size:0.8rem;width:auto;"
                                        onchange="Admin.changeUserRole(${u.id}, this.value)">
                                        <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Kunde</option>
                                        <option value="admin"    ${u.role === 'admin'    ? 'selected' : ''}>Admin</option>
                                    </select>
                                </td>
                                <td style="font-size:0.85rem;">${new Date(u.created_at).toLocaleDateString('de-AT')}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);"
                                        onclick="Admin.deleteUser(${u.id})">Löschen</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch(e) {
            container.innerHTML = '<p style="color:var(--danger);">Fehler beim Laden der Benutzer.</p>';
        }
    }

    async function changeUserRole(userId, role) {
        try {
            const res = await fetch(BASE + 'admin/users.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, role })
            });
            const result = await res.json();
            App.showToast(result.success ? 'Rolle aktualisiert.' : (result.message || 'Fehler.'), result.success ? 'success' : 'error');
        } catch(e) {
            App.showToast('Fehler beim Aktualisieren.', 'error');
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Benutzer wirklich löschen?')) return;
        try {
            const res = await fetch(BASE + `admin/users.php?id=${userId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                App.showToast('Benutzer gelöscht.', 'info');
                document.getElementById(`user-row-${userId}`)?.remove();
            } else {
                App.showToast(result.message || 'Fehler.', 'error');
            }
        } catch(e) {
            App.showToast('Fehler beim Löschen.', 'error');
        }
    }

    // ===== NEWSLETTER =====
    async function renderNewsletterList() {
        const container = document.getElementById('adminNewsletterList');
        if (!container) return;
        container.innerHTML = '<p style="color:var(--text-muted);">Lade Abonnenten…</p>';

        try {
            const res = await fetch(BASE + 'newsletter.php');
            const list = await res.json();

            if (!Array.isArray(list) || list.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);">Keine Newsletter-Abonnenten vorhanden.</p>';
                return;
            }

            container.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;">Newsletter-Abonnenten (${list.length})</h3>
                    <button class="btn btn-sm btn-outline" onclick="Admin.exportNewsletter()">📥 CSV Export</button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr><th>#</th><th>E-Mail</th><th>Angemeldet am</th><th>Aktionen</th></tr>
                    </thead>
                    <tbody>
                        ${list.map(n => `
                            <tr id="newsletter-row-${n.id}">
                                <td>${n.id}</td>
                                <td>${n.email}</td>
                                <td>${new Date(n.subscribed_at).toLocaleDateString('de-AT')}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);"
                                        onclick="Admin.deleteNewsletter('${n.email}', ${n.id})">Abmelden</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch(e) {
            container.innerHTML = '<p style="color:var(--danger);">Fehler beim Laden der Abonnenten.</p>';
        }
    }

    async function deleteNewsletter(email, rowId) {
        if (!confirm(`${email} wirklich abmelden?`)) return;
        try {
            const res = await fetch(BASE + `newsletter.php?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                App.showToast('Abonnent entfernt.', 'info');
                document.getElementById(`newsletter-row-${rowId}`)?.remove();
            } else {
                App.showToast(result.message || 'Fehler.', 'error');
            }
        } catch(e) {
            App.showToast('Fehler beim Entfernen.', 'error');
        }
    }

    async function exportNewsletter() {
        try {
            const res = await fetch(BASE + 'newsletter.php');
            const list = await res.json();
            if (!Array.isArray(list)) return;
            const csv = 'E-Mail,Angemeldet am\n' + list.map(n =>
                `${n.email},${new Date(n.subscribed_at).toLocaleDateString('de-AT')}`
            ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'newsletter-abonnenten.csv';
            a.click();
        } catch(e) {
            App.showToast('Export fehlgeschlagen.', 'error');
        }
    }

    // ===== PRODUCTS =====
    async function renderProductList() {
        const container = document.getElementById('adminProductList');
        if (!container) return;
        const products = await Api.getProducts();

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="margin:0;">Produkte verwalten</h3>
                <button class="btn btn-primary btn-sm" onclick="Admin.showAddProductForm()">+ Neues Produkt</button>
            </div>
            <div id="addProductFormContainer"></div>
            <table class="data-table">
                <thead>
                    <tr><th>Produkt</th><th>Kategorie</th><th>Preis</th><th>Bestand</th><th>Aktionen</th></tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>📦 ${p.name}</td>
                            <td>${p.category || '-'}</td>
                            <td>€${parseFloat(p.price).toFixed(2)}</td>
                            <td>${p.stock || 0}</td>
                            <td>
                                <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);"
                                    onclick="Admin.deleteProduct(${p.id})">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    }

    function showAddProductForm() {
        const container = document.getElementById('addProductFormContainer');
        if (!container) return;
        container.innerHTML = `
            <div style="background:var(--bg-secondary);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;border:1px solid var(--border);">
                <h4 style="margin-bottom:1rem;">Neues Produkt hinzufügen</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" id="newProductName" required>
                    </div>
                    <div class="form-group">
                        <label>Kategorie</label>
                        <input type="text" class="form-control" id="newProductCategory" placeholder="z.B. Proteine" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Beschreibung</label>
                    <textarea class="form-control" id="newProductDesc" rows="3" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Preis (€)</label>
                        <input type="number" step="0.01" class="form-control" id="newProductPrice" required>
                    </div>
                    <div class="form-group">
                        <label>Bestand</label>
                        <input type="number" class="form-control" id="newProductStock" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Slug (optional)</label>
                    <input type="text" class="form-control" id="newProductSlug" placeholder="produkt-name">
                </div>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="Admin.handleAddProduct()">Speichern</button>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('addProductFormContainer').innerHTML=''">Abbrechen</button>
                </div>
            </div>`;
    }

    async function handleAddProduct() {
        const name     = document.getElementById('newProductName')?.value;
        const category = document.getElementById('newProductCategory')?.value;
        const desc     = document.getElementById('newProductDesc')?.value;
        const price    = parseFloat(document.getElementById('newProductPrice')?.value);
        const stock    = parseInt(document.getElementById('newProductStock')?.value);
        let   slug     = document.getElementById('newProductSlug')?.value;
        if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        try {
            const res = await fetch(BASE + 'admin/products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, description: desc, category, price, stock, is_active: 1 })
            });
            const result = await res.json();
            if (result.success) {
                App.showToast('Produkt hinzugefügt!', 'success');
                await renderProductList();
            } else {
                App.showToast(result.message || 'Fehler.', 'error');
            }
        } catch(e) {
            App.showToast('Fehler beim Hinzufügen.', 'error');
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Produkt wirklich löschen?')) return;
        try {
            const res = await fetch(BASE + 'admin/products.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: id })
            });
            const result = await res.json();
            if (result.success) {
                App.showToast('Produkt gelöscht.', 'info');
                await renderProductList();
            } else {
                App.showToast(result.message || 'Fehler.', 'error');
            }
        } catch(e) {
            App.showToast('Fehler beim Löschen.', 'error');
        }
    }

    // ===== HELPERS =====
    function statusLabel(s) {
        return { pending:'Ausstehend', processing:'In Bearbeitung', shipped:'Versendet', completed:'Abgeschlossen', cancelled:'Storniert' }[s] || s;
    }
    function paymentLabel(p) {
        return { bank:'Banküberweisung', card:'Kreditkarte', paypal:'PayPal', cash:'Bar' }[p] || p || '–';
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.admin-layout')) init();
    });

    return {
        init, showSection,
        showAddProductForm, handleAddProduct, deleteProduct,
        changeOrderStatus, showOrderDetails,
        changeUserRole, deleteUser,
        deleteNewsletter, exportNewsletter
    };
})();