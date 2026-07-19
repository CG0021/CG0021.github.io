// ==========================================================
// ส่วนควบคุมหลัก ประสานงาน และจัดการสถานะ (State & Controller)
// ==========================================================

let monthlyResults = [];
let uploadedFilesTemp = []; // Temporary files before processing
window.hospitalData = null; // Hospital stats data
let chartInstance = null;
let dashFinancialChartInstance = null;
let dashCCCChartInstance = null;

// Global Tab States
let currentMainTab = 'dashboard';
let currentSubTab = 'main_dashboard'; // for dashboard
let currentWCSubTab = 'ar'; // for working_capital (maps to legacy currentTab)
let currentReportSubTab = 'trial_balance'; // for reports
let currentImportSubTab = 'upload'; // for import
let currentAnalysisSubTab = 'financial_health'; // for analysis

// Legacy globals kept for compatibility with formulas
let currentTab = 'ar';
let currentFund = 'uc';
let currentSubgroup = 'total';
let currentFundAP = 'drug_supplies';
let currentSubgroupAP = 'total';
let currentFundPR = 'pr_accrued';
let currentSubgroupPR = 'total';
let currentFundINV = 'total';
let currentSubgroupINV = 'all';

// Pagination and Search states for Trial Balance
let tbCurrentPage = 1;
let tbPageSize = 50; // Default is 50 as requested
let tbGroupingMode = 'flat'; // 'flat', 'group_4', 'group_6'
let tbCategoryFilter = 'all'; // 'all', '1', '2', '3', '4', '5'
let tbColStartIndex = 0; // index of first visible period column in side-by-side view
let tbTrendChartInstance = null;
let tbSearchQuery = '';
let tbShowFullNumbers = false;
let mgtSearchQuery = '';
let mgtNumberFormat = 'abbreviated'; // 'abbreviated' or 'full'

// Persistent Zoom States
let currentZoomMin = undefined;
let currentZoomMax = undefined;
let dashFinancialZoomMin = undefined;
let dashFinancialZoomMax = undefined;
let dashCCCZoomMin = undefined;
let dashCCCZoomMax = undefined;

// DOM Elements (Looked up dynamically in setupEvents to avoid timing bugs)
let fileInput = null;
let folderInput = null;
let dropZone = null;
let errorMsg = null;
let errorText = null;
let loadingIndicator = null;
let uploadSection = null;
let dashboardSection = null;
let tabsMenu = null;
let btnNewUpload = null;
let currentPeriodText = null;

// Sidebar Configurations (FUNDS / AP / INV / PR)
const FUNDS_CONFIG = [
    {
        id: 'uc',
        name: 'สิทธิ UC',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'ip', name: 'UC IP' },
            { id: 'ip_cr', name: 'UC IP CR' },
            { id: 'op_cr', name: 'UC OP CR' },
            { id: 'refer', name: 'OP Refer' }
        ]
    },
    {
        id: 'cgd',
        name: 'เบิกจ่ายตรง (กรมบัญชีกลาง)',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'op', name: 'CGD OP' },
            { id: 'ip', name: 'CGD IP' }
        ]
    },
    {
        id: 'sss',
        name: 'สิทธิประกันสังคม',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'op_net', name: 'OP เครือข่าย' },
            { id: 'ip_net', name: 'IP เครือข่าย' },
            { id: 'op_out_moph', name: 'OP นอก (สป.สธ.)' },
            { id: 'ip_out_moph', name: 'IP นอก (สป.สธ.)' },
            { id: 'op_out_other', name: 'OP นอก (ต่างสังกัด)' },
            { id: 'ip_out_other', name: 'IP นอก (ต่างสังกัด)' },
            { id: 'wcf', name: 'กองทุนทดแทน' },
            { id: 'first_72h', name: '72 ชม.แรก' },
            { id: 'hc_op', name: 'High Cost OP' },
            { id: 'hc_ip', name: 'High Cost IP' }
        ]
    },
    {
        id: 'alien',
        name: 'สิทธิต่างด้าว',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'op_out', name: 'OP นอก CUP' },
            { id: 'ip_out', name: 'IP นอก CUP' },
            { id: 'op_center', name: 'เบิกจากส่วนกลาง OP' },
            { id: 'ip_center', name: 'เบิกจากส่วนกลาง IP' }
        ]
    },
    {
        id: 'status',
        name: 'ผู้มีปัญหาสถานะและสิทธิ',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'op_in', name: 'OP ใน CUP' },
            { id: 'op_out', name: 'OP นอก CUP' },
            { id: 'op_center', name: 'เบิกจากส่วนกลาง OP' },
            { id: 'ip_center', name: 'เบิกจากส่วนกลาง IP' }
        ]
    },
    {
        id: 'other',
        name: 'ลูกหนี้อื่นๆ',
        subgroups: [
            { id: 'self_op', name: 'ชำระเงิน OP' },
            { id: 'self_ip', name: 'ชำระเงิน IP' },
            { id: 'affil_op', name: 'เบิกต้นสังกัด OP' },
            { id: 'affil_ip', name: 'เบิกต้นสังกัด IP' },
            { id: 'agency_op', name: 'เบิกจ่ายตรงฯ OP' },
            { id: 'agency_ip', name: 'เบิกจ่ายตรงฯ IP' },
            { id: 'car_op', name: 'พรบ.รถ OP' },
            { id: 'car_ip', name: 'พรบ.รถ IP' },
            { id: 'lao_op', name: 'อปท. OP' },
            { id: 'lao_ip', name: 'อปท. IP' },
            { id: 'laosp_op', name: 'อปท.พิเศษ OP' },
            { id: 'laosp_ip', name: 'อปท.พิเศษ IP' },
            { id: 'ems', name: 'ฉุกเฉิน (EMS)' },
            { id: 'specimen_gov', name: 'สิ่งส่งตรวจ ภาครัฐ' },
            { id: 'specimen_ext', name: 'สิ่งส่งตรวจ ภายนอก' },
            { id: 'health_gov', name: 'ตรวจสุขภาพ ภาครัฐ' },
            { id: 'health_ext', name: 'ตรวจสุขภาพ ภายนอก' },
            { id: 'mat_gov', name: 'วัสดุฯ ภาครัฐ' },
            { id: 'mat_ext', name: 'วัสดุฯ ภายนอก' }
        ]
    }
];

const AP_CONFIG = [
    {
        id: 'drug_supplies',
        name: 'เจ้าหนี้ ยา / เวชภัณฑ์',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'ds_drug', name: 'เจ้าหนี้-ยา' },
            { id: 'ds_med', name: 'เจ้าหนี้-วัสดุการแพทย์ทั่วไป' },
            { id: 'ds_sci', name: 'เจ้าหนี้ - วัสดุวิทยาศาสตร์และการแพทย์' },
            { id: 'ds_raw', name: 'เจ้าหนี้-วัตถุดิบ' },
            { id: 'ds_finish', name: 'เจ้าหนี้-สินค้าสำเร็จรูป' },
            { id: 'ds_pharm', name: 'เจ้าหนี้-วัสดุเภสัชกรรม' },
            { id: 'ds_dental', name: 'เจ้าหนี้-วัสดุทันตกรรม' },
            { id: 'ds_xray', name: 'เจ้าหนี้-วัสดุเอกซเรย์' }
        ]
    },
    {
        id: 'external',
        name: 'เจ้าหนี้การค้าบุคคลภายนอก',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'ext_102', name: 'เจ้าหนี้การค้าบุคคลภายนอก-ยา(กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_103', name: 'เจ้าหนี้การค้าบุคคลภายนอก -วัสดุการแพทย์ทั่วไป (กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_105', name: 'เจ้าหนี้การค้าบุคคลภายนอก - วัสดุวิทยาศาสตร์และการแพทย์(กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_130', name: 'เจ้าหนี้การค้าบุคคลภายนอก - วัสดุเภสัชกรรม(กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_131', name: 'เจ้าหนี้การค้าบุคคลภายนอก -  วัสดุทันตกรรม(กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_132', name: 'เจ้าหนี้การค้าบุคคลภายนอก- วัสดุเอกซเรย์(กรมบัญชีกลางจ่ายตรงผู้ขาย)' },
            { id: 'ext_133', name: 'เจ้าหนี้การค้า-บุคคลภายนอก-ยา (เงินนอกประมาณฝากคลัง)' },
            { id: 'ext_134', name: 'เจ้าหนี้การค้า-บุคคลภายนอก-วัสดุเภสัชกรรม (เงินนอกประมาณฝากคลัง)' },
            { id: 'ext_135', name: 'เจ้าหนี้การค้า-บุคคลภายนอก-วัสดุการแพทย์ทั่วไป (เงินนอกประมาณฝากคลัง)' },
            { id: 'ext_136', name: 'เจ้าหนี้การค้า-บุคคลภายนอก -วัสดุวิทยาศาสตร์การแพทย์ (เงินนอกงบประมาณฝากคลัง)' },
            { id: 'ext_137', name: 'เจ้าหนี้การค้า-บุคคลภายนอก-วัสดุเอกซเรย์ (เงินนอกงบประมาณฝากคลัง)' },
            { id: 'ext_138', name: 'เจ้าหนี้การค้า-บุคคลภายนอก-วัสดุทันตกรรม (เงินนอกงบประมาณฝากคลัง)' }
        ]
    },
    {
        id: 'gov',
        name: 'เจ้าหนี้หน่วยงานภาครัฐ',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'gov_102', name: 'เจ้าหนี้หน่วยงานภาครัฐ - ยา   (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_103', name: 'เจ้าหนี้หน่วยงานภาครัฐ - วัสดุการแพทย์ทั่วไป (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' },
            { id: 'gov_105', name: 'เจ้าหนี้หน่วยงานภาครัฐ - วัสดุวิทยาศาสตร์และการแพทย์   (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_112', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุเภสัชกรรม(กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' },
            { id: 'gov_113', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุทันตกรรม (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_114', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุเอกซเรย์(กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' },
            { id: 'gov_115', name: 'เจ้าหนี้อื่น - หน่วยงานภาครัฐ - ยา (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_116', name: 'เจ้าหนี้หน่วยงานภาครัฐ -วัสดุการแพทย์ทั่วไป (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' },
            { id: 'gov_117', name: 'เจ้าหนี้หน่วยงานภาครัฐ - วัสดุวิทยาศาสตร์และการแพทย์   (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_120', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุเภสัชกรรม(กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' },
            { id: 'gov_121', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุทันตกรรม (กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือหน่วยงานของรัฐ)' },
            { id: 'gov_122', name: 'เจ้าหนี้หน่วยงานภาครัฐ-วัสดุเอกซเรย์(กรมบัญชีกลางจ่ายตรงให้ผู้ขายที่เป็นรัฐวิสาหกิจหรือ หน่วยงานของรัฐ)' }
        ]
    },
    {
        id: 'gr_ir',
        name: 'รับสินค้า/ใบสำคัญ (GR/IR)',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'gr_ir_103', name: 'รับสินค้า/ใบสำคัญ (GR/IR) – เงินนอกงบประมาณฝากคลัง ยาและเวชภัณฑ์มิใช่ยา' }
        ]
    }
];

const INV_CONFIG = [
    {
        id: 'total',
        name: 'ภาพรวมสินค้าคงคลัง',
        subgroups: [
            { id: 'all', name: 'ภาพรวมทั้งหมด' },
            { id: 'drug', name: 'ยา' },
            { id: 'pharm', name: 'วัสดุเภสัชกรรม' },
            { id: 'med', name: 'วัสดุการแพทย์ทั่วไป' },
            { id: 'sci', name: 'วัสดุวิทยาศาสตร์และการแพทย์' },
            { id: 'xray', name: 'วัสดุเอกซเรย์' },
            { id: 'dental', name: 'วัสดุทันตกรรม' }
        ]
    }
];

const PR_CONFIG = [
    {
        id: 'pr_accrued',
        name: 'ค่าบุคลากรค้างจ่าย',
        subgroups: [
            { id: 'total', name: 'ภาพรวมทั้งหมด' },
            { id: 'pr_102', name: 'ค่าจ้างชั่วคราวค้างจ่าย (บริการ)' },
            { id: 'pr_103', name: 'ค่าจ้างชั่วคราวค้างจ่าย (สนับสนุน)' },
            { id: 'pr_104', name: 'ค่าจ้างพนักงานกระทรวงสาธารณสุขค้างจ่าย (บริการ)' },
            { id: 'pr_105', name: 'ค่าจ้างพนักงานกระทรวงสาธารณสุขค้างจ่าย (สนับสนุน)' },
            { id: 'pr_106', name: 'ค่าตอบแทนเงินเพิ่มพิเศษไม่ทำเวชปฏิบัติฯลฯ(บริการ) ค้างจ่าย' },
            { id: 'pr_107', name: 'ค่าตอบแทนในการปฏิบัติงานของเจ้าหน้าที่ (บริการ) ค้างจ่าย' },
            { id: 'pr_108', name: 'ค่าตอบแทนในการปฏิบัติงานของเจ้าหน้าที่ (สนับสนุน) ค้างจ่าย' },
            { id: 'pr_109', name: 'ค่าตอบแทนเงินเพิ่มพิเศษสำหรับผู้ปฏิบัติงานด้านการสาธารณสุข (พ.ต.ส.) เงินนอกงบประมาณค้างจ่าย' },
            { id: 'pr_110', name: 'ค่าตอบแทนตามผลการปฏิบัติงานค้างจ่าย' },
            { id: 'pr_111', name: 'ค่าตอบแทนการปฏิบัติงานในลักษณะเบี้ยเลี้ยงเหมาจ่ายค้างจ่าย' }
        ]
    }
];

// Scan files and folders from drag and drop recursively
async function scanDroppedItems(dataTransfer) {
    if (!dataTransfer) return [];
    
    const items = dataTransfer.items;
    const filesList = dataTransfer.files;
    
    if (!items || items.length === 0) {
        return filesList ? Array.from(filesList) : [];
    }
    
    let files = [];
    let queue = [];
    let hasDirectory = false;
    
    for (let i = 0; i < items.length; i++) {
        // Skip items that are not files (e.g. text/html dragged along)
        if (items[i].kind !== 'file') continue;
        
        let entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
        if (entry) {
            if (entry.isDirectory) {
                hasDirectory = true;
            }
            queue.push(entry);
        } else if (items[i].getAsFile) {
            let file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }

    // If no directories are detected, return the filesList directly for maximum reliability
    if (!hasDirectory && filesList && filesList.length > 0) {
        return Array.from(filesList);
    }

    let resultFiles = [];
    while (queue.length > 0) {
        let entry = queue.shift();
        if (!entry) continue;
        
        try {
            if (entry.isFile) {
                let file = await new Promise((resolve) => {
                    entry.file(resolve, (err) => {
                        console.error("Error reading file entry:", err);
                        resolve(null);
                    });
                });
                if (file) resultFiles.push(file);
            } else if (entry.isDirectory) {
                let reader = entry.createReader();
                let readBatch = () => {
                    return new Promise((resolve) => {
                        reader.readEntries((entries) => {
                            resolve(entries);
                        }, (err) => {
                            console.error("Error reading directory entries:", err);
                            resolve([]);
                        });
                    });
                };
                let allEntries = [];
                while (true) {
                    let batch = await readBatch();
                    if (!batch || batch.length === 0) break;
                    allEntries.push(...batch);
                }
                queue.push(...allEntries);
            }
        } catch (err) {
            console.error("Error scanning dropped item:", err);
        }
    }

    // If resultFiles is empty but we have files in the files list, fallback to files list
    if (resultFiles.length === 0 && filesList && filesList.length > 0) {
        return Array.from(filesList);
    }

    return resultFiles;
}

// Setup Event Listeners
function setupEvents() {
    fileInput = document.getElementById('fileInput');
    folderInput = document.getElementById('folderInput');
    dropZone = document.getElementById('dropZone');
    errorMsg = document.getElementById('errorMsg');
    errorText = document.getElementById('errorText');
    loadingIndicator = document.getElementById('loadingIndicator');
    uploadSection = document.getElementById('uploadSection');
    dashboardSection = document.getElementById('dashboardSection');
    tabsMenu = document.getElementById('tabsMenu');
    btnNewUpload = document.getElementById('btnNewUpload');
    currentPeriodText = document.getElementById('currentPeriodText');

    if (!dropZone || !fileInput) return;

    // Prevent default drag/drop behaviors on window to avoid browser navigating away
    window.addEventListener('dragenter', (e) => e.preventDefault());
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    const btnSelectFiles = document.getElementById('btnSelectFiles');
    const btnSelectFolder = document.getElementById('btnSelectFolder');
    if (btnSelectFiles) {
        btnSelectFiles.addEventListener('click', () => {
            fileInput.click();
        });
    }
    if (btnSelectFolder) {
        btnSelectFolder.addEventListener('click', () => {
            folderInput.click();
        });
    }

    dropZone.addEventListener('dragenter', (e) => e.preventDefault());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-sky-500', 'bg-sky-50');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-sky-500', 'bg-sky-50');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-sky-500', 'bg-sky-50');
        if ((e.dataTransfer.items && e.dataTransfer.items.length > 0) || (e.dataTransfer.files && e.dataTransfer.files.length > 0)) {
            showError('');
            loadingIndicator.classList.remove('hidden');
            scanDroppedItems(e.dataTransfer).then(files => {
                if (files.length > 0) {
                    handleFilesUpload(files);
                } else {
                    loadingIndicator.classList.add('hidden');
                }
            }).catch(err => {
                console.error("Error in scanDroppedItems:", err);
                loadingIndicator.classList.add('hidden');
                showError('เกิดข้อผิดพลาดในการอ่านไฟล์ที่ลากวาง');
            });
        }
    });

    const reviewFilesContainer = document.getElementById('reviewFilesContainer');
    if (reviewFilesContainer) {
        reviewFilesContainer.addEventListener('dragenter', (e) => e.preventDefault());
        reviewFilesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            reviewFilesContainer.classList.add('ring-4', 'ring-sky-500/20', 'border-sky-500', 'bg-sky-50/10');
        });
        reviewFilesContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            reviewFilesContainer.classList.remove('ring-4', 'ring-sky-500/20', 'border-sky-500', 'bg-sky-50/10');
        });
        reviewFilesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            reviewFilesContainer.classList.remove('ring-4', 'ring-sky-500/20', 'border-sky-500', 'bg-sky-50/10');
            if ((e.dataTransfer.items && e.dataTransfer.items.length > 0) || (e.dataTransfer.files && e.dataTransfer.files.length > 0)) {
                showError('');
                loadingIndicator.classList.remove('hidden');
                scanDroppedItems(e.dataTransfer).then(files => {
                    if (files.length > 0) {
                        handleFilesUpload(files);
                    } else {
                        loadingIndicator.classList.add('hidden');
                    }
                }).catch(err => {
                    console.error("Error in scanDroppedItems:", err);
                    loadingIndicator.classList.add('hidden');
                    showError('เกิดข้อผิดพลาดในการอ่านไฟล์ที่ลากวาง');
                });
            }
        });
    }
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFilesUpload(e.target.files);
        }
    });
    if (folderInput) {
        folderInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFilesUpload(e.target.files);
            }
        });
    }

    const reviewSortOrder = document.getElementById('reviewSortOrder');
    if (reviewSortOrder) {
        reviewSortOrder.addEventListener('change', () => {
            renderReviewFilesList();
        });
    }

    const toggleTreatmentChartLabels = document.getElementById('toggleTreatmentChartLabels');
    if (toggleTreatmentChartLabels) {
        toggleTreatmentChartLabels.addEventListener('change', (e) => {
            window.treatmentCostShowLabels = e.target.checked;
            if (typeof opdCostPerVisitChartInstance !== 'undefined' && opdCostPerVisitChartInstance) {
                opdCostPerVisitChartInstance.update();
            }
            if (typeof ipdCostPerAdjRWChartInstance !== 'undefined' && ipdCostPerAdjRWChartInstance) {
                ipdCostPerAdjRWChartInstance.update();
            }
            if (typeof costRevenueBreakdownChartInstance !== 'undefined' && costRevenueBreakdownChartInstance) {
                costRevenueBreakdownChartInstance.update();
            }
        });
    }

    if (btnNewUpload) {
        btnNewUpload.addEventListener('click', () => {
            if (uploadSection) uploadSection.classList.remove('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (tabsMenu) tabsMenu.classList.add('hidden');
            if (btnNewUpload) btnNewUpload.classList.add('hidden');
            if (dropZone) dropZone.classList.remove('hidden');
            const successIndicator = document.getElementById('successIndicator');
            if (successIndicator) successIndicator.classList.add('hidden');
            const reviewFilesContainer = document.getElementById('reviewFilesContainer');
            if (reviewFilesContainer) reviewFilesContainer.classList.add('hidden');
            uploadedFilesTemp = [];
            window.hospitalData = null;
            const mainSidebar = document.getElementById('mainSidebar');
            if (mainSidebar) mainSidebar.classList.add('hidden');
            if (currentPeriodText) currentPeriodText.textContent = 'กรุณาอัปโหลดไฟล์งบทดลองเพื่อเริ่มวิเคราะห์';
            fileInput.value = '';
            if (folderInput) folderInput.value = '';
            monthlyResults = [];
            tbColStartIndex = 0;
            mgtSearchQuery = '';
            mgtNumberFormat = 'abbreviated';
            tbShowFullNumbers = false;
            const tbToggleFullNumbers = document.getElementById('tbToggleFullNumbers');
            if (tbToggleFullNumbers) tbToggleFullNumbers.checked = false;
            const mgtSearchInput = document.getElementById('mgtSearchInput');
            if (mgtSearchInput) mgtSearchInput.value = '';
            const mgtNumberFormatSelect = document.getElementById('mgtNumberFormatSelect');
            if (mgtNumberFormatSelect) {
                mgtNumberFormatSelect.value = 'abbreviated';
                mgtNumberFormatSelect.dispatchEvent(new Event('change'));
            }
            if (chartInstance) chartInstance.destroy();
            if (dashFinancialChartInstance) dashFinancialChartInstance.destroy();
            if (dashCCCChartInstance) dashCCCChartInstance.destroy();
        });
    }

    // 1. Main Tab Controls
    const mainTabButtons = document.querySelectorAll('#tabsMenu button');
    mainTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchMainTab(tabId);
        });
    });

    // 2. Dashboard Nested Sub-Tab Controls
    const dashSubButtons = document.querySelectorAll('#tabView_dashboard [data-subtab]');
    dashSubButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentSubTab = btn.getAttribute('data-subtab');
            renderDashboardSubViews();
        });
    });

    // 3. Working Capital Nested Sub-Tab Controls
    const wcSubButtons = document.querySelectorAll('#tabView_workingCapital [data-wcsubtab]');
    wcSubButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentWCSubTab = btn.getAttribute('data-wcsubtab');
            renderWorkingCapitalSubViews();
        });
    });

    // 4. Reports Nested Sub-Tab Controls
    const reportSubButtons = document.querySelectorAll('#tabView_reports [data-reportsubtab]');
    reportSubButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentReportSubTab = btn.getAttribute('data-reportsubtab');
            renderReportsSubViews();
        });
    });

    // 5. Import Nested Sub-Tab Controls
    const importSubButtons = document.querySelectorAll('#tabView_import [data-importsubtab]');
    importSubButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentImportSubTab = btn.getAttribute('data-importsubtab');
            renderImportSubViews();
        });
    });

    // 6. Working Capital Metric selector / Label toggles
    const toggleDataLabels = document.getElementById('toggleDataLabels');
    if (toggleDataLabels) {
        toggleDataLabels.addEventListener('change', () => {
            if (chartInstance) {
                chartInstance.options.plugins.datalabels.display = toggleDataLabels.checked;
                chartInstance.update();
            }
        });
    }

    const chartMetricSelect = document.getElementById('chartMetricSelect');
    if (chartMetricSelect) {
        chartMetricSelect.addEventListener('change', () => {
            window.activeWCMetrics = [chartMetricSelect.value];
            if (monthlyResults.length > 0) {
                const latestMonth = monthlyResults[monthlyResults.length - 1];
                if (typeof renderSidebar === 'function') renderSidebar(latestMonth);
            }
            renderDashboard();
            if (monthlyResults.length > 0) {
                const latestEndIdx = window.chartEndMonthIndex !== undefined ? window.chartEndMonthIndex : monthlyResults.length - 1;
                const latestMonth = monthlyResults[latestEndIdx];
                if (typeof renderWorkingCapitalExtraSection === 'function') {
                    renderWorkingCapitalExtraSection(latestMonth);
                }
            }
        });
    }

    // 7. Trial Balance Search event
    const tbSearchInput = document.getElementById('tbSearchInput');
    if (tbSearchInput) {
        tbSearchInput.addEventListener('input', (e) => {
            tbSearchQuery = e.target.value;
            tbCurrentPage = 1; // Reset to page 1
            renderTrialBalanceTable();
        });
    }

    // 8. Trial Balance Category & Page Size controls
    const tbCategorySelect = document.getElementById('tbCategorySelect');
    if (tbCategorySelect) {
        tbCategorySelect.addEventListener('change', (e) => {
            tbCategoryFilter = e.target.value;
            tbCurrentPage = 1;
            renderTrialBalanceTable();
        });
    }

    // 8.0 Trial Balance Full/Abbreviated Number toggle
    const tbToggleFullNumbers = document.getElementById('tbToggleFullNumbers');
    if (tbToggleFullNumbers) {
        tbToggleFullNumbers.addEventListener('change', (e) => {
            tbShowFullNumbers = e.target.checked;
            renderTrialBalanceTable();
        });
    }

    // 8.1 Management Report Search event
    const mgtSearchInput = document.getElementById('mgtSearchInput');
    if (mgtSearchInput) {
        mgtSearchInput.addEventListener('input', (e) => {
            mgtSearchQuery = e.target.value;
            renderManagementReport();
        });
    }

    // 8.2 Management Report Number Format selector
    const mgtNumberFormatSelect = document.getElementById('mgtNumberFormatSelect');
    if (mgtNumberFormatSelect) {
        mgtNumberFormatSelect.addEventListener('change', (e) => {
            mgtNumberFormat = e.target.value;
            renderManagementReport();
        });
    }

    const tbColPrevBtn = document.getElementById('tbColPrevBtn');
    if (tbColPrevBtn) {
        tbColPrevBtn.addEventListener('click', () => {
            if (tbColStartIndex > 0) {
                tbColStartIndex--;
                renderTrialBalanceTable();
                renderManagementReport();
            }
        });
    }

    const tbColNextBtn = document.getElementById('tbColNextBtn');
    if (tbColNextBtn) {
        tbColNextBtn.addEventListener('click', () => {
            if (tbColStartIndex + 3 < monthlyResults.length) {
                tbColStartIndex++;
                renderTrialBalanceTable();
                renderManagementReport();
            }
        });
    }

    // 8. Columns Slider for Management Report
    const onPrevColClick = () => {
        if (tbColStartIndex > 0) {
            tbColStartIndex--;
            renderTrialBalanceTable();
            renderManagementReport();
        }
    };
    const onNextColClick = () => {
        if (tbColStartIndex + 3 < monthlyResults.length) {
            tbColStartIndex++;
            renderTrialBalanceTable();
            renderManagementReport();
        }
    };

    const mgtColPrevBtn = document.getElementById('mgtColPrevBtn');
    if (mgtColPrevBtn) mgtColPrevBtn.addEventListener('click', onPrevColClick);
    const mgtTableColPrevBtn = document.getElementById('mgtTableColPrevBtn');
    if (mgtTableColPrevBtn) mgtTableColPrevBtn.addEventListener('click', onPrevColClick);

    const mgtColNextBtn = document.getElementById('mgtColNextBtn');
    if (mgtColNextBtn) mgtColNextBtn.addEventListener('click', onNextColClick);
    const mgtTableColNextBtn = document.getElementById('mgtTableColNextBtn');
    if (mgtTableColNextBtn) mgtTableColNextBtn.addEventListener('click', onNextColClick);

    // 9. Trial Balance Trend Chart Modal Close Event
    const tbChartModal = document.getElementById('tbChartModal');
    const closeTbModal = () => {
        if (tbChartModal) {
            tbChartModal.classList.add('hidden');
            if (tbTrendChartInstance) {
                tbTrendChartInstance.destroy();
                tbTrendChartInstance = null;
            }
        }
    };

    const tbChartModalCloseBtn = document.getElementById('tbChartModalCloseBtn');
    if (tbChartModalCloseBtn) {
        tbChartModalCloseBtn.addEventListener('click', closeTbModal);
    }

    const tbChartModalCloseBtnSecondary = document.getElementById('tbChartModalCloseBtnSecondary');
    if (tbChartModalCloseBtnSecondary) {
        tbChartModalCloseBtnSecondary.addEventListener('click', closeTbModal);
    }

    if (tbChartModal) {
        tbChartModal.addEventListener('click', (e) => {
            if (e.target === tbChartModal) {
                closeTbModal();
            }
        });
    }

    const btnAddMoreFiles = document.getElementById('btnAddMoreFiles');
    if (btnAddMoreFiles) {
        btnAddMoreFiles.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    const btnProcessUpload = document.getElementById('btnProcessUpload');
    if (btnProcessUpload) {
        btnProcessUpload.addEventListener('click', () => {
            processUploadData();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tbChartModal && !tbChartModal.classList.contains('hidden')) {
            closeTbModal();
        }
    });

    // Convert static select elements to custom dropdowns
    if (typeof convertToCustomDropdown === 'function') {
        convertToCustomDropdown('chartMetricSelect');
        convertToCustomDropdown('tbCategorySelect');
        convertToCustomDropdown('mgtNumberFormatSelect');
    }
}

function parseHospitalDataSheet(worksheet) {
    if (!worksheet) return {};
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!rows || rows.length === 0) return {};

    let headerRowIdx = -1;
    let colMap = {};
    const monthNamesMap = {
        "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3,
        "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7,
        "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11
    };

    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const r = rows[i];
        if (!r) continue;
        let foundYearCol = false;
        let matchedCols = 0;
        for (let j = 0; j < r.length; j++) {
            const val = String(r[j]).trim();
            if (val.includes("ปีงบประมาณ") || val === "ปี") {
                colMap.year = j;
                foundYearCol = true;
            } else if (monthNamesMap[val] !== undefined) {
                colMap[monthNamesMap[val]] = j;
                matchedCols++;
            }
        }
        if (foundYearCol && matchedCols > 0) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        colMap.year = 0;
        const fiscalMonthsOrder = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8];
        fiscalMonthsOrder.forEach((mIdx, idx) => {
            colMap[mIdx] = idx + 1;
        });
        headerRowIdx = 0;
    }

    const dataMap = {};
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        let yrVal = parseInt(String(r[colMap.year]).replace(/,/g, '').trim());
        if (isNaN(yrVal)) continue;

        dataMap[yrVal] = {};
        for (let mIdx = 0; mIdx < 12; mIdx++) {
            const colIdx = colMap[mIdx];
            if (colIdx !== undefined && r[colIdx] !== undefined) {
                let cellVal = parseFloat(String(r[colIdx]).replace(/,/g, '').trim());
                dataMap[yrVal][mIdx] = isNaN(cellVal) ? 0 : cellVal;
            } else {
                dataMap[yrVal][mIdx] = 0;
            }
        }
    }

    return dataMap;
}

function parseBedOccupancySheet(worksheet) {
    if (!worksheet) return {};
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!rows || rows.length === 0) return {};
    
    let startRow = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const r = rows[i];
        if (r && r[0] && String(r[0]).trim().includes("ปีงบประมาณ")) {
            startRow = i + 2; // Data rows start below the subheaders (which are in row i and row i+1)
            break;
        }
    }
    if (startRow === -1) startRow = 2; // fallback
    
    const dataMap = {};
    const fiscalMonthsOrder = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8];
    
    for (let i = startRow; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        let yrVal = parseInt(String(r[0]).replace(/,/g, '').trim());
        if (isNaN(yrVal)) continue;
        
        dataMap[yrVal] = {};
        fiscalMonthsOrder.forEach((mIdx, idx) => {
            // "อัตราตามเตียง กยผ." is at column 11 + idx * 5
            const colIdx = 11 + idx * 5;
            if (r[colIdx] !== undefined) {
                let cellVal = parseFloat(String(r[colIdx]).replace(/,/g, '').trim());
                dataMap[yrVal][mIdx] = isNaN(cellVal) ? 0 : cellVal;
            } else {
                dataMap[yrVal][mIdx] = 0;
            }
        });
    }
    return dataMap;
}

// Controller: Excel Upload Parser
async function handleFilesUpload(files) {
    showError(''); // Hide error block
    loadingIndicator.classList.remove('hidden');

    let fileArray = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'));

    if (fileArray.length === 0) {
        showError('กรุณาอัปโหลดไฟล์นามสกุล .xlsx หรือ .xls เท่านั้น');
        return;
    }

    try {
        // Look for hospital data file first
        const hospitalFile = fileArray.find(f => f.name.includes('ข้อมูลโรงพยาบาล'));
        if (hospitalFile) {
            let data = await readFileAsync(hospitalFile);
            let workbook = XLSX.read(data, { type: 'array' });
            window.hospitalData = {
                VisitOPD: parseHospitalDataSheet(workbook.Sheets['VisitOPD']),
                AdjRW: parseHospitalDataSheet(workbook.Sheets['AdjRW']),
                วันนอน: parseHospitalDataSheet(workbook.Sheets['วันนอน']),
                อัตราครองเตียง: parseBedOccupancySheet(workbook.Sheets['อัตราครองเตียง'])
            };
            
            // Push to uploadedFilesTemp as a special hospital data file
            let tempId = 'hospital_' + Date.now();
            uploadedFilesTemp.push({
                id: tempId,
                filename: hospitalFile.name,
                isHospitalData: true,
                codeWarnings: []
            });
            
            fileArray = fileArray.filter(f => f !== hospitalFile);
        }

        for (let i = 0; i < fileArray.length; i++) {
            let file = fileArray[i];
            let data = await readFileAsync(file);
            let workbook = XLSX.read(data, { type: 'array' });
            let worksheet = workbook.Sheets[workbook.SheetNames[0]];
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            let tbData = parseExcelData(jsonData);
            if (tbData) {
                let dateInfo = extractDateFromFilename(file.name);
                let tempId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                uploadedFilesTemp.push({
                    id: tempId,
                    filename: file.name,
                    monthStr: dateInfo.str,
                    dateObj: dateInfo.dateObj,
                    tbData: tbData,
                    codeWarnings: tbData.codeWarnings || []
                });
            }
        }

        loadingIndicator.classList.add('hidden');
        renderReviewFilesList();

    } catch (error) {
        console.error(error);
        showError('เกิดข้อผิดพลาดในการประมวลผลไฟล์: ' + error.message);
    }
}

// Helper: จัดการเรียงลำดับตารางข้อผิดพลาด (DOM Sorter)
window.sortWarningTable = function(tableId, colIndex, isNumeric = false) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) return;
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    const currentDir = tableBody.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
    tableBody.setAttribute('data-sort-dir', currentDir);
    
    rows.sort((a, b) => {
        const aCell = a.cells[colIndex];
        const bCell = b.cells[colIndex];
        if (!aCell || !bCell) return 0;
        
        let aVal = aCell.textContent.trim().toLowerCase();
        let bVal = bCell.textContent.trim().toLowerCase();
        
        if (isNumeric) {
            return currentDir === 'asc' ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
        }
        
        return currentDir === 'asc' ? aVal.localeCompare(bVal, 'th') : bVal.localeCompare(aVal, 'th');
    });
    
    tableBody.innerHTML = '';
    rows.forEach(r => tableBody.appendChild(r));
    
    const headers = document.querySelectorAll(`#${tableId} thead th`);
    headers.forEach((h, idx) => {
        const caretSpan = h.querySelector('.sort-caret');
        if (caretSpan) caretSpan.remove();
        
        if (idx === colIndex) {
            const caret = currentDir === 'asc' ? ' ▲' : ' ▼';
            const span = document.createElement('span');
            span.className = 'sort-caret text-sky-600 font-bold ml-1';
            span.textContent = caret;
            h.appendChild(span);
        }
    });
};

// Helper: กรองข้อมูลในตารางข้อผิดพลาด (DOM Filter)
window.filterWarningTable = function(tableId, query) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll('tr');
    const lowerQuery = String(query).trim().toLowerCase();
    
    rows.forEach(r => {
        let match = false;
        Array.from(r.cells).forEach(cell => {
            if (cell.textContent.toLowerCase().includes(lowerQuery)) {
                match = true;
            }
        });
        if (match || !lowerQuery) {
            r.classList.remove('hidden');
        } else {
            r.classList.add('hidden');
        }
    });
};

// Helper: ตรวจสอบว่าเป็นรหัสบัญชีมาตรฐานหรือไม่
function isStandardAccountCode(code) {
    const checkMap = (map) => {
        if (typeof map === 'undefined' || !map) return false;
        for (let key in map) {
            if (map[key] && Array.isArray(map[key].codes)) {
                if (map[key].codes.includes(code)) {
                    return true;
                }
            }
        }
        return false;
    };
    return checkMap(ACCOUNTS) || checkMap(AP_ACCOUNTS) || checkMap(PR_ACCOUNTS) || checkMap(INV_ACCOUNTS);
}

// Helper: ตรวจสอบและค้นหารหัสบัญชีมาตรฐานที่ใกล้เคียงที่สุด
function findClosestStandardCode(code) {
    let closest = null;
    let maxMatchLen = 0;
    
    const checkMap = (map) => {
        if (typeof map === 'undefined' || !map) return;
        for (let key in map) {
            if (map[key] && Array.isArray(map[key].codes)) {
                for (let stdCode of map[key].codes) {
                    if (code.startsWith(stdCode) || stdCode.startsWith(code)) {
                        let matchLen = 0;
                        for (let i = 0; i < Math.min(code.length, stdCode.length); i++) {
                            if (code[i] === stdCode[i]) matchLen++;
                            else break;
                        }
                        if (matchLen > maxMatchLen) {
                            maxMatchLen = matchLen;
                            closest = {
                                code: stdCode,
                                name: map[key].name
                            };
                        }
                    }
                }
            }
        }
    };
    
    checkMap(ACCOUNTS);
    checkMap(AP_ACCOUNTS);
    checkMap(PR_ACCOUNTS);
    checkMap(INV_ACCOUNTS);
    
    return closest;
}

// Helper: ตรวจสอบและแปลงรหัสบัญชีให้เป็นมาตรฐาน
function validateAndNormalizeCode(code) {
    const trimmed = String(code).trim();
    const isCR = trimmed.startsWith('CR_');
    const codeToNormalize = isCR ? trimmed.substring(3) : trimmed;
    
    const hasInvalidChars = isCR ? /[^0-9a-zA-Z.]/.test(codeToNormalize) : /[^0-9.]/.test(codeToNormalize);
    
    let normalized = codeToNormalize;
    let warnings = [];
    
    if (hasInvalidChars) {
        const invalidChars = Array.from(new Set(codeToNormalize.match(isCR ? /[^0-9a-zA-Z.]/g : /[^0-9.]/g)));
        warnings.push({
            type: 'info',
            message: `พบตัวอักษรหรือสัญลักษณ์เพิ่มเติม: "${invalidChars.join(', ')}"`
        });
        normalized = codeToNormalize.replace(isCR ? /[^0-9a-zA-Z.]/g : /[^0-9.]/g, '');
    }
    
    if (isCR) {
        normalized = 'CR_' + normalized;
    }
    
    const normDotsCount = (normalized.match(/\./g) || []).length;
    if (normDotsCount > 2) {
        warnings.push({
            type: 'info',
            message: `พบจุดเกิน 2 ตัว (${normDotsCount} ตัว)`
        });
    }
    
    // สำหรับรหัสที่ขึ้นต้นด้วย CR_ เราจะดึงส่วนหลังมาเช็คมาตรฐาน
    const checkCode = isCR ? normalized.substring(3) : normalized;
    
    // ตรวจสอบว่าไม่พบรหัสมาตรฐานหลักในระบบ (เป็นคำเตือนเบาๆ info)
    if (!isStandardAccountCode(checkCode) && normalized !== 'CR_2600Y') {
        warnings.push({
            type: 'info',
            message: 'ไม่พบรหัสมาตรฐานในระบบ'
        });
    }
    
    const closest = findClosestStandardCode(checkCode);
    const isValid = warnings.length === 0;
    
    return {
        isValid: isValid,
        original: trimmed,
        normalized: normalized, // ไม่มีการดัดแปลงโครงสร้างจุดเกิน คงค่าเดิมทั้งหมด!
        warnings: warnings,
        isCritical: false, // ไม่มีข้อผิดพลาดคอขาดบาดตายที่จะต้องไปดัดแปลงข้อมูล
        closest: closest
    };
}

function parseExcelData(rows) {
    if (rows.length < 2) return null;

    let headerRow = -1;
    let colMap = {
        code: -1,
        name: -1,
        begin_dr: -1,
        begin_cr: -1,
        begin_net_col: -1,
        move_dr: -1,
        move_cr: -1,
        move_net_col: -1,
        end_dr: -1,
        end_cr: -1,
        end_net_col: -1
    };

    for (let i = 0; i < 10 && i < rows.length; i++) {
        let r = rows[i];
        if (!r) continue;

        let tempMap = {
            code: -1,
            name: -1,
            begin_dr: -1,
            begin_cr: -1,
            begin_net_col: -1,
            move_dr: -1,
            move_cr: -1,
            move_net_col: -1,
            end_dr: -1,
            end_cr: -1,
            end_net_col: -1
        };

        for (let j = 0; j < r.length; j++) {
            let val = String(r[j]).toLowerCase().replace(/ /g, '');
            if (val.includes('รหัส') || val.includes('codel1') || val.includes('code')) tempMap.code = j;
            else if (val.includes('ชื่อ') || val.includes('account1') || val.includes('account') || val.includes('name') || val.includes('รายการ') || val.includes('desc') || val === 'บัญชี') tempMap.name = j;
            else if (val.includes('เดบิตเดือนนี้')) tempMap.move_dr = j;
            else if (val.includes('เครดิตเดือนนี้')) tempMap.move_cr = j;
            else if (val.includes('เดบิตสุทธิ')) tempMap.end_dr = j;
            else if (val.includes('เครดิตสุทธิ')) tempMap.end_cr = j;
            else if (val === 'เดบิต' || val === 'debit') tempMap.move_dr = j;
            else if (val === 'เครดิต' || val === 'credit') tempMap.move_cr = j;
            else if (val.includes('ยอดยกมา') && val.includes('เดบิต')) tempMap.begin_dr = j;
            else if (val.includes('ยอดยกมา') && val.includes('เครดิต')) tempMap.begin_cr = j;
            else if (val.includes('ยอดยกมา')) tempMap.begin_net_col = j;
            else if (val.includes('ระหว่างเดือน') && val.includes('เดบิต')) tempMap.move_dr = j;
            else if (val.includes('ระหว่างเดือน') && val.includes('เครดิต')) tempMap.move_cr = j;
            else if (val.includes('ระหว่างเดือน') || val.includes('เคลื่อนไหว')) tempMap.move_net_col = j;
            else if ((val.includes('ยอดยกไป') || val.includes('ยอดยกมา')) && val.includes('เดบิต') && tempMap.begin_dr !== -1 && tempMap.end_dr === -1) tempMap.end_dr = j;
            else if (val.includes('ยอดยกไป') && val.includes('เดบิต')) tempMap.end_dr = j;
            else if (val.includes('ยอดยกไป') && val.includes('เครดิต')) tempMap.end_cr = j;
            else if (val.includes('ยอดยกไป')) tempMap.end_net_col = j;

            else if (val.includes('begin') && val.includes('dr')) tempMap.begin_dr = j;
            else if (val.includes('begin') && val.includes('cr')) tempMap.begin_cr = j;
            else if (val.includes('begin') && val.includes('bal')) tempMap.begin_net_col = j;
            else if (val.includes('move') && val.includes('dr')) tempMap.move_dr = j;
            else if (val.includes('move') && val.includes('cr')) tempMap.move_cr = j;
            else if (val.includes('move') && val.includes('bal')) tempMap.move_net_col = j;
            else if (val.includes('end') && val.includes('dr')) tempMap.end_dr = j;
            else if (val.includes('end') && val.includes('cr')) tempMap.end_cr = j;
            else if (val.includes('end') && val.includes('bal')) tempMap.end_net_col = j;
        }

        if (tempMap.code !== -1) {
            if (tempMap.begin_dr === -1 && tempMap.begin_net_col === -1 && i + 1 < rows.length) {
                let r2 = rows[i + 1];
                for (let k = 0; k < r2.length; k++) {
                    let v2 = String(r2[k]).toLowerCase();
                    if (v2.includes('เดบิต') || v2.includes('dr')) {
                        if (tempMap.begin_dr === -1) tempMap.begin_dr = k;
                        else if (tempMap.end_dr === -1 && k > tempMap.begin_dr + 1) tempMap.end_dr = k;
                    }
                    if (v2.includes('เครดิต') || v2.includes('cr')) {
                        if (tempMap.begin_cr === -1) tempMap.begin_cr = k;
                        else if (tempMap.end_cr === -1 && k > tempMap.begin_cr + 1) tempMap.end_cr = k;
                    }
                }
            }
            colMap = tempMap;
            headerRow = i;
            break;
        }
    }

    const foundAny = colMap.begin_dr !== -1 || colMap.begin_net_col !== -1 ||
                     colMap.move_dr !== -1 || colMap.move_net_col !== -1 ||
                     colMap.end_dr !== -1 || colMap.end_net_col !== -1;

    if (!foundAny) {
        if (colMap.begin_net_col === -1) {
            if (colMap.begin_dr === -1) colMap.begin_dr = 2;
            if (colMap.begin_cr === -1) colMap.begin_cr = 3;
        }
        if (colMap.move_net_col === -1) {
            if (colMap.move_dr === -1) colMap.move_dr = 4;
            if (colMap.move_cr === -1) colMap.move_cr = 5;
        }
        if (colMap.end_net_col === -1) {
            if (colMap.end_dr === -1) colMap.end_dr = 6;
            if (colMap.end_cr === -1) colMap.end_cr = 7;
        }
    }
    if (colMap.code === -1) colMap.code = 0;

    let parsedDataMap = new Map();
    let fileWarnings = [];

    // Helper: cleans string numbers (removes commas, handles '-' as 0)
    function cleanNum(val) {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        let s = String(val).trim().replace(/,/g, '').replace(/^-$/, '0');
        let parsed = parseFloat(s);
        return isNaN(parsed) ? 0 : parsed;
    }

    for (let i = headerRow + 1; i < rows.length; i++) {
        let r = rows[i];
        if (!r || r.length === 0) continue;

        let code = r[colMap.code] !== undefined ? String(r[colMap.code]).trim() : '';
        if (!code || code === 'undefined' || code === 'null') continue;

        let name = '';
        if (colMap.name !== -1 && r[colMap.name] !== undefined) {
            name = String(r[colMap.name]).trim();
        }

        let b_dr = 0, b_cr = 0;
        if (colMap.begin_net_col !== -1 && r[colMap.begin_net_col] !== undefined) {
            let b_net_val = cleanNum(r[colMap.begin_net_col]);
            if (b_net_val > 0) {
                b_dr = b_net_val;
            } else {
                b_cr = Math.abs(b_net_val);
            }
        } else {
            b_dr = cleanNum(r[colMap.begin_dr]);
            b_cr = cleanNum(r[colMap.begin_cr]);
        }

        let m_dr = 0, m_cr = 0;
        if (colMap.move_net_col !== -1 && r[colMap.move_net_col] !== undefined) {
            let m_net_val = cleanNum(r[colMap.move_net_col]);
            if (m_net_val > 0) {
                m_dr = m_net_val;
            } else {
                m_cr = Math.abs(m_net_val);
            }
        } else {
            m_dr = cleanNum(r[colMap.move_dr]);
            m_cr = cleanNum(r[colMap.move_cr]);
        }

        let e_dr = 0, e_cr = 0;
        if (colMap.end_net_col !== -1 && r[colMap.end_net_col] !== undefined) {
            let e_net_val = cleanNum(r[colMap.end_net_col]);
            if (e_net_val > 0) {
                e_dr = e_net_val;
            } else {
                e_cr = Math.abs(e_net_val);
            }
        } else {
            e_dr = cleanNum(r[colMap.end_dr]);
            e_cr = cleanNum(r[colMap.end_cr]);
        }

        // Validate and normalize code
        const valResult = validateAndNormalizeCode(code);
        const finalCode = valResult.normalized;

        if (!valResult.isValid) {
            fileWarnings.push({
                original: valResult.original,
                normalized: valResult.normalized,
                warnings: valResult.warnings,
                isCritical: valResult.isCritical,
                closest: valResult.closest,
                name: name
            });
        }

        if (parsedDataMap.has(finalCode)) {
            let existing = parsedDataMap.get(finalCode);
            existing.begin_dr += b_dr;
            existing.begin_cr += b_cr;
            existing.move_dr += m_dr;
            existing.move_cr += m_cr;
            existing.end_dr += e_dr;
            existing.end_cr += e_cr;
            
            existing.begin_net = existing.begin_dr - existing.begin_cr;
            existing.move_net = existing.move_dr - existing.move_cr;
            existing.end_net = existing.end_dr - existing.end_cr;
            
            if (!existing.name && name) {
                existing.name = name;
            }
        } else {
            let begin_net = b_dr - b_cr;
            let move_net = m_dr - m_cr;
            let end_net = e_dr - e_cr;

            parsedDataMap.set(finalCode, {
                code: finalCode,
                name: name,
                begin_dr: b_dr,
                begin_cr: b_cr,
                move_dr: m_dr,
                move_cr: m_cr,
                end_dr: e_dr,
                end_cr: e_cr,
                begin_net: begin_net,
                move_net: move_net,
                end_net: end_net
            });
        }
    }

    let parsedData = Array.from(parsedDataMap.values());
    parsedData.codeWarnings = fileWarnings;
    return parsedData;
}

function executeFormulasForData(currentFile, allFiles) {
    const tbData = currentFile.tbData;

    const getBeginBalance = (accountKey) => {
        const config = ACCOUNTS[accountKey];
        if (!config) return 0;
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += config.type === 'debit' ? row.begin_net : (row.begin_net * -1);
            }
        });
        return total;
    };

    const getEndBalance = (accountKey) => {
        const config = ACCOUNTS[accountKey];
        if (!config) return 0;
        let total = 0;
        tbData.forEach(row => {
            if (config.codes.includes(row.code)) {
                total += config.type === 'debit' ? row.end_net : (row.end_net * -1);
            }
        });
        return total;
    };

    const getMovement = (accountKey) => getEndBalance(accountKey) - getBeginBalance(accountKey);

    const getPrevSepBalance = (accountKey) => {
        if (typeof isMonthCalculable === 'function' && !isMonthCalculable(currentFile, allFiles)) {
            return null;
        }
        let currentMonth = currentFile.dateObj.getMonth();
        let currentYear = currentFile.dateObj.getFullYear();
        let targetMonth = 8;
        let targetYear = currentMonth >= 9 ? currentYear : currentYear - 1;

        let sepFile = allFiles.find(f => f.dateObj.getFullYear() === targetYear && f.dateObj.getMonth() === targetMonth);

        if (sepFile) {
            const config = ACCOUNTS[accountKey];
            if (!config) return 0;
            let total = 0;
            sepFile.tbData.forEach(row => {
                if (config.codes.includes(row.code)) {
                    total += config.type === 'debit' ? row.end_net : (row.end_net * -1);
                }
            });
            return total;
        }
        return null;
    };

    const getDaysInPeriod = () => {
        let currentMonth = currentFile.dateObj.getMonth();
        let monthInFiscalYear = currentMonth >= 9 ? currentMonth - 8 : currentMonth + 4;
        return monthInFiscalYear * 30;
    };

    let result_total = FORMULAS.uc_collection_period.calculate('ar_uc_total', 'rev_uc_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_ip = FORMULAS.uc_collection_period.calculate('ar_uc_ip', 'rev_uc_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_ip_cr = FORMULAS.uc_collection_period.calculate('ar_uc_ip_cr', 'rev_uc_ip_cr', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_op_cr = FORMULAS.uc_collection_period.calculate('ar_uc_op_cr', 'rev_uc_op_cr', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_refer = FORMULAS.uc_collection_period.calculate('ar_op_refer', 'rev_op_refer', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);

    let result_cgd_total = FORMULAS.uc_collection_period.calculate('ar_cgd_total', 'rev_cgd_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_cgd_op = FORMULAS.uc_collection_period.calculate('ar_cgd_op', 'rev_cgd_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);
    let result_cgd_ip = FORMULAS.uc_collection_period.calculate('ar_cgd_ip', 'rev_cgd_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod);

    let sss_res = {
        total: FORMULAS.uc_collection_period.calculate('ar_sss_total', 'rev_sss_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_net: FORMULAS.uc_collection_period.calculate('ar_sss_op_net', 'rev_sss_op_net', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_net: FORMULAS.uc_collection_period.calculate('ar_sss_ip_net', 'rev_sss_ip_net', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_out_moph: FORMULAS.uc_collection_period.calculate('ar_sss_op_out_moph', 'rev_sss_op_out_moph', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_out_moph: FORMULAS.uc_collection_period.calculate('ar_sss_ip_out_moph', 'rev_sss_ip_out_moph', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_out_other: FORMULAS.uc_collection_period.calculate('ar_sss_op_out_other', 'rev_sss_op_out_other', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_out_other: FORMULAS.uc_collection_period.calculate('ar_sss_ip_out_other', 'rev_sss_ip_out_other', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        wcf: FORMULAS.uc_collection_period.calculate('ar_sss_wcf', 'rev_sss_wcf', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        first_72h: FORMULAS.uc_collection_period.calculate('ar_sss_first_72h', 'rev_sss_first_72h', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        hc_op: FORMULAS.uc_collection_period.calculate('ar_sss_hc_op', 'rev_sss_hc_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        hc_ip: FORMULAS.uc_collection_period.calculate('ar_sss_hc_ip', 'rev_sss_hc_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod)
    };

    let alien_res = {
        total: FORMULAS.uc_collection_period.calculate('ar_alien_total', 'rev_alien_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_out: FORMULAS.uc_collection_period.calculate('ar_alien_op_out', 'rev_alien_op_out', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_out: FORMULAS.uc_collection_period.calculate('ar_alien_ip_out', 'rev_alien_ip_out', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_center: FORMULAS.uc_collection_period.calculate('ar_alien_op_center', 'rev_alien_op_center', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_center: FORMULAS.uc_collection_period.calculate('ar_alien_ip_center', 'rev_alien_ip_center', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod)
    };

    let status_res = {
        total: FORMULAS.uc_collection_period.calculate('ar_status_total', 'rev_status_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_in: FORMULAS.uc_collection_period.calculate('ar_status_op_in', 'rev_status_op_in', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_out: FORMULAS.uc_collection_period.calculate('ar_status_op_out', 'rev_status_op_out', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        op_center: FORMULAS.uc_collection_period.calculate('ar_status_op_center', 'rev_status_op_center', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ip_center: FORMULAS.uc_collection_period.calculate('ar_status_ip_center', 'rev_status_ip_center', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod)
    };

    let other_res = {
        total: FORMULAS.uc_collection_period.calculate('ar_other_total', 'rev_other_total', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        self_op: FORMULAS.uc_collection_period.calculate('ar_other_self_op', 'rev_other_self_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        self_ip: FORMULAS.uc_collection_period.calculate('ar_other_self_ip', 'rev_other_self_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        affil_op: FORMULAS.uc_collection_period.calculate('ar_other_affil_op', 'rev_other_affil_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        affil_ip: FORMULAS.uc_collection_period.calculate('ar_other_affil_ip', 'rev_other_affil_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        agency_op: FORMULAS.uc_collection_period.calculate('ar_other_agency_op', 'rev_other_agency_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        agency_ip: FORMULAS.uc_collection_period.calculate('ar_other_agency_ip', 'rev_other_agency_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        car_op: FORMULAS.uc_collection_period.calculate('ar_other_car_op', 'rev_other_car_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        car_ip: FORMULAS.uc_collection_period.calculate('ar_other_car_ip', 'rev_other_car_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        lao_op: FORMULAS.uc_collection_period.calculate('ar_other_lao_op', 'rev_other_lao_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        lao_ip: FORMULAS.uc_collection_period.calculate('ar_other_lao_ip', 'rev_other_lao_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        laosp_op: FORMULAS.uc_collection_period.calculate('ar_other_laosp_op', 'rev_other_laosp_op', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        laosp_ip: FORMULAS.uc_collection_period.calculate('ar_other_laosp_ip', 'rev_other_laosp_ip', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        ems: FORMULAS.uc_collection_period.calculate('ar_other_ems', 'rev_other_ems', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        specimen_gov: FORMULAS.uc_collection_period.calculate('ar_other_specimen_gov', 'rev_other_specimen_gov', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        specimen_ext: FORMULAS.uc_collection_period.calculate('ar_other_specimen_ext', 'rev_other_specimen_ext', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        health_gov: FORMULAS.uc_collection_period.calculate('ar_other_health_gov', 'rev_other_health_gov', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        health_ext: FORMULAS.uc_collection_period.calculate('ar_other_health_ext', 'rev_other_health_ext', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        mat_gov: FORMULAS.uc_collection_period.calculate('ar_other_mat_gov', 'rev_other_mat_gov', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod),
        mat_ext: FORMULAS.uc_collection_period.calculate('ar_other_mat_ext', 'rev_other_mat_ext', getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod)
    };

    return {
        uc: {
            total: result_total,
            ip: result_ip,
            ip_cr: result_ip_cr,
            op_cr: result_op_cr,
            refer: result_refer
        },
        cgd: {
            total: result_cgd_total,
            op: result_cgd_op,
            ip: result_cgd_ip
        },
        sss: sss_res,
        alien: alien_res,
        status: status_res,
        other: other_res
    };
}

function showError(msg) {
    const errEl = errorMsg || document.getElementById('errorMsg');
    const errTxtEl = errorText || document.getElementById('errorText');
    const loadingEl = loadingIndicator || document.getElementById('loadingIndicator');
    const dropZoneEl = dropZone || document.getElementById('dropZone');
    
    if (!errEl || !errTxtEl) return;
    if (msg) {
        errTxtEl.textContent = msg;
        errEl.classList.remove('hidden');
        if (loadingEl) loadingEl.classList.add('hidden');
        if (dropZoneEl) dropZoneEl.classList.remove('hidden');
    } else {
        errEl.classList.add('hidden');
    }
}

// Robust Initialization Event Hook (resolves asynchronous browser DOM timing bugs)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEvents);
} else {
    setupEvents();
}

function renderReviewFilesList() {
    const container = document.getElementById('reviewFilesContainer');
    const listBody = document.getElementById('reviewFilesListBody');
    const dropZoneEl = document.getElementById('dropZone');
    const btnProcess = document.getElementById('btnProcessUpload');
    
    if (!container || !listBody) return;

    const hospitalBadge = document.getElementById('hospitalDataStatusBadge');
    if (hospitalBadge) {
        if (window.hospitalData) {
            hospitalBadge.className = 'text-xs font-bold px-3 py-1.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-1.5 shadow-sm';
            hospitalBadge.innerHTML = '✓ นำเข้าข้อมูลโรงพยาบาลแล้ว';
        } else {
            hospitalBadge.className = 'text-xs font-bold px-3 py-1.5 rounded-xl border bg-amber-50 border-amber-250 text-amber-800 flex items-center gap-1.5 shadow-sm';
            hospitalBadge.innerHTML = '⚠ ยังไม่มีข้อมูลโรงพยาบาล (ไม่สามารถคำนวณต้นทุนค่ารักษาพยาบาล)';
        }
    }
    
    if (uploadedFilesTemp.length === 0) {
        container.classList.add('hidden');
        if (dropZoneEl) dropZoneEl.classList.remove('hidden');
        if (btnProcess) btnProcess.classList.remove('animate-attention');
        return;
    }
    
    if (dropZoneEl) dropZoneEl.classList.add('hidden');
    container.classList.remove('hidden');
    if (btnProcess) btnProcess.classList.add('animate-attention');
    listBody.innerHTML = '';
    
    const thaiMonthsFull = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    
    // เรียงลำดับไฟล์ตามเงื่อนไขตัวกรอง/เรียงลำดับ
    const sortOrderSelect = document.getElementById('reviewSortOrder');
    const sortValue = sortOrderSelect ? sortOrderSelect.value : 'critical';

    const sortedFiles = [...uploadedFilesTemp].sort((a, b) => {
        // ข้อมูลโรงพยาบาลอยู่บนสุดเสมอ
        if (a.isHospitalData && !b.isHospitalData) return -1;
        if (!a.isHospitalData && b.isHospitalData) return 1;

        if (sortValue === 'critical') {
            const aHasCrit = a.codeWarnings.some(w => w.isCritical) ? 1 : 0;
            const bHasCrit = b.codeWarnings.some(w => w.isCritical) ? 1 : 0;
            return bHasCrit - aHasCrit;
        } else if (sortValue === 'dateAsc') {
            const aTime = a.dateObj ? a.dateObj.getTime() : 0;
            const bTime = b.dateObj ? b.dateObj.getTime() : 0;
            return aTime - bTime;
        } else if (sortValue === 'dateDesc') {
            const aTime = a.dateObj ? a.dateObj.getTime() : 0;
            const bTime = b.dateObj ? b.dateObj.getTime() : 0;
            return bTime - aTime;
        }
        return 0;
    });
    
    sortedFiles.forEach(file => {
        const tr = document.createElement('tr');
        tr.className = 'bg-white hover:bg-slate-50 transition-colors text-slate-700 border-b border-slate-100';
        
        if (file.isHospitalData) {
            tr.innerHTML = `
                <td class="px-4 py-3.5 font-semibold text-slate-900 select-all">${file.filename}</td>
                <td class="px-4 py-3.5 text-center text-slate-500 font-bold">ข้อมูลสถิติโรงพยาบาลทุกเดือน/ปีงบประมาณ</td>
                <td class="px-4 py-3.5 text-center">
                    <span class="px-2.5 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-850 text-xs font-bold rounded-full shadow-sm">
                        ✓ นำเข้าข้อมูลสำเร็จ
                    </span>
                </td>
                <td class="px-4 py-3.5 text-center">
                    <button class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all focus:outline-none active:scale-90" title="ลบไฟล์">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 18px; height: 18px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            `;
            
            // Delete button event
            const deleteBtn = tr.querySelector('button');
            deleteBtn.addEventListener('click', () => {
                deleteTempFile(file.id);
            });
            
            listBody.appendChild(tr);
            return;
        }
        
        // Month dropdown options
        let monthOptions = '';
        thaiMonthsFull.forEach((mName, idx) => {
            const isSelected = file.dateObj.getMonth() === idx ? 'selected' : '';
            monthOptions += `<option value="${idx}" ${isSelected}>${mName}</option>`;
        });
        
        // Year dropdown options (2560 - 2575)
        let yearOptions = '';
        const currentThaiYear = file.dateObj.getFullYear() + 543;
        for (let y = 2560; y <= 2575; y++) {
            const isSelected = currentThaiYear === y ? 'selected' : '';
            yearOptions += `<option value="${y}" ${isSelected}>${y}</option>`;
        }
        
        // Warnings status badge split (Critical vs Info)
        const criticalWarnings = file.codeWarnings.filter(w => w.isCritical);
        const infoWarnings = file.codeWarnings.filter(w => !w.isCritical);
        
        let warningBadge = '';
        if (criticalWarnings.length > 0) {
            warningBadge = `
                <span class="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full shadow-sm whitespace-nowrap cursor-pointer inline-flex items-center gap-1 hover:bg-amber-100 transition-colors select-none" onclick="toggleTempWarningDetail('${file.id}')">
                    ⚠ พบหมวดย่อย (${criticalWarnings.length})
                    <svg id="tempWarningCaret_${file.id}" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 12px; height: 12px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                    </svg>
                </span>
            `;
        } else if (infoWarnings.length > 0) {
            warningBadge = `
                <span class="px-2.5 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold rounded-full shadow-sm whitespace-nowrap cursor-pointer inline-flex items-center gap-1 hover:bg-sky-100/50 transition-colors select-none" onclick="toggleTempWarningDetail('${file.id}')">
                    ℹ ข้อสังเกตรูปแบบรหัส (${infoWarnings.length})
                    <svg id="tempWarningCaret_${file.id}" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 12px; height: 12px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                    </svg>
                </span>
            `;
        } else {
            warningBadge = `
                <span class="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full shadow-sm whitespace-nowrap inline-flex items-center gap-1">
                    ✓ ผ่านเกณฑ์รหัสมาตรฐาน
                </span>
            `;
        }
        
        tr.innerHTML = `
            <td class="px-4 py-3.5 font-semibold text-slate-900 select-all">${file.filename}</td>
            <td class="px-4 py-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <select class="mgt-month-select bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-sky-500">
                        ${monthOptions}
                    </select>
                    <select class="mgt-year-select bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-sky-500">
                        ${yearOptions}
                    </select>
                </div>
            </td>
            <td class="px-4 py-3.5 text-center">${warningBadge}</td>
            <td class="px-4 py-3.5 text-center">
                <button class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all focus:outline-none active:scale-90" title="ลบไฟล์">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 18px; height: 18px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        `;
        
        // Add events to selects
        const monthSelect = tr.querySelector('.mgt-month-select');
        const yearSelect = tr.querySelector('.mgt-year-select');
        
        const updateDate = () => {
            const m = parseInt(monthSelect.value);
            const y = parseInt(yearSelect.value) - 543;
            file.dateObj = new Date(y, m, 1);
            const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            const yyShort = (parseInt(yearSelect.value) % 100).toString().padStart(2, '0');
            file.monthStr = `${thaiMonths[m]} ${yyShort}`;
        };
        
        monthSelect.addEventListener('change', updateDate);
        yearSelect.addEventListener('change', updateDate);
        
        // Delete button event
        const deleteBtn = tr.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            deleteTempFile(file.id);
        });
        
        listBody.appendChild(tr);

        // If there are warnings, append a hidden expandable detail row
        if (file.codeWarnings.length > 0) {
            const detailTr = document.createElement('tr');
            detailTr.id = `tempWarningDetailRow_${file.id}`;
            detailTr.className = 'bg-slate-50/30 border-b border-slate-100 hidden';
            
            let warningsListHtml = '';
            file.codeWarnings.forEach(w => {
                const reasons = w.warnings.map(warn => warn.message).join(', ');
                const reasonColor = 'text-slate-500 font-medium';
                const originalColor = 'text-slate-600 font-semibold';
                
                let closestHtml = '<span class="text-slate-400 italic font-sans font-normal">ไม่พบกลุ่มที่ใกล้เคียง</span>';
                if (w.closest) {
                    closestHtml = `<span class="text-emerald-700 font-mono font-bold">${w.closest.code}</span> <div class="text-[10px] text-slate-400 font-sans font-normal leading-tight">${w.closest.name}</div>`;
                }
                
                warningsListHtml += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
                        <td class="px-4 py-2 font-mono ${originalColor} select-all">${w.original}</td>
                        <td class="px-4 py-2 text-slate-700 font-semibold">${w.name || '-'}</td>
                        <td class="px-4 py-2 ${reasonColor}">${reasons}</td>
                        <td class="px-4 py-2 select-all leading-tight">${closestHtml}</td>
                    </tr>
                `;
            });
            
            detailTr.innerHTML = `
                <td colspan="4" class="px-6 py-3 bg-slate-50/10">
                    <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div class="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-4">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 16px; height: 16px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-xs font-bold text-slate-700">รายการแจ้งเตือนรหัส / ข้อสังเกตของไฟล์นี้</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="text-[10px] font-bold text-slate-400">ตัวกรอง:</label>
                                <input type="text" placeholder="ค้นหาตามคำกรอง..." oninput="filterWarningTable('table_tempWarning_${file.id}', this.value)" class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-sky-500 w-44 shadow-sm" />
                            </div>
                        </div>
                        <div class="max-h-[200px] overflow-y-auto">
                            <table id="table_tempWarning_${file.id}" class="w-full text-left text-xs">
                                <thead class="bg-slate-50 text-slate-400 font-bold sticky top-0 border-b border-slate-200">
                                    <tr class="select-none">
                                        <th class="px-4 py-1.5 w-[160px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_tempWarning_${file.id}', 0)">รหัสใน Excel ⇅</th>
                                        <th class="px-4 py-1.5 w-[200px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_tempWarning_${file.id}', 1)">ชื่อบัญชี ⇅</th>
                                        <th class="px-4 py-1.5 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_tempWarning_${file.id}', 2)">คำอธิบาย ⇅</th>
                                        <th class="px-4 py-1.5 w-[220px] cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors" onclick="sortWarningTable('table_tempWarning_${file.id}', 3)">รหัสมาตรฐานที่ใกล้เคียง ⇅</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${warningsListHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            `;
            listBody.appendChild(detailTr);
        }
    });
    
}

function deleteTempFile(id) {
    const fileToDelete = uploadedFilesTemp.find(f => f.id === id);
    if (fileToDelete && fileToDelete.isHospitalData) {
        window.hospitalData = null;
    }
    uploadedFilesTemp = uploadedFilesTemp.filter(f => f.id !== id);
    renderReviewFilesList();
}

async function processUploadData() {
    if (uploadedFilesTemp.length === 0) {
        showError('กรุณาอัปโหลดไฟล์งบทดลองก่อนเริ่มประมวลผล');
        return;
    }
    
    const container = document.getElementById('reviewFilesContainer');
    const loadingEl = document.getElementById('loadingIndicator');
    const btnProcess = document.getElementById('btnProcessUpload');
    
    // --- Quota & Authentication Check ---
    if (typeof Auth !== 'undefined') {
        if (!Auth.isLoggedIn()) {
            showError('กรุณาเข้าสู่ระบบก่อนการประมวลผลข้อมูล');
            checkLoginState();
            return;
        }

        const remain = Auth.getQuotaRemain();
        if (remain <= 0) {
            showError('ไม่สามารถประมวลผลได้: โควตาการใช้งานของท่านหมดลงแล้ว');
            alert('โควตาการใช้งานของท่านหมดลงแล้ว');
            return;
        }

        // Show loading state early
        showError('');
        if (container) container.classList.add('hidden');
        if (btnProcess) btnProcess.classList.remove('animate-attention');
        if (loadingEl) loadingEl.classList.remove('hidden');

        try {
            // Call GAS to deduct quota by 1 with 15 seconds timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(AUTH_API_URL, {
                method: "POST",
                mode: "cors",
                signal: controller.signal,
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "deduct",
                    username: Auth.getCurrentUser(),
                    system: "gl"
                })
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error("Google Apps Script ตอบกลับเป็นข้อความทั่วไปที่ไม่ใช่ JSON (โปรดตรวจสอบการตั้งค่า Deploy Web App ให้สิทธิ์เป็นแบบ 'Anyone')");
            }

            if (!result.success) {
                if (loadingEl) loadingEl.classList.add('hidden');
                if (container) container.classList.remove('hidden');
                showError('ไม่สามารถตัดโควตาได้: ' + (result.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'));
                alert('การหักโควตาล้มเหลว: ' + (result.message || ''));
                return;
            }

            // Update local storage and UI
            Auth.setSession(
                Auth.getCurrentUser(),
                Auth.getQuotaLimit(),
                result.remain,
                parseInt(localStorage.getItem("userPlanLimit") || "0"),
                parseInt(localStorage.getItem("userPlanRemain") || "0")
            );
            updateHeaderProfile();

        } catch (err) {
            console.error(err);
            if (loadingEl) loadingEl.classList.add('hidden');
            if (container) container.classList.remove('hidden');
            
            let errMsg = 'เชื่อมต่อระบบ Backend เพื่อหักโควตาล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ต';
            if (err.name === 'AbortError') {
                errMsg = 'การเชื่อมต่อล้มเหลว กรุณาเชื่อมต่ออีกครั้ง';
            } else if (err.message) {
                errMsg = err.message;
            }
            showError(errMsg);
            return;
        }
    } else {
        showError('');
        if (container) container.classList.add('hidden');
        if (btnProcess) btnProcess.classList.remove('animate-attention');
        if (loadingEl) loadingEl.classList.remove('hidden');
    }
    
    // Filter out hospital data file from calculations array
    const trialBalanceFiles = uploadedFilesTemp.filter(f => !f.isHospitalData);
    if (trialBalanceFiles.length === 0) {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (container) container.classList.remove('hidden');
        showError('กรุณาอัปโหลดไฟล์งบทดลองอย่างน้อย 1 ไฟล์เพื่อเริ่มประมวลผล');
        return;
    }

    // Sort chronologically by dateObj
    trialBalanceFiles.sort((a, b) => a.dateObj - b.dateObj);
    
    monthlyResults = [];
    
    // Clear saved zoom limits
    currentZoomMin = undefined;
    currentZoomMax = undefined;
    dashFinancialZoomMin = undefined;
    dashFinancialZoomMax = undefined;
    dashCCCZoomMin = undefined;
    dashCCCZoomMax = undefined;
    
    // Simulated premium loading delay to give user a visual progress feel
    setTimeout(async () => {
        try {
            // Bridge ending balances of month i-1 to beginning balances of month i for continuous ledger
            for (let i = 1; i < trialBalanceFiles.length; i++) {
                let prevFile = trialBalanceFiles[i - 1];
                let currentFile = trialBalanceFiles[i];
                
                let prevDataMap = new Map();
                prevFile.tbData.forEach(row => {
                    prevDataMap.set(row.code, row);
                });
                
                currentFile.tbData.forEach(row => {
                    let prevRow = prevDataMap.get(row.code);
                    if (prevRow) {
                        // Bridge beginning balance if it is 0
                        if (row.begin_dr === 0 && row.begin_cr === 0) {
                            row.begin_dr = prevRow.end_dr;
                            row.begin_cr = prevRow.end_cr;
                            row.begin_net = prevRow.end_net;
                        }
                    }
                });
            }

            // Derive movements for any months where movement is 0
            for (let i = 0; i < trialBalanceFiles.length; i++) {
                let currentFile = trialBalanceFiles[i];
                currentFile.tbData.forEach(row => {
                    if (row.move_dr === 0 && row.move_cr === 0) {
                        let m_net = row.end_net - row.begin_net;
                        row.move_net = m_net;
                        if (m_net > 0) {
                            row.move_dr = m_net;
                            row.move_cr = 0;
                        } else {
                            row.move_dr = 0;
                            row.move_cr = Math.abs(m_net);
                        }
                    }
                });
            }

            // Run calculations
            for (let i = 0; i < trialBalanceFiles.length; i++) {
                let fileObj = trialBalanceFiles[i];
                
                // ตรวจสอบว่าระบบมีไฟล์ accounts_mgt.js โหลดเข้ามาก่อนหน้าหรือไม่
                // หากไม่มี (ในโหมดขึ้นระบบจริง) ให้ยิงคำนวณผ่าน Google Apps Script API
                if (typeof window.MGT_ACCOUNTS_MAP === 'undefined') {
                    if (loadingIndicator) {
                        loadingIndicator.textContent = `กำลังคำนวณงบบริหารเดือนที่ ${i + 1}/${trialBalanceFiles.length}...`;
                    }
                    
                    const mgtDataCalculated = await fetchMgtCalculationsFromServer(fileObj.tbData);
                    if (mgtDataCalculated) {
                        fileObj.tbData._mgtCalculated = mgtDataCalculated;
                        if (typeof window.MGT_ACCOUNTS_MAP === 'undefined' || window.MGT_ACCOUNTS_MAP.length === 0) {
                            window.MGT_ACCOUNTS_MAP = Object.values(mgtDataCalculated).map(x => ({
                                code: x.code,
                                name: x.name,
                                tbCodes: x.tbCodes
                            }));
                        }
                    } else {
                        if (loadingIndicator) loadingIndicator.classList.add('hidden');
                        showError("ไม่สามารถรับข้อมูลการคำนวณงบบริหารจากเซิร์ฟเวอร์ได้");
                        return;
                    }
                } else {
                    // หากเป็นการรันแบบ Local ให้ผูกค่า MGT_ACCOUNTS_MAP เข้ากับ global window เพื่อให้หน้าจออื่นๆ วาดกราฟ/ตารางได้ปกติ
                    // (ทำหน้าที่เชื่อมโยงกรณีมีการประกาศตัวแปรไว้)
                }
                
                let result = executeFormulasForData(fileObj, trialBalanceFiles);

                let apResult = {};
                let invResult = {};
                let prResult = {};
                let overdueARResult = {};
                let overdueAPResult = {};
                let overduePRResult = {};
                let deadstockResult = {};
                let distressResult = {};
                let waterfallResult = {};
                let treatmentCostResult = {};
                let financialStatementsResult = {};

                if (typeof processAPData === 'function') {
                    apResult = processAPData(fileObj, trialBalanceFiles);
                    fileObj.apResult = apResult;
                }
                if (typeof processINVData === 'function') {
                    invResult = processINVData(fileObj, trialBalanceFiles);
                    fileObj.invResult = invResult;
                }
                if (typeof processPRData === 'function') {
                    prResult = processPRData(fileObj, trialBalanceFiles);
                    fileObj.prResult = prResult;
                }
                if (typeof processDashboardData === 'function') {
                    dashboardResult = processDashboardData(fileObj, trialBalanceFiles);
                    fileObj.dashboardResult = dashboardResult;
                }
                if (typeof calculateOverdueAR === 'function') {
                    overdueARResult = calculateOverdueAR(fileObj, trialBalanceFiles);
                    fileObj.overdueARResult = overdueARResult;
                }
                if (typeof calculateOverdueAP === 'function') {
                    overdueAPResult = calculateOverdueAP(fileObj, trialBalanceFiles);
                    fileObj.overdueAPResult = overdueAPResult;
                }
                if (typeof calculateOverduePR === 'function') {
                    overduePRResult = calculateOverduePR(fileObj, trialBalanceFiles);
                    fileObj.overduePRResult = overduePRResult;
                }
                if (typeof calculateDeadstock === 'function') {
                    deadstockResult = calculateDeadstock(fileObj, trialBalanceFiles);
                    fileObj.deadstockResult = deadstockResult;
                }
                if (typeof calculateFinancialDistress === 'function') {
                    distressResult = calculateFinancialDistress(fileObj, trialBalanceFiles);
                    fileObj.distressResult = distressResult;
                }
                if (typeof calculateWaterfallPnL === 'function') {
                    waterfallResult = calculateWaterfallPnL(fileObj);
                    fileObj.waterfallResult = waterfallResult;
                }
                if (typeof calculateTreatmentCostMetricsForMonth === 'function') {
                    treatmentCostResult = calculateTreatmentCostMetricsForMonth(fileObj);
                    fileObj.treatmentCostResult = treatmentCostResult;
                }
                if (typeof calculateFinancialStatements === 'function') {
                    financialStatementsResult = calculateFinancialStatements(fileObj);
                    fileObj.financialStatementsResult = financialStatementsResult;
                }

                monthlyResults.push({
                    ...fileObj,
                    result: result,
                    apResult: apResult,
                    invResult: invResult,
                    prResult: prResult,
                    dashboardResult: dashboardResult,
                    overdueARResult: overdueARResult,
                    overdueAPResult: overdueAPResult,
                    overduePRResult: overduePRResult,
                    deadstockResult: deadstockResult,
                    distressResult: distressResult,
                    waterfallResult: waterfallResult,
                    treatmentCostResult: treatmentCostResult,
                    financialStatementsResult: financialStatementsResult
                });
            }
            
            tbColStartIndex = Math.max(0, monthlyResults.length - 3);
            
            if (typeof initGlobalDateRangeFilter === 'function') {
                initGlobalDateRangeFilter();
            }
            
            if (loadingEl) loadingEl.classList.add('hidden');
            
            const successIndicator = document.getElementById('successIndicator');
            if (successIndicator) {
                successIndicator.classList.remove('hidden');
            }
            
            setTimeout(() => {
                if (successIndicator) {
                    successIndicator.classList.add('hidden');
                }
                // Switch to Dashboard tab
                switchMainTab('dashboard');
                uploadedFilesTemp = []; // Reset temp list
            }, 1200);
            
        } catch (err) {
            if (loadingEl) loadingEl.classList.add('hidden');
            console.error(err);
            showError('เกิดข้อผิดพลาดในการประมวลผลข้อมูล: ' + err.message);
        }
    }, 1500);
}

// Global toggle for temporary files warnings in review table
window.toggleTempWarningDetail = function(id) {
    const detailRow = document.getElementById(`tempWarningDetailRow_${id}`);
    const caret = document.getElementById(`tempWarningCaret_${id}`);
    if (detailRow) {
        const isHidden = detailRow.classList.contains('hidden');
        if (isHidden) {
            detailRow.classList.remove('hidden');
            if (caret) caret.classList.add('rotate-180');
        } else {
            detailRow.classList.add('hidden');
            if (caret) caret.classList.remove('rotate-180');
        }
    }
};
