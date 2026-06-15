/* ===================================================================
 * KöhrerGainz - Cart System
 * Cart page rendering, quantity updates, discount codes
 * =================================================================== */

const Cart = (() => {
    let appliedDiscount = null;

    function init() {
        renderCart();
        bindEvents();
    }

    function bindEvents() {
        const discountBtn = document.getElementById('applyDiscountBtn');
        if (discountBtn) {
            discountBtn.addEventListener('click', applyDiscount);
        }

        const discountInput = document.getElementById('discountCode');
        if (discountInput) {
            discountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyDiscount();
                }
            });
        }
    }

    function renderCart() {
        const itemsContainer = document.getElementById('cartItems');
        const summaryContainer = document.getElementById('cartSummary');
        if (!itemsContainer) return;

        const cartItems = getCartWithProducts();

        if (cartItems.length === 0) {
            itemsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <h3>Dein Warenkorb ist leer</h3>
                    <p>Zeit die Gains zu holen! Schau dir unsere Produkte an.</p>
                    <a href="products.html" class="btn btn-primary">Produkte entdecken</a>
                </div>
            `;
            if (summaryContainer) summaryContainer.style.display = 'none';
            return;
        }

        if (summaryContainer) summaryContainer.style.display = '';

        itemsContainer.innerHTML = cartItems.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-image">
                    <span>${item.product.emoji || '📦'}</span>
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.product.name}</h3>
                    <div class="cart-item-meta">€${parseFloat(item.product.price).toFixed(2)} pro Stück</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="Cart.updateQuantity(${item.productId}, ${item.quantity - 1})">−</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="Cart.updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                        </div>
                        <div class="cart-item-price">€${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
                        <button class="cart-item-remove" onclick="Cart.removeItem(${item.productId})" title="Entfernen">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');

        updateSummary();
    }

    function updateSummary() {
        const subtotal = getCartTotal();
        const shipping = subtotal >= 50 ? 0 : 4.99;
        let discountAmount = 0;

        if (appliedDiscount) {
            discountAmount = subtotal * (appliedDiscount.percent / 100);
        }

        const total = subtotal - discountAmount + shipping;

        const subtotalEl = document.getElementById('cartSubtotal');
        const shippingEl = document.getElementById('cartShipping');
        const totalEl = document.getElementById('cartTotal');
        const discountRow = document.getElementById('discountRow');

        if (subtotalEl) subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Kostenlos' : `€${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `€${total.toFixed(2)}`;

        if (discountRow) {
            if (appliedDiscount) {
                discountRow.style.display = 'flex';
                discountRow.innerHTML = `
                    <span class="discount-label">Rabatt (${appliedDiscount.code} - ${appliedDiscount.percent}%)</span>
                    <span class="discount-value">-€${discountAmount.toFixed(2)}</span>
                `;
            } else {
                discountRow.style.display = 'none';
            }
        }

        // Store discount for checkout
        sessionStorage.setItem('kg_applied_discount', JSON.stringify({
            discount: appliedDiscount,
            amount: discountAmount
        }));
    }

    function updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }
        updateCartItem(productId, newQuantity);
        renderCart();
        App.updateCartBadge();
        const totalEl = document.getElementById('cartTotal');
        if (totalEl && typeof Animations !== 'undefined') {
            Animations.animatePriceBump(totalEl);
        }
    }

    function removeItem(productId) {
        const product = getProductByIdLocal(productId);
        const itemEl = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        const doRemove = () => {
            removeFromCart(productId);
            renderCart();
            App.updateCartBadge();
            App.showToast(`${product?.name || 'Produkt'} entfernt.`, 'info');
        };
        if (itemEl && typeof Animations !== 'undefined') {
            Animations.animateCartRemove(itemEl, doRemove);
        } else {
            doRemove();
        }
    }

    async function applyDiscount() {
        const input = document.getElementById('discountCode');
        if (!input) return;

        const code = input.value.trim();
        if (!code) {
            App.showToast('Bitte Rabattcode eingeben.', 'error');
            return;
        }

        try {
            const result = await Api.validateDiscount(code);
            if (result.valid) {
                appliedDiscount = { code: result.code, percent: result.percent };
                updateSummary();
                App.showToast(`${result.percent}% Rabatt aktiviert! 🎉`, 'success');
                if (typeof Discount !== 'undefined') {
                    Discount.playAnimation('confetti', result.percent);
                }
                input.value = '';
                const totalEl = document.getElementById('cartTotal');
                if (totalEl && typeof Animations !== 'undefined') {
                    Animations.animatePriceBump(totalEl);
                }
            } else {
                App.showToast(result.message || 'Ungültiger Rabattcode.', 'error');
                if (typeof Animations !== 'undefined') {
                    Animations.shakeElement(input);
                } else {
                    input.style.animation = 'shake 0.5s ease';
                    setTimeout(() => input.style.animation = '', 500);
                }
            }
        } catch (error) {
            App.showToast('Fehler bei Rabattprüfung.', 'error');
        }
    }

    // ========== LOCALSTORAGE CART FUNCTIONS (bleibt) ==========
    const CART_KEY = 'kg_cart';

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function getProductByIdLocal(id) {
        // Wird async geladen, daher Cache im Window
        if (!window.productsCache) {
            return { id: id, name: 'Produkt', price: 0, emoji: '📦' };
        }
        return window.productsCache.find(p => p.product_id === id || p.id === id);
    }

    function getCartWithProducts() {
        const cart = getCart();
        const products = window.productsCache || [];
        return cart.map(item => {
            const pid = parseInt(item.productId);
            const product = products.find(p => parseInt(p.product_id || p.id) === pid);
            return {
                ...item,
                product: product || { id: item.productId, name: 'Produkt', price: 0, emoji: '📦' }
            };
        }).filter(item => item.product !== null);
    }

    function getCartTotal() {
        const items = getCartWithProducts();
        return items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
    }

    function getCartCount() {
        const cart = getCart();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function addToCartLocal(productId, quantity = 1) {
        const cart = getCart();
        const existing = cart.find(item => item.productId === parseInt(productId));
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ productId: parseInt(productId), quantity: quantity, addedAt: new Date().toISOString() });
        }
        saveCart(cart);
        return { success: true };
    }

    function updateCartItem(productId, quantity) {
        let cart = getCart();
        const idx = cart.findIndex(item => item.productId === parseInt(productId));
        if (idx === -1) return { success: false };
        if (quantity <= 0) {
            cart.splice(idx, 1);
        } else {
            cart[idx].quantity = quantity;
        }
        saveCart(cart);
        return { success: true };
    }

    function removeFromCart(productId) {
        let cart = getCart();
        cart = cart.filter(item => item.productId !== parseInt(productId));
        saveCart(cart);
        return { success: true };
    }

    function clearCart() {
        saveCart([]);
        return { success: true };
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (document.getElementById('cartItems')) {
            // Sanitize cart: remove any entries without a valid productId
            const raw = getCart();
            const sanitized = raw.filter(item => item && parseInt(item.productId) > 0);
            if (sanitized.length !== raw.length) saveCart(sanitized);

            // Load products into cache before rendering
            if (!window.productsCache || window.productsCache.length === 0) {
                try {
                    window.productsCache = await Api.getProducts();
                } catch(e) {}
            }
            init();
        }
    });

    return {
        renderCart,
        updateQuantity,
        removeItem,
        applyDiscount,
        getAppliedDiscount: () => appliedDiscount,
        getCartCount,
        getCartTotal,
        getCartWithProducts,
        addToCart: addToCartLocal,
        clearCart
    };
})();