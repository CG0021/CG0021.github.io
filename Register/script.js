// ----- CONFIG -----
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBHKVQwTSz61nKXvyZzWKs-QeY_X9zbcE26-Wq_k3aYGJb8dPITZralF14FE5igdVZ/exec";

let coursesList = [];
let currentSearchResults = [];
let selectedRowForUpload = null;
let selectedFileBase64 = null;
let selectedFileName = null;

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม",
  "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
];

// ----- TOAST -----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-900';
  toast.className =
    `${bg} text-white font-mono text-xs px-5 py-3.5 border-2 border-black shadow-xl flex items-center justify-between gap-4 pointer-events-auto transition-all transform translate-y-4 opacity-0`;
  toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
    `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ----- API CALLER -----
function callBackend(action, data, callback, errorCallback) {
  const handleErr = (err) => {
    showToast("ไม่สามารถติดต่อเซิร์ฟเวอร์", "error");
    if (typeof errorCallback === 'function') errorCallback(err);
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    const runner = google.script.run.withSuccessHandler(callback).withFailureHandler(handleErr);
    if (action === 'getCourses') runner.getCourses();
    else if (action === 'register') runner.registerUser(data.formData);
    else if (action === 'search') runner.searchRegistrations(data.idOrPhone);
    else if (action === 'uploadSlip') runner.uploadSlip(data.rowNumber, data.base64Data, data.fileName);
    else if (action === 'update') runner.updateRegistration(data.rowNumber, data.formData);
    return;
  }
  if (!WEB_APP_URL) { handleErr("ไม่ได้ตั้งค่า URL เซิร์ฟเวอร์"); return; }
  fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({ action, ...data })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) callback(res.data);
      else {
        showToast("เกิดข้อผิดพลาด: " + res.error, "error");
        if (typeof errorCallback === 'function') errorCallback(res.error);
      }
    })
    .catch(err => handleErr(err));
}

// ----- DOM READY -----
document.addEventListener("DOMContentLoaded", function() {
  // Populate province selects
  const provSelect = document.getElementById("province");
  const editProvSelect = document.getElementById("editProvince");
  PROVINCES.forEach(p => {
    [provSelect, editProvSelect].forEach(el => {
      if (el) {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        el.appendChild(opt);
      }
    });
  });

  loadCourses();

  // Mobile menu toggle
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  toggle.addEventListener("click", function() {
    menu.classList.toggle("hidden");
    this.classList.toggle("active");
  });

  // Intersection Observer for fade-up
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up, .stagger-children').forEach(el => observer.observe(el));

  // Scroll progress
  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    document.getElementById('scroll-progress').style.width = progress + '%';
  });

  // Sticky header shadow
  window.addEventListener('scroll', function() {
    const header = document.getElementById('main-header');
    if (window.scrollY > 20) {
      header.classList.add('shadow-md');
    } else {
      header.classList.remove('shadow-md');
    }
  });
});

// ----- NAVIGATION -----
function showSection(sectionId, element) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
  
  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) targetSection.style.display = 'block';

  // Toggle Hero section visibility (Only visible on Courses page)
  const heroSection = document.getElementById('hero-section');
  if (heroSection) {
    if (sectionId === 'courses-sec') {
      heroSection.style.display = 'block';
    } else {
      heroSection.style.display = 'none';
    }
  }

  // Update navigation button active state
  document.querySelectorAll('.nav-btn, .nav-btn-m').forEach(btn => {
    btn.classList.remove('bg-brand-light', 'text-brand-blue', 'font-bold');
  });
  if (element) {
    element.classList.add('bg-brand-light', 'text-brand-blue', 'font-bold');
  }

  // Close mobile menu
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (mobileMenu) mobileMenu.classList.add('hidden');
  if (menuToggle) menuToggle.classList.remove('active');

  // Scroll smoothly to top of the page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----- LOAD COURSES -----
function loadCourses() {
  const loadingEl = document.getElementById("courses-loading");
  const grid = document.getElementById("coursesGrid");

  callBackend('getCourses', {}, function(data) {
    const grouped = {};
    data.forEach(c => {
      if (!grouped[c.name]) grouped[c.name] = [];
      grouped[c.name].push(c);
    });
    coursesList = data;

    const select = document.getElementById("regCourse");
    const editSelect = document.getElementById("editCourse");
    grid.innerHTML = "";
    select.innerHTML = '<option value="" disabled selected>-- กรุณาเลือก --</option>';
    if (editSelect) editSelect.innerHTML = '<option value="" disabled selected>-- กรุณาเลือก --</option>';

    const names = Object.keys(grouped);
    if (names.length === 0) {
      grid.innerHTML = '<p class="col-span-2 text-center text-slate-500 py-8">ไม่พบหลักสูตร</p>';
    } else {
      names.forEach(name => {
        const instances = grouped[name];
        // populate selects
        [select, editSelect].forEach(el => {
          if (el) {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            el.appendChild(opt);
          }
        });

        let datesHtml = "";
        instances.forEach(inst => {
          const isConfirmed = inst.status === "ยืนยันจัดอบรม";
          const isWaiting = inst.status === "รอจำนวนผู้สมัครครบจำนวน";
          const isCancelled = inst.status === "ยกเลิก" || inst.status === "ยกเลิกการอบรม";

          let badgeClass = "badge-other",
            icon = "fa-circle-info";
          if (isConfirmed) {
            badgeClass = "badge-confirmed";
            icon = "fa-circle-check";
          } else if (isWaiting) {
            badgeClass = "badge-waiting";
            icon = "fa-clock";
          } else if (isCancelled) {
            badgeClass = "bg-red-100 text-red-800 border-red-300";
            icon = "fa-circle-xmark";
          }

          let links = "";
          if (inst.scheduleLink && inst.scheduleLink.startsWith('http')) links +=
            `<a href="${inst.scheduleLink}" target="_blank" class="text-xs text-slate-600 hover:text-brand-blue underline flex items-center gap-1"><i class="fa-solid fa-file-lines"></i> กำหนดการ</a>`;
          if (inst.invitationLink && inst.invitationLink.startsWith('http')) links +=
            `<a href="${inst.invitationLink}" target="_blank" class="text-xs text-slate-600 hover:text-brand-blue underline flex items-center gap-1"><i class="fa-solid fa-envelope"></i> หนังสือเชิญ</a>`;
          if (inst.projectLink && inst.projectLink.startsWith('http')) links +=
            `<a href="${inst.projectLink}" target="_blank" class="text-xs text-slate-600 hover:text-brand-blue underline flex items-center gap-1"><i class="fa-solid fa-folder"></i> โครงการ</a>`;
          if (!links) links = '<span class="text-xs text-slate-400">// ไม่มีเอกสาร</span>';

          let waitNote = '';
          if (isWaiting) {
            waitNote = `<div class="text-amber-600 text-xs font-semibold mt-1.5 flex items-center gap-1"><i class="fa-solid fa-circle-info"></i> จองสิทธิ์ไว้ก่อนได้ (ยังไม่ต้องโอนเงิน)</div>`;
          } else if (isCancelled) {
            waitNote = `<div class="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1"><i class="fa-solid fa-circle-xmark"></i> ยกเลิกการจัดอบรมรอบนี้</div>`;
          }

          let btnHtml = '';
          if (isCancelled) {
            btnHtml = `<button disabled class="font-mono text-xs font-bold bg-slate-200 text-slate-400 px-3 py-1.5 cursor-not-allowed">งดจัดอบรม</button>`;
          } else {
            const btnText = isWaiting ? "+ จองสิทธิ์" : "+ สมัคร";
            const btnClass = isWaiting ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-brand-blue";
            btnHtml = `<button onclick="registerDirect('${name.replace(/'/g, "\\'")}', '${inst.date.replace(/'/g, "\\'")}')" class="font-mono text-xs font-bold ${btnClass} text-white px-3 py-1.5 transition">${btnText}</button>`;
          }

          datesHtml += `
              <div class="border-b border-slate-200 pb-3 mb-3 last:border-none">
                <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span class="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <i class="fa-regular fa-calendar text-brand-blue"></i> ${inst.date}
                  </span>
                  <span class="font-mono text-[10px] px-2 py-0.5 border ${badgeClass} font-medium flex items-center gap-1">
                    <i class="fa-solid ${icon}"></i> ${inst.status}
                  </span>
                </div>
                ${waitNote}
                <div class="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div class="flex gap-3">${links}</div>
                  ${btnHtml}
                </div>
              </div>
            `;
        });

        const card = `
            <div class="bg-slate-50 border border-slate-200 p-6 card-lift">
           
              <h3 class="font-extrabold text-brand-blue text-xl sm:text-2xl mb-4 border-l-4 border-brand-blue pl-3">${name}</h3>
              <div class="bg-white border border-slate-200 p-4">${datesHtml}</div>
            </div>
          `;
        grid.insertAdjacentHTML('beforeend', card);
      });
    }

    if (loadingEl) loadingEl.style.display = "none";
    grid.style.display = "grid";
    // observe stagger children
    document.querySelectorAll('.stagger-children').forEach(el => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      }, { threshold: 0.1 });
      obs.observe(el);
    });
  }, function(err) {
    if (loadingEl) loadingEl.style.display = "none";
    if (grid) {
      grid.innerHTML = `<p class="col-span-2 text-center text-red-500 py-8 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือรีเฟรชหน้าเว็บ</p>`;
      grid.style.display = "block";
    }
  });
}

function registerDirect(courseName, dateVal) {
  showSection('register-sec');
  const select = document.getElementById("regCourse");
  select.value = courseName;
  updateCourseDate(select, dateVal);
}

function updateCourseDate(select, defaultDateVal) {
  const name = select.value;
  const dateSelect = document.getElementById("regDate");
  dateSelect.innerHTML = '<option value="" disabled selected>-- เลือกวันที่ --</option>';
  const instances = coursesList.filter(c => c.name === name);
  instances.forEach(inst => {
    // Skip cancelled dates
    if (inst.status === "ยกเลิก" || inst.status === "ยกเลิกการอบรม") return;
    
    const opt = document.createElement("option");
    opt.value = inst.date;
    opt.textContent = inst.date + " (" + inst.status + ")";
    dateSelect.appendChild(opt);
  });
  if (defaultDateVal) dateSelect.value = defaultDateVal;
  else if (instances.length === 1) dateSelect.value = instances[0].date;
}

// ----- REGISTRATION -----
function submitRegistration(event) {
  event.preventDefault();
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

  const prefix = document.getElementById("prefix").value.trim();
  if (!prefix) { showToast("กรุณาระบุคำนำหน้า", "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> บันทึก'; return; }

  const formData = {
    courseName: document.getElementById("regCourse").value,
    courseDate: document.getElementById("regDate").value,
    citizenId: document.getElementById("citizenId").value,
    phone: document.getElementById("phone").value,
    prefix,
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    position: document.getElementById("position").value,
    organization: document.getElementById("organization").value,
    province: document.getElementById("province").value,
    taxId: document.getElementById("taxId").value,
    taxAddress: document.getElementById("taxAddress").value,
    otherNotes: document.getElementById("otherNotes").value
  };

  callBackend('register', { formData }, function() {
    showToast("ลงทะเบียนสำเร็จ!", "success");
    document.getElementById("regForm").reset();
    document.getElementById("regDate").innerHTML = '<option value="" disabled selected>-- เลือกหลักสูตรก่อน --</option>';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> บันทึก';
    document.getElementById("searchQuery").value = formData.citizenId;
    showSection('lookup-sec');
    searchRegistration();
  });
}

// ----- SEARCH -----
function searchRegistration() {
  const query = document.getElementById("searchQuery").value.trim();
  if (!query) { showToast("กรุณากรอกเลขบัตรหรือเบอร์โทร", "error"); return; }

  const resultsDiv = document.getElementById("searchResults");
  const loading = document.getElementById("search-loading");
  resultsDiv.style.display = "none";
  loading.style.display = "block";

  callBackend('search', { idOrPhone: query }, function(results) {
    loading.style.display = "none";
    resultsDiv.innerHTML = "";
    currentSearchResults = results || [];
    if (!results || results.length === 0) {
      resultsDiv.innerHTML =
        `<div class="bg-slate-50 border border-slate-200 p-8 text-center"><i class="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-2"></i><p class="font-bold">ไม่พบข้อมูล</p></div>`;
    } else {
      let html = `<div class="font-mono text-xs text-brand-blue font-bold mb-3">// FOUND ${results.length} รายการ</div><div class="space-y-4">`;
      results.forEach(reg => {
        let statusBadge = '';
        if (reg.status === 'ชำระเงินสำเร็จ') {
          statusBadge =
            `<span class="font-mono text-xs badge-confirmed border px-2 py-0.5 font-bold"><i class="fa-solid fa-circle-check"></i> ${reg.status}</span>`;
        } else if (reg.status === 'แจ้งชำระเงินแล้ว (รอตรวจสอบ)') {
          statusBadge =
            `<span class="font-mono text-xs bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 font-bold"><i class="fa-solid fa-hourglass-half"></i> ${reg.status}</span>`;
        } else {
          const statusText = reg.status || 'รอดำเนินการชำระเงิน';
          statusBadge =
            `<span class="font-mono text-xs badge-waiting border px-2 py-0.5 font-bold"><i class="fa-solid fa-clock"></i> ${statusText}</span>`;
        }

        let slipHtml = reg.slipUrl && reg.slipUrl.startsWith('http') ?
          `<a href="${reg.slipUrl}" target="_blank" class="font-mono text-xs text-brand-blue underline font-semibold"><i class="fa-solid fa-file-invoice"></i> ดูสลิป</a>` :
          `<span class="font-mono text-xs text-red-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> ยังไม่ส่งสลิป</span>`;

        html += `
            <div class="bg-slate-50 border border-slate-300 p-6 card-lift">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
                <div>
                  <span class="font-mono text-xs text-slate-500">// COURSE</span>
                  <h4 class="font-extrabold text-slate-900 text-lg">${reg.courseName}</h4>
                  <p class="text-xs text-brand-blue font-mono font-bold"><i class="fa-regular fa-calendar"></i> ${reg.courseDate}</p>
                </div>
                <div>${statusBadge}</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 mb-4">
                <div><span class="text-slate-400 font-mono block">// REGISTRANT</span><strong class="text-slate-900">${reg.prefix || ''}${reg.firstName || ''} ${reg.lastName || ''}</strong><p class="text-slate-500">โทร: ${reg.phone || '-'}</p></div>
                <div><span class="text-slate-400 font-mono block">// ORGANIZATION</span><strong>${reg.organization || '-'} (${reg.province || '-'})</strong><p class="text-slate-500">${reg.position || '-'}</p></div>
                <div class="sm:col-span-2 border-t border-slate-200 pt-2"><span class="text-slate-400 font-mono block">// TAX & SLIP</span><p>เลขที่ผู้เสียภาษีหน่วยงาน: ${reg.taxId || '-'}</p><div class="mt-1">${slipHtml}</div></div>
              </div>
              <div class="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-200">
                <button onclick="openEditModal(${reg.rowNumber})" class="flex-1 font-mono text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white py-2.5"><i class="fa-solid fa-pen-to-square"></i> แก้ไข</button>
                <button onclick="openUploadModal(${reg.rowNumber}, '${reg.prefix || ''}${reg.firstName || ''} ${reg.lastName || ''}', '${(reg.courseName || '').replace(/'/g, "\\'")}')" class="flex-1 font-mono text-xs font-bold uppercase tracking-wider bg-brand-blue hover:bg-blue-700 text-white py-2.5"><i class="fa-solid fa-upload"></i> ส่งสลิป</button>
                <button onclick="generateDisbursementForReg('${reg.prefix || ''}${reg.firstName || ''} ${reg.lastName || ''}', '${reg.organization || ''}', '${(reg.courseName || '').replace(/'/g, "\\'")}', '${reg.courseDate || ''}')" class="flex-1 font-mono text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white py-2.5"><i class="fa-solid fa-print"></i> ใบอนุมัติ</button>
              </div>
            </div>
          `;
      });
      html += `</div>`;
      resultsDiv.innerHTML = html;
    }
    resultsDiv.style.display = "block";
  });
}

// ----- UPLOAD SLIP -----
function openUploadModal(rowNumber, name, course) {
  selectedRowForUpload = rowNumber;
  selectedFileBase64 = null;
  selectedFileName = null;
  document.getElementById("modalInfo").innerHTML =
    `<div><strong>ผู้ลงทะเบียน:</strong> ${name}</div><div><strong>หลักสูตร:</strong> ${course}</div>`;
  document.getElementById("filePreview").classList.add("hidden");
  document.getElementById("uploadStatus").classList.add("hidden");
  document.getElementById("uploadZone").classList.remove("hidden");
  document.getElementById("slipFile").value = "";
  document.getElementById("uploadModal").classList.remove("hidden");
}

function closeUploadModal() { document.getElementById("uploadModal").classList.add("hidden"); }

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast("ไฟล์ใหญ่เกิน 5MB", "error"); return; }
  selectedFileName = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedFileBase64 = e.target.result;
    document.getElementById("fileNameDisplay").innerText = "ไฟล์: " + selectedFileName;
    document.getElementById("uploadZone").classList.add("hidden");
    document.getElementById("filePreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function confirmUpload() {
  if (!selectedRowForUpload || !selectedFileBase64) return;
  document.getElementById("filePreview").classList.add("hidden");
  document.getElementById("uploadStatus").classList.remove("hidden");
  callBackend('uploadSlip', { rowNumber: selectedRowForUpload, base64Data: selectedFileBase64, fileName: selectedFileName },
    function() {
      showToast("อัปโหลดสลิปสำเร็จ!", "success");
      closeUploadModal();
      searchRegistration();
    });
}

// ----- DISBURSEMENT (auto-approve) -----
function showDisbursementGenerator() {
  if (currentSearchResults && currentSearchResults.length > 0) {
    const reg = currentSearchResults[0];
    generateDisbursementForReg(
      (reg.prefix || '') + (reg.firstName || '') + ' ' + (reg.lastName || ''),
      reg.organization || 'โรงพยาบาล/หน่วยงาน',
      reg.courseName || '....................................................',
      reg.courseDate || '....................................................'
    );
  } else {
    generateDisbursementForReg("....................................................", "โรงพยาบาล/หน่วยงาน",
      "....................................................", "....................................................");
  }
}

// ----- DISBURSEMENT GENERATION -----
function generateDisbursementForReg(name, org, course, date) {
  document.getElementById("docParticipantName").innerHTML = `<strong>ผู้เข้าร่วม:</strong> ${name}`;
  document.getElementById("docOrganization").innerHTML = `<strong>หน่วยงาน:</strong> ${org}`;
  document.getElementById("docCourse").innerHTML = `<strong>หลักสูตร:</strong> ${course}`;
  document.getElementById("docDate").innerHTML = `<strong>วันที่อบรม:</strong> ${date}`;
  const now = new Date();
  document.getElementById("docCurrentDate").innerText = `วันที่: ${now.toLocaleDateString('th-TH')}`;
  document.getElementById("docApprovalDate").innerText = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString(
  'th-TH');
  document.getElementById("disbursementModal").classList.remove("hidden");
}

function closeDisbursementModal() { document.getElementById("disbursementModal").classList.add("hidden"); }

// ----- EXPORT DATA -----
function exportHospitalData() {
  if (!currentSearchResults || currentSearchResults.length === 0) {
    showToast("กรุณาค้นหารายชื่อก่อนส่งออก", "error");
    return;
  }
  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSearchResults, null, 2));
  const a = document.createElement('a');
  a.href = jsonStr;
  a.download = `Hospital_Export_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("ส่งออกไฟล์สำเร็จ", "success");
}

// ----- BULK IMPORT -----
let bulkCsvData = [];

function openBulkImportModal() {
  document.getElementById("bulkImportModal").classList.remove("hidden");
  document.getElementById("bulkCsvPreview").classList.add("hidden");
  document.getElementById("startBulkBtn").disabled = true;
}

// ----- EDIT -----
function openEditModal(rowNumber) {
  const reg = currentSearchResults.find(r => r.rowNumber === rowNumber);
  if (!reg) return;
  document.getElementById("editRowNumber").value = reg.rowNumber;
  document.getElementById("editCourse").value = reg.courseName;
  updateEditCourseDate(document.getElementById("editCourse"), reg.courseDate);
  document.getElementById("editCitizenId").value = reg.citizenId || "";
  document.getElementById("editPhone").value = reg.phone || "";
  document.getElementById("editPrefix").value = reg.prefix || "";
  document.getElementById("editFirstName").value = reg.firstName || "";
  document.getElementById("editLastName").value = reg.lastName || "";
  document.getElementById("editPosition").value = reg.position || "";
  document.getElementById("editOrganization").value = reg.organization || "";
  document.getElementById("editProvince").value = reg.province || "";
  document.getElementById("editTaxId").value = reg.taxId || "";
  document.getElementById("editTaxAddress").value = reg.taxAddress || "";
  document.getElementById("editOtherNotes").value = reg.otherNotes || "";
  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() { document.getElementById("editModal").classList.add("hidden"); }

function updateEditCourseDate(select, defaultDateVal) {
  const name = select.value;
  const dateSelect = document.getElementById("editDate");
  dateSelect.innerHTML = '<option value="" disabled selected>-- เลือก --</option>';
  const instances = coursesList.filter(c => c.name === name);
  instances.forEach(inst => {
    // Skip cancelled dates
    if (inst.status === "ยกเลิก" || inst.status === "ยกเลิกการอบรม") return;
    
    const opt = document.createElement("option");
    opt.value = inst.date;
    opt.textContent = inst.date + " (" + inst.status + ")";
    dateSelect.appendChild(opt);
  });
  if (defaultDateVal) dateSelect.value = defaultDateVal;
  else if (instances.length === 1) dateSelect.value = instances[0].date;
}

function submitEdit(event) {
  event.preventDefault();
  const btn = document.getElementById("editSubmitBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> บันทึก...';
  const rowNumber = parseInt(document.getElementById("editRowNumber").value, 10);
  const prefix = document.getElementById("editPrefix").value.trim();
  if (!prefix) { showToast("กรุณาระบุคำนำหน้า", "error");
    btn.disabled = false;
    btn.innerHTML = "บันทึก"; return; }
  const formData = {
    courseName: document.getElementById("editCourse").value,
    courseDate: document.getElementById("editDate").value,
    citizenId: document.getElementById("editCitizenId").value,
    phone: document.getElementById("editPhone").value,
    prefix,
    firstName: document.getElementById("editFirstName").value,
    lastName: document.getElementById("editLastName").value,
    position: document.getElementById("editPosition").value,
    organization: document.getElementById("editOrganization").value,
    province: document.getElementById("editProvince").value,
    taxId: document.getElementById("editTaxId").value,
    taxAddress: document.getElementById("editTaxAddress").value,
    otherNotes: document.getElementById("editOtherNotes").value
  };
  callBackend('update', { rowNumber, formData }, function() {
    showToast("แก้ไขสำเร็จ!", "success");
    closeEditModal();
    btn.disabled = false;
    btn.innerHTML = "บันทึก";
    searchRegistration();
  });
}
