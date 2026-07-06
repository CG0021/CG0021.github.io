// ==========================================================
// ส่วนจัดการเรนเดอร์สถิติกราฟ (Data Visualizations & Charts)
// ==========================================================

// Global loop for animating dashed lines on hover
if (typeof window.hasDashAnimationStarted === 'undefined') {
    window.hasDashAnimationStarted = true;
    let offset = 0;
    function animateDash() {
        offset -= 0.5;
        if (offset < -20) offset = 0;
        let needsRender = false;
        
        if (window.dashFinancialChartInstance) {
            window.dashFinancialChartInstance.data.datasets.forEach(ds => {
                if (ds.isHovered) {
                    ds.borderDash = [8, 4];
                    ds.borderDashOffset = offset;
                    needsRender = true;
                } else {
                    if (ds.borderDash && ds.borderDash.length > 0 && ds.borderDash[0] === 8) {
                        ds.borderDash = [];
                        ds.borderDashOffset = 0;
                        needsRender = true;
                    }
                }
            });
            if (needsRender) {
                window.dashFinancialChartInstance.update('none');
            }
        }
        requestAnimationFrame(animateDash);
    }
    requestAnimationFrame(animateDash);
}

// Renderer: Dynamic Financial Health Chart
function renderFinancialHealthChart() {
    const canvas = document.getElementById('dashFinancialChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const activeChart = window.dashFinancialChartInstance || dashFinancialChartInstance;
    if (activeChart) {
        try {
            activeChart.destroy();
        } catch (e) {
            console.error("Error destroying dashFinancialChartInstance:", e);
        }
        dashFinancialChartInstance = null;
        window.dashFinancialChartInstance = null;
    }

    window.convertYTDToMonthly = function(data, filteredMonths) {
        let monthlyData = [];
        for (let i = 0; i < data.length; i++) {
            const currentMonthObj = filteredMonths[i].dateObj;
            const currentMonth = currentMonthObj.getMonth();
            if (currentMonth === 9 || i === 0) {
                monthlyData.push(data[i]);
            } else {
                const prevMonthObj = filteredMonths[i - 1].dateObj;
                const getFiscalYear = (d) => {
                    const y = d.getFullYear();
                    const m = d.getMonth();
                    return m >= 9 ? y + 1 : y;
                };
                if (getFiscalYear(currentMonthObj) === getFiscalYear(prevMonthObj)) {
                    monthlyData.push(data[i] - data[i - 1]);
                } else {
                    monthlyData.push(data[i]);
                }
            }
        }
        return monthlyData;
    };

    if (monthlyResults.length === 0) return;

    let filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    const metricsToDraw = window.activeDashboardMetrics || [window.activeDashboardMetric || 'revenue_expense'];

    const metric = metricsToDraw[0];
    const isMultiMode = (metricsToDraw.length > 1 || metricsToDraw[0] !== 'revenue_expense');
    let labels = [];
    let datasets = [];
    let titleText = "แนวโน้มทางการเงิน";
    
    const isCurrencyForMetric = (mKey) => (mKey !== 'currentRatio' && mKey !== 'quickRatio' && mKey !== 'cashRatio' && mKey !== 'operatingMargin' && mKey !== 'returnOnAsset' && mKey !== 'apDrugSuppliesDays' && mKey !== 'apDrugSuppliesPeriodDays' && mKey !== 'arUCDays' && mKey !== 'arCGDDays' && mKey !== 'arSSSDays' && mKey !== 'invDays' && mKey !== 'arUCPeriodDays' && mKey !== 'arCGDPeriodDays' && mKey !== 'arSSSPeriodDays' && mKey !== 'invPeriodDays');
    let isCurrency = isCurrencyForMetric(metric);
    let yAxisTitle = isCurrency ? "จำนวนเงิน (บาท)" : (metric === 'operatingMargin' || metric === 'returnOnAsset' ? "อัตราส่วน (%)" : (['apDrugSuppliesDays', 'apDrugSuppliesPeriodDays', 'arUCDays', 'arCGDDays', 'arSSSDays', 'invDays', 'arUCPeriodDays', 'arCGDPeriodDays', 'arSSSPeriodDays', 'invPeriodDays'].includes(metric) ? "จำนวนวัน (วัน)" : "อัตราส่วน (เท่า)"));

    const hasCurrency = metricsToDraw.some(mk => isCurrencyForMetric(mk));
    const hasNonCurrency = metricsToDraw.some(mk => !isCurrencyForMetric(mk));
    const hasMixedAxes = hasCurrency && hasNonCurrency;

    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    filteredMonths.forEach(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        labels.push(`${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`);
    });

    // Configure datasets based on selected metric
    if (!isMultiMode && metric === 'revenue_expense') {
        titleText = "แนวโน้มรายได้ รายจ่าย และกำไรสุทธิสะสม";
        yAxisTitle = "จำนวนเงิน (บาท)";
        isCurrency = true;
        
        let revData = filteredMonths.map(m => sumAccounts(m.tbData, '4', true));
        let expData = filteredMonths.map(m => sumAccounts(m.tbData, '5', false));
        let profitData = filteredMonths.map(m => sumAccounts(m.tbData, '4', true) - sumAccounts(m.tbData, '5', false));
        let cashData = filteredMonths.map(m => sumAccounts(m.tbData, '1101', false));

        datasets = [
            {
                type: 'line',
                label: 'รายได้สะสม',
                data: revData,
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                borderWidth: 3.5,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#10B981',
                pointBorderWidth: 2,
                pointRadius: 4.5,
                tension: 0.3
            },
            {
                type: 'line',
                label: 'ค่าใช้จ่ายสะสม',
                data: expData,
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 3.5,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#EF4444',
                pointBorderWidth: 2,
                pointRadius: 4.5,
                tension: 0.3
            },
            {
                type: 'line',
                label: 'เงินสดคงเหลือสะสม',
                data: cashData,
                borderColor: '#6366F1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: '#6366F1',
                pointBorderColor: '#6366F1',
                pointBorderWidth: 1.5,
                pointRadius: 3.5,
                tension: 0.3
            },
            {
                type: 'bar',
                label: 'กำไรสุทธิสะสม',
                data: profitData,
                backgroundColor: 'rgba(2, 132, 199, 0.25)',
                borderColor: '#0284C7',
                borderWidth: 1.5,
                borderRadius: 6
            }
        ];
    } else {
        if (metricsToDraw.length === 1) {
            const m = metricsToDraw[0];
            if (m === 'revenue') { titleText = "แนวโน้มรายได้สะสม (YTD Revenue)"; }
            else if (m === 'expenses') { titleText = "แนวโน้มรายจ่ายสะสม (YTD Expenses)"; }
            else if (m === 'netProfit') { titleText = "แนวโน้มกำไรสุทธิสะสม (Net Profit)"; }
            else if (m === 'cash') { titleText = "แนวโน้มเงินสดสะสม (Cash)"; }
            else if (m === 'currentRatio') { titleText = "แนวโน้ม Current Ratio (เป้าหมาย ≥ 1.5)"; }
            else if (m === 'quickRatio') { titleText = "แนวโน้ม Quick Ratio (เป้าหมาย ≥ 1.0)"; }
            else if (m === 'cashRatio') { titleText = "แนวโน้ม Cash Ratio (เป้าหมาย ≥ 0.3)"; }
            else if (m === 'nwc') { titleText = "แนวโน้ม Net Working Capital (NWC)"; }
            else if (m === 'niDepr') { titleText = "แนวโน้ม รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ (NI)"; }
            else if (m === 'netReserve') { titleText = "แนวโน้มเงินบำรุงคงเหลือ (หักหนี้สินแล้ว)"; }
            else if (m === 'ebitda') { titleText = "แนวโน้ม EBITDA"; }
            else if (m === 'operatingMargin') { titleText = "แนวโน้ม Operating Margin"; }
            else if (m === 'returnOnAsset') { titleText = "แนวโน้ม Return on Asset (ROA)"; }
            else if (m === 'apDrugSuppliesDays') { titleText = "แนวโน้มระยะเวลาชำระหนี้ เจ้าหนี้ ยา / เวชภัณฑ์"; }
            else if (m === 'apDrugSuppliesPeriodDays') { titleText = "แนวโน้มช่วงเวลาสะสม"; }
            else if (m === 'apDrugSuppliesPurchases') { titleText = "แนวโน้มผลรวมเจ้าหนี้การค้า (ยอดซื้อสะสม)"; }
            else if (m === 'apDrugSuppliesAvg') { titleText = "แนวโน้มเจ้าหนี้การค้าเฉลี่ย"; }
            else if (m === 'arUCDays') { titleText = "แนวโน้มระยะเวลาเก็บหนี้ ลูกหนี้ สิทธิ UC"; }
            else if (m === 'arCGDDays') { titleText = "แนวโน้มระยะเวลาเก็บหนี้ ลูกหนี้ เบิกจ่ายตรง (กรมบัญชีกลาง)"; }
            else if (m === 'arSSSDays') { titleText = "แนวโน้มระยะเวลาเก็บหนี้ ลูกหนี้ สิทธิประกันสังคม"; }
            else if (m === 'invDays') { titleText = "แนวโน้มระยะเวลาขายคลัง สินค้าคงคลัง"; }
            else if (m === 'revenue_no_invest') { titleText = "แนวโน้มรายได้รวม (ไม่รวมงบลงทุน)"; }
            else if (m === 'expense_no_depr') { titleText = "แนวโน้มค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมและค่าตัดจำหน่าย)"; }
            else if (m === 'currentAssets') { titleText = "แนวโน้มสินทรัพย์หมุนเวียน"; }
            else if (m === 'quickAssets') { titleText = "แนวโน้มสินทรัพย์หมุนเวียนเร็ว"; }
            else if (m === 'cashEquivalents') { titleText = "แนวโน้มเงินสดและรายการเทียบเท่าเงินสด"; }
            else if (m === 'currentLiabilities') { titleText = "แนวโน้มหนี้สินหมุนเวียนปรับปรุง"; }
            else if (m === 'a49') { titleText = "แนวโน้มรวมรายได้"; }
            else if (m === 'totalAssets') { titleText = "แนวโน้มรวมสินทรัพย์"; }
        } else {
            titleText = "เปรียบเทียบตัวบ่งชี้สะสม";
        }

        // Generate dataset for each selected metric
        metricsToDraw.forEach(mKey => {
            let chartData = [];
            let targetData = [];
            
            filteredMonths.forEach(month => {
                const dbRes = month.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(month, monthlyResults) : {
                    currentRatio: 0, quickRatio: 0, cashRatio: 0, nwc: 0, netReserve: 0
                });

                const rev = sumAccounts(month.tbData, '4', true);
                const exp = sumAccounts(month.tbData, '5', false);
                const profit = rev - exp;
                const cash = sumAccounts(month.tbData, '1101', false);

                if (mKey === 'revenue') {
                    chartData.push(rev);
                } else if (mKey === 'expenses') {
                    chartData.push(exp);
                } else if (mKey === 'netProfit') {
                    chartData.push(profit);
                } else if (mKey === 'cash') {
                    chartData.push(cash);
                } else if (mKey === 'currentRatio') {
                    chartData.push(dbRes.currentRatio);
                    targetData.push(1.5);
                } else if (mKey === 'quickRatio') {
                    chartData.push(dbRes.quickRatio);
                    targetData.push(1.0);
                } else if (mKey === 'cashRatio') {
                    chartData.push(dbRes.cashRatio);
                    targetData.push(0.8);
                } else if (mKey === 'nwc') {
                    chartData.push(dbRes.nwc);
                } else if (mKey === 'netReserve') {
                    chartData.push(dbRes.netReserve);
                } else if (mKey === 'ebitda') {
                    chartData.push(sumMgtAccount(month.tbData, 'EBITDA'));
                } else if (mKey === 'operatingMargin') {
                    chartData.push(dbRes.operatingMargin);
                } else if (mKey === 'returnOnAsset') {
                    chartData.push(dbRes.returnOnAsset);
                } else if (mKey === 'apDrugSuppliesDays') {
                    chartData.push(dbRes.apDrugSuppliesDays);
                    targetData.push(90);
                } else if (mKey === 'apDrugSuppliesPeriodDays') {
                    chartData.push(dbRes.apDrugSuppliesPeriodDays);
                } else if (mKey === 'apDrugSuppliesPurchases') {
                    chartData.push(dbRes.apDrugSuppliesPurchases);
                } else if (mKey === 'apDrugSuppliesAvg') {
                    chartData.push(dbRes.apDrugSuppliesAvg);
                } else if (mKey === 'arUCDays') {
                    chartData.push((dbRes.arUCDays !== null && dbRes.arUCDays !== undefined && !isNaN(dbRes.arUCDays)) ? dbRes.arUCDays : null);
                    targetData.push(60);
                } else if (mKey === 'arUCPeriodDays') {
                    chartData.push(dbRes.arUCPeriodDays);
                } else if (mKey === 'arUCRev') {
                    chartData.push(dbRes.arUCRev);
                } else if (mKey === 'arUCAvgAR') {
                    chartData.push(dbRes.arUCAvgAR);
                } else if (mKey === 'arCGDDays') {
                    chartData.push((dbRes.arCGDDays !== null && dbRes.arCGDDays !== undefined && !isNaN(dbRes.arCGDDays)) ? dbRes.arCGDDays : null);
                    targetData.push(60);
                } else if (mKey === 'arCGDPeriodDays') {
                    chartData.push(dbRes.arCGDPeriodDays);
                } else if (mKey === 'arCGDRev') {
                    chartData.push(dbRes.arCGDRev);
                } else if (mKey === 'arCGDAvgAR') {
                    chartData.push(dbRes.arCGDAvgAR);
                } else if (mKey === 'arSSSDays') {
                    chartData.push((dbRes.arSSSDays !== null && dbRes.arSSSDays !== undefined && !isNaN(dbRes.arSSSDays)) ? dbRes.arSSSDays : null);
                    targetData.push(60);
                } else if (mKey === 'arSSSPeriodDays') {
                    chartData.push(dbRes.arSSSPeriodDays);
                } else if (mKey === 'arSSSRev') {
                    chartData.push(dbRes.arSSSRev);
                } else if (mKey === 'arSSSAvgAR') {
                    chartData.push(dbRes.arSSSAvgAR);
                } else if (mKey === 'invDays') {
                    chartData.push((dbRes.invDays !== null && dbRes.invDays !== undefined && !isNaN(dbRes.invDays)) ? dbRes.invDays : null);
                    targetData.push(60);
                } else if (mKey === 'invPeriodDays') {
                    chartData.push(dbRes.invPeriodDays);
                } else if (mKey === 'invCostOfSales') {
                    chartData.push(dbRes.invCostOfSales);
                } else if (mKey === 'invAvg') {
                    chartData.push(dbRes.invAvg);
                } else if (mKey === 'revenue_no_invest') {
                    chartData.push(sumMgtAccount(month.tbData, 'E400S'));
                } else if (mKey === 'expense_no_depr') {
                    chartData.push(sumMgtAccount(month.tbData, 'E500S'));
                } else if (mKey === 'currentAssets') {
                    chartData.push(dbRes.a119 || 0);
                } else if (mKey === 'quickAssets') {
                    chartData.push(dbRes.quickRatioNum || 0);
                } else if (mKey === 'cashEquivalents') {
                    chartData.push(dbRes.a1111040_20 || 0);
                } else if (mKey === 'currentLiabilities') {
                    chartData.push(dbRes.ratioDenom || 0);
                } else if (mKey === 'a49') {
                    chartData.push(dbRes.a49 || 0);
                } else if (mKey === 'niDepr') {
                    const isSB = month.tbData.some(row => row.code && row.code.startsWith('CR_'));
                    chartData.push(sumMgtAccount(month.tbData, 'A91D', isSB));
                    targetData.push(0);
                } else if (mKey === 'a911s') {
                    const isSB = month.tbData.some(row => row.code && row.code.startsWith('CR_'));
                    chartData.push(sumMgtAccount(month.tbData, 'A911S', isSB));
                } else if (mKey === 'a912s') {
                    const isSB = month.tbData.some(row => row.code && row.code.startsWith('CR_'));
                    chartData.push(sumMgtAccount(month.tbData, 'A912S', isSB));
                } else if (mKey === 'totalAssets') {
                    chartData.push(dbRes.a1291 || 0);
                } else if (mKey === 'reserveLiabilities') {
                    chartData.push(dbRes.reserveLiabilities || 0);
                } else if (mKey === 'reserveBefore') {
                    chartData.push(dbRes.reserveBefore || 0);
                } else if (mKey === 'currentRatioNum') {
                    chartData.push(dbRes.currentRatioNum || 0);
                } else if (mKey === 'ratioDenom') {
                    chartData.push(dbRes.ratioDenom || 0);
                } else if (mKey === 'a1111040_3') {
                    chartData.push(dbRes.a1111040_3 || 0);
                } else if (mKey === 'a219') {
                    chartData.push(dbRes.a219 || 0);
                } else if (mKey === 'a2122023') {
                    chartData.push(dbRes.a2122023 || 0);
                } else if (mKey === 'a2111080') {
                    chartData.push(dbRes.a2111080 || 0);
                } else if (mKey === 'a2111090') {
                    chartData.push(dbRes.a2111090 || 0);
                } else if (mKey === 'a11211S') {
                    chartData.push(dbRes.a11211S || 0);
                } else if (mKey === 'a1122S') {
                    chartData.push(dbRes.a1122S || 0);
                } else if (mKey === 'a1141010') {
                    chartData.push(dbRes.a1141010 || 0);
                }
            });

            const isAccumulated = ['revenue', 'expenses', 'netProfit', 'apDrugSuppliesPurchases', 'revenue_no_invest', 'expense_no_depr'].includes(mKey);
            if (window.dashUseMonthlyValue && isAccumulated) {
                chartData = window.convertYTDToMonthly(chartData, filteredMonths);
            }
 
            // Styling details
            let labelName = "";
            let color = "#0284C7";
            let fillBg = "transparent";
 
            const stylingMap = {
                revenue: { name: "รายได้สะสม", color: "#10B981" },
                expenses: { name: "รายจ่ายสะสม", color: "#EF4444" },
                netProfit: { name: "กำไรสุทธิสะสม", color: "#3B82F6", fill: "rgba(59, 130, 246, 0.1)" },
                cash: { name: "เงินสดสะสม", color: "#6366F1" },
                currentRatio: { name: "Current Ratio", color: "#2563EB" },
                quickRatio: { name: "Quick Ratio", color: "#7C3AED" },
                cashRatio: { name: "Cash Ratio", color: "#D97706" },
                nwc: { name: "ทุนหมุนเวียนสุทธิ", color: "#0D9488", fill: "rgba(13, 148, 136, 0.1)" },
                netReserve: { name: "เงินบำรุงคงเหลือสุทธิ", color: "#059669", fill: "rgba(5, 150, 105, 0.1)" },
                ebitda: { name: "EBITDA", color: "#8B5CF6", fill: "rgba(139, 92, 246, 0.1)" },
                operatingMargin: { name: "Operating Margin", color: "#0D9488", fill: "rgba(13, 148, 136, 0.1)" },
                returnOnAsset: { name: "Return on Asset (ROA)", color: "#EC4899", fill: "rgba(236, 72, 153, 0.1)" },
                apDrugSuppliesDays: { name: "ระยะเวลาจ่ายหนี้ AP", color: "#F59E0B" },
                apDrugSuppliesPeriodDays: { name: "ช่วงเวลาสะสม", color: "#8B5CF6" },
                apDrugSuppliesPurchases: { name: "ผลรวมเจ้าหนี้การค้า", color: "#10B981" },
                apDrugSuppliesAvg: { name: "เจ้าหนี้การค้าเฉลี่ย", color: "#EC4899" },
                arUCDays: { name: "ระยะเวลาเก็บหนี้ UC", color: "#3B82F6" },
                arUCPeriodDays: { name: "ช่วงเวลาสะสม (UC)", color: "#8B5CF6" },
                arUCRev: { name: "รายได้สิทธิ UC", color: "#10B981" },
                arUCAvgAR: { name: "ลูกหนี้เฉลี่ย UC", color: "#EC4899" },
                arCGDDays: { name: "ระยะเวลาเก็บหนี้ เบิกจ่ายตรง", color: "#06B6D4" },
                arCGDPeriodDays: { name: "ช่วงเวลาสะสม (เบิกจ่ายตรง)", color: "#8B5CF6" },
                arCGDRev: { name: "รายได้สิทธิ เบิกจ่ายตรง", color: "#10B981" },
                arCGDAvgAR: { name: "ลูกหนี้เฉลี่ย เบิกจ่ายตรง", color: "#EC4899" },
                arSSSDays: { name: "ระยะเวลาเก็บหนี้ ประกันสังคม", color: "#6366F1" },
                arSSSPeriodDays: { name: "ช่วงเวลาสะสม (ประกันสังคม)", color: "#8B5CF6" },
                arSSSRev: { name: "รายได้สิทธิ ประกันสังคม", color: "#10B981" },
                arSSSAvgAR: { name: "ลูกหนี้เฉลี่ย ประกันสังคม", color: "#EC4899" },
                invDays: { name: "ระยะเวลาขายคลัง", color: "#E11D48" },
                invPeriodDays: { name: "ช่วงเวลาสะสม (สินค้าคงคลัง)", color: "#8B5CF6" },
                invCostOfSales: { name: "ต้นทุนยาและเวชภัณฑ์ที่มิใช่ยา", color: "#10B981" },
                invAvg: { name: "ยาและเวชภัณฑ์คงคลังเฉลี่ย", color: "#EC4899" },
                revenue_no_invest: { name: "รายได้รวม (ไม่รวมงบลงทุน)", color: "#10B981", fill: "rgba(16, 185, 129, 0.1)" },
                expense_no_depr: { name: "ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อม)", color: "#EF4444", fill: "rgba(239, 68, 68, 0.1)" },
                currentAssets: { name: "รวม สินทรัพย์หมุนเวียน", color: "#0284C7", fill: "rgba(2, 132, 199, 0.1)" },
                quickAssets: { name: "สินทรัพย์หมุนเวียนเร็ว", color: "#7C3AED", fill: "rgba(124, 58, 237, 0.1)" },
                cashEquivalents: { name: "รวมเงินสดและรายการเทียบเท่าเงินสดไม่รวมเงินบริจาค", color: "#6366F1", fill: "rgba(99, 102, 241, 0.1)" },
                currentLiabilities: { name: "หนี้สินหมุนเวียนปรับปรุง", color: "#F59E0B", fill: "rgba(245, 158, 11, 0.1)" },
                a49: { name: "รวมรายได้", color: "#06B6D4", fill: "rgba(6, 182, 212, 0.1)" },
                totalAssets: { name: "รวมสินทรัพย์", color: "#F59E0B", fill: "rgba(245, 158, 11, 0.1)" },
                niDepr: { name: "รายได้สูง(ต่ำ)กว่าค่าใช้จ่ายสุทธิ NI (A91D)", color: "#6D28D9", fill: "rgba(109, 40, 217, 0.1)" },
                a911s: { name: "รวมรายได้ทั้งหมด (A911S)", color: "#10B981", fill: "rgba(16, 185, 129, 0.1)" },
                a912s: { name: "รวมค่าใช้จ่ายทั้งหมด (A912S)", color: "#EF4444", fill: "rgba(239, 68, 68, 0.1)" },
                reserveLiabilities: { name: "ภาระหนี้สิน(เงินบำรุง)", color: "#F59E0B" },
                reserveBefore: { name: "เงินบำรุงคงเหลือ ก่อนหัก", color: "#10B981" },
                currentRatioNum: { name: "สินทรัพย์หมุนเวียน (ปรับปรุง)", color: "#0284C7", fill: "rgba(2, 132, 199, 0.1)" },
                ratioDenom: { name: "หนี้สินหมุนเวียน (ปรับปรุง)", color: "#F59E0B", fill: "rgba(245, 158, 11, 0.1)" },
                a1111040_3: { name: "เงินฝากคลัง/เงินฝากวัตถุประสงค์ (เงินบริจาค)", color: "#D97706" },
                a219: { name: "รวม หนี้สินหมุนเวียน", color: "#EF4444" },
                a2122023: { name: "เงินรับฝากองทุน UC-งบลงทุน", color: "#6366F1" },
                a2111080: { name: "เจ้าหนี้- งบลงทุน UC", color: "#7C3AED" },
                a2111090: { name: "เจ้าหนี้- เงินบริจาค", color: "#EC4899" },
                a11211S: { name: "รวมลูกหนี้ค่ารักษาพยาบาล", color: "#2563EB" },
                a1122S: { name: "รวมลูกหนี้อื่น", color: "#0D9488" },
                a1141010: { name: "รายได้ค้างรับ", color: "#06B6D4" }
            };

            const style = stylingMap[mKey] || { name: mKey, color: "#0284C7" };
            labelName = style.name;
            color = style.color;
            fillBg = style.fill || "transparent";
            const useY1 = hasMixedAxes && !isCurrencyForMetric(mKey);

            datasets.push({
                type: 'line',
                label: labelName,
                data: chartData,
                borderColor: color,
                backgroundColor: fillBg === "transparent" ? color : fillBg,
                borderWidth: 3,
                borderRadius: 6,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointBorderWidth: 2,
                pointRadius: 4.5,
                tension: 0.3,
                spanGaps: false,
                metricKey: mKey,
                yAxisID: useY1 ? 'y1' : 'y'
            });
            // Add Target Line for Ratios if present for this specific metric
            if (targetData.length > 0) {
                let targetLabel = "เกณฑ์เป้าหมาย";
                if (mKey === 'currentRatio') targetLabel = "เป้าหมาย (1.5)";
                else if (mKey === 'quickRatio') targetLabel = "เป้าหมาย (1.0)";
                else if (mKey === 'cashRatio') targetLabel = "เป้าหมาย (0.8)";
                else if (mKey === 'apDrugSuppliesDays') targetLabel = "เป้าหมาย (90 วัน)";
                else if (mKey === 'arUCDays' || mKey === 'arCGDDays' || mKey === 'arSSSDays' || mKey === 'invDays') targetLabel = "เป้าหมาย (60 วัน)";
                else if (mKey === 'niDepr') targetLabel = "เป้าหมาย (≥ 0 บาท)";

                datasets.push({
                    type: 'line',
                    label: `${stylingMap[mKey]?.name || labelName} - ${targetLabel}`,
                    data: targetData,
                    borderColor: '#EF4444',
                    borderDash: [6, 6],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    datalabels: { display: false },
                    yAxisID: useY1 ? 'y1' : 'y'
                });
            }
        });
    }

    const titleEl = document.getElementById('dashFinancialChartTitle');
    if (titleEl) titleEl.textContent = titleText;

    dashFinancialChartInstance = new Chart(ctx, {
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            animation: {
                duration: 900,
                easing: 'easeOutQuart',
                x: {
                    type: 'number',
                    duration: 0
                },
                y: {
                    type: 'number',
                    duration: 900,
                    from: (ctx) => {
                        if (ctx.chart.scales.y) {
                            return ctx.chart.scales.y.getPixelForValue(0);
                        }
                        if (ctx.chart.chartArea) {
                            return ctx.chart.chartArea.bottom;
                        }
                        return 300;
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false, 
                    position: 'top',
                    onHover: function(event, legendItem, legend) {
                        legend.chart.data.datasets.forEach((ds) => {
                            if (ds.label === legendItem.text) {
                                ds.isHovered = true;
                            } else {
                                ds.isHovered = false;
                            }
                        });
                    },
                    onLeave: function(event, legendItem, legend) {
                        legend.chart.data.datasets.forEach((ds) => {
                            ds.isHovered = false;
                        });
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let val = context.parsed.y;
                            let mKey = context.dataset.metricKey || metric;
                            if (isCurrencyForMetric(mKey)) {
                                return ` ${context.dataset.label}: ${formatAbbreviated(val)} บาท`;
                            } else {
                                if (mKey === 'operatingMargin' || mKey === 'returnOnAsset') {
                                    return ` ${context.dataset.label}: ${(val * 100).toFixed(2)} %`;
                                }
                                if (['apDrugSuppliesDays', 'apDrugSuppliesPeriodDays', 'arUCDays', 'arCGDDays', 'arSSSDays', 'invDays', 'arUCPeriodDays', 'arCGDPeriodDays', 'arSSSPeriodDays', 'invPeriodDays'].includes(mKey)) {
                                    return ` ${context.dataset.label}: ${Math.round(val)} วัน`;
                                }
                                return ` ${context.dataset.label}: ${val.toFixed(2)}`;
                            }
                        }
                    }
                },
                datalabels: {
                    display: (context) => {
                        const show = window.shouldShowLabels ? window.shouldShowLabels('dashFinancialChart') : true;
                        return show && (metricsToDraw.length <= 3);
                    },
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 4,
                    color: '#0F172A',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 10 },
                    formatter: (value, context) => {
                        let mKey = context.dataset.metricKey || metric;
                        if (isCurrencyForMetric(mKey)) return formatAbbreviated(value);
                        if (mKey === 'operatingMargin' || mKey === 'returnOnAsset') return (value * 100).toFixed(2) + ' %';
                        if (['apDrugSuppliesDays', 'apDrugSuppliesPeriodDays', 'arUCDays', 'arCGDDays', 'arSSSDays', 'invDays', 'arUCPeriodDays', 'arCGDPeriodDays', 'arSSSPeriodDays', 'invPeriodDays'].includes(mKey)) return Math.round(value) + ' วัน';
                        return value.toFixed(2);
                    }
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: false },
                        pinch: { enabled: false }
                    },
                    pan: { enabled: false }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: hasMixedAxes ? "จำนวนเงิน (บาท)" : yAxisTitle },
                    ticks: {
                        callback: (value) => {
                            if (hasMixedAxes || isCurrency) return formatAbbreviated(value);
                            if (metric === 'operatingMargin' || metric === 'returnOnAsset') return (value * 100).toFixed(0) + ' %';
                            if (['apDrugSuppliesDays', 'apDrugSuppliesPeriodDays', 'arUCDays', 'arCGDDays', 'arSSSDays', 'invDays'].includes(metric)) return Math.round(value) + ' วัน';
                            return value.toFixed(2);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    display: hasMixedAxes,
                    title: { display: true, text: "อัตราส่วน (%) / จำนวนวัน" },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: (value) => {
                            const nonCurrMetric = metricsToDraw.find(mk => !isCurrencyForMetric(mk));
                            if (!nonCurrMetric) return value;
                            if (nonCurrMetric === 'operatingMargin' || nonCurrMetric === 'returnOnAsset') {
                                return (value * 100).toFixed(0) + ' %';
                            }
                            if (['apDrugSuppliesDays', 'apDrugSuppliesPeriodDays', 'arUCDays', 'arCGDDays', 'arSSSDays', 'invDays'].includes(nonCurrMetric)) {
                                return Math.round(value) + ' วัน';
                            }
                            return value.toFixed(1);
                        }
                    }
                },
                x: {
                    title: { display: true, text: 'เดือน' }
                }
            }
        }
    });
    window.dashFinancialChartInstance = dashFinancialChartInstance;
}

// Renderer: Dynamic Cash Conversion Cycle Trend
function renderCCCChart() {
    const canvas = document.getElementById('dashCCCChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (dashCCCChartInstance) {
        try {
            dashCCCChartInstance.destroy();
        } catch (e) {
            console.error("Error destroying dashCCCChartInstance:", e);
        }
        dashCCCChartInstance = null;
    }

    if (monthlyResults.length === 0) return;

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    let labels = [];
    let cccData = [];
    let invData = [];
    let arData = [];
    let apData = [];

    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    filteredMonths.forEach(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        labels.push(`${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`);

        // Fetch drivers
        const invDays = month.invResult?.total?.all?.collection_days;
        const arDays = month.result?.uc?.total?.collection_days;
        const apDays = month.apResult?.drug_supplies?.total?.collection_days;

        if (invDays !== null && arDays !== null && apDays !== null &&
            invDays !== undefined && arDays !== undefined && apDays !== undefined) {

            const ccc = invDays + arDays - apDays;

            invData.push(Math.abs(Math.round(invDays)));
            arData.push(Math.abs(Math.round(arDays)));
            apData.push(Math.abs(Math.round(apDays)));
            cccData.push(Math.abs(Math.round(ccc)));
        } else {
            invData.push(null);
            arData.push(null);
            apData.push(null);
            cccData.push(null);
        }
    });

    const latestMonth = filteredMonths[filteredMonths.length - 1];
    const latestInv = latestMonth.invResult?.total?.all?.collection_days;
    const latestAr = latestMonth.result?.uc?.total?.collection_days;
    const latestAp = latestMonth.apResult?.drug_supplies?.total?.collection_days;

    document.getElementById('dashINVDays').textContent = latestInv !== null && latestInv !== undefined ? `${Math.round(latestInv)}` : 'N/A';
    document.getElementById('dashARDays').textContent = latestAr !== null && latestAr !== undefined ? `${Math.round(latestAr)}` : 'N/A';
    document.getElementById('dashAPDays').textContent = latestAp !== null && latestAp !== undefined ? `${Math.round(latestAp)}` : 'N/A';

    if (latestInv !== null && latestAr !== null && latestAp !== null && latestInv !== undefined && latestAr !== undefined && latestAp !== undefined) {
        document.getElementById('dashCCCValue').textContent = `${Math.round(latestInv + latestAr - latestAp)} วัน`;
    } else {
        document.getElementById('dashCCCValue').textContent = 'N/A';
    }

    dashCCCChartInstance = new Chart(ctx, {
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'วงจรเงินสดสะสม (CCC)',
                    data: cccData,
                    borderColor: '#0284C7',
                    backgroundColor: 'transparent',
                    borderWidth: 4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#0284C7',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'ระยะเวลาขายคลัง (INV)',
                    data: invData,
                    borderColor: '#F59E0B',
                    borderWidth: 2,
                    pointRadius: 4,
                    borderDash: [4, 4],
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'ระยะเวลาเก็บเงิน (AR)',
                    data: arData,
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    pointRadius: 4,
                    borderDash: [4, 4],
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'ระยะเวลาจ่ายหนี้ (AP)',
                    data: apData,
                    borderColor: '#8B5CF6',
                    borderWidth: 2,
                    pointRadius: 4,
                    borderDash: [4, 4],
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${context.parsed.y} วัน`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('dashCCCChart') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 4,
                    color: '#0F172A',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif" }
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: false },
                        pinch: { enabled: false }
                    },
                    pan: { enabled: false }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'จำนวนวัน' }
                },
                x: {
                    title: { display: true, text: 'เดือน' }
                }
            }
        }
    });
}

// Renderer: Legacy Trend Line Chart for WC sub-tabs
function renderLineChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartInstance) {
        try {
            chartInstance.destroy();
        } catch (e) {
            console.error("Error destroying chartInstance:", e);
        }
        chartInstance = null;
    }

    if (monthlyResults.length === 0) return;

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    let labels = [];
    let dataDays = [];
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    const chartMetricSelect = document.getElementById('chartMetricSelect');
    const selectedMetric = chartMetricSelect ? chartMetricSelect.value : 'collection_days';

    const metricConfig = {
        'collection_days': { label: 'ระยะเวลา (วัน)', unit: 'วัน', isFloat: false, yAxis: 'จำนวนวัน' },
        'turnover_ratio': { label: 'อัตราหมุนเวียน (รอบ)', unit: 'รอบ', isFloat: true, yAxis: 'จำนวนรอบ' },
        'rev_uc': { label: 'รายได้/รายจ่าย/ต้นทุน/ค่าบุคลากร', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'avg_ar': { label: 'ยอดเฉลี่ย', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'ar_uc_start': { label: 'ยоดยกมา (ต้นงวด)', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'ar_uc_end': { label: 'ยоดยกไป (ปลายงวด)', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_1m': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 1 เดือน' : 'ยอด Deadstock 1 เดือน', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_3m': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 3 เดือน' : 'ยอด Deadstock 3 เดือน', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_6m': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 6 เดือน' : 'ยอด Deadstock 6 เดือน', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_1y': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 1 ปี' : 'ยอด Deadstock 1 ปี', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_2y': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 2 ปี' : 'ยอด Deadstock 2 ปี', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' },
        'overdue_3y': { label: currentTab === 'overdue_ar' ? 'ลูกหนี้ค้างนาน 3 ปี' : 'ยอด Deadstock 3 ปี', unit: 'บาท', isCurrency: true, yAxis: 'จำนวนเงิน (บาท)' }
    };

    const config = metricConfig[selectedMetric] || metricConfig['collection_days'];

    filteredMonths.forEach(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        let labelName = `${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`;

        labels.push(labelName);

        let val = null;
        if (currentTab === 'ar' && month.result[currentFund] && month.result[currentFund][currentSubgroup]) {
            val = month.result[currentFund][currentSubgroup][selectedMetric];
        } else if (currentTab === 'overdue_ar' && month.overdueARResult?.[currentFund]?.[currentSubgroup]) {
            val = month.overdueARResult[currentFund][currentSubgroup][selectedMetric];
        } else if (currentTab === 'ap' && month.apResult[currentFundAP] && month.apResult[currentFundAP][currentSubgroupAP]) {
            val = month.apResult[currentFundAP][currentSubgroupAP][selectedMetric];
        } else if (currentTab === 'pr' && month.prResult[currentFundPR] && month.prResult[currentFundPR][currentSubgroupPR]) {
            val = month.prResult[currentFundPR][currentSubgroupPR][selectedMetric];
        } else if (currentTab === 'inv' && month.invResult[currentFundINV] && month.invResult[currentFundINV][currentSubgroupINV]) {
            val = month.invResult[currentFundINV][currentSubgroupINV][selectedMetric];
        } else if (currentTab === 'deadstock' && month.deadstockResult?.[currentFundINV]?.[currentSubgroupINV]) {
            val = month.deadstockResult[currentFundINV][currentSubgroupINV][selectedMetric];
        }

        let pointValue = null;
        if (val !== null && val !== undefined) {
            let absVal = Math.abs(val);
            if (config.isFloat || config.isCurrency) {
                pointValue = Number(Number(absVal).toFixed(2));
            } else {
                pointValue = Math.round(absVal);
            }
        }

        dataDays.push(pointValue);
    });

    try {
        if (typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }
    } catch (e) {
        // Already registered
    }

    const toggleCheckbox = document.getElementById('toggleDataLabels');
    let showLabels = toggleCheckbox ? toggleCheckbox.checked : true;

    const activeColor = (currentTab === 'overdue_ar' || currentTab === 'deadstock') ? '#EF4444' : '#0284c7';

    chartInstance = new Chart(ctx, {
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: config.label,
                data: dataDays,
                borderColor: activeColor,
                backgroundColor: 'transparent',
                borderWidth: 3.5,
                pointBackgroundColor: activeColor,
                pointBorderColor: activeColor,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: false,
                tension: 0.3,
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let valStr = context.parsed.y;
                            if (config.isCurrency || config.isFloat) {
                                valStr = Number(valStr).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            } else {
                                valStr = Number(valStr).toLocaleString('th-TH');
                            }
                            return ` ${config.label}: ${valStr} ${config.unit}`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('trendChart') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 4,
                    color: (currentTab === 'overdue_ar' || currentTab === 'deadstock') ? '#B91C1C' : '#0369a1',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif" },
                    formatter: function (value) {
                        if (value === null || value === undefined) return '';
                        return formatAbbreviated(value);
                    }
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: false },
                        pinch: { enabled: false }
                    },
                    pan: { enabled: false }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: config.yAxis },
                    ticks: {
                        callback: function (value) {
                            if (config.isCurrency || config.isFloat) {
                                return formatAbbreviated(value);
                            }
                            return value;
                        }
                    }
                },
                x: {
                    title: { display: true, text: 'เดือน' }
                }
            }
        }
    });
}
