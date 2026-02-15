const medicalItems = [
    {
        id: 1,
        name: "ค่าห้องพักผู้ป่วยรวม (Standard Room)",
        category: "room",
        categoryTh: "ค่าห้องและอาหาร",
        ministryRate: 600,
        ceilingPrice: 1000,
        description: "บริการเตียงพักสำหรับผู้ป่วยสามัญ รวมค่าอาหาร 3 มื้อ และการบริการทั่วไป",
        notes: "เบิกได้ตามสิทธิสวัสดิการข้าราชการ/บัตรทอง",
        canReimburse: "เบิกได้เต็มจำนวนตามสิทธิ"
    },
    {
        id: 2,
        name: "ค่าห้องพักผู้ป่วยพิเศษ (VIP Room)",
        category: "room",
        categoryTh: "ค่าห้องและอาหาร",
        ministryRate: 1500,
        ceilingPrice: 3500,
        description: "ห้องพักเดี่ยวพิเศษ พร้อมสิ่งอำนวยความสะดวก เครื่องปรับอากาศ ทีวี ตู้เย็น",
        notes: "ส่วนเกินจาก 1,500 บาท ผู้ป่วยต้องชำระเอง",
        canReimburse: "เบิกได้สูงสุด 1,500 บาท/วัน"
    },
    {
        id: 3,
        name: "ค่าตรวจทางห้องปฏิบัติการ (CBC)",
        category: "lab",
        categoryTh: "ค่าตรวจวินิจฉัย",
        ministryRate: 90,
        ceilingPrice: 150,
        description: "การตรวจความสมบูรณ์ของเม็ดเลือด (Complete Blood Count)",
        notes: "ครอบคลุมการตรวจคัดกรองพื้นฐาน",
        canReimburse: "เบิกได้ตามอัตรากรมบัญชีกลาง"
    },
    {
        id: 4,
        name: "ค่าตรวจน้ำตาลในเลือด (FBS)",
        category: "lab",
        categoryTh: "ค่าตรวจวินิจฉัย",
        ministryRate: 40,
        ceilingPrice: 80,
        description: "การตรวจหาระดับน้ำตาลในเลือดหลังงดอาหาร (Fasting Blood Sugar)",
        notes: "ใช้สำหรับวินิจฉัยและติดตามโรคเบาหวาน",
        canReimburse: "เบิกได้ตามอัตรากรมบัญชีกลาง"
    },
    {
        id: 5,
        name: "ค่าบริการพยาบาลทั่วไป (ต่อวัน)",
        category: "service",
        categoryTh: "ค่าบริการทั่วไป",
        ministryRate: 300,
        ceilingPrice: 500,
        description: "ค่าบริการการพยาบาลพื้นฐานและการดูแลผู้ป่วยใน",
        notes: "รวมค่าอุปกรณ์สิ้นเปลืองพื้นฐานบางรายการ",
        canReimburse: "เบิกได้ตามจริงไม่เกินเพดาน"
    },
    {
        id: 6,
        name: "X-ray ทรวงอก (Chest X-ray)",
        category: "lab",
        categoryTh: "ค่าตรวจวินิจฉัย",
        ministryRate: 170,
        ceilingPrice: 250,
        description: "การถ่ายภาพรังสีทรวงอกเพื่อดูปอดและหัวใจ",
        notes: "รวมค่าอ่านผลโดยรังสีแพทย์",
        canReimburse: "เบิกได้ตามสิทธิ"
    },
    {
        id: 7,
        name: "ค่าตรวจหัวใจด้วยคลื่นไฟฟ้า (EKG)",
        category: "lab",
        categoryTh: "ค่าตรวจวินิจฉัย",
        ministryRate: 200,
        ceilingPrice: 400,
        description: "การบันทึกคลื่นไฟฟ้าหัวใจ (Electrocardiogram)",
        notes: "เพื่อประเมินจังหวะและการทำงานของหัวใจ",
        canReimburse: "เบิกได้ 200 บาท"
    },
    {
        id: 8,
        name: "พาราเซตามอล (500mg)",
        category: "medicine",
        categoryTh: "ค่ายาและเวชภัณฑ์",
        ministryRate: 1,
        ceilingPrice: 2,
        description: "ยาลดไข้ บรรเทาอาการปวด",
        notes: "ยาในบัญชียาหลักแห่งชาติ",
        canReimburse: "เบิกได้เต็มจำนวน"
    },
    {
        id: 9,
        name: "MRI สมอง (MRI Brain)",
        category: "lab",
        categoryTh: "ค่าตรวจวินิจฉัย",
        ministryRate: 8000,
        ceilingPrice: 12000,
        description: "การตรวจเอกซเรย์คลื่นแม่เหล็กไฟฟ้าบริเวณสมอง",
        notes: "ต้องมีการส่งตัวหรือความเห็นจากแพทย์เฉพาะทาง",
        canReimburse: "เบิกได้ตามเงื่อนไขกรมบัญชีกลาง"
    },
    {
        id: 10,
        name: "ค่าเครื่องตรวจวัดสัญญาณชีพ (Monitor)",
        category: "service",
        categoryTh: "ค่าบริการทั่วไป",
        ministryRate: 500,
        ceilingPrice: 1000,
        description: "ค่าบริการอุปกรณ์ติดตามสัญญาณชีพต่อเนื่อง",
        notes: "เบิกได้กรณีผู้ป่วยวิกฤตหรือกึ่งวิกฤต",
        canReimburse: "เบิกได้ตามจริงไม่เกินเพดาน"
    }
];
