// ==========================================================
// สูตรการคำนวณสำหรับค่าบุคลากรค้างจ่าย (Personnel Expenses Payable - PR)
// ==========================================================

function processPRData(currentFile, allFiles) {
    const tbData = currentFile.tbData;

    // Helper: ดึงยอดยกไปของบัญชีตามรหัส
    const getEndBalance = (config) => {
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += row.end_net * -1; // บัญชีหนี้สินเป็น Credit (แปลงเป็นบวก)
            }
        });
        return total;
    };

    // Helper: ดึงยอดยกมาของบัญชี (กรณีไม่มีข้อมูลกันยายน)
    const getBeginBalance = (config) => {
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += row.begin_net * -1; 
            }
        });
        return total;
    };

    // Helper: ดึงยอดยกไปของเดือนกันยายนปีงบประมาณที่แล้ว (ต้นงวดที่แท้จริง)
    const getPrevSepBalance = (config) => {
        let currentMonth = currentFile.dateObj.getMonth();
        let currentYear = currentFile.dateObj.getFullYear();
        
        let targetMonth = 8; // กันยายน
        let targetYear = currentMonth >= 9 ? currentYear : currentYear - 1;
        
        let sepFile = allFiles.find(f => f.dateObj.getFullYear() === targetYear && f.dateObj.getMonth() === targetMonth);
        
        if (sepFile) {
            let total = 0;
            sepFile.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    total += row.end_net * -1; 
                }
            });
            return total;
        }
        return null;
    };

    // Helper: คำนวณผลรวมของเครดิตรายการระหว่างเดือน (Expenses) ตั้งแต่ต้นปีงบประมาณ
    const getYTDPurchases = (config) => {
        let total = 0;
        let targetMonth = currentFile.dateObj.getMonth();
        let targetYear = currentFile.dateObj.getFullYear();
        
        let fiscalStartYear = targetMonth >= 9 ? targetYear : targetYear - 1;
        
        allFiles.forEach(f => {
            let fm = f.dateObj.getMonth();
            let fy = f.dateObj.getFullYear();
            
            // ตรวจสอบว่าอยู่ในปีงบประมาณเดียวกันและไม่เกินเดือนปัจจุบันหรือไม่
            let isAfterStart = (fy > fiscalStartYear) || (fy === fiscalStartYear && fm >= 9); // เดือน ต.ค. เป็นต้นไป
            let isBeforeTarget = (fy < targetYear) || (fy === targetYear && fm <= targetMonth);
            
            if (isAfterStart && isBeforeTarget) {
                f.tbData.forEach(row => {
                    if (config.codes.includes(row.code)) {
                        total += row.move_cr; // ช่องคอลัมน์เครดิตระหว่างเดือน
                    }
                });
            }
        });
        
        return total;
    };

    // Helper: คำนวณจำนวนวันสะสมในปีงบประมาณ
    const getDaysInPeriod = () => {
        let currentMonth = currentFile.dateObj.getMonth();
        let monthInFiscalYear = currentMonth >= 9 ? currentMonth - 8 : currentMonth + 4;
        return monthInFiscalYear * 30; // คิดเดือนละ 30 วัน
    };

    // ฟังก์ชันคำนวณหลัก
    const calculatePR = (configKey) => {
        const config = PR_ACCOUNTS[configKey];
        if (!config) return null;

        // ผลรวมค่าบุคลากรค้างจ่าย (จากช่องเครดิต)
        let purchases = getYTDPurchases(config);

        // ค่าบุคลากรค้างจ่ายต้นงวด
        let pr_start = getPrevSepBalance(config);

        // ค่าบุคลากรค้างจ่ายปลายงวด
        let pr_end = getEndBalance(config);

        if (pr_start === null || pr_start === 0) {
            return {
                days_in_period: getDaysInPeriod(),
                rev_uc: null,
                ar_uc_start: null,
                ar_uc_end: null,
                avg_ar: null,
                turnover_ratio: null,
                collection_days: null
            };
        }

        // ค่าบุคลากรค้างจ่ายเฉลี่ย
        let avg_pr = (pr_start + pr_end) / 2;

        // อัตราส่วนหมุนเวียนค่าบุคลากรค้างจ่าย (เท่า)
        let turnover_ratio = 0;
        if (avg_pr > 0) {
            turnover_ratio = purchases / avg_pr;
        }

        // ระยะเวลาถัวเฉลี่ยในการจ่ายค่าบุคลากร (วัน)
        let days_in_period = getDaysInPeriod();
        let collection_days = 0;
        if (turnover_ratio > 0) {
            collection_days = days_in_period / turnover_ratio;
        }

        // คืนค่าในรูปแบบเดียวกับที่ renderDetailTable ใช้
        return {
            days_in_period: days_in_period,
            rev_uc: purchases,        // ใช้ key เดิมเพื่อให้ตารางและกราฟนำไปแสดงได้
            ar_uc_start: pr_start,
            ar_uc_end: pr_end,
            avg_ar: avg_pr,
            turnover_ratio: turnover_ratio,
            collection_days: collection_days
        };
    };

    // โครงสร้างคืนค่าต้องตรงกับ PR_CONFIG
    return {
        pr_accrued: {
            total: calculatePR('pr_accrued'),
            pr_102: calculatePR('pr_102'),
            pr_103: calculatePR('pr_103'),
            pr_104: calculatePR('pr_104'),
            pr_105: calculatePR('pr_105'),
            pr_106: calculatePR('pr_106'),
            pr_107: calculatePR('pr_107'),
            pr_108: calculatePR('pr_108'),
            pr_109: calculatePR('pr_109'),
            pr_110: calculatePR('pr_110'),
            pr_111: calculatePR('pr_111')
        }
    };
}
