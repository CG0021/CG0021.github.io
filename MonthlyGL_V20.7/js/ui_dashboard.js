// ==========================================================
// ส่วนควบคุมการแสดงผลแดชบอร์ดภาพรวมการเงิน (Financial Dashboard Controller)
// ==========================================================

window.dashUseMonthlyValue = true;

function getProgressBarHtml(value, target, compareType, unit) {
    let passed = true;
    if (compareType === 'max') {
        passed = value <= target;
    } else {
        passed = value >= target;
    }

    const barBg = passed ? 'bg-emerald-500' : 'bg-rose-500';
    const textClass = passed ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold';

    let statusText = "";
    if (compareType === 'max') {
        statusText = passed ? "ปกติ" : "สูง (เกินเกณฑ์)";
    } else {
        statusText = passed ? "ผ่านเกณฑ์" : "ต่ำกว่าเกณฑ์";
    }

    // Format target display
    let targetStr = "";
    if (unit === '%') {
        targetStr = `${(target * 100).toFixed(0)}%`;
    } else if (unit === 'เท่า') {
        targetStr = `${target.toFixed(1)} เท่า`;
    } else if (unit === 'บาท') {
        targetStr = `≥ 0 บาท`;
    } else {
        targetStr = `${target} ${unit}`;
    }

    // Calculate percentage width for visual bar
    let percentage = 0;
    let targetPercent = 50;
    if (target === 0) {
        targetPercent = 15; // place target marker near the start
        if (value >= 0) {
            percentage = 100;
        } else {
            percentage = 0;
        }
    } else {
        // scale max value to 1.3x target or the value itself to have a margin
        const scaleMax = Math.max(Math.abs(value), Math.abs(target)) * 1.3 || 1;
        percentage = (Math.abs(value) / scaleMax) * 100;
        targetPercent = (Math.abs(target) / scaleMax) * 100;
    }

    percentage = Math.min(100, Math.max(0, percentage));
    targetPercent = Math.min(95, Math.max(5, targetPercent));

    return `
        <div class="mt-2 select-none">
            <div class="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <div>เป้าหมาย: <span class="font-bold text-slate-700">${targetStr}</span></div>
                <div class="${textClass} text-[10px]">${statusText}</div>
            </div>
            <div class="relative w-full h-2 bg-slate-100 rounded-full overflow-visible border border-slate-200/50">
                <!-- Bar Fill -->
                <div class="h-full rounded-full transition-all duration-500 ${barBg}" style="width: ${percentage}%"></div>
                <!-- Target Line Marker -->
                <div class="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-400 z-10" style="left: ${targetPercent}%">
                    <!-- Little dot or triangle indicator -->
                    <div class="absolute -top-[3px] -left-[2px] w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                </div>
            </div>
        </div>
    `;
}

function getMetricRowHtml(metricId, labelName, value, target, compareType, unit, tooltipText) {
    if (value === null || value === undefined || isNaN(value)) {
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border-2 transition-all active:scale-[0.99] duration-150 border-slate-100 hover:bg-slate-50/50 cursor-pointer" data-dashmetric="${metricId}">
                <!-- Label & Tooltip -->
                <div class="w-full sm:w-2/5 flex items-center gap-1.5 select-none">
                    <span class="text-xs font-bold text-slate-700">${labelName}</span>
                    <div class="group relative inline-block cursor-help z-20">
                        <span class="text-slate-400 hover:text-slate-600 text-xs font-semibold">ⓘ</span>
                        <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-56 rounded-lg bg-slate-800 p-2 text-left text-[11px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 leading-normal">
                            ${tooltipText}
                        </span>
                    </div>
                </div>
                
                <!-- Bar Visual -->
                <div class="flex-1 w-full relative min-w-[100px] select-none">
                    <div class="relative w-full h-3 bg-slate-50 rounded-full border border-slate-100">
                    </div>
                </div>
                
                <!-- Status & Value -->
                <div class="w-32 flex items-center justify-between gap-2 text-xs select-none">
                    <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">ไม่มีข้อมูล</span>
                    <span class="text-slate-400 font-bold">N/A</span>
                </div>
            </div>
        `;
    }

    let passed = true;
    if (compareType === 'max') {
        passed = value <= target;
    } else {
        passed = value >= target;
    }

    const barBg = passed ? 'bg-emerald-500' : 'bg-rose-500';
    const statusBg = passed ? 'bg-emerald-50' : 'bg-rose-50';
    const statusTextClass = passed ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-bold';

    let statusText = "";
    if (compareType === 'max') {
        statusText = passed ? "ปกติ" : "สูงเกินเกณฑ์";
    } else {
        statusText = passed ? "ผ่านเกณฑ์" : "ต่ำกว่าเกณฑ์";
    }

    // Format target display
    let targetStr = "";
    if (unit === '%') {
        targetStr = `${(target * 100).toFixed(0)}%`;
    } else if (unit === 'เท่า') {
        targetStr = `${target.toFixed(1)} เท่า`;
    } else if (unit === 'บาท') {
        targetStr = `≥ 0 บาท`;
    } else {
        targetStr = `${target} ${unit}`;
    }

    // Format value display
    let valueStr = "";
    if (unit === '%') {
        valueStr = `${(value * 100).toFixed(2)} %`;
    } else if (unit === 'เท่า') {
        valueStr = `${value.toFixed(2)} เท่า`;
    } else if (unit === 'บาท') {
        valueStr = value.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท';
    } else {
        valueStr = `${Math.round(value)} ${unit}`;
    }

    // Calculate percentage width for visual bar
    let percentage = 0;
    let targetPercent = 50;
    if (target === 0) {
        targetPercent = 15; // place target marker near the start
        if (value >= 0) {
            percentage = 100;
        } else {
            percentage = 0;
        }
    } else {
        const scaleMax = Math.max(Math.abs(value), Math.abs(target)) * 1.3 || 1;
        percentage = (Math.abs(value) / scaleMax) * 100;
        targetPercent = (Math.abs(target) / scaleMax) * 100;
    }

    percentage = Math.min(100, Math.max(0, percentage));
    targetPercent = Math.min(95, Math.max(5, targetPercent));

    const activeClass = 'border-slate-100 hover:bg-slate-50/50';

    return `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border-2 transition-all active:scale-[0.99] duration-150 ${activeClass} cursor-pointer" data-dashmetric="${metricId}">
            <!-- Label & Tooltip -->
            <div class="w-full sm:w-2/5 flex items-center gap-1.5 select-none">
                <span class="text-xs font-bold text-slate-700">${labelName}</span>
                <div class="group relative inline-block cursor-help z-20">
                    <span class="text-slate-400 hover:text-slate-600 text-xs font-semibold">ⓘ</span>
                    <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-56 rounded-lg bg-slate-800 p-2 text-left text-[11px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 leading-normal">
                        ${tooltipText}
                    </span>
                </div>
            </div>
            
            <!-- Bar Visual -->
            <div class="flex-1 w-full relative min-w-[100px] select-none">
                <div class="relative w-full h-3 bg-slate-100 rounded-full border border-slate-200/50">
                    <!-- Bar Fill -->
                    <div class="h-full rounded-full transition-all duration-500 ${barBg}" style="width: ${percentage}%"></div>
                    <!-- Target Line Marker -->
                    <div class="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-400 z-10" style="left: ${targetPercent}%">
                        <!-- Little dot or triangle indicator -->
                        <div class="absolute -top-[3px] -left-[2.5px] w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                </div>
                <!-- Small label under the bar for target value -->
                <div class="text-[9px] text-slate-400 mt-1 select-none">เป้าหมาย: ${targetStr}</div>
            </div>

            <!-- Value & Status -->
            <div class="w-full sm:w-1/4 text-right flex items-center justify-between sm:justify-end gap-2 shrink-0 select-none">
                <span class="text-sm font-black text-slate-800 font-mono">${valueStr}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-md ${statusBg} ${statusTextClass}">${statusText}</span>
            </div>
        </div>
    `;
}

// Sub-Tab Switcher: Dashboard
function renderDashboardSubViews() {
    const buttons = document.querySelectorAll('#tabView_dashboard [data-subtab]');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-subtab') === currentSubTab) {
            btn.className = 'subtab-active px-4 py-2 text-sm font-semibold border-b-2 border-sky-600 text-sky-700 focus:outline-none';
        } else {
            btn.className = 'subtab-inactive px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent focus:outline-none';
        }
    });

    const subViews = ['financialHealth', 'cashCycle', 'alerts'];
    subViews.forEach(v => {
        const el = document.getElementById(`subView_${v}`);
        if (el) {
            const camelTab = currentSubTab.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (v === camelTab) {
                el.classList.remove('hidden');
                el.classList.add('block');
            } else {
                el.classList.add('hidden');
                el.classList.remove('block');
            }
        }
    });

    if (currentSubTab === 'financial_health') {
        if (monthlyResults.length > 0) {
            const latestMonth = monthlyResults[monthlyResults.length - 1];
            const tbData = latestMonth.tbData;
            const revenue = sumAccounts(tbData, '4', true);
            const expenses = sumAccounts(tbData, '5', false);
            const profit = revenue - expenses;
            const cash = sumAccounts(tbData, '1101', false);
            const ebitda = sumMgtAccount(tbData, 'EBITDA');

            document.getElementById('dashEBITDA').textContent = formatAbbreviated(ebitda);

            // --- Financial Ratios Calculations ---
            const dbRes = latestMonth.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(latestMonth, monthlyResults) : {
                currentRatio: 0, quickRatio: 0, cashRatio: 0, nwc: 0, netReserve: 0, operatingMargin: 0, returnOnAsset: 0
            });

            const currentRatio = dbRes.currentRatio || 0;
            const quickRatio = dbRes.quickRatio || 0;
            const cashRatio = dbRes.cashRatio || 0;
            const nwc = dbRes.nwc || 0;
            const operatingMargin = dbRes.operatingMargin || 0;
            const returnOnAsset = dbRes.returnOnAsset || 0;

            // คำนวณรายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI) - A91D (เทียบเท่ากับที่แท็บวิเคราะห์ข้อมูล วิกฤติทางการเงิน 7 ระดับ ข้อ 2.2)
            const isSingleBalance_dash = tbData.some(row => row.code && row.code.startsWith('CR_'));
            const niDepr = sumMgtAccount(tbData, 'A91D', isSingleBalance_dash);

            // Render to DOM (Profitability Cards)
            document.getElementById('dashOperatingMargin').textContent = (operatingMargin * 100).toFixed(2) + ' %';
            document.getElementById('dashROA').textContent = (returnOnAsset * 100).toFixed(2) + ' %';

            let apDrugSuppliesDays = dbRes.apDrugSuppliesDays || 0;
            let arUCDays = dbRes.arUCDays || 0;
            let arCGDDays = dbRes.arCGDDays || 0;
            let arSSSDays = dbRes.arSSSDays || 0;
            let invDays = dbRes.invDays || 0;


            // Render Profitability Card Progress Bars
            document.getElementById('prog_operatingMargin').innerHTML = getProgressBarHtml(operatingMargin, 0, 'min', '%');
            document.getElementById('prog_returnOnAsset').innerHTML = getProgressBarHtml(returnOnAsset, 0.05, 'min', '%');
            document.getElementById('prog_ebitda').innerHTML = getProgressBarHtml(ebitda, 0, 'min', 'บาท');

            // Render Liquidity group as dynamic stacked bar rows
            const liqContainer = document.getElementById('liquidityBarsContainer');
            if (liqContainer) {
                let html = '';
                html += getMetricRowHtml('nwc', 'ทุนสำรองสุทธิ (Net Working Capital)', nwc, 0, 'min', 'บาท', 'ทุนสำรองสุทธิ (Net Working Capital) ทุนหมุนเวียนสุทธิปรับปรุง ควรมีค่ามากกว่าหรือเท่ากับ 0 บาท (เกณฑ์เป้าหมาย: ≥ 0 บาท)');
                html += getMetricRowHtml('niDepr', 'รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)', niDepr, 0, 'min', 'บาท', 'รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI) แสดงความมั่นคงทางการเงินจากผลการดำเนินงาน ควรมีค่ามากกว่าหรือเท่ากับ 0 บาท (เกณฑ์เป้าหมาย: ≥ 0 บาท) - Status Index ข้อ 2.2');
                html += getMetricRowHtml('cashRatio', 'Cash Ratio', cashRatio, 0.8, 'min', 'เท่า', 'อัตราส่วนเงินสดต่อหนี้สินหมุนเวียนสุทธิ วัดสภาพคล่องฉุกเฉิน ควรมีค่าตั้งแต่ 0.8 ขึ้นไป (เกณฑ์เป้าหมาย: ≥ 0.8 เท่า)');
                html += getMetricRowHtml('quickRatio', 'Quick Ratio', quickRatio, 1.0, 'min', 'เท่า', 'อัตราส่วนสินทรัพย์หมุนเวียนเร็วต่อหนี้สินหมุนเวียนสุทธิ ควรมีค่าตั้งแต่ 1.0 ขึ้นไป (เกณฑ์เป้าหมาย: ≥ 1.0 เท่า)');
                html += getMetricRowHtml('currentRatio', 'Current Ratio', currentRatio, 1.5, 'min', 'เท่า', 'อัตราส่วนสินทรัพย์หมุนเวียนต่อหนี้สินหมุนเวียนสุทธิ ควรมีค่าตั้งแต่ 1.5 ขึ้นไป (เกณฑ์เป้าหมาย: ≥ 1.5 เท่า)');
                liqContainer.innerHTML = html;
            }

            // Render Working Capital group as dynamic stacked bar rows
            const wcContainer = document.getElementById('workingCapitalBarsContainer');
            if (wcContainer) {
                let html = '';
                html += getMetricRowHtml('apDrugSuppliesDays', 'เจ้าหนี้ ยา / เวชภัณฑ์', apDrugSuppliesDays, 90, 'max', 'วัน', 'ระยะเวลาชำระหนี้เฉลี่ย เจ้าหนี้ ยา/เวชภัณฑ์ ไม่ควรเกิน 90 วัน (เกณฑ์เป้าหมาย: ≤ 90 วัน)');
                html += getMetricRowHtml('arUCDays', 'ลูกหนี้ สิทธิ UC', arUCDays, 60, 'max', 'วัน', 'ระยะเวลาเรียกเก็บหนี้ลูกหนี้ สิทธิ UC เฉลี่ยสะสม ไม่ควรเกิน 60 วัน (เกณฑ์เป้าหมาย: ≤ 60 วัน)');
                html += getMetricRowHtml('arCGDDays', 'ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง)', arCGDDays, 60, 'max', 'วัน', 'ระยะเวลาเรียกเก็บหนี้ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง) เฉลี่ยสะสม ไม่ควรเกิน 60 วัน (เกณฑ์เป้าหมาย: ≤ 60 วัน)');
                html += getMetricRowHtml('arSSSDays', 'ลูกหนี้ สิทธิประกันสังคม', arSSSDays, 60, 'max', 'วัน', 'ระยะเวลาเรียกเก็บหนี้ลูกหนี้ สิทธิประกันสังคม เฉลี่ยสะสม ไม่ควรเกิน 60 วัน (เกณฑ์เป้าหมาย: ≤ 60 วัน)');
                html += getMetricRowHtml('invDays', 'สินค้าคงคลัง', invDays, 60, 'max', 'วัน', 'ระยะเวลาสำรองคลังสินค้าคงคลังเฉลี่ย ไม่ควรเกิน 60 วัน (เกณฑ์เป้าหมาย: ≤ 60 วัน)');
                wcContainer.innerHTML = html;
            }

            // --- Card Selection Highlight and Event Binding ---
            if (typeof initDashMetricModalEvents === 'function') {
                initDashMetricModalEvents();
            }
            const statCards = document.querySelectorAll('#subView_financialHealth [data-dashmetric]');
            statCards.forEach(card => {
                const metric = card.getAttribute('data-dashmetric');

                // For static cards, apply standard borders so they all look identical and clean
                if (card.classList.contains('stat-card')) {
                    card.classList.remove('border-sky-500', 'bg-sky-50/20', 'border-transparent');
                    card.classList.add('border-slate-200');
                }

                if (!card.hasAttribute('data-has-click-listener')) {
                    card.setAttribute('data-has-click-listener', 'true');
                    card.addEventListener('click', () => {
                        if (typeof openDashMetricModal === 'function') {
                            openDashMetricModal(metric);
                        }
                    });
                }
            });
        }
    } else if (currentSubTab === 'cash_cycle') {
        renderCCCChart();
    } else if (currentSubTab === 'alerts') {
        renderAlerts();
    }
}

// Renderer: Dynamic Risk/Alert Boxes
function renderAlerts() {
    const alertsList = document.getElementById('dashAlertsList');
    if (!alertsList) return;

    if (monthlyResults.length === 0) {
        alertsList.innerHTML = `<div class="p-4 bg-slate-50 border rounded-xl text-center text-slate-500 font-bold">กรุณาอัปโหลดข้อมูลงบทดลองก่อน</div>`;
        return;
    }

    const latestMonth = monthlyResults[monthlyResults.length - 1];
    const alerts = [];

    // 1. AR risk checking
    if (latestMonth.result) {
        for (let fundId in latestMonth.result) {
            const fundConfig = FUNDS_CONFIG.find(f => f.id === fundId);
            const fundName = fundConfig ? fundConfig.name : fundId;

            for (let subId in latestMonth.result[fundId]) {
                const subConfig = fundConfig ? fundConfig.subgroups.find(s => s.id === subId) : null;
                const subName = subConfig ? subConfig.name : subId;

                const metrics = latestMonth.result[fundId][subId];
                if (metrics && metrics.collection_days > 120) {
                    alerts.push({
                        type: 'danger',
                        title: `วิกฤต: ระยะเวลาเก็บเงินสิทธิ์ [${fundName} - ${subName}] นานเกินไป`,
                        message: `ระยะเวลาเก็บหนี้เฉลี่ยสะสมขึ้นไปอยู่ที่ **${Math.round(metrics.collection_days)} วัน** (วิกฤต > 120 วัน) เสี่ยงต่อกระแสเงินสดหมุนเวียนติดขัด!`
                    });
                } else if (metrics && metrics.collection_days > 90) {
                    alerts.push({
                        type: 'warning',
                        title: `เฝ้าระวัง: ระยะเวลาเก็บหนี้สิทธิ์ [${fundName} - ${subName}] นานกว่ามาตรฐาน`,
                        message: `ปัจจุบันอยู่ที่ **${Math.round(metrics.collection_days)} วัน** (มาตรฐาน ≤ 60 วัน) ควรเร่งติดตามเรื่องใบเสร็จและยอดค้างรับ`
                    });
                }
            }
        }
    }

    // 2. INV inventory risk checking
    if (latestMonth.invResult && latestMonth.invResult.total) {
        for (let subId in latestMonth.invResult.total) {
            const subConfig = INV_CONFIG[0].subgroups.find(s => s.id === subId);
            const subName = subConfig ? subConfig.name : subId;

            const metrics = latestMonth.invResult.total[subId];
            if (metrics && metrics.collection_days > 90) {
                alerts.push({
                    type: 'warning',
                    title: `เตือน: คลังสินค้า [${subName}] สินค้าหมุนเวียนช้าสะสม (คลังจมทุน)`,
                    message: `สินค้าคงไว้ในโกดังเฉลี่ย **${Math.round(metrics.collection_days)} วัน** ก่อนการเบิกจ่ายส่งผลต่อโอกาสทุนจม`
                });
            }
        }
    }

    // 3. Personnel accruals (PR) risk checking
    const prCost = sumAccounts(latestMonth.tbData, '2102', true);
    if (prCost > 5000000) {
        alerts.push({
            type: 'warning',
            title: `เตือนสภาพคล่อง: ยอดภาระค่าบุคลากรค้างจ่ายสะสมมีระดับค่อนข้างสูง`,
            message: `ยอดค้างจ่ายอยู่ที่ **${prCost.toLocaleString('th-TH')} บาท** (ต้นทุนคงเกี่ยวกับบุคลากร) ควรตรวจสอบการชำระให้ตรงเวลาเพื่อลดความกังวลใจของพนักงาน`
        });
    }

    alertsList.innerHTML = '';
    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-4 shadow-sm animate-pulse">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h4 class="font-bold text-sm">ระบบความคลังดีเยี่ยม!</h4>
                    <p class="text-xs text-emerald-600 mt-0.5">ระบบวิเคราะห์อัจฉริยะไม่พบวิกฤตร้ายแรงด้านการเงิน ลูกหนี้ หรือคลังสินค้าจมทุนในขณะนี้</p>
                </div>
            </div>
        `;
    } else {
        alerts.forEach(alert => {
            const card = document.createElement('div');
            const iconColor = alert.type === 'danger' ? 'text-red-600 bg-red-100' : 'text-amber-600 bg-amber-100';
            const borderColor = alert.type === 'danger' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900';
            const iconSvg = alert.type === 'danger'
                ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

            card.className = `p-4 border rounded-xl flex items-start gap-3.5 shadow-sm transition-all hover:shadow-md ${borderColor}`;
            card.innerHTML = `
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${iconColor}">
                    ${iconSvg}
                </div>
                <div>
                    <h4 class="font-bold text-sm">${alert.title}</h4>
                    <p class="text-xs mt-1 leading-relaxed opacity-95">${alert.message}</p>
                </div>
            `;
            alertsList.appendChild(card);
        });
    }
}

// Renderer: Legacy Working Capital Dashboard Views
function renderDashboard() {
    const uploadEl = document.getElementById('uploadSection');
    const dashEl = document.getElementById('dashboardSection');
    const tabsMenuEl = document.getElementById('tabsMenu');
    const btnNewUploadEl = document.getElementById('btnNewUpload');
    const currentPeriodTextEl = document.getElementById('currentPeriodText');

    if (uploadEl) uploadEl.classList.add('hidden');
    if (dashEl) dashEl.classList.remove('hidden');
    if (tabsMenuEl) tabsMenuEl.classList.remove('hidden');
    if (btnNewUploadEl) btnNewUploadEl.classList.remove('hidden');

    const numFiles = monthlyResults.length;
    if (currentPeriodTextEl) currentPeriodTextEl.textContent = `วิเคราะห์ข้อมูลทั้งหมด ${numFiles} เดือน`;

    const latestEndIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;
    const latestMonth = monthlyResults[latestEndIdx];

    let activeFundName = '';
    let activeSubgroupName = '';
    let res = null;
    // วิธีประมาณการยอดเดบิตสะสมเมื่อข้อมูลเดือนย้อนหลังไม่เพียงพอ (ข้อมูลมีน้อยกว่า n เดือน)
    // สูตรประมาณการ: ยอดเดบิตสะสม n เดือน = (ผลรวมยอดเดบิตของทุกเดือนที่มี / จำนวนเดือนที่มี) * n
    // ตัวอย่าง: 
    // - ณ เดือนที่ 1 (Index 0): ยอดเดบิตสะสม 12 เดือน = ยอดเดบิตเดือนที่ 1 * 12
    // - ณ เดือนที่ 2 (Index 1): ยอดเดบิตสะสม 12 เดือน = ((ยอดเดบิตเดือนที่ 1 + ยอดเดบิตเดือนที่ 2) / 2) * 12
    if (currentTab === 'ar') {
        const conf = FUNDS_CONFIG.find(f => f.id === currentFund);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroup) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.result[currentFund]?.[currentSubgroup];
    } else if (currentTab === 'overdue_ar') {
        const conf = FUNDS_CONFIG.find(f => f.id === currentFund);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroup) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.overdueARResult?.[currentFund]?.[currentSubgroup];
    } else if (currentTab === 'ap') {
        const conf = AP_CONFIG.find(f => f.id === currentFundAP);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroupAP) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.apResult[currentFundAP]?.[currentSubgroupAP];
    } else if (currentTab === 'pr') {
        const conf = PR_CONFIG.find(f => f.id === currentFundPR);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroupPR) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.prResult[currentFundPR]?.[currentSubgroupPR];
    } else if (currentTab === 'inv') {
        const conf = INV_CONFIG.find(f => f.id === currentFundINV);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroupINV) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.invResult[currentFundINV]?.[currentSubgroupINV];
    } else if (currentTab === 'deadstock') {
        const conf = INV_CONFIG.find(f => f.id === currentFundINV);
        activeFundName = conf ? conf.name : '';
        const sub = conf ? conf.subgroups.find(s => s.id === currentSubgroupINV) : null;
        activeSubgroupName = sub ? sub.name : '';
        res = latestMonth.deadstockResult?.[currentFundINV]?.[currentSubgroupINV];
    }

    const arDashboardTitle = document.getElementById('arDashboardTitle');
    if (arDashboardTitle) {
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const mName = thaiMonths[latestMonth.dateObj.getMonth()];
        const yTh = latestMonth.dateObj.getFullYear() > 2500 ? latestMonth.dateObj.getFullYear() : latestMonth.dateObj.getFullYear() + 543;

        let titleHtml = `${activeFundName}`;
        if (activeSubgroupName && activeSubgroupName !== 'ภาพรวมทั้งหมด' && activeSubgroupName !== 'รวมทั้งหมด') {
            titleHtml += ` - ${activeSubgroupName}`;
        }

        arDashboardTitle.innerHTML = `<div class="flex items-center gap-2"><span class="w-2 h-6 bg-sky-500 rounded-full"></span>${titleHtml}</div><div class="text-xs text-slate-500 font-normal mt-1">ข้อมูลล่าสุด ณ ${mName} ${yTh}</div>`;
    }

    const wcMetricLabel = document.getElementById('wcMetricLabel');
    const wcMetricUnit = document.getElementById('wcMetricUnit');
    const resCollectionDaysEl = document.getElementById('resCollectionDays');
    if (resCollectionDaysEl) {
        if (currentTab === 'overdue_ar' || currentTab === 'deadstock') {
            const chartMetricSelect = document.getElementById('chartMetricSelect');
            const metricVal = chartMetricSelect ? chartMetricSelect.value : 'overdue_1y';

            let metricTitle = 'ลูกหนี้ค้างนาน 1 ปี';
            if (metricVal === 'overdue_1m') metricTitle = 'ลูกหนี้ค้างนาน 1 เดือน';
            else if (metricVal === 'overdue_3m') metricTitle = 'ลูกหนี้ค้างนาน 3 เดือน';
            else if (metricVal === 'overdue_6m') metricTitle = 'ลูกหนี้ค้างนาน 6 เดือน';
            else if (metricVal === 'overdue_2y') metricTitle = 'ลูกหนี้ค้างนาน 2 ปี';
            else if (metricVal === 'overdue_3y') metricTitle = 'ลูกหนี้ค้างนาน 3 ปี';

            if (currentTab === 'deadstock') {
                metricTitle = metricTitle.replace('ลูกหนี้ค้างนาน', 'ยอด Deadstock');
            }

            if (wcMetricLabel) wcMetricLabel.textContent = metricTitle + ':';
            if (wcMetricUnit) wcMetricUnit.textContent = 'บาท';

            const val = res ? res[metricVal] : null;
            if (val !== null && val !== undefined) {
                resCollectionDaysEl.textContent = formatAbbreviated(val);
            } else {
                resCollectionDaysEl.textContent = 'N/A';
            }
        } else {
            if (wcMetricLabel) wcMetricLabel.textContent = 'จำนวนวัน:';
            if (wcMetricUnit) wcMetricUnit.textContent = 'วัน';

            if (res && res.collection_days !== null && res.collection_days !== undefined) {
                resCollectionDaysEl.textContent = Math.round(res.collection_days);
            } else {
                resCollectionDaysEl.textContent = 'N/A';
            }
        }
    }

    renderLineChart();
    renderDetailTable();
    if (typeof renderWorkingCapitalExtraSection === 'function') {
        renderWorkingCapitalExtraSection(latestMonth);
    }
}

// Function: Render Calculation Breakdown Table under dashboard chart
function renderDashboardBreakdownTable(metric) {
    const container = document.getElementById('dashBreakdownTableContainer');
    const titleEl = document.getElementById('dashBreakdownTitle');
    const headerEl = document.getElementById('dashBreakdownHeader');
    const bodyEl = document.getElementById('dashBreakdownBody');

    if (!container || !headerEl || !bodyEl) return;

    if (monthlyResults.length === 0) {
        container.classList.add('hidden');
        return;
    }

    if (window.dashMetricActiveView === 'table') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }

    let titleText = "ตารางรายละเอียดคำนวณ";
    let headers = [];
    let rowsHtml = "";

    // Dynamic headers and mapping based on metric type
    if (metric === 'currentRatio') {
        titleText = "Current Ratio = (สินทรัพย์หมุนเวียน - บริจาค) / หนี้สินหมุนเวียนสุทธิ";
        headers = [
            "เดือน", "สินทรัพย์หมุนเวียน", "เงินบริจาค", "ตัวตั้ง (สินทรัพย์ปรับปรุง)",
            "หนี้สินหมุนเวียน", "ฝาก UC งบลงทุน", "เจ้าหนี้งบลงทุน",
            "เจ้าหนี้บริจาค", "ตัวหาร (หนี้สินปรับปรุง)", "ผลลัพธ์ Current Ratio"
        ];
    } else if (metric === 'quickRatio') {
        titleText = "Quick Ratio = สินทรัพย์หมุนเวียน / หนี้สินหมุนเวียนสุทธิ";
        headers = [
            "เดือน", "เงินสด", "ลูกหนี้ค่ารักษา", "ลูกหนี้อื่น", "รายได้ค้างรับ",
            "ตัวตั้ง (สินทรัพย์คล่องสูง)", "ตัวหาร (หนี้สินปรับปรุง)", "ผลลัพธ์ Quick Ratio"
        ];
    } else if (metric === 'cashRatio') {
        titleText = "Cash Ratio = เงินสด / หนี้สินหมุนเวียนสุทธิ";
        headers = [
            "เดือน", "เงินสด", "ตัวหาร (หนี้สินปรับปรุง)", "ผลลัพธ์ Cash Ratio"
        ];
    } else if (metric === 'nwc') {
        titleText = "Net Working Capital (NWC) = สินทรัพย์หมุนเวียน − หนี้สินหมุนเวียน";
        headers = [
            "เดือน", "สินทรัพย์หมุนเวียน", " หนี้สินหมุนเวียน", "ผลลัพธ์ NWC"
        ];
    } else if (metric === 'niDepr') {
        titleText = "รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI) = รวมรายได้ทั้งหมด  - รวมค่าใช้จ่ายทั้งหมด";
        headers = [
            "เดือน", "รวมรายได้ทั้งหมด", "รวมค่าใช้จ่ายทั้งหมด", "รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)"
        ];
    } else if (metric === 'netReserve') {
        titleText = "เงินบำรุงคงเหลือ (หักหนี้สินแล้ว)";
        headers = [
            "เดือน", "เงินบำรุงก่อนหัก (13 รหัสสินทรัพย์)", "ภาระหนี้สินเงินบำรุง", "เงินบำรุงคงเหลือสุทธิ"
        ];
    } else if (metric === 'ebitda') {
        titleText = "ตารางแสดงข้อมูลสรุป EBITDA รายเดือน";
        headers = [
            "เดือน", "รายได้รวม (ไม่รวมงบลงทุน)", "ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย)", "EBITDA"
        ];
    } else if (metric === 'operatingMargin') {
        titleText = "Operating Margin = EBITDA / รวมรายได้";
        headers = [
            "เดือน", "EBITDA", "รวมรายได้", "Operating Margin"
        ];
    } else if (metric === 'returnOnAsset') {
        titleText = "Return on Asset (ROA) = กำไรสุทธิ / รวมสินทรัพย์";
        headers = [
            "เดือน", "กำไรสุทธิ", "รวมสินทรัพย์", "Return on Asset (ROA)"
        ];
    } else if (metric === 'apDrugSuppliesDays') {
        titleText = "ระยะเวลาจ่ายหนี้ เจ้าหนี้ ยา / เวชภัณฑ์ = จำนวนวัน × เจ้าหนี้เฉลี่ย / ผลรวมเจ้าหนี้การค้ายาและเวชภัณฑ์มิใช่ยา";
        headers = [
            "เดือน",
            "ผลรวมเจ้าหนี้การค้ายาและเวชภัณฑ์มิใช่ยา",
            "เจ้าหนี้ต้นงวด",
            "เจ้าหนี้ปลายงวด",
            "เจ้าหนี้เฉลี่ย",
            "ระยะเวลาจ่ายหนี้"
        ];
    } else if (metric === 'apDrugSuppliesPeriodDays') {
        titleText = "ตารางรายละเอียดช่วงเวลา";
        headers = ["เดือน", "ช่วงเวลา"];
    } else if (metric === 'apDrugSuppliesPurchases') {
        titleText = window.dashUseMonthlyValue
            ? "ตารางรายละเอียดผลรวมเจ้าหนี้การค้า (ยอดซื้อรายเดือน)"
            : "ตารางรายละเอียดผลรวมเจ้าหนี้การค้า (ยอดซื้อสะสม)";
        headers = ["เดือน", window.dashUseMonthlyValue ? "ผลรวมเจ้าหนี้การค้า (ยอดซื้อรายเดือน)" : "ผลรวมเจ้าหนี้การค้า (ยอดซื้อสะสม)"];
    } else if (metric === 'apDrugSuppliesAvg') {
        titleText = "ตารางรายละเอียดเจ้าหนี้การค้าเฉลี่ย";
        headers = ["เดือน", "เจ้าหนี้การค้าเฉลี่ย"];
    } else if (metric === 'arUCDays') {
        titleText = "ระยะเวลาเก็บหนี้ ลูกหนี้ สิทธิ UC = จำนวนวันสะสม × ลูกหนี้เฉลี่ย (UC) / รายได้สะสม (UC)";
        headers = [
            "เดือน",
            "รายได้สะสม (UC)",
            "ลูกหนี้ต้นงวด (UC)",
            "ลูกหนี้ปลายงวด (UC)",
            "ลูกหนี้เฉลี่ย (UC)",
            "ระยะเวลาเก็บหนี้"
        ];
    } else if (metric === 'arUCPeriodDays') {
        titleText = "ตารางรายละเอียดช่วงเวลา";
        headers = ["เดือน", "ช่วงเวลา"];
    } else if (metric === 'arUCRev') {
        titleText = "ตารางรายละเอียดรายได้สิทธิ สุทธิ ตามสิทธิ UC (สะสม)";
        headers = ["เดือน", "รายได้สิทธิ สุทธิ UC (สะสม)"];
    } else if (metric === 'arUCAvgAR') {
        titleText = "ตารางรายละเอียดลูกหนี้เฉลี่ย สิทธิ UC";
        headers = ["เดือน", "ลูกหนี้เฉลี่ย สิทธิ UC"];
    } else if (metric === 'arCGDDays') {
        titleText = "ระยะเวลาเก็บหนี้ ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง) = จำนวนวันสะสม × ลูกหนี้เฉลี่ย (เบิกจ่ายตรง) / รายได้สะสม (เบิกจ่ายตรง)";
        headers = [
            "เดือน",
            "รายได้สะสม (เบิกจ่ายตรง)",
            "ลูกหนี้ต้นงวด (เบิกจ่ายตรง)",
            "ลูกหนี้ปลายงวด (เบิกจ่ายตรง)",
            "ลูกหนี้เฉลี่ย (เบิกจ่ายตรง)",
            "ระยะเวลาเก็บหนี้"
        ];
    } else if (metric === 'arCGDPeriodDays') {
        titleText = "ตารางรายละเอียดช่วงเวลา";
        headers = ["เดือน", "ช่วงเวลา"];
    } else if (metric === 'arCGDRev') {
        titleText = "ตารางรายละเอียดรายได้สิทธิ สุทธิ เบิกจ่ายตรง (สะสม)";
        headers = ["เดือน", "รายได้สิทธิ สุทธิ เบิกจ่ายตรง (สะสม)"];
    } else if (metric === 'arCGDAvgAR') {
        titleText = "ตารางรายละเอียดลูกหนี้เฉลี่ย เบิกจ่ายตรง";
        headers = ["เดือน", "ลูกหนี้เฉลี่ย เบิกจ่ายตรง"];
    } else if (metric === 'arSSSDays') {
        titleText = "ระยะเวลาเก็บหนี้ ลูกหนี้ สิทธิประกันสังคม = จำนวนวันสะสม × ลูกหนี้เฉลี่ย (ประกันสังคม) / รายได้สะสม (ประกันสังคม)";
        headers = [
            "เดือน",
            "รายได้สะสม (ประกันสังคม)",
            "ลูกหนี้ต้นงวด (ประกันสังคม)",
            "ลูกหนี้ปลายงวด (ประกันสังคม)",
            "ลูกหนี้เฉลี่ย (ประกันสังคม)",
            "ระยะเวลาเก็บหนี้"
        ];
    } else if (metric === 'arSSSPeriodDays') {
        titleText = "ตารางรายละเอียดช่วงเวลา";
        headers = ["เดือน", "ช่วงเวลา"];
    } else if (metric === 'arSSSRev') {
        titleText = "ตารางรายละเอียดรายได้สิทธิ สุทธิ ประกันสังคม (สะสม)";
        headers = ["เดือน", "รายได้สิทธิ สุทธิ ประกันสังคม (สะสม)"];
    } else if (metric === 'arSSSAvgAR') {
        titleText = "ตารางรายละเอียดลูกหนี้เฉลี่ย ประกันสังคม";
        headers = ["เดือน", "ลูกหนี้เฉลี่ย ประกันสังคม"];
    } else if (metric === 'invDays') {
        titleText = "ระยะเวลาขายคลัง สินค้าคงคลัง = จำนวนวันสะสม × สินค้าคงคลังเฉลี่ย / ต้นทุนยาและเวชภัณฑ์สะสม";
        headers = [
            "เดือน",
            "ต้นทุนยาและเวชภัณฑ์สะสม",
            "ยาคงคลังต้นงวด",
            "ยาคงคลังปลายงวด",
            "ยาคงคลังเฉลี่ย",
            "ระยะเวลาขายคลัง"
        ];
    } else if (metric === 'invPeriodDays') {
        titleText = "ตารางรายละเอียดช่วงเวลา";
        headers = ["เดือน", "ช่วงเวลา"];
    } else if (metric === 'invCostOfSales') {
        titleText = "ตารางรายละเอียดต้นทุนยาและเวชภัณฑ์ที่มิใช่ยา (สะสม)";
        headers = ["เดือน", "ต้นทุนยาและเวชภัณฑ์ที่มิใช่ยา (สะสม)"];
    } else if (metric === 'invAvg') {
        titleText = "ตารางรายละเอียดสินค้าคงคลังเฉลี่ย (ยา/เวชภัณฑ์คงคลังเฉลี่ย)";
        headers = ["เดือน", "สินค้าคงคลังเฉลี่ย"];
    } else if (metric === 'revenue_no_invest') {
        titleText = "ตารางรายละเอียดรายได้รวม (ไม่รวมงบลงทุน)";
        headers = ["เดือน", "รายได้รวม (ไม่รวมงบลงทุน)"];
    } else if (metric === 'expense_no_depr') {
        titleText = "ตารางรายละเอียดค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย) ";
        headers = ["เดือน", "ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย)"];
    } else if (metric === 'currentAssets') {
        titleText = "ตารางรายละเอียดสินทรัพย์หมุนเวียน";
        headers = ["เดือน", "สินทรัพย์หมุนเวียน"];
    } else if (metric === 'quickAssets') {
        titleText = "ตารางรายละเอียดสินทรัพย์หมุนเวียนเร็ว (ตัวตั้ง Quick Ratio)";
        headers = ["เดือน", "เงินสด", "ลูกหนี้ค่ารักษา", "ลูกหนี้อื่น", "รายได้ค้างรับ", "สินทรัพย์หมุนเวียนเร็ว"];
    } else if (metric === 'cashEquivalents') {
        titleText = "ตารางรายละเอียดเงินสดและรายการเทียบเท่าเงินสด";
        headers = ["เดือน", "เงินสดและรายการเทียบเท่าเงินสด"];
    } else if (metric === 'currentLiabilities') {
        titleText = "ตารางรายละเอียดหนี้สินหมุนเวียนปรับปรุง (ตัวหาร)";
        headers = ["เดือน", "หนี้สินหมุนเวียน", "ฝาก UC งบลงทุน", "เจ้าหนี้งบลงทุน", "เจ้าหนี้บริจาค", "หนี้สินหมุนเวียนปรับปรุง"];
    } else if (metric === 'a49') {
        titleText = "ตารางรายละเอียดรวมรายได้";
        headers = ["เดือน", "รวมรายได้"];
    } else if (metric === 'totalAssets') {
        titleText = "ตารางรายละเอียดรวมสินทรัพย์";
        headers = ["เดือน", "รวมสินทรัพย์"];
    } else if (metric === 'netProfit') {
        const labelRev = window.dashUseMonthlyValue ? "รายได้รวมรายเดือน" : "รายได้รวมสะสม (YTD)";
        const labelExp = window.dashUseMonthlyValue ? "รายจ่ายรวมรายเดือน" : "รายจ่ายรวมสะสม (YTD)";
        const labelProfit = window.dashUseMonthlyValue ? "กำไรสุทธิรายเดือน" : "กำไรสุทธิสะสม";
        titleText = window.dashUseMonthlyValue ? "ตารางรายละเอียดกำไรสุทธิรายเดือน" : "ตารางรายละเอียดกำไรสุทธิสะสม";
        headers = ["เดือน", labelRev, labelExp, labelProfit];
    } else {
        // revenue, expenses, netProfit, cash
        const labelRev = window.dashUseMonthlyValue ? "รายได้รวมรายเดือน" : "รายได้รวมสะสม (YTD)";
        const labelExp = window.dashUseMonthlyValue ? "รายจ่ายรวมรายเดือน" : "รายจ่ายรวมสะสม (YTD)";
        const labelProfit = window.dashUseMonthlyValue ? "กำไรสุทธิรายเดือน" : "กำไรสุทธิสะสม";
        titleText = window.dashUseMonthlyValue ? "ตารางแสดงข้อมูลสรุปทางบัญชีรายเดือน (รายเดือน)" : "ตารางแสดงข้อมูลสรุปทางบัญชีรายเดือน (สะสม YTD)";
        headers = [
            "เดือน", labelRev, labelExp, labelProfit, "เงินสดคงเหลือสะสม"
        ];
    }

    if (titleEl) titleEl.textContent = titleText;

    // Render Headers
    let headerHtml = "<tr>";
    headers.forEach((h, idx) => {
        const alignment = idx === 0 ? "text-left font-bold" : "text-right font-semibold";
        const cleanHeader = h.replace(/\s*\(A\d+[A-Z0-9\.]*\)$/i, "").trim();
        headerHtml += `<th class="px-4 py-3 border-b border-slate-200 ${alignment}">${cleanHeader}</th>`;
    });
    headerHtml += "</tr>";
    headerEl.innerHTML = headerHtml;

    // Render Rows
    monthlyResults.forEach(month => {
        const tbData = month.tbData;
        const dbRes = month.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(month, monthlyResults) : {
            currentRatio: 0, quickRatio: 0, cashRatio: 0, nwc: 0, netReserve: 0, operatingMargin: 0, returnOnAsset: 0,
            a119: 0, a1111040_3: 0, currentRatioNum: 0, a219: 0, a2122023: 0, a2111080: 0, a2111090: 0, ratioDenom: 0,
            a1111040_20: 0, a11211S: 0, a1122S: 0, a1141010: 0, quickRatioNum: 0, reserveBefore: 0, reserveLiabilities: 0,
            a529n: 0, a49: 0, a91d: 0, a1291: 0
        });

        let rev = sumAccounts(tbData, '4', true);
        let exp = sumAccounts(tbData, '5', false);
        let profit = rev - exp;
        const cash = sumAccounts(tbData, '1101', false);

        let revMgt = sumMgtAccount(tbData, 'E400S');
        let expMgt = sumMgtAccount(tbData, 'E500S');

        let arUCRev = dbRes.arUCRev || 0;
        let arCGDRev = dbRes.arCGDRev || 0;
        let arSSSRev = dbRes.arSSSRev || 0;
        let invCostOfSales = dbRes.invCostOfSales || 0;

        if (window.dashUseMonthlyValue) {
            const idx = monthlyResults.indexOf(month);
            if (idx > 0) {
                const prevMonth = monthlyResults[idx - 1];
                const getFiscalYear = (d) => {
                    const y = d.getFullYear();
                    const m = d.getMonth();
                    return m >= 9 ? y + 1 : y;
                };
                if (getFiscalYear(month.dateObj) === getFiscalYear(prevMonth.dateObj)) {
                    const prevTbData = prevMonth.tbData;
                    const prevRev = sumAccounts(prevTbData, '4', true);
                    const prevExp = sumAccounts(prevTbData, '5', false);
                    rev = rev - prevRev;
                    exp = exp - prevExp;
                    profit = rev - exp;

                    const prevRevMgt = sumMgtAccount(prevTbData, 'E400S');
                    const prevExpMgt = sumMgtAccount(prevTbData, 'E500S');
                    revMgt = revMgt - prevRevMgt;
                    expMgt = expMgt - prevExpMgt;

                    const prevDbRes = prevMonth.dashboardResult;
                    if (prevDbRes) {
                        arUCRev = arUCRev - (prevDbRes.arUCRev || 0);
                        arCGDRev = arCGDRev - (prevDbRes.arCGDRev || 0);
                        arSSSRev = arSSSRev - (prevDbRes.arSSSRev || 0);
                        invCostOfSales = invCostOfSales - (prevDbRes.invCostOfSales || 0);
                    }
                }
            }
        }

        let rowCols = [];
        if (metric === 'currentRatio') {
            rowCols = [
                month.monthStr,
                dbRes.a119.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a1111040_3.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.currentRatioNum.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a219.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a2122023.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a2111080.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a2111090.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.ratioDenom.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                preciseRound(dbRes.currentRatio)
            ];
        } else if (metric === 'quickRatio') {
            rowCols = [
                month.monthStr,
                dbRes.a1111040_20.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a11211S.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a1122S.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.a1141010.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.quickRatioNum.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.ratioDenom.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                preciseRound(dbRes.quickRatio)
            ];
        } else if (metric === 'cashRatio') {
            rowCols = [
                month.monthStr,
                dbRes.a1111040_20.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.ratioDenom.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                preciseRound(dbRes.cashRatio)
            ];
        } else if (metric === 'nwc') {
            rowCols = [
                month.monthStr,
                dbRes.currentRatioNum.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.ratioDenom.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.nwc.toLocaleString('th-TH', { maximumFractionDigits: 2 })
            ];
        } else if (metric === 'niDepr') {
            // คำนวณ NI (A91D) = รวมรายได้ทั้งหมด - รวมค่าใช้จ่ายทั้งหมด
            const isSingleBal = tbData.some(row => row.code && row.code.startsWith('CR_'));
            const a911s_row = sumMgtAccount(tbData, 'A911S', isSingleBal);
            const a912s_row = sumMgtAccount(tbData, 'A912S', isSingleBal);
            const a91d_row = sumMgtAccount(tbData, 'A91D', isSingleBal);
            rowCols = [
                month.monthStr,
                a911s_row.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                a912s_row.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                a91d_row.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'netReserve') {
            rowCols = [
                month.monthStr,
                dbRes.reserveBefore.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.reserveLiabilities.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                dbRes.netReserve.toLocaleString('th-TH', { maximumFractionDigits: 2 })
            ];
        } else if (metric === 'ebitda') {
            // EBITDA calculation details
            const ebitdaVal = sumMgtAccount(tbData, 'EBITDA');
            const revMgt = sumMgtAccount(tbData, 'E400S');
            const expMgt = sumMgtAccount(tbData, 'E500S');
            rowCols = [
                month.monthStr,
                revMgt.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                expMgt.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                ebitdaVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'operatingMargin') {
            rowCols = [
                month.monthStr,
                (dbRes.ebitdaVal || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.a49 || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                ((dbRes.operatingMargin || 0) * 100).toFixed(2) + ' %'
            ];
        } else if (metric === 'returnOnAsset') {
            rowCols = [
                month.monthStr,
                (dbRes.a91d || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.a1291 || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                ((dbRes.returnOnAsset || 0) * 100).toFixed(2) + ' %'
            ];
        } else if (metric === 'apDrugSuppliesDays') {
            const apAvg = (dbRes.apDrugSuppliesStart + dbRes.apDrugSuppliesEnd) / 2;
            let pVal = dbRes.apDrugSuppliesPurchases || 0;
            let apDays = dbRes.apDrugSuppliesDays || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.apDrugSuppliesStart || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.apDrugSuppliesEnd || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                apAvg.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                Math.round(apDays || 0) + ' วัน'
            ];
        } else if (metric === 'apDrugSuppliesPeriodDays') {
            rowCols = [
                month.monthStr,
                Math.round(dbRes.apDrugSuppliesPeriodDays || 0) + ' วัน'
            ];
        } else if (metric === 'apDrugSuppliesPurchases') {
            let pVal = dbRes.apDrugSuppliesPurchases || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'apDrugSuppliesAvg') {
            rowCols = [
                month.monthStr,
                (dbRes.apDrugSuppliesAvg || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arUCDays') {
            let pVal = dbRes.arUCRev || 0;
            let arDays = dbRes.arUCDays || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arUCStartAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arUCEndAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arUCAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                Math.round(arDays || 0) + ' วัน'
            ];
        } else if (metric === 'arUCPeriodDays') {
            rowCols = [
                month.monthStr,
                Math.round(dbRes.arUCPeriodDays || 0) + ' วัน'
            ];
        } else if (metric === 'arUCRev') {
            let pVal = dbRes.arUCRev || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arUCAvgAR') {
            rowCols = [
                month.monthStr,
                (dbRes.arUCAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arCGDDays') {
            let pVal = dbRes.arCGDRev || 0;
            let arDays = dbRes.arCGDDays || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arCGDStartAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arCGDEndAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arCGDAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                Math.round(arDays || 0) + ' วัน'
            ];
        } else if (metric === 'arCGDPeriodDays') {
            rowCols = [
                month.monthStr,
                Math.round(dbRes.arCGDPeriodDays || 0) + ' วัน'
            ];
        } else if (metric === 'arCGDRev') {
            let pVal = dbRes.arCGDRev || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arCGDAvgAR') {
            rowCols = [
                month.monthStr,
                (dbRes.arCGDAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arSSSDays') {
            let pVal = dbRes.arSSSRev || 0;
            let arDays = dbRes.arSSSDays || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arSSSStartAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arSSSEndAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.arSSSAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                Math.round(arDays || 0) + ' วัน'
            ];
        } else if (metric === 'arSSSPeriodDays') {
            rowCols = [
                month.monthStr,
                Math.round(dbRes.arSSSPeriodDays || 0) + ' วัน'
            ];
        } else if (metric === 'arSSSRev') {
            let pVal = dbRes.arSSSRev || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'arSSSAvgAR') {
            rowCols = [
                month.monthStr,
                (dbRes.arSSSAvgAR || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'invDays') {
            let pVal = dbRes.invCostOfSales || 0;
            let invDays = dbRes.invDays || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.invBalanceStart || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.invBalanceEnd || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                (dbRes.invAvg || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                Math.round(invDays || 0) + ' วัน'
            ];
        } else if (metric === 'invPeriodDays') {
            rowCols = [
                month.monthStr,
                Math.round(dbRes.invPeriodDays || 0) + ' วัน'
            ];
        } else if (metric === 'invCostOfSales') {
            let pVal = dbRes.invCostOfSales || 0;
            rowCols = [
                month.monthStr,
                pVal.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'invAvg') {
            rowCols = [
                month.monthStr,
                (dbRes.invAvg || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'revenue_no_invest') {
            rowCols = [
                month.monthStr,
                revMgt.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'expense_no_depr') {
            rowCols = [
                month.monthStr,
                expMgt.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'currentAssets') {
            rowCols = [
                month.monthStr,
                (dbRes.a119 || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'quickAssets') {
            rowCols = [
                month.monthStr,
                dbRes.a1111040_20.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a11211S.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a1122S.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a1141010.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.quickRatioNum.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'cashEquivalents') {
            rowCols = [
                month.monthStr,
                dbRes.a1111040_20.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'currentLiabilities') {
            rowCols = [
                month.monthStr,
                dbRes.a219.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a2122023.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a2111080.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.a2111090.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                dbRes.ratioDenom.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'a49') {
            rowCols = [
                month.monthStr,
                (dbRes.a49 || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'totalAssets') {
            rowCols = [
                month.monthStr,
                (dbRes.a1291 || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else if (metric === 'netProfit') {
            const isSingleBal = tbData.some(row => row.code && row.code.startsWith('CR_'));
            let r911 = sumMgtAccount(tbData, 'A911S', isSingleBal);
            let e912 = sumMgtAccount(tbData, 'A912S', isSingleBal);
            let p91 = sumMgtAccount(tbData, 'A91D', isSingleBal);

            rowCols = [
                month.monthStr,
                r911.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                e912.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท',
                p91.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'
            ];
        } else {
            // revenue, expenses, netProfit, cash
            rowCols = [
                month.monthStr,
                rev.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                exp.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                profit.toLocaleString('th-TH', { maximumFractionDigits: 2 }),
                cash.toLocaleString('th-TH', { maximumFractionDigits: 2 })
            ];
        }

        let rHtml = `<tr class="hover:bg-slate-50 border-b border-slate-100 text-slate-700">`;
        rowCols.forEach((col, idx) => {
            const alignment = idx === 0 ? "text-left font-bold" : "text-right font-mono";
            rHtml += `<td class="px-4 py-3 ${alignment}">${col}</td>`;
        });
        rHtml += "</tr>";
        rowsHtml += rHtml;
    });

    bodyEl.innerHTML = rowsHtml;
}

function updateModalMetricView(metric) {
    window.activeDashboardMetric = metric;

    const subtitleEl = document.getElementById('dashMetricModalSubtitle');
    const metricNames = {
        operatingMargin: "Operating Margin (อัตรากำไรจากการดำเนินงานสะสม)",
        returnOnAsset: "Return on Asset (ROA - อัตราผลตอบแทนต่อสินทรัพย์สะสม)",
        ebitda: "EBITDA (กำไรสะสมก่อนดอกเบี้ย ภาษี ค่าเสื่อมราคา และค่าตัดจำหน่าย)",
        nwc: "Net Working Capital (ทุนสำรองสุทธิ)",
        niDepr: "รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)",
        quickRatio: "Quick Ratio (อัตราส่วนกระแสรายรับสะสม)",
        currentRatio: "Current Ratio (อัตราส่วนสภาพคล่องสะสม)",
        cashRatio: "Cash Ratio (อัตราส่วนเงินสดสะสม)",
        apDrugSuppliesDays: "ระยะเวลาชำระหนี้เฉลี่ย เจ้าหนี้ ยา / เวชภัณฑ์",
        apDrugSuppliesPeriodDays: "ช่วงเวลา",
        apDrugSuppliesPurchases: window.dashUseMonthlyValue ? "ผลรวมเจ้าหนี้การค้า (ยอดซื้อรายเดือน)" : "ผลรวมเจ้าหนี้การค้า (ยอดซื้อสะสม)",
        apDrugSuppliesAvg: "เจ้าหนี้การค้าเฉลี่ย",
        arUCDays: "ระยะเวลาเรียกเก็บหนี้ลูกหนี้ สิทธิ UC เฉลี่ยสะสม",
        arUCPeriodDays: "ช่วงเวลา",
        arUCRev: "รายได้สิทธิ UC (สะสม)",
        arUCAvgAR: "ลูกหนี้เฉลี่ย UC",
        arCGDDays: "ระยะเวลาเรียกเก็บหนี้ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง) เฉลี่ยสะสม",
        arCGDPeriodDays: "ช่วงเวลา",
        arCGDRev: "รายได้สิทธิ เบิกจ่ายตรง (สะสม)",
        arCGDAvgAR: "ลูกหนี้เฉลี่ย เบิกจ่ายตรง",
        arSSSDays: "ระยะเวลาเรียกเก็บหนี้ลูกหนี้ สิทธิประกันสังคม เฉลี่ยสะสม",
        arSSSPeriodDays: "ช่วงเวลา",
        arSSSRev: "รายได้สิทธิ ประกันสังคม (สะสม)",
        arSSSAvgAR: "ลูกหนี้เฉลี่ย ประกันสังคม",
        invDays: "ระยะเวลาสำรองคลังสินค้าคงคลังเฉลี่ย",
        invPeriodDays: "ช่วงเวลา",
        invCostOfSales: "ต้นทุนยาและเวชภัณฑ์ที่มิใช่ยา (สะสม)",
        invAvg: "ยาและเวชภัณฑ์คงคลังเฉลี่ย",
        revenue_no_invest: "รายได้รวม (ไม่รวมงบลงทุน)",
        expense_no_depr: "ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย)",
        currentAssets: "รวม สินทรัพย์หมุนเวียน",
        quickAssets: "สินทรัพย์หมุนเวียนเร็ว",
        cashEquivalents: "รวมเงินสดและรายการเทียบเท่าเงินสดไม่รวมเงินบริจาค",
        currentLiabilities: "หนี้สินหมุนเวียนปรับปรุง",
        a49: "รวมรายได้",
        totalAssets: "รวมสินทรัพย์",
        netProfit: "กำไรสุทธิสะสม",
        reserveLiabilities: "ภาระหนี้สิน(เงินบำรุง)",
        reserveBefore: "เงินบำรุงคงเหลือ",
        currentRatioNum: "สินทรัพย์หมุนเวียน (ปรับปรุง)",
        ratioDenom: "หนี้สินหมุนเวียน (ปรับปรุง)",
        a1111040_3: "เงินฝากคลัง/เงินฝากนอกงบประมาณวัตถุประสงค์ (เงินบริจาค)",
        a219: "รวม หนี้สินหมุนเวียน",
        a2122023: "เงินรับฝากองทุน UC-งบลงทุน",
        a2111080: "เจ้าหนี้- งบลงทุน UC",
        a2111090: "เจ้าหนี้- เงินบริจาค",
        a11211S: "รวมลูกหนี้ค่ารักษาพยาบาล",
        a1122S: "รวมลูกหนี้อื่น",
        a1141010: "รายได้ค้างรับ"
    };
    const titleEl = document.getElementById('dashFinancialChartTitle');
    if (titleEl) {
        titleEl.textContent = metricNames[metric] || "แนวโน้มสุขภาพทางการเงิน";
    }
    if (subtitleEl) {
        subtitleEl.textContent = "แสดงกราฟทิศทางและตารางรายละเอียดคำนวณสะสมรายเดือน";
    }

    // Render chart and table
    if (typeof renderFinancialHealthChart === 'function') {
        renderFinancialHealthChart();
    }
    renderDashboardBreakdownTable(metric);
}

function openDashMetricModal(metric) {
    const modal = document.getElementById('dashMetricModal');
    if (!modal) return;

    window.dashMetricActiveView = 'graph';

    // Group definition & logic for dropdown select
    const metricGroups = {
        operatingMargin: [
            { value: 'operatingMargin', label: 'Operating Margin' },
            { value: 'ebitda', label: 'EBITDA' },
            { value: 'a49', label: 'รวมรายได้' }
        ],
        ebitda: [
            { value: 'ebitda', label: 'EBITDA' },
            { value: 'revenue_no_invest', label: 'รายได้รวม (ไม่รวมงบลงทุน)' },
            { value: 'expense_no_depr', label: 'ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย)' }
        ],
        returnOnAsset: [
            { value: 'returnOnAsset', label: 'Return on Asset (ROA)' },
            { value: 'netProfit', label: 'กำไรสุทธิสะสม' },
            { value: 'totalAssets', label: 'รวมสินทรัพย์' }
        ],
        currentRatio: [
            { value: 'currentRatio', label: 'Current Ratio' },
            { value: 'currentAssets', label: 'สินทรัพย์หมุนเวียน' },
            { value: 'a1111040_3', label: 'เงินฝากคลัง' },
            { value: 'a219', label: 'หนี้สินหมุนเวียน' },
            { value: 'a2122023', label: 'เงินรับฝากกองทุน UC' },
            { value: 'a2111080', label: 'เจ้าหนี้-งบลงทุน UC' },
            { value: 'a2111090', label: 'เจ้าหนี้-เงินบริจาค' }
        ],
        quickRatio: [
            { value: 'quickRatio', label: 'Quick Ratio' },
            { value: 'cashEquivalents', label: 'เงินสด' },
            { value: 'a11211S', label: 'ลูกหนี้ค่ารักษา' },
            { value: 'a1122S', label: 'ลูกหนี้อื่น' },
            { value: 'a1141010', label: 'รายได้ค้างรับ' },
            { value: 'a219', label: 'หนี้สินหมุนเวียน' },
            { value: 'a2122023', label: 'เงินรับฝาก UC' },
            { value: 'a2111080', label: 'เจ้าหนี้-งบลงทุน UC' },
            { value: 'a2111090', label: 'เจ้าหนี้-เงินบริจาค' }
        ],
        cashRatio: [
            { value: 'cashRatio', label: 'Cash Ratio' },
            { value: 'cashEquivalents', label: 'เงินสด' },
            { value: 'a219', label: 'หนี้สินหมุนเวียน' },
            //{ value: 'a2122023', label: 'เงินรับฝากองทุน UC-งบลงทุน' },
            //{ value: 'a2111080', label: 'เจ้าหนี้-งบลงทุน UC' },
            //{ value: 'a2111090', label: 'เจ้าหนี้-เงินบริจาค' }
        ],
        nwc: [
            { value: 'nwc', label: 'Net Working Capital (NWC)' },
            //{ value: 'currentRatioNum', label: 'สินทรัพย์หมุนเวียน (ปรับปรุง)' },
            //{ value: 'ratioDenom', label: 'หนี้สินหมุนเวียน (ปรับปรุง)' }

            { value: 'currentAssets', label: 'สินทรัพย์หมุนเวียน' },
            { value: 'a219', label: 'หนี้สินหมุนเวียน' }
        ],
        niDepr: [
            { value: 'niDepr', label: 'กำไรสุทธิ (NI)' },
            { value: 'a911s', label: 'รวมรายได้ทั้งหมด' },
            { value: 'a912s', label: 'รวมค่าใช้จ่ายทั้งหมด' }
        ],
        apDrugSuppliesDays: [
            { value: 'apDrugSuppliesDays', label: 'ระยะเวลาจ่ายหนี้ เจ้าหนี้ ยา / เวชภัณฑ์' },
            { value: 'apDrugSuppliesPeriodDays', label: 'ช่วงเวลา' },
            { value: 'apDrugSuppliesAvg', label: 'เจ้าหนี้การค้าเฉลี่ย' },
            { value: 'apDrugSuppliesPurchases', label: 'ผลรวมเจ้าหนี้การค้า' }
        ],
        arUCDays: [
            { value: 'arUCDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้ UC' },
            { value: 'arUCPeriodDays', label: 'ช่วงเวลา' },
            { value: 'arUCAvgAR', label: 'ลูกหนี้เฉลี่ย' },
            { value: 'arUCRev', label: 'รายได้' }
        ],
        arCGDDays: [
            { value: 'arCGDDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้เบิกจ่ายตรง' },
            { value: 'arCGDPeriodDays', label: 'ช่วงเวลา' },
            { value: 'arCGDAvgAR', label: 'ลูกหนี้เฉลี่ย' },
            { value: 'arCGDRev', label: 'รายได้' }
        ],
        arSSSDays: [
            { value: 'arSSSDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้สิทธิประกันสังคม' },
            { value: 'arSSSPeriodDays', label: 'ช่วงเวลา' },
            { value: 'arSSSAvgAR', label: 'ลูกหนี้เฉลี่ย' },
            { value: 'arSSSRev', label: 'รายได้' }
        ],
        invDays: [
            { value: 'invDays', label: 'ระยะเวลาหมุนเวียนสินค้าคงคลัง' },
            { value: 'invPeriodDays', label: 'ช่วงเวลา' },
            { value: 'invAvg', label: 'ยาและเวชภัณฑ์มิใช่คงคลังเฉลี่ย' },
            { value: 'invCostOfSales', label: 'ต้นทุนยาและเวชภัณฑ์ที่มิใช่ยา' }
        ],
        workingCapital: [
            { value: 'apDrugSuppliesDays', label: 'ระยะเวลาจ่ายหนี้ยา / เวชภัณฑ์' },
            { value: 'arUCDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้ สิทธิ UC' },
            { value: 'arCGDDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง)' },
            { value: 'arSSSDays', label: 'ระยะเวลาเก็บหนี้ลูกหนี้ สิทธิประกันสังคม' },
            { value: 'invDays', label: 'ระยะเวลาหมุนเวียนสินค้าคงคลัง' }
        ]
    };

    const metricToGroupKey = {
        operatingMargin: 'operatingMargin',
        ebitda: 'ebitda',
        revenue_no_invest: 'ebitda',
        expense_no_depr: 'ebitda',
        a49: 'operatingMargin',

        returnOnAsset: 'returnOnAsset',
        netProfit: 'returnOnAsset',
        totalAssets: 'returnOnAsset',

        currentRatio: 'currentRatio',
        quickRatio: 'quickRatio',
        cashRatio: 'cashRatio',
        nwc: 'nwc',
        niDepr: 'niDepr',
        a911s: 'niDepr',
        a912s: 'niDepr',
        currentAssets: 'currentRatio',
        quickAssets: 'quickRatio',
        cashEquivalents: 'cashRatio',
        currentLiabilities: 'currentRatio',

        currentRatioNum: 'nwc',
        ratioDenom: 'nwc',
        a1111040_3: 'currentRatio',
        a219: 'currentRatio',
        a2122023: 'currentRatio',
        a2111080: 'currentRatio',
        a2111090: 'currentRatio',
        a11211S: 'quickRatio',
        a1122S: 'quickRatio',
        a1141010: 'quickRatio',

        apDrugSuppliesDays: 'apDrugSuppliesDays',
        apDrugSuppliesPeriodDays: 'apDrugSuppliesDays',
        apDrugSuppliesPurchases: 'apDrugSuppliesDays',
        apDrugSuppliesAvg: 'apDrugSuppliesDays',

        arUCDays: 'arUCDays',
        arUCPeriodDays: 'arUCDays',
        arUCRev: 'arUCDays',
        arUCAvgAR: 'arUCDays',

        arCGDDays: 'arCGDDays',
        arCGDPeriodDays: 'arCGDDays',
        arCGDRev: 'arCGDDays',
        arCGDAvgAR: 'arCGDDays',

        arSSSDays: 'arSSSDays',
        arSSSPeriodDays: 'arSSSDays',
        arSSSRev: 'arSSSDays',
        arSSSAvgAR: 'arSSSDays',

        invDays: 'invDays',
        invPeriodDays: 'invDays',
        invCostOfSales: 'invDays',
        invAvg: 'invDays'
    };

    const groupKey = metricToGroupKey[metric];
    const selectContainer = document.getElementById('modalSubMetricSelectorContainer');
    const selectEl = document.getElementById('modalSubMetricCheckboxList');

    const groupOperators = {
        operatingMargin: [" = ", " / "],
        ebitda: [" = ", " - "],
        returnOnAsset: [" = ", " / "],
        currentRatio: [" = ( ", " - ", " ) / ( ", " - ", " - ", " - ", " )"],
        quickRatio: [" = ( ", " + ", " + ", " + ", " ) / ( ", " - ", " - ", " - ", " )"],
        cashRatio: [" = ", " / " ],
        //cashRatio: [" = ", " / ( ", " - ", " - ", " - ", " )"],
        nwc: [" = ", " - "],
        niDepr: [" = ", " - "],
        apDrugSuppliesDays: [" = ", " × ", " / "],
        arUCDays: [" = ", " × ", " / "],
        arCGDDays: [" = ", " × ", " / "],
        arSSSDays: [" = ", " × ", " / "],
        invDays: [" = ", " × ", " / "],
        workingCapital: [" vs ", " vs ", " vs ", " vs "]
    };

    if (groupKey && metricGroups[groupKey] && selectContainer && selectEl) {
        selectEl.innerHTML = '';
        window.activeDashboardMetrics = [metric];

        const pillColors = {
            revenue: "#10B981", expenses: "#EF4444", netProfit: "#3B82F6", cash: "#6366F1",
            currentRatio: "#2563EB", quickRatio: "#7C3AED", cashRatio: "#D97706",
            nwc: "#0D9488", netReserve: "#059669", ebitda: "#8B5CF6",
            niDepr: "#6D28D9", a911s: "#10B981", a912s: "#EF4444",
            operatingMargin: "#0D9488", returnOnAsset: "#EC4899",
            apDrugSuppliesDays: "#F59E0B", apDrugSuppliesPeriodDays: "#8B5CF6", apDrugSuppliesPurchases: "#10B981", apDrugSuppliesAvg: "#EC4899",
            arUCDays: "#3B82F6", arUCPeriodDays: "#8B5CF6", arUCRev: "#10B981", arUCAvgAR: "#EC4899",
            arCGDDays: "#06B6D4", arCGDPeriodDays: "#8B5CF6", arCGDRev: "#10B981", arCGDAvgAR: "#EC4899",
            arSSSDays: "#6366F1", arSSSPeriodDays: "#8B5CF6", arSSSRev: "#10B981", arSSSAvgAR: "#EC4899",
            invDays: "#E11D48", invPeriodDays: "#8B5CF6", invCostOfSales: "#10B981", invAvg: "#EC4899",
            revenue_no_invest: "#10B981", expense_no_depr: "#EF4444", currentAssets: "#0284C7", quickAssets: "#7C3AED",
            cashEquivalents: "#6366F1", currentLiabilities: "#F59E0B", a49: "#06B6D4",
            totalAssets: "#F59E0B", reserveLiabilities: "#F59E0B", reserveBefore: "#10B981",
            a1111040_3: "#D97706", a219: "#EF4444", a2122023: "#6366F1",
            a2111080: "#7C3AED", a2111090: "#EC4899", a11211S: "#2563EB",
            a1122S: "#0D9488", a1141010: "#06B6D4"
        };

        const operators = groupOperators[groupKey] || [];

        metricGroups[groupKey].forEach((opt, idx) => {
            const isPeriodDays = ['apDrugSuppliesPeriodDays', 'arUCPeriodDays', 'arCGDPeriodDays', 'arSSSPeriodDays', 'invPeriodDays'].includes(opt.value);
            const btn = document.createElement(isPeriodDays ? 'div' : 'button');
            btn.setAttribute('data-opt-val', opt.value);
            if (!isPeriodDays) {
                btn.type = 'button';
            }

            const updateBtnStyle = (bEl, val) => {
                const isSelected = window.activeDashboardMetrics.includes(val);
                const itemColor = pillColors[val] || '#0284C7';
                if (['apDrugSuppliesPeriodDays', 'arUCPeriodDays', 'arCGDPeriodDays', 'arSSSPeriodDays', 'invPeriodDays'].includes(val)) {
                    bEl.className = "px-1.5 py-1.5 text-[11px] font-black select-none";
                    bEl.style.backgroundColor = 'transparent';
                    bEl.style.borderColor = 'transparent';
                    bEl.style.color = '#475569';
                    bEl.style.cursor = 'default';
                } else {
                    bEl.className = "px-3 py-1.5 rounded-xl border-2 text-[11px] font-bold shadow-sm transition-all cursor-pointer select-none transform hover:scale-105 active:scale-95 duration-100";
                    if (isSelected) {
                        bEl.style.backgroundColor = itemColor;
                        bEl.style.borderColor = itemColor;
                        bEl.style.color = '#ffffff';
                    } else {
                        bEl.style.backgroundColor = '#f8fafc';
                        bEl.style.borderColor = itemColor + '40'; // ~25% opacity
                        bEl.style.color = itemColor;
                    }
                }
            };

            updateBtnStyle(btn, opt.value);
            btn.textContent = opt.label;

            if (!isPeriodDays) {
                btn.addEventListener('click', () => {
                    let selected = [...window.activeDashboardMetrics];
                    const optVal = opt.value;
                    if (selected.includes(optVal)) {
                        selected = selected.filter(v => v !== optVal);
                    } else {
                        selected.push(optVal);
                    }
                    window.activeDashboardMetrics = selected;

                    const buttons = selectEl.querySelectorAll('[data-opt-val]');
                    buttons.forEach(b => {
                        updateBtnStyle(b, b.getAttribute('data-opt-val'));
                    });

                    updateModalMetricView(window.activeDashboardMetrics[0] || metric);
                });

                btn.addEventListener('mouseenter', () => {
                    if (window.dashFinancialChartInstance) {
                        const ds = window.dashFinancialChartInstance.data.datasets.find(d => d.metricKey === opt.value);
                        if (ds) ds.isHovered = true;
                    }
                });

                btn.addEventListener('mouseleave', () => {
                    if (window.dashFinancialChartInstance) {
                        const ds = window.dashFinancialChartInstance.data.datasets.find(d => d.metricKey === opt.value);
                        if (ds) ds.isHovered = false;
                    }
                });
            }

            selectEl.appendChild(btn);

            if (operators[idx]) {
                const opSpan = document.createElement('span');
                opSpan.className = "text-slate-500 font-black text-[12px] px-1 select-none font-mono";
                opSpan.textContent = operators[idx];
                selectEl.appendChild(opSpan);
            }
        });



        selectContainer.classList.remove('hidden');
    } else if (selectContainer) {
        selectContainer.classList.add('hidden');
    }

    updateModalMetricView(metric);

    // Reset toggle buttons to Graph view
    const showGraphBtn = document.getElementById('dashMetricShowGraphBtn');
    const showTableBtn = document.getElementById('dashMetricShowTableBtn');
    const graphContainer = document.getElementById('dashMetricGraphContainer');
    const tableContainer = document.getElementById('dashBreakdownTableContainer');

    if (showGraphBtn && showTableBtn && graphContainer && tableContainer) {
        showGraphBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none";
        showTableBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none";
        graphContainer.classList.remove('hidden');
        tableContainer.classList.add('hidden');
    }

    // Open Modal (show and scale up)
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.firstElementChild?.classList.remove('scale-95');
        modal.firstElementChild?.classList.add('scale-100');
    }, 50);

    // Populate and wrap start/end month selects in the modal header
    if (typeof initGlobalDateRangeFilter === 'function') {
        initGlobalDateRangeFilter();
    }
}

function closeDashMetricModal() {
    const modal = document.getElementById('dashMetricModal');
    if (!modal) return;
    modal.firstElementChild?.classList.remove('scale-100');
    modal.firstElementChild?.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 150);
}

function initDashMetricModalEvents() {
    if (window.hasDashMetricModalEvents) return;

    const modal = document.getElementById('dashMetricModal');
    const closeBtn = document.getElementById('dashMetricModalCloseBtn');
    const closeBtnSec = document.getElementById('dashMetricModalCloseBtnSecondary');

    if (closeBtn) closeBtn.addEventListener('click', closeDashMetricModal);
    if (closeBtnSec) closeBtnSec.addEventListener('click', closeDashMetricModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDashMetricModal();
        });
    }

    // Toggle view buttons
    const showGraphBtn = document.getElementById('dashMetricShowGraphBtn');
    const showTableBtn = document.getElementById('dashMetricShowTableBtn');
    const graphContainer = document.getElementById('dashMetricGraphContainer');
    const tableContainer = document.getElementById('dashBreakdownTableContainer');

    if (showGraphBtn && showTableBtn && graphContainer && tableContainer) {
        showGraphBtn.addEventListener('click', () => {
            window.dashMetricActiveView = 'graph';
            showGraphBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none";
            showTableBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none";
            graphContainer.classList.remove('hidden');
            tableContainer.classList.add('hidden');
        });

        showTableBtn.addEventListener('click', () => {
            window.dashMetricActiveView = 'table';
            showTableBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm bg-white text-indigo-700 focus:outline-none";
            showGraphBtn.className = "px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-800 focus:outline-none";
            graphContainer.classList.add('hidden');
            tableContainer.classList.remove('hidden');
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeDashMetricModal();
        }
    });

    window.hasDashMetricModalEvents = true;
}
