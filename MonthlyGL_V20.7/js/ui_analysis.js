// ==========================================================
// ส่วนจัดการวิเคราะห์เปรียบเทียบข้อมูล (Data Analysis & Comparison)
// ==========================================================

window.analysisCompareChartInstance = null;
window.distressTrendChartInstance = null;
window.opdCostPerVisitChartInstance = null;
window.ipdCostPerAdjRWChartInstance = null;
window.costRevenueBreakdownChartInstance = null;
let isAnalysisInitialized = false;
let lineDashOffsetValue = 0;
let animationFrameId = null;
let activeHighlightedMetric = null;
let activeMetricsList = []; // Track active metrics order for legend hover indexing
window.treatmentCostShowLabels = true;

// Animate dashed line offset to create a running/flowing line effect
function animateDash() {
    if (!analysisCompareChartInstance || !activeHighlightedMetric) {
        animationFrameId = null;
        return;
    }

    lineDashOffsetValue -= 0.35; // Adjust speed (slower) //กราฟเส้นปะวิ่ง
    if (lineDashOffsetValue < -20) lineDashOffsetValue = 0;

    const metricLabelMap = {
        'revenue': 'รายได้สะสม',
        'expenses': 'รายจ่ายสะสม',
        'netProfit': 'กำไรสุทธิสะสม',
        'ebitda': 'EBITDA',
        'cash': 'เงินสดสะสม',
        'nwc': 'ทุนหมุนเวียนสุทธิ (NWC)',
        'netReserve': 'เงินบำรุงคงเหลือสุทธิ',
        'currentRatio': 'Current Ratio',
        'quickRatio': 'Quick Ratio',
        'cashRatio': 'Cash Ratio',
        'operatingMargin': 'Operating Margin (%)',
        'returnOnAsset': 'Return on Asset (ROA %)',
        'apDrugSuppliesDays': 'ระยะเวลาจ่ายหนี้ AP (วัน)',
        'arUCDays': 'ระยะเวลาเก็บหนี้ AR UC (วัน)',
        'invDays': 'ระยะเวลาขายคลัง INV (วัน)'
    };

    const targetLabel = metricLabelMap[activeHighlightedMetric];
    if (targetLabel) {
        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            if (dataset.label === targetLabel) {
                dataset.borderDashOffset = lineDashOffsetValue;
            }
        });
        analysisCompareChartInstance.update('none');
    }

    animationFrameId = requestAnimationFrame(animateDash);
}

// Initialize Analysis Tab View and Events
function renderAnalysisTab() {
    renderAnalysisSubViews();
}

// Show/Hide analysis sub-views based on current subtab selection
function renderAnalysisSubViews() {
    if (monthlyResults.length === 0) return;

    if (!isAnalysisInitialized) {
        setupAnalysisEvents();
        isAnalysisInitialized = true;
    }

    const subViews = ['compareMetrics', 'financialDistress', 'waterfallPnl', 'treatmentCost'];
    subViews.forEach(v => {
        const el = document.getElementById(`subView_${v}`);
        if (el) {
            const camelTab = currentAnalysisSubTab.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (v === camelTab) {
                el.classList.remove('hidden');
                el.classList.add('block');
            } else {
                el.classList.add('hidden');
                el.classList.remove('block');
            }
        }
    });

    if (currentAnalysisSubTab === 'compare_metrics') {
        updateAnalysisCompareChart();
    } else if (currentAnalysisSubTab === 'financial_distress') {
        renderFinancialDistressDashboard();
    } else if (currentAnalysisSubTab === 'waterfall_pnl') {
        renderWaterfallPnL();
    } else if (currentAnalysisSubTab === 'treatment_cost') {
        renderTreatmentCost();
    }
}


// Render financial distress dashboard
function renderFinancialDistressDashboard() {
    if (monthlyResults.length === 0) return;

    try {
        const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

        if (filteredMonths.length === 0) return;

        // Calculate distress info for all loaded months, prioritizing precomputed results
        const monthDistressList = filteredMonths.map((month, idx) => {
            let distressData = month.distressResult;
            if (!distressData && typeof calculateFinancialDistress === 'function') {
                distressData = calculateFinancialDistress(month);
            }
            return {
                monthStr: month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', ''),
                data: distressData || {},
                dateObj: month.dateObj
            };
        });

        const latest = monthDistressList[monthDistressList.length - 1];
        const latestData = latest.data || {};

        // Update Top Panel Summary
        const periodLabelEl = document.getElementById('distressPeriodLabel');
        if (periodLabelEl) {
            periodLabelEl.textContent = latest.monthStr;
        }
        
        const badge = document.getElementById('distressLevelBadge');
        if (badge) {
            const distressLvl = typeof latestData.distressLevel !== 'undefined' ? latestData.distressLevel : 0;
            badge.textContent = `ระดับ ${distressLvl}`;

            // Set color based on level
            badge.className = "px-5 py-3 rounded-2xl text-center shadow-md font-bold text-white text-lg transition-all transform hover:scale-105";
            if (distressLvl <= 1) {
                badge.classList.add('bg-emerald-500');
            } else if (distressLvl <= 3) {
                badge.classList.add('bg-sky-500');
            } else if (distressLvl <= 5) {
                badge.classList.add('bg-amber-500');
            } else if (distressLvl === 6) {
                badge.classList.add('bg-orange-500');
            } else {
                badge.classList.add('bg-red-600', 'animate-pulse');
            }
        }

        // Update Liquid Index Card (Current Ratio, Quick Ratio, Cash Ratio with progress bars)
        const updateRatioBar = (ratioVal, targetVal, textElId, barElId, markerElId) => {
            const textEl = document.getElementById(textElId);
            const barEl = document.getElementById(barElId);
            const markerEl = document.getElementById(markerElId);
            if (!textEl || !barEl || !markerEl) return;

            const safeRatioVal = typeof ratioVal === 'number' && !isNaN(ratioVal) ? ratioVal : 0;
            textEl.textContent = safeRatioVal.toFixed(2) + " เท่า";
            const passed = safeRatioVal >= targetVal;
            textEl.className = passed ? "font-mono text-emerald-600 font-bold" : "font-mono text-rose-600 font-bold";

            const scaleMax = Math.max(safeRatioVal, targetVal) * 1.3 || targetVal;
            const percentage = Math.min(100, Math.max(0, (safeRatioVal / scaleMax) * 100));
            const targetPercent = Math.min(95, Math.max(5, (targetVal / scaleMax) * 100));

            barEl.style.width = percentage + "%";
            barEl.className = `h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`;
            markerEl.style.left = targetPercent + "%";
        };

        updateRatioBar(latestData.cr, 1.5, 'distress_cr_text', 'distress_cr_bar', 'distress_cr_marker');
        updateRatioBar(latestData.qr, 1.0, 'distress_qr_text', 'distress_qr_bar', 'distress_qr_marker');
        updateRatioBar(latestData.cashRatio, 0.8, 'distress_cash_ratio_text', 'distress_cash_ratio_bar', 'distress_cash_ratio_marker');

        const liquidScoreEl = document.getElementById('distress_liquid_score');
        if (liquidScoreEl) {
            const lScore = typeof latestData.liquidScore !== 'undefined' ? latestData.liquidScore : 0;
            liquidScoreEl.textContent = lScore + " / 3 คะแนน";
            if (lScore === 0) {
                liquidScoreEl.className = "text-base font-black text-emerald-600";
            } else {
                liquidScoreEl.className = "text-base font-black text-red-600";
            }
        }

        // Update Status Index Card (NWC & NI with progress bars, target >= 0)
        const updateStatusMetricBar = (val, textElId, barElId) => {
            const textEl = document.getElementById(textElId);
            const barEl = document.getElementById(barElId);
            if (!textEl || !barEl) return;

            const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
            textEl.textContent = safeVal.toLocaleString('th-TH') + " บาท";
            const passed = safeVal >= 0;
            textEl.className = passed ? "font-mono text-emerald-600 font-bold" : "font-mono text-rose-600 font-bold";

            barEl.style.width = passed ? "100%" : "0%";
            barEl.className = `h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`;
        };

        updateStatusMetricBar(latestData.nwc, 'distress_nwc_text', 'distress_nwc_bar');
        updateStatusMetricBar(latestData.ni, 'distress_ni_text', 'distress_ni_bar');

        const nwcVal = typeof latestData.nwc === 'number' && !isNaN(latestData.nwc) ? latestData.nwc : 0;
        const niVal = typeof latestData.ni === 'number' && !isNaN(latestData.ni) ? latestData.ni : 0;

        let stabilityText = "ปกติ";
        if (nwcVal < 0 && niVal < 0) {
            stabilityText = "ตกเกณฑ์ขั้นสุด (NWC < 0 และ NI < 0)";
        } else if (nwcVal < 0) {
            stabilityText = "ทุนหมุนเวียนติดลบ (NWC < 0)";
        } else if (niVal < 0) {
            stabilityText = "รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิขาดทุน (NI < 0)";
        }
        
        const stabilityStatusEl = document.getElementById('distress_stability_status');
        if (stabilityStatusEl) {
            stabilityStatusEl.textContent = stabilityText;
        }

        // Dynamic Stability Case Description Warnings
        const stabilityDescEl = document.getElementById('distress_stability_case_desc');
        if (stabilityDescEl) {
            let warnings = [];
            if (nwcVal < 0) {
                warnings.push(`
                    <div class="mb-0.5 text-rose-600 font-extrabold flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        2.1 เงินทุนหมุนเวียนสุทธิ Net Working Capital (NWC) < 0
                    </div>
                    <div class="text-[9px] text-slate-500 pl-3 leading-relaxed">
                        แสดงถึง ฐานะทางการเงิน : ความเพียงพอของสินทรัพย์หมุนเวียนสุทธิที่เป็นส่วนสำคัญต่อกระบวนการปฏิบัติงาน
                    </div>
                `);
            }
            if (niVal < 0) {
                warnings.push(`
                    <div class="mb-0.5 text-rose-600 font-extrabold flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        2.2 รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI) (A91D) < 0
                    </div>
                    <div class="text-[9px] text-slate-500 pl-3 leading-relaxed">
                        แสดงถึง ฐานะจากผลการดำเนินงาน : ความสามารถในการหารายได้และควบคุมค่าใช้จ่าย
                    </div>
                `);
            }

            if (warnings.length > 0) {
                stabilityDescEl.innerHTML = warnings.join('<div class="h-2 border-t border-slate-100 my-2"></div>');
                stabilityDescEl.classList.remove('hidden');
            } else {
                stabilityDescEl.innerHTML = "";
                stabilityDescEl.classList.add('hidden');
            }
        }

        const statusScoreEl = document.getElementById('distress_status_score');
        if (statusScoreEl) {
            const sScore = typeof latestData.statusScore !== 'undefined' ? latestData.statusScore : 0;
            statusScoreEl.textContent = sScore + " / 2 คะแนน";
            if (sScore === 0) {
                statusScoreEl.className = "text-base font-black text-emerald-600";
            } else {
                statusScoreEl.className = "text-base font-black text-red-600";
            }
        }

        // Update Survival Index Card (NWC removed, Survival Months with progress bar & 3-stage colors)
        const survivalMonthsVal = (nwcVal >= 0 && niVal >= 0)
            ? (latestData.monthsToChange || 0)
            : (nwcVal < 0 && niVal < 0) ? 0 : (latestData.monthsToChange || 0);

        const monthsTextEl = document.getElementById('distress_survival_months_text');
        const monthsBarEl = document.getElementById('distress_survival_months_bar');
        const marker3El = document.getElementById('distress_survival_marker_3');
        const marker6El = document.getElementById('distress_survival_marker_6');

        if (monthsTextEl && monthsBarEl) {
            let percentage = 0;
            let barColorClass = "bg-rose-500";
            let displayText = "";

            if (survivalMonthsVal === 999) {
                displayText = "ไม่จำกัด (ปกติ)";
                monthsTextEl.className = "font-mono text-emerald-600 font-bold";
                percentage = 100;
                barColorClass = "bg-emerald-500";
            } else {
                displayText = (typeof survivalMonthsVal === 'number' && !isNaN(survivalMonthsVal) ? survivalMonthsVal.toFixed(1) : "0.0") + " เดือน";
                if (survivalMonthsVal < 3) {
                    monthsTextEl.className = "font-mono text-rose-600 font-bold";
                    barColorClass = "bg-rose-500";
                } else if (survivalMonthsVal < 6) {
                    monthsTextEl.className = "font-mono text-amber-500 font-bold";
                    barColorClass = "bg-amber-500";
                } else {
                    monthsTextEl.className = "font-mono text-emerald-600 font-bold";
                    barColorClass = "bg-emerald-500";
                }

                const scaleMax = Math.max(survivalMonthsVal, 12) || 12;
                percentage = (survivalMonthsVal / scaleMax) * 100;

                if (marker3El) marker3El.style.left = ((3 / scaleMax) * 100) + "%";
                if (marker6El) marker6El.style.left = ((6 / scaleMax) * 100) + "%";
            }

            monthsTextEl.textContent = displayText;
            monthsBarEl.style.width = percentage + "%";
            monthsBarEl.className = `h-full rounded-full transition-all duration-500 ${barColorClass}`;
        }

        // Render Case 3.1 / 3.2 Description if applicable (Case 3.3 or 3.4 is hidden)
        const descEl = document.getElementById('distress_survival_case_desc');

        if (descEl) {
            if (nwcVal >= 0 && niVal < 0) {
                // Case 3.1
                const isSub1 = survivalMonthsVal > 6;
                const isSub2 = survivalMonthsVal >= 3 && survivalMonthsVal <= 6;
                const isSub3 = survivalMonthsVal < 3;

                descEl.innerHTML = `
                    <div class="font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        กรณี 3.1 NWC เพียงพอรับภาระการขาดทุนเฉลี่ยต่อเดือน (NWC เป็นบวก & NI ติดลบ)
                    </div>
                    <div class="space-y-1 mt-1 pl-1">
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub1 ? 'text-emerald-600 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub1 ? '👉' : '•'}</span>
                            <span>3.1.1 ระยะเวลาทุนหมุนเวียนอาจหมด > 6 เดือน = <span class="${isSub1 ? 'underline' : ''}">ไม่วิกฤต</span></span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub2 ? 'text-amber-500 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub2 ? '👉' : '•'}</span>
                            <span>3.1.2 ระยะเวลาทุนหมุนเวียนอยู่ได้ > 3 เดือน ไม่เกิน 6 เดือน = <span class="${isSub2 ? 'underline' : ''}">วิกฤต 1 ระดับ</span></span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub3 ? 'text-rose-600 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub3 ? '👉' : '•'}</span>
                            <span>3.1.3 ระยะเวลาทุนหมุนเวียนอยู่ได้ ≤ 3 เดือน = <span class="${isSub3 ? 'underline' : ''}">วิกฤต 2 ระดับ</span></span>
                        </div>
                    </div>
                `;
                descEl.classList.remove('hidden');
            } else if (nwcVal < 0 && niVal >= 0) {
                // Case 3.2
                const isSub1 = survivalMonthsVal > 6;
                const isSub2 = survivalMonthsVal >= 3 && survivalMonthsVal <= 6;
                const isSub3 = survivalMonthsVal < 3;

                descEl.innerHTML = `
                    <div class="font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        กรณี 3.2 NI เพียงพอรับภาระหนี้สินหมุนเวียน (NWC ติดลบ & NI เป็นบวก)
                    </div>
                    <div class="space-y-1 mt-1 pl-1">
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub1 ? 'text-rose-600 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub1 ? '👉' : '•'}</span>
                            <span>3.2.1 ผลกำไรใช้ระยะเวลาในการฟื้นคืนทุน (ปรับ NWC เป็นบวก) > 6 เดือน = <span class="${isSub1 ? 'underline' : ''}">วิกฤต 2 ระดับ</span></span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub2 ? 'text-amber-500 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub2 ? '👉' : '•'}</span>
                            <span>3.2.2 ผลกำไรใช้ระยะเวลาในการฟื้นคืนทุน (ปรับ NWC เป็นบวก) > 3 เดือน ไม่เกิน 6 เดือน = <span class="${isSub2 ? 'underline' : ''}">วิกฤต 1 ระดับ</span></span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] ${isSub3 ? 'text-emerald-600 font-extrabold scale-[1.01]' : 'text-slate-400 font-medium opacity-60'}">
                            <span>${isSub3 ? '👉' : '•'}</span>
                            <span>3.2.3 ผลกำไรใช้ระยะเวลาในการฟื้นคืนทุน (ปรับ NWC เป็นบวก) ≤ 3 เดือน = <span class="${isSub3 ? 'underline' : ''}">ไม่วิกฤต</span></span>
                        </div>
                    </div>
                `;
                descEl.classList.remove('hidden');
            } else {
                // Case 3.3 or 3.4
                descEl.innerHTML = "";
                descEl.classList.add('hidden');
            }
        }

        const survivalScoreEl = document.getElementById('distress_survival_score');
        if (survivalScoreEl) {
            const surScore = typeof latestData.survivalScore !== 'undefined' ? latestData.survivalScore : 0;
            survivalScoreEl.textContent = surScore + " / 2 คะแนน";
            if (surScore === 0) {
                survivalScoreEl.className = "text-base font-black text-emerald-600";
            } else {
                survivalScoreEl.className = "text-base font-black text-red-600";
            }
        }

        // Update Summary Meter (safely if elements exist)
        const riskScoreEl = document.getElementById('distress_total_risk_score');
        if (riskScoreEl) riskScoreEl.textContent = latestData.riskScore || 0;

        const finalLevelTextEl = document.getElementById('distress_final_level_text');
        if (finalLevelTextEl) finalLevelTextEl.textContent = latestData.distressLevelText || 'ระดับ 0: ปกติ';

        const finalDescEl = document.getElementById('distress_final_desc');
        if (finalDescEl) finalDescEl.textContent = latestData.distressLevelDesc || 'ปกติ';

        if (finalLevelTextEl) {
            finalLevelTextEl.className = "text-3xl font-black mb-2";
            const distressLvl = typeof latestData.distressLevel !== 'undefined' ? latestData.distressLevel : 0;
            if (distressLvl <= 1) finalLevelTextEl.classList.add('text-emerald-500');
            else if (distressLvl <= 3) finalLevelTextEl.classList.add('text-sky-600');
            else if (distressLvl <= 5) finalLevelTextEl.classList.add('text-amber-500');
            else if (distressLvl === 6) finalLevelTextEl.classList.add('text-orange-500');
            else finalLevelTextEl.classList.add('text-red-600');
        }

        // Build Distress Table
        const tbody = document.getElementById('distressTableBody');
        if (tbody) {
            tbody.innerHTML = '';

            monthDistressList.forEach(item => {
                const row = item.data || {};
                const tr = document.createElement('tr');
                tr.className = "border-b border-slate-100 hover:bg-slate-50/50 bg-white font-medium";

                const dLvl = typeof row.distressLevel !== 'undefined' ? row.distressLevel : 0;
                let levelClass = "text-slate-700 bg-slate-100";
                if (dLvl <= 1) levelClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
                else if (dLvl <= 3) levelClass = "text-sky-700 bg-sky-50 border border-sky-100";
                else if (dLvl <= 5) levelClass = "text-amber-700 bg-amber-50 border border-amber-100";
                else if (dLvl === 6) levelClass = "text-orange-700 bg-orange-50 border border-orange-100";
                else levelClass = "text-red-700 bg-red-50 border border-red-100 animate-pulse";

                const safeCr = typeof row.cr === 'number' && !isNaN(row.cr) ? row.cr : 0;
                const safeQr = typeof row.qr === 'number' && !isNaN(row.qr) ? row.qr : 0;
                const safeCash = typeof row.cashRatio === 'number' && !isNaN(row.cashRatio) ? row.cashRatio : 0;
                const safeNwc = typeof row.nwc === 'number' && !isNaN(row.nwc) ? row.nwc : 0;
                const safeNi = typeof row.ni === 'number' && !isNaN(row.ni) ? row.ni : 0;
                const safeRisk = typeof row.riskScore !== 'undefined' ? row.riskScore : 0;
                const safeLevelText = row.distressLevelText || 'ระดับ 0: ปกติ';

                let nwcClass = safeNwc < 0 ? "text-red-500" : "text-slate-700";
                let niClass = safeNi < 0 ? "text-red-500" : "text-emerald-600";
                let crClass = safeCr < 1.5 ? "text-red-500 font-bold" : "text-slate-700";
                let qrClass = safeQr < 1.0 ? "text-red-500 font-bold" : "text-slate-700";
                let cashClass = safeCash < 0.8 ? "text-red-500 font-bold" : "text-slate-700";

                tr.innerHTML = `
                    <td class="px-4 py-3 text-left font-bold text-slate-800">${item.monthStr}</td>
                    <td class="px-4 py-3 font-mono text-center ${crClass}">${safeCr.toFixed(2)}</td>
                    <td class="px-4 py-3 font-mono text-center ${qrClass}">${safeQr.toFixed(2)}</td>
                    <td class="px-4 py-3 font-mono text-center ${cashClass}">${safeCash.toFixed(2)}</td>
                    <td class="px-4 py-3 font-mono text-right ${nwcClass}">${safeNwc.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</td>
                    <td class="px-4 py-3 font-mono text-right ${niClass}">${safeNi.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</td>
                    <td class="px-4 py-3 font-bold text-slate-800 text-center">${safeRisk}</td>
                    <td class="px-4 py-3 text-center"><span class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${levelClass}">${safeLevelText}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Render Trend Chart
        const canvas = document.getElementById('distressTrendChartCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (distressTrendChartInstance) {
            distressTrendChartInstance.destroy();
        }

        const labels = monthDistressList.map(item => item.monthStr);
        const riskScores = monthDistressList.map(item => typeof item.data.riskScore !== 'undefined' ? item.data.riskScore : 0);

        distressTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'คะแนนความเสี่ยง Risk Scoring (0 - 7)',
                        data: riskScores,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.05)',
                        borderWidth: 3,
                        tension: 0.35,
                        pointBackgroundColor: '#f43f5e',
                        pointBorderColor: '#f43f5e',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        yAxisID: 'y_score'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: "'Sarabun', sans-serif", weight: 'bold' }
                        }
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" }
                    },
                    datalabels: {
                        display: (context) => window.shouldShowLabels ? window.shouldShowLabels('distressTrendChartCanvas') : true,
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 },
                        formatter: (value) => value
                    }
                },
                scales: {
                    y_score: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 7,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => value + ' คะแนน'
                        },
                        title: { display: true, text: 'คะแนน Risk Score' }
                    }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });
    } catch (err) {
        console.error("Error in renderFinancialDistressDashboard:", err);
    }
}

// Setup checkbox and action button listeners
function setupAnalysisEvents() {
    const checkboxes = document.querySelectorAll('input[name="analysis_metric"]');

    const toggleLabelsCheckbox = document.getElementById('toggleAnalysisDataLabels');
    if (toggleLabelsCheckbox) {
        toggleLabelsCheckbox.addEventListener('change', () => {
            updateAnalysisCompareChart();
        });
    }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateAnalysisCompareChart();
        });

        // Add hover effects to trigger dashed lines on the chart
        const labelEl = cb.closest('label');
        if (labelEl) {
            labelEl.addEventListener('mouseenter', () => {
                highlightDatasetInChart(cb.value, true);
            });
            labelEl.addEventListener('mouseleave', () => {
                highlightDatasetInChart(cb.value, false);
            });
        }
    });

    const btnSelectAll = document.getElementById('btnAnalysisSelectAll');
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = true;
            });
            updateAnalysisCompareChart();
        });
    }

    const btnClear = document.getElementById('btnAnalysisClear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = false;
            });
            updateAnalysisCompareChart();
        });
    }
}

// Render dynamic dual Y-axes chart comparing selected metrics
function updateAnalysisCompareChart() {
    const canvas = document.getElementById('analysisCompareChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance
    if (analysisCompareChartInstance) {
        try {
            analysisCompareChartInstance.destroy();
        } catch (e) {
            console.error("Error destroying analysisCompareChartInstance:", e);
        }
        analysisCompareChartInstance = null;
    }

    if (monthlyResults.length === 0) return;

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    // Build timeline labels
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const labels = filteredMonths.map(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        return `${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`;
    });

    const activeMetrics = [];
    const checkboxes = document.querySelectorAll('input[name="analysis_metric"]:checked');
    checkboxes.forEach(cb => {
        activeMetrics.push(cb.value);
    });
    activeMetricsList = activeMetrics; // Sync global metrics list

    if (activeMetrics.length === 0) {
        // Render empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "14px 'Sarabun', sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.textAlign = "center";
        ctx.fillText("กรุณาเลือกตัวชี้วัดฝั่งซ้ายอย่างน้อย 1 รายการเพื่อเริ่มแสดงกราฟเปรียบเทียบ", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Config map for all available metrics
    const metricConfigs = {
        // Amounts / Currency Group (y_currency Axis)
        'revenue': { label: 'รายได้สะสม', color: '#10B981', isCurrency: true, axis: 'y_currency', type: 'line' },
        'expenses': { label: 'รายจ่ายสะสม', color: '#EF4444', isCurrency: true, axis: 'y_currency', type: 'line' },
        'netProfit': { label: 'กำไรสุทธิสะสม', color: '#0284C7', isCurrency: true, axis: 'y_currency', type: 'bar' },
        'ebitda': { label: 'EBITDA', color: '#8B5CF6', isCurrency: true, axis: 'y_currency', type: 'bar' },
        'cash': { label: 'เงินสดสะสม', color: '#6366F1', isCurrency: true, axis: 'y_currency', type: 'line' },
        'nwc': { label: 'ทุนหมุนเวียนสุทธิ (NWC)', color: '#0D9488', isCurrency: true, axis: 'y_currency', type: 'line' },
        'netReserve': { label: 'เงินบำรุงคงเหลือสุทธิ', color: '#059669', isCurrency: true, axis: 'y_currency', type: 'bar' },

        // Percentages Group (y_percent Axis)
        'operatingMargin': { label: 'Operating Margin (%)', color: '#10B981', isPercent: true, axis: 'y_percent', type: 'line' },
        'returnOnAsset': { label: 'Return on Asset (ROA %)', color: '#EC4899', isPercent: true, axis: 'y_percent', type: 'line' },

        // Ratios Group (y_ratio Axis)
        'currentRatio': { label: 'Current Ratio', color: '#2563EB', isRatio: true, axis: 'y_ratio', type: 'line' },
        'quickRatio': { label: 'Quick Ratio', color: '#06B6D4', isRatio: true, axis: 'y_ratio', type: 'line' },
        'cashRatio': { label: 'Cash Ratio', color: '#D97706', isRatio: true, axis: 'y_ratio', type: 'line' },

        // Days Group (y_days Axis)
        'apDrugSuppliesDays': { label: 'ระยะเวลาจ่ายหนี้ AP (วัน)', color: '#F59E0B', isDays: true, axis: 'y_days', type: 'line' },
        'arUCDays': { label: 'ระยะเวลาเก็บหนี้ AR UC (วัน)', color: '#3B82F6', isDays: true, axis: 'y_days', type: 'line' },
        'invDays': { label: 'ระยะเวลาขายคลัง INV (วัน)', color: '#8B5CF6', isDays: true, axis: 'y_days', type: 'line' }
    };

    let hasCurrency = false;
    let hasPercent = false;
    let hasRatio = false;
    let hasDays = false;

    const datasets = activeMetrics.map(metric => {
        const config = metricConfigs[metric];
        if (!config) return null;

        if (config.axis === 'y_currency') hasCurrency = true;
        if (config.axis === 'y_percent') hasPercent = true;
        if (config.axis === 'y_ratio') hasRatio = true;
        if (config.axis === 'y_days') hasDays = true;

        // Fetch values YTD
        const dataValues = filteredMonths.map(month => {
            const dbRes = month.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(month, monthlyResults) : {});

            if (metric === 'revenue') return sumAccounts(month.tbData, '4', true);
            if (metric === 'expenses') return sumAccounts(month.tbData, '5', false);
            if (metric === 'netProfit') return sumAccounts(month.tbData, '4', true) - sumAccounts(month.tbData, '5', false);
            if (metric === 'cash') return sumAccounts(month.tbData, '1101', false);
            if (metric === 'ebitda') return sumMgtAccount(month.tbData, 'EBITDA');
            if (metric === 'nwc') return dbRes.nwc || 0;
            if (metric === 'netReserve') return dbRes.netReserve || 0;

            if (metric === 'currentRatio') return dbRes.currentRatio || 0;
            if (metric === 'quickRatio') return dbRes.quickRatio || 0;
            if (metric === 'cashRatio') return dbRes.cashRatio || 0;
            if (metric === 'operatingMargin') return (dbRes.operatingMargin || 0) * 100; // convert to %
            if (metric === 'returnOnAsset') return (dbRes.returnOnAsset || 0) * 100; // convert to %
            if (metric === 'apDrugSuppliesDays') return dbRes.apDrugSuppliesDays || 0;
            if (metric === 'arUCDays') return dbRes.arUCDays || 0;
            if (metric === 'invDays') return dbRes.invDays || 0;

            return 0;
        });

        const dataset = {
            type: config.type,
            label: config.label,
            data: dataValues,
            borderColor: config.color,
            backgroundColor: config.type === 'bar' ? `${config.color}33` : 'transparent',
            borderWidth: 3,
            yAxisID: config.axis,
            tension: 0.35,
            spanGaps: true
        };

        if (config.type === 'line') {
            dataset.pointBackgroundColor = config.color;
            dataset.pointBorderColor = config.color;
            dataset.pointBorderWidth = 2;
            dataset.pointRadius = 4.5;
            dataset.pointHoverRadius = 6.5;
        } else {
            dataset.borderRadius = 6;
            dataset.borderWidth = 1.5;
            dataset.borderColor = config.color;
        }

        return dataset;

    }).filter(d => d !== null);

    // Dynamic scale configuration
    const scalesConfig = {
        x: {
            title: { display: true, text: 'รอบเดือน' }
        }
    };

    if (hasCurrency) {
        scalesConfig.y_currency = {
            position: 'left',
            title: { display: true, text: 'จำนวนเงิน (บาท)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => formatAbbreviated(value)
            }
        };
    }

    if (hasPercent) {
        scalesConfig.y_percent = {
            position: 'right',
            title: { display: true, text: 'เปอร์เซ็นต์ (%)' },
            ticks: {
                callback: (value) => value + ' %'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    if (hasRatio) {
        scalesConfig.y_ratio = {
            position: 'right',
            title: { display: true, text: 'อัตราส่วน (เท่า)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => value + ' เท่า'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    if (hasDays) {
        scalesConfig.y_days = {
            position: 'left',
            title: { display: true, text: 'ระยะเวลา (วัน)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => value + ' วัน'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }
    analysisCompareChartInstance = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: datasets
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: "'Sarabun', sans-serif", weight: 'bold' }
                    },
                    onHover: (event, legendItem, legend) => {
                        const chart = legend.chart;
                        const hoveredIndex = legendItem.datasetIndex;
                        const datasetLabel = chart.data.datasets[hoveredIndex]?.label;

                        const metricEntry = Object.entries(metricConfigs).find(([key, cfg]) => cfg.label === datasetLabel);
                        activeHighlightedMetric = metricEntry ? metricEntry[0] : null;

                        chart.data.datasets.forEach((dataset, index) => {
                            if (index === hoveredIndex) {
                                dataset.borderDash = [6, 4];
                                dataset.borderWidth = 5;
                            } else {
                                dataset.borderDash = [];
                                dataset.borderWidth = 3;
                                dataset.borderDashOffset = 0;
                            }
                        });

                        if (!animationFrameId && activeHighlightedMetric) {
                            animateDash();
                        }
                    },
                    onLeave: (event, legendItem, legend) => {
                        const chart = legend.chart;
                        activeHighlightedMetric = null;
                        if (animationFrameId) {
                            cancelAnimationFrame(animationFrameId);
                            animationFrameId = null;
                        }
                        chart.data.datasets.forEach(dataset => {
                            dataset.borderDash = [];
                            dataset.borderWidth = 3;
                            dataset.borderDashOffset = 0;
                        });
                        chart.update('none');
                    }
                },
                tooltip: {
                    padding: 10,
                    borderRadius: 8,
                    titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                    bodyFont: { family: "'Sarabun', sans-serif" },
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            const label = context.dataset.label;
                            const config = Object.values(metricConfigs).find(cfg => cfg.label === label);

                            if (!config) return ` ${label}: ${val}`;

                            if (config.isCurrency) {
                                return ` ${label}: ${Number(val).toLocaleString('th-TH')} บาท`;
                            } else if (config.isPercent) {
                                return ` ${label}: ${val.toFixed(2)} %`;
                            } else if (config.isDays) {
                                return ` ${label}: ${Math.round(val)} วัน`;
                            } else if (config.isRatio) {
                                return ` ${label}: ${val.toFixed(2)} เท่า`;
                            }
                            return ` ${label}: ${val}`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('analysisCompareChartCanvas') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 4,
                    color: '#1E293B',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 9 },
                    formatter: (value, context) => {
                        const label = context.dataset.label;
                        const config = Object.values(metricConfigs).find(cfg => cfg.label === label);

                        if (!config || value === 0) return '';
                        if (config.isCurrency) return formatAbbreviated(value);
                        if (config.isPercent) return value.toFixed(1) + '%';
                        if (config.isDays) return Math.round(value) + 'วัน';
                        return value.toFixed(1);
                    }
                }
            },
            scales: scalesConfig
        }
    });
}

function highlightDatasetInChart(metricValue, isHighlighted) {
    if (!analysisCompareChartInstance) return;

    if (isHighlighted) {
        activeHighlightedMetric = metricValue;

        const metricLabelMap = {
            'revenue': 'รายได้สะสม',
            'expenses': 'รายจ่ายสะสม',
            'netProfit': 'กำไรสุทธิสะสม',
            'ebitda': 'EBITDA',
            'cash': 'เงินสดสะสม',
            'nwc': 'ทุนหมุนเวียนสุทธิ (NWC)',
            'netReserve': 'เงินบำรุงคงเหลือสุทธิ',
            'currentRatio': 'Current Ratio',
            'quickRatio': 'Quick Ratio',
            'cashRatio': 'Cash Ratio',
            'operatingMargin': 'Operating Margin (%)',
            'returnOnAsset': 'Return on Asset (ROA %)',
            'apDrugSuppliesDays': 'ระยะเวลาจ่ายหนี้ AP (วัน)',
            'arUCDays': 'ระยะเวลาเก็บหนี้ AR UC (วัน)',
            'invDays': 'ระยะเวลาขายคลัง INV (วัน)'
        };
        const targetLabel = metricLabelMap[metricValue];

        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            if (dataset.label === targetLabel) {
                dataset.borderDash = [6, 4];
                dataset.borderWidth = 5;
            } else {
                dataset.borderDash = [];
                dataset.borderWidth = 3;
                dataset.borderDashOffset = 0;
            }
        });

        if (!animationFrameId) {
            animateDash();
        }
    } else {
        activeHighlightedMetric = null;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            dataset.borderDash = [];
            dataset.borderWidth = 3;
            dataset.borderDashOffset = 0;
        });
        analysisCompareChartInstance.update('none');
    }
}

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
    if (typeof MGT_ACCOUNTS_MAP !== 'undefined') {
        MGT_ACCOUNTS_MAP.forEach(item => { mgtByCode[item.code] = item; });
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
        type: 'bar',
        data: {
            labels: [label],
            datasets: datasets
        },
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
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
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
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${color};"></span>
                <span class="truncate max-w-[120px] font-semibold">${comp.label}</span>
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
    const ebitda = wRes.ebitda || 0;


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

// ==========================================================
// ส่วนจัดการการปันส่วนต้นทุนค่ารักษาพยาบาล (Treatment Cost Allocation)
// ==========================================================

let treatmentCostTrendChartInstance = null;
let treatmentCostDashOffset = 0;
let treatmentCostAnimationId = null;
let activeHoveredDatasetInfo = null;

function animateTreatmentCostDashes() {
    if (!activeHoveredDatasetInfo) {
        treatmentCostAnimationId = null;
        return;
    }
    treatmentCostDashOffset -= 0.4;
    if (treatmentCostDashOffset < -20) treatmentCostDashOffset = 0;

    const { chartInstance, datasetIndex } = activeHoveredDatasetInfo;
    if (chartInstance && chartInstance.data && chartInstance.data.datasets[datasetIndex]) {
        chartInstance.data.datasets[datasetIndex].borderDashOffset = treatmentCostDashOffset;
        chartInstance.update('none');
    }
    treatmentCostAnimationId = requestAnimationFrame(animateTreatmentCostDashes);
}

function renderCustomLegend(chartInstance, legendContainerId) {
    const container = document.getElementById(legendContainerId);
    if (!container) return;
    container.innerHTML = '';

    chartInstance.data.datasets.forEach((dataset, index) => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer";

        const isVisible = chartInstance.isDatasetVisible(index);
        if (isVisible) {
            btn.style.backgroundColor = dataset.borderColor;
            btn.style.borderColor = dataset.borderColor;
            btn.style.color = '#ffffff';
        } else {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }

        const dot = document.createElement('span');
        dot.className = "w-2 h-2 rounded-full";
        dot.style.backgroundColor = isVisible ? '#ffffff' : dataset.borderColor;
        btn.appendChild(dot);

        const text = document.createElement('span');
        text.textContent = dataset.label;
        btn.appendChild(text);

        btn.addEventListener('click', () => {
            const meta = chartInstance.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !chartInstance.data.datasets[index].hidden : null;
            chartInstance.update();
            renderCustomLegend(chartInstance, legendContainerId);
        });

        btn.addEventListener('mouseenter', () => {
            dataset.borderDash = [6, 4];
            activeHoveredDatasetInfo = { chartInstance, datasetIndex: index };
            if (!treatmentCostAnimationId) {
                treatmentCostDashOffset = 0;
                animateTreatmentCostDashes();
            }
        });

        btn.addEventListener('mouseleave', () => {
            dataset.borderDash = undefined;
            dataset.borderDashOffset = 0;
            chartInstance.update('none');
            activeHoveredDatasetInfo = null;
        });

        container.appendChild(btn);
    });
}

function renderTreatmentCost() {
    if (!monthlyResults || monthlyResults.length === 0) return;

    const emptyState = document.getElementById('treatmentCostEmptyState');
    const contentPanel = document.getElementById('treatmentCostContent');

    if (!window.hospitalData) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (contentPanel) contentPanel.classList.add('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (contentPanel) contentPanel.classList.remove('hidden');
    }

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;
    if (filteredMonths.length === 0) {
        if (opdCostPerVisitChartInstance) { opdCostPerVisitChartInstance.destroy(); opdCostPerVisitChartInstance = null; }
        if (ipdCostPerAdjRWChartInstance) { ipdCostPerAdjRWChartInstance.destroy(); ipdCostPerAdjRWChartInstance = null; }
        if (costRevenueBreakdownChartInstance) { costRevenueBreakdownChartInstance.destroy(); costRevenueBreakdownChartInstance = null; }
        return;
    }

    const labels = filteredMonths.map(m => m.monthStr || m.filename.replace('.xlsx', '').replace('.xls', ''));

    // 1. Render OPD Cost per Visit Chart
    const opdVisitCanvas = document.getElementById('opdCostPerVisitChartCanvas');
    if (opdVisitCanvas) {
        if (opdCostPerVisitChartInstance) opdCostPerVisitChartInstance.destroy();
        const opdVisitData = filteredMonths.map(m => {
            const metrics = calculateTreatmentCostMetricsForMonth(m);
            const visitOPD = getHospitalValue('VisitOPD', m.dateObj) || 0;
            return visitOPD > 0 ? (metrics.opdCost / visitOPD) : 0;
        });

        const opdCosts = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).opdCost);
        const opdVisits = filteredMonths.map(m => getHospitalValue('VisitOPD', m.dateObj) || 0);

        opdCostPerVisitChartInstance = new Chart(opdVisitCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ต้นทุนบริการผู้ป่วยนอกต่อครั้ง (บาท/ครั้ง)',
                        data: opdVisitData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#4f46e5',
                        pointBorderColor: '#4f46e5',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'ต้นทุน OPD (บาท)',
                        data: opdCosts,
                        borderColor: '#818cf8',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#818cf8',
                        pointBorderColor: '#818cf8',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_opd_cost',
                        hidden: true
                    },
                    {
                        label: 'VisitOPD (ครั้ง)',
                        data: opdVisits,
                        borderColor: '#34d399',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#34d399',
                        pointBorderColor: '#34d399',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_visit_opd',
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                if (context.datasetIndex === 0) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ครั้ง`;
                                } else if (context.datasetIndex === 1) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                } else {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} ครั้ง`;
                                }
                            }
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('opdCostPerVisitChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: { font: { family: "'Sarabun', sans-serif", size: 10 } },
                        title: { display: true, text: 'บาท / ครั้ง', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    y_opd_cost: {
                        type: 'linear',
                        display: false
                    },
                    y_visit_opd: {
                        type: 'linear',
                        display: false
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(opdCostPerVisitChartInstance, 'opdCostPerVisitLegend');
    }

    // 2. Render IPD Cost per AdjRW Chart
    const ipdAdjRWCanvas = document.getElementById('ipdCostPerAdjRWChartCanvas');
    if (ipdAdjRWCanvas) {
        if (ipdCostPerAdjRWChartInstance) ipdCostPerAdjRWChartInstance.destroy();
        const ipdAdjRWData = filteredMonths.map(m => {
            const metrics = calculateTreatmentCostMetricsForMonth(m);
            const adjRW = getHospitalValue('AdjRW', m.dateObj) || 0;
            return adjRW > 0 ? (metrics.ipdCost / adjRW) : 0;
        });

        const opdCosts = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).opdCost);
        const opdVisits = filteredMonths.map(m => getHospitalValue('VisitOPD', m.dateObj) || 0);
        const adjRWs = filteredMonths.map(m => getHospitalValue('AdjRW', m.dateObj) || 0);
        const patientDays = filteredMonths.map(m => getHospitalValue('วันนอน', m.dateObj) || 0);

        ipdCostPerAdjRWChartInstance = new Chart(ipdAdjRWCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ต้นทุนบริการผู้ป่วยในต่อ AdjRW (บาท/AdjRW)',
                        data: ipdAdjRWData,
                        borderColor: '#e11d48',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#e11d48',
                        pointBorderColor: '#e11d48',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'AdjRW',
                        data: adjRWs,
                        borderColor: '#f59e0b',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#f59e0b',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_adjrw',
                        hidden: true
                    },
                    {
                        label: 'วันนอน (วัน)',
                        data: patientDays,
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#06b6d4',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_patientdays',
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                if (context.datasetIndex === 0) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/AdjRW`;
                                } else if (context.datasetIndex === 1) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                } else if (context.datasetIndex === 2) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} ครั้ง`;
                                } else if (context.datasetIndex === 3) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AdjRW`;
                                } else {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} วัน`;
                                }
                            }
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('ipdCostPerAdjRWChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: { font: { family: "'Sarabun', sans-serif", size: 10 } },
                        title: { display: true, text: 'บาท / AdjRW', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    y_opd_cost: {
                        type: 'linear',
                        display: false
                    },
                    y_visit_opd: {
                        type: 'linear',
                        display: false
                    },
                    y_adjrw: {
                        type: 'linear',
                        display: false
                    },
                    y_patientdays: {
                        type: 'linear',
                        display: false
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(ipdCostPerAdjRWChartInstance, 'ipdCostPerAdjRWLegend');
    }

    // 3. Render Cost and Revenue Breakdown Chart
    const breakdownCanvas = document.getElementById('costRevenueBreakdownChartCanvas');
    if (breakdownCanvas) {
        if (costRevenueBreakdownChartInstance) costRevenueBreakdownChartInstance.destroy();

        const opdRevs = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).opdRev);
        const ipdRevs = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).ipdRev);
        const lcs = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).lc);
        const mcs = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).mc);
        const ccs = filteredMonths.map(m => calculateTreatmentCostMetricsForMonth(m).cc);

        costRevenueBreakdownChartInstance = new Chart(breakdownCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'รายได้ OPD',
                        data: opdRevs,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        hidden: false
                    },
                    {
                        label: 'รายได้ IPD',
                        data: ipdRevs,
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#06b6d4',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        hidden: false
                    },
                    {
                        label: 'ต้นทุนค่าแรง (LC)',
                        data: lcs,
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ef4444',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: true
                    },
                    {
                        label: 'ต้นทุนค่ายา/เวชภัณฑ์ (MC)',
                        data: mcs,
                        borderColor: '#f59e0b',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#f59e0b',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: true
                    },
                    {
                        label: 'ต้นทุนค่าเสื่อม (CC)',
                        data: ccs,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#8b5cf6',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('th-TH')} บาท`
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('costRevenueBreakdownChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            font: { family: "'Sarabun', sans-serif", size: 10 },
                            callback: (value) => formatAbbreviated(value)
                        },
                        title: { display: true, text: 'จำนวนเงิน (บาท)', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(costRevenueBreakdownChartInstance, 'costRevenueBreakdownLegend');
    }
}
