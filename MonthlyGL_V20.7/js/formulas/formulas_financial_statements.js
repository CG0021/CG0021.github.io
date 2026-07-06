// =========================================================================================
// สูตรการคำนวณ: งบการเงินมาตรฐาน YTD (Year-To-Date Financial Statements)
// =========================================================================================
// ไฟล์นี้ใช้คำนวณยอดสะสม YTD สำหรับงบกำไรขาดทุนมาตรฐานและงบดุลมาตรฐานของระบบ
//
// แหล่งข้อมูลและรหัสผังบัญชีหลัก (COA Prefixes) ที่ใช้:
//   1. รายได้รวม (Total YTD Revenue): หมวด '4' ทั้งหมด (Credit Normal)
//   2. รายจ่ายรวม (Total YTD Expenses): หมวด '5' ทั้งหมด (Debit Normal)
//   3. รายได้ละเอียด (Detail YTD Revenue): หมวด '4301' (หากไม่มีให้ใช้รายได้รวม)
//   4. รายจ่ายละเอียด (Detail YTD Expenses): ผลรวมของหมวด '5101' และ '5201' (หากไม่มีให้ใช้รายจ่ายรวม)
//   5. เงินสดและเงินฝากธนาคาร (Cash & Bank): หมวด '1101' (Debit Normal)
//   6. ลูกหนี้การค้า (Accounts Receivable): ผลรวมของหมวด '1102' และ '1201' (Debit Normal)
//   7. สินค้าคงคลัง (Inventory): หมวด '1105' (Debit Normal)
//   8. เจ้าหนี้การค้า (Accounts Payable): หมวด '2101' (Credit Normal)
//   9. ค่าบุคลากรค้างจ่าย (Personnel Payable): หมวด '2102' (Credit Normal)
//
// วิธีการคำนวณ (Calculation Logic):
//   - กำไรสุทธิสะสม (Net Profit) = รายได้รวม (Revenue) - รายจ่ายรวม (Expenses)
//   - รวมสินทรัพย์หมุนเวียน (Total Assets) = เงินสด (Cash) + ลูกหนี้ (AR) + สินค้าคงคลัง (INV)
//   - รวมหนี้สินหมุนเวียน (Total Liabilities) = เจ้าหนี้การค้า (AP) + ค่าบุคลากรค้างจ่าย (PR)
// =========================================================================================

function calculateFinancialStatements(month) {
    const tbData = month.tbData || [];

    // 1. หมวดกำไรขาดทุนสะสม (YTD Income Statement)
    const revenue = sumAccounts(tbData, '4', true);
    const expenses = sumAccounts(tbData, '5', false);
    const netProfit = revenue - expenses;

    // รายละเอียดจำแนกย่อย
    const revenueDetail = sumAccounts(tbData, '4301', true) || revenue;
    const expensesDetail = sumAccounts(tbData, '5101', false) + sumAccounts(tbData, '5201', false) || expenses;

    // 2. หมวดแสดงฐานะการเงินสะสม (YTD Balance Sheet)
    const cash = sumAccounts(tbData, '1101', false);
    const ar = sumAccounts(tbData, '1102', false) + sumAccounts(tbData, '1201', false);
    const inv = sumAccounts(tbData, '1105', false);
    const totalAssets = cash + ar + inv;

    const ap = sumAccounts(tbData, '2101', true);
    const pr = sumAccounts(tbData, '2102', true);
    const totalLiabilities = ap + pr;

    return {
        revenue,
        expenses,
        netProfit,
        revenueDetail,
        expensesDetail,
        cash,
        ar,
        inv,
        totalAssets,
        ap,
        pr,
        totalLiabilities
    };
}

// ผูกเข้ากับ global window
window.calculateFinancialStatements = calculateFinancialStatements;
