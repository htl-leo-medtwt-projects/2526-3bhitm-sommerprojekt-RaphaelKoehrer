const API = (() => {
    function resolveBaseUrls() {
        if (typeof window === 'undefined') {
            return ['/backend/api', '/api'];
        }

        const forced = window.__API_BASE_URL;
        if (forced) {
            return [String(forced).replace(/\/$/, '')];
        }

        const origin = window.location.origin;
        const path = window.location.pathname.replace(/\\/g, '/');
        const marker = '/frontend/';
        const markerIndex = path.toLowerCase().indexOf(marker);
        const rootPath = markerIndex >= 0 ? path.slice(0, markerIndex) : '';

        const urls = [
            `${origin}${rootPath}/backend/api`,
            `${origin}${rootPath}/api`,
            `${origin}/backend/api`,
            `${origin}/api`
        ];

        return urls.filter((value, index) => urls.indexOf(value) === index);
    }

    const BASE_URLS = resolveBaseUrls();

    async function requestWithFallback(endpoint, options = {}, allowFallbackOnStatus = [404]) {
        let lastError = new Error('API request failed');

        for (const baseUrl of BASE_URLS) {
            const url = `${baseUrl}${endpoint}`;
            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    if (allowFallbackOnStatus.includes(response.status)) {
                        lastError = new Error(`Not found at ${url}`);
                        continue;
                    }

                    let message = 'Serverfehler';
                    try {
                        const errorData = await response.json();
                        message = errorData.message || message;
                    } catch (error) {
                        // Keep default message when response is not JSON.
                    }
                    throw new Error(message);
                }

                return await response.json();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        throw lastError;
    }

    async function getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `/products.php${query ? `?${query}` : ''}`;
        return requestWithFallback(endpoint, {}, [404]);
    }

    async function createOrder(payload) {
        return requestWithFallback('/orders.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }, [404]);
    }

    return {
        getProducts,
        createOrder
    };
})();

const DataStore = (() => {
    const CART_KEY = 'kg_cart';
    const NEWSLETTER_KEY = 'kg_newsletter';
    const USER_KEY = 'kg_user';
    const PRODUCTS_KEY = 'kg_products_cache';

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch (error) {
            return [];
        }
    }

    function setCart(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    }

    function getCartCount() {
        return getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function subscribeNewsletter(email) {
        const value = (email || '').trim().toLowerCase();
        if (!value) {
            return { success: false, message: 'Bitte E-Mail eingeben' };
        }

        const current = new Set(JSON.parse(localStorage.getItem(NEWSLETTER_KEY) || '[]'));
        if (current.has(value)) {
            return { success: false, message: 'E-Mail bereits eingetragen' };
        }

        current.add(value);
        localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(Array.from(current)));
        return { success: true };
    }

    function getProductsCache() {
        try {
            return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        } catch (error) {
            return [];
        }
    }

    function setProductsCache(products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products || []));
    }

    function getProductById(productId) {
        const id = Number(productId);
        return getProductsCache().find((product) => Number(product.product_id) === id) || null;
    }

    function addToCart(productId, quantity = 1) {
        const id = Number(productId);
        const qty = Math.max(1, Number(quantity) || 1);
        const product = getProductById(id);

        if (!product) {
            return { success: false, message: 'Produkt nicht gefunden' };
        }

        const stock = Number(product.stock || 0);
        const cart = getCart();
        const existing = cart.find((item) => Number(item.product_id) === id);

        if (existing) {
            const nextQty = existing.quantity + qty;
            if (nextQty > stock) {
                return { success: false, message: 'Nicht genug Lagerbestand' };
            }
            existing.quantity = nextQty;
        } else {
            if (qty > stock) {
                return { success: false, message: 'Nicht genug Lagerbestand' };
            }
            cart.push({ product_id: id, quantity: qty });
        }

        setCart(cart);
        return { success: true };
    }

    return {
        getCart,
        setCart,
        getCartCount,
        getCurrentUser,
        subscribeNewsletter,
        setProductsCache,
        getProductsCache,
        getProductById,
        addToCart
    };
})();
