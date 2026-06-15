/* ===================================================================
 * KöhrerGainz - Admin Panel
 * =================================================================== */

const Admin = (() => {
    let activeSection = 'dashboard';

    async function init() {
        const userId = localStorage.getItem('kg_user_id');
        const userJson = localStorage.getItem('kg_current_user');
        let user = null;
        
        try {
            user = JSON.parse(userJson);
        } catch(e) {}
        
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
            item.addEventListener('click', () => {
                showSection(item.dataset.section);
            });
        });
    }

    async function showSection(section) {
        activeSection = section;

        document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.admin-menu-item[data-section="${section}"]`)?.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(`admin-${section}`)?.classList.remove('d-none');

        switch (section) {
            case 'dashboard': renderDashboard(); break;
            case 'products': renderProductList(); break;
            case 'orders': renderOrderList(); break;
            case 'users': renderUserList(); break;
            case 'newsletter': renderNewsletterList(); break;
        }
    }

    async function renderDashboard() {
        const products = await Api.getProducts();
        // Orders müssten über eine Admin-API kommen - placeholder
        const productCount = products.length;
        const orderCount = 0; // TODO: Admin orders endpoint
        const userCount = 0; // TODO: Admin users endpoint
        const totalRevenue = 0; // TODO: Calculate

        document.getElementById('statProducts').textContent = productCount;
        document.getElementById('statOrders').textContent = orderCount;
        document.getElementById('statUsers').textContent = userCount;
        document.getElementById('statRevenue').textContent = `€${totalRevenue.toFixed(2)}`;
        document.getElementById('statNewsletter').textContent = '0';

        const recentContainer = document.getElementById('recentOrders');
        if (recentContainer) {
            recentContainer.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Bestellübersicht in Entwicklung.</p>';
        }
    }

    async function renderProductList() {
        const container = document.getElementById('adminProductList');
        if (!container) return;

        const products = await Api.getProducts();

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Produkte verwalten</h3>
                <button class="btn btn-primary btn-sm" onclick="Admin.showAddProductForm()">+ Neues Produkt</button>
            </div>
            <div id="addProductFormContainer"></div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Produkt</th>
                        <th>Kategorie</th>
                        <th>Preis</th>
                        <th>Bestand</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td><span style="margin-right: 0.5rem;">📦</span>${p.name}</td>
                            <td>${p.category || '-'}</td>
                            <td>€${parseFloat(p.price).toFixed(2)}</td>
                            <td>${p.stock || 0}</td>
                            <td>
                                <button class="btn btn-sm btn-outline" onclick="Admin.deleteProduct(${p.product_id || p.id})" style="color: var(--danger); border-color: var(--danger);">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function showAddProductForm() {
        const container = document.getElementById('addProductFormContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border);">
                <h4 style="margin-bottom: 1rem;">Neues Produkt hinzufügen</h4>
                <form id="addProductForm" onsubmit="Admin.handleAddProduct(event)">
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
                        <label>Slug (URL-Name)</label>
                        <input type="text" class="form-control" id="newProductSlug" placeholder="produkt-name">
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary btn-sm">Speichern</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('addProductFormContainer').innerHTML=''">Abbrechen</button>
                    </div>
                </form>
            </div>
        `;
    }

    async function handleAddProduct(e) {
        e.preventDefault();
        const userId = localStorage.getItem('kg_user_id');
        
        const name = document.getElementById('newProductName').value;
        const category = document.getElementById('newProductCategory').value;
        const description = document.getElementById('newProductDesc').value;
        const price = parseFloat(document.getElementById('newProductPrice').value);
        const stock = parseInt(document.getElementById('newProductStock').value);
        let slug = document.getElementById('newProductSlug').value;
        
        if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        try {
            const response = await fetch('http://localhost:8083/php/api/admin_products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    name: name,
                    slug: slug,
                    description: description,
                    category: category,
                    price: price,
                    stock: stock,
                    is_active: 1
                })
            });
            const result = await response.json();
            
            if (result.success) {
                App.showToast('Produkt hinzugefügt!', 'success');
                document.getElementById('addProductFormContainer').innerHTML = '';
                await renderProductList();
            } else {
                App.showToast(result.message || 'Fehler beim Hinzufügen.', 'error');
            }
        } catch (error) {
            App.showToast('Fehler beim Hinzufügen.', 'error');
        }
    }

    async function deleteProduct(id) {
        if (confirm('Produkt wirklich löschen?')) {
            const userId = localStorage.getItem('kg_user_id');
            try {
                const response = await fetch('http://localhost:8083/php/api/admin_products.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        product_id: id
                    })
                });
                const result = await response.json();
                
                if (result.success) {
                    App.showToast('Produkt gelöscht.', 'info');
                    await renderProductList();
                } else {
                    App.showToast(result.message || 'Fehler beim Löschen.', 'error');
                }
            } catch (error) {
                App.showToast('Fehler beim Löschen.', 'error');
            }
        }
    }

    async function renderOrderList() {
        const container = document.getElementById('adminOrderList');
        if (!container) return;
        container.innerHTML = '<p style="color: var(--text-muted);">Bestellverwaltung in Entwicklung.</p>';
    }

    async function renderUserList() {
        const container = document.getElementById('adminUserList');
        if (!container) return;
        container.innerHTML = '<p style="color: var(--text-muted);">Benutzerverwaltung in Entwicklung.</p>';
    }

    async function renderNewsletterList() {
        const container = document.getElementById('adminNewsletterList');
        if (!container) return;
        container.innerHTML = '<p style="color: var(--text-muted);">Newsletter-Verwaltung in Entwicklung.</p>';
    }

    function changeOrderStatus(orderId, status) {
        App.showToast('Statusänderung in Entwicklung.', 'info');
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.admin-layout')) {
            init();
        }
    });

    return {
        init,
        showSection,
        showAddProductForm,
        handleAddProduct,
        deleteProduct,
        changeOrderStatus
    };
})();