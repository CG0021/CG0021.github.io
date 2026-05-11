document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadScreen = document.getElementById('upload-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    // Modal elements
    const modal = document.getElementById('chart-modal');
    const borderModalClose = document.getElementById('close-modal');

    // charts instances
    let incomeExpenseChart = null;
    let incomeBreakdownChart = null;
    let expenseBreakdownChart = null;
    let subChartInstances = [];

    // Dashboard State
    let showPctMain = false;
    let showPctModal = false;
    let showCompareValues = true;
    let showCompareGrowth = false;
    let showBreakdownIncome100 = false;
    let showBreakdownExpense100 = false;
    let showBreakdownIncomeSort = false;
    let showBreakdownExpenseSort = false;

    // Multi-Hospital Store
    let hospitalStore = [];
    let activeHospitalIndex = 0;
    let compareChartInstances = [];
    let compareMainChartInstance = null;
    let breakdownCompareIncomeChart = null;
    let breakdownCompareExpenseChart = null;


    // Hidden file input for adding hospitals from dashboard
    const addHospitalInput = document.createElement('input');
    addHospitalInput.type = 'file';
    addHospitalInput.accept = '.xlsx, .xls';
    addHospitalInput.multiple = true;
    addHospitalInput.style.display = 'none';
    document.body.appendChild(addHospitalInput);

    const triggerAddHospital = () => addHospitalInput.click();
    
    // Global click listener to close toolbar when clicking outside
    document.addEventListener('click', (e) => { 
        const t = document.querySelector('.cell-toolbar'); 
        if (t && !e.target.closest('.cell-toolbar')) t.remove(); 
    });

    // --- Drag and Drop Handlers ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });

    // Add Hospital from dashboard
    addHospitalInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
            addHospitalInput.value = '';
        }
    });

    // --- Tab Navigation ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = 'tab-' + btn.dataset.tab;
            document.getElementById(targetId).classList.add('active');

            // Recalculate performance scrollbar width if performance tab is activated
            if (btn.dataset.tab === 'performance') {
                const mainTable = document.getElementById('perf-main-table');
                const topScrollContent = document.getElementById('perf-top-scroll-content');
                if (mainTable && topScrollContent) {
                    topScrollContent.style.width = mainTable.offsetWidth + 'px';
                }
            }

            // Switch sidebar content based on tab
            if (btn.dataset.tab === 'compare') {
                renderSidebar();
                renderCompareCategorySelector();
                renderCompareTab();
            } else {
                renderSidebar();
            }
        });
    });

    // --- Modal Handlers ---
    borderModalClose.addEventListener('click', () => {
        modal.style.display = 'none';
        if (window.modalChartInstance) {
            window.modalChartInstance.destroy();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
            if (window.modalChartInstance) window.modalChartInstance.destroy();
        }
    });

    // Helper to convert hex/rgb to rgba
    function hexToRgba(color, alpha) {
        if (!color || color === 'transparent') return color;
        if (color.startsWith('rgba')) return color.replace(/[\d\.]+\)$/, alpha + ')');
        if (color.startsWith('rgb')) return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    // Helper to update chart opacity
    function updateChartOpacity(chart, activeIndex, isDatasetIndex = false) {
        if (!chart) return;

        // Cache original colors once per chart
        if (!chart._originals) {
            chart._originals = chart.data.datasets.map(ds => ({
                bg: Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : ds.backgroundColor,
                border: Array.isArray(ds.borderColor) ? [...ds.borderColor] : ds.borderColor
            }));
        }

        // Only update if the active index changed to avoid flickering and tooltip issues
        const stateKey = `${activeIndex}_${isDatasetIndex}`;
        if (chart._lastState === stateKey) return;
        chart._lastState = stateKey;

        const opacity = 0.05; // Lower opacity for inactive items
        const processColor = (color, isSelected) => {
            if (!color || color === 'transparent') return color;
            if (Array.isArray(color)) {
                return color.map(c => isSelected ? c : hexToRgba(c, opacity));
            }
            return isSelected ? color : hexToRgba(color, opacity);
        };

        if (chart.config.type === 'doughnut') {
            const ds = chart.data.datasets[0];
            const orig = chart._originals[0];
            if (activeIndex !== null) {
                ds.backgroundColor = orig.bg.map((c, i) => i === activeIndex ? c : hexToRgba(c, opacity));
                // Add border to active donut slice
                ds.borderWidth = orig.bg.map((_, i) => i === activeIndex ? 3 : 1);
                ds.borderColor = orig.bg.map((c, i) => i === activeIndex ? '#334155' : 'white');
            } else {
                ds.backgroundColor = [...orig.bg];
                ds.borderWidth = 1;
                ds.borderColor = 'white';
            }
        } else {
            // For Line/Bar (Comparison)
            chart.data.datasets.forEach((ds, i) => {
                const orig = chart._originals[i];
                if (activeIndex !== null) {
                    const isSelected = isDatasetIndex ? (i === activeIndex) : true;
                    ds.backgroundColor = processColor(orig.bg, isSelected);
                    
                    if (isSelected) {
                        ds.borderColor = '#1e293b'; // Strong dark border
                        ds.borderWidth = 2.5; // Thicker border
                    } else {
                        ds.borderColor = processColor(orig.border, false);
                        ds.borderWidth = 0.5; // Thinner border
                    }
                } else {
                    ds.backgroundColor = orig.bg;
                    ds.borderColor = orig.border;
                    ds.borderWidth = 1;
                }
            });
        }
        chart.update('none');
    }

    // Inline plugin to show values above points
    const dataLabelPlugin = {
        id: 'customDataLabel',
        afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, data } = chart;
            ctx.save();
            ctx.textAlign = 'center';

            const isMainChart = chart.canvas.id === 'income-expense-chart';
            const isModalChart = chart.canvas.id === 'modal-canvas';
            const isCompareChart = chart.canvas.id === 'compare-main-chart';
            
            const showPct = (isMainChart && showPctMain) || (isModalChart && showPctModal);

            // Special handling for Comparison Chart (multiple datasets)
            if (isCompareChart) {
                if (!showCompareValues && !showCompareGrowth) {
                    ctx.restore();
                    return;
                }

                data.datasets.forEach((dataset, dsIndex) => {
                    const meta = chart.getDatasetMeta(dsIndex);
                    if (meta.hidden) return;

                    meta.data.forEach((datapoint, index) => {
                        let value = dataset.data[index];
                        if (value === 0 || value === null || isNaN(value)) return;

                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.font = `bold 11px 'Sarabun', sans-serif`;
                        ctx.fillStyle = dataset.borderColor || '#1f2937';

                        // Show Values
                        if (showCompareValues) {
                            let text = value.toLocaleString('th-TH');
                            if (Math.abs(value) >= 1000000) text = (value / 1000000).toFixed(1) + 'M';
                            else if (Math.abs(value) >= 10000) text = (value / 1000).toFixed(0) + 'k';
                            
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(text, datapoint.x, datapoint.y - 8);
                        }

                        // Show Growth %
                        if (showCompareGrowth && index > 0) {
                            let prevValue = dataset.data[index - 1];
                            if (prevValue !== 0 && prevValue !== null && !isNaN(prevValue)) {
                                let growth = ((value - prevValue) / Math.abs(prevValue)) * 100;
                                let growthText = (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
                                
                                ctx.textBaseline = 'top';
                                ctx.font = `bold 10px 'Sarabun', sans-serif`;
                                ctx.fillStyle = growth >= 0 ? '#10b981' : '#ef4444';
                                // Position growth slightly offset if values are also shown
                                let yOffset = showCompareValues ? 15 : 8;
                                ctx.fillText(growthText, datapoint.x, datapoint.y + yOffset);
                            }
                        }
                        ctx.restore();
                    });
                });
                ctx.restore();
                return;
            }

            chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                let value = data.datasets[0].data[index];
                if (value === 0 || value === null || isNaN(value)) return;

                let text = value.toLocaleString('th-TH');
                if (value >= 1000000) text = (value / 1000000).toFixed(2) + 'M';
                else if (value >= 10000) text = (value / 1000).toFixed(0) + 'k';

                if (showPct) {
                    let plan = isMainChart ? data.datasets[0].data[3] : window.currentPlanValue;
                    if (plan > 0) {
                        let pct = ((value / plan) * 100).toFixed(0) + '%';
                        if (isMainChart) text = `${text} (${pct})`;
                        // In modal, we now show pct on the vertical line, so keep label as money
                    }
                }

                ctx.textBaseline = 'bottom';
                ctx.fillStyle = '#1f2937';
                ctx.font = `bold 13px 'Sarabun', sans-serif`;
                ctx.fillText(text, datapoint.x, datapoint.y - 12);

                if (index > 0 && !showPct) {
                    let prevValue = data.datasets[0].data[index - 1];
                    if (prevValue !== 0 && prevValue !== null) {
                        let diff = value - prevValue;
                        if (diff === 0) return; // Don't show 0 diff
                        let diffText = (diff > 0 ? '+' : '') + diff.toLocaleString('th-TH');
                        if (Math.abs(diff) >= 1000000) diffText = (diff > 0 ? '+' : '') + (diff / 1000000).toFixed(2) + 'M';
                        else if (Math.abs(diff) >= 10000) diffText = (diff > 0 ? '+' : '') + (diff / 1000).toFixed(0) + 'k';

                        ctx.textBaseline = 'top';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.fillStyle = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : '#6b7280');
                        ctx.fillText(diffText, datapoint.x, datapoint.y + 10);
                    }
                }
            });

            // Draw Progress Indicators in Modal
            if (isModalChart && showPctModal) {
                const isLinear = chart.scales.x.type === 'linear';
                const yScale = chart.scales.y;
                
                if (isLinear) {
                    // TREND VIEW comparison (Using Annual Plan as target for consistency)
                    const dsResult = chart.getDatasetMeta(1); // Dataset 1: Monthly Actuals
                    const targetY = yScale.getPixelForValue(window.currentPlanValue);
                    
                    dsResult.data.forEach((point, i) => {
                        if (i === 0) return; // Skip 0 point at start
                        
                        const actualVal = data.datasets[1].data[i].y;
                        if (window.currentPlanValue <= 0) return;

                        // Draw vertical line and %
                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(point.x, targetY);
                        ctx.stroke();

                        let pct = ((actualVal / window.currentPlanValue) * 100).toFixed(0) + '%';
                        let midY = (point.y + targetY) / 2;
                        
                        // Label background
                        const textWidth = ctx.measureText(pct).width;
                        ctx.fillStyle = 'rgba(255,255,255,0.85)';
                        ctx.fillRect(point.x - (textWidth / 2) - 2, midY - 7, textWidth + 4, 14);

                        ctx.fillStyle = '#3b82f6';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pct, point.x, midY);
                        ctx.restore();
                    });
                } else if (window.currentPlanValue > 0) {
                    // MONTHLY VIEW (Categorical)
                    const meta = chart.getDatasetMeta(0);
                    const targetY = yScale.getPixelForValue(window.currentPlanValue);
                    const rawData = data.datasets[0].data;

                    meta.data.forEach((point, i) => {
                        if (i === 11) return;
                        let val = rawData[i];
                        if (val === 0 || val === null) return;
                        let prevVal = i > 0 ? rawData[i - 1] : 0;
                        if (val <= prevVal && i > 0) return;

                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(point.x, targetY);
                        ctx.stroke();

                        let pct = ((val / window.currentPlanValue) * 100).toFixed(0) + '%';
                        let midY = (point.y + targetY) / 2;
                        
                        const textWidth = ctx.measureText(pct).width;
                        ctx.fillStyle = 'rgba(255,255,255,0.85)';
                        ctx.fillRect(point.x - (textWidth / 2) - 2, midY - 7, textWidth + 4, 14);

                        ctx.fillStyle = '#3b82f6';
                        ctx.font = "bold 11px 'Sarabun', sans-serif";
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pct, point.x, midY);
                        ctx.restore();
                    });
                }
            }

            ctx.restore();
        }
    };

    function handleFiles(files) {
        const fileArray = Array.from(files);
        let loadedCount = 0;
        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const extracted = processData(workbook);
                if (extracted) {
                    // Check for duplicate hospital name
                    const existing = hospitalStore.findIndex(h => h.name === extracted.name);
                    if (existing >= 0) {
                        hospitalStore[existing] = extracted; // Update existing
                    } else {
                        hospitalStore.push(extracted);
                    }
                }
                loadedCount++;
                if (loadedCount === fileArray.length) {
                    // All files loaded
                    uploadScreen.style.display = 'none';
                    dashboardScreen.style.display = 'flex';
                    
                    // Process all hospitals to ensure they have computed data
                    hospitalStore.forEach((_, i) => {
                        extractInformation(i, false); // Process only, don't update UI
                    });

                    renderSidebar();
                    switchHospital(hospitalStore.length - 1); // This will update UI for the last one
                    // Show compare tab if > 1 hospital
                    document.getElementById('tab-btn-compare').style.display = hospitalStore.length > 1 ? 'inline-block' : 'none';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function processData(workbook) {
        let mainSheet = null;
        let perfSheet = null;
        const mainSheetName = 'แผนรายรับ-รายจ่ายเงินบำรุง';
        const perfSheetName = 'ผลดำเนินงาน';

        if (workbook.Sheets[mainSheetName]) mainSheet = workbook.Sheets[mainSheetName];
        else {
            const foundName = workbook.SheetNames.find(n => n.includes('แผนรายรับ') || n.includes('เงินบำรุง'));
            mainSheet = foundName ? workbook.Sheets[foundName] : workbook.Sheets[workbook.SheetNames[0]];
        }

        if (workbook.Sheets[perfSheetName]) perfSheet = workbook.Sheets[perfSheetName];
        else {
            const fn = workbook.SheetNames.find(n => n.includes('ผลดำเนินงาน'));
            perfSheet = fn ? workbook.Sheets[fn] : null;
        }

        const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1, defval: "" });
        const perfData = perfSheet ? XLSX.utils.sheet_to_json(perfSheet, { header: 1, defval: "" }) : null;

        // Extract hospital name
        let hospitalName = "โรงพยาบาล (ไม่ทราบชื่อ)";
        for (let i = 0; i < Math.min(10, mainData.length); i++) {
            for (let j = 0; j < Math.min(5, mainData[i].length); j++) {
                let cell = String(mainData[i][j] || "").trim();
                if (cell.includes('โรงพยาบาล')) { hospitalName = cell; break; }
            }
            if (hospitalName !== "โรงพยาบาล (ไม่ทราบชื่อ)") break;
        }

        return { name: hospitalName, mainData, perfData };
    }

    function renderSidebar() {
        const list = document.getElementById('hospital-list');
        const count = document.getElementById('hospital-count');
        const header = document.querySelector('.sidebar-header h3');
        header.textContent = '🏥 รายชื่อ รพ.';
        count.innerText = hospitalStore.length;
        list.innerHTML = '';
        hospitalStore.forEach((h, i) => {
            const item = document.createElement('div');
            item.className = 'sidebar-item' + (i === activeHospitalIndex ? ' active' : '');
            const shortName = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim() || h.name;
            item.innerHTML = `
                <span class="sidebar-item-name" title="${h.name}">${shortName}</span>
                <span class="sidebar-item-delete" title="ลบ" data-idx="${i}">✕</span>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('sidebar-item-delete')) return;
                switchHospital(i);
            });
            item.querySelector('.sidebar-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                hospitalStore.splice(i, 1);
                if (activeHospitalIndex >= hospitalStore.length) activeHospitalIndex = Math.max(0, hospitalStore.length - 1);
                renderSidebar();
                if (hospitalStore.length > 0) {
                    switchHospital(activeHospitalIndex);
                } else {
                    uploadScreen.style.display = 'block';
                    dashboardScreen.style.display = 'none';
                }
                document.getElementById('tab-btn-compare').style.display = hospitalStore.length > 1 ? 'inline-block' : 'none';
            });
            list.appendChild(item);
        });

        // Add "เพิ่มโรงพยาบาล" button after last hospital
        const addBtn = document.createElement('div');
        addBtn.className = 'sidebar-add-btn';
        addBtn.innerHTML = '➕ เพิ่มโรงพยาบาล';
        addBtn.addEventListener('click', triggerAddHospital);
        addBtn.addEventListener('dragover', (e) => { e.preventDefault(); addBtn.classList.add('drag-hover'); });
        addBtn.addEventListener('dragleave', () => addBtn.classList.remove('drag-hover'));
        addBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            addBtn.classList.remove('drag-hover');
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        });
        list.appendChild(addBtn);
    }

    function switchHospital(index) {
        activeHospitalIndex = index;
        renderSidebar();
        extractInformation(index, true); // Update UI for selected hospital
    }

    // Compare item selection state (Single-select)
    let selectedCompareItem = '📊 รายรับ-รายจ่าย (ปีแผน)';

    function renderCompareCategorySelector() {
        const list = document.getElementById('compare-category-selector');
        if (!list) return;

        list.innerHTML = '<div class="sidebar-header" style="background:var(--bg-main); border-bottom:1px solid var(--border); padding:1rem"><h3>📊 เลือกรายการเปรียบเทียบ</h3></div>';
        const itemsContainer = document.createElement('div');
        itemsContainer.style.flex = '1';
        itemsContainer.style.overflowY = 'auto';
        list.appendChild(itemsContainer);

        const compareGroups = [
            { title: 'ภาพรวมเปรียบเทียบ', items: ['📊 รายรับ-รายจ่าย (ปีแผน)', '📈 เงินคงเหลือสุทธิ (6 ปี)', '🥧 สัดส่วนรายได้รายหมวด'] },
            { title: 'สรุปรายปี', items: ['รวมรายรับ', 'รวมรายจ่าย', 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ'] },
            { title: 'รายรับดำเนินงาน', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
            { title: 'รายรับอื่น', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] },
            { title: 'รายจ่ายบุคลากร', items: ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)"] },
            { title: 'รายจ่ายดำเนินงาน', items: ["ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"] },
            { title: 'รายจ่ายลงทุน', items: ["ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"] },
            { title: 'เงินคงเหลือ', items: ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์"] }
        ];

        itemsContainer.innerHTML = '';
        compareGroups.forEach(g => {
            // Group header
            const groupLabel = document.createElement('div');
            groupLabel.className = 'sidebar-group-label';
            groupLabel.textContent = g.title;
            itemsContainer.appendChild(groupLabel);

            // Items
            g.items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'sidebar-compare-item' + (item === selectedCompareItem ? ' active' : '');
                el.textContent = item;
                el.title = item;
                el.addEventListener('click', () => {
                    selectedCompareItem = item;
                    // Update active states
                    itemsContainer.querySelectorAll('.sidebar-compare-item').forEach(e => e.classList.remove('active'));
                    el.classList.add('active');
                    
                    // Trigger chart update
                    if (typeof window._updateItemChart === 'function') window._updateItemChart();
                    if (typeof window._updateCompareCharts === 'function') window._updateCompareCharts();
                });
                itemsContainer.appendChild(el);
            });
        });
    }

    function extractInformation(index, updateUI = true) {
        const hospitalObj = hospitalStore[index];
        if (!hospitalObj) return;

        const data = hospitalObj.mainData;
        const perfData = hospitalObj.perfData;

        let hospitalName = "วิเคราะห์ข้อมูลการเงินบำรุง";
        for (let i = 0; i < Math.min(10, data.length); i++) {
            for (let j = 0; j < Math.min(5, data[i].length); j++) {
                let cell = String(data[i][j] || "").trim();
                if (cell.includes('โรงพยาบาล')) { hospitalName = cell; break; }
            }
            if (hospitalName !== "วิเคราะห์ข้อมูลการเงินบำรุง") break;
        }

        if (updateUI) {
            document.getElementById('hospital-name').innerText = 'ผลการวิเคราะห์: ' + hospitalName;
        }

        const groups = [
            { title: 'รายรับจากการดำเนินงาน', type: 'income', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
            { title: 'รายรับอื่น', type: 'income', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] },
            { title: 'รายจ่ายบุคลากร', type: 'expense', items: ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น"] },
            { title: 'รายจ่ายจากการดำเนินงาน', type: 'expense', items: ["ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"] },
            { title: 'รายจ่ายลงทุน', type: 'expense', items: ["ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"] },
            { title: 'รายจ่ายอื่น', type: 'expense', items: ["รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ", "งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)"] },
            { title: 'เงินคงเหลือ', type: 'balance', items: ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์", "ประเภทกระแสรายวัน"] }
        ];

        let dataCols = [];
        let yearsLabels = ['2566', '2567', '2568', '2569', '2570', '2571'];

        for (let i = 0; i < data.length; i++) {
            let row = data[i];
            for (let j = 0; j < Math.min(5, row.length); j++) {
                let val = String(row[j] || "").trim();
                if (val === "รวมรายรับ" || val.includes("รายรับค่ารักษาพยาบาล")) {
                    for (let c = j + 1; c < row.length; c++) {
                        let cVal = String(row[c] || "").replace(/,/g, '').trim();
                        if (cVal !== "" && (cVal === "-" || !isNaN(parseFloat(cVal)))) {
                            if (!dataCols.includes(c)) dataCols.push(c);
                        }
                    }
                    break;
                }
            }
            if (dataCols.length >= 6) break;
        }
        if (dataCols.length < 6) dataCols = [1, 2, 3, 4, 5, 6];

        const getSeries = (keyword) => {
            const cleanK = keyword.replace(/\s+/g, '');
            let bestExact = null;
            let partialMatch = null;
            
            // Pass 1: Look for exact match (with data priority)
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < 5; j++) {
                    let cellVal = String(data[i][j] || "").trim();
                    let cleanV = cellVal.replace(/\s+/g, '');
                    if (cellVal === keyword || cleanV === cleanK) {
                        const rowVals = dataCols.map(c => {
                            let vStr = String(data[i][c] || "").replace(/,/g, '').trim();
                            if (vStr === '-' || vStr === '') return 0;
                            let v = parseFloat(vStr);
                            return isNaN(v) ? 0 : v;
                        });
                        const hasData = rowVals.some(v => v !== 0);
                        if (!bestExact || (!bestExact.hasData && hasData)) {
                            bestExact = { vals: rowVals, hasData: hasData };
                        }
                        // If we found an exact match with data, we can stop
                        if (hasData) return rowVals;
                    }
                }
            }
            if (bestExact) return bestExact.vals;

            // Pass 2: Look for partial match if exact match fails
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < 5; j++) {
                    let cellVal = String(data[i][j] || "").trim();
                    if (cellVal.includes(keyword)) {
                        const rowVals = dataCols.map(c => {
                            let vStr = String(data[i][c] || "").replace(/,/g, '').trim();
                            if (vStr === '-' || vStr === '') return 0;
                            let v = parseFloat(vStr);
                            return isNaN(v) ? 0 : v;
                        });
                        const hasData = rowVals.some(v => v !== 0);
                        if (!partialMatch || (!partialMatch.hasData && hasData)) {
                            partialMatch = { vals: rowVals, hasData: hasData };
                        }
                    }
                }
            }
            return partialMatch ? partialMatch.vals : [0, 0, 0, 0, 0, 0];
        };

        const sumCategories = (cats) => {
            let res = [0, 0, 0, 0, 0, 0];
            cats.forEach(c => {
                let s = getSeries(c);
                s.forEach((v, i) => res[i] += (v || 0));
            });
            return res;
        };

        const incomeCategories = groups.filter(g => g.type === 'income').flatMap(g => g.items);
        const expenseCategories = groups.filter(g => g.type === 'expense').flatMap(g => g.items);

        let tIncomes = getSeries('รวมรายรับ');
        let tExpenses = getSeries('รวมรายจ่าย');
        const incCalc = sumCategories(incomeCategories);
        const expCalc = sumCategories(expenseCategories);

        if (incCalc.reduce((a, b) => a + b, 0) > tIncomes.reduce((a, b) => a + b, 0)) tIncomes = incCalc;
        if (expCalc.reduce((a, b) => a + b, 0) > tExpenses.reduce((a, b) => a + b, 0)) tExpenses = expCalc;

        // Custom helper to get or calculate summary series
        const getReportSeries = (keyword) => {
            // Try to find the series with the exact or partial keyword
            let s = getSeries(keyword);

            // If not found, try a simplified keyword for some items
            if (s.every(v => v === 0)) {
                if (keyword.includes('งบกลาง')) s = getSeries('งบกลาง');
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) s = getSeries('รายรับสูง(ต่ำกว่า)รายจ่าย');
            }

            // If still not found or we want to ensure calculation consistency
            if (s.every(v => v === 0)) {
                if (keyword === 'รวมรายรับ') return tIncomes;
                if (keyword === 'รวมรายจ่าย') return tExpenses;
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) {
                    return tIncomes.map((v, i) => v - tExpenses[i]);
                }
                if (keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                    let net = getReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
                    let carry = getSeries('บวกเงินคงเหลือสะสมยกมา');
                    return net.map((v, i) => v + (carry[i] || 0));
                }
                if (keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                    let total1 = getReportSeries('เงินคงเหลือทั้งสิ้น(1)');
                    let h4 = getSeries('หักเงินกองทุนรอการจัดสรร(4)');
                    let h5 = getSeries('หักภาระผูกพัน(5)');
                    return total1.map((v, i) => v - (h4[i] || 0) - (h5[i] || 0));
                }
                if (keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                    let cash = getSeries('เงินสด');
                    let klang = getSeries('เงินฝากคลัง');
                    let p1 = getSeries('ประเภทประจำ');
                    let p2 = getSeries('ประเภทออมทรัพย์');
                    let p3 = getSeries('ประเภทกระแสรายวัน');
                    return cash.map((v, i) => (v || 0) + (klang[i] || 0) + (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0));
                }
            }
            return s;
        };

        let planIdx = 3;
        let tIncomePlan = tIncomes[planIdx];
        let tExpensePlan = tExpenses[planIdx];
        let netSeries = getReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
        let netPlan = netSeries[planIdx];

        if (updateUI) {
            document.getElementById('total-income-2569').innerText = tIncomePlan.toLocaleString('th-TH');
            document.getElementById('total-expense-2569').innerText = tExpensePlan.toLocaleString('th-TH');
            document.getElementById('net-2569').innerText = netPlan.toLocaleString('th-TH');
            document.getElementById('net-2569').style.color = netPlan >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        const formatLabel = (label, maxLen = 25) => {
            if (label.length <= maxLen) return label;
            let breakIdx = label.lastIndexOf(' ', maxLen);
            if (breakIdx === -1) breakIdx = maxLen;
            return [label.substring(0, breakIdx).trim(), label.substring(breakIdx).trim()];
        };

        const processBreakdown = (categories, pIdx) => {
            let items = categories.map(cat => ({ label: cat, value: getSeries(cat)[pIdx] })).filter(item => item.value > 0);
            items.sort((a, b) => b.value - a.value);
            // Show all items without forced wrapping for Thai text
            return { labels: items.map(item => item.label), values: items.map(item => item.value) };
        };

        const incB = processBreakdown(incomeCategories, planIdx);
        const expB = processBreakdown(expenseCategories, planIdx);

        // Store computed data for comparison
        hospitalObj.tIncomes = tIncomes;
        hospitalObj.tExpenses = tExpenses;
        hospitalObj.netSeries = netSeries;
        hospitalObj.yearsLabels = yearsLabels;
        hospitalObj.getSeries = getSeries;
        hospitalObj.getReportSeries = getReportSeries;

        if (updateUI) {
            const groupedData = groups.map(g => ({ title: g.title, type: g.type, items: g.items.map(item => ({ label: item, data: getSeries(item) })) }));
            renderCharts(yearsLabels, tIncomes, tExpenses, incB.labels, incB.values, expB.labels, expB.values);
            renderGroupedSubCharts(yearsLabels, groupedData);
            renderReportTable(yearsLabels, getReportSeries);
            
            // Handle Breakdown Comparison
            const compareSection = document.getElementById('breakdown-compare-section');
            if (hospitalStore.length > 1) {
                compareSection.style.display = 'block';
                updateBreakdownCompareChart();
            } else {
                compareSection.style.display = 'none';
            }
        }

        // Performance Tab logic
        const getPerfSeries = (keyword) => {
            if (!perfData) return Array(14).fill(0);
            const cleanK = keyword.replace(/\s+/g, '');
            let bestExact = null;
            let partialMatch = null;

            // Pass 1: Exact match (with data priority)
            for (let i = 0; i < perfData.length; i++) {
                let cellVal = String(perfData[i][0] || "").trim();
                let cleanV = cellVal.replace(/\s+/g, '');
                if (cellVal === keyword || cleanV === cleanK) {
                    const rowVals = Array.from({ length: 14 }, (_, idx) => {
                        let vStr = String(perfData[i][idx + 1] || "").replace(/,/g, '').trim();
                        if (vStr === '-' || vStr === '') return 0;
                        let v = parseFloat(vStr);
                        return isNaN(v) ? 0 : v;
                    });
                    const hasData = rowVals.some(v => v !== 0);
                    if (!bestExact || (!bestExact.hasData && hasData)) {
                        bestExact = { vals: rowVals, hasData: hasData };
                    }
                    if (hasData) return rowVals;
                }
            }
            if (bestExact) return bestExact.vals;

            // Pass 2: Partial match
            for (let i = 0; i < perfData.length; i++) {
                let cellVal = String(perfData[i][0] || "").trim();
                if (cellVal.includes(keyword)) {
                    const rowVals = Array.from({ length: 14 }, (_, idx) => {
                        let vStr = String(perfData[i][idx + 1] || "").replace(/,/g, '').trim();
                        if (vStr === '-' || vStr === '') return 0;
                        let v = parseFloat(vStr);
                        return isNaN(v) ? 0 : v;
                    });
                    const hasData = rowVals.some(v => v !== 0);
                    if (!partialMatch || (!partialMatch.hasData && hasData)) {
                        partialMatch = { vals: rowVals, hasData: hasData };
                    }
                }
            }
            return partialMatch ? partialMatch.vals : Array(14).fill(0);
        };

        const getPerfReportSeries = (keyword) => {
            let s = getPerfSeries(keyword);
            if (s.every(v => v === 0)) {
                if (keyword.includes('รายรับสูง(ต่ำกว่า)รายจ่าย')) {
                    let inc = getPerfReportSeries('รวมรายรับ');
                    let exp = getPerfReportSeries('รวมรายจ่าย');
                    return inc.map((v, i) => v - exp[i]);
                }
                if (keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                    let net = getPerfReportSeries('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ');
                    let carry = getPerfSeries('บวกเงินคงเหลือสะสมยกมา');
                    return net.map((v, i) => v + (carry[i] || 0));
                }
                if (keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                    let total1 = getPerfReportSeries('เงินคงเหลือทั้งสิ้น(1)');
                    let h4 = getPerfSeries('หักเงินกองทุนรอการจัดสรร(4)');
                    let h5 = getPerfSeries('หักภาระผูกพัน(5)');
                    return total1.map((v, i) => v - (h4[i] || 0) - (h5[i] || 0));
                }
                if (keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                    let cash = getPerfSeries('เงินสด');
                    let klang = getPerfSeries('เงินฝากคลัง');
                    let p1 = getPerfSeries('ประเภทประจำ');
                    let p2 = getPerfSeries('ประเภทออมทรัพย์');
                    let p3 = getPerfSeries('ประเภทกระแสรายวัน');
                    return cash.map((v, i) => (v || 0) + (klang[i] || 0) + (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0));
                }
            }
            return s;
        };

        if (updateUI) {
            renderPerformanceTable(getPerfReportSeries);
        }
    }

    function renderPerformanceTable(getData) {
        const container = document.getElementById('performance-table-container');
        if (!container) return;
        container.innerHTML = '';

        const reportRows = [
            { label: 'รายรับ', type: 'header', cat: 'income' },
            { label: 'รายรับจากการดำเนินงาน', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', keyword: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', keyword: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', keyword: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', keyword: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', keyword: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', keyword: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', keyword: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับเงินช่วยเหลือ', keyword: 'รายรับเงินช่วยเหลือ', indent: 2, cat: 'income' },
            { label: 'รายรับเงินอุดหนุน', keyword: 'รายรับเงินอุดหนุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากการบริจาค', keyword: 'รายรับจากการบริจาค', indent: 2, cat: 'income' },
            { label: 'รายรับดอกเบี้ยเงินฝากธนาคาร', keyword: 'รายรับดอกเบี้ยเงินฝากธนาคาร', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', keyword: 'รายรับอื่น', indent: 2, cat: 'income' },
            { label: 'รวมรายรับ', keyword: 'รวมรายรับ', type: 'total', cat: 'income' },
            { label: 'รายจ่าย', type: 'header', cat: 'expense' },
            { label: 'รายจ่ายบุคลากร', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', keyword: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', indent: 2, cat: 'expense' },
            { label: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', keyword: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', keyword: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', keyword: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', keyword: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', keyword: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', indent: 2, cat: 'expense' },
            { label: 'เงินเพิ่ม (พ.ต.ส)', keyword: 'เงินเพิ่ม (พ.ต.ส)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนอื่น', keyword: 'ค่าตอบแทนอื่น', indent: 2, cat: 'expense' },
            { label: 'เงินค่าใช้จ่ายบุคลากรอื่น', keyword: 'เงินค่าใช้จ่ายบุคลากรอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายจากการดำเนินงาน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่ายา', keyword: 'ค่ายา', indent: 2, cat: 'expense' },
            { label: 'ค่าเวชภัณฑ์มิใช่ยา', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าวัสดุการแพทย์', keyword: 'ค่าวัสดุการแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', keyword: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเภสัช', keyword: 'ค่าวัสดุเภสัช', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุทันตกรรม', keyword: 'ค่าวัสดุทันตกรรม', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเอ็กซเรย์', keyword: 'ค่าวัสดุเอ็กซเรย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุ', keyword: 'ค่าวัสดุ', indent: 2, cat: 'expense' },
            { label: 'ค่าสาธารณูปโภค', keyword: 'ค่าสาธารณูปโภค', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้สอย', keyword: 'ค่าใช้สอย', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้จ่ายดำเนินงานอื่น', keyword: 'ค่าใช้จ่ายดำเนินงานอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายลงทุน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์งบค่าเสื่อม', keyword: 'ค่าครุภัณฑ์งบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบริจาค', keyword: 'ค่าครุภัณฑ์เงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบำรุง', keyword: 'ค่าครุภัณฑ์เงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้าง', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', keyword: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'รายจ่ายอื่น', type: 'header', indent: 1, cat: 'expense' },
            { label: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', keyword: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายอื่นๆ', keyword: 'รายจ่ายอื่นๆ', indent: 2, cat: 'expense' },
            { label: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', keyword: 'งบกลาง', indent: 1, cat: 'expense' },
            { label: 'รวมรายจ่าย', keyword: 'รวมรายจ่าย', type: 'total', cat: 'expense' },
            { label: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', keyword: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', type: 'net', cat: 'net' },
            { label: 'บวกเงินคงเหลือสะสมยกมา', keyword: 'บวกเงินคงเหลือสะสมยกมา', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น(1)', keyword: 'เงินคงเหลือทั้งสิ้น(1)', type: 'total', cat: 'net' },
            { label: 'หักเงินกองทุนรอการจัดสรร(4)', keyword: 'หักเงินกองทุนรอการจัดสรร(4)', type: 'net', cat: 'net' },
            { label: 'หักภาระผูกพัน(5)', keyword: 'หักภาระผูกพัน(5)', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', keyword: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', type: 'total', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น ประกอบด้วย', type: 'header', cat: 'balance' },
            { label: 'เงินสด', keyword: 'เงินสด', indent: 1, cat: 'balance' },
            { label: 'เงินฝากคลัง', keyword: 'เงินฝากคลัง', indent: 1, cat: 'balance' },
            { label: 'เงินฝากธนาคาร', type: 'header', indent: 1, cat: 'balance' },
            { label: 'ประเภทประจำ', keyword: 'ประเภทประจำ', indent: 2, cat: 'balance' },
            { label: 'ประเภทออมทรัพย์', keyword: 'ประเภทออมทรัพย์', indent: 2, cat: 'balance' },
            { label: 'ประเภทกระแสรายวัน', keyword: 'ประเภทกระแสรายวัน', indent: 2, cat: 'balance' },
            { label: 'รวมเงินคงเหลือทั้งสิ้น(2)', keyword: 'รวมเงินคงเหลือทั้งสิ้น(2)', type: 'total', cat: 'balance' }
        ];

        if (window.perfIsAccumulated === undefined) window.perfIsAccumulated = false;
        if (window.perfIsPercent === undefined) window.perfIsPercent = false;
        const months = ['แผน', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'รวม'];

        let controlsHtml = `
            <div class="perf-controls">
                <span style="font-size: 0.9rem; font-weight: 600; color: #475569;">การแสดงผล:</span>
                <div class="perf-toggle-group">
                    <button class="perf-toggle-btn ${!window.perfIsAccumulated ? 'active' : ''}" onclick="window.setPerfMode(false)">รายเดือน</button>
                    <button class="perf-toggle-btn ${window.perfIsAccumulated ? 'active' : ''}" onclick="window.setPerfMode(true)">สะสม</button>
                </div>
                <div class="perf-toggle-group">
                    <button class="perf-toggle-btn ${!window.perfIsPercent ? 'active' : ''}" onclick="window.setPerfView(false)">จำนวนเงิน</button>
                    <button class="perf-toggle-btn ${window.perfIsPercent ? 'active' : ''}" onclick="window.setPerfView(true)">% ของแผน</button>
                </div>
            </div>`;

        window.setPerfMode = (acc) => { window.perfIsAccumulated = acc; renderPerformanceTable(getData); };
        window.setPerfView = (pct) => { window.perfIsPercent = pct; renderPerformanceTable(getData); };

        let tableHtml = `<div class="report-section">
            <h2 style="margin-bottom: 1.5rem;">ตารางสรุปผลการดำเนินงานรายเดือน</h2>
            ${controlsHtml}
            <table class="report-table performance-table" id="perf-main-table">
                <thead>
                    <tr>
                        <th rowspan="2">รายการ</th>
                        <th rowspan="2" class="header-plan">แผน</th>
                        <th colspan="12" class="header-actual">ผลการดำเนินงานจริง (${window.perfIsAccumulated ? 'สะสม' : 'รายเดือน'})</th>
                        <th rowspan="2" class="header-total">รวม</th>
                        <th rowspan="2" class="header-percent" style="background:#f0f9ff; color:#1e40af">% ของแผน</th>
                    </tr>
                    <tr>${months.slice(1, 13).map(m => `<th>${m}</th>`).join('')}</tr>
                </thead>
                <tbody>`;

        reportRows.forEach(row => {
            const rowClass = (row.type === 'header' ? 'group-header' : (row.type === 'total' ? 'total-row' : (row.type === 'net' ? 'net-row' : ''))) + ` cat-${row.cat || 'none'}`;
            const indentClass = row.indent ? `indent-${row.indent}` : '';
            tableHtml += `<tr class="${rowClass}"><td class="row-label ${indentClass}">${row.label}</td>`;

            if (row.keyword) {
                let rawData = getData(row.keyword);
                let plan = rawData[0];
                let displayData = [];
                if (window.perfIsAccumulated) {
                    let runningSum = 0;
                    for (let i = 0; i < 14; i++) {
                        if (i === 0) displayData[0] = rawData[0];
                        else if (i === 13) displayData[13] = runningSum;
                        else { runningSum += rawData[i]; displayData[i] = runningSum; }
                    }
                } else displayData = [...rawData];

                tableHtml += `<td class="num-val">${displayData[0].toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
                for (let i = 1; i <= 12; i++) {
                    let val = displayData[i];
                    let displayStr = window.perfIsPercent && plan > 0 ? ((val / plan) * 100).toFixed(1) + '%' : val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    if (row.type === 'net' && val < 0) tableHtml += `<td class="num-val" style="color:var(--danger)">(${Math.abs(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>`;
                    else tableHtml += `<td class="num-val">${displayStr}</td>`;
                }
                tableHtml += `<td class="num-val" style="font-weight:700">${displayData[13].toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
                let totalPct = plan > 0 ? ((displayData[13] / plan) * 100).toFixed(1) + '%' : '-';
                tableHtml += `<td class="num-val" style="background:#f0f9ff; font-weight:700; color:#1e40af">${totalPct}</td>`;
            } else for (let i = 0; i < 15; i++) tableHtml += `<td></td>`;
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        container.innerHTML = tableHtml;

        // Interactive features

        // Interactive features
        container.querySelector('.performance-table').addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (!cell || cell.tagName === 'TH' || cell.classList.contains('row-label')) return;
            e.stopPropagation();
            const existing = document.querySelector('.cell-toolbar');
            if (existing) { const isSame = existing._cell === cell; existing.remove(); if (isSame) return; }
            const toolbar = document.createElement('div');
            toolbar.className = 'cell-toolbar'; toolbar._cell = cell;
            const r1 = document.createElement('div'); r1.className = 'toolbar-row';
            [{ c: 'hl-yellow', bg: '#fef08a' }, { c: 'hl-green', bg: '#bbf7d0' }, { c: 'hl-red', bg: '#fecaca' }, { c: 'hl-blue', bg: '#bfdbfe' }].forEach(h => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.style.backgroundColor = h.bg;
                b.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); cell.classList.add(h.c); toolbar.remove(); };
                r1.appendChild(b);
            });
            const clr = document.createElement('div'); clr.className = 'toolbar-btn clear'; clr.innerText = '✕';
            clr.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); const s = cell.querySelector('.sticker'); if (s) s.remove(); toolbar.remove(); };
            r1.appendChild(clr); toolbar.appendChild(r1);
            const r2 = document.createElement('div'); r2.className = 'toolbar-row';
            ['👍', '❤️', '✅', '⚠️'].forEach(em => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.innerText = em;
                b.onclick = () => { let s = cell.querySelector('.sticker'); if (!s) { s = document.createElement('span'); s.className = 'sticker'; cell.appendChild(s); } s.innerText = em; toolbar.remove(); };
                r2.appendChild(b);
            });
            toolbar.appendChild(r2); document.body.appendChild(toolbar);
            const rect = cell.getBoundingClientRect();
            toolbar.style.left = `${Math.max(15, rect.left + window.scrollX)}px`; toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
        });

        container.querySelectorAll('.row-label').forEach(labelCell => {
            const labelText = labelCell.innerText.trim();
            const hasDef = !!ACCOUNT_DEFINITIONS[labelText];
            labelCell.addEventListener('mouseenter', () => {
                if (hasDef) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'definition-tooltip'; tooltip.id = 'active-definition-tooltip';
                    tooltip.innerText = ACCOUNT_DEFINITIONS[labelText];
                    document.body.appendChild(tooltip);
                    const rect = labelCell.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX}px`; tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                }
            });
            labelCell.addEventListener('mouseleave', () => { const t = document.getElementById('active-definition-tooltip'); if (t) t.remove(); });
            const rowCfg = reportRows.find(r => r.label === labelText);
            if (rowCfg && rowCfg.keyword) {
                labelCell.style.cursor = 'pointer';
                labelCell.onclick = (e) => {
                    const data = getData(rowCfg.keyword);
                    let color = labelText.includes('รายรับ') ? '#10b981' : '#ef4444';
                    openModalChart(labelText, months, data, color); e.stopPropagation();
                };
            }
        });
    }

    function renderReportTable(years, getSeries) {
        const container = document.getElementById('report-table-container');
        if (!container) return;
        container.innerHTML = '';
        const reportRows = [
            { label: 'รายรับ', type: 'header', cat: 'income' },
            { label: 'รายรับจากการดำเนินงาน', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', keyword: 'รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', keyword: 'รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', keyword: 'รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', keyword: 'รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', keyword: 'รายรับค่ารักษาพยาบาลเบิกจาก อปท.', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', keyword: 'รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', keyword: 'รายรับค่ารักษาพยาบาลแรงงานต่างด้าว', indent: 2, cat: 'income' },
            { label: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', keyword: 'รายรับค่ารักษาพยาบาลและการบริการอื่น', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', type: 'header', indent: 1, cat: 'income' },
            { label: 'รายรับเงินช่วยเหลือ', keyword: 'รายรับเงินช่วยเหลือ', indent: 2, cat: 'income' },
            { label: 'รายรับเงินอุดหนุน', keyword: 'รายรับเงินอุดหนุน', indent: 2, cat: 'income' },
            { label: 'รายรับจากการบริจาค', keyword: 'รายรับจากการบริจาค', indent: 2, cat: 'income' },
            { label: 'รายรับดอกเบี้ยเงินฝากธนาคาร', keyword: 'รายรับดอกเบี้ยเงินฝากธนาคาร', indent: 2, cat: 'income' },
            { label: 'รายรับอื่น', keyword: 'รายรับอื่น', indent: 2, cat: 'income' },
            { label: 'รวมรายรับ', keyword: 'รวมรายรับ', type: 'total', cat: 'income' },
            { label: 'รายจ่าย', type: 'header', cat: 'expense' },
            { label: 'รายจ่ายบุคลากร', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', keyword: 'ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง', indent: 2, cat: 'expense' },
            { label: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', keyword: 'ค่าล่วงเวลางานบริการ / งานสนับสนุน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', keyword: 'ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', keyword: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', keyword: 'ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', keyword: 'ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)', indent: 2, cat: 'expense' },
            { label: 'เงินเพิ่ม (พ.ต.ส)', keyword: 'เงินเพิ่ม (พ.ต.ส)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', keyword: 'ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)', indent: 2, cat: 'expense' },
            { label: 'ค่าตอบแทนอื่น', keyword: 'ค่าตอบแทนอื่น', indent: 2, cat: 'expense' },
            { label: 'เงินค่าใช้จ่ายบุคลากรอื่น', keyword: 'เงินค่าใช้จ่ายบุคลากรอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายจากการดำเนินงาน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่ายา', keyword: 'ค่ายา', indent: 2, cat: 'expense' },
            { label: 'ค่าเวชภัณฑ์มิใช่ยา', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าวัสดุการแพทย์', keyword: 'ค่าวัสดุการแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', keyword: 'ค่าวัสดุวิทยาศาสตร์การแพทย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเภสัช', keyword: 'ค่าวัสดุเภสัช', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุทันตกรรม', keyword: 'ค่าวัสดุทันตกรรม', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุเอ็กซเรย์', keyword: 'ค่าวัสดุเอ็กซเรย์', indent: 3, cat: 'expense' },
            { label: 'ค่าวัสดุ', keyword: 'ค่าวัสดุ', indent: 2, cat: 'expense' },
            { label: 'ค่าสาธารณูปโภค', keyword: 'ค่าสาธารณูปโภค', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้สอย', keyword: 'ค่าใช้สอย', indent: 2, cat: 'expense' },
            { label: 'ค่าใช้จ่ายดำเนินงานอื่น', keyword: 'ค่าใช้จ่ายดำเนินงานอื่น', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายลงทุน', type: 'header', indent: 1, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์งบค่าเสื่อม', keyword: 'ค่าครุภัณฑ์งบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบริจาค', keyword: 'ค่าครุภัณฑ์เงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าครุภัณฑ์เงินบำรุง', keyword: 'ค่าครุภัณฑ์เงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้าง', type: 'header', indent: 2, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', keyword: 'ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค', indent: 3, cat: 'expense' },
            { label: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', keyword: 'ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง', indent: 3, cat: 'expense' },
            { label: 'รายจ่ายอื่น', type: 'header', indent: 1, cat: 'expense' },
            { label: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', keyword: 'รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.', indent: 2, cat: 'expense' },
            { label: 'รายจ่ายอื่นๆ', keyword: 'รายจ่ายอื่นๆ', indent: 2, cat: 'expense' },
            { label: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', keyword: 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)', indent: 1, cat: 'expense' },
            { label: 'รวมรายจ่าย', keyword: 'รวมรายจ่าย', type: 'total', cat: 'expense' },
            { label: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', keyword: 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ', type: 'net', cat: 'net' },
            { label: 'บวกเงินคงเหลือสะสมยกมา', keyword: 'บวกเงินคงเหลือสะสมยกมา', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น(1)', keyword: 'เงินคงเหลือทั้งสิ้น(1)', type: 'total', cat: 'net' },
            { label: 'หักเงินกองทุนรอการจัดสรร(4)', keyword: 'หักเงินกองทุนรอการจัดสรร(4)', type: 'net', cat: 'net' },
            { label: 'หักภาระผูกพัน(5)', keyword: 'หักภาระผูกพัน(5)', type: 'net', cat: 'net' },
            { label: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', keyword: 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)', type: 'total', cat: 'net' },
            { label: 'เงินคงเหลือทั้งสิ้น ประกอบด้วย', type: 'header', cat: 'balance' },
            { label: 'เงินสด', keyword: 'เงินสด', indent: 1, cat: 'balance' },
            { label: 'เงินฝากคลัง', keyword: 'เงินฝากคลัง', indent: 1, cat: 'balance' },
            { label: 'เงินฝากธนาคาร', type: 'header', indent: 1, cat: 'balance' },
            { label: 'ประเภทประจำ', keyword: 'ประเภทประจำ', indent: 2, cat: 'balance' },
            { label: 'ประเภทออมทรัพย์', keyword: 'ประเภทออมทรัพย์', indent: 2, cat: 'balance' },
            { label: 'ประเภทกระแสรายวัน', keyword: 'ประเภทกระแสรายวัน', indent: 2, cat: 'balance' },
            { label: 'รวมเงินคงเหลือทั้งสิ้น(2)', keyword: 'รวมเงินคงเหลือทั้งสิ้น(2)', type: 'total', cat: 'balance' }
        ];

        let tableHtml = `<div class="report-section">
            <h2>ตารางรายงานประมาณการรายรับ-รายจ่าย</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th rowspan="2">รายการ</th>
                        <th colspan="3" class="header-actual">ข้อมูลย้อนหลัง 3 ปีงบประมาณ</th>
                        <th colspan="3" class="header-plan">แผนงบประมาณ</th>
                    </tr>
                    <tr>${years.map((y, i) => `<th class="${i >= 3 ? 'header-plan' : 'header-actual'}">${y}${i >= 3 ? '<br>(แผน)' : ''}</th>`).join('')}</tr>
                </thead>
                <tbody>`;

        reportRows.forEach(row => {
            const rowClass = (row.type === 'header' ? 'group-header' : (row.type === 'total' ? 'total-row' : (row.type === 'net' ? 'net-row' : ''))) + ` cat-${row.cat || 'none'}`;
            const indentClass = row.indent ? `indent-${row.indent}` : '';
            tableHtml += `<tr class="${rowClass}"><td class="row-label ${indentClass}">${row.label}</td>`;

            if (row.keyword) {
                let s = getSeries(row.keyword);
                const gs = (k) => getSeries(k) || [0, 0, 0, 0, 0, 0];
                const tolerance = 1;

                const incomeOpKeys = ["รายรับจากการดำเนินงาน", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น"];
                const incomeOtherKeys = ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"];
                const expensePersonnelKeys = ["รายจ่ายบุคลากร", "ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น"];
                const expenseOpKeys = ["รายจ่ายจากการดำเนินงาน", "ค่ายา", "ค่าเวชภัณฑ์มิใช่ยา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น"];
                const expenseInvestKeys = ["รายจ่ายลงทุน", "ค่าครุภัณฑ์", "ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้าง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง"];
                const expenseOtherKeys = ["รายจ่ายอื่น", "รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ"];
                const balanceCompKeys = ["เงินสด", "เงินฝากคลัง", "ประเภทประจำ", "ประเภทออมทรัพย์", "ประเภทกระแสรายวัน"];

                s.forEach((val, i) => {
                    let displayVal = val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    let isInvalid = false;

                    if (row.keyword === 'รวมรายรับ') {
                        const sum = [...incomeOpKeys, ...incomeOtherKeys].reduce((acc, k) => acc + gs(k)[i], 0);
                        if (Math.abs(sum - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รวมรายจ่าย') {
                        const sum = [...expensePersonnelKeys, ...expenseOpKeys, ...expenseInvestKeys, ...expenseOtherKeys, 'งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)'].reduce((acc, k) => acc + gs(k)[i], 0);
                        if (Math.abs(sum - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ') {
                        const diff = gs('รวมรายรับ')[i] - gs('รวมรายจ่าย')[i];
                        if (Math.abs(diff - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'เงินคงเหลือทั้งสิ้น(1)') {
                        const sum = gs('รายรับสูง(ต่ำกว่า)รายจ่ายสุทธิ')[i] + gs('บวกเงินคงเหลือสะสมยกมา')[i];
                        const matchB2 = Math.abs(gs('รวมเงินคงเหลือทั้งสิ้น(2)')[i] - val) <= tolerance;
                        if (Math.abs(sum - val) > tolerance || !matchB2) isInvalid = true;
                    } else if (row.keyword === 'เงินคงเหลือหลังหักตามข้อ (4) ข้อ(5)') {
                        const calc = gs('เงินคงเหลือทั้งสิ้น(1)')[i] - gs('หักเงินกองทุนรอการจัดสรร(4)')[i] - gs('หักภาระผูกพัน(5)')[i];
                        if (Math.abs(calc - val) > tolerance) isInvalid = true;
                    } else if (row.keyword === 'รวมเงินคงเหลือทั้งสิ้น(2)') {
                        const sum = balanceCompKeys.reduce((acc, k) => acc + gs(k)[i], 0);
                        const matchB1 = Math.abs(gs('เงินคงเหลือทั้งสิ้น(1)')[i] - val) <= tolerance;
                        if (Math.abs(sum - val) > tolerance || !matchB1) isInvalid = true;
                    }

                    const sticker = isInvalid ? '<span class="sticker">⚠️</span>' : '';
                    if (row.type === 'net' && val < 0) tableHtml += `<td class="num-val negative" style="color: var(--danger)">(${Math.abs(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) ${sticker}</td>`;
                    else tableHtml += `<td class="num-val">${displayVal} ${sticker}</td>`;
                });
            } else for (let i = 0; i < 6; i++) tableHtml += `<td></td>`;
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        container.innerHTML = tableHtml;

        container.querySelector('.report-table').addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (!cell || cell.tagName === 'TH' || cell.classList.contains('row-label')) return;
            e.stopPropagation();
            const existing = document.querySelector('.cell-toolbar');
            if (existing) { const isSame = existing._cell === cell; existing.remove(); if (isSame) return; }
            const toolbar = document.createElement('div');
            toolbar.className = 'cell-toolbar'; toolbar._cell = cell;
            const r1 = document.createElement('div'); r1.className = 'toolbar-row';
            [{ c: 'hl-yellow', bg: '#fef08a' }, { c: 'hl-green', bg: '#bbf7d0' }, { c: 'hl-red', bg: '#fecaca' }, { c: 'hl-blue', bg: '#bfdbfe' }].forEach(h => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.style.backgroundColor = h.bg;
                b.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); cell.classList.add(h.c); toolbar.remove(); };
                r1.appendChild(b);
            });
            const clr = document.createElement('div'); clr.className = 'toolbar-btn clear'; clr.innerText = '✕';
            clr.onclick = () => { cell.classList.remove('hl-yellow', 'hl-green', 'hl-red', 'hl-blue'); const s = cell.querySelector('.sticker'); if (s) s.remove(); toolbar.remove(); };
            r1.appendChild(clr); toolbar.appendChild(r1);
            const r2 = document.createElement('div'); r2.className = 'toolbar-row';
            ['👍', '❤️', '✅', '⚠️'].forEach(em => {
                const b = document.createElement('div'); b.className = 'toolbar-btn'; b.innerText = em;
                b.onclick = () => { let s = cell.querySelector('.sticker'); if (!s) { s = document.createElement('span'); s.className = 'sticker'; cell.appendChild(s); } s.innerText = em; toolbar.remove(); };
                r2.appendChild(b);
            });
            toolbar.appendChild(r2); document.body.appendChild(toolbar);
            const rect = cell.getBoundingClientRect();
            toolbar.style.left = `${Math.max(15, rect.left + window.scrollX)}px`; toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
        });

        container.querySelectorAll('.row-label').forEach(labelCell => {
            const labelText = labelCell.innerText.trim();
            const hasDef = !!ACCOUNT_DEFINITIONS[labelText];
            labelCell.addEventListener('mouseenter', () => {
                if (hasDef) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'definition-tooltip'; tooltip.id = 'active-definition-tooltip';
                    tooltip.innerText = ACCOUNT_DEFINITIONS[labelText];
                    document.body.appendChild(tooltip);
                    const rect = labelCell.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX}px`; tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                }
                [incomeBreakdownChart, expenseBreakdownChart].forEach(chart => {
                    if (!chart) return;
                    const normTable = labelText.replace(/\s+/g, '');
                    const idx = chart.data.labels.findIndex(l => (Array.isArray(l) ? l.join('') : l).replace(/\s+/g, '') === normTable);
                    if (idx !== -1) { chart.setActiveElements([{ datasetIndex: 0, index: idx }]); chart.tooltip.setActiveElements([{ datasetIndex: 0, index: idx }], { x: 0, y: 0 }); chart.update(); }
                });
            });
            labelCell.addEventListener('mouseleave', () => {
                const t = document.getElementById('active-definition-tooltip'); if (t) t.remove();
                [incomeBreakdownChart, expenseBreakdownChart].forEach(chart => {
                    if (chart) { chart.setActiveElements([]); chart.tooltip.setActiveElements([], { x: 0, y: 0 }); chart.update(); }
                });
            });
            const rowCfg = reportRows.find(r => r.label === labelText);
            if (rowCfg && rowCfg.keyword) {
                labelCell.style.cursor = 'pointer';
                labelCell.onclick = (e) => {
                    const data = getSeries(rowCfg.keyword);
                    let color = labelText.includes('รายรับ') ? '#10b981' : (labelText.includes('รายจ่าย') || labelText.includes('ค่า') ? '#ef4444' : '#3b82f6');
                    openModalChart(labelText, years, data, color); e.stopPropagation();
                };
            }
        });
    }


    function renderCharts(labels, incomeSeries, expenseSeries, incL, incV, expL, expV) {
        Chart.defaults.font.family = "'Sarabun', sans-serif";
        if (incomeExpenseChart) incomeExpenseChart.destroy();
        if (incomeBreakdownChart) incomeBreakdownChart.destroy();
        if (expenseBreakdownChart) expenseBreakdownChart.destroy();

        const ctxIE = document.getElementById('income-expense-chart').getContext('2d');
        const barLabels = labels.map((l, i) => 'ปี ' + l + (i >= 3 ? ' (แผน)' : ''));
        const updateMain = (type) => {
            if (incomeExpenseChart) incomeExpenseChart.destroy();
            const colorsMain = { income: '#10b981', expense: '#ef4444' };

            incomeExpenseChart = new Chart(ctxIE, {
                type: type,
                data: {
                    labels: barLabels,
                    datasets: [
                        {
                            label: 'รายรับ',
                            data: incomeSeries,
                            type: type,
                            borderColor: colorsMain.income,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea) return null;
                                return type === 'line' ? 'transparent' : incomeSeries.map((_, i) => i >= 3 ? hexToRgba(colorsMain.income, 0.4) : colorsMain.income);
                            },
                            fill: false,
                            borderWidth: 3,
                            tension: 0.3,
                            pointRadius: 5,
                            pointBackgroundColor: incomeSeries.map((_, i) => i >= 3 ? '#fff' : colorsMain.income),
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [5, 5] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(colorsMain.income, 0.5) : colorsMain.income
                            }
                        },
                        {
                            label: 'รายจ่าย',
                            data: expenseSeries,
                            type: type,
                            borderColor: colorsMain.expense,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea) return null;
                                return type === 'line' ? 'transparent' : expenseSeries.map((_, i) => i >= 3 ? hexToRgba(colorsMain.expense, 0.4) : colorsMain.expense);
                            },
                            fill: false,
                            borderWidth: 3,
                            tension: 0.3,
                            pointRadius: 5,
                            pointBackgroundColor: expenseSeries.map((_, i) => i >= 3 ? '#fff' : colorsMain.expense),
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [5, 5] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(colorsMain.expense, 0.5) : colorsMain.expense
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'nearest',
                        axis: 'xy',
                        intersect: false
                    },
                    onHover: (e, el) => {
                        if (el.length > 0) {
                            // Find the actual element being hovered to determine dataset index
                            const chart = incomeExpenseChart;
                            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                            if (points.length > 0) {
                                updateChartOpacity(chart, points[0].datasetIndex, true);
                            }
                        } else {
                            updateChartOpacity(incomeExpenseChart, null);
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { size: 14, weight: '600' } },
                            onHover: (e, legendItem) => {
                                updateChartOpacity(incomeExpenseChart, legendItem.datasetIndex, true);
                            },
                            onLeave: () => {
                                updateChartOpacity(incomeExpenseChart, null);
                            }
                        },
                        tooltip: { bodyFont: { size: 14 }, titleFont: { size: 14 } }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { font: { size: 12 } } },
                        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
                    }
                }
            });
        };
        document.getElementById('toggle-pct').onclick = (e) => {
            showPctMain = !showPctMain;
            e.currentTarget.classList.toggle('active', showPctMain);
            updateMain(incomeExpenseChart.config.data.datasets[0].type);
        };
        updateMain('line');
        document.getElementById('toggle-line').onclick = () => { document.getElementById('toggle-line').classList.add('active'); document.getElementById('toggle-bar').classList.remove('active'); updateMain('line'); };
        document.getElementById('toggle-bar').onclick = () => { document.getElementById('toggle-bar').classList.add('active'); document.getElementById('toggle-line').classList.remove('active'); updateMain('bar'); };

        const colors = [
            '#0ca6e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
            '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b',
            '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#34d399',
            '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80',
            '#2dd4bf', '#818cf8', '#fb7185', '#94a3b8', '#fb923c'
        ];

        // Render a custom HTML legend for sharp, readable text
        const renderLegend = (legendEl, labels, values, chartRef, colorArr) => {
            legendEl.innerHTML = '';
            const total = values.reduce((a, b) => a + b, 0);
            labels.forEach((label, i) => {
                const pct = total > 0 ? ((values[i] / total) * 100).toFixed(1) : '0.0';
                const displayLabel = Array.isArray(label) ? label.join('') : label;
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.dataset.index = i;
                item.innerHTML = `
                    <span class="legend-dot" style="background:${colorArr[i % colorArr.length]}"></span>
                    <span class="legend-label">${displayLabel}</span>
                    <span class="legend-pct">${pct}%</span>`;

                // Hover legend -> highlight chart segment
                item.addEventListener('mouseenter', () => {
                    if (chartRef) {
                        chartRef.setActiveElements([{ datasetIndex: 0, index: i }]);
                        chartRef.tooltip.setActiveElements([{ datasetIndex: 0, index: i }], { x: 0, y: 0 });
                        updateChartOpacity(chartRef, i);
                    }
                    // Also highlight table row
                    document.querySelectorAll('.report-table tr').forEach(r => r.classList.remove('active-row'));
                    const norm = displayLabel.replace(/\s+/g, '');
                    document.querySelectorAll('.report-table tr').forEach(row => {
                        const lc = row.querySelector('.row-label');
                        if (lc && lc.innerText.trim().replace(/\s+/g, '') === norm) row.classList.add('active-row');
                    });
                    legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
                    item.classList.add('highlighted');
                });
                item.addEventListener('mouseleave', () => {
                    if (chartRef) {
                        chartRef.setActiveElements([]);
                        chartRef.tooltip.setActiveElements([], { x: 0, y: 0 });
                        updateChartOpacity(chartRef, null);
                    }
                    document.querySelectorAll('.report-table tr').forEach(r => r.classList.remove('active-row'));
                    item.classList.remove('highlighted');
                });
                legendEl.appendChild(item);
            });
        };

        const onChartHover = (e, el, chart, legendEl) => {
            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
            document.querySelectorAll('.report-table tr').forEach(r => r.classList.remove('active-row'));

            if (el.length > 0) {
                const idx = el[0].index;
                updateChartOpacity(chart, idx);
                const item = legendEl.querySelector(`[data-index="${idx}"]`);
                if (item) item.classList.add('highlighted');
                const label = chart.data.labels[idx];
                const norm = (Array.isArray(label) ? label.join('') : label).replace(/\s+/g, '');
                document.querySelectorAll('.report-table tr').forEach(row => {
                    const lc = row.querySelector('.row-label');
                    if (lc && lc.innerText.trim().replace(/\s+/g, '') === norm) row.classList.add('active-row');
                });
            } else {
                updateChartOpacity(chart, null);
            }
        };

        const incLegendEl = document.getElementById('income-legend');
        const expLegendEl = document.getElementById('expense-legend');

        incomeBreakdownChart = new Chart(document.getElementById('income-breakdown-chart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: incL,
                datasets: [{
                    data: incV,
                    backgroundColor: incV.map((_, i) => colors[i % colors.length]),
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (e, el) => onChartHover(e, el, incomeBreakdownChart, incLegendEl),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { size: 15, family: "'Sarabun', sans-serif" },
                        titleFont: { size: 14, family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: ctx => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return ` ${ctx.parsed.toLocaleString('th-TH')} บาท (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
        renderLegend(incLegendEl, incL, incV, incomeBreakdownChart, colors);

        const expColors = colors.slice().reverse();
        expenseBreakdownChart = new Chart(document.getElementById('expense-breakdown-chart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: expL,
                datasets: [{
                    data: expV,
                    backgroundColor: expV.map((_, i) => expColors[i % expColors.length]),
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (e, el) => onChartHover(e, el, expenseBreakdownChart, expLegendEl),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { size: 15, family: "'Sarabun', sans-serif" },
                        titleFont: { size: 14, family: "'Sarabun', sans-serif" },
                        callbacks: {
                            label: ctx => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return ` ${ctx.parsed.toLocaleString('th-TH')} บาท (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
        renderLegend(expLegendEl, expL, expV, expenseBreakdownChart, expColors);
    }

    function updateBreakdownCompareChart() {
        const planIdx = 3;
        const colors = [
            '#0ca6e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
            '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b',
            '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#34d399',
            '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80',
            '#2dd4bf', '#818cf8', '#fb7185', '#94a3b8', '#fb923c'
        ];

        const getShortName = (h) => {
            const n = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim();
            return n.length > 20 ? n.substring(0, 20) + '...' : n;
        };

        const renderSubChart = (type) => {
            const isIncome = type === 'income';
            const canvasId = isIncome ? 'breakdown-compare-income-bar' : 'breakdown-compare-expense-bar';
            const legendId = isIncome ? 'breakdown-compare-income-legend' : 'breakdown-compare-expense-legend';
            const toggleId = isIncome ? 'toggle-breakdown-income-100' : 'toggle-breakdown-expense-100';
            const is100 = isIncome ? showBreakdownIncome100 : showBreakdownExpense100;
            const isSort = isIncome ? showBreakdownIncomeSort : showBreakdownExpenseSort;

            const chartVar = isIncome ? 'breakdownCompareIncomeChart' : 'breakdownCompareExpenseChart';

            const canvas = document.getElementById(canvasId);
            const legendEl = document.getElementById(legendId);
            const toggle100 = document.getElementById(toggleId);
            const toggleSort = document.getElementById(isIncome ? 'toggle-breakdown-income-sort' : 'toggle-breakdown-expense-sort');

            if (toggle100) {
                toggle100.onchange = (e) => {
                    if (isIncome) showBreakdownIncome100 = e.target.checked;
                    else showBreakdownExpense100 = e.target.checked;
                    updateBreakdownCompareChart();
                };
            }
            if (toggleSort) {
                toggleSort.onchange = (e) => {
                    if (isIncome) showBreakdownIncomeSort = e.target.checked;
                    else showBreakdownExpenseSort = e.target.checked;
                    updateBreakdownCompareChart();
                };
            }
            
            if (!canvas || !legendEl) return;

            // Re-defining groups here for reliability
            const incomeGroups = ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน", "รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท.", "รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม", "รายรับค่ารักษาพยาบาลแรงงานต่างด้าว", "รายรับค่ารักษาพยาบาลและการบริการอื่น", "รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"];
            const expenseGroups = ["ค่าจ้างลูกจ้างชั่วคราว / พนักงานกระทรวง", "ค่าล่วงเวลางานบริการ / งานสนับสนุน", "ค่าตอบแทนการปฏิบัติงานเวรผลัดบ่ายหรือผลัดดึกของเจ้าหน้าที่", "ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติส่วนตัว หรือปฏิบัติงาน รพ.เอกชน", "ค่าตอบแทนเบี้ยเลี้ยงเหมาจ่าย (ฉ.11)", "ค่าตอบแทนตามผลการปฏิบัติงาน (ฉ.12)", "เงินเพิ่ม (พ.ต.ส)", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานของเจ้าหน้าที่ (นอกเวลา) ฉ5", "ค่าตอบแทนเจ้าหน้าที่ปฏิบัติงานในคลินิกพิเศษเฉพาะทางนอกเวลาราชการ (SMC)", "ค่าตอบแทนอื่น", "เงินค่าใช้จ่ายบุคลากรอื่น", "ค่ายา", "ค่าวัสดุการแพทย์", "ค่าวัสดุวิทยาศาสตร์การแพทย์", "ค่าวัสดุเภสัช", "ค่าวัสดุทันตกรรม", "ค่าวัสดุเอ็กซเรย์", "ค่าวัสดุ", "ค่าสาธารณูปโภค", "ค่าใช้สอย", "ค่าใช้จ่ายดำเนินงานอื่น", "ค่าครุภัณฑ์งบค่าเสื่อม", "ค่าครุภัณฑ์เงินบริจาค", "ค่าครุภัณฑ์เงินบำรุง", "ค่าที่ดินและสิ่งก่อสร้างงบค่าเสื่อม", "ค่าที่ดินและสิ่งก่อสร้างเงินบริจาค", "ค่าที่ดินและสิ่งก่อสร้างเงินบำรุง", "รายจ่ายสนับสนุน รพ.สต. รพช. รพท. รพศ. สสอ. สสจ.", "รายจ่ายอื่นๆ", "งบกลาง (ไม่เกินร้อยละ 2-3.5 ของประมาณการรายจ่าย)"];

            const targetCats = isIncome ? incomeGroups : expenseGroups;

            // Sort hospitals by total for this specific chart type (Highest total at the top)
            const hospitals = [...hospitalStore].sort((a, b) => {
                const totalA = targetCats.reduce((sum, cat) => {
                    const s = a.getSeries ? a.getSeries(cat) : [0,0,0,0,0,0];
                    return sum + (s[planIdx] || 0);
                }, 0);
                const totalB = targetCats.reduce((sum, cat) => {
                    const s = b.getSeries ? b.getSeries(cat) : [0,0,0,0,0,0];
                    return sum + (s[planIdx] || 0);
                }, 0);
                return totalB - totalA;
            });
            
            // Filter categories that have data in at least one hospital
            let activeCats = targetCats.filter(cat => {
                return hospitals.some(h => {
                    const s = h.getSeries ? h.getSeries(cat) : [0,0,0,0,0,0];
                    return (s[planIdx] || 0) > 0;
                });
            });

            // Sort categories by total value if sorting is enabled
            if (isSort) {
                activeCats.sort((a, b) => {
                    const sumA = hospitals.reduce((acc, h) => {
                        const s = h.getSeries ? h.getSeries(a) : [0,0,0,0,0,0];
                        return acc + (s[planIdx] || 0);
                    }, 0);
                    const sumB = hospitals.reduce((acc, h) => {
                        const s = h.getSeries ? h.getSeries(b) : [0,0,0,0,0,0];
                        return acc + (s[planIdx] || 0);
                    }, 0);
                    return sumB - sumA;
                });
            }

            const datasets = activeCats.map((cat, i) => {
                const originalIdx = targetCats.indexOf(cat);
                const color = isIncome ? colors[originalIdx % colors.length] : colors.slice().reverse()[originalIdx % colors.length];
                return {
                    label: cat,
                    data: hospitals.map(h => {
                        const s = h.getSeries ? h.getSeries(cat) : [0,0,0,0,0,0];
                        const val = s[planIdx] || 0;
                        if (is100) {
                            let total = 0;
                            targetCats.forEach(c => {
                                const ss = h.getSeries ? h.getSeries(c) : [0,0,0,0,0,0];
                                total += (ss[planIdx] || 0);
                            });
                            return total > 0 ? (val / total) * 100 : 0;
                        }
                        return val;
                    }),
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1
                };
            });

            if (isIncome && breakdownCompareIncomeChart) breakdownCompareIncomeChart.destroy();
            if (!isIncome && breakdownCompareExpenseChart) breakdownCompareExpenseChart.destroy();

            const chart = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: hospitals.map(h => getShortName(h)),
                    datasets: datasets
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    onHover: (e, el) => {
                        if (el.length > 0) {
                            const dsIdx = el[0].datasetIndex;
                            updateChartOpacity(chart, dsIdx, true);
                            // Highlight legend
                            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
                            const legItem = legendEl.querySelector(`[data-index="${dsIdx}"]`);
                            if (legItem) legItem.classList.add('highlighted');
                            
                            // Highlight this category across all hospitals for visual sync
                            const elements = hospitals.map((_, idx) => ({
                                datasetIndex: dsIdx,
                                index: idx
                            }));
                            chart.setActiveElements(elements);
                        } else {
                            updateChartOpacity(chart, null);
                            legendEl.querySelectorAll('.legend-item').forEach(it => it.classList.remove('highlighted'));
                            chart.setActiveElements([]);
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'nearest',
                            intersect: true,
                            callbacks: {
                                label: (ctx) => {
                                    const val = ctx.parsed.x;
                                    if (is100) return ` ${ctx.dataset.label}: ${val.toFixed(1)}%`;
                                    const total = ctx.chart.data.datasets.reduce((sum, ds) => sum + ds.data[ctx.dataIndex], 0);
                                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                    return ` ${ctx.dataset.label}: ${val.toLocaleString('th-TH')} บาท (${pct}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { stacked: true },
                        x: {
                            stacked: true,
                            beginAtZero: true,
                            max: is100 ? 100 : undefined,
                            ticks: {
                                callback: v => is100 ? v + '%' : (v >= 1000000 ? (v/1000000).toFixed(0) + 'M' : v.toLocaleString('th-TH'))
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'hoverLabels',
                    afterDraw: (chart) => {
                        const { ctx } = chart;
                        const activeElements = chart.getActiveElements();
                        if (activeElements.length > 0) {
                            ctx.save();
                            ctx.font = 'bold 11px Sarabun';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            activeElements.forEach(el => {
                                const meta = chart.getDatasetMeta(el.datasetIndex);
                                const element = meta.data[el.index];
                                const val = chart.data.datasets[el.datasetIndex].data[el.index];
                                
                                let text = '';
                                if (is100) {
                                    text = `${val.toFixed(1)}%`;
                                } else {
                                    let total = 0;
                                    chart.data.datasets.forEach(ds => total += ds.data[el.index]);
                                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                                    text = `${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val.toLocaleString('th-TH')} (${pct}%)`;
                                }
                                
                                const x = (element.x + element.base) / 2;
                                const y = element.y;
                                
                                // Always show labels on hover regardless of width
                                const textWidth = ctx.measureText(text).width;
                                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                                ctx.fillRect(x - textWidth/2 - 3, y - 9, textWidth + 6, 18);
                                ctx.fillStyle = '#000';
                                ctx.fillText(text, x, y);
                            });
                            ctx.restore();
                        }
                    }
                }]
            });

            if (isIncome) breakdownCompareIncomeChart = chart;
            else breakdownCompareExpenseChart = chart;

            // Render Legend
            legendEl.innerHTML = '';
            activeCats.forEach((cat, i) => {
                const color = datasets[i].backgroundColor;
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.dataset.index = i;
                item.innerHTML = `
                    <span class="legend-dot" style="background:${color}"></span>
                    <span class="legend-label" title="${cat}">${cat}</span>`;
                
                item.addEventListener('mouseenter', () => {
                    updateChartOpacity(chart, i, true);
                    // Highlight this category across all hospitals
                    const elements = hospitals.map((_, idx) => ({
                        datasetIndex: i,
                        index: idx
                    }));
                    chart.setActiveElements(elements);
                    item.classList.add('highlighted');
                    chart.draw(); // Force draw for plugin
                });
                item.addEventListener('mouseleave', () => {
                    updateChartOpacity(chart, null);
                    chart.setActiveElements([]);
                    item.classList.remove('highlighted');
                });
                legendEl.appendChild(item);
            });

            // Toggle Listener
            const toggle = document.getElementById(toggleId);
            if (toggle && !toggle._hasListener) {
                toggle.onchange = (e) => {
                    if (isIncome) showBreakdownIncome100 = e.target.checked;
                    else showBreakdownExpense100 = e.target.checked;
                    updateBreakdownCompareChart();
                };
                toggle._hasListener = true;
            }
        };

        renderSubChart('income');
        renderSubChart('expense');
    }

    function renderGroupedSubCharts(yearsLabels, groupedData) {
        const container = document.getElementById('grouped-charts-container');
        container.innerHTML = '';
        subChartInstances.forEach(c => c.destroy());
        subChartInstances = [];
        groupedData.forEach(group => {
            let active = group.items.filter(item => item.data.some(v => v > 0));
            if (active.length === 0) return;
            let h = document.createElement('div'); h.className = 'dashboard-header'; h.style.marginTop = '2rem'; h.innerHTML = `<h2>${group.title}</h2>`; container.appendChild(h);
            let g = document.createElement('div'); g.className = 'charts-grid sub-charts-grid'; container.appendChild(g);
            active.forEach((item, idx) => {
                let card = document.createElement('div'); card.className = 'chart-card';
                card.innerHTML = `<h3>${item.label}</h3><div class="chart-wrapper"><canvas></canvas></div>`;
                g.appendChild(card);
                let color = group.type === 'income' ? '#10b981' : '#ef4444';
                card.onclick = () => openModalChart(item.label, yearsLabels, item.data, color);
                let chart = new Chart(card.querySelector('canvas').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: yearsLabels.map(l => 'ปี ' + l),
                        datasets: [{
                            data: item.data,
                            borderColor: color,
                            backgroundColor: (context) => {
                                const { chart } = context;
                                if (!chart.chartArea || !chart.scales.x) return null;
                                const xPixel = chart.scales.x.getPixelForTick(2);
                                const stop = Math.max(0, Math.min(1, (xPixel - chart.chartArea.left) / chart.chartArea.width));
                                const gradient = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
                                gradient.addColorStop(stop, hexToRgba(color, 0.12));
                                gradient.addColorStop(stop, hexToRgba(color, 0.02));
                                return gradient;
                            },
                            fill: true,
                            tension: 0.3,
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [4, 4] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.4) : color
                            }
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { bodyFont: { size: 13 } }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                            x: { ticks: { font: { size: 11 } } }
                        }
                    }
                });
                subChartInstances.push(chart);
            });
        });
    }

    function openModalChart(title, labels, data, color) {
        document.getElementById('modal-chart-title').innerText = title;
        const toggleContainer = document.getElementById('modal-toggles');
        modal.style.display = 'block';
        if (window.modalChartInstance) window.modalChartInstance.destroy();

        // Determine if we are in performance mode (monthly data)
        const isPerformanceSource = labels.length === 14 && labels[0] === 'แผน';
        let currentViewType = isPerformanceSource ? 'performance' : 'trend';
        let currentPerfMode = 'cumulative';

        if (isPerformanceSource) {
            toggleContainer.style.display = 'flex';
            
            const perfSubToggles = document.getElementById('modal-perf-subtoggles');
            const typePerfBtn = document.getElementById('modal-type-performance');
            const typeTrendBtn = document.getElementById('modal-type-trend');
            const showPctBtn = document.getElementById('modal-show-percent');

            // Set initial button states
            typePerfBtn.classList.add('active');
            typeTrendBtn.classList.remove('active');
            perfSubToggles.style.display = 'flex';
            showPctBtn.style.display = 'inline-block';

            const monthsOnly = labels.slice(1, 13);
            const planValue = data[0];
            window.currentPlanValue = planValue; 
            const monthlyData = data.slice(1, 13);
            
            // Find last index with data to prevent flat line at the end
            let lastDataIdx = -1;
            for (let i = monthlyData.length - 1; i >= 0; i--) {
                if (monthlyData[i] !== 0 && monthlyData[i] !== null && monthlyData[i] !== '') {
                    lastDataIdx = i;
                    break;
                }
            }
            const activeMonthlyData = lastDataIdx === -1 ? [] : monthlyData.slice(0, lastDataIdx + 1);

            const cumulativeData = activeMonthlyData.reduce((acc, val) => {
                acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + (val || 0));
                return acc;
            }, []);

            const updateModalChart = () => {
                if (window.modalChartInstance) window.modalChartInstance.destroy();
                
                typePerfBtn.classList.toggle('active', currentViewType === 'performance');
                typeTrendBtn.classList.toggle('active', currentViewType === 'trend');
                perfSubToggles.style.display = currentViewType === 'performance' ? 'flex' : 'none';
                showPctBtn.classList.toggle('active', showPctModal);

                if (currentViewType === 'performance') {
                    document.getElementById('modal-mode-monthly').classList.toggle('active', currentPerfMode === 'monthly');
                    document.getElementById('modal-mode-cumulative').classList.toggle('active', currentPerfMode === 'cumulative');

                    const displayData = currentPerfMode === 'monthly' ? monthlyData : cumulativeData;
                    const datasets = [
                        {
                            label: currentPerfMode === 'monthly' ? 'ผลดำเนินงานรายเดือน' : 'ผลดำเนินงานสะสม',
                            data: displayData,
                            borderColor: color,
                            backgroundColor: hexToRgba(color, 0.15),
                            fill: true,
                            tension: 0.3,
                            pointRadius: 5,
                            borderWidth: 3
                        },
                        {
                            label: 'เป้าหมายแผนรวมปี',
                            data: Array(12).fill(planValue),
                            borderColor: '#94a3b8',
                            borderDash: [10, 5],
                            borderWidth: 2,
                            fill: false,
                            pointRadius: 0
                        }
                    ];

                    window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                        type: 'line',
                        data: { labels: monthsOnly, datasets: datasets },
                        plugins: [dataLabelPlugin],
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: true, position: 'top', labels: { font: { weight: '600' } } },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const val = ctx.parsed.y;
                                            if (ctx.datasetIndex === 1) return ` เป้าหมาย: ${val.toLocaleString('th-TH')} บาท`;
                                            const pct = planValue > 0 ? ` (${((val / planValue) * 100).toFixed(1)}%)` : '';
                                            return ` ${val.toLocaleString('th-TH')} บาท${pct}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'จำนวนเงิน' }, ticks: { font: { size: 12 } } }
                            }
                        }
                    });
                } else {
                    // TREND VIEW (Linear X-Axis for Realistic Proportions)
                    const hospitalObj = hospitalStore[activeHospitalIndex];
                    const trendData = hospitalObj.getReportSeries ? hospitalObj.getReportSeries(title) : hospitalObj.getSeries(title);
                    const years = hospitalObj.yearsLabels;
                    const annualPlan = trendData[3] || planValue;
                    const lastActual = trendData[2]; // Result of the year before current

                    // Helper to format X values: Year 0, 1, 2, 3(Plan), 4, 5
                    // Months of Year 3 (Current) will be at 2.083, 2.167 ... 3.0
                    
                    // Dataset 1: Historical Actuals
                    const historicalActuals = [
                        { x: 0, y: trendData[0] },
                        { x: 1, y: trendData[1] },
                        { x: 2, y: trendData[2] }
                    ];

                    // Dataset 2: Current Year Monthly Results (Accumulated)
                    const monthlyActuals = [
                        { x: 2, y: 0 }, // Start from 0 at the beginning of the year
                        ...cumulativeData.map((v, i) => ({
                            x: 2 + ((i + 1) / 12),
                            y: v
                        }))
                    ];

                    // Dataset 3: Target Plan Line (Connecting previous result to current plan and future)
                    const targetPlan = [
                        { x: 2, y: lastActual },
                        { x: 3, y: annualPlan },
                        { x: 4, y: trendData[4] },
                        { x: 5, y: trendData[5] }
                    ];

                    window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                        type: 'line',
                        data: {
                            datasets: [
                                {
                                    label: 'ผลดำเนินงานจริง (รายปี)',
                                    data: historicalActuals,
                                    borderColor: color,
                                    backgroundColor: hexToRgba(color, 0.1),
                                    fill: true,
                                    tension: 0.3,
                                    pointRadius: 6,
                                    pointBackgroundColor: color,
                                    borderWidth: 3
                                },
                                {
                                    label: 'ผลดำเนินงานจริง (รายเดือนปีปัจจุบัน)',
                                    data: monthlyActuals,
                                    borderColor: color,
                                    backgroundColor: hexToRgba(color, 0.1),
                                    fill: true,
                                    tension: 0.3,
                                    pointRadius: 3,
                                    pointBackgroundColor: '#fff',
                                    borderWidth: 2
                                },
                                {
                                    label: 'เป้าหมายตามแผน (Target)',
                                    data: targetPlan,
                                    borderColor: '#94a3b8',
                                    borderDash: [8, 4],
                                    borderWidth: 2,
                                    fill: false,
                                    pointRadius: 5,
                                    pointBackgroundColor: '#fff',
                                    tension: 0
                                }
                            ]
                        },
                        plugins: [dataLabelPlugin],
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: 'nearest', intersect: false },
                            plugins: {
                                legend: { display: true, position: 'top', labels: { font: { weight: '600' } } },
                                tooltip: {
                                    callbacks: {
                                        title: (items) => {
                                            const x = items[0].parsed.x;
                                            if (Number.isInteger(x)) return 'ปี ' + years[x];
                                            const monthIdx = Math.round((x - 2) * 12) - 1;
                                            if (monthIdx === -1) return 'เริ่มต้นปี ' + years[3];
                                            const monthNames = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
                                            return monthNames[monthIdx] + ' ' + years[3];
                                        },
                                        label: (ctx) => {
                                            const val = ctx.parsed.y;
                                            return ` ${ctx.dataset.label}: ${val.toLocaleString('th-TH')} บาท`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                                x: {
                                    type: 'linear',
                                    min: 0,
                                    max: 5,
                                    ticks: {
                                        stepSize: 1,
                                        callback: (value) => years[value] ? 'ปี ' + years[value] : ''
                                    },
                                    grid: {
                                        display: true,
                                        color: (ctx) => Number.isInteger(ctx.tick.value) ? '#cbd5e1' : 'transparent'
                                    }
                                }
                            }
                        }
                    });
                }
            };

            typePerfBtn.onclick = () => { currentViewType = 'performance'; updateModalChart(); };
            typeTrendBtn.onclick = () => { currentViewType = 'trend'; updateModalChart(); };
            document.getElementById('modal-mode-monthly').onclick = () => { currentPerfMode = 'monthly'; updateModalChart(); };
            document.getElementById('modal-mode-cumulative').onclick = () => { currentPerfMode = 'cumulative'; updateModalChart(); };
            showPctBtn.onclick = () => { showPctModal = !showPctModal; updateModalChart(); };

            updateModalChart();
        } else {
            toggleContainer.style.display = 'none';
            window.modalChartInstance = new Chart(document.getElementById('modal-canvas').getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels.map(l => 'ปี ' + l),
                    datasets: [{
                        label: 'มูลค่า',
                        data: data,
                        borderColor: color,
                        backgroundColor: (context) => {
                            const { chart } = context;
                            if (!chart.chartArea || !chart.scales.x) return null;
                            const xPixel = chart.scales.x.getPixelForTick(2);
                            const stop = Math.max(0, Math.min(1, (xPixel - chart.chartArea.left) / chart.chartArea.width));
                            const gradient = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
                            gradient.addColorStop(stop, hexToRgba(color, 0.15));
                            gradient.addColorStop(stop, hexToRgba(color, 0.03));
                            return gradient;
                        },
                        fill: true,
                        tension: 0.3,
                        pointRadius: 6,
                        segment: {
                            borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                            borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.5) : color
                        }
                    }]
                },
                plugins: [dataLabelPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 14 } } },
                    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                }
            });
        }
    }

    // --- Compare Tab ---
    function renderCompareTab() {
        const selector = document.getElementById('compare-selector');
        const tableContainer = document.getElementById('compare-table-container');
        const compareColors = ['#0ca6e9', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#d946ef', '#eab308', '#14b8a6'];

        // Build hospital buttons (Pill style)
        selector.innerHTML = '';
        hospitalStore.forEach((h, i) => {
            const shortName = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim() || h.name;
            const color = compareColors[i % compareColors.length];
            
            const btn = document.createElement('div');
            const isSelected = !h._compareDisabled;
            btn.className = 'compare-check-item' + (isSelected ? ' selected' : '');
            if (isSelected) btn.style.backgroundColor = color;
            
            btn.innerHTML = `${shortName}`;
            
            btn.addEventListener('click', () => {
                h._compareDisabled = !h._compareDisabled;
                btn.classList.toggle('selected', !h._compareDisabled);
                btn.style.backgroundColor = h._compareDisabled ? '' : color;
                updateMainCompareView();
            });

            // Hover Animation Effect (Using Index for 100% accuracy)
            let hoverInterval = null;
            btn.addEventListener('mouseenter', () => {
                if (!compareMainChartInstance) return;
                // Find dataset that belongs to this hospital's original index
                const dsIdx = compareMainChartInstance.data.datasets.findIndex(ds => ds.hospitalIdx === i);
                if (dsIdx !== -1) {
                    const ds = compareMainChartInstance.data.datasets[dsIdx];
                    ds._originalWidth = ds.borderWidth || 3;
                    ds._originalSegment = ds.segment;
                    ds.segment = null; // Disable segmentation during hover to dash the whole line
                    ds.borderWidth = 8; // Thicker
                    ds.borderDash = [10, 5]; 
                    
                    let offset = 0;
                    hoverInterval = setInterval(() => {
                        offset = (offset + 1) % 30;
                        ds.borderDashOffset = -offset;
                        compareMainChartInstance.update('none');
                    }, 30);
                }
            });

            btn.addEventListener('mouseleave', () => {
                if (hoverInterval) clearInterval(hoverInterval);
                if (!compareMainChartInstance) return;
                
                const dsIdx = compareMainChartInstance.data.datasets.findIndex(ds => ds.hospitalIdx === i);
                if (dsIdx !== -1) {
                    const ds = compareMainChartInstance.data.datasets[dsIdx];
                    ds.borderWidth = ds._originalWidth || 3;
                    ds.segment = ds._originalSegment;
                    ds.borderDash = [];
                    ds.borderDashOffset = 0;
                    compareMainChartInstance.update('none');
                }
            });
            selector.appendChild(btn);
        });

        function getSelectedIndices() {
            return hospitalStore.map((h, i) => h._compareDisabled ? -1 : i).filter(idx => idx !== -1);
        }

        function getShortName(h) {
            const n = h.name.replace(/ประมาณการ.*|แผนรายรับ.*/g, '').trim();
            return n.length > 20 ? n.substring(0, 20) + '...' : n;
        }



        function updateMainCompareView() {
            const keyword = selectedCompareItem;
            if (compareMainChartInstance) { compareMainChartInstance.destroy(); compareMainChartInstance = null; }
            if (!keyword) return;

            const selectedIdx = getSelectedIndices();
            const selectedHospitals = selectedIdx.map(i => hospitalStore[i]).filter(h => h.tIncomes);
            if (selectedHospitals.length === 0) {
                tableContainer.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem">เลือกอย่างน้อย 1 โรงพยาบาลเพื่อเปรียบเทียบ</p>';
                return;
            }

            const titleEl = document.getElementById('compare-dynamic-title');
            if (titleEl) titleEl.textContent = keyword;

            // Sync toggle buttons state
            const valBtn = document.getElementById('toggle-compare-values');
            const growthBtn = document.getElementById('toggle-compare-growth');
            if (valBtn) valBtn.checked = showCompareValues;
            if (growthBtn) growthBtn.checked = showCompareGrowth;

            const ctx = document.getElementById('compare-main-chart').getContext('2d');
            const planIdx = 3;
            const years = selectedHospitals[0].yearsLabels || ['2566','2567','2568','2569','2570','2571'];

            // Handle special overview charts
            if (keyword === '📊 รายรับ-รายจ่าย (ปีแผน)') {
                compareMainChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: selectedHospitals.map(h => getShortName(h)),
                        datasets: [
                            { label: 'รายรับ', data: selectedHospitals.map(h => h.tIncomes[planIdx]), backgroundColor: '#10b981', hospitalIdx: -1 },
                            { label: 'รายจ่าย', data: selectedHospitals.map(h => h.tExpenses[planIdx]), backgroundColor: '#ef4444', hospitalIdx: -1 },
                            { label: 'คงเหลือสุทธิ', data: selectedHospitals.map(h => h.netSeries ? h.netSeries[planIdx] : 0), backgroundColor: '#3b82f6', hospitalIdx: -1 }
                        ]
                    },
                    plugins: [dataLabelPlugin],
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH')} บาท` } } }, scales: { y: { beginAtZero: true } } }
                });
            } else if (keyword === '🥧 สัดส่วนรายได้รายหมวด') {
                const categories = [
                    { label: 'UC', items: ["รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC", "รายรับค่ารักษาพยาบาลสำหรับโครงการสุขภาพถ้วนหน้า UC งบลงทุน"] },
                    { label: 'เบิกจ่ายตรง/รัฐ', items: ["รายรับค่ารักษาพยาบาลเบิกจ่ายตรงกรมบัญชีกลาง", "รายรับค่ารักษาพยาบาลผู้ป่วยเบิกต้นสังกัด", "รายรับค่ารักษาพยาบาลเบิกจาก อปท."] },
                    { label: 'ประกันสังคม', items: ["รายรับค่ารักษาพยาบาลจากกองทุนประกันสังคม"] },
                    { label: 'แรงงานต่างด้าว', items: ["รายรับค่ารักษาพยาบาลแรงงานต่างด้าว"] },
                    { label: 'อื่นๆ/บริการ', items: ["รายรับจากระบบปฏิบัติการฉุกเฉิน (EMS)", "รายรับค่ารักษาพยาบาลและการบริการอื่น"] },
                    { label: 'รายรับอื่น', items: ["รายรับเงินช่วยเหลือ", "รายรับเงินอุดหนุน", "รายรับจากการบริจาค", "รายรับดอกเบี้ยเงินฝากธนาคาร", "รายรับอื่น"] }
                ];
                const chartColors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

                compareMainChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: selectedHospitals.map(h => getShortName(h)),
                        datasets: categories.map((cat, i) => ({
                            label: cat.label,
                            data: selectedHospitals.map(h => {
                                let sum = 0;
                                cat.items.forEach(item => {
                                    const s = h.getSeries ? h.getSeries(item) : [0,0,0,0,0,0];
                                    sum += (s[planIdx] || 0);
                                });
                                return sum;
                            }),
                            backgroundColor: chartColors[i % chartColors.length],
                            hospitalIdx: -1
                        }))
                    },
                    plugins: [dataLabelPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top', labels: { boxWidth: 12, padding: 15 } },
                            tooltip: { 
                                mode: 'index', 
                                intersect: false,
                                callbacks: {
                                    label: (ctx) => {
                                        const datasetLabel = ctx.dataset.label;
                                        const value = ctx.parsed.y;
                                        const total = ctx.chart.data.datasets.reduce((sum, ds) => sum + ds.data[ctx.dataIndex], 0);
                                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                        return ` ${datasetLabel}: ${value.toLocaleString('th-TH')} บาท (${pct}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true },
                            y: { stacked: true, beginAtZero: true, ticks: { callback: v => (v >= 1000000 ? (v/1000000).toFixed(0) + 'M' : v.toLocaleString('th-TH')) } }
                        }
                    }
                });
            } else if (keyword === '📈 เงินคงเหลือสุทธิ (6 ปี)') {
                compareMainChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: { labels: years.map(y => 'ปี ' + y), datasets: selectedHospitals.map((h, idx) => {
                        const color = compareColors[selectedIdx[idx] % compareColors.length];
                        return { 
                            label: getShortName(h), 
                            hospitalIdx: selectedIdx[idx],
                            data: h.netSeries || [0,0,0,0,0,0], 
                            borderColor: color, 
                            backgroundColor: 'transparent', borderWidth: 3, tension: 0.3, pointRadius: 5,
                            segment: {
                                borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                                borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.7) : color
                            }
                        };
                    }) },
                    plugins: [dataLabelPlugin],
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH')} บาท` } } }, scales: { y: { grid: { color: '#f1f5f9' } } } }
                });
            } else {
                // Item-level trend line chart
                compareMainChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: { 
                        labels: years.map(y => 'ปี ' + y), 
                        datasets: selectedHospitals.map((h, idx) => {
                            const color = compareColors[selectedIdx[idx] % compareColors.length];
                            return { 
                                label: getShortName(h), 
                                hospitalIdx: selectedIdx[idx],
                                data: h.getSeries(keyword), 
                                borderColor: color, 
                                backgroundColor: 'transparent', 
                                borderWidth: 3, tension: 0.3, pointRadius: 5, 
                                pointBackgroundColor: color,
                                segment: {
                                    borderDash: ctx => ctx.p1DataIndex >= 3 ? [6, 6] : undefined,
                                    borderColor: ctx => ctx.p1DataIndex >= 3 ? hexToRgba(color, 0.7) : color
                                }
                            };
                        }) 
                    },
                    plugins: [dataLabelPlugin],
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท` } }
                        },
                        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                    }
                });
            }

            // Table removed as per user request
        }

        window._updateItemChart = updateMainCompareView;
        window._updateCompareCharts = updateMainCompareView;

        // Toggles Listeners
        const valBtn = document.getElementById('toggle-compare-values');
        const growthBtn = document.getElementById('toggle-compare-growth');

        if (valBtn) {
            valBtn.onchange = (e) => {
                showCompareValues = e.target.checked;
                if (compareMainChartInstance) compareMainChartInstance.update('none');
            };
        }
        if (growthBtn) {
            growthBtn.onchange = (e) => {
                showCompareGrowth = e.target.checked;
                if (compareMainChartInstance) compareMainChartInstance.update('none');
            };
        }

        updateMainCompareView();
    }

});
