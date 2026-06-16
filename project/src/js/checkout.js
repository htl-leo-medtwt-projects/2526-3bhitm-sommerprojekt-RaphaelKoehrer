/* ===================================================================
 * KöhrerGainz - Checkout Page Logic
 * =================================================================== */

const Checkout = (() => {
    async function init() {
        // Ensure product cache is populated before rendering prices
        if (!window.productsCache || window.productsCache.length === 0) {
            try {
                window.productsCache = await Api.getProducts();
            } catch(e) {
                console.error('Could not load products for checkout:', e);
            }
        }

        const cartItems = Cart.getCartWithProducts();
        if (cartItems.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        renderOrderSummary();
        bindEvents();

        const userId = localStorage.getItem('kg_user_id');
        if (userId) {
            loadUserData(userId);
        }
    }

    async function loadUserData(userId) {
        try {
            const result = await Api.getCurrentUser(userId);
            if (result.success && result.user) {
                const nameField = document.getElementById('shippingName');
                const emailField = document.getElementById('shippingEmail');
                if (nameField) nameField.value = result.user.full_name || result.user.username || '';
                if (emailField) emailField.value = result.user.email || '';
            }
        } catch (error) {
            console.error('Could not load user data:', error);
        }
    }

    function renderOrderSummary() {
        const container = document.getElementById('checkoutItems');
        if (!container) return;

        const items = Cart.getCartWithProducts();
        const subtotal = Cart.getCartTotal();

        let discountData = null;
        try {
            discountData = JSON.parse(sessionStorage.getItem('kg_applied_discount'));
        } catch(e) {}

        const discountAmount = discountData?.amount || 0;
        const shipping = subtotal >= 50 ? 0 : 4.99;
        const total = subtotal - discountAmount + shipping;

        container.innerHTML = items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${item.product.emoji || '📦'}</span>
                    <div>
                        <div style="font-weight: 500; font-size: 0.9rem;">${item.product.name}</div>
                        <div style="color: var(--text-muted); font-size: 0.8rem;">x${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight: 600;">€${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        const summaryEl = document.getElementById('checkoutSummaryTotals');
        if (summaryEl) {
            let html = `
                <div class="summary-row">
                    <span>Zwischensumme</span>
                    <span>€${subtotal.toFixed(2)}</span>
                </div>
            `;
            if (discountAmount > 0 && discountData?.discount) {
                html += `
                    <div class="summary-row">
                        <span class="text-success">Rabatt (${discountData.discount.code})</span>
                        <span class="text-success">-€${discountAmount.toFixed(2)}</span>
                    </div>
                `;
            }
            html += `
                <div class="summary-row">
                    <span>Versand</span>
                    <span>${shipping === 0 ? 'Kostenlos' : '€' + shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Gesamt</span>
                    <span>€${total.toFixed(2)}</span>
                </div>
            `;
            summaryEl.innerHTML = html;
        }
    }

    function bindEvents() {
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', handleCheckout);
        }
    }

    function getSelectedPayment() {
        const selected = document.querySelector('input[name="payment"]:checked');
        if (selected) return selected.value;
        return 'bank';
    }

    async function handleCheckout(e) {
        e.preventDefault();

        const name = document.getElementById('shippingName')?.value.trim();
        const email = document.getElementById('shippingEmail')?.value.trim();
        const address = document.getElementById('shippingAddress')?.value.trim();
        const city = document.getElementById('shippingCity')?.value.trim();
        const zip = document.getElementById('shippingZip')?.value.trim();
        const country = document.getElementById('shippingCountry')?.value.trim();

        if (!name || !email || !address || !city || !zip) {
            App.showToast('Bitte alle Pflichtfelder ausfüllen.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            App.showToast('Bitte gültige E-Mail angeben.', 'error');
            return;
        }

        const cartItems = Cart.getCartWithProducts();
        if (cartItems.length === 0) {
            App.showToast('Warenkorb ist leer.', 'error');
            return;
        }

        let discountAmount = 0;
        try {
            const discountData = JSON.parse(sessionStorage.getItem('kg_applied_discount'));
            discountAmount = discountData?.amount || 0;
        } catch(e) {}

        const userId = localStorage.getItem('kg_user_id');
        const orderData = {
            // Nested shipping object as expected by orders.php
            shipping: {
                name,
                email,
                address,
                city,
                zip,
                country: country || 'Österreich'
            },
            payment_method: getSelectedPayment(),
            user_id: userId ? parseInt(userId) : null,
            discount: discountAmount,
            // PHP reads $item['productId'] and $item['productName'] (camelCase)
            items: cartItems.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                price: parseFloat(item.product.price)
            }))
        };

        try {
            const result = await Api.createOrder(orderData);
            if (result.success) {
                sessionStorage.removeItem('kg_applied_discount');
                sessionStorage.setItem('kg_last_order', JSON.stringify({
                    id: result.order_id,
                    total: result.total_amount,
                    items: cartItems.map(item => ({
                        productName: item.product.name,
                        price: parseFloat(item.product.price),
                        quantity: item.quantity
                    })),
                    createdAt: new Date().toISOString(),
                    shipping: { name, email, address, city, zip, country: country || 'Österreich' }
                }));
                Cart.clearCart();
                App.updateCartBadge();
                window.location.href = 'order-success.html';
            } else {
                App.showToast(result.message || 'Fehler bei der Bestellung.', 'error');
            }
        } catch (error) {
            App.showToast('Fehler bei der Bestellung: ' + (error.message || 'Unbekannter Fehler'), 'error');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('checkoutForm')) {
            init();
        }
    });

    return { init };
})();