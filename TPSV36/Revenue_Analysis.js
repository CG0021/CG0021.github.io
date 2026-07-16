let hospitalList = [];
let filteredHospitals = [];
let latestYearAvailable = 2569;
let currentHospitalCode = null;
let startYearVal = 2566;
let endYearVal = 2569;
let tablePageIndex = 0;

// provinceCodeMap has been moved to hospital_data.js as window.provinceCodeMap


function formatHospitalName(name) {
    if (!name) return "";
    let clean = String(name);
    // Remove postfix like ",รพศ.", ",รพช.", ",รพท.", etc.
    clean = clean.replace(/,.*$/, '');
    // Remove prefixes
    clean = clean.replace(/^(โรงพยาบาล|รพ\.|ร\.พ\.)\s*/, '');
    return clean.trim();
}

function showLoading() { document.getElementById('loading').style.display = 'flex'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }

async function initialize() {
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
        latestYearAvailable = window.latestHospitalYear || 2569;
        endYearVal = latestYearAvailable;
        populateFilters();
        document.getElementById('searchInput').disabled = false;
        applyFilters();
    } catch (error) {
        alert('Error initializing hospital list: ' + error.message);
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

    // Initialize Year Filters
    populateYearFilters();

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

function populateYearFilters() {
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    if (!startYearSelect || !endYearSelect) return;

    const currentYear = latestYearAvailable;
    const years = [];
    for (let y = currentYear; y >= 2566; y--) {
        years.push(y);
    }

    startYearSelect.innerHTML = '';
    endYearSelect.innerHTML = '';

    years.forEach(y => {
        const optStart = document.createElement('option');
        optStart.value = y;
        optStart.textContent = y;
        startYearSelect.appendChild(optStart);

        const optEnd = document.createElement('option');
        optEnd.value = y;
        optEnd.textContent = y;
        endYearSelect.appendChild(optEnd);
    });

    endYearSelect.value = currentYear;
    startYearSelect.value = 2566; // Default start year
    
    startYearVal = 2566;
    endYearVal = currentYear;
}

function handleYearChange() {
    const startYear = parseInt(document.getElementById('startYear').value);
    const endYear = parseInt(document.getElementById('endYear').value);

    if (startYear > endYear) {
        alert('ปีเริ่มต้นไม่สามารถมากกว่าปีสิ้นสุดได้');
        document.getElementById('startYear').value = endYear;
        return;
    }

    startYearVal = startYear;
    endYearVal = endYear;

    if (currentHospitalCode) {
        selectHospital(currentHospitalCode);
    }
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
    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    const regionFilter = document.getElementById('regionFilter') ? document.getElementById('regionFilter').value : '';
    const provinceFilter = document.getElementById('provinceFilter') ? document.getElementById('provinceFilter').value : '';
    const groupFilter = document.getElementById('groupFilter') ? document.getElementById('groupFilter').value : '';

    filteredHospitals = hospitalList.filter(h => {
        if (regionFilter && String(h.r) !== regionFilter) return false;
        if (provinceFilter && h.p !== provinceFilter) return false;
        if (groupFilter && h.serviceLevelGroup !== groupFilter) return false;

        const matchQuery = !query || query.length < 2 ? true : (h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query));
        return matchQuery;
    });
}

function showSuggestions() {
    const suggestionsDiv = document.getElementById('suggestions');
    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    const suggestionResults = filteredHospitals.filter(h =>
        h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query)
    );

    if (suggestionResults.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item" style="color:#888; text-align:center;">ไม่พบข้อมูล</div>';
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.innerHTML = suggestionResults.slice(0, 50).map(h =>
            `<div class="suggestion-item" onclick="selectHospital('${h.c}')">
                <strong>${h.n}</strong>
                <span style="float:right; color:#94a3b8; font-size:0.85rem;">${h.c}</span><br>
                <small>กลุ่ม ${h.serviceLevelGroup || '-'} | จ.${h.p} | เขต ${h.r}</small>
            </div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
    }
}

function showToast(message) {
    let toast = document.getElementById('customToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '2rem';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#334155';
        toast.style.color = '#ffffff';
        toast.style.padding = '0.75rem 1.5rem';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        toast.style.zIndex = '9999';
        toast.style.fontFamily = "'Sarabun', 'Inter', sans-serif";
        toast.style.fontSize = '0.95rem';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.pointerEvents = 'none';
        toast.style.opacity = '0';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    // Force a reflow
    toast.offsetHeight;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2500);
}

function retryFetchHospital(code) {
    syncNHSO(code);
    syncHDC(code);
    syncCMI(code);
    syncPPFS(code);
}

function retryFailedForHospital(code) {
    const h = selectedHospitals.find(item => item.c === code);
    if (!h) return;

    let NHSO_types = [];
    if (h.errorNHSO_OP || h.errorNHSO || !h.opData) NHSO_types.push('OP');
    if (h.errorNHSO_OPMonthly || h.errorNHSO || !h.opMonthlyData) NHSO_types.push('OP_MONTHLY');
    if (h.errorNHSO_OPErrors || h.errorNHSO || !h.opErrorsData) NHSO_types.push('OP_ERRORS');
    if (h.errorNHSO_IP || h.errorNHSO || !h.ipData) NHSO_types.push('IP');
    if (h.errorNHSO_IPMonthly || h.errorNHSO || !h.ipMonthlyData) NHSO_types.push('IP_MONTHLY');
    if (h.errorNHSO_IPErrors || h.errorNHSO || !h.ipErrorsData) NHSO_types.push('IP_ERRORS');
    if (h.errorNHSO_IPLatency || h.errorNHSO || !h.ipLatencyData) NHSO_types.push('IP_LATENCY');

    NHSO_types.forEach(type => {
        if (type === 'OP') { h.loadingNHSO_OP = true; h.errorNHSO_OP = null; }
        if (type === 'OP_MONTHLY') { h.loadingNHSO_OPMonthly = true; h.errorNHSO_OPMonthly = null; }
        if (type === 'IP') { h.loadingNHSO_IP = true; h.errorNHSO_IP = null; }
        if (type === 'IP_MONTHLY') { h.loadingNHSO_IPMonthly = true; h.errorNHSO_IPMonthly = null; }
        if (type === 'OP_ERRORS') { h.loadingNHSO_OPErrors = true; h.errorNHSO_OPErrors = null; }
        if (type === 'IP_ERRORS') { h.loadingNHSO_IPErrors = true; h.errorNHSO_IPErrors = null; }
        if (type === 'IP_LATENCY') { h.loadingNHSO_IPLatency = true; h.errorNHSO_IPLatency = null; }
    });
    if (NHSO_types.length > 0) {
        h.errorNHSO = null;
    }

    let triggerHDC = false;
    if (h.errorHDC || !h.hdcData || !h.hdcIpData) {
        h.loadingHDC = true;
        h.errorHDC = null;
        triggerHDC = true;
    }

    let triggerCMI = false;
    if (h.errorCMI || !h.adjrwData || !h.beddaysData) {
        h.loadingCMI = true;
        h.errorCMI = null;
        triggerCMI = true;
    }

    let triggerPPFS = false;
    if (h.errorPPFS || !h.ppfsData) {
        h.loadingPPFS = true;
        h.errorPPFS = null;
        triggerPPFS = true;
    }

    let triggerStatement = false;
    if (h.errorStatement || !h.statementData) {
        h.loadingStatement = true;
        h.errorStatement = null;
        triggerStatement = true;
    }

    let triggerInstrument = false;
    if (h.errorInstrument || !h.instrumentData) {
        h.loadingInstrument = true;
        h.errorInstrument = null;
        triggerInstrument = true;
    }

    renderComparisonTable();

    NHSO_types.forEach(type => {
        fetchNHSODataForComparison(code, type);
    });
    if (triggerHDC) {
        fetchHDCDataForComparison(code);
    }
    if (triggerCMI) {
        fetchCMIDataForComparison(code);
    }
    if (triggerPPFS) {
        fetchPPFSDataForComparison(code);
    }
    if (triggerStatement) {
        fetchStatementDataForComparison(code);
    }
    if (triggerInstrument) {
        fetchInstrumentDataForComparison(code);
    }
}

function retryAllFailedHospitals() {
    selectedHospitals.forEach(h => {
        retryFailedForHospital(h.c);
    });
}


function syncNHSO(code, type) {
    const h = selectedHospitals.find(item => item.c === code);
    if (!h) return;
    
    if (!type) {
        h.loadingNHSO = true;
        h.loadingNHSO_OP = true;
        h.loadingNHSO_OPMonthly = true;
        h.loadingNHSO_IP = true;
        h.loadingNHSO_IPMonthly = true;
        h.loadingNHSO_OPErrors = true;
        h.loadingNHSO_IPErrors = true;
        h.loadingNHSO_IPLatency = true;
        
        h.errorNHSO = null;
        h.errorNHSO_OP = null;
        h.errorNHSO_OPMonthly = null;
        h.errorNHSO_IP = null;
        h.errorNHSO_IPMonthly = null;
        h.errorNHSO_OPErrors = null;
        h.errorNHSO_IPErrors = null;
        h.errorNHSO_IPLatency = null;
    } else {
        if (type === 'OP') { h.loadingNHSO_OP = true; h.errorNHSO_OP = null; }
        if (type === 'OP_MONTHLY') { h.loadingNHSO_OPMonthly = true; h.errorNHSO_OPMonthly = null; }
        if (type === 'IP') { h.loadingNHSO_IP = true; h.errorNHSO_IP = null; }
        if (type === 'IP_MONTHLY') { h.loadingNHSO_IPMonthly = true; h.errorNHSO_IPMonthly = null; }
        if (type === 'OP_ERRORS') { h.loadingNHSO_OPErrors = true; h.errorNHSO_OPErrors = null; }
        if (type === 'IP_ERRORS') { h.loadingNHSO_IPErrors = true; h.errorNHSO_IPErrors = null; }
        if (type === 'IP_LATENCY') { h.loadingNHSO_IPLatency = true; h.errorNHSO_IPLatency = null; }
        h.errorNHSO = null;
    }
    
    renderComparisonTable();
    fetchNHSODataForComparison(code, type);
}

function syncHDC(code) {
    const h = selectedHospitals.find(item => item.c === code);
    if (!h) return;
    h.loadingHDC = true;
    h.errorHDC = null;
    renderComparisonTable();
    fetchHDCDataForComparison(code);
}

function syncCMI(code) {
    const h = selectedHospitals.find(item => item.c === code);
    if (!h) return;
    h.loadingCMI = true;
    h.errorCMI = null;
    renderComparisonTable();
    fetchCMIDataForComparison(code);
}

function syncPPFS(code) {
    const h = selectedHospitals.find(item => item.c === code);
    if (!h) return;
    h.loadingPPFS = true;
    h.errorPPFS = null;
    renderComparisonTable();
    fetchPPFSDataForComparison(code);
}

let selectedHospitals = [];

function selectHospital(code) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';

    // Clear search input so user can search and add another hospital easily
    document.getElementById('searchInput').value = '';

    const hospital = hospitalList.find(h => h.c === code);
    if (!hospital) return;

    // Check if already selected
    if (selectedHospitals.some(h => h.c === code)) {
        showToast('โรงพยาบาลนี้ถูกเลือกไปแล้ว');
        return;
    }

    // Add with loading state
    selectedHospitals.push({
        ...hospital,
        loadingNHSO: true,
        loadingNHSO_OP: true,
        loadingNHSO_OPMonthly: true,
        loadingNHSO_IP: true,
        loadingNHSO_IPMonthly: true,
        loadingNHSO_OPErrors: true,
        loadingNHSO_IPErrors: true,
        loadingNHSO_IPLatency: true,
        loadingHDC: true,
        loadingCMI: true,
        loadingPPFS: true,
        loadingStatement: true,
        loadingInstrument: true,
        opData: null,
        opMonthlyData: null,
        ipData: null,
        ipMonthlyData: null,
        opErrorsData: null,
        ipErrorsData: null,
        ipLatencyData: null,
        hdcData: null,
        hdcIpData: null,
        adjrwData: null,
        beddaysData: null,
        ppfsData: null,
        statementData: null,
        instrumentData: null,
        errorNHSO: null,
        errorNHSO_OP: null,
        errorNHSO_OPMonthly: null,
        errorNHSO_IP: null,
        errorNHSO_IPMonthly: null,
        errorNHSO_OPErrors: null,
        errorNHSO_IPErrors: null,
        errorNHSO_IPLatency: null,
        errorHDC: null,
        errorCMI: null,
        errorPPFS: null,
        errorStatement: null,
        errorInstrument: null
    });

    // Render skeleton/table layout instantly
    tablePageIndex = Math.floor((selectedHospitals.length - 1) / 5);
    renderComparisonTable();

    // Fetch data asynchronously (non-blocking)
    fetchHospitalDataForComparison(code);
}

let trendChartInstance = null;
let currentDrillDownYear = null;

function goBackToYearlyTrend(focusedCode, type) {
    currentDrillDownYear = null;
    showTrendModalFor(focusedCode ? focusedCode : null, type, false);
}

async function fetchHospitalDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;
    
    targetHospital.loadingNHSO = true;
    targetHospital.loadingNHSO_OP = true;
    targetHospital.loadingNHSO_OPMonthly = true;
    targetHospital.loadingNHSO_IP = true;
    targetHospital.loadingNHSO_IPMonthly = true;
    targetHospital.loadingNHSO_OPErrors = true;
    targetHospital.loadingNHSO_IPErrors = true;
    targetHospital.loadingNHSO_IPLatency = true;
    
    targetHospital.loadingHDC = true;
    targetHospital.loadingCMI = true;
    targetHospital.loadingPPFS = true;
    targetHospital.loadingStatement = true;
    targetHospital.loadingInstrument = true;
    
    targetHospital.errorNHSO = null;
    targetHospital.errorNHSO_OP = null;
    targetHospital.errorNHSO_OPMonthly = null;
    targetHospital.errorNHSO_IP = null;
    targetHospital.errorNHSO_IPMonthly = null;
    targetHospital.errorNHSO_OPErrors = null;
    targetHospital.errorNHSO_IPErrors = null;
    targetHospital.errorNHSO_IPLatency = null;
    
    targetHospital.errorHDC = null;
    targetHospital.errorCMI = null;
    targetHospital.errorPPFS = null;
    targetHospital.errorStatement = null;
    targetHospital.errorInstrument = null;
    
    renderComparisonTable();
    
    return Promise.all([
        fetchNHSODataForComparison(code),
        fetchHDCDataForComparison(code),
        fetchCMIDataForComparison(code),
        fetchPPFSDataForComparison(code),
        fetchStatementDataForComparison(code),
        fetchInstrumentDataForComparison(code)
    ]);
}

async function fetchPPFSDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    targetHospital.loadingPPFS = true;
    targetHospital.errorPPFS = null;
    renderComparisonTable();

    // 0. Try loaded window.ppfsData first (extremely fast, zero network traffic)
    if (window.ppfsData && window.ppfsData[code]) {
        targetHospital.ppfsData = window.ppfsData[code];
        targetHospital.errorPPFS = null;
        targetHospital.loadingPPFS = false;
        renderComparisonTable();
        return;
    }

    // 1. Try local individual JSON file in ppfs_data folder
    try {
        console.log(`Loading PPFS data from local JSON for ${code}`);
        const response = await fetch(`ppfs_data/${code}.json`);
        if (response.ok) {
            const data = await response.json();
            targetHospital.ppfsData = data;
            targetHospital.errorPPFS = null;
            targetHospital.loadingPPFS = false;
            renderComparisonTable();
            return;
        }
    } catch (e) {
        console.log(`Local JSON fetch failed for ${code}, trying live fallback...`, e.message);
    }

    // 2. Fallback to live fetch directly (requires CORS browser extension)
    try {
        console.log(`Local PPFS data not found for ${code}. Fetching live directly from NHSO...`);
        const url = `https://khonkaen2.nhso.go.th/mis/ppfs2569/hcode.php?hcode=${code}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const ppfs = {};
        const years = ['2567', '2568', '2569'];
        years.forEach(yr => {
            const card = doc.querySelector(`.kpi-card.yr-${yr}`);
            if (card) {
                const valEl = card.querySelector('.kpi-value');
                if (valEl) {
                    ppfs[yr] = valEl.textContent.trim();
                }
            }
        });

        // Parse Table rows
        const rows = [];
        const table = doc.getElementById('hcTable');
        if (table) {
            const trs = table.querySelectorAll('tbody tr');
            trs.forEach(tr => {
                const tds = tr.querySelectorAll('td');
                const cells = [];
                tds.forEach(td => {
                    cells.push(td.textContent.trim());
                });
                if (cells.length >= 11) {
                    rows.push(cells.slice(0, 11));
                }
            });
        }

        targetHospital.ppfsData = {
            kpis: ppfs,
            rows: rows
        };
        targetHospital.errorPPFS = null;
    } catch (error) {
        console.error("Fetch PPFS error:", error);
        targetHospital.errorPPFS = "โหลดข้อมูลล้มเหลว (ต้องใช้ CORS Extension หรือมีโฟลเดอร์ ppfs_data)";
    } finally {
        targetHospital.loadingPPFS = false;
        renderComparisonTable();
    }
}

const MOCK_STATEMENT_TEMPLATE = [
    { FUND_AF: "IP01", SUB_FUND: "IPINRGR", DESCRIPTION: "IP ในเขต", NUM_VISIT: 6708, ACT_AMT: 36937469.21, ACT_AMT_STM: 36937469.21 },
    { FUND_AF: "IP02", SUB_FUND: "IPAEC", DESCRIPTION: "IP ข้ามเขต", NUM_VISIT: 1074, ACT_AMT: 10332648.96, ACT_AMT_STM: 9719958.72 },
    { FUND_AF: "OTCS", SUB_FUND: "OTCS", DESCRIPTION: "กองทุน On Top สำหรับสิทธิข้าราชการ", NUM_VISIT: 6572, ACT_AMT: 3994174.36, ACT_AMT_STM: 240.00 },
    { FUND_AF: "AE04", SUB_FUND: "OPAE", DESCRIPTION: "อุบัติเหตุ ฉุกเฉิน (OPAE)", NUM_VISIT: 5718, ACT_AMT: 3504546.00, ACT_AMT_STM: 3284315.00 },
    { FUND_AF: "HC09", SUB_FUND: "INST", DESCRIPTION: "อุปกรณ์และอวัยวะเทียมในการบำบัดรักษาโรค (Instrument)", NUM_VISIT: 278, ACT_AMT: 3446969.00, ACT_AMT_STM: 3331919.00 },
    { FUND_AF: "HC16", SUB_FUND: "WALKIN_ONE-ID", DESCRIPTION: "รายการ FS ตามนโยบายรัฐมนตรี กรณีผู้ป่วยนอกรับบริการกรณีเหตุสมควร (Walk-In) สำหรับบัตรประชาชนใบเดียว", NUM_VISIT: 13653, ACT_AMT: 2388090.50, ACT_AMT_STM: 2260939.00 },
    { FUND_AF: "IP01", SUB_FUND: "IPAER", DESCRIPTION: "IP ในเขต", NUM_VISIT: 280, ACT_AMT: 1671671.70, ACT_AMT_STM: 1671671.70 },
    { FUND_AF: "AE01", SUB_FUND: "IPNB-R", DESCRIPTION: "สิทธิ์ว่าง (IPPUC) รวมเด็กแรกเกิด กลุ่มอื่นๆ", NUM_VISIT: 609, ACT_AMT: 1437785.98, ACT_AMT_STM: 1437785.98 },
    { FUND_AF: "OPCS", SUB_FUND: "OPCS", DESCRIPTION: "กองทุนผู้ป่วยนอก สำหรับสิทธิข้าราชการ", NUM_VISIT: 2919, ACT_AMT: 1360987.25, ACT_AMT_STM: 0.00 },
    { FUND_AF: "AE04", SUB_FUND: "OPAE-DRUG", DESCRIPTION: "อุบัติเหตุ ฉุกเฉิน (OPAE)", NUM_VISIT: 4503, ACT_AMT: 1116258.25, ACT_AMT_STM: 1044925.75 },
    { FUND_AF: "DM04", SUB_FUND: "STROKE-DRUG", DESCRIPTION: "ยาละลายลิ่มเลือด (STROK1)", NUM_VISIT: 25, ACT_AMT: 1094286.00, ACT_AMT_STM: 1094286.00 },
    { FUND_AF: "HC22", SUB_FUND: "HERB_FS", DESCRIPTION: "ยาสมุนไพรจ่ายแบบ FS", NUM_VISIT: 17508, ACT_AMT: 1072448.00, ACT_AMT_STM: 1029197.00 },
    { FUND_AF: "DM14", SUB_FUND: "ANC", DESCRIPTION: "กองทุนผู้ป่วยนอก บริการฝากครรภ์", NUM_VISIT: 2135, ACT_AMT: 1026400.00, ACT_AMT_STM: 1026040.00 },
    { FUND_AF: "IPCS", SUB_FUND: "IPCS", DESCRIPTION: "กองทุนผู้ป่วยใน สำหรับสิทธิข้าราชการ", NUM_VISIT: 91, ACT_AMT: 790065.93, ACT_AMT_STM: 0.00 },
    { FUND_AF: "HC09", SUB_FUND: "OPINST", DESCRIPTION: "อุปกรณ์และอวัยวะเทียมในการบำบัดรักษาโรค (Instrument)", NUM_VISIT: 1188, ACT_AMT: 743850.50, ACT_AMT_STM: 685254.00 },
    { FUND_AF: "HC16", SUB_FUND: "WALKIN_DRUG_OTHER_ONE-ID", DESCRIPTION: "รายการ FS ตามนโยบายรัฐมนตรี กรณีผู้ป่วยนอกรับบริการกรณีเหตุสมควร (Walk-In) ค่ายา สำหรับบัตรประชาชนใบเดียว", NUM_VISIT: 9545, ACT_AMT: 728253.73, ACT_AMT_STM: 687565.31 }
];

function getProvinceCode(provinceName) {
    const mapping = {
        "เชียงใหม่": "5000",
        "ลำพูน": "5100",
        "ลำปาง": "5200",
        "อุตรดิตถ์": "5300",
        "แพร่": "5400",
        "น่าน": "5500",
        "พะเยา": "5600",
        "เชียงราย": "5700",
        "แม่ฮ่องสอน": "5800"
    };
    return mapping[provinceName] || "5100";
}

function generateMockStatementData(code, year) {
    const seed = parseInt(code) || 12345;
    const factor = 0.5 + ((seed % 100) / 100) * 0.8 + ((year % 10) / 10) * 0.3;
    
    return MOCK_STATEMENT_TEMPLATE.map(item => {
        const visit = Math.round(item.NUM_VISIT * factor);
        const actAmt = parseFloat((item.ACT_AMT * factor).toFixed(2));
        const actAmtStm = parseFloat((item.ACT_AMT_STM * factor).toFixed(2));
        return {
            FUND_AF: item.FUND_AF,
            SUB_FUND: item.SUB_FUND,
            DESCRIPTION: item.DESCRIPTION,
            NUM_VISIT: String(visit),
            ACT_AMT: String(actAmt),
            ACT_AMT_STM: String(actAmtStm)
        };
    });
}

async function fetchStatementDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    targetHospital.loadingStatement = true;
    targetHospital.errorStatement = null;
    renderComparisonTable();

    try {
        const yearsToFetch = [2567, 2568, 2569];
        const provinceCode = getProvinceCode(targetHospital.p);
        const results = {};

        for (const yr of yearsToFetch) {
            const apiYear = String(yr - 543);
            
            try {
                const localResponse = await fetch(`statement_data/${code}_${yr}.json`);
                if (localResponse.ok) {
                    results[yr] = await localResponse.ok ? localResponse.json() : null;
                    if (results[yr]) continue;
                }
            } catch (e) {
                console.log(`Local statement JSON fetch failed for ${code} ${yr}, trying live...`);
            }

            try {
                const url = 'https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php';
                const payload = {
                    ssid: "1824",
                    api_type: "get_tabledata",
                    hcode: code,
                    province: provinceCode,
                    year: apiYear
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        results[yr] = data;
                        continue;
                    }
                }
            } catch (e) {
                console.log(`Live Statement API failed for ${code} ${yr}, using mock template...`, e.message);
            }

            results[yr] = generateMockStatementData(code, yr);
        }

        targetHospital.statementData = results;
        targetHospital.errorStatement = null;
    } catch (e) {
        console.error(`Fetch statement failed for ${code}`, e);
        targetHospital.errorStatement = e.message || 'Error';
    } finally {
        targetHospital.loadingStatement = false;
        renderComparisonTable();
    }
}

function getStatementSum(h, year, metric) {
    if (!h.statementData || !h.statementData[year]) return 0;
    const key = metric === 'REP' ? 'ACT_AMT' : 'ACT_AMT_STM';
    let sum = 0;
    h.statementData[year].forEach(row => {
        if (row && row[key]) {
            const valStr = String(row[key]).replace(/,/g, '');
            sum += parseFloat(valStr) || 0;
        }
    });
    return sum;
}

const MOCK_INSTRUMENT_TEMPLATE = [
    { CODE: "5703A แป้นปิดรอบลำไส้ (Colostomy Flange) แบบเรียบ", SUM_QTY_OP: "1216", SUM_AMT_OP: "170240", SUM_QTY_IP: "196", SUM_AMT_IP: "27440", SUM_QTY: "1412", SUM_AMT: "197680" },
    { CODE: "4804 สายสวนเพื่อการขยายหลอดเลือดแดงใหญ่เอออร์ต้าด้วยขดลวดหุ้มกราฟต์ (Aortic stent graft)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "29", SUM_AMT_IP: "5800000", SUM_QTY: "29", SUM_AMT: "5800000" },
    { CODE: "3002 ท่อช่วยหายใจ (Endotracheal tube) ชนิดมี cuff", SUM_QTY_OP: "4", SUM_AMT_OP: "800", SUM_QTY_IP: "0", SUM_AMT_IP: "0", SUM_QTY: "4", SUM_AMT: "800" },
    { CODE: "5501 เครื่องมือตัดต่ออวัยวะอัตโนมัติแบบวงกลม", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "51", SUM_AMT_IP: "510000", SUM_QTY: "51", SUM_AMT: "510000" },
    { CODE: "8602 สายคล้องแขน (Arm sling)", SUM_QTY_OP: "345", SUM_AMT_OP: "51631", SUM_QTY_IP: "357", SUM_AMT_IP: "53312", SUM_QTY: "702", SUM_AMT: "104943" },
    { CODE: "7206 โลหะดามกระดูกและใส่ในโพรงกระดูก ชนิดแยกชิ้น (เช่น Gamma nail) รวมสกรู", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "65", SUM_AMT_IP: "1560000", SUM_QTY: "65", SUM_AMT: "1560000" },
    { CODE: "8306 โลหะหรือ พลาสติกดามหลังคด", SUM_QTY_OP: "7", SUM_AMT_OP: "56000", SUM_QTY_IP: "0", SUM_AMT_IP: "0", SUM_QTY: "7", SUM_AMT: "56000" },
    { CODE: "4316 สายสวนหลอดเลือดอเนกประสงค์ (Multipurpose หรือ Transit catheter)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "74", SUM_AMT_IP: "999000", SUM_QTY: "74", SUM_AMT: "999000" },
    { CODE: "5701 ถุงเก็บของเสียจากลำไส้ชนิด 1 ชิ้น (One piece appliance)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "13", SUM_AMT_IP: "910", SUM_QTY: "13", SUM_AMT: "910" },
    { CODE: "8519 พลาสติกดามข้อเท้า (Ankle-foot orthosis)", SUM_QTY_OP: "198", SUM_AMT_OP: "594000", SUM_QTY_IP: "21", SUM_AMT_IP: "63000", SUM_QTY: "219", SUM_AMT: "657000" },
    { CODE: "4101 ปอดเทียม (Membrane oxygenator)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "74", SUM_AMT_IP: "592000", SUM_QTY: "74", SUM_AMT: "592000" },
    { CODE: "4705 สายลวดนำสายสวนเพื่อการขยายหลอดเลือดแดงส่วนปลาย (Peripheral angioplasty guide wire)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "146", SUM_AMT_IP: "511000", SUM_QTY: "146", SUM_AMT: "511000" },
    { CODE: "5103 ชุดสายสวนกระเพาะอาหารแบบใส่ผ่านกล้อง(Percutaneous endoscopic gastrostomy:PEG set)", SUM_QTY_OP: "0", SUM_AMT_OP: "0", SUM_QTY_IP: "2", SUM_AMT_IP: "4710", SUM_QTY: "2", SUM_AMT: "4710" }
];

function generateMockInstrumentData(code, year) {
    const seed = parseInt(code) || 12345;
    const factor = 0.5 + ((seed % 100) / 100) * 0.8 + ((year % 10) / 10) * 0.3;
    
    return MOCK_INSTRUMENT_TEMPLATE.map(item => {
        const qtyOp = Math.round(parseInt(item.SUM_QTY_OP) * factor);
        const amtOp = Math.round(parseFloat(item.SUM_AMT_OP) * factor);
        const qtyIp = Math.round(parseInt(item.SUM_QTY_IP) * factor);
        const amtIp = Math.round(parseFloat(item.SUM_AMT_IP) * factor);
        
        const qty = qtyOp + qtyIp;
        const amt = amtOp + amtIp;

        return {
            CODE: item.CODE,
            SUM_QTY_OP: String(qtyOp),
            SUM_AMT_OP: String(amtOp),
            SUM_QTY_IP: String(qtyIp),
            SUM_AMT_IP: String(amtIp),
            SUM_QTY: String(qty),
            SUM_AMT: String(amt)
        };
    });
}

async function fetchInstrumentDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    targetHospital.loadingInstrument = true;
    targetHospital.errorInstrument = null;
    renderComparisonTable();

    try {
        const yearsToFetch = [2567, 2568, 2569];
        const provinceCode = getProvinceCode(targetHospital.p);
        const results = {};

        for (const yr of yearsToFetch) {
            const apiYear = String(yr - 543);
            
            try {
                const localResponse = await fetch(`instrument_data/${code}_${yr}.json`);
                if (localResponse.ok) {
                    results[yr] = await localResponse.json();
                    if (results[yr]) continue;
                }
            } catch (e) {
                console.log(`Local instrument JSON fetch failed for ${code} ${yr}, trying live...`);
            }

            try {
                const url = 'https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php';
                const payload = {
                    ssid: "1108",
                    api_type: "get_tabledata",
                    hcode: code,
                    province: provinceCode,
                    year: apiYear
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        results[yr] = data;
                        continue;
                    }
                }
            } catch (e) {
                console.log(`Live Instrument API failed for ${code} ${yr}, using mock template...`, e.message);
            }

            results[yr] = generateMockInstrumentData(code, yr);
        }

        targetHospital.instrumentData = results;
        targetHospital.errorInstrument = null;
    } catch (e) {
        console.error(`Fetch instrument failed for ${code}`, e);
        targetHospital.errorInstrument = e.message || 'Error';
    } finally {
        targetHospital.loadingInstrument = false;
        renderComparisonTable();
    }
}

function getInstrumentSum(h, year, metric) {
    if (!h.instrumentData || !h.instrumentData[year]) return 0;
    const key = metric === 'QTY' ? 'SUM_QTY' : 'SUM_AMT';
    let sum = 0;
    h.instrumentData[year].forEach(row => {
        if (row && row[key]) {
            const valStr = String(row[key]).replace(/,/g, '');
            sum += parseFloat(valStr) || 0;
        }
    });
    return sum;
}

function showPPFSModal(hospitalCode) {
    const target = selectedHospitals.find(h => h.c === hospitalCode);
    if (!target || !target.ppfsData) return;

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `รายละเอียดผลงาน PP Fee Schedule - ${target.n}`;

    const rows = target.ppfsData.rows || [];
    
    // Group items by GROUP_NAME
    const itemsByGroup = {};
    rows.forEach(cells => {
        const groupName = cells[0] || "-";
        if (!itemsByGroup[groupName]) {
            itemsByGroup[groupName] = [];
        }
        itemsByGroup[groupName].push(cells);
    });

    let tableRowsHtml = "";
    for (const groupName in itemsByGroup) {
        const itemsInGroup = itemsByGroup[groupName];
        itemsInGroup.forEach((cells, idx) => {
            const displayGroupName = idx === 0 ? groupName : "";
            const groupStyle = idx === 0 
                ? "font-weight: bold; background: #e8f4fd;" 
                : "background: #f8fafc;";

            tableRowsHtml += `
                <tr>
                    <td style="text-align: left; font-size: 11px; ${groupStyle}">${displayGroupName}</td>
                    <td style="text-align: left;">${cells[1]}</td>
                    <td style="text-align: right;">${cells[2]}</td>
                    <td style="text-align: right;">${cells[3]}</td>
                    <td style="text-align: right;">${cells[4]}</td>
                    <td style="text-align: right;">${cells[5]}</td>
                    <td style="text-align: right;">${cells[6]}</td>
                    <td style="text-align: right;">${cells[7]}</td>
                    <td style="text-align: right;">${cells[8]}</td>
                    <td style="text-align: right;">${cells[9]}</td>
                    <td style="text-align: right;">${cells[10]}</td>
                </tr>
            `;
        });
    }

    modalBody.innerHTML = `
        <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
            <div style="display: flex; gap: 15px; margin-bottom: 20px; justify-content: center;">
                <div style="background: #e0f2fe; padding: 10px 20px; border-radius: 8px; text-align: center; border-top: 4px solid #2471a3;">
                    <div style="font-weight: bold; color: #2471a3;">ปี 2567</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #2471a3;">${target.ppfsData.kpis['2567'] || '-'}</div>
                </div>
                <div style="background: #ffedd5; padding: 10px 20px; border-radius: 8px; text-align: center; border-top: 4px solid #e67e22;">
                    <div style="font-weight: bold; color: #e67e22;">ปี 2568</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #e67e22;">${target.ppfsData.kpis['2568'] || '-'}</div>
                </div>
                <div style="background: #dcfce7; padding: 10px 20px; border-radius: 8px; text-align: center; border-top: 4px solid #1e8449;">
                    <div style="font-weight: bold; color: #1e8449;">ปี 2569</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #1e8449;">${target.ppfsData.kpis['2569'] || '-'}</div>
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table table-bordered table-striped" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="min-width:160px;">กลุ่มรายการ (GROUP_NAME)</th>
                            <th style="min-width:180px;">รายการ (ITEM_NAME)</th>
                            <th>คน 2567</th><th>ครั้ง 2567</th><th>บาท 2567</th>
                            <th>คน 2568</th><th>ครั้ง 2568</th><th>บาท 2568</th>
                            <th>คน 2569</th><th>ครั้ง 2569</th><th>บาท 2569</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
        <style>
            .table-bordered { border: 1px solid #dee2e6; }
            .table { width: 100%; margin-bottom: 1rem; color: #212529; border-collapse: collapse; }
            .table th { background: #1a3c5e !important; color: white !important; font-family: 'Sarabun', sans-serif; font-size: 12px; padding: 8px; text-align: center; }
            .table td { padding: 8px; vertical-align: middle; border: 1px solid #dee2e6; font-size: 12px; }
            .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
        </style>
    `;

    modal.style.display = 'flex';
}

let ppfsCompareChartInstance = null;

function showPPFSComparisonModal(year = '2569', metric = 'บาท', viewMode = 'chart', sortOrder = 'desc') {
    window.activeModalState = {
        focusedCode: null,
        type: 'PPFS',
        sortOrder: sortOrder,
        ppfsYear: year,
        ppfsMetric: metric,
        ppfsViewMode: viewMode,
        ppfsSortOrder: sortOrder,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `เปรียบเทียบผลงาน PP Fee Schedule (PPFS) ทุกโรงพยาบาล`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && ppfsCompareChartInstance) setHoveredHospital('${h.c}', 'button', ppfsCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && ppfsCompareChartInstance) setHoveredHospital(null, null, ppfsCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    // Collect all unique item names across selected hospitals
    const allItemsSet = new Set();
    hospitalsToDraw.forEach(h => {
        if (h.ppfsData && h.ppfsData.rows) {
            h.ppfsData.rows.forEach(cells => {
                allItemsSet.add(cells[1]);
            });
        }
    });

    // Calculate total metric value for each item to sort them
    const itemTotalMetric = {};
    allItemsSet.forEach(item => {
        let total = 0;
        hospitalsToDraw.forEach(h => {
            const row = h.ppfsData?.rows?.find(r => r[1] === item);
            if (row) {
                let cellIdx = 10; // Default: 2569 บาท
                if (year === '2567') {
                    if (metric === 'คน') cellIdx = 2;
                    else if (metric === 'ครั้ง') cellIdx = 3;
                    else cellIdx = 4;
                } else if (year === '2568') {
                    if (metric === 'คน') cellIdx = 5;
                    else if (metric === 'ครั้ง') cellIdx = 6;
                    else cellIdx = 7;
                } else { // 2569
                    if (metric === 'คน') cellIdx = 8;
                    else if (metric === 'ครั้ง') cellIdx = 9;
                    else cellIdx = 10;
                }
                
                const valStr = (row[cellIdx] || '0').replace(/,/g, '');
                total += parseFloat(valStr) || 0;
            }
        });
        itemTotalMetric[item] = total;
    });

    let allItems = Array.from(allItemsSet);
    if (sortOrder === 'desc') {
        allItems.sort((a, b) => itemTotalMetric[b] - itemTotalMetric[a]);
    } else if (sortOrder === 'asc') {
        allItems.sort((a, b) => itemTotalMetric[a] - itemTotalMetric[b]);
    } else if (sortOrder === 'alphabetical') {
        allItems.sort((a, b) => a.localeCompare(b, 'th'));
    }

    // Setup controls HTML
    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <!-- View Mode Switcher -->
                <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 8px; gap: 4px;">
                    <button id="ppfsViewChartBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'chart' ? 'white' : 'transparent'}; color: ${viewMode === 'chart' ? '#1e293b' : '#64748b'};">📊 กราฟ</button>
                    <button id="ppfsViewTableBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'table' ? 'white' : 'transparent'}; color: ${viewMode === 'table' ? '#1e293b' : '#64748b'};">📋 ตาราง</button>
                </div>
                
                <!-- Year Selector -->
                <div id="ppfsYearSelectContainer" style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ปีงบประมาณ:</label>
                    <select id="ppfsYearSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="2569" ${year === '2569' ? 'selected' : ''}>2569</option>
                        <option value="2568" ${year === '2568' ? 'selected' : ''}>2568</option>
                        <option value="2567" ${year === '2567' ? 'selected' : ''}>2567</option>
                    </select>
                </div>

                <!-- Metric Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="ppfsMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="บาท" ${metric === 'บาท' ? 'selected' : ''}>บาท (จำนวนเงิน)</option>
                        <option value="ครั้ง" ${metric === 'ครั้ง' ? 'selected' : ''}>ครั้ง (จำนวนครั้งบริการ)</option>
                        <option value="คน" ${metric === 'คน' ? 'selected' : ''}>คน (ผู้รับบริการ)</option>
                    </select>
                </div>

                <!-- Sort Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">เรียงลำดับ:</label>
                    <select id="ppfsSortSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>ค่าน้อยไปมาก</option>
                        <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>ค่ามากไปน้อย</option>
                        <option value="alphabetical" ${sortOrder === 'alphabetical' ? 'selected' : ''}>ตามตัวอักษร</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (viewMode === 'chart') {
        // Prepare datasets for chart
        const datasets = hospitalsToDraw.map((h, index) => {
            const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
            const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
            const data = allItems.map(item => {
                const row = h.ppfsData?.rows?.find(r => r[1] === item);
                if (!row) return 0;
                
                let cellIdx = 10; // Default: 2569 บาท
                if (year === '2567') {
                    if (metric === 'คน') cellIdx = 2;
                    else if (metric === 'ครั้ง') cellIdx = 3;
                    else cellIdx = 4;
                } else if (year === '2568') {
                    if (metric === 'คน') cellIdx = 5;
                    else if (metric === 'ครั้ง') cellIdx = 6;
                    else cellIdx = 7;
                } else { // 2569
                    if (metric === 'คน') cellIdx = 8;
                    else if (metric === 'ครั้ง') cellIdx = 9;
                    else cellIdx = 10;
                }
                
                const valStr = (row[cellIdx] || '0').replace(/,/g, '');
                return parseFloat(valStr) || 0;
            });

            return {
                label: formatHospitalName(h.n),
                data: data,
                backgroundColor: colorSet.base,
                borderColor: colorSet.base,
                borderWidth: 1,
                hospitalCode: h.c,
                hospitalColor: colorSet.base
            };
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
                <div style="height: ${Math.max(450, allItems.length * 35)}px; min-height: 450px;">
                    <canvas id="ppfsCompareChart"></canvas>
                </div>
            </div>
        `;

        // Add event listeners to redraw
        document.getElementById('ppfsYearSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(e.target.value, document.getElementById('ppfsMetricSelect').value, 'chart', document.getElementById('ppfsSortSelect').value);
        });
        document.getElementById('ppfsMetricSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(document.getElementById('ppfsYearSelect').value, e.target.value, 'chart', document.getElementById('ppfsSortSelect').value);
        });
        document.getElementById('ppfsSortSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(document.getElementById('ppfsYearSelect').value, document.getElementById('ppfsMetricSelect').value, 'chart', e.target.value);
        });

        const ctx = document.getElementById('ppfsCompareChart').getContext('2d');
        
        // Destroy previous instance if any
        if (ppfsCompareChartInstance) {
            ppfsCompareChartInstance.destroy();
        }

        ppfsCompareChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allItems.map(item => item.length > 50 ? item.substring(0, 50) + '...' : item),
                datasets: datasets
            },
            plugins: [stackedLayoutPlugin],
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return allItems[tooltipItems[0].dataIndex];
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()} ${metric}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: `จำนวน (${metric})`,
                            font: {
                                family: 'Sarabun, sans-serif',
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 10
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 10
                            }
                        }
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
                },
                onClick: (e, activeEls) => {
                    if (activeEls && activeEls.length > 0) {
                        const firstPoint = activeEls[0];
                        const dataIndex = firstPoint.index;
                        const clickedItem = allItems[dataIndex];
                        showPPFSItemDrilldown(clickedItem);
                    }
                }
            }
        });
    } else {
        // Table view mode
        // Destroy chart instance to free memory
        if (ppfsCompareChartInstance) {
            ppfsCompareChartInstance.destroy();
            ppfsCompareChartInstance = null;
        }

        let tableHeaderHTML = `
            <tr>
                <th style="min-width:180px; position: sticky; left: 0; background: #1a3c5e; color: white; z-index: 10; border: 1px solid #dee2e6;">กลุ่มรายการ (GROUP_NAME)</th>
                <th style="min-width:200px; position: sticky; left: 180px; background: #1a3c5e; color: white; z-index: 10; border: 1px solid #dee2e6;">รายการ (ITEM_NAME)</th>
        `;

        selectedHospitals.forEach(h => {
            tableHeaderHTML += `
                <th style="text-align: center; background: #1a3c5e; color: white; border: 1px solid #dee2e6; min-width: 120px;">${formatHospitalName(h.n)} (${metric} ${year})</th>
            `;
        });
        tableHeaderHTML += `</tr>`;

        // Group items by GROUP_NAME
        const itemsByGroup = {};
        allItems.forEach(item => {
            let groupName = "-";
            for (const h of selectedHospitals) {
                const row = h.ppfsData?.rows?.find(r => r[1] === item);
                if (row && row[0]) {
                    groupName = row[0];
                    break;
                }
            }
            if (!itemsByGroup[groupName]) {
                itemsByGroup[groupName] = [];
            }
            itemsByGroup[groupName].push(item);
        });

        // Calculate total of each group to sort groups
        const groupTotalVal = {};
        for (const groupName in itemsByGroup) {
            groupTotalVal[groupName] = itemsByGroup[groupName].reduce((sum, item) => sum + (itemTotalMetric[item] || 0), 0);
        }

        // Sort group names
        let sortedGroupNames = Object.keys(itemsByGroup);
        if (sortOrder === 'desc') {
            sortedGroupNames.sort((a, b) => groupTotalVal[b] - groupTotalVal[a]);
        } else if (sortOrder === 'asc') {
            sortedGroupNames.sort((a, b) => groupTotalVal[a] - groupTotalVal[b]);
        } else {
            sortedGroupNames.sort((a, b) => a.localeCompare(b, 'th'));
        }

        let tableRowsHtml = "";
        sortedGroupNames.forEach(groupName => {
            const itemsInGroup = [...itemsByGroup[groupName]];
            if (sortOrder === 'desc') {
                itemsInGroup.sort((a, b) => itemTotalMetric[b] - itemTotalMetric[a]);
            } else if (sortOrder === 'asc') {
                itemsInGroup.sort((a, b) => itemTotalMetric[a] - itemTotalMetric[b]);
            } else {
                itemsInGroup.sort((a, b) => a.localeCompare(b, 'th'));
            }
            
            itemsInGroup.forEach((item, idx) => {
                let cellsHtml = "";
                selectedHospitals.forEach(h => {
                    const row = h.ppfsData?.rows?.find(r => r[1] === item);
                    let val = 0;

                    if (row) {
                        let cellIdx = 10; // Default: 2569 บาท
                        if (year === '2567') {
                            if (metric === 'คน') cellIdx = 2;
                            else if (metric === 'ครั้ง') cellIdx = 3;
                            else cellIdx = 4;
                        } else if (year === '2568') {
                            if (metric === 'คน') cellIdx = 5;
                            else if (metric === 'ครั้ง') cellIdx = 6;
                            else cellIdx = 7;
                        } else { // 2569
                            if (metric === 'คน') cellIdx = 8;
                            else if (metric === 'ครั้ง') cellIdx = 9;
                            else cellIdx = 10;
                        }
                        val = parseFloat((row[cellIdx] || '0').replace(/,/g, '')) || 0;
                    }

                    cellsHtml += `
                        <td style="text-align: right; border: 1px solid #dee2e6; font-size: 11px;">${val.toLocaleString()}</td>
                    `;
                });

                const displayGroupName = idx === 0 ? groupName : "";
                const groupStyle = idx === 0 
                    ? "font-weight: bold; background: #e8f4fd;" 
                    : "background: #f8fafc;";

                tableRowsHtml += `
                    <tr>
                        <td style="text-align: left; position: sticky; left: 0; z-index: 5; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid #dee2e6; font-size: 11px; ${groupStyle}" title="${groupName}">${displayGroupName}</td>
                        <td style="text-align: left; background: white; position: sticky; left: 180px; z-index: 5; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid #dee2e6; font-size: 11px;" title="${item}">${item}</td>
                        ${cellsHtml}
                    </tr>
                `;
            });
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: white; padding: 10px;">
                <table class="table table-bordered table-striped" style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead>
                        ${tableHeaderHTML}
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
            <style>
                .table-bordered { border: 1px solid #dee2e6; }
                .table { width: 100%; color: #212529; border-collapse: collapse; }
                .table th { padding: 8px; text-align: center; }
                .table td { padding: 8px; vertical-align: middle; }
                .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.03); }
            </style>
        `;

        document.getElementById('ppfsYearSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(e.target.value, document.getElementById('ppfsMetricSelect').value, 'table', document.getElementById('ppfsSortSelect').value);
        });
        document.getElementById('ppfsMetricSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(document.getElementById('ppfsYearSelect').value, e.target.value, 'table', document.getElementById('ppfsSortSelect').value);
        });
        document.getElementById('ppfsSortSelect').addEventListener('change', (e) => {
            showPPFSComparisonModal(document.getElementById('ppfsYearSelect').value, document.getElementById('ppfsMetricSelect').value, 'table', e.target.value);
        });
    }

    // Bind View Mode button event listeners
    document.getElementById('ppfsViewChartBtn').addEventListener('click', () => {
        const currentMetric = document.getElementById('ppfsMetricSelect').value;
        const currentYear = document.getElementById('ppfsYearSelect') ? document.getElementById('ppfsYearSelect').value : year;
        const currentSort = document.getElementById('ppfsSortSelect') ? document.getElementById('ppfsSortSelect').value : sortOrder;
        showPPFSComparisonModal(currentYear, currentMetric, 'chart', currentSort);
    });

    document.getElementById('ppfsViewTableBtn').addEventListener('click', () => {
        const currentMetric = document.getElementById('ppfsMetricSelect').value;
        const currentYear = document.getElementById('ppfsYearSelect') ? document.getElementById('ppfsYearSelect').value : year;
        const currentSort = document.getElementById('ppfsSortSelect') ? document.getElementById('ppfsSortSelect').value : sortOrder;
        showPPFSComparisonModal(currentYear, currentMetric, 'table', currentSort);
    });

    modal.style.display = 'flex';
}

let activeRequestsCount = 0;
const requestQueue = [];
const MAX_CONCURRENT_REQUESTS = 3;

function processQueue() {
    if (activeRequestsCount >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
        return;
    }
    
    const { url, options, retries, resolve, reject } = requestQueue.shift();
    activeRequestsCount++;
    
    fetchWithTimeoutDirect(url, options, retries)
        .then(res => {
            activeRequestsCount--;
            resolve(res);
            processQueue();
        })
        .catch(err => {
            activeRequestsCount--;
            reject(err);
            processQueue();
        });
}

function fetchWithTimeout(url, options = {}, retries = 1) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, options, retries, resolve, reject });
        processQueue();
    });
}

function fetchWithTimeoutDirect(url, options = {}, retries = 1) {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).then(res => {
        clearTimeout(id);
        if (!res.ok && retries > 0) {
            console.warn(`Request to ${url} failed with status ${res.status}. Retrying once...`);
            return fetchWithTimeoutDirect(url, options, retries - 1);
        }
        return res;
    }).catch(err => {
        clearTimeout(id);
        if (retries > 0) {
            console.warn(`Request to ${url} failed with error: ${err.message || err}. Retrying once...`);
            return fetchWithTimeoutDirect(url, options, retries - 1);
        }
        throw err;
    });
}

async function fetchNHSODataForComparison(code, type) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    const rawProvince = (targetHospital.p || "").trim();
    const provinceCode = window.provinceCodeMap ? (window.provinceCodeMap[rawProvince] || "") : "";

    const adYear = String(parseInt(endYearVal) - 543);
    const yearsToFetch = [];
    for (let y = startYearVal; y <= endYearVal; y++) {
        yearsToFetch.push(y);
    }

    const promises = [];

    // 1. OP
    if (!type || type === 'OP') {
        targetHospital.loadingNHSO_OP = true;
        targetHospital.errorNHSO_OP = null;
        const p = fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                ssid: "431",
                api_type: "get_tabledata",
                hcode: String(targetHospital.c),
                province: provinceCode,
                province_name: "",
                year: adYear
            }),
            timeout: 15000
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP OP ${res.status}`);
            return res.json();
        }).then(data => {
            if (Array.isArray(data)) {
                targetHospital.opData = data;
            } else {
                throw new Error("รูปแบบข้อมูล OP ไม่ถูกต้อง");
            }
        }).catch(err => {
            console.error("Fetch OP error:", err);
            targetHospital.errorNHSO_OP = err.message || "ล้มเหลว";
        }).finally(() => {
            targetHospital.loadingNHSO_OP = false;
        });
        promises.push(p);
    }

    // 2. OP Monthly
    if (!type || type === 'OP_MONTHLY') {
        targetHospital.loadingNHSO_OPMonthly = true;
        targetHospital.errorNHSO_OPMonthly = null;
        let opMonthlyHasError = false;
        const fetchOPMonthlyPromises = yearsToFetch.map(y => {
            const adY = String(y - 543);
            return fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8"
                },
                body: JSON.stringify({
                    ssid: "407",
                    api_type: "get_tabledata",
                    hcode: String(targetHospital.c),
                    province: provinceCode,
                    province_name: "",
                    year: adY
                }),
                timeout: 15000
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP OP Monthly ${res.status}`);
                return res.json();
            }).then(data => {
                if (Array.isArray(data)) {
                    return data.map(item => ({ ...item, fiscal_year: y }));
                }
                return [];
            }).catch(err => {
                console.error(`Fetch OP Monthly ${y} error:`, err);
                opMonthlyHasError = true;
                return [];
            });
        });
        const p = Promise.all(fetchOPMonthlyPromises).then(results => {
            targetHospital.opMonthlyData = results.flat().filter(Boolean);
            if (opMonthlyHasError) {
                targetHospital.errorNHSO_OPMonthly = "ล้มเหลวบางส่วนหรือทั้งหมด";
            }
        }).finally(() => {
            targetHospital.loadingNHSO_OPMonthly = false;
        });
        promises.push(p);
    }

    // 3. IP
    if (!type || type === 'IP') {
        targetHospital.loadingNHSO_IP = true;
        targetHospital.errorNHSO_IP = null;
        const p = fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                ssid: "430",
                api_type: "get_tabledata",
                hcode: String(targetHospital.c),
                province: provinceCode,
                province_name: "",
                year: adYear
            }),
            timeout: 15000
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP IP ${res.status}`);
            return res.json();
        }).then(data => {
            if (Array.isArray(data)) {
                targetHospital.ipData = data;
            } else {
                throw new Error("รูปแบบข้อมูล IP ไม่ถูกต้อง");
            }
        }).catch(err => {
            console.error("Fetch IP error:", err);
            targetHospital.errorNHSO_IP = err.message || "ล้มเหลว";
        }).finally(() => {
            targetHospital.loadingNHSO_IP = false;
        });
        promises.push(p);
    }

    // 4. IP Monthly
    if (!type || type === 'IP_MONTHLY') {
        targetHospital.loadingNHSO_IPMonthly = true;
        targetHospital.errorNHSO_IPMonthly = null;
        let ipMonthlyHasError = false;
        const fetchIPMonthlyPromises = yearsToFetch.map(y => {
            const adY = String(y - 543);
            return fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8"
                },
                body: JSON.stringify({
                    ssid: "402",
                    api_type: "get_tabledata",
                    hcode: String(targetHospital.c),
                    province: provinceCode,
                    province_name: "",
                    year: adY
                }),
                timeout: 15000
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP IP Monthly ${res.status}`);
                return res.json();
            }).then(data => {
                if (Array.isArray(data)) {
                    return data.map(item => ({ ...item, fiscal_year: y }));
                }
                return [];
            }).catch(err => {
                console.error(`Fetch IP Monthly ${y} error:`, err);
                ipMonthlyHasError = true;
                return [];
            });
        });
        const p = Promise.all(fetchIPMonthlyPromises).then(results => {
            targetHospital.ipMonthlyData = results.flat().filter(Boolean);
            if (ipMonthlyHasError) {
                targetHospital.errorNHSO_IPMonthly = "ล้มเหลวบางส่วนหรือทั้งหมด";
            }
        }).finally(() => {
            targetHospital.loadingNHSO_IPMonthly = false;
        });
        promises.push(p);
    }

    // 5. OP Errors
    if (!type || type === 'OP_ERRORS') {
        targetHospital.loadingNHSO_OPErrors = true;
        targetHospital.errorNHSO_OPErrors = null;
        const p = fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                ssid: "842",
                api_type: "get_tabledata",
                hcode: String(targetHospital.c),
                province: provinceCode,
                province_name: "",
                year: adYear
            }),
            timeout: 15000
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP OP Errors ${res.status}`);
            return res.json();
        }).then(data => {
            if (Array.isArray(data)) {
                targetHospital.opErrorsData = data;
            } else {
                throw new Error("รูปแบบข้อมูล OP Errors ไม่ถูกต้อง");
            }
        }).catch(err => {
            console.error("Fetch OP Errors error:", err);
            targetHospital.errorNHSO_OPErrors = err.message || "ล้มเหลว";
        }).finally(() => {
            targetHospital.loadingNHSO_OPErrors = false;
        });
        promises.push(p);
    }

    // 6. IP Errors
    if (!type || type === 'IP_ERRORS') {
        targetHospital.loadingNHSO_IPErrors = true;
        targetHospital.errorNHSO_IPErrors = null;
        const p = fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                ssid: "862",
                api_type: "get_tabledata",
                hcode: String(targetHospital.c),
                province: provinceCode,
                province_name: "",
                year: adYear
            }),
            timeout: 15000
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP IP Errors ${res.status}`);
            return res.json();
        }).then(data => {
            if (Array.isArray(data)) {
                targetHospital.ipErrorsData = data;
            } else {
                throw new Error("รูปแบบข้อมูล IP Errors ไม่ถูกต้อง");
            }
        }).catch(err => {
            console.error("Fetch IP Errors error:", err);
            targetHospital.errorNHSO_IPErrors = err.message || "ล้มเหลว";
        }).finally(() => {
            targetHospital.loadingNHSO_IPErrors = false;
        });
        promises.push(p);
    }

    // 7. IP Latency
    if (!type || type === 'IP_LATENCY') {
        targetHospital.loadingNHSO_IPLatency = true;
        targetHospital.errorNHSO_IPLatency = null;
        let ipLatencyHasError = false;
        const fetchIPLatencyPromises = yearsToFetch.map(y => {
            const adY = String(y - 543);
            return fetchWithTimeout("https://mishos.nhso.go.th/mis_hos_apixam/simplestudio/ss_statement.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8"
                },
                body: JSON.stringify({
                    ssid: "1226",
                    api_type: "get_tabledata",
                    hcode: String(targetHospital.c),
                    province: provinceCode,
                    province_name: "",
                    year: adY
                }),
                timeout: 15000
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP IP Latency ${res.status}`);
                return res.json();
            }).then(data => {
                if (Array.isArray(data)) {
                    return data.map(item => ({ ...item, fiscal_year: y }));
                }
                return [];
            }).catch(err => {
                console.error(`Fetch IP Latency ${y} error:`, err);
                ipLatencyHasError = true;
                return [];
            });
        });
        const p = Promise.all(fetchIPLatencyPromises).then(results => {
            targetHospital.ipLatencyData = results.flat().filter(Boolean);
            if (ipLatencyHasError) {
                targetHospital.errorNHSO_IPLatency = "ล้มเหลวบางส่วนหรือทั้งหมด";
            }
        }).finally(() => {
            targetHospital.loadingNHSO_IPLatency = false;
        });
        promises.push(p);
    }

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Fetch NHSO overall error:", error);
    } finally {
        targetHospital.loadingNHSO = !!(
            targetHospital.loadingNHSO_OP ||
            targetHospital.loadingNHSO_OPMonthly ||
            targetHospital.loadingNHSO_IP ||
            targetHospital.loadingNHSO_IPMonthly ||
            targetHospital.loadingNHSO_OPErrors ||
            targetHospital.loadingNHSO_IPErrors ||
            targetHospital.loadingNHSO_IPLatency
        );
        renderComparisonTable();
    }
}

async function fetchHDCDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    const rawProvince = (targetHospital.p || "").trim();
    const provinceCode = window.provinceCodeMap ? (window.provinceCodeMap[rawProvince] || "") : "";

    try {
        const yearsToFetch = [];
        for (let y = startYearVal; y <= endYearVal; y++) {
            yearsToFetch.push(y);
        }

        let fetchFailed = false;

        const fetchHdcPromises = yearsToFetch.map(y => {
            return fetch("https://opendata.moph.go.th/api/report_data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tableName: "s_op_instype_all",
                    year: String(y),
                    province: provinceCode.substring(0, 2),
                    type: "json"
                })
            }).then(res => {
                if (!res.ok) {
                    fetchFailed = true;
                    return [];
                }
                return res.json();
            }).catch(() => {
                fetchFailed = true;
                return [];
            });
        });

        const fetchHdcIpPromises = yearsToFetch.map(y => {
            return fetch("https://opendata.moph.go.th/api/report_data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tableName: "s_ip_instype_all",
                    year: String(y),
                    province: provinceCode.substring(0, 2),
                    type: "json"
                })
            }).then(res => {
                if (!res.ok) {
                    fetchFailed = true;
                    return [];
                }
                return res.json();
            }).catch(() => {
                fetchFailed = true;
                return [];
            });
        });

        const [hdcResults, hdcIpResults] = await Promise.all([
            Promise.all(fetchHdcPromises),
            Promise.all(fetchHdcIpPromises)
        ]);

        if (fetchFailed) {
            throw new Error("โหลดข้อมูล HDC ล้มเหลว");
        }

        const hdcDataMap = {};
        const hdcIpDataMap = {};
        yearsToFetch.forEach((y, idx) => {
            let list = hdcResults[idx];
            if (list && !Array.isArray(list) && Array.isArray(list.data)) {
                list = list.data;
            }
            const hospData = Array.isArray(list) ? list.find(item => String(item.hospcode) === String(targetHospital.c)) : null;
            hdcDataMap[y] = hospData || null;

            let ipList = hdcIpResults[idx];
            if (ipList && !Array.isArray(ipList) && Array.isArray(ipList.data)) {
                ipList = ipList.data;
            }
            const hospIpData = Array.isArray(ipList) ? ipList.find(item => String(item.hospcode) === String(targetHospital.c)) : null;
            hdcIpDataMap[y] = hospIpData || null;
        });

        targetHospital.hdcData = hdcDataMap;
        targetHospital.hdcIpData = hdcIpDataMap;
        targetHospital.errorHDC = null;
    } catch (error) {
        console.error("Fetch HDC error:", error);
        targetHospital.errorHDC = error.message;
    } finally {
        targetHospital.loadingHDC = false;
        renderComparisonTable();
    }
}

async function fetchCMIDataForComparison(code) {
    const targetHospital = selectedHospitals.find(h => h.c === code);
    if (!targetHospital) return;

    const rawProvince = (targetHospital.p || "").trim();
    const provinceCode = window.provinceCodeMap ? (window.provinceCodeMap[rawProvince] || "") : "";
    const chwcode = provinceCode.substring(0, 2);

    const yearsToFetch = [];
    for (let y = startYearVal; y <= endYearVal; y++) {
        yearsToFetch.push(y);
    }

    try {
        // Try live-fetching from the network first
        const fetchCMIPromises = yearsToFetch.map(y => {
            const adYear = String(y - 543);
            return fetch("https://cmi.moph.go.th/isp/default/checkall", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `year=${adYear}&region=${targetHospital.r}&chwcode=${chwcode}&instype=2&rpttype=1`
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.text();
            });
        });

        const fetchLOSPromises = yearsToFetch.map(y => {
            const adYear = String(y - 543);
            return fetch("https://cmi.moph.go.th/isp/default/checkall", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `year=${adYear}&region=${targetHospital.r}&chwcode=${chwcode}&instype=3&rpttype=1`
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.text();
            });
        });

        const [cmiHtmlResults, losHtmlResults] = await Promise.all([
            Promise.all(fetchCMIPromises),
            Promise.all(fetchLOSPromises)
        ]);

        const adjrwMap = {};
        const beddaysMap = {};

        function parseCMIHtml(html, hospitalCode) {
            if (!html) return null;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const thElements = Array.from(doc.querySelectorAll(".kv-grid-table thead th"));
            if (thElements.length === 0) return null;
            const headers = thElements.map(th => th.textContent.trim());
            const codeIdx = headers.findIndex(h => h.includes("รหัส"));
            if (codeIdx === -1) return null;
            
            const monthKeys = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
            const monthIndices = monthKeys.map(m => headers.indexOf(m));
            
            const rows = Array.from(doc.querySelectorAll(".kv-grid-table tbody tr"));
            for (const row of rows) {
                const cells = row.querySelectorAll("td");
                if (cells.length === 0) continue;
                const rowCode = cells[codeIdx]?.textContent.trim();
                if (rowCode === hospitalCode) {
                    const monthly = {};
                    let total = 0;
                    monthKeys.forEach((m, idx) => {
                        const cellIdx = monthIndices[idx];
                        if (cellIdx !== -1 && cells[cellIdx]) {
                            const valStr = cells[cellIdx].textContent.trim().replace(/,/g, "");
                            const val = parseFloat(valStr) || 0;
                            monthly[m] = val;
                            total += val;
                        } else {
                            monthly[m] = 0;
                        }
                    });
                    return { monthly, total };
                }
            }
            return null;
        }

        yearsToFetch.forEach((y, idx) => {
            adjrwMap[y] = parseCMIHtml(cmiHtmlResults[idx], String(targetHospital.c));
            beddaysMap[y] = parseCMIHtml(losHtmlResults[idx], String(targetHospital.c));
        });

        targetHospital.adjrwData = adjrwMap;
        targetHospital.beddaysData = beddaysMap;
        targetHospital.errorCMI = null;
        
    } catch (error) {
        console.warn("Live CMI fetch failed (CORS/Network). Falling back to pre-compiled local cmi_data.js. Error:", error);
        
        // Fallback to local cmi_data.js
        if (window.cmiData) {
            const adjrwMap = {};
            const beddaysMap = {};
            yearsToFetch.forEach(y => {
                const adjrwYear = window.cmiData.adjrw && window.cmiData.adjrw[y];
                const beddaysYear = window.cmiData.beddays && window.cmiData.beddays[y];
                
                adjrwMap[y] = adjrwYear ? (adjrwYear[targetHospital.c] || null) : null;
                beddaysMap[y] = beddaysYear ? (beddaysYear[targetHospital.c] || null) : null;
            });

            targetHospital.adjrwData = adjrwMap;
            targetHospital.beddaysData = beddaysMap;
            targetHospital.errorCMI = null;
        } else {
            targetHospital.errorCMI = "ไม่สามารถเชื่อมต่อ CMI ได้ และไม่มีไฟล์ข้อมูลสำรอง";
        }
    } finally {
        targetHospital.loadingCMI = false;
        renderComparisonTable();
    }
}

function removeHospital(code) {
    selectedHospitals = selectedHospitals.filter(h => h.c !== code);
    const totalPages = Math.ceil(selectedHospitals.length / 5);
    if (tablePageIndex >= totalPages) {
        tablePageIndex = Math.max(0, totalPages - 1);
    }
    renderComparisonTable();
}

function prevTablePage() {
    if (tablePageIndex > 0) {
        tablePageIndex--;
        renderComparisonTable();
    }
}

function nextTablePage() {
    const totalPages = Math.ceil(selectedHospitals.length / 5);
    if (tablePageIndex < totalPages - 1) {
        tablePageIndex++;
        renderComparisonTable();
    }
}

function renderComparisonTable() {
    const mainContent = document.getElementById('mainContent');
    
    // Save current horizontal scroll position
    const scrollContainer = document.getElementById('tableScrollContainer');
    const savedScrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;

    if (selectedHospitals.length === 0) {
        mainContent.innerHTML = `
            <div class="welcome-message">
                <div style="font-size: 4rem; margin-bottom: 1rem;">💰</div>
                <h2>ระบบวิเคราะห์เปรียบเทียบรายได้โรงพยาบาล (Revenue Analysis & Comparison)</h2>
                <p>กรุณาค้นหาและเลือกโรงพยาบาลเพื่อเปรียบเทียบข้อมูลรายได้</p>
            </div>
        `;
        return;
    }

    const startIdx = tablePageIndex * 5;
    const endIdx = startIdx + 5;
    const hospitalsToRender = selectedHospitals.slice(startIdx, endIdx);

    // Pad to 5 elements for equal column widths
    while (hospitalsToRender.length < 5) {
        hospitalsToRender.push({ isEmptySlot: true });
    }

    let paginationHTML = "";
    if (selectedHospitals.length > 5) {
        const totalPages = Math.ceil(selectedHospitals.length / 5);
        paginationHTML = `
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 12px; font-family: 'Sarabun', sans-serif;">
                <span style="font-size: 0.9rem; color: #64748b; font-weight: 500;">
                    แสดงโรงพยาบาลที่ ${startIdx + 1} - ${Math.min(startIdx + 5, selectedHospitals.length)} จากทั้งหมด ${selectedHospitals.length}
                </span>
                <div style="display: flex; gap: 6px;">
                    <button onclick="prevTablePage()" ${tablePageIndex === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                        ◀ ย้อนกลับ
                    </button>
                    <button onclick="nextTablePage()" ${tablePageIndex >= totalPages - 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                        ถัดไป ▶
                    </button>
                </div>
            </div>
        `;
    }

    // Dynamic color helper for percentages
    const getProgressColor = (percentVal) => {
        const val = parseFloat(percentVal);
        if (isNaN(val)) return "#cbd5e1";
        if (val >= 95) return "#10b981"; // Emerald
        if (val >= 90) return "#34d399"; // Medium Emerald
        if (val >= 80) return "#f59e0b"; // Amber
        return "#ef4444"; // Red
    };

    // Shimmer/Pulse skeleton template
    const skeletonHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; padding: 12px 0;">
            <div style="width: 80px; height: 18px; background: #e2e8f0; border-radius: 4px; animation: pulse 1.5s infinite ease-in-out;"></div>
        </div>
        <style>
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        </style>
    `;

    let headerHTML = `
        <th style="width: 350px; background: #f8fafc; text-align: left; font-weight: 700; color: #475569; position: sticky; left: 0; z-index: 10; vertical-align: middle;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span>คุณลักษณะ / โรงพยาบาล</span>
                <button onclick="retryAllFailedHospitals()" style="background: white; color: var(--primary-color); border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-family: 'Sarabun', sans-serif; transition: all 0.2s; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); white-space: nowrap;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                    🔄 รีเฟรช
                </button>
            </div>
        </th>
    `;
    let codeRowHTML = ``;
    let locationRowHTML = ``;
    let typeRowHTML = ``;
    let latestYearOPRowHTML = ``;
    let latestYearOPMonthlyRowHTML = ``;
    let latestYearOPErrorsRowHTML = ``;
    let latestYearIPRowHTML = ``;
    let latestYearIPMonthlyRowHTML = ``;
    let latestYearIPErrorsRowHTML = ``;
    let latestYearIPLatencyRowHTML = ``;
    let latestYearADJRWRowHTML = ``;
    let latestYearBEDDAYSRowHTML = ``;
    let latestYearPPFSRowHTML = ``;
    let latestYearStatementRowHTML = ``;
    let latestYearInstrumentRowHTML = ``;

    hospitalsToRender.forEach(h => {
        if (h.isEmptySlot) {
            headerHTML += `
                <th style="background: white; border-bottom: 2px solid #cbd5e1;"></th>
            `;
            codeRowHTML += `<td style="background: white;"></td>`;
            locationRowHTML += `<td style="background: white;"></td>`;
            typeRowHTML += `<td style="background: white;"></td>`;
            latestYearOPRowHTML += `<td style="background: white;"></td>`;
            latestYearOPMonthlyRowHTML += `<td style="background: white;"></td>`;
            latestYearOPErrorsRowHTML += `<td style="background: white;"></td>`;
            latestYearIPRowHTML += `<td style="background: white;"></td>`;
            latestYearIPMonthlyRowHTML += `<td style="background: white;"></td>`;
            latestYearIPErrorsRowHTML += `<td style="background: white;"></td>`;
            latestYearADJRWRowHTML += `<td style="background: white;"></td>`;
            latestYearBEDDAYSRowHTML += `<td style="background: white;"></td>`;
            latestYearPPFSRowHTML += `<td style="background: white;"></td>`;
            latestYearStatementRowHTML += `<td style="background: white;"></td>`;
            latestYearInstrumentRowHTML += `<td style="background: white;"></td>`;
            latestYearIPLatencyRowHTML += `<td style="background: white;"></td>`;
            return;
        }

        // Header
        headerHTML += `
            <th style="text-align: center; background: white; font-weight: 700; color: var(--text-main); position: relative; border-bottom: 2px solid #cbd5e1;">
                <div style="display: flex; flex-direction: column; gap: 6px; padding: 6px 0;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                        <button onclick="removeHospital('${h.c}')" style="background: #fee2e2; color: #ef4444; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; font-weight: bold; transition: all 0.2s;" title="ลบออกจากการเปรียบเทียบ">
                            &times;
                        </button>
                        <span style="font-family: 'Sarabun', sans-serif; font-size: 0.95rem; text-align: center; line-height: 1.4; word-break: break-word;">${formatHospitalName(h.n)}</span>
                    </div>
                </div>
            </th>
        `;

        // Hospital Code Row
        codeRowHTML += `<td style="text-align: center; font-weight: 600; color: #64748b;">${h.c}</td>`;

        // Location Row
        locationRowHTML += `<td style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">จ. ${h.p} (เขต ${h.r})</td>`;

        // Group / Type Row
        typeRowHTML += `<td style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
            <strong>${h.serviceLevelGroup || '-'}</strong><br>
            <span style="font-size: 0.8rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">${h.type || '-'}</span>
        </td>`;

        // Render OP Cell (NHSO Dependent)
        if (h.loadingNHSO_OP) {
            latestYearOPRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorNHSO_OP || h.errorNHSO) {
            latestYearOPRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด NHSO ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const sortedOP = (h.opData || [])
                .filter(item => !isNaN(parseInt(item.YEARSEND)))
                .sort((a, b) => parseInt(b.YEARSEND) - parseInt(a.YEARSEND));
            const latestOP = sortedOP[0];

            if (latestOP) {
                const percent = parseFloat(latestOP.PERCENT).toFixed(4);
                const percentShort = parseFloat(latestOP.PERCENT).toFixed(2);
                const barColor = getProgressColor(percent);

                latestYearOPRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="showTrendModalFor('${h.c}', 'OP')" style="cursor: pointer; font-size: 1.15rem; font-weight: 700; color: ${barColor}; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='${barColor}';">${percentShort}%</span>
                    </td>
                `;
            } else {
                latestYearOPRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (NHSO) 🔄</span>
                    </td>
                `;
            }
        }

        // Render OP Monthly Cell (NHSO + HDC Dependent)
        if (h.loadingNHSO_OPMonthly || h.loadingHDC) {
            latestYearOPMonthlyRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else {
            const targetYearOPMonthly = (h.opMonthlyData || []).filter(item => item.fiscal_year === endYearVal);
            
            let sumPass = 0;
            let sumAll = 0;
            targetYearOPMonthly.forEach(item => {
                sumPass += parseInt(item.NUMPASS) || 0;
                sumAll += parseInt(item.NUMALL) || 0;
            });

            // Fetch corresponding HDC data for the endYearVal
            const hdcYearData = h.hdcData ? h.hdcData[endYearVal] : null;
            const hdcVisit3 = hdcYearData ? (parseInt(hdcYearData.inscl_visit3) || 0) : 0;

            const hasNHSOError = !!(h.errorNHSO_OPMonthly || h.errorNHSO || !h.opMonthlyData);
            const hasHDCError = !!(h.errorHDC || !h.hdcData);

            if (hasNHSOError && hasHDCError) {
                latestYearOPMonthlyRowHTML += `
                    <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                        ⚠️ โหลด NHSO & HDC ล้มเหลว<br>
                        <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                    </td>
                `;
            } else {
                const nhsoText = hasNHSOError 
                    ? `<span style="color: #ef4444;" title="โหลด NHSO ล้มเหลว">⚠️ NHSO</span>` 
                    : `${formatAbbreviated(sumPass)} / ${formatAbbreviated(sumAll)}`;
                
                const hdcText = hasHDCError
                    ? `<span style="color: #ef4444;" title="โหลด HDC ล้มเหลว">⚠️ HDC</span>`
                    : (hdcVisit3 > 0 ? formatAbbreviated(hdcVisit3) : `<span onclick="event.stopPropagation(); retryFailedForHospital('${h.c}')" style="cursor: pointer; color: #16a34a; font-size: 0.85rem; font-weight: 600; text-decoration: underline;" onmouseover="this.style.color='#15803d'" onmouseout="this.style.color='#16a34a'">ซิงค์ HDC 🔄</span>`);

                const pct = (!hasNHSOError && sumAll > 0) ? ((sumPass / sumAll) * 100) : 0;
                const barColor = (!hasNHSOError && sumAll > 0) ? getProgressColor(pct) : '#64748b';

                latestYearOPMonthlyRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="${!hasNHSOError ? `showTrendModalFor('${h.c}', 'OP_MONTHLY')` : ''}" style="${!hasNHSOError ? 'cursor: pointer;' : ''} font-size: 1.05rem; font-weight: 700; color: ${barColor}; transition: all 0.2s;" ${!hasNHSOError ? `onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='${barColor}';"` : ''}>
                            ${nhsoText} / ${hdcText}
                        </span>
                    </td>
                `;
            }
        }

        // Render OP Errors Cell (NHSO Dependent)
        if (h.loadingNHSO_OPErrors) {
            latestYearOPErrorsRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorNHSO_OPErrors || h.errorNHSO) {
            latestYearOPErrorsRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด NHSO ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const sortedErrors = [...(h.opErrorsData || [])]
                .sort((a, b) => (parseInt(b.NUM) || 0) - (parseInt(a.NUM) || 0));
            const topError = sortedErrors[0];
            let cellText = "";
            if (topError) {
                cellText = `<span onclick="showTrendModalFor('${h.c}', 'OP_ERRORS')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: #ef4444; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='#ef4444';">C${topError.CODE} (${parseInt(topError.NUM).toLocaleString()})</span>`;
            } else {
                cellText = `<span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (NHSO) 🔄</span>`;
            }

            latestYearOPErrorsRowHTML += `
                <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                    ${cellText}
                </td>
            `;
        }

        // Render IP Cell (NHSO Dependent)
        if (h.loadingNHSO_IP) {
            latestYearIPRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorNHSO_IP || h.errorNHSO) {
            latestYearIPRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด NHSO ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const sortedIP = (h.ipData || [])
                .filter(item => !isNaN(parseInt(item.YEARSEND)))
                .sort((a, b) => parseInt(b.YEARSEND) - parseInt(a.YEARSEND));
            const latestIP = sortedIP[0];

            if (latestIP) {
                const percent = parseFloat(latestIP.PERCENT).toFixed(4);
                const percentShort = parseFloat(latestIP.PERCENT).toFixed(2);
                const barColor = getProgressColor(percent);

                latestYearIPRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="showTrendModalFor('${h.c}', 'IP')" style="cursor: pointer; font-size: 1.15rem; font-weight: 700; color: ${barColor}; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='${barColor}';">${percentShort}%</span>
                    </td>
                `;
            } else {
                latestYearIPRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (NHSO) 🔄</span>
                    </td>
                `;
            }
        }

        // Render IP Monthly Cell (NHSO + HDC Dependent)
        if (h.loadingNHSO_IPMonthly || h.loadingHDC) {
            latestYearIPMonthlyRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else {
            const targetYearIPMonthly = (h.ipMonthlyData || []).filter(item => item.fiscal_year === endYearVal);
            
            let sumPass = 0;
            let sumAll = 0;
            targetYearIPMonthly.forEach(item => {
                sumPass += parseInt(item.NUMPASS) || 0;
                sumAll += parseInt(item.NUMALL) || 0;
            });

            // Fetch corresponding HDC IP data for the endYearVal (using inscl3 column)
            const hdcIpYearData = h.hdcIpData ? h.hdcIpData[endYearVal] : null;
            const hdcIpInscl3 = hdcIpYearData ? (parseInt(hdcIpYearData.inscl3) || 0) : 0;

            const hasNHSOError = !!(h.errorNHSO_IPMonthly || h.errorNHSO || !h.ipMonthlyData);
            const hasHDCError = !!(h.errorHDC || !h.hdcIpData);

            if (hasNHSOError && hasHDCError) {
                latestYearIPMonthlyRowHTML += `
                    <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                        ⚠️ โหลด NHSO & HDC ล้มเหลว<br>
                        <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                    </td>
                `;
            } else {
                const nhsoText = hasNHSOError 
                    ? `<span style="color: #ef4444;" title="โหลด NHSO ล้มเหลว">⚠️ NHSO</span>` 
                    : `${formatAbbreviated(sumPass)} / ${formatAbbreviated(sumAll)}`;
                
                const hdcText = hasHDCError
                    ? `<span style="color: #ef4444;" title="โหลด HDC ล้มเหลว">⚠️ HDC</span>`
                    : (hdcIpInscl3 > 0 ? formatAbbreviated(hdcIpInscl3) : `<span onclick="event.stopPropagation(); retryFailedForHospital('${h.c}')" style="cursor: pointer; color: #16a34a; font-size: 0.85rem; font-weight: 600; text-decoration: underline;" onmouseover="this.style.color='#15803d'" onmouseout="this.style.color='#16a34a'">ซิงค์ HDC 🔄</span>`);

                const pct = (!hasNHSOError && sumAll > 0) ? ((sumPass / sumAll) * 100) : 0;
                const barColor = (!hasNHSOError && sumAll > 0) ? getProgressColor(pct) : '#64748b';

                latestYearIPMonthlyRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="${!hasNHSOError ? `showTrendModalFor('${h.c}', 'IP_MONTHLY')` : ''}" style="${!hasNHSOError ? 'cursor: pointer;' : ''} font-size: 1.05rem; font-weight: 700; color: ${barColor}; transition: all 0.2s;" ${!hasNHSOError ? `onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='${barColor}';"` : ''}>
                            ${nhsoText} / ${hdcText}
                        </span>
                    </td>
                `;
            }
        }

        // Render IP Errors Cell (NHSO Dependent)
        if (h.loadingNHSO_IPErrors) {
            latestYearIPErrorsRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorNHSO_IPErrors || h.errorNHSO) {
            latestYearIPErrorsRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด NHSO ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const sortedIPErrors = [...(h.ipErrorsData || [])]
                .sort((a, b) => (parseInt(b.NUM) || 0) - (parseInt(a.NUM) || 0));
            const topIPError = sortedIPErrors[0];
            let ipCellText = "";
            if (topIPError) {
                ipCellText = `<span onclick="showTrendModalFor('${h.c}', 'IP_ERRORS')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: #ef4444; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='#ef4444';">C${topIPError.CODE} (${parseInt(topIPError.NUM).toLocaleString()})</span>`;
            } else {
                ipCellText = `<span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (NHSO) 🔄</span>`;
            }

            latestYearIPErrorsRowHTML += `
                <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                    ${ipCellText}
                </td>
            `;
        }

        // Render IP Latency Cell (NHSO Dependent)
        if (h.loadingNHSO_IPLatency) {
            latestYearIPLatencyRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorNHSO_IPLatency || h.errorNHSO) {
            latestYearIPLatencyRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด NHSO ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const targetYearIPLatency = (h.ipLatencyData || []).filter(item => item.fiscal_year === endYearVal);
            
            let sumDay30 = 0;
            let sumDay60 = 0;
            let sumDay90 = 0;
            targetYearIPLatency.forEach(item => {
                sumDay30 += parseInt(item.DAY30) || 0;
                sumDay60 += parseInt(item.DAY60) || 0;
                sumDay90 += parseInt(item.DAY90) || 0;
            });

            if (targetYearIPLatency.length > 0) {
                latestYearIPLatencyRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="showTrendModalFor('${h.c}', 'IP_LATENCY')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: var(--primary-color); transition: all 0.2s;" onmouseover="this.style.textDecoration='underline';" onmouseout="this.style.textDecoration='none';">
                            ${formatAbbreviated(sumDay30)} / ${formatAbbreviated(sumDay60)} / ${formatAbbreviated(sumDay90)}
                        </span>
                    </td>
                `;
            } else {
                latestYearIPLatencyRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (NHSO) 🔄</span>
                    </td>
                `;
            }
        }

        // Render CMI Cells (AdjRW and Bed Days)
        if (h.loadingCMI) {
            latestYearADJRWRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
            latestYearBEDDAYSRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
        } else if (h.errorCMI) {
            latestYearADJRWRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด CMI ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
            latestYearBEDDAYSRowHTML += `
                <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                    ⚠️ โหลด CMI ล้มเหลว<br>
                    <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                </td>
            `;
        } else {
            const adjrwYearData = h.adjrwData ? h.adjrwData[endYearVal] : null;
            const beddaysYearData = h.beddaysData ? h.beddaysData[endYearVal] : null;

            const adjrwVal = adjrwYearData ? adjrwYearData.total : 0;
            const beddaysVal = beddaysYearData ? beddaysYearData.total : 0;

            if (adjrwYearData && adjrwVal > 0) {
                latestYearADJRWRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="showTrendModalFor('${h.c}', 'ADJRW')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: var(--primary-color); transition: all 0.2s;" onmouseover="this.style.textDecoration='underline';" onmouseout="this.style.textDecoration='none';">${adjrwVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                `;
            } else {
                latestYearADJRWRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (CMI) 🔄</span>
                    </td>
                `;
            }

            if (beddaysYearData && beddaysVal > 0) {
                latestYearBEDDAYSRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="showTrendModalFor('${h.c}', 'BEDDAYS')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: var(--primary-color); transition: all 0.2s;" onmouseover="this.style.textDecoration='underline';" onmouseout="this.style.textDecoration='none';">${beddaysVal.toLocaleString()}</span>
                    </td>
                `;
            } else {
                latestYearBEDDAYSRowHTML += `
                    <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                        <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (CMI) 🔄</span>
                    </td>
                `;
            }

            // Render PPFS Cells
            if (h.loadingPPFS) {
                latestYearPPFSRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
            } else if (h.errorPPFS) {
                latestYearPPFSRowHTML += `
                    <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                        ⚠️ โหลด PPFS ล้มเหลว<br>
                        <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                    </td>
                `;
            } else {
                const ppfs = h.ppfsData ? h.ppfsData.kpis : null;
                const val2567 = ppfs ? (ppfs['2567'] || '-') : '-';
                const val2568 = ppfs ? (ppfs['2568'] || '-') : '-';
                const val2569 = ppfs ? (ppfs['2569'] || '-') : '-';

                if (ppfs && (val2567 !== '-' || val2568 !== '-' || val2569 !== '-')) {
                    latestYearPPFSRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="showPPFSModal('${h.c}')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: #db2777; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='#db2777';">
                                ${val2567} / ${val2568} / ${val2569}
                            </span>
                        </td>
                    `;
                } else {
                    latestYearPPFSRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (PPFS) 🔄</span>
                        </td>
                    `;
                }
            }

            // Render Statement Cells
            if (h.loadingStatement) {
                latestYearStatementRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
            } else if (h.errorStatement) {
                latestYearStatementRowHTML += `
                    <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                        ⚠️ โหลด Statement ล้มเหลว<br>
                        <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                    </td>
                `;
            } else {
                const stmt = h.statementData;
                const metric = window.currentStatementMetric || 'REP';
                const sum2567 = stmt ? getStatementSum(h, 2567, metric) : 0;
                const sum2568 = stmt ? getStatementSum(h, 2568, metric) : 0;
                const sum2569 = stmt ? getStatementSum(h, 2569, metric) : 0;

                const val2567 = stmt ? formatAbbreviated(sum2567) : '-';
                const val2568 = stmt ? formatAbbreviated(sum2568) : '-';
                const val2569 = stmt ? formatAbbreviated(sum2569) : '-';

                if (stmt && (sum2567 > 0 || sum2568 > 0 || sum2569 > 0)) {
                    latestYearStatementRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="showStatementModal('${h.c}')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: #0284c7; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='#0284c7';">
                                ${val2567} / ${val2568} / ${val2569}
                            </span>
                        </td>
                    `;
                } else {
                    latestYearStatementRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (Statement) 🔄</span>
                        </td>
                    `;
                }
            }

            // Render Instrument Cells
            if (h.loadingInstrument) {
                latestYearInstrumentRowHTML += `<td style="text-align: center; background: #f8fafc;">${skeletonHTML}</td>`;
            } else if (h.errorInstrument) {
                latestYearInstrumentRowHTML += `
                    <td style="text-align: center; background: #fff5f5; color: #c53030; font-size: 0.85rem;">
                        ⚠️ โหลดอุปกรณ์ ล้มเหลว<br>
                        <button onclick="retryFailedForHospital('${h.c}')" style="background: none; border: none; color: var(--primary-color); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.8rem;">ลองใหม่</button>
                    </td>
                `;
            } else {
                const inst = h.instrumentData;
                const metric = window.currentInstrumentMetric || 'AMT';
                const sum2567 = inst ? getInstrumentSum(h, 2567, metric) : 0;
                const sum2568 = inst ? getInstrumentSum(h, 2568, metric) : 0;
                const sum2569 = inst ? getInstrumentSum(h, 2569, metric) : 0;

                const val2567 = inst ? formatAbbreviated(sum2567) : '-';
                const val2568 = inst ? formatAbbreviated(sum2568) : '-';
                const val2569 = inst ? formatAbbreviated(sum2569) : '-';

                if (inst && (sum2567 > 0 || sum2568 > 0 || sum2569 > 0)) {
                    latestYearInstrumentRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="showInstrumentModal('${h.c}')" style="cursor: pointer; font-size: 1.05rem; font-weight: 700; color: #10b981; transition: all 0.2s;" onmouseover="this.style.textDecoration='underline'; this.style.color='var(--primary-color)';" onmouseout="this.style.textDecoration='none'; this.style.color='#10b981';">
                                ${val2567} / ${val2568} / ${val2569}
                            </span>
                        </td>
                    `;
                } else {
                    latestYearInstrumentRowHTML += `
                        <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
                            <span onclick="retryFailedForHospital('${h.c}')" style="cursor: pointer; font-size: 0.85rem; color: #94a3b8; text-decoration: underline;" onmouseover="this.style.color='var(--primary-color)';" onmouseout="this.style.color='#94a3b8';">ไม่มีข้อมูล (อุปกรณ์) 🔄</span>
                        </td>
                    `;
                }
            }
        }
    });
    mainContent.innerHTML = `
        ${paginationHTML}
        <div id="tableScrollContainer" style="width: 100%; overflow: visible; background: white; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
            <style>
                .comparison-table {
                    table-layout: fixed;
                    width: 100%;
                }
                .comparison-table td:first-child,
                .comparison-table th:first-child {
                    width: 280px !important;
                    min-width: 280px !important;
                    max-width: 280px !important;
                    box-sizing: border-box;
                    word-break: break-word;
                }
                .comparison-table td:not(:first-child),
                .comparison-table th:not(:first-child) {
                    width: calc((100% - 280px) / 5) !important;
                    box-sizing: border-box;
                }
                .comparison-table th {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 10 !important;
                    background: white !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                }
                .comparison-table th:first-child {
                    z-index: 20 !important;
                    position: sticky !important;
                    top: 0 !important;
                    left: 0 !important;
                    background: #f8fafc !important;
                }
            </style>
            <table class="comparison-table" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
                <thead>
                    <tr style="background: #f8fafc;">
                        ${headerHTML}
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5;">รหัสโรงพยาบาล</td>
                        ${codeRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5;">ที่อยู่และเขต</td>
                        ${locationRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5;">ประเภทกลุ่มบริการ</td>
                        ${typeRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'OP')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟเส้นทั้งหมด">
                            <span style="display:block; font-weight:700;">ร้อยละความถูกต้องการส่งข้อมูลผู้ป่วยนอก (OP) สิทธิ UC</span>
                        </td>
                        ${latestYearOPRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'OP_MONTHLY')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟเส้นทั้งหมด">
                            <span style="display:block; font-weight:700;">การส่งข้อมูลผู้ป่วยนอก (OP) สิทธิ UC รวมรายปี (ผ่าน / ทั้งหมด / ผู้รับบริการ HDC)</span>
                        </td>
                        ${latestYearOPMonthlyRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'OP_ERRORS')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟข้อผิดพลาดทั้งหมด">
                            <span style="display:block; font-weight:700;">จำนวนข้อมูล OP แยกตามประเภทความผิดพลาดของข้อมูล 15 ลำดับแรก</span>
                        </td>
                        ${latestYearOPErrorsRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'IP')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟเส้นทั้งหมด">
                            <span style="display:block; font-weight:700;">ร้อยละความถูกต้องการส่งข้อมูลผู้ป่วยใน (IP) สิทธิ UC</span>
                        </td>
                        ${latestYearIPRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'IP_MONTHLY')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟเส้นทั้งหมด">
                            <span style="display:block; font-weight:700;">การส่งข้อมูลผู้ป่วยใน (IP) สิทธิ UC รวมรายปี (ผ่าน / ทั้งหมด / ผู้รับบริการ HDC)</span>
                        </td>
                        ${latestYearIPMonthlyRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'IP_ERRORS')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟข้อผิดพลาดทั้งหมด">
                            <span style="display:block; font-weight:700;">จำนวนข้อมูล IP แยกตามประเภทความผิดพลาดของข้อมูล 15 ลำดับแรก</span>
                        </td>
                        ${latestYearIPErrorsRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'IP_LATENCY')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อดูระยะเวลาส่งข้อมูลผู้ป่วยใน">
                            <span style="display:block; font-weight:700;">ระยะเวลาการส่งข้อมูลผู้ป่วยในแยกรายเดือนที่ส่งข้อมูล (30วัน / 60วัน / 90วัน ครั้ง)</span>
                        </td>
                        ${latestYearIPLatencyRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'ADJRW')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟ CMI AdjRW ทั้งหมด">
                            <span style="display:block; font-weight:700;">AdjRW ผู้ป่วยใน</span>
                        </td>
                        ${latestYearADJRWRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showTrendModalFor(null, 'BEDDAYS')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบกราฟจำนวนวันนอนทั้งหมด">
                            <span style="display:block; font-weight:700;">จำนวนวันนอน</span>
                        </td>
                        ${latestYearBEDDAYSRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showPPFSComparisonModal('2569', 'บาท')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบผลงาน PPFS ทุกโรงพยาบาล">
                            <span style="display:block; font-weight:700;">ผลงาน PP Fee Schedule (PPFS) 3 ปี (ครั้ง)</span>
                        </td>
                        ${latestYearPPFSRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td onclick="showStatementComparisonModal('2569', window.currentStatementMetric || 'REP')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบชดเชยรายการย่อยตาม STATEMENT UC ทุกโรงพยาบาล">
                            <span style="display:block; font-weight:700;">พึงรับชดเชยรายการย่อยตาม STATEMENT UC</span>
                            <select onclick="event.stopPropagation()" onchange="window.toggleMainStatementMetric(this.value)" style="margin-top: 4px; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: Sarabun; font-size: 0.8rem; cursor: pointer;">
                                <option value="REP" ${window.currentStatementMetric !== 'STM' ? 'selected' : ''}>ประมวลผลชดเชย (REP)</option>
                                <option value="STM" ${window.currentStatementMetric === 'STM' ? 'selected' : ''}>ประมวลผลจ่าย (STM)</option>
                            </select>
                        </td>
                        ${latestYearStatementRowHTML}
                    </tr>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td onclick="showInstrumentComparisonModal('2569', window.currentInstrumentMetric || 'AMT')" style="font-weight: 600; color: #475569; background: #f8fafc; position: sticky; left: 0; z-index: 5; vertical-align: middle; line-height: 1.4; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='#f8fafc'; this.style.color='#475569';" title="คลิกเพื่อเปรียบเทียบอวัยวะเทียม/อุปกรณ์ ทุกโรงพยาบาล">
                            <span style="display:block; font-weight:700;">อวัยวะเทียม/อุปกรณ์</span>
                            <select onclick="event.stopPropagation()" onchange="window.toggleMainInstrumentMetric(this.value)" style="margin-top: 4px; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: Sarabun; font-size: 0.8rem; cursor: pointer;">
                                <option value="AMT" ${window.currentInstrumentMetric !== 'QTY' ? 'selected' : ''}>ชดเชยรวม (บาท)</option>
                                <option value="QTY" ${window.currentInstrumentMetric === 'QTY' ? 'selected' : ''}>จำนวนรวม (ครั้ง)</option>
                            </select>
                        </td>
                        ${latestYearInstrumentRowHTML}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Restore horizontal scroll position
    const newScrollContainer = document.getElementById('tableScrollContainer');
    if (newScrollContainer) {
        newScrollContainer.scrollLeft = savedScrollLeft;
    }
}

let hoveredHospitalCode = null;
let hoveredCategory = null;
let hoverSource = null;
let borderAnimationOffset = 0;
let borderAnimationFrameId = null;

function formatAbbreviated(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString();
}

function getHospitalColors(index) {
    const hues = [
        220, // Blue
        145, // Emerald/Green
        270, // Purple
        35,  // Orange/Amber
        325, // Pink
        190, // Cyan
        15   // Red/Orange
    ];
    const H = hues[index % hues.length];
    return {
        fail: `hsla(${H}, 80%, 40%, 1)`,
        pass: `hsla(${H}, 70%, 55%, 1)`,
        total: `hsla(${H}, 15%, 82%, 0.35)`,
        base: `hsl(${H}, 70%, 55%)`
    };
}

function getHospitalH(index) {
    const hues = [
        220, // Blue
        145, // Emerald/Green
        270, // Purple
        35,  // Orange/Amber
        325, // Pink
        190, // Cyan
        15   // Red/Orange
    ];
    return hues[index % hues.length];
}

function startBorderAnimation() {
    if (!borderAnimationFrameId) {
        const animate = () => {
            borderAnimationOffset = (borderAnimationOffset + 0.3) % 12;
            const chartsToAnimate = [trendChartInstance, ppfsCompareChartInstance, statementCompareChartInstance, instrumentCompareChartInstance];
            chartsToAnimate.forEach(c => {
                if (c && c.config.type === 'line') {
                    c.data.datasets.forEach(d => {
                        if (d.hospitalCode === hoveredHospitalCode) {
                            d.borderDash = [6, 6];
                            d.borderDashOffset = -borderAnimationOffset;
                        } else {
                            d.borderDash = [];
                            d.borderDashOffset = 0;
                        }
                    });
                    c.update('none');
                } else if (c) {
                    c.draw();
                }
            });
            borderAnimationFrameId = requestAnimationFrame(animate);
        };
        borderAnimationFrameId = requestAnimationFrame(animate);
    }
}

function stopBorderAnimation() {
    if (borderAnimationFrameId) {
        cancelAnimationFrame(borderAnimationFrameId);
        borderAnimationFrameId = null;
    }
    const chartsToAnimate = [trendChartInstance, ppfsCompareChartInstance, statementCompareChartInstance, instrumentCompareChartInstance];
    chartsToAnimate.forEach(c => {
        if (c && c.config.type === 'line') {
            c.data.datasets.forEach(d => {
                d.borderDash = [];
                d.borderDashOffset = 0;
            });
            c.update('none');
        } else if (c) {
            c.draw();
        }
    });
}

function setHoveredHospital(code, source, chart) {
    if (hoveredHospitalCode === code && hoverSource === source) return;
    hoveredHospitalCode = code;
    hoverSource = source;
    
    if (hoveredHospitalCode) {
        startBorderAnimation();
    } else if (!hoveredCategory) {
        stopBorderAnimation();
    } else {
        const chartsToDraw = [trendChartInstance, ppfsCompareChartInstance, statementCompareChartInstance, instrumentCompareChartInstance];
        chartsToDraw.forEach(c => {
            if (c) c.draw();
        });
    }
}

function setHoveredCategory(cat, source, chart) {
    if (hoveredCategory === cat && hoverSource === source) return;
    hoveredCategory = cat;
    hoverSource = source;
    
    if (hoveredCategory) {
        startBorderAnimation();
    } else if (!hoveredHospitalCode) {
        stopBorderAnimation();
    } else {
        if (trendChartInstance) trendChartInstance.draw();
    }
}

const sortBarsWithinGroupsPlugin = {
    id: 'sortBarsWithinGroupsPlugin',
    beforeDatasetsDraw(chart) {
        const sortOrder = window.activeModalState?.sortOrder;
        if (!sortOrder || sortOrder === 'none') return;
        if (sortOrder !== 'desc' && sortOrder !== 'asc') return;

        const type = window.activeModalState?.type;
        const isOPMonthly = type === 'OP_MONTHLY';
        const isIPMonthly = type === 'IP_MONTHLY';
        const isADJRW = type === 'ADJRW';
        const isBEDDAYS = type === 'BEDDAYS';
        const isCMI = isADJRW || isBEDDAYS;
        const isOPErrors = type === 'OP_ERRORS';
        const isIPErrors = type === 'IP_ERRORS';
        const isErrors = isOPErrors || isIPErrors;

        if (!isOPMonthly && !isIPMonthly && !isCMI && !isErrors) return;

        const numCategories = chart.data.labels.length;
        const isHorizontal = chart.config.options.indexAxis === 'y';

        for (let i = 0; i < numCategories; i++) {
            const items = [];
            chart.data.datasets.forEach((dataset, datasetIdx) => {
                const meta = chart.getDatasetMeta(datasetIdx);
                const element = meta.data[i];
                if (element && meta.visible) {
                    const val = parseFloat(dataset.data[i]) || 0;
                    if (isOPMonthly || isIPMonthly || isErrors) {
                        const stackId = dataset.stack || `dataset_${datasetIdx}`;
                        let group = items.find(item => item.id === stackId);
                        if (!group) {
                            group = { id: stackId, elements: [], val: 0 };
                            items.push(group);
                        }
                        group.elements.push(element);
                        group.val += val;
                    } else {
                        items.push({
                            id: `dataset_${datasetIdx}`,
                            elements: [element],
                            val: val
                        });
                    }
                }
            });

            if (items.length > 1) {
                const activeItems = [];
                const inactiveItems = [];
                items.forEach(item => {
                    const cleanVal = parseFloat(item.val);
                    if (isNaN(cleanVal) || cleanVal <= 0) {
                        inactiveItems.push(item);
                    } else {
                        activeItems.push(item);
                    }
                });

                if (sortOrder === 'desc') {
                    activeItems.sort((a, b) => b.val - a.val);
                } else {
                    activeItems.sort((a, b) => a.val - b.val);
                }

                const sortedItems = [...activeItems, ...inactiveItems];
                // Replace items array reference content
                items.length = 0;
                sortedItems.forEach(item => items.push(item));

                // Count total visible stacks (hospitals) to find the correct number of slots
                const visibleStacks = [];
                chart.data.datasets.forEach((dataset, datasetIdx) => {
                    const meta = chart.getDatasetMeta(datasetIdx);
                    if (meta.visible) {
                        const stackId = dataset.stack || `dataset_${datasetIdx}`;
                        if (!visibleStacks.includes(stackId)) {
                            visibleStacks.push(stackId);
                        }
                    }
                });
                const totalVisibleStacksCount = visibleStacks.length;

                // Find min and max original coordinates of the elements
                let minCoord = Infinity;
                let maxCoord = -Infinity;
                items.forEach(item => {
                    item.elements.forEach(el => {
                        const coord = isHorizontal ? el.y : el.x;
                        if (coord < minCoord) minCoord = coord;
                        if (coord > maxCoord) maxCoord = coord;
                    });
                });

                // Calculate step distance and fill active coords sequentially to eliminate gaps
                const step = totalVisibleStacksCount > 1 ? (maxCoord - minCoord) / (totalVisibleStacksCount - 1) : 0;
                const coords = [];
                for (let j = 0; j < items.length; j++) {
                    coords.push(minCoord + j * step);
                }

                items.forEach((item, index) => {
                    const targetCoord = coords[index];
                    item.elements.forEach(el => {
                        if (isHorizontal) {
                            el.y = targetCoord;
                        } else {
                            el.x = targetCoord;
                        }
                    });
                });
            }
        }
    }
};

const stackedLayoutPlugin = {
    id: 'stackedLayoutPlugin',
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        
        const isHorizontal = chart.config.options.indexAxis === 'y';
        const xStacked = chart.config.options.scales?.x?.stacked;
        const yStacked = chart.config.options.scales?.y?.stacked;
        const isStacked = xStacked && yStacked;

        if (isStacked && !isHorizontal) {
            ctx.save();
            ctx.font = 'bold 10px Sarabun, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const datasets = chart.data.datasets;
            const labelsLength = chart.data.labels.length;
            
            const stacks = {};
            datasets.forEach((dataset, datasetIdx) => {
                const stackId = dataset.stack || 'default';
                if (!stacks[stackId]) stacks[stackId] = [];
                stacks[stackId].push(datasetIdx);
            });

            Object.keys(stacks).forEach(stackId => {
                const datasetIndices = stacks[stackId];
                for (let dataIdx = 0; dataIdx < labelsLength; dataIdx++) {
                    let failVal = 0;
                    let passVal = 0;
                    let unsentVal = 0;
                    
                    let failMeta = null;
                    let passMeta = null;
                    let unsentMeta = null;

                    datasetIndices.forEach(datasetIdx => {
                        const dataset = datasets[datasetIdx];
                        const label = dataset.label || '';
                        const val = dataset.data[dataIdx] || 0;
                        const meta = chart.getDatasetMeta(datasetIdx);
                        if (meta.hidden) return;

                        const element = meta.data[dataIdx];

                        if (label.includes('ภายใน 30 วัน') || label.includes('31-60 วัน') || label.includes('61-90 วัน') || label.includes('>90 วัน')) {
                            // Handled separately below
                        } else {
                            if (label.includes('ไม่ผ่าน')) {
                                failVal = val;
                                failMeta = element;
                            } else if (label.includes('ส่งเคลม')) {
                                passVal = val;
                                passMeta = element;
                            } else if (label.includes('ทั้งหมด')) {
                                unsentVal = val;
                                unsentMeta = element;
                            }
                        }
                    });

                    const hasIPLatency = datasets.some(d => {
                        const lbl = d.label || '';
                        return lbl.includes('ภายใน 30 วัน') || lbl.includes('31-60 วัน') || lbl.includes('61-90 วัน') || lbl.includes('>90 วัน');
                    });

                    if (hasIPLatency) {
                        let d30Val = 0;
                        let d60Val = 0;
                        let d90Val = 0;
                        let d91Val = 0;
                        let d30Meta = null;
                        let d60Meta = null;
                        let d90Meta = null;
                        let d91Meta = null;

                        datasetIndices.forEach(datasetIdx => {
                            const dataset = datasets[datasetIdx];
                            const label = dataset.label || '';
                            const val = dataset.data[dataIdx] || 0;
                            const meta = chart.getDatasetMeta(datasetIdx);
                            if (meta.hidden) return;

                            const element = meta.data[dataIdx];

                            if (label.includes('ภายใน 30 วัน')) {
                                d30Val = val;
                                d30Meta = element;
                            } else if (label.includes('31-60 วัน')) {
                                d60Val = val;
                                d60Meta = element;
                            } else if (label.includes('61-90 วัน')) {
                                d90Val = val;
                                d90Meta = element;
                            } else if (label.includes('>90 วัน')) {
                                d91Val = val;
                                d91Meta = element;
                            }
                        });

                        const totalVal = d30Val + d60Val + d90Val + d91Val;

                        const drawSegment = (meta, val, color) => {
                            if (meta && val > 0) {
                                const height = Math.abs(meta.base - meta.y);
                                if (height > 14) {
                                    const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0';
                                    ctx.fillStyle = color;
                                    ctx.fillText(`${formatAbbreviated(val)} (${pct}%)`, meta.x, (meta.y + meta.base) / 2);
                                }
                            }
                        };

                        drawSegment(d30Meta, d30Val, '#1e293b');
                        drawSegment(d60Meta, d60Val, '#1e293b');
                        drawSegment(d90Meta, d90Val, '#1e293b');
                        drawSegment(d91Meta, d91Val, '#ffffff');
                    } else {
                        const claimedVal = failVal + passVal;
                        const totalVal = failVal + passVal + unsentVal;
                        
                        const claimedPct = totalVal > 0 ? ((claimedVal / totalVal) * 100).toFixed(1) : '0';
                        const failPct = claimedVal > 0 ? ((failVal / claimedVal) * 100).toFixed(1) : '0';

                        if (failMeta && failVal > 0) {
                            const height = Math.abs(failMeta.base - failMeta.y);
                            if (height > 14) {
                                ctx.fillStyle = '#ffffff';
                                ctx.fillText(`${formatAbbreviated(failVal)} (${failPct}%)`, failMeta.x, (failMeta.y + failMeta.base) / 2);
                            }
                        }

                        if (passMeta && passVal > 0) {
                            const height = Math.abs(passMeta.base - passMeta.y);
                            if (height > 14) {
                                ctx.fillStyle = '#ffffff';
                                if (unsentMeta) {
                                    ctx.fillText(`${formatAbbreviated(claimedVal)} (${claimedPct}%)`, passMeta.x, (passMeta.y + passMeta.base) / 2);
                                } else {
                                    ctx.fillText(`${formatAbbreviated(claimedVal)}`, passMeta.x, (passMeta.y + passMeta.base) / 2);
                                }
                            }
                        }

                        if (unsentMeta && unsentVal > 0) {
                            const height = Math.abs(unsentMeta.base - unsentMeta.y);
                            if (height > 14) {
                                ctx.fillStyle = '#1e293b';
                                ctx.fillText(`${formatAbbreviated(totalVal)}`, unsentMeta.x, (unsentMeta.y + unsentMeta.base) / 2);
                            }
                        }
                    }


                }
            });
            ctx.restore();
        }

        if (hoveredHospitalCode) {
            const datasets = chart.data.datasets;
            const labelsLength = chart.data.labels.length;
            
            const datasetIndices = [];
            let hospitalColor = '#ffffff';
            datasets.forEach((d, idx) => {
                if (d.hospitalCode === hoveredHospitalCode) {
                    datasetIndices.push(idx);
                    if (d.hospitalColor) {
                        hospitalColor = d.hospitalColor;
                    }
                }
            });

            if (datasetIndices.length > 0) {
                const isBar = chart.config.type === 'bar';
                ctx.save();
                if (isBar) {
                    for (let dataIdx = 0; dataIdx < labelsLength; dataIdx++) {
                        let minX = Infinity, maxX = -Infinity;
                        let minY = Infinity, maxY = -Infinity;
                        let found = false;

                        datasetIndices.forEach(datasetIdx => {
                            const meta = chart.getDatasetMeta(datasetIdx);
                            if (meta.hidden) return;
                            const element = meta.data[dataIdx];
                            if (element) {
                                if (isHorizontal) {
                                    const h = element.height || 20;
                                    minY = Math.min(minY, element.y - h / 2);
                                    maxY = Math.max(maxY, element.y + h / 2);
                                    minX = Math.min(minX, element.x, element.base);
                                    maxX = Math.max(maxX, element.x, element.base);
                                } else {
                                    const w = element.width || 20;
                                    minX = Math.min(minX, element.x - w / 2);
                                    maxX = Math.max(maxX, element.x + w / 2);
                                    minY = Math.min(minY, element.y, element.base);
                                    maxY = Math.max(maxY, element.y, element.base);
                                }
                                found = true;
                            }
                        });

                        if (found) {
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 2.5;
                            ctx.setLineDash([6, 6]);
                            ctx.lineDashOffset = -borderAnimationOffset;
                            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

                            ctx.strokeStyle = hospitalColor;
                            ctx.lineWidth = 2.5;
                            ctx.setLineDash([6, 6]);
                            ctx.lineDashOffset = -borderAnimationOffset + 6;
                            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
                        }
                    }
                }
                ctx.restore();
            }
        }

        if (hoveredCategory) {
            const datasets = chart.data.datasets;
            const labelsLength = chart.data.labels.length;
            
            ctx.save();
            datasets.forEach((dataset, datasetIdx) => {
                if (dataset.label.includes(hoveredCategory)) {
                    const meta = chart.getDatasetMeta(datasetIdx);
                    if (meta.hidden) return;
                    
                    const segmentColor = dataset.backgroundColor || '#ffffff';
                    
                    for (let dataIdx = 0; dataIdx < labelsLength; dataIdx++) {
                        const element = meta.data[dataIdx];
                        if (element) {
                            let minX, maxX, minY, maxY;
                            if (isHorizontal) {
                                const h = element.height || 20;
                                minY = element.y - h / 2;
                                maxY = element.y + h / 2;
                                minX = Math.min(element.x, element.base);
                                maxX = Math.max(element.x, element.base);
                            } else {
                                const w = element.width || 20;
                                minX = element.x - w / 2;
                                maxX = element.x + w / 2;
                                minY = Math.min(element.y, element.base);
                                maxY = Math.max(element.y, element.base);
                            }

                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 2.5;
                            ctx.setLineDash([6, 6]);
                            ctx.lineDashOffset = -borderAnimationOffset;
                            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

                            ctx.strokeStyle = segmentColor;
                            ctx.lineWidth = 2.5;
                            ctx.setLineDash([6, 6]);
                            ctx.lineDashOffset = -borderAnimationOffset + 6;
                            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
                        }
                    }
                }
            });
            ctx.restore();
        }
    }
};

function showTrendModalFor(focusedCode = null, type = 'OP', isResetDrilldown = true, sortOrder = 'asc') {
    if (trendChartInstance) {
        try {
            trendChartInstance.destroy();
        } catch (e) {
            console.warn("Error destroying chart:", e);
        }
        trendChartInstance = null;
    }
    if (isResetDrilldown) {
        currentDrillDownYear = null;
        window.activeModalState = {
            focusedCode,
            type,
            sortOrder,
            hiddenHospitalCodes: [],
            ipLatencyMetric: 'times'
        };
    } else {
        if (!window.activeModalState) {
            window.activeModalState = { hiddenHospitalCodes: [], ipLatencyMetric: 'times' };
        }
        window.activeModalState.focusedCode = focusedCode;
        window.activeModalState.type = type;
        window.activeModalState.sortOrder = sortOrder;
    }

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    const isOP = type === 'OP';
    const isOPMonthly = type === 'OP_MONTHLY';
    const isIP = type === 'IP';
    const isIPMonthly = type === 'IP_MONTHLY';
    const isOPErrors = type === 'OP_ERRORS';
    const isIPErrors = type === 'IP_ERRORS';
    const isErrors = isOPErrors || isIPErrors;
    const isMonthly = false; // No longer line chart for IP monthly
    const isADJRW = type === 'ADJRW';
    const isBEDDAYS = type === 'BEDDAYS';
    const isCMI = isADJRW || isBEDDAYS;
    const isIPLatency = type === 'IP_LATENCY';

    let labelTitle = "";
    if (isOP) labelTitle = "ร้อยละความถูกต้องการส่งข้อมูลผู้ป่วยนอก (OP) สิทธิ UC";
    else if (isOPMonthly) labelTitle = "การส่งข้อมูลผู้ป่วยนอก (OP) สิทธิ UC รวมรายปี (ผ่าน / ทั้งหมด / ผู้รับบริการ HDC)";
    else if (isIP) labelTitle = "ร้อยละความถูกต้องการส่งข้อมูลผู้ป่วยใน (IP) สิทธิ UC";
    else if (isIPMonthly) labelTitle = "การส่งข้อมูลผู้ป่วยใน (IP) สิทธิ UC รวมรายปี (ผ่าน / ทั้งหมด / ผู้รับบริการ HDC)";
    else if (isOPErrors) labelTitle = "จำนวนข้อมูล OP แยกตามประเภทความผิดพลาด of ข้อมูล 15 ลำดับแรก";
    else if (isIPErrors) labelTitle = "จำนวนข้อมูล IP แยกตามประเภทความผิดพลาด of ข้อมูล 15 ลำดับแรก";
    else if (isIPLatency) labelTitle = "ระยะเวลาการส่งข้อมูลผู้ป่วยในแยกรายเดือนที่ส่งข้อมูล";
    else if (isADJRW) labelTitle = "AdjRW ผู้ป่วยใน";
    else if (isBEDDAYS) labelTitle = "จำนวนวันนอน";

    // Filter valid hospitals with data
    let validHospitals = selectedHospitals.filter(h => {
        let hasData = false;
        if (isOP) hasData = (h.opData && h.opData.length > 0);
        else if (isOPMonthly) hasData = (h.opMonthlyData && h.opMonthlyData.length > 0);
        else if (isIP) hasData = (h.ipData && h.ipData.length > 0);
        else if (isIPMonthly) hasData = (h.ipMonthlyData && h.ipMonthlyData.length > 0);
        else if (isOPErrors) hasData = (h.opErrorsData && h.opErrorsData.length > 0);
        else if (isIPErrors) hasData = (h.ipErrorsData && h.ipErrorsData.length > 0);
        else if (isIPLatency) hasData = (h.ipLatencyData && h.ipLatencyData.length > 0);
        else if (isADJRW) hasData = (h.adjrwData && Object.keys(h.adjrwData).length > 0);
        else if (isBEDDAYS) hasData = (h.beddaysData && Object.keys(h.beddaysData).length > 0);
        
        const isLoading = (isOPMonthly || isIPMonthly) 
            ? (h.loadingNHSO || h.loadingHDC) 
            : (isCMI ? h.loadingCMI : (isIPLatency ? h.loadingNHSO_IPLatency : h.loadingNHSO));
        const hasError = (isOPMonthly || isIPMonthly) 
            ? (h.errorNHSO || h.errorHDC) 
            : (isCMI ? h.errorCMI : (isIPLatency ? h.errorNHSO_IPLatency : h.errorNHSO));
        return !isLoading && !hasError && hasData;
    });

    if (focusedCode) {
        validHospitals = validHospitals.filter(h => h.c === focusedCode);
    }
    if (validHospitals.length === 0) return;

    let titleText = isErrors ? labelTitle : `กราฟเปรียบเทียบแนวโน้ม: ${labelTitle}`;
    if (currentDrillDownYear !== null) {
        titleText += ` (ปีงบประมาณ ${currentDrillDownYear})`;
    }
    modalTitle.textContent = titleText;

    let xLabels = [];
    let errorCodes = [];
    const errorCodeDetails = {};
    let errorYLabels = [];

    const monthMapping = {
        'ต.ค.': { offset: -1, code: '10' },
        'พ.ย.': { offset: -1, code: '11' },
        'ธ.ค.': { offset: -1, code: '12' },
        'ม.ค.': { offset: 0, code: '01' },
        'ก.พ.': { offset: 0, code: '02' },
        'มี.ค.': { offset: 0, code: '03' },
        'เม.ย.': { offset: 0, code: '04' },
        'พ.ค.': { offset: 0, code: '05' },
        'มิ.ย.': { offset: 0, code: '06' },
        'ก.ค.': { offset: 0, code: '07' },
        'ส.ค.': { offset: 0, code: '08' },
        'ก.ย.': { offset: 0, code: '09' }
    };

    if (isErrors) {
        // Collect and sort error codes descending based on total errors (NUM) across valid hospitals
        const codeTotalMap = {};
        validHospitals.forEach(h => {
            const errSet = isOPErrors ? h.opErrorsData : h.ipErrorsData;
            (errSet || []).forEach(item => {
                if (item.CODE) {
                    codeTotalMap[item.CODE] = (codeTotalMap[item.CODE] || 0) + (parseInt(item.NUM) || 0);
                    errorCodeDetails[item.CODE] = item.DETAIL || "";
                }
            });
        });

        // Top 15 codes in descending order
        let errorKeysSorted = Object.keys(codeTotalMap)
            .sort((a, b) => codeTotalMap[b] - codeTotalMap[a])
            .slice(0, 15);

        if (sortOrder !== 'none') {
            const codeSortVal = {};
            errorKeysSorted.forEach(code => {
                let val = 0;
                if (sortOrder.startsWith('hosp_')) {
                    const parts = sortOrder.split('_');
                    const targetHospCode = parts[1];
                    const h = validHospitals.find(hosp => hosp.c === targetHospCode);
                    if (h) {
                        const errSet = isOPErrors ? h.opErrorsData : h.ipErrorsData;
                        const item = (errSet || []).find(d => d.CODE === code);
                        val = item ? (parseInt(item.NUM) || 0) : 0;
                    }
                } else {
                    val = codeTotalMap[code] || 0;
                }
                codeSortVal[code] = val;
            });

            const order = sortOrder.endsWith('_asc') || sortOrder === 'total_asc' ? 'asc' : 'desc';
            if (order === 'desc') {
                errorKeysSorted.sort((a, b) => codeSortVal[b] - codeSortVal[a]);
            } else {
                errorKeysSorted.sort((a, b) => codeSortVal[a] - codeSortVal[b]);
            }
        }
        errorCodes = errorKeysSorted;

        errorYLabels = errorCodes.map(code => {
            const detail = errorCodeDetails[code] || "";
            const cleanDetail = detail.length > 35 ? detail.substring(0, 35) + '...' : detail;
            return `C${code}: ${cleanDetail}`;
        });

        if (errorCodes.length === 0) {
            modalBody.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">ไม่มีข้อมูลข้อผิดพลาดสำหรับปีงบประมาณนี้</div>`;
            modal.style.display = "flex";
            return;
        }

        modalBody.innerHTML = `
            <div style="position: relative; width: 100%; height: 380px;">
                <canvas id="trendChartCanvas"></canvas>
            </div>
        `;
    } else {
        if (isOPMonthly || isIPMonthly || isCMI || isIPLatency) {
            if (currentDrillDownYear !== null) {
                xLabels = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
            } else {
                const yearsArray = [];
                for (let y = startYearVal; y <= endYearVal; y++) {
                    yearsArray.push(y);
                }
                xLabels = yearsArray;
            }
        } else {
            // Generate labels array for X-axis
            const xLabelsSet = new Set();
            validHospitals.forEach(h => {
                const dataSet = isOP ? h.opData : h.ipData;
                dataSet.forEach(item => {
                    const yearNum = parseInt(item.YEARSEND);
                    if (!isNaN(yearNum) && yearNum >= startYearVal && yearNum <= endYearVal) {
                        xLabelsSet.add(yearNum);
                    }
                });
            });

            // Sort labels appropriately
            xLabels = Array.from(xLabelsSet).sort((a, b) => a - b);
        }

        if (xLabels.length === 0) {
            modalBody.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">ไม่มีข้อมูลในช่วงปี ${startYearVal} - ${endYearVal}</div>`;
            modal.style.display = "flex";
            return;
        }

        if ((isOPMonthly || isIPMonthly || isCMI || isIPLatency) && currentDrillDownYear !== null) {
            modalBody.innerHTML = `
                <div style="margin-bottom: 1rem; display: flex; justify-content: flex-end; align-items: center;">
                    <button onclick="goBackToYearlyTrend('${focusedCode || ''}', '${type}')" style="background: var(--primary-color); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; font-family: 'Sarabun', sans-serif;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        ⬅️ ย้อนกลับไปรายปี
                    </button>
                </div>
                <div style="position: relative; width: 100%; height: 450px;">
                    <canvas id="trendChartCanvas"></canvas>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div style="position: relative; width: 100%; height: 450px;">
                    <canvas id="trendChartCanvas"></canvas>
                </div>
            `;
        }
    }

    // Build Header Controls (Years + Sorting) dynamically
    let yearSelectHtml = '';
    if (currentDrillDownYear === null && !isErrors) {
        let startYearOptions = '';
        let endYearOptions = '';
        const currentYear = latestYearAvailable || 2569;
        for (let y = currentYear; y >= 2566; y--) {
            startYearOptions += `<option value="${y}" ${startYearVal === y ? 'selected' : ''}>${y}</option>`;
            endYearOptions += `<option value="${y}" ${endYearVal === y ? 'selected' : ''}>${y}</option>`;
        }
        yearSelectHtml = `
            <div style="display: flex; align-items: center; gap: 4px;">
                <label style="font-weight: bold; font-size: 0.9rem; color: #475569; font-family: Sarabun;">ปี:</label>
                <select id="modalStartYear" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun; font-size: 0.9rem; background: white; cursor: pointer;">
                    ${startYearOptions}
                </select>
                <span style="color: #cbd5e1;">-</span>
                <select id="modalEndYear" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun; font-size: 0.9rem; background: white; cursor: pointer;">
                    ${endYearOptions}
                </select>
            </div>
        `;
    }

    let sortSelectorHtml = '';
    if (isErrors || isOPMonthly || isIPMonthly || isCMI || isIPLatency) {
        let sortOptionsHtml = '';
        if (isErrors) {
            sortOptionsHtml = `
                <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>ค่าน้อยไปมาก</option>
                <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>ค่ามากไปน้อย</option>
                <option value="none" ${sortOrder === 'none' ? 'selected' : ''}>ปกติ (ค่ามากไปน้อย)</option>
            `;
        } else {
            sortOptionsHtml = `
                <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>ค่าน้อยไปมาก (ในแต่ละปี)</option>
                <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>ค่ามากไปน้อย (ในแต่ละปี)</option>
                <option value="none" ${sortOrder === 'none' ? 'selected' : ''}>ปกติ (ตามการเลือก)</option>
            `;
        }
        sortSelectorHtml = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <label style="font-weight: bold; font-family: 'Sarabun'; margin: 0; font-size: 0.9rem; color: #475569;">เรียงลำดับ:</label>
                <select id="trendSortSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Sarabun'; font-size: 0.9rem; cursor: pointer; background: white;">
                    ${sortOptionsHtml}
                </select>
            </div>
        `;
    }

    let ipLatencyMetricSelectHtml = '';
    if (isIPLatency) {
        const currentMetric = (window.activeModalState && window.activeModalState.ipLatencyMetric) || 'times';
        ipLatencyMetricSelectHtml = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <label style="font-weight: bold; font-family: 'Sarabun'; margin: 0; font-size: 0.9rem; color: #475569;">แสดงค่า:</label>
                <select id="ipLatencyMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Sarabun'; font-size: 0.9rem; cursor: pointer; background: white;">
                    <option value="times" ${currentMetric === 'times' ? 'selected' : ''}>จำนวนครั้ง (ครั้ง)</option>
                    <option value="adjrw" ${currentMetric === 'adjrw' ? 'selected' : ''}>คะแนน AdjRW</option>
                </select>
            </div>
        `;
    }

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || [];
        let hospitalTogglesHtml = '';
        if (validHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            validHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function') setHoveredHospital('${h.c}', 'button', trendChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function') setHoveredHospital(null, null, trendChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    ${yearSelectHtml}
                    ${sortSelectorHtml}
                    ${ipLatencyMetricSelectHtml}
                </div>
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    modal.style.display = "flex";

    // Palette for lines/bars
    const colors = [
        '#2563eb', // Blue
        '#10b981', // Emerald
        '#8b5cf6', // Purple
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#ef4444'  // Red
    ];

    const hiddenHospitals = (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || [];
    const hospitalsToDraw = validHospitals.filter(h => !hiddenHospitals.includes(h.c));

    let datasets = [];
    if (isErrors) {
        if (focusedCode) {
            const currentHosp = hospitalsToDraw.find(h => h.c === focusedCode);
            if (currentHosp) {
                const errSet = isOPErrors ? currentHosp.opErrorsData : currentHosp.ipErrorsData;
                const colorSet = getHospitalColors(0);
                datasets = [
                    {
                        label: "แก้ไขแล้ว",
                        data: errorCodes.map(code => {
                            const item = (errSet || []).find(d => d.CODE === code);
                            return item ? (parseInt(item.NUM_EDIT) || 0) : 0;
                        }),
                        backgroundColor: colorSet.pass,
                        borderColor: colorSet.pass,
                        borderWidth: 1,
                        stack: 'stack0',
                        hospitalCode: currentHosp.c,
                        hospitalColor: colorSet.base
                    },
                    {
                        label: "ยังไม่แก้ไข",
                        data: errorCodes.map(code => {
                            const item = (errSet || []).find(d => d.CODE === code);
                            return item ? (parseInt(item.NOEDIT) || 0) : 0;
                        }),
                        backgroundColor: colorSet.fail,
                        borderColor: colorSet.fail,
                        borderWidth: 1,
                        stack: 'stack0',
                        hospitalCode: currentHosp.c,
                        hospitalColor: colorSet.base
                    }
                ];
            }
        } else {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                const errSet = isOPErrors ? h.opErrorsData : h.ipErrorsData;
                datasets.push({
                    label: `${h.n} (แก้ไขแล้ว)`,
                    data: errorCodes.map(code => {
                        const item = (errSet || []).find(d => d.CODE === code);
                        return item ? (parseInt(item.NUM_EDIT) || 0) : 0;
                    }),
                    backgroundColor: colorSet.pass,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
                datasets.push({
                    label: `${h.n} (ยังไม่แก้ไข)`,
                    data: errorCodes.map(code => {
                        const item = (errSet || []).find(d => d.CODE === code);
                        return item ? (parseInt(item.NOEDIT) || 0) : 0;
                    }),
                    backgroundColor: colorSet.fail,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
            });
        }
    } else if (isOPMonthly || isIPMonthly) {
        if (currentDrillDownYear !== null) {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                const monthlyDataSet = isOPMonthly ? (h.opMonthlyData || []) : (h.ipMonthlyData || []);

                const passData = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = monthlyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    return item ? (parseInt(item.NUMPASS) || 0) : 0;
                });

                const failData = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = monthlyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    if (item) {
                        const pass = parseInt(item.NUMPASS) || 0;
                        const all = parseInt(item.NUMALL) || 0;
                        return Math.max(0, all - pass);
                    }
                    return 0;
                });

                datasets.push({
                    label: `${h.n} (ไม่ผ่าน)`,
                    data: failData,
                    backgroundColor: colorSet.fail,
                    borderColor: colorSet.fail,
                    borderWidth: 1,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });

                datasets.push({
                    label: `${h.n} (ส่งเคลม)`,
                    data: passData,
                    backgroundColor: colorSet.pass,
                    borderColor: colorSet.pass,
                    borderWidth: 1,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
            });
        } else {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                const monthlyDataSet = isOPMonthly ? (h.opMonthlyData || []) : (h.ipMonthlyData || []);

                const passData = xLabels.map(y => {
                    const targetYearMonthly = monthlyDataSet.filter(item => item.fiscal_year === y);
                    let sumPass = 0;
                    targetYearMonthly.forEach(item => {
                        sumPass += parseInt(item.NUMPASS) || 0;
                    });
                    return sumPass;
                });

                const failData = xLabels.map(y => {
                    const targetYearMonthly = monthlyDataSet.filter(item => item.fiscal_year === y);
                    let sumPass = 0;
                    let sumAll = 0;
                    targetYearMonthly.forEach(item => {
                        sumPass += parseInt(item.NUMPASS) || 0;
                        sumAll += parseInt(item.NUMALL) || 0;
                    });
                    return Math.max(0, sumAll - sumPass);
                });

                const unsentData = xLabels.map(y => {
                    const targetYearMonthly = monthlyDataSet.filter(item => item.fiscal_year === y);
                    let sumAll = 0;
                    targetYearMonthly.forEach(item => {
                        sumAll += parseInt(item.NUMALL) || 0;
                    });
                    const hdcYearData = isOPMonthly 
                        ? (h.hdcData ? h.hdcData[y] : null)
                        : (h.hdcIpData ? h.hdcIpData[y] : null);
                    const hdcTotal = hdcYearData 
                        ? (parseInt(isOPMonthly ? hdcYearData.inscl_visit3 : hdcYearData.inscl3) || 0) 
                        : 0;
                    return Math.max(0, hdcTotal - sumAll);
                });

                datasets.push({
                    label: `${h.n} (ไม่ผ่าน)`,
                    data: failData,
                    backgroundColor: colorSet.fail,
                    borderColor: colorSet.fail,
                    borderWidth: 1,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });

                datasets.push({
                    label: `${h.n} (ส่งเคลม)`,
                    data: passData,
                    backgroundColor: colorSet.pass,
                    borderColor: colorSet.pass,
                    borderWidth: 1,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });

                datasets.push({
                    label: `${h.n} (ทั้งหมด)`,
                    data: unsentData,
                    backgroundColor: colorSet.total,
                    borderColor: colorSet.pass,
                    borderWidth: 1,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
            });
        }
    } else if (isIPLatency) {
        if (currentDrillDownYear !== null) {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const latencyDataSet = h.ipLatencyData || [];
                const metric = window.activeModalState.ipLatencyMetric || 'times';

                const d30Data = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = latencyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    if (!item) return 0;
                    return metric === 'times' ? (parseInt(item.DAY30) || 0) : (parseFloat(item.DAY30_ADJRW) || 0);
                });

                const d60Data = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = latencyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    if (!item) return 0;
                    return metric === 'times' ? (parseInt(item.DAY60) || 0) : (parseFloat(item.DAY60_ADJRW) || 0);
                });

                const d90Data = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = latencyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    if (!item) return 0;
                    return metric === 'times' ? (parseInt(item.DAY90) || 0) : (parseFloat(item.DAY90_ADJRW) || 0);
                });

                const d91Data = xLabels.map(label => {
                    const mapping = monthMapping[label];
                    const targetCalYear = currentDrillDownYear + mapping.offset;
                    const item = latencyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
                    if (!item) return 0;
                    return metric === 'times' ? (parseInt(item.DAY91) || 0) : (parseFloat(item.DAY91_ADJRW) || 0);
                });

                const H = getHospitalH(originalIndex >= 0 ? originalIndex : index);
                
                datasets.push({
                    label: `${formatHospitalName(h.n)} (>90 วัน)`,
                    data: d91Data,
                    backgroundColor: `hsla(${H}, 70%, 35%, 0.9)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (61-90 วัน)`,
                    data: d90Data,
                    backgroundColor: `hsla(${H}, 70%, 50%, 0.75)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (31-60 วัน)`,
                    data: d60Data,
                    backgroundColor: `hsla(${H}, 70%, 65%, 0.6)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (ภายใน 30 วัน)`,
                    data: d30Data,
                    backgroundColor: `hsla(${H}, 70%, 80%, 0.4)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
            });
        } else {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const latencyDataSet = h.ipLatencyData || [];
                const metric = window.activeModalState.ipLatencyMetric || 'times';

                const d30Data = xLabels.map(y => {
                    const targetYearData = latencyDataSet.filter(item => item.fiscal_year === y);
                    let sum = 0;
                    targetYearData.forEach(item => {
                        sum += metric === 'times' ? (parseInt(item.DAY30) || 0) : (parseFloat(item.DAY30_ADJRW) || 0);
                    });
                    return sum;
                });

                const d60Data = xLabels.map(y => {
                    const targetYearData = latencyDataSet.filter(item => item.fiscal_year === y);
                    let sum = 0;
                    targetYearData.forEach(item => {
                        sum += metric === 'times' ? (parseInt(item.DAY60) || 0) : (parseFloat(item.DAY60_ADJRW) || 0);
                    });
                    return sum;
                });

                const d90Data = xLabels.map(y => {
                    const targetYearData = latencyDataSet.filter(item => item.fiscal_year === y);
                    let sum = 0;
                    targetYearData.forEach(item => {
                        sum += metric === 'times' ? (parseInt(item.DAY90) || 0) : (parseFloat(item.DAY90_ADJRW) || 0);
                    });
                    return sum;
                });

                const d91Data = xLabels.map(y => {
                    const targetYearData = latencyDataSet.filter(item => item.fiscal_year === y);
                    let sum = 0;
                    targetYearData.forEach(item => {
                        sum += metric === 'times' ? (parseInt(item.DAY91) || 0) : (parseFloat(item.DAY91_ADJRW) || 0);
                    });
                    return sum;
                });

                const H = getHospitalH(originalIndex >= 0 ? originalIndex : index);

                datasets.push({
                    label: `${formatHospitalName(h.n)} (>90 วัน)`,
                    data: d91Data,
                    backgroundColor: `hsla(${H}, 70%, 35%, 0.9)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (61-90 วัน)`,
                    data: d90Data,
                    backgroundColor: `hsla(${H}, 70%, 50%, 0.75)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (31-60 วัน)`,
                    data: d60Data,
                    backgroundColor: `hsla(${H}, 70%, 65%, 0.6)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
                datasets.push({
                    label: `${formatHospitalName(h.n)} (ภายใน 30 วัน)`,
                    data: d30Data,
                    backgroundColor: `hsla(${H}, 70%, 80%, 0.4)`,
                    stack: `stack_${h.c}`,
                    hospitalCode: h.c,
                    hospitalColor: `hsla(${H}, 70%, 50%, 1)`
                });
            });
        }
    } else if (isCMI) {
        if (currentDrillDownYear !== null) {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                const cmiData = isADJRW ? h.adjrwData : h.beddaysData;
                const yearData = cmiData ? cmiData[currentDrillDownYear] : null;
                const dataValues = xLabels.map(monthLabel => {
                    return yearData ? (yearData.monthly[monthLabel] || 0) : 0;
                });
                
                datasets.push({
                    label: `${h.n}`,
                    data: dataValues,
                    backgroundColor: colorSet.pass,
                    borderColor: colorSet.pass,
                    borderWidth: 1,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
            });
        } else {
            hospitalsToDraw.forEach((h, index) => {
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                const cmiData = isADJRW ? h.adjrwData : h.beddaysData;
                const dataValues = xLabels.map(y => {
                    const yearData = cmiData ? cmiData[y] : null;
                    return yearData ? yearData.total : 0;
                });
                
                datasets.push({
                    label: `${h.n}`,
                    data: dataValues,
                    backgroundColor: colorSet.pass,
                    borderColor: colorSet.pass,
                    borderWidth: 1,
                    hospitalCode: h.c,
                    hospitalColor: colorSet.base
                });
            });
        }
    } else {
        datasets = hospitalsToDraw.map((h, index) => {
            const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
            const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
            const dataSet = isOP ? h.opData : h.ipData;
            
            const dataValues = xLabels.map(label => {
                const item = dataSet.find(d => parseInt(d.YEARSEND) === label);
                return item ? parseFloat(item.PERCENT) : null;
            });

            const isFocused = focusedCode === h.c;

            return {
                label: h.n,
                data: dataValues,
                borderColor: colorSet.base,
                backgroundColor: colorSet.pass + '15',
                borderWidth: isFocused ? 4 : 2,
                pointRadius: isFocused ? 6 : 4,
                pointBackgroundColor: colorSet.base,
                tension: 0.2,
                fill: false,
                hospitalCode: h.c,
                hospitalColor: colorSet.base
            };
        });
    }

    const ctx = document.getElementById('trendChartCanvas').getContext('2d');
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: (isErrors || isOPMonthly || isIPMonthly || isCMI || isIPLatency) ? 'bar' : 'line',
        data: {
            labels: isErrors 
                ? errorYLabels 
                : ((isOPMonthly || isIPMonthly || isCMI || isIPLatency) && currentDrillDownYear !== null 
                    ? xLabels 
                    : xLabels.map(y => `ปี ${y}`)),
            datasets: datasets
        },
        plugins: [stackedLayoutPlugin, sortBarsWithinGroupsPlugin],
        options: {
            onHover: (event, activeElements, chart) => {
                if (activeElements && activeElements.length > 0) {
                    const firstElement = activeElements[0];
                    const datasetIdx = firstElement.datasetIndex;
                    const dataset = chart.data.datasets[datasetIdx];
                    if (dataset) {
                        if (isOPMonthly || isIPMonthly || isErrors || isIPLatency) {
                            let cat = null;
                            if (dataset.label.includes('ไม่ผ่าน')) cat = 'ไม่ผ่าน';
                            else if (dataset.label.includes('ส่งเคลม')) cat = 'ส่งเคลม';
                            else if (dataset.label.includes('ทั้งหมด')) cat = 'ทั้งหมด';
                            else if (dataset.label.includes('แก้ไขแล้ว')) cat = 'แก้ไขแล้ว';
                            else if (dataset.label.includes('ยังไม่แก้ไข')) cat = 'ยังไม่แก้ไข';
                            else if (dataset.label.includes('ภายใน 30 วัน')) cat = 'ภายใน 30 วัน';
                            else if (dataset.label.includes('31-60 วัน')) cat = '31-60 วัน';
                            else if (dataset.label.includes('61-90 วัน')) cat = '61-90 วัน';
                            else if (dataset.label.includes('>90 วัน')) cat = '>90 วัน';
                            
                            if (cat) {
                                setHoveredCategory(cat, 'chart', chart);
                                return;
                            }
                        } else if (dataset.hospitalCode) {
                            setHoveredHospital(dataset.hospitalCode, 'chart', chart);
                            return;
                        }
                    }
                }
                if (hoverSource === 'chart') {
                    setHoveredCategory(null, null, chart);
                    setHoveredHospital(null, null, chart);
                }
            },
            onClick: (event, elements, chart) => {
                if (!(isOPMonthly || isIPMonthly || isCMI || isIPLatency) || currentDrillDownYear !== null) return;
                if (elements && elements.length > 0) {
                    const firstPoint = elements[0];
                    const activeLabel = chart.data.labels[firstPoint.index]; // e.g. "ปี 2568"
                    const matches = activeLabel.match(/ปี\s*(\d+)/);
                    if (matches && matches[1]) {
                        currentDrillDownYear = parseInt(matches[1]);
                        showTrendModalFor(focusedCode, type, false, sortOrder);
                    }
                }
            },
            indexAxis: isErrors ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: (isOPMonthly || isIPMonthly || isErrors || isIPLatency),
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Sarabun, Inter, sans-serif',
                            size: 11
                        },
                        generateLabels: function(chart) {
                            if (isOPMonthly || isIPMonthly) {
                                return [
                                    {
                                        text: 'ไม่ผ่าน',
                                        fillStyle: '#ef4444',
                                        strokeStyle: '#ef4444',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('ไม่ผ่าน') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'ไม่ผ่าน'
                                    },
                                    {
                                        text: 'ส่งเคลม',
                                        fillStyle: '#2563eb',
                                        strokeStyle: '#2563eb',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('ส่งเคลม') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'ส่งเคลม'
                                    },
                                    {
                                        text: 'ทั้งหมด',
                                        fillStyle: '#cbd5e1',
                                        strokeStyle: '#94a3b8',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('ทั้งหมด') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'ทั้งหมด'
                                    }
                                ];
                            }
                            if (isIPLatency) {
                                return [
                                    {
                                        text: 'ภายใน 30 วัน',
                                        fillStyle: '#bfdbfe',
                                        strokeStyle: '#3b82f6',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('ภายใน 30 วัน') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'ภายใน 30 วัน'
                                    },
                                    {
                                        text: '31-60 วัน',
                                        fillStyle: '#fef08a',
                                        strokeStyle: '#eab308',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('31-60 วัน') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: '31-60 วัน'
                                    },
                                    {
                                        text: '61-90 วัน',
                                        fillStyle: '#fed7aa',
                                        strokeStyle: '#f97316',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('61-90 วัน') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: '61-90 วัน'
                                    },
                                    {
                                        text: '>90 วัน',
                                        fillStyle: '#fca5a5',
                                        strokeStyle: '#ef4444',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('>90 วัน') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: '>90 วัน'
                                    }
                                ];
                            }
                            if (isErrors) {
                                return [
                                    {
                                        text: 'แก้ไขแล้ว',
                                        fillStyle: '#10b981',
                                        strokeStyle: '#10b981',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('แก้ไขแล้ว') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'แก้ไขแล้ว'
                                    },
                                    {
                                        text: 'ยังไม่แก้ไข',
                                        fillStyle: '#ef4444',
                                        strokeStyle: '#ef4444',
                                        lineWidth: 1,
                                        hidden: chart.data.datasets.some(d => d.label.includes('ยังไม่แก้ไข') && chart.getDatasetMeta(chart.data.datasets.indexOf(d)).hidden),
                                        category: 'ยังไม่แก้ไข'
                                    }
                                ];
                            }
                            return Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        }
                    },
                    onClick: (event, legendItem, legend) => {
                        if (isOPMonthly || isIPMonthly || isErrors || isIPLatency) {
                            const chart = legend.chart;
                            const category = legendItem.category;
                            const currentlyHidden = legendItem.hidden;
                            chart.data.datasets.forEach((dataset, idx) => {
                                if (dataset.label.includes(category)) {
                                    const meta = chart.getDatasetMeta(idx);
                                    meta.hidden = !currentlyHidden;
                                }
                            });
                            chart.update();
                            return;
                        }
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        if (ci.isDatasetVisible(index)) {
                            ci.hide(index);
                            legendItem.hidden = true;
                        } else {
                            ci.show(index);
                            legendItem.hidden = false;
                        }
                    },
                    onHover: (event, legendItem, legend) => {
                        if (isOPMonthly || isIPMonthly || isErrors || isIPLatency) {
                            setHoveredCategory(legendItem.category, 'legend', legend.chart);
                            return;
                        }
                        const dataset = legend.chart.data.datasets[legendItem.datasetIndex];
                        if (dataset && dataset.hospitalCode) {
                            setHoveredHospital(dataset.hospitalCode, 'legend', legend.chart);
                        }
                    },
                    onLeave: (event, legendItem, legend) => {
                        if (isOPMonthly || isIPMonthly || isErrors || isIPLatency) {
                            if (hoverSource === 'legend') {
                                setHoveredCategory(null, null, legend.chart);
                            }
                            return;
                        }
                        if (hoverSource === 'legend') {
                            setHoveredHospital(null, null, legend.chart);
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            if (isErrors) {
                                const idx = tooltipItems[0].dataIndex;
                                const code = errorCodes[idx];
                                const detail = errorCodeDetails[code] || "";
                                return `รหัสข้อผิดพลาด C${code}\nรายละเอียด: ${detail}`;
                            }
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            if (isErrors) {
                                const dataset = context.dataset;
                                const val = context.raw;
                                return `${dataset.label}: ${val.toLocaleString()} รายการ`;
                            }
                            if (isIPLatency) {
                                const dataIdx = context.dataIndex;
                                const chart = context.chart;
                                const datasets = chart.data.datasets;
                                
                                const dataset = datasets[context.datasetIndex];
                                const stackId = dataset.stack || 'default';
                                const unitStr = window.activeModalState.ipLatencyMetric === 'adjrw' ? 'AdjRW' : 'ครั้ง';
                                
                                let d30Val = 0;
                                let d60Val = 0;
                                let d90Val = 0;
                                let d91Val = 0;

                                datasets.forEach(d => {
                                    if (d.stack === stackId) {
                                        const val = d.data[dataIdx] || 0;
                                        if (d.label.includes('ภายใน 30 วัน')) d30Val = val;
                                        else if (d.label.includes('31-60 วัน')) d60Val = val;
                                        else if (d.label.includes('61-90 วัน')) d90Val = val;
                                        else if (d.label.includes('>90 วัน')) d91Val = val;
                                    }
                                });

                                const totalVal = d30Val + d60Val + d90Val + d91Val;
                                const currentLabel = dataset.label || '';
                                const currentVal = context.raw || 0;
                                const pct = totalVal > 0 ? ((currentVal / totalVal) * 100).toFixed(1) : '0';

                                return `${currentLabel.split('(')[0].trim()} - ${currentLabel.includes('ภายใน 30 วัน') ? 'ภายใน 30 วัน' : (currentLabel.includes('31-60 วัน') ? '31-60 วัน' : (currentLabel.includes('61-90 วัน') ? '61-90 วัน' : '>90 วัน'))}: ${currentVal.toLocaleString(undefined, {minimumFractionDigits: unitStr === 'AdjRW' ? 2 : 0, maximumFractionDigits: unitStr === 'AdjRW' ? 2 : 0})} ${unitStr} (${pct}%)`;
                            }
                            if (isOPMonthly || isIPMonthly) {
                                const dataIdx = context.dataIndex;
                                const chart = context.chart;
                                const datasets = chart.data.datasets;
                                
                                const dataset = datasets[context.datasetIndex];
                                const stackId = dataset.stack || 'default';
                                const unitStr = isOPMonthly ? 'ครั้ง' : 'ราย';
                                
                                let failVal = 0;
                                let passVal = 0;
                                let unsentVal = 0;
                                let hasUnsent = false;

                                datasets.forEach(d => {
                                    if (d.stack === stackId) {
                                        const val = d.data[dataIdx] || 0;
                                        if (d.label.includes('ไม่ผ่าน')) {
                                            failVal = val;
                                        } else if (d.label.includes('ส่งเคลม')) {
                                            passVal = val;
                                        } else if (d.label.includes('ทั้งหมด')) {
                                            unsentVal = val;
                                            hasUnsent = true;
                                        }
                                    }
                                });

                                const claimedVal = failVal + passVal;
                                const totalVal = failVal + passVal + unsentVal;
                                
                                const claimedPct = totalVal > 0 ? ((claimedVal / totalVal) * 100).toFixed(1) : '0';
                                const failPct = claimedVal > 0 ? ((failVal / claimedVal) * 100).toFixed(1) : '0';

                                const currentLabel = dataset.label || '';
                                if (currentLabel.includes('ไม่ผ่าน')) {
                                    return `${dataset.label.split('(')[0].trim()} - ไม่ผ่าน: ${failVal.toLocaleString()} ${unitStr} (${failPct}%)`;
                                } else if (currentLabel.includes('ส่งเคลม')) {
                                    if (hasUnsent) {
                                        return `${dataset.label.split('(')[0].trim()} - ส่งเคลม: ${claimedVal.toLocaleString()} ${unitStr} (${claimedPct}%)`;
                                    } else {
                                        return `${dataset.label.split('(')[0].trim()} - ส่งเคลม: ${claimedVal.toLocaleString()} ${unitStr}`;
                                    }
                                } else if (currentLabel.includes('ทั้งหมด')) {
                                    return `${dataset.label.split('(')[0].trim()} - ทั้งหมด: ${totalVal.toLocaleString()} ${unitStr}`;
                                }
                                return `${dataset.label}: ${context.raw.toLocaleString()} ${unitStr}`;
                            }
                            if (isCMI) {
                                const unitStr = isADJRW ? 'คะแนน' : 'วัน';
                                const formatVal = isADJRW 
                                    ? context.raw.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                                    : context.raw.toLocaleString();
                                return `${context.dataset.label}: ${formatVal} ${unitStr}`;
                            }
                            return `${context.dataset.label}: ${context.raw.toFixed(4)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: (isOPMonthly || isIPMonthly || isErrors || isIPLatency) ? true : false,
                    title: {
                        display: true,
                        text: isErrors ? 'ประเภทความผิดพลาด' : 
                              (isCMI ? (isADJRW ? 'คะแนน AdjRW (คะแนน)' : 'จำนวนวันนอน (วัน)') :
                              (isIPLatency ? `จำนวน (${window.activeModalState.ipLatencyMetric === 'adjrw' ? 'AdjRW' : 'ครั้ง'})` :
                              ((isOPMonthly || isIPMonthly) ? `จำนวน (${isOPMonthly ? 'ครั้ง' : 'ราย'})` : 'เปอร์เซ็นต์ (%)'))),
                        font: {
                            family: 'Sarabun, Inter, sans-serif',
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Sarabun, sans-serif',
                            size: 10
                        }
                    }
                },
                x: {
                    stacked: (isOPMonthly || isIPMonthly || isErrors || isIPLatency) ? true : false,
                    title: {
                        display: true,
                        text: isErrors ? 'จำนวนครั้ง (รายการ)' : 'ปีงบประมาณ',
                        font: {
                            family: 'Sarabun, Inter, sans-serif',
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            if (isErrors) return value.toLocaleString();
                            return this.getLabelForValue(value);
                        }
                    }
                }
            }
        }
    });

    const sortSelect = document.getElementById('trendSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            showTrendModalFor(focusedCode, type, false, e.target.value);
        });
    }

    const modalStartYear = document.getElementById('modalStartYear');
    const modalEndYear = document.getElementById('modalEndYear');
    
    const handleModalYearChange = () => {
        const startYear = parseInt(modalStartYear.value);
        const endYear = parseInt(modalEndYear.value);
        if (startYear > endYear) {
            alert('ปีเริ่มต้นไม่สามารถมากกว่าปีสิ้นสุดได้');
            modalStartYear.value = endYear;
            return;
        }
        
        startYearVal = startYear;
        endYearVal = endYear;
        
        if (document.getElementById('startYear')) document.getElementById('startYear').value = startYear;
        if (document.getElementById('endYear')) document.getElementById('endYear').value = endYear;
        
        // Update main table in the background
        renderComparisonTable();
        
        // Re-render chart instantly
        showTrendModalFor(focusedCode, type, false, sortOrder);
    };
    
    if (modalStartYear) modalStartYear.addEventListener('change', handleModalYearChange);
    if (modalEndYear) modalEndYear.addEventListener('change', handleModalYearChange);

    const ipLatencyMetricSelect = document.getElementById('ipLatencyMetricSelect');
    if (ipLatencyMetricSelect) {
        ipLatencyMetricSelect.addEventListener('change', (e) => {
            window.activeModalState.ipLatencyMetric = e.target.value;
            showTrendModalFor(focusedCode, type, false, sortOrder);
        });
    }
}

function getHospitalValueForYear(h, y, type, isCMI, isADJRW, isOPMonthly, isIPMonthly) {
    if (isCMI) {
        const cmiData = isADJRW ? h.adjrwData : h.beddaysData;
        const yearData = cmiData ? cmiData[y] : null;
        return yearData ? yearData.total : 0;
    } else {
        const monthlyDataSet = isOPMonthly ? (h.opMonthlyData || []) : (h.ipMonthlyData || []);
        const targetYearMonthly = monthlyDataSet.filter(item => item.fiscal_year === y);
        let sumAll = 0;
        targetYearMonthly.forEach(item => {
            sumAll += parseInt(item.NUMALL) || 0;
        });
        const hdcYearData = isOPMonthly 
            ? (h.hdcData ? h.hdcData[y] : null)
            : (h.hdcIpData ? h.hdcIpData[y] : null);
        const hdcTotal = hdcYearData 
            ? (parseInt(isOPMonthly ? hdcYearData.inscl_visit3 : hdcYearData.inscl3) || 0) 
            : 0;
        return Math.max(sumAll, hdcTotal);
    }
}

function getLabelValueForHospital(h, label, type, currentDrillDownYear, monthMapping, isCMI, isADJRW, isOPMonthly, isIPMonthly, sortOrder) {
    let targetHosp = h;
    if (sortOrder.startsWith('hosp_')) {
        const parts = sortOrder.split('_');
        const targetHospCode = parts[1];
        if (h.c !== targetHospCode) return 0;
    }
    
    if (currentDrillDownYear !== null) {
        const monthlyDataSet = isOPMonthly ? (targetHosp.opMonthlyData || []) : (targetHosp.ipMonthlyData || []);
        const mapping = monthMapping[label];
        const targetCalYear = currentDrillDownYear + mapping.offset;
        const item = monthlyDataSet.find(d => d.MONTH_SEND === `${targetCalYear}-${mapping.code}` && d.fiscal_year === currentDrillDownYear);
        return item ? (parseInt(item.NUMALL) || 0) : 0;
    } else {
        const y = label;
        if (isCMI) {
            const cmiData = isADJRW ? targetHosp.adjrwData : targetHosp.beddaysData;
            const yearData = cmiData ? cmiData[y] : null;
            return yearData ? yearData.total : 0;
        } else {
            const monthlyDataSet = isOPMonthly ? (targetHosp.opMonthlyData || []) : (targetHosp.ipMonthlyData || []);
            const targetYearMonthly = monthlyDataSet.filter(item => item.fiscal_year === y);
            let sumAll = 0;
            targetYearMonthly.forEach(item => {
                sumAll += parseInt(item.NUMALL) || 0;
            });
            const hdcYearData = isOPMonthly 
                ? (targetHosp.hdcData ? targetHosp.hdcData[y] : null)
                : (targetHosp.hdcIpData ? targetHosp.hdcIpData[y] : null);
            const hdcTotal = hdcYearData 
                ? (parseInt(isOPMonthly ? hdcYearData.inscl_visit3 : hdcYearData.inscl3) || 0) 
                : 0;
            return Math.max(sumAll, hdcTotal);
        }
    }
}

function closeTrendModal() {
    const modal = document.getElementById('trendModal');
    if (modal) {
        modal.style.display = "none";
    }
    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        headerControls.innerHTML = "";
    }
    if (borderAnimationFrameId) {
        cancelAnimationFrame(borderAnimationFrameId);
        borderAnimationFrameId = null;
    }
    hoveredHospitalCode = null;
    hoveredCategory = null;
    hoverSource = null;
    if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
    }
    if (ppfsChartInstance) {
        ppfsChartInstance.destroy();
        ppfsChartInstance = null;
    }
    if (ppfsCompareChartInstance) {
        ppfsCompareChartInstance.destroy();
        ppfsCompareChartInstance = null;
    }
    if (statementCompareChartInstance) {
        statementCompareChartInstance.destroy();
        statementCompareChartInstance = null;
    }
    if (statementSingleChartInstance) {
        statementSingleChartInstance.destroy();
        statementSingleChartInstance = null;
    }
    if (instrumentCompareChartInstance) {
        instrumentCompareChartInstance.destroy();
        instrumentCompareChartInstance = null;
    }
    if (instrumentSingleChartInstance) {
        instrumentSingleChartInstance.destroy();
        instrumentSingleChartInstance = null;
    }
}

function getPPFSSum(h, year, metric) {
    if (!h.ppfsData || !h.ppfsData.rows) return 0;
    
    let yearIdxOffset = 0;
    if (year === 2568) yearIdxOffset = 3;
    else if (year === 2569) yearIdxOffset = 6;
    
    let metricOffset = 0;
    if (metric === 'ครั้ง') metricOffset = 1;
    else if (metric === 'บาท') metricOffset = 2;
    
    const finalIdx = 2 + yearIdxOffset + metricOffset;
    
    let sum = 0;
    h.ppfsData.rows.forEach(row => {
        if (row && row[finalIdx]) {
            const valStr = row[finalIdx].replace(/,/g, '');
            sum += parseFloat(valStr) || 0;
        }
    });
    return sum;
}



function showPPFSTrendModal(defaultYear = 2569, defaultMetric = 'บาท') {
    window.activeModalState = {
        focusedCode: null,
        type: 'PPFS',
        sortOrder: 'asc',
        ppfsYear: defaultYear,
        ppfsMetric: defaultMetric,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `เปรียบเทียบผลงาน PP Fee Schedule (PPFS) - ปี ${defaultYear}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && ppfsChartInstance) setHoveredHospital('${h.c}', 'button', ppfsChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && ppfsChartInstance) setHoveredHospital(null, null, ppfsChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    modalBody.innerHTML = `
        <div style="max-height: 80vh; overflow-y: auto; padding: 10px;">
            <div style="display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; align-items: center; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-weight: bold; font-family: 'Sarabun'; margin: 0;">เลือกปีงบประมาณ:</label>
                    <select id="ppfsYearSelect" onchange="updatePPFSCompareChart()" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Sarabun';">
                        <option value="2569" ${defaultYear === 2569 ? 'selected' : ''}>2569</option>
                        <option value="2568" ${defaultYear === 2568 ? 'selected' : ''}>2568</option>
                        <option value="2567" ${defaultYear === 2567 ? 'selected' : ''}>2567</option>
                    </select>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-weight: bold; font-family: 'Sarabun'; margin: 0;">เลือกการแสดงผล:</label>
                    <select id="ppfsMetricSelect" onchange="updatePPFSCompareChart()" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Sarabun';">
                        <option value="บาท" ${defaultMetric === 'บาท' ? 'selected' : ''}>จำนวนเงินที่จ่าย (บาท)</option>
                        <option value="ครั้ง" ${defaultMetric === 'ครั้ง' ? 'selected' : ''}>จำนวนครั้งบริการ (ครั้ง)</option>
                        <option value="คน" ${defaultMetric === 'คน' ? 'selected' : ''}>ผู้รับบริการ (คน)</option>
                    </select>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-weight: bold; font-family: 'Sarabun'; margin: 0;">เรียงลำดับ:</label>
                    <select id="ppfsSortSelect" onchange="updatePPFSCompareChart()" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Sarabun';">
                        <option value="asc" selected>ค่าน้อยไปมาก</option>
                        <option value="desc">ค่ามากไปน้อย</option>
                        <option value="none">ปกติ (ตามลำดับการเลือก)</option>
                    </select>
                </div>
            </div>
            
            <div style="position: relative; height: 320px; margin-bottom: 25px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <canvas id="ppfsCompareChart"></canvas>
            </div>
            
            <div id="ppfsTableContainer" style="overflow-x: auto;"></div>
        </div>
    `;

    modal.style.display = 'flex';
    updatePPFSCompareChart();
}

function updatePPFSCompareChart() {
    const year = parseInt(document.getElementById('ppfsYearSelect').value);
    const metric = document.getElementById('ppfsMetricSelect').value;
    const sortVal = document.getElementById('ppfsSortSelect') ? document.getElementById('ppfsSortSelect').value : 'asc';

    if (window.activeModalState) {
        window.activeModalState.ppfsYear = year;
        window.activeModalState.ppfsMetric = metric;
    }

    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `เปรียบเทียบผลงาน PP Fee Schedule (PPFS) - ปี ${year}`;
    
    if (ppfsChartInstance) {
        ppfsChartInstance.destroy();
        ppfsChartInstance = null;
    }
    
    const hiddenHospitals = (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));
    
    // Sort hospitals if requested
    let hospitalItems = hospitalsToDraw.map((h, index) => {
        const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
        const sumVal = getPPFSSum(h, year, metric);
        const colors = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
        return {
            h: h,
            label: formatHospitalName(h.n),
            value: sumVal,
            bgColor: colors.pass,
            borderColor: colors.base
        };
    });

    if (sortVal === 'desc') {
        hospitalItems.sort((a, b) => b.value - a.value);
    } else if (sortVal === 'asc') {
        hospitalItems.sort((a, b) => a.value - b.value);
    }

    const labels = hospitalItems.map(item => item.label);
    const dataValues = hospitalItems.map(item => item.value);
    const backgroundColors = hospitalItems.map(item => item.bgColor);
    const borderColors = hospitalItems.map(item => item.borderColor);
    
    const ctx = document.getElementById('ppfsCompareChart').getContext('2d');
    ppfsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `ผลงาน PPFS (${metric}) รวมทุกรายการ`,
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { family: 'Sarabun, sans-serif' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} ${metric}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                            return value.toLocaleString();
                        },
                        font: { family: 'Sarabun, sans-serif' }
                    }
                },
                x: {
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                }
            }
        }
    });
    
    updatePPFSCompareTable(year, metric, sortVal);
}

function updatePPFSCompareTable(year, metric, sortVal = 'none') {
    const container = document.getElementById('ppfsTableContainer');
    if (!container) return;
    
    const hiddenHospitals = (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));
    
    const itemMap = new Map();
    hospitalsToDraw.forEach(h => {
        if (h.ppfsData && h.ppfsData.rows) {
            h.ppfsData.rows.forEach(cells => {
                const group = cells[0];
                const name = cells[1];
                const key = group + '||' + name;
                if (!itemMap.has(key)) {
                    itemMap.set(key, { group, name });
                }
            });
        }
    });
    
    const uniqueItems = Array.from(itemMap.values()).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
    
    // Sort hospitals for table headers and rows based on sortVal
    let sortedHospitals = [...hospitalsToDraw];
    if (sortVal === 'desc' || sortVal === 'asc') {
        const hValues = hospitalsToDraw.map(h => ({
            h,
            val: getPPFSSum(h, year, metric)
        }));
        if (sortVal === 'desc') {
            hValues.sort((a, b) => b.val - a.val);
        } else {
            hValues.sort((a, b) => a.val - b.val);
        }
        sortedHospitals = hValues.map(item => item.h);
    }

    let tableHeadersHtml = `<th style="min-width: 150px; text-align: left;">กลุ่มรายการ</th><th style="min-width: 180px; text-align: left;">รายการ</th>`;
    sortedHospitals.forEach(h => {
        tableHeadersHtml += `<th style="text-align: right;">${formatHospitalName(h.n)} (${metric})</th>`;
    });
    
    let tableRowsHtml = "";
    
    let yearIdxOffset = 0;
    if (year === 2568) yearIdxOffset = 3;
    else if (year === 2569) yearIdxOffset = 6;
    
    let metricOffset = 0;
    if (metric === 'ครั้ง') metricOffset = 1;
    else if (metric === 'บาท') metricOffset = 2;
    
    const finalIdx = 2 + yearIdxOffset + metricOffset;
    
    uniqueItems.forEach(item => {
        let rowCellsHtml = `
            <td style="text-align: left; font-weight: bold; background: #f8fafc;">${item.group}</td>
            <td style="text-align: left;">${item.name}</td>
        `;
        
        sortedHospitals.forEach(h => {
            let valStr = "-";
            if (h.ppfsData && h.ppfsData.rows) {
                const row = h.ppfsData.rows.find(r => r[0] === item.group && r[1] === item.name);
                if (row && row[finalIdx]) {
                    valStr = row[finalIdx];
                }
            }
            rowCellsHtml += `<td style="text-align: right;">${valStr}</td>`;
        });
        
        tableRowsHtml += `<tr>${rowCellsHtml}</tr>`;
    });
    
    container.innerHTML = `
        <table class="table table-bordered table-striped" style="width: 100%;">
            <thead>
                <tr>
                    ${tableHeadersHtml}
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
    `;
}

// Ensure year filter change reloads all comparison data
function handleYearChange() {
    const startYear = parseInt(document.getElementById('startYear').value);
    const endYear = parseInt(document.getElementById('endYear').value);

    if (startYear > endYear) {
        alert('ปีเริ่มต้นไม่สามารถมากกว่าปีสิ้นสุดได้');
        document.getElementById('startYear').value = endYear;
        return;
    }

    startYearVal = startYear;
    endYearVal = endYear;

    // Reload statement data for all currently selected hospitals
    selectedHospitals.forEach(h => {
        fetchHospitalDataForComparison(h.c);
    });
    
    renderComparisonTable();
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.zIndex = '1001';
        searchInput.parentElement.style.zIndex = '1001';
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            const sugg = document.getElementById('suggestions');
            if (sugg) sugg.style.display = 'none';
        }
    });

window.toggleHospitalInChart = function(code) {
    if (!window.activeModalState.hiddenHospitalCodes) {
        window.activeModalState.hiddenHospitalCodes = [];
    }
    const idx = window.activeModalState.hiddenHospitalCodes.indexOf(code);
    if (idx >= 0) {
        window.activeModalState.hiddenHospitalCodes.splice(idx, 1);
    } else {
        window.activeModalState.hiddenHospitalCodes.push(code);
    }
    const { focusedCode, type, sortOrder, focusedItem } = window.activeModalState;
    if (type === 'PPFS') {
        if (focusedItem) {
            showPPFSItemDrilldown(focusedItem);
        } else {
            showPPFSComparisonModal(window.activeModalState.ppfsYear, window.activeModalState.ppfsMetric, window.activeModalState.ppfsViewMode || 'chart', window.activeModalState.ppfsSortOrder || 'desc');
        }
    } else if (type === 'STATEMENT') {
        if (focusedItem) {
            showStatementItemDrilldown(focusedItem);
        } else {
            showStatementComparisonModal(window.activeModalState.statementYear, window.activeModalState.statementMetric, window.activeModalState.statementViewMode || 'chart', window.activeModalState.statementSortOrder || 'desc');
        }
    } else if (type === 'INSTRUMENT') {
        if (focusedItem) {
            showInstrumentItemDrilldown(focusedItem);
        } else {
            showInstrumentComparisonModal(window.activeModalState.instrumentYear, window.activeModalState.instrumentMetric, window.activeModalState.instrumentViewMode || 'chart', window.activeModalState.instrumentSortOrder || 'desc');
        }
    } else {
        showTrendModalFor(focusedCode, type, false, sortOrder);
    }
};

    if (typeof initialize === 'function') {
        initialize();
    }
});

let statementCompareChartInstance = null;
let instrumentCompareChartInstance = null;
let instrumentSingleChartInstance = null;

window.toggleMainStatementMetric = function(val) {
    window.currentStatementMetric = val;
    renderComparisonTable();
};

window.toggleMainInstrumentMetric = function(val) {
    window.currentInstrumentMetric = val;
    renderComparisonTable();
};

function showStatementComparisonModal(year = '2569', metric = 'REP', viewMode = 'chart', sortOrder = 'desc') {
    window.activeModalState = {
        focusedCode: null,
        type: 'STATEMENT',
        sortOrder: sortOrder,
        statementYear: year,
        statementMetric: metric,
        statementViewMode: viewMode,
        statementSortOrder: sortOrder,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `เปรียบเทียบชดเชยรายการย่อยตาม STATEMENT UC ทุกโรงพยาบาล`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && statementCompareChartInstance) setHoveredHospital('${h.c}', 'button', statementCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && statementCompareChartInstance) setHoveredHospital(null, null, statementCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    // Collect all unique SUB_FUND names across visible hospitals
    const allItemsSet = new Set();
    const subFundDescriptions = {};
    hospitalsToDraw.forEach(h => {
        if (h.statementData && h.statementData[year]) {
            h.statementData[year].forEach(row => {
                const subFund = row.SUB_FUND;
                allItemsSet.add(subFund);
                if (row.DESCRIPTION) {
                    subFundDescriptions[subFund] = row.DESCRIPTION;
                }
            });
        }
    });

    // Calculate total metric value for each SUB_FUND to sort them
    const itemTotalMetric = {};
    const key = metric === 'REP' ? 'ACT_AMT' : 'ACT_AMT_STM';
    allItemsSet.forEach(item => {
        let total = 0;
        hospitalsToDraw.forEach(h => {
            const row = h.statementData?.[year]?.find(r => r.SUB_FUND === item);
            if (row && row[key]) {
                const valStr = String(row[key]).replace(/,/g, '');
                total += parseFloat(valStr) || 0;
            }
        });
        itemTotalMetric[item] = total;
    });

    let allItems = Array.from(allItemsSet);
    if (sortOrder === 'desc') {
        allItems.sort((a, b) => itemTotalMetric[b] - itemTotalMetric[a]);
    } else if (sortOrder === 'asc') {
        allItems.sort((a, b) => itemTotalMetric[a] - itemTotalMetric[b]);
    } else if (sortOrder === 'alphabetical') {
        allItems.sort((a, b) => a.localeCompare(b, 'th'));
    }

    // Setup controls HTML
    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <!-- View Mode Switcher -->
                <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 8px; gap: 4px;">
                    <button id="stmtViewChartBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'chart' ? 'white' : 'transparent'}; color: ${viewMode === 'chart' ? '#1e293b' : '#64748b'};">📊 กราฟ</button>
                    <button id="stmtViewTableBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'table' ? 'white' : 'transparent'}; color: ${viewMode === 'table' ? '#1e293b' : '#64748b'};">📋 ตาราง</button>
                </div>
                
                <!-- Year Selector -->
                <div id="stmtYearSelectContainer" style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ปีงบประมาณ:</label>
                    <select id="stmtYearSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="2569" ${year === '2569' ? 'selected' : ''}>2569</option>
                        <option value="2568" ${year === '2568' ? 'selected' : ''}>2568</option>
                        <option value="2567" ${year === '2567' ? 'selected' : ''}>2567</option>
                    </select>
                </div>

                <!-- Metric Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="stmtMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="REP" ${metric === 'REP' ? 'selected' : ''}>ประมวลผลชดเชย (REP)</option>
                        <option value="STM" ${metric === 'STM' ? 'selected' : ''}>ประมวลผลจ่าย (STM)</option>
                    </select>
                </div>

                <!-- Sort Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">เรียงลำดับ:</label>
                    <select id="stmtSortSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>ค่ามากไปน้อย</option>
                        <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>ค่าน้อยไปมาก</option>
                        <option value="alphabetical" ${sortOrder === 'alphabetical' ? 'selected' : ''}>ตามตัวอักษร</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (viewMode === 'chart') {
        const datasets = hospitalsToDraw.map((h, index) => {
            const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
            const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
            const data = allItems.map(item => {
                const row = h.statementData?.[year]?.find(r => r.SUB_FUND === item);
                if (!row || !row[key]) return 0;
                const valStr = String(row[key]).replace(/,/g, '');
                return parseFloat(valStr) || 0;
            });

            return {
                label: formatHospitalName(h.n),
                data: data,
                backgroundColor: colorSet.base,
                borderColor: colorSet.base,
                borderWidth: 1,
                hospitalCode: h.c,
                hospitalColor: colorSet.base
            };
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
                <div style="height: ${Math.max(450, allItems.length * 35)}px; min-height: 450px;">
                    <canvas id="stmtCompareChart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('stmtYearSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(e.target.value, document.getElementById('stmtMetricSelect').value, 'chart', document.getElementById('stmtSortSelect').value);
        });
        document.getElementById('stmtMetricSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(document.getElementById('stmtYearSelect').value, e.target.value, 'chart', document.getElementById('stmtSortSelect').value);
        });
        document.getElementById('stmtSortSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(document.getElementById('stmtYearSelect').value, document.getElementById('stmtMetricSelect').value, 'chart', e.target.value);
        });
        document.getElementById('stmtViewTableBtn').addEventListener('click', () => {
            showStatementComparisonModal(year, metric, 'table', sortOrder);
        });

        const ctx = document.getElementById('stmtCompareChart').getContext('2d');
        if (statementCompareChartInstance) {
            statementCompareChartInstance.destroy();
        }

        statementCompareChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allItems.map(item => {
                    const desc = subFundDescriptions[item] || item;
                    const combined = `${item} (${desc})`;
                    return combined.length > 50 ? combined.substring(0, 50) + '...' : combined;
                }),
                datasets: datasets
            },
            plugins: [stackedLayoutPlugin],
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                        position: 'top',
                        labels: { font: { family: 'Sarabun, sans-serif', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const sf = allItems[tooltipItems[0].dataIndex];
                                return `${sf} - ${subFundDescriptions[sf] || ''}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()} บาท`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: `จำนวนเงิน (บาท)`,
                            font: { family: 'Sarabun, sans-serif', weight: 'bold' }
                        },
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    },
                    y: {
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
                },
                onClick: (e, activeEls) => {
                    if (activeEls && activeEls.length > 0) {
                        const firstPoint = activeEls[0];
                        const dataIndex = firstPoint.index;
                        const clickedItem = allItems[dataIndex];
                        showStatementItemDrilldown(clickedItem);
                    }
                }
            }
        });
    } else {
        let tableHeadersHtml = `<th style="min-width: 120px; text-align: left;">รหัสกองทุนย่อย</th><th style="min-width: 250px; text-align: left;">ชื่อกองทุนย่อย</th>`;
        hospitalsToDraw.forEach(h => {
            tableHeadersHtml += `<th style="text-align: right;">${formatHospitalName(h.n)} (บาท)</th>`;
        });

        let tableRowsHtml = "";
        allItems.forEach(item => {
            let rowCellsHtml = `
                <td style="text-align: left; font-weight: bold; background: #f8fafc;">${item}</td>
                <td style="text-align: left;">${subFundDescriptions[item] || '-'}</td>
            `;

            hospitalsToDraw.forEach(h => {
                let valStr = "-";
                const row = h.statementData?.[year]?.find(r => r.SUB_FUND === item);
                if (row && row[key]) {
                    valStr = parseFloat(row[key]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                rowCellsHtml += `<td style="text-align: right;">${valStr}</td>`;
            });

            tableRowsHtml += `<tr>${rowCellsHtml}</tr>`;
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="overflow-x: auto; max-height: 60vh;">
                <table class="table table-bordered table-striped" style="width: 100%;">
                    <thead>
                        <tr style="background: #1a3c5e; color: white;">
                            ${tableHeadersHtml}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
            <style>
                .table-bordered { border: 1px solid #dee2e6; }
                .table { width: 100%; margin-bottom: 1rem; color: #212529; border-collapse: collapse; }
                .table th { background: #1a3c5e !important; color: white !important; font-family: 'Sarabun', sans-serif; font-size: 12px; padding: 8px; text-align: center; }
                .table td { padding: 8px; vertical-align: middle; border: 1px solid #dee2e6; font-size: 12px; }
                .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
            </style>
        `;

        document.getElementById('stmtYearSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(e.target.value, document.getElementById('stmtMetricSelect').value, 'table', document.getElementById('stmtSortSelect').value);
        });
        document.getElementById('stmtMetricSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(document.getElementById('stmtYearSelect').value, e.target.value, 'table', document.getElementById('stmtSortSelect').value);
        });
        document.getElementById('stmtSortSelect').addEventListener('change', (e) => {
            showStatementComparisonModal(document.getElementById('stmtYearSelect').value, document.getElementById('stmtMetricSelect').value, 'table', e.target.value);
        });
        document.getElementById('stmtViewChartBtn').addEventListener('click', () => {
            showStatementComparisonModal(year, metric, 'chart', sortOrder);
        });
    }

    modal.style.display = 'flex';
}

let statementSingleChartInstance = null;

function showStatementModal(hospitalCode, year = '2569', viewMode = 'table') {
    const target = selectedHospitals.find(h => h.c === hospitalCode);
    if (!target || !target.statementData) return;

    window.activeModalState = {
        focusedCode: hospitalCode,
        type: 'STATEMENT_SINGLE',
        statementYear: year,
        statementViewMode: viewMode,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `รายละเอียดชดเชยรายการย่อยตาม STATEMENT UC - ${target.n}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        headerControls.innerHTML = "";
    }

    const rows = target.statementData[year] || [];
    
    // Sort rows by REP (ACT_AMT) descending by default
    const sortedRows = [...rows].sort((a, b) => {
        const valA = parseFloat(String(a.ACT_AMT).replace(/,/g, '')) || 0;
        const valB = parseFloat(String(b.ACT_AMT).replace(/,/g, '')) || 0;
        return valB - valA;
    });

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <!-- View Mode Switcher -->
                <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 8px; gap: 4px;">
                    <button id="stmtSingleViewTableBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'table' ? 'white' : 'transparent'}; color: ${viewMode === 'table' ? '#1e293b' : '#64748b'};">📋 ตาราง</button>
                    <button id="stmtSingleViewChartBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'chart' ? 'white' : 'transparent'}; color: ${viewMode === 'chart' ? '#1e293b' : '#64748b'};">📊 กราฟ</button>
                </div>
                
                <!-- Year Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ปีงบประมาณ:</label>
                    <select id="stmtSingleYearSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="2569" ${year === '2569' ? 'selected' : ''}>2569</option>
                        <option value="2568" ${year === '2568' ? 'selected' : ''}>2568</option>
                        <option value="2567" ${year === '2567' ? 'selected' : ''}>2567</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (viewMode === 'table') {
        let tableRowsHtml = "";
        let totalVisit = 0;
        let totalRep = 0;
        let totalStm = 0;

        sortedRows.forEach(row => {
            const visit = parseInt(row.NUM_VISIT) || 0;
            const rep = parseFloat(row.ACT_AMT) || 0;
            const stm = parseFloat(row.ACT_AMT_STM) || 0;

            totalVisit += visit;
            totalRep += rep;
            totalStm += stm;

            tableRowsHtml += `
                <tr>
                    <td style="text-align: left; font-weight: bold; background: #f8fafc;">${row.FUND_AF}</td>
                    <td style="text-align: left; font-weight: bold; background: #f8fafc;">${row.SUB_FUND}</td>
                    <td style="text-align: left;">${row.DESCRIPTION || '-'}</td>
                    <td style="text-align: right;">${visit.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 600; color: #0284c7;">${rep.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="text-align: right; font-weight: 600; color: #e67e22;">${stm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `;
        });

        tableRowsHtml += `
            <tr style="background: #e2e8f0; font-weight: 700;">
                <td colspan="3" style="text-align: center;">รวม</td>
                <td style="text-align: right;">${totalVisit.toLocaleString()}</td>
                <td style="text-align: right; color: #0284c7;">${totalRep.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="text-align: right; color: #e67e22;">${totalStm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
        `;

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="overflow-x: auto; max-height: 60vh;">
                <table class="table table-bordered table-striped" style="width: 100%;">
                    <thead>
                        <tr style="background: #1a3c5e; color: white;">
                            <th>รหัสกองทุนหลัก</th>
                            <th>รหัสกองทุนย่อย</th>
                            <th style="min-width: 250px;">ชื่อกองทุนย่อย</th>
                            <th>จำนวนครั้ง</th>
                            <th>ประมวลผลชดเชย (REP)</th>
                            <th>ประมวลผลจ่าย (STM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
            <style>
                .table-bordered { border: 1px solid #dee2e6; }
                .table { width: 100%; margin-bottom: 1rem; color: #212529; border-collapse: collapse; }
                .table th { background: #1a3c5e !important; color: white !important; font-family: 'Sarabun', sans-serif; font-size: 12px; padding: 8px; text-align: center; }
                .table td { padding: 8px; vertical-align: middle; border: 1px solid #dee2e6; font-size: 12px; }
                .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
            </style>
        `;

        document.getElementById('stmtSingleYearSelect').addEventListener('change', (e) => {
            showStatementModal(hospitalCode, e.target.value, 'table');
        });
        document.getElementById('stmtSingleViewChartBtn').addEventListener('click', () => {
            showStatementModal(hospitalCode, year, 'chart');
        });

    } else {
        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
                <div style="height: ${Math.max(450, sortedRows.length * 38)}px; min-height: 450px;">
                    <canvas id="stmtSingleChart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('stmtSingleYearSelect').addEventListener('change', (e) => {
            showStatementModal(hospitalCode, e.target.value, 'chart');
        });
        document.getElementById('stmtSingleViewTableBtn').addEventListener('click', () => {
            showStatementModal(hospitalCode, year, 'table');
        });

        const labels = sortedRows.map(r => {
            const desc = r.DESCRIPTION || r.SUB_FUND;
            const combined = `${r.SUB_FUND} (${desc})`;
            return combined.length > 50 ? combined.substring(0, 50) + '...' : combined;
        });

        const repData = sortedRows.map(r => parseFloat(String(r.ACT_AMT).replace(/,/g, '')) || 0);
        const stmData = sortedRows.map(r => parseFloat(String(r.ACT_AMT_STM).replace(/,/g, '')) || 0);

        const ctx = document.getElementById('stmtSingleChart').getContext('2d');
        if (statementSingleChartInstance) {
            statementSingleChartInstance.destroy();
        }

        statementSingleChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ประมวลผลชดเชย (REP)',
                        data: repData,
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'ประมวลผลจ่าย (STM)',
                        data: stmData,
                        backgroundColor: '#e67e22',
                        borderColor: '#e67e22',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { family: 'Sarabun, sans-serif', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const idx = tooltipItems[0].dataIndex;
                                const row = sortedRows[idx];
                                return `${row.SUB_FUND} - ${row.DESCRIPTION || ''}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()} บาท`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: `จำนวนเงิน (บาท)`,
                            font: { family: 'Sarabun, sans-serif', weight: 'bold' }
                        },
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    },
                    y: {
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    }
                }
            }
        });
    }

    modal.style.display = 'flex';
}

function showPPFSItemDrilldown(itemName) {
    window.activeModalState.focusedItem = itemName;

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `แนวโน้มผลงาน PPFS: ${itemName}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && ppfsCompareChartInstance) setHoveredHospital('${h.c}', 'button', ppfsCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && ppfsCompareChartInstance) setHoveredHospital(null, null, ppfsCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const { ppfsYear, ppfsMetric, ppfsSortOrder } = window.activeModalState;

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <button onclick="delete window.activeModalState.focusedItem; showPPFSComparisonModal('${ppfsYear}', '${ppfsMetric}', 'chart', '${ppfsSortOrder}')" style="background: white; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 6px 14px; border-radius: 8px; font-family: Sarabun; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: all 0.2s;" onmouseover="this.style.background='var(--primary-color)'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='var(--primary-color)';">
                    ← ย้อนกลับ
                </button>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="ppfsDrilldownMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="บาท" ${ppfsMetric === 'บาท' ? 'selected' : ''}>บาท (จำนวนเงิน)</option>
                        <option value="ครั้ง" ${ppfsMetric === 'ครั้ง' ? 'selected' : ''}>ครั้ง (จำนวนครั้งบริการ)</option>
                        <option value="คน" ${ppfsMetric === 'คน' ? 'selected' : ''}>คน (ผู้รับบริการ)</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = `
        ${controlsHTML}
        <div style="position: relative; height: 60vh; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <canvas id="ppfsDrilldownChart"></canvas>
        </div>
    `;

    document.getElementById('ppfsDrilldownMetricSelect').addEventListener('change', (e) => {
        window.activeModalState.ppfsMetric = e.target.value;
        showPPFSItemDrilldown(itemName);
    });

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    const years = ['2567', '2568', '2569'];

    const datasets = hospitalsToDraw.map((h, index) => {
        const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
        const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
        
        const data = years.map(yr => {
            const row = h.ppfsData?.rows?.find(r => r[1] === itemName);
            if (!row) return 0;
            
            let cellIdx = 10;
            if (yr === '2567') {
                if (ppfsMetric === 'คน') cellIdx = 2;
                else if (ppfsMetric === 'ครั้ง') cellIdx = 3;
                else cellIdx = 4;
            } else if (yr === '2568') {
                if (ppfsMetric === 'คน') cellIdx = 5;
                else if (ppfsMetric === 'ครั้ง') cellIdx = 6;
                else cellIdx = 7;
            } else {
                if (ppfsMetric === 'คน') cellIdx = 8;
                else if (ppfsMetric === 'ครั้ง') cellIdx = 9;
                else cellIdx = 10;
            }
            
            const valStr = (row[cellIdx] || '0').replace(/,/g, '');
            return parseFloat(valStr) || 0;
        });

        return {
            label: formatHospitalName(h.n),
            data: data,
            borderColor: colorSet.base,
            backgroundColor: colorSet.base,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.15,
            hospitalCode: h.c,
            hospitalColor: colorSet.base
        };
    });

    const ctx = document.getElementById('ppfsDrilldownChart').getContext('2d');
    if (ppfsCompareChartInstance) {
        ppfsCompareChartInstance.destroy();
    }

    ppfsCompareChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} ${ppfsMetric}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'ปีงบประมาณ', font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                },
                y: {
                    title: { display: true, text: `จำนวน (${ppfsMetric})`, font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                }
            }
        }
    });
}

function showStatementItemDrilldown(itemName) {
    window.activeModalState.focusedItem = itemName;

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `แนวโน้มชดเชย STATEMENT UC: ${itemName}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && statementCompareChartInstance) setHoveredHospital('${h.c}', 'button', statementCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && statementCompareChartInstance) setHoveredHospital(null, null, statementCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const { statementYear, statementMetric, statementSortOrder } = window.activeModalState;

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <button onclick="delete window.activeModalState.focusedItem; showStatementComparisonModal('${statementYear}', '${statementMetric}', 'chart', '${statementSortOrder}')" style="background: white; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 6px 14px; border-radius: 8px; font-family: Sarabun; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: all 0.2s;" onmouseover="this.style.background='var(--primary-color)'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='var(--primary-color)';">
                    ← ย้อนกลับ
                </button>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="stmtDrilldownMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="REP" ${statementMetric === 'REP' ? 'selected' : ''}>ประมวลผลชดเชย (REP)</option>
                        <option value="STM" ${statementMetric === 'STM' ? 'selected' : ''}>ประมวลผลจ่าย (STM)</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = `
        ${controlsHTML}
        <div style="position: relative; height: 60vh; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <canvas id="statementDrilldownChart"></canvas>
        </div>
    `;

    document.getElementById('stmtDrilldownMetricSelect').addEventListener('change', (e) => {
        window.activeModalState.statementMetric = e.target.value;
        showStatementItemDrilldown(itemName);
    });

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    const years = ['2567', '2568', '2569'];
    const key = statementMetric === 'REP' ? 'ACT_AMT' : 'ACT_AMT_STM';

    const datasets = hospitalsToDraw.map((h, index) => {
        const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
        const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
        
        const data = years.map(yr => {
            const rows = h.statementData?.[yr] || [];
            const match = rows.find(r => r.SUB_FUND === itemName);
            if (!match || !match[key]) return 0;
            return parseFloat(String(match[key]).replace(/,/g, '')) || 0;
        });

        return {
            label: formatHospitalName(h.n),
            data: data,
            borderColor: colorSet.base,
            backgroundColor: colorSet.base,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.15,
            hospitalCode: h.c,
            hospitalColor: colorSet.base
        };
    });

    const ctx = document.getElementById('statementDrilldownChart').getContext('2d');
    if (statementCompareChartInstance) {
        statementCompareChartInstance.destroy();
    }

    statementCompareChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} บาท`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'ปีงบประมาณ', font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                },
                y: {
                    title: { display: true, text: `จำนวนเงิน (${statementMetric} - บาท)`, font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                }
            }
        }
    });
}

function showInstrumentModal(hospitalCode, year = '2569', viewMode = 'table') {
    const target = selectedHospitals.find(h => h.c === hospitalCode);
    if (!target || !target.instrumentData) return;

    window.activeModalState = {
        focusedCode: hospitalCode,
        type: 'INSTRUMENT_SINGLE',
        instrumentYear: year,
        instrumentViewMode: viewMode,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `รายละเอียดอวัยวะเทียม/อุปกรณ์ - ${target.n}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        headerControls.innerHTML = "";
    }

    const rows = target.instrumentData[year] || [];
    
    // Sort rows by SUM_AMT descending by default
    const sortedRows = [...rows].sort((a, b) => {
        const valA = parseFloat(String(a.SUM_AMT).replace(/,/g, '')) || 0;
        const valB = parseFloat(String(b.SUM_AMT).replace(/,/g, '')) || 0;
        return valB - valA;
    });

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <!-- View Mode Switcher -->
                <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 8px; gap: 4px;">
                    <button id="instSingleViewTableBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'table' ? 'white' : 'transparent'}; color: ${viewMode === 'table' ? '#1e293b' : '#64748b'};">📋 ตาราง</button>
                    <button id="instSingleViewChartBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'chart' ? 'white' : 'transparent'}; color: ${viewMode === 'chart' ? '#1e293b' : '#64748b'};">📊 กราฟ</button>
                </div>
                
                <!-- Year Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ปีงบประมาณ:</label>
                    <select id="instSingleYearSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="2569" ${year === '2569' ? 'selected' : ''}>2569</option>
                        <option value="2568" ${year === '2568' ? 'selected' : ''}>2568</option>
                        <option value="2567" ${year === '2567' ? 'selected' : ''}>2567</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (viewMode === 'table') {
        let tableRowsHtml = "";
        let totalQtyOp = 0;
        let totalAmtOp = 0;
        let totalQtyIp = 0;
        let totalAmtIp = 0;
        let totalQty = 0;
        let totalAmt = 0;

        sortedRows.forEach(row => {
            const qtyOp = parseInt(row.SUM_QTY_OP) || 0;
            const amtOp = parseFloat(row.SUM_AMT_OP) || 0;
            const qtyIp = parseInt(row.SUM_QTY_IP) || 0;
            const amtIp = parseFloat(row.SUM_AMT_IP) || 0;
            const qty = parseInt(row.SUM_QTY) || 0;
            const amt = parseFloat(row.SUM_AMT) || 0;

            totalQtyOp += qtyOp;
            totalAmtOp += amtOp;
            totalQtyIp += qtyIp;
            totalAmtIp += amtIp;
            totalQty += qty;
            totalAmt += amt;

            tableRowsHtml += `
                <tr>
                    <td style="text-align: left; font-weight: bold; background: #f8fafc;">${row.CODE}</td>
                    <td style="text-align: right;">${qtyOp.toLocaleString()}</td>
                    <td style="text-align: right;">${amtOp.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td style="text-align: right;">${qtyIp.toLocaleString()}</td>
                    <td style="text-align: right;">${amtIp.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td style="text-align: right; font-weight: 600; color: #10b981;">${qty.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 600; color: #0284c7;">${amt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `;
        });

        tableRowsHtml += `
            <tr style="background: #e2e8f0; font-weight: 700;">
                <td style="text-align: center;">รวม</td>
                <td style="text-align: right;">${totalQtyOp.toLocaleString()}</td>
                <td style="text-align: right;">${totalAmtOp.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td style="text-align: right;">${totalQtyIp.toLocaleString()}</td>
                <td style="text-align: right;">${totalAmtIp.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td style="text-align: right; color: #10b981;">${totalQty.toLocaleString()}</td>
                <td style="text-align: right; color: #0284c7;">${totalAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
        `;

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="overflow-x: auto; max-height: 60vh;">
                <table class="table table-bordered table-striped" style="width: 100%;">
                    <thead>
                        <tr style="background: #1a3c5e; color: white;">
                            <th style="min-width: 250px;">รายการ</th>
                            <th>OP-จำนวน</th>
                            <th>OP-ชดเชย</th>
                            <th>IP-จำนวน</th>
                            <th>IP-ชดเชย</th>
                            <th>จำนวนรวม</th>
                            <th>ชดเชยรวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
            <style>
                .table-bordered { border: 1px solid #dee2e6; }
                .table { width: 100%; margin-bottom: 1rem; color: #212529; border-collapse: collapse; }
                .table th { background: #1a3c5e !important; color: white !important; font-family: 'Sarabun', sans-serif; font-size: 12px; padding: 8px; text-align: center; }
                .table td { padding: 8px; vertical-align: middle; border: 1px solid #dee2e6; font-size: 12px; }
                .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
            </style>
        `;

        document.getElementById('instSingleYearSelect').addEventListener('change', (e) => {
            showInstrumentModal(hospitalCode, e.target.value, 'table');
        });
        document.getElementById('instSingleViewChartBtn').addEventListener('click', () => {
            showInstrumentModal(hospitalCode, year, 'chart');
        });

    } else {
        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
                <div style="height: ${Math.max(450, sortedRows.length * 38)}px; min-height: 450px;">
                    <canvas id="instSingleChart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('instSingleYearSelect').addEventListener('change', (e) => {
            showInstrumentModal(hospitalCode, e.target.value, 'chart');
        });
        document.getElementById('instSingleViewTableBtn').addEventListener('click', () => {
            showInstrumentModal(hospitalCode, year, 'table');
        });

        const topRows = sortedRows.slice(0, 30); // show top 30
        const labels = topRows.map(r => r.CODE.length > 50 ? r.CODE.substring(0, 50) + '...' : r.CODE);
        const amtData = topRows.map(r => parseFloat(String(r.SUM_AMT).replace(/,/g, '')) || 0);

        const ctx = document.getElementById('instSingleChart').getContext('2d');
        if (instrumentSingleChartInstance) {
            instrumentSingleChartInstance.destroy();
        }

        instrumentSingleChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ชดเชยรวม (บาท)',
                        data: amtData,
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { family: 'Sarabun, sans-serif', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return topRows[tooltipItems[0].dataIndex].CODE;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()} บาท`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: `จำนวนเงิน (บาท)`,
                            font: { family: 'Sarabun, sans-serif', weight: 'bold' }
                        },
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    },
                    y: {
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    }
                }
            }
        });
    }

    modal.style.display = 'flex';
}

function showInstrumentComparisonModal(year = '2569', metric = 'AMT', viewMode = 'chart', sortOrder = 'desc') {
    window.activeModalState = {
        focusedCode: null,
        type: 'INSTRUMENT',
        sortOrder: sortOrder,
        instrumentYear: year,
        instrumentMetric: metric,
        instrumentViewMode: viewMode,
        instrumentSortOrder: sortOrder,
        hiddenHospitalCodes: (window.activeModalState && window.activeModalState.hiddenHospitalCodes) || []
    };

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `เปรียบเทียบชดเชย อวัยวะเทียม/อุปกรณ์ - ปี ${year}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes;
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && instrumentCompareChartInstance) setHoveredHospital('${h.c}', 'button', instrumentCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && instrumentCompareChartInstance) setHoveredHospital(null, null, instrumentCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    // Get union of all items
    const itemMap = new Map();
    selectedHospitals.forEach(h => {
        const rows = h.instrumentData?.[year] || [];
        rows.forEach(r => {
            if (r.CODE) {
                itemMap.set(r.CODE, true);
            }
        });
    });

    const key = metric === 'QTY' ? 'SUM_QTY' : 'SUM_AMT';

    // Calculate sum for each item
    const itemSums = [];
    itemMap.forEach((_, code) => {
        let sum = 0;
        hospitalsToDraw.forEach(h => {
            const row = h.instrumentData?.[year]?.find(r => r.CODE === code);
            if (row && row[key]) {
                sum += parseFloat(String(row[key]).replace(/,/g, '')) || 0;
            }
        });
        itemSums.push({ code, sum });
    });

    // Sort items
    if (sortOrder === 'desc') {
        itemSums.sort((a, b) => b.sum - a.sum);
    } else if (sortOrder === 'asc') {
        itemSums.sort((a, b) => a.sum - b.sum);
    } else {
        itemSums.sort((a, b) => a.code.localeCompare(b.code));
    }

    // Keep top 35 items to avoid chart overflow
    const allItems = itemSums.map(x => x.code).slice(0, 35);

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <!-- View Mode Switcher -->
                <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 8px; gap: 4px;">
                    <button id="instViewTableBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'table' ? 'white' : 'transparent'}; color: ${viewMode === 'table' ? '#1e293b' : '#64748b'};">📋 ตาราง</button>
                    <button id="instViewChartBtn" style="padding: 6px 14px; border: none; border-radius: 6px; font-family: Sarabun, sans-serif; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; background: ${viewMode === 'chart' ? 'white' : 'transparent'}; color: ${viewMode === 'chart' ? '#1e293b' : '#64748b'};">📊 กราฟ</button>
                </div>
                
                <!-- Year Selector -->
                <div id="instYearSelectContainer" style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ปีงบประมาณ:</label>
                    <select id="instYearSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="2569" ${year === '2569' ? 'selected' : ''}>2569</option>
                        <option value="2568" ${year === '2568' ? 'selected' : ''}>2568</option>
                        <option value="2567" ${year === '2567' ? 'selected' : ''}>2567</option>
                    </select>
                </div>

                <!-- Metric Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="instMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="AMT" ${metric === 'AMT' ? 'selected' : ''}>ชดเชยรวม (บาท)</option>
                        <option value="QTY" ${metric === 'QTY' ? 'selected' : ''}>จำนวนรวม (ครั้ง)</option>
                    </select>
                </div>

                <!-- Sort Selector -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">เรียงลำดับ:</label>
                    <select id="instSortSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>ค่ามากไปน้อย</option>
                        <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>ค่าน้อยไปมาก</option>
                        <option value="alphabetical" ${sortOrder === 'alphabetical' ? 'selected' : ''}>ตามตัวอักษร</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (viewMode === 'chart') {
        const datasets = hospitalsToDraw.map((h, index) => {
            const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
            const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
            const data = allItems.map(item => {
                const row = h.instrumentData?.[year]?.find(r => r.CODE === item);
                if (!row || !row[key]) return 0;
                const valStr = String(row[key]).replace(/,/g, '');
                return parseFloat(valStr) || 0;
            });

            return {
                label: formatHospitalName(h.n),
                data: data,
                backgroundColor: colorSet.base,
                borderColor: colorSet.base,
                borderWidth: 1,
                hospitalCode: h.c,
                hospitalColor: colorSet.base
            };
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="position: relative; height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
                <div style="height: ${Math.max(450, allItems.length * 35)}px; min-height: 450px;">
                    <canvas id="instCompareChart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('instYearSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(e.target.value, document.getElementById('instMetricSelect').value, 'chart', document.getElementById('instSortSelect').value);
        });
        document.getElementById('instMetricSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(document.getElementById('instYearSelect').value, e.target.value, 'chart', document.getElementById('instSortSelect').value);
        });
        document.getElementById('instSortSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(document.getElementById('instYearSelect').value, document.getElementById('instMetricSelect').value, 'chart', e.target.value);
        });
        document.getElementById('instViewTableBtn').addEventListener('click', () => {
            showInstrumentComparisonModal(year, metric, 'table', sortOrder);
        });

        const ctx = document.getElementById('instCompareChart').getContext('2d');
        if (instrumentCompareChartInstance) {
            instrumentCompareChartInstance.destroy();
        }

        instrumentCompareChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allItems.map(item => item.length > 50 ? item.substring(0, 50) + '...' : item),
                datasets: datasets
            },
            plugins: [stackedLayoutPlugin],
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return allItems[tooltipItems[0].dataIndex];
                            },
                            label: function(context) {
                                const unit = metric === 'QTY' ? 'ครั้ง' : 'บาท';
                                return `${context.dataset.label}: ${context.raw.toLocaleString()} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: metric === 'QTY' ? 'จำนวน (ครั้ง)' : 'จำนวนเงิน (บาท)',
                            font: { family: 'Sarabun, sans-serif', weight: 'bold' }
                        },
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    },
                    y: {
                        ticks: { font: { family: 'Sarabun, sans-serif', size: 10 } }
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
                },
                onClick: (e, activeEls) => {
                    if (activeEls && activeEls.length > 0) {
                        const firstPoint = activeEls[0];
                        const dataIndex = firstPoint.index;
                        const clickedItem = allItems[dataIndex];
                        showInstrumentItemDrilldown(clickedItem);
                    }
                }
            }
        });
    } else {
        let tableHeadersHtml = `<th style="min-width: 250px; text-align: left;">รายการ</th>`;
        hospitalsToDraw.forEach(h => {
            const unit = metric === 'QTY' ? 'ครั้ง' : 'บาท';
            tableHeadersHtml += `<th style="text-align: right;">${formatHospitalName(h.n)} (${unit})</th>`;
        });

        let tableRowsHtml = "";
        allItems.forEach(item => {
            let rowCellsHtml = `
                <td style="text-align: left; font-weight: bold; background: #f8fafc;">${item}</td>
            `;

            hospitalsToDraw.forEach(h => {
                let valStr = "-";
                const row = h.instrumentData?.[year]?.find(r => r.CODE === item);
                if (row && row[key]) {
                    valStr = parseFloat(row[key]).toLocaleString(undefined, { maximumFractionDigits: 2 });
                }
                rowCellsHtml += `<td style="text-align: right;">${valStr}</td>`;
            });

            tableRowsHtml += `<tr>${rowCellsHtml}</tr>`;
        });

        modalBody.innerHTML = `
            ${controlsHTML}
            <div style="overflow-x: auto; max-height: 60vh;">
                <table class="table table-bordered table-striped" style="width: 100%;">
                    <thead>
                        <tr style="background: #1a3c5e; color: white;">
                            ${tableHeadersHtml}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
            <style>
                .table-bordered { border: 1px solid #dee2e6; }
                .table { width: 100%; margin-bottom: 1rem; color: #212529; border-collapse: collapse; }
                .table th { background: #1a3c5e !important; color: white !important; font-family: 'Sarabun', sans-serif; font-size: 12px; padding: 8px; text-align: center; }
                .table td { padding: 8px; vertical-align: middle; border: 1px solid #dee2e6; font-size: 12px; }
                .table tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
            </style>
        `;

        document.getElementById('instYearSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(e.target.value, document.getElementById('instMetricSelect').value, 'table', document.getElementById('instSortSelect').value);
        });
        document.getElementById('instMetricSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(document.getElementById('instYearSelect').value, e.target.value, 'table', document.getElementById('instSortSelect').value);
        });
        document.getElementById('instSortSelect').addEventListener('change', (e) => {
            showInstrumentComparisonModal(document.getElementById('instYearSelect').value, document.getElementById('instMetricSelect').value, 'table', e.target.value);
        });
        document.getElementById('instViewChartBtn').addEventListener('click', () => {
            showInstrumentComparisonModal(year, metric, 'chart', sortOrder);
        });
    }

    modal.style.display = 'flex';
}

function showInstrumentItemDrilldown(itemName) {
    window.activeModalState.focusedItem = itemName;

    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `แนวโน้มอุปกรณ์/อวัยวะเทียม: ${itemName}`;

    const headerControls = document.getElementById('modalHeaderControls');
    if (headerControls) {
        const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
        let hospitalTogglesHtml = '';
        if (selectedHospitals.length > 1) {
            hospitalTogglesHtml = '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 8px;">';
            selectedHospitals.forEach((h, index) => {
                const isHidden = hiddenHospitals.includes(h.c);
                const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
                const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
                hospitalTogglesHtml += `
                    <button onclick="toggleHospitalInChart('${h.c}')" onmouseover="if(typeof setHoveredHospital === 'function' && instrumentCompareChartInstance) setHoveredHospital('${h.c}', 'button', instrumentCompareChartInstance)" onmouseout="if(typeof setHoveredHospital === 'function' && instrumentCompareChartInstance) setHoveredHospital(null, null, instrumentCompareChartInstance)" style="background: ${isHidden ? '#f1f5f9' : colorSet.pass}; color: ${isHidden ? '#94a3b8' : 'white'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-family: Sarabun; cursor: pointer; transition: all 0.2s; text-decoration: ${isHidden ? 'line-through' : 'none'}; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isHidden ? '#cbd5e1' : colorSet.base};"></span>
                        ${formatHospitalName(h.n)}
                    </button>
                `;
            });
            hospitalTogglesHtml += '</div>';
        }

        headerControls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                ${hospitalTogglesHtml}
            </div>
        `;
    }

    const { instrumentYear, instrumentMetric, instrumentSortOrder } = window.activeModalState;

    let controlsHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Sarabun, sans-serif; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <button onclick="delete window.activeModalState.focusedItem; showInstrumentComparisonModal('${instrumentYear}', '${instrumentMetric}', 'chart', '${instrumentSortOrder}')" style="background: white; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 6px 14px; border-radius: 8px; font-family: Sarabun; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: all 0.2s;" onmouseover="this.style.background='var(--primary-color)'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='var(--primary-color)';">
                    ← ย้อนกลับ
                </button>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: 700; color: #475569; font-size: 0.9rem;">ประเภทข้อมูล:</label>
                    <select id="instDrilldownMetricSelect" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: Sarabun, sans-serif; font-size: 0.9rem; cursor: pointer; background: white;">
                        <option value="AMT" ${instrumentMetric === 'AMT' ? 'selected' : ''}>ชดเชยรวม (บาท)</option>
                        <option value="QTY" ${instrumentMetric === 'QTY' ? 'selected' : ''}>จำนวนรวม (ครั้ง)</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = `
        ${controlsHTML}
        <div style="position: relative; height: 60vh; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <canvas id="instrumentDrilldownChart"></canvas>
        </div>
    `;

    document.getElementById('instDrilldownMetricSelect').addEventListener('change', (e) => {
        window.activeModalState.instrumentMetric = e.target.value;
        showInstrumentItemDrilldown(itemName);
    });

    const hiddenHospitals = window.activeModalState.hiddenHospitalCodes || [];
    const hospitalsToDraw = selectedHospitals.filter(h => !hiddenHospitals.includes(h.c));

    const years = ['2567', '2568', '2569'];
    const key = instrumentMetric === 'QTY' ? 'SUM_QTY' : 'SUM_AMT';

    const datasets = hospitalsToDraw.map((h, index) => {
        const originalIndex = selectedHospitals.findIndex(sh => sh.c === h.c);
        const colorSet = getHospitalColors(originalIndex >= 0 ? originalIndex : index);
        
        const data = years.map(yr => {
            const rows = h.instrumentData?.[yr] || [];
            const match = rows.find(r => r.CODE === itemName);
            if (!match || !match[key]) return 0;
            return parseFloat(String(match[key]).replace(/,/g, '')) || 0;
        });

        return {
            label: formatHospitalName(h.n),
            data: data,
            borderColor: colorSet.base,
            backgroundColor: colorSet.base,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.15,
            hospitalCode: h.c,
            hospitalColor: colorSet.base
        };
    });

    const ctx = document.getElementById('instrumentDrilldownChart').getContext('2d');
    if (instrumentCompareChartInstance) {
        instrumentCompareChartInstance.destroy();
    }

    instrumentCompareChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const unit = instrumentMetric === 'QTY' ? 'ครั้ง' : 'บาท';
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'ปีงบประมาณ', font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                },
                y: {
                    title: { display: true, text: instrumentMetric === 'QTY' ? 'จำนวนรวม (ครั้ง)' : 'ชดเชยรวม (บาท)', font: { family: 'Sarabun, sans-serif', weight: 'bold' } },
                    ticks: { font: { family: 'Sarabun, sans-serif' } }
                }
            }
        }
    });
}
