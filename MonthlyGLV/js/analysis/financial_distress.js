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

        // Initialize or validate selected month index
        const monthSelect = document.getElementById('distressMonthSelect');
        if (monthSelect) {
            if (monthSelect.options.length !== monthDistressList.length) {
                monthSelect.innerHTML = monthDistressList.map((m, idx) => `
                    <option value="${idx}">${m.monthStr}</option>
                `).join('');
                
                if (window.distressSelectedMonthIndex === undefined || window.distressSelectedMonthIndex >= monthDistressList.length) {
                    window.distressSelectedMonthIndex = monthDistressList.length - 1;
                }
            }
            monthSelect.value = window.distressSelectedMonthIndex;

            if (!monthSelect.dataset.listenerAttached) {
                monthSelect.addEventListener('change', () => {
                    window.distressSelectedMonthIndex = parseInt(monthSelect.value, 10);
                    renderFinancialDistressDashboard();
                });
                monthSelect.dataset.listenerAttached = "true";
            }
        }

        if (window.distressSelectedMonthIndex === undefined || window.distressSelectedMonthIndex >= monthDistressList.length) {
            window.distressSelectedMonthIndex = monthDistressList.length - 1;
        }

        // Hook Prev/Next buttons
        const btnPrev = document.getElementById('btnDistressPrevMonth');
        const btnNext = document.getElementById('btnDistressNextMonth');
        if (btnPrev) {
            btnPrev.disabled = window.distressSelectedMonthIndex <= 0;
            if (!btnPrev.dataset.listenerAttached) {
                btnPrev.addEventListener('click', () => {
                    if (window.distressSelectedMonthIndex > 0) {
                        window.distressSelectedMonthIndex--;
                        renderFinancialDistressDashboard();
                    }
                });
                btnPrev.dataset.listenerAttached = "true";
            }
        }
        if (btnNext) {
            btnNext.disabled = window.distressSelectedMonthIndex >= monthDistressList.length - 1;
            if (!btnNext.dataset.listenerAttached) {
                btnNext.addEventListener('click', () => {
                    if (window.distressSelectedMonthIndex < monthDistressList.length - 1) {
                        window.distressSelectedMonthIndex++;
                        renderFinancialDistressDashboard();
                    }
                });
                btnNext.dataset.listenerAttached = "true";
            }
        }

        const selectedIndex = window.distressSelectedMonthIndex;
        const latest = monthDistressList[selectedIndex];
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

        const distressMetricCheckboxes = document.querySelectorAll('input[name="distress_chart_metric"]');
        distressMetricCheckboxes.forEach(cb => {
            if (!cb.dataset.listenerAttached) {
                cb.addEventListener('change', () => {
                    renderFinancialDistressDashboard();
                });
                cb.dataset.listenerAttached = "true";
            }
        });

        const checkedCheckboxes = Array.from(document.querySelectorAll('input[name="distress_chart_metric"]:checked'));
        let activeMetrics = checkedCheckboxes.map(cb => cb.value);
        if (activeMetrics.length === 0) {
            activeMetrics = ['riskScore'];
            const defaultCb = document.querySelector('input[name="distress_chart_metric"][value="riskScore"]');
            if (defaultCb) defaultCb.checked = true;
        }

        const metricConfigMap = {
            'riskScore': { label: 'คะแนนความเสี่ยง Risk Score', color: '#f43f5e', unit: 'คะแนน', axis: 'score' },
            'cr': { label: 'Current Ratio (CR)', color: '#38bdf8', unit: '%', axis: 'ratio' },
            'qr': { label: 'Quick Ratio (QR)', color: '#60a5fa', unit: '%', axis: 'ratio' },
            'cashRatio': { label: 'Cash Ratio', color: '#818cf8', unit: '%', axis: 'ratio' },
            'liquidScore': { label: 'คะแนน Liquid Index', color: '#a78bfa', unit: 'คะแนน', axis: 'score' },
            'nwc': { label: 'เงินทุนหมุนเวียนสุทธิ (NWC)', color: '#34d399', unit: 'บาท', axis: 'currency' },
            'ni': { label: 'กำไรสุทธิ (NI)', color: '#059669', unit: 'บาท', axis: 'currency' },
            'statusScore': { label: 'คะแนน Status Index', color: '#10b981', unit: 'คะแนน', axis: 'score' },
            'survivalMonths': { label: 'ระยะเวลาทุนหมด (เดือน)', color: '#fb7185', unit: 'เดือน', axis: 'months' },
            'survivalScore': { label: 'คะแนน Survival Index', color: '#ec4899', unit: 'คะแนน', axis: 'score' }
        };

        const showCurrency = activeMetrics.some(m => metricConfigMap[m]?.axis === 'currency');
        const showScore = activeMetrics.some(m => metricConfigMap[m]?.axis === 'score');
        const showRatio = activeMetrics.some(m => metricConfigMap[m]?.axis === 'ratio');
        const showMonths = activeMetrics.some(m => metricConfigMap[m]?.axis === 'months');

        // Determine axis positions (if no currency is shown, the first active right axis takes the left position)
        let currencyPos = 'left';
        let scorePos = 'right';
        let ratioPos = 'right';
        let monthsPos = 'right';

        if (!showCurrency) {
            if (showScore) {
                scorePos = 'left';
            } else if (showRatio) {
                ratioPos = 'left';
            } else if (showMonths) {
                monthsPos = 'left';
            }
        }

        const labels = monthDistressList.map(item => item.monthStr);
        const datasets = activeMetrics.map(metric => {
            const config = metricConfigMap[metric];
            const color = config ? config.color : '#6366f1';
            
            const data = monthDistressList.map(item => {
                let val = item.data[metric];
                if (metric === 'cr' || metric === 'qr' || metric === 'cashRatio') {
                    val = (typeof val === 'number') ? val * 100 : 0;
                } else if (metric === 'survivalMonths') {
                    const nwcVal = typeof item.data.nwc === 'number' ? item.data.nwc : 0;
                    const niVal = typeof item.data.ni === 'number' ? item.data.ni : 0;
                    val = (nwcVal >= 0 && niVal >= 0)
                        ? (item.data.monthsToChange || 0)
                        : (nwcVal < 0 && niVal < 0) ? 0 : (item.data.monthsToChange || 0);
                    if (val === 999) val = 12; // cap for display
                }
                return typeof val === 'number' && !isNaN(val) ? val : 0;
            });

            let yAxisID = 'y_score';
            if (config.axis === 'currency') yAxisID = 'y_currency';
            else if (config.axis === 'ratio') yAxisID = 'y_ratio';
            else if (config.axis === 'months') yAxisID = 'y_months';

            return {
                label: config ? config.label : metric,
                data: data,
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 3,
                tension: 0.35,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointBorderWidth: 2,
                pointRadius: 5,
                yAxisID: yAxisID
            };
        });

        distressTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
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
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: function (context) {
                                const metric = activeMetrics[context.datasetIndex];
                                const config = metricConfigMap[metric];
                                let valStr = context.parsed.y;
                                if (config && config.axis === 'currency') {
                                    valStr = Number(valStr).toLocaleString('th-TH', { maximumFractionDigits: 0 }) + ' บาท';
                                } else if (config) {
                                    valStr = Number(valStr).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' ' + config.unit;
                                }
                                return ` ${context.dataset.label}: ${valStr}`;
                            }
                        }
                    },
                    datalabels: {
                        display: (context) => window.shouldShowLabels ? window.shouldShowLabels('distressTrendChartCanvas') : true,
                        align: 'top',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 4,
                        color: function(context) {
                            const metric = activeMetrics[context.datasetIndex];
                            return metricConfigMap[metric]?.color || '#f43f5e';
                        },
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: function(value, context) {
                            const metric = activeMetrics[context.datasetIndex];
                            const config = metricConfigMap[metric];
                            if (config && config.axis === 'currency') {
                                return formatAbbreviated(value);
                            }
                            if (config && config.axis === 'ratio') {
                                return value.toFixed(1) + '%';
                            }
                            return value;
                        }
                    }
                },
                scales: {
                    y_currency: {
                        type: 'linear',
                        position: currencyPos,
                        display: showCurrency,
                        beginAtZero: true,
                        title: { display: true, text: 'จำนวนเงิน (บาท)' },
                        ticks: {
                            callback: function(value) {
                                return formatAbbreviated(value);
                            }
                        }
                    },
                    y_score: {
                        type: 'linear',
                        position: scorePos,
                        display: showScore,
                        beginAtZero: true,
                        min: 0,
                        max: 7,
                        title: { display: true, text: 'คะแนนความเสี่ยง (Score)' },
                        grid: {
                            drawOnChartArea: scorePos === 'left'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: (value) => value
                        }
                    },
                    y_ratio: {
                        type: 'linear',
                        position: ratioPos,
                        display: showRatio,
                        beginAtZero: true,
                        title: { display: true, text: 'อัตราส่วน (%)' },
                        grid: {
                            drawOnChartArea: ratioPos === 'left'
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    },
                    y_months: {
                        type: 'linear',
                        position: monthsPos,
                        display: showMonths,
                        beginAtZero: true,
                        title: { display: true, text: 'ระยะเวลา (เดือน)' },
                        grid: {
                            drawOnChartArea: monthsPos === 'left'
                        },
                        ticks: {
                            callback: (value) => value + ' ด.'
                        }
                    }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });
    } catch (err) {
        console.error("Error in renderFinancialDistressDashboard:", err);
    }
}
