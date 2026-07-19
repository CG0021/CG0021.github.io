// =========================================================================================
// สูตรการคำนวณ: วิกฤติทางการเงิน 7 ระดับ (MOPH 7-Level Financial Distress Risk Scoring)
// =========================================================================================
// ไฟล์นี้ใช้คำนวณคะแนนความเสี่ยงทางการเงินเพื่อแบ่งระดับวิกฤตทางการเงินออกเป็น 7 ระดับ ตามเกณฑ์ของกระทรวงสาธารณสุข
// 
// แหล่งข้อมูลและรหัสผังบัญชีบริหาร (Management Account Codes) ที่ใช้:
//   1. สินทรัพย์หมุนเวียน (Current Assets): รหัส 'A119'
//   2. หนี้สินหมุนเวียน (Current Liabilities): รหัส 'A219'
//   3. เงินสดและรายการเทียบเท่าเงินสด (Cash & Equivalents): รหัส 'A1111S'
//   4. สินค้าคงคลัง (Inventory): รหัส 'A1131S'
//   5. สินทรัพย์หมุนเวียนอื่น (Other Current Assets): รหัส 'A118'
//   6. รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (Net Income - NI): รหัส 'A91D'
//   7. ค่าเสื่อมราคาและค่าตัดจำหน่าย (Depreciation & Amortization): 
//      คำนวณจากผลรวมของรหัสดังต่อไปนี้:
//      - A5002010: ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง (บริการ)
//      - A5002020: ค่าเสื่อมราคาครุภัณฑ์ (บริการ)
//      - A5002030: ค่าตัดจำหน่าย (บริการ)
//      - A5102010: ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง (สนับสนุน)
//      - A5102020: ค่าเสื่อมราคาครุภัณฑ์ (สนับสนุน)
//      - A5102030: ค่าตัดจำหน่าย (สนับสนุน)
//
// ดัชนีการวิเคราะห์ (Indices Analyzed):
//   1. Liquid Index (ดัชนีสภาพคล่อง - 3 คะแนนเต็ม):
//      - Current Ratio (CR) < 1.5   => +1 คะแนน
//      - Quick Ratio (QR) < 1.0     => +1 คะแนน
//      - Cash Ratio < 0.8           => +1 คะแนน
//   2. Status Index (ดัชนีความมั่นคง - 2 คะแนนเต็ม):
//      - Net Working Capital (NWC) < 0 => +1 คะแนน
//      - Net Income (NI) < 0           => +1 คะแนน
//   3. Survival Index (ดัชนีการอยู่รอด - 2 คะแนนเต็ม):
//      - คำนวณความสามารถในการทนต่อการขาดทุนหรือระยะเวลาในการฟื้นคืนทุน (หน่วย: เดือน)
//      - หากอยู่รอดได้น้อยกว่า 3 เดือน หรือขาดทุนในขณะที่ NWC ติดลบอยู่แล้ว => +2 คะแนน
//      - หากอยู่รอดได้ 3 - 6 เดือน => +1 คะแนน
//      - หากปกติ/ปลอดภัย หรือทนทานได้มากกว่า 6 เดือน => 0 คะแนน
//
// คะแนนรวมความเสี่ยง (Risk Score) = Liquid Index + Status Index + Survival Index (ค่าระหว่าง 0 - 7)
// ระดับวิกฤตทางการเงิน (Distress Level) = ค่าเท่ากับ Risk Score (ระดับ 0 - 7)
// =========================================================================================

function calculateFinancialDistress(month, allFiles = []) {
    const tbData = month.tbData || [];
    const isSingleBalance = tbData.some(row => row.code && row.code.startsWith('CR_'));

    // 1. ดึงข้อมูลสินทรัพย์ หนี้สิน และกำไรขาดทุนสะสม (YTD) จากรหัสบัญชีบริหาร
    const currentAssets = sumMgtAccount(tbData, 'A119', isSingleBalance);
    const currentLiabilities = sumMgtAccount(tbData, 'A219', isSingleBalance);
    const cashEquivalents = sumMgtAccount(tbData, 'A1111S', isSingleBalance);
    const inventory = sumMgtAccount(tbData, 'A1131S', isSingleBalance);
    const otherCurrentAssets = sumMgtAccount(tbData, 'A118', isSingleBalance);
    const ni = sumMgtAccount(tbData, 'A91D', isSingleBalance);

    // คำนวณค่าเสื่อมราคาและค่าตัดจำหน่ายสะสม YTD
    const depr = sumMgtAccount(tbData, 'A5002010', isSingleBalance) +
                 sumMgtAccount(tbData, 'A5002020', isSingleBalance) +
                 sumMgtAccount(tbData, 'A5002030', isSingleBalance) +
                 sumMgtAccount(tbData, 'A5102010', isSingleBalance) +
                 sumMgtAccount(tbData, 'A5102020', isSingleBalance) +
                 sumMgtAccount(tbData, 'A5102030', isSingleBalance);

    // ดึงค่าอัตราส่วนที่คำนวณไว้แล้วใน Dashboard (หรือคำนวณใหม่หากไม่มี)
    const dbRes = month.dashboardResult || {};
    const cr = typeof dbRes.currentRatio !== 'undefined' ? dbRes.currentRatio : (currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0);
    const qr = typeof dbRes.quickRatio !== 'undefined' ? dbRes.quickRatio : (currentLiabilities > 0 ? ((currentAssets - inventory - otherCurrentAssets) / currentLiabilities) : 0);
    const cashRatio = typeof dbRes.cashRatio !== 'undefined' ? dbRes.cashRatio : (currentLiabilities > 0 ? (cashEquivalents / currentLiabilities) : 0);
    const nwc = typeof dbRes.nwc !== 'undefined' ? dbRes.nwc : (currentAssets - currentLiabilities);
    const niDepr = ni + depr;

    // 2. คำนวณคะแนน Liquid Index (ดัชนีสภาพคล่อง) - คะแนนสูงสุด 3
    let liquidScore = 0;
    if (cr < 1.5) liquidScore++;
    if (qr < 1.0) liquidScore++;
    if (cashRatio < 0.8) liquidScore++;

    // 3. คำนวณคะแนน Status Index (ดัชนีฐานะทางการเงิน) - คะแนนสูงสุด 2
    let statusScore = 0;
    if (nwc < 0) statusScore++;
    if (ni < 0) statusScore++;

    // 4. คำนวณคะแนน Survival Index (ดัชนีการอยู่รอด) - คะแนนสูงสุด 2
    const monthVal = month.dateObj ? month.dateObj.getMonth() : 0; // 0-11
    const elapsedMonths = monthVal >= 9 ? monthVal - 8 : monthVal + 4; // เดือนงบประมาณสะสม (ต.ค. = 1)

    let survivalScore = 0;
    let survivalStatusText = "";
    let survivalMonths = 0;

    if (ni !== 0) {
        survivalMonths = Math.abs((nwc * elapsedMonths) / ni);//Math.abs(nwc / ni) * elapsedMonths
        survivalMonths = Math.round(survivalMonths * 10) / 10;
    } else {
        survivalMonths = 999;
    }

    if (nwc >= 0 && ni >= 0) {
        survivalScore = 0;
        survivalStatusText = "ปลอดภัยดี (NWC+, NI+)";
    } else if (nwc < 0 && ni < 0) {
        survivalScore = 2;
        survivalMonths = 0;
        survivalStatusText = "วิกฤตขั้นรุนแรง (NWC-, NI-)";
    } else {
        if (nwc >= 0 && ni < 0) {
            // NWC+ และ NI- (กินทุนตัวเอง)
            if (survivalMonths > 6) {
                survivalScore = 0;
                survivalStatusText = `ทุนพอประคอง > 6 ด. (${survivalMonths} ด.)`;
            } else if (survivalMonths >= 3 && survivalMonths <= 6) {
                survivalScore = 1;
                survivalStatusText = `ทุนจะหมดใน 3 - 6 ด. (${survivalMonths} ด.)`;
            } else {
                survivalScore = 2;
                survivalStatusText = `ทุนจะหมดใน < 3 ด. (${survivalMonths} ด.) - วิกฤตเฉียบพลัน`;
            }
        } else if (nwc < 0 && ni >= 0) {
            // NWC- และ NI+ (ฟื้นตัวคืนทุน)
            if (survivalMonths > 6) {
                survivalScore = 2;
                survivalStatusText = `ใช้เวลาฟื้นทุน > 6 ด. (${survivalMonths} ด.) - ฟื้นตัวช้ามาก`;
            } else if (survivalMonths >= 3 && survivalMonths <= 6) {
                survivalScore = 1;
                survivalStatusText = `ใช้เวลาฟื้นทุน 3 - 6 ด. (${survivalMonths} ด.)`;
            } else {
                survivalScore = 0;
                survivalStatusText = `ใช้เวลาฟื้นทุน < 3 ด. (${survivalMonths} ด.) - ฟื้นตัวดีเยี่ยม`;
            }
        }
    }

    const monthsToChange = survivalMonths;

    // 5. สรุปคะแนนและระดับความเสี่ยง
    const riskScore = liquidScore + statusScore + survivalScore;
    const distressLevel = riskScore;
    let distressLevelText = "";
    let distressLevelDesc = "";

    if (distressLevel <= 1) {
        distressLevelText = `ระดับ ${distressLevel}: ปกติ`;
        distressLevelDesc = "ปกติ";
    } else if (distressLevel === 2) {
        distressLevelText = "ระดับ 2: คาดว่าจะดีขึ้นภายใน 3 เดือน";
        distressLevelDesc = "คาดว่าจะดีขึ้นภายใน 3 เดือน";
    } else if (distressLevel === 3) {
        distressLevelText = "ระดับ 3: คาดว่าจะดีขึ้นภายหลัง 3 เดือน";
        distressLevelDesc = "คาดว่าจะดีขึ้นภายหลัง 3 เดือน";
    } else if (distressLevel === 4) {
        distressLevelText = "ระดับ 4: คาดว่าจะประสบปัญหาภายหลัง 6 เดือน";
        distressLevelDesc = "คาดว่าจะประสบปัญหาภายหลัง 6 เดือน";
    } else if (distressLevel === 5) {
        distressLevelText = "ระดับ 5: คาดว่าจะประสบปัญหาภายใน 6 เดือน";
        distressLevelDesc = "คาดว่าจะประสบปัญหาภายใน 6 เดือน";
    } else if (distressLevel === 6) {
        distressLevelText = "ระดับ 6: คาดว่าจะประสบปัญหาภายใน 3 เดือน";
        distressLevelDesc = "คาดว่าจะประสบปัญหาภายใน 3 เดือน";
    } else if (distressLevel === 7) {
        distressLevelText = "ระดับ 7: มีภาวะวิกฤตทางการเงินขั้นรุนแรง";
        distressLevelDesc = "มีภาวะวิกฤตทางการเงินขั้นรุนแรง";
    }

    return {
        currentAssets,
        currentLiabilities,
        cashEquivalents,
        inventory,
        otherCurrentAssets,
        ni,
        depr,
        cr,
        qr,
        cashRatio,
        nwc,
        niDepr,
        liquidScore,
        statusScore,
        survivalScore,
        monthsToChange,
        survivalStatusText,
        riskScore,
        distressLevel,
        distressLevelText,
        distressLevelDesc
    };
}

// ผูกฟังก์ชันเข้ากับ global window เพื่อให้ระบบเดิมและ UI เรียกใช้ได้สะดวก
window.calculateFinancialDistress = calculateFinancialDistress;
