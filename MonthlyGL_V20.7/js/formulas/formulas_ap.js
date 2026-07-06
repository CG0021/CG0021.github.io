// ==========================================================
// สูตรการคำนวณสำหรับเจ้าหนี้ (Accounts Payable - AP)
// ==========================================================

function processAPData(currentFile, allFiles) {
    const tbData = currentFile.tbData;

    const isSingleBalance = tbData.some(row => row.code && row.code.startsWith('CR_'));

    // Helper: ดึงยอดเครดิตสะสมสำหรับนำเข้าแบบดุลเดี่ยว (ยอดอยู่ในช่องยอดยกไปของบัญชี CR_)
    const getSingleBalancePurchases = (configKey, config) => {
        let total = 0;
        let targetCodes = config.codes.map(c => 'CR_' + c);
        tbData.forEach(row => {
            if (targetCodes.includes(row.code)) {
                total += Math.abs(row.end_net);
            }
        });
        return total;
    };

    // Helper: ดึงยоดยกไปของบัญชีตามรหัส
    const getEndBalance = (config) => {
        let total = 0;
        let codes = config.codes;
        tbData.forEach(row => {
            if (codes.includes(row.code)) {
                total += isSingleBalance ? Math.abs(row.end_net) : (row.end_net * -1); // บัญชีหนี้สินเป็น Credit (แปลงเป็นบวก)
            }
        });
        return total;
    };

    // Helper: ดึงยอดยกมาของบัญชี (กรณีไม่มีข้อมูลกันยายน)
    const getBeginBalance = (config) => {
        let total = 0;
        let codes = config.codes;
        tbData.forEach(row => {
            if (codes.includes(row.code)) {
                total += isSingleBalance ? Math.abs(row.begin_net) : (row.begin_net * -1); 
            }
        });
        return total;
    };

    // Helper: ดึงยอดยกไปของเดือนกันยายนปีงบประมาณที่แล้ว (ต้นงวดที่แท้จริง)
    const getPrevSepBalance = (config) => {
        if (typeof isMonthCalculable === 'function' && !isMonthCalculable(currentFile, allFiles)) {
            return null;
        }
        let currentMonth = currentFile.dateObj.getMonth();
        let currentYear = currentFile.dateObj.getFullYear();
        
        let targetMonth = 8; // กันยายน
        let targetYear = currentMonth >= 9 ? currentYear : currentYear - 1;
        
        let sepFile = allFiles.find(f => f.dateObj.getFullYear() === targetYear && f.dateObj.getMonth() === targetMonth);
        
        if (sepFile) {
            let total = 0;
            let codes = config.codes;
            sepFile.tbData.forEach(row => {
                if (codes.includes(row.code)) {
                    total += isSingleBalance ? Math.abs(row.end_net) : (row.end_net * -1); 
                }
            });
            return total;
        }
        return null;
    };

    // Helper: คำนวณผลรวมของเครดิตรายการระหว่างเดือน (Purchases) ตั้งแต่ต้นปีงบประมาณ
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
    const calculateAP = (configKey) => {
        const config = AP_ACCOUNTS[configKey];
        if (!config) return null;

        if (typeof isMonthCalculable === 'function' && !isMonthCalculable(currentFile, allFiles)) {
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

        // ผลรวมเจ้าหนี้การค้า (จากช่องเครดิต)
        let purchases = isSingleBalance ? getSingleBalancePurchases(configKey, config) : getYTDPurchases(config);

        // เจ้าหนี้การค้าต้นงวด
        let ap_start = getPrevSepBalance(config);
        if (ap_start === null || ap_start === 0) {
            ap_start = getBeginBalance(config);
        }

        // เจ้าหนี้การค้าปลายงวด
        let ap_end = getEndBalance(config);

        if (ap_start === null || ap_start === 0) {
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

        // เจ้าหนี้การค้าเฉลี่ย
        let avg_ap = (ap_start + ap_end) / 2;

        // อัตราส่วนหมุนเวียนเจ้าหนี้การค้า (เท่า)
        let turnover_ratio = 0;
        if (avg_ap > 0) {
            turnover_ratio = purchases / avg_ap;
        }

        // ระยะเวลาถัวเฉลี่ยในการชำระหนี้ (วัน)
        let days_in_period = getDaysInPeriod();
        let collection_days = 0;
        if (turnover_ratio > 0) {
            collection_days = days_in_period / turnover_ratio;
        }

        // คืนค่าในรูปแบบเดียวกับที่ renderDetailTable ใช้
        return {
            days_in_period: days_in_period,
            rev_uc: purchases,        // ใช้ key เดิมเพื่อให้ตารางและกราฟนำไปแสดงได้
            ar_uc_start: ap_start,
            ar_uc_end: ap_end,
            avg_ar: avg_ap,
            turnover_ratio: turnover_ratio,
            collection_days: collection_days
        };
    };

    // โครงสร้างคืนค่าต้องตรงกับ AP_CONFIG
    return {
        drug_supplies: {
            total: calculateAP('ap_drug_supplies'),
            ds_drug: calculateAP('ds_drug'),
            ds_med: calculateAP('ds_med'),
            ds_sci: calculateAP('ds_sci'),
            ds_raw: calculateAP('ds_raw'),
            ds_finish: calculateAP('ds_finish'),
            ds_pharm: calculateAP('ds_pharm'),
            ds_dental: calculateAP('ds_dental'),
            ds_xray: calculateAP('ds_xray')
        },
        external: {
            total: calculateAP('ap_external'),
            ext_102: calculateAP('ext_102'),
            ext_103: calculateAP('ext_103'),
            ext_105: calculateAP('ext_105'),
            ext_130: calculateAP('ext_130'),
            ext_131: calculateAP('ext_131'),
            ext_132: calculateAP('ext_132'),
            ext_133: calculateAP('ext_133'),
            ext_134: calculateAP('ext_134'),
            ext_135: calculateAP('ext_135'),
            ext_136: calculateAP('ext_136'),
            ext_137: calculateAP('ext_137'),
            ext_138: calculateAP('ext_138')
        },
        gov: {
            total: calculateAP('ap_gov'),
            gov_102: calculateAP('gov_102'),
            gov_103: calculateAP('gov_103'),
            gov_105: calculateAP('gov_105'),
            gov_112: calculateAP('gov_112'),
            gov_113: calculateAP('gov_113'),
            gov_114: calculateAP('gov_114'),
            gov_115: calculateAP('gov_115'),
            gov_116: calculateAP('gov_116'),
            gov_117: calculateAP('gov_117'),
            gov_120: calculateAP('gov_120'),
            gov_121: calculateAP('gov_121'),
            gov_122: calculateAP('gov_122')
        },
        gr_ir: {
            total: calculateAP('ap_gr_ir'),
            gr_ir_103: calculateAP('gr_ir_103')
        }
    };
}
