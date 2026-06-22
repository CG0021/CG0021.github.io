// =========================================================================================
// สูตรการคำนวณ: งบกำไรขาดทุนแบบขั้นบันได (Waterfall P&L Statement Analysis)
// =========================================================================================
// ไฟล์นี้ใช้คำนวณและปันส่วนกลุ่มหมวดหมู่บัญชีบริหารในงบกำไรขาดทุนสะสม (YTD) เพื่อนำไปแสดงผลแบบขั้นบันได (Waterfall)
// 
// แหล่งข้อมูลและรหัสผังบัญชีบริหาร (Management Account Codes) ที่ใช้:
//   1. รวมรายได้ค่ารักษาพยาบาล (OPD/IPD Medical Revenue): รหัส 'A419S'
//   2. รายได้งบประมาณส่วนบุคลากร (Personnel Budget Allocation): รหัส 'A4201010'
//   3. รวมรายได้และรายได้กองทุน (Total Revenue & Funds): รหัส 'A49'
//   4. รวมต้นทุนค่ารักษาพยาบาล (OPD/IPD Medical Direct Cost): รหัส 'A5009N' (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย)
//   5. กำไรขั้นต้น (Gross Profit): รหัส 'A501D'
//   6. รวมค่าใช้จ่ายในการดำเนินงาน (Operating Expenses - OPEX): รหัส 'A519N' (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย)
//   7. กำไรจากการดำเนินงาน (Operating Profit): รหัส 'A529N'
//   8. รวมรายได้อื่นๆ (Other Non-Operating Revenues): รหัส 'A9010S'
//   9. รวมค่าใช้จ่ายอื่นๆ (Other Non-Operating Expenses): รหัส 'A60SS'
//  10. รายได้/ค่าใช้จ่ายอื่นสุทธิ (Net Other Income/Expense): รหัส 'A90S'
//  11. กำไรสุทธิก่อนค่าเสื่อมราคาและค่าตัดจำหน่าย (EBITDA / Net Income Before Depreciation): รหัส 'A91N'
//  12. รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (Net Income - NI): รหัส 'A91D'
//  13. EBITDA (ทางเลือกเทียบเท่า): รหัส 'EBITDA'
//
// การคำนวณเพิ่มเติม:
//   - ค่าเสื่อมราคาและค่าตัดจำหน่าย (Depreciation & Amortization) = Net Income Before Depreciation (A91N) - Net Income (A91D)
// =========================================================================================

function calculateWaterfallPnL(month) {
    const tbData = month.tbData || [];
    const isSingleBalance = tbData.some(row => row.code && row.code.startsWith('CR_'));

    // คำนวณผลรวมรายเดือน/สะสม (YTD) ของรหัสบัญชีบริหารต่างๆ
    const a419s = sumMgtAccount(tbData, 'A419S', isSingleBalance);
    const a4201010 = sumMgtAccount(tbData, 'A4201010', isSingleBalance);
    const a49 = sumMgtAccount(tbData, 'A49', isSingleBalance);
    const a5009n = sumMgtAccount(tbData, 'A5009N', isSingleBalance);
    const a501d = sumMgtAccount(tbData, 'A501D', isSingleBalance);
    const a519n = sumMgtAccount(tbData, 'A519N', isSingleBalance);
    const a529n = sumMgtAccount(tbData, 'A529N', isSingleBalance);
    const a9010s = sumMgtAccount(tbData, 'A9010S', isSingleBalance);
    const a60ss = sumMgtAccount(tbData, 'A60SS', isSingleBalance);
    const a90s = sumMgtAccount(tbData, 'A90S', isSingleBalance);
    const a91n = sumMgtAccount(tbData, 'A91N', isSingleBalance);
    const a91d = sumMgtAccount(tbData, 'A91D', isSingleBalance);
    const ebitda = sumMgtAccount(tbData, 'EBITDA', isSingleBalance);

    // คำนวณหาค่าเสื่อมราคาระหว่างงวดแบบย้อนกลับ: A91N (ก่อนเสื่อม) - A91D (หลังเสื่อม)
    const deprVal = a91n - a91d;

    return {
        a419s,
        a4201010,
        a49,
        a5009n,
        a501d,
        a519n,
        a529n,
        a9010s,
        a60ss,
        a90s,
        a91n,
        a91d,
        deprVal,
        ebitda
    };
}

// ผูกฟังก์ชันเข้ากับ global window
window.calculateWaterfallPnL = calculateWaterfallPnL;
