const SPREADSHEET_ID = "1WOv-Rd6FpEVu9IpUSplgM80mR8RXqJyxvGfrwasucUc";
const SHEET_NAME = "Login";

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = db.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const headers = data[0];
    const usernameIdx = headers.indexOf("username");
    const passwordIdx = headers.indexOf("password");
    const nameIdx = headers.indexOf("name");
    const glLimitIdx = headers.indexOf("GlLimit");
    const glRemainIdx = headers.indexOf("GlRemain");
    const planLimitIdx = headers.indexOf("PlanLimit");
    const planRemainIdx = headers.indexOf("PlanRemain");

    if (action === "login") {
      const user = requestData.username;
      const pass = requestData.password;
      const dateTimeIdx = headers.indexOf("date/time");

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][usernameIdx]).trim() === user) {
          if (String(data[i][passwordIdx]).trim() === pass) {
            // Record login time to Google Sheet
            if (dateTimeIdx !== -1) {
              const now = new Date();
              const formattedDate = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
              const currentVal = String(data[i][dateTimeIdx]).trim();
              const newVal = currentVal ? currentVal + ",\n" + formattedDate : formattedDate;
              sheet.getRange(i + 1, dateTimeIdx + 1).setValue(newVal);
            }

            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              username: user,
              name: nameIdx !== -1 ? data[i][nameIdx] : "",
              glRemain: glRemainIdx !== -1 ? data[i][glRemainIdx] : 0,
              glLimit: glLimitIdx !== -1 ? data[i][glLimitIdx] : 0,
              planRemain: planRemainIdx !== -1 ? data[i][planRemainIdx] : 0,
              planLimit: planLimitIdx !== -1 ? data[i][planLimitIdx] : 0
            })).setMimeType(ContentService.MimeType.JSON);
          } else {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "รหัสผ่านไม่ถูกต้อง" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบบัญชีผู้ใช้งาน" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deduct") {
      const user = requestData.username;
      const system = requestData.system || "gl";
      const dateTimeIdx = headers.indexOf("date/time");
      const remainIdx = (system === "plan") ? planRemainIdx : glRemainIdx;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][usernameIdx]).trim() === user) {
          const currentRemain = Number(data[i][remainIdx]);
          if (currentRemain <= 0) {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "โควตาการใช้งานของคุณหมดแล้ว" })).setMimeType(ContentService.MimeType.JSON);
          }
          sheet.getRange(i + 1, remainIdx + 1).setValue(currentRemain - 1);
          
          if (dateTimeIdx !== -1) {
            const now = new Date();
            const formattedDate = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
            const currentVal = String(data[i][dateTimeIdx]).trim();
            const newVal = currentVal ? currentVal + ",\n" + formattedDate : formattedDate;
            sheet.getRange(i + 1, dateTimeIdx + 1).setValue(newVal);
          }

          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            remain: currentRemain - 1
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบผู้ใช้ในการหักโควตา" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "changePassword") {
      const user = requestData.username;
      const oldPass = requestData.oldPassword;
      const newPass = requestData.newPassword;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][usernameIdx]).trim() === user) {
          if (String(data[i][passwordIdx]).trim() === oldPass) {
            sheet.getRange(i + 1, passwordIdx + 1).setValue(newPass);
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" })).setMimeType(ContentService.MimeType.JSON);
          } else {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "รหัสผ่านเดิมไม่ถูกต้อง" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบผู้ใช้งาน" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบ Action ที่ต้องการ" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Error: " + err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
