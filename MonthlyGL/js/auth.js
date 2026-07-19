// ==========================================================
// ส่วนควบคุมระบบการพิสูจน์ตัวตนและโควตาการใช้งาน (Authentication & Quota Controller)
// ==========================================================

const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbw1HJVtzDE0WSwDIbsj7DiQJuzDqo87ofAyy_E0mUpnsXtDPBaVQSmB3QOhf1i-v-Iw/exec";

// Auth State Helper
const Auth = {
    getCurrentUser() {
        return localStorage.getItem("currentUser");
    },
    getDisplayName() {
        return localStorage.getItem("userDisplayName") || localStorage.getItem("currentUser");
    },
    getQuotaRemain() {
        const val = localStorage.getItem("userGlRemain");
        if (val === null || val === "undefined") return 0;
        return parseInt(val) || 0;
    },
    getQuotaLimit() {
        const val = localStorage.getItem("userGlLimit");
        if (val === null || val === "undefined") return 0;
        return parseInt(val) || 0;
    },
    setSession(username, glLimit, glRemain, planLimit, planRemain, name) {
        localStorage.setItem("currentUser", username);
        localStorage.setItem("userGlLimit", glLimit);
        localStorage.setItem("userGlRemain", glRemain);
        localStorage.setItem("userPlanLimit", planLimit);
        localStorage.setItem("userPlanRemain", planRemain);
        if (name !== undefined) {
            localStorage.setItem("userDisplayName", name);
        }
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem("authLoginDate", todayStr);
    },
    clearSession() {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userGlLimit");
        localStorage.removeItem("userGlRemain");
        localStorage.removeItem("userPlanLimit");
        localStorage.removeItem("userPlanRemain");
        localStorage.removeItem("userDisplayName");
        localStorage.removeItem("authLoginDate");
    },
    isLoggedIn() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const loginDate = localStorage.getItem("authLoginDate");
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (loginDate !== todayStr) {
            this.clearSession();
            return false;
        }
        return true;
    }
};

// Initialize Auth State on Page Load
(function() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    if (page === "index.html" || page === "login.html" || page === "") {
        if (Auth.isLoggedIn()) {
            window.location.href = "select.html";
            return;
        }
    } else {
        if (!Auth.isLoggedIn()) {
            window.location.href = "index.html";
            return;
        }
        
        if (page === "trial_balance.html") {
            if (sessionStorage.getItem("selectedService") !== "trial_balance") {
                window.location.href = "select.html";
                return;
            }
        }
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    setupAuthUI();
    checkLoginState();
});

// Check if user is logged in and toggle view
function checkLoginState(animate = false) {
    const loginOverlay = document.getElementById("loginOverlay");
    const selectionOverlay = document.getElementById("selectionOverlay");
    const mainWorkspace = document.getElementById("mainWorkspaceContainer");
    const sidebar = document.getElementById("mainSidebar");

    if (Auth.isLoggedIn()) {
        // Hide loginOverlay
        if (loginOverlay && !loginOverlay.classList.contains("hidden") && animate) {
            const loginCard = loginOverlay.querySelector(".relative");
            loginOverlay.style.transition = "all 0.5s ease-out";
            if (loginCard) {
                loginCard.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
                loginCard.classList.add("opacity-0", "scale-90", "translate-y-8");
            }
            loginOverlay.classList.remove("backdrop-blur-[6px]");
            loginOverlay.classList.add("backdrop-blur-none", "opacity-0", "pointer-events-none");
            setTimeout(() => {
                loginOverlay.classList.add("hidden");
                loginOverlay.classList.remove("backdrop-blur-none", "opacity-0", "pointer-events-none");
                loginOverlay.classList.add("backdrop-blur-[6px]");
                if (loginCard) {
                    loginCard.classList.remove("opacity-0", "scale-90", "translate-y-8");
                }
                stopSmokeAnimation();
            }, 500);
        } else {
            if (loginOverlay) {
                loginOverlay.classList.add("hidden");
                stopSmokeAnimation();
            }
        }

        // Set User Display Name in Selection Screen
        const selectionUserDisplayName = document.getElementById("selectionUserDisplayName");
        if (selectionUserDisplayName) {
            selectionUserDisplayName.textContent = Auth.getDisplayName();
        }

        // Set remaining quotas in Selection Screen
        const glRemainVal = localStorage.getItem("userGlRemain");
        const glRemain = (glRemainVal === null || glRemainVal === "undefined") ? 0 : (parseInt(glRemainVal) || 0);
        const glLimitVal = localStorage.getItem("userGlLimit");
        const glLimit = (glLimitVal === null || glLimitVal === "undefined") ? 0 : (parseInt(glLimitVal) || 0);

        const planRemainVal = localStorage.getItem("userPlanRemain");
        const planRemain = (planRemainVal === null || planRemainVal === "undefined") ? 0 : (parseInt(planRemainVal) || 0);
        const planLimitVal = localStorage.getItem("userPlanLimit");
        const planLimit = (planLimitVal === null || planLimitVal === "undefined") ? 0 : (parseInt(planLimitVal) || 0);

        const elGlRemain = document.getElementById("selectionGlRemain");
        const elGlLimit = document.getElementById("selectionGlLimit");
        const elPlanRemain = document.getElementById("selectionPlanRemain");
        const elPlanLimit = document.getElementById("selectionPlanLimit");

        if (elGlRemain) elGlRemain.textContent = glRemain;
        if (elGlLimit) elGlLimit.textContent = glLimit;
        if (elPlanRemain) elPlanRemain.textContent = planRemain;
        if (elPlanLimit) elPlanLimit.textContent = planLimit;

        // Check if Trial Balance was selected
        if (sessionStorage.getItem("selectedService") === "trial_balance") {
            if (selectionOverlay) selectionOverlay.classList.add("hidden");
            stopSmokeAnimation();
            
            if (mainWorkspace) {
                mainWorkspace.classList.remove("hidden");
                if (animate) {
                    mainWorkspace.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
                    mainWorkspace.classList.add("opacity-0", "scale-97");
                    mainWorkspace.offsetHeight; // force reflow
                    mainWorkspace.classList.remove("opacity-0", "scale-97");
                    mainWorkspace.classList.add("opacity-100", "scale-100");
                } else {
                    mainWorkspace.classList.remove("opacity-0", "scale-97");
                    mainWorkspace.classList.add("opacity-100", "scale-100");
                }
            }
            // If data is loaded, show sidebar
            if (sidebar && typeof monthlyResults !== 'undefined' && monthlyResults.length > 0) {
                sidebar.classList.remove("hidden");
            }
        } else {
            // Show selectionOverlay
            if (selectionOverlay) {
                selectionOverlay.classList.remove("hidden");
                startSmokeAnimation("selectionSmokeCanvas");
                if (animate) {
                    const selectionCard = selectionOverlay.querySelector(".relative");
                    selectionOverlay.style.transition = "all 0.5s ease-out";
                    if (selectionCard) {
                        selectionCard.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
                        selectionCard.classList.add("opacity-0", "scale-90", "translate-y-8");
                        selectionCard.offsetHeight; // force reflow
                        selectionCard.classList.remove("opacity-0", "scale-90", "translate-y-8");
                    }
                }
            }
            if (mainWorkspace) {
                mainWorkspace.classList.add("hidden");
                mainWorkspace.classList.add("opacity-0", "scale-97");
            }
            if (sidebar) sidebar.classList.add("hidden");
        }
        updateHeaderProfile();
    } else {
        sessionStorage.removeItem("selectedService");
        if (loginOverlay) {
            loginOverlay.classList.remove("hidden");
            loginOverlay.classList.remove("backdrop-blur-none", "opacity-0", "pointer-events-none");
            loginOverlay.classList.add("backdrop-blur-[6px]");
            const loginCard = loginOverlay.querySelector(".relative");
            if (loginCard) {
                loginCard.classList.remove("opacity-0", "scale-90", "translate-y-8");
            }
            startSmokeAnimation("loginSmokeCanvas");
        }
        if (selectionOverlay) selectionOverlay.classList.add("hidden");
        if (mainWorkspace) {
            mainWorkspace.classList.add("hidden");
            mainWorkspace.classList.add("opacity-0", "scale-97");
        }
        if (sidebar) sidebar.classList.add("hidden");
    }
}

function updateHeaderProfile() {
    const profileContainer = document.getElementById("headerProfileContainer");
    if (!profileContainer) return;

    const user = Auth.getDisplayName();
    const remain = Auth.getQuotaRemain();
    const limit = Auth.getQuotaLimit();

    profileContainer.innerHTML = `
        <div class="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-sm">
            <div class="text-right leading-tight">
                <div class="text-xs font-black text-slate-700 truncate max-w-[130px]" title="${user}">${user}</div>
                <div class="text-[9px] text-slate-500 font-bold">โควตา: <span id="headerQuotaRemain" class="font-black text-sky-650 font-mono text-[10px]">${remain}</span>/${limit} ครั้ง/เดือน</div>
            </div>
            <div class="h-6 w-[1px] bg-slate-200"></div>
            <button id="btnBackToSelection" class="text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm flex items-center justify-center w-7 h-7" title="กลับหน้าเลือกบริการ">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 -960 960 960" fill="currentColor"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
            </button>
            <button id="btnAuthLogout" class="text-red-500 hover:text-red-700 transition-all focus:outline-none border border-red-100 hover:bg-red-50 rounded-lg shadow-sm flex items-center justify-center w-7 h-7" title="ออกจากระบบ">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
            </button>
        </div>
    `;

    // Event Listeners for profile actions
    document.getElementById("btnAuthLogout").addEventListener("click", () => {
        Auth.clearSession();
        sessionStorage.removeItem("selectedService");
        window.location.href = "index.html";
    });

    document.getElementById("btnBackToSelection").addEventListener("click", () => {
        sessionStorage.removeItem("selectedService");
        window.location.href = "select.html";
    });
}

// Setup Event Listeners for Login form and Modals
function setupAuthUI() {
    // Service Selection Actions
    const btnSelectTrialBalance = document.getElementById("btnSelectTrialBalance");
    if (btnSelectTrialBalance) {
        btnSelectTrialBalance.addEventListener("click", () => {
            sessionStorage.setItem("selectedService", "trial_balance");
            window.location.href = "trial_balance.html";
        });
    }

    const btnSelectionLogout = document.getElementById("btnSelectionLogout");
    if (btnSelectionLogout) {
        btnSelectionLogout.addEventListener("click", () => {
            Auth.clearSession();
            sessionStorage.removeItem("selectedService");
            window.location.href = "index.html";
        });
    }

    const btnSelectionChangePassword = document.getElementById("btnSelectionChangePassword");
    if (btnSelectionChangePassword) {
        btnSelectionChangePassword.addEventListener("click", () => {
            const modal = document.getElementById("changePasswordModal");
            if (modal) modal.classList.remove("hidden");
        });
    }

    // 1. Login Form Submit
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById("loginUsername");
            const passwordInput = document.getElementById("loginPassword");
            const errorEl = document.getElementById("loginErrorMsg");
            const btnSubmit = document.getElementById("loginSubmitBtn");

            if (!usernameInput || !passwordInput || !errorEl || !btnSubmit) return;

            errorEl.classList.add("hidden");
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>กำลังตรวจสอบ...`;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(AUTH_API_URL, {
                    method: "POST",
                    mode: "cors",
                    signal: controller.signal,
                    headers: { "Content-Type": "text/plain" }, // Avoid CORS preflight OPTIONS in GAS
                    body: JSON.stringify({
                        action: "login",
                        username: usernameInput.value.trim(),
                        password: passwordInput.value.trim()
                    })
                });

                clearTimeout(timeoutId);

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    throw new Error("Google Apps Script ตอบกลับเป็นข้อความทั่วไปที่ไม่ใช่ JSON (โปรดตรวจสอบการตั้งค่า Deploy Web App ให้สิทธิ์เข้าถึงเป็นแบบ 'Anyone')");
                }

                if (result.success) {
                    const glLimit = result.glLimit !== undefined ? result.glLimit : result.limit;
                    const glRemain = result.glRemain !== undefined ? result.glRemain : result.remain;
                    const planLimit = result.planLimit !== undefined ? result.planLimit : result.limit;
                    const planRemain = result.planRemain !== undefined ? result.planRemain : result.remain;

                    Auth.setSession(result.username, glLimit, glRemain, planLimit, planRemain, result.name);
                    usernameInput.value = "";
                    passwordInput.value = "";
                    window.location.href = "select.html";
                } else {
                    errorEl.textContent = result.message || "เกิดข้อผิดพลาดในการล็อกอิน";
                    errorEl.classList.remove("hidden");
                }
            } catch (err) {
                console.error(err);
                let msg = "เชื่อมต่อระบบ Backend ล้มเหลว โปรดตรวจสอบอินเทอร์เน็ต";
                if (err.name === 'AbortError') {
                    msg = "การเชื่อมต่อหมดเวลา กรุณาลองเชื่อมต่อใหม่อีกครั้ง";
                } else if (err.message) {
                    msg = err.message;
                }
                errorEl.textContent = msg;
                errorEl.classList.remove("hidden");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "เข้าสู่ระบบ";
            }
        });
    }

    // 2. Change Password Dialog Close
    const changePasswordModal = document.getElementById("changePasswordModal");
    const closeChangePassword = () => {
        if (changePasswordModal) {
            changePasswordModal.classList.add("hidden");
            const errEl = document.getElementById("changePassErrorMsg");
            const successEl = document.getElementById("changePassSuccessMsg");
            if (errEl) errEl.classList.add("hidden");
            if (successEl) successEl.classList.add("hidden");
            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
        }
    };

    const btnCloseChangePass = document.getElementById("btnCancelChangePassword");
    if (btnCloseChangePass) btnCloseChangePass.addEventListener("click", closeChangePassword);

    // 3. Change Password Submit
    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const oldPass = document.getElementById("oldPassword").value.trim();
            const newPass = document.getElementById("newPassword").value.trim();
            const confirmPass = document.getElementById("confirmPassword").value.trim();

            const errEl = document.getElementById("changePassErrorMsg");
            const successEl = document.getElementById("changePassSuccessMsg");
            const btnSubmit = document.getElementById("btnSubmitChangePassword");

            if (errEl) errEl.classList.add("hidden");
            if (successEl) successEl.classList.add("hidden");

            if (newPass !== confirmPass) {
                if (errEl) {
                    errEl.textContent = "รหัสผ่านใหม่ไม่ตรงกัน";
                    errEl.classList.remove("hidden");
                }
                return;
            }

            if (newPass.length < 4) {
                if (errEl) {
                    errEl.textContent = "รหัสผ่านใหม่ต้องยาวอย่างน้อย 4 ตัวอักษร";
                    errEl.classList.remove("hidden");
                }
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>กำลังบันทึก...`;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(AUTH_API_URL, {
                    method: "POST",
                    mode: "cors",
                    signal: controller.signal,
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: "changePassword",
                        username: Auth.getCurrentUser(),
                        oldPassword: oldPass,
                        newPassword: newPass
                    })
                });

                clearTimeout(timeoutId);

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    throw new Error("Google Apps Script ตอบกลับเป็นข้อความทั่วไปที่ไม่ใช่ JSON (โปรดตรวจสอบการตั้งค่า Deploy Web App ให้สิทธิ์เข้าถึงเป็นแบบ 'Anyone')");
                }

                if (result.success) {
                    if (successEl) {
                        successEl.textContent = result.message || "เปลี่ยนรหัสผ่านเสร็จสมบูรณ์";
                        successEl.classList.remove("hidden");
                    }
                    setTimeout(closeChangePassword, 1500);
                } else {
                    if (errEl) {
                        errEl.textContent = result.message || "เกิดข้อผิดพลาด";
                        errEl.classList.remove("hidden");
                    }
                }
            } catch (err) {
                console.error(err);
                let msg = "เชื่อมต่อระบบ Backend ล้มเหลว";
                if (err.name === 'AbortError') {
                    msg = "การเชื่อมต่อหมดเวลา กรุณาลองเชื่อมต่อใหม่อีกครั้ง";
                } else if (err.message) {
                    msg = err.message;
                }
                if (errEl) {
                    errEl.textContent = msg;
                    errEl.classList.remove("hidden");
                }
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "บันทึกรหัสผ่านใหม่";
            }
        });
    }
}

// ==========================================================
// ระบบอนิเมชั่นควันพื้นหลังหน้าล็อคอิน (Login Smoke Canvas Particle System)
// ==========================================================
let smokeAnimationActive = false;
let smokeCanvas = null;
let smokeCtx = null;
let smokeParticles = [];
let smokeAnimationFrameId = null;

const SMOKE_COLORS = [
    { h: 199, s: 90, l: 60 },  // Sky Blue
    { h: 220, s: 85, l: 55 },  // Deep Blue
    { h: 170, s: 75, l: 60 },  // Teal
    { h: 145, s: 70, l: 58 }   // Emerald Green
];

class SmokeParticle {
    constructor(w, h) {
        this.reset(w, h, true);
    }

    reset(w, h, initial = false) {
        this.w = w;
        this.h = h;
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : h + Math.random() * 200;
        
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 0.3 + 0.1); // Drifts upwards slowly
        
        this.baseRadius = Math.random() * 120 + 120; // 120 to 240px radius
        this.radius = this.baseRadius;
        this.growthRate = Math.random() * 0.05 + 0.02;
        
        const colorBase = SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)];
        this.hVal = colorBase.h;
        this.sVal = colorBase.s;
        this.lVal = colorBase.l;
        
        this.alpha = 0;
        this.maxAlpha = Math.random() * 0.12 + 0.06; // Vibrant but soft overlay opacity
        this.life = 0;
        this.maxLife = Math.random() * 800 + 600;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.0015;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.life++;
        
        this.radius = this.baseRadius + this.life * this.growthRate;
        
        if (this.life < this.maxLife * 0.2) {
            this.alpha = (this.life / (this.maxLife * 0.2)) * this.maxAlpha;
        } else if (this.life > this.maxLife * 0.7) {
            const ratio = (this.maxLife - this.life) / (this.maxLife * 0.3);
            this.alpha = Math.max(0, ratio * this.maxAlpha);
        } else {
            this.alpha = this.maxAlpha;
        }
        
        if (this.life >= this.maxLife || this.y < -this.radius || this.x < -this.radius || this.x > this.w + this.radius) {
            this.reset(this.w, this.h, false);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, `hsla(${this.hVal}, ${this.sVal}%, ${this.lVal}%, ${this.alpha})`);
        grad.addColorStop(0.5, `hsla(${this.hVal}, ${this.sVal}%, ${this.lVal}%, ${this.alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${this.hVal}, ${this.sVal}%, ${this.lVal}%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function resizeSmokeCanvas() {
    if (!smokeCanvas) return;
    const rect = smokeCanvas.parentElement.getBoundingClientRect();
    smokeCanvas.width = rect.width;
    smokeCanvas.height = rect.height;
    
    if (smokeParticles.length === 0) {
        const particleCount = Math.min(25, Math.floor((rect.width * rect.height) / 40000) + 12);
        for (let i = 0; i < particleCount; i++) {
            smokeParticles.push(new SmokeParticle(smokeCanvas.width, smokeCanvas.height));
        }
    } else {
        smokeParticles.forEach(p => {
            p.w = smokeCanvas.width;
            p.h = smokeCanvas.height;
        });
    }
}

function animateSmoke() {
    if (!smokeAnimationActive) return;
    
    smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    smokeCtx.globalCompositeOperation = 'screen';
    
    for (let i = 0; i < smokeParticles.length; i++) {
        smokeParticles[i].update();
        smokeParticles[i].draw(smokeCtx);
    }
    
    smokeAnimationFrameId = requestAnimationFrame(animateSmoke);
}

function startSmokeAnimation(canvasId = "loginSmokeCanvas") {
    if (smokeAnimationActive) {
        stopSmokeAnimation();
    }
    
    smokeCanvas = document.getElementById(canvasId);
    if (!smokeCanvas) return;
    
    smokeCtx = smokeCanvas.getContext("2d");
    smokeAnimationActive = true;
    
    window.addEventListener("resize", resizeSmokeCanvas);
    resizeSmokeCanvas();
    
    animateSmoke();
}

function stopSmokeAnimation() {
    if (!smokeAnimationActive) return;
    
    smokeAnimationActive = false;
    if (smokeAnimationFrameId) {
        cancelAnimationFrame(smokeAnimationFrameId);
        smokeAnimationFrameId = null;
    }
    window.removeEventListener("resize", resizeSmokeCanvas);
    smokeParticles = [];
    if (smokeCtx && smokeCanvas) {
        smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    }
}
