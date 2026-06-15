/* ===================================================================
 * KöhrerGainz - Product Detail Page
 * =================================================================== */

const ProductDetail = (() => {
    let currentProduct = null;

    async function init() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            window.location.href = 'products.html';
            return;
        }

        try {
            const product = await Api.getProductById(productId);
            if (!product) {
                showNotFound();
                return;
            }
            currentProduct = product;
            renderProduct(product);
            renderRelated(product);
        } catch (error) {
            showNotFound();
        }
    }

    function showNotFound() {
        const container = document.querySelector('.page-content .container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <h3>Produkt nicht gefunden</h3>
                    <p>Das Produkt existiert nicht oder wurde entfernt.</p>
                    <a href="products.html" class="btn btn-primary">Alle Produkte anzeigen</a>
                </div>
            `;
        }
    }

    function renderProduct(product) {
        const category = product.category || 'Supplement';

        // Gallery
        const gallery = document.getElementById('productGallery');
        if (gallery) {
            gallery.innerHTML = `<span>${getProductEmoji(product.name)}</span>`;
        }

        // Info
        const categoryEl = document.getElementById('productCategory');
        if (categoryEl) categoryEl.textContent = category;
        
        const nameEl = document.getElementById('productName');
        if (nameEl) nameEl.textContent = product.name;
        
        const descEl = document.getElementById('productDescription');
        if (descEl) descEl.textContent = product.description || 'Premium Qualität für maximale Gainz.';

        const price = parseFloat(product.price);
        const oldPrice = product.old_price ? parseFloat(product.old_price) : null;
        const priceEl = document.getElementById('productPrice');
        if (priceEl) {
            if (oldPrice) {
                priceEl.innerHTML = `<span class="old-price" style="font-size: 1.2rem; color: var(--text-muted); text-decoration: line-through; margin-right: 0.5rem;">€${oldPrice.toFixed(2)}</span>€${price.toFixed(2)}`;
            } else {
                priceEl.textContent = `€${price.toFixed(2)}`;
            }
        }

        // Stock
        const stock = product.stock || 999;
        const stockEl = document.getElementById('productStock');
        if (stockEl) {
            if (stock > 10) {
                stockEl.innerHTML = `✅ Auf Lager (${stock} verfügbar)`;
                stockEl.style.color = 'var(--success)';
            } else if (stock > 0) {
                stockEl.innerHTML = `⚠️ Nur noch ${stock} auf Lager!`;
                stockEl.style.color = 'var(--warning)';
            } else {
                stockEl.innerHTML = `❌ Ausverkauft`;
                stockEl.style.color = 'var(--danger)';
            }
        }

        // Details list
        const detailsList = document.getElementById('productDetails');
        if (detailsList) {
            const defaultDetails = [
                'Premium Qualität',
                'Laborgeprüft',
                'Made in Austria',
                `${stock} Einheiten verfügbar`
            ];
            detailsList.innerHTML = defaultDetails.map(d => `
                <li><span>✓</span> ${d}</li>
            `).join('');
        }

        // Add to cart button
        const addBtn = document.getElementById('addToCartBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                const qty = parseInt(document.getElementById('productQty')?.value || 1);
                const gallery = document.getElementById('productGallery');
                if (typeof Animations !== 'undefined') {
                    if (gallery) Animations.flyToCart(gallery);
                    Animations.animateAddSuccess(addBtn);
                }
                Cart.addToCart(product.product_id || product.id, qty);
                App.updateCartBadge();
                App.showToast(`${product.name} zum Warenkorb hinzugefügt!`, 'success');
            };
        }

        // Update page title
        document.title = `${product.name} | KöhrerGainz`;
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

    async function renderRelated(product) {
        const container = document.getElementById('relatedProducts');
        if (!container) return;

        try {
            const products = await Api.getProducts({ category: product.category });
            const related = products.filter(p => (p.product_id || p.id) !== (product.product_id || product.id)).slice(0, 4);

            if (related.length === 0) {
                container.parentElement.style.display = 'none';
                return;
            }

            container.innerHTML = related.map(p => Products.createProductCard(p)).join('');
        } catch (error) {
            container.parentElement.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('productGallery')) {
            init();
        }
    });

    return { init };
})();