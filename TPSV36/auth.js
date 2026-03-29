(function () {
    // List of pages that don't need authentication
    const publicPages = ['login.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (publicPages.includes(currentPage)) {
        return;
    }

    const isLoggedIn = localStorage.getItem('tps_is_logged_in');
    const loginTime = localStorage.getItem('tps_login_time');
    const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
    const now = Date.now();

    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    } else if (loginTime && (now - parseInt(loginTime, 10)) > SESSION_TIMEOUT) {
        // Session expired
        alert('เซสชั่นของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('tps_is_logged_in');
        localStorage.removeItem('tps_auth_token');
        localStorage.removeItem('tps_login_time');
        window.location.href = 'login.html';
    }
})();

function logout() {
    localStorage.removeItem('tps_is_logged_in');
    localStorage.removeItem('tps_auth_token');
    localStorage.removeItem('tps_login_time');
    window.location.href = 'login.html';
}
