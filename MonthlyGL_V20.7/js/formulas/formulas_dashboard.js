// ==========================================================
// สูตรการคำนวณสำหรับแดชบอร์ดภาพรวมการเงิน (Dashboard Formulas)
// ==========================================================

function processDashboardData(currentFile, allFiles) {
    const tbData = currentFile.tbData;
    const isSingleBalance = tbData.some(row => row.code && row.code.startsWith('CR_'));

    // denominator = A219 - A2122023 - A2111080 - A2111090  //หนี้สินหมุนเวียนหักเงินรับฝากงบลงทุน UC
    const a219 = sumMgtAccount(tbData, 'A219', isSingleBalance);
    const a2122023 = sumMgtAccount(tbData, 'A2122023', isSingleBalance);
    const a2111080 = sumMgtAccount(tbData, 'A2111080', isSingleBalance);
    const a2111090 = sumMgtAccount(tbData, 'A2111090', isSingleBalance);
    const ratioDenom = a219 - a2122023 - a2111080 - a2111090;

    // 1. Current Ratio = (A119 - A1111040.3) / Denom
    const a119 = sumMgtAccount(tbData, 'A119', isSingleBalance);
    const a1111040_3 = sumMgtAccount(tbData, 'A1111040.3', isSingleBalance);
    const currentRatioNum = a119 - a1111040_3;
    const currentRatio = ratioDenom > 0 ? (currentRatioNum / ratioDenom) : 0;

    // 2. Quick Ratio = (A1111040.20 + A11211S + A1122S + A1141010) / Denom
    const a1111040_20 = sumMgtAccount(tbData, 'A1111040.20', isSingleBalance);
    const a11211S = sumMgtAccount(tbData, 'A11211S', isSingleBalance);
    const a1122S = sumMgtAccount(tbData, 'A1122S', isSingleBalance);
    const a1141010 = sumMgtAccount(tbData, 'A1141010', isSingleBalance);
    const quickRatioNum = a1111040_20 + a11211S + a1122S + a1141010;
    const quickRatio = ratioDenom > 0 ? (quickRatioNum / ratioDenom) : 0;

    // 3. Cash Ratio = A1111040.20 / Denom
    const cashRatio = ratioDenom > 0 ? (a1111040_20 / ratioDenom) : 0;

    // 4. NWC = (A119 - A1111040.3) - Denom
    const nwc = currentRatioNum - ratioDenom;

    // 5. เงินบำรุงคงเหลือ (หักหนี้สินแล้ว) = เงินบำรุงก่อนหัก - ภาระหนี้สินเงินบำรุง
    const reserveAssetsList = [
        "1101010101.101", "1101020501.101", "1101020501.103", "1101020504.101", "1101020604.101",
        "1101020606.101", "1101030101.101", "1101030101.102", "1101030101.103", "1101030102.101",
        "1101030102.102", "1101030102.103", "1104010101.101"
    ];
    const reserveLiabilitiesList = [
        "2101010102.133", "2101010102.134", "2101010102.135", "2101010102.136", "2101010102.137",
        "2101010102.138", "2101010102.139", "2101010102.140", "2101010103.102", "2101010103.103",
        "2101020198.115", "2101020198.116", "2101020198.117", "2101020198.118", "2101020198.120",
        "2101020199.134", "2101020199.135", "2101020199.136", "2101020199.137", "2101020199.138",
        "2101020199.139", "2101020199.140", "2101020199.141", "2101020199.142", "2101020199.143",
        "2101020199.144", "2101020199.145", "2101020199.146", "2101020199.147", "2101020199.148",
        "2101020199.149", "2101020199.150", "2101020199.202", "2101020199.203", "2101020199.204",
        "2101020199.301", "2101020199.501", "2101020199.502", "2101020199.503", "2101020199.504",
        "2101020199.701", "2102040101.101", "2102040102.101", "2102040103.101", "2102040104.101",
        "2102040106.101", "2102040110.101", "2102040110.102", "2102040110.103", "2102040110.104",
        "2102040110.105", "2102040110.106", "2102040110.107", "2102040110.108", "2102040110.109",
        "2102040110.110", "2102040110.111", "2102040110.112", "2102040110.113", "2102040110.114",
        "2102040110.115", "2102040198.101", "2102040199.101", "2102040199.105", "2103010103.101",
        "2103010103.502", "2104010101.101", "2109010199.101", "2109010199.201", "2109010199.701",
        "2111020199.103", "2111020199.105", "2111020199.107", "2111020199.108", "2111020199.110",
        "2111020199.201", "2111020199.204", "2111020199.205", "2111020199.206", "2111020199.207",
        "2111020199.301", "2111020199.304", "2111020199.501", "2111020199.502", "2111020199.503",
        "2112010101.101", "2112010199.101", "2112010199.102", "2112010199.103", "2112010199.104",
        "2116010104.101", "2116010199.101", "2116010199.102", "2208010101.101", "2208010103.101"
    ];

    const reserveBefore = sumSpecificCodes(tbData, reserveAssetsList, false, isSingleBalance);
    const reserveLiabilities = sumSpecificCodes(tbData, reserveLiabilitiesList, true, isSingleBalance);
    const netReserve = reserveBefore - reserveLiabilities;

    // 6. Operating Margin = EBITDA / A49
    const ebitdaVal = sumMgtAccount(tbData, 'EBITDA', isSingleBalance);
    const a49 = sumMgtAccount(tbData, 'A49', isSingleBalance);
    const operatingMargin = a49 !== 0 ? (ebitdaVal / a49) : 0;

    // 7. Return on Asset = A91D / A1291
    const a91d = sumMgtAccount(tbData, 'A91D', isSingleBalance);
    const a1291 = sumMgtAccount(tbData, 'A1291', isSingleBalance);
    const returnOnAsset = a1291 !== 0 ? (a91d / a1291) : 0;

    // --- 8. Working Capital Group Metrics (กลุ่มเงินหมุนเวียน) ---
    const apResult = typeof processAPData === 'function' ? processAPData(currentFile, allFiles) : {};
    const invResult = typeof processINVData === 'function' ? processINVData(currentFile, allFiles) : {};
    const arResult = typeof executeFormulasForData === 'function' ? executeFormulasForData(currentFile, allFiles) : {};

    // 8.1 เจ้าหนี้ ยา / เวชภัณฑ์
    const apDrugSuppliesDays = apResult?.drug_supplies?.total?.collection_days ?? null;
    const apDrugSuppliesPurchases = apResult?.drug_supplies?.total?.rev_uc ?? null;
    const apDrugSuppliesEnd = apResult?.drug_supplies?.total?.ar_uc_end ?? null;
    const apDrugSuppliesStart = apResult?.drug_supplies?.total?.ar_uc_start ?? null;
    const apDrugSuppliesAvg = apResult?.drug_supplies?.total?.avg_ar ?? null;
    const apDrugSuppliesPeriodDays = apResult?.drug_supplies?.total?.days_in_period ?? null;

    // 8.2 ลูกหนี้ (สิทธิ UC, เบิกจ่ายตรง (กรมบัญชีกลาง), สิทธิประกันสังคม แยก 3 ตัว)
    const arUC = arResult?.uc?.total;
    const arCGD = arResult?.cgd?.total;
    const arSSS = arResult?.sss?.total;

    const arUCDays = arUC?.collection_days ?? null;
    const arUCRev = arUC?.rev_uc ?? null;
    const arUCAvgAR = arUC?.avg_ar ?? null;
    const arUCStartAR = arUC?.ar_uc_start ?? null;
    const arUCEndAR = arUC?.ar_uc_end ?? null;

    const arCGDDays = arCGD?.collection_days ?? null;
    const arCGDRev = arCGD?.rev_uc ?? null;
    const arCGDAvgAR = arCGD?.avg_ar ?? null;
    const arCGDStartAR = arCGD?.ar_uc_start ?? null;
    const arCGDEndAR = arCGD?.ar_uc_end ?? null;

    const arSSSDays = arSSS?.collection_days ?? null;
    const arSSSRev = arSSS?.rev_uc ?? null;
    const arSSSAvgAR = arSSS?.avg_ar ?? null;
    const arSSSStartAR = arSSS?.ar_uc_start ?? null;
    const arSSSEndAR = arSSS?.ar_uc_end ?? null;

    const arUCPeriodDays = arUC?.days_in_period ?? null;
    const arCGDPeriodDays = arCGD?.days_in_period ?? null;
    const arSSSPeriodDays = arSSS?.days_in_period ?? null;

    // 8.3 สินค้าคงคลัง
    const invDays = invResult?.total?.all?.collection_days ?? null;
    const invCostOfSales = invResult?.total?.all?.rev_uc ?? null;
    const invBalanceEnd = invResult?.total?.all?.ar_uc_end ?? null;
    const invBalanceStart = invResult?.total?.all?.ar_uc_start ?? null;
    const invAvg = (invBalanceStart + invBalanceEnd) / 2;
    const invPeriodDays = invResult?.total?.all?.days_in_period ?? null;

    return {
        currentRatio,
        quickRatio,
        cashRatio,
        nwc,
        netReserve,
        operatingMargin,
        returnOnAsset,
        apDrugSuppliesDays,
        arUCDays,
        arCGDDays,
        arSSSDays,
        invDays,
        // Breakdown variables:
        a119,
        a1111040_3,
        currentRatioNum,
        a219,
        a2122023,
        a2111080,
        a2111090,
        ratioDenom,
        a1111040_20,
        a11211S,
        a1122S,
        a1141010,
        quickRatioNum,
        reserveBefore,
        reserveLiabilities,
        ebitdaVal,
        a49,
        a91d,
        a1291,
        apDrugSuppliesPurchases,
        apDrugSuppliesEnd,
        apDrugSuppliesStart,
        apDrugSuppliesAvg,
        apDrugSuppliesPeriodDays,
        arUCRev,
        arUCAvgAR,
        arUCStartAR,
        arUCEndAR,
        arUCPeriodDays,
        arCGDRev,
        arCGDAvgAR,
        arCGDStartAR,
        arCGDEndAR,
        arCGDPeriodDays,
        arSSSRev,
        arSSSAvgAR,
        arSSSStartAR,
        arSSSEndAR,
        arSSSPeriodDays,
        invCostOfSales,
        invBalanceEnd,
        invBalanceStart,
        invAvg,
        invPeriodDays
    };
}

// --- NEW: Working Capital Overdue Accounts Receivable (AR) & Deadstock Calculation Functions ---

function sumEndBalance(fileObj, accountKey) {
    const config = ACCOUNTS[accountKey];
    if (!config) return 0;
    let total = 0;
    fileObj.tbData.forEach(row => {
        if (config.codes.includes(row.code)) {
            total += config.type === 'debit' ? row.end_net : (row.end_net * -1);
        }
    });
    return total;
}

function sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, n) {
    const config = ACCOUNTS[accountKey];
    if (!config) return 0;
    
    const availableMonths = currentIndex + 1; // จำนวนเดือนที่มีข้อมูลตั้งแต่เริ่มต้นจนถึงเดือนปัจจุบัน
    
    if (availableMonths < n) {
// - ณ เดือนที่ 2 (Index 1): ยอดเดบิตสะสม 12 เดือน = ((ยอดเดบิตเดือนที่ 1 + ยอดเดบิตเดือนที่ 2) / 2) * 12
        let sumAvailableDebits = 0;
        for (let i = 0; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    sumAvailableDebits += row.move_dr || 0;
                }
            });
        }
        const avgDebit = sumAvailableDebits / availableMonths;
        return avgDebit * n;
    } else {
        let totalDebits = 0;
        const startIdx = currentIndex - n + 1;
        
        for (let i = startIdx; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    totalDebits += row.move_dr || 0;
                }
            });
        }
        return totalDebits;
    }
}

function calculateAgingMetrics(currentIndex, sortedFiles, accountKey) {
    const currentFile = sortedFiles[currentIndex];
    const currentBalance = sumEndBalance(currentFile, accountKey);
    
    const debits1 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 1);
    const debits3 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 3);
    const debits6 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 6);
    const debits12 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 12);
    const debits24 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 24);
    const debits36 = sumDebitsLastNMonths(currentIndex, sortedFiles, accountKey, 36);
    
    const overdue_1m = Math.max(0, currentBalance - debits1);
    const overdue_3m = Math.max(0, currentBalance - debits3);
    const overdue_6m = Math.max(0, currentBalance - debits6);
    const overdue_1y = Math.max(0, currentBalance - debits12);
    const overdue_2y = Math.max(0, currentBalance - debits24);
    const overdue_3y = Math.max(0, currentBalance - debits36);
    
    return {
        current_balance: currentBalance,
        overdue_1m: overdue_1m,
        overdue_3m: overdue_3m,
        overdue_6m: overdue_6m,
        overdue_1y: overdue_1y,
        overdue_2y: overdue_2y,
        overdue_3y: overdue_3y,
        debits_1m: debits1,
        debits_3m: debits3,
        debits_6m: debits6,
        debits_12m: debits12,
        debits_24m: debits24,
        debits_36m: debits36,
        months_available_1: Math.min(currentIndex + 1, 1),
        months_available_3: Math.min(currentIndex + 1, 3),
        months_available_6: Math.min(currentIndex + 1, 6),
        months_available_12: Math.min(currentIndex + 1, 12),
        months_available_24: Math.min(currentIndex + 1, 24),
        months_available_36: Math.min(currentIndex + 1, 36)
    };
}

function getARAccountKey(fundId, subgroupId) {
    if (fundId === 'uc' && subgroupId === 'refer') return 'ar_op_refer';
    return `ar_${fundId}_${subgroupId}`;
}

function getINVAccountKey(fundId, subgroupId) {
    if (subgroupId === 'all') return 'inv_total';
    return `inv_${subgroupId}`;
}

function calculateOverdueAR(currentFile, allFiles) {
    const fundsResult = {};
    const sortedFiles = [...allFiles].sort((a, b) => a.dateObj - b.dateObj);
    const currentIndex = sortedFiles.findIndex(f => f.id === currentFile.id);
    if (currentIndex === -1) return {};

    FUNDS_CONFIG.forEach(fund => {
        fundsResult[fund.id] = {};
        fund.subgroups.forEach(sub => {
            const accountKey = getARAccountKey(fund.id, sub.id);
            fundsResult[fund.id][sub.id] = calculateAgingMetrics(currentIndex, sortedFiles, accountKey);
        });
    });
    
    return fundsResult;
}

function calculateDeadstock(currentFile, allFiles) {
    const invResult = {};
    const sortedFiles = [...allFiles].sort((a, b) => a.dateObj - b.dateObj);
    const currentIndex = sortedFiles.findIndex(f => f.id === currentFile.id);
    if (currentIndex === -1) return {};

    INV_CONFIG.forEach(fund => {
        invResult[fund.id] = {};
        fund.subgroups.forEach(sub => {
            const accountKey = getINVAccountKey(fund.id, sub.id);
            invResult[fund.id][sub.id] = calculateAgingMetrics(currentIndex, sortedFiles, accountKey);
        });
    });
    
    return invResult;
}

function getAPAccountKey(fundId, subgroupId) {
    if (subgroupId === 'total') {
        return `ap_${fundId}`;
    }
    return subgroupId;
}

function sumAPEndBalance(fileObj, accountKey) {
    const config = AP_ACCOUNTS[accountKey];
    if (!config) return 0;
    let total = 0;
    const isSingleBalance = fileObj.tbData.some(row => row.code && row.code.startsWith('CR_'));
    fileObj.tbData.forEach(row => {
        if (config.codes.includes(row.code)) {
            total += isSingleBalance ? Math.abs(row.end_net) : (row.end_net * -1);
        }
    });
    return total;
}

function sumAPCreditsLastNMonths(currentIndex, sortedFiles, accountKey, n) {
    const config = AP_ACCOUNTS[accountKey];
    if (!config) return 0;
    
    const availableMonths = currentIndex + 1;
    if (availableMonths < n) {
        let sumAvailableCredits = 0;
        for (let i = 0; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    sumAvailableCredits += row.move_cr || 0;
                }
            });
        }
        return (sumAvailableCredits / availableMonths) * n;
    } else {
        let totalCredits = 0;
        const startIdx = currentIndex - n + 1;
        for (let i = startIdx; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    totalCredits += row.move_cr || 0;
                }
            });
        }
        return totalCredits;
    }
}

function calculateAPAgingMetrics(currentIndex, sortedFiles, accountKey) {
    const currentFile = sortedFiles[currentIndex];
    const currentBalance = sumAPEndBalance(currentFile, accountKey);
    const credits12 = sumAPCreditsLastNMonths(currentIndex, sortedFiles, accountKey, 12);
    const overdue_1y = Math.max(0, currentBalance - credits12);
    return {
        current_balance: currentBalance,
        overdue_1y: overdue_1y
    };
}

function calculateOverdueAP(currentFile, allFiles) {
    const apResult = {};
    const sortedFiles = [...allFiles].sort((a, b) => a.dateObj - b.dateObj);
    const currentIndex = sortedFiles.findIndex(f => f.id === currentFile.id);
    if (currentIndex === -1) return {};

    AP_CONFIG.forEach(fund => {
        apResult[fund.id] = {};
        fund.subgroups.forEach(sub => {
            const accountKey = getAPAccountKey(fund.id, sub.id);
            apResult[fund.id][sub.id] = calculateAPAgingMetrics(currentIndex, sortedFiles, accountKey);
        });
    });
    return apResult;
}

// Bind to global scope if needed
window.calculateOverdueAR = calculateOverdueAR;
window.calculateDeadstock = calculateDeadstock;
window.calculateOverdueAP = calculateOverdueAP;

function getPRAccountKey(fundId, subgroupId) {
    if (subgroupId === 'total') return 'pr_accrued';
    return subgroupId;
}

function sumPREndBalance(fileObj, accountKey) {
    const config = PR_ACCOUNTS[accountKey];
    if (!config) return 0;
    let total = 0;
    const isSingleBalance = fileObj.tbData.some(row => row.code && row.code.startsWith('CR_'));
    fileObj.tbData.forEach(row => {
        if (config.codes.includes(row.code)) {
            total += isSingleBalance ? Math.abs(row.end_net) : (row.end_net * -1);
        }
    });
    return total;
}

function sumPRCreditsLastNMonths(currentIndex, sortedFiles, accountKey, n) {
    const config = PR_ACCOUNTS[accountKey];
    if (!config) return 0;
    
    const availableMonths = currentIndex + 1;
    if (availableMonths < n) {
        let sumAvailableCredits = 0;
        for (let i = 0; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    sumAvailableCredits += row.move_cr || 0;
                }
            });
        }
        return (sumAvailableCredits / availableMonths) * n;
    } else {
        let totalCredits = 0;
        const startIdx = currentIndex - n + 1;
        for (let i = startIdx; i <= currentIndex; i++) {
            const fileObj = sortedFiles[i];
            fileObj.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    totalCredits += row.move_cr || 0;
                }
            });
        }
        return totalCredits;
    }
}

function calculatePRAgingMetrics(currentIndex, sortedFiles, accountKey) {
    const currentFile = sortedFiles[currentIndex];
    const currentBalance = sumPREndBalance(currentFile, accountKey);
    const credits2 = sumPRCreditsLastNMonths(currentIndex, sortedFiles, accountKey, 2);
    const credits4 = sumPRCreditsLastNMonths(currentIndex, sortedFiles, accountKey, 4);
    const credits12 = sumPRCreditsLastNMonths(currentIndex, sortedFiles, accountKey, 12);
    
    const overdue_60d = Math.max(0, currentBalance - credits2);
    const overdue_120d = Math.max(0, currentBalance - credits4);
    const overdue_1y = Math.max(0, currentBalance - credits12);
    
    return {
        current_balance: currentBalance,
        overdue_60d: overdue_60d,
        overdue_120d: overdue_120d,
        overdue_1y: overdue_1y
    };
}

function calculateOverduePR(currentFile, allFiles) {
    const prResult = {};
    const sortedFiles = [...allFiles].sort((a, b) => a.dateObj - b.dateObj);
    const currentIndex = sortedFiles.findIndex(f => f.id === currentFile.id);
    if (currentIndex === -1) return {};

    PR_CONFIG.forEach(fund => {
        prResult[fund.id] = {};
        fund.subgroups.forEach(sub => {
            const accountKey = getPRAccountKey(fund.id, sub.id);
            prResult[fund.id][sub.id] = calculatePRAgingMetrics(currentIndex, sortedFiles, accountKey);
        });
    });
    return prResult;
}

window.calculateOverduePR = calculateOverduePR;


