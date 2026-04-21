(() => {
    function getCheckoutItems(cart, products) {
        return cart
            .map((item) => {
                const product = products.find((p) => Number(p.product_id) === Number(item.product_id));
                if (!product) {
                    return null;
                }
                return {
                    product,
                    quantity: Number(item.quantity) || 1,
                    total: (Number(item.quantity) || 1) * Number(product.price)
                };
            })
            .filter(Boolean);
    }

    async function initCheckout() {
        const form = document.getElementById('checkoutForm');
        const itemsNode = document.getElementById('checkoutItems');
        const totalsNode = document.getElementById('checkoutSummaryTotals');

        if (!form || !itemsNode || !totalsNode) {
            return;
        }

        const cart = DataStore.getCart();
        if (!cart.length) {
            itemsNode.innerHTML = '<p>Dein Warenkorb ist leer.</p>';
            return;
        }

        try {
            const productsData = await API.getProducts();
            const products = productsData.products || [];
            DataStore.setProductsCache(products);

            const checkoutItems = getCheckoutItems(cart, products);
            const subtotal = checkoutItems.reduce((sum, item) => sum + item.total, 0);
            const shipping = subtotal >= 50 ? 0 : 4.99;
            const total = subtotal + shipping;

            itemsNode.innerHTML = checkoutItems
                .map((entry) => `<div class="summary-row"><span>${entry.product.name} x${entry.quantity}</span><span>EUR ${entry.total.toFixed(2)}</span></div>`)
                .join('');
            totalsNode.innerHTML = `
                <div class="summary-row"><span>Zwischensumme</span><span>EUR ${subtotal.toFixed(2)}</span></div>
                <div class="summary-row"><span>Versand</span><span>EUR ${shipping.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Gesamt</span><span>EUR ${total.toFixed(2)}</span></div>
            `;

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const customer_name = document.getElementById('shippingName').value.trim();
                const customer_email = document.getElementById('shippingEmail').value.trim();

                if (!customer_name || !customer_email) {
                    App.showToast('Bitte Name und E-Mail ausfuellen.', 'error');
                    return;
                }

                const payload = {
                    customer_name,
                    customer_email,
                    items: checkoutItems.map((item) => ({
                        product_id: Number(item.product.product_id),
                        quantity: Number(item.quantity)
                    }))
                };

                try {
                    const result = await API.createOrder(payload);
                    DataStore.setCart([]);
                    App.updateCartBadge();
                    App.showToast(`Bestellung #${result.order_id} gespeichert.`, 'success');
                    form.reset();
                } catch (error) {
                    App.showToast(error.message, 'error');
                }
            });
        } catch (error) {
            itemsNode.innerHTML = '<p>Checkout-Daten konnten nicht geladen werden.</p>';
        }
    }

    document.addEventListener('DOMContentLoaded', initCheckout);
})();
