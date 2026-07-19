// ==========================================================
// ส่วนจัดการวิเคราะห์เปรียบเทียบข้อมูล (Data Analysis & Comparison) - Main Router
// ==========================================================

window.analysisCompareChartInstance = null;
window.distressTrendChartInstance = null;
window.opdCostPerVisitChartInstance = null;
window.ipdCostPerAdjRWChartInstance = null;
window.costRevenueBreakdownChartInstance = null;
let isAnalysisInitialized = false;
let lineDashOffsetValue = 0;
let animationFrameId = null;
let activeHighlightedMetric = null;
let activeMetricsList = []; // Track active metrics order for legend hover indexing
window.treatmentCostShowLabels = true;

// Animate dashed line offset to create a running/flowing line effect
function animateDash() {
    if (!analysisCompareChartInstance || !activeHighlightedMetric) {
        animationFrameId = null;
        return;
    }

    lineDashOffsetValue -= 0.35; // Adjust speed (slower) //กราฟเส้นปะวิ่ง
    if (lineDashOffsetValue < -20) lineDashOffsetValue = 0;

    const metricLabelMap = {
        'revenue': 'รายได้สะสม',
        'expenses': 'รายจ่ายสะสม',
        'netProfit': 'กำไรสุทธิสะสม',
        'ebitda': 'EBITDA',
        'cash': 'เงินสดสะสม',
        'nwc': 'ทุนหมุนเวียนสุทธิ (NWC)',
        'netReserve': 'เงินบำรุงคงเหลือสุทธิ',
        'currentRatio': 'Current Ratio',
        'quickRatio': 'Quick Ratio',
        'cashRatio': 'Cash Ratio',
        'operatingMargin': 'Operating Margin (%)',
        'returnOnAsset': 'Return on Asset (ROA %)',
        'apDrugSuppliesDays': 'ระยะเวลาจ่ายหนี้ AP (วัน)',
        'arUCDays': 'ระยะเวลาเก็บหนี้ AR UC (วัน)',
        'invDays': 'ระยะเวลาขายคลัง INV (วัน)'
    };

    const targetLabel = metricLabelMap[activeHighlightedMetric];
    if (targetLabel) {
        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            if (dataset.label === targetLabel) {
                dataset.borderDashOffset = lineDashOffsetValue;
            }
        });
        analysisCompareChartInstance.update('none');
    }

    animationFrameId = requestAnimationFrame(animateDash);
}

// Initialize Analysis Tab View and Events
function renderAnalysisTab() {
    renderAnalysisSubViews();
}

// Show/Hide analysis sub-views based on current subtab selection
function renderAnalysisSubViews() {
    if (monthlyResults.length === 0) return;

    if (!isAnalysisInitialized) {
        if (typeof setupAnalysisEvents === 'function') {
            setupAnalysisEvents();
        }
        isAnalysisInitialized = true;
    }

    const subViews = ['financialHealth', 'compareMetrics', 'financialDistress', 'waterfallPnl', 'treatmentCost', 'totalPerformanceScore'];
    subViews.forEach(v => {
        const el = document.getElementById(`subView_${v}`);
        if (el) {
            const camelTab = currentAnalysisSubTab.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (v === camelTab) {
                el.classList.remove('hidden');
                el.classList.add('block');
            } else {
                el.classList.add('hidden');
                el.classList.remove('block');
            }
        }
    });

    if (currentAnalysisSubTab === 'financial_health') {
        if (typeof renderFinancialHealthView === 'function') {
            renderFinancialHealthView();
        }
    } else if (currentAnalysisSubTab === 'compare_metrics') {
        if (typeof updateAnalysisCompareChart === 'function') {
            updateAnalysisCompareChart();
        }
    } else if (currentAnalysisSubTab === 'financial_distress') {
        if (typeof renderFinancialDistressDashboard === 'function') {
            renderFinancialDistressDashboard();
        }
    } else if (currentAnalysisSubTab === 'waterfall_pnl') {
        if (typeof renderWaterfallPnL === 'function') {
            renderWaterfallPnL();
        }
    } else if (currentAnalysisSubTab === 'treatment_cost') {
        if (typeof renderTreatmentCost === 'function') {
            renderTreatmentCost();
        }
    } else if (currentAnalysisSubTab === 'total_performance_score') {
        if (typeof renderTotalPerformanceScore === 'function') {
            renderTotalPerformanceScore();
        }
    }
}
