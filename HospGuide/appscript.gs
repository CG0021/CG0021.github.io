function doGet(e) {
  const sheetParam = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : "อัตรากระทรวง2568";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetParam);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "ไม่พบชีทที่ชื่อ " + sheetParam }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const results = [];

  if (sheetParam === "PHDB_NHSO") {
    const rawHeaders = data[0];
    const cleanHeaders = rawHeaders.map(h => h.toString().trim().replace(/\r?\n|\r/g, " "));
    
    let currentGroup = ""; // เลขหมวดหลัก (1, 2, 3...)
    let currentL1Title = "อื่นๆ"; // ข้อความหัวข้อหมวด (เช่น หมวดที่ 1...)
    let currentL2Title = ""; // ข้อความแผนก (เช่น 2.1...)
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const groupVal = row[0] ? row[0].toString().trim() : "";
      const seqVal = row[1] ? row[1].toString().trim() : "";
      const itemName = row[3] ? row[3].toString().trim() : "";
      
      const isHeader = seqVal === "" && groupVal !== "";
      const isItem = seqVal !== "" && !isNaN(parseFloat(seqVal));
      
      if (isHeader) {
        const parts = groupVal.split('.');
        if (parts.length === 1) {
          currentGroup = groupVal; 
          currentL1Title = itemName || groupVal;
          currentL2Title = "";
        } else if (parts.length >= 2) {
          currentL2Title = itemName || groupVal;
        }
      } else if (isItem) {
        const item = { type: "item" };
        cleanHeaders.forEach((header, index) => {
          item[header] = row[index];
        });
        
        // เติมข้อมูลพ่วงจากหัวข้อเพื่อใช้จัดกลุ่มใน Frontend
        if (!item["หมวด"] || item["หมวด"] == "0" || item["หมวด"] == "") {
          item["หมวด"] = currentGroup;
        }
        item["category_group"] = currentL1Title;
        
        results.push(item);
      }
    }
  } else {
    // โครงสร้างเดิมสำหรับ อัตรากระทรวง2568
    let currentMain = "";
    let currentSub = "";
    let currentDeep = "";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const colA = row[0] ? row[0].toString().trim() : "";
      const seqValue = row[1] ? row[1].toString().trim() : "";
      const code = row[2] ? row[2].toString().trim() : "";
      const itemName = row[3] ? row[3].toString().trim() : "";
      
      if (colA === "" && seqValue === "" && code === "" && itemName === "") continue;

      const seqNum = parseFloat(seqValue);
      const isItem = seqValue !== "" && !isNaN(seqNum);

      if (isItem) {
        results.push({
          type: "item",
          mainCategory: currentMain,
          subCategory: currentSub,
          deepCategory: currentDeep,
          seq: seqValue,
          code: code,
          item: itemName,
          unit: row[4] ? row[4].toString().trim() : "",
          priceThai: row[5],
          priceForeign: row[6]
        });
      } else {
        if (colA !== "") {
          const cleanColA = colA.split(' ')[0]; 
          const parts = cleanColA.split('.');
          
          if (parts.length === 1) {
            currentMain = itemName || colA;
            currentSub = "";
            currentDeep = "";
            results.push({ type: "header", level: 1, title: currentMain, id: `h1-${i}` });
          } else if (parts.length === 2) {
            currentSub = itemName || colA;
            currentDeep = "";
            results.push({ type: "header", level: 2, title: currentSub, id: `h2-${i}` });
          } else if (parts.length === 3) {
            currentDeep = itemName || colA;
            results.push({ type: "header", level: 3, title: currentDeep, id: `h3-${i}` });
          } else {
            currentDeep = itemName || colA;
            results.push({ type: "header", level: 3, title: currentDeep, id: `h3-${i}` });
          }
        } else if (itemName !== "") {
          results.push({ type: "header", level: 3, title: itemName, id: `h3-${i}` });
          currentDeep = itemName;
        }
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}

