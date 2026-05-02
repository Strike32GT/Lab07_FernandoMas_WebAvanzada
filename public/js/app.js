const App = (() => {
    const tokenKey = 'jwtToken';
    let currentUserPromise = null;

    function showToast(message, classes = '') {
        M.toast({ html: message, classes });
    }

    function showErrorToast(message) {
        showToast(message, 'toast-error');
    }

    function setToken(token) {
        sessionStorage.setItem(tokenKey, token);
    }

    function getToken() {
        return sessionStorage.getItem(tokenKey);
    }

    function clearSession() {
        sessionStorage.removeItem(tokenKey);
        currentUserPromise = null;
    }

    function decodeJwt(token) {
        const payload = token.split('.')[1];
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(normalized));
    }

    function isTokenExpired(token) {
        try {
            const payload = decodeJwt(token);
            return payload.exp * 1000 <= Date.now();
        } catch (error) {
            return true;
        }
    }

    function goToSignIn() {
        clearSession();
        window.location.href = '/signIn';
    }

    async function apiFetch(url, options = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            showToast('Sesion expirada. Vuelve a iniciar sesion.');
            goToSignIn();
            return null;
        }

        return response;
    }

    function getDefaultAvatar() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
                <rect width="96" height="96" rx="48" fill="#DBEAFE"/>
                <circle cx="48" cy="36" r="18" fill="#1663C7"/>
                <path d="M20 82c4-16 16-24 28-24s24 8 28 24" fill="#1663C7"/>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function setNavAvatar(user) {
        const avatar = document.getElementById('nav-avatar');
        const dashboardLink = document.querySelector('.nav-wrapper a[href="/dashboard/user"]');

        if (dashboardLink && user?.roles?.includes('admin')) {
            dashboardLink.setAttribute('href', '/dashboard/admin');
            dashboardLink.textContent = 'Dashboard admin';
        }

        if (!avatar) return;

        avatar.src = user?.url_profile || getDefaultAvatar();
        avatar.alt = user?.name
            ? `Avatar de ${user.name}`
            : 'Avatar por defecto';

        avatar.onerror = () => {
            avatar.onerror = null;
            avatar.src = getDefaultAvatar();
        };
    }

    async function getCurrentUser() {
        if (currentUserPromise) return currentUserPromise;

        currentUserPromise = (async () => {
            const response = await apiFetch('/api/users/me');
            if (!response || !response.ok) {
                currentUserPromise = null;
                return null;
            }

            return response.json();
        })();

        return currentUserPromise;
    }

    async function hydrateNav() {
        const logoutLink = document.getElementById('logout-link');
        if (!logoutLink) return;

        if (!logoutLink.dataset.bound) {
            logoutLink.addEventListener('click', (event) => {
                event.preventDefault();
                goToSignIn();
            });
            logoutLink.dataset.bound = 'true';
        }

        const token = getToken();
        if (!token || isTokenExpired(token)) return;

        const user = await getCurrentUser();
        if (user) {
            setNavAvatar(user);
        }
    }

    async function requireAuth({ roles } = {}) {
        const token = getToken();
        if (!token || isTokenExpired(token)) {
            goToSignIn();
            return null;
        }

        const user = await getCurrentUser();
        if (!user) {
            showToast('No se pudo validar la sesion.');
            goToSignIn();
            return null;
        }

        if (roles && roles.length > 0) {
            const hasRole = user.roles.some((role) => roles.includes(role));
            if (!hasRole) {
                window.location.href = '/403';
                return null;
            }
        }

        return user;
    }

    function fillForm(data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                input.value = value ?? '';
            }
        });
        M.updateTextFields();
    }

    function formatDate(dateValue) {
        return new Date(dateValue).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function toDateInputValue(dateValue) {
        return new Date(dateValue).toISOString().split('T')[0];
    }

    function getPrimaryRole(user) {
        if (user.roles.includes('admin')) return 'admin';
        return 'user';
    }

    function hydrateProfileHeader(user) {
        const primaryRole = getPrimaryRole(user);
        const title = document.getElementById('profile-title');
        const eyebrow = document.getElementById('profile-eyebrow');
        const dashboardLink = document.getElementById('profile-dashboard-link');

        if (title) {
            title.textContent = primaryRole === 'admin'
                ? 'Perfil del administrador'
                : 'Perfil del usuario';
        }

        if (eyebrow) {
            eyebrow.textContent = primaryRole === 'admin'
                ? 'Mi cuenta admin'
                : 'Mi cuenta user';
        }

        if (dashboardLink) {
            dashboardLink.href = primaryRole === 'admin'
                ? '/dashboard/admin'
                : '/dashboard/user';
            dashboardLink.textContent = primaryRole === 'admin'
                ? 'Ir a dashboard admin'
                : 'Ir a dashboard user';
        }
    }

    function clearAdminUserForm() {
        const form = document.getElementById('admin-user-form');
        if (!form) return;

        form.reset();
        document.getElementById('admin-user-id').value = '';
        document.getElementById('user-form-title').textContent = 'Crear usuario';
        document.getElementById('admin-password').required = true;
        document.getElementById('admin-role').value = 'user';
        M.updateTextFields();
        const select = document.getElementById('admin-role');
        const instance = M.FormSelect.getInstance(select);
        if (instance) instance.destroy();
        M.FormSelect.init(select);
    }

    function fillAdminUserForm(user) {
        document.getElementById('admin-user-id').value = user.id;
        document.getElementById('user-form-title').textContent = 'Editar usuario';
        document.getElementById('admin-name').value = user.name || '';
        document.getElementById('admin-lastName').value = user.lastName || '';
        document.getElementById('admin-phoneNumber').value = user.phoneNumber || '';
        document.getElementById('admin-birthdate').value = toDateInputValue(user.birthdate);
        document.getElementById('admin-email').value = user.email || '';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').required = false;
        document.getElementById('admin-url_profile').value = user.url_profile || '';
        document.getElementById('admin-adress').value = user.adress || '';
        document.getElementById('admin-role').value = user.roles.includes('admin') ? 'admin' : 'user';
        M.updateTextFields();
        const select = document.getElementById('admin-role');
        const instance = M.FormSelect.getInstance(select);
        if (instance) instance.destroy();
        M.FormSelect.init(select);
    }

    function redirectByRole(user) {
        if (user.roles.includes('admin')) {
            window.location.href = '/dashboard/admin';
            return;
        }

        window.location.href = '/dashboard/user';
    }

    function bindSignInForm() {
        hydrateNav();
        const form = document.getElementById('sign-in-form');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            const response = await fetch('/api/auth/signIn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                const loginMessage = response.status === 401
                    ? 'Error de credenciales. Verifica tu email y password.'
                    : (data.message || 'No fue posible iniciar sesion.');
                showErrorToast(loginMessage);
                return;
            }

            setToken(data.token);
            currentUserPromise = Promise.resolve(data.user);
            showToast('Sesion iniciada correctamente.');
            redirectByRole(data.user);
        });
    }

    function bindSignUpForm() {
        hydrateNav();
        const form = document.getElementById('sign-up-form');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            const response = await fetch('/api/auth/signUp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                showErrorToast(data.message || 'No fue posible registrar el usuario.');
                return;
            }

            showToast('Registro exitoso. Ahora inicia sesion.');
            window.location.href = '/signIn';
        });
    }

    async function loadProfile() {
        await hydrateNav();
        const user = await requireAuth();
        if (!user) return;

        hydrateProfileHeader(user);
        fillForm({
            ...user,
            birthdate: toDateInputValue(user.birthdate),
            age: user.age,
            rolesLabel: user.roles.join(', ')
        });
    }

    function bindProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            const response = await apiFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!response) return;

            const data = await response.json();
            if (!response.ok) {
                showErrorToast(data.message || 'No fue posible actualizar el perfil.');
                return;
            }

            fillForm({
                ...data,
                birthdate: toDateInputValue(data.birthdate),
                age: data.age
            });
            showToast('Perfil actualizado.');
        });
    }

    async function loadUserDashboard() {
        await hydrateNav();
        const user = await requireAuth({ roles: ['user', 'admin'] });
        if (!user) return;

        const container = document.getElementById('user-dashboard-content');
        if (!container) return;

        const items = [
            ['Nombre completo', `${user.name} ${user.lastName}`],
            ['Email', user.email],
            ['Telefono', user.phoneNumber],
            ['Edad', `${user.age} anios`],
            ['Roles', user.roles.join(', ')],
            ['Direccion', user.adress || 'No registrada']
        ];

        container.innerHTML = items.map(([label, value]) => `
            <article class="summary-card">
                <strong>${label}</strong>
                <p>${value}</p>
            </article>
        `).join('');
    }

    function initModal() {
        const modals = document.querySelectorAll('.modal');
        M.Modal.init(modals);
        const selects = document.querySelectorAll('select');
        M.FormSelect.init(selects);
    }

    async function showUserDetail(userId) {
        const response = await apiFetch(`/api/users/${userId}`);
        if (!response) return;

        const data = await response.json();
        if (!response.ok) {
            showErrorToast(data.message || 'No se pudo cargar el usuario.');
            return;
        }

        const target = document.getElementById('user-modal-content');
        target.innerHTML = `
            <p><strong>Nombre:</strong> ${data.name} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Telefono:</strong> ${data.phoneNumber}</p>
            <p><strong>Edad:</strong> ${data.age} anios</p>
            <p><strong>Fecha de nacimiento:</strong> ${formatDate(data.birthdate)}</p>
            <p><strong>Direccion:</strong> ${data.adress || 'No registrada'}</p>
            <p><strong>URL de perfil:</strong> ${data.url_profile || 'No registrada'}</p>
            <p><strong>Roles:</strong> ${data.roles.join(', ')}</p>
        `;

        const modalElement = document.getElementById('user-modal');
        const instance = M.Modal.getInstance(modalElement);
        instance.open();
    }

    async function openUserEditModal(userId) {
        const response = await apiFetch(`/api/users/${userId}`);
        if (!response) return;

        const data = await response.json();
        if (!response.ok) {
            showErrorToast(data.message || 'No se pudo cargar el usuario.');
            return;
        }

        fillAdminUserForm(data);
        const modalElement = document.getElementById('user-form-modal');
        const instance = M.Modal.getInstance(modalElement);
        instance.open();
    }

    async function deleteUser(userId) {
        const confirmed = window.confirm('¿Seguro que deseas eliminar este usuario?');
        if (!confirmed) return;

        const response = await apiFetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response) return;

        const data = await response.json();
        if (!response.ok) {
            showErrorToast(data.message || 'No se pudo eliminar el usuario.');
            return;
        }

        showToast(data.message || 'Usuario eliminado correctamente.');
        await loadAdminDashboard();
    }

    function bindAdminUserForm() {
        const form = document.getElementById('admin-user-form');
        const createButton = document.getElementById('create-user-button');
        if (!form) return;

        if (createButton && !createButton.dataset.bound) {
            createButton.addEventListener('click', () => {
                clearAdminUserForm();
            });
            createButton.dataset.bound = 'true';
        }

        if (form.dataset.bound) return;
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const userId = document.getElementById('admin-user-id').value;
            const payload = {
                name: document.getElementById('admin-name').value,
                lastName: document.getElementById('admin-lastName').value,
                phoneNumber: document.getElementById('admin-phoneNumber').value,
                birthdate: document.getElementById('admin-birthdate').value,
                email: document.getElementById('admin-email').value,
                password: document.getElementById('admin-password').value,
                url_profile: document.getElementById('admin-url_profile').value,
                adress: document.getElementById('admin-adress').value,
                roles: [document.getElementById('admin-role').value]
            };

            if (!payload.password) {
                delete payload.password;
            }

            const response = await apiFetch(userId ? `/api/users/${userId}` : '/api/users', {
                method: userId ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            if (!response) return;

            const data = await response.json();
            if (!response.ok) {
                showErrorToast(data.message || 'No se pudo guardar el usuario.');
                return;
            }

            showToast(userId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
            const modalElement = document.getElementById('user-form-modal');
            const instance = M.Modal.getInstance(modalElement);
            instance.close();
            clearAdminUserForm();
            await loadAdminDashboard();
        });
        form.dataset.bound = 'true';
    }

    async function loadAdminDashboard() {
        await hydrateNav();
        const user = await requireAuth({ roles: ['admin'] });
        if (!user) return;

        const response = await apiFetch('/api/users');
        if (!response) return;

        const users = await response.json();
        if (!response.ok) {
            showErrorToast(users.message || 'No se pudo cargar la lista de usuarios.');
            return;
        }

        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = users.map((item) => `
            <tr>
                <td>${item.name} ${item.lastName}</td>
                <td>${item.email}</td>
                <td>${item.roles.join(', ')}</td>
                <td>${formatDate(item.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-small" data-action="view" data-user-id="${item.id}">Ver</button>
                        <button class="btn-small" data-action="edit" data-user-id="${item.id}">Editar</button>
                        <button class="btn-small btn-danger" data-action="delete" data-user-id="${item.id}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('[data-user-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const { action, userId } = button.dataset;

                if (action === 'view') {
                    showUserDetail(userId);
                    return;
                }

                if (action === 'edit') {
                    openUserEditModal(userId);
                    return;
                }

                if (action === 'delete') {
                    deleteUser(userId);
                }
            });
        });
    }

    hydrateNav();

    return {
        bindSignInForm,
        bindSignUpForm,
        bindProfileForm,
        bindAdminUserForm,
        initModal,
        loadProfile,
        loadUserDashboard,
        loadAdminDashboard,
        requireAuth
    };
})();

window.App = App;
