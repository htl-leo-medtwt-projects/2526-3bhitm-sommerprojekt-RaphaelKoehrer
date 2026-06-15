/* ===================================================================
 * KöhrerGainz - Auth System
 * Login, Register, Form handling
 * =================================================================== */

const Auth = (() => {
    function init() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const authTabs = document.querySelectorAll('.auth-tab');

        if (authTabs.length) {
            authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const target = tab.dataset.tab;
                    switchTab(target);
                });
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }

        // Redirect if already logged in
        if (window.location.pathname.includes('auth.html') && localStorage.getItem('kg_user_id')) {
            window.location.href = 'profile.html';
        }
    }

    function switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.auth-form').forEach(f => f.classList.add('d-none'));
        document.getElementById(`${tab}Form`).classList.remove('d-none');
    }

    async function handleLogin(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const result = await Api.login(identifier, password);
        if (result.success) {
           localStorage.setItem('kg_user_id', result.user.id);
            localStorage.setItem('kg_current_user', JSON.stringify(result.user));
            App.showToast(`Willkommen zurück, ${result.user.full_name || result.user.username}!`, 'success');
            setTimeout(() => {
                window.location.href = result.user.role === 'admin' ? 'admin.html' : 'index.html';
            }, 800);
        }
    } catch(error) {
        App.showToast(error.message, 'error');
    }
}

    async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        App.showToast('Passwörter stimmen nicht überein', 'error');
        return;
    }
    
    try {
        const result = await Api.register({ name: username, email, password });
        if (result.success) {
            localStorage.setItem('kg_user_id', result.user.id);
            localStorage.setItem('kg_current_user', JSON.stringify(result.user));
            App.showToast(`Willkommen bei KöhrerGainz, ${result.user.full_name || result.user.username}!`, 'success');
            setTimeout(() => window.location.href = 'index.html', 800);
        }
    } catch(error) {
        App.showToast(error.message, 'error');
    }
}
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            let errorEl = field.parentElement.querySelector('.form-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'form-error';
                field.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = message;
            field.style.borderColor = 'var(--danger)';
        }
    }

    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '');
    }

    document.addEventListener('DOMContentLoaded', init);

    return { switchTab };
})();
