// ==========================================================
// ส่วนจัดการการปันส่วนต้นทุนค่ารักษาพยาบาล (Treatment Cost Allocation)
// ==========================================================

let treatmentCostTrendChartInstance = null;
let treatmentCostDashOffset = 0;
let treatmentCostAnimationId = null;
let activeHoveredDatasetInfo = null;

// Initialize modes
window.treatmentCostModes = window.treatmentCostModes || {
    opd: 'monthly',
    ipd: 'monthly',
    breakdown: 'monthly'
};

window.setTreatmentCostMode = function(chartType, mode) {
    window.treatmentCostModes = window.treatmentCostModes || {
        opd: 'monthly',
        ipd: 'monthly',
        breakdown: 'monthly'
    };
    window.treatmentCostModes[chartType] = mode;
    
    // Update button styles
    const cumBtn = document.getElementById(`btn-${chartType}-cumulative`);
    const monBtn = document.getElementById(`btn-${chartType}-monthly`);
    if (cumBtn && monBtn) {
        if (mode === 'cumulative') {
            cumBtn.className = "px-2.5 py-1 rounded-lg transition-all duration-200 bg-white text-slate-800 shadow-sm";
            monBtn.className = "px-2.5 py-1 rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-800";
        } else {
            cumBtn.className = "px-2.5 py-1 rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-800";
            monBtn.className = "px-2.5 py-1 rounded-lg transition-all duration-200 bg-white text-slate-800 shadow-sm";
        }
    }
    
    renderTreatmentCost();
};

// Helper to check if a month is October (start of fiscal year/non-cumulative)
function isOctoberMonth(monthObj) {
    if (!monthObj || !monthObj.dateObj) return false;
    const d = new Date(monthObj.dateObj);
    return d.getMonth() === 9; // October is index 9
}

// Helper to check if the start of the fiscal year (October) is loaded in monthlyResults for this month
function hasFiscalYearStart(monthObj) {
    if (typeof monthlyResults === 'undefined' || monthlyResults.length === 0) return false;
    const fullIdx = monthlyResults.findIndex(m => m.filename === monthObj.filename);
    if (fullIdx === -1) return false;
    
    let startIdx = fullIdx;
    while (startIdx >= 0) {
        if (isOctoberMonth(monthlyResults[startIdx])) {
            return true;
        }
        startIdx--;
    }
    return false;
}

// Helper to sum hospital values from October to the current month in monthlyResults
function getCumulativeHospitalValue(monthObj, metricName) {
    if (typeof monthlyResults === 'undefined' || monthlyResults.length === 0) {
        return null;
    }
    const fullIdx = monthlyResults.findIndex(m => m.filename === monthObj.filename);
    if (fullIdx === -1) {
        return null;
    }
    
    let sum = 0;
    let startIdx = fullIdx;
    let foundOctober = false;
    while (startIdx >= 0) {
        const m = monthlyResults[startIdx];
        const val = getHospitalValue(metricName, m.dateObj) || 0;
        sum += val;
        if (isOctoberMonth(m)) {
            foundOctober = true;
            break;
        }
        startIdx--;
    }
    return foundOctober ? sum : null;
}

// Helper to get value (cumulative or monthly) for monetary/cost fields (cumulative in source)
function getTreatmentMetricValue(filteredMonths, index, mode, getValueFn) {
    const currentMonth = filteredMonths[index];
    if (mode === 'cumulative') {
        return getValueFn(currentMonth);
    }
    
    // Monthly mode (non-cumulative)
    if (isOctoberMonth(currentMonth)) {
        return getValueFn(currentMonth);
    }
    
    if (index === 0) {
        // First month of the graph, not October -> hide it
        return null;
    }
    
    const prevMonth = filteredMonths[index - 1];
    const currentVal = getValueFn(currentMonth);
    const prevVal = getValueFn(prevMonth);
    
    if (currentVal === null || currentVal === undefined || prevVal === null || prevVal === undefined) {
        return null;
    }
    return currentVal - prevVal;
}

// Helper to get quantity values (already monthly in source)
function getTreatmentQuantityValue(filteredMonths, index, mode, metricName) {
    const currentMonth = filteredMonths[index];
    if (mode === 'cumulative') {
        return getCumulativeHospitalValue(currentMonth, metricName);
    }
    
    // Monthly mode (non-cumulative) - already monthly, no subtraction
    if (isOctoberMonth(currentMonth)) {
        return getHospitalValue(metricName, currentMonth.dateObj) || 0;
    }
    
    if (index === 0) {
        // First month of the graph, not October -> hide it to align with cost
        return null;
    }
    
    return getHospitalValue(metricName, currentMonth.dateObj) || 0;
}

function animateTreatmentCostDashes() {
    if (!activeHoveredDatasetInfo) {
        treatmentCostAnimationId = null;
        return;
    }
    treatmentCostDashOffset -= 0.4;
    if (treatmentCostDashOffset < -20) treatmentCostDashOffset = 0;

    const { chartInstance, datasetIndex } = activeHoveredDatasetInfo;
    if (chartInstance && chartInstance.data && chartInstance.data.datasets[datasetIndex]) {
        chartInstance.data.datasets[datasetIndex].borderDashOffset = treatmentCostDashOffset;
        chartInstance.update('none');
    }
    treatmentCostAnimationId = requestAnimationFrame(animateTreatmentCostDashes);
}

function renderCustomLegend(chartInstance, legendContainerId) {
    const container = document.getElementById(legendContainerId);
    if (!container) return;
    container.innerHTML = '';

    chartInstance.data.datasets.forEach((dataset, index) => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer";

        const isVisible = chartInstance.isDatasetVisible(index);
        if (isVisible) {
            btn.style.backgroundColor = dataset.borderColor;
            btn.style.borderColor = dataset.borderColor;
            btn.style.color = '#ffffff';
        } else {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }

        const dot = document.createElement('span');
        dot.className = "w-2 h-2 rounded-full";
        dot.style.backgroundColor = isVisible ? '#ffffff' : dataset.borderColor;
        btn.appendChild(dot);

        const text = document.createElement('span');
        text.textContent = dataset.label;
        btn.appendChild(text);

        btn.addEventListener('click', () => {
            const meta = chartInstance.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !chartInstance.data.datasets[index].hidden : null;
            chartInstance.update();
            renderCustomLegend(chartInstance, legendContainerId);
        });

        btn.addEventListener('mouseenter', () => {
            dataset.borderDash = [6, 4];
            activeHoveredDatasetInfo = { chartInstance, datasetIndex: index };
            if (!treatmentCostAnimationId) {
                treatmentCostDashOffset = 0;
                animateTreatmentCostDashes();
            }
        });

        btn.addEventListener('mouseleave', () => {
            dataset.borderDash = undefined;
            dataset.borderDashOffset = 0;
            chartInstance.update('none');
            activeHoveredDatasetInfo = null;
        });

        container.appendChild(btn);
    });
}

function renderTreatmentCost() {
    if (!monthlyResults || monthlyResults.length === 0) return;

    const emptyState = document.getElementById('treatmentCostEmptyState');
    const contentPanel = document.getElementById('treatmentCostContent');

    if (!window.hospitalData) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (contentPanel) contentPanel.classList.add('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (contentPanel) contentPanel.classList.remove('hidden');
    }

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;
    if (filteredMonths.length === 0) {
        if (opdCostPerVisitChartInstance) { opdCostPerVisitChartInstance.destroy(); opdCostPerVisitChartInstance = null; }
        if (ipdCostPerAdjRWChartInstance) { ipdCostPerAdjRWChartInstance.destroy(); ipdCostPerAdjRWChartInstance = null; }
        if (costRevenueBreakdownChartInstance) { costRevenueBreakdownChartInstance.destroy(); costRevenueBreakdownChartInstance = null; }
        return;
    }

    const labels = filteredMonths.map(m => m.monthStr || m.filename.replace('.xlsx', '').replace('.xls', ''));

    // Get current modes
    const opdMode = (window.treatmentCostModes && window.treatmentCostModes.opd) || 'cumulative';
    const ipdMode = (window.treatmentCostModes && window.treatmentCostModes.ipd) || 'cumulative';
    const breakdownMode = (window.treatmentCostModes && window.treatmentCostModes.breakdown) || 'cumulative';

    // 1. Render OPD Cost per Visit Chart
    const opdVisitCanvas = document.getElementById('opdCostPerVisitChartCanvas');
    if (opdVisitCanvas) {
        // Save current visibility state
        const visibleStates = [];
        if (opdCostPerVisitChartInstance) {
            for (let i = 0; i < opdCostPerVisitChartInstance.data.datasets.length; i++) {
                visibleStates.push(opdCostPerVisitChartInstance.isDatasetVisible(i));
            }
            opdCostPerVisitChartInstance.destroy();
        }
        
        const opdVisitData = filteredMonths.map((m, idx) => {
            if (opdMode === 'cumulative') {
                const metrics = calculateTreatmentCostMetricsForMonth(m);
                const visitOPD = getCumulativeHospitalValue(m, 'VisitOPD');
                return (visitOPD !== null && visitOPD > 0) ? (metrics.opdCost / visitOPD) : null;
            } else {
                if (isOctoberMonth(m)) {
                    const metrics = calculateTreatmentCostMetricsForMonth(m);
                    const visitOPD = getHospitalValue('VisitOPD', m.dateObj) || 0;
                    return visitOPD > 0 ? (metrics.opdCost / visitOPD) : 0;
                }
                if (idx === 0) return null;
                
                const currentMetrics = calculateTreatmentCostMetricsForMonth(m);
                const currentVisits = getHospitalValue('VisitOPD', m.dateObj) || 0;
                
                const prevMonth = filteredMonths[idx - 1];
                const prevMetrics = calculateTreatmentCostMetricsForMonth(prevMonth);
                
                const monthlyCost = currentMetrics.opdCost - prevMetrics.opdCost;
                const monthlyVisits = currentVisits; // Already monthly, no subtraction needed!
                
                return monthlyVisits > 0 ? (monthlyCost / monthlyVisits) : 0;
            }
        });

        const opdCosts = filteredMonths.map((m, idx) => {
            if (opdMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, opdMode, month => calculateTreatmentCostMetricsForMonth(month).opdCost);
        });
        
        const opdVisits = filteredMonths.map((m, idx) => {
            if (opdMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentQuantityValue(filteredMonths, idx, opdMode, 'VisitOPD');
        });

        opdCostPerVisitChartInstance = new Chart(opdVisitCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ต้นทุนบริการผู้ป่วยนอกต่อครั้ง (บาท/ครั้ง)',
                        data: opdVisitData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#4f46e5',
                        pointBorderColor: '#4f46e5',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        yAxisID: 'y',
                        hidden: visibleStates.length > 0 ? !visibleStates[0] : false
                    },
                    {
                        label: 'ต้นทุน OPD (บาท)',
                        data: opdCosts,
                        borderColor: '#818cf8',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#818cf8',
                        pointBorderColor: '#818cf8',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_opd_cost',
                        hidden: visibleStates.length > 1 ? !visibleStates[1] : true
                    },
                    {
                        label: 'VisitOPD (ครั้ง)',
                        data: opdVisits,
                        borderColor: '#34d399',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#34d399',
                        pointBorderColor: '#34d399',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_visit_opd',
                        hidden: visibleStates.length > 2 ? !visibleStates[2] : true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                if (val === null || val === undefined) return '';
                                if (context.dataset.label.includes('ต่อครั้ง')) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/ครั้ง`;
                                } else if (context.dataset.label.includes('ต้นทุน') || context.dataset.label.includes('รายได้')) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                } else {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} ครั้ง`;
                                }
                            }
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('opdCostPerVisitChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: { font: { family: "'Sarabun', sans-serif", size: 10 } },
                        title: { display: true, text: 'บาท / ครั้ง', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    y_opd_cost: {
                        type: 'linear',
                        display: false
                    },
                    y_visit_opd: {
                        type: 'linear',
                        display: false
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(opdCostPerVisitChartInstance, 'opdCostPerVisitLegend');
    }

    // 2. Render IPD Cost per AdjRW Chart
    const ipdAdjRWCanvas = document.getElementById('ipdCostPerAdjRWChartCanvas');
    if (ipdAdjRWCanvas) {
        // Save current visibility state
        const visibleStates = [];
        if (ipdCostPerAdjRWChartInstance) {
            for (let i = 0; i < ipdCostPerAdjRWChartInstance.data.datasets.length; i++) {
                visibleStates.push(ipdCostPerAdjRWChartInstance.isDatasetVisible(i));
            }
            ipdCostPerAdjRWChartInstance.destroy();
        }
        
        const ipdAdjRWData = filteredMonths.map((m, idx) => {
            if (ipdMode === 'cumulative') {
                const metrics = calculateTreatmentCostMetricsForMonth(m);
                const adjRW = getCumulativeHospitalValue(m, 'AdjRW');
                return (adjRW !== null && adjRW > 0) ? (metrics.ipdCost / adjRW) : null;
            } else {
                if (isOctoberMonth(m)) {
                    const metrics = calculateTreatmentCostMetricsForMonth(m);
                    const adjRW = getHospitalValue('AdjRW', m.dateObj) || 0;
                    return adjRW > 0 ? (metrics.ipdCost / adjRW) : 0;
                }
                if (idx === 0) return null;
                
                const currentMetrics = calculateTreatmentCostMetricsForMonth(m);
                const currentAdjRW = getHospitalValue('AdjRW', m.dateObj) || 0; // Already monthly
                
                const prevMonth = filteredMonths[idx - 1];
                const prevMetrics = calculateTreatmentCostMetricsForMonth(prevMonth);
                
                const monthlyCost = currentMetrics.ipdCost - prevMetrics.ipdCost;
                const monthlyAdjRW = currentAdjRW; 
                
                return monthlyAdjRW > 0 ? (monthlyCost / monthlyAdjRW) : 0;
            }
        });

        const ipdCosts = filteredMonths.map((m, idx) => {
            if (ipdMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, ipdMode, month => calculateTreatmentCostMetricsForMonth(month).ipdCost);
        });

        const adjRWs = filteredMonths.map((m, idx) => {
            if (ipdMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentQuantityValue(filteredMonths, idx, ipdMode, 'AdjRW');
        });

        const patientDays = filteredMonths.map((m, idx) => {
            if (ipdMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentQuantityValue(filteredMonths, idx, ipdMode, 'วันนอน');
        });

        ipdCostPerAdjRWChartInstance = new Chart(ipdAdjRWCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ต้นทุนบริการผู้ป่วยในต่อ AdjRW (บาท/AdjRW)',
                        data: ipdAdjRWData,
                        borderColor: '#e11d48',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#e11d48',
                        pointBorderColor: '#e11d48',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        yAxisID: 'y',
                        hidden: visibleStates.length > 0 ? !visibleStates[0] : false
                    },
                    {
                        label: 'ต้นทุน IPD (บาท)',
                        data: ipdCosts,
                        borderColor: '#f43f5e',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#f43f5e',
                        pointBorderColor: '#f43f5e',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_ipd_cost',
                        hidden: visibleStates.length > 1 ? !visibleStates[1] : true
                    },
                    {
                        label: 'AdjRW',
                        data: adjRWs,
                        borderColor: '#f59e0b',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#f59e0b',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_adjrw',
                        hidden: visibleStates.length > 2 ? !visibleStates[2] : true
                    },
                    {
                        label: 'วันนอน (วัน)',
                        data: patientDays,
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#06b6d4',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        yAxisID: 'y_patientdays',
                        hidden: visibleStates.length > 3 ? !visibleStates[3] : true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                if (val === null || val === undefined) return '';
                                if (context.dataset.label.includes('ต่อ AdjRW')) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท/AdjRW`;
                                } else if (context.dataset.label.includes('ต้นทุน') || context.dataset.label.includes('รายได้')) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                } else if (context.dataset.label.includes('AdjRW')) {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AdjRW`;
                                } else {
                                    return ` ${context.dataset.label}: ${val.toLocaleString('th-TH')} ${context.dataset.label.includes('วันนอน') ? 'วัน' : 'ครั้ง'}`;
                                }
                            }
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('ipdCostPerAdjRWChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: { font: { family: "'Sarabun', sans-serif", size: 10 } },
                        title: { display: true, text: 'บาท / AdjRW', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    y_ipd_cost: {
                        type: 'linear',
                        display: false
                    },
                    y_adjrw: {
                        type: 'linear',
                        display: false
                    },
                    y_patientdays: {
                        type: 'linear',
                        display: false
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(ipdCostPerAdjRWChartInstance, 'ipdCostPerAdjRWLegend');
    }

    // 3. Render Cost and Revenue Breakdown Chart
    const breakdownCanvas = document.getElementById('costRevenueBreakdownChartCanvas');
    if (breakdownCanvas) {
        // Save current visibility state
        const visibleStates = [];
        if (costRevenueBreakdownChartInstance) {
            for (let i = 0; i < costRevenueBreakdownChartInstance.data.datasets.length; i++) {
                visibleStates.push(costRevenueBreakdownChartInstance.isDatasetVisible(i));
            }
            costRevenueBreakdownChartInstance.destroy();
        }

        const opdRevs = filteredMonths.map((m, idx) => {
            if (breakdownMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, breakdownMode, month => calculateTreatmentCostMetricsForMonth(month).opdRev);
        });
        const ipdRevs = filteredMonths.map((m, idx) => {
            if (breakdownMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, breakdownMode, month => calculateTreatmentCostMetricsForMonth(month).ipdRev);
        });
        const lcs = filteredMonths.map((m, idx) => {
            if (breakdownMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, breakdownMode, month => calculateTreatmentCostMetricsForMonth(month).lc);
        });
        const mcs = filteredMonths.map((m, idx) => {
            if (breakdownMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, breakdownMode, month => calculateTreatmentCostMetricsForMonth(month).mc);
        });
        const ccs = filteredMonths.map((m, idx) => {
            if (breakdownMode === 'cumulative' && !hasFiscalYearStart(m)) return null;
            return getTreatmentMetricValue(filteredMonths, idx, breakdownMode, month => calculateTreatmentCostMetricsForMonth(month).cc);
        });

        costRevenueBreakdownChartInstance = new Chart(breakdownCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'รายได้ OPD',
                        data: opdRevs,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        hidden: visibleStates.length > 0 ? !visibleStates[0] : false
                    },
                    {
                        label: 'รายได้ IPD',
                        data: ipdRevs,
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#06b6d4',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        hidden: visibleStates.length > 1 ? !visibleStates[1] : false
                    },
                    {
                        label: 'ต้นทุนค่าแรง (LC)',
                        data: lcs,
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ef4444',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: visibleStates.length > 2 ? !visibleStates[2] : true
                    },
                    {
                        label: 'ต้นทุนค่ายา/เวชภัณฑ์ (MC)',
                        data: mcs,
                        borderColor: '#f59e0b',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#f59e0b',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: visibleStates.length > 3 ? !visibleStates[3] : true
                    },
                    {
                        label: 'ต้นทุนค่าเสื่อม (CC)',
                        data: ccs,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#8b5cf6',
                        pointBorderWidth: 1.5,
                        pointRadius: 3.5,
                        tension: 0.3,
                        hidden: visibleStates.length > 4 ? !visibleStates[4] : true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElements) => {
                    event.chart.canvas.style.cursor = chartElements.length > 0 ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 10,
                        borderRadius: 8,
                        titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('th-TH')} บาท`
                        }
                    },
                    datalabels: {
                        display: (context) => {
                            const show = window.shouldShowLabels ? window.shouldShowLabels('costRevenueBreakdownChartCanvas') : true;
                            return show && context.chart.isDatasetVisible(context.datasetIndex);
                        },
                        align: 'top',
                        anchor: 'end',
                        font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 9 },
                        formatter: (value) => {
                            if (value === 0 || value === null || value === undefined) return '';
                            return formatAbbreviated(value);
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            font: { family: "'Sarabun', sans-serif", size: 10 },
                            callback: (value) => formatAbbreviated(value)
                        },
                        title: { display: true, text: 'จำนวนเงิน (บาท)', font: { family: "'Sarabun', sans-serif", weight: 'bold' } }
                    },
                    x: { ticks: { font: { family: "'Sarabun', sans-serif", weight: 'bold', size: 10 } } }
                }
            },
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
        });

        renderCustomLegend(costRevenueBreakdownChartInstance, 'costRevenueBreakdownLegend');
    }
}
