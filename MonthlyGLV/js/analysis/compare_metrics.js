// Setup checkbox and action button listeners
function setupAnalysisEvents() {
    const checkboxes = document.querySelectorAll('input[name="analysis_metric"]');

    const toggleLabelsCheckbox = document.getElementById('toggleAnalysisDataLabels');
    if (toggleLabelsCheckbox) {
        toggleLabelsCheckbox.addEventListener('change', () => {
            updateAnalysisCompareChart();
        });
    }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateAnalysisCompareChart();
        });

        // Add hover effects to trigger dashed lines on the chart
        const labelEl = cb.closest('label');
        if (labelEl) {
            labelEl.addEventListener('mouseenter', () => {
                highlightDatasetInChart(cb.value, true);
            });
            labelEl.addEventListener('mouseleave', () => {
                highlightDatasetInChart(cb.value, false);
            });
        }
    });

    const btnSelectAll = document.getElementById('btnAnalysisSelectAll');
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = true;
            });
            updateAnalysisCompareChart();
        });
    }

    const btnClear = document.getElementById('btnAnalysisClear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = false;
            });
            updateAnalysisCompareChart();
        });
    }
}

// Render dynamic dual Y-axes chart comparing selected metrics
function updateAnalysisCompareChart() {
    const canvas = document.getElementById('analysisCompareChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance
    if (analysisCompareChartInstance) {
        try {
            analysisCompareChartInstance.destroy();
        } catch (e) {
            console.error("Error destroying analysisCompareChartInstance:", e);
        }
        analysisCompareChartInstance = null;
    }

    if (monthlyResults.length === 0) return;

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    // Build timeline labels
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const labels = filteredMonths.map(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        return `${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`;
    });

    const activeMetrics = [];
    const checkboxes = document.querySelectorAll('input[name="analysis_metric"]:checked');
    checkboxes.forEach(cb => {
        activeMetrics.push(cb.value);
    });
    activeMetricsList = activeMetrics; // Sync global metrics list

    if (activeMetrics.length === 0) {
        // Render empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "14px 'Sarabun', sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.textAlign = "center";
        ctx.fillText("กรุณาเลือกตัวชี้วัดฝั่งซ้ายอย่างน้อย 1 รายการเพื่อเริ่มแสดงกราฟเปรียบเทียบ", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Config map for all available metrics
    const metricConfigs = {
        // Amounts / Currency Group (y_currency Axis)
        'revenue': { label: 'รายได้สะสม', color: '#10B981', isCurrency: true, axis: 'y_currency', type: 'line' },
        'expenses': { label: 'รายจ่ายสะสม', color: '#EF4444', isCurrency: true, axis: 'y_currency', type: 'line' },
        'netProfit': { label: 'กำไรสุทธิสะสม', color: '#0284C7', isCurrency: true, axis: 'y_currency', type: 'bar' },
        'ebitda': { label: 'EBITDA', color: '#8B5CF6', isCurrency: true, axis: 'y_currency', type: 'bar' },
        'cash': { label: 'เงินสดสะสม', color: '#6366F1', isCurrency: true, axis: 'y_currency', type: 'line' },
        'nwc': { label: 'ทุนหมุนเวียนสุทธิ (NWC)', color: '#0D9488', isCurrency: true, axis: 'y_currency', type: 'line' },
        'netReserve': { label: 'เงินบำรุงคงเหลือสุทธิ', color: '#059669', isCurrency: true, axis: 'y_currency', type: 'bar' },

        // Percentages Group (y_percent Axis)
        'operatingMargin': { label: 'Operating Margin (%)', color: '#10B981', isPercent: true, axis: 'y_percent', type: 'line' },
        'returnOnAsset': { label: 'Return on Asset (ROA %)', color: '#EC4899', isPercent: true, axis: 'y_percent', type: 'line' },

        // Ratios Group (y_ratio Axis)
        'currentRatio': { label: 'Current Ratio', color: '#2563EB', isRatio: true, axis: 'y_ratio', type: 'line' },
        'quickRatio': { label: 'Quick Ratio', color: '#06B6D4', isRatio: true, axis: 'y_ratio', type: 'line' },
        'cashRatio': { label: 'Cash Ratio', color: '#D97706', isRatio: true, axis: 'y_ratio', type: 'line' },

        // Days Group (y_days Axis)
        'apDrugSuppliesDays': { label: 'ระยะเวลาจ่ายหนี้ AP (วัน)', color: '#F59E0B', isDays: true, axis: 'y_days', type: 'line' },
        'arUCDays': { label: 'ระยะเวลาเก็บหนี้ AR UC (วัน)', color: '#3B82F6', isDays: true, axis: 'y_days', type: 'line' },
        'invDays': { label: 'ระยะเวลาขายคลัง INV (วัน)', color: '#8B5CF6', isDays: true, axis: 'y_days', type: 'line' }
    };

    let hasCurrency = false;
    let hasPercent = false;
    let hasRatio = false;
    let hasDays = false;

    const datasets = activeMetrics.map(metric => {
        const config = metricConfigs[metric];
        if (!config) return null;

        if (config.axis === 'y_currency') hasCurrency = true;
        if (config.axis === 'y_percent') hasPercent = true;
        if (config.axis === 'y_ratio') hasRatio = true;
        if (config.axis === 'y_days') hasDays = true;

        // Fetch values YTD
        const dataValues = filteredMonths.map(month => {
            const dbRes = month.dashboardResult || (typeof processDashboardData === 'function' ? processDashboardData(month, monthlyResults) : {});

            if (metric === 'revenue') return sumAccounts(month.tbData, '4', true);
            if (metric === 'expenses') return sumAccounts(month.tbData, '5', false);
            if (metric === 'netProfit') return sumAccounts(month.tbData, '4', true) - sumAccounts(month.tbData, '5', false);
            if (metric === 'cash') return sumAccounts(month.tbData, '1101', false);
            if (metric === 'ebitda') return sumMgtAccount(month.tbData, 'EBITDA');
            if (metric === 'nwc') return dbRes.nwc || 0;
            if (metric === 'netReserve') return dbRes.netReserve || 0;

            if (metric === 'currentRatio') return dbRes.currentRatio || 0;
            if (metric === 'quickRatio') return dbRes.quickRatio || 0;
            if (metric === 'cashRatio') return dbRes.cashRatio || 0;
            if (metric === 'operatingMargin') return (dbRes.operatingMargin || 0) * 100; // convert to %
            if (metric === 'returnOnAsset') return (dbRes.returnOnAsset || 0) * 100; // convert to %
            if (metric === 'apDrugSuppliesDays') return dbRes.apDrugSuppliesDays || 0;
            if (metric === 'arUCDays') return dbRes.arUCDays || 0;
            if (metric === 'invDays') return dbRes.invDays || 0;

            return 0;
        });

        const dataset = {
            type: config.type,
            label: config.label,
            data: dataValues,
            borderColor: config.color,
            backgroundColor: config.type === 'bar' ? `${config.color}33` : 'transparent',
            borderWidth: 3,
            yAxisID: config.axis,
            tension: 0.35,
            spanGaps: true
        };

        if (config.type === 'line') {
            dataset.pointBackgroundColor = config.color;
            dataset.pointBorderColor = config.color;
            dataset.pointBorderWidth = 2;
            dataset.pointRadius = 4.5;
            dataset.pointHoverRadius = 6.5;
        } else {
            dataset.borderRadius = 6;
            dataset.borderWidth = 1.5;
            dataset.borderColor = config.color;
        }

        return dataset;

    }).filter(d => d !== null);

    // Dynamic scale configuration
    const scalesConfig = {
        x: {
            title: { display: true, text: 'รอบเดือน' }
        }
    };

    if (hasCurrency) {
        scalesConfig.y_currency = {
            position: 'left',
            title: { display: true, text: 'จำนวนเงิน (บาท)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => formatAbbreviated(value)
            }
        };
    }

    if (hasPercent) {
        scalesConfig.y_percent = {
            position: 'right',
            title: { display: true, text: 'เปอร์เซ็นต์ (%)' },
            ticks: {
                callback: (value) => value + ' %'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    if (hasRatio) {
        scalesConfig.y_ratio = {
            position: 'right',
            title: { display: true, text: 'อัตราส่วน (เท่า)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => value + ' เท่า'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    if (hasDays) {
        scalesConfig.y_days = {
            position: 'left',
            title: { display: true, text: 'ระยะเวลา (วัน)' },
            beginAtZero: true,
            ticks: {
                callback: (value) => value + ' วัน'
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }
    analysisCompareChartInstance = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: datasets
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: "'Sarabun', sans-serif", weight: 'bold' }
                    },
                    onHover: (event, legendItem, legend) => {
                        const chart = legend.chart;
                        const hoveredIndex = legendItem.datasetIndex;
                        const datasetLabel = chart.data.datasets[hoveredIndex]?.label;

                        const metricEntry = Object.entries(metricConfigs).find(([key, cfg]) => cfg.label === datasetLabel);
                        activeHighlightedMetric = metricEntry ? metricEntry[0] : null;

                        chart.data.datasets.forEach((dataset, index) => {
                            if (index === hoveredIndex) {
                                dataset.borderDash = [6, 4];
                                dataset.borderWidth = 5;
                            } else {
                                dataset.borderDash = [];
                                dataset.borderWidth = 3;
                                dataset.borderDashOffset = 0;
                            }
                        });

                        if (!animationFrameId && activeHighlightedMetric) {
                            animateDash();
                        }
                    },
                    onLeave: (event, legendItem, legend) => {
                        const chart = legend.chart;
                        activeHighlightedMetric = null;
                        if (animationFrameId) {
                            cancelAnimationFrame(animationFrameId);
                            animationFrameId = null;
                        }
                        chart.data.datasets.forEach(dataset => {
                            dataset.borderDash = [];
                            dataset.borderWidth = 3;
                            dataset.borderDashOffset = 0;
                        });
                        chart.update('none');
                    }
                },
                tooltip: {
                    padding: 10,
                    borderRadius: 8,
                    titleFont: { family: "'Sarabun', sans-serif", weight: 'bold' },
                    bodyFont: { family: "'Sarabun', sans-serif" },
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            const label = context.dataset.label;
                            const config = Object.values(metricConfigs).find(cfg => cfg.label === label);

                            if (!config) return ` ${label}: ${val}`;

                            if (config.isCurrency) {
                                return ` ${label}: ${Number(val).toLocaleString('th-TH')} บาท`;
                            } else if (config.isPercent) {
                                return ` ${label}: ${val.toFixed(2)} %`;
                            } else if (config.isDays) {
                                return ` ${label}: ${Math.round(val)} วัน`;
                            } else if (config.isRatio) {
                                return ` ${label}: ${val.toFixed(2)} เท่า`;
                            }
                            return ` ${label}: ${val}`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('analysisCompareChartCanvas') : true,
                    align: 'top',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 4,
                    color: '#1E293B',
                    font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 9 },
                    formatter: (value, context) => {
                        const label = context.dataset.label;
                        const config = Object.values(metricConfigs).find(cfg => cfg.label === label);

                        if (!config || value === 0) return '';
                        if (config.isCurrency) return formatAbbreviated(value);
                        if (config.isPercent) return value.toFixed(1) + '%';
                        if (config.isDays) return Math.round(value) + 'วัน';
                        return value.toFixed(1);
                    }
                }
            },
            scales: scalesConfig
        }
    });
}

function highlightDatasetInChart(metricValue, isHighlighted) {
    if (!analysisCompareChartInstance) return;

    if (isHighlighted) {
        activeHighlightedMetric = metricValue;

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
        const targetLabel = metricLabelMap[metricValue];

        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            if (dataset.label === targetLabel) {
                dataset.borderDash = [6, 4];
                dataset.borderWidth = 5;
            } else {
                dataset.borderDash = [];
                dataset.borderWidth = 3;
                dataset.borderDashOffset = 0;
            }
        });

        if (!animationFrameId) {
            animateDash();
        }
    } else {
        activeHighlightedMetric = null;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        analysisCompareChartInstance.data.datasets.forEach(dataset => {
            dataset.borderDash = [];
            dataset.borderWidth = 3;
            dataset.borderDashOffset = 0;
        });
        analysisCompareChartInstance.update('none');
    }
}
