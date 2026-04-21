(() => {
    function euro(value) {
        return `EUR ${Number(value).toFixed(2)}`;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildCard(product) {
        const image = product.image_url ? escapeHtml(product.image_url) : 'img/darkcookiecherry.png';
        return `
            <article class="product-card reveal">
                <div class="product-card-image">
                    <img src="${image}" alt="${escapeHtml(product.name)}">
                </div>
                <div class="product-card-body">
                    <div class="product-card-category">${escapeHtml(product.category)}</div>
                    <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
                    <p class="product-card-desc">${escapeHtml(product.description || '')}</p>
                    <div class="product-card-footer">
                        <span class="product-price">${euro(product.price)}</span>
                        <button class="btn btn-primary btn-sm" data-add="${Number(product.product_id)}">In den Warenkorb</button>
                    </div>
                </div>
            </article>
        `;
    }

    async function loadProducts() {
        const grid = document.getElementById('productsGrid');
        const featured = document.getElementById('featuredProducts');
        const productCount = document.getElementById('productCount');
        const categoryFilter = document.getElementById('categoryFilter');

        if (!grid && !featured) {
            return;
        }

        try {
            const data = await API.getProducts();
            const products = data.products || [];
            DataStore.setProductsCache(products);

            if (productCount) {
                productCount.textContent = `${products.length} Produkte gefunden`;
            }

            if (categoryFilter) {
                (data.categories || []).forEach((category) => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }

            if (grid) {
                grid.innerHTML = products.map(buildCard).join('');
            }

            if (featured) {
                featured.innerHTML = products.slice(0, 3).map(buildCard).join('');
            }

            document.querySelectorAll('[data-add]').forEach((button) => {
                button.addEventListener('click', () => {
                    const productId = Number(button.getAttribute('data-add'));
                    App.addToCart(productId, 1);
                });
            });

            initFilters(products);
        } catch (error) {
            if (grid) {
                grid.innerHTML = '<p>Produkte konnten nicht geladen werden.</p>';
            }
            if (featured) {
                featured.innerHTML = '<p>Produkte konnten nicht geladen werden.</p>';
            }
            if (productCount) {
                productCount.textContent = 'Fehler beim Laden';
            }
        }
    }

    function initFilters(allProducts) {
        const grid = document.getElementById('productsGrid');
        const searchInput = document.getElementById('productSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('productSort');
        const countNode = document.getElementById('productCount');

        if (!grid || !searchInput || !categoryFilter || !sortSelect) {
            return;
        }

        const renderFiltered = () => {
            const term = searchInput.value.trim().toLowerCase();
            const category = categoryFilter.value;
            const sortBy = sortSelect.value;

            let list = allProducts.filter((product) => {
                const matchesText = !term
                    || product.name.toLowerCase().includes(term)
                    || String(product.description || '').toLowerCase().includes(term);
                const matchesCategory = !category || product.category === category;
                return matchesText && matchesCategory;
            });

            if (sortBy === 'price-asc') {
                list = list.sort((a, b) => Number(a.price) - Number(b.price));
            } else if (sortBy === 'price-desc') {
                list = list.sort((a, b) => Number(b.price) - Number(a.price));
            } else if (sortBy === 'name') {
                list = list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
            }

            grid.innerHTML = list.map(buildCard).join('');
            if (countNode) {
                countNode.textContent = `${list.length} Produkte gefunden`;
            }

            document.querySelectorAll('[data-add]').forEach((button) => {
                button.addEventListener('click', () => {
                    const productId = Number(button.getAttribute('data-add'));
                    App.addToCart(productId, 1);
                });
            });
        };

        searchInput.addEventListener('input', renderFiltered);
        categoryFilter.addEventListener('change', renderFiltered);
        sortSelect.addEventListener('change', renderFiltered);
    }

    document.addEventListener('DOMContentLoaded', loadProducts);
})();
