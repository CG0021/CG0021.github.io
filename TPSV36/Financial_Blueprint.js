// Financial Blueprint Logic

let hospitalList = [];
let filteredHospitals = [];
let currentHospital = null;
let currentYear = 2568;
let structureChart = null;

// Multi-hospital selection for Excel comparison
let selectedHospitalsCompare = [];
let uploadedExcelFile = null;
let excelHospitalsMap = {}; // mapping of hospitalCode -> colIndex

// Interactive state variables
let collapsedRows = {}; // track which parent codes are collapsed
let expandedLeafs = {}; // track which leaf codes are expanded for GL inspection
let activeModalChartType = 'line'; // 'line' or 'bar'
let activeChartModalCode = null; // code currently showing in modal
let modalChart = null; // instance of Chart.js in modal
let activeParsedResults = []; // cache parsed results for redrawing table or chart toggle
var excelMonthlyData = {}; // sheetName -> { hospitalCode -> { tbRows, mgtValues } }
var uploadedExcelData = null; // raw excel array buffer for on-demand background parsing
let activeChartShowSubAccounts = false; // toggle breakdown in chart modal
let activeChartStartPeriod = '';
let activeChartEndPeriod = '';
let activeChartShowCumulative = true; // true = cumulative, false = non-cumulative
let excelImportDataType = 'quarterly'; // 'monthly' or 'quarterly'
let hiddenHospitalCodes = new Set(); // Track hidden hospital codes for consistent chart visibility

function parseNumericValue(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    let clean = String(val).trim();
    if (!clean) return 0;
    
    // Check for accounting parentheses negative format, e.g., (1,234.56)
    const isParenthesesNegative = /^\(.*\)$/.test(clean);
    if (isParenthesesNegative) {
        clean = clean.slice(1, -1);
    }
    
    let num = parseFloat(clean.replace(/,/g, '')) || 0;
    return isParenthesesNegative ? -num : num;
}


// Mock database data for comparison (simulates management accounts in the database)
const mockDatabaseData = {
    assets: 28500000.00,
    liabilities: 12000000.00,
    equity: 16500000.00,
    revenue: 45000000.00,
    expenses: 42000000.00,
    netIncome: 30000000.00,
    cash: 5000000.00,
    ar: 8000000.00,
    inventory: 3500000.00,
    ap: 4500000.00
};

// Colors for chart comparison datasets
const comparisonPalette = [
    { fill: 'rgba(14, 165, 233, 0.75)', stroke: '#0ea5e9' },
    { fill: 'rgba(99, 102, 241, 0.75)', stroke: '#6366f1' },
    { fill: 'rgba(16, 185, 129, 0.75)', stroke: '#10b981' },
    { fill: 'rgba(245, 158, 11, 0.75)', stroke: '#f59e0b' },
    { fill: 'rgba(236, 72, 153, 0.75)', stroke: '#ec4899' },
    { fill: 'rgba(168, 85, 247, 0.75)', stroke: '#a855f7' }
];

const MGT_ACCOUNTS_PARENT_MAP = {
    'A1291': ['A119', 'A129'],
    'A119': ['A1111S', 'A11211S', 'A1122S', 'A1131S', 'A118'],
    'A1111S': ['A1111040.20', 'A1111040.3'],
    'A1111040.20': ['A1111010', 'A1111010.1', 'A1111010.2', 'A1111020', 'A1111030', 'A1111040', 'A1111040.1', 'A1111040.2'],
    'A11211S': ['A1121010', 'A1121020', 'A1121021', 'A1121030', 'A1121040', 'A1121050', 'A1121060', 'A1121060.1', 'A1121070', 'A1121080', 'A1121090', 'A1121100', 'A1121110', 'A1121120', 'A1121130', 'A1121140'],
    'A1122S': ['A1122010', 'A1122020', 'A1122030'],
    'A1131S': ['A1131000', 'A1131010', 'A1131020', 'A1131030', 'A1131040'],
    'A118': ['A1141010', 'A1142060', 'A1143020'],
    'A129': ['A1211001', 'A1211010', 'A1211020', 'A1212010', 'A1212020'],

    // กลุ่มหนี้สินและทุน
    'A390': ['A291', 'A32S'],
    'A291': ['A219', 'A29'],
    'A219': ['A2111S', 'A2112S', 'A218'],
    'A2111S': ['A2111010', 'A2111020', 'A2111030', 'A2111031', 'A2111040', 'A2111050', 'A2111060', 'A2111070', 'A2111080', 'A2111090'],
    'A2112S': ['A2112010', 'A2112020', 'A2112030', 'A2112050'],
    'A218': ['A2121030', 'A2121040.1', 'A2122010', 'A2122020', 'A2122021', 'A2122022', 'A2122023', 'A2122024', 'A2123010', 'A2131010', 'A2131011', 'A2132010'],
    'A29': ['A2211020', 'A2212020', 'A2212030'],
    'A32S': ['A3111010', 'A3111020', 'A3211010'],

    // กลุ่มรายได้
    'A49': ['A419S', 'A4201010'],
    'A419S': ['A410S', 'A4121010', 'A4131050.0', 'A413105S', 'A414301S', 'A4153S', 'A4161S', 'A4171010', 'A4191010', 'A4191011', 'A4192010'],
    'A410S': ['A4101040', 'A4101040.1', 'A4101041', 'A4101043', 'A4101080', 'A4102040', 'A4102041', 'A4102050.30', 'A4103040', 'A4103050', 'A4103060', 'A4103070', 'A4103080', 'A4103100', 'A4103101'],
    'A4101040': ['A4100001', 'A4101010', 'A4101020', 'A4101021'],
    'A4101043': ['A4101040.1', 'A4101041', 'A4101042', 'A4101042.1'],
    'A4101080': ['A4101050', 'A4101060', 'A4101061', 'A4101070'],
    'A4102040': ['A4102010', 'A4102020', 'A4102030'],
    'A4102050.30': ['A4102050', 'A4102050.10', 'A4102050.20'],
    'A4131050.0': ['A4131010', 'A4131050'],
    'A4131050': ['A4131020', 'A4131030', 'A4131040'],
    'A413105S': ['A4131050.1', 'A4131050.5'],
    'A4131050.5': ['A4131050.2', 'A4131050.3', 'A4131050.4'],
    'A414301S': ['A4141040', 'A4142010', 'A4143010', 'A4143010.1'],
    'A4141040': ['A4141010', 'A4141020', 'A4141030'],
    'A4153S': ['A4151040', 'A4152010', 'A4153010', 'A4153011'],
    'A4151040': ['A4151010', 'A4151020', 'A4151030'],
    'A4161S': ['A4161040', 'A4161050', 'A4161060'],
    'A4161040': ['A4161010', 'A4161020', 'A4161030'],

    // กลุ่มต้นทุนค่ารักษาพยาบาล
    'A5009D': ['A5009N', 'A5002010', 'A5002020', 'A5002030', 'A501D', 'A501N'],
    'A5009N': ['A5001010', 'A5001020', 'A5001030', 'A5001031', 'A5001040', 'A5001050', 'A5001050.1', 'A5001050.2', 'A5001060', 'A500107070', 'A500108070', 'A500109070', 'A500110070', 'A5001110', 'A5001120', 'A5001130', 'A5001140', 'A5001150', 'A5001160'],

    // กลุ่มค่าใช้จ่ายในการดำเนินงาน
    'A519D': ['A519N', 'A5102010', 'A5102020', 'A5102030', 'A529D', 'A529N'],
    'A519N': ['A5101010', 'A5101020', 'A5101020.1', 'A5101020.2', 'A5101030', 'A510104030', 'A510105030', 'A510106030', 'A510107030', 'A5101090', 'A5101100', 'A5101120', 'A5101130', 'A5101140', 'A5101170', 'A5101190', 'A5101201', 'A5101210', 'A5101240', 'A5101250', 'A5101260', 'A5101261', 'A5101270'],

    // กลุ่มรายได้/ค่าใช้จ่ายอื่น
    'A90S': ['A60SS', 'A9010S'],
    'A60SS': ['A6001020', 'A6001030', 'A6001130', 'A6001140'],
    'A9010S': ['A7001010', 'A7001020', 'A7001030', 'A7001040', 'A7001050', 'A7001060', 'A7001070', 'A7001080', 'A7001090', 'A7001100', 'A7001120', 'A7001121', 'A8001010', 'A9001010'],

    // กลุ่ม EBITDA
    'EBITDA': ['A911S', 'A912S', 'A91D', 'A91N', 'E400S', 'E500S']
};


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    initExcelEvents();
});

function showLoading() { document.getElementById('loading').style.display = 'flex'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }

function showLocalLoading(text) {
    const spinner = document.getElementById('localSpinner');
    const textEl = document.getElementById('localSpinnerText');
    if (spinner && textEl) {
        textEl.textContent = text;
        spinner.style.display = 'flex';
    }
}

function hideLocalLoading() {
    const spinner = document.getElementById('localSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function initialize() {
    document.getElementById('searchSpinner').style.display = 'block';
    try {
        const hospitalData = window.hospitalData || [];
        const uniqueData = [];
        const seenCodes = new Set();

        for (const item of hospitalData) {
            if (item.c && !seenCodes.has(item.c)) {
                seenCodes.add(item.c);
                uniqueData.push(item);
            }
        }

        hospitalList = uniqueData;
        filteredHospitals = [...hospitalList];
        
        populateFilters();
        document.getElementById('searchInput').disabled = false;
        applyFilters();
    } catch (error) {
        console.error('Error initializing hospital list: ', error);
    } finally {
        document.getElementById('searchSpinner').style.display = 'none';
    }
}

function populateFilters() {
    // Initialize Region Dropdown
    const regions = [...new Set(hospitalList.map(h => h.r))].filter(Boolean).sort((a, b) => Number(a) - Number(b));
    populateSelect('regionFilter', regions, 'เขต ');

    // Initialize Province
    const provinces = [...new Set(hospitalList.map(h => h.p))].filter(Boolean).sort();
    populateSelect('provinceFilter', provinces);

    // Initialize Group
    const groups = [...new Set(hospitalList.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);



    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const searchInputGroup = e.target.closest('.search-input-group');
        const suggestionsDiv = document.getElementById('suggestions');
        if (!searchInputGroup && suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

function populateSelect(elementId, items, prefix = '') {
    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = '<option value="">ทั้งหมด</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = prefix + item;
        select.appendChild(option);
    });
}

function updateRegionDependents() {
    const regionValue = document.getElementById('regionFilter').value;
    const provinceSelect = document.getElementById('provinceFilter');
    const groupSelect = document.getElementById('groupFilter');

    provinceSelect.value = "";
    groupSelect.value = "";

    let availableHospitals = hospitalList;
    if (regionValue) {
        availableHospitals = hospitalList.filter(h => String(h.r) === regionValue);
    }

    const provinces = [...new Set(availableHospitals.map(h => h.p))].filter(Boolean).sort();
    populateSelect('provinceFilter', provinces);

    const groups = [...new Set(availableHospitals.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);

    applyFilters();
}

function updateProvinceDependents() {
    const regionValue = document.getElementById('regionFilter').value;
    const provinceValue = document.getElementById('provinceFilter').value;
    const groupSelect = document.getElementById('groupFilter');

    groupSelect.value = "";

    let availableHospitals = hospitalList;
    if (regionValue) {
        availableHospitals = availableHospitals.filter(h => String(h.r) === regionValue);
    }
    if (provinceValue) {
        availableHospitals = availableHospitals.filter(h => h.p === provinceValue);
    }

    const groups = [...new Set(availableHospitals.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);

    applyFilters();
}

function applyFilters() {
    const regionValue = document.getElementById('regionFilter').value;
    const provinceValue = document.getElementById('provinceFilter').value;
    const groupValue = document.getElementById('groupFilter').value;
    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    filteredHospitals = hospitalList.filter(h => {
        if (regionValue && String(h.r) !== regionValue) return false;
        if (provinceValue && h.p !== provinceValue) return false;
        if (groupValue && h.serviceLevelGroup !== groupValue) return false;
        if (query && !(h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query))) return false;
        return true;
    });
}

function showSuggestions() {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!suggestionsDiv) return;

    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    const suggestionResults = filteredHospitals.filter(h =>
        h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query)
    );

    if (suggestionResults.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 12px; color:#888; text-align:center;">ไม่พบข้อมูล</div>';
        suggestionsDiv.style.display = 'block';
        return;
    }

    const allSelected = suggestionResults.every(h => selectedHospitalsCompare.some(s => s.c === h.c));

    let headerHTML = `
        <div class="suggestion-header">
            <label style="display: flex; align-items: center; gap: 6px; font-weight: 600; cursor: pointer; margin: 0;">
                <input type="checkbox" id="selectAllFilteredCheckbox" ${allSelected ? 'checked' : ''} onchange="toggleSelectAllFiltered(this)" style="cursor: pointer; width: 15px; height: 15px;">
                <span>เลือกทั้งหมดที่กรอง (${suggestionResults.length} รพ.)</span>
            </label>
            <button onclick="closeSuggestionsDropdown()" style="background:none; border:none; color:#0ea5e9; font-weight:700; cursor:pointer; font-size:0.85rem; padding: 2px 6px; border-radius: 4px;">เสร็จสิ้น</button>
        </div>
    `;

    let itemsHTML = suggestionResults.map(h => {
        const isChecked = selectedHospitalsCompare.some(s => s.c === h.c);
        return `
            <div class="suggestion-item" onclick="toggleHospitalSelection('${h.c}')" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
                <input type="checkbox" class="suggestion-checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleHospitalSelection('${h.c}')" style="width: 16px; height: 16px; flex-shrink: 0; margin: 0; pointer-events: none;">
                <span style="font-size: 0.95rem; color: #1e293b; font-weight: 500; flex: 1; text-align: left;">${h.n}</span>
            </div>
        `;
    }).join('');

    suggestionsDiv.innerHTML = headerHTML + '<div style="max-height: 290px; overflow-y: auto;">' + itemsHTML + '</div>';
    suggestionsDiv.style.display = 'block';
}

function toggleHospitalSelection(code) {
    const isSelected = selectedHospitalsCompare.some(s => s.c === code);
    if (isSelected) {
        selectedHospitalsCompare = selectedHospitalsCompare.filter(s => s.c !== code);
    } else {
        const hospital = hospitalList.find(h => h.c === code);
        if (hospital) selectedHospitalsCompare.push(hospital);
    }
    updateChipsUI();
    showSuggestions();
}

function toggleSelectAllFiltered(checkbox) {
    const query = (document.getElementById('searchInput').value || '').toLowerCase();
    const suggestionResults = filteredHospitals.filter(h =>
        h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query)
    );

    if (checkbox.checked) {
        suggestionResults.forEach(h => {
            if (!selectedHospitalsCompare.some(s => s.c === h.c)) {
                selectedHospitalsCompare.push(h);
            }
        });
    } else {
        suggestionResults.forEach(h => {
            selectedHospitalsCompare = selectedHospitalsCompare.filter(s => s.c !== h.c);
        });
    }
    updateChipsUI();
    showSuggestions();
}

function closeSuggestionsDropdown() {
    document.getElementById('suggestions').style.display = 'none';
}

function updateChipsUI() {
    const container = document.getElementById('selectedHospitalsChips');
    if (!container) return;

    container.innerHTML = selectedHospitalsCompare.map(h => `
        <span class="chip">
            <span>${h.n}</span>
            <button onclick="removeSelectedHospital('${h.c}')">✕</button>
        </span>
    `).join('');

    // Toggle button visibility
    const compareBtn = document.getElementById('compareHospitalsBtn');
    if (compareBtn) {
        compareBtn.style.display = selectedHospitalsCompare.length > 0 ? 'inline-block' : 'none';
    }
}

function removeSelectedHospital(code) {
    selectedHospitalsCompare = selectedHospitalsCompare.filter(h => h.c !== code);
    updateChipsUI();
    
    // Also update suggestions dropdown if it is currently open
    const suggestionsDiv = document.getElementById('suggestions');
    if (suggestionsDiv && suggestionsDiv.style.display === 'block') {
        showSuggestions();
    }
}

function removeHospitalColumn(code) {
    selectedHospitalsCompare = selectedHospitalsCompare.filter(h => h.c !== code);
    updateChipsUI();
    if (selectedHospitalsCompare.length === 0) {
        document.getElementById('workspaceArea').style.display = 'none';
        document.getElementById('welcomeMessage').style.display = 'block';
    } else {
        activeParsedResults = activeParsedResults.filter(r => r.code !== code);
        renderMultiHospitalsTable(activeParsedResults);
    }
    
    const suggestionsDiv = document.getElementById('suggestions');
    if (suggestionsDiv && suggestionsDiv.style.display === 'block') {
        showSuggestions();
    }
}

// Initialize Excel upload triggers
function initExcelEvents() {
    const excelInput = document.getElementById('excelFileInput');
    const tablePeriodSelect = document.getElementById('tablePeriodSelect');
    const excelInputSidebar = document.getElementById('excelFileInputSidebar');

    const handleFileSelect = (file) => {
        uploadedExcelFile = file;
        excelMonthlyData = {}; // Clear old parsed data for new file
        uploadedExcelData = null; // Clear old raw buffer for new file
        
        // Show filename in UI
        const nameDisplay = document.getElementById('excelFileNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = `ไฟล์: ${uploadedExcelFile.name}`;
            nameDisplay.style.display = 'inline';
        }
        
        // Clear sheets dropdowns to trigger fresh reload
        if (tablePeriodSelect) tablePeriodSelect.innerHTML = '';
        
        readExcelHeaders();
    };

    if (excelInput) {
        excelInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
        });
    }

    if (excelInputSidebar) {
        excelInputSidebar.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
        });
    }

    if (tablePeriodSelect) {
        tablePeriodSelect.addEventListener('change', () => {
            const activeSheetName = tablePeriodSelect.value;
            if (excelMonthlyData[activeSheetName]) {
                updateTableFromSelectedSheet();
            } else if (uploadedExcelFile && uploadedExcelData) {
                // Parse on-demand if the sheet hasn't loaded yet
                showLocalLoading(`กำลังอ่านข้อมูลแผ่นงานหลักด่วน: ${activeSheetName}...`);
                setTimeout(() => {
                    try {
                        const individualWorkbook = XLSX.read(uploadedExcelData, { type: 'array', sheets: [activeSheetName] });
                        const targetSheet = individualWorkbook.Sheets[activeSheetName];
                        if (targetSheet) {
                            const sheetRaw = parseSheetHospitalsData(targetSheet);
                            excelMonthlyData[activeSheetName] = {};
                            selectedHospitalsCompare.forEach(h => {
                                const parsed = sheetRaw[h.c] || { tbRows: [], found: false, colIndex: undefined };
                                const mgtValues = mapTrialBalanceToManagementAccounts(parsed.tbRows);
                                excelMonthlyData[activeSheetName][h.c] = {
                                    tbRows: parsed.tbRows,
                                    mgtValues: mgtValues,
                                    found: parsed.found,
                                    colIndex: parsed.colIndex
                                };
                            });
                            updateTableFromSelectedSheet();
                        }
                        hideLocalLoading();
                    } catch (err) {
                        console.error("On-demand sheet parsing error:", err);
                        hideLocalLoading();
                    }
                }, 50);
            } else {
                readExcelHeaders();
            }
        });
    }
}

function updateTableFromSelectedSheet() {
    const tablePeriodSelect = document.getElementById('tablePeriodSelect');
    if (!tablePeriodSelect) return;
    const activeSheetName = tablePeriodSelect.value;
    if (!activeSheetName || !excelMonthlyData[activeSheetName]) return;
    
    // Instantly load active sheet's parsed results from the monthly cache
    activeParsedResults = selectedHospitalsCompare.map(h => {
        const sheetRes = excelMonthlyData[activeSheetName][h.c] || { tbRows: [], mgtValues: {}, found: false, colIndex: undefined };
        return {
            code: h.c,
            name: h.n,
            colIndex: sheetRes.colIndex,
            found: sheetRes.found,
            tbRows: sheetRes.tbRows || [],
            mgtValues: sheetRes.mgtValues || {},
            dbValues: getManagementAccountsDatabaseValues(),
            loaded: true
        };
    });
    
    renderMultiHospitalsTable(activeParsedResults);
}

function readExcelHeaders() {
    if (!uploadedExcelFile) return;

    showLocalLoading('กำลังดึงรายชื่อชีทและหัวตาราง...');

    const compareBtn = document.getElementById('compareHospitalsBtn');
    if (compareBtn) {
        compareBtn.disabled = true;
        const textSpan = document.getElementById('compareBtnText');
        if (textSpan) textSpan.textContent = ' ⏳ กำลังโหลดหัวตาราง...';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', sheetRows: 4 });
            
            const tablePeriodSelect = document.getElementById('tablePeriodSelect');
            const sheetsGroup = document.getElementById('tablePeriodSelectGroup');

            // Populate sheets list if this is the first load or has been cleared
            if (tablePeriodSelect && (tablePeriodSelect.options.length === 0 || !tablePeriodSelect.value)) {
                const populate = (selectEl, groupEl) => {
                    if (!selectEl) return;
                    selectEl.innerHTML = '';
                    
                    // Filter and sort matching sheets to find the newest one
                    const matching = workbook.SheetNames.filter(name => /^\d+-\d+$/.test(name.trim()));
                    const sortedMatching = [...matching].sort((a, b) => {
                        const partsA = a.trim().split('-');
                        const partsB = b.trim().split('-');
                        const yA = parseInt(partsA[0]), mA = parseInt(partsA[1]);
                        const yB = parseInt(partsB[0]), mB = parseInt(partsB[1]);
                        if (yA !== yB) return yA - yB;
                        return mA - mB;
                    });

                    workbook.SheetNames.forEach(name => {
                        const opt = document.createElement('option');
                        opt.value = name;
                        opt.textContent = name;
                        selectEl.appendChild(opt);
                    });

                    // Select the latest (newest) matching sheet as default (ปัจจุบัน)
                    if (sortedMatching.length > 0) {
                        selectEl.value = sortedMatching[sortedMatching.length - 1];
                    }

                    if (groupEl) groupEl.style.display = 'flex';
                };
                populate(tablePeriodSelect, sheetsGroup);
            }

            const activeSheetName = tablePeriodSelect ? tablePeriodSelect.value : workbook.SheetNames[0];
            const sheet = workbook.Sheets[activeSheetName];

            if (!sheet) {
                throw new Error('ไม่พบข้อมูลแผ่นงาน: ' + activeSheetName);
            }

            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:ZZ4');
            excelHospitalsMap = {};

            // Find hospital code row index dynamically
            let hospitalCodeRowIndex = 2; // Default fallback to Row 3 (r: 2)
            for (let r = 0; r < Math.min(15, range.e.r + 1); r++) {
                for (let c = 0; c <= 1; c++) {
                    const addr = XLSX.utils.encode_cell({ r: r, c: c });
                    const cellVal = sheet[addr] ? String(sheet[addr].v).trim() : '';
                    if (cellVal.includes('รหัสโรงพยาบาล') || cellVal.includes('รหัส รพ') || cellVal.toLowerCase().includes('hospital code')) {
                        hospitalCodeRowIndex = r;
                        break;
                    }
                }
            }

            // Map columns starting from index 2 (Col C)
            for (let c = 2; c <= range.e.c; c++) {
                const codeAddr = XLSX.utils.encode_cell({ r: hospitalCodeRowIndex, c: c });
                const codeVal = sheet[codeAddr] ? String(sheet[codeAddr].v).trim() : '';
                if (codeVal) {
                    excelHospitalsMap[codeVal] = c;
                }
            }

            if (compareBtn) {
                compareBtn.disabled = false;
                const textSpan = document.getElementById('compareBtnText');
                if (textSpan) textSpan.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
            }

            showLocalLoading('หัวตารางโหลดสำเร็จ พร้อมเปรียบเทียบข้อมูล');
            setTimeout(hideLocalLoading, 1500);
        } catch(err) {
            console.error(err);
            if (compareBtn) {
                compareBtn.disabled = false;
                const textSpan = document.getElementById('compareBtnText');
                if (textSpan) textSpan.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
            }
            alert('ไม่สามารถวิเคราะห์หัวตารางจาก Excel ได้: ' + err.message);
            hideLocalLoading();
        }
    };
    reader.readAsArrayBuffer(uploadedExcelFile);
}

// Global helper to normalize account codes for robust matching
function normalizeAcctCode(code) {
    return String(code).replace(/\./g, '').trim();
}

// Map raw Trial Balance rows to management account values
function mapTrialBalanceToManagementAccounts(tbRows) {
    const leafValues = {};
    const allMgtCodes = new Set();

    MGT_ACCOUNTS_MAP.forEach(mgt => {
        allMgtCodes.add(mgt.code);
    });

    Object.keys(MGT_ACCOUNTS_PARENT_MAP).forEach(k => {
        allMgtCodes.add(k);
        MGT_ACCOUNTS_PARENT_MAP[k].forEach(c => allMgtCodes.add(c));
    });

    allMgtCodes.forEach(code => {
        leafValues[code] = 0;
    });

    tbRows.forEach(row => {
        const rowNorm = normalizeAcctCode(row.acctCode);
        if (!rowNorm) return;

        for (let mgt of MGT_ACCOUNTS_MAP) {
            // Map tbCodes to ALL accounts defined in MGT_ACCOUNTS_MAP, including parent levels
            if (mgt.tbCodes) {
                for (let tbCode of mgt.tbCodes) {
                    const tbCodeNorm = normalizeAcctCode(tbCode);
                    if (rowNorm === tbCodeNorm || rowNorm.startsWith(tbCodeNorm)) {
                        leafValues[mgt.code] += row.value;
                        break; // Break the tbCodes loop for this specific management account
                    }
                }
            }
        }
    });

    const memo = {};
    function getVal(code) {
        if (code in memo) return memo[code];
        
        // If explicitly defined in MGT_ACCOUNTS_MAP, use its directly calculated value
        const mgtItem = MGT_ACCOUNTS_MAP.find(m => m.code === code);
        if (mgtItem) {
            memo[code] = leafValues[code] || 0;
            return memo[code];
        }

        // Otherwise sum up recursively from children if it only exists in PARENT_MAP
        if (MGT_ACCOUNTS_PARENT_MAP[code]) {
            let sum = 0;
            MGT_ACCOUNTS_PARENT_MAP[code].forEach(child => {
                sum += getVal(child);
            });
            memo[code] = sum;
            return sum;
        } else {
            return leafValues[code] || 0;
        }
    }

    const finalValues = {};
    allMgtCodes.forEach(code => {
        finalValues[code] = getVal(code);
    });

    return finalValues;
}

// Aggregate Database values (budget field) bottom-up
function getManagementAccountsDatabaseValues() {
    const leafBudgets = {};
    const allMgtCodes = new Set();

    MGT_ACCOUNTS_MAP.forEach(mgt => {
        allMgtCodes.add(mgt.code);
        leafBudgets[mgt.code] = mgt.budget || 0;
    });

    Object.keys(MGT_ACCOUNTS_PARENT_MAP).forEach(k => {
        allMgtCodes.add(k);
        MGT_ACCOUNTS_PARENT_MAP[k].forEach(c => allMgtCodes.add(c));
    });

    const memo = {};
    function getVal(code) {
        if (code in memo) return memo[code];
        
        // If explicitly defined in MGT_ACCOUNTS_MAP, use its own budget directly
        const mgtItem = MGT_ACCOUNTS_MAP.find(m => m.code === code);
        if (mgtItem) {
            memo[code] = leafBudgets[code] || 0;
            return memo[code];
        }

        if (MGT_ACCOUNTS_PARENT_MAP[code]) {
            let sum = 0;
            MGT_ACCOUNTS_PARENT_MAP[code].forEach(child => {
                sum += getVal(child);
            });
            memo[code] = sum;
            return sum;
        } else {
            return leafBudgets[code] || 0;
        }
    }

    const dbValues = {};
    allMgtCodes.forEach(code => {
        dbValues[code] = getVal(code);
    });

    return dbValues;
}

// Compute dynamic level indentation depth for codes
function getAccountLevel(code) {
    let maxDepth = 0;
    function traverse(current, depth) {
        if (depth > maxDepth) maxDepth = depth;
        for (let parent in MGT_ACCOUNTS_PARENT_MAP) {
            if (MGT_ACCOUNTS_PARENT_MAP[parent].includes(current)) {
                traverse(parent, depth + 1);
            }
        }
    }
    traverse(code, 0);
    return maxDepth;
}

// Start Comparison Trigger (Called when compareHospitalsBtn is clicked)
function startComparison() {
    if (selectedHospitalsCompare.length === 0) {
        alert('กรุณาเลือกโรงพยาบาลอย่างน้อย 1 แห่งก่อนทำการวิเคราะห์');
        return;
    }

    const btn = document.getElementById('compareHospitalsBtn');
    const spinner = document.getElementById('compareBtnSpinner');
    const text = document.getElementById('compareBtnText');
    if (btn && spinner && text) {
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        text.textContent = ' กำลังคำนวณข้อมูล...';
    }

    // Immediately show layout & skeletons/loading states
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('workspaceArea').style.display = 'block';

    // Hide sidebar immediately and make container 100% width
    const sidebar = document.getElementById('sidebarCardContainer');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
    const bpContainer = document.querySelector('.blueprint-container');
    if (bpContainer) {
        bpContainer.style.gridTemplateColumns = '1fr';
    }

    const tbody = document.getElementById('comparisonTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #cbd5e1; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 0.5rem;"></div>
                    <div>กำลังเริ่มประมวลผลข้อมูล...</div>
                </td>
            </tr>
        `;
    }

    // Delay processing to allow UI to render first
    setTimeout(() => {
        if (uploadedExcelFile) {
            loadExcelHospitalsData();
        } else {
            alert('กรุณาอัปโหลดไฟล์ Excel ก่อนทำการเปรียบเทียบข้อมูลจริง');
            // Reset button state
            const btn = document.getElementById('compareHospitalsBtn');
            const spinner = document.getElementById('compareBtnSpinner');
            const text = document.getElementById('compareBtnText');
            if (btn && spinner && text) {
                btn.disabled = false;
                spinner.style.display = 'none';
                text.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
            }
        }
    }, 50);
}

function getFiscalMonthIndex(monthNum) {
    const m = parseInt(monthNum);
    if (m >= 10) return m - 10;
    return m + 2;
}

function parseSheetHospitalsData(targetSheet, hospitalsToParse) {
    if (!targetSheet || !targetSheet['!ref']) return {};
    const range = XLSX.utils.decode_range(targetSheet['!ref']);
    const sheetResults = {};
    const targets = hospitalsToParse || selectedHospitalsCompare;

    // Find hospital code row index dynamically
    let hospitalCodeRowIndex = 2; // Default fallback to Row 3 (r: 2)
    for (let r = 0; r < Math.min(15, range.e.r + 1); r++) {
        for (let c = 0; c <= 1; c++) {
            const addr = XLSX.utils.encode_cell({ r: r, c: c });
            const cellVal = targetSheet[addr] ? String(targetSheet[addr].v).trim() : '';
            if (cellVal.includes('รหัสโรงพยาบาล') || cellVal.includes('รหัส รพ') || cellVal.toLowerCase().includes('hospital code')) {
                hospitalCodeRowIndex = r;
                break;
            }
        }
    }

    // Map hospital code -> column index SPECIFIC to this sheet!
    const localHospitalsMap = {};
    for (let c = 2; c <= range.e.c; c++) {
        const codeAddr = XLSX.utils.encode_cell({ r: hospitalCodeRowIndex, c: c });
        const codeVal = targetSheet[codeAddr] ? String(targetSheet[codeAddr].v).trim() : '';
        if (codeVal) {
            localHospitalsMap[codeVal] = c;
        }
    }

    targets.forEach(h => {
        const colIdx = localHospitalsMap[h.c];
        sheetResults[h.c] = {
            tbRows: [],
            found: colIdx !== undefined,
            colIndex: colIdx
        };
    });

    const startDataRow = hospitalCodeRowIndex + 2;

    for (let r = startDataRow; r <= range.e.r; r++) {
        const acctCodeAddr = XLSX.utils.encode_cell({ r: r, c: 0 }); // A
        const acctCode = targetSheet[acctCodeAddr] ? String(targetSheet[acctCodeAddr].v).trim() : '';
        if (!acctCode) continue;

        targets.forEach(h => {
            const resObj = sheetResults[h.c];
            if (!resObj || !resObj.found) return;
            const valAddr = XLSX.utils.encode_cell({ r: r, c: resObj.colIndex });
            const cell = targetSheet[valAddr];
            let numericVal = 0;
            if (cell) {
                numericVal = parseNumericValue(cell.v);
            }
            resObj.tbRows.push({ acctCode: acctCode, value: numericVal });
        });
    }
    return sheetResults;
}

function loadExcelHospitalsData() {
    if (!uploadedExcelFile) return;

    showLocalLoading('กำลังอ่านและประมวลผลข้อมูลเปรียบเทียบ...');

    const tablePeriodSelect = document.getElementById('tablePeriodSelect');
    const activeSheetName = tablePeriodSelect ? tablePeriodSelect.value : '';
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            
            // Read only the sheet names list first (instant, avoids blocking the thread)
            showLocalLoading('กำลังดึงรายชื่อแผ่นงานจากไฟล์ Excel...');
            const workbookNames = XLSX.read(data, { type: 'array', bookSheets: true });
            
            // Intelligent default target sheet matching YYYY-M pattern if none selected
            let targetSheetName = activeSheetName;
            if (!targetSheetName || !/^\d+-\d+$/.test(targetSheetName.trim())) {
                const matching = workbookNames.SheetNames.filter(name => /^\d+-\d+$/.test(name.trim()));
                if (matching.length > 0) {
                    matching.sort((a, b) => {
                        const partsA = a.trim().split('-');
                        const partsB = b.trim().split('-');
                        const yA = parseInt(partsA[0]), mA = parseInt(partsA[1]);
                        const yB = parseInt(partsB[0]), mB = parseInt(partsB[1]);
                        if (yA !== yB) return yA - yB;
                        return mA - mB;
                    });
                    targetSheetName = matching[matching.length - 1]; // select newest matching sheet
                } else {
                    targetSheetName = workbookNames.SheetNames[0];
                }
            }

            // Sync with tablePeriodSelect dropdown if it's unpopulated (race condition protection)
            if (tablePeriodSelect && (tablePeriodSelect.options.length === 0 || !tablePeriodSelect.value)) {
                tablePeriodSelect.innerHTML = '';
                workbookNames.SheetNames.forEach(name => {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    tablePeriodSelect.appendChild(opt);
                });
                tablePeriodSelect.value = targetSheetName;
                const sheetsGroup = document.getElementById('tablePeriodSelectGroup');
                if (sheetsGroup) sheetsGroup.style.display = 'flex';
            }

            // Warn if sheet names have an invalid format
            const invalidSheets = [];
            workbookNames.SheetNames.forEach(name => {
                const cleaned = name.trim();
                if (!/^\d+-\d+$/.test(cleaned) && cleaned !== 'Instructions' && cleaned !== 'ReadMe' && cleaned !== 'Sheet1' && cleaned !== 'Sheet2' && cleaned !== 'Sheet3') {
                    invalidSheets.push(name);
                }
            });
            if (invalidSheets.length > 0) {
                alert('คำเตือน: พบแผ่นงานที่มีชื่อไม่ตรงตามรูปแบบ ปี-เดือน (เช่น 2569-3): ' + invalidSheets.join(', '));
            }

            // Save the data globally for on-demand parsing
            uploadedExcelData = data;

            // Parse all sheets with YYYY-M pattern for trend chart asynchronously with progress
            if (typeof excelMonthlyData === 'undefined' || !excelMonthlyData) {
                excelMonthlyData = {};
            }
            const matchingSheets = workbookNames.SheetNames.filter(name => /^\d+-\d+$/.test(name.trim()));
            
            // Sort descending: newest year/month first
            matchingSheets.sort((a, b) => {
                const partsA = a.trim().split('-');
                const partsB = b.trim().split('-');
                const yA = parseInt(partsA[0]), mA = parseInt(partsA[1]);
                const yB = parseInt(partsB[0]), mB = parseInt(partsB[1]);
                if (yA !== yB) return yB - yA;
                return mB - mA;
            });

            // Move the target active sheet name to the absolute front of the queue to prioritize it
            const targetIndex = matchingSheets.indexOf(targetSheetName);
            if (targetIndex > -1) {
                matchingSheets.splice(targetIndex, 1);
                matchingSheets.unshift(targetSheetName);
            } else {
                // Ensure targetSheetName is always at the front of matchingSheets even if not in the pattern
                matchingSheets.unshift(targetSheetName);
            }

            let sheetIdx = 0;
            const startTime = Date.now();
            let activeSheetProcessed = false;

            function processNextSheet() {
                if (sheetIdx < matchingSheets.length) {
                    const sName = matchingSheets[sheetIdx];
                    
                    // Determine which hospitals are missing for this sheet
                    let missingHospitals = selectedHospitalsCompare;
                    if (excelMonthlyData[sName]) {
                        missingHospitals = selectedHospitalsCompare.filter(h => !excelMonthlyData[sName][h.c]);
                    }

                    // Estimate time remaining and format countdown text
                    let timeRemainingText = '';
                    if (sheetIdx > 0) {
                        const elapsed = Date.now() - startTime;
                        const avgTime = elapsed / sheetIdx;
                        const remaining = (matchingSheets.length - sheetIdx) * avgTime;
                        const remainingSecs = Math.ceil(remaining / 1000);
                        timeRemainingText = ` (อีก ${remainingSecs} วินาที)`;
                    } else {
                        timeRemainingText = ` (กำลังคำนวณเวลา...)`;
                    }

                    // If all hospitals for this sheet are already loaded, skip it!
                    if (missingHospitals.length === 0) {
                        if (sName === targetSheetName) {
                            activeSheetProcessed = true;
                            renderActiveSheetTable(targetSheetName, excelMonthlyData[targetSheetName]);
                        }
                        sheetIdx++;
                        processNextSheet();
                        return;
                    }
                    
                    // Show progress status with estimated remaining seconds
                    if (activeSheetProcessed) {
                        showLocalLoading(`กำลังดาวน์โหลด ${sName} (${sheetIdx + 1}/${matchingSheets.length})${timeRemainingText}..`);
                    } else {
                        showLocalLoading(`กำลังอ่านสรุปแผ่นงานหลัก: ${sName}...`);
                    }
                    
                    setTimeout(() => {
                        try {
                            // Parse only the current sheet to keep it extremely fast and lightweight!
                            const individualWorkbook = XLSX.read(data, { type: 'array', sheets: [sName] });
                            const targetSheet = individualWorkbook.Sheets[sName];
                            const sheetRaw = parseSheetHospitalsData(targetSheet, missingHospitals);
                            
                            if (!excelMonthlyData[sName]) {
                                excelMonthlyData[sName] = {};
                            }
                            
                            missingHospitals.forEach(h => {
                                const parsed = sheetRaw[h.c] || { tbRows: [], found: false, colIndex: undefined };
                                const mgtValues = mapTrialBalanceToManagementAccounts(parsed.tbRows);
                                excelMonthlyData[sName][h.c] = {
                                    tbRows: parsed.tbRows,
                                    mgtValues: mgtValues,
                                    found: parsed.found,
                                    colIndex: parsed.colIndex
                                };
                            });

                            // If this sheet is the target active sheet, display it on the table immediately!
                            if (sName === targetSheetName) {
                                activeSheetProcessed = true;
                                renderActiveSheetTable(targetSheetName, sheetRaw);
                            }

                            // If the chart modal is open, dynamically refresh its period dropdowns and chart!
                            if (activeChartModalCode && document.getElementById('chartModal') && document.getElementById('chartModal').style.display === 'flex') {
                                updateChartPeriodDropdowns();
                                renderModalChart();
                            }

                            sheetIdx++;
                            processNextSheet();
                        } catch (sheetErr) {
                            console.error(`Error parsing sheet ${sName}:`, sheetErr);
                            sheetIdx++;
                            processNextSheet();
                        }
                    }, 30);
                } else {
                    // All sheets finished loading!
                    hideLocalLoading();
                    // Re-enable button & hide spinner if not already done
                    const btn = document.getElementById('compareHospitalsBtn');
                    const spinner = document.getElementById('compareBtnSpinner');
                    const text = document.getElementById('compareBtnText');
                    if (btn && spinner && text) {
                        btn.disabled = false;
                        spinner.style.display = 'none';
                        text.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
                    }
                }
            }

            function renderActiveSheetTable(sheetName, sheetRaw) {
                // Hide sidebar and make blueprint container take full 100% width
                const sidebar = document.getElementById('sidebarCardContainer');
                if (sidebar) {
                    sidebar.style.display = 'none';
                }
                const bpContainer = document.querySelector('.blueprint-container');
                if (bpContainer) {
                    bpContainer.style.gridTemplateColumns = '1fr';
                }

                // Initialize results structure for selected hospitals with loaded state
                activeParsedResults = selectedHospitalsCompare.map(h => {
                    const cached = excelMonthlyData[sheetName] ? excelMonthlyData[sheetName][h.c] : null;
                    const existingActive = activeParsedResults.find(r => r.code === h.c && r.loaded);
                    
                    if (existingActive) {
                        return existingActive;
                    }
                    
                    if (cached && cached.found && cached.mgtValues && Object.keys(cached.mgtValues).length > 0) {
                        return {
                            code: h.c,
                            name: h.n,
                            colIndex: cached.colIndex,
                            found: cached.found,
                            tbRows: cached.tbRows,
                            mgtValues: cached.mgtValues,
                            dbValues: getManagementAccountsDatabaseValues(),
                            loaded: true
                        };
                    }

                    const parsed = cached || (sheetRaw[h.c] || { tbRows: [], found: false, colIndex: undefined });
                    return {
                        code: h.c,
                        name: h.n,
                        colIndex: parsed.colIndex,
                        found: parsed.found,
                        tbRows: parsed.tbRows,
                        mgtValues: {},
                        dbValues: {},
                        loaded: false
                    };
                });

                // 1. Initial render with loading spinners in columns
                renderMultiHospitalsTable(activeParsedResults);

                // 3. Process calculations for each hospital column progressively
                let currentIndex = 0;
                function processNextHospital() {
                    if (currentIndex >= activeParsedResults.length) {
                        // Re-enable compare button once the main active sheet is fully rendered
                        const btn = document.getElementById('compareHospitalsBtn');
                        const spinner = document.getElementById('compareBtnSpinner');
                        const text = document.getElementById('compareBtnText');
                        if (btn && spinner && text) {
                            btn.disabled = false;
                            spinner.style.display = 'none';
                            text.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
                        }
                        return;
                    }

                    const hData = activeParsedResults[currentIndex];
                    if (hData.loaded) {
                        // Already loaded, skip progressive calculation!
                        currentIndex++;
                        processNextHospital();
                        return;
                    }

                    if (hData.found) {
                        // Run heavy mapping calculations
                        hData.mgtValues = mapTrialBalanceToManagementAccounts(hData.tbRows);
                        hData.dbValues = getManagementAccountsDatabaseValues();
                        hData.loaded = true;

                        // Update UI progressively
                        renderMultiHospitalsTable(activeParsedResults);
                    }

                    currentIndex++;
                    setTimeout(processNextHospital, 120);
                }

                // Start progressive calculation queue for hospitals
                processNextHospital();
            }

            // Start parsing sheets progressively
            processNextSheet();

        } catch(err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการประมวลผลข้อมูลเปรียบเทียบ: ' + err.message);
            hideLocalLoading();

            // Re-enable button & hide spinner on error
            const btn = document.getElementById('compareHospitalsBtn');
            const spinner = document.getElementById('compareBtnSpinner');
            const text = document.getElementById('compareBtnText');
            if (btn && spinner && text) {
                btn.disabled = false;
                spinner.style.display = 'none';
                text.textContent = '🔍 เริ่มดึงข้อมูลและเปรียบเทียบ';
            }
        }
    };
    reader.readAsArrayBuffer(uploadedExcelFile);
}

// Collapsible helper: Check if any ancestor is collapsed
function isRowHidden(code) {
    for (let parent in MGT_ACCOUNTS_PARENT_MAP) {
        if (MGT_ACCOUNTS_PARENT_MAP[parent].includes(code)) {
            if (collapsedRows[parent] || isRowHidden(parent)) {
                return true;
            }
        }
    }
    return false;
}

function toggleRowCollapse(code) {
    collapsedRows[code] = !collapsedRows[code];
    renderMultiHospitalsTable(activeParsedResults);
}

function toggleLeafExpand(code, event) {
    event.stopPropagation();
    expandedLeafs[code] = !expandedLeafs[code];
    renderMultiHospitalsTable(activeParsedResults);
}

function renderMultiHospitalsTable(results) {
    const tbody = document.getElementById('comparisonTableBody');
    if (!tbody) return;

    const colCount = results.length;
    const isSingle = (colCount === 1);
    const tableEl = tbody.closest('table');
    
    // Set dynamic equal column widths on the table elements
    const nameColWidth = 350; // pixels for first column
    const dataColWidth = 150; // pixels for data columns
    if (tableEl) {
        tableEl.style.minWidth = isSingle ? '900px' : `${nameColWidth + (colCount * dataColWidth)}px`;
    }

    // Adjust table headers dynamically with exact widths
    const tableHeaderRow = tbody.closest('table').querySelector('thead tr');
    if (tableHeaderRow) {
        if (isSingle) {
            const res = results[0];
            tableHeaderRow.innerHTML = `
                <th style="width: 350px;">รายการวิเคราะห์โครงสร้างงบการเงิน</th>
                <th class="text-right" style="width: 150px;">งบทดลองที่นำเข้า (TB) (${res.name})</th>
                <th class="text-right" style="width: 150px;">ข้อมูลในฐานข้อมูล (Database)</th>
                <th class="text-right" style="width: 150px;">ผลต่าง (Variance)</th>
                <th class="text-right" style="width: 100px;">% ผลต่าง</th>
            `;
        } else {
            let headersHTML = `<th style="width: ${nameColWidth}px;">รายการวิเคราะห์โครงสร้างงบการเงิน</th>`;
            results.forEach(res => {
                headersHTML += `
                    <th class="text-right" style="width: ${dataColWidth}px; position: relative; padding-right: 25px;">
                        ${res.name}
                        <button class="col-close-btn" onclick="removeHospitalColumn('${res.code}')" title="ลบคอลัมน์ออก" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%);">✕</button>
                    </th>
                `;
            });
            tableHeaderRow.innerHTML = headersHTML;
        }
    }

    const mgtOrder = [
        'A1291', 'A119', 'A1111S', 'A1111040.20', 'A1111010', 'A1111010.1', 'A1111010.2', 'A1111020', 'A1111030', 'A1111040', 'A1111040.1', 'A1111040.2', 'A1111040.3', 'A11211S', 'A1121010', 'A1121020', 'A1121021', 'A1121030', 'A1121040', 'A1121050', 'A1121060', 'A1121060.1', 'A1121070', 'A1121080', 'A1121090', 'A1121100', 'A1121110', 'A1121120', 'A1121130', 'A1121140', 'A1122S', 'A1122010', 'A1122020', 'A1122030', 'A1131S', 'A1131000', 'A1131010', 'A1131020', 'A1131030', 'A1131040', 'A118', 'A1141010', 'A1142060', 'A1143020', 'A129', 'A1211001', 'A1211010', 'A1211020', 'A1212010', 'A1212020',
        'A390', 'A291', 'A219', 'A2111S', 'A2111010', 'A2111020', 'A2111030', 'A2111031', 'A2111040', 'A2111050', 'A2111060', 'A2111070', 'A2111080', 'A2111090', 'A2112S', 'A2112010', 'A2112020', 'A2112030', 'A2112050', 'A218', 'A2121030', 'A2121040.1', 'A2122010', 'A2122020', 'A2122021', 'A2122022', 'A2122023', 'A2122024', 'A2123010', 'A2131010', 'A2131011', 'A2132010', 'A29', 'A2211020', 'A2212020', 'A2212030', 'A32S', 'A3111010', 'A3111020', 'A3211010',
        'A49', 'A419S', 'A410S', 'A4101040', 'A4100001', 'A4101010', 'A4101020', 'A4101021', 'A4101040.1', 'A4101041', 'A4101043', 'A4101042', 'A4101042.1', 'A4101080', 'A4101050', 'A4101060', 'A4101061', 'A4101070', 'A4102040', 'A4102010', 'A4102020', 'A4102030', 'A4102041', 'A4102050.30', 'A4102050', 'A4102050.10', 'A4102050.20', 'A4103040', 'A4103050', 'A4103060', 'A4103070', 'A4103080', 'A4103100', 'A4103101', 'A4121010', 'A4131050.0', 'A4131010', 'A4131050', 'A4131020', 'A4131030', 'A4131040', 'A413105S', 'A4131050.1', 'A4131050.5', 'A4131050.2', 'A4131050.3', 'A4131050.4', 'A414301S', 'A4141040', 'A4141010', 'A4141020', 'A4141030', 'A4142010', 'A4143010', 'A4143010.1', 'A4153S', 'A4151040', 'A4151010', 'A4151020', 'A4151030', 'A4152010', 'A4153010', 'A4153011', 'A4161S', 'A4161040', 'A4161010', 'A4161020', 'A4161030', 'A4161050', 'A4161060', 'A4171010', 'A4191010', 'A4191011', 'A4192010', 'A4201010',
        'A5009D', 'A5009N', 'A5001010', 'A5001020', 'A5001030', 'A5001031', 'A5001040', 'A5001050', 'A5001050.1', 'A5001050.2', 'A5001060', 'A500107070', 'A500108070', 'A500109070', 'A500110070', 'A5001110', 'A5001120', 'A5001130', 'A5001140', 'A5001150', 'A5001160', 'A5002010', 'A5002020', 'A5002030', 'A510D', 'A501D', 'A501N',
        'A519D', 'A519N', 'A5101010', 'A5101020', 'A5101020.1', 'A5101020.2', 'A5101030', 'A510104030', 'A510105030', 'A510106030', 'A510107030', 'A5101090', 'A5101100', 'A5101120', 'A5101130', 'A5101140', 'A5101170', 'A5101190', 'A5101201', 'A5101210', 'A5101240', 'A5101250', 'A5101260', 'A5101261', 'A5101270', 'A5102010', 'A5102020', 'A5102030', 'A529D', 'A529N',
        'A90S', 'A60SS', 'A6001020', 'A6001030', 'A6001130', 'A6001140', 'A9010S', 'A7001010', 'A7001020', 'A7001030', 'A7001040', 'A7001050', 'A7001060', 'A7001070', 'A7001080', 'A7001090', 'A7001100', 'A7001120', 'A7001121', 'A8001010', 'A9001010',
        'EBITDA', 'A911S', 'A912S', 'A91D', 'A91N', 'E400S', 'E500S'
    ];

    let rowsHTML = '';
    mgtOrder.forEach(code => {
        if (isRowHidden(code)) return;

        let name = code;
        const mgtItem = MGT_ACCOUNTS_MAP.find(m => m.code === code);
        if (mgtItem) name = mgtItem.name;

        const level = getAccountLevel(code);
        const indent = level * 15;
        const isParent = MGT_ACCOUNTS_PARENT_MAP[code] !== undefined;
        const isCollapsed = collapsedRows[code] === true;
        const isLeafExpanded = expandedLeafs[code] === true;

        let toggleMarkup = '';
        if (isParent) {
            toggleMarkup = `<span class="toggle-icon ${isCollapsed ? 'collapsed' : ''}">▼</span>`;
        } else {
            toggleMarkup = `<span class="toggle-icon ${isLeafExpanded ? '' : 'collapsed'}" onclick="toggleLeafExpand('${code}', event)" style="cursor:pointer;">▼</span>`;
        }

        const chartButton = `<button class="chart-icon-btn" onclick="openChartModal('${code}', event)" title="แสดงกราฟเปรียบเทียบ">📊</button>`;
        const hasTbCodes = mgtItem && mgtItem.tbCodes && mgtItem.tbCodes.length > 0;
        const subAccsToggleBtn = (isParent && hasTbCodes) 
            ? `<button class="sub-accs-toggle-btn" onclick="toggleLeafExpand('${code}', event)" title="แสดง/ซ่อน รหัสบัญชีย่อยในตาราง" style="margin-left: 6px; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; background: ${isLeafExpanded ? '#f1f5f9' : 'white'}; cursor: pointer; font-weight: 600; color: #475569; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">
                <span>📋</span> ${isLeafExpanded ? 'ซ่อนบัญชีย่อย' : 'บัญชีย่อย'}
               </button>`
            : '';

        let labelMarkup = `<td class="${isParent ? 'row-parent' : 'leaf-row'}" style="font-weight: ${isParent ? '600' : 'normal'}; padding-left: ${indent + 10}px;" onclick="${isParent ? `toggleRowCollapse('${code}')` : `toggleLeafExpand('${code}', event)`}">
            ${toggleMarkup}
            ${name} 
            <span style="color:#94a3b8; font-size:0.8rem; font-weight:normal;">(${code})</span>
            ${chartButton}
            ${subAccsToggleBtn}
        </td>`;

        let dataCellsHTML = '';
        if (isSingle) {
            const res = results[0];
            if (!res.loaded) {
                dataCellsHTML += `
                    <td class="text-right"><span class="skeleton skeleton-text" style="width: 70px;"></span></td>
                    <td class="text-right"><span class="skeleton skeleton-text" style="width: 70px;"></span></td>
                    <td class="text-right"><span class="skeleton skeleton-text" style="width: 70px;"></span></td>
                    <td class="text-right"><span class="skeleton skeleton-text" style="width: 50px;"></span></td>
                `;
            } else {
                const tbVal = res.mgtValues[code] || 0;
                const dbVal = res.dbValues[code] || 0;
                const variance = tbVal - dbVal;
                const pctVariance = dbVal !== 0 ? (variance / dbVal) * 100 : 0;
                
                let varClass = 'variance-zero';
                if (variance > 0.01) varClass = 'variance-up';
                else if (variance < -0.01) varClass = 'variance-down';
                
                const pctText = dbVal !== 0 ? `${pctVariance.toFixed(1)}%` : '-';
                
                dataCellsHTML += `
                    <td class="text-right">${tbVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td class="text-right">${dbVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td class="text-right ${varClass}">${variance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td class="text-right ${varClass}">${pctText}</td>
                `;
            }
        } else {
            results.forEach(res => {
                if (!res.loaded) {
                    dataCellsHTML += `<td class="text-right"><span class="skeleton skeleton-text" style="width: 70px;"></span></td>`;
                } else {
                    const tbVal = res.mgtValues[code] || 0;
                    dataCellsHTML += `<td class="text-right">${tbVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
                }
            });
        }

        rowsHTML += `<tr style="background: ${isParent ? '#f8fafc' : 'white'};">${labelMarkup}${dataCellsHTML}</tr>`;

        // Render leaf sub-level breakdown inside actual equal-width columns if expanded
        if (isLeafExpanded && hasTbCodes) {
            mgtItem.tbCodes.forEach(tCode => {
                const tName = (typeof TB_ACCOUNTS_NAMES !== 'undefined' && TB_ACCOUNTS_NAMES[tCode]) || '';
                const displayName = tName ? `└─ ${tName} <span style="color:#94a3b8; font-size:0.75rem; font-weight:normal;">(${tCode})</span>` : `└─ รหัส ${tCode}`;
                const subChartButton = `<button class="chart-icon-btn" onclick="openChartModal('${tCode}', event)" title="แสดงกราฟเปรียบเทียบ">📊</button>`;

                let subCellsHTML = `<td style="padding-left: ${indent + 25}px; color: #64748b; font-size: 0.8rem; font-style: italic; background: #fafafa;">
                    ${displayName} ${subChartButton}
                </td>`;
                
                if (isSingle) {
                    const res = results[0];
                    if (!res.loaded) {
                        subCellsHTML += `
                            <td class="text-right" style="background: #fafafa;"><span class="skeleton skeleton-text" style="width: 55px;"></span></td>
                            <td class="text-right" style="background: #fafafa;"><span class="skeleton skeleton-text" style="width: 55px;"></span></td>
                            <td class="text-right" style="background: #fafafa;"><span class="skeleton skeleton-text" style="width: 55px;"></span></td>
                            <td class="text-right" style="background: #fafafa;"><span class="skeleton skeleton-text" style="width: 40px;"></span></td>
                        `;
                    } else {
                        const rawValObj = res.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(tCode));
                        const rawVal = rawValObj ? rawValObj.value : 0;
                        subCellsHTML += `
                            <td class="text-right" style="color: #64748b; font-size: 0.8rem; background: #fafafa;">${rawVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td class="text-right" style="color: #64748b; font-size: 0.8rem; background: #fafafa;">-</td>
                            <td class="text-right" style="color: #64748b; font-size: 0.8rem; background: #fafafa;">-</td>
                            <td class="text-right" style="color: #64748b; font-size: 0.8rem; background: #fafafa;">-</td>
                        `;
                    }
                } else {
                    results.forEach(res => {
                        if (!res.loaded) {
                            subCellsHTML += `<td class="text-right" style="background: #fafafa;"><span class="skeleton skeleton-text" style="width: 55px;"></span></td>`;
                        } else {
                            const rawValObj = res.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(tCode));
                            const rawVal = rawValObj ? rawValObj.value : 0;
                            subCellsHTML += `<td class="text-right" style="color: #64748b; font-size: 0.8rem; background: #fafafa;">${rawVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
                        }
                    });
                }
                
                rowsHTML += `<tr>${subCellsHTML}</tr>`;
            });
        }
    });

    tbody.innerHTML = rowsHTML;
}

function getReadablePeriodLabel(sheetName) {
    const parts = sheetName.trim().split('-');
    if (parts.length !== 2) return sheetName;
    const y = parts[0]; // e.g. "2569"
    const m = parseInt(parts[1]);
    const monthsAbbr = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${monthsAbbr[m - 1]} ${y}`;
}

function changeChartPeriod() {
    const startSelect = document.getElementById('chartStartPeriod');
    const endSelect = document.getElementById('chartEndPeriod');
    if (startSelect && endSelect) {
        activeChartStartPeriod = startSelect.value;
        activeChartEndPeriod = endSelect.value;
        renderModalChart();
    }
}

function toggleCumulativeChart(checked) {
    activeChartShowCumulative = checked;
    const label = document.getElementById('cumulativeLabelText');
    if (label) {
        label.textContent = checked ? 'แสดงค่าสะสม' : 'แสดงค่าไม่สะสม';
    }
    renderModalChart();
}

function changeExcelImportDataType() {
    const select = document.getElementById('excelImportDataType');
    if (select) {
        excelImportDataType = select.value;
    }
}

// Chart Modal Functions
function openChartModal(code, event) {
    if (event) event.stopPropagation(); // Prevent toggling collapse/expand
    activeChartModalCode = code;
    const mgtItem = MGT_ACCOUNTS_MAP.find(m => m.code === code);
    let title = code;
    if (mgtItem) {
        title = mgtItem.name;
    } else if (typeof TB_ACCOUNTS_NAMES !== 'undefined' && TB_ACCOUNTS_NAMES[code]) {
        title = TB_ACCOUNTS_NAMES[code];
    }

    document.getElementById('modalChartTitle').textContent = `วิเคราะห์แนวโน้ม: ${title}`;
    document.getElementById('modalChartSubtitle').textContent = `รหัส: ${code}`;
    
    // Toggle sub-accounts switch wrapper display
    const hasSubAccs = (MGT_ACCOUNTS_PARENT_MAP[code] !== undefined) || (mgtItem && mgtItem.tbCodes && mgtItem.tbCodes.length > 0);
    const wrapper = document.getElementById('toggleSubAccountsWrapper');
    if (wrapper) {
        wrapper.style.display = hasSubAccs ? 'flex' : 'none';
    }
    const chk = document.getElementById('btnToggleSubAccounts');
    if (chk) {
        chk.checked = activeChartShowSubAccounts;
    }

    const cumChk = document.getElementById('btnToggleCumulative');
    if (cumChk) {
        cumChk.checked = activeChartShowCumulative;
    }
    const cumLabel = document.getElementById('cumulativeLabelText');
    if (cumLabel) {
        cumLabel.textContent = activeChartShowCumulative ? 'แสดงค่าสะสม' : 'แสดงค่าไม่สะสม';
    }

    updateChartPeriodDropdowns();

    document.getElementById('chartModal').style.display = 'flex';
    renderModalChart();
}

function updateChartPeriodDropdowns() {
    if (!activeChartModalCode) return;
    const sortedSheets = Object.keys(excelMonthlyData).sort((a, b) => {
        const partsA = a.trim().split('-');
        const partsB = b.trim().split('-');
        const yA = parseInt(partsA[0]), mA = parseInt(partsA[1]);
        const yB = parseInt(partsB[0]), mB = parseInt(partsB[1]);
        if (yA !== yB) return yA - yB;
        return mA - mB; // Chronological calendar month order
    });

    const periodSelectors = document.getElementById('chartPeriodSelectors');
    if (periodSelectors) {
        if (sortedSheets.length > 0) {
            periodSelectors.style.display = 'flex';
            const startSelect = document.getElementById('chartStartPeriod');
            const endSelect = document.getElementById('chartEndPeriod');
            if (startSelect && endSelect) {
                const prevStart = startSelect.value;
                const prevEnd = endSelect.value;

                // Populate options
                let optionsHTML = sortedSheets.map(s => {
                    const label = getReadablePeriodLabel(s);
                    return `<option value="${s}">${label}</option>`;
                }).join('');
                startSelect.innerHTML = optionsHTML;
                endSelect.innerHTML = optionsHTML;

                // Set initial selection if not already set or invalid
                if (prevStart && sortedSheets.includes(prevStart)) {
                    activeChartStartPeriod = prevStart;
                } else if (!activeChartStartPeriod || !sortedSheets.includes(activeChartStartPeriod)) {
                    activeChartStartPeriod = sortedSheets[0];
                }
                
                if (prevEnd && sortedSheets.includes(prevEnd)) {
                    activeChartEndPeriod = prevEnd;
                } else if (!activeChartEndPeriod || !sortedSheets.includes(activeChartEndPeriod)) {
                    activeChartEndPeriod = sortedSheets[sortedSheets.length - 1];
                }
                
                startSelect.value = activeChartStartPeriod;
                endSelect.value = activeChartEndPeriod;
            }
        } else {
            periodSelectors.style.display = 'none';
            activeChartStartPeriod = '';
            activeChartEndPeriod = '';
        }
    }
}

function closeChartModal(event) {
    if (event && event.target !== document.getElementById('chartModal') && !event.target.classList.contains('chart-modal-close')) {
        return;
    }
    activeChartModalCode = null; // reset modal target on close
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    activeHoveredDatasetIndex = -1;
    document.getElementById('chartModal').style.display = 'none';
    if (modalChart) {
        modalChart.destroy();
        modalChart = null;
    }
}

function switchModalChartType(type) {
    activeModalChartType = type;
    document.getElementById('btnLineChart').classList.toggle('active', type === 'line');
    document.getElementById('btnBarChart').classList.toggle('active', type === 'bar');
    renderModalChart();
}

function toggleSubAccountsChart(checked) {
    activeChartShowSubAccounts = checked;
    renderModalChart();
}

let activeHoveredDatasetIndex = -1;
let dashOffset = 0;
let animationFrameId = null;

function animateDashes() {
    if (activeHoveredDatasetIndex !== -1 && modalChart) {
        dashOffset = (dashOffset - 0.4) % 1000; // Slower crawling dash speed
        const ds = modalChart.data.datasets[activeHoveredDatasetIndex];
        if (ds) {
            ds.borderDash = [10, 6];
            ds.borderDashOffset = dashOffset;
            modalChart.update('none');
        }
        animationFrameId = requestAnimationFrame(animateDashes);
    }
}

function hoverDataset(idx) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    activeHoveredDatasetIndex = idx;
    if (modalChart) {
        modalChart.data.datasets.forEach((ds, i) => {
            const card = document.getElementById(`legend-card-${i}`);
            if (i === idx) {
                card?.classList.add('active-hover');
            } else {
                ds.borderDash = [];
                ds.borderDashOffset = 0;
                card?.classList.remove('active-hover');
            }
        });
    }
    animateDashes();
}

function unhoverDataset() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    activeHoveredDatasetIndex = -1;
    if (modalChart) {
        modalChart.data.datasets.forEach((ds, i) => {
            ds.borderDash = [];
            ds.borderDashOffset = 0;
            const card = document.getElementById(`legend-card-${i}`);
            card?.classList.remove('active-hover');
        });
        modalChart.update('none');
    }
}

function toggleDatasetVisibility(idx) {
    if (!modalChart) return;
    const dataset = modalChart.data.datasets[idx];
    if (!dataset || !dataset.hospitalCode) return;
    const hCode = dataset.hospitalCode;
    
    if (hiddenHospitalCodes.has(hCode)) {
        hiddenHospitalCodes.delete(hCode);
    } else {
        hiddenHospitalCodes.add(hCode);
    }
    
    renderModalChart();
}

function renderModalChart() {
    const ctx = document.getElementById('modalChartCanvas').getContext('2d');
    if (modalChart) {
        modalChart.destroy();
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    activeHoveredDatasetIndex = -1;

    // Sync input data type from select element
    const dataTypeSelect = document.getElementById('excelImportDataType');
    if (dataTypeSelect) {
        excelImportDataType = dataTypeSelect.value;
    }

    // Get sorted sheets list from loaded Excel data
    const sortedSheets = Object.keys(excelMonthlyData).sort((a, b) => {
        const partsA = a.trim().split('-');
        const partsB = b.trim().split('-');
        const yA = parseInt(partsA[0]), mA = parseInt(partsA[1]);
        const yB = parseInt(partsB[0]), mB = parseInt(partsB[1]);
        if (yA !== yB) return yA - yB;
        return mA - mB; // Chronological calendar month order
    });

    // Filter visible sheets based on period selector selection
    let visibleSheets = [...sortedSheets];
    if (activeChartStartPeriod && activeChartEndPeriod) {
        const startIdx = sortedSheets.indexOf(activeChartStartPeriod);
        const endIdx = sortedSheets.indexOf(activeChartEndPeriod);
        if (startIdx !== -1 && endIdx !== -1) {
            visibleSheets = sortedSheets.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
        }
    }

    const hasExcelMonthly = visibleSheets.length > 0;
    
    // Map sheet names to month-only Thai abbreviated labels (e.g. "ม.ค.")
    // Map sheet names to month-only Thai abbreviated labels with year on the second line
    const chartLabels = hasExcelMonthly 
        ? visibleSheets.map(s => {
            const label = getReadablePeriodLabel(s);
            const monthAbbr = label.split(' ')[0];
            const parts = s.trim().split('-'); // YYYY-M format
            const fullYear = parts[0]; // e.g. "2569"
            return [monthAbbr, fullYear]; // Array format creates multi-line ticks in Chart.js
        }) 
        : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    let datasets = [];
    const activeHospitals = activeParsedResults.filter(r => r.loaded);

    // Helper to calculate cumulative vs period (non-cumulative) values
    function getSeriesValues(res, code) {
        // Determine if this code is a management account code (exists in mgtValues)
        // or a raw TB code (needs tbRows lookup)
        function getValueFromSheet(sheetRes, lookupCode) {
            if (!sheetRes) return 0;
            // Always try mgtValues first - mapTrialBalanceToManagementAccounts populates ALL codes
            if (sheetRes.mgtValues && sheetRes.mgtValues[lookupCode] !== undefined) {
                return sheetRes.mgtValues[lookupCode];
            }
            // Fallback to tbRows for raw TB codes
            if (sheetRes.tbRows) {
                const rawValObj = sheetRes.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(lookupCode));
                if (rawValObj) return rawValObj.value;
            }
            return 0;
        }

        if (!hasExcelMonthly) {
            // Simulated data
            let baseVal = 0;
            if (res.mgtValues && res.mgtValues[code] !== undefined) {
                baseVal = res.mgtValues[code];
            } else {
                const rawValObj = res.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(code));
                baseVal = rawValObj ? rawValObj.value : 0;
            }

            const simulatedYTD = [];
            for (let m = 0; m < 12; m++) {
                const seasonal = Math.sin((m / 11) * Math.PI) * 0.15 + 0.925;
                const variance = 1 + (Math.sin(m * 2.3) * 0.04);
                simulatedYTD.push(Math.round((baseVal * (m + 1) / 12) * seasonal * variance));
            }

            const simulatedPeriod = [];
            for (let m = 0; m < 12; m++) {
                if (m === 0) {
                    simulatedPeriod.push(simulatedYTD[0]);
                } else {
                    simulatedPeriod.push(simulatedYTD[m] - simulatedYTD[m - 1]);
                }
            }
            return activeChartShowCumulative ? simulatedYTD : simulatedPeriod;
        }

        // Real data: get raw cumulative values directly from each sheet
        const rawValues = sortedSheets.map(sName => {
            const sheetRes = excelMonthlyData[sName][res.code];
            return getValueFromSheet(sheetRes, code);
        });

        const allYTD = [...rawValues];

        // Helper to find previous period sheet in fiscal cycle
        function getPrevSheetInCycle(year, month, importType) {
            if (importType === 'quarterly') {
                if (month === 12) return null; // Start of cycle (Q1)
                if (month === 3) return `${year - 1}-12`;
                if (month === 6) return `${year}-3`;
                if (month === 9) return `${year}-6`;
            } else { // monthly
                if (month === 10) return null; // Start of cycle (Oct)
                if (month === 1) return `${year - 1}-12`;
                return `${year}-${month - 1}`;
            }
            return null;
        }

        // Compute Period (non-cumulative) values
        const allPeriod = [];
        for (let i = 0; i < sortedSheets.length; i++) {
            const currentSheet = sortedSheets[i];
            const currentVal = rawValues[i];
            const parts = currentSheet.trim().split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);

            const prevSheetName = getPrevSheetInCycle(year, month, excelImportDataType);
            if (prevSheetName) {
                const prevIdx = sortedSheets.indexOf(prevSheetName);
                if (prevIdx !== -1) {
                    allPeriod.push(currentVal - rawValues[prevIdx]);
                } else {
                    // Previous sheet is missing. Per user request:
                    // "กรณีแผ่นงานไตรมาสก่อนหน้าขาดหายไป... ให้แสดงได้แต่ค่าสะสม ค่าไม่สะสม จุดนั้นก็ไม่ต้องแสดง"
                    allPeriod.push(null);
                }
            } else {
                // Start of cycle (Month 12 for quarterly, Month 10 for monthly)
                allPeriod.push(currentVal);
            }
        }

        // Slice data to match visible range
        const finalData = [];
        visibleSheets.forEach(sName => {
            const fullIdx = sortedSheets.indexOf(sName);
            if (fullIdx !== -1) {
                finalData.push(activeChartShowCumulative ? allYTD[fullIdx] : allPeriod[fullIdx]);
            } else {
                finalData.push(0);
            }
        });
        return finalData;
    }

    // List of sub-account codes (either child management accounts or raw TB codes)
    let subCodes = [];
    if (activeChartShowSubAccounts) {
        const mgtItem = MGT_ACCOUNTS_MAP.find(m => m.code === activeChartModalCode);
        if (mgtItem && mgtItem.tbCodes && mgtItem.tbCodes.length > 0) {
            subCodes = [...mgtItem.tbCodes];
        } else if (MGT_ACCOUNTS_PARENT_MAP[activeChartModalCode]) {
            subCodes = [...MGT_ACCOUNTS_PARENT_MAP[activeChartModalCode]];
        }

        // Sort descending based on target hospital values (highest main category value)
        let highestHospital = null;
        let highestVal = -Infinity;
        activeHospitals.forEach(res => {
            let val = 0;
            if (isNaN(Number(activeChartModalCode.replace(/\./g, '')))) {
                val = res.mgtValues[activeChartModalCode] || 0;
            } else {
                const rawValObj = res.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(activeChartModalCode));
                val = rawValObj ? rawValObj.value : 0;
            }
            if (val > highestVal) {
                highestVal = val;
                highestHospital = res;
            }
        });

        if (highestHospital) {
            subCodes.sort((a, b) => {
                let valA = 0;
                let valB = 0;
                
                const childMgtA = MGT_ACCOUNTS_MAP.find(m => m.code === a);
                if (childMgtA) {
                    valA = highestHospital.mgtValues[a] || 0;
                } else {
                    const rawValObj = highestHospital.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(a));
                    valA = rawValObj ? rawValObj.value : 0;
                }

                const childMgtB = MGT_ACCOUNTS_MAP.find(m => m.code === b);
                if (childMgtB) {
                    valB = highestHospital.mgtValues[b] || 0;
                } else {
                    const rawValObj = highestHospital.tbRows.find(r => normalizeAcctCode(r.acctCode) === normalizeAcctCode(b));
                    valB = rawValObj ? rawValObj.value : 0;
                }

                return valB - valA; // Descending order
            });
        }
    }

    if (activeChartShowSubAccounts && subCodes.length > 0) {
        // Build datasets grouped by (hospital, sub-account)
        activeHospitals.forEach((res, hIdx) => {
            const hospitalRGBs = [
                '14, 165, 233',  // Sky Blue
                '99, 102, 241',  // Indigo
                '16, 185, 129',  // Emerald
                '245, 158, 11',   // Amber
                '236, 72, 153',  // Pink
                '168, 85, 247'   // Purple
            ];
            const rgb = hospitalRGBs[hIdx % hospitalRGBs.length];

            subCodes.forEach((subCode, sIdx) => {
                // Determine label name (without code)
                let subName = '';
                const childMgt = MGT_ACCOUNTS_MAP.find(m => m.code === subCode);
                if (childMgt) {
                    subName = childMgt.name;
                } else {
                    const tName = (typeof TB_ACCOUNTS_NAMES !== 'undefined' && TB_ACCOUNTS_NAMES[subCode]) || '';
                    subName = tName || subCode; // Strip code, only show friendly name
                }

                const monthlyData = getSeriesValues(res, subCode);

                // Shaded distinct color variation based on hospital theme palette
                const alphaStroke = 1.0 - (sIdx * 0.18);
                const alphaFill = 0.45 - (sIdx * 0.1);
                const stroke = `rgba(${rgb}, ${Math.max(0.4, alphaStroke)})`;
                const fill = `rgba(${rgb}, ${Math.max(0.1, alphaFill)})`;

                datasets.push({
                    label: `${res.name} - ${subName}`,
                    hospitalCode: res.code,
                    hidden: hiddenHospitalCodes.has(res.code),
                    data: monthlyData,
                    borderColor: stroke,
                    backgroundColor: fill,
                    borderWidth: 2.5,
                    fill: activeModalChartType === 'bar',
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    originalStroke: stroke,
                    originalFill: fill,
                    stack: activeModalChartType === 'bar' ? res.name : undefined // Stack per hospital in bar chart
                });
            });
        });
    } else {
        // Standard view (one line/bar per active hospital)
        activeHospitals.forEach((res, idx) => {
            const monthlyData = getSeriesValues(res, activeChartModalCode);
            const palette = comparisonPalette[idx % comparisonPalette.length];

            datasets.push({
                label: res.name,
                hospitalCode: res.code,
                hidden: hiddenHospitalCodes.has(res.code),
                data: monthlyData,
                borderColor: palette.stroke,
                backgroundColor: palette.fill,
                borderWidth: 3,
                fill: activeModalChartType === 'bar',
                tension: 0.35,
                pointRadius: 5,
                pointHoverRadius: 8,
                originalStroke: palette.stroke,
                originalFill: palette.fill
            });
        });
    }

    // Render sidebar legend dynamically (grouped by sub-account name if checked)
    const sidebarEl = document.getElementById('modalChartSidebar');
    if (sidebarEl) {
        let legendHTML = `<div class="sidebar-legend-title">${activeChartShowSubAccounts ? 'บัญชีย่อย' : 'รายชื่อโรงพยาบาล/ตัวชี้วัด'}</div>`;
        
        if (activeChartShowSubAccounts && subCodes.length > 0) {
            subCodes.forEach((subCode, sIdx) => {
                let subName = '';
                const childMgt = MGT_ACCOUNTS_MAP.find(m => m.code === subCode);
                if (childMgt) {
                    subName = childMgt.name;
                } else {
                    const tName = (typeof TB_ACCOUNTS_NAMES !== 'undefined' && TB_ACCOUNTS_NAMES[subCode]) || '';
                    subName = tName || subCode;
                }

                legendHTML += `
                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin: 0.75rem 0 0.35rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                        ${subName}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                `;

                activeHospitals.forEach((res, hIdx) => {
                    const datasetIdx = (hIdx * subCodes.length) + sIdx;
                    const dataset = datasets[datasetIdx];
                    if (dataset) {
                        const isHidden = hiddenHospitalCodes.has(res.code);
                        const opacity = isHidden ? '0.35' : '1';
                        const textDecoration = isHidden ? 'line-through' : 'none';
                        const background = isHidden ? '#f1f5f9' : 'white';
                        legendHTML += `
                            <div class="legend-card" id="legend-card-${datasetIdx}" 
                                 style="border-left: 4px solid ${dataset.borderColor}; --hospital-color: ${dataset.borderColor}; cursor: pointer; user-select: none; padding: 6px 10px; opacity: ${opacity}; text-decoration: ${textDecoration}; background: ${background};"
                                 onclick="toggleDatasetVisibility(${datasetIdx})"
                                 onmouseenter="hoverDataset(${datasetIdx})"
                                 onmouseleave="unhoverDataset()">
                                <div class="legend-color-dot" style="background: ${dataset.borderColor};"></div>
                                <span style="font-weight: 600; font-size: 0.8rem; color: #475569;">${res.name}</span>
                            </div>
                        `;
                    }
                });

                legendHTML += `</div>`;
            });
        } else {
            // Flat list of active hospitals
            datasets.forEach((dataset, idx) => {
                const isHidden = hiddenHospitalCodes.has(dataset.hospitalCode);
                const opacity = isHidden ? '0.35' : '1';
                const textDecoration = isHidden ? 'line-through' : 'none';
                const background = isHidden ? '#f1f5f9' : 'white';
                legendHTML += `
                    <div class="legend-card" id="legend-card-${idx}" 
                         style="border-left: 4px solid ${dataset.borderColor}; --hospital-color: ${dataset.borderColor}; cursor: pointer; user-select: none; opacity: ${opacity}; text-decoration: ${textDecoration}; background: ${background};"
                         onclick="toggleDatasetVisibility(${idx})"
                         onmouseenter="hoverDataset(${idx})"
                         onmouseleave="unhoverDataset()">
                        <div class="legend-color-dot" style="background: ${dataset.borderColor};"></div>
                        <span style="font-weight: 700; font-size: 0.85rem; color: #334155;">${dataset.label}</span>
                    </div>
                `;
            });
        }
        sidebarEl.innerHTML = legendHTML;
    }

    modalChart = new Chart(ctx, {
        type: activeModalChartType,
        data: {
            labels: chartLabels,
            datasets: datasets
        },
        plugins: [
            {
                id: 'valueLabels',
                afterDatasetsDraw(chart) {
                    const {ctx} = chart;
                    ctx.save();
                    ctx.font = 'bold 9px Sarabun';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    
                    chart.data.datasets.forEach((dataset, i) => {
                        if (!chart.isDatasetVisible(i)) return;
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((element, index) => {
                            const val = dataset.data[index];
                            let formatted = '';
                            if (Math.abs(val) >= 1000000) {
                                formatted = (val / 1000000).toFixed(2) + 'M';
                            } else if (Math.abs(val) >= 1000) {
                                formatted = (val / 1000).toFixed(1) + 'K';
                            } else {
                                formatted = String(val);
                            }
                            ctx.fillStyle = dataset.borderColor;
                            ctx.fillText(formatted, element.x, element.y - 6);
                        });
                    });
                    ctx.restore();
                }
            }
        ],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide standard legend to use our custom sidebar legend
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            onHover: (event, chartElement) => {
                if (!modalChart) return;
                
                if (chartElement.length > 0) {
                    const hoverIdx = chartElement[0].datasetIndex;
                    if (activeHoveredDatasetIndex !== hoverIdx) {
                        hoverDataset(hoverIdx);
                    }
                } else {
                    if (activeHoveredDatasetIndex !== -1) {
                        unhoverDataset();
                    }
                }
            },
            scales: {
                y: {
                    stacked: (activeModalChartType === 'bar' && activeChartShowSubAccounts),
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Sarabun, sans-serif' },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    stacked: (activeModalChartType === 'bar' && activeChartShowSubAccounts),
                    ticks: {
                        font: { family: 'Sarabun, sans-serif' }
                    }
                }
            }
        }
    });
}

// Keep single file CSV paste analyzer updated to cache results for modal charting
function analyzeImportedData() {
    const text = document.getElementById('pasteArea').value.trim();
    if (!text) {
        alert('กรุณาวางข้อมูลงบทดลองหรืออัปโหลดไฟล์ก่อนทำการวิเคราะห์');
        return;
    }

    showLoading();
    
    setTimeout(() => {
        try {
            const lines = text.split('\n');
            let totalDebits = 0;
            let totalCredits = 0;
            const tbRows = [];

            lines.forEach((line) => {
                const parts = line.split(/[,\t]+| {2,}/).map(p => p.trim()).filter(Boolean);
                if (parts.length < 3) return;

                const code = parts[0].replace(/['"]/g, '');
                
                let dr = parseNumericValue(parts[parts.length - 2]);
                let cr = parseNumericValue(parts[parts.length - 1]);

                totalDebits += dr;
                totalCredits += cr;

                const val = Math.abs(dr - cr);
                tbRows.push({ acctCode: code, value: val });
            });

            const diff = Math.abs(totalDebits - totalCredits);
            const alertDiv = document.getElementById('balanceAlert');
            if (diff < 1.0) {
                alertDiv.className = "alert alert-success";
                alertDiv.innerHTML = "<span>✅</span> <strong>ตรวจสอบความถูกต้อง:</strong> งบทดลองดุลเรียบร้อยดี (เดบิตเท่ากับเครดิต)";
            } else {
                alertDiv.className = "alert alert-danger";
                alertDiv.innerHTML = `<span>⚠️</span> <strong>ตรวจสอบความถูกต้อง:</strong> งบทดลองไม่ดุล! มีผลต่าง <strong>฿${diff.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>`;
            }

            const mgtValues = mapTrialBalanceToManagementAccounts(tbRows);
            const dbValues = getManagementAccountsDatabaseValues();

            // Populate Comparison Table
            activeParsedResults = [{
                name: 'งบทดลองที่นำเข้า',
                mgtValues: mgtValues,
                dbValues: dbValues,
                loaded: true
            }];
            renderMultiHospitalsTable(activeParsedResults);

        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล: ' + err.message);
        } finally {
            hideLoading();
        }
    }, 400);
}

function loadSampleTrialBalance() {
    const sampleText = `1101010101	เงินสดในมือ	120000.00	0.00
1101020601	เงินฝากกระแสรายวัน	1500000.00	0.00
1101020603	เงินฝากออมทรัพย์	3800000.00	0.00
1102010101	ลูกหนี้ค่ารักษา-UC	8200000.00	0.00
1102050107	ลูกหนี้ค่ารักษา-ข้าราชการ	3400000.00	0.00
1105010105	ยาและเวชภัณฑ์คงเหลือ	2800000.00	0.00
1205020101	อาคารและสิ่งปลูกสร้างสุทธิ	12000000.00	0.00
1205030101	ครุภัณฑ์ทางการแพทย์สุทธิ	6400000.00	0.00
2101010101	เจ้าหนี้การค้า-ค่ายา	0.00	3200000.00
2101020199	เจ้าหนี้หมุนเวียนอื่น	0.00	1800000.00
2102010101	เงินรับฝากรอจัดสรร	0.00	2200000.00
2202010101	หนี้สินไม่หมุนเวียนอื่น	0.00	4100000.00
3101010101	ทุนตั้งต้น/ส่วนของเจ้าของ	0.00	15000000.00
3102010101	รายได้สะสมยกมา	0.00	4220000.00
4101010101	รายได้ค่ารักษา-OP-UC	0.00	24500000.00
4101010102	รายได้ค่ารักษา-IP-UC	0.00	18200000.00
4102010101	รายได้ค่ารักษา-ประกันสังคม	0.00	8600000.00
5101010101	ค่าใช้จ่ายบุคลากร (LC)	22000000.00	0.00
5102010101	ต้นทุนค่ายาและเวชภัณฑ์	14200000.00	0.00
5103010101	ค่าเสื่อมราคาและค่าตัดจำหน่าย	2500000.00	0.00
5201010101	ค่าใช้จ่ายในการดำเนินงานอื่น	9800000.00	0.00`;

    document.getElementById('pasteArea').value = sampleText;
}

// File input handler for CSV
const csvFileInput = document.getElementById('fileInput');
if (csvFileInput) {
    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('pasteArea').value = evt.target.result;
        };
        reader.readAsText(file);
    });
}

// Show/Hide Back to Top button on scroll
window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    }
});

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
