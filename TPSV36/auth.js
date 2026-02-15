(function () {
    // List of pages that don't need authentication
    const publicPages = ['login.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (publicPages.includes(currentPage)) {
        return;
    }

    const isLoggedIn = localStorage.getItem('tps_is_logged_in');
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    }
})();

function logout() {
    localStorage.removeItem('tps_is_logged_in');
    window.location.href = 'login.html';
}
