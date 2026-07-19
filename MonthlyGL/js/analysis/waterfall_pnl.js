// ==========================================================
// ส่วนจัดการงบกำไรขาดทุนแบบขั้นบันได (Waterfall Income Statement)
// ==========================================================

window.waterfallChartInstance = null;
window.waterfallTrendChartInstance = null;
window.waterfallProportionChartInstance = null;
let activeWaterfallTrendCode = 'A91D';
let activeWaterfallTrendLabel = 'รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)';
let waterfallTrendPulseFrame = null;
let waterfallTrendPulseOffset = 0;

const waterfallColorsMap = {
    'A419S': { line: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)', barBg: 'rgba(13, 148, 136, 0.85)', border: '#0d9488' },
    'A4201010': { line: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)', barBg: 'rgba(20, 184, 166, 0.85)', border: '#14b8a6' },
    'A49': { line: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', barBg: 'rgba(37, 99, 235, 0.85)', border: '#2563eb' },
    'A5009N': { line: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)', barBg: 'rgba(225, 29, 72, 0.85)', border: '#e11d48' },
    'A501D': { line: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', barBg: 'rgba(59, 130, 246, 0.85)', border: '#3b82f6' },
    'A519N': { line: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', barBg: 'rgba(244, 63, 94, 0.85)', border: '#f43f5e' },
    'A529N': { line: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', barBg: 'rgba(79, 70, 229, 0.85)', border: '#4f46e5' },
    'A9010S': { line: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.1)', barBg: 'rgba(45, 212, 191, 0.85)', border: '#2dd4bf' },
    'A60SS': { line: '#fb7185', bg: 'rgba(251, 113, 133, 0.1)', barBg: 'rgba(251, 113, 133, 0.85)', border: '#fb7185' },
    'A91N': { line: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)', barBg: 'rgba(129, 140, 248, 0.85)', border: '#818cf8' }, // NI before depr
    'DEPR_CALC': { line: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', barBg: 'rgba(245, 158, 11, 0.85)', border: '#f59e0b' }, // Depreciation
    'A91D': { line: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', barBg: 'rgba(99, 102, 241, 0.9)', border: '#6366f1' } // NI after depr
};

const waterfallItemsMap = [
    { code: 'A419S', label: 'รวมรายได้ค่ารักษาพยาบาล' },
    { code: 'A4201010', label: 'รายได้งบประมาณส่วนบุคลากร' },
    { code: 'A49', label: 'รวมรายได้และรายได้กองทุน' },
    { code: 'A5009N', label: 'รวมต้นทุนค่ารักษาพยาบาล' },
    { code: 'A501D', label: 'กำไรขั้นต้น (Gross Profit)' },
    { code: 'A519N', label: 'รวมค่าใช้จ่ายในการดำเนินงาน' },
    { code: 'A529N', label: 'กำไรจากการดำเนินงาน (Operating Profit)' },
    { code: 'A9010S', label: 'รวมรายได้อื่นๆ' },
    { code: 'A60SS', label: 'รวมค่าใช้จ่ายอื่นๆ' },
    { code: 'A91N', label: 'กำไรสุทธิก่อนค่าเสื่อมราคา' },
    { code: 'DEPR_CALC', label: 'ค่าเสื่อมราคาและค่าตัดจำหน่าย' },
    { code: 'A91D', label: 'รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)' }
];

function renderWaterfallPnL() {
    if (monthlyResults.length === 0) return;

    populateWaterfallMonthSelect();

    const select = document.getElementById('waterfallMonthSelect');
    const selectedIdx = select ? parseInt(select.value) : monthlyResults.length - 1;

    updateWaterfallPrevNextButtons(selectedIdx);
    renderWaterfallPnLContent(selectedIdx);
}

function populateWaterfallMonthSelect() {
    const select = document.getElementById('waterfallMonthSelect');
    if (!select) return;

    // Check if we need to rebuild options
    if (select.options.length !== monthlyResults.length) {
        select.innerHTML = '';
        monthlyResults.forEach((month, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', '');
            // default select the last month
            if (idx === monthlyResults.length - 1) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    select.onchange = () => {
        const idx = parseInt(select.value);
        updateWaterfallPrevNextButtons(idx);
        renderWaterfallPnLContent(idx);
    };

    const prevBtn = document.getElementById('btnWaterfallPrevMonth');
    const nextBtn = document.getElementById('btnWaterfallNextMonth');

    if (prevBtn) {
        prevBtn.onclick = () => {
            const currentIdx = parseInt(select.value);
            if (currentIdx > 0) {
                const newIdx = currentIdx - 1;
                select.value = newIdx;
                updateWaterfallPrevNextButtons(newIdx);
                renderWaterfallPnLContent(newIdx);
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            const currentIdx = parseInt(select.value);
            if (currentIdx < monthlyResults.length - 1) {
                const newIdx = currentIdx + 1;
                select.value = newIdx;
                updateWaterfallPrevNextButtons(newIdx);
                renderWaterfallPnLContent(newIdx);
            }
        };
    }
}

function updateWaterfallPrevNextButtons(currentIdx) {
    const prevBtn = document.getElementById('btnWaterfallPrevMonth');
    const nextBtn = document.getElementById('btnWaterfallNextMonth');
    if (prevBtn) {
        prevBtn.disabled = (currentIdx <= 0);
    }
    if (nextBtn) {
        nextBtn.disabled = (currentIdx >= monthlyResults.length - 1);
    }
}

function renderWaterfallTrendLineChart(code, label) {
    const labelEl = document.getElementById('waterfallTrendLabel');
    if (labelEl) {
        labelEl.textContent = label;
        labelEl.title = label;
    }

    const canvas = document.getElementById('waterfallTrendChartCanvas');
    if (!canvas) return;

    if (waterfallTrendChartInstance) {
        if (waterfallTrendPulseFrame) {
            cancelAnimationFrame(waterfallTrendPulseFrame);
            waterfallTrendPulseFrame = null;
        }
        waterfallTrendChartInstance.destroy();
        waterfallTrendChartInstance = null;
    }

    const labels = monthlyResults.map(m => m.monthStr || m.filename.replace('.xlsx', '').replace('.xls', ''));
    const data = monthlyResults.map(m => {
        const mTbData = m.tbData || [];
        const mIsSingleBalance = mTbData.some(row => row.code && row.code.startsWith('CR_'));
        if (code === 'DEPR_CALC') {
            const a91n_val = sumMgtAccount(mTbData, 'A91N', mIsSingleBalance);
            const a91d_val = sumMgtAccount(mTbData, 'A91D', mIsSingleBalance);
            return a91n_val - a91d_val;
        }
        return sumMgtAccount(mTbData, code, mIsSingleBalance);
    });

    const colors = waterfallColorsMap[code] || { line: '#0284c7', bg: 'rgba(56, 189, 248, 0.1)' };

    // Get current period selectedIdx to highlight point
    const select = document.getElementById('waterfallMonthSelect');
    const selectedIdx = select ? parseInt(select.value) : monthlyResults.length - 1;

    const pointRadiusArray = monthlyResults.map((_, idx) => idx === selectedIdx ? 7 : 3);
    const pointHoverRadiusArray = monthlyResults.map((_, idx) => idx === selectedIdx ? 9 : 5);
    const pointBgColors = monthlyResults.map((_, idx) => idx === selectedIdx ? '#ffffff' : colors.line);
    const pointBorderColors = monthlyResults.map((_, idx) => idx === selectedIdx ? colors.line : colors.line);
    const pointBorderWidths = monthlyResults.map((_, idx) => idx === selectedIdx ? 3.5 : 1);

    // Custom Plugin to draw a pulsing ring on the active month's point
    const pulseHighlightPlugin = {
        id: 'pulseHighlight',
        afterDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data[selectedIdx]) return;
            const point = meta.data[selectedIdx];
            const { ctx } = chart;
            ctx.save();

            // Pulse radius oscillates between 8 and 16
            const radius = 8 + Math.sin(waterfallTrendPulseOffset) * 4.5;
            const alpha = 0.45 - Math.sin(waterfallTrendPulseOffset) * 0.25;

            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = colors.line;
            ctx.globalAlpha = alpha;
            ctx.fill();

            // Draw a subtle border outline for the pulsing ring
            ctx.strokeStyle = colors.line;
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha + 0.1;
            ctx.stroke();

            ctx.restore();
        }
    };

    const ctx = canvas.getContext('2d');
    waterfallTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: colors.line,
                backgroundColor: colors.bg,
                borderWidth: 2.5,
                pointBackgroundColor: pointBgColors,
                pointBorderColor: pointBorderColors,
                pointBorderWidth: pointBorderWidths,
                pointRadius: pointRadiusArray,
                pointHoverRadius: pointHoverRadiusArray,
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 24
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    borderRadius: 12,
                    titleFont: { family: "'Sarabun', sans-serif", weight: 'bold', size: 12 },
                    bodyFont: { family: "'Sarabun', sans-serif", size: 12 },
                    callbacks: {
                        label: function (context) {
                            return ` ${context.parsed.y.toLocaleString('th-TH')} บาท`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => {
                        const show = window.shouldShowLabels ? window.shouldShowLabels('waterfallTrendChartCanvas') : true;
                        if (!show) return false;
                        const idx = context.dataIndex;
                        if (idx === selectedIdx) return true;
                        if (monthlyResults.length > 6) {
                            const isFarFromSelected = Math.abs(idx - selectedIdx) >= 2;
                            if (!isFarFromSelected) return false;
                            return idx === 0 || idx === monthlyResults.length - 1 || idx % 3 === 0;
                        }
                        return true;
                    },
                    align: 'top',
                    anchor: 'end',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    font: {
                        family: "'Sarabun', sans-serif",
                        weight: 'bold',
                        size: 9
                    },
                    formatter: (value) => {
                        if (value === 0 || value === undefined) return '';
                        return formatAbbreviated(value);
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#F1F5F9' },
                    grace: '15%',
                    ticks: {
                        font: { family: "'Sarabun', sans-serif", size: 10 },
                        callback: function (value) {
                            return formatAbbreviated(value);
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 }
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [pulseHighlightPlugin, ChartDataLabels] : [pulseHighlightPlugin]
    });

    // Start pulsing animation loop
    function tick() {
        waterfallTrendPulseOffset += 0.06;
        if (waterfallTrendChartInstance) {
            waterfallTrendChartInstance.draw(); // Redraw only (very efficient)
            waterfallTrendPulseFrame = requestAnimationFrame(tick);
        }
    }
    tick();

    // Render the sub-item proportion chart below it
    renderWaterfallProportionChart(code, label);
}

function renderWaterfallProportionChart(code, label) {
    const canvas = document.getElementById('waterfallProportionChartCanvas');
    const legendEl = document.getElementById('waterfallProportionLegend');
    const monthLabelEl = document.getElementById('waterfallProportionMonthLabel');
    if (!canvas) return;

    if (waterfallProportionChartInstance) {
        waterfallProportionChartInstance.destroy();
        waterfallProportionChartInstance = null;
    }

    const select = document.getElementById('waterfallMonthSelect');
    const selectedIdx = select ? parseInt(select.value) : monthlyResults.length - 1;
    const month = monthlyResults[selectedIdx];
    if (!month) return;

    if (monthLabelEl) {
        monthLabelEl.textContent = month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', '');
    }

    const tbData = month.tbData || [];
    const isSingleBalance = tbData.some(row => row.code && row.code.startsWith('CR_'));

    // 1. Gather components
    let components = [];

    // Check if code has children in MGT_ACCOUNTS_PARENT_MAP
    const mgtByCode = {};
    if (typeof window.MGT_ACCOUNTS_MAP !== 'undefined') {
        window.MGT_ACCOUNTS_MAP.forEach(item => { mgtByCode[item.code] = item; });
    }

    // Custom handling for net/subtotal codes or regular codes
    if (code === 'A91N' || code === 'A91D') {
        // Net Income components: Revenue vs Expenses
        const rev = sumMgtAccount(tbData, 'A911S', isSingleBalance);
        const exp = sumMgtAccount(tbData, 'A912S', isSingleBalance);
        components = [
            { label: 'รายได้ทั้งหมด', value: Math.abs(rev) },
            { label: 'ค่าใช้จ่ายทั้งหมด', value: Math.abs(exp) }
        ];
    } else if (code === 'DEPR_CALC') {
        const a91n_val = sumMgtAccount(tbData, 'A91N', isSingleBalance);
        const a91d_val = sumMgtAccount(tbData, 'A91D', isSingleBalance);
        components = [
            { label: 'ค่าเสื่อมราคาและค่าตัดจำหน่าย', value: Math.abs(a91n_val - a91d_val) }
        ];
    } else if (code === 'A501D') {
        // Gross Profit: Revenue vs Cost
        const rev = sumMgtAccount(tbData, 'A49', isSingleBalance);
        const cost = sumMgtAccount(tbData, 'A5009N', isSingleBalance);
        components = [
            { label: 'รายได้และกองทุน', value: Math.abs(rev) },
            { label: 'ต้นทุนค่ารักษา', value: Math.abs(cost) }
        ];
    } else if (code === 'A529N') {
        // Operating Profit: Gross Profit vs Operating Expenses
        const gp = sumMgtAccount(tbData, 'A501D', isSingleBalance);
        const opex = sumMgtAccount(tbData, 'A519N', isSingleBalance);
        components = [
            { label: 'กำไรขั้นต้น', value: Math.abs(gp) },
            { label: 'ค่าใช้จ่ายดำเนินงาน', value: Math.abs(opex) }
        ];
    } else if (typeof MGT_ACCOUNTS_PARENT_MAP !== 'undefined' && MGT_ACCOUNTS_PARENT_MAP[code]) {
        // Use direct children from parent map
        const children = MGT_ACCOUNTS_PARENT_MAP[code];
        children.forEach(childCode => {
            const childVal = sumMgtAccount(tbData, childCode, isSingleBalance);
            const childItem = mgtByCode[childCode];
            const name = childItem ? childItem.name : lookupAccountName(childCode);
            components.push({
                label: name,
                value: Math.abs(childVal)
            });
        });
    } else {
        // It's a leaf node in the parent map, look up matching tbCodes in tbData
        const mgtItem = mgtByCode[code];
        if (mgtItem && mgtItem.tbCodes) {
            const isCredit = isCreditNormal(code);
            mgtItem.tbCodes.forEach(tbCode => {
                const row = tbData.find(r => r.code === tbCode);
                if (row) {
                    let val = 0;
                    if (isSingleBalance) {
                        val = Math.abs(row.end_net);
                    } else {
                        val = isCredit ? (row.end_cr - row.end_dr) : (row.end_dr - row.end_cr);
                    }
                    if (val !== 0) {
                        components.push({
                            label: lookupAccountName(tbCode),
                            value: Math.abs(val)
                        });
                    }
                }
            });
        }
    }

    // Filter out zero values and sort descending
    components = components.filter(c => c.value > 0.01).sort((a, b) => b.value - a.value);

    if (components.length === 0) {
        // Clear legend and draw empty message on canvas
        if (legendEl) legendEl.innerHTML = '';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "11px 'Sarabun', sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ไม่มีข้อมูลสัดส่วนย่อยในรอบเดือนนี้", canvas.width / 2, canvas.height / 2);
        return;
    }

    const total = components.reduce((sum, c) => sum + c.value, 0);

    const proportionColors = [
        '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#3B82F6', '#14B8A6', '#F43F5E', '#84CC16',
        '#6366F1', '#A855F7', '#06B6D4', '#F97316', '#64748B'
    ];

    // Build Chart.js datasets
    const datasets = components.map((comp, idx) => {
        const pct = (comp.value / total) * 100;
        const color = proportionColors[idx % proportionColors.length];
        return {
            label: comp.label,
            data: [pct],
            rawVal: comp.value,
            percentage: pct,
            backgroundColor: color,
            borderColor: 'transparent',
            borderWidth: 0
        };
    });

    const ctx = canvas.getContext('2d');
    waterfallProportionChartInstance = new Chart(ctx, {
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, activeElements) => {
                const detailsEl = document.getElementById('waterfallProportionHoverDetails');
                if (!detailsEl) return;
                if (activeElements && activeElements.length > 0) {
                    const activeEl = activeElements[0];
                    const dataset = waterfallProportionChartInstance.data.datasets[activeEl.datasetIndex];
                    if (dataset) {
                        detailsEl.innerHTML = `
                            <div class="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1 text-xs text-indigo-950 font-bold shadow-sm w-full transition-all duration-150">
                                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${dataset.backgroundColor};"></span>
                                <span class="truncate max-w-[200px]">${dataset.label}:</span>
                                <span class="text-indigo-600 font-extrabold shrink-0">${dataset.percentage.toFixed(1)}%</span>
                                <span class="text-slate-300 shrink-0">|</span>
                                <span class="font-mono shrink-0">${dataset.rawVal.toLocaleString('th-TH')} บาท</span>
                            </div>
                        `;
                        return;
                    }
                }
                // default if nothing hovered
                detailsEl.innerHTML = `
                    <div class="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-xs text-slate-500 font-medium w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>วางเมาส์เหนือแถบกราฟเพื่อดูรายละเอียดสัดส่วนย่อย</span>
                    </div>
                `;
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false
                },
                datalabels: {
                    display: (context) => {
                        const show = window.shouldShowLabels ? window.shouldShowLabels('waterfallProportionChartCanvas') : true;
                        if (!show) return false;
                        const pct = context.dataset.percentage;
                        return pct > 8; // Only show if segment is large enough
                    },
                    color: '#ffffff',
                    font: {
                        family: "'Sarabun', sans-serif",
                        weight: 'bold',
                        size: 9
                    },
                    formatter: (value, context) => {
                        return context.dataset.percentage.toFixed(0) + '%';
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    max: 100,
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false }
                },
                y: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        type: 'bar',
        data: {
            labels: [label],
            datasets: datasets
        }
    });

    // Populate initial default text
    const detailsEl = document.getElementById('waterfallProportionHoverDetails');
    if (detailsEl) {
        detailsEl.innerHTML = `
            <div class="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-xs text-slate-500 font-medium w-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>วางเมาส์เหนือแถบกราฟเพื่อดูรายละเอียดสัดส่วนย่อย</span>
            </div>
        `;
    }

    // Build custom legend
    if (legendEl) {
        legendEl.innerHTML = '';
        components.forEach((comp, idx) => {
            const pct = (comp.value / total) * 100;
            const color = proportionColors[idx % proportionColors.length];

            const legendItem = document.createElement('div');
            legendItem.className = 'flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity';
            legendItem.title = `${comp.label}: ${pct.toFixed(1)}% (${comp.value.toLocaleString('th-TH')} บาท)`;
            legendItem.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color};"></span>
                <span class="truncate max-w-[120px] font-semibold text-[11px]">${comp.label}</span>
                <span class="text-[9px] text-slate-400 font-bold">${pct.toFixed(0)}%</span>
            `;
            legendEl.appendChild(legendItem);
        });
    }
}

function renderWaterfallPnLContent(selectedIdx) {
    if (!monthlyResults || monthlyResults.length === 0 || !monthlyResults[selectedIdx]) return;

    const month = monthlyResults[selectedIdx];
    const wRes = month.waterfallResult || (typeof calculateWaterfallPnL === 'function' ? calculateWaterfallPnL(month) : {});

    // Read calculated management accounts values from formula result
    const a419s = wRes.a419s || 0;
    const a4201010 = wRes.a4201010 || 0;
    const a49 = wRes.a49 || 0;
    const a5009n = wRes.a5009n || 0;
    const a501d = wRes.a501d || 0;
    const a519n = wRes.a519n || 0;
    const a529n = wRes.a529n || 0;
    const a9010s = wRes.a9010s || 0;
    const a60ss = wRes.a60ss || 0;
    const a90s = wRes.a90s || 0;
    const a91n = wRes.a91n || 0;
    const a91d = wRes.a91d || 0;
    const deprVal = wRes.deprVal || 0;

    // 2. Populate Detail Table with click-to-graph support
    const tbody = document.getElementById('waterfallTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        const tableRows = [
            { code: 'A419S', name: 'รวมรายได้ค่ารักษาพยาบาล', val: a419s, type: 'plus' },
            { code: 'A4201010', name: 'รายได้งบประมาณส่วนบุคลากร', val: a4201010, type: 'plus' },
            { code: 'A49', name: 'รวมรายได้และรายได้กองทุน', val: a49, type: 'plus' },
            { code: 'A5009N', name: 'รวมต้นทุนค่ารักษาพยาบาล', val: a5009n, type: 'minus' },
            { code: 'A501D', name: 'กำไรขั้นต้น (Gross Profit)', val: a501d, type: 'subtotal' },
            { code: 'A519N', name: 'รวมค่าใช้จ่ายในการดำเนินงาน', val: a519n, type: 'minus' },
            { code: 'A529N', name: 'กำไรจากการดำเนินงาน (Operating Profit)', val: a529n, type: 'subtotal' },
            { code: 'A9010S', name: 'รวมรายได้อื่นๆ', val: a9010s, type: 'plus' },
            { code: 'A60SS', name: 'รวมค่าใช้จ่ายอื่นๆ', val: a60ss, type: 'minus' },
            { code: 'A90S', name: 'รายได้/ค่าใช้จ่ายอื่นสุทธิ', val: a90s, type: 'net_other' },
            { code: 'A91N', name: 'กำไรสุทธิก่อนค่าเสื่อมราคา', val: a91n, type: 'subtotal' },
            { code: 'DEPR_CALC', name: 'ค่าเสื่อมราคาและค่าตัดจำหน่าย', val: deprVal, type: 'minus' },
            { code: 'A91D', name: 'รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)', val: a91d, type: 'subtotal' }
        ];

        tableRows.forEach(r => {
            const tr = document.createElement('tr');
            let displayVal = '';
            let rowClass = 'hover:bg-slate-50 transition-colors group cursor-pointer ';
            let tdBgClass = '';

            if (r.code === 'A501D' || r.code === 'A529N' || r.code === 'A91D') {
                rowClass += 'bg-emerald-50/80 font-bold border-y border-emerald-200/80 text-emerald-900';
                tdBgClass = 'bg-emerald-50/80';
                displayVal = r.val.toLocaleString('th-TH');
            } else if (r.type === 'subtotal') {
                rowClass += 'bg-slate-50/80 font-bold border-y border-slate-200/80 text-slate-800';
                tdBgClass = 'bg-slate-50/80';
                displayVal = r.val.toLocaleString('th-TH');
            } else if (r.type === 'total') {
                rowClass += 'bg-indigo-50 font-black text-indigo-950 border-y-2 border-indigo-200';
                tdBgClass = 'bg-indigo-50';
                displayVal = r.val.toLocaleString('th-TH');
            } else if (r.type === 'minus') {
                rowClass += 'text-slate-650';
                displayVal = r.val !== 0 ? `-${r.val.toLocaleString('th-TH')}` : '0';
            } else if (r.type === 'plus') {
                rowClass += 'text-slate-700';
                displayVal = r.val !== 0 ? `+${r.val.toLocaleString('th-TH')}` : '0';
            } else {
                rowClass += 'font-semibold text-slate-700';
                displayVal = r.val >= 0 ? `+${r.val.toLocaleString('th-TH')}` : `-${Math.abs(r.val).toLocaleString('th-TH')}`;
            }

            tr.className = rowClass;
            tr.innerHTML = `
                <td class="px-3 py-2.5 text-left ${tdBgClass}">
                    <div class="flex items-center justify-between">
                        <span>${r.name}</span>
                        <span class="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2" title="คลิกเพื่อดูแนวโน้มกราฟ">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </span>
                    </div>
                </td>
                <td class="px-3 py-2.5 text-right font-mono ${tdBgClass}">${displayVal} บาท</td>
            `;

            tr.onclick = () => {
                activeWaterfallTrendCode = r.code;
                activeWaterfallTrendLabel = r.name;
                renderWaterfallTrendLineChart(activeWaterfallTrendCode, activeWaterfallTrendLabel);
            };

            tbody.appendChild(tr);
        });
    }

    // 3. Draw Waterfall Chart in Chart.js (Horizontal Waterfall with Connector Lines)
    const canvas = document.getElementById('waterfallChartCanvas');
    if (!canvas) return;

    if (waterfallChartInstance) {
        waterfallChartInstance.destroy();
        waterfallChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    // Custom Plugin to draw dashed connection lines vertically between adjacent bars
    const waterfallConnectorPlugin = {
        id: 'waterfallConnector',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            const xScale = chart.scales.x;

            ctx.save();
            ctx.strokeStyle = '#94a3b8'; // Slate 300
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]); // Dashed line

            const rawEndValues = [
                a419s,
                a49,
                a49,
                a501d,
                a501d,
                a529n,
                a529n,
                a529n + a9010s,
                a91n,
                a91n,
                a91d,
                a91d
            ];

            for (let i = 0; i < meta.data.length - 1; i++) {
                const currentBar = meta.data[i];
                const nextBar = meta.data[i + 1];
                if (!currentBar || !nextBar) continue;

                const currY = currentBar.y;
                const currHeight = currentBar.height;
                const nextY = nextBar.y;
                const nextHeight = nextBar.height;

                const xPixel = xScale.getPixelForValue(rawEndValues[i]);

                const startY = currY + currHeight / 2;
                const endY = nextY - nextHeight / 2;

                ctx.beginPath();
                ctx.moveTo(xPixel, startY);
                ctx.lineTo(xPixel, endY);
                ctx.stroke();
            }
            ctx.restore();
        }
    };

    const chartLabels = [
        "รายได้ค่ารักษา",
        "งบประมาณบุคลากร",
        "รวมรายได้สะสม",
        "ต้นทุนค่ารักษา",
        "กำไรขั้นต้น",
        "ค่าใช้จ่ายดำเนินงาน",
        "กำไรดำเนินงาน",
        "รายได้อื่นๆ",
        "ค่าใช้จ่ายอื่นๆ",
        "กำไรสุทธิก่อนค่าเสื่อม",
        "ค่าเสื่อมราคา",
        "รายได้สูง(ต่ำ)กว่าค่าใช้จ่าย (NI)"
    ];

    // Compute steps connecting ranges [start, end]
    const rawRanges = [
        [0, a419s],
        [a419s, a49],
        [0, a49],
        [a501d, a49],
        [0, a501d],
        [a529n, a501d],
        [0, a529n],
        [a529n, a529n + a9010s],
        [a91n, a529n + a9010s],
        [0, a91n],
        [a91d, a91n],
        [0, a91d]
    ];

    // Normalize min and max for floating bars in Chart.js
    const chartData = rawRanges.map(r => [Math.min(r[0], r[1]), Math.max(r[0], r[1])]);

    // Store value changes for tooltip display
    const changes = [
        a419s,
        a4201010,
        a49,
        -a5009n,
        a501d,
        -a519n,
        a529n,
        a9010s,
        -a60ss,
        a91n,
        -deprVal,
        a91d
    ];

    const barColors = [
        waterfallColorsMap['A419S'].barBg,
        waterfallColorsMap['A4201010'].barBg,
        waterfallColorsMap['A49'].barBg,
        waterfallColorsMap['A5009N'].barBg,
        waterfallColorsMap['A501D'].barBg,
        waterfallColorsMap['A519N'].barBg,
        waterfallColorsMap['A529N'].barBg,
        waterfallColorsMap['A9010S'].barBg,
        waterfallColorsMap['A60SS'].barBg,
        waterfallColorsMap['A91N'].barBg,
        waterfallColorsMap['DEPR_CALC'].barBg,
        waterfallColorsMap['A91D'].barBg
    ];

    const borderColors = [
        waterfallColorsMap['A419S'].border,
        waterfallColorsMap['A4201010'].border,
        waterfallColorsMap['A49'].border,
        waterfallColorsMap['A5009N'].border,
        waterfallColorsMap['A501D'].border,
        waterfallColorsMap['A519N'].border,
        waterfallColorsMap['A529N'].border,
        waterfallColorsMap['A9010S'].border,
        waterfallColorsMap['A60SS'].border,
        waterfallColorsMap['A91N'].border,
        waterfallColorsMap['DEPR_CALC'].border,
        waterfallColorsMap['A91D'].border
    ];

    waterfallChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: barColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const targetItem = waterfallItemsMap[idx];
                    if (targetItem) {
                        activeWaterfallTrendCode = targetItem.code;
                        activeWaterfallTrendLabel = targetItem.label;
                        renderWaterfallTrendLineChart(activeWaterfallTrendCode, activeWaterfallTrendLabel);
                    }
                }
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    borderRadius: 12,
                    titleFont: { family: "'Sarabun', sans-serif", weight: 'bold', size: 12 },
                    bodyFont: { family: "'Sarabun', sans-serif", size: 12 },
                    callbacks: {
                        label: function (context) {
                            const val = changes[context.dataIndex];
                            const prefix = val > 0 ? '+' : '';
                            return ` ${context.chart.data.labels[context.dataIndex]}: ${prefix}${val.toLocaleString('th-TH')} บาท`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('waterfallChartCanvas') : true,
                    align: 'right',
                    anchor: 'end',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    font: {
                        family: "'Sarabun', sans-serif",
                        weight: 'bold',
                        size: 9
                    },
                    formatter: (value, context) => {
                        const val = changes[context.dataIndex];
                        if (val === 0) return '';
                        return formatAbbreviated(val);
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: '#F1F5F9' },
                    ticks: {
                        font: { family: "'Sarabun', sans-serif", size: 11 },
                        callback: function (value) {
                            return formatAbbreviated(value);
                        }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 }
                    }
                }
            }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [waterfallConnectorPlugin, ChartDataLabels] : [waterfallConnectorPlugin]
    });

    // Render the active Trend line chart on the right side
    renderWaterfallTrendLineChart(activeWaterfallTrendCode, activeWaterfallTrendLabel);
}
