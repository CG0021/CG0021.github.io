// ==========================================================
// Total Performance Score (TPS) Calculation & Render Logic
// ==========================================================
function renderTotalPerformanceScore() {
    if (monthlyResults.length === 0) return;
    
    const latestMonth = monthlyResults[monthlyResults.length - 1];
    const tbData = latestMonth.tbData;
    const dbRes = latestMonth.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(latestMonth, monthlyResults) : {});
    
    const apDrugDays = dbRes.apDrugSuppliesDays || 0;
    const arUCDays = dbRes.arUCDays || 0;
    const arCGDDays = dbRes.arCGDDays || 0;
    const invDays = dbRes.invDays || 0;
    const operatingMargin = dbRes.operatingMargin || 0;
    const returnOnAsset = dbRes.returnOnAsset || 0;
    const nwc = dbRes.nwc || 0;
    const cashRatio = dbRes.cashRatio || 0;
    const ebitda = typeof sumMgtAccount === 'function' ? sumMgtAccount(tbData, 'EBITDA') : 0;
    
    // Calculate default auto-scores from database
    let auto_1_2_1 = 0;
    if (apDrugDays <= 90) auto_1_2_1 = 1.0;
    else if (apDrugDays <= 180) auto_1_2_1 = 0.5;

    const auto_1_2_2 = (arUCDays <= 60) ? 0.5 : 0.0;
    const auto_1_2_3 = (arCGDDays <= 60) ? 0.5 : 0.0;
    
    const isIsland = window.tpsManualScores ? !!window.tpsManualScores.isIslandHospital : false;
    const invLimit = isIsland ? 90 : 60;
    const auto_1_2_4 = (invDays <= invLimit) ? 1.0 : 0.0;

    const auto_2_1_1 = (operatingMargin >= 0) ? 1.0 : 0.0;
    const auto_2_1_2 = (returnOnAsset >= 0) ? 1.0 : 0.0;
    const auto_2_1_3 = (ebitda >= 0) ? 1.0 : 0.0;
    const auto_2_2_1 = (nwc >= 0) ? 1.0 : 0.0;
    const auto_2_2_2 = (cashRatio >= 0.8) ? 1.0 : 0.0;

    window.tpsManualScores = window.tpsManualScores || {
        m1_1_1: 0.0,
        m1_1_2: 0.0,
        m1_2_1: auto_1_2_1,
        m1_2_2: auto_1_2_2,
        m1_2_3: auto_1_2_3,
        m1_2_4: auto_1_2_4,
        m1_3_1_1: 0.0,
        m1_3_1_2: 0.0,
        m1_3_1_3: 0.0,
        m1_3_1_4: 0.0,
        m1_3_1_5: 0.0,
        m1_3_1_6: 0.0,
        m1_3_2: 0.0,
        m1_3_3_1: (getHospitalValue('อัตราครองเตียง', latestMonth.dateObj) || 0) >= 80 ? 1.0 : 0.0,
        m1_3_3_2: 0.0,
        m2_1_1: auto_2_1_1,
        m2_1_2: auto_2_1_2,
        m2_1_3: auto_2_1_3,
        m2_2_1: auto_2_2_1,
        m2_2_2: auto_2_2_2,
        isIslandHospital: isIsland
    };
    
    const ms = window.tpsManualScores;
    
    // Read from ms or fallback to auto score
    const s1_2_1 = ms.m1_2_1 !== undefined ? parseFloat(ms.m1_2_1) : auto_1_2_1;
    const s1_2_2 = ms.m1_2_2 !== undefined ? parseFloat(ms.m1_2_2) : auto_1_2_2;
    const s1_2_3 = ms.m1_2_3 !== undefined ? parseFloat(ms.m1_2_3) : auto_1_2_3;
    const s1_2_4 = ms.m1_2_4 !== undefined ? parseFloat(ms.m1_2_4) : auto_1_2_4;

    const s2_1_1 = ms.m2_1_1 !== undefined ? parseFloat(ms.m2_1_1) : auto_2_1_1;
    const s2_1_2 = ms.m2_1_2 !== undefined ? parseFloat(ms.m2_1_2) : auto_2_1_2;
    const s2_1_3 = ms.m2_1_3 !== undefined ? parseFloat(ms.m2_1_3) : auto_2_1_3;
    const s2_2_1 = ms.m2_2_1 !== undefined ? parseFloat(ms.m2_2_1) : auto_2_2_1;
    const s2_2_2 = ms.m2_2_2 !== undefined ? parseFloat(ms.m2_2_2) : auto_2_2_2;
    
    const s1_1 = parseFloat(ms.m1_1_1) + parseFloat(ms.m1_1_2);
    const s1_2 = s1_2_1 + s1_2_2 + s1_2_3 + s1_2_4;
    
    const raw_1_3_1 = parseFloat(ms.m1_3_1_1) + parseFloat(ms.m1_3_1_2) + parseFloat(ms.m1_3_1_3) + parseFloat(ms.m1_3_1_4) + parseFloat(ms.m1_3_1_5) + parseFloat(ms.m1_3_1_6);
    const s1_3_1 = Math.min(2.0, raw_1_3_1);
    const s1_3 = s1_3_1 + parseFloat(ms.m1_3_2) + (parseFloat(ms.m1_3_3_1) + parseFloat(ms.m1_3_3_2));
    
    const s1 = s1_1 + s1_2 + s1_3;
    const s2_1 = s2_1_1 + s2_1_2 + s2_1_3;
    const s2_2 = s2_2_1 + s2_2_2;
    const s2 = s2_1 + s2_2;
    
    const totalScore = s1 + s2;
    
    let grade = '';
    let containerClass = '';
    let labelClass = '';
    let valueClass = '';
    if (totalScore >= 12) {
        grade = 'A ดีมาก';
        containerClass = 'bg-emerald-50 border-emerald-200';
        labelClass = 'text-emerald-700';
        valueClass = 'text-emerald-600';
    } else if (totalScore >= 10.5) {
        grade = 'B ดี';
        containerClass = 'bg-sky-50 border-sky-200';
        labelClass = 'text-sky-700';
        valueClass = 'text-sky-600';
    } else if (totalScore >= 9) {
        grade = 'C พอใช้';
        containerClass = 'bg-amber-50 border-amber-200';
        labelClass = 'text-amber-700';
        valueClass = 'text-amber-600';
    } else if (totalScore >= 7.5) {
        grade = 'D ต้องปรับปรุง';
        containerClass = 'bg-orange-50 border-orange-200';
        labelClass = 'text-orange-700';
        valueClass = 'text-orange-600';
    } else {
        grade = 'F ไม่ผ่าน';
        containerClass = 'bg-red-50 border-red-200';
        labelClass = 'text-red-700';
        valueClass = 'text-red-600';
    }

    const totalBadge = document.getElementById('tpsTotalScore');
    if (totalBadge) {
        totalBadge.textContent = `${totalScore.toFixed(1)} / 15.0`;
    }
    
    const gradeBadge = document.getElementById('tpsGrade');
    const gradeBadgeContainer = document.getElementById('tpsGradeBadge');
    if (gradeBadge && gradeBadgeContainer) {
        gradeBadge.textContent = grade;
        gradeBadgeContainer.className = `px-4 py-2 rounded-xl border flex items-center gap-2 shadow-inner ${containerClass}`;
        
        const spans = gradeBadgeContainer.querySelectorAll('span');
        spans.forEach(span => {
            if (span === gradeBadge) {
                span.className = `text-lg font-black ${valueClass}`;
            } else {
                span.className = `text-xs font-bold ${labelClass}`;
            }
        });
    }
    
    const getSelector = (key, optionsArray) => {
        const currentVal = parseFloat(ms[key]) || 0;
        let currentIdx = optionsArray.indexOf(currentVal);
        if (currentIdx === -1) {
            let minDiff = Infinity;
            currentIdx = 0;
            optionsArray.forEach((val, idx) => {
                const diff = Math.abs(val - currentVal);
                if (diff < minDiff) {
                    minDiff = diff;
                    currentIdx = idx;
                }
            });
        }

        const prevIdx = Math.max(0, currentIdx - 1);
        const nextIdx = Math.min(optionsArray.length - 1, currentIdx + 1);
        const prevVal = optionsArray[prevIdx];
        const nextVal = optionsArray[nextIdx];

        const isMin = currentIdx === 0;
        const isMax = currentIdx === optionsArray.length - 1;
        const isZero = currentVal === 0;

        const containerClasses = isZero 
            ? 'bg-rose-50/50 border-rose-200' 
            : 'bg-slate-50 border-slate-200';
        const badgeClasses = isZero 
            ? 'border-x border-rose-200/80 bg-rose-100 text-rose-700' 
            : 'border-x border-slate-200/80 bg-white text-slate-700';

        return `
            <div class="inline-flex items-center rounded-lg shadow-sm overflow-hidden select-none border ${containerClasses}">
                <button onclick="window.updateTpsManualScore('${key}', ${prevVal})" 
                        class="px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors ${isMin ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}">
                    -
                </button>
                <div class="px-2 text-xs font-bold min-w-[28px] text-center ${badgeClasses}">
                    ${currentVal.toFixed(currentVal % 1 === 0 ? 0 : 1)}
                </div>
                <button onclick="window.updateTpsManualScore('${key}', ${nextVal})" 
                        class="px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors ${isMax ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}">
                    +
                </button>
            </div>
        `;
    };

    const getGraphBtn = (key, label) => {
        return `<button onclick="window.showTpsTrendChart('${key}', '${label}')" class="inline-flex items-center justify-center p-1 text-sky-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-all ml-1.5" title="ดูประวัติข้อมูลย้อนหลัง">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        </button>`;
    };

    const tbody = document.getElementById('tpsTableBody');
    if (!tbody) return;
    
    // Database Values Calculation for Display
    const metricsCost = calculateTreatmentCostMetricsForMonth(latestMonth);
    const visitOPD = getHospitalValue('VisitOPD', latestMonth.dateObj) || 0;
    const adjRW = getHospitalValue('AdjRW', latestMonth.dateObj) || 0;
    
    const actualOPUnitCost = visitOPD > 0 ? (metricsCost.opdCost / visitOPD) : 0;
    const actualIPUnitCost = adjRW > 0 ? (metricsCost.ipdCost / adjRW) : 0;
    const actualLC = metricsCost.lc || 0;
    
    const mcDrugCodes = TREATMENT_COST_CONFIG.MC.filter(c => c.startsWith('5104010104'));
    const actualMCDrugs = sumGLAccountsHelper(tbData, mcDrugCodes);
    
    const mcSciCodes = TREATMENT_COST_CONFIG.MC.filter(c => c.startsWith('51040201'));
    const actualMCSci = sumGLAccountsHelper(tbData, mcSciCodes);
    
    const mcOtherCodes = TREATMENT_COST_CONFIG.MC.filter(c => !c.startsWith('5104010104') && !c.startsWith('51040201'));
    const actualMCOther = sumGLAccountsHelper(tbData, mcOtherCodes);
    
    const actualBedOccupancy = getHospitalValue('อัตราครองเตียง', latestMonth.dateObj) || 0;

    tbody.innerHTML = `
        <!-- Main Row: Total -->
        <tr class="bg-sky-50/50 font-extrabold text-slate-800 border-b-2 border-slate-300">
            <td class="p-3 pl-4 text-slate-900 text-sm">รวมทั้งหมด (Total Performance Score)</td>
            <td class="p-3 text-center text-sm">15.0</td>
            <td class="p-3 text-center text-sky-700 text-base font-black">${totalScore.toFixed(1)}</td>
            <td class="p-3 text-right text-[11px] text-slate-400 font-bold pr-4">คำนวณจากฐานข้อมูลและคะแนนเลือกป้อน</td>
        </tr>
        
        <!-- Parent Row: Process Indicators -->
        <tr class="bg-slate-100/70 font-black text-slate-700">
            <td class="p-3 pl-4">1. ตัวชี้วัดกระบวนการ (Process Indicators)</td>
            <td class="p-3 text-center">10.0</td>
            <td class="p-3 text-center text-indigo-700">${s1.toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        
        <!-- Sub-parent Row: 1.1 -->
        <tr class="font-bold text-slate-700 bg-slate-50/30">
            <td class="p-3 pl-8">1.1 การบริหารแผนทางการเงินเปรียบเทียบผลการดำเนินงานผลต่าง</td>
            <td class="p-3 text-center">2.0</td>
            <td class="p-3 text-center">${s1_1.toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.1.1 มิติรายได้ ± ไม่เกิน 5%</span>
                ${getGraphBtn('m1_1_1', 'มิติรายได้ (รายได้รวมจริง)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_1_1', [0, 1])}</td>
            <td class="p-3 text-right text-[11px] text-slate-550 font-bold pr-4">
                รายได้จริงสะสม: ${(metricsCost.opdRev + metricsCost.ipdRev).toLocaleString('th-TH')} บาท
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.1.2 มิติค่าใช้จ่าย ± ไม่เกิน 5%</span>
                ${getGraphBtn('m1_1_2', 'มิติค่าใช้จ่าย (ค่าใช้จ่ายรวมจริง)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_1_2', [0, 1])}</td>
            <td class="p-3 text-right text-[11px] text-slate-550 font-bold pr-4">
                ค่าใช้จ่ายจริงสะสม: ${(metricsCost.lc + metricsCost.mc + metricsCost.cc).toLocaleString('th-TH')} บาท
            </td>
        </tr>
        
        <tr class="font-bold text-slate-700 bg-slate-50/30">
            <td class="p-3 pl-8">1.2 การบริหารสินทรัพย์หมุนเวียนและหนี้สินหมุนเวียน</td>
            <td class="p-3 text-center">3.0</td>
            <td class="p-3 text-center text-sky-700">${s1_2.toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.2.1 ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา &le; 90 วัน หรือ &le; 180 วัน</span>
                ${getGraphBtn('m1_2_1', 'ระยะเวลาชำระเจ้าหนี้ (วัน)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_2_1', [0, 1])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s1_2_1 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${Math.round(apDrugDays)} วัน</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC &le; 60 วัน</span>
                ${getGraphBtn('m1_2_2', 'ระยะเวลาเรียกเก็บหนี้ UC (วัน)')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_2_2', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s1_2_2 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${Math.round(arUCDays)} วัน</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ &le; 60 วัน</span>
                ${getGraphBtn('m1_2_3', 'ระยะเวลาเรียกเก็บหนี้กรมบัญชีกลาง (วัน)')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_2_3', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s1_2_3 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${Math.round(arCGDDays)} วัน</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600">
                <div class="flex flex-wrap items-center gap-3">
                    <span class="flex items-center">
                        <span>1.2.4 การบริหารสินค้าคงคลัง (Inventory Management) &le; 60 วัน</span>
                        ${getGraphBtn('m1_2_4', 'ระยะเวลาสินค้าคงคลัง (วัน)')}
                    </span>
                    <label class="inline-flex items-center gap-1.5 cursor-pointer bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] select-none hover:bg-slate-200 transition-colors">
                        <input type="checkbox" class="w-3.5 h-3.5 text-sky-600 rounded border-slate-350 cursor-pointer" 
                               ${ms.isIslandHospital ? 'checked' : ''} 
                               onchange="window.updateTpsIslandHospital(this.checked)">
                        <span class="font-bold text-slate-600">รพ.พื้นที่เกาะ (&le; 90 วัน)</span>
                    </label>
                </div>
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_2_4', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s1_2_4 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${Math.round(invDays)} วัน</td>
        </tr>
        
        <tr class="font-bold text-slate-700 bg-slate-50/30">
            <td class="p-3 pl-8">1.3 การบริหารจัดการ</td>
            <td class="p-3 text-center">5.0</td>
            <td class="p-3 text-center">${s1_3.toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-650 font-bold">1.3.1 การบริหารต้นทุนและค่าใช้จ่าย (คะแนนเต็มสูงสุด 2.0)</td>
            <td class="p-3 text-center text-xs">2.0</td>
            <td class="p-3 text-center font-black text-sky-700">${s1_3_1.toFixed(1)} <span class="text-[10px] text-slate-400 font-normal">(ดิบ: ${raw_1_3_1.toFixed(1)})</span></td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.1 Unit Cost for OP</span>
                ${getGraphBtn('m1_3_1_1', 'Unit Cost for OP (บาท/ครั้ง)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_1', [0, 1])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualOPUnitCost > 0 ? `${actualOPUnitCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ครั้ง` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.2 Unit Cost for IP</span>
                ${getGraphBtn('m1_3_1_2', 'Unit Cost for IP (บาท/AdjRW)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_2', [0, 1])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualIPUnitCost > 0 ? `${actualIPUnitCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/AdjRW` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.3 LC ค่าแรงบุคลากร</span>
                ${getGraphBtn('m1_3_1_3', 'ต้นทุนค่าแรงบุคลากร (LC)')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_3', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualLC > 0 ? `${actualLC.toLocaleString('th-TH')} บาท` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.4 MC ค่ายา</span>
                ${getGraphBtn('m1_3_1_4', 'MC ค่ายา')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_4', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualMCDrugs > 0 ? `${actualMCDrugs.toLocaleString('th-TH')} บาท` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.5 MC ค่าวัสดุวิทยาศาสตร์และการแพทย์</span>
                ${getGraphBtn('m1_3_1_5', 'MC ค่าวัสดุวิทยาศาสตร์และการแพทย์')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_5', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualMCSci > 0 ? `${actualMCSci.toLocaleString('th-TH')} บาท` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.1.6 MC ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์</span>
                ${getGraphBtn('m1_3_1_6', 'MC ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์')}
            </td>
            <td class="p-3 text-center text-xs">0.5</td>
            <td class="p-3 text-center">${getSelector('m1_3_1_6', [0, 0.5])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualMCOther > 0 ? `${actualMCOther.toLocaleString('th-TH')} บาท` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>1.3.2 คะแนนตรวจสอบงบทดลองเบื้องต้น</span>
                ${getGraphBtn('m1_3_2', 'คะแนนตรวจสอบงบทดลอง')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_3_2', [0, 1.0])}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr class="font-bold text-slate-700">
            <td class="p-3 pl-12 text-xs">1.3.3 ผลผลิต (Productivity) เป็นที่ยอมรับ</td>
            <td class="p-3 text-center text-xs">2.0</td>
            <td class="p-3 text-center">${(parseFloat(ms.m1_3_3_1) + parseFloat(ms.m1_3_3_2)).toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.3.1 อัตราครองเตียงผู้ป่วยใน &ge; 80 %</span>
                ${getGraphBtn('m1_3_3_1', 'อัตราครองเตียงผู้ป่วยใน กยผ. (%)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_3_3_1', [0, 1])}</td>
            <td class="p-3 text-right font-mono text-xs text-slate-600 pr-4 font-bold">
                ${actualBedOccupancy > 0 ? `${actualBedOccupancy.toFixed(2)} %` : 'ไม่มีข้อมูล'}
            </td>
        </tr>
        <tr>
            <td class="p-3 pl-16 text-xs text-slate-500 flex items-center">
                <span>1.3.3.2 SumAdjRW เกินค่ากลางกลุ่มรพ. หรือเพิ่มขึ้น 5%</span>
                ${getGraphBtn('m1_3_3_2', 'SumAdjRW')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m1_3_3_2', [0, 1.0])}</td>
            <td class="p-3 text-right text-[11px] text-slate-400 font-bold pr-4">
                AdjRW จริง: ${adjRW.toLocaleString('th-TH')}
            </td>
        </tr>
        
        <tr class="bg-slate-100/70 font-black text-slate-700 border-t">
            <td class="p-3 pl-4">2. ตัวชี้วัดผลลัพธ์การดำเนินงาน</td>
            <td class="p-3 text-center">5.0</td>
            <td class="p-3 text-center text-indigo-700">${s2.toFixed(2)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        
        <tr class="font-bold text-slate-700 bg-slate-50/30">
            <td class="p-3 pl-8">2.1 ความสามารถในการทำกำไร</td>
            <td class="p-3 text-center">3.0</td>
            <td class="p-3 text-center text-sky-700">${s2_1.toFixed(2)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>2.1.1 ประสิทธิภาพในการดำเนินงาน (Operating Margin)</span>
                ${getGraphBtn('m2_1_1', 'Operating Margin (%)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m2_1_1', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s2_1_1 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${(operatingMargin * 100).toFixed(2)} %</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>2.1.2 อัตราผลตอบแทนจากสินทรัพย์ (Return on Asset)</span>
                ${getGraphBtn('m2_1_2', 'Return on Asset (%)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m2_1_2', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s2_1_2 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${(returnOnAsset * 100).toFixed(2)} %</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม (EBITDA) &ge; 0</span>
                ${getGraphBtn('m2_1_3', 'EBITDA (บาท)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m2_1_3', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s2_1_3 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${ebitda.toLocaleString('th-TH')} บาท</td>
        </tr>
        
        <!-- Sub-parent Row: 2.2 -->
        <tr class="font-bold text-slate-700 bg-slate-50/30">
            <td class="p-3 pl-8">2.2 การวัดสภาพคล่องทางการเงิน</td>
            <td class="p-3 text-center">2.0</td>
            <td class="p-3 text-center text-sky-700">${s2_2.toFixed(1)}</td>
            <td class="p-3 pr-4"></td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>2.2.1 ทุนสำรองสุทธิ (Net Working Capital) &ge; 0</span>
                ${getGraphBtn('m2_2_1', 'Net Working Capital (บาท)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m2_2_1', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s2_2_1 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${nwc.toLocaleString('th-TH')} บาท</td>
        </tr>
        <tr>
            <td class="p-3 pl-12 text-xs text-slate-600 flex items-center">
                <span>2.2.2 Cash Ratio &ge; 0.8</span>
                ${getGraphBtn('m2_2_2', 'Cash Ratio (เท่า)')}
            </td>
            <td class="p-3 text-center text-xs">1.0</td>
            <td class="p-3 text-center">${getSelector('m2_2_2', [0, 1.0])}</td>
            <td class="p-3 text-right font-mono text-xs pr-4 font-bold ${s2_2_2 > 0 ? 'text-emerald-600' : 'text-slate-650'}">${cashRatio.toFixed(2)} เท่า</td>
        </tr>
    `;
}

// Global score updates to refresh the view immediately
window.updateTpsManualScore = function(key, val) {
    if (window.tpsManualScores) {
        window.tpsManualScores[key] = parseFloat(val);
        renderTotalPerformanceScore();
    }
};

window.updateTpsIslandHospital = function(checked) {
    if (window.tpsManualScores) {
        window.tpsManualScores.isIslandHospital = checked;
        renderTotalPerformanceScore();
    }
};

// Database sync and defaults reset
window.syncTpsWithActualData = function() {
    if (monthlyResults.length === 0) return;
    const latestMonth = monthlyResults[monthlyResults.length - 1];
    const tbData = latestMonth.tbData;
    const dbRes = latestMonth.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(latestMonth, monthlyResults) : {});
    
    const apDrugDays = dbRes.apDrugSuppliesDays || 0;
    const arUCDays = dbRes.arUCDays || 0;
    const arCGDDays = dbRes.arCGDDays || 0;
    const invDays = dbRes.invDays || 0;
    const operatingMargin = dbRes.operatingMargin || 0;
    const returnOnAsset = dbRes.returnOnAsset || 0;
    const nwc = dbRes.nwc || 0;
    const cashRatio = dbRes.cashRatio || 0;
    const ebitda = typeof sumMgtAccount === 'function' ? sumMgtAccount(tbData, 'EBITDA') : 0;
    const bedOccupancy = getHospitalValue('อัตราครองเตียง', latestMonth.dateObj) || 0;

    let auto_1_2_1 = 0.0;
    if (apDrugDays <= 90) auto_1_2_1 = 1.0;
    else if (apDrugDays <= 180) auto_1_2_1 = 0.5;

    const auto_1_2_2 = (arUCDays <= 60) ? 0.5 : 0.0;
    const auto_1_2_3 = (arCGDDays <= 60) ? 0.5 : 0.0;
    const isIsland = window.tpsManualScores ? !!window.tpsManualScores.isIslandHospital : false;
    const auto_1_2_4 = (invDays <= (isIsland ? 90 : 60)) ? 1.0 : 0.0;

    const auto_2_1_1 = (operatingMargin >= 0) ? 1.0 : 0.0;
    const auto_2_1_2 = (returnOnAsset >= 0) ? 1.0 : 0.0;
    const auto_2_1_3 = (ebitda >= 0) ? 1.0 : 0.0;
    const auto_2_2_1 = (nwc >= 0) ? 1.0 : 0.0;
    const auto_2_2_2 = (cashRatio >= 0.8) ? 1.0 : 0.0;

    window.tpsManualScores = {
        m1_1_1: 0.0,
        m1_1_2: 0.0,
        m1_2_1: auto_1_2_1,
        m1_2_2: auto_1_2_2,
        m1_2_3: auto_1_2_3,
        m1_2_4: auto_1_2_4,
        m1_3_1_1: 0.0,
        m1_3_1_2: 0.0,
        m1_3_1_3: 0.0,
        m1_3_1_4: 0.0,
        m1_3_1_5: 0.0,
        m1_3_1_6: 0.0,
        m1_3_2: 0.0,
        m1_3_3_1: bedOccupancy >= 80 ? 1.0 : 0.0,
        m1_3_3_2: 0.0,
        m2_1_1: auto_2_1_1,
        m2_1_2: auto_2_1_2,
        m2_1_3: auto_2_1_3,
        m2_2_1: auto_2_2_1,
        m2_2_2: auto_2_2_2,
        isIslandHospital: isIsland
    };
    
    renderTotalPerformanceScore();
};

// Trend chart popup handler
window.tpsTrendChartInstance = null;
window.showTpsTrendChart = function(key, label) {
    const modal = document.getElementById('tpsChartModal');
    const titleEl = document.getElementById('tpsChartModalTitle');
    const canvas = document.getElementById('tpsTrendChartCanvas');
    if (!modal || !canvas) return;

    titleEl.textContent = `แนวโน้มข้อมูล: ${label}`;
    modal.classList.remove('hidden');

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;
    const labels = filteredMonths.map(m => m.monthStr || m.filename.replace('.xlsx', '').replace('.xls', ''));

    // Extract values based on key
    const data = filteredMonths.map(m => {
        const metrics = calculateTreatmentCostMetricsForMonth(m);
        const tbData = m.tbData || [];
        const dbRes = m.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(m, monthlyResults) : {});
        
        switch(key) {
            case 'm1_1_1': // มิติรายได้: plot actual total revenue
                return metrics.opdRev + metrics.ipdRev;
            case 'm1_1_2': // มิติค่าใช้จ่าย: plot actual total expenses
                return metrics.lc + metrics.mc + metrics.cc;
            case 'm1_2_1':
                return dbRes.apDrugSuppliesDays || 0;
            case 'm1_2_2':
                return dbRes.arUCDays || 0;
            case 'm1_2_3':
                return dbRes.arCGDDays || 0;
            case 'm1_2_4':
                return dbRes.invDays || 0;
            case 'm1_3_1_1': // Unit Cost OP
                const vOPD = getHospitalValue('VisitOPD', m.dateObj) || 0;
                return vOPD > 0 ? (metrics.opdCost / vOPD) : 0;
            case 'm1_3_1_2': // Unit Cost IP
                const aRW = getHospitalValue('AdjRW', m.dateObj) || 0;
                return aRW > 0 ? (metrics.ipdCost / aRW) : 0;
            case 'm1_3_1_3': // LC
                return metrics.lc;
            case 'm1_3_1_4': // MC ค่ายา
                const mcDrugCodes = TREATMENT_COST_CONFIG.MC.filter(c => c.startsWith('5104010104'));
                return sumGLAccountsHelper(tbData, mcDrugCodes);
            case 'm1_3_1_5': // MC ค่าวัสดุวิทยาศาสตร์ฯ
                const mcSciCodes = TREATMENT_COST_CONFIG.MC.filter(c => c.startsWith('51040201'));
                return sumGLAccountsHelper(tbData, mcSciCodes);
            case 'm1_3_1_6': // MC ค่าเวชภัณฑ์ฯ
                const mcOtherCodes = TREATMENT_COST_CONFIG.MC.filter(c => !c.startsWith('5104010104') && !c.startsWith('51040201'));
                return sumGLAccountsHelper(tbData, mcOtherCodes);
            case 'm1_3_3_1': // อัตราครองเตียง
                return getHospitalValue('อัตราครองเตียง', m.dateObj) || 0;
            case 'm1_3_3_2': // SumAdjRW
                return getHospitalValue('AdjRW', m.dateObj) || 0;
            case 'm2_1_1':
                return (dbRes.operatingMargin || 0) * 100;
            case 'm2_1_2':
                return (dbRes.returnOnAsset || 0) * 100;
            case 'm2_1_3':
                return typeof sumMgtAccount === 'function' ? sumMgtAccount(tbData, 'EBITDA') : 0;
            case 'm2_2_1':
                return dbRes.nwc || 0;
            case 'm2_2_2':
                return dbRes.cashRatio || 0;
            default:
                return window.tpsManualScores ? (window.tpsManualScores[key] || 0) : 0;
        }
    });

    if (window.tpsTrendChartInstance) {
        window.tpsTrendChartInstance.destroy();
    }

    let yLabel = 'จำนวนเงิน (บาท)';
    if (key === 'm1_3_1_1') yLabel = 'บาท / ครั้ง';
    else if (key === 'm1_3_1_2') yLabel = 'บาท / AdjRW';
    else if (key === 'm1_3_3_1' || key === 'm2_1_1' || key === 'm2_1_2') yLabel = 'เปอร์เซ็นต์ (%)';
    else if (key === 'm1_3_3_2') yLabel = 'AdjRW';
    else if (key === 'm1_2_1' || key === 'm1_2_2' || key === 'm1_2_3' || key === 'm1_2_4') yLabel = 'จำนวนวัน';
    else if (key === 'm2_2_2') yLabel = 'เท่า';
    else if (key === 'm1_3_2' || key === 'm1_3_3_2') yLabel = 'คะแนน';

    window.tpsTrendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.05)',
                borderWidth: 3,
                pointBackgroundColor: '#0284c7',
                pointRadius: 5,
                fill: true,
                tension: 0.3
            }]
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.parsed.y;
                            if (key === 'm1_3_3_1' || key === 'm2_1_1' || key === 'm2_1_2') return ` ${val.toFixed(2)} %`;
                            if (key === 'm1_3_3_2') return ` ${val.toLocaleString('th-TH')} AdjRW`;
                            if (key === 'm1_3_1_1') return ` ${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/ครั้ง`;
                            if (key === 'm1_3_1_2') return ` ${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/AdjRW`;
                            if (key === 'm2_2_2') return ` ${val.toFixed(2)} เท่า`;
                            if (key === 'm1_2_1' || key === 'm1_2_2' || key === 'm1_2_3' || key === 'm1_2_4') return ` ${val} วัน`;
                            if (yLabel.includes('บาท')) return ` ${val.toLocaleString('th-TH')} บาท`;
                            return ` ${val}`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('tpsTrendChartCanvas') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 4,
                    color: '#1E293B',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 9 },
                    formatter: (value) => {
                        if (value === 0 || value === undefined || value === null) return '';
                        if (key === 'm1_3_3_1' || key === 'm2_1_1' || key === 'm2_1_2') return value.toFixed(1) + '%';
                        if (key === 'm2_2_2') return value.toFixed(2);
                        if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                        if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(0) + 'k';
                        return value.toLocaleString('th-TH', { maximumFractionDigits: 1 });
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: yLabel, font: { weight: 'bold' } },
                    ticks: {
                        callback: (value) => {
                            if (key === 'm1_3_3_1' || key === 'm2_1_1' || key === 'm2_1_2') return value + '%';
                            if (yLabel.includes('บาท')) {
                                if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                if (value >= 1e3) return (value / 1e3).toFixed(0) + 'k';
                            }
                            return value.toLocaleString('th-TH');
                        }
                    }
                }
            }
        }
    });
};
