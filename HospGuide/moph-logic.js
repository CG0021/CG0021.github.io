// MOPH 2568 Logic - HospGuide
// สำคัญ: ต้องเปลี่ยน URL นี้เป็น URL Web App ของคุณที่ Deploy จาก Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz65fnkvcNgLjGLqZcPhS_Wi5QRNzEAQT7U31f_BGFMUwMBXymOcAqbeh3gh6fpoGPbhg/exec";

// ข้อมูลสำรอง (Fallback) กรณีเชื่อมต่อ API ไม่ได้
const fallbackData = [
    { type: "header", level: 1, title: "หมวดที่ 1 ค่ายาและบริการเภสัชกรรม (ตัวอย่าง)", id: "fb1" },
    { type: "item", mainCategory: "หมวดที่ 1", seq: "1", code: "M001", item: "ยาพาราเซตามอล 500มก.", unit: "เม็ด", priceThai: 1, priceForeign: 2 },
    { type: "header", level: 1, title: "หมวดที่ 2 ค่าบริการทางเทคนิคการแพทย์ (ตัวอย่าง)", id: "fb2" },
    { type: "header", level: 2, title: "2.1 ธนาคารเลือด (Blood Bank)", id: "fb2.1" },
    { type: "item", mainCategory: "หมวดที่ 2", subCategory: "2.1", seq: "1", code: "L01001", item: "ABO Cell grouping", unit: "Test", priceThai: 50, priceForeign: 100 }
];

let mophData = [];
let filteredData = [];
let collapsedHeaders = new Set();
let currentPage = 1;
const itemsPerPage = 100;

document.addEventListener('DOMContentLoaded', () => {
    const mophBody = document.getElementById('mophBody');
    const loading = document.getElementById('loading');
    const mophSearch = document.getElementById('mophSearch');
    const itemCount = document.getElementById('itemCount');
    const catButtons = document.querySelectorAll('.cat-btn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    async function fetchData() {
        try {
            loading.style.display = 'block';
            loading.innerHTML = '<div class="loading-placeholder">กำลังค้นหาข้อมูล...</div>';

            console.log("Fetching from:", API_URL);

            // ใช้ AbortController เพื่อทำ Timeout (15 วินาที)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(API_URL, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            console.log("Data received:", data);

            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");

            mophData = data;

            // Set default collapse for leaf headers
            collapsedHeaders.clear();
            for (let i = 0; i < mophData.length; i++) {
                const current = mophData[i];
                const next = mophData[i + 1];
                if (current.type === "header" && next && next.type === "item") {
                    collapsedHeaders.add(current.id);
                }
            }

            loading.style.display = 'none';
            filterContent();
        } catch (error) {
            console.error("Fetch error details:", error);
            let errorMsg = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
            if (error.name === 'AbortError') errorMsg = "การเชื่อมต่อใช้เวลานานเกินไป (Timeout)";
            else if (error.message.includes("404")) errorMsg = "ไม่พบ URL ของ API (404)";

            loading.innerHTML = `
                <div style="color:#d32f2f; background:#ffebee; padding:20px; border-radius:10px; margin:20px;">
                    <strong>ขออภัย:</strong> ${errorMsg}<br>
                    <small style="display:block; margin-top:10px;">สาเหตุ: ${error.message}</small>
                    <button onclick="location.reload()" style="margin-top:15px; padding:8px 15px; cursor:pointer;">ลองใหม่ครั้ง</button>
                </div>
            `;

            // แสดงข้อมูลตัวอย่างเพื่อให้เว็บไม่ว่างเปล่า
            mophData = fallbackData;
            itemCount.textContent = "แสดงข้อมูลตัวอย่าง";
            setTimeout(() => { if (mophData.length > 0) renderTable(mophData); }, 3000);
        }
    }

    function formatNumber(val) {
        if (val === undefined || val === null || val === "") return "-";
        let cleanVal = val.toString().replace(/,/g, '');
        const num = parseFloat(cleanVal);
        return isNaN(num) ? val : num.toLocaleString();
    }

    function renderTable(data, animateTargetId = null) {
        if (!mophBody) return;
        mophBody.innerHTML = '';

        const visibleRows = [];
        let isHidingFromLevel = 99;

        data.forEach(row => {
            if (row.type === "header") {
                if (row.level <= isHidingFromLevel) isHidingFromLevel = 99;
                if (isHidingFromLevel === 99) visibleRows.push(row);
                if (collapsedHeaders.has(row.id) && isHidingFromLevel === 99) isHidingFromLevel = row.level;
            } else {
                if (isHidingFromLevel === 99) visibleRows.push(row);
            }
        });

        const actualItemsCount = visibleRows.filter(d => d.type === "item").length;
        itemCount.textContent = `พบ ${actualItemsCount} รายการ`;

        const totalPages = Math.ceil(visibleRows.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageRows = visibleRows.slice(start, end);

        let animatingChildren = false;
        let animateTargetLevel = -1;
        if (animateTargetId) {
            const targetHeader = visibleRows.find(h => h.id === animateTargetId);
            if (targetHeader) animateTargetLevel = targetHeader.level;
        }

        pageRows.forEach((row, index) => {
            const tr = document.createElement('tr');

            if (row.type === "header") {
                const className = row.level === 1 ? 'row-main-cat' : row.level === 2 ? 'row-sub-cat' : 'row-deep-cat';
                const isCollapsed = collapsedHeaders.has(row.id);

                tr.setAttribute('data-id', row.id);
                tr.setAttribute('data-level', row.level);
                tr.className = `${className} ${isCollapsed ? 'collapsed' : ''}`;
                tr.innerHTML = `
                    <td colspan="6">
                        <span class="cat-chevron">▼</span>
                        <strong>${row.title}</strong>
                    </td>
                `;
                tr.addEventListener('click', () => toggleCollapse(row.id, tr));

                if (row.id === animateTargetId) {
                    animatingChildren = true;
                } else if (animatingChildren && row.level <= animateTargetLevel) {
                    animatingChildren = false;
                }
            } else {
                tr.innerHTML = `
                    <td>${row.seq || '-'}</td>
                    <td><span class="code-badge">${row.code || '-'}</span></td>
                    <td style="padding-left: ${row.deepCategory ? '40px' : row.subCategory ? '20px' : '15px'}">
                        <div>${row.item || 'ไม่มีชื่อรายการ'}</div>
                    </td>
                    <td>${row.unit || '-'}</td>
                    <td class="price-col price-thai">${formatNumber(row.priceThai)}</td>
                    <td class="price-col price-inter">${formatNumber(row.priceForeign)}</td>
                `;
            }

            if (animatingChildren && row.id !== animateTargetId) {
                tr.classList.add('row-expanding');
                tr.style.animationDelay = `${index * 0.005}s`;
            }

            mophBody.appendChild(tr);
        });

        pageInfo.textContent = `หน้า ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    function toggleCollapse(headerId, headerEl) {
        const isCollapsing = !collapsedHeaders.has(headerId);
        if (isCollapsing) {
            const rows = Array.from(mophBody.children);
            const headerIndex = rows.indexOf(headerEl);
            const headerLevel = parseInt(headerEl.getAttribute('data-level'));

            for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                const rowLevelAttr = row.getAttribute('data-level');
                if (!rowLevelAttr || parseInt(rowLevelAttr) > headerLevel) {
                    row.classList.add('row-collapsing');
                } else {
                    break;
                }
            }

            setTimeout(() => {
                collapsedHeaders.add(headerId);
                renderTable(filteredData.length > 0 || mophSearch.value !== '' ? filteredData : mophData);
            }, 200);
        } else {
            collapsedHeaders.delete(headerId);
            renderTable(filteredData.length > 0 || mophSearch.value !== '' ? filteredData : mophData, headerId);
        }
    }

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(filteredData.length > 0 || mophSearch.value !== '' ? filteredData : mophData);
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const currentList = filteredData.length > 0 || mophSearch.value !== '' ? filteredData : mophData;
        currentPage++;
        renderTable(currentList);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    });

    mophSearch.addEventListener('input', () => {
        currentPage = 1;
        filterContent();
    });

    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            catButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            filterContent();
        });
    });

    function filterContent() {
        const query = mophSearch.value.toLowerCase();
        const cat = document.querySelector('.cat-btn.active').dataset.cat;

        filteredData = [];
        let lastHeader1 = null;
        let lastHeader2 = null;
        let lastHeader3 = null;

        mophData.forEach(row => {
            if (row.type === "header") {
                if (row.level === 1) { lastHeader1 = row; lastHeader2 = null; lastHeader3 = null; }
                else if (row.level === 2) { lastHeader2 = row; lastHeader3 = null; }
                else if (row.level === 3) { lastHeader3 = row; }
                return;
            }

            const itemName = (row.item || "").toString().toLowerCase();
            const itemCode = (row.code || "").toString().toLowerCase();
            const matchesSearch = itemName.includes(query) || itemCode.includes(query);

            let matchesCat = true;
            if (cat !== 'all') {
                const mainCat = (row.mainCategory || "").toString();
                const regex = new RegExp(`(หมวดที่\\s*${cat}|หมวด\\s*${cat}|\\b${cat}\\b|^${cat}(\\.|\\s|$))`, 'i');
                matchesCat = regex.test(mainCat);
            }

            if (matchesSearch && matchesCat) {
                if (lastHeader1 && !filteredData.includes(lastHeader1)) filteredData.push(lastHeader1);
                if (lastHeader2 && !filteredData.includes(lastHeader2)) filteredData.push(lastHeader2);
                if (lastHeader3 && !filteredData.includes(lastHeader3)) filteredData.push(lastHeader3);
                filteredData.push(row);
            }
        });

        renderTable(filteredData.length > 0 || query !== "" ? filteredData : mophData);
    }

    fetchData();
});
