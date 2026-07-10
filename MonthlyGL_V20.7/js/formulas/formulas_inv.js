// ==========================================================
// สูตรการคำนวณสำหรับสินค้าคงคลัง (Inventory - INV)
// ==========================================================

function processINVData(currentFile, allFiles) {
    const tbData = currentFile.tbData;

    const getBeginBalance = (accountKey) => {
        const config = ACCOUNTS[accountKey];
        if (!config) return 0;
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += config.type === 'debit' ? row.begin_net : (row.begin_net * -1); 
            }
        });
        return total;
    };

    const getEndBalance = (accountKey) => {
        const config = ACCOUNTS[accountKey];
        if (!config) return 0;
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += config.type === 'debit' ? row.end_net : (row.end_net * -1); 
            }
        });
        return total;
    };

    const getMovement = (accountKey) => getEndBalance(accountKey) - getBeginBalance(accountKey);

    const getPrevSepBalance = (accountKey) => {
        if (typeof isMonthCalculable === 'function' && !isMonthCalculable(currentFile, allFiles)) {
            return null;
        }
        let currentMonth = currentFile.dateObj.getMonth();
        let currentYear = currentFile.dateObj.getFullYear();
        let targetMonth = 8;
        let targetYear = currentMonth >= 9 ? currentYear : currentYear - 1;
        
        let sepFile = allFiles.find(f => f.dateObj.getFullYear() === targetYear && f.dateObj.getMonth() === targetMonth);
        
        if (sepFile) {
            const config = ACCOUNTS[accountKey];
            if (!config) return 0;
            let total = 0;
            sepFile.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    total += config.type === 'debit' ? row.end_net : (row.end_net * -1); 
                }
            });
            return total;
        }
        return null;
    };

    const getDaysInPeriod = () => {
        let currentMonth = currentFile.dateObj.getMonth();
        let monthInFiscalYear = currentMonth >= 9 ? currentMonth - 8 : currentMonth + 4;
        return monthInFiscalYear * 30; // คิดเดือนละ 30 วัน
    };

    const calc = (invKey, costKey) => FORMULAS.uc_collection_period.calculate(invKey, costKey, getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);

    let results = {
        total: { 
            all: calc('inv_total', 'cost_inv_total'),
            drug: calc('inv_drug', 'cost_drug'),
            pharm: calc('inv_pharm', 'cost_pharm'),
            med: calc('inv_med', 'cost_med'),
            sci: calc('inv_sci', 'cost_sci'),
            xray: calc('inv_xray', 'cost_xray'),
            dental: calc('inv_dental', 'cost_dental')
        }
    };

    return results;
}
