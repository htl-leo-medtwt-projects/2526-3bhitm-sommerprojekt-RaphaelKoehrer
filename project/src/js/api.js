/* ===================================================================
 * KöhrerGainz - API Abstraction Layer (PHP/MySQL Backend)
 * =================================================================== */

const API_BASE = 'http://localhost:8083/php/api/';  

const Api = (() => {
    
    // ===== HELPER =====
    async function request(endpoint, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API Fehler');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // ===== AUTH =====
    async function register(userData) {
        return request(`auth.php?action=register`, 'POST', userData);
    }
    
    async function login(identifier, password) {
        return request(`auth.php?action=login`, 'POST', { email: identifier, password });
    }
    
    async function getCurrentUser(userId) {
        if (!userId) return null;
        return request(`auth.php?action=me&user_id=${userId}`, 'GET');
    }
    
    async function updateProfile(userId, data) {
        return request(`auth.php?action=update`, 'PUT', { user_id: userId, ...data });
    }
    
    function logout() {
        localStorage.removeItem('kg_current_user');
        return Promise.resolve({ success: true });
    }
    
    // ===== PRODUCTS =====
    async function getProducts(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        
        const url = `products.php${params.toString() ? '?' + params.toString() : ''}`;
        const data = await request(url, 'GET');
        return data.products || [];
    }
    
    async function getProductById(id) {
        const data = await request(`products.php?id=${id}`, 'GET');
        return data.product;
    }
    
    async function getCategories() {
        const data = await request(`categories.php`, 'GET');
        return data.categories || [];
    }
    
    // ===== ORDERS =====
    async function createOrder(orderData) {
        return request(`orders.php`, 'POST', orderData);
    }
    
    async function getOrders(userId) {
        if (!userId) return [];
        const data = await request(`orders.php?user_id=${userId}`, 'GET');
        return Array.isArray(data) ? data : [];
    }
    
    // ===== NEWSLETTER =====
    async function subscribeNewsletter(email) {
        return request(`newsletter.php`, 'POST', { email });
    }
    
    // ===== DISCOUNTS =====
    async function validateDiscount(code) {
        return request(`discount.php`, 'POST', { code });
    }
    
    // ===== CART (bleibt in localStorage für jetzt) =====
    // Keine Änderung nötig – Cart bleibt im Frontend
    
    return {
        // Auth
        register,
        login,
        getCurrentUser,
        updateProfile,
        logout,
        
        // Products
        getProducts,
        getProductById,
        getCategories,
        
        // Orders
        createOrder,
        getOrders,
        
        // Newsletter & Discounts
        subscribeNewsletter,
        validateDiscount
    };
})();