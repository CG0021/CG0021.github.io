// ==========================================================
// ส่วนฟังก์ชันอำนวยความสะดวกทั่วไป (Utility Helpers)
// ==========================================================

// Helper: ดึงชื่อรหัสบัญชีจาก Local Database แฟ้มผังบัญชีหลักต่างๆ
function lookupAccountName(code) {
    if (typeof ACCOUNTS !== 'undefined') {
        for (let key in ACCOUNTS) {
            if (ACCOUNTS[key].codes && ACCOUNTS[key].codes.includes(code)) {
                return ACCOUNTS[key].name;
            }
        }
    }
    if (typeof AP_ACCOUNTS !== 'undefined') {
        for (let key in AP_ACCOUNTS) {
            if (AP_ACCOUNTS[key].codes && AP_ACCOUNTS[key].codes.includes(code)) {
                return AP_ACCOUNTS[key].name;
            }
        }
    }
    if (typeof PR_ACCOUNTS !== 'undefined') {
        for (let key in PR_ACCOUNTS) {
            if (PR_ACCOUNTS[key].codes && PR_ACCOUNTS[key].codes.includes(code)) {
                return PR_ACCOUNTS[key].name;
            }
        }
    }
    if (typeof INV_ACCOUNTS !== 'undefined') {
        for (let key in INV_ACCOUNTS) {
            if (INV_ACCOUNTS[key].codes && INV_ACCOUNTS[key].codes.includes(code)) {
                return INV_ACCOUNTS[key].name;
            }
        }
    }

    // Default Fallbacks
    if (code.startsWith('1')) return `สินทรัพย์ (${code})`;
    if (code.startsWith('2')) return `หนี้สิน (${code})`;
    if (code.startsWith('3')) return `ส่วนของเจ้าของ (${code})`;
    if (code.startsWith('4')) return `รายได้ทางการแพทย์ (${code})`;
    if (code.startsWith('5')) return `ค่าใช้จ่ายการรักษา (${code})`;

    return `บัญชีทั่วไป (${code})`;
}

// Helper: คำนวณผลรวมดุลบัญชีในเดือน (YTD) จาก tbData
function sumAccounts(tbData, prefix, isCredit = false) {
    let sum = 0;
    if (!tbData) return 0;
    tbData.forEach(row => {
        if (row.code.startsWith(prefix)) {
            // ดับเบิ้ลเอ็นทรี่: เดบิตสุทธิ หรือ เครดิตสุทธิ
            sum += isCredit ? (row.end_cr - row.end_dr) : (row.end_dr - row.end_cr);
        }
    });
    return sum;
}

// Helper: แปลงสเกลตัวเลขให้กระชับ (K / M / B) ปราศจากหน่วยแสดงผลรกตา
function formatAbbreviated(num) {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    let absNum = Math.abs(num);
    let sign = num < 0 ? '-' : '';
    if (absNum >= 1.0e+9) {
        return sign + (absNum / 1.0e+9).toFixed(2).replace(/\.00$/, '') + 'B';
    } else if (absNum >= 1.0e+6) {
        return sign + (absNum / 1.0e+6).toFixed(2).replace(/\.00$/, '') + 'M';
    } else if (absNum >= 1.0e+3) {
        return sign + (absNum / 1.0e+3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return sign + absNum.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

// Helper: แปลงชื่อไฟล์เป็นรอบวันที่
function extractDateFromFilename(filename) {
    let match = filename.match(/(\d{4})[-_](\d{1,2})/);
    if (match) {
        let year = parseInt(match[1]);
        let originalYear = year;
        if (year > 2500) year -= 543;
        let month = parseInt(match[2]);
        
        // แปลงเป็นชื่อเดือนภาษาไทย เช่น "ต.ค. 67"
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        let thaiYear = originalYear > 2500 ? originalYear : originalYear + 543;
        let thaiYearShort = (thaiYear % 100).toString().padStart(2, '0');
        let thaiMonthStr = `${thaiMonths[month - 1]} ${thaiYearShort}`;
        
        return {
            str: thaiMonthStr,
            dateObj: new Date(year, month - 1, 1)
        };
    }
    return {
        str: filename.replace('.xlsx', '').replace('.xls', ''),
        dateObj: new Date(0)
    };
}

// Helper: โหลดไฟล์อัพโหลด Excel แบบ Asynchronous
function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Helper: คำนวณผลรวมของ MGT Account ตามรหัสใน tbData
function sumMgtAccount(tbData, mgtCode, isSingleBalance = false) {
    if (!tbData || typeof MGT_ACCOUNTS_MAP === 'undefined') return 0;
    const item = MGT_ACCOUNTS_MAP.find(m => m.code === mgtCode);
    if (!item) return 0;
    
    // A2 เป็นหนี้สิน/รายได้ (Credit), A1 เป็นสินทรัพย์/ค่าใช้จ่าย (Debit)
    // ตรวจสอบว่าไม่ใช่บัญชีปกติฝั่ง Debit (A1, A5 ยกเว้นตัววัดผลกำไร, A6, A912S, E500S) เพื่อจัดกลุ่ม EBITDA และกลุ่มรายได้/กำไร เป็น Credit
    const isCredit = !(
        mgtCode.startsWith("A1") ||
        (mgtCode.startsWith("A5") && mgtCode !== 'A501D' && mgtCode !== 'A501N' && mgtCode !== 'A529D' && mgtCode !== 'A529N') ||
        mgtCode.startsWith("A6") ||
        mgtCode === "A912S" ||
        mgtCode === "E500S"
    );
    let sum = 0;
    tbData.forEach(row => {
        if (item.tbCodes.includes(row.code)) {
            if (isSingleBalance) {
                sum += Math.abs(row.end_net);
            } else {
                sum += isCredit ? (row.end_cr - row.end_dr) : (row.end_dr - row.end_cr);
            }
        }
    });
    return sum;
}

// Helper: คำนวณผลรวมตามรหัสบัญชีที่กำหนดแบบระบุประเภท (Debit/Credit)
function sumSpecificCodes(tbData, codes, isCredit, isSingleBalance = false) {
    let sum = 0;
    if (!tbData) return 0;
    tbData.forEach(row => {
        if (codes.includes(row.code)) {
            if (isSingleBalance) {
                sum += Math.abs(row.end_net);
            } else {
                sum += isCredit ? (row.end_cr - row.end_dr) : (row.end_dr - row.end_cr);
            }
        }
    });
    return sum;
}

// Helper: ปัดทศนิยมแบบเกณฑ์ตำแหน่งที่ 3 คือ 5 ขึ้นไปปัดขึ้น
function preciseRound(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    const t = Math.pow(10, decimals);
    return (Math.round((num + 0.0000000001) * t) / t).toFixed(decimals);
}

function isMonthCalculable(currentFile, allFiles) {
    if (!currentFile || !currentFile.dateObj || !allFiles || allFiles.length === 0) return false;
    let currentMonth = currentFile.dateObj.getMonth(); // 0-11
    let currentYear = currentFile.dateObj.getFullYear();

    // Previous September month and year
    let prevSepMonth = 8; // September is 8
    let prevSepYear = currentMonth >= 9 ? currentYear : currentYear - 1;

    // Check if previous September file exists
    let hasSep = allFiles.some(f => f.dateObj.getFullYear() === prevSepYear && f.dateObj.getMonth() === prevSepMonth);
    if (!hasSep) return false;

    // Fiscal year starts in October of prevSepYear
    // We need to check all months from October of prevSepYear up to currentFile
    let checkYear = prevSepYear;
    let checkMonth = 9; // October is 9

    while (true) {
        // Check if this month exists
        let hasMonth = allFiles.some(f => f.dateObj.getFullYear() === checkYear && f.dateObj.getMonth() === checkMonth);
        if (!hasMonth) return false;

        // If we reached the target month and year, we are done checking
        if (checkYear === currentYear && checkMonth === currentMonth) {
            break;
        }

        // Move to next month
        checkMonth++;
        if (checkMonth > 11) {
            checkMonth = 0;
            checkYear++;
        }
    }

    return true;
}
