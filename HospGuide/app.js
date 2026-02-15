const API_BASE_URL = "https://script.google.com/macros/s/AKfycbz65fnkvcNgLjGLqZcPhS_Wi5QRNzEAQT7U31f_BGFMUwMBXymOcAqbeh3gh6fpoGPbhg/exec";
const PHDB_API_URL = `${API_BASE_URL}?sheet=PHDB_NHSO`;

let phdbData = [];
let filteredPhdb = []; // This will contain items + headers for display
let rawFilteredItems = []; // Pure items that matched search/cat filters
let collapsedHeaders = new Set();
let currentPage = 1;
const itemsPerPage = 100;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsBody = document.getElementById('resultsBody');
    const itemCount = document.getElementById('itemCount');
    const loading = document.getElementById('loading');
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const detailModal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');
    const catButtons = document.querySelectorAll('.cat-btn');

    async function loadPhdbData() {
        try {
            loading.style.display = 'block';
            resultsBody.innerHTML = '';

            const response = await fetch(PHDB_API_URL);
            if (!response.ok) throw new Error('Network response was not ok');

            phdbData = await response.json();
            console.log("PHDB Data Loaded:", phdbData.length, "items");

            loading.style.display = 'none';
            filterAndGroup();
        } catch (error) {
            console.error("Error loading PHDB data:", error);
            loading.innerHTML = `<div style="color:red; padding:20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
        }
    }

    function formatCurrency(val) {
        if (val === undefined || val === null || val === "") return "0";
        const num = parseFloat(val.toString().replace(/,/g, ''));
        return isNaN(num) ? val : num.toLocaleString();
    }

    // Helper to get value from item checking multiple potential keys
    function getVal(item, keys) {
        for (let key of keys) {
            if (item[key] !== undefined && item[key] !== null) return item[key];
        }
        return "";
    }

    function filterAndGroup(animateTargetId = null) {
        const query = searchInput.value.trim().toLowerCase();
        const activeCatBtn = document.querySelector('.cat-btn.active');
        const activeCat = activeCatBtn ? activeCatBtn.dataset.cat : 'all';

        // 1. Filter raw items
        rawFilteredItems = phdbData.filter(item => {
            const code = getVal(item, ["CODE MOPH 68", "CODE_MOPH", "รหัส"]).toString().toLowerCase();
            const name = getVal(item, ["รายการ", "Name__MOPH", "ชื่อรายการ"]).toString().toLowerCase();
            const model = getVal(item, ["ลำดับ (Model) _MOPH 2568", "Model_MOPH", "รุ่น/แบบ"]).toString().toLowerCase();
            const adp = (item["ADP_CODE"] || "").toString().toLowerCase();
            const billcode = (item["เลขเบิกกรมบัญชีกลาง (billcode)"] || "").toString().toLowerCase();

            const matchesSearch = code.includes(query) ||
                name.includes(query) ||
                model.includes(query) ||
                adp.includes(query) ||
                billcode.includes(query);

            let matchesCat = true;
            if (activeCat !== 'all') {
                const itemCatNum = (item["หมวด"] || "").toString();
                matchesCat = itemCatNum === activeCat;
            }

            return matchesSearch && matchesCat;
        });

        // 2. Sort items: L1, L2, then Seq
        rawFilteredItems.sort((a, b) => {
            const m1 = parseInt(a["หมวด"]) || 0;
            const m2 = parseInt(b["หมวด"]) || 0;
            if (m1 !== m2) return m1 - m2;

            const catA = (a["category_group"] || "").toString();
            const catB = (b["category_group"] || "").toString();
            if (catA !== catB) return catA.localeCompare(catB, 'th');

            const subA = (a["แผนก"] || "").toString();
            const subB = (b["แผนก"] || "").toString();
            if (subA !== subB) return subA.localeCompare(subB, 'th');

            const seqA = parseInt(a["ลำดับ (Model) _MOPH 2568"] || a["ลำดับ_MOPH"]) || 0;
            const seqB = parseInt(b["ลำดับ (Model) _MOPH 2568"] || b["ลำดับ_MOPH"]) || 0;
            return seqA - seqB;
        });

        // 3. Create hierarchical structure (Only Level 1)
        filteredPhdb = [];
        let lastL1 = "";

        rawFilteredItems.forEach(item => {
            const currentL1 = item["category_group"] || "";

            // Only show Level 1 Header
            if (currentL1 && currentL1 !== "อื่นๆ" && currentL1 !== lastL1) {
                const h1Id = `h1-${currentL1}`;
                filteredPhdb.push({ type: 'header', level: 1, title: currentL1, id: h1Id });
                lastL1 = currentL1;
            }

            const l1Collapsed = lastL1 ? collapsedHeaders.has(`h1-${lastL1}`) : false;
            if (!l1Collapsed) {
                filteredPhdb.push({ ...item, type: 'item' });
            }
        });

        if (itemCount) itemCount.textContent = `พบ ${rawFilteredItems.length} รายการ`;
        currentPage = 1;
        renderTable(animateTargetId);
    }


    function renderTable(animateTargetId = null) {
        resultsBody.innerHTML = '';

        if (filteredPhdb.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">ไม่พบข้อมูลที่ค้นหา</td></tr>';
            pagination.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(filteredPhdb.length / itemsPerPage);
        pagination.style.display = totalPages > 1 ? 'flex' : 'none';

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredPhdb.slice(start, end);

        let animatingChildren = false;
        let animateTargetLevel = -1;
        if (animateTargetId) {
            const targetHeader = pageData.find(h => h.id === animateTargetId);
            if (targetHeader) animateTargetLevel = targetHeader.level;
        }

        pageData.forEach((row, index) => {
            const tr = document.createElement('tr');

            if (row.type === 'header') {
                const isCollapsed = collapsedHeaders.has(row.id);
                tr.className = row.level === 1 ? 'row-main-cat' : 'row-sub-cat';
                if (isCollapsed) tr.classList.add('collapsed');

                tr.setAttribute('data-id', row.id);
                tr.setAttribute('data-level', row.level);

                tr.innerHTML = `
                    <td colspan="4" style="padding-left: ${row.level === 1 ? '15px' : '40px'}">
                        <span class="cat-chevron">▼</span>
                        <strong>${row.title}</strong>
                    </td>
                `;
                tr.addEventListener('click', () => toggleHeader(row.id, tr));

                if (row.id === animateTargetId) {
                    animatingChildren = true;
                } else if (animatingChildren && row.level <= animateTargetLevel) {
                    animatingChildren = false;
                }
            } else {
                tr.style.cursor = 'pointer';
                const code = getVal(row, ["CODE MOPH 68", "CODE_MOPH", "รหัส"]);
                const name = getVal(row, ["รายการ", "Name__MOPH", "ชื่อรายการ"]);
                const model = getVal(row, ["ลำดับ (Model) _MOPH 2568", "Model_MOPH", "รุ่น/แบบ"]);
                const priceThai = getVal(row, ["ราคาคนไทย", "Thai_MOPH", "ไทย (บาท)"]);
                const priceForeign = getVal(row, ["ราคาคนต่างชาติ", "Foreigner_MOPH", "ต่างชาติ (บาท)"]);

                tr.innerHTML = `
                    <td><span class="code-badge">${code || '-'}</span></td>
                    <td>
                        <strong>${name || '-'}</strong>
                    </td>
                    <td class="price-col" style="color:var(--primary-color)">${formatCurrency(priceThai)}</td>
                    <td class="price-col" style="color:var(--accent-color)">${formatCurrency(priceForeign)}</td>
                `;
                tr.addEventListener('click', () => showDetails(row));
            }

            // Apply expanding animation if this is a child of the header just expanded
            if (animatingChildren && row.id !== animateTargetId) {
                tr.classList.add('row-expanding');
                tr.style.animationDelay = `${index * 0.005}s`;
            }

            resultsBody.appendChild(tr);
        });

        pageInfo.textContent = `หน้า ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function toggleHeader(headerId, headerEl) {
        const isCollapsing = !collapsedHeaders.has(headerId);

        if (isCollapsing) {
            // Find all child rows currently in the DOM and play collapse animation
            const rows = Array.from(resultsBody.children);
            const headerIndex = rows.indexOf(headerEl);
            const headerLevel = parseInt(headerEl.getAttribute('data-level'));

            for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                const rowLevelAttr = row.getAttribute('data-level');
                // Row is a child if it has no level (regular item) or level > headerLevel
                if (!rowLevelAttr || parseInt(rowLevelAttr) > headerLevel) {
                    row.classList.add('row-collapsing');
                } else {
                    break;
                }
            }

            // Wait for animation to finish before removing from DOM
            setTimeout(() => {
                collapsedHeaders.add(headerId);
                filterAndGroup();
            }, 200);
        } else {
            collapsedHeaders.delete(headerId);
            filterAndGroup(headerId);
        }
    }

    function showDetails(item) {
        // Lock body scroll when modal is open
        document.body.style.overflow = 'hidden';

        const priceThai = getVal(item, ["ราคาคนไทย", "Thai_MOPH", "ไทย (บาท)"]);
        const priceForeign = getVal(item, ["ราคาคนต่างชาติ", "Foreigner_MOPH", "ต่างชาติ (บาท)"]);

        const rateThemes = {
            'thai': { bg: 'rgba(25, 135, 84, 0.1)', border: 'rgba(25, 135, 84, 0.2)', color: '#198754' },     // เขียว
            'inter': { bg: 'rgba(253, 126, 20, 0.1)', border: 'rgba(253, 126, 20, 0.2)', color: '#fd7e14' },   // ส้ม
            'ofc': { bg: 'rgba(13, 110, 253, 0.1)', border: 'rgba(13, 110, 253, 0.2)', color: '#0d6efd' },     // ฟ้า
            'lgo': { bg: 'rgba(255, 193, 7, 0.1)', border: 'rgba(255, 193, 7, 0.2)', color: '#856404' },      // เหลือง
            'sss': { bg: 'rgba(10, 88, 202, 0.1)', border: 'rgba(10, 88, 202, 0.2)', color: '#0a58ca' },      // น้ำเงิน
            'ucs': { bg: 'rgba(212, 175, 55, 0.1)', border: 'rgba(212, 175, 55, 0.2)', color: '#a67c00' },    // ทอง
            'ucep': { bg: 'rgba(220, 53, 69, 0.1)', border: 'rgba(220, 53, 69, 0.2)', color: '#dc3545' },     // แดง
            'fs': { bg: 'rgba(108, 117, 125, 0.1)', border: 'rgba(108, 117, 125, 0.2)', color: '#6c757d' }     // เทา
        };

        const allRates = [
            { label: 'อัตราคนไทย (MOPH)', value: priceThai, theme: rateThemes.thai },
            { label: 'อัตราต่างชาติ (MOPH)', value: priceForeign, theme: rateThemes.inter },
            { label: 'OFC (กรมบัญชีกลาง)', value: item['OFC'], theme: rateThemes.ofc },
            { label: 'LGO (อปท.)', value: item['LGO'], theme: rateThemes.lgo },
            { label: 'SSS (ประกันสังคม)', value: item['SSS'], theme: rateThemes.sss },
            { label: 'UCS (บัตรทอง)', value: item['UCS'], theme: rateThemes.ucs },
            { label: 'fs (Fee Schedule)', value: item['fs'], theme: rateThemes.fs },
            { label: 'UCEP (ฉุกเฉิน)', value: item['UCEP'], theme: rateThemes.ucep }
        ];

        const activeRates = allRates.filter(r => {
            if (!r.value) return false;
            const num = parseFloat(r.value.toString().replace(/,/g, ''));
            return num > 0;
        });

        const code = getVal(item, ["CODE MOPH 68", "CODE_MOPH", "รหัส"]);
        const name = getVal(item, ["รายการ", "Name__MOPH", "ชื่อรายการ"]);
        const note = getVal(item, ["เงื่อนไข", "Notes", "หมายเหตุ"]);

        modalBody.innerHTML = `
            <div class="detail-header">
                <div class="tag blue">CODE: ${code || '-'}</div>
                <h2 style="margin-top:10px; font-size:1.8rem;">${name || 'ไม่มีชื่อรายการ'}</h2>
            </div>
            
            <div class="modal-scroll-area">
                <div class="detail-section" style="margin-top: 30px; margin-bottom: 25px;">
                    <h4 style="margin-bottom:10px;">ข้อมูลรหัสมาตรฐานคำนวณ</h4>
                    <div class="price-highlight" style="display: flex; justify-content: space-between; align-items: stretch; padding: 20px; gap: 20px;">
                        <div style="flex: 2; border-right: 1px solid var(--border-color); padding-right: 20px;">
                            <span class="label" style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 5px;">ชื่อรายการ NHSO</span>
                            <span style="font-size: 1.1rem; font-weight: 500; line-height: 1.4; display: block;">${item['name_nhso'] || '-'}</span>
                        </div>
                        <div style="flex: 1; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                            <div style="margin-bottom: 10px;">
                                <span class="label" style="font-size: 0.8rem; color: var(--text-muted); display: block;">เลขเบิกกรมบัญชีกลาง</span>
                                <span class="value" style="font-size: 1.2rem; color: var(--primary-color); font-weight: 700;">${item['เลขเบิกกรมบัญชีกลาง (billcode)'] || '-'}</span>
                            </div>
                            <div>
                                <span class="label" style="font-size: 0.8rem; color: var(--text-muted); display: block;">ADP CODE</span>
                                <span class="value" style="font-size: 1.1rem; font-weight: 600;">${item['ADP_CODE'] || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-section" style="margin-bottom: 25px;">
                    <h4 style="margin-bottom:15px;">อัตราจ่ายตามสิทธิ (บาท)</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        ${activeRates.length > 0 ? activeRates.map(r => `
                            <div style="background:${r.theme.bg}; border:1px solid ${r.theme.border}; border-radius:12px; padding:15px; display: flex; justify-content: space-between; align-items: center;">
                                <span class="label" style="color:${r.theme.color}; font-weight:600; font-size:0.9rem;">${r.label}</span>
                                <span class="value" style="color:${r.theme.color}; font-weight:700; font-size:1.1rem;">${formatCurrency(r.value)}</span>
                            </div>
                        `).join('') : '<div style="grid-column: span 2; text-align:center; padding:30px; color:var(--text-muted); background:var(--bg-light); border-radius:15px;">ไม่มีข้อมูลอัตราจ่าย</div>'}
                    </div>
                </div>

                <div class="detail-section" style="margin-bottom: 30px;">
                    <h4 style="margin-bottom:10px;">เงื่อนไข</h4>
                    <div style="background:var(--bg-light); padding:20px; border-radius:15px; border-left:4px solid var(--primary-color);">
                        <p style="color:var(--text-main); font-size:0.95rem; line-height:1.6;">${note || 'ไม่มีข้อมูลเงื่อนไขเพิ่มเติม'}</p>
                    </div>
                </div>
            </div>
        `;
        detailModal.style.display = 'block';
    }


    // Event Listeners
    searchBtn.addEventListener('click', filterAndGroup);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') filterAndGroup(); });

    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            catButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAndGroup();
        });
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPhdb.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }
    });

    const closeDetailModal = () => {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    closeModal.addEventListener('click', closeDetailModal);
    window.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetailModal();
    });

    // Start loading
    loadPhdbData();
});
