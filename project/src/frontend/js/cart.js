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

    function toCartEntries(cart, products) {
        return cart
            .map((item) => {
                const product = products.find((p) => Number(p.product_id) === Number(item.product_id));
                if (!product) {
                    return null;
                }

                const quantity = Math.max(1, Number(item.quantity) || 1);
                const unitPrice = Number(product.price) || 0;

                return {
                    product,
                    quantity,
                    unitPrice,
                    lineTotal: quantity * unitPrice
                };
            })
            .filter(Boolean);
    }

    function summaryFromEntries(entries) {
        const subtotal = entries.reduce((sum, entry) => sum + entry.lineTotal, 0);
        const shipping = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
        const total = subtotal + shipping;

        return { subtotal, shipping, total };
    }

    function setSummary(summary) {
        const subtotalNode = document.getElementById('cartSubtotal');
        const shippingNode = document.getElementById('cartShipping');
        const totalNode = document.getElementById('cartTotal');

        if (subtotalNode) {
            subtotalNode.textContent = euro(summary.subtotal);
        }

        if (shippingNode) {
            shippingNode.textContent = summary.shipping === 0 ? 'Kostenlos' : euro(summary.shipping);
        }

        if (totalNode) {
            totalNode.textContent = euro(summary.total);
        }
    }

    function setCheckoutEnabled(enabled) {
        const button = document.getElementById('checkoutBtn');
        if (!button) {
            return;
        }

        if (enabled) {
            button.style.pointerEvents = '';
            button.style.opacity = '';
            button.setAttribute('aria-disabled', 'false');
            return;
        }

        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
        button.setAttribute('aria-disabled', 'true');
    }

    function buildEntryHtml(entry) {
        return `
            <article class="product-card" style="margin-bottom: 1rem;">
                <div class="product-card-body">
                    <div style="display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; flex-wrap: wrap;">
                        <div style="flex: 1 1 220px;">
                            <div class="product-card-category">${escapeHtml(entry.product.category || 'Produkt')}</div>
                            <h3 class="product-card-title" style="margin-bottom: 0.25rem;">${escapeHtml(entry.product.name)}</h3>
                            <p class="product-card-desc" style="margin-bottom: 0.5rem;">${escapeHtml(entry.product.description || '')}</p>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Einzelpreis: ${euro(entry.unitPrice)}</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem; min-width: 170px;">
                            <div class="product-price">${euro(entry.lineTotal)}</div>
                            <div style="display: flex; gap: 0.4rem; align-items: center;">
                                <button class="btn btn-secondary btn-sm" data-action="decrease" data-product-id="${Number(entry.product.product_id)}">-</button>
                                <span style="min-width: 28px; text-align: center; font-weight: 600;">${entry.quantity}</span>
                                <button class="btn btn-secondary btn-sm" data-action="increase" data-product-id="${Number(entry.product.product_id)}">+</button>
                            </div>
                            <button class="btn btn-outline btn-sm" data-action="remove" data-product-id="${Number(entry.product.product_id)}">Entfernen</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function renderEmptyState(node) {
        node.innerHTML = `
            <div class="product-card">
                <div class="product-card-body" style="text-align: center; padding: 2rem;">
                    <h3 style="margin-bottom: 0.5rem;">Dein Warenkorb ist leer.</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">Füge Produkte hinzu, um hier deine Auswahl zu sehen.</p>
                    <a href="products.html" class="btn btn-primary">Zu den Produkten</a>
                </div>
            </div>
        `;

        setSummary({ subtotal: 0, shipping: 0, total: 0 });
        setCheckoutEnabled(false);
    }

    async function getProductsForCart() {
        const cached = DataStore.getProductsCache();
        if (cached.length) {
            return cached;
        }

        const data = await API.getProducts();
        const products = data.products || [];
        DataStore.setProductsCache(products);
        return products;
    }

    function updateCartItemQuantity(productId, updater) {
        const id = Number(productId);
        const cart = DataStore.getCart();
        const item = cart.find((entry) => Number(entry.product_id) === id);

        if (!item) {
            return;
        }

        const nextQuantity = Math.max(0, Number(updater(Number(item.quantity) || 1)) || 0);
        if (nextQuantity <= 0) {
            DataStore.setCart(cart.filter((entry) => Number(entry.product_id) !== id));
            return;
        }

        item.quantity = nextQuantity;
        DataStore.setCart(cart);
    }

    async function renderCart() {
        const cartItemsNode = document.getElementById('cartItems');
        if (!cartItemsNode) {
            return;
        }

        const cart = DataStore.getCart();
        if (!cart.length) {
            renderEmptyState(cartItemsNode);
            App.updateCartBadge();
            return;
        }

        try {
            const products = await getProductsForCart();
            const entries = toCartEntries(cart, products);

            if (!entries.length) {
                renderEmptyState(cartItemsNode);
                App.updateCartBadge();
                return;
            }

            cartItemsNode.innerHTML = entries.map(buildEntryHtml).join('');
            setSummary(summaryFromEntries(entries));
            setCheckoutEnabled(true);
            App.updateCartBadge();
        } catch (error) {
            cartItemsNode.innerHTML = '<p>Warenkorb konnte nicht geladen werden.</p>';
            setSummary({ subtotal: 0, shipping: 0, total: 0 });
            setCheckoutEnabled(false);
        }
    }

    function registerItemActions() {
        const cartItemsNode = document.getElementById('cartItems');
        if (!cartItemsNode) {
            return;
        }

        cartItemsNode.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-action][data-product-id]');
            if (!target) {
                return;
            }

            const action = target.getAttribute('data-action');
            const productId = Number(target.getAttribute('data-product-id'));

            if (action === 'increase') {
                updateCartItemQuantity(productId, (quantity) => quantity + 1);
            } else if (action === 'decrease') {
                updateCartItemQuantity(productId, (quantity) => quantity - 1);
            } else if (action === 'remove') {
                updateCartItemQuantity(productId, () => 0);
            }

            await renderCart();
        });
    }

    function initDiscountUiFallback() {
        const row = document.getElementById('discountRow');
        const input = document.getElementById('discountCode');
        const button = document.getElementById('applyDiscountBtn');

        if (row) {
            row.style.display = 'none';
        }

        if (button && input) {
            button.addEventListener('click', () => {
                const value = input.value.trim();
                if (!value) {
                    App.showToast('Bitte Rabattcode eingeben.', 'info');
                    return;
                }
                App.showToast('Rabattcodes sind aktuell nicht verfuegbar.', 'info');
            });
        }
    }

    async function initCart() {
        registerItemActions();
        initDiscountUiFallback();
        await renderCart();
    }

    document.addEventListener('DOMContentLoaded', initCart);
})();
