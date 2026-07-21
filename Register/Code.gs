// ตั้งค่า Google Sheet ID และ Folder ID สำหรับอัพโหลดสลิป
const SPREADSHEET_ID = "1UUniNMxKr0WO5S4gu2njs7gvx6ap3rAf4izX6YyjmsI";
const DRIVE_FOLDER_ID = "1ykxIERslfNt47Be0fr9WX0pa29U9-CBB";

// ฟังก์ชันสำหรับเปิด Google Sheet
function getSheetByName(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

// ฟังก์ชันสำหรับรวมไฟล์ HTML อื่นๆ (เช่น CSS, JS) เข้ามาในเทมเพลตหลัก
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 1. ให้บริการหน้าเว็บ (doGet)
function doGet(e) {
  // หากมีพารามิเตอร์การเรียก API แบบตรง (CORS support)
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e);
  }
  
  // เสิร์ฟหน้าเว็บหลัก
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setTitle('ระบบลงทะเบียนหลักสูตรอบรม')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 2. รองรับการเรียกแบบ API (CORS) เผื่อใช้รันจากภายนอก
function doPost(e) {
  return handleApiRequest(e);
}

function handleApiRequest(e) {
  let action = '';
  let payload = {};
  
  try {
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      action = data.action;
      payload = data;
    } else {
      action = e.parameter.action;
      payload = e.parameter;
    }
  } catch (err) {
    action = e.parameter.action;
    payload = e.parameter;
  }
  
  let result;
  try {
    if (action === 'getCourses') {
      result = { success: true, data: getCourses() };
    } else if (action === 'register') {
      result = { success: true, data: registerUser(payload.formData) };
    } else if (action === 'search') {
      result = { success: true, data: searchRegistrations(payload.idOrPhone) };
    } else if (action === 'update') {
      result = { success: true, data: updateRegistration(payload.rowNumber, payload.formData) };
    } else if (action === 'uploadSlip') {
      result = { success: true, data: uploadSlip(payload.rowNumber, payload.base64Data, payload.fileName) };
    } else {
      result = { success: false, error: 'ไม่พบ Action ที่ต้องการ' };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
}

// --- ฟังก์ชันติดต่อกับ Google Sheets / Drive (สามารถเรียกผ่าน google.script.run ได้โดยตรง) ---

// ดึงข้อมูลหลักสูตร
function getCourses() {
  const sheet = getSheetByName("ข้อมูลหลักสูตร");
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const courses = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) continue; // ข้ามถ้าชื่อหลักสูตรว่าง
    
    courses.push({
      id: row[0] || i,
      name: row[1],
      date: row[2],
      scheduleLink: row[3] || '',
      invitationLink: row[4] || '',
      projectLink: row[5] || '',
      status: row[6] || 'รอจำนวนผู้สมัครครบจำนวน'
    });
  }
  return courses;
}

// ลงทะเบียนผู้ใช้ใหม่
function registerUser(formData) {
  const sheet = getSheetByName("ลงทะเบียน");
  if (!sheet) throw new Error("ไม่พบชีท 'ลงทะเบียน'");
  
  const timestamp = new Date();
  
  // จัดเตรียมแถวข้อมูลตามลำดับคอลัมน์ในชีท
  const rowData = [
    timestamp,                        // ประทับเวลาลงทะเบียน
    formData.courseName,              // หลักสูตรที่ลงทะเบียน
    formData.courseDate,              // วันที่
    "'" + formData.citizenId,         // รหัสประจำตัวประชาชน (บังคับเป็นข้อความเพื่อกันศูนย์นำหน้าหาย)
    formData.prefix,                  // คำนำหน้าชื่อ
    formData.firstName,               // ชื่อ (ภาษาไทย)
    formData.lastName,                // นามสกุล (ภาษาไทย)
    formData.position,                // ตำแหน่ง
    formData.organization,            // หน่วยงาน (ชื่อ รพ.,สสอ.,รพ.สต.)
    formData.province,                // จังหวัด
    formData.taxId ? "'" + formData.taxId : '', // เลขผู้เสียภาษีของหน่วยงาน (กันศูนย์นำหน้าหาย)
    formData.taxAddress || '',        // ที่อยู่เสียภาษีหน่วยงาน
    "'" + formData.phone,             // เบอร์โทรศัพท์ (กันศูนย์นำหน้าหาย)
    "รอดำเนินการชำระเงิน",               // สถานะการโอนเงิน (ค่าเริ่มต้น)
    formData.otherNotes || '',        // อื่นๆเพิ่มเติม
    ""                                // สลิปโอนเงิน (ว่างไว้รออัพโหลดภายหลัง)
  ];
  
  sheet.appendRow(rowData);
  return { success: true, message: "ลงทะเบียนเรียบร้อยแล้ว" };
}

// ค้นหาข้อมูลลงทะเบียนด้วย รหัสประชาชน หรือ เบอร์โทร
function searchRegistrations(idOrPhone) {
  const sheet = getSheetByName("ลงทะเบียน");
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const results = [];
  const query = String(idOrPhone).trim().replace(/[-\s]/g, ''); // เอาขีดและเว้นวรรคออกเพื่อเทียบง่ายขึ้น
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // คอลัมน์ 4 (ดัชนี 3) คือ รหัสประจำตัวประชาชน, คอลัมน์ 13 (ดัชนี 12) คือ เบอร์โทรศัพท์
    const citizenIdVal = String(row[3]).trim().replace(/[-\s]/g, '');
    const phoneVal = String(row[12]).trim().replace(/[-\s]/g, '');
    
    if (citizenIdVal === query || phoneVal === query || (query.length >= 4 && (citizenIdVal.includes(query) || phoneVal.includes(query)))) {
      results.push({
        rowNumber: i + 1, // บันทึกเลขแถวจริงใน Sheet (1-based)
        timestamp: row[0],
        courseName: row[1],
        courseDate: row[2],
        citizenId: row[3],
        prefix: row[4],
        firstName: row[5],
        lastName: row[6],
        position: row[7],
        organization: row[8],
        province: row[9],
        taxId: row[10],
        taxAddress: row[11],
        phone: row[12],
        status: row[13] || 'รอดำเนินการชำระเงิน',
        otherNotes: row[14],
        slipUrl: row[15]
      });
    }
  }
  return results;
}

// อัพโหลดไฟล์สลิปและอัพเดทสถานะแถว
function uploadSlip(rowNumber, base64Data, fileName) {
  const sheet = getSheetByName("ลงทะเบียน");
  if (!sheet) throw new Error("ไม่พบชีท 'ลงทะเบียน'");
  
  // แปลง base64 เป็น Blob เพื่อบันทึกลง Google Drive
  const contentType = base64Data.substring(5, base64Data.indexOf(';base64,'));
  const bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf(';base64,') + 8));
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  
  // อัพโหลดไฟล์เข้าโฟลเดอร์ที่กำหนด
  let folder;
  try {
    folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch(e) {
    // ถ้าสิทธิ์การเข้าถึงโฟลเดอร์มีปัญหา หรือต้องการบันทึกแบบ root
    folder = DriveApp.getRootFolder();
  }
  
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // ให้ทุกคนที่มีลิ้งก์สามารถอ่านสลิปได้
  
  const fileUrl = file.getUrl();
  
  // อัพเดทข้อมูลลงในชีท (แถวที่ระบุ)
  // คอลัมน์ 14 (ดัชนี 14 ในแถวฐาน 1 หรือคอลัมน์ N) คือ สถานะการโอนเงิน
  // คอลัมน์ 16 (ดัชนี 16 ในแถวฐาน 1 หรือคอลัมน์ P) คือ สลิปโอนเงิน
  sheet.getRange(rowNumber, 14).setValue("แจ้งชำระเงินแล้ว (รอตรวจสอบ)");
  sheet.getRange(rowNumber, 16).setValue(fileUrl);
  
  return {
    success: true,
    fileUrl: fileUrl,
    status: "แจ้งชำระเงินแล้ว (รอตรวจสอบ)"
  };
}

// อัพเดทข้อมูลลงทะเบียน
function updateRegistration(rowNumber, formData) {
  const sheet = getSheetByName("ลงทะเบียน");
  if (!sheet) throw new Error("ไม่พบชีท 'ลงทะเบียน'");
  
  const maxRows = sheet.getLastRow();
  if (rowNumber < 2 || rowNumber > maxRows) {
    throw new Error("หมายเลขแถวไม่ถูกต้อง");
  }

  // อัพเดทข้อมูลในแต่ละคอลัมน์ของชีท ลงทะเบียน
  sheet.getRange(rowNumber, 2).setValue(formData.courseName);
  sheet.getRange(rowNumber, 3).setValue(formData.courseDate);
  sheet.getRange(rowNumber, 4).setValue("'" + formData.citizenId);
  sheet.getRange(rowNumber, 5).setValue(formData.prefix);
  sheet.getRange(rowNumber, 6).setValue(formData.firstName);
  sheet.getRange(rowNumber, 7).setValue(formData.lastName);
  sheet.getRange(rowNumber, 8).setValue(formData.position);
  sheet.getRange(rowNumber, 9).setValue(formData.organization);
  sheet.getRange(rowNumber, 10).setValue(formData.province);
  sheet.getRange(rowNumber, 11).setValue(formData.taxId ? "'" + formData.taxId : '');
  sheet.getRange(rowNumber, 12).setValue(formData.taxAddress || '');
  sheet.getRange(rowNumber, 13).setValue("'" + formData.phone);
  sheet.getRange(rowNumber, 15).setValue(formData.otherNotes || '');
  
  return { success: true, message: "แก้ไขข้อมูลสำเร็จ" };
}
