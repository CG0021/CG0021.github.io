// ==========================================================
// ส่วนจัดการแสดงผลหน้าจอ (User Interface & Renderers)
// ==========================================================

// Controller: Main Tab Switcher
function switchMainTab(tabId) {
    currentMainTab = tabId;

    // Toggle Layout Mode: Upload Mode vs Workspace Mode
    const uploadEl = document.getElementById('uploadSection');
    const dashEl = document.getElementById('dashboardSection');
    const tabsMenuEl = document.getElementById('tabsMenu');
    const btnNewUploadEl = document.getElementById('btnNewUpload');

    if (typeof monthlyResults !== 'undefined' && monthlyResults.length > 0) {
        if (uploadEl) uploadEl.classList.add('hidden');
        if (dashEl) dashEl.classList.remove('hidden');
        if (tabsMenuEl) tabsMenuEl.classList.remove('hidden');
        if (btnNewUploadEl) btnNewUploadEl.classList.remove('hidden');
    } else {
        if (uploadEl) uploadEl.classList.remove('hidden');
        if (dashEl) dashEl.classList.add('hidden');
        if (tabsMenuEl) tabsMenuEl.classList.add('hidden');
        if (btnNewUploadEl) btnNewUploadEl.classList.add('hidden');
    }

    // Update main buttons classes
    const tabButtons = document.querySelectorAll('#tabsMenu button');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.className = 'tab-active px-3.5 text-sm md:text-base transition-colors focus:outline-none flex items-center gap-2 rounded-t-lg h-full';
        } else {
            btn.className = 'tab-inactive px-3.5 text-sm md:text-base transition-colors focus:outline-none flex items-center gap-2 rounded-t-lg h-full';
        }
    });

    // Toggle Main Containers
    const containers = ['dashboard', 'workingCapital', 'reports', 'analysis', 'import'];
    containers.forEach(c => {
        const el = document.getElementById(`tabView_${c}`);
        if (el) {
            if (c === tabId || (c === 'workingCapital' && tabId === 'working_capital') || (c === 'analysis' && tabId === 'analysis')) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    // Sidebar Visibility: Visible on all tabs when data is loaded
    const mainSidebar = document.getElementById('mainSidebar');
    if (mainSidebar) {
        if (typeof monthlyResults !== 'undefined' && monthlyResults.length > 0) {
            mainSidebar.classList.remove('hidden');
            renderUnifiedSidebar(tabId);
        } else {
            mainSidebar.classList.add('hidden');
        }
    }

    // Trigger specific views rendering
    if (tabId === 'dashboard') {
        renderDashboardSubViews();
    } else if (tabId === 'working_capital') {
        renderWorkingCapitalSubViews();
    } else if (tabId === 'reports') {
        renderReportsSubViews();
    } else if (tabId === 'analysis') {
        if (typeof renderAnalysisSubViews === 'function') {
            renderAnalysisSubViews();
        } else if (typeof renderAnalysisTab === 'function') {
            renderAnalysisTab();
        }
    } else if (tabId === 'import') {
        renderImportSubViews();
    }
}

// Dynamic Left Sidebar Renderer (Unifies all sub-menu navigations)
function renderUnifiedSidebar(tabId) {
    const sidebarHeader = document.getElementById('sidebarHeader');
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (!sidebarHeader || !sidebarMenu) return;

    if (tabId === 'dashboard') {
        // 1. Render Dashboard Header
        sidebarHeader.innerHTML = `
            <h2 class="text-sm font-bold text-slate-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                เมนูแดชบอร์ด
            </h2>
        `;

        // 2. Render Dashboard Menu Buttons
        const subtabs = [
            { id: 'financial_health', name: 'สุขภาพทางการเงิน', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />' },
            { id: 'alerts', name: 'แจ้งเตือนวิกฤต (Alerts)', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' }
        ];

        sidebarMenu.innerHTML = '';
        subtabs.forEach(sub => {
            const btn = document.createElement('button');
            const isActive = currentSubTab === sub.id;

            btn.className = isActive
                ? 'bg-sky-50 border-l-4 border-sky-600 text-sky-800 font-bold shadow-sm p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-all'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-colors';

            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${sub.icon}
                </svg>
                <span>${sub.name}</span>
            `;

            btn.addEventListener('click', () => {
                currentSubTab = sub.id;
                renderDashboardSubViews();
                renderUnifiedSidebar('dashboard'); // re-render sidebar active state
            });

            sidebarMenu.appendChild(btn);
        });

    } else if (tabId === 'working_capital') {
        // 1. Render Working Capital Category Dropdown
        sidebarHeader.innerHTML = `
            <div class="flex flex-col gap-1.5 w-full">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่เงินหมุนเวียน</label>
                <select id="wcCategorySelect" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer shadow-sm custom-select-lg">
                    <option value="ar">ลูกหนี้การค้า (AR)</option>
                    <option value="ap">เจ้าหนี้การค้า (AP)</option>
                    <option value="pr">ค่าบุคลากรค้างจ่าย (PR)</option>
                    <option value="inv">สินค้าคงคลัง (INV)</option>
                    <option value="overdue_ar">ลูกหนี้ค้างนาน</option>
                    <option value="deadstock">สินค้าค้างสต็อก</option>
                </select>
            </div>
        `;

        const wcCategorySelect = document.getElementById('wcCategorySelect');
        if (wcCategorySelect) {
            wcCategorySelect.value = currentWCSubTab;
            wcCategorySelect.addEventListener('change', (e) => {
                currentWCSubTab = e.target.value;
                renderWorkingCapitalSubViews();
                renderUnifiedSidebar('working_capital'); // update accordion below
            });
            convertToCustomDropdown(wcCategorySelect);
        }

        // 2. Render Accordion in sidebarMenu
        if (monthlyResults.length > 0) {
            const latestMonth = monthlyResults[monthlyResults.length - 1];
            renderSidebar(latestMonth); // use original renderSidebar code
        }

    } else if (tabId === 'reports') {
        // 1. Render Reports Header
        sidebarHeader.innerHTML = `
            <h2 class="text-sm font-bold text-slate-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                เมนูรายงานการเงิน
            </h2>
        `;

        // 2. Render Reports Menu Buttons
        const subtabs = [
            { id: 'trial_balance', name: 'งบทดลอง', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />' },
            { id: 'management_report', name: 'งบบริหาร', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />' }
        ];

        sidebarMenu.innerHTML = '';
        subtabs.forEach(sub => {
            const btn = document.createElement('button');
            const isActive = currentReportSubTab === sub.id;

            btn.className = isActive
                ? 'bg-sky-50 border-l-4 border-sky-600 text-sky-800 font-bold shadow-sm p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-all'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-colors';

            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${sub.icon}
                </svg>
                <span>${sub.name}</span>
            `;

            btn.addEventListener('click', () => {
                currentReportSubTab = sub.id;
                renderReportsSubViews();
                renderUnifiedSidebar('reports');
            });

            sidebarMenu.appendChild(btn);
        });

    } else if (tabId === 'import') {
        // 1. Render Import Header
        sidebarHeader.innerHTML = `
            <h2 class="text-sm font-bold text-slate-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                เมนูนำเข้าข้อมูล
            </h2>
        `;

        // 2. Render Import Menu Buttons
        const subtabs = [
            { id: 'upload', name: 'ประวัติการอัปโหลดไฟล์', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />' },
            { id: 'mapping', name: 'การตั้งค่าผูกผังบัญชี', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />' }
        ];

        sidebarMenu.innerHTML = '';
        subtabs.forEach(sub => {
            const btn = document.createElement('button');
            const isActive = currentImportSubTab === sub.id;

            btn.className = isActive
                ? 'bg-sky-50 border-l-4 border-sky-600 text-sky-800 font-bold shadow-sm p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-all'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-colors';

            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${sub.icon}
                </svg>
                <span>${sub.name}</span>
            `;

            btn.addEventListener('click', () => {
                currentImportSubTab = sub.id;
                renderImportSubViews();
                renderUnifiedSidebar('import');
            });

            sidebarMenu.appendChild(btn);
        });
    } else if (tabId === 'analysis') {
        sidebarHeader.innerHTML = `
            <h2 class="text-sm font-bold text-slate-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                เมนูวิเคราะห์ข้อมูล
            </h2>
        `;
        const subtabs = [
            { id: 'financial_distress', name: 'วิกฤติทางการเงิน 7 ระดับ', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' },
            { id: 'compare_metrics', name: 'วิเคราะห์เปรียบเทียบตัวชี้วัด', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />' },
            { id: 'waterfall_pnl', name: 'งบกำไรขาดทุนแบบขั้นบันได', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M7 17v-4m4 4v-7m4 7v-10m4 10V5" />' },
            { id: 'treatment_cost', name: 'ต้นทุนค่ารักษา', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' }
        ];

        sidebarMenu.innerHTML = '';
        subtabs.forEach(sub => {
            const btn = document.createElement('button');
            const isActive = currentAnalysisSubTab === sub.id;

            btn.className = isActive
                ? 'bg-sky-50 border-l-4 border-sky-600 text-sky-800 font-bold shadow-sm p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-all'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent p-3 rounded-r-lg w-full text-left text-sm flex items-center gap-3 transition-colors';

            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${sub.icon}
                </svg>
                <span>${sub.name}</span>
            `;

            btn.addEventListener('click', () => {
                currentAnalysisSubTab = sub.id;
                if (typeof renderAnalysisSubViews === 'function') {
                    renderAnalysisSubViews();
                }
                renderUnifiedSidebar('analysis');
            });

            sidebarMenu.appendChild(btn);
        });
    }
}

// Note: renderDashboardSubViews() has been refactored and moved to js/ui_dashboard.js

// Sub-Tab Switcher: Working Capital
function updateChartMetricSelectOptions() {
    const chartMetricSelect = document.getElementById('chartMetricSelect');
    if (!chartMetricSelect) return;

    const prevVal = chartMetricSelect.value;

    let html = '';
    if (currentWCSubTab === 'overdue_ar') {
        html = `
            <option value="overdue_1m">ลูกหนี้ค้างนาน 1 เดือน</option>
            <option value="overdue_3m">ลูกหนี้ค้างนาน 3 เดือน</option>
            <option value="overdue_6m">ลูกหนี้ค้างนาน 6 เดือน</option>
            <option value="overdue_1y" selected>ลูกหนี้ค้างนาน 1 ปี</option>
            <option value="overdue_2y">ลูกหนี้ค้างนาน 2 ปี</option>
            <option value="overdue_3y">ลูกหนี้ค้างนาน 3 ปี</option>
        `;
    } else if (currentWCSubTab === 'deadstock') {
        html = `
            <option value="overdue_1m">ยอด Deadstock 1 เดือน</option>
            <option value="overdue_3m">ยอด Deadstock 3 เดือน</option>
            <option value="overdue_6m">ยอด Deadstock 6 เดือน</option>
            <option value="overdue_1y" selected>ยอด Deadstock 1 ปี</option>
            <option value="overdue_2y">ยอด Deadstock 2 ปี</option>
            <option value="overdue_3y">ยอด Deadstock 3 ปี</option>
        `;
    } else {
        html = `
            <option value="collection_days" selected>ระยะเวลา (วัน)</option>
            <option value="turnover_ratio">อัตราหมุนเวียน (รอบ)</option>
            <option value="rev_uc">รายได้/รายจ่าย/ต้นทุน/ค่าบุคลากร</option>
            <option value="avg_ar">ยอดเฉลี่ย</option>
            <option value="ar_uc_start">ยอดยกมา (ต้นงวด)</option>
            <option value="ar_uc_end">ยอดยกไป (ปลายงวด)</option>
        `;
    }
    chartMetricSelect.innerHTML = html;

    if (Array.from(chartMetricSelect.options).some(opt => opt.value === prevVal)) {
        chartMetricSelect.value = prevVal;
    } else {
        if (currentWCSubTab === 'overdue_ar' || currentWCSubTab === 'deadstock') {
            chartMetricSelect.value = 'overdue_1y';
        } else {
            chartMetricSelect.value = 'collection_days';
        }
    }

    if (typeof convertToCustomDropdown === 'function') {
        convertToCustomDropdown(chartMetricSelect);
    }
}

// Sub-Tab Switcher: Working Capital
// Sub-Tab Switcher: Working Capital
function renderWorkingCapitalSubViews() {
    const buttons = document.querySelectorAll('#tabView_workingCapital [data-wcsubtab]');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-wcsubtab') === currentWCSubTab) {
            btn.className = 'wc-subtab-active px-4 py-2 text-sm font-semibold border-b-2 border-sky-600 text-sky-700 focus:outline-none';
        } else {
            btn.className = 'wc-subtab-inactive px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent focus:outline-none';
        }
    });

    // Update active globals for legacy calculations
    currentTab = currentWCSubTab;

    // Reset active metrics when changing subtabs
    window.activeWCMetrics = [];

    // Update chart metric options dynamically
    updateChartMetricSelectOptions();

    if (monthlyResults.length > 0) {
        const latestEndIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;
        const latestMonth = monthlyResults[latestEndIdx];
        renderSidebar(latestMonth);
        renderDashboard();
        renderWorkingCapitalExtraSection(latestMonth);
    }
}

// Function to toggle Working Capital metric and re-render
function toggleWCMetric(metric) {
    if (!window.activeWCMetrics) {
        window.activeWCMetrics = [];
    }

    if (window.activeWCMetrics.length === 0) {
        const chartMetricSelect = document.getElementById('chartMetricSelect');
        const defaultMetric = chartMetricSelect ? chartMetricSelect.value : 'collection_days';
        window.activeWCMetrics.push(defaultMetric);
    }

    const index = window.activeWCMetrics.indexOf(metric);
    if (index > -1) {
        // Keep at least one metric active
        if (window.activeWCMetrics.length > 1) {
            window.activeWCMetrics.splice(index, 1);
        }
    } else {
        window.activeWCMetrics.push(metric);
    }

    // Re-render dashboard charts
    renderDashboard();

    // Re-render extra section to update borders
    if (monthlyResults.length > 0) {
        const latestEndIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;
        const latestMonth = monthlyResults[latestEndIdx];
        renderWorkingCapitalExtraSection(latestMonth);
    }
}

// Renderer: Working Capital Quality/Aging Extra Section
function renderWorkingCapitalExtraSection(latestMonth) {
    if (!latestMonth) return;
    const extraSection = document.getElementById('workingCapitalExtraSection');
    const extraTitle = document.getElementById('wcExtraTitle');
    if (extraSection && extraTitle) {
        extraSection.classList.remove('hidden');

        const gridContainer = extraSection.querySelector('.grid');

        if (currentWCSubTab === 'overdue_ar' || currentWCSubTab === 'deadstock') {
            const isAR = currentWCSubTab === 'overdue_ar';
            extraTitle.textContent = isAR
                ? "สรุปยอดลูกหนี้ค้างชำระนาน (Overdue AR Summary)"
                : "สรุปยอดสินค้าค้างสต็อก (Deadstock INV Summary)";

            const badge = extraSection.querySelector('span');
            if (badge) {
                badge.textContent = "คำนวณจริง";
                badge.className = "px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100";
            }

            const res = isAR
                ? latestMonth.overdueARResult?.[currentFund]?.[currentSubgroup]
                : latestMonth.deadstockResult?.[currentFundINV]?.[currentSubgroupINV];

            if (res && gridContainer) {
                const formatVal = (val) => {
                    if (val === null || val === undefined) return 'N/A';
                    const formatted = formatAbbreviated(val);
                    return formatted === 'N/A' ? 'N/A' : formatted + ' บาท';
                };

                const subTabCards = [
                    { key: "current_balance", label: isAR ? "ยอดลูกหนี้คงเหลือ" : "ยอดสินค้าคงคลัง", val: formatVal(res.current_balance), color: "text-slate-700" },
                    { key: "overdue_1m", label: isAR ? "ค้างนาน 1 เดือน" : "Deadstock 1 ด.", val: formatVal(res.overdue_1m), color: "text-rose-500" },
                    { key: "overdue_3m", label: isAR ? "ค้างนาน 3 เดือน" : "Deadstock 3 ด.", val: formatVal(res.overdue_3m), color: "text-rose-600" },
                    { key: "overdue_6m", label: isAR ? "ค้างนาน 6 เดือน" : "Deadstock 6 ด.", val: formatVal(res.overdue_6m), color: "text-rose-700" },
                    { key: "overdue_1y", label: isAR ? "ค้างนาน 1 ปี" : "Deadstock 1 ปี", val: formatVal(res.overdue_1y), color: "text-red-600" },
                    { key: "overdue_2y", label: isAR ? "ค้างนาน 2 ปี" : "Deadstock 2 ปี", val: formatVal(res.overdue_2y), color: "text-red-700" },
                    { key: "overdue_3y", label: isAR ? "ค้างนาน 3 ปี" : "Deadstock 3 ปี", val: formatVal(res.overdue_3y), color: "text-red-800" }
                ];

                gridContainer.className = "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center";
                gridContainer.innerHTML = subTabCards.map(c => {
                    const chartMetricSelect = document.getElementById('chartMetricSelect');
                    const defaultMetric = chartMetricSelect ? chartMetricSelect.value : 'overdue_1y';
                    const isActive = window.activeWCMetrics && window.activeWCMetrics.length > 0
                        ? window.activeWCMetrics.includes(c.key)
                        : (c.key === defaultMetric);
                    const borderClass = isActive 
                        ? "border-2 border-sky-500 bg-sky-50/40 shadow-md scale-[1.02]" 
                        : "border border-slate-200 bg-slate-50/60 shadow-sm hover:bg-slate-100/80 hover:border-slate-300";
                    return `
                        <div class="p-3 rounded-xl cursor-pointer transition-all select-none wc-card ${borderClass}" data-metric="${c.key}">
                            <div class="text-xs font-bold text-slate-500 mb-1 flex items-center justify-center gap-1">
                                ${c.label}
                                ${isActive ? '<span class="w-2 h-2 rounded-full bg-sky-500"></span>' : ''}
                            </div>
                            <div class="text-base font-black ${c.color}">${c.val}</div>
                        </div>
                    `;
                }).join('');

                gridContainer.querySelectorAll('.wc-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const metric = card.getAttribute('data-metric');
                        if (metric) toggleWCMetric(metric);
                    });
                });
            }
        } else {
            if (gridContainer) {
                gridContainer.className = "grid grid-cols-5 gap-4 text-center";
            }

            let res = null;
            if (currentWCSubTab === 'ar') {
                res = latestMonth.result[currentFund]?.[currentSubgroup];
            } else if (currentWCSubTab === 'ap') {
                res = latestMonth.apResult[currentFundAP]?.[currentSubgroupAP];
            } else if (currentWCSubTab === 'pr') {
                res = latestMonth.prResult[currentFundPR]?.[currentSubgroupPR];
            } else if (currentWCSubTab === 'inv') {
                res = latestMonth.invResult[currentFundINV]?.[currentSubgroupINV];
            }

            let cards = [];
            if (currentWCSubTab === 'ar' || currentWCSubTab === 'inv' || currentWCSubTab === 'ap' || currentWCSubTab === 'pr') {
                const isAR = currentWCSubTab === 'ar';
                const isAP = currentWCSubTab === 'ap';
                const isPR = currentWCSubTab === 'pr';
                extraTitle.textContent = isAR
                    ? "วิเคราะห์คุณภาพลูกหนี้และหนี้ค้างชำระโดยประมาณ (AR Quality & Estimated Inactive AR)"
                    : (isAP ? "แผนสรุปการครบกำหนดชำระเจ้าหนี้การค้า (AP Payment Plan)"
                            : (isPR ? "รายงานค่าตอบแทนและค่าบุคลากรค้างจ่ายสะสม (PR Accruals Summary)"
                                    : "วิเคราะห์คุณภาพคลังสินค้าและสินค้าคงคลังจมทุนโดยประมาณ (INV Quality & Estimated Excess Inventory)"));

                const badge = extraSection.querySelector('span');
                if (badge) {
                    badge.textContent = (isAP || isPR) ? "คำนวณจริง (เกณฑ์ 60 วัน / 1 ปี)" : "คำนวณจริง (เกณฑ์ 60 วัน)";
                    badge.className = "px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100";
                }

                const formatVal = (val) => {
                    if (val === null || val === undefined) return 'N/A';
                    const formatted = formatAbbreviated(val);
                    return formatted === 'N/A' ? 'N/A' : formatted + ' บาท';
                };
                const formatDays = (val) => val !== null && val !== undefined ? Math.round(val) + ' วัน' : 'N/A';

                if (res) {
                    let should_be_val = (isAP || isPR)
                        ? (res.rev_uc && res.days_in_period ? (res.rev_uc / res.days_in_period) * 60 : 0)
                        : res.should_be_ar;
                    
                    let overdue_1y_val = 0;
                    let overdue_60d_val = 0;
                    let overdue_120d_val = 0;
                    if (isAP) {
                        const ovResult = latestMonth.overdueAPResult?.[currentFundAP]?.[currentSubgroupAP];
                        overdue_1y_val = ovResult ? ovResult.overdue_1y : 0;
                    } else if (isPR) {
                        const ovResult = latestMonth.overduePRResult?.[currentFundPR]?.[currentSubgroupPR];
                        overdue_60d_val = ovResult ? ovResult.overdue_60d : 0;
                        overdue_120d_val = ovResult ? ovResult.overdue_120d : 0;
                        overdue_1y_val = ovResult ? ovResult.overdue_1y : 0;
                    }

                    if (isPR) {
                        cards = [
                            { key: "collection_days", label: "ระยะเวลาค้างจ่ายจริง", val: formatDays(res.collection_days), color: res.collection_days > 60 ? "text-amber-600" : "text-emerald-600" },
                            { key: "overdue_60d", label: "ค้างจ่ายเกิน 60 วัน", val: formatVal(overdue_60d_val), color: "text-orange-500" },
                            { key: "overdue_120d", label: "ค้างจ่ายเกิน 120 วัน", val: formatVal(overdue_120d_val), color: "text-rose-600" },
                            { key: "overdue_1y", label: "ค้างจ่ายเกิน 1 ปี", val: formatVal(overdue_1y_val), color: "text-red-700" }
                        ];
                    } else {
                        cards = [
                            { key: "ar_uc_end", label: isAR ? "ยอดลูกหนี้ปลายงวด" : (isAP ? "ยอดเจ้าหนี้ปลายงวด" : "ยอดสินค้าคงคลังปลายงวด"), val: formatVal(res.ar_uc_end), color: "text-slate-700" },
                            { key: "avg_ar", label: isAR ? "ลูกหนี้เฉลี่ยจริง" : (isAP ? "เจ้าหนี้เฉลี่ยจริง" : "สินค้าคงคลังเฉลี่ยจริง"), val: formatVal(res.avg_ar), color: "text-slate-700" },
                            { key: "collection_days", label: isAR ? "ระยะเวลาเก็บหนี้จริง" : (isAP ? "ระยะเวลาจ่ายหนี้จริง" : "ระยะเวลาขายคลังจริง"), val: formatDays(res.collection_days), color: res.collection_days > 60 ? "text-amber-600" : "text-emerald-600" },
                            { key: "should_be_ar", label: isAR ? "ลูกหนี้ที่ควรจะเป็น (60 วัน)" : (isAP ? "เจ้าหนี้ที่ควรจะเป็น (60 วัน)" : "สินค้าคงคลังที่ควรจะเป็น (60 วัน)"), val: formatVal(should_be_val), color: "text-indigo-600" },
                            { key: "inactive_ar", label: isAR ? "หนี้ไม่เคลื่อนไหวโดยประมาณ" : (isAP ? "หนี้ค้างชำระเกินเกณฑ์ 1 ปี โดยประมาณ" : "สินค้าจมทุนโดยประมาณ"), val: formatVal(isAP ? overdue_1y_val : res.inactive_ar), color: "text-rose-600" }
                        ];
                    }
                } else {
                    if (isPR) {
                        cards = [
                            { key: "collection_days", label: "ระยะเวลาค้างจ่ายจริง", val: "N/A", color: "text-slate-400" },
                            { key: "overdue_60d", label: "ค้างจ่ายเกิน 60 วัน", val: "N/A", color: "text-slate-400" },
                            { key: "overdue_120d", label: "ค้างจ่ายเกิน 120 วัน", val: "N/A", color: "text-slate-400" },
                            { key: "overdue_1y", label: "ค้างจ่ายเกิน 1 ปี", val: "N/A", color: "text-slate-400" }
                        ];
                    } else {
                        cards = [
                            { key: "ar_uc_end", label: isAR ? "ยอดลูกหนี้ปลายงวด" : (isAP ? "ยอดเจ้าหนี้ปลายงวด" : "ยอดสินค้าคงคลังปลายงวด"), val: "N/A", color: "text-slate-400" },
                            { key: "avg_ar", label: isAR ? "ลูกหนี้เฉลี่ยจริง" : (isAP ? "เจ้าหนี้เฉลี่ยจริง" : "สินค้าคงคลังเฉลี่ยจริง"), val: "N/A", color: "text-slate-400" },
                            { key: "collection_days", label: isAR ? "ระยะเวลาเก็บหนี้จริง" : (isAP ? "ระยะเวลาจ่ายหนี้จริง" : "ระยะเวลาขายคลังจริง"), val: "N/A", color: "text-slate-400" },
                            { key: "should_be_ar", label: isAR ? "ลูกหนี้ที่ควรจะเป็น (60 วัน)" : (isAP ? "เจ้าหนี้ที่ควรจะเป็น (60 วัน)" : "สินค้าคงคลังที่ควรจะเป็น (60 วัน)"), val: "N/A", color: "text-slate-400" },
                            { key: "inactive_ar", label: isAR ? "หนี้ไม่เคลื่อนไหวโดยประมาณ" : (isAP ? "หนี้ค้างชำระเกินเกณฑ์ 1 ปี โดยประมาณ" : "สินค้าจมทุนโดยประมาณ"), val: "N/A", color: "text-slate-400" }
                        ];
                    }
                }
            } else {
                const badge = extraSection.querySelector('span');
                if (badge) {
                    badge.textContent = "ข้อมูลจำลอง XX";
                    badge.className = "px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100";
                }
            }

            if (gridContainer) {
                if (currentWCSubTab === 'pr') {
                    gridContainer.className = "grid grid-cols-2 sm:grid-cols-4 gap-4 text-center";
                } else {
                    gridContainer.className = "grid grid-cols-5 gap-4 text-center";
                }
                gridContainer.innerHTML = cards.map(c => {
                    const chartMetricSelect = document.getElementById('chartMetricSelect');
                    const defaultMetric = chartMetricSelect ? chartMetricSelect.value : 'collection_days';
                    const isActive = window.activeWCMetrics && window.activeWCMetrics.length > 0
                        ? window.activeWCMetrics.includes(c.key)
                        : (c.key === defaultMetric);
                    const borderClass = isActive 
                        ? "border-2 border-sky-500 bg-sky-50/40 shadow-md scale-[1.02]" 
                        : "border border-slate-200 bg-slate-50/60 shadow-sm hover:bg-slate-100/80 hover:border-slate-300";
                    return `
                        <div class="p-3 rounded-xl cursor-pointer transition-all select-none wc-card ${borderClass}" data-metric="${c.key}">
                            <div class="text-xs font-bold text-slate-500 mb-1 flex items-center justify-center gap-1">
                                ${c.label}
                                ${isActive ? '<span class="w-2 h-2 rounded-full bg-sky-500"></span>' : ''}
                            </div>
                            <div class="text-lg font-black ${c.color}">${c.val}</div>
                        </div>
                    `;
                }).join('');

                gridContainer.querySelectorAll('.wc-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const metric = card.getAttribute('data-metric');
                        if (metric) toggleWCMetric(metric);
                    });
                });
            }
        }
    }
}

// Sub-Tab Switcher: Financial Reports
function renderReportsSubViews() {
    const buttons = document.querySelectorAll('#tabView_reports [data-reportsubtab]');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-reportsubtab') === currentReportSubTab) {
            btn.className = 'report-subtab-active px-4 py-2 text-sm font-semibold border-b-2 border-sky-600 text-sky-700 focus:outline-none';
        } else {
            btn.className = 'report-subtab-inactive px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent focus:outline-none';
        }
    });

    const subViews = ['trialBalance', 'financialStatements', 'managementReport'];
    subViews.forEach(v => {
        const el = document.getElementById(`subView_${v}`);
        if (el) {
            const camelTab = currentReportSubTab.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (v === camelTab) {
                el.classList.remove('hidden');
                el.classList.add('block');
            } else {
                el.classList.add('hidden');
                el.classList.remove('block');
            }
        }
    });

    if (currentReportSubTab === 'trial_balance') {
        renderTrialBalanceTable();
    } else if (currentReportSubTab === 'financial_statements') {
        renderFinancialStatements();
    } else if (currentReportSubTab === 'management_report') {
        renderManagementReport();
    }
}

// Sub-Tab Switcher: Data Import
function renderImportSubViews() {
    const buttons = document.querySelectorAll('#tabView_import [data-importsubtab]');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-importsubtab') === currentImportSubTab) {
            btn.className = 'import-subtab-active px-4 py-2 text-sm font-semibold border-b-2 border-sky-600 text-sky-700 focus:outline-none';
        } else {
            btn.className = 'import-subtab-inactive px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent focus:outline-none';
        }
    });

    const subViews = ['upload', 'mapping'];
    subViews.forEach(v => {
        const el = document.getElementById(`subView_${v}`);
        if (el) {
            const camelTab = currentImportSubTab.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (v === camelTab) {
                el.classList.remove('hidden');
                el.classList.add('block');
            } else {
                el.classList.add('hidden');
                el.classList.remove('block');
            }
        }
    });

    if (currentImportSubTab === 'upload') {
        renderImportFilesLog();
    }
}

// Renderer: raw TB normal balance helper
function getNormalBalance(code, endDr, endCr) {
    const classChar = String(code).trim().charAt(0);
    const dr = Number(endDr) || 0;
    const cr = Number(endCr) || 0;
    if (classChar === '1' || classChar === '5') {
        return dr - cr;
    } else if (classChar === '2' || classChar === '3' || classChar === '4') {
        return cr - dr;
    }
    return dr - cr;
}

// Renderer: raw TB global grouping aggregator (Upgraded with Category Filters and flat mapping)
function getGroupedData() {
    let allAccounts = new Map();

    monthlyResults.forEach(month => {
        if (!month.tbData) return;
        month.tbData.forEach(row => {
            const code = String(row.code).trim();
            const name = (row.name || lookupAccountName(code)).trim();
            if (!allAccounts.has(code)) {
                allAccounts.set(code, { code, name });
            }
        });
    });

    let flatAccountsList = Array.from(allAccounts.values()).sort((a, b) => a.code.localeCompare(b.code));

    // Category Filter (Assets = 1, Liabilities = 2, Equity = 3, Revenue = 4, Expenses = 5)
    if (tbCategoryFilter !== 'all') {
        flatAccountsList = flatAccountsList.filter(item => {
            const firstChar = String(item.code).trim().charAt(0);
            return firstChar === tbCategoryFilter;
        });
    }

    return flatAccountsList.map(item => {
        const code = item.code;
        const name = item.name;

        const balances = monthlyResults.map(month => {
            const row = month.tbData ? month.tbData.find(r => String(r.code).trim() === code) : null;
            if (!row) return 0;
            return getNormalBalance(code, row.end_dr, row.end_cr);
        });

        return {
            code,
            name,
            balances,
            isGroup: false
        };
    });
}

// Renderer: raw TB individual account trend chart popup creator
function showAccountTrendChart(code, name, balances) {
    const modal = document.getElementById('tbChartModal');
    if (!modal) return;

    const startIdx = window.chartStartMonthIndex !== undefined ? window.chartStartMonthIndex : 0;
    const endIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;

    let filteredMonths = [];
    let filteredBalances = [];

    monthlyResults.forEach((month, idx) => {
        if (idx >= startIdx && idx <= endIdx) {
            if (!window.selectedMonthIndices || window.selectedMonthIndices.includes(month.dateObj.getMonth())) {
                filteredMonths.push(month);
                filteredBalances.push(balances[idx]);
            }
        }
    });

    document.getElementById('tbChartModalTitle').textContent = `แนวโน้มยอดดุลสุทธิบัญชี: ${code}`;
    document.getElementById('tbChartModalSubtitle').textContent = name;

    modal.classList.remove('hidden');

    // Reset view toggle to Graph by default
    const showGraphBtn = document.getElementById('modalShowGraphBtn');
    const showTableBtn = document.getElementById('modalShowTableBtn');
    const graphContainer = document.getElementById('modalGraphContainer');
    const tableContainer = document.getElementById('modalTableContainer');

    if (showGraphBtn && showTableBtn && graphContainer && tableContainer) {
        graphContainer.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        showGraphBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none';
        showTableBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none';

        showGraphBtn.onclick = () => {
            graphContainer.classList.remove('hidden');
            tableContainer.classList.add('hidden');
            showGraphBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none';
            showTableBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
        };
        showTableBtn.onclick = () => {
            graphContainer.classList.add('hidden');
            tableContainer.classList.remove('hidden');
            showGraphBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
            showTableBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none';
        };
    }

    // Render associated accounts breakdown table
    const tableHeader = document.getElementById('modalTableHeader');
    const tableBody = document.getElementById('modalTableBody');
    if (tableHeader && tableBody) {
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        // Build list of tbCodes
        const mgtItem = typeof MGT_ACCOUNTS_MAP !== 'undefined' ? MGT_ACCOUNTS_MAP.find(m => m.code === code) : null;
        const tbCodes = mgtItem && mgtItem.tbCodes ? mgtItem.tbCodes : [code];

        // Headers
        let headerHtml = `
            <tr class="text-[11px] text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <th class="px-4 py-3 font-black text-slate-700 tracking-wider w-[120px]">รหัสผังบัญชี</th>
                <th class="px-4 py-3 font-black text-slate-700 tracking-wider">ชื่อบัญชีการเงิน</th>
        `;
        filteredMonths.forEach(month => {
            const label = month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', '');
            headerHtml += `
                <th class="px-4 py-3 text-right font-black text-slate-700 tracking-wider w-[110px] whitespace-nowrap">${label}</th>
            `;
        });
        headerHtml += `</tr>`;
        tableHeader.innerHTML = headerHtml;

        // Determine balance rules
        const isMgtCredit = mgtItem ? isCreditNormal(code) : false;

        // Rows
        const monthlySums = Array(filteredMonths.length).fill(0);
        tbCodes.forEach(tbCode => {
            const tbName = lookupAccountName(tbCode);
            const isCredit = mgtItem ? isMgtCredit : (tbCode.startsWith('2') || tbCode.startsWith('3') || tbCode.startsWith('4'));

            const tbBalances = filteredMonths.map((month, mIdx) => {
                let val = 0;
                const tbData = month.tbData || [];
                const row = tbData.find(r => String(r.code).trim() === tbCode);
                if (row) {
                    val = isCredit ? (row.end_cr - row.end_dr) : (row.end_dr - row.end_cr);
                }
                monthlySums[mIdx] += val;
                return val;
            });

            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white';

            let rowHtml = `
                <td class="px-4 py-2.5 font-mono text-[11px] text-slate-500 font-bold">${tbCode}</td>
                <td class="px-4 py-2.5 text-xs text-slate-700 font-semibold">${tbName}</td>
            `;
            tbBalances.forEach(val => {
                let formatted = '-';
                let cellClass = 'text-slate-500';
                if (val !== 0) {
                    formatted = val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    cellClass = val < 0 ? 'text-red-500 font-semibold' : 'text-slate-800 font-semibold';
                }
                rowHtml += `<td class="px-4 py-2.5 text-right font-mono text-[11px] ${cellClass}">${formatted}</td>`;
            });
            tr.innerHTML = rowHtml;
            tableBody.appendChild(tr);
        });

        // Add Total Row if more than 1 code
        if (tbCodes.length > 1) {
            const totalTr = document.createElement('tr');
            totalTr.className = 'bg-sky-50 font-bold border-t border-b border-sky-100';
            let totalHtml = `
                <td class="px-4 py-3 text-xs text-sky-850 font-black">รวมยอดดุล</td>
                <td class="px-4 py-3 text-xs text-sky-850 font-black">ผลรวมสะสมที่ใช้แสดงในระบบ</td>
            `;
            monthlySums.forEach(val => {
                let formatted = '-';
                let cellClass = 'text-sky-950';
                if (val !== 0) {
                    formatted = val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    cellClass = val < 0 ? 'text-red-600 font-black' : 'text-sky-950 font-black';
                }
                totalHtml += `<td class="px-4 py-3 text-right font-mono text-[11px] ${cellClass}">${formatted}</td>`;
            });
            totalTr.innerHTML = totalHtml;
            tableBody.appendChild(totalTr);
        }
    }

    const canvas = document.getElementById('tbAccountTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (tbTrendChartInstance) {
        tbTrendChartInstance.destroy();
    }

    const labels = [];
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    filteredMonths.forEach(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        labels.push(`${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`);
    });

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.02)');

    tbTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `ดุลสุทธิ: ${code}`,
                data: filteredBalances.map(b => Math.abs(b)),
                borderColor: '#0284C7',
                backgroundColor: 'transparent',
                fill: false,
                borderWidth: 3,
                pointBackgroundColor: '#0284C7',
                pointBorderColor: '#0284C7',
                pointBorderWidth: 2.5,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#0284C7',
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 2,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#E2E8F0',
                    titleFont: { weight: 'bold', family: "'Sarabun', sans-serif" },
                    bodyFont: { family: "'Sarabun', sans-serif" },
                    padding: 12,
                    borderRadius: 12,
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            const formatted = val === 0 ? '0' : val.toLocaleString('th-TH', { minimumFractionDigits: 2 });
                            return ` ยอดดุลสุทธิ: ${formatted}`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('tbAccountTrendChart') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    color: '#0F172A',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 11 },
                    formatter: (value) => value === 0 ? '-' : formatAbbreviated(value)
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: false },
                        pinch: { enabled: false }
                    },
                    pan: { enabled: false }
                }
            },
            scales: {
                y: {

                    grid: {
                        color: '#F1F5F9'
                    },
                    ticks: {
                        color: '#64748B',
                        font: { family: "'Sarabun', sans-serif", size: 11 },
                        callback: (value) => value === 0 ? '0' : formatAbbreviated(value)
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 11 }
                    }
                }
            }
        }
    });
}

// Renderer: raw TB paginated explorer (Upgraded with Collapsible Accordion and Sliding Columns)
function renderTrialBalanceTable() {
    const tableBody = document.getElementById('rawTbTableBody');
    const headerRow = document.getElementById('tbTableHeaderRow');
    const paginationControls = document.getElementById('tbPaginationControls');
    const colNav = document.getElementById('tbColNav');

    if (!tableBody || !paginationControls) return;

    if (monthlyResults.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 font-bold bg-white">กรุณาอัปโหลดไฟล์งบทดลองก่อน</td></tr>`;
        paginationControls.innerHTML = '';
        if (colNav) colNav.classList.add('hidden');
        if (headerRow) {
            headerRow.innerHTML = `
                <th class="px-6 py-3 font-bold">รหัสบัญชี</th>
                <th class="px-6 py-3 font-bold">ชื่อบัญชี</th>
                <th class="px-6 py-3 text-right font-bold">ดุลสุทธิปลายงวด</th>
            `;
        }
        return;
    }

    const windowSize = 3;
    const totalCols = monthlyResults.length;
    let visibleMonths = [];

    if (totalCols <= windowSize) {
        tbColStartIndex = 0;
        if (colNav) colNav.classList.add('hidden');
        visibleMonths = monthlyResults;
    } else {
        if (colNav) colNav.classList.remove('hidden');

        // Ensure starting index is in bounds
        if (tbColStartIndex < 0) tbColStartIndex = 0;
        if (tbColStartIndex > totalCols - windowSize) {
            tbColStartIndex = totalCols - windowSize;
        }

        visibleMonths = monthlyResults.slice(tbColStartIndex, tbColStartIndex + windowSize);

        // Update Column Navigation labels and disabled states
        const prevBtn = document.getElementById('tbColPrevBtn');
        const nextBtn = document.getElementById('tbColNextBtn');
        const rangeText = document.getElementById('tbColRangeText');

        if (prevBtn) prevBtn.disabled = (tbColStartIndex === 0); // can't go older
        if (nextBtn) nextBtn.disabled = (tbColStartIndex >= totalCols - windowSize); // can't go newer

        if (rangeText) {
            const startLabel = visibleMonths[0].monthStr || visibleMonths[0].filename.replace('.xlsx', '').replace('.xls', '');
            const endLabel = visibleMonths[visibleMonths.length - 1].monthStr || visibleMonths[visibleMonths.length - 1].filename.replace('.xlsx', '').replace('.xls', '');
            rangeText.textContent = `${startLabel} - ${endLabel}`;
        }
    }

    // Build dynamically side-by-side header columns (only for visible months)
    if (headerRow) {
        headerRow.innerHTML = `
            <th class="px-3 py-3 font-black text-slate-700 tracking-wider w-[100px] text-[11px]">รหัสบัญชี</th>
            <th class="px-3 py-3 font-black text-slate-700 tracking-wider text-xs">ชื่อบัญชี</th>
        `;

        visibleMonths.forEach(month => {
            const label = month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', '');
            headerRow.innerHTML += `
                <th class="px-3 py-3 text-right font-black text-slate-700 tracking-wider w-[110px] text-[11px]">${label}</th>
            `;
        });
    }

    // Process grouped data across periods
    const groupedData = getGroupedData();

    // Filter data based on search query
    const query = tbSearchQuery.toLowerCase().trim();
    const filteredData = groupedData.filter(row => {
        return row.code.toLowerCase().includes(query) || row.name.toLowerCase().includes(query);
    });

    const totalRecords = filteredData.length;
    const pageData = filteredData;

    tableBody.innerHTML = '';
    if (pageData.length === 0) {
        const totalColsCount = visibleMonths.length + 2;
        tableBody.innerHTML = `<tr><td colspan="${totalColsCount}" class="px-3 py-12 text-center text-slate-400 font-medium bg-white">ไม่พบบัญชีที่ค้นหา</td></tr>`;
    } else {
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-sky-50/30 transition-all bg-white group cursor-pointer';
            tr.title = 'คลิกเพื่อดูแนวโน้มกราฟบัญชีนี้';

            let rowHtml = `
                <td class="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap text-[11px] w-[100px]">${row.code}</td>
                <td class="px-3 py-2.5 text-slate-700 group-hover:text-sky-700 transition-colors whitespace-nowrap text-sm">${row.name}</td>
            `;

            // Display Net Balances only for VISIBLE months (slice using tbColStartIndex)
            const visibleBalances = totalCols <= windowSize
                ? row.balances
                : row.balances.slice(tbColStartIndex, tbColStartIndex + windowSize);

            visibleBalances.forEach(val => {
                let formatted = '-';
                let cellClass = 'text-slate-500 font-semibold';
                if (val !== 0) {
                    formatted = (typeof tbShowFullNumbers !== 'undefined' && tbShowFullNumbers)
                        ? val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : formatAbbreviated(val);
                    if (val < 0) {
                        cellClass = 'text-red-500 font-semibold';
                    } else {
                        cellClass = 'text-slate-800 font-bold';
                    }
                }
                rowHtml += `
                    <td class="px-3 py-2.5 text-right whitespace-nowrap text-[11px] w-[110px] ${cellClass}">${formatted}</td>
                `;
            });

            tr.innerHTML = rowHtml;

            // Clicking any row opens the Premium Trend Chart Popup
            tr.addEventListener('click', () => {
                showAccountTrendChart(row.code, row.name, row.balances);
            });

            tableBody.appendChild(tr);
        });
    }

    // Pagination Controls - Show only total count since navigation buttons are removed
    paginationControls.innerHTML = `
        <span class="text-xs text-slate-500 font-bold px-2 select-none">บัญชีทั้งหมด ${totalRecords} รายการ</span>
    `;
}

// Renderer: Financial Statements (P&L and Balance Sheet)
function renderFinancialStatements() {
    const latestMonth = monthlyResults[monthlyResults.length - 1];
    const fRes = latestMonth.financialStatementsResult || (typeof calculateFinancialStatements === 'function' ? calculateFinancialStatements(latestMonth) : {});

    // YTD Revenue & Expenses
    const revenue = fRes.revenue || 0;
    const expenses = fRes.expenses || 0;
    const netProfit = fRes.netProfit || 0;

    // Details sum
    const revenueDetail = fRes.revenueDetail || 0;
    const expensesDetail = fRes.expensesDetail || 0;

    document.getElementById('stRevenue').textContent = revenue.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stRevenueDetail').textContent = revenueDetail.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stExpenses').textContent = expenses.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stExpensesDetail').textContent = expensesDetail.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';

    const profitEl = document.getElementById('stNetProfit');
    profitEl.textContent = netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    if (netProfit < 0) {
        profitEl.className = 'font-black text-lg text-red-600';
    } else {
        profitEl.className = 'font-black text-lg text-emerald-700';
    }

    // YTD Balance Sheet items
    const cash = fRes.cash || 0;
    const ar = fRes.ar || 0;
    const inv = fRes.inv || 0;
    const totalAssets = fRes.totalAssets || 0;

    const ap = fRes.ap || 0;
    const pr = fRes.pr || 0;
    const totalLiabilities = fRes.totalLiabilities || 0;

    document.getElementById('stCash').textContent = cash.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stAR').textContent = ar.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stINV').textContent = inv.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stTotalAssets').textContent = totalAssets.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';

    document.getElementById('stAP').textContent = ap.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stPR').textContent = pr.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
    document.getElementById('stTotalLiabilities').textContent = totalLiabilities.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
}


// Note: renderManagementReport() has been refactored and moved to js/ui_mgt.js



// Renderer: Data Import upload log history
function renderImportFilesLog() {
    const logBody = document.getElementById('importFilesLogBody');
    if (!logBody) return;

    if (monthlyResults.length === 0) {
        logBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 font-bold bg-white">ยังไม่มีข้อมูลอัปโหลดไฟล์สะสม</td></tr>`;
        return;
    }

    logBody.innerHTML = '';
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    monthlyResults.forEach((month, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors text-slate-700';

        const dateStr = `${thaiMonths[month.dateObj.getMonth()]} ${month.dateObj.getFullYear() > 2500 ? month.dateObj.getFullYear() : month.dateObj.getFullYear() + 543}`;
        const numAccounts = month.tbData ? month.tbData.length : 0;

        // Check if there are warnings
        const hasWarnings = month.codeWarnings && month.codeWarnings.length > 0;
        let statusBadge = '';
        if (hasWarnings) {
            statusBadge = `
                <span class="px-2.5 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold rounded-full shadow-sm cursor-pointer inline-flex items-center gap-1 hover:bg-sky-100/50 transition-colors select-none" onclick="toggleWarningDetail(${idx})">
                    ℹ พบรหัสไม่มาตรฐาน (${month.codeWarnings.length} รายการ)
                    <svg id="warningCaret_${idx}" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                    </svg>
                </span>
            `;
        } else {
            statusBadge = `
                <span class="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full shadow-sm inline-flex items-center gap-1">
                    ✓ ประมวลผลเสร็จสมบูรณ์
                </span>
            `;
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">${month.filename}</td>
            <td class="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">${dateStr}</td>
            <td class="px-6 py-4 text-right text-sky-700 whitespace-nowrap font-semibold">${numAccounts.toLocaleString()} ผัง</td>
            <td class="px-6 py-4 text-center">${statusBadge}</td>
        `;
        logBody.appendChild(tr);

        // If there are warnings, append a hidden expandable detail row
        if (hasWarnings) {
            const detailTr = document.createElement('tr');
            detailTr.id = `warningDetailRow_${idx}`;
            detailTr.className = 'bg-slate-50/10 border-b border-slate-100 hidden';

            let warningsListHtml = '';
            month.codeWarnings.forEach(w => {
                const reasons = (w.warnings && typeof w.warnings[0] === 'object')
                    ? w.warnings.map(warn => warn.message).join(', ')
                    : w.warnings.join(', ');

                let closestHtml = '<span class="text-slate-400 italic font-sans font-normal">ไม่พบกลุ่มที่ใกล้เคียง</span>';
                if (w.closest) {
                    closestHtml = `<span class="text-emerald-700 font-mono font-bold">${w.closest.code}</span> <div class="text-[10px] text-slate-400 font-sans font-normal leading-tight">${w.closest.name}</div>`;
                }

                warningsListHtml += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs text-slate-600">
                        <td class="px-4 py-2 font-mono font-semibold select-all">${w.original}</td>
                        <td class="px-4 py-2 text-slate-700 font-semibold">${w.name || '-'}</td>
                        <td class="px-4 py-2 text-slate-500 font-medium">${reasons}</td>
                        <td class="px-4 py-2 select-all leading-tight">${closestHtml}</td>
                    </tr>
                `;
            });

            detailTr.innerHTML = `
                <td colspan="4" class="px-8 py-4 bg-slate-50/5">
                    <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-4">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-sm font-bold text-slate-700">รายละเอียดรหัสบัญชีที่ไม่เป็นไปตามมาตรฐานหลัก</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="text-xs font-bold text-slate-400">ตัวกรอง:</label>
                                <input type="text" placeholder="ค้นหาตามคำกรอง..." oninput="filterWarningTable('table_historyWarning_${idx}', this.value)" class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 w-48 shadow-sm" />
                            </div>
                        </div>
                        <div class="max-h-[250px] overflow-y-auto">
                            <table id="table_historyWarning_${idx}" class="w-full text-left text-xs">
                                <thead class="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                                    <tr class="select-none">
                                        <th class="px-4 py-2 w-[180px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_historyWarning_${idx}', 0)">รหัสเดิมใน Excel ⇅</th>
                                        <th class="px-4 py-2 w-[220px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_historyWarning_${idx}', 1)">ชื่อบัญชี ⇅</th>
                                        <th class="px-4 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_historyWarning_${idx}', 2)">สาเหตุที่ไม่มาตรฐาน ⇅</th>
                                        <th class="px-4 py-2 w-[220px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_historyWarning_${idx}', 3)">รหัสมาตรฐานที่ใกล้เคียง ⇅</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${warningsListHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            `;
            logBody.appendChild(detailTr);
        }
    });

    if (window.hospitalData) {
        const tr = document.createElement('tr');
        tr.className = 'bg-slate-50/40 border-b border-slate-100 hover:bg-slate-50 transition-colors text-slate-700';
        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">ข้อมูลโรงพยาบาล (VisitOPD, AdjRW, วันนอน)</td>
            <td class="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">ทุกรอบปีงบประมาณ</td>
            <td class="px-6 py-4 text-right text-sky-700 whitespace-nowrap font-semibold">นำเข้าสมบูรณ์</td>
            <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full shadow-sm">
                    ✓ พร้อมใช้งานสำหรับการคำนวณต้นทุน
                </span>
            </td>
        `;
        logBody.appendChild(tr);
    }
}

// Global warning toggle helper
window.toggleWarningDetail = function (idx) {
    const detailRow = document.getElementById(`warningDetailRow_${idx}`);
    const caret = document.getElementById(`warningCaret_${idx}`);
    if (detailRow) {
        const isHidden = detailRow.classList.contains('hidden');
        if (isHidden) {
            detailRow.classList.remove('hidden');
            if (caret) caret.classList.add('rotate-180');
        } else {
            detailRow.classList.add('hidden');
            if (caret) caret.classList.remove('rotate-180');
        }
    }
};

// Note: renderAlerts() and renderDashboard() have been refactored and moved to js/ui_dashboard.js

// Renderer: Legacy Sidebar accordion
function renderSidebar(latestMonth) {
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (!sidebarMenu) return;

    let configToUse = FUNDS_CONFIG;
    let activeFundVar = currentFund;
    let activeSubgroupVar = currentSubgroup;

    if (currentTab === 'ap') {
        configToUse = AP_CONFIG;
        activeFundVar = currentFundAP;
        activeSubgroupVar = currentSubgroupAP;
    } else if (currentTab === 'pr') {
        configToUse = PR_CONFIG;
        activeFundVar = currentFundPR;
        activeSubgroupVar = currentSubgroupPR;
    } else if (currentTab === 'inv' || currentTab === 'deadstock') {
        configToUse = INV_CONFIG;
        activeFundVar = currentFundINV;
        activeSubgroupVar = currentSubgroupINV;
    } else if (currentTab === 'ar' || currentTab === 'overdue_ar') {
        configToUse = FUNDS_CONFIG;
        activeFundVar = currentFund;
        activeSubgroupVar = currentSubgroup;
    }

    if (typeof window.expandedFunds === 'undefined') {
        window.expandedFunds = {};
    }
    // ค่าเริ่มต้น: ให้กลุ่มแรกใน config นั้นๆ ขยายออก
    if (configToUse && configToUse.length > 0 && typeof window.expandedFunds[configToUse[0].id] === 'undefined') {
        window.expandedFunds[configToUse[0].id] = true;
    }

    sidebarMenu.innerHTML = '';

    configToUse.forEach(fund => {
        const fundContainer = document.createElement('div');
        fundContainer.className = 'border border-slate-200 rounded-xl overflow-hidden mb-2 bg-white shadow-sm shrink-0';

        const isExpanded = !!window.expandedFunds[fund.id];

        const headerBtn = document.createElement('button');
        headerBtn.className = `w-full flex items-center justify-between p-3 text-left transition-colors font-bold ${isExpanded ? 'bg-sky-50 text-sky-800 border-b border-sky-100' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`;

        const hasActiveChild = activeFundVar === fund.id;
        if (hasActiveChild && !isExpanded) {
            headerBtn.classList.add('border-l-4', 'border-sky-500');
        }

        const iconPath = isExpanded
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />';

        headerBtn.innerHTML = `
            <span>${fund.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${iconPath}
            </svg>
        `;

        headerBtn.addEventListener('click', () => {
            window.expandedFunds[fund.id] = !window.expandedFunds[fund.id];
            renderSidebar(latestMonth);
        });

        fundContainer.appendChild(headerBtn);

        const contentDiv = document.createElement('div');
        contentDiv.className = `accordion-content bg-white ${isExpanded ? 'open' : ''}`;

        const listContainer = document.createElement('div');
        listContainer.className = 'p-2 flex flex-col gap-1';

        fund.subgroups.forEach(sub => {
            let res = null;
            if (currentTab === 'ar') res = latestMonth.result[fund.id]?.[sub.id];
            else if (currentTab === 'overdue_ar') res = latestMonth.overdueARResult?.[fund.id]?.[sub.id];
            else if (currentTab === 'ap') res = latestMonth.apResult[fund.id]?.[sub.id];
            else if (currentTab === 'pr') res = latestMonth.prResult[fund.id]?.[sub.id];
            else if (currentTab === 'inv') res = latestMonth.invResult[fund.id]?.[sub.id];
            else if (currentTab === 'deadstock') res = latestMonth.deadstockResult?.[fund.id]?.[sub.id];

            const isCurrencyTab = (currentTab === 'overdue_ar' || currentTab === 'deadstock');
            let displayVal = 'N/A';
            let numericVal = null;

            if (isCurrencyTab) {
                const chartMetricSelect = document.getElementById('chartMetricSelect');
                const selectedMetric = chartMetricSelect ? chartMetricSelect.value : 'overdue_1y';
                const metricKey = (selectedMetric && selectedMetric.startsWith('overdue_')) ? selectedMetric : 'overdue_1y';
                const amount = res && res[metricKey] !== null && res[metricKey] !== undefined ? res[metricKey] : null;
                if (amount !== null) {
                    displayVal = formatAbbreviated(amount) + ' บาท';
                    numericVal = amount;
                }
            } else {
                const days = res && res.collection_days !== null && res.collection_days !== undefined ? Math.round(res.collection_days) : null;
                if (days !== null) {
                    displayVal = days + ' วัน';
                    numericVal = days;
                }
            }

            let badgeClass = 'bg-slate-100 text-slate-600';
            let itemClass = 'text-slate-600 hover:bg-slate-50';
            let dotClass = 'bg-slate-300';

            if (displayVal !== 'N/A') {
                if (isCurrencyTab) {
                    if (numericVal > 0) {
                        badgeClass = 'bg-red-100 text-red-700 border border-red-200';
                        dotClass = 'bg-red-500';
                    } else {
                        badgeClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                        dotClass = 'bg-emerald-500';
                    }
                } else {
                    if (numericVal > 90) {
                        badgeClass = 'bg-red-100 text-red-700 border border-red-200';
                        dotClass = 'bg-red-500';
                    } else if (numericVal > 60) {
                        badgeClass = 'bg-orange-100 text-orange-700 border border-orange-200';
                        dotClass = 'bg-orange-500';
                    } else {
                        badgeClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                        dotClass = 'bg-emerald-500';
                    }
                }
            }

            const isActive = (activeFundVar === fund.id && activeSubgroupVar === sub.id);
            if (isActive) {
                itemClass = 'bg-sky-50 text-sky-800 font-bold border-sky-200';
                if (displayVal !== 'N/A') {
                    if (isCurrencyTab) {
                        badgeClass = numericVal > 0 ? 'bg-red-500 text-white shadow-sm border-transparent' : 'bg-emerald-500 text-white shadow-sm border-transparent';
                    } else if (numericVal <= 60) {
                        badgeClass = 'bg-sky-500 text-white shadow-sm border-transparent';
                    }
                }
            }

            const itemBtn = document.createElement('button');
            itemBtn.className = `sidebar-item w-full flex items-center justify-between p-2 rounded-lg text-xs border border-transparent transition-colors ${itemClass}`;

            itemBtn.innerHTML = `
                <div class="flex items-center gap-1.5 truncate">
                    <span class="w-1.5 h-1.5 rounded-full ${dotClass} shrink-0"></span>
                    <span class="truncate">${sub.name}</span>
                </div>
                <div class="px-1.5 py-0.5 rounded font-bold text-xs shrink-0 ${badgeClass}">
                    ${displayVal}
                </div>
            `;

            itemBtn.addEventListener('click', () => {
                if (currentTab === 'ar' || currentTab === 'overdue_ar') {
                    currentFund = fund.id;
                    currentSubgroup = sub.id;
                } else if (currentTab === 'ap') {
                    currentFundAP = fund.id;
                    currentSubgroupAP = sub.id;
                } else if (currentTab === 'pr') {
                    currentFundPR = fund.id;
                    currentSubgroupPR = sub.id;
                } else if (currentTab === 'inv' || currentTab === 'deadstock') {
                    currentFundINV = fund.id;
                    currentSubgroupINV = sub.id;
                }
                renderDashboard();
                renderSidebar(latestMonth);
            });

            listContainer.appendChild(itemBtn);
        });

        contentDiv.appendChild(listContainer);
        fundContainer.appendChild(contentDiv);
        sidebarMenu.appendChild(fundContainer);
    });
}

// Renderer: Legacy Detail Data Table
function renderDetailTable() {
    const tableHeaderRow = document.getElementById('tableHeaderRow');
    const tableBody = document.getElementById('tableBody');
    if (!tableHeaderRow || !tableBody) return;

    let cols = [];
    if (currentTab === 'ar') {
        cols = ['เดือน/ปี', 'ยอดยกมา', 'ยอดยกไป', 'ยอดเฉลี่ย', 'รายได้', 'อัตราหมุนเวียน (รอบ)', 'ระยะเวลา (วัน)', 'ลูกหนี้ที่ควรจะเป็น (60 วัน)', 'หนี้ไม่เคลื่อนไหวโดยประมาณ'];
    } else if (currentTab === 'ap') {
        cols = ['เดือน/ปี', 'ยอดยกมา', 'ยอดยกไป', 'ยอดเฉลี่ย', 'รายจ่าย/ซื้อ', 'อัตราหมุนเวียน (รอบ)', 'ระยะเวลา (วัน)'];
    } else if (currentTab === 'pr') {
        cols = ['เดือน/ปี', 'ยอดยกมา', 'ยอดยกไป', 'ยอดเฉลี่ย', 'ค่าบุคลากรค้างจ่าย', 'อัตราหมุนเวียน (รอบ)', 'ระยะเวลา (วัน)'];
    } else if (currentTab === 'inv') {
        cols = ['เดือน/ปี', 'ยอดยกมา', 'ยอดยกไป', 'ยอดเฉลี่ย', 'ต้นทุนคลังสินค้า', 'อัตราหมุนเวียน (รอบ)', 'ระยะเวลา (วัน)', 'สินค้าคงคลังที่ควรจะเป็น (60 วัน)', 'สินค้าจมทุนโดยประมาณ'];
    } else if (currentTab === 'overdue_ar') {
        cols = ['เดือน/ปี', 'ยอดลูกหนี้คงเหลือ', 'ค้าง 1 เดือน', 'ค้าง 3 เดือน', 'ค้าง 6 เดือน', 'ค้าง 1 ปี', 'ค้าง 2 ปี', 'ค้าง 3 ปี'];
    } else if (currentTab === 'deadstock') {
        cols = ['เดือน/ปี', 'ยอดสินค้าคงคลัง', 'Deadstock 1 ด.', 'Deadstock 3 ด.', 'Deadstock 6 ด.', 'Deadstock 1 ปี', 'Deadstock 2 ปี', 'Deadstock 3 ปี'];
    }

    tableHeaderRow.innerHTML = '';
    cols.forEach(col => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'px-6 py-3 border-b border-slate-200 whitespace-nowrap font-bold';
        th.textContent = col;
        tableHeaderRow.appendChild(th);
    });

    tableBody.innerHTML = '';

    const reversedResults = [...monthlyResults].reverse();
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    reversedResults.forEach(month => {
        let res = null;
        if (currentTab === 'ar' && month.result[currentFund]) {
            res = month.result[currentFund][currentSubgroup];
        } else if (currentTab === 'overdue_ar' && month.overdueARResult && month.overdueARResult[currentFund]) {
            res = month.overdueARResult[currentFund][currentSubgroup];
        } else if (currentTab === 'ap' && month.apResult[currentFundAP]) {
            res = month.apResult[currentFundAP][currentSubgroupAP];
        } else if (currentTab === 'pr' && month.prResult[currentFundPR]) {
            res = month.prResult[currentFundPR][currentSubgroupPR];
        } else if (currentTab === 'inv' && month.invResult[currentFundINV]) {
            res = month.invResult[currentFundINV][currentSubgroupINV];
        } else if (currentTab === 'deadstock' && month.deadstockResult && month.deadstockResult[currentFundINV]) {
            res = month.deadstockResult[currentFundINV][currentSubgroupINV];
        }

        if (res) {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors';

            const dateStr = `${thaiMonths[month.dateObj.getMonth()]} ${month.dateObj.getFullYear() > 2500 ? month.dateObj.getFullYear() : month.dateObj.getFullYear() + 543}`;

            const formatNum = (num) => (num !== null && num !== undefined) ? Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'n/a';
            const formatRound = (num) => (num !== null && num !== undefined) ? Math.round(num).toLocaleString('th-TH') : 'n/a';

            const tdDate = document.createElement('td');
            tdDate.className = 'px-6 py-4 font-bold text-slate-900 whitespace-nowrap';
            tdDate.textContent = dateStr;
            tr.appendChild(tdDate);

            if (currentTab === 'overdue_ar' || currentTab === 'deadstock') {
                const tdCurrent = document.createElement('td');
                tdCurrent.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                tdCurrent.textContent = formatNum(res.current_balance);
                tr.appendChild(tdCurrent);

                const agingFields = [
                    { key: 'overdue_1m', colorClass: 'text-rose-500 font-medium' },
                    { key: 'overdue_3m', colorClass: 'text-rose-600 font-semibold' },
                    { key: 'overdue_6m', colorClass: 'text-rose-700 font-semibold' },
                    { key: 'overdue_1y', colorClass: 'text-red-600 font-semibold' },
                    { key: 'overdue_2y', colorClass: 'text-red-700 font-semibold' },
                    { key: 'overdue_3y', colorClass: 'text-red-850 font-bold' }
                ];

                agingFields.forEach(field => {
                    const td = document.createElement('td');
                    td.className = `px-6 py-4 whitespace-nowrap text-right ${field.colorClass}`;
                    td.textContent = formatNum(res[field.key]);
                    tr.appendChild(td);
                });
            } else {
                const tdStart = document.createElement('td');
                tdStart.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                tdStart.textContent = formatNum(res.ar_uc_start);

                const tdEnd = document.createElement('td');
                tdEnd.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                tdEnd.textContent = formatNum(res.ar_uc_end);

                const tdAvg = document.createElement('td');
                tdAvg.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                tdAvg.textContent = formatNum(res.avg_ar);

                const tdRev = document.createElement('td');
                tdRev.className = 'px-6 py-4 whitespace-nowrap text-right font-semibold text-sky-700';
                tdRev.textContent = formatNum(res.rev_uc);

                const tdRatio = document.createElement('td');
                tdRatio.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                tdRatio.textContent = formatNum(res.turnover_ratio);

                const tdDays = document.createElement('td');
                tdDays.className = 'px-6 py-4 whitespace-nowrap text-right font-bold';

                const days = Math.round(res.collection_days);
                let daysClass = 'text-emerald-600';
                if (days > 90) daysClass = 'text-red-600';
                else if (days > 60) daysClass = 'text-amber-600';

                tdDays.innerHTML = `<span class="${daysClass}">${formatRound(res.collection_days)}</span>`;

                tr.appendChild(tdStart);
                tr.appendChild(tdEnd);
                tr.appendChild(tdAvg);
                tr.appendChild(tdRev);
                tr.appendChild(tdRatio);
                tr.appendChild(tdDays);

                if (currentTab === 'ar' || currentTab === 'inv') {
                    const tdShouldBe = document.createElement('td');
                    tdShouldBe.className = 'px-6 py-4 whitespace-nowrap text-right text-slate-600';
                    tdShouldBe.textContent = formatNum(res.should_be_ar);

                    const tdInactive = document.createElement('td');
                    tdInactive.className = 'px-6 py-4 whitespace-nowrap text-right font-semibold text-rose-600';
                    tdInactive.textContent = formatNum(res.inactive_ar);

                    tr.appendChild(tdShouldBe);
                    tr.appendChild(tdInactive);
                }
            }

            tableBody.appendChild(tr);
        }
    });
}

// Global Month Range Filter Initializer & State Handler (Synchronized across all chart headers)
window.getFilteredMonths = function (monthlyResultsArray) {
    const list = monthlyResultsArray || window.monthlyResults;
    if (!list) return [];
    const startIdx = window.chartStartMonthIndex !== undefined ? window.chartStartMonthIndex : 0;
    const endIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : list.length - 1;

    return list.filter((month, idx) => {
        const inRange = idx >= startIdx && idx <= endIdx;
        if (!inRange) return false;
        if (window.selectedMonthIndices && window.selectedMonthIndices.length > 0) {
            return window.selectedMonthIndices.includes(month.dateObj.getMonth());
        }
        return false;
    });
};

function initGlobalDateRangeFilter() {
    const startSelects = document.querySelectorAll('.chart-start-month-select');
    const endSelects = document.querySelectorAll('.chart-end-month-select');

    if (startSelects.length === 0 || endSelects.length === 0) return;
    if (typeof monthlyResults === 'undefined' || monthlyResults.length === 0) return;

    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    if (window.selectedMonthIndices === undefined || window.selectedMonthIndices.length === 0) {
        window.selectedMonthIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }

    // Populate all Start Month selectors
    startSelects.forEach(select => {
        select.innerHTML = '';
        monthlyResults.forEach((month, idx) => {
            let y = month.dateObj.getFullYear();
            let m = month.dateObj.getMonth() + 1;
            let thaiYear = y > 2500 ? y : y + 543;
            const label = `${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`;
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = label;
            select.appendChild(opt);
        });
    });

    // Populate all End Month selectors
    endSelects.forEach(select => {
        select.innerHTML = '';
        monthlyResults.forEach((month, idx) => {
            let y = month.dateObj.getFullYear();
            let m = month.dateObj.getMonth() + 1;
            let thaiYear = y > 2500 ? y : y + 543;
            const label = `${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`;
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = label;
            select.appendChild(opt);
        });
    });

    // Default values: full range (set only once)
    if (window.chartStartMonthIndex === undefined) {
        window.chartStartMonthIndex = 0;
    }
    if (window.chartEndMonthIndex === undefined) {
        window.chartEndMonthIndex = monthlyResults.length - 1;
    }

    // Set initial values in DOM
    startSelects.forEach(select => { select.value = window.chartStartMonthIndex; });
    endSelects.forEach(select => { select.value = window.chartEndMonthIndex; });

    // Convert to custom dropdown
    startSelects.forEach(select => { convertToCustomDropdown(select); });
    endSelects.forEach(select => { convertToCustomDropdown(select); });

    // ── DYNAMIC SPECIFIC MONTH FILTER INJECTION ──
    const widgets = document.querySelectorAll('.date-filter-widget');
    widgets.forEach(widget => {
        if (widget.querySelector('.specific-months-container')) return; // Already processed

        // Save initial children (range inputs and labels)
        const children = Array.from(widget.childNodes);
        widget.innerHTML = '';

        // 1. Create Range Container (Group 2)
        const rangeContainer = document.createElement('div');
        rangeContainer.className = "range-inputs-container flex items-center gap-1.5 shrink-0";
        children.forEach(child => rangeContainer.appendChild(child));
        widget.appendChild(rangeContainer);

        // Divider
        const divider = document.createElement('div');
        divider.className = "w-px h-5 bg-slate-200 mx-1.5 shrink-0 self-center";
        widget.appendChild(divider);

        // 2. Create Specific Months Container (Group 1)
        const specificContainer = document.createElement('div');
        specificContainer.className = "specific-months-container relative shrink-0";

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = "specific-months-btn bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 cursor-pointer focus:outline-none shadow-sm hover:bg-slate-50 flex items-center gap-1 shrink-0 select-none transition-all";
        btn.innerHTML = `
            <span class="selected-months-text">เลือกเดือน (${window.selectedMonthIndices.length})</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:12px; height:12px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
        `;

        const dropdown = document.createElement('div');
        const isFooter = widget.closest('.border-t') || widget.closest('footer') || widget.getBoundingClientRect().top > window.innerHeight / 2;
        dropdown.className = `specific-months-dropdown hidden absolute z-[200] ${isFooter ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48 max-h-56 overflow-y-auto`;

        // Select All / Deselect All helper
        const allToggleLabel = document.createElement('label');
        allToggleLabel.className = "flex items-center gap-2 py-1 border-b border-slate-100 mb-1 text-[11px] font-black text-indigo-700 cursor-pointer hover:bg-slate-50 rounded px-1 w-full";
        allToggleLabel.innerHTML = `
            <input type="checkbox" class="all-months-toggle rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 transition-all">
            <span>เลือกทั้งหมด</span>
        `;
        const allCheckbox = allToggleLabel.querySelector('.all-months-toggle');
        allCheckbox.checked = window.selectedMonthIndices.length === 12;
        allCheckbox.addEventListener('change', () => {
            if (allCheckbox.checked) {
                window.selectedMonthIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            } else {
                window.selectedMonthIndices = [];
            }
            document.querySelectorAll('.specific-month-checkbox').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                cb.checked = window.selectedMonthIndices.includes(idx);
            });
            syncHelperCheckboxes();
            updateSpecificMonthTexts();
            refreshActiveCharts();
        });
        dropdown.appendChild(allToggleLabel);

        // Quarterly selection helper
        const quarterToggleLabel = document.createElement('label');
        quarterToggleLabel.className = "flex items-center gap-2 py-1 border-b border-slate-100 mb-1 text-[11px] font-black text-emerald-700 cursor-pointer hover:bg-slate-50 rounded px-1 w-full";
        quarterToggleLabel.innerHTML = `
            <input type="checkbox" class="quarterly-months-toggle rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 transition-all">
            <span>แสดงรายไตรมาส (มี.ค., มิ.ย., ก.ย., ธ.ค.)</span>
        `;
        const quarterCheckbox = quarterToggleLabel.querySelector('.quarterly-months-toggle');
        quarterCheckbox.checked = window.selectedMonthIndices.length === 4 && [2, 5, 8, 11].every(m => window.selectedMonthIndices.includes(m));
        quarterCheckbox.addEventListener('change', () => {
            if (quarterCheckbox.checked) {
                window.selectedMonthIndices = [2, 5, 8, 11];
            } else {
                window.selectedMonthIndices = [];
            }
            document.querySelectorAll('.specific-month-checkbox').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                cb.checked = window.selectedMonthIndices.includes(idx);
            });
            syncHelperCheckboxes();
            updateSpecificMonthTexts();
            refreshActiveCharts();
        });
        dropdown.appendChild(quarterToggleLabel);

        thaiMonths.forEach((monthName, monthIdx) => {
            const labelText = monthName;

            const label = document.createElement('label');
            label.className = "flex items-center gap-2 py-1 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 rounded px-1 w-full";

            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.className = "specific-month-checkbox rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5";
            checkbox.checked = window.selectedMonthIndices.includes(monthIdx);
            checkbox.dataset.idx = monthIdx;

            checkbox.addEventListener('change', () => {
                const idxInt = parseInt(checkbox.dataset.idx);
                if (checkbox.checked) {
                    if (!window.selectedMonthIndices.includes(idxInt)) {
                        window.selectedMonthIndices.push(idxInt);
                    }
                } else {
                    window.selectedMonthIndices = window.selectedMonthIndices.filter(val => val !== idxInt);
                }

                document.querySelectorAll(`.specific-month-checkbox[data-idx="${idxInt}"]`).forEach(cb => {
                    cb.checked = checkbox.checked;
                });

                syncHelperCheckboxes();
                updateSpecificMonthTexts();
                refreshActiveCharts();
            });

            label.appendChild(checkbox);

            const span = document.createElement('span');
            span.textContent = labelText;
            label.appendChild(span);

            dropdown.appendChild(label);
        });

        function syncHelperCheckboxes() {
            const isAll = window.selectedMonthIndices.length === 12;
            const isQuarter = window.selectedMonthIndices.length === 4 && [2, 5, 8, 11].every(m => window.selectedMonthIndices.includes(m));

            document.querySelectorAll('.all-months-toggle').forEach(cb => {
                cb.checked = isAll;
            });
            document.querySelectorAll('.quarterly-months-toggle').forEach(cb => {
                cb.checked = isQuarter;
            });
        }

        specificContainer.appendChild(btn);
        specificContainer.appendChild(dropdown);
        widget.appendChild(specificContainer);

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasHidden = dropdown.classList.contains('hidden');
            document.querySelectorAll('.specific-months-dropdown').forEach(d => d.classList.add('hidden'));
            if (wasHidden) {
                dropdown.classList.remove('hidden');
            }
        });
    });

    if (!window.hasSpecificMonthsOutsideClickEvent) {
        document.addEventListener('click', () => {
            document.querySelectorAll('.specific-months-dropdown').forEach(d => d.classList.add('hidden'));
        });
        window.hasSpecificMonthsOutsideClickEvent = true;
    }

    function updateSpecificMonthTexts() {
        const text = `เลือกเดือน (${window.selectedMonthIndices.length})`;
        document.querySelectorAll('.selected-months-text').forEach(el => {
            el.textContent = text;
        });
    }

    // Helper to synchronize selections across all selectors
    const syncSelects = () => {
        startSelects.forEach(select => {
            select.value = window.chartStartMonthIndex;
            const w = select.parentElement;
            if (w && w.classList.contains('custom-select-wrapper')) {
                rebuildCustomOptions(select, w);
            }
        });
        endSelects.forEach(select => {
            select.value = window.chartEndMonthIndex;
            const w = select.parentElement;
            if (w && w.classList.contains('custom-select-wrapper')) {
                rebuildCustomOptions(select, w);
            }
        });
    };

    // Change listeners with auto-correction & synchronization
    startSelects.forEach(select => {
        select.onchange = () => {
            let startVal = parseInt(select.value);
            let endVal = window.chartEndMonthIndex;
            if (startVal > endVal) {
                endVal = startVal;
            }
            window.chartStartMonthIndex = startVal;
            window.chartEndMonthIndex = endVal;
            syncSelects();
            refreshActiveCharts();
            setTimeout(() => {
                const wrapper = select.parentElement;
                if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                    wrapper.querySelector('.custom-select-btn')?.blur();
                } else {
                    select.blur();
                }
            }, 50);
        };
    });

    endSelects.forEach(select => {
        select.onchange = () => {
            let startVal = window.chartStartMonthIndex;
            let endVal = parseInt(select.value);
            if (endVal < startVal) {
                startVal = endVal;
            }
            window.chartStartMonthIndex = startVal;
            window.chartEndMonthIndex = endVal;
            syncSelects();
            refreshActiveCharts();
            setTimeout(() => {
                const wrapper = select.parentElement;
                if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                    wrapper.querySelector('.custom-select-btn')?.blur();
                } else {
                    select.blur();
                }
            }, 50);
        };
    });
}

// Dynamically refresh currently active graphs when selected period updates
function refreshActiveCharts() {
    if (typeof monthlyResults === 'undefined' || monthlyResults.length === 0) return;

    if (typeof currentMainTab !== 'undefined') {
        if (currentMainTab === 'dashboard') {
            if (typeof currentSubTab !== 'undefined') {
                if (currentSubTab === 'financial_health') {
                    renderFinancialHealthChart();
                    if (typeof renderDashboardBreakdownTable === 'function' && window.activeDashboardMetric) {
                        renderDashboardBreakdownTable(window.activeDashboardMetric);
                    }
                } else if (currentSubTab === 'cash_cycle') {
                    renderCCCChart();
                }
            } else {
                renderFinancialHealthChart();
                if (typeof renderDashboardBreakdownTable === 'function' && window.activeDashboardMetric) {
                    renderDashboardBreakdownTable(window.activeDashboardMetric);
                }
                renderCCCChart();
            }
        } else if (currentMainTab === 'working_capital' || currentMainTab === 'workingCapital') {
            renderLineChart();
            const latestEndIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;
            renderWorkingCapitalExtraSection(monthlyResults[latestEndIdx]);
        } else if (currentMainTab === 'reports') {
            if (typeof currentReportSubTab !== 'undefined' && currentReportSubTab === 'management_report') {
                if (window.mgtActiveView === 'graph') {
                    drawMgtTrendGraph();
                }
            }
        } else if (currentMainTab === 'analysis') {
            if (typeof currentAnalysisSubTab !== 'undefined') {
                if (currentAnalysisSubTab === 'compare_metrics') {
                    updateAnalysisCompareChart();
                } else if (currentAnalysisSubTab === 'financial_distress') {
                    renderFinancialDistressDashboard();
                } else if (currentAnalysisSubTab === 'waterfall_pnl') {
                    if (typeof renderWaterfallPnL === 'function') renderWaterfallPnL();
                } else if (currentAnalysisSubTab === 'treatment_cost') {
                    if (typeof renderTreatmentCost === 'function') renderTreatmentCost();
                }
            } else {
                updateAnalysisCompareChart();
                renderFinancialDistressDashboard();
                if (typeof renderWaterfallPnL === 'function') renderWaterfallPnL();
                if (typeof renderTreatmentCost === 'function') renderTreatmentCost();
            }
        }
    }
}

// ==========================================================
// Custom Dropdown Transformation System
// ==========================================================

function convertToCustomDropdown(selectIdOrEl) {
    const select = typeof selectIdOrEl === 'string' ? document.getElementById(selectIdOrEl) : selectIdOrEl;
    if (!select) return;

    // Avoid double wrapper
    let wrapper = select.parentElement;
    if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
        rebuildCustomOptions(select, wrapper);
        return;
    }

    wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    if (select.classList.contains('w-full')) {
        wrapper.classList.add('w-full');
    }

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.style.display = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'custom-select-btn';
    if (select.classList.contains('w-full')) {
        btn.style.width = '100%';
    }

    if (select.classList.contains('chart-start-month-select') || select.classList.contains('chart-end-month-select')) {
        wrapper.classList.add('custom-select-sm');
    } else if (select.classList.contains('custom-select-lg') || select.id === 'wcCategorySelect') {
        wrapper.classList.add('custom-select-lg');
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'custom-select-text';
    textSpan.textContent = select.options[select.selectedIndex]?.textContent || '';
    btn.appendChild(textSpan);

    btn.insertAdjacentHTML('beforeend', `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5 text-slate-400 custom-select-arrow transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:14px; height:14px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
        </svg>
    `);

    wrapper.appendChild(btn);

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    wrapper.appendChild(dropdown);

    btn.associatedSelect = select;
    wrapper.associatedSelect = select;
    wrapper.associatedBtn = btn;
    wrapper.associatedDropdown = dropdown;

    rebuildCustomOptions(select, wrapper);

    select.addEventListener('change', () => {
        const activeText = select.options[select.selectedIndex]?.textContent || '';
        const txtEl = btn.querySelector('.custom-select-text');
        if (txtEl) txtEl.textContent = activeText;
        dropdown.querySelectorAll('.custom-select-option').forEach(el => {
            if (el.textContent === activeText) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();

        document.querySelectorAll('.custom-select-dropdown.show').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('show');
                d.previousElementSibling.classList.remove('active');
            }
        });

        const show = dropdown.classList.toggle('show');
        if (show) {
            const rect = btn.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = 250; // Max height is 250px in CSS
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                dropdown.classList.add('open-up');
            } else {
                dropdown.classList.remove('open-up');
            }
        }
        btn.classList.toggle('active', show);
    });

    if (!window.hasCustomDropdownOutsideClickEvent) {
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-dropdown.show').forEach(d => {
                d.classList.remove('show');
                d.previousElementSibling.classList.remove('active');
            });
        });
        window.hasCustomDropdownOutsideClickEvent = true;
    }
}

function rebuildCustomOptions(select, wrapper) {
    const dropdown = wrapper.querySelector('.custom-select-dropdown');
    const btn = wrapper.querySelector('.custom-select-btn');
    if (!dropdown || !btn) return;

    dropdown.innerHTML = '';

    Array.from(select.options).forEach((opt) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'custom-select-option';
        item.textContent = opt.textContent;

        if (opt.value === select.value) {
            item.classList.add('selected');
        }

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            select.value = opt.value;

            dropdown.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');

            btn.querySelector('.custom-select-text').textContent = opt.textContent;

            dropdown.classList.remove('show');
            btn.classList.remove('active');

            select.dispatchEvent(new Event('change'));
        });

        dropdown.appendChild(item);
    });

    btn.querySelector('.custom-select-text').textContent = select.options[select.selectedIndex]?.textContent || '';
}


