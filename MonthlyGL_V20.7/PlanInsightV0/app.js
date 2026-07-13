// --- Quota & Auth Check on Load (Run instantly to prevent screen flashing) ---
(function() {
    const currentUser = localStorage.getItem("currentUser");
    const loginDate = localStorage.getItem("authLoginDate");
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!currentUser || loginDate !== todayStr) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userGlLimit");
        localStorage.removeItem("userGlRemain");
        localStorage.removeItem("userPlanLimit");
        localStorage.removeItem("userPlanRemain");
        localStorage.removeItem("userDisplayName");
        localStorage.removeItem("authLoginDate");
        alert("กรุณาเข้าสู่ระบบก่อนการใช้งาน");
        window.location.href = "../index.html";
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- Quota & Auth Check on Load ---
    const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbw1HJVtzDE0WSwDIbsj7DiQJuzDqo87ofAyy_E0mUpnsXtDPBaVQSmB3QOhf1i-v-Iw/exec";

    function updateHeaderProfile() {
        const profileContainer = document.getElementById("headerProfileContainer");
        if (!profileContainer) return;
        const user = localStorage.getItem("userDisplayName") || localStorage.getItem("currentUser") || "ผู้ใช้งาน";
        const remainVal = localStorage.getItem("userPlanRemain");
        const remain = (remainVal === null || remainVal === "undefined") ? 0 : (parseInt(remainVal) || 0);
        const limitVal = localStorage.getItem("userPlanLimit");
        const limit = (limitVal === null || limitVal === "undefined") ? 0 : (parseInt(limitVal) || 0);

        profileContainer.innerHTML = `
            <div class="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
                <div class="text-right leading-tight">
                    <div class="text-xs font-black text-slate-700 truncate max-w-[130px]" title="${user}">${user}</div>
                    <div class="text-[9px] text-slate-500 font-bold">โควตา: <span class="font-black text-sky-650 font-mono text-[10px]">${remain}</span>/${limit} ครั้ง/เดือน</div>
                </div>
                <div class="h-6 w-[1px] bg-slate-200 mx-1"></div>
                <button class="text-slate-500 hover:text-sky-600 transition-colors focus:outline-none border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm flex items-center justify-center w-7 h-7" title="กลับหน้าเลือกบริการ" onclick="sessionStorage.removeItem('selectedService'); window.location.href='../select.html'">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
                </button>
                 <button id="btnSelectionLogout" class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                    <span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg></span>
                </button>

            </div>
        `;

        const dashProfileContainer = document.getElementById("dashboardProfileContainer");
        if (dashProfileContainer) {
            dashProfileContainer.innerHTML = `
                <div class="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
                    <div class="text-right leading-tight">
                        <div class="text-xs font-black text-slate-700 truncate max-w-[130px]" title="${user}">${user}</div>
                        <div class="text-[9px] text-slate-500 font-bold">โควตา: <span class="font-black text-sky-655 font-mono text-[10px]">${remain}</span>/${limit} ครั้ง/เดือน</div>
                    </div>
                    <div class="h-6 w-[1px] bg-slate-200 mx-1"></div>
                    <button class="text-slate-500 hover:text-sky-600 transition-colors focus:outline-none border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm flex items-center justify-center w-7 h-7" title="กลับหน้าเลือกบริการ" onclick="sessionStorage.removeItem('selectedService'); window.location.href='../select.html'">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
                    </button>
                    <button id="btnAuthLogoutDashboard" class="text-red-500 hover:text-red-700 transition-all focus:outline-none border border-red-100 hover:bg-red-50 rounded-lg shadow-sm flex items-center justify-center w-7 h-7" title="ออกจากระบบ">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
                    </button>
                </div>
            `;

            const btnLogoutDash = document.getElementById("btnAuthLogoutDashboard");
            if (btnLogoutDash) {
                btnLogoutDash.addEventListener("click", () => {
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("userPlanRemain");
                    localStorage.removeItem("userPlanLimit");
                    localStorage.removeItem("userGlRemain");
                    localStorage.removeItem("userGlLimit");
                    localStorage.removeItem("userDisplayName");
                    window.location.reload();
                });
            }
        }
    }
    updateHeaderProfile();

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadScreen = document.getElementById('upload-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    // Review & Process State
    let uploadedFilesTemp = [];
    const reviewContainer = document.getElementById('review-files-container');
    const reviewListBody = document.getElementById('review-files-list-body');
    const errorMsgBox = document.getElementById('error-message-box');
    const btnProcessUpload = document.getElementById('btn-process-upload');

    function showError(msg) {
        if (msg) {
            errorMsgBox.textContent = msg;
            errorMsgBox.style.display = 'block';
        } else {
            errorMsgBox.style.display = 'none';
        }
    }

    function renderReviewList() {
        if (uploadedFilesTemp.length === 0) {
            reviewContainer.style.display = 'none';
            return;
        }

        reviewListBody.innerHTML = '';
        uploadedFilesTemp.forEach((file, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${file.name}</td>
                <td style="text-align: center;">
                    <button class="btn-remove-file" data-index="${index}" title="ลบ">&times;</button>
                </td>
            `;
            reviewListBody.appendChild(row);
        });

        reviewListBody.querySelectorAll('.btn-remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                uploadedFilesTemp.splice(idx, 1);
                renderReviewList();
            });
        });

        reviewContainer.style.display = 'block';
    }

    if (btnProcessUpload) {
        btnProcessUpload.addEventListener('click', () => {
            processUploadData();
        });
    }

    async function processUploadData() {
        if (uploadedFilesTemp.length === 0) {
            showError('กรุณาเลือกไฟล์ Excel ก่อนเริ่มประมวลผล');
            return;
        }

        const remainVal = localStorage.getItem("userPlanRemain");
        const remain = (remainVal === null || remainVal === "undefined") ? 0 : (parseInt(remainVal) || 0);
        const requiredQuota = uploadedFilesTemp.length;
        if (remain < requiredQuota) {
            showError(`ไม่สามารถประมวลผลได้: โควตาคงเหลือไม่เพียงพอ (ต้องการ ${requiredQuota} ครั้ง, คงเหลือ ${remain} ครั้ง) โควต้าจะรีเซ็ตใหม่ทุกสิ้นเดือน`);
            alert(`โควตาคงเหลือไม่เพียงพอ (ต้องการ ${requiredQuota} ครั้ง, คงเหลือ ${remain} ครั้ง)`);
            return;
        }

        showError('');
        reviewContainer.style.display = 'none';
        dropZone.style.display = 'none';
        document.querySelector('.upload-header').style.display = 'none';
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = 'flex';

        let currentRemain = remain;
        try {
            for (let k = 0; k < requiredQuota; k++) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(AUTH_API_URL, {
                    method: "POST",
                    mode: "cors",
                    signal: controller.signal,
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: "deduct",
                        username: currentUser,
                        system: "plan"
                    })
                });

                clearTimeout(timeoutId);
                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    throw new Error("Google Apps Script ตอบกลับเป็นข้อความทั่วไปที่ไม่ใช่ JSON");
                }

                if (!result.success) {
                    loadingIndicator.style.display = 'none';
                    reviewContainer.style.display = 'block';
                    dropZone.style.display = 'block';
                    document.querySelector('.upload-header').style.display = 'block';
                    showError('ไม่สามารถตัดโควตาได้: ' + (result.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'));
                    alert('การหักโควตาล้มเหลว: ' + (result.message || ''));
                    return;
                }
                currentRemain = result.remain;
            }

            localStorage.setItem("userPlanRemain", currentRemain);
            updateHeaderProfile();

            await executeAndRenderCalculations();

        } catch (err) {
            console.error(err);
            loadingIndicator.style.display = 'none';
            reviewContainer.style.display = 'block';
            dropZone.style.display = 'block';
            document.querySelector('.upload-header').style.display = 'block';

            let errMsg = 'เชื่อมต่อระบบ Backend เพื่อหักโควตาล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ต';
            if (err.name === 'AbortError') {
                errMsg = 'การเชื่อมต่อล้มเหลว กรุณาเชื่อมต่ออีกครั้ง';
            } else if (err.message) {
                errMsg = err.message;
            }
            showError(errMsg);
        }
    }

    function runFileCalculations() {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const fileArray = [...uploadedFilesTemp];
            if (fileArray.length === 0) {
                resolve();
                return;
            }
            
            fileArray.forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const extracted = processData(workbook);
                        if (extracted) {
                            const existing = hospitalStore.findIndex(h => h.name === extracted.name);
                            if (existing >= 0) {
                                hospitalStore[existing] = extracted;
                            } else {
                                hospitalStore.push(extracted);
                            }
                        }
                    } catch (err) {
                        console.error("Error parsing file: " + file.name, err);
                    }
                    
                    loadedCount++;
                    if (loadedCount === fileArray.length) {
                        resolve();
                    }
                };
                reader.onerror = function (err) {
                    console.error("FileReader error on file: " + file.name, err);
                    loadedCount++;
                    if (loadedCount === fileArray.length) {
                        resolve();
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        });
    }

    async function executeAndRenderCalculations() {
        await runFileCalculations();

        uploadScreen.style.display = 'none';
        const navEl = document.querySelector('nav');
        if (navEl) navEl.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        
        hospitalStore.forEach((_, i) => {
            extractInformation(i, false);
        });

        renderSidebar();
        switchHospital(hospitalStore.length - 1);
        document.getElementById('tab-btn-compare').style.display = hospitalStore.length > 1 ? 'inline-block' : 'none';
    }

    // Modal elements
    const modal = document.getElementById('chart-modal');
    const borderModalClose = document.getElementById('close-modal');

    // charts instances
    let incomeExpenseChart = null;
    let incomeBreakdownChart = null;
    let expenseBreakdownChart = null;
    let subChartInstances = [];

    // Dashboard State
    let showPctMain = false;
    let showPctModal = false;
    let showCompareValues = true;
    let showCompareGrowth = false;
    let showBreakdownIncome100 = false;
    let showBreakdownExpense100 = false;
    let showBreakdownIncomeSort = false;
    let showBreakdownExpenseSort = false;
    let breakdownCompareIncomeYearIdx = 3;
    let breakdownCompareExpenseYearIdx = 3;

    // Multi-Hospital Store
    let hospitalStore = [];
    let activeHospitalIndex = 0;
    let compareChartInstances = [];
    let compareMainChartInstance = null;
    let breakdownCompareIncomeChart = null;
    let breakdownCompareExpenseChart = null;


    // Hidden file input for adding hospitals from dashboard
    const addHospitalInput = document.createElement('input');
    addHospitalInput.type = 'file';
    addHospitalInput.accept = '.xlsx, .xls';
    addHospitalInput.multiple = true;
    addHospitalInput.style.display = 'none';
    document.body.appendChild(addHospitalInput);

    const triggerAddHospital = () => {
        uploadedFilesTemp = [];
        renderReviewList();
        
        uploadScreen.style.display = 'block';
        const navEl = document.querySelector('nav');
        if (navEl) navEl.style.display = 'block';
        dashboardScreen.style.display = 'none';
        
        dropZone.style.display = 'block';
        document.querySelector('.upload-header').style.display = 'block';
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        addHospitalInput.click();
    };
    
    // Global click listener to close toolbar when clicking outside
    document.addEventListener('click', (e) => { 
        const t = document.querySelector('.cell-toolbar'); 
        if (t && !e.target.closest('.cell-toolbar')) t.remove(); 
    });

    // Prevent browser default drop behavior globally so dropping files works properly
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    }, false);
    window.addEventListener('drop', (e) => {
        e.preventDefault();
    }, false);

    // --- Drag and Drop Handlers ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });

    // Add Hospital from dashboard
    addHospitalInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
            addHospitalInput.value = '';
        }
    });

    // --- Tab Navigation ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = 'tab-' + btn.dataset.tab;
            document.getElementById(targetId).classList.add('active');

            // Recalculate performance scrollbar width if performance tab is activated
            if (btn.dataset.tab === 'performance') {
                const mainTable = document.getElementById('perf-main-table');
                const topScrollContent = document.getElementById('perf-top-scroll-content');
                if (mainTable && topScrollContent) {
                    topScrollContent.style.width = mainTable.offsetWidth + 'px';
                }
            }

            // Switch sidebar content based on tab
            if (btn.dataset.tab === 'compare') {
                renderSidebar();
                renderCompareCategorySelector();
                renderCompareTab();
            } else {
                renderSidebar();
            }
        });
    });

    // --- Modal Handlers ---
    borderModalClose.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (window.modalChartInstance) {
            window.modalChartInstance.destroy();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.classList.add('hidden');
            if (window.modalChartInstance) window.modalChartInstance.destroy();
        }
    });

    // Helper to convert hex/rgb to rgba
    function hexToRgba(color, alpha) {
        if (!color || color === 'transparent') return color;
        if (color.startsWith('rgba')) return color.replace(/[\d\.]+\)$/, alpha + ')');
        if (color.startsWith('rgb')) return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    // Helper to update chart opacity
    function updateChartOpacity(chart, activeIndex, isDatasetIndex = false) {
        if (!chart) return;

        // Cache original colors once per chart
        if (!chart._originals) {
            chart._originals = chart.data.datasets.map(ds => ({
                bg: Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : ds.backgroundColor,
                border: Array.isArray(ds.borderColor) ? [...ds.borderColor] : ds.borderColor
            }));
        }

        // Only update if the active index changed to avoid flickering and tooltip issues
        const stateKey = `${activeIndex}_${isDatasetIndex}`;
        if (chart._lastState === stateKey) return;
        chart._lastState = stateKey;

        const opacity = 0.05; // Lower opacity for inactive items
        const processColor = (color, isSelected) => {
            if (!color || color === 'transparent') return color;
            if (Array.isArray(color)) {
                return color.map(c => isSelected ? c : hexToRgba(c, opacity));
            }
            return isSelected ? color : hexToRgba(color, opacity);
        };

        if (chart.config.type === 'doughnut' || (chart.config.type === 'bar' && chart.data.datasets.length === 1 && !isDatasetIndex)) {
            const ds = chart.data.datasets[0];
            const orig = chart._originals[0];
            if (activeIndex !== null) {
                ds.backgroundColor = orig.bg.map((c, i) => i === activeIndex ? c : hexToRgba(c, opacity));
                ds.borderWidth = 1.5;
                ds.borderColor = 'white';
            } else {
                ds.backgroundColor = [...orig.bg];
                ds.borderWidth = 1;
                ds.borderColor = 'white';
            }
        } else {
            // For Line/Bar (Comparison)
            chart.data.datasets.forEach((ds, i) => {
                const orig = chart._originals[i];
                if (activeIndex !== null) {
                    const isSelected = isDatasetIndex ? (i === activeIndex) : true;
                    ds.backgroundColor = processColor(orig.bg, isSelected);
                    
                    if (isSelected) {
                        ds.borderColor = '#1e293b'; // Strong dark border
                        ds.borderWidth = 2.5; // Thicker border
                    } else {
                        ds.borderColor = processColor(orig.border, false);
                        ds.borderWidth = 0.5; // Thinner border
                    }
                } else {
                    ds.backgroundColor = orig.bg;
                    ds.borderColor = orig.border;
                    ds.borderWidth = 1;
                }
            });
        }
        chart.update('none');
    }

    // Inline plugin to show values above points
    const dataLabelPlugin = {
        id: 'customDataLabel',
        afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, data } = chart;
            ctx.save();
            ctx.textAlign = 'center';

            const isMainChart = chart.canvas.id === 'income-expense-chart';
            const isModalChart = chart.canvas.id === 'modal-canvas';
            const isCompareChart = chart.canvas.id === 'compare-main-chart';
            
            const showPct = (isMainChart && showPctMain) || (isModalChart && showPctModal);

            // Special handling for Comparison Chart (multiple datasets)
            if (isCompareChart) {
                if (!showCompareValues && !showCompareGrowth) {
                    ctx.restore();
                    return;
                }

                data.datasets.forEach((dataset, dsIndex) => {
                    const meta = chart.getDatasetMeta(dsIndex);
                    if (meta.hidden) return;

                    meta.data.forEach((datapoint, index) => {
                        let value = dataset.data[index];
                        if (value === 0 || value === null || isNaN(value)) return;

                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.font = `bold 11px 'Sarabun', sans-serif`;
                        ctx.fillStyle = dataset.borderColor || '#1f2937';

                        // Show Values
                        if (showCompareValues) {
                            let text = value.toLocaleString('th-TH');
                            if (Math.abs(value) >= 1000000) text = (value / 1000000).toFixed(1) + 'M';
                            else if (Math.abs(value) >= 10000) text = (value / 1000).toFixed(0) + 'k';
                            
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(text, datapoint.x, datapoint.y - 8);
                        }

                        // Show Growth %
                        if (showCompareGrowth && index > 0) {
                            let prevValue = dataset.data[index - 1];
                            if (prevValue !== 0 && prevValue !== null && !isNaN(prevValue)) {
                                let growth = ((value - prevValue) / Math.abs(prevValue)) * 100;
                                let growthText = (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
                                
                                ctx.textBaseline = 'top';
                                ctx.font = `bold 10px 'Sarabun', sans-serif`;
                                ctx.fillStyle = growth >= 0 ? '#10b981' : '#ef4444';
                                // Position growth slightly offset if values are also shown
                                let yOffset = showCompareValues ? 15 : 8;
                                ctx.fillText(growthText, datapoint.x, datapoint.y + yOffset);
                            }
                        }
                        ctx.restore();
                    });
                });
                ctx.restore();
                return;
            }

            chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                let value = data.datasets[0].data[index];
                if (value === 0 || value === null || isNaN(value)) return;

                let text = value.toLocaleString('th-TH');
                if (value >= 1000000) text = (value / 1000000).toFixed(2) + 'M';
                else if (value >= 10000) text = (value / 1000).toFixed(0) + 'k';

                if (showPct) {
                    let plan = isMainChart ? data.datasets[0].data[3] : window.currentPlanValue;
                    if (plan > 0) {
                        let pct = ((value / plan) * 100).toFixed(0) + '%';
                        if (isMainChart) text = `${text} (${pct})`;
                        // In modal, we now show pct on the vertical line, so keep label as money
                    }
                }

                ctx.textBaseline = 'bottom';
                ctx.fillStyle = '#1f2937';
                ctx.font = `bold 13px 'Sarabun', sans-serif`;
                ctx.fillText(text, datapoint.x, datapoint.y - 12);

                if (index > 0 && !showPct) {
                    let prevValue = data.datasets[0].data[index - 1];
                    if (prevValue !== 0 && prevValue !== null) {
                        let diff = value - prevValue;
                        if (diff === 0) return; // Don't show 0 diff
                        let diffText = (diff > 0 ? '+' : '') + diff.toLocaleString('th-TH');
                        if (Math.abs(diff) >= 1000000) diffText = (diff > 0 ? '+' : '') + (diff / 1000000).toFixed(2) + 'M';
                        else if (Math.abs(diff) >= 10000) diffText = (diff > 0 ? '+' : '') + (diff / 1000).toFixed(0) + 'k';

                        ctx.textBaseline = 'top';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.fillStyle = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : '#6b7280');
                        ctx.fillText(diffText, datapoint.x, datapoint.y + 10);
                    }
                }
            });

            // Draw Progress Indicators in Modal
            if (isModalChart && showPctModal) {
                const isLinear = chart.scales.x.type === 'linear';
                const yScale = chart.scales.y;
                
                if (isLinear) {
                    // TREND VIEW comparison (Using Annual Plan as target for consistency)
                    const dsResult = chart.getDatasetMeta(1); // Dataset 1: Monthly Actuals
                    const targetY = yScale.getPixelForValue(window.currentPlanValue);
                    
                    dsResult.data.forEach((point, i) => {
                        if (i === 0) return; // Skip 0 point at start
                        
                        const actualVal = data.datasets[1].data[i].y;
                        if (window.currentPlanValue <= 0) return;

                        // Draw vertical line and %
                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(point.x, targetY);
                        ctx.stroke();

                        let pct = ((actualVal / window.currentPlanValue) * 100).toFixed(0) + '%';
                        let midY = (point.y + targetY) / 2;
                        
                        // Label background
                        const textWidth = ctx.measureText(pct).width;
                        ctx.fillStyle = 'rgba(255,255,255,0.85)';
                        ctx.fillRect(point.x - (textWidth / 2) - 2, midY - 7, textWidth + 4, 14);

                        ctx.fillStyle = '#3b82f6';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pct, point.x, midY);
                        ctx.restore();
                    });
                } else if (window.currentPlanValue > 0) {
                    // MONTHLY VIEW (Categorical)
                    const meta = chart.getDatasetMeta(0);
                    const targetY = yScale.getPixelForValue(window.currentPlanValue);
                    const rawData = data.datasets[0].data;

                    meta.data.forEach((point, i) => {
                        if (i === 11) return;
                        let val = rawData[i];
                        if (val === 0 || val === null) return;
                        let prevVal = i > 0 ? rawData[i - 1] : 0;
                        if (val <= prevVal && i > 0) return;

                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(point.x, targetY);
                        ctx.stroke();

                        let pct = ((val / window.currentPlanValue) * 100).toFixed(0) + '%';
                        let midY = (point.y + targetY) / 2;
                        
                        const textWidth = ctx.measureText(pct).width;
                        ctx.fillStyle = 'rgba(255,255,255,0.85)';
                        ctx.fillRect(point.x - (textWidth / 2) - 2, midY - 7, textWidth + 4, 14);

                        ctx.fillStyle = '#3b82f6';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pct, point.x, midY);
                        ctx.restore();
                    });
                }
            }

            ctx.restore();
        }
    };

    function handleFiles(files) {
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            if (!uploadedFilesTemp.some(f => f.name === file.name)) {
                uploadedFilesTemp.push(file);
            }
        });
        renderReviewList();
        fileInput.value = '';
    }

    function processData(workbook) {
        let mainSheet = null;
        let perfSheet = null;
        const mainSheetName = 'แผนรายรับ-รายจ่ายเงินบำรุง';
        const perfSheetName = 'ผลดำเนินงาน';

        if (workbook.Sheets[mainSheetName]) mainSheet = workbook.Sheets[mainSheetName];
        else {
            const foundName = workbook.SheetNames.find(n => n.includes('แผนรายรับ') || n.includes('เงินบำรุง'));
            mainSheet = foundName ? workbook.Sheets[foundName] : workbook.Sheets[workbook.SheetNames[0]];
        }

        if (workbook.Sheets[perfSheetName]) perfSheet = workbook.Sheets[perfSheetName];
        else {
            const fn = workbook.SheetNames.find(n => n.includes('ผลดำเนินงาน'));
            perfSheet = fn ? workbook.Sheets[fn] : null;
        }

        const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1, defval: "" });
        const perfData = perfSheet ? XLSX.utils.sheet_to_json(perfSheet, { header: 1, defval: "" }) : null;

        // Extract hospital name
        let hospitalName = "โรงพยาบาล (ไม่ทราบชื่อ)";
        for (let i = 0; i < Math.min(10, mainData.length); i++) {
            for (let j = 0; j < Math.min(5, mainData[i].length); j++) {
                let cell = String(mainData[i][j] || "").trim();
                if (cell.includes('โรงพยาบาล')) { hospitalName = cell; break; }
            }
            if (hospitalName !== "โรงพยาบาล (ไม่ทราบชื่อ)") break;
        }

        return { name: hospitalName, mainData, perfData };
    }

    function renderSidebar() {
        const list = document.getElementById('hospital-list');
        const count = document.getElementById('hospital-count');
        const header = document.querySelector('.sidebar-header h3');
        header.textContent = '🏥 รายชื่อ รพ.';
        count.innerText = hospitalStore.length;
        list.innerHTML = '';
        hospitalStore.forEach((h, i) => {
            const item = document.createElement('div');
            item.className = 'sidebar-item' + (i === activeHospitalIndex ? ' active' : '');
            const shortName = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim() || h.name;
            item.innerHTML = `
                <span class="sidebar-item-name" title="${h.name}">${shortName}</span>
                <span class="sidebar-item-delete" title="ลบ" data-idx="${i}">✕</span>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('sidebar-item-delete')) return;
                switchHospital(i);
            });
            item.querySelector('.sidebar-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                hospitalStore.splice(i, 1);
                if (activeHospitalIndex >= hospitalStore.length) activeHospitalIndex = Math.max(0, hospitalStore.length - 1);
                renderSidebar();
                if (hospitalStore.length > 0) {
                    switchHospital(activeHospitalIndex);
                } else {
                    uploadScreen.style.display = 'block';
                    const navEl = document.querySelector('nav');
                    if (navEl) navEl.style.display = 'block';
                    dashboardScreen.style.display = 'none';
                }
                document.getElementById('tab-btn-compare').style.display = hospitalStore.length > 1 ? 'inline-block' : 'none';
            });
            list.appendChild(item);
        });

        // Add "เพิ่มโรงพยาบาล" button after last hospital
        const addBtn = document.createElement('div');
        addBtn.className = 'sidebar-add-btn';
        addBtn.innerHTML = '➕ เพิ่มโรงพยาบาล';
        addBtn.addEventListener('click', triggerAddHospital);
        addBtn.addEventListener('dragover', (e) => { e.preventDefault(); addBtn.classList.add('drag-hover'); });
        addBtn.addEventListener('dragleave', () => addBtn.classList.remove('drag-hover'));
        addBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            addBtn.classList.remove('drag-hover');
            if (e.dataTransfer.files.length) {
                uploadedFilesTemp = [];
                uploadScreen.style.display = 'block';
                const navEl = document.querySelector('nav');
                if (navEl) navEl.style.display = 'block';
                dashboardScreen.style.display = 'none';
                
                dropZone.style.display = 'block';
                document.querySelector('.upload-header').style.display = 'block';
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                
                handleFiles(e.dataTransfer.files);
            }
        });
        list.appendChild(addBtn);
    }

    // --- Cell Annotation Persistence ---
    // Saves current table annotations into the active hospital's store
    function saveCellAnnotations() {
        const hospital = hospitalStore[activeHospitalIndex];
        if (!hospital) return;
        const cells = document.querySelectorAll('#report-table-container td.num-val');
        if (!cells.length) return;
        const annotations = {};
        cells.forEach(cell => {
            const row = cell.closest('tr');
            if (!row) return;
            const label = row.querySelector('.row-label')?.innerText?.trim() || '';
            const colIdx = Array.from(row.cells).indexOf(cell);
            const key = `${label}|${colIdx}`;
            const hlClass = ['hl-yellow', 'hl-green', 'hl-red', 'hl-blue'].find(c => cell.classList.contains(c)) || '';
            const stickerEl = cell.querySelector('.sticker');
            const sticker = stickerEl ? stickerEl.innerText : '';
            if (hlClass || sticker) annotations[key] = { hlClass, sticker };
        });
        hospital.cellAnnotations = annotations;
    }

    // Restores saved annotations back into rendered table cells
    function restoreCellAnnotations(hospitalIndex) {
        const hospital = hospitalStore[hospitalIndex];
        if (!hospital?.cellAnnotations) return;
        const annotations = hospital.cellAnnotations;
        const cells = document.querySelectorAll('#report-table-container td.num-val');
        cells.forEach(cell => {
            const row = cell.closest('tr');
            if (!row) return;
            const label = row.querySelector('.row-label')?.innerText?.trim() || '';
            const colIdx = Array.from(row.cells).indexOf(cell);
            const key = `${label}|${colIdx}`;
            const ann = annotations[key];
            if (!ann) return;
            if (ann.hlClass) {
                cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue');
                cell.classList.add(ann.hlClass);
            }
            if (ann.sticker) {
                let s = cell.querySelector('.sticker');
                if (!s) { s = document.createElement('span'); s.className = 'sticker'; cell.appendChild(s); }
                s.innerText = ann.sticker;
            }
        });
    }

    function switchHospital(index) {
        saveCellAnnotations();          // save current hospital's annotations before switching
        activeHospitalIndex = index;
        renderSidebar();
        extractInformation(index, true); // Update UI for selected hospital
    }

    // Compare item selection state (Single-select)
    let selectedCompareItem = '📊 รายรับ-รายจ่าย (ปีแผน)';

    function renderCompareCategorySelector() {
        const list = document.getElementById('compare-category-selector');
        if (!list) return;

        list.innerHTML = '<div class="sidebar-header" style="background:var(--bg-main); border-bottom:1px solid var(--border); padding:1rem"><h3>📊 เลือกรายการเปรียบเทียบ</h3></div>';
        const itemsContainer = document.createElement('div');
        itemsContainer.style.flex = '1';
        itemsContainer.style.overflowY = 'auto';
        list.appendChild(itemsContainer);

        const compareGroups = [
            { title: 'ภาพรวมเปรียบเทียบ', items: ['📊 รายรับ-รายจ่าย (ปีแผน)', '📈 เงินคงเหลือสุทธิ (6 ปี)', '🥧 สัดส่วนรายได้รายหมวด'] },
            { title: 'สรุปรายปี', items: ['รวมรายรับ', 'รวมรายจ่าย', 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ'] },
            { title: 'รายรับดำเนินงาน', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
            { title: 'รายรับอื่น', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] },
            { title: 'รายจ่ายบุคลากร', items: ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)"] },
            { title: 'รายจ่ายดำเนินงาน', items: ["ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"] },
            { title: 'รายจ่ายลงทุน', items: ["ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"] },
            { title: 'เงินคงเหลือ', items: ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์"] }
        ];

        itemsContainer.innerHTML = '';
        compareGroups.forEach(g => {
            // Group header
            const groupLabel = document.createElement('div');
            groupLabel.className = 'sidebar-group-label';
            groupLabel.textContent = g.title;
            itemsContainer.appendChild(groupLabel);

            // Items
            g.items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'sidebar-compare-item' + (item === selectedCompareItem ? ' active' : '');
                el.textContent = item;
                el.title = item;
                el.addEventListener('click', () => {
                    selectedCompareItem = item;
                    // Update active states
                    itemsContainer.querySelectorAll('.sidebar-compare-item').forEach(e => e.classList.remove('active'));
                    el.classList.add('active');
                    
                    // Trigger chart update
                    if (typeof window._updateItemChart === 'function') window._updateItemChart();
                    if (typeof window._updateCompareCharts === 'function') window._updateCompareCharts();
                });
                itemsContainer.appendChild(el);
            });
        });
    }

    function extractInformation(index, updateUI = true) {
        const hospitalObj = hospitalStore[index];
        if (!hospitalObj) return;

        const data = hospitalObj.mainData;
        const perfData = hospitalObj.perfData;

        let hospitalName = "วิเคราะห์ข้อมูลการเงินบำรุง";
        for (let i = 0; i < Math.min(10, data.length); i++) {
            for (let j = 0; j < Math.min(5, data[i].length); j++) {
                let cell = String(data[i][j] || "").trim();
                if (cell.includes('โรงพยาบาล')) { hospitalName = cell; break; }
            }
            if (hospitalName !== "วิเคราะห์ข้อมูลการเงินบำรุง") break;
        }

        if (updateUI) {
            document.getElementById('hospital-name').innerText = 'ผลการวิเคราะห์: ' + hospitalName;
        }

        const groups = [
            { title: 'รายรับจากการดำเนินงาน', type: 'income', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
            { title: 'รายรับอื่น', type: 'income', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] },
            { title: 'รายจ่ายบุคลากร', type: 'expense', items: ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น"] },
            { title: 'รายจ่ายจากการดำเนินงาน', type: 'expense', items: ["ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"] },
            { title: 'รายจ่ายลงทุน', type: 'expense', items: ["ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"] },
            { title: 'รายจ่ายอื่น', type: 'expense', items: ["รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ", "งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)"] },
            { title: 'เงินคงเหลือ', type: 'balance', items: ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์", "ประเภทกระแสรายวัน"] }
        ];

        let dataCols = [];
        let yearsLabels = ['2566', '2567', '2568', '2569', '2570', '2571'];

        for (let i = 0; i < data.length; i++) {
            let row = data[i];
            for (let j = 0; j < Math.min(5, row.length); j++) {
                let val = String(row[j] || "").trim();
                if (val === "รวมรายรับ" || val.includes("รายรับค่ารักษาพยาบาล")) {
                    for (let c = j + 1; c < row.length; c++) {
                        let cVal = String(row[c] || "").replace(/,/g, '').trim();
                        if (cVal !== "" && (cVal === "-" || !isNaN(parseFloat(cVal)))) {
                            if (!dataCols.includes(c)) dataCols.push(c);
                        }
                    }
                    break;
                }
            }
            if (dataCols.length >= 6) break;
        }
        if (dataCols.length < 6) dataCols = [1, 2, 3, 4, 5, 6];

        // --- Label Alias Map: normalize typos/variants from Excel templates ---
        const LABEL_ALIASES = {
            // typo in official template: missing 'เ' in เงิน
            'ค่าครุภัณฑ์งินบำรุง':  'ค่าครุภัณฑ์เงินบำรุง',
            // add more aliases here as new typos are discovered
        };
        const normalizeCellLabel = (cell) => LABEL_ALIASES[cell] ?? cell;

        const getSeries = (keyword) => {
            // Also treat the keyword itself through aliases in reverse
            // (so searching 'ค่าครุภัณฑ์เงินบำรุง' will also find 'ค่าครุภัณฑ์งินบำรุง' in file)
            const cleanK = keyword.replace(/\s+/g, '');
            let bestExact = null;
            let partialMatch = null;
            
            // Pass 1: Look for exact match (with data priority)
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < Math.min(10, data[i].length); j++) {
                    let cellVal = String(data[i][j] || "").trim();
                    let normalizedCell = normalizeCellLabel(cellVal);  // normalize typos
                    let cleanV = normalizedCell.replace(/\s+/g, '');
                    if (normalizedCell === keyword || cleanV === cleanK) {
                        const rowVals = dataCols.map(c => {
                            let vStr = String(data[i][c] || "").replace(/,/g, '').trim();
                            if (vStr === '-' || vStr === '') return 0;
                            let v = parseFloat(vStr);
                            return isNaN(v) ? 0 : v;
                        });
                        const hasData = rowVals.some(v => v !== 0);
                        if (!bestExact || (!bestExact.hasData && hasData)) {
                            bestExact = { vals: rowVals, hasData: hasData };
                        }
                        // If we found an exact match with data, we can stop
                        if (hasData) return rowVals;
                    }
                }
            }
            if (bestExact) return bestExact.vals;

            // Pass 2: Look for partial match if exact match fails
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < Math.min(10, data[i].length); j++) {
                    let cellVal = String(data[i][j] || "").trim();
                    let normalizedCell = normalizeCellLabel(cellVal);  // normalize typos
                    if (normalizedCell.includes(keyword)) {
                        const rowVals = dataCols.map(c => {
                            let vStr = String(data[i][c] || "").replace(/,/g, '').trim();
                            if (vStr === '-' || vStr === '') return 0;
                            let v = parseFloat(vStr);
                            return isNaN(v) ? 0 : v;
                        });
                        const hasData = rowVals.some(v => v !== 0);
                        if (!partialMatch || (!partialMatch.hasData && hasData)) {
                            partialMatch = { vals: rowVals, hasData: hasData };
                        }
                    }
                }
            }
            return partialMatch ? partialMatch.vals : [0, 0, 0, 0, 0, 0];
        };

        const sumCategories = (cats) => {
            let res = [0, 0, 0, 0, 0, 0];
            cats.forEach(c => {
                let s = getSeries(c);
                s.forEach((v, i) => res[i] += (v || 0));
            });
            return res;
        };

        const incomeCategories = groups.filter(g => g.type === 'income').flatMap(g => g.items);
        const expenseCategories = groups.filter(g => g.type === 'expense').flatMap(g => g.items);

        let tIncomes = getSeries('รวมรายรับ');
        let tExpenses = getSeries('รวมรายจ่าย');
        const incCalc = sumCategories(incomeCategories);
        const expCalc = sumCategories(expenseCategories);

        if (incCalc.reduce((a, b) => a + b, 0) > tIncomes.reduce((a, b) => a + b, 0)) tIncomes = incCalc;
        if (expCalc.reduce((a, b) => a + b, 0) > tExpenses.reduce((a, b) => a + b, 0)) tExpenses = expCalc;

        // Custom helper to get or calculate summary series
        const getReportSeries = (keyword) => {
            // Try to find the series with the exact or partial keyword
            let s = getSeries(keyword);

            // If not found, try a simplified keyword for some items
            if (s.every(v => v === 0)) {
                if (keyword.includes('งบกลาง')) s = getSeries('งบกลาง');
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) s = getSeries('รายรับสูง(ต่ำกว่า)รายจ่าย');
            }

            // If still not found or we want to ensure calculation consistency
            if (s.every(v => v === 0)) {
                if (keyword === 'รวมรายรับ') return tIncomes;
                if (keyword === 'รวมรายจ่าย') return tExpenses;
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) {
                    return tIncomes.map((v, i) => v - tExpenses[i]);
                }
                if (keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                    let net = getReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
                    let carry = getSeries('บวกเงินคงเหลือสะสมยกมา');
                    return net.map((v, i) => v + (carry[i] || 0));
                }
                if (keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                    let total1 = getReportSeries('เงินคงเหลือทั้งสิ้น(1)');
                    let h4 = getSeries('หักเงินกองทุนรอการจัดสรร(4)');
                    let h5 = getSeries('หักภาระผูกพัน(5)');
                    return total1.map((v, i) => v - (h4[i] || 0) - (h5[i] || 0));
                }
                if (keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                    let cash = getSeries('เงินสด');
                    let klang = getSeries('เงินฝากคลัง');
                    let p1 = getSeries('ประเภทประจำ');
                    let p2 = getSeries('ประเภทออมทรัพย์');
                    let p3 = getSeries('ประเภทกระแสรายวัน');
                    return cash.map((v, i) => (v || 0) + (klang[i] || 0) + (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0));
                }
            }
            return s;
        };

        let planIdx = 3;
        let tIncomePlan = tIncomes[planIdx];
        let tExpensePlan = tExpenses[planIdx];
        let netSeries = getReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
        let netPlan = netSeries[planIdx];

        if (updateUI) {
            document.getElementById('total-income-2569').innerText = tIncomePlan.toLocaleString('th-TH');
            document.getElementById('total-expense-2569').innerText = tExpensePlan.toLocaleString('th-TH');
            document.getElementById('net-2569').innerText = netPlan.toLocaleString('th-TH');
            document.getElementById('net-2569').style.color = netPlan >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        const formatLabel = (label, maxLen = 25) => {
            if (label.length <= maxLen) return label;
            let breakIdx = label.lastIndexOf(' ', maxLen);
            if (breakIdx === -1) breakIdx = maxLen;
            return [label.substring(0, breakIdx).trim(), label.substring(breakIdx).trim()];
        };

        const processBreakdown = (categories, pIdx) => {
            let items = categories.map(cat => ({ label: cat, value: getSeries(cat)[pIdx] })).filter(item => item.value > 0);
            items.sort((a, b) => b.value - a.value);
            // Show all items without forced wrapping for Thai text
            return { labels: items.map(item => item.label), values: items.map(item => item.value) };
        };



        // Store computed data for comparison
        hospitalObj.tIncomes = tIncomes;
        hospitalObj.tExpenses = tExpenses;
        hospitalObj.netSeries = netSeries;
        hospitalObj.yearsLabels = yearsLabels;
        hospitalObj.getSeries = getSeries;
        hospitalObj.getReportSeries = getReportSeries;

        if (updateUI) {
            const groupedData = groups.map(g => ({ title: g.title, type: g.type, items: g.items.map(item => ({ label: item, data: getSeries(item) })) }));
            renderCharts(yearsLabels, tIncomes, tExpenses, incomeCategories, expenseCategories, getSeries);
            renderGroupedSubCharts(yearsLabels, groupedData);
            renderReportTable(yearsLabels, getReportSeries);
            
            // Handle Breakdown Comparison
            const compareSection = document.getElementById('breakdown-compare-section');
            if (hospitalStore.length > 1) {
                compareSection.style.display = 'block';
                updateBreakdownCompareChart();
            } else {
                compareSection.style.display = 'none';
            }
        }

        // Performance Tab logic - locate October column index globally to align numeric data
        let octColIndex = -1;
        if (perfData) {
            for (let i = 0; i < Math.min(20, perfData.length); i++) {
                let row = perfData[i];
                for (let j = 0; j < row.length; j++) {
                    let cellVal = String(row[j] || "").trim();
                    if (cellVal.includes('ต.ค.')) {
                        octColIndex = j;
                        break;
                    }
                }
                if (octColIndex !== -1) break;
            }
        }

        const getPerfSeries = (keyword) => {
            if (!perfData || !keyword) return Array(14).fill(0);
            
            const cleanK = keyword.replace(/\s+/g, '').replace(/\(\d+\)/g, '').replace(/[\(\)\-\+]/g, '');
            let matchedRow = null;

            // Pass 1: Try exact match first
            for (let i = 0; i < perfData.length; i++) {
                let row = perfData[i];
                for (let j = 0; j < Math.min(12, row.length); j++) {
                    let cellVal = String(row[j] || "").trim();
                    let cleanV = cellVal.replace(/\s+/g, '').replace(/\(\d+\)/g, '').replace(/[\(\)\-\+]/g, '');
                    if (cleanV === '') continue;
                    
                    if (cleanV === cleanK) {
                        matchedRow = row;
                        break;
                    }
                }
                if (matchedRow) break;
            }

            // Pass 2: Fallback to partial match only if no exact match found
            if (!matchedRow) {
                for (let i = 0; i < perfData.length; i++) {
                    let row = perfData[i];
                    for (let j = 0; j < Math.min(12, row.length); j++) {
                        let cellVal = String(row[j] || "").trim();
                        let cleanV = cellVal.replace(/\s+/g, '').replace(/\(\d+\)/g, '').replace(/[\(\)\-\+]/g, '');
                        if (cleanV === '') continue;
                        
                        if (cleanV.includes(cleanK) || cleanK.includes(cleanV)) {
                            matchedRow = row;
                            break;
                        }
                    }
                    if (matchedRow) break;
                }
            }

            if (!matchedRow) {
                console.warn("[getPerfSeries] No match found for: ", keyword);
                return Array(14).fill(0);
            }

            if (octColIndex !== -1) {
                const rowVals = Array.from({ length: 14 }, (_, idx) => {
                    let colIndex = (idx === 0) ? (octColIndex - 1) : (octColIndex + idx - 1);
                    if (colIndex >= matchedRow.length) return 0;
                    let vStr = String(matchedRow[colIndex] || "").replace(/,/g, '').trim();
                    if (vStr === '-' || vStr === '') return 0;
                    let v = parseFloat(vStr);
                    return isNaN(v) ? 0 : v;
                });
                return rowVals;
            }

            // Fallback
            let matchedTextIdx = 0;
            for (let j = 0; j < Math.min(12, matchedRow.length); j++) {
                let cellVal = String(matchedRow[j] || "").trim();
                let cleanV = cellVal.replace(/\s+/g, '').replace(/\(\d+\)/g, '').replace(/[\(\)\-\+]/g, '');
                if (cleanV === cleanK || cleanV.includes(cleanK) || cleanK.includes(cleanV)) {
                    matchedTextIdx = j;
                    break;
                }
            }

            let firstNumericIdx = -1;
            for (let c = matchedTextIdx + 1; c < matchedRow.length; c++) {
                let valStr = String(matchedRow[c] || "").replace(/,/g, '').trim();
                if (valStr === '-') {
                    firstNumericIdx = c;
                    break;
                }
                let val = parseFloat(valStr);
                if (!isNaN(val)) {
                    if (val > 2500 && val < 2600 && c < 4) continue;
                    firstNumericIdx = c;
                    break;
                }
            }

            if (firstNumericIdx === -1) return Array(14).fill(0);

            const rowVals = Array.from({ length: 14 }, (_, idx) => {
                let colIndex = firstNumericIdx + idx;
                if (colIndex >= matchedRow.length) return 0;
                let vStr = String(matchedRow[colIndex] || "").replace(/,/g, '').trim();
                if (vStr === '-' || vStr === '') return 0;
                let v = parseFloat(vStr);
                return isNaN(v) ? 0 : v;
            });
            return rowVals;
        };

        const getPerfReportSeries = (keyword) => {
            let s = getPerfSeries(keyword);
            if (s.every(v => v === 0)) {
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) {
                    let inc = getPerfReportSeries('รวมรายรับ');
                    let exp = getPerfReportSeries('รวมรายจ่าย');
                    return inc.map((v, i) => v - exp[i]);
                }
                if (keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                    let net = getPerfReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
                    let carry = getPerfSeries('บวกเงินคงเหลือสะสมยกมา');
                    return net.map((v, i) => v + (carry[i] || 0));
                }
                if (keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                    let total1 = getPerfReportSeries('เงินคงเหลือทั้งสิ้น(1)');
                    let h4 = getPerfSeries('หักเงินกองทุนรอการจัดสรร(4)');
                    let h5 = getPerfSeries('หักภาระผูกพัน(5)');
                    return total1.map((v, i) => v - (h4[i] || 0) - (h5[i] || 0));
                }
                if (keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                    let cash = getPerfSeries('เงินสด');
                    let klang = getPerfSeries('เงินฝากคลัง');
                    let p1 = getPerfSeries('ประเภทประจำ');
                    let p2 = getPerfSeries('ประเภทออมทรัพย์');
                    let p3 = getPerfSeries('ประเภทกระแสรายวัน');
                    return cash.map((v, i) => (v || 0) + (klang[i] || 0) + (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0));
                }
            }
            return s;
        };

        if (updateUI) {
            renderPerformanceTable(getPerfReportSeries);
        }
    }

    function renderPerformanceTable(getData) {
        const container = document.getElementById('performance-table-container');
        if (!container) return;
        container.innerHTML = '';

        const reportRows = [
            { label: 'รายรับ', type: 'header', cat: 'income' },
            { label: 'รายรับจากการดำเนินงาน', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', indent: 2, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอก CUP (ในจังหวัดดสังกัด สธ.)', keyword: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอก CUP (ในจังหวัดดสังกัด สธ.)', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอก CUP (ต่างจังหวัดดสังกัด สธ.)', keyword: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอก CUP (ต่างจังหวัดดสังกัด สธ.)', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอกสังกัด สธ.', keyword: 'รายรับจากการเรียกเก็บค่ารักษา UC-OP นอกสังกัด สธ.', indent: 3, cat: 'income' },
            { label: 'รายรับบริการผู้ป่วยนอกทั่วไป OP เหมาจ่ายรายหัว', keyword: 'รายรับบริการผู้ป่วยนอกทั่วไป OP เหมาจ่ายรายหัว', indent: 3, cat: 'income' },
            { label: 'รายรับบริการผู้ป่วยในทั่วไป IP', keyword: 'รายรับบริการผู้ป่วยในทั่วไป IP', indent: 3, cat: 'income' },
            { label: 'รายรับบริการกรณีเฉพาะ  OP', keyword: 'รายรับบริการกรณีเฉพาะ  OP', indent: 3, cat: 'income' },
            { label: 'รายรับบริการกรณีเฉพาะ  IP', keyword: 'รายรับบริการกรณีเฉพาะ  IP', indent: 3, cat: 'income' },
            { label: 'รายรับ OP Refer', keyword: 'รายรับ OP Refer', indent: 3, cat: 'income' },
            { label: 'รายรับบริการฟื้นฟูสมรรถภาพด้านการแพทย์', keyword: 'รายรับบริการฟื้นฟูสมรรถภาพด้านการแพทย์', indent: 3, cat: 'income' },
            { label: 'รายรับบริการการแพทย์แผนไทย', keyword: 'รายรับบริการการแพทย์แผนไทย', indent: 3, cat: 'income' },
            { label: 'รายรับบริการทางการแพทย์ที่เบิกจ่ายในลักษณะงบลงทุน', keyword: 'รายรับบริการทางการแพทย์ที่เบิกจ่ายในลักษณะงบลงทุน', indent: 3, cat: 'income' },
            { label: 'รายรับกองทุน UC (CF)', keyword: 'รายรับกองทุน UC (CF)', indent: 3, cat: 'income' },
            { label: 'รายรับงบบริการผู้ติดเชื้อเอชไอวีและผู้ป่วยเอดส์', keyword: 'รายรับงบบริการผู้ติดเชื้อเอชไอวีและผู้ป่วยเอดส์', indent: 3, cat: 'income' },
            { label: 'รายรับงบบริการผู้ป่วยไตวายเรื้อรัง', keyword: 'รายรับงบบริการผู้ป่วยไตวายเรื้อรัง', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการผู้ป่วยจิตเวชเรื้องรังในชุมชน', keyword: 'รายรับค่าบริการผู้ป่วยจิตเวชเรื้องรังในชุมชน', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการควบคุมป้องกันและรักษาผู้ป่วยโรคเบาหวานและความดันโลหิตสูง', keyword: 'รายรับค่าบริการควบคุมป้องกันและรักษาผู้ป่วยโรคเบาหวานและความดันโลหิตสูง', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการควบคุมความรุนแรงโรคหืด', keyword: 'รายรับค่าบริการควบคุมความรุนแรงโรคหืด', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการสาธารณสุขเพิ่มเติมสำหรับหน่วยบริการในพื้นที่กันดาร พื้นที่เสี่ยงภัย และพื้นที่จังหวัดชายแดนใต้', keyword: 'รายรับค่าบริการสาธารณสุขเพิ่มเติมสำหรับหน่วยบริการในพื้นที่กันดาร พื้นที่เสี่ยงภัย และพื้นที่จังหวัดชายแดนใต้', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการสาธารณสุขเพิ่มเติมสำหรับการบริการปฐมภูมิ', keyword: 'รายรับค่าบริการสาธารณสุขเพิ่มเติมสำหรับการบริการปฐมภูมิ', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการสาธารณสุขสำหรับผู้ที่มีภาวะพึ่งพิงในชุมชน', keyword: 'รายรับค่าบริการสาธารณสุขสำหรับผู้ที่มีภาวะพึ่งพิงในชุมชน', indent: 3, cat: 'income' },
            { label: 'รายรับเงินช่วยเหลือเบื้องต้นผู้รับบริการและผู้ให้บริการ', keyword: 'รายรับเงินช่วยเหลือเบื้องต้นผู้รับบริการและผู้ให้บริการ', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการสร้างเสริมสุขภาพและป้องกันโรค เหมาจ่ายรายหัว', keyword: 'รายรับค่าบริการสร้างเสริมสุขภาพและป้องกันโรค เหมาจ่ายรายหัว', indent: 3, cat: 'income' },
            { label: 'รายรับ PP แก้ปัญหาพื้นที่ระดับเขต  PP NONUC', keyword: 'รายรับ PP แก้ปัญหาพื้นที่ระดับเขต  PP NONUC', indent: 3, cat: 'income' },
            { label: 'รายรับกองทุน UC - P&P  (Fee Schedule)', keyword: 'รายรับกองทุน UC - P&P  (Fee Schedule)', indent: 3, cat: 'income' },
            { label: 'รายรับกองทุน UC เฉพาะโรค อื่น', keyword: 'รายรับกองทุน UC เฉพาะโรค อื่น', indent: 3, cat: 'income' },
            { label: 'รายรับกองทุน UC อื่น', keyword: 'รายรับกองทุน UC อื่น', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', keyword: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', keyword: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง OP', keyword: 'รายรับค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง IP', keyword: 'รายรับค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่าตรวจสุขภาพหน่วยงานภาครัฐ', keyword: 'รายรับค่าตรวจสุขภาพหน่วยงานภาครัฐ', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', keyword: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกต้นสังกัด OP', keyword: 'รายรับค่ารักษาเบิกต้นสังกัด OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกต้นสังกัด IP', keyword: 'รายรับค่ารักษาเบิกต้นสังกัด IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกจ่ายตรงหน่วยงานอื่น OP', keyword: 'รายรับค่ารักษาเบิกจ่ายตรงหน่วยงานอื่น OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาเบิกจ่ายตรงหน่วยงานอื่น IP', keyword: 'รายรับค่ารักษาเบิกจ่ายตรงหน่วยงานอื่น IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', keyword: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท. OP (อบต./เทศบาล/อบจ)', keyword: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท. OP (อบต./เทศบาล/อบจ)', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท. IP (อบต./เทศบาล/อบจ)', keyword: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท. IP (อบต./เทศบาล/อบจ)', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท.รูปแบบพิเศษ OP (กทม/เมืองพัทยา)', keyword: 'รายรับค่ารักษา - เบิกจ่ายตรง อปท.รูปแบบพิเศษ OP (กทม/เมืองพัทยา)', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษา - เบิกจ่ายตรงอปท.รูปแบบพิเศษ IP (กทม/เมืองพัทยา)', keyword: 'รายรับค่ารักษา - เบิกจ่ายตรงอปท.รูปแบบพิเศษ IP (กทม/เมืองพัทยา)', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', keyword: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', indent: 2, cat: 'income' },
            { label: 'รายรับค่าบริการทางการแพทย์เงินจัดสรรเหมาจ่ายรายหัว OP', keyword: 'รายรับค่าบริการทางการแพทย์เงินจัดสรรเหมาจ่ายรายหัว OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการทางการแพทย์เงินจัดสรรเหมาจ่ายรายหัว IP', keyword: 'รายรับค่าบริการทางการแพทย์เงินจัดสรรเหมาจ่ายรายหัว IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม OP - เครือข่าย', keyword: 'รายรับค่ารักษาประกันสังคม OP - เครือข่าย', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม IP - เครือข่าย', keyword: 'รายรับค่ารักษาประกันสังคม IP - เครือข่าย', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม - กองทุนทดแทน', keyword: 'รายรับค่ารักษาประกันสังคม - กองทุนทดแทน', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม 72 ชั่วโมงแรก', keyword: 'รายรับค่ารักษาประกันสังคม 72 ชั่วโมงแรก', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคมค่าใช้จ่ายสูง/อุบัติเหตุ/ฉุกเฉิน OP', keyword: 'รายรับค่ารักษาประกันสังคมค่าใช้จ่ายสูง/อุบัติเหตุ/ฉุกเฉิน OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม - ค่าใช้จ่ายสูง IP', keyword: 'รายรับค่ารักษาประกันสังคม - ค่าใช้จ่ายสูง IP', indent: 3, cat: 'income' },
            { label: 'เงินจัดสรรประกันสังคม', keyword: 'เงินจัดสรรประกันสังคม', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม OP - นอกเครือข่าย', keyword: 'รายรับค่ารักษาประกันสังคม OP - นอกเครือข่าย', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาประกันสังคม IP - นอกเครือข่าย', keyword: 'รายรับค่ารักษาประกันสังคม IP - นอกเครือข่าย', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลประกันสังคม OP - นอกสังกัด สป. สธ.', keyword: 'รายรับค่ารักษาพยาบาลประกันสังคม OP - นอกสังกัด สป. สธ.', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลประกันสังคม IP - นอกสังกัด สป. สธ.', keyword: 'รายรับค่ารักษาพยาบาลประกันสังคม IP - นอกสังกัด สป. สธ.', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', keyword: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', indent: 2, cat: 'income' },
            { label: 'รายรับจากการขึ้นทะเบียน (ขายบัตรประกันสุขภาพ) ค่าตรวจสุขภาพคนต่างด้าวฯ', keyword: 'รายรับจากการขึ้นทะเบียน (ขายบัตรประกันสุขภาพ) ค่าตรวจสุขภาพคนต่างด้าวฯ', indent: 3, cat: 'income' },
            { label: 'รายรับค่าธรรมเนียม 30 บาท', keyword: 'รายรับค่าธรรมเนียม 30 บาท', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าว OP นอก CUP', keyword: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าว OP นอก CUP', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าว IP นอก CUP', keyword: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าว IP นอก CUP', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าวเบิกจากส่วนกลาง OP', keyword: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าวเบิกจากส่วนกลาง OP', indent: 3, cat: 'income' },
            { label: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าวเบิกจากส่วนกลาง IP', keyword: 'รายรับจากการเรียกเก็บค่ารักษาคนต่างด้าวและแรงงานต่างด้าวเบิกจากส่วนกลาง IP', indent: 3, cat: 'income' },
            { label: 'รายรับแรงงานต่างด้าว OP ', keyword: 'รายรับแรงงานต่างด้าว OP ', indent: 3, cat: 'income' },
            { label: 'รายรับแรงงานต่างด้าว IP', keyword: 'รายรับแรงงานต่างด้าว IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', keyword: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาชำระเงิน OP', keyword: 'รายรับค่ารักษาชำระเงิน OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาชำระเงิน IP', keyword: 'รายรับค่ารักษาชำระเงิน IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษา พรบ.รถ OP', keyword: 'รายรับค่ารักษา พรบ.รถ OP', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษา พรบ.รถ IP', keyword: 'รายรับค่ารักษา พรบ.รถ IP', indent: 3, cat: 'income' },
            { label: 'รายรับค่าตรวจสุขภาพหน่วยงานภายนอก', keyword: 'รายรับค่าตรวจสุขภาพหน่วยงานภายนอก', indent: 3, cat: 'income' },
            { label: 'รายรับค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ OP นอก CUP', keyword: 'รายรับค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ OP นอก CUP', indent: 3, cat: 'income' },
            { label: 'รายรับได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ - เบิกจากส่วนกลาง OP (นอกจากเหมาจ่ายรายหัว)', keyword: 'รายรับได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ - เบิกจากส่วนกลาง OP (นอกจากเหมาจ่ายรายหัว)', indent: 3, cat: 'income' },
            { label: 'รายรับได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ - เบิกจากส่วนกลาง IP', keyword: 'รายรับได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธิ - เบิกจากส่วนกลาง IP', indent: 3, cat: 'income' },
            { label: 'รายรับได้เงินอุดหนุนเหมาจ่ายรายหัวสำหรับบุคคลที่มีปัญหาสถานะและสิทธิ', keyword: 'รายรับได้เงินอุดหนุนเหมาจ่ายรายหัวสำหรับบุคคลที่มีปัญหาสถานะและสิทธิ', indent: 3, cat: 'income' },
            { label: 'รายรับค่าใบรับรองแพทย์', keyword: 'รายรับค่าใบรับรองแพทย์', indent: 3, cat: 'income' },
            { label: 'รายรับค่าธรรมเนียม UC 30 บาท', keyword: 'รายรับค่าธรรมเนียม UC 30 บาท', indent: 3, cat: 'income' },
            { label: 'รายรับอื่น ๆ', keyword: 'รายรับอื่น ๆ', indent: 3, cat: 'income' },
            { label: 'รายรับค่าบริการเฉพาะทางนอกเวลาราชการ SMC', keyword: 'รายรับค่าบริการเฉพาะทางนอกเวลาราชการ SMC', indent: 3, cat: 'income' },
            { label: 'รายรับอื่น', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับเงินช่วยเหลือ', keyword: 'รายรับเงินช่วยเหลือ', indent: 2, cat: 'income' },
            { label: 'รายรับเงินอุดหนุน', keyword: 'รายรับเงินอุดหนุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากการบริจาค', keyword: 'รายรับจากการบริจาค', indent: 2, cat: 'income' },
            { label: 'รายรับดอกเบี้ยเงินฝากธนาคาร', keyword: 'รายรับดอกเบี้ยเงินฝากธนาคาร', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', keyword: 'รายรับอื่น', indent: 2, cat: 'income' },
            { label: 'รวมรายรับ', keyword: 'รวมรายรับ', type: 'total', cat: 'income' },
            { label: 'รายจ่าย', type: 'header', cat: 'expense' },
            { label: 'รายจ่ายบุคลากร', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', keyword: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', indent: 2, cat: 'expense' },
            { label: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', keyword: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', keyword: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', keyword: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', keyword: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', keyword: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', indent: 2, cat: 'expense' },
            { label: 'เงินเพิ่ม (พ.ต.ส)', keyword: 'เงินเพิ่ม (พ.ต.ส)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนอื่น', keyword: 'ค่าตอบแทนอื่น', indent: 2, cat: 'expense' },
            { label: 'เงินค่าใช้จ่ายบุคลากรอื่น', keyword: 'เงินค่าใช้จ่ายบุคลากรอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายจากการดำเนินงาน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่ายา', keyword: 'ค่ายา', indent: 2, cat: 'expense' },
            { label: 'ค่าเวชภัณฑ์มิใช่ยา', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าวัสดุการแพทย์', keyword: 'ค่าวัสดุการแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', keyword: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเภสัช', keyword: 'ค่าวัสดุเภสัช', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุทันตกรรม', keyword: 'ค่าวัสดุทันตกรรม', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเอ็กซเรย์', keyword: 'ค่าวัสดุเอ็กซเรย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุ', keyword: 'ค่าวัสดุ', indent: 2, cat: 'expense' },
            { label: 'ค่าสาธารณูปโภค', keyword: 'ค่าสาธารณูปโภค', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้สอย', keyword: 'ค่าใช้สอย', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้จ่ายดำเนินงานอื่น', keyword: 'ค่าใช้จ่ายดำเนินงานอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายลงทุน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์งบค่าเสื่อม', keyword: 'ค่าครุภัณฑ์งบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบริจาค', keyword: 'ค่าครุภัณฑ์เงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบำรุง', keyword: 'ค่าครุภัณฑ์เงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้าง', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', keyword: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'รายจ่ายอื่น', type: 'header', indent: 1, cat: 'expense' },
            { label: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', keyword: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายอื่นๆ', keyword: 'รายจ่ายอื่นๆ', indent: 2, cat: 'expense' },
            { label: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', keyword: 'งบกลาง', indent: 1, cat: 'expense' },
            { label: 'รวมรายจ่าย', keyword: 'รวมรายจ่าย', type: 'total', cat: 'expense' },
            { label: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', keyword: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', type: 'net', cat: 'net' },
            { label: 'บวกเงินคงเหลือสะสมยกมา', keyword: 'บวกเงินคงเหลือสะสมยกมา', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น(1)', keyword: 'เงินคงเหลือทั้งสิ้น(1)', type: 'total', cat: 'net' },
            { label: 'หักเงินกองทุนรอการจัดสรร(4)', keyword: 'หักเงินกองทุนรอการจัดสรร(4)', type: 'net', cat: 'net' },
            { label: 'หักภาระผูกพัน(5)', keyword: 'หักภาระผูกพัน(5)', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', keyword: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', type: 'total', cat: 'net' }
        ];

        if (window.perfIsAccumulated === undefined) window.perfIsAccumulated = false;
        if (window.perfIsPercent === undefined) window.perfIsPercent = false;
        const months = ['แผน', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'รวม'];

        window.setPerfMode = (acc) => { window.perfIsAccumulated = acc; renderPerformanceTable(getData); };
        window.setPerfView = (pct) => { window.perfIsPercent = pct; renderPerformanceTable(getData); };

        if (window.perfMonthlyHidden === undefined) window.perfMonthlyHidden = true;
        window.togglePerfMonthlyColumns = () => {
            window.perfMonthlyHidden = !window.perfMonthlyHidden;
            renderPerformanceTable(getData);
        };

        // Tree collapsing state: default to true (collapsed)
        if (!window.perfCollapsedKeys) {
            window.perfCollapsedKeys = {
                'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC': true,
                'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง': true,
                'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด': true,
                'รายรับค่ารักษาพยาบาลเบิกจาก อปท.': true,
                'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม': true,
                'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว': true,
                'รายรับค่ารักษาพยาบาลและการบริการอื่น': true
            };
        }
        window.togglePerfRowCollapse = (key) => {
            window.perfCollapsedKeys[key] = !window.perfCollapsedKeys[key];
            renderPerformanceTable(getData);
        };

        const hiddenColStyle = window.perfMonthlyHidden ? 'style="display:none;"' : '';

        let controlsHtml = `
            <div class="perf-controls" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 0.9rem; font-weight: 600; color: #475569;">การแสดงผล:</span>
                <div class="perf-toggle-group">
                    <button class="perf-toggle-btn ${!window.perfIsAccumulated ? 'active' : ''}" onclick="window.setPerfMode(false)">รายเดือน</button>
                    <button class="perf-toggle-btn ${window.perfIsAccumulated ? 'active' : ''}" onclick="window.setPerfMode(true)">สะสม</button>
                </div>
                <div class="perf-toggle-group">
                    <button class="perf-toggle-btn ${!window.perfIsPercent ? 'active' : ''}" onclick="window.setPerfView(false)">จำนวนเงิน</button>
                    <button class="perf-toggle-btn ${window.perfIsPercent ? 'active' : ''}" onclick="window.setPerfView(true)">% ของแผน</button>
                </div>
                <div class="perf-toggle-group">
                    <button class="perf-toggle-btn ${!window.perfMonthlyHidden ? 'active' : ''}" onclick="window.togglePerfMonthlyColumns()">แสดงรายละเอียดรายเดือน</button>
                </div>
            </div>`;

             tableHtml = `<div class="report-section">
            <h2 style="margin-bottom: 1.5rem;">ตารางสรุปผลการดำเนินงานรายเดือน</h2>
            ${controlsHtml}
            <table class="report-table performance-table" id="perf-main-table">
                <thead>
                    <tr>
                        <th rowspan="2">รายการ</th>
                        <th rowspan="2" class="header-plan">แผน</th>
                        <th colspan="12" class="header-actual" ${hiddenColStyle}>ผลการดำเนินงานจริง (${window.perfIsAccumulated ? 'สะสม' : 'รายเดือน'})</th>
                        <th rowspan="2" class="header-total">รวม</th>
                        <th rowspan="2" class="header-percent" style="background:#f0f9ff; color:#1e40af">% ของแผน</th>
                    </tr>
                    <tr ${hiddenColStyle}>${months.slice(1, 13).map(m => `<th>${m}</th>`).join('')}</tr>
                </thead>
                <tbody>`;

        // We want to hide children if a parent is collapsed.
        // Let's implement a robust hierarchy check using an array of parent labels and the current row's parent association.
        // We will assign parent references or use indent levels to determine visibility dynamically.
        // Let's track the active collapse state for each indent level.
        let isParentCollapsedAtLevel = [false, false, false, false]; 

        // Let's define the collapse state of parent rows based on user's hierarchy keys.
        // Whenever we see a row, we check if any of its parent levels is collapsed.
        
        // We initialize window.perfCollapsedKeys if not already present
        if (!window.perfCollapsedKeys) {
            window.perfCollapsedKeys = {};
        }
        
        // Ensure all parent keys are collapsed by default on first load
        const parentKeys = [
            'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC',
            'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง',
            'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด',
            'รายรับค่ารักษาพยาบาลเบิกจาก อปท.',
            'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม',
            'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว',
            'รายรับค่ารักษาพยาบาลและการบริการอื่น',
            'รายรับเงินอุดหนุน',
            'รายรับจากการบริจาค',
            'รายรับอื่น',
            'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง',
            'ค่าตอบแทนอื่น',
            'เงินค่าใช้จ่ายบุคลากรอื่น',
            'ค่าเวชภัณฑ์มิใช่ยา',
            'ค่าวัสดุ',
            'ค่าสาธารณูปโภค',
            'ค่าใช้สอย',
            'ค่าใช้จ่ายดำเนินงานอื่น',
            'ค่าครุภัณฑ์',
            'ค่าที่ดินและสิ่งก่อสร้าง',
            'รายจ่ายอื่นๆ'
        ];
        
        parentKeys.forEach(k => {
            if (window.perfCollapsedKeys[k] === undefined) {
                window.perfCollapsedKeys[k] = true; // Default to collapsed
            }
        });

        let renderedRowsCount = 0;

        for (let idx = 0; idx < reportRows.length; idx++) {
            const row = reportRows[idx];
            const currentIndent = row.indent || 0;

            // Update parent collapse state tracker for current indent level
            const isCollapsibleParent = parentKeys.includes(row.label);
            const isCollapsed = window.perfCollapsedKeys[row.label] !== false;
            
            // Set collapse state for this level and all deeper levels
            isParentCollapsedAtLevel[currentIndent] = isCollapsibleParent && isCollapsed;
            for (let l = currentIndent + 1; l < isParentCollapsedAtLevel.length; l++) {
                isParentCollapsedAtLevel[l] = false;
            }

            // Check if this row should be hidden because any of its parents are collapsed
            let isHiddenByParent = false;
            for (let l = 0; l < currentIndent; l++) {
                if (isParentCollapsedAtLevel[l]) {
                    isHiddenByParent = true;
                    break;
                }
            }

            // Also search upwards manually in the list to verify parent collapse state
            // to make sure nothing slips through.
            if (!isHiddenByParent && currentIndent > 0) {
                let parentFound = false;
                for (let pIdx = idx - 1; pIdx >= 0; pIdx--) {
                    const pRow = reportRows[pIdx];
                    const pIndent = pRow.indent || 0;
                    if (pIndent < currentIndent) {
                        // Found direct parent
                        if (parentKeys.includes(pRow.label) && window.perfCollapsedKeys[pRow.label] !== false) {
                            isHiddenByParent = true;
                        }
                        break;
                    }
                }
            }

            if (isHiddenByParent) {
                continue; // Skip rendering this row
            }

            renderedRowsCount++;
            
            const rowClass = (row.type === 'header' ? 'group-header' : (row.type === 'total' ? 'total-row' : (row.type === 'net' ? 'net-row' : ''))) + ` cat-${row.cat || 'none'}`;
            const indentClass = row.indent ? `indent-${row.indent}` : '';
            const isCollapsedState = window.perfCollapsedKeys[row.label] !== false;
            
            let labelPrefix = '';
            if (isCollapsibleParent) {
                labelPrefix = `<span style="display:inline-block; width:20px; font-weight:bold; font-size:0.8rem; user-select:none; color:var(--text-muted); transition: transform 0.2s;">${isCollapsedState ? '▶' : '▼'}</span> `;
            }

            let graphButton = '';
            if (row.keyword) {
                graphButton = `<button class="btn-chart-popup" onclick="event.stopPropagation(); window.openPerfChart('${row.label}', '${row.keyword}')" style="background:none; border:none; color:#1e40af; cursor:pointer; font-size:1.1rem; padding:0 4px; margin-left:auto; display:inline-flex; align-items:center;" title="ดูแผนภูมิกราฟ">📊</button>`;
            }

            tableHtml += `<tr class="${rowClass}"><td class="row-label ${indentClass}" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; width:100%; min-width:320px;" onclick="if(${isCollapsibleParent}) { event.stopPropagation(); window.togglePerfRowCollapse('${row.label}') }"><span>${labelPrefix}${row.label}</span>${graphButton}</td>`;

            if (row.keyword) {
                let rawData = getData(row.keyword);
                let plan = rawData[0];
                let displayData = [];
                if (window.perfIsAccumulated) {
                    let runningSum = 0;
                    for (let i = 0; i < 14; i++) {
                        if (i === 0) displayData[0] = rawData[0];
                        else if (i === 13) displayData[13] = runningSum;
                        else { runningSum += rawData[i]; displayData[i] = runningSum; }
                    }
                } else displayData = [...rawData];

                tableHtml += `<td class="num-val">${displayData[0].toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
                for (let i = 1; i <= 12; i++) {
                    let val = displayData[i];
                    let displayStr = window.perfIsPercent && plan > 0 ? ((val / plan) * 100).toFixed(1) + '%' : val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    
                    let tdStyle = window.perfMonthlyHidden ? 'style="display:none;"' : '';
                    if (row.type === 'net' && val < 0) tableHtml += `<td class="num-val" ${tdStyle} style="color:var(--danger)">(${Math.abs(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>`;
                    else tableHtml += `<td class="num-val" ${tdStyle}>${displayStr}</td>`;
                }
                tableHtml += `<td class="num-val" style="font-weight:700">${displayData[13].toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
                let totalPctNum = plan > 0 ? (displayData[13] / plan) * 100 : 0;
                let totalPctStr = plan > 0 ? totalPctNum.toFixed(1) + '%' : '-';
                let progressWidth = Math.min(100, Math.max(0, totalPctNum));
                let isExpense = row.cat === 'expense';
                let isIncome = row.cat === 'income';
                let barColor = isExpense ? 'rgba(239, 68, 68, 0.25)' : (isIncome ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)');
                let barTextColor = isExpense ? '#b91c1c' : (isIncome ? '#047857' : '#1e40af');
                
                let cellContent = plan > 0 ? `
                    <div style="position: relative; width: 100%; height: 22px; display: flex; align-items: center; justify-content: flex-end; padding-right: 6px; border-radius: 4px; overflow: hidden; background: #f8fafc; border: 1px solid #e2e8f0; min-width: 80px;">
                        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${progressWidth}%; background-color: ${barColor}; transition: width 0.3s ease;"></div>
                        <span style="position: relative; z-index: 10; font-weight: 700; color: ${barTextColor}; font-size: 11px; font-family: monospace;">${totalPctStr}</span>
                    </div>
                ` : `<span style="color: #94a3b8;">-</span>`;
                tableHtml += `<td class="num-val" style="background:#f0f9ff; padding: 4px 6px; text-align: center; vertical-align: middle;">${cellContent}</td>`;
            } else {
                for (let i = 0; i < 15; i++) {
                    let tdStyle = (i > 0 && i < 13 && window.perfMonthlyHidden) ? 'style="display:none;"' : '';
                    tableHtml += `<td ${tdStyle}></td>`;
                }
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table></div>`;
        container.innerHTML = tableHtml;

        // Register global handler for chart popup
        window.openPerfChart = (labelText, keyword) => {
            const data = getData(keyword);
            let color = labelText.includes('รายรับ') ? '#10b981' : '#ef4444';
            openModalChart(labelText, months, data, color);
        };

        // Interactive features
        container.querySelector('.performance-table').addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (!cell || cell.tagName === 'TH' || cell.classList.contains('row-label') || e.target.closest('button')) return;
            e.stopPropagation();
            const existing = document.querySelector('.cell-toolbar');
            if (existing) { const isSame = existing._cell === cell; existing.remove(); if (isSame) return; }
            const toolbar = document.createElement('div');
            toolbar.className = 'cell-toolbar'; toolbar._cell = cell;
            const r1 = document.createElement('div'); r1.className = 'toolbar-row';
            [{ c: 'hl-yellow', bg: '#fef08a' }, { c: 'hl-green', bg: '#bbf7d0' }, { c: 'hl-red', bg: '#fecaca' }, { c: 'hl-blue', bg: '#bfdbfe' }].forEach(h => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.style.backgroundColor = h.bg;
                b.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); cell.classList.add(h.c); toolbar.remove(); };
                r1.appendChild(b);
            });
            const clr = document.createElement('div'); clr.className = 'toolbar-btn clear'; clr.innerText = '✕';
            clr.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); const s = cell.querySelector('.sticker'); if (s) s.remove(); toolbar.remove(); };
            r1.appendChild(clr); toolbar.appendChild(r1);
            const r2 = document.createElement('div'); r2.className = 'toolbar-row';
            ['👍', '❤️', '✅', '⚠️'].forEach(em => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.innerText = em;
                b.onclick = () => { let s = cell.querySelector('.sticker'); if (!s) { s = document.createElement('span'); s.className = 'sticker'; cell.appendChild(s); } s.innerText = em; toolbar.remove(); };
                r2.appendChild(b);
            });
            toolbar.appendChild(r2); document.body.appendChild(toolbar);
            const rect = cell.getBoundingClientRect();
            toolbar.style.left = `${Math.max(15, rect.left + window.scrollX)}px`; toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
        });


    }

    function renderReportTable(years, getSeries) {
        const container = document.getElementById('report-table-container');
        if (!container) return;
        container.innerHTML = '';
        const reportRows = [
            { label: 'รายรับ', type: 'header', cat: 'income' },
            { label: 'รายรับจากการดำเนินงาน', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', keyword: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', keyword: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', keyword: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', keyword: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', keyword: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', keyword: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', keyword: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับเงินช่วยเหลือ', keyword: 'รายรับเงินช่วยเหลือ', indent: 2, cat: 'income' },
            { label: 'รายรับเงินอุดหนุน', keyword: 'รายรับเงินอุดหนุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากการบริจาค', keyword: 'รายรับจากการบริจาค', indent: 2, cat: 'income' },
            { label: 'รายรับดอกเบี้ยเงินฝากธนาคาร', keyword: 'รายรับดอกเบี้ยเงินฝากธนาคาร', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', keyword: 'รายรับอื่น', indent: 2, cat: 'income' },
            { label: 'รวมรายรับ', keyword: 'รวมรายรับ', type: 'total', cat: 'income' },
            { label: 'รายจ่าย', type: 'header', cat: 'expense' },
            { label: 'รายจ่ายบุคลากร', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', keyword: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', indent: 2, cat: 'expense' },
            { label: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', keyword: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', keyword: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', keyword: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', keyword: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', keyword: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', indent: 2, cat: 'expense' },
            { label: 'เงินเพิ่ม (พ.ต.ส)', keyword: 'เงินเพิ่ม (พ.ต.ส)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนอื่น', keyword: 'ค่าตอบแทนอื่น', indent: 2, cat: 'expense' },
            { label: 'เงินค่าใช้จ่ายบุคลากรอื่น', keyword: 'เงินค่าใช้จ่ายบุคลากรอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายจากการดำเนินงาน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่ายา', keyword: 'ค่ายา', indent: 2, cat: 'expense' },
            { label: 'ค่าเวชภัณฑ์มิใช่ยา', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าวัสดุการแพทย์', keyword: 'ค่าวัสดุการแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', keyword: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเภสัช', keyword: 'ค่าวัสดุเภสัช', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุทันตกรรม', keyword: 'ค่าวัสดุทันตกรรม', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเอ็กซเรย์', keyword: 'ค่าวัสดุเอ็กซเรย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุ', keyword: 'ค่าวัสดุ', indent: 2, cat: 'expense' },
            { label: 'ค่าสาธารณูปโภค', keyword: 'ค่าสาธารณูปโภค', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้สอย', keyword: 'ค่าใช้สอย', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้จ่ายดำเนินงานอื่น', keyword: 'ค่าใช้จ่ายดำเนินงานอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายลงทุน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์งบค่าเสื่อม', keyword: 'ค่าครุภัณฑ์งบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบริจาค', keyword: 'ค่าครุภัณฑ์เงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบำรุง', keyword: 'ค่าครุภัณฑ์เงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้าง', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', keyword: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'รายจ่ายอื่น', type: 'header', indent: 1, cat: 'expense' },
            { label: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', keyword: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายอื่นๆ', keyword: 'รายจ่ายอื่นๆ', indent: 2, cat: 'expense' },
            { label: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', keyword: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', indent: 1, cat: 'expense' },
            { label: 'รวมรายจ่าย', keyword: 'รวมรายจ่าย', type: 'total', cat: 'expense' },
            { label: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', keyword: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', type: 'net', cat: 'net' },
            { label: 'บวกเงินคงเหลือสะสมยกมา', keyword: 'บวกเงินคงเหลือสะสมยกมา', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น(1)', keyword: 'เงินคงเหลือทั้งสิ้น(1)', type: 'total', cat: 'net' },
            { label: 'หักเงินกองทุนรอการจัดสรร(4)', keyword: 'หักเงินกองทุนรอการจัดสรร(4)', type: 'net', cat: 'net' },
            { label: 'หักภาระผูกพัน(5)', keyword: 'หักภาระผูกพัน(5)', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', keyword: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', type: 'total', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น ประกอบด้วย', type: 'header', cat: 'balance' },
            { label: 'เงินสด', keyword: 'เงินสด', indent: 1, cat: 'balance' },
            { label: 'เงินฝากคลัง', keyword: 'เงินฝากคลัง', indent: 1, cat: 'balance' },
            { label: 'เงินฝากธนาคาร', type: 'header', indent: 1, cat: 'balance' },
            { label: 'ประเภทประจำ', keyword: 'ประเภทประจำ', indent: 2, cat: 'balance' },
            { label: 'ประเภทออมทรัพย์', keyword: 'ประเภทออมทรัพย์', indent: 2, cat: 'balance' },
            { label: 'ประเภทกระแสรายวัน', keyword: 'ประเภทกระแสรายวัน', indent: 2, cat: 'balance' },
            { label: 'รวมเงินคงเหลือทั้งสิ้น(2)', keyword: 'รวมเงินคงเหลือทั้งสิ้น(2)', type: 'total', cat: 'balance' }
        ];

        let tableHtml = `<div class="report-section">
            <h2>ตารางรายงานประมาณการรายรับ-รายจ่าย</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th rowspan="2">รายการ</th>
                        <th colspan="3" class="header-actual">ข้อมูลย้อนหลัง 3 ปีงบประมาณ</th>
                        <th colspan="3" class="header-plan">แผนงบประมาณ</th>
                    </tr>
                    <tr>${years.map((y, i) => `<th class="${i >= 3 ? 'header-plan' : 'header-actual'}">${y}${i >= 3 ? '<br>(แผน)' : ''}</th>`).join('')}</tr>
                </thead>
                <tbody>`;

        reportRows.forEach(row => {
            const rowClass = (row.type === 'header' ? 'group-header' : (row.type === 'total' ? 'total-row' : (row.type === 'net' ? 'net-row' : ''))) + ` cat-${row.cat || 'none'}`;
            const indentClass = row.indent ? `indent-${row.indent}` : '';
            tableHtml += `<tr class="${rowClass}"><td class="row-label ${indentClass}">${row.label}</td>`;

            if (row.keyword) {
                let s = getSeries(row.keyword);
                const gs = (k) => getSeries(k) || [0, 0, 0, 0, 0, 0];
                const tolerance = 1;

                const incomeOpKeys = ["รายรับจากการดำเนินงาน", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"];
                const incomeOtherKeys = ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"];
                const expensePersonnelKeys = ["รายจ่ายบุคลากร", "ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น"];
                const expenseOpKeys = ["รายจ่ายจากการดำเนินงาน", "ค่ายา", "ค่าเวชภัณฑ์มิใช่ยา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"];
                const expenseInvestKeys = ["รายจ่ายลงทุน", "ค่าครุภัณฑ์", "ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้าง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"];
                const expenseOtherKeys = ["รายจ่ายอื่น", "รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ"];
                const balanceCompKeys = ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์", "ประเภทกระแสรายวัน"];

                s.forEach((val, i) => {
                    let displayVal = val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    let isInvalid = false;

                    if (row.keyword === 'รวมรายรับ') {
                        const sum = [...incomeOpKeys, ...incomeOtherKeys].reduce((acc, k) => acc + gs(k)[i], 0);
                        if (Math.abs(sum - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รวมรายจ่าย') {
                        const sum = [...expensePersonnelKeys, ...expenseOpKeys, ...expenseInvestKeys, ...expenseOtherKeys, 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)'].reduce((acc, k) => acc + gs(k)[i], 0);
                        if (Math.abs(sum - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ') {
                        const diff = gs('รวมรายรับ')[i] - gs('รวมรายจ่าย')[i];
                        if (Math.abs(diff - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                        const sum = gs('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ')[i] + gs('บวกเงินคงเหลือสะสมยกมา')[i];
                        const arithmeticOk = Math.abs(sum - val) <= tolerance;
                        // Only cross-check with (2) when val >= 0; negative balance can't match bank balances
                        const matchB2 = val < 0 ? true : Math.abs(gs('รวมเงินคงเหลือทั้งสิ้น(2)')[i] - val) <= tolerance;
                        if (!arithmeticOk || !matchB2) isInvalid = true;
                    } else if (row.keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                        const calc = gs('เงินคงเหลือทั้งสิ้น(1)')[i] - gs('หักเงินกองทุนรอการจัดสรร(4)')[i] - gs('หักภาระผูกพัน(5)')[i];
                        if (Math.abs(calc - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                        const sum = balanceCompKeys.reduce((acc, k) => acc + gs(k)[i], 0);
                        const matchB1 = Math.abs(gs('เงินคงเหลือทั้งสิ้น(1)')[i] - val) <= tolerance;
                        if (Math.abs(sum - val) > tolerance || !matchB1) isInvalid = true;
                    }

                    const sticker = isInvalid ? '<span class="sticker">⚠️</span>' : '';
                    if (row.type === 'net' && val < 0) tableHtml += `<td class="num-val negative" style="color: var(--danger)">(${Math.abs(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) ${sticker}</td>`;
                    else tableHtml += `<td class="num-val">${displayVal} ${sticker}</td>`;
                });
            } else for (let i = 0; i < 6; i++) tableHtml += `<td></td>`;
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        container.innerHTML = tableHtml;
        restoreCellAnnotations(activeHospitalIndex);

        container.querySelector('.report-table').addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (!cell || cell.tagName === 'TH' || cell.classList.contains('row-label')) return;
            e.stopPropagation();
            const existing = document.querySelector('.cell-toolbar');
            if (existing) { const isSame = existing._cell === cell; existing.remove(); if (isSame) return; }
            const toolbar = document.createElement('div');
            toolbar.className = 'cell-toolbar'; toolbar._cell = cell;
            const r1 = document.createElement('div'); r1.className = 'toolbar-row';
            [{ c: 'hl-yellow', bg: '#fef08a' }, { c: 'hl-green', bg: '#bbf7d0' }, { c: 'hl-red', bg: '#fecaca' }, { c: 'hl-blue', bg: '#bfdbfe' }].forEach(h => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.style.backgroundColor = h.bg;
                b.onclick = () => {
                    cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue');
                    cell.classList.add(h.c);
                    saveCellAnnotations();   // persist immediately
                    toolbar.remove();
                };
                r1.appendChild(b);
            });
            const clr = document.createElement('div'); clr.className = 'toolbar-btn clear'; clr.innerText = '✕';
            clr.onclick = () => {
                cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue');
                const s = cell.querySelector('.sticker'); if (s) s.remove();
                saveCellAnnotations();   // persist immediately
                toolbar.remove();
            };
            r1.appendChild(clr); toolbar.appendChild(r1);
            const r2 = document.createElement('div'); r2.className = 'toolbar-row';
            ['👍', '❤️', '✅', '⚠️'].forEach(em => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.innerText = em;
                b.onclick = () => {
                    let s = cell.querySelector('.sticker');
                    if (!s) { s = document.createElement('span'); s.className = 'sticker'; cell.appendChild(s); }
                    s.innerText = em;
                    saveCellAnnotations();   // persist immediately
                    toolbar.remove();
                };
                r2.appendChild(b);
            });
            toolbar.appendChild(r2); document.body.appendChild(toolbar);
            const rect = cell.getBoundingClientRect();
            toolbar.style.left = `${Math.max(15, rect.left + window.scrollX)}px`; toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
        });

        container.querySelectorAll('.row-label').forEach(labelCell => {
            const labelText = labelCell.innerText.trim();
            const hasDef = !!ACCOUNT_DEFINITIONS[labelText];
            labelCell.addEventListener('mouseenter', () => {
                if (hasDef) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'definition-tooltip'; tooltip.id = 'active-definition-tooltip';
                    tooltip.innerText = ACCOUNT_DEFINITIONS[labelText];
                    document.body.appendChild(tooltip);
                    const rect = labelCell.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX}px`; tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                }
                [incomeBreakdownChart, expenseBreakdownChart].forEach(chart => {
                    if (!chart) return;
                    const normTable = labelText.replace(/\s+/g, '');
                    const idx = chart.data.labels.findIndex(l => (Array.isArray(l) ? l.join('') : l).replace(/\s+/g, '') === normTable);
                    if (idx !== -1) { chart.setActiveElements([{ datasetIndex: 0, index: idx }]); chart.tooltip.setActiveElements([{ datasetIndex: 0, index: idx }], { x: 0, y: 0 }); chart.update(); }
                });
            });
            labelCell.addEventListener('mouseleave', () => {
                const t = document.getElementById('active-definition-tooltip'); if (t) t.remove();
                [incomeBreakdownChart, expenseBreakdownChart].forEach(chart => {
                    if (chart) { chart.setActiveElements([]); chart.tooltip.setActiveElements([], { x: 0, y: 0 }); chart.update(); }
                });
            });
            const rowCfg = reportRows.find(r => r.label === labelText);
            if (rowCfg && rowCfg.keyword) {
                labelCell.style.cursor = 'pointer';
                labelCell.onclick = (e) => {
                    const data = getSeries(rowCfg.keyword);
                    let color = labelText.includes('รายรับ') ? '#10b981' : (labelText.includes('รายจ่าย') || labelText.includes('ค่า') ? '#ef4444' : '#3b82f6');
                    openModalChart(labelText, years, data, color); e.stopPropagation();
                };
            }
        });
    }


    function renderCharts(labels, incomeSeries, expenseSeries, incomeCategories, expenseCategories, getSeries) {
        Chart.defaults.font.family = "'Sarabun', sans-serif";
        if (incomeExpenseChart) incomeExpenseChart.destroy();
        if (incomeBreakdownChart) incomeBreakdownChart.destroy();
        if (expenseBreakdownChart) expenseBreakdownChart.destroy();

        const ctxIE = document.getElementById('income-expense-chart').getContext('2d');
        const barLabels = labels.map((l, i) => 'ปี ' + l + (i >= 3 ? ' (แผน)' : ''));
        const updateMain = (type) => {
            if (incomeExpenseChart) incomeExpenseChart.destroy();
            const colorsMain = { income: '#10b981', expense: '#ef4444' };

            incomeExpenseChart = new Chart(ctxIE, {
                type: type,
                data: {
                    labels: barLabels,
                    datasets: [
                        {
                            label: 'รายรับ',
                            data: incomeSeries,
                            type: type,
                            borderColor: colorsMain.income,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea) return null;
                                return type === 'line' ? 'transparent' : incomeSeries.map((_, i) => i >= 3 ? hexToRgba(colorsMain.income, 0.4) : colorsMain.income);
                            },
                            fill: false,
                            borderWidth: 3,
                            tension: 0.3,
                            pointRadius: 5,
                            pointBackgroundColor: incomeSeries.map((_, i) => i >= 3 ? '#fff' : colorsMain.income),
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [5, 5] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(colorsMain.income, 0.5) : colorsMain.income
                            }
                        },
                        {
                            label: 'รายจ่าย',
                            data: expenseSeries,
                            type: type,
                            borderColor: colorsMain.expense,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea) return null;
                                return type === 'line' ? 'transparent' : expenseSeries.map((_, i) => i >= 3 ? hexToRgba(colorsMain.expense, 0.4) : colorsMain.expense);
                            },
                            fill: false,
                            borderWidth: 3,
                            tension: 0.3,
                            pointRadius: 5,
                            pointBackgroundColor: expenseSeries.map((_, i) => i >= 3 ? '#fff' : colorsMain.expense),
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [5, 5] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(colorsMain.expense, 0.5) : colorsMain.expense
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'nearest',
                        axis: 'xy',
                        intersect: false
                    },
                    onHover: (e, el) => {
                        if (el.length > 0) {
                            const chart = incomeExpenseChart;
                            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                            if (points.length > 0) {
                                updateChartOpacity(chart, points[0].datasetIndex, true);
                            }
                        } else {
                            updateChartOpacity(incomeExpenseChart, null);
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { size: 14, weight: '600' } },
                            onHover: (e, legendItem) => {
                                updateChartOpacity(incomeExpenseChart, legendItem.datasetIndex, true);
                            },
                            onLeave: () => {
                                updateChartOpacity(incomeExpenseChart, null);
                            }
                        },
                        tooltip: { bodyFont: { size: 14 }, titleFont: { size: 14 } }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { font: { size: 12 } } },
                        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
                    }
                }
            });
        };
        document.getElementById('toggle-pct').onclick = (e) => {
            showPctMain = !showPctMain;
            e.currentTarget.classList.toggle('active', showPctMain);
            updateMain(incomeExpenseChart.config.data.datasets[0].type);
        };
        updateMain('line');
        document.getElementById('toggle-line').onclick = () => { document.getElementById('toggle-line').classList.add('active'); document.getElementById('toggle-bar').classList.remove('active'); updateMain('line'); };
        document.getElementById('toggle-bar').onclick = () => { document.getElementById('toggle-bar').classList.add('active'); document.getElementById('toggle-line').classList.remove('active'); updateMain('bar'); };

        const colors = [
            '#0ca6e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
            '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b',
            '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#34d399',
            '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80',
            '#2dd4bf', '#818cf8', '#fb7185', '#94a3b8', '#fb923c'
        ];

        // 6-Year Stacked Legend Renderer
        const render6YearLegend = (legendEl, datasets, chartRef) => {
            legendEl.innerHTML = '';
            let total = 0;
            datasets.forEach(ds => {
                total += ds.data.reduce((a, b) => a + (b || 0), 0);
            });
            datasets.forEach((ds, i) => {
                const dsTotal = ds.data.reduce((a, b) => a + (b || 0), 0);
                const pct = total > 0 ? ((dsTotal / total) * 100).toFixed(1) : '0.0';
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.dataset.index = i;
                item.innerHTML = `
                    <span class="legend-dot" style="background:${ds.backgroundColor}"></span>
                    <span class="legend-label" title="${ds.label}">${ds.label}</span>
                    <span class="legend-pct">${pct}%</span>`;

                item.addEventListener('mouseenter', () => {
                    if (chartRef) {
                        updateChartOpacity(chartRef, i, true);
                    }
                    item.classList.add('highlighted');
                });
                item.addEventListener('mouseleave', () => {
                    if (chartRef) {
                        updateChartOpacity(chartRef, null);
                    }
                    item.classList.remove('highlighted');
                });
                legendEl.appendChild(item);
            });
        };

        const onChartHover = (e, el, chart, legendEl) => {
            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
            document.querySelectorAll('.report-table tr').forEach(r => r.classList.remove('active-row'));

            if (el.length > 0) {
                const dsIdx = el[0].datasetIndex;
                updateChartOpacity(chart, dsIdx, true);
                const item = legendEl.querySelector(`[data-index="${dsIdx}"]`);
                if (item) {
                    item.classList.add('highlighted');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                const label = chart.data.datasets[dsIdx].label;
                const norm = label.replace(/\s+/g, '');
                document.querySelectorAll('.report-table tr').forEach(row => {
                    const lc = row.querySelector('.row-label');
                    if (lc && lc.innerText.trim().replace(/\s+/g, '') === norm) {
                        row.classList.add('active-row');
                        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            } else {
                updateChartOpacity(chart, null);
            }
        };

        const incLegendEl = document.getElementById('income-legend');
        const expLegendEl = document.getElementById('expense-legend');

        // Prepare stacked datasets for income over 6 years
        let activeIncCats = incomeCategories.filter(cat => {
            const series = getSeries(cat);
            return series.some(val => val > 0);
        });
        const incDatasets = activeIncCats.map((cat, i) => {
            return {
                label: cat,
                data: getSeries(cat),
                backgroundColor: colors[i % colors.length],
                borderColor: colors[i % colors.length],
                borderWidth: 1
            };
        });

        incomeBreakdownChart = new Chart(document.getElementById('income-breakdown-chart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: incDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (e, el) => onChartHover(e, el, incomeBreakdownChart, incLegendEl),
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        grid: { display: true },
                        ticks: {
                            callback: value => value >= 1000000 ? (value / 1000000).toFixed(0) + 'M' : value.toLocaleString('th-TH')
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { size: 14, family: "'Sarabun', sans-serif" },
                        titleFont: { size: 13, family: "'Sarabun', sans-serif" },
                        callbacks: {
                            title: (tooltipItems) => {
                                return tooltipItems[0].label;
                            },
                            label: ctx => {
                                const val = ctx.raw !== undefined ? ctx.raw : ctx.parsed;
                                const datasetLabel = ctx.dataset.label;
                                let yearTotal = 0;
                                ctx.chart.data.datasets.forEach(ds => yearTotal += (ds.data[ctx.dataIndex] || 0));
                                const pct = yearTotal > 0 ? ((val / yearTotal) * 100).toFixed(1) : '0.0';
                                return ` ${datasetLabel}: ${val.toLocaleString('th-TH')} บาท (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
        render6YearLegend(incLegendEl, incDatasets, incomeBreakdownChart);

        const expColors = colors.slice().reverse();
        // Prepare stacked datasets for expense over 6 years
        let activeExpCats = expenseCategories.filter(cat => {
            const series = getSeries(cat);
            return series.some(val => val > 0);
        });
        const expDatasets = activeExpCats.map((cat, i) => {
            return {
                label: cat,
                data: getSeries(cat),
                backgroundColor: expColors[i % expColors.length],
                borderColor: expColors[i % expColors.length],
                borderWidth: 1
            };
        });

        expenseBreakdownChart = new Chart(document.getElementById('expense-breakdown-chart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: expDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (e, el) => onChartHover(e, el, expenseBreakdownChart, expLegendEl),
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        grid: { display: true },
                        ticks: {
                            callback: value => value >= 1000000 ? (value / 1000000).toFixed(0) + 'M' : value.toLocaleString('th-TH')
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { size: 14, family: "'Sarabun', sans-serif" },
                        titleFont: { size: 13, family: "'Sarabun', sans-serif" },
                        callbacks: {
                            title: (tooltipItems) => {
                                return tooltipItems[0].label;
                            },
                            label: ctx => {
                                const val = ctx.raw !== undefined ? ctx.raw : ctx.parsed;
                                const datasetLabel = ctx.dataset.label;
                                let yearTotal = 0;
                                ctx.chart.data.datasets.forEach(ds => yearTotal += (ds.data[ctx.dataIndex] || 0));
                                const pct = yearTotal > 0 ? ((val / yearTotal) * 100).toFixed(1) : '0.0';
                                return ` ${datasetLabel}: ${val.toLocaleString('th-TH')} บาท (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
        render6YearLegend(expLegendEl, expDatasets, expenseBreakdownChart);
    }

    function updateBreakdownCompareChart() {
        const hospitalObj = hospitalStore[activeHospitalIndex];
        const years = hospitalObj ? hospitalObj.yearsLabels : ['2566', '2567', '2568', '2569', '2570', '2571'];
        
        const incomeYearSelect = document.getElementById('compare-breakdown-income-year-select');
        const expenseYearSelect = document.getElementById('compare-breakdown-expense-year-select');
        
        const repopulateSelect = (selectEl, yearsList, currentSelectedIdx) => {
            if (!selectEl) return;
            selectEl.innerHTML = '';
            yearsList.forEach((yr, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.text = 'ปี ' + yr + (idx === 3 ? ' (แผน)' : '');
                opt.selected = idx === currentSelectedIdx;
                selectEl.appendChild(opt);
            });
        };

        if (incomeYearSelect && incomeYearSelect.options.length === 0) {
            repopulateSelect(incomeYearSelect, years, breakdownCompareIncomeYearIdx);
            incomeYearSelect.onchange = (e) => {
                breakdownCompareIncomeYearIdx = parseInt(e.target.value);
                updateBreakdownCompareChart();
            };
        }

        if (expenseYearSelect && expenseYearSelect.options.length === 0) {
            repopulateSelect(expenseYearSelect, years, breakdownCompareExpenseYearIdx);
            expenseYearSelect.onchange = (e) => {
                breakdownCompareExpenseYearIdx = parseInt(e.target.value);
                updateBreakdownCompareChart();
            };
        }

        const colors = [
            '#0ca6e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
            '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b',
            '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#34d399',
            '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80',
            '#2dd4bf', '#818cf8', '#fb7185', '#94a3b8', '#fb923c'
        ];

        const getShortName = (h) => {
            const n = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim();
            return n.length > 20 ? n.substring(0, 20) + '...' : n;
        };

        const renderSubChart = (type) => {
            const isIncome = type === 'income';
            const yearIdx = isIncome ? breakdownCompareIncomeYearIdx : breakdownCompareExpenseYearIdx;
            const canvasId = isIncome ? 'breakdown-compare-income-bar' : 'breakdown-compare-expense-bar';
            const legendId = isIncome ? 'breakdown-compare-income-legend' : 'breakdown-compare-expense-legend';
            const toggleId = isIncome ? 'toggle-breakdown-income-100' : 'toggle-breakdown-expense-100';
            const is100 = isIncome ? showBreakdownIncome100 : showBreakdownExpense100;
            const isSort = isIncome ? showBreakdownIncomeSort : showBreakdownExpenseSort;

            const chartVar = isIncome ? 'breakdownCompareIncomeChart' : 'breakdownCompareExpenseChart';

            const canvas = document.getElementById(canvasId);
            const legendEl = document.getElementById(legendId);
            const toggle100 = document.getElementById(toggleId);
            const toggleSort = document.getElementById(isIncome ? 'toggle-breakdown-income-sort' : 'toggle-breakdown-expense-sort');

            if (toggle100) {
                toggle100.onchange = (e) => {
                    if (isIncome) showBreakdownIncome100 = e.target.checked;
                    else showBreakdownExpense100 = e.target.checked;
                    updateBreakdownCompareChart();
                };
            }
            if (toggleSort) {
                toggleSort.onchange = (e) => {
                    if (isIncome) showBreakdownIncomeSort = e.target.checked;
                    else showBreakdownExpenseSort = e.target.checked;
                    updateBreakdownCompareChart();
                };
            }
            
            if (!canvas || !legendEl) return;

            const incomeGroups = ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น", "รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"];
            const expenseGroups = ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น", "ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น", "ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง", "รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ", "งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)"];

            const targetCats = isIncome ? incomeGroups : expenseGroups;

            const hospitals = [...hospitalStore].sort((a, b) => {
                const totalA = targetCats.reduce((sum, cat) => {
                    const s = a.getSeries ? a.getSeries(cat) : [0,0,0,0,0,0];
                    return sum + (s[yearIdx] || 0);
                }, 0);
                const totalB = targetCats.reduce((sum, cat) => {
                    const s = b.getSeries ? b.getSeries(cat) : [0,0,0,0,0,0];
                    return sum + (s[yearIdx] || 0);
                }, 0);
                return totalB - totalA;
            });
            
            let activeCats = targetCats.filter(cat => {
                return hospitals.some(h => {
                    const s = h.getSeries ? h.getSeries(cat) : [0,0,0,0,0,0];
                    return (s[yearIdx] || 0) > 0;
                });
            });

            if (isSort) {
                activeCats.sort((a, b) => {
                    const sumA = hospitals.reduce((acc, h) => {
                        const s = h.getSeries ? h.getSeries(a) : [0,0,0,0,0,0];
                        return acc + (s[yearIdx] || 0);
                    }, 0);
                    const sumB = hospitals.reduce((acc, h) => {
                        const s = h.getSeries ? h.getSeries(b) : [0,0,0,0,0,0];
                        return acc + (s[yearIdx] || 0);
                    }, 0);
                    return sumB - sumA;
                });
            }

            const datasets = activeCats.map((cat, i) => {
                const originalIdx = targetCats.indexOf(cat);
                const color = isIncome ? colors[originalIdx % colors.length] : colors.slice().reverse()[originalIdx % colors.length];
                return {
                    label: cat,
                    data: hospitals.map(h => {
                        const s = h.getSeries ? h.getSeries(cat) : [0,0,0,0,0,0];
                        const val = s[yearIdx] || 0;
                        if (is100) {
                            let total = 0;
                            targetCats.forEach(c => {
                                const ss = h.getSeries ? h.getSeries(c) : [0,0,0,0,0,0];
                                total += (ss[yearIdx] || 0);
                            });
                            return total > 0 ? (val / total) * 100 : 0;
                        }
                        return val;
                    }),
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1
                };
            });

            if (isIncome && breakdownCompareIncomeChart) breakdownCompareIncomeChart.destroy();
            if (!isIncome && breakdownCompareExpenseChart) breakdownCompareExpenseChart.destroy();

            const chart = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: hospitals.map(h => getShortName(h)),
                    datasets: datasets
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    onHover: (e, el) => {
                        if (el.length > 0) {
                            const dsIdx = el[0].datasetIndex;
                            updateChartOpacity(chart, dsIdx, true);
                            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
                            const legItem = legendEl.querySelector(`[data-index="${dsIdx}"]`);
                            if (legItem) legItem.classList.add('highlighted');
                            
                            const elements = hospitals.map((_, idx) => ({
                                datasetIndex: dsIdx,
                                index: idx
                            }));
                            chart.setActiveElements(elements);
                        } else {
                            updateChartOpacity(chart, null);
                            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
                            chart.setActiveElements([]);
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: false
                        }
                    },
                    scales: {
                        y: { stacked: true },
                        x: {
                            stacked: true,
                            beginAtZero: true,
                            max: is100 ? 100 : undefined,
                            ticks: {
                                callback: v => is100 ? v + '%' : (v >= 1000000 ? (v/1000000).toFixed(0) + 'M' : v.toLocaleString('th-TH'))
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'hoverLabels',
                    afterDraw: (chart) => {
                        const { ctx } = chart;
                        const activeElements = chart.getActiveElements();
                        if (activeElements.length > 0) {
                            ctx.save();
                            ctx.font = 'bold 11px Sarabun';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            activeElements.forEach(el => {
                                const meta = chart.getDatasetMeta(el.datasetIndex);
                                const element = meta.data[el.index];
                                const val = chart.data.datasets[el.datasetIndex].data[el.index];
                                
                                let text = '';
                                if (is100) {
                                    text = `${val.toFixed(1)}%`;
                                } else {
                                    let total = 0;
                                    chart.data.datasets.forEach(ds => total += ds.data[el.index]);
                                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                                    text = `${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val.toLocaleString('th-TH')} (${pct}%)`;
                                }
                                
                                const x = (element.x + element.base) / 2;
                                const y = element.y;
                                
                                const textWidth = ctx.measureText(text).width;
                                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                                ctx.fillRect(x - textWidth/2 - 3, y - 9, textWidth + 6, 18);
                                ctx.fillStyle = '#000';
                                ctx.fillText(text, x, y);
                            });
                            ctx.restore();
                        }
                    }
                }]
            });

            if (isIncome) breakdownCompareIncomeChart = chart;
            else breakdownCompareExpenseChart = chart;

            legendEl.innerHTML = '';
            activeCats.forEach((cat, i) => {
                const color = datasets[i].backgroundColor;
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.dataset.index = i;
                item.innerHTML = `
                    <span class="legend-dot" style="background:${color}"></span>
                    <span class="legend-label" title="${cat}">${cat}</span>`;
                
                item.addEventListener('mouseenter', () => {
                    updateChartOpacity(chart, i, true);
                    const elements = hospitals.map((_, idx) => ({
                        datasetIndex: i,
                        index: idx
                    }));
                    chart.setActiveElements(elements);
                    item.classList.add('highlighted');
                    chart.draw();
                });
                item.addEventListener('mouseleave', () => {
                    updateChartOpacity(chart, null);
                    chart.setActiveElements([]);
                    item.classList.remove('highlighted');
                });
                legendEl.appendChild(item);
            });

            const toggle = document.getElementById(toggleId);
            if (toggle && !toggle._hasListener) {
                toggle.onchange = (e) => {
                    if (isIncome) showBreakdownIncome100 = e.target.checked;
                    else showBreakdownExpense100 = e.target.checked;
                    updateBreakdownCompareChart();
                };
                toggle._hasListener = true;
            }
        };

        renderSubChart('income');
        renderSubChart('expense');
    }

    function renderGroupedSubCharts(yearsLabels, groupedData) {
        const container = document.getElementById('grouped-charts-container');
        // Preserve scroll position of the detail tab so hospital-switching doesn't jump to top
        const scrollEl = document.querySelector('.dashboard-main');
        const savedScrollTop = scrollEl ? scrollEl.scrollTop : 0;
        const wasDetailTabActive = document.getElementById('tab-detail')?.classList.contains('active');

        container.innerHTML = '';
        subChartInstances.forEach(c => c.destroy());
        subChartInstances = [];
        groupedData.forEach((group, groupIdx) => {
            let h = document.createElement('div');
            h.className = 'flex items-center gap-2 border-l-4 border-sky-500 pl-3 ' + (groupIdx === 0 ? 'mt-1 mb-3' : 'mt-6 mb-3');
            h.innerHTML = `<h3 class="text-sm font-extrabold text-slate-750">${group.title}</h3>`;
            container.appendChild(h);
            let g = document.createElement('div'); g.className = 'sub-charts-grid'; container.appendChild(g);
            group.items.forEach((item, idx) => {
                let card = document.createElement('div'); card.className = 'chart-card';
                card.innerHTML = `<h3>${item.label}</h3><div class="chart-wrapper"><canvas></canvas></div>`;
                g.appendChild(card);
                let color = group.type === 'income' ? '#10b981' : '#ef4444';
                card.onclick = () => openModalChart(item.label, yearsLabels, item.data, color);
                let chart = new Chart(card.querySelector('canvas').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: yearsLabels.map(l => 'ปี ' + l),
                        datasets: [{
                            data: item.data,
                            borderColor: color,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea || !chart.scales.x) return null;
                                const xPixel = chart.scales.x.getPixelForTick(2);
                                const stop = Math.max(0, Math.min(1, (xPixel - chart.chartArea.left) / chart.chartArea.width));
                                const gradient = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
                                gradient.addColorStop(stop, hexToRgba(color, 0.12));
                                gradient.addColorStop(stop, hexToRgba(color, 0.02));
                                return gradient;
                            },
                            fill: true,
                            tension: 0.3,
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [4, 4] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.4) : color
                            }
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { bodyFont: { size: 13 } }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                            x: { ticks: { font: { size: 11 } } }
                        }
                    }
                });
                subChartInstances.push(chart);
            });
        });

        // Restore scroll position after DOM has updated (only if detail tab was active or has saved position)
        if (savedScrollTop > 0 || wasDetailTabActive) {
            requestAnimationFrame(() => {
                if (scrollEl) scrollEl.scrollTop = savedScrollTop;
            });
        }
    }

    function openModalChart(title, labels, data, color) {
        document.getElementById('modal-chart-title').innerText = title;
        const toggleContainer = document.getElementById('modal-toggles');
        modal.classList.remove('hidden');
        if (window.modalChartInstance) window.modalChartInstance.destroy();

        // Determine if we are in performance mode (monthly data)
        const isPerformanceSource = labels.length === 14 && labels[0] === 'แผน';
        let currentViewType = isPerformanceSource ? 'performance' : 'trend';
        let currentPerfMode = 'cumulative';

        if (isPerformanceSource) {
            toggleContainer.style.display = 'flex';
            
            const typePerfBtn = document.getElementById('modal-type-performance');
            const modeCumulativeBtn = document.getElementById('modal-mode-cumulative');
            const typeTrendBtn = document.getElementById('modal-type-trend');
            const showPctBtn = document.getElementById('modal-show-percent');

            // Set initial states
            typePerfBtn.classList.add('active');
            modeCumulativeBtn.classList.remove('active');
            typeTrendBtn.classList.remove('active');
            showPctBtn.style.display = 'inline-block';

            const monthsOnly = labels.slice(1, 13);
            const planValue = data[0];
            window.currentPlanValue = planValue; 
            const monthlyData = data.slice(1, 13);
            
            // Find last index with data to prevent flat line at the end
            let lastDataIdx = -1;
            for (let i = monthlyData.length - 1; i >= 0; i--) {
                if (monthlyData[i] !== 0 && monthlyData[i] !== null && monthlyData[i] !== '') {
                    lastDataIdx = i;
                    break;
                }
            }
            const activeMonthlyData = lastDataIdx === -1 ? [] : monthlyData.slice(0, lastDataIdx + 1);

            const cumulativeData = activeMonthlyData.reduce((acc, val) => {
                acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + (val || 0));
                return acc;
            }, []);

            const updateModalChart = () => {
                if (window.modalChartInstance) window.modalChartInstance.destroy();
                
                typePerfBtn.classList.toggle('active', currentViewType === 'performance' && currentPerfMode === 'monthly');
                modeCumulativeBtn.classList.toggle('active', currentViewType === 'performance' && currentPerfMode === 'cumulative');
                typeTrendBtn.classList.toggle('active', currentViewType === 'trend');
                showPctBtn.classList.toggle('active', showPctModal);

                if (currentViewType === 'performance') {
                    const displayData = currentPerfMode === 'monthly' ? monthlyData : cumulativeData;
                    const datasets = [
                        {
                            label: currentPerfMode === 'monthly' ? 'ผลดำเนินงานรายเดือน' : 'ผลดำเนินงานสะสม',
                            data: displayData,
                            borderColor: color,
                            backgroundColor: hexToRgba(color, 0.15),
                            fill: true,
                            tension: 0.3,
                            pointRadius: 5,
                            borderWidth: 3
                        },
                        {
                            label: 'เป้าหมายแผนรวมปี',
                            data: Array(12).fill(planValue),
                            borderColor: '#94a3b8',
                            borderDash: [10, 5],
                            borderWidth: 2,
                            fill: false,
                            pointRadius: 0
                        }
                    ];

                    window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                        type: 'line',
                        data: { labels: monthsOnly, datasets: datasets },
                        plugins: [dataLabelPlugin],
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: true, position: 'top', labels: { font: { weight: '600' } } },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const val = ctx.parsed.y;
                                            if (ctx.datasetIndex === 1) return ` เป้าหมาย: ${val.toLocaleString('th-TH')} บาท`;
                                            const pct = planValue > 0 ? ` (${((val / planValue) * 100).toFixed(1)}%)` : '';
                                            return ` ${val.toLocaleString('th-TH')} บาท${pct}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'จำนวนเงิน' }, ticks: { font: { size: 12 } } }
                            }
                        }
                    });
                } else {
                    // TREND VIEW (Linear X-Axis for Realistic Proportions)
                    const hospitalObj = hospitalStore[activeHospitalIndex];
                    const trendData = hospitalObj.getReportSeries ? hospitalObj.getReportSeries(title) : hospitalObj.getSeries(title);
                    const years = hospitalObj.yearsLabels;
                    const annualPlan = trendData[3] || planValue;
                    const lastActual = trendData[2]; // Result of the year before current

                    // Helper to format X values: Year 0, 1, 2, 3(Plan), 4, 5
                    // Months of Year 3 (Current) will be at 2.083, 2.167 ... 3.0
                    
                    // Dataset 1: Historical Actuals
                    const historicalActuals = [
                        { x: 0, y: trendData[0] },
                        { x: 1, y: trendData[1] },
                        { x: 2, y: trendData[2] }
                    ];

                    // Dataset 2: Current Year Monthly Results (Accumulated)
                    const monthlyActuals = [
                        { x: 2, y: 0 }, // Start from 0 at the beginning of the year
                        ...cumulativeData.map((v, i) => ({
                            x: 2 + ((i + 1) / 12),
                            y: v
                        }))
                    ];

                    // Dataset 3: Target Plan Line (Connecting previous result to current plan and future)
                    const targetPlan = [
                        { x: 2, y: lastActual },
                        { x: 3, y: annualPlan },
                        { x: 4, y: trendData[4] },
                        { x: 5, y: trendData[5] }
                    ];

                    window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                        type: 'line',
                        data: {
                            datasets: [
                                {
                                    label: 'ผลดำเนินงานจริง (รายปี)',
                                    data: historicalActuals,
                                    borderColor: color,
                                    backgroundColor: hexToRgba(color, 0.1),
                                    fill: true,
                                    tension: 0.3,
                                    pointRadius: 6,
                                    pointBackgroundColor: color,
                                    borderWidth: 3
                                },
                                {
                                    label: 'ผลดำเนินงานจริง (รายเดือนปีปัจจุบัน)',
                                    data: monthlyActuals,
                                    borderColor: color,
                                    backgroundColor: hexToRgba(color, 0.1),
                                    fill: true,
                                    tension: 0.3,
                                    pointRadius: 3,
                                    pointBackgroundColor: '#fff',
                                    borderWidth: 2
                                },
                                {
                                    label: 'เป้าหมายตามแผน (Target)',
                                    data: targetPlan,
                                    borderColor: '#94a3b8',
                                    borderDash: [8, 4],
                                    borderWidth: 2,
                                    fill: false,
                                    pointRadius: 5,
                                    pointBackgroundColor: '#fff',
                                    tension: 0
                                }
                            ]
                        },
                        plugins: [dataLabelPlugin],
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: 'nearest', intersect: false },
                            plugins: {
                                legend: { display: true, position: 'top', labels: { font: { weight: '600' } } },
                                tooltip: {
                                    callbacks: {
                                        title: (items) => {
                                            const x = items[0].parsed.x;
                                            if (Number.isInteger(x)) return 'ปี ' + years[x];
                                            const monthIdx = Math.round((x - 2) * 12) - 1;
                                            if (monthIdx === -1) return 'เริ่มต้นปี ' + years[3];
                                            const monthNames = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
                                            return monthNames[monthIdx] + ' ' + years[3];
                                        },
                                        label: (ctx) => {
                                            const val = ctx.parsed.y;
                                            return ` ${ctx.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                                x: {
                                    type: 'linear',
                                    min: 0,
                                    max: 5,
                                    ticks: {
                                        stepSize: 1,
                                        callback: (value) => years[value] ? 'ปี ' + years[value] : ''
                                    },
                                    grid: {
                                        display: true,
                                        color: (ctx) => Number.isInteger(ctx.tick.value) ? '#cbd5e1' : 'transparent'
                                    }
                                }
                            }
                        }
                    });
                }
            };

            typePerfBtn.onclick = () => { currentViewType = 'performance'; currentPerfMode = 'monthly'; updateModalChart(); };
            modeCumulativeBtn.onclick = () => { currentViewType = 'performance'; currentPerfMode = 'cumulative'; updateModalChart(); };
            typeTrendBtn.onclick = () => { currentViewType = 'trend'; updateModalChart(); };
            showPctBtn.onclick = () => { showPctModal = !showPctModal; updateModalChart(); };

            updateModalChart();
        } else {
            toggleContainer.style.display = 'none';
            window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels.map(l => 'ปี ' + l),
                    datasets: [{
                        label: 'มูลค่า',
                        data: data,
                        borderColor: color,
                        backgroundColor: (context) => {
                            const { chart } = context;
                            if (!chart.chartArea || !chart.scales.x) return null;
                            const xPixel = chart.scales.x.getPixelForTick(2);
                            const stop = Math.max(0, Math.min(1, (xPixel - chart.chartArea.left) / chart.chartArea.width));
                            const gradient = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
                            gradient.addColorStop(stop, hexToRgba(color, 0.15));
                            gradient.addColorStop(stop, hexToRgba(color, 0.03));
                            return gradient;
                        },
                        fill: true,
                        tension: 0.3,
                        pointRadius: 6,
                        segment: {
                            borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                            borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.5) : color
                        }
                    }]
                },
                plugins: [dataLabelPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 14 } } },
                    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                }
            });
        }
    }

    // --- Compare Tab ---
    function renderCompareTab() {
        const selector = document.getElementById('compare-selector');
        const tableContainer = document.getElementById('compare-table-container');
        const compareColors = ['#0ca6e9', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#d946ef', '#eab308', '#14b8a6'];

        // Build hospital buttons (Pill style)
        selector.innerHTML = '';
        hospitalStore.forEach((h, i) => {
            const shortName = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim() || h.name;
            const color = compareColors[i % compareColors.length];
            
            const btn = document.createElement('div');
            const isSelected = !h._compareDisabled;
            btn.className = 'compare-check-item' + (isSelected ? ' selected' : '');
            if (isSelected) btn.style.backgroundColor = color;
            
            btn.innerHTML = `${shortName}`;
            
            btn.addEventListener('click', () => {
                h._compareDisabled = !h._compareDisabled;
                btn.classList.toggle('selected', !h._compareDisabled);
                btn.style.backgroundColor = h._compareDisabled ? '' : color;
                updateMainCompareView();
            });

            // Hover Animation Effect (Using Index for 100% accuracy)
            let hoverInterval = null;
            btn.addEventListener('mouseenter', () => {
                if (!compareMainChartInstance) return;
                // Find dataset that belongs to this hospital's original index
                const dsIdx = compareMainChartInstance.data.datasets.findIndex(ds => ds.hospitalIdx === i);
                if (dsIdx !== -1) {
                    const ds = compareMainChartInstance.data.datasets[dsIdx];
                    ds._originalWidth = ds.borderWidth || 3;
                    ds._originalSegment = ds.segment;
                    ds.segment = null; // Disable segmentation during hover to dash the whole line
                    ds.borderWidth = 8; // Thicker
                    ds.borderDash = [10, 5]; 
                    
                    let offset = 0;
                    hoverInterval = setInterval(() => {
                        offset = (offset + 1) % 30;
                        ds.borderDashOffset = -offset;
                        compareMainChartInstance.update('none');
                    }, 30);
                }
            });

            btn.addEventListener('mouseleave', () => {
                if (hoverInterval) clearInterval(hoverInterval);
                if (!compareMainChartInstance) return;
                
                const dsIdx = compareMainChartInstance.data.datasets.findIndex(ds => ds.hospitalIdx === i);
                if (dsIdx !== -1) {
                    const ds = compareMainChartInstance.data.datasets[dsIdx];
                    ds.borderWidth = ds._originalWidth || 3;
                    ds.segment = ds._originalSegment;
                    ds.borderDash = [];
                    ds.borderDashOffset = 0;
                    compareMainChartInstance.update('none');
                }
            });
            selector.appendChild(btn);
        });

        function getSelectedIndices() {
            return hospitalStore.map((h, i) => h._compareDisabled ? -1 : i).filter(idx => idx !== -1);
        }

        function getShortName(h) {
            const n = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim();
            return n.length > 20 ? n.substring(0, 20) + '...' : n;
        }



        function updateMainCompareView() {
            const keyword = selectedCompareItem;
            if (compareMainChartInstance) { compareMainChartInstance.destroy(); compareMainChartInstance = null; }
            if (!keyword) return;

            const selectedIdx = getSelectedIndices();
            const selectedHospitals = selectedIdx.map(i => hospitalStore[i]).filter(h => h.tIncomes);
            if (selectedHospitals.length === 0) {
                tableContainer.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem">เลือกอย่างน้อย 1 โรงพยาบาลเพื่อเปรียบเทียบ</p>';
                return;
            }

            const titleEl = document.getElementById('compare-dynamic-title');
            if (titleEl) titleEl.textContent = keyword;

            // Sync toggle buttons state
            const valBtn = document.getElementById('toggle-compare-values');
            const growthBtn = document.getElementById('toggle-compare-growth');
            if (valBtn) valBtn.checked = showCompareValues;
            if (growthBtn) growthBtn.checked = showCompareGrowth;

            const ctx = document.getElementById('compare-main-chart').getContext('2d');
            const planIdx = 3;
            const years = selectedHospitals[0].yearsLabels || ['2566','2567','2568','2569','2570','2571'];

            // Handle special overview charts
            if (keyword === '📊 รายรับ-รายจ่าย (ปีแผน)') {
                compareMainChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: selectedHospitals.map(h => getShortName(h)),
                        datasets: [
                            { label: 'รายรับ', data: selectedHospitals.map(h => h.tIncomes[planIdx]), backgroundColor: '#10b981', hospitalIdx: -1 },
                            { label: 'รายจ่าย', data: selectedHospitals.map(h => h.tExpenses[planIdx]), backgroundColor: '#ef4444', hospitalIdx: -1 },
                            { label: 'คงเหลือสุทธิ', data: selectedHospitals.map(h => h.netSeries ? h.netSeries[planIdx] : 0), backgroundColor: '#3b82f6', hospitalIdx: -1 }
                        ]
                    },
                    plugins: [dataLabelPlugin],
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH')} บาท` } } }, scales: { y: { beginAtZero: true } } }
                });
            } else if (keyword === '🥧 สัดส่วนรายได้รายหมวด') {
                const categories = [
                    { label: 'UC', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน"] },
                    { label: 'เบิกจ่ายตรง/รัฐ', items: ["รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท."] },
                    { label: 'ประกันสังคม', items: ["รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม"] },
                    { label: 'แรงงานต่างด้าว', items: ["รายรับค่ารักษาพยาบาลแรงงานต่างด้าว"] },
                    { label: 'อื่นๆ/บริการ', items: ["รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
                    { label: 'รายรับอื่น', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] }
                ];
                const chartColors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

                compareMainChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: selectedHospitals.map(h => getShortName(h)),
                        datasets: categories.map((cat, i) => ({
                            label: cat.label,
                            data: selectedHospitals.map(h => {
                                let sum = 0;
                                cat.items.forEach(item => {
                                    const s = h.getSeries ? h.getSeries(item) : [0,0,0,0,0,0];
                                    sum += (s[planIdx] || 0);
                                });
                                return sum;
                            }),
                            backgroundColor: chartColors[i % chartColors.length],
                            hospitalIdx: -1
                        }))
                    },
                    plugins: [dataLabelPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top', labels: { boxWidth: 12, padding: 15 } },
                            tooltip: { 
                                mode: 'index', 
                                intersect: false,
                                callbacks: {
                                    label: (ctx) => {
                                        const datasetLabel = ctx.dataset.label;
                                        const value = ctx.parsed.y;
                                        const total = ctx.chart.data.datasets.reduce((sum, ds) => sum + ds.data[ctx.dataIndex], 0);
                                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                        return ` ${datasetLabel}: ${value.toLocaleString('th-TH')} บาท (${pct}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true },
                            y: { stacked: true, beginAtZero: true, ticks: { callback: v => (v >= 1000000 ? (v/1000000).toFixed(0) + 'M' : v.toLocaleString('th-TH')) } }
                        }
                    }
                });
            } else if (keyword === '📈 เงินคงเหลือสุทธิ (6 ปี)') {
                compareMainChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: { labels: years.map(y => 'ปี ' + y), datasets: selectedHospitals.map((h, idx) => {
                        const color = compareColors[selectedIdx[idx] % compareColors.length];
                        return { 
                            label: getShortName(h), 
                            hospitalIdx: selectedIdx[idx],
                            data: h.netSeries || [0,0,0,0,0,0], 
                            borderColor: color, 
                            backgroundColor: 'transparent', borderWidth: 3, tension: 0.3, pointRadius: 5,
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.7) : color
                            }
                        };
                    }) },
                    plugins: [dataLabelPlugin],
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH')} บาท` } } }, scales: { y: { grid: { color: '#f1f5f9' } } } }
                });
            } else {
                // Item-level trend line chart
                compareMainChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: { 
                        labels: years.map(y => 'ปี ' + y), 
                        datasets: selectedHospitals.map((h, idx) => {
                            const color = compareColors[selectedIdx[idx] % compareColors.length];
                            return { 
                                label: getShortName(h), 
                                hospitalIdx: selectedIdx[idx],
                                data: h.getSeries(keyword), 
                                borderColor: color, 
                                backgroundColor: 'transparent', 
                                borderWidth: 3, tension: 0.3, pointRadius: 5, 
                                pointBackgroundColor: color,
                                segment: {
                                    borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                                    borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.7) : color
                                }
                            };
                        }) 
                    },
                    plugins: [dataLabelPlugin],
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท` } }
                        },
                        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                    }
                });
            }

            // Table removed as per user request
        }

        window._updateItemChart = updateMainCompareView;
        window._updateCompareCharts = updateMainCompareView;

        // Toggles Listeners
        const valBtn = document.getElementById('toggle-compare-values');
        const growthBtn = document.getElementById('toggle-compare-growth');

        if (valBtn) {
            valBtn.onchange = (e) => {
                showCompareValues = e.target.checked;
                if (compareMainChartInstance) compareMainChartInstance.update('none');
            };
        }
        if (growthBtn) {
            growthBtn.onchange = (e) => {
                showCompareGrowth = e.target.checked;
                if (compareMainChartInstance) compareMainChartInstance.update('none');
            };
        }

        updateMainCompareView();
    }

});
