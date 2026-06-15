/* ===================================================================
 * KöhrerGainz - Products Page Logic
 * Product listing, filtering, sorting, rendering
 * =================================================================== */

const Products = (() => {
    let currentFilters = {
        categoryId: null,
        search: '',
        sort: 'default'
    };
    
    let allProducts = [];
    let categories = [];

    async function init() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('category')) {
            currentFilters.categoryId = params.get('category');
        }
        
        await loadData();
        renderCategoryFilter();
        renderProducts();
        bindEvents();
    }
    
    async function loadData() {
        try {
            const [productsData, categoriesData] = await Promise.all([
                Api.getProducts(),
                Api.getCategories()
            ]);
            allProducts = productsData;
            categories = categoriesData;
            
            // Cache für Cart
            window.productsCache = allProducts;
        } catch (error) {
            console.error('Failed to load products:', error);
            allProducts = [];
        }
    }

    function bindEvents() {
        const searchInput = document.getElementById('productSearch');
        const sortSelect = document.getElementById('productSort');
        const categorySelect = document.getElementById('categoryFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.search = e.target.value;
                renderProducts();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentFilters.sort = e.target.value;
                renderProducts();
            });
        }

        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                currentFilters.categoryId = e.target.value || null;
                renderProducts();
            });
        }
    }

    function renderCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        let html = '<option value="">Alle Kategorien</option>';
        categories.forEach(cat => {
            const selected = currentFilters.categoryId == cat ? 'selected' : '';
            html += `<option value="${cat}" ${selected}>${cat}</option>`;
        });
        select.innerHTML = html;
    }

    function filterAndSortProducts() {
        let products = [...allProducts];
        
        if (currentFilters.categoryId) {
            products = products.filter(p => p.category === currentFilters.categoryId);
        }
        if (currentFilters.search) {
            const q = currentFilters.search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(q) || 
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        if (currentFilters.sort === 'price-asc') {
            products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (currentFilters.sort === 'price-desc') {
            products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        } else if (currentFilters.sort === 'name') {
            products.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return products;
    }

    function renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const products = filterAndSortProducts();
        const countEl = document.getElementById('productCount');
        if (countEl) countEl.textContent = `${products.length} Produkte`;

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🔍</div>
                    <h3>Keine Produkte gefunden</h3>
                    <p>Versuch es mit anderen Filtern oder Suchbegriffen.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => createProductCard(product)).join('');

        if (typeof Animations !== 'undefined') {
            Animations.staggerReveal(grid, '.product-card', 55);
        }
    }

    function createProductCard(product) {
        const price = parseFloat(product.price);
        const oldPrice = product.old_price ? parseFloat(product.old_price) : null;
        
        const badgeHtml = product.is_featured ? `<span class="product-badge bestseller">Bestseller</span>` : '';
        const priceHtml = oldPrice
            ? `<span class="old-price">€${oldPrice.toFixed(2)}</span>€${price.toFixed(2)}`
            : `€${price.toFixed(2)}`;

        return `
            <div class="product-card reveal visible">
                <a href="product.html?id=${product.product_id || product.id}" class="product-card-image" style="text-decoration:none; color:inherit;">
                    ${badgeHtml}
                    <span>${getProductEmoji(product.name)}</span>
                </a>
                <div class="product-card-body">
                    <div class="product-card-category">${product.category || 'Supplement'}</div>
                    <a href="product.html?id=${product.product_id || product.id}" style="text-decoration:none; color:inherit;">
                        <h3 class="product-card-title">${product.name}</h3>
                    </a>
                    <p class="product-card-desc">${product.description || 'Premium Qualität für deine Gainz.'}</p>
                    <div class="product-card-footer">
                        <div class="product-price">${priceHtml}</div>
                        <button class="add-to-cart-btn" onclick="Products.quickAddToCart(event, ${product.product_id || product.id})" title="In den Warenkorb">
                            🛒
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    function getProductEmoji(name) {
        const emojiMap = {
            'whey': '🥛',
            'protein': '💪',
            'creatin': '⚡',
            'pre': '🔥',
            'bundle': '📦',
            'shaker': '🥤'
        };
        const lowerName = name.toLowerCase();
        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (lowerName.includes(key)) return emoji;
        }
        return '📦';
    }

    function quickAddToCart(event, productId) {
        const btn = event.currentTarget;
        const product = allProducts.find(p => (p.product_id || p.id) === productId);
        
        if (typeof Animations !== 'undefined') {
            Animations.animateAddSuccess(btn);
            const card = btn.closest('.product-card');
            const imgEl = card && card.querySelector('.product-card-image');
            if (imgEl) Animations.flyToCart(imgEl);
        }
        
        Cart.addToCart(productId);
        App.updateCartBadge();
        if (product) {
            App.showToast(`${product.name} zum Warenkorb hinzugefügt!`, 'success');
        }
    }

    // For homepage featured products
    async function renderFeatured(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const products = await Api.getProducts({ featured: true });
            const featuredProducts = products.slice(0, 4);
            container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
        } catch (error) {
            container.innerHTML = '<p>Fehler beim Laden der Produkte.</p>';
        }
    }

    // For homepage categories
    function renderCategories(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categoryList = ['Proteine', 'Creatin', 'Pre-Workout', 'Bundles'];
        const categoryIcons = { 'Proteine': '🥛', 'Creatin': '⚡', 'Pre-Workout': '🔥', 'Bundles': '📦' };
        
        container.innerHTML = categoryList.map(cat => {
            const count = allProducts.filter(p => p.category === cat).length;
            return `
                <a href="products.html?category=${encodeURIComponent(cat)}" class="category-card reveal visible">
                    <div class="category-card-icon">${categoryIcons[cat] || '📦'}</div>
                    <div class="category-card-name">${cat}</div>
                    <div class="category-card-count">${count} Produkte</div>
                </a>
            `;
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('productsGrid')) {
            init();
        }
    });

    return {
        renderFeatured,
        renderCategories,
        renderProducts,
        createProductCard,
        quickAddToCart
    };
})();