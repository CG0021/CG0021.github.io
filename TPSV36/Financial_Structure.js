const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNeAuC31EXI1eslVH7Bns3j6AFMZaRgNzUXihdshjoJDXl291oteXHtqvxufrxmOuw5w/exec';
let hospitalList = [];
let filteredHospitals = [];
let latestYearAvailable = null;
let currentHospitalCode = null;
let isFullHistoryLoaded = false;
let isLoadingHistory = false;
let rawHospitalData = null;
let headersMap = {};
let headers = [];
let sourceHeaders = [];
let viewMode = 'compare';
let comparisonList = [];
let comparisonYear = new Date().getFullYear() + 543;
let sortState = { columnIndex: -1, ascending: true };

const FIXED_HEADERS = [
    "รหัส+ปี+ไตรมาส", "รหัสโรงพยาบาล", "ปี", "ไตรมาส", "เขต", "จังหวัด", "รหัส", "หน่วยบริการ", "ประเภท", "ระดับบริการ", "กลุ่ม", "Risk Scoring", "เงินทุนสำรองสุทธิ (NWC)", "เงินบำรุงหลังหักหนี้", "รายได้ (ไม่รวมงบลงทุน) หัก ค่าใช้จ่าย (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย) EBITDA", "รายได้สูง (ต่ำ) กว่าค่าใช้จ่ายสุทธิ (NI)", "ผลคะแนนจาก 15 คะแนน", "ระดับการประเมิน",
    "1.ตัวชี้วัดกระบวนการ (Process Indicators)", "1.1 การบริหารแผนทางการเงินเปรียบเทียบผลการดำเนินงานผลต่าง",
    "S_1.1.1_รวมรายได้_แผนประมาณการ", "S_1.1.1_รวมรายได้_ผลการดำเนินงาน", "S_1.1.1_รวมรายได้_ผลต่าง", "S_1.1.1_รวมรายได้_ร้อยละ", "1.1.1 มิติรายได้",
    "S_1.1.2_ค่าใช้จ่ายรวม_แผนประมาณการ", "S_1.1.2_ค่าใช้จ่ายรวม_ผลการดำเนินงาน", "S_1.1.2_ค่าใช้จ่ายรวม_ผลต่าง", "S_1.1.2_ค่าใช้จ่ายรวม_ร้อยละ", "1.1.2 มิติค่าใช้จ่าย",
    "1.2 การบริหารสินทรัพย์หมุนเวียนและหนี้สินหมุนเวียน",
    "S_1.2.1_ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา", "1.2.1 ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา",
    "S_1.2.2_ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC", "1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC",
    "S_1.2.3_ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ", "1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ",
    "S_1.2.4_การบริหารสินคงคลัง (Inventory Management)", "1.2.4 การบริหารสินคงคลัง (Inventory Management)",
    "1.3 การบริหารจัดการ", "1.3.1 การบริหารต้นทุนและค่าใช้จ่าย",
    "S_1.3.1.1_ต้นทุนบริการผู้ป่วยนอก (บาท)", "S_1.3.1.1_จำนวนครั้งผู้ป่วยนอก (ครั้ง)", "S_1.3.1.1_ต้นทุนบริการผู้ป่วยนอกต่อครั้ง", "S_1.3.1.1_Mean+1SD", "1.3.1.1 Unit Cost for OP",
    "S_1.3.1.2_ต้นทุนบริการผู้ป่วยใน (บาท)", "S_1.3.1.2_Sum AdjRW", "S_1.3.1.2_ต้นทุนบริการผู้ป่วยในต่อ AdjRW", "S_1.3.1.2_Mean+1SD", "1.3.1.2 Unit Cost for IP",
    "S_1.3.1.3_LC", "S_1.3.1.3_Avg#LC", "S_1.3.1.3_ผลต่างLC", "1.3.1.3 LC ค่าแรงบุคลากร",
    "S_1.3.1.4_ค่ายา", "S_1.3.1.4_Avg#ค่ายา", "S_1.3.1.4_ผลต่างค่ายา", "1.3.1.4 MC ค่ายา",
    "S_1.3.1.5_ค่าวัสดุวิทยาศาสตร์และการแพทย์", "S_1.3.1.5_Avg#ค่าวัสดุวิทยาศาสตร์และการแพทย์", "S_1.3.1.5_ผลต่างค่าวัสดุวิทยาศาสตร์และการแพทย์", "1.3.1.5 MC ค่าวัสดุวิทยาศาสตร์และการแพทย์",
    "S_1.3.1.6_ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", "S_1.3.1.6_Avg#ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", "S_1.3.1.6_ผลต่างค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", "1.3.1.6 MC ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์",
    "1.3.2 คะแนนตรวจสอบงบทดลองเบื้องต้น",
    "S_1.3.2_คะแนน เดือน1", "S_1.3.2_คะแนน เดือน2", "S_1.3.2_คะแนน เดือน3", "S_1.3.2_ผลรวมแม่ข่าย",
    "1.3.3 ผลผลิต (Productivity) เป็นที่ยอมรับ",
    "S_1.3.3.1_จำนวนเตียง", "S_1.3.3.1_CMI", "S_1.3.3.1_อัตราครองเตียง", "1.3.3.1 อัตราครองเตียงผู้ป่วยใน ≥ 80 %",
    "S_1.3.3.2_Sum AdjRW", "S_1.3.3.2_ค่ากลางกลุ่ม AdjRW", "S_1.3.3.2_ผลเปรียบเทียบค่ากลาง AdjRW", "S_1.3.3.2_ผล1 AdjRW", "S_1.3.3.2_เปรียบเทียบช่วงเวลา Sum AdjRw ไตรมาสก่อน", "S_1.3.3.2_เปรียบเทียบช่วงเวลาผลต่าง", "S_1.3.3.2_เปรียบเทียบช่วงเวลา% เกิน 5", "S_1.3.3.2_ผล2", "S_1.3.3.2_คะแนน", "1.3.3.2 SumAdjRW เกินค่ากลางกลุ่มรพ. หรือเพิ่มขึ้น 5 %",
    "2. ตัวชี้วัดผลลัพท์การดำเนินงาน", "2.1 ความสามารถในการทำกำไร",
    "S_2.1.1_Operating Margin %", "S_2.1.1_ค่ากลางOperating Margin %", "2.1.1 ประสิทธิภาพในการดำเนินงาน",
    "S_2.1.2_Return on Asset %", "S_2.1.2_ค่ากลางReturn on Asset %", "2.1.2 อัตราผลตอบแทนจากสินทรัพย์",
    "S_2.1.3_EBITDA", "2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม",
    "2.2 การวัดสภาพคล่องทางการเงิน",
    "S_2.2.1_ทุนสำรองสุทธิ(Networking Capital)", "2.2.1 ทุนสำรองสุทธิ",
    "S_2.2.2_CR", "S_2.2.2_QR", "S_2.2.2_Cash R", "2.2.2 Cash Ratio",
    "คะแนนรวม", "Grade"
];

const MGMT_HEADERS = [
    "เขต", "จังหวัด", "รหัสโรงพยาบาล", "ชื่อหน่วยงาน",
    "A1291,รวม สินทรัพย์",
    "A119,รวม สินทรัพย์หมุนเวียน",
    "A1111S,รวมเงินสดและรายการเทียบเท่าเงินสด",
    "A1111040.20,รวมเงินสดและรายการเทียบเท่าเงินสดไม่รวมเงินบริจาค",
    "A1111010,เงินสด", "A1111010.1,เงินทดรองราชการ", "A1111010.2,บัญชีพัก (หน่วยเบิกจ่าย)", "A1111020,เงินฝากคลัง", "A1111030,เงินฝากธนาคารพาณิชย์เพื่อรับจ่ายเงินกับคลัง", "A1111040,เงินฝากสถาบันการเงิน - นอกงบประมาณ", "A1111040.1,เงินฝากคลัง/เงินฝากสถาบันการเงิน - นอกงบประมาณมีวัตถุประสงค์", "A1111040.2,เงินฝากสถาบันการเงิน - นอกงบประมาณรอจัดสรร", "A1111040.3,เงินฝากคลัง/เงินฝากสถาบันการเงิน - นอกงบประมาณมีวัตถุประสงค์ (เงินบริจาค)",
    "A11211S,รวมลูกหนี้ค่ารักษาพยาบาล",
    "A1121010,ลูกหนี้ค่ารักษาพยาบาลUC -สุทธิ", "A1121020,ลูกหนี้ค่ารักษาพยาบาลตามจ่ายUC -สุทธิ", "A1121021,ลูกหนี้ค่ารักษา OP Refer", "A1121030,ลูกหนี้ค่ารักษาพยาบาล UC กองทุนบริการเฉพาะสุทธิ", "A1121040,ลูกหนี้ค่ารักษาพยาบาลค่ารักษา UC-P&P Expressed demand -สุทธิ", "A1121050,ลูกหนี้ค่ารักษาพยาบาลเบิกจากกรมบัญชีกลาง OP -สุทธิ", "A1121060,ลูกหนี้ค่ารักษาพยาบาลเบิกจากกรมบัญชีกลาง IP-สุทธิ", "A1121060.1,ลูกหนี้ค่ารักษาพยาบาลเบิกจ่ายตรง อปท-สุทธิ", "A1121070,ลูกหนี้ค่ารักษาพยาบาลเบิกต้นสังกัด -สุทธิ", "A1121080,ลูกหนี้ค่ารักษาพยาบาลประกันสังคม เครือข่าย -สุทธิ", "A1121090,ลูกหนี้ค่ารักษาพยาบาลประกันสังคม นอกเครือข่าย-สุทธิ", "A1121100,ลูกหนี้ค่ารักษาพยาบาลพรบ.ประกันภัยบุคคลที่ 3 -สุทธิ", "A1121110,ลูกหนี้ค่ารักษาพยาบาลแรงงานต่างด้าว -สุทธิ", "A1121120,ลูกหนี้ค่ารักษาพยาบาลแรงงานต่างด้าวตามจ่าย -สุทธิ", "A1121130,ลูกหนี้ค่ารักษาพยาบาลบุคคลที่มีปัญหาสถานะและสิทธิ - สุทธิ", "A1121140,ลูกหนี้ค่ารักษาพยาบาลอื่นๆ -สุทธิ",
    "A1122S,รวมลูกหนี้อื่น",
    "A1122010,ลูกหนี้บริการอื่นๆ", "A1122020,ลูกหนี้เงินยืม", "A1122030,ลูกหนี้อื่นๆ",
    "A1131S,รวมยาและวัสดุคงเหลือ",
    "A1131000,สินค้าคงเหลือ", "A1131010,ยาคงเหลือ", "A1131020,เวชภัณฑ์มิใช่ยาคงเหลือ", "A1131030,เวชภัณฑ์มิใช่ยาคงเหลือ -วัสดุวิทยาศาสตร์การแพทย์คงเหลือ", "A1131040,วัสดุคงเหลือ",
    "A118,รวมสินทรัพย์หมุนเวียนอื่นๆ",
    "A1141010,รายได้ค้างรับ", "A1142060,ค่าใช้จ่ายจ่ายล่วงหน้าอื่นๆ", "A1143020,สินทรัพย์หมุนเวียนอื่นๆ",
    "A129,รวม สินทรัพย์ไม่หมุนเวียน",
    "A1211001,เงินฝากสถาบันการเงิน - งบลงทุน", "A1211010,ที่ดิน อาคารและสิ่งปลูกสร้าง - สุทธิ", "A1211020,ครุภัณฑ์ - สุทธิ", "A1212010,สินทรัพย์ไม่มีตัวตน - สุทธิ", "A1212020,สินทรัพย์ไม่หมุนเวียนอื่น - สุทธิ",
    "A390,รวม หนี้สินและทุน",
    "A291,รวม หนี้สิน",
    "A219,รวม หนี้สินหมุนเวียน",
    "A2111S,รวมเจ้าหนี้การค้า",
    "A2111_M,เจ้าหนี้การค้า (ยาและเวชภัณฑ์)",
    "A2111010,เจ้าหนี้การค้าค่ายา", "A2111020,เจ้าหนี้การค้าค่าเวชภัณฑ์มิใช่ยา", "A2111030,เจ้าหนี้การค้าค่าเวชภัณฑ์มิใช่ยา-วัสดุวิทยาศาสตร์การแพทย์", "A2111040,เจ้าหนี้การค้าค่าวัสดุอื่นๆ",
    "A2111_O,เจ้าหนี้อื่น",
    "A2111050,เจ้าหนี้การค้าอื่น", "A2111060,เจ้าหนี้การค้าค่าครุภัณฑ์", "A2111070,เจ้าหนี้การค้าค่าอาคารและสิ่งปลูกสร้าง", "A2111080,เจ้าหนี้- งบลงทุน UC", "A2111090,เจ้าหนี้- เงินบริจาค",
    "A2112S,รวมเจ้าหนี้ค่ารักษาพยาบาล/เจ้าหนี้ค่าบริการ",
    "A2112010,เจ้าหนี้ค่ารักษาพยาบาลตามจ่าย UC สังกัด สธ.", "A2112020,เจ้าหนี้ค่ารักษาพยาบาลตามจ่าย UC นอกสังกัด สธ.", "A2112030,เจ้าหนี้ค่ารักษาตามจ่าย Non-UC", "A2112050,เจ้าหนี้ค่าบริการจากหน่วยงานภายนอก",
    "A218,รวมหนี้สินหมุนเวียนอื่น",
    "A2121030,เงินกองทุน ประกันสังคม", "A2121040.1,เงินกองทุน แรงงานต่างด้าว", "A2122010,เงินประกัน", "A2122020,เงินรับฝากทั่วไป", "A2122021,เงินรับฝากกองทุน UC", "A2122022,เงินรับฝากกองทุน UC- สนับสนุนเครือข่าย", "A2122023,เงินรับฝากกองทุน UC-งบลงทุน", "A2122024,เงินรับฝากกองทุนแรงงานต่างด้าว", "A2123010,รายได้รับล่วงหน้า", "A2131010,ค่าใช้จ่ายค้างจ่าย", "A2131011,รายได้รอการรับรู้", "A2132010,หนี้สินหมุนเวียนอื่น",
    "A29,รวม หนี้สินไม่หมุนเวียน",
    "A2211020,เงินประกันระยะยาว", "A2212020,รายได้รอการรับรู้", "A2212030,หนี้สินระยะยาวอื่น",
    "A32S,รวมทุน",
    "A3111010,ทุนตั้งต้น", "A3111020,ยอดสะสมยกมา", "A3211010,รายได้สูง (ต่ำ) กว่าค่าใช้จ่ายงวดปัจจุบัน",
    // "M2,งบแสดงผลการดำเนินงาน(บริหาร)",
    "A49,รวมรายได้ค่ารักษาพยาบาล/รายได้งบประมาณส่วนบุคลากร/รายได้กองทุน",
    "A419S,รวมรายได้ค่ารักษาพยาบาล",
    "A410S,รวมรายได้ UC",
    "A4101040,รายได้ค่ารักษาพยาบาล UC-OP ใน CUP สุทธิ", "A4101043,รายได้ค่ารักษาด้านการสร้างเสริมสุขภาพและป้องกันโรค P&P สุทธิ", "A4101080,รายได้ค่ารักษาพยาบาล UC-IP เหมาจ่ายรายหัว สุทธิ", "A4102040,รายได้จากการเรียกเก็บ UC สุทธิ", "A4102050.30,รายได้ค่ารักษา UC - บริการเฉพาะ (CR)- สุทธิ", "A4103040,รายได้จากกองทุน UC - พื้นที่เฉพาะ", "A4103050,รายได้กองทุน UC P&P อื่น", "A4103060,รายได้จากกองทุนUC เฉพาะโรคอื่น", "A4103070,รายได้กองทุน UC- ตามผลงาน", "A4103080,รายได้กองทุน UC- อื่นๆ", "A4103100,รายได้กองทุน UC-CF", "A4103101,รายได้จากการยกหนี้กรณีส่งต่อผู้ป่วยระหว่าง รพ.",
    "A4121010,รายได้ค่ารักษาเบิกต้นสังกัด",
    "A4131050.0,รวมรายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง",
    "A4131010,รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง OP",
    "A4131050,รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง IP สุทธิ",
    "A4131020,รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง IP", "A4131030,หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่ายเบิกจ่ายตรงกรมบัญชีกลาง", "A4131040,บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่ายเบิกจ่ายตรงกรมบัญชีกลาง",
    "A413105S,รวมรายได้ค่ารักษาเบิกจ่ายตรง อปท.",
    "A4131050.1,รายได้ค่ารักษาเบิกจ่ายตรง อปท. OP",
    "A4131050.5,รายได้ค่ารักษาเบิกจ่ายตรง อปท. IP สุทธิ",
    "A4131050.2,รายได้ค่ารักษาเบิกจ่ายตรง อปท. IP", "A4131050.3,หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่ายตรง อปท.", "A4131050.4,บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่ายตรง อปท.",
    "A414301S,รายได้ค่ารักษาประกันสังคม",
    "A4141040,รายได้ค่ารักษาประกันสังคมเครือข่าย สุทธิ",
    "A4141010,รายได้ค่ารักษาประกันสังคมเครือข่าย", "A4141020,หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายรายหัวกองทุนประกันสังคม", "A4141030,บวกส่วนต่างค่ารักษาที่ต่ำกว่าเหมาจ่ายรายหัวกองทุนประกันสังคม",
    "A4142010,รายได้ค่ารักษาประกันสังคมนอกเครือข่าย", "A4143010,รายได้กองทุนประกันสังคม", "A4143010.1,รายได้ค่าตอบแทนและพัฒนากิจการ",
    "A4153S,รายได้ค่ารักษาแรงงานต่างด้าว",
    "A4151040,รายได้ค่ารักษาจากแรงงานต่างด้าว สุทธิ",
    "A4151010,รายได้ค่ารักษาจากแรงงานต่างด้าว", "A4151020,หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายกองทุนต่างด้าว", "A4151030,บวก ส่วนต่างค่ารักษาที่ต่ำกว่าเหมาจ่ายกองทุนต่างด้าว",
    "A4152010,รายได้ค่ารักษาแรงงานต่างด้าวนอก CUP", "A4153010,รายได้กองทุนแรงงานต่างด้าว", "A4153011,รายได้ค่าตรวจสุขภาพแรงงานต่างด้าว",
    "A4161S,รายได้เงินอุดหนุนบุคคลที่มีปัญหาสถานะและสิทธิ",
    "A4161040,รายได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธินอก CUP สุทธิ",
    "A4161010,รายได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธินอก CUP", "A4161020,หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ", "A4161030,บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ",
    "A4161050,รายได้ค่ารักษา-บุคคลที่มีปัญหาสถานะและสิทธิ OP ใน CUP", "A4161060,รายได้เงินอุดหนุนเหมาจ่ายรายหัวสำหรับบุคคลที่มีปัญหาสถานะและสิทธิ",
    "A4171010,รายได้ค่ารักษาจาก พรบ.ประกันภัยบุคคลที่ 3", "A4191010,รายได้ค่ารักษาพยาบาลอื่นๆ", "A4191011,รายได้จากระบบปฏิบัติการฉุกเฉิน (EMS)", "A4192010,รายได้ค่าบริการอื่นๆ",
    "A4201010,รายได้งบประมาณส่วนบุคลากร",

    "A9010S,รวมรายได้อื่นๆ",
    "A7001010,รายได้จากการช่วยเหลือเพื่อการดำเนินงานจากหน่วยงานอื่นๆ", "A7001020,รายได้จากงบประมาณแผ่นดิน-งบลงทุน", "A7001030,รายได้งบลงทุนUC", "A7001040,รายได้จากงบประมาณแผ่นดิน-อื่นๆ", "A7001050,รายได้จากการรับบริจาค", "A7001060,รายได้ดอกเบี้ย", "A7001070,รับโอนจากแม่ข่าย(ไม่ใช่เงิน UC)", "A7001080,รายได้ค่าบริหารจัดการโครงการ UC", "A7001090,รายได้ค่าบริหารจัดการประกันสังคม", "A7001100,รายได้ค่าบริหารจัดการแรงงานต่างด้าว", "A7001120,รายได้อื่นๆ เช่น รายได้ค่าธรรมเนียม ฯฯ", "A7001121,รายได้อื่น-รายได้ระหว่างหน่วยงาน	A8001010,รายได้จากงบประมาณแผ่นดิน-เงินอุดหนุน", "A9001010,รายได้ระหว่างหน่วยงาน (หน่วยเบิกจ่าย)",

    "A5009D,รวมต้นทุนค่ารักษาพยาบาล",
    "A5009N,รวมต้นทุนค่ารักษาพยาบาล(ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย)", "A5001010,ต้นทุนยา", "A5001020,ต้นทุนเวชภัณฑ์มิใช่ยา", "A5001030,ต้นทุนเวชภัณฑ์มิใช่ยา-วัสดุวิทยาศาสตร์การแพทย์", "A5001031,ต้นทุนวัสดุอื่น", "A5001040,เงินเดือนและค่าจ้างประจำ(บริการ)", "A5001050,ค่าจ้างชั่วคราว(บริการ)", "A5001050.1,ค่าจ้างพนักงานกระทรวงสาธารณสุข(บริการ)", "A5001050.2,ค่าจ้างเหมาบุคลากร (บริการ)", "A5001060,ค่าตอบแทน(บริการ)", "A500107070,ค่าใช้จ่ายบุคลกรอื่น (สัดส่วน 70)", "A500108070,ค่าใช้สอย (สัดส่วน 70)", "A500109070,ค่าสาธารณูปโภค (สัดส่วน 70)", "A500110070,วัสดุใช้ไป (สัดส่วน 70)", "A5001110,ค่ารักษาตามจ่าย UC", "A5001120,ค่ารักษาตามจ่ายในสังกัด สป", "A5001130,ค่ารักษาตามจ่ายต่างสังกัด สป", "A5001140,ค่ารักษาตามจ่ายแรงงานต่างด้าว", "A5001150,ค่ารักษาตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ", "A5001160,ค่าจ้างตรวจทางห้องปฏิบัติการ", "A5002010,ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง (บริการ)", "A5002020,ค่าเสื่อมราคาครุภัณฑ์(บริการ)", "A5002030,ค่าตัดจำหน่าย (บริการ)",

    "A501D,รายได้สูง (ต่ำ) กว่าต้นทุนค่ารักษาพยาบาลก่อนหักค่าใช้จ่ายดำเนินงาน",
    "A501N,รายได้สูง (ต่ำ) กว่า ต้นทุนค่ารักษาพยาบาลก่อนหักค่าใช้จ่ายดำเนินงาน(ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย)",
    "A519D,รวมค่าใช้จ่ายในการดำเนินงาน",
    "A5101010,เงินเดือนและค่าจ้างประจำ(สนับสนุน)", "A5101020,ค่าจ้างชั่วคราว(สนับสนุน)", "A5101020.1,ค่าจ้างพนักงานกระทรวงสาธารณสุข(สนับสนุน)", "A5101020.2,ค่าจ้างเหมาบุคลากร (สนับสนุน)", "A5101030,ค่าตอบแทน(สนับสนุน)", "A510104030,ค่าใช้จ่ายบุคลกรอื่น (สัดส่วน 30)", "A510105030,ค่าใช้สอย (สัดส่วน 30)", "A510106030,ค่าสาธารณูปโภค (สัดส่วน 30)", "A510107030,วัสดุใช้ไป (สัดส่วน 30)", "A5101090,หนี้สงสัยจะสูญ จากค่ารักษา พรบ.ประกันภัยบุคคลที่ 3", "A5101100,หนี้สงสัยจะสูญ จากค่ารักษาประกันสังคมนอกเครือข่าย", "A5101120,หนี้สงสัยจะสูญ จากการเรียกเก็บ UC OPD", "A5101130,หนี้สงสัยจะสูญ จากค่ารักษาพยาบาลอื่นๆ", "A5101140,หนี้สงสัยจะสูญ จากค่าบริการอื่นๆ", "A5101170,หนี้สูญ จากค่ารักษา พรบ.ประกันภัยบุคคลที่ 3", "A5101190,หนี้สูญ จากค่ารักษาประกันสังคมนอกเครือข่าย", "A5101201,หนี้สูญ ลูกหนี้ค่ารักษา UC IP", "A5101210,หนี้สูญ จากการเรียกเก็บ UC OPD", "A5101240,หนี้สูญ จากค่ารักษาพยาบาลอื่นๆ", "A5101250,หนี้สูญ จากค่าบริการอื่นๆ", "A5101260,ค่าใช้จ่ายระหว่างหน่วยงาน (หน่วยเบิกจ่าย)", "A5101261,ค่าใช้จ่ายอื่น-ค่าใช้จ่ายระหว่างหน่วยงาน", "A5101270,ค่าใช้จ่ายในการดำเนินงานอื่นๆ", "A5102010,ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง (สนับสนุน)", "A5102020,ค่าเสื่อมราคาครุภัณฑ์ (สนับสนุน)", "A5102030,ค่าตัดจำหน่าย (สนับสนุน)",
    "A60SS,รวมค่าใช้จ่ายอื่นๆ",
    "A6001020,ค่าใช้จ่ายโครงการ", "A6001030,ค่าใช้จ่ายโครงการ PP", "A6001130,ค่าใช้จ่ายอื่นเช่น ค่าใช้จ่ายลักษณะอื่น คืนเงินค่ารักษาพยาบาล อุปกรณ์ และอวัยวะเทียมฯลฯ", "A6001140,ค่าจ้าง /ค่าเช่า /ค่าซ่อม บำรุงสิ่งก่อสร้างและครุภัณฑ์ (งบลงทุน UC)",



    "A90S,รายได้/ค่าใช้จ่ายอื่น สุทธิ",
    "A91D,รายได้สูงกว่า (ต่ำกว่า) ค่าใช้จ่ายสุทธิ",
    "A91N,รายได้สูงกว่า (ต่ำกว่า) ค่าใช้จ่ายสุทธิ (ไม่รวมค่าเสือมราคาและค่าตัดจำหน่าย)",
    "EBITDA,รายได้ (ไม่รวมงบลงทุน) หัก ค่าใช้จ่าย (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย)",
    "E400S,รายได้รวม  (ไม่รวมงบลงทุน / รายได้อื่น ระบบบัญชีอัตโนมัติ)",
    "E500S,ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมฯและค่าตัดจำหน่าย / ค่าใช้จ่ายอื่น ระบบบัญชีอัตโนมัติ)"
];

const MGMT_GROUPS = {
    "A1291": ["A119", "A129"],
    //สินทรัพย์หมุนเวียน
    "A119": ["A1111S", "A11211S", "A1122S", "A1131S", "A118"],

    "A1111S": ["A1111010", "A1111010.1", "A1111010.2", "A1111020", "A1111030", "A1111040", "A1111040.1", "A1111040.2", "A1111040.20", "A1111040.3"],
    "A11211S": ["A1121010", "A1121020", "A1121021", "A1121030", "A1121040", "A1121050", "A1121060", "A1121060.1", "A1121070", "A1121080", "A1121090", "A1121100", "A1121110", "A1121120", "A1121130", "A1121140"],
    "A1122S": ["A1122010", "A1122020", "A1122030"],
    "A1131S": ["A1131000", "A1131010", "A1131020", "A1131030", "A1131040"],
    "A118": ["A1141010", "A1142060", "A1143020"],
    //สินทรัพย์ไม่หมุนเวียน
    "A129": ["A1211001", "A1211010", "A1211020", "A1212010", "A1212020"],

    //หนี้สินและทุน

    "A390": ["A291", "A32S"],
    //หนี้สิน
    "A291": ["A219", "A29"],
    //หนี้หมุน
    "A219": ["A2111S", "A2112S", "A218"],
    "A2111S": ["A2111_M", "A2111_O"],
    "A2111_M": ["A2111010", "A2111020", "A2111030", "A2111040"],
    "A2111_O": ["A2111050", "A2111060", "A2111070", "A2111080", "A2111090"],
    "A2112S": ["A2112010", "A2112020", "A2112030", "A2112050"],
    "A218": ["A2121030", "A2121040.1", "A2122010", "A2122020", "A2122021", "A2122022", "A2122023", "A2122024", "A2123010", "A2131010", "A2131011", "A2132010"],
    //หนี้ไม่หมุน
    "A29": ["A2211020", "A2212020", "A2212030"],
    //ทุน   
    "A32S": ["A3111010", "A3111020", "A3211010"],

    //รายได้
    "A49": ["A419S", "A4201010"],

    //รวมรายได้ค่ารักษาพยาบาล
    "A419S": ["A410S", "A4121010", "A4131050.0", "A413105S", "A414301S", "A4153S", "A4161S", "A4171010", "A4191010", "A4191011", "A4192010"],

    //รวมรายได้ UC
    "A410S": ["A4101040", "A4101043", "A4101080", "A4102040", "A4102050.30", "A4103040", "A4103050", "A4103060", "A4103070", "A4103080", "A4103100", "A4103101"],
    //   รายได้ค่ารักษาพยาบาล UC-OP ใน CUP สุทธิ
    "A4101040": ["A4100001", "A4101010", "A4101020", "A4101021"],
    "A4101043": ["A4101040.1", "A4101041", "A4101042", "A4101042.1"],
    "A4101080": ["A4101050", "A4101060", "A4101061", "A4101070"],
    "A4102040": ["A4102010", "A4102020", "A4102030"],
    "A4102050.30": ["A4102041", "A4102050", "A4102050.10", "A4102050.20"],

    //รวมรายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง
    "A4131050.0": ["A4131010", "A4131050"],
    "A4131050": ["A4131020", "A4131030", "A4131040"],

    //รวมรายได้ค่ารักษาเบิกจ่ายตรง อปท.
    "A413105S": ["A4131050.1", "A4131050.5"],
    "A4131050.5": ["A4131050.2", "A4131050.3", "A4131050.4"],

    // รายได้ค่ารักษาประกันสังคม
    "A414301S": ["A4141040", "A4142010", "A4143010", "A4143010.1"],
    "A4141040": ["A4141010", "A4141020", "A4141030"],
    // รายได้ค่ารักษาแรงงานต่างด้าว
    "A4153S": ["A4151040", "A4152010", "A4153010", "A4153011"],
    "A4151040": ["A4151010", "A4151020", "A4151030"],
    // รายได้เงินอุดหนุนบุคคลที่มีปัญหาสถานะและสิทธิ
    "A4161S": ["A4161040", "A4161050", "A4161060"],
    "A4161040": ["A4161010", "A4161020", "A4161030"],
    //รวมต้นทุนค่ารักษาพยาบาล
    "A5009D": ["A5009N", "A5002010", "A5002020", "A5002030", "A501D", "A501N"],
    "A5009N": ["A5001010", "A5001020", "A5001030", "A5001031", "A5001040", "A5001050", "A5001050.1", "A5001050.2", "A5001060", "A500107070", "A500108070", "A500109070", "A500110070", "A5001110", "A5001120", "A5001130", "A5001140", "A5001150", "A5001160"],

    //รวมค่าใช้จ่ายในการดำเนินงาน
    "A519D": ["A519N", "A5102010", "A5102020", "A5102030", "A529D", "A529N"],


    "A519N": ["A5101010", "A5101020", "A5101020.1", "A5101020.2", "A5101030", "A510104030", "A510105030", "A510106030", "A510107030", "A5101090", "A5101100", "A5101120", "A5101130", "A5101140", "A5101170", "A5101190", "A5101201", "A5101210", "A5101240", "A5101250", "A5101260", "A5101261", "A5101270"],

    //รวมค่าใช้จ่ายอื่นๆ
    "A60SS": ["A6001020", "A6001030", "A6001130", "A6001140"],
    //รวมรายได้อื่นๆ
    "A9010S": ["A7001010", "A7001020", "A7001030", "A7001040", "A7001050", "A7001060", "A7001070", "A7001080", "A7001090", "A7001010", "A7001100", "A7001120", "A7001121", "A8001010", "A9001010"],




    "A91D": ["A911S", "A912S", "A91N", "EBITDA", "E400S", "E500S"],
};

function showLoading() { document.getElementById('loading').style.display = 'flex'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }

async function jsonpRequest(action, params = '') {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Date.now() + Math.random().toString(36).substr(2, 5);
        window[callbackName] = (data) => {
            delete window[callbackName];
            document.body.removeChild(script);
            if (data.error) reject(new Error(data.message));
            else resolve(data);
        };
        const script = document.createElement('script');
        script.src = `${APPS_SCRIPT_URL}?action=${action}&${params}&callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Script load error'));
        };
        document.body.appendChild(script);
    });
}

async function initialize() {
    // showLoading();
    document.getElementById('searchSpinner').style.display = 'block';
    try {
        // Now loading from window.hospitalData (hospital_data.js)
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
        comparisonYear = latestYearAvailable; // Set default comparison year
        populateFilters();
        document.getElementById('searchInput').disabled = false;
        applyFilters(); // Apply access restriction immediately
    } catch (error) {
        alert('Connection Error: ' + error.message);
    } finally {
        // hideLoading();
        document.getElementById('searchSpinner').style.display = 'none';
    }
}

function populateFilters() {
    const searchInput = document.getElementById('searchInput');

    // 1. Initialize Region Dropdown (Base Level)
    const regions = [...new Set(hospitalList.map(h => h.r))].filter(Boolean).sort((a, b) => Number(a) - Number(b));
    populateSelect('regionFilter', regions, 'เขต ');

    // 2. Initialize Province (All)
    const provinces = [...new Set(hospitalList.map(h => h.p))].filter(Boolean).sort();
    populateSelect('provinceFilter', provinces);

    // 3. Initialize Group (All)
    const groups = [...new Set(hospitalList.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);

    // 4. Initialize Year Range Filters
    populateYearFilters();

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const searchInputGroup = e.target.closest('.search-input-group');
        const suggestionsDiv = document.getElementById('suggestions');

        // If click is OUTSIDE the search input group, close suggestions
        if (!searchInputGroup) {
            suggestionsDiv.style.display = 'none';
        } else {
            // If click is INSIDE (e.g. on input), keep/show suggestions (handled by onclick/onfocus)
            // We don't need to force it open here, just don't close it.
        }
    });
}

function populateSelect(elementId, items, prefix = '') {
    const select = document.getElementById(elementId);
    if (!select) return;
    // Keep the first option (All)
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

    const currentYear = latestYearAvailable || new Date().getFullYear() + 543;
    const years = [];
    for (let y = currentYear; y >= 2560; y--) {
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

    // Default to 5 years range, ending at current year
    endYearSelect.value = currentYear;
    startYearSelect.value = 2567; // Default start year as requested

}

function handleYearChange() {
    const startYear = parseInt(document.getElementById('startYear').value);
    const endYear = parseInt(document.getElementById('endYear').value);

    if (startYear > endYear) {
        alert('ปีเริ่มต้นไม่สามารถมากกว่าปีสิ้นสุดได้');
        document.getElementById('startYear').value = endYear; // Reset to match end year (prevent jumping to 2564)
        return;
    }

    comparisonYear = endYear; // Update comparisonYear to match the latest year in range

    // Reset chart filter state when global filters change
    if (window.chartFilterState) {
        window.chartFilterState = null;
    }

    // If there are already hospitals in the list, we might want to refresh them
    // or just let the user know they need to re-fetch/it will apply to next selections.
    // For now, let's refresh the current view if any hospitals are loaded.
    if (comparisonList.length > 0) {
        refreshAllHospitals();
    }
}

async function refreshAllHospitals() {
    const codes = comparisonList.map(c => c.code);
    // Clear list but keep codes to re-fetch
    comparisonList = [];
    sourceHeaders = [];
    renderMainContent();

    for (const code of codes) {
        await selectHospital(code, true);
    }
    renderMainContent();
}

function updateRegionDependents() {
    const regionValue = document.getElementById('regionFilter').value;
    const provinceSelect = document.getElementById('provinceFilter');
    const groupSelect = document.getElementById('groupFilter');

    // Reset dependents
    provinceSelect.value = "";
    groupSelect.value = "";

    // Filter hospitals based on selected Region
    let availableHospitals = hospitalList;
    if (regionValue) {
        availableHospitals = hospitalList.filter(h => String(h.r) === regionValue);
    }

    // Update Province Options
    const provinces = [...new Set(availableHospitals.map(h => h.p))].filter(Boolean).sort();
    populateSelect('provinceFilter', provinces);

    // Update Group Options
    const groups = [...new Set(availableHospitals.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);

    applyFilters();
}

function updateProvinceDependents() {
    const regionValue = document.getElementById('regionFilter').value;
    const provinceValue = document.getElementById('provinceFilter').value;
    const groupSelect = document.getElementById('groupFilter');

    // Reset dependent
    groupSelect.value = "";

    // Filter hospitals based on Region AND Province
    let availableHospitals = hospitalList;
    if (regionValue) {
        availableHospitals = availableHospitals.filter(h => String(h.r) === regionValue);
    }
    if (provinceValue) {
        availableHospitals = availableHospitals.filter(h => h.p === provinceValue);
    }

    // Update Group Options
    const groups = [...new Set(availableHospitals.map(h => h.serviceLevelGroup))].filter(Boolean).sort();
    populateSelect('groupFilter', groups);

    applyFilters();
}

function applyFilters() {
    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    // Get dropdown values
    const regionFilter = document.getElementById('regionFilter') ? document.getElementById('regionFilter').value : '';
    const provinceFilter = document.getElementById('provinceFilter') ? document.getElementById('provinceFilter').value : '';
    const groupFilter = document.getElementById('groupFilter') ? document.getElementById('groupFilter').value : '';

    filteredHospitals = (hospitalList || []).filter(h => {
        // Dropdown Filters
        if (regionFilter && String(h.r) !== regionFilter) return false;
        if (provinceFilter && h.p !== provinceFilter) return false;
        if (groupFilter && h.serviceLevelGroup !== groupFilter) return false;

        // Query Filter
        const matchQuery = !query || query.length < 2 ? true : (h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query));
        return matchQuery;
    });
}

function showSuggestions() {
    const suggestionsDiv = document.getElementById('suggestions');
    const query = (document.getElementById('searchInput').value || '').toLowerCase();

    // Show suggestions immediately if there are filtered results
    const suggestionResults = (filteredHospitals || []).filter(h =>
        h.n.toLowerCase().includes(query) || String(h.c).toLowerCase().includes(query)
    );

    if (suggestionResults.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item" style="color:#888; text-align:center;">ไม่พบข้อมูล</div>';
        suggestionsDiv.style.display = 'block';
    } else {
        // Limit to 50 items to prevent performance issues
        suggestionsDiv.innerHTML = suggestionResults.slice(0, 50).map(h =>
            `<div class="suggestion-item" onclick="selectHospital('${h.c}')">
                        <strong>${h.n}</strong>
                        <span style="float:right; color:#94a3b8; font-size:0.85rem;">${h.c}</span><br>
                        <small>จ.${h.p} | เขต ${h.r}</small>
                    </div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
    }
}

function analyzeHeaders(headers) {
    const items = headers.map((header, index) => ({
        header,
        index,
        isParent: false,
        isChild: false,
        code: null,
        parentCode: null,
        hasChildren: false
    }));

    const parentMap = {};
    items.forEach(item => {
        const match = item.header.match(/^(\d+(\.\d+)*)\s/);
        if (match) {
            item.code = match[1];
            item.isParent = true;
            parentMap[item.code] = item;
        }
    });

    items.forEach(item => {
        const match = item.header.match(/^S_(\d+(\.\d+)*)(_|$)/);
        if (match) {
            const pCode = match[1];
            if (parentMap[pCode]) {
                item.isChild = true;
                item.parentCode = pCode;
                parentMap[pCode].hasChildren = true;
            }
        }
    });

    // Reorder items: Parents first, then their children
    const reorderedItems = [];
    const processedIndices = new Set();

    items.forEach(item => {
        if (processedIndices.has(item.index) || !item) return;

        if (item.isChild && parentMap[item.parentCode]) {
            // Skip child if parent exists (will be added after parent)
            return;
        }

        reorderedItems.push(item);
        processedIndices.add(item.index);

        if (item.isParent && item.hasChildren) {
            // Find all children for this parent
            const children = items.filter(i => i.isChild && i.parentCode === item.code);
            children.forEach(child => {
                if (!processedIndices.has(child.index)) {
                    reorderedItems.push(child);
                    processedIndices.add(child.index);
                }
            });
        }
    });

    return reorderedItems;
}

async function selectHospital(code, silent = false) {
    document.getElementById('suggestions').style.display = 'none';
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';

    // Find or add the hospital to the comparison list
    let hospitalItem = comparisonList.find(c => c.code === code);
    if (!hospitalItem) {
        addToComparison(code, null, true);
        hospitalItem = comparisonList.find(c => c.code === code);
    } else {
        // If hospital exists but we need to fetch a new year
        hospitalItem.isLoading = true;
    }

    if (!silent) renderMainContent(); // Show loading state

    try {
        const sYear = parseInt(document.getElementById('startYear').value);
        const eYear = parseInt(document.getElementById('endYear').value);
        const yearToFetch = eYear;
        // Load Management Budget data (current year) and TPS data for the selected range
        const yearsToFetch = [];
        for (let y = eYear; y >= sYear; y--) {
            yearsToFetch.push(y);
        }

        const requestPromises = [
            jsonpRequest('getMgmtData', `code=${code}&year=${yearToFetch}`).catch(e => ({ headers: [], data: {} }))
        ];

        yearsToFetch.forEach(y => {
            requestPromises.push(jsonpRequest('getYearlyData', `code=${code}&year=${y}`).catch(e => ({ headers: [], data: {} })));
        });

        const results = await Promise.all(requestPromises);
        const mgmtResult = results[0];
        const tpsResults = results.slice(1);

        // Consolidate TPS Data
        let combinedTpsData = {};
        let combinedTpsHeaders = {};
        let primaryTpsHeaders = [];

        tpsResults.forEach((res, idx) => {
            const y = yearsToFetch[idx];
            if (res.data) {
                // Filter data to only include rows for the requested year
                let filteredData = res.data;
                if (res.headers && res.headers.length > 0) {
                    const yIdx = res.headers.findIndex(h => String(h).trim() === 'ปี');
                    // If 'ปี' column exists, filter rows
                    if (yIdx >= 0) {
                        filteredData = {};
                        for (const key in res.data) {
                            const row = res.data[key];
                            if (row && String(row[yIdx]) === String(y)) {
                                filteredData[key] = row;
                            }
                        }
                    }
                }
                combinedTpsData = { ...combinedTpsData, ...filteredData };
            }
            if (res.headers && res.headers.length > 0) {
                combinedTpsHeaders[y] = res.headers;
                if (idx === 0) primaryTpsHeaders = res.headers; // Use latest year as primary
            }
        });

        const result = { headers: primaryTpsHeaders, data: combinedTpsData }; // Construct a composite result

        // If this is the very first hospital, its headers become the reference
        if (comparisonList.length === 1 && sourceHeaders.length === 0) {
            sourceHeaders = result.headers;
        }

        const item = comparisonList.find(c => c.code === code);
        if (item) {
            // Merge TPS data
            item.data = { ...item.data, ...result.data };
            if (!item.headersMap) item.headersMap = {};
            Object.assign(item.headersMap, combinedTpsHeaders);

            // Merge Mgmt data
            if (!item.mgmtData) item.mgmtData = {};
            if (!item.mgmtHeadersMap) item.mgmtHeadersMap = {};
            item.mgmtData = { ...item.mgmtData, ...mgmtResult.data };
            if (mgmtResult.headers && mgmtResult.headers.length > 0) {
                item.mgmtHeadersMap[yearToFetch] = mgmtResult.headers;
            }

            item.isLoading = false;

            const allRows = Object.values(item.data);
            const currentHeaders = result.headers || sourceHeaders;
            const nameIdx = currentHeaders ? currentHeaders.indexOf('หน่วยบริการ') : -1;

            // Always store hospital info for background service data loading
            const info = hospitalList.find(h => String(h.c) === String(code));
            if (info) {
                item.hospitalInfo = info;
            }

            if (allRows[0] && nameIdx > -1 && allRows[0][nameIdx]) {
                item.name = allRows[0][nameIdx];
            } else if (info) {
                item.name = info.n;
            }

            // Background load Service Statistics (OPD/IPD) data
            // This runs asynchronously and doesn't block the UI
            loadServiceDataInBackground(item).catch(err => {
                console.warn(`Background service data loading failed for ${code}:`, err);
            });
        }
        if (!silent) renderMainContent('4'); // Re-render with the new data
    } catch (e) {
        alert(`เกิดข้อผิดพลาดในการโหลดข้อมูลโรงพยาบาล: ${e.message}`);
        removeHospital(code); // Remove hospital if data loading fails
    }
}

// Background Service Data Loader
async function loadServiceDataInBackground(hospitalItem) {
    if (!hospitalItem || !hospitalItem.hospitalInfo) return;

    const hospital = hospitalItem.hospitalInfo;
    const pName = (hospital.p || "").trim();
    const provinceCode = PROVINCE_MAP[pName];

    if (!provinceCode) {
        console.warn(`No province code found for ${pName}`);
        return;
    }

    // Determine years to fetch (based on selection)
    const sYear = parseInt(document.getElementById('startYear').value);
    const eYear = parseInt(document.getElementById('endYear').value);
    const years = [];
    for (let y = eYear; y >= sYear; y--) {
        years.push(y);
    }

    // Initialize storage
    if (!hospitalItem.serviceData) {
        hospitalItem.serviceData = {
            opdData: {},
            ipdData: {},
            lastUpdated: null
        };
    }

    console.log(`📊 Background loading service data for ${hospital.n} (${hospital.c})...`);

    // Fetch data for each year
    for (let year of years) {
        try {
            // OPD Data
            const oData = await fetchMOPHReportData("s_opd_all", provinceCode, year, hospital.c);
            if (oData) {
                const getR = (m) => parseInt(String(oData['result' + m] || '0').replace(/,/g, '')) || 0;
                const getT = (m) => parseInt(String(oData['target' + m] || '0').replace(/,/g, '')) || 0;
                oData._totalResult = (getR('10') + getR('11') + getR('12') + getR('01') + getR('02') + getR('03') + getR('04') + getR('05') + getR('06') + getR('07') + getR('08') + getR('09')) || parseInt(String(oData.result || '0').replace(/,/g, ''));
                oData._totalTarget = (getT('10') + getT('11') + getT('12') + getT('01') + getT('02') + getT('03') + getT('04') + getT('05') + getT('06') + getT('07') + getT('08') + getT('09')) || parseInt(String(oData.target || '0').replace(/,/g, ''));
                hospitalItem.serviceData.opdData[year] = oData;
            }

            // IPD Data
            const iData = await fetchMOPHReportData("s_ipd_all", provinceCode, year, hospital.c);
            if (iData) {
                const getR = (m) => parseInt(String(iData['result' + m] || '0').replace(/,/g, '')) || 0;
                const getT = (m) => parseInt(String(iData['target' + m] || '0').replace(/,/g, '')) || 0;
                iData._totalResult = getR('10') + getR('11') + getR('12') + getR('01') + getR('02') + getR('03') + getR('04') + getR('05') + getR('06') + getR('07') + getR('08') + getR('09');
                iData._totalTarget = getT('10') + getT('11') + getT('12') + getT('01') + getT('02') + getT('03') + getT('04') + getT('05') + getT('06') + getT('07') + getT('08') + getT('09');
                hospitalItem.serviceData.ipdData[year] = iData;
            }

            // OPD Rights Data (s_op_instype_all) - YEARLY
            const oRightData = await fetchMOPHReportData("s_op_instype_all", provinceCode, year, hospital.c);
            if (oRightData) {
                if (!hospitalItem.serviceData.opdData[year]) hospitalItem.serviceData.opdData[year] = {};
                hospitalItem.serviceData.opdData[year].rights = oRightData;
            }

            // IPD Rights Data (s_ip_instype_all) - YEARLY
            const iRightData = await fetchMOPHReportData("s_ip_instype_all", provinceCode, year, hospital.c);
            if (iRightData) {
                if (!hospitalItem.serviceData.ipdData[year]) hospitalItem.serviceData.ipdData[year] = {};
                hospitalItem.serviceData.ipdData[year].rights = iRightData;
            }

            // Small delay between requests to avoid overwhelming the API
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.warn(`Failed to fetch service data for year ${year}:`, err);
        }
    }

    hospitalItem.serviceData.lastUpdated = new Date();
    console.log(`✅ Service data loaded for ${hospital.n}`);
}



function getCell(row, header, h) {
    if (!row || !h) return '-';

    // 1. Try exact match in headers
    let idx = h.indexOf(header);

    // 2. Try match by code (extracted from 'Code,Label' format)
    if (idx === -1 && header.includes(',')) {
        const code = header.split(',')[0].trim();
        // Pass 2.1: Exact code match
        idx = h.findIndex(sh => String(sh).trim() === code);
        // Pass 2.2: Code prefix match (Code,Label or Code Label)
        if (idx === -1) {
            idx = h.findIndex(sh => {
                const s = String(sh).trim();
                return s.startsWith(code + ',') || s.startsWith(code + ' ');
            });
        }
    }

    // 3. Try fuzzy match by label
    if (idx === -1 && header.includes(',')) {
        const label = header.split(',')[1].trim();
        idx = h.findIndex(sh => String(sh).trim().includes(label));
    }

    if (idx === -1) {
        // Special case for calculated headers that are not in the source sheet
        if (header.startsWith('A2111_M')) {
            const codes = ["A2111010", "A2111020", "A2111030", "A2111040"];
            let sum = 0;
            let foundAny = false;
            codes.forEach(c => {
                const v = getCell(row, c, h);
                if (v !== '-') {
                    sum += parseFloat(String(v).replace(/,/g, ''));
                    foundAny = true;
                }
            });
            return foundAny ? sum : '-';
        }
        if (header.startsWith('A2111_O')) {
            const codes = ["A2111050", "A2111060", "A2111070", "A2111080", "A2111090"];
            let sum = 0;
            let foundAny = false;
            codes.forEach(c => {
                const v = getCell(row, c, h);
                if (v !== '-') {
                    sum += parseFloat(String(v).replace(/,/g, ''));
                    foundAny = true;
                }
            });
            return foundAny ? sum : '-';
        }
        return '-';
    }
    let val = row[idx];
    if (val === null || val === undefined || val === '') return '-';
    if (String(val).toLowerCase().trim() === 'n/a') return '-';
    return val;
}

function formatValue(val) {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    const s = String(val).trim();
    if (s.toLowerCase() === 'n/a') return '-';

    const num = parseFloat(s.replace(/,/g, ''));
    if (isNaN(num)) return s;

    // Determine decimal places
    let decimalPlaces = 0;
    if (s.includes('.')) {
        const parts = s.split('.');
        decimalPlaces = parts[1].length;
    }

    // Format with at least 2 decimal places if it's likely a financial value
    // or preserve original decimals if more than 2
    const minDigits = (decimalPlaces === 0) ? 2 : decimalPlaces;
    const maxDigits = Math.max(2, decimalPlaces);

    return num.toLocaleString('en-US', {
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits
    });
}

function getLabelStyle(item) {
    let label = item.header;
    let cellClass = '';
    let rowClass = '';

    if (label === 'เงินบำรุงหลังหักหนี้') label = 'เงินบำรุงคงเหลือสุทธิ';
    if (label.includes('2.1.1 ประสิทธิภาพในการดำเนินงาน')) label = '2.1.1 ประสิทธิภาพในการดำเนินงาน (Operating Margin)';
    if (label.includes('2.1.2 อัตราผลตอบแทนจากสินทรัพย์')) label = '2.1.2 อัตราผลตอบแทนจากสินทรัพย์ (Return on Asset)';
    if (label.includes('2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม')) label = '2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม (EBITDA) ≥0';
    if (label === '2.2.1 ทุนสำรองสุทธิ') label = '2.2.1 ทุนสำรองสุทธิ (Net Working Capital) ≥0';
    if (label.includes('2.2.2 Cash Ratio')) label = '2.2.2 Cash Ratio ≥0.8';
    if (label.includes('1.2.1 ระยะเวลาชำระเจ้าหนี้')) label = '1.2.1 ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา ≤ 90 วัน หรือ ≤ 180 วัน';
    if (label.includes('1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC')) label = '1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC ≤60 วัน';
    if (label.includes('1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ')) label = '1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ ≤60 วัน';
    if (label.includes('1.2.4 การบริหารสินคงคลัง')) label = '1.2.4 การบริหารสินคงคลัง (Inventory Management) ≤ 60 วัน ยกเว้น รพ.พื้นที่เกาะ ≤ 90 วัน';

    if (item.isChild) {
        label = label.replace(/^S_(\d+(\.\d+)*)_/, '');
        cellClass = 'label-child';
        rowClass = 'child-row';
    } else {
        if (label.match(/^\d+\.\d+\.\d+/)) {
            cellClass = 'label-sub';
        } else if (label.match(/^\d+\.\d+/)) {
            cellClass = 'label-header';
        } else if (label.match(/^\d+\./)) {
            cellClass = 'label-header-lg';
        } else if (item.isParent) {
            cellClass = 'label-header';
        }
    }
    if (['Risk Scoring', 'ระดับการประเมิน', 'คะแนนรวม', 'Grade'].includes(item.header)) {
        rowClass += ' row-center';
    }
    return { label, cellClass, rowClass };
}

function renderTableBody() {
    const container = document.getElementById('tableContainer');
    const quarter = document.getElementById('quarterSelector').value;

    const allRows = Object.values(rawHospitalData);
    const availableYears = [...new Set(allRows.map(r => r[2]))].sort((a, b) => a - b);

    const yearDataMap = {};
    allRows.forEach(row => {
        if (String(row[3]) === String(quarter)) {
            yearDataMap[row[2]] = row;
        }
    });

    let html = `<table><thead><tr><th>ตัวชี้วัด</th>`;
    availableYears.forEach(year => {
        html += `<th>${year}</th>`;
    });
    html += `</tr></thead><tbody>`;

    const items = analyzeHeaders(FIXED_HEADERS);

    items.forEach(item => {
        if (item.index <= 10) return;

        const { label, cellClass, rowClass } = getLabelStyle(item);
        let displayLabel = label;
        let classes = rowClass;
        let attrs = '';

        if (item.hasChildren) {
            classes += ' parent-row cursor-pointer';
            attrs = ` onclick="toggleRow('${item.code}', this)"`;
            displayLabel = `<span class="toggle-icon-span toggle-icon">▶</span>` + label;
        }

        if (item.isChild) {
            attrs += ` data-parent-id="${item.parentCode}"`;
            classes += ' display-none';
        }

        html += `<tr class="${classes}"${attrs}><td class="${cellClass}">${displayLabel}</td>`;

        availableYears.forEach(year => {
            const h = headersMap[year] || sourceHeaders;
            const val = getCell(yearDataMap[year], item.header, h);
            const displayVal = formatValue(val);
            const isNumeric = displayVal !== '-' && !isNaN(parseFloat(displayVal.replace(/,/g, '')));

            let finalCellClass = isNumeric ? 'numeric' : '';
            if (isNumeric && parseFloat(displayVal.replace(/,/g, '')) === 0 && !label.includes('Risk')) {
                finalCellClass += ' text-red-bold';
            }

            html += `<td class="${finalCellClass}">${displayVal}</td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function toggleRow(code, row) {
    const isExpanded = row.classList.toggle('expanded');
    const icon = row.querySelector('.toggle-icon');
    if (icon) icon.innerText = isExpanded ? '▼' : '▶';

    const children = document.querySelectorAll(`tr[data-parent-id="${code}"]`);
    children.forEach(child => {
        child.style.display = isExpanded ? 'table-row' : 'none';
    });
}



function removeHospital(code) {
    console.log('removeHospital called for:', code);
    comparisonList = comparisonList.filter(c => c.code !== code);
    renderMainContent();
}

function addToComparison(code, data, isLoading = false, hMap = null) {
    if (comparisonList.find(c => c.code === code)) return;

    let name = code;
    const info = hospitalList.find(h => String(h.c) === String(code));
    if (info) name = info.n;

    if (data && !isLoading) {
        const allRows = Object.values(data);
        const h = hMap ? (Object.values(hMap)[0] || sourceHeaders) : sourceHeaders;
        const nameIdx = h ? h.indexOf('หน่วยบริการ') : -1;
        if (allRows[0] && nameIdx > -1 && allRows[0][nameIdx]) name = allRows[0][nameIdx];
    } else if (isLoading && !info) {
        name = 'กำลังโหลด...';
    }
    comparisonList.push({
        code,
        name,
        p: info ? info.p : '',
        r: info ? info.r : '',
        type: info ? info.type : '',
        serviceLevelGroup: info ? info.serviceLevelGroup : '',
        data: data || {},
        isLoading,
        headersMap: hMap || {}
    });
}



function renderMainContent(defaultQuarter = '4') {
    renderCompareMode(defaultQuarter);
}

function renderHistoryMode(defaultQuarter) {
    const mainContent = document.getElementById('mainContent');
    if (!rawHospitalData || Object.keys(rawHospitalData).length === 0) {
        mainContent.innerHTML = `<div class="welcome-message"><h3>ไม่พบข้อมูลสำหรับโรงพยาบาลที่เลือก</h3></div>`;
        return;
    }

    const allRows = Object.values(rawHospitalData);
    const hospitalName = allRows[0] && sourceHeaders ? allRows[0][sourceHeaders.indexOf('หน่วยบริการ')] : 'Hospital Data';
    const availableYears = [...new Set(allRows.map(r => r[2]))].sort((a, b) => a - b);

    let headerHTML = `
                <div class="info-card-header">
                    <div>
                        <h2>${hospitalName}</h2>
                        <div class="meta">รหัส: ${currentHospitalCode} | ปีที่แสดง: <span id="yearList">${availableYears.join(', ')}</span></div>
                    </div>
                    <div id="headerActions">
            `;

    if (!isFullHistoryLoaded && !isLoadingHistory) {
        headerHTML += `<button class="load-more-btn" onclick="loadAllHistory()">📥 โหลดข้อมูลย้อนหลังทั้งหมด</button>`;
    } else if (isLoadingHistory) {
        headerHTML += `<button class="load-more-btn" disabled><span class="spinner-sm"></span>กำลังโหลด...</button>`;
    } else {
        headerHTML += `<span style="color:rgba(255,255,255,0.8); font-size:0.9rem;">ข้อมูลครบถ้วน</span>`;
    }
    headerHTML += `</div></div>`;

    const containerHTML = `
                ${headerHTML}
                <div class="filter-card" style="margin-top: -10px; border-top-left-radius:0; border-top-right-radius:0; border-top:none;">
                     <div class="filter-group">
                        <label>เลือกไตรมาสที่จะแสดง:</label>
                        <select id="quarterSelector" onchange="renderTableBody()">
                            <option value="4" ${defaultQuarter == '4' ? 'selected' : ''}>ไตรมาส 4 (ก.ค. - ก.ย.) - ทั้งปี</option>
                            <option value="3" ${defaultQuarter == '3' ? 'selected' : ''}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                            <option value="2" ${defaultQuarter == '2' ? 'selected' : ''}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                            <option value="1" ${defaultQuarter == '1' ? 'selected' : ''}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                        </select>
                     </div>
                </div>
                <div class="table-card" id="tableContainer"></div>
            `;

    mainContent.innerHTML = containerHTML;
    renderTableBody();
}

function renderCompareMode(defaultQuarter) {
    const mainContent = document.getElementById('mainContent');
    if (comparisonList.length === 0) {
        mainContent.innerHTML = `<div class="welcome-message"><h2>โหมดเปรียบเทียบ</h2><p>ค้นหาและเลือกโรงพยาบาลเพื่อเพิ่มในตารางเปรียบเทียบ</p></div>`;
        return;
    }

    const cols = comparisonList;
    let headerHTML = `
                <div class="info-card-header compare-header">
                    <div class="header-title-group">
                        <h2>เปรียบเทียบ ${cols.length} โรงพยาบาล</h2>
                        <div id="headerActions" class="header-actions">
                            <!-- Report Button Removed -->
                            <button class="load-more-btn" onclick="comparisonList=[]; renderMainContent();">ล้างรายการ</button>
                        </div>
                    </div>
                    <div class="header-filter-group">
                        <div class="compare-title-group">
                            <label class="header-filter-label">ปีงบประมาณ:</label> 
                            <select id="compareYearSelect" onchange="comparisonYear = this.value; fetchMissingDataForYear(this.value);" class="header-filter-select">
                                ${[0, 1, 2, 3, 4, 5].map(i => {
        const year = (latestYearAvailable || new Date().getFullYear() + 543) - i;
        return `<option value="${year}" ${comparisonYear == year ? 'selected' : ''}>${year}</option>`;
    }).join('')}
                            </select>
                        </div>
                        <div class="compare-title-group">
                            <label class="header-filter-label">ไตรมาส:</label>
                            <select id="quarterSelector" onchange="renderMgmtTable()" class="header-filter-select">
                                <option value="4" ${defaultQuarter == '4' ? 'selected' : ''}>ไตรมาส 4 (ก.ค. - ก.ย.) - ทั้งปี</option>
                                <option value="3" ${defaultQuarter == '3' ? 'selected' : ''}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                                <option value="2" ${defaultQuarter == '2' ? 'selected' : ''}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                                <option value="1" ${defaultQuarter == '1' ? 'selected' : ''}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                            </select>
                        </div>
                    </div>
                </div>`;

    mainContent.innerHTML = `${headerHTML}
                <!-- TPS Table Removed -->
                <div class="compare-title-row">
                    <div class="compare-title-group">
                        <h3 class="compare-h3">ตารางงบบริหาร</h3>
                        <!-- Heatmap Toggle -->
                        <div class="compare-toggle-wrapper" onclick="document.getElementById('mgmtCompareToggle').click()">
                            <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                <input type="checkbox" id="mgmtCompareToggle" onchange="toggleHeatmapAndPreserveState()">
                                <span class="slider"></span>
                            </label>
                            <span class="compare-toggle-label">เปรียบเทียบ (Heatmap)</span>
                        </div>
                        <!-- Graph Selection Toggle -->
                        <div class="compare-toggle-wrapper" onclick="document.getElementById('chartSelectionToggle').click()">
                            <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                <input type="checkbox" id="chartSelectionToggle" onchange="toggleGraphSelectionMode(this)">
                                <span class="slider"></span>
                            </label>
                            <span class="compare-toggle-label">เลือกกราฟเปรียบเทียบ</span>
                        </div>
                    </div>
                    <!-- Open Chart Button -->
                    <button id="openSelectedChartBtn" onclick="chartSelectedRows()" class="open-chart-btn">
                        <span>📊</span> ดูผลการเปรียบเทียบ
                    </button>
                </div>
                <div class="table-card" id="mgmtTableContainer"></div>`;
    // renderTableBodyComparison(); // Disabled TPS Table Rendering
    renderMgmtTable();
}

function toggleHeatmapAndPreserveState() {
    const mgmtTable = document.querySelector('#mgmtTableContainer table');
    if (!mgmtTable) {
        renderMgmtTable(); // First time, just render
        return;
    }

    // 1. Save state
    const expandedCodes = new Set();
    mgmtTable.querySelectorAll('tr.mgmt-expanded').forEach(row => {
        if (row.dataset.accountCode) {
            expandedCodes.add(row.dataset.accountCode);
        }
    });

    const pinnedCodes = new Set();
    mgmtTable.querySelectorAll('tr.row-pinned').forEach(row => {
        if (row.dataset.accountCode) {
            pinnedCodes.add(row.dataset.accountCode);
        }
    });

    // 2. Re-render the table (which reads the toggle state)
    renderMgmtTable();

    // 3. Restore state
    const newMgmtTable = document.querySelector('#mgmtTableContainer table');
    if (!newMgmtTable) return;

    // Restore pinned rows first, as they can affect visibility logic.
    pinnedCodes.forEach(code => {
        const row = newMgmtTable.querySelector(`tr[data-account-code="${code}"]`);
        if (row) {
            row.classList.add('row-pinned');
            // Pinned rows should always be visible, regardless of parent state.
            row.style.display = 'table-row';
        }
    });

    // Restore expanded states by adding the class.
    expandedCodes.forEach(code => {
        const row = newMgmtTable.querySelector(`tr.parent-row[data-account-code="${code}"]`);
        if (row) {
            row.classList.add('mgmt-expanded');
        }
    });

    // Set visibility for all child rows based on the restored expanded states.
    // This correctly handles nested structures.
    newMgmtTable.querySelectorAll('tr.child-row').forEach(childRow => {
        // If a row is pinned, its visibility is already set to table-row and should not be changed.
        if (childRow.classList.contains('row-pinned')) {
            return;
        }

        const parentCode = childRow.dataset.mgmtParent;
        if (parentCode) {
            const parentRow = newMgmtTable.querySelector(`tr.parent-row[data-account-code="${parentCode}"]`);
            // A child is visible only if its direct parent is visible and expanded.
            if (parentRow && parentRow.style.display !== 'none' && parentRow.classList.contains('mgmt-expanded')) {
                childRow.style.display = 'table-row';
            } else {
                childRow.style.display = 'none';
            }
        }
    });
}



function togglePin(row) {
    const wasPinned = row.classList.contains('row-pinned');
    row.classList.toggle('row-pinned');

    // After unpinning, check if the row should now be hidden.
    if (wasPinned) { // If it *was* pinned, it is now unpinned.
        const parentCode = row.dataset.mgmtParent;
        if (parentCode) {
            const parentRow = document.querySelector(`.parent-row[onclick*="'${parentCode}'"]`);
            // If the parent exists and is currently collapsed (not expanded), hide this row.
            if (parentRow && !parentRow.classList.contains('mgmt-expanded')) {
                row.style.display = 'none';
            }
        }
    }
}

let isGraphSelectionMode = false;

function toggleGraphSelectionMode(checkbox) {
    isGraphSelectionMode = checkbox.checked;
    const container = document.getElementById('mgmtTableContainer');
    const btn = document.getElementById('openSelectedChartBtn');

    if (isGraphSelectionMode) {
        container.classList.add('selection-mode-active');
        if (btn) btn.style.display = 'flex';
    } else {
        container.classList.remove('selection-mode-active');
        if (btn) btn.style.display = 'none';

        // Clear selections if toggled off? Optional.
        // const checkboxes = document.querySelectorAll('.row-select-checkbox');
        // checkboxes.forEach(cb => cb.checked = false);
    }
}

function renderMgmtTable() {
    const container = document.getElementById('mgmtTableContainer');
    if (!container) return;
    const quarter = document.getElementById('quarterSelector').value;
    const cols = comparisonList;
    const isCompareMode = document.getElementById('mgmtCompareToggle') && document.getElementById('mgmtCompareToggle').checked;

    let html = `<table class="report-table"><thead><tr><th class="text-center">รายการตัวชี้วัด (งบบริหาร)</th>`;
    cols.forEach(c => {
        const removeBtn = `<button class="remove-hospital-btn" onclick="removeHospital('${c.code}')" title="ลบออกจากรายการ">×</button>`;
        const chartBtn = `<button class="view-chart-btn" onclick="openFinancialChartModal('${c.code}')" title="ดูกราฟโครงสร้างการเงิน">📊</button>`;
        html += `<th class="th-min-width">${c.isLoading ? '<span class="spinner-sm"></span> ' + c.name : '<div class="header-cell-wrapper">' + c.name + chartBtn + removeBtn + '</div>'}</th>`;
    });
    html += `</tr></thead><tbody>`;

    const findParentCode = (childCode) => {
        for (let parent in MGMT_GROUPS) {
            if (MGMT_GROUPS[parent].includes(childCode)) return parent;
        }
        return null;
    };

    const getDepth = (targetCode) => {
        let d = 0;
        let curr = targetCode;
        while (true) {
            let p = null;
            for (let parent in MGMT_GROUPS) {
                if (MGMT_GROUPS[parent].includes(curr)) { p = parent; break; }
            }
            if (p) { d++; curr = p; } else break;
        }
        return d;
    };

    MGMT_HEADERS.forEach((rawHeader, idx) => {
        const parts = rawHeader.split(',');
        const code = parts[0];
        const label = parts[1] || parts[0];
        const isMeta = idx < 4;
        let icon = "";

        // Skip unwanted metadata rows
        if (code === "รหัสโรงพยาบาล" || label === "รหัสโรงพยาบาล") return;
        if (code === "เขต" || label === "เขต") return;
        if (code === "จังหวัด" || label === "จังหวัด") return;
        if (code === "ชื่อหน่วยงาน" || label === "ชื่อหน่วยงาน") return;

        let style = "";
        let trAttrs = "";

        const parentCode = findParentCode(code);
        const depth = getDepth(code);

        // Check if this item actually has children in MGMT_HEADERS
        const hasActualChildren = MGMT_GROUPS[code] && MGMT_GROUPS[code].some(childCode => {
            return MGMT_HEADERS.some(h => {
                const parts = h.split(',');
                return parts[0] === childCode;
            });
        });
        const isParent = hasActualChildren || ["M1", "M2", "M3", "M4", "M5"].includes(code);

        style = `padding-left: ${depth * 1.5 + 1}rem;`;
        let classes = `depth-${Math.min(depth, 4)} ${isParent ? 'parent-row' : 'child-row'}`;

        trAttrs = `class="${classes}" data-account-code="${code}"`;

        if (isParent) {
            trAttrs += ` onclick="toggleMgmtRow('${code}', this)" style="cursor:pointer;"`;
            icon = `<span class="mgmt-toggle-icon">▶</span>`;
        } else {
            icon = `<span class="inline-spacer"></span>`; // Placeholder for alignment
        }

        if (parentCode) {
            trAttrs += ` data-mgmt-parent="${parentCode}" style="display:none;"`;
        } else if (!isParent) {
            trAttrs += ` style="display:table-row;"`;
        }

        // Pre-process data for all columns to calculate stats AND decide on chart button
        const rowData = cols.map(hospital => {
            if (hospital.isLoading) return { isLoading: true };

            const mData = hospital.mgmtData || {};
            const h = (hospital.mgmtHeadersMap && hospital.mgmtHeadersMap[comparisonYear]) || null;
            let targetRow = null;
            const allRows = Object.values(mData);

            if (allRows.length > 0) {
                let yIdx = h ? h.findIndex(sh => String(sh).trim() === 'ปี') : -1;
                if (yIdx === -1) yIdx = 2;
                let qIdx = h ? h.findIndex(sh => String(sh).trim() === 'ไตรมาส') : -1;
                if (qIdx === -1) qIdx = 3;

                for (let r of allRows) {
                    const rowYear = String(r[yIdx] || "").trim();
                    const rowQuarter = String(r[qIdx] || "").trim();
                    if (rowYear === String(comparisonYear) && (rowQuarter === String(quarter) || quarter === 'any')) {
                        targetRow = r;
                        break;
                    }
                }
                if (!targetRow && quarter === '4') {
                    targetRow = allRows.find(r => String(r[yIdx] || "").trim() === String(comparisonYear));
                }
                if (!targetRow && allRows.length === 1) targetRow = allRows[0];
            }

            const val = getCell(targetRow, rawHeader, h);
            const displayVal = formatValue(val);
            const isNum = displayVal !== '-' && !isNaN(parseFloat(displayVal.replace(/,/g, '')));
            const numVal = isNum ? parseFloat(displayVal.replace(/,/g, '')) : 0;
            return { isLoading: false, isNum, numVal, displayVal, hospitalCode: hospital.code, hospitalName: hospital.name };
        });

        const pinIcon = `<span class="pin-icon" onclick="event.stopPropagation(); togglePin(this.closest('tr'));" title="Pin row">📌</span>`;
        const checkIcon = `<input type="checkbox" class="row-select-checkbox checkbox-spacer" data-code="${code}" data-label="${label}" data-full-header="${rawHeader}" data-parent="${parentCode || ''}" onclick="event.stopPropagation()" onchange="handleCheckboxChange(this, '${code}', '${parentCode || ''}')">`;

        // Determine if we show chart button: check if any data exists for this row
        let chartBtn = '';
        const hasNumericData = rowData.some(d => d.isNum);
        if (hasNumericData) {
            chartBtn = `<button class="chart-btn cell-chart-btn" onclick="event.stopPropagation(); openChartModal('${code}', '${label}', 'null', 'mgmt')" title="ดูกราฟเปรียบเทียบ">📊</button>`;
        }

        html += `<tr ${trAttrs}><td style="${style}"><div class="row-content-wrapper"><span>${checkIcon}${pinIcon}${icon}${label}</span>${chartBtn}</div></td>`;

        // Calculate Min/Max for Heatmap
        let min = Infinity, max = -Infinity;
        if (isCompareMode) {
            rowData.forEach(d => {
                if (d.isNum) {
                    if (d.numVal < min) min = d.numVal;
                    if (d.numVal > max) max = d.numVal;
                }
            });
        }

        // Render Cells
        rowData.forEach((d, idx) => {
            if (d.isLoading) {
                html += `<td class="text-left">...</td>`;
                return;
            }

            let style = '';
            let cellClass = d.isNum ? 'numeric' : '';
            if (d.isNum) cellClass += ' text-dark';

            if (isCompareMode && d.isNum && max > min) {
                let isHighGood = true;
                // Heuristic for Good/Bad direction
                if (/^A2/.test(code) || /^A6/.test(code) || /^E5/.test(code)) isHighGood = false;
                if (/^A5/.test(code) && !/^A501/.test(code)) isHighGood = false;

                let ratio = (d.numVal - min) / (max - min);
                if (!isHighGood) ratio = 1 - ratio;

                // Hue 0 (Red) to 120 (Green)
                const hue = ratio * 120;
                style = `--cell-hue: ${hue};`;
                cellClass += ' heatmap-cell';
            }

            html += `<td class="${cellClass}" style="${style}">${d.displayVal}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function toggleMgmtRow(code, row) {
    const isCurrentlyExpanded = row.classList.contains('mgmt-expanded');

    if (isCurrentlyExpanded) {
        // --- COLLAPSE ---
        row.classList.remove('mgmt-expanded');

        // Helper function to find all descendants recursively
        const findDescendants = (parentCode) => {
            const directChildren = document.querySelectorAll(`[data-mgmt-parent="${parentCode}"]`);
            let allDescendants = Array.from(directChildren);

            directChildren.forEach(child => {
                if (child.classList.contains('parent-row')) {
                    const childOnClick = child.getAttribute('onclick');
                    const childCodeMatch = childOnClick ? childOnClick.match(/'([^']+)'/) : null;
                    if (childCodeMatch) {
                        allDescendants = allDescendants.concat(findDescendants(childCodeMatch[1]));
                    }
                }
            });
            return allDescendants;
        };

        const descendants = findDescendants(code);

        descendants.forEach(descendant => {
            // If a descendant is not pinned, it must be hidden.
            if (!descendant.classList.contains('row-pinned')) {
                descendant.style.display = 'none';
            }
            // Also clean up its state by marking it as collapsed, which also resets its toggle icon.
            if (descendant.classList.contains('mgmt-expanded')) {
                descendant.classList.remove('mgmt-expanded');
            }
        });

    } else {
        // --- EXPAND ---
        row.classList.add('mgmt-expanded');
        // We only show DIRECT children. Their children remain hidden if they are collapsed.
        const children = document.querySelectorAll(`[data-mgmt-parent="${code}"]`);
        children.forEach(child => {
            child.style.display = 'table-row';
        });
    }
}

function handleCheckboxChange(checkbox, code, parentCode) {
    const isChecked = checkbox.checked;

    // Helper: ตรวจสอบว่า code มี descendants ที่ checked หรือไม่ (รวมทุกระดับ)
    function hasAnyCheckedDescendants(parentCode) {
        const directChildren = document.querySelectorAll(`input[data-parent="${parentCode}"]`);
        for (let child of directChildren) {
            if (child.checked) return true;
            // ตรวจสอบ descendants ของ child ด้วย (recursive)
            const childCode = child.dataset.code;
            if (hasAnyCheckedDescendants(childCode)) return true;
        }
        return false;
    }

    // Helper: เปิด parent toggle ทั้งหมดจาก current ไปจนถึง root
    function openAllParentToggles(currentParentCode) {
        if (!currentParentCode) return;

        const parentRow = document.querySelector(`[data-account-code="${currentParentCode}"]`);
        if (parentRow && !parentRow.classList.contains('mgmt-expanded')) {
            toggleMgmtRow(currentParentCode, parentRow);
        }

        // หา parent ของ parent และเปิดต่อ
        const parentCheckbox = document.querySelector(`input[data-code="${currentParentCode}"]`);
        if (parentCheckbox && parentCheckbox.dataset.parent) {
            openAllParentToggles(parentCheckbox.dataset.parent);
        }
    }

    // Helper: ปิด parent toggle ถ้าไม่มี descendants ที่ checked
    function closeParentIfNoCheckedDescendants(currentParentCode) {
        if (!currentParentCode) return;

        // ตรวจสอบว่ามี descendants ที่ checked หรือไม่
        if (!hasAnyCheckedDescendants(currentParentCode)) {
            const parentRow = document.querySelector(`[data-account-code="${currentParentCode}"]`);
            if (parentRow && parentRow.classList.contains('mgmt-expanded')) {
                toggleMgmtRow(currentParentCode, parentRow);
            }

            // ตรวจสอบ parent ของ parent ด้วย
            const parentCheckbox = document.querySelector(`input[data-code="${currentParentCode}"]`);
            if (parentCheckbox && parentCheckbox.dataset.parent) {
                closeParentIfNoCheckedDescendants(parentCheckbox.dataset.parent);
            }
        }
    }

    // Main logic
    if (isChecked) {
        // เปิด checkbox → เปิด parent toggle ทั้งหมดจนถึง root
        if (parentCode) {
            openAllParentToggles(parentCode);
        }
    } else {
        // ปิด checkbox → ตรวจสอบและปิด toggle ของ current code ถ้าไม่มี descendants ที่ checked
        if (code && !hasAnyCheckedDescendants(code)) {
            const currentRow = document.querySelector(`[data-account-code="${code}"]`);
            if (currentRow && currentRow.classList.contains('mgmt-expanded')) {
                toggleMgmtRow(code, currentRow);
            }
        }

        // ตรวจสอบและปิด parent toggle ถ้าไม่มี descendants ที่ checked
        if (parentCode) {
            closeParentIfNoCheckedDescendants(parentCode);
        }
    }
}

function renderTableBodyComparison() {
    const container = document.getElementById('tableContainer');
    const quarter = document.getElementById('quarterSelector').value;
    const cols = comparisonList;

    let html = `
                <div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 1rem;">
                    <h3 style="color: var(--primary-color); font-weight: 700; margin:0;">ตาราง TPS</h3>
                </div>
                <table><thead><tr><th style="text-align:center;">รายการตัวชี้วัด</th>`;
    cols.forEach(c => {
        const removeBtn = `<button onclick="removeHospital('${c.code}')" style="margin-left:8px; background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-weight:bold; line-height:1;">×</button>`;
        html += `<th>${c.isLoading ? '<span class="spinner-sm"></span> ' + c.name : c.name + ' ' + removeBtn}</th>`;
    });
    html += `</tr></thead><tbody>`;

    const items = analyzeHeaders(FIXED_HEADERS);

    items.forEach(item => {
        if (item.index <= 10) return;
        const { label, cellClass, rowClass } = getLabelStyle(item);
        let displayLabel = label;
        let classes = rowClass;
        let attrs = '';

        if (item.hasChildren) {
            classes += ' parent-row cursor-pointer';
            attrs = ` onclick="toggleRow('${item.code}', this)"`;
            displayLabel = `<span class="toggle-icon-span toggle-icon">▶</span>` + label;
        }
        if (item.isChild) {
            attrs += ` data-parent-id="${item.parentCode}"`;
            classes += ' display-none';
        }

        // Add graph button to rows that have numeric data
        let chartBtn = '';
        // Check if any hospital has numeric data for this indicator
        const hasData = cols.some(hosp => {
            if (hosp.isLoading) return false;
            const allRows = Object.values(hosp.data);
            const targetRow = allRows.find(r => String(r[2]) === String(comparisonYear) && String(r[3]) === String(quarter));
            const h = hosp.headersMap ? (hosp.headersMap[comparisonYear] || sourceHeaders) : sourceHeaders;
            const val = getCell(targetRow, item.header, h);
            const displayVal = formatValue(val);
            return displayVal !== '-' && !isNaN(parseFloat(displayVal.replace(/,/g, '')));
        });

        if (hasData && !item.hasChildren) {
            chartBtn = `<button class="chart-btn cell-chart-btn" onclick="event.stopPropagation(); openChartModal('${item.header}', '${label}', 'null', 'tps')" title="ดูกราฟเปรียบเทียบ">📊</button>`;
        }

        html += `<tr class="${classes}"${attrs}><td class="${cellClass}"><div class="row-content-wrapper"><span>${displayLabel}</span>${chartBtn}</div></td>`;

        cols.forEach(hospital => {
            if (hospital.isLoading) {
                html += `<td class="loading-cell">...</td>`;
                return;
            }
            let targetRow = null;
            const allRows = Object.values(hospital.data);
            for (let r of allRows) {
                if (String(r[2]) === String(comparisonYear) && String(r[3]) === String(quarter)) {
                    targetRow = r;
                    break;
                }
            }
            const h = hospital.headersMap ? (hospital.headersMap[comparisonYear] || sourceHeaders) : sourceHeaders;
            const val = getCell(targetRow, item.header, h);
            const displayVal = formatValue(val);
            const isNumeric = displayVal !== '-' && !isNaN(parseFloat(displayVal.replace(/,/g, '')));

            let finalCellClass = isNumeric ? 'numeric' : '';
            if (isNumeric && parseFloat(displayVal.replace(/,/g, '')) === 0) {
                finalCellClass += ' text-red-bold';
            }

            html += `<td class="${finalCellClass}">${displayVal}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function fetchMissingDataForYear(year) {
    const promises = [];
    for (const hospital of comparisonList) {
        const yearDataExists = Object.values(hospital.data).some(row => String(row[2]) === String(year));
        if (!yearDataExists) {
            const originalYear = comparisonYear;
            comparisonYear = year;
            promises.push(selectHospital(hospital.code));
            comparisonYear = originalYear;
        }
    }
    if (promises.length > 0) {
        await Promise.all(promises);
    }
    renderTableBodyComparison();
}

function openReportModal() {
    const modal = document.getElementById('reportModal');
    const quarter = document.getElementById('quarterSelector').value;
    const year = comparisonYear;
    if (!year || year === 0) {
        alert("กรุณาเลือกปีงบประมาณก่อนออกรายงาน");
        return;
    }
    const qStr = quarter === '4' ? 'ไตรมาส 4 (ทั้งปี)' : `ไตรมาส ${quarter}`;

    document.getElementById('reportModalTitle').innerText = `รายงานสรุปเปรียบเทียบ ผ่าน/ไม่ผ่าน - ปี ${year} (${qStr})`;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    modal.style.display = 'block';
    renderReportContent();
}

function closeReportModal() {
    document.body.style.overflow = ''; // Restore background scrolling
    document.getElementById('reportModal').style.display = 'none';
}

function formatAbbreviated(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    if (!window.useAbbreviatedNumbers) return formatNumberWithoutRounding(num);
    return formatAbbreviatedDirect(num, true);
}

function formatAbbreviatedDirect(num, useAbbr) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    if (!useAbbr) return formatNumberWithoutRounding(num);

    const abs = Math.abs(num);
    if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (num / 1e3).toFixed(2) + 'K';

    return formatNumberWithoutRounding(num);
}

function formatNumberWithoutRounding(num) {
    if (num === null || num === undefined || num === '') return '-';
    const valStr = String(num);
    const parsed = parseFloat(valStr.replace(/,/g, ''));
    if (isNaN(parsed)) return valStr;
    return parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Drag & Drop Grouping State ---
if (!window.chartLegendStructure) window.chartLegendStructure = [];
if (!window.savedChartGroups) window.savedChartGroups = [];

function syncLegendStructure(flatItems) {
    const currentIds = new Set(flatItems.map(i => i.id));
    const recoveredStructure = [];
    const processedIds = new Set();

    // Pass 1: Preserve existing valid structure (Priority to current layout)
    window.chartLegendStructure.forEach(item => {
        if (typeof item === 'string') {
            if (currentIds.has(item)) {
                recoveredStructure.push(item);
                processedIds.add(item);
            }
        } else if (item.type === 'group') {
            // Check validity of items in current context
            const validItems = item.items.filter(x => currentIds.has(x));
            // Keep group if it has members relevant to this chart
            if (validItems.length > 0) {
                item.items = validItems;
                recoveredStructure.push(item);
                validItems.forEach(x => processedIds.add(x));
            }
        }
    });

    // Pass 2: Recover groups from Saved Storage -> Universal Grouping by Hospital Code
    window.savedChartGroups.forEach(sg => {
        // Skip if this group ID is already actively used
        if (recoveredStructure.some(r => r.type === 'group' && r.id === sg.id)) return;

        // Find items in current chart that match the saved Hospital Codes
        if (sg.hospCodes && sg.hospCodes.length > 0) {
            const relevantItems = flatItems.filter(i =>
                !processedIds.has(i.id) && sg.hospCodes.includes(i.hospCode)
            );

            if (relevantItems.length > 0) {
                const relevantIds = relevantItems.map(i => i.id);

                // Create the group with these IDs
                const restoredGroup = {
                    type: 'group',
                    id: sg.id,
                    name: sg.name,
                    collapsed: sg.collapsed,
                    items: relevantIds
                };
                recoveredStructure.push(restoredGroup);
                relevantIds.forEach(id => processedIds.add(id));
            }
        }
    });

    // Pass 3: Add new/remaining ungrouped items
    flatItems.forEach(i => {
        if (!processedIds.has(i.id)) {
            recoveredStructure.push(i.id);
        }
    });

    window.chartLegendStructure = recoveredStructure;
}

function renderReportContent() {
    const container = document.getElementById('reportModalBody');
    const quarter = document.getElementById('quarterSelector').value;
    const cols = comparisonList;

    const reportStructure = [
        {
            section: "1. ตัวชี้วัดกระบวนการ (Process Indicators)",
            items: [
                {
                    subHeading: "1.1 การบริหารแผนทางการเงินเปรียบเทียบผลการดำเนินงานผลต่าง",
                    title: "1.1.1 มิติรายได้",
                    checkHeader: "1.1.1 มิติรายได้",
                    subIndicators: [{ header: "S_1.1.1_รวมรายได้_ร้อยละ", label: "ผลต่างรายได้ (%)" }],
                    sortType: 'nearZero'
                },
                {
                    title: "1.1.2 มิติค่าใช้จ่าย",
                    checkHeader: "1.1.2 มิติค่าใช้จ่าย",
                    subIndicators: [{ header: "S_1.1.2_ค่าใช้จ่ายรวม_ร้อยละ", label: "ผลต่างค่าใช้จ่าย (%)" }],
                    sortType: 'nearZero'
                }
            ]
        },
        {
            section: "1.2 การบริหารสินทรัพย์หมุนเวียนและหนี้สินหมุนเวียน",
            items: [
                {
                    title: "1.2.1 ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา ≤ 90 วัน หรือ ≤ 180 วัน",
                    checkHeader: "1.2.1 ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา",
                    subIndicators: [{ header: "S_1.2.1_ระยะเวลาชำระเจ้าหนี้การค้ายา&เวชภัณฑ์มิใช่ยา", label: "ระยะเวลาชำระเจ้าหนี้ (วัน)" }],
                    sortType: 'ascFailDesc'
                },
                {
                    title: "1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC ≤60 วัน",
                    checkHeader: "1.2.2 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC",
                    subIndicators: [{ header: "S_1.2.2_ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC", label: "ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC (วัน)" }],
                    sortType: 'ascFailDesc'
                },
                {
                    title: "1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ ≤60 วัน",
                    checkHeader: "1.2.3 ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ",
                    subIndicators: [{ header: "S_1.2.3_ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ", label: "ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิข้าราชการ (วัน)" }],
                    sortType: 'ascFailDesc'
                },
                {
                    title: "1.2.4 การบริหารสินคงคลัง (Inventory Management) ≤ 60 วัน ยกเว้น รพ.พื้นที่เกาะ ≤ 90 วัน",
                    checkHeader: "1.2.4 การบริหารสินคงคลัง (Inventory Management)",
                    subIndicators: [{ header: "S_1.2.4_การบริหารสินคงคลัง (Inventory Management)", label: "ระยะถัวเฉลี่ยการหมุนเวียนคลัง (วัน)" }],
                    sortType: 'ascFailDesc'
                }
            ]
        },
        {
            section: "1.3 การบริหารจัดการ",
            items: [
                {
                    title: "1.3.1.1 Unit Cost for OP",
                    checkHeader: "1.3.1.1 Unit Cost for OP",
                    subIndicators: [
                        { header: "S_1.3.1.1_ต้นทุนบริการผู้ป่วยนอกต่อครั้ง", label: "ต้นทุนบริการผู้ป่วยนอกต่อครั้ง (บาท)" },
                        { header: "S_1.3.1.1_Mean+1SD", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" }
                    ],
                    sortType: 'unitCostPct',
                    diffSource: ["S_1.3.1.1_ต้นทุนบริการผู้ป่วยนอกต่อครั้ง", "S_1.3.1.1_Mean+1SD"]
                },
                {
                    title: "1.3.1.2 Unit Cost for IP",
                    checkHeader: "1.3.1.2 Unit Cost for IP",
                    subIndicators: [
                        { header: "S_1.3.1.2_ต้นทุนบริการผู้ป่วยในต่อ AdjRW", label: "ต้นทุนบริการผู้ป่วยในต่อ AdjRW (บาท)" },
                        { header: "S_1.3.1.2_Mean+1SD", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" }
                    ],
                    sortType: 'unitCostPct',
                    diffSource: ["S_1.3.1.2_ต้นทุนบริการผู้ป่วยในต่อ AdjRW", "S_1.3.1.2_Mean+1SD"]
                },
                {
                    title: "1.3.1.3 LC ค่าแรงบุคลากร",
                    checkHeader: "1.3.1.3 LC ค่าแรงบุคลากร",
                    subIndicators: [
                        { header: "S_1.3.1.3_LC", label: "LC ค่าแรงบุคลากร (บาท)" },
                        { header: "S_1.3.1.3_Avg#LC", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" },
                        { header: "S_1.3.1.3_ผลต่างLC", label: "ผลต่างค่าแรงบุคลากร" }
                    ],
                    sortType: 'lcInvert',
                    sortHeader: "S_1.3.1.3_ผลต่างLC"
                },
                {
                    title: "1.3.1.4 MC ค่ายา",
                    checkHeader: "1.3.1.4 MC ค่ายา",
                    subIndicators: [
                        { header: "S_1.3.1.4_ค่ายา", label: "ค่ายา (บาท)" },
                        { header: "S_1.3.1.4_Avg#ค่ายา", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" },
                        { header: "S_1.3.1.4_ผลต่างค่ายา", label: "ผลต่างค่ายา" }
                    ],
                    sortType: 'lcInvert',
                    sortHeader: "S_1.3.1.4_ผลต่างค่ายา"
                },
                {
                    title: "1.3.1.5 MC ค่าวัสดุวิทยาศาสตร์และการแพทย์",
                    checkHeader: "1.3.1.5 MC ค่าวัสดุวิทยาศาสตร์และการแพทย์",
                    subIndicators: [
                        { header: "S_1.3.1.5_ค่าวัสดุวิทยาศาสตร์และการแพทย์", label: "ค่าวัสดุ (บาท)" },
                        { header: "S_1.3.1.5_Avg#ค่าวัสดุวิทยาศาสตร์และการแพทย์", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" },
                        { header: "S_1.3.1.5_ผลต่างค่าวัสดุวิทยาศาสตร์และการแพทย์", label: "ผลต่างค่าวัสดุ" }
                    ],
                    sortType: 'lcInvert',
                    sortHeader: "S_1.3.1.5_ผลต่างค่าวัสดุวิทยาศาสตร์และการแพทย์"
                },
                {
                    title: "1.3.1.6 MC ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์",
                    checkHeader: "1.3.1.6 MC ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์",
                    subIndicators: [
                        { header: "S_1.3.1.6_ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", label: "ค่าวัสดุ (บาท)" },
                        { header: "S_1.3.1.6_Avg#ค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", label: "ค่าเฉลี่ยของโรงพยาบาลระดับเดียวกัน" },
                        { header: "S_1.3.1.6_ผลต่างค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์", label: "ผลต่าง" }
                    ],
                    sortType: 'lcInvert',
                    sortHeader: "S_1.3.1.6_ผลต่างค่าเวชภัณฑ์มิใช่ยาและวัสดุการแพทย์"
                },
                {
                    title: "1.3.2 คะแนนตรวจสอบงบทดลองเบื้องต้น",
                    checkHeader: "1.3.2 คะแนนตรวจสอบงบทดลองเบื้องต้น",
                    subIndicators: [
                        { header: "S_1.3.2_ผลรวมแม่ข่าย", label: "คะแนนตรวจสอบงบทดลองเบื้องต้น" }
                    ]
                },
                {
                    subHeading: "1.3.3 ผลผลิต (Productivity) เป็นที่ยอมรับ",
                    title: "1.3.3.1 อัตราครองเตียงผู้ป่วยใน ≥ 80 %",
                    checkHeader: "1.3.3.1 อัตราครองเตียงผู้ป่วยใน ≥ 80 %",
                    subIndicators: [
                        { header: "S_1.3.3.1_อัตราครองเตียง", label: "อัตราครองเตียง (%)" }
                    ],
                    sortOrder: "asc"
                },
                {
                    title: "1.3.3.2 SumAdjRW เกินค่ากลางกลุ่มรพ. หรือเพิ่มขึ้น 5 %",
                    checkHeader: "1.3.3.2 SumAdjRW เกินค่ากลางกลุ่มรพ. หรือเพิ่มขึ้น 5 %",
                    subIndicators: [
                        { header: "S_1.3.3.2_Sum AdjRW", label: "Sum AdjRW" },
                        { header: "S_1.3.3.2_ค่ากลางกลุ่ม AdjRW", label: "ค่ากลางกลุ่ม AdjRW" }
                    ],
                    sortType: 'sumAdjRWPct',
                    diffSource: ["S_1.3.3.2_Sum AdjRW", "S_1.3.3.2_ค่ากลางกลุ่ม AdjRW"]
                }
            ]
        },
        {
            section: "2. ตัวชี้วัดผลลัพท์การดำเนินงาน",
            items: [
                {
                    subHeading: "2.1 ความสามารถในการทำกำไร",
                    title: "2.1.1 ประสิทธิภาพในการดำเนินงาน (Operating Margin)",
                    checkHeader: "2.1.1 ประสิทธิภาพในการดำเนินงาน",
                    subIndicators: [
                        { header: "S_2.1.1_ค่ากลางOperating Margin", label: "ค่ากลาง Operating Margin" },
                        { header: "S_2.1.1_Operating Margin", label: "Operating Margin" }
                    ],
                    sortType: 'lcColor',
                    sortHeader: "S_2.1.1_Operating Margin"
                },
                {
                    title: "2.1.2 อัตราผลตอบแทนจากสินทรัพย์ (Return on Asset)",
                    checkHeader: "2.1.2 อัตราผลตอบแทนจากสินทรัพย์",
                    subIndicators: [
                        { header: "S_2.1.2_ค่ากลางReturn on Asset %", label: "ค่ากลาง Return on Asset" },
                        { header: "S_2.1.2_Return on Asset %", label: "Return on Asset" }
                    ],
                    sortType: 'lcColor',
                    sortHeader: "S_2.1.2_Return on Asset %"
                },
                {
                    title: "2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม (EBITDA) ≥0",
                    checkHeader: "2.1.3 ผลกำไรขาดทุนก่อนหักค่าเสื่อม",
                    subIndicators: [
                        { header: "S_2.1.3_EBITDA", label: "EBITDA" }
                    ],
                    sortType: 'lcColor',
                    sortHeader: "S_2.1.3_EBITDA"
                },
                {
                    subHeading: "2.2 การวัดสภาพคล่องทางการเงิน",
                    title: "2.2.1 ทุนสำรองสุทธิ (Net Working Capital) ≥0",
                    checkHeader: "2.2.1 ทุนสำรองสุทธิ",
                    subIndicators: [
                        { header: "S_2.2.1_ทุนสำรองสุทธิ(Networking Capital)", label: "ทุนสำรองสุทธิ(Networking Capital)" }
                    ],
                    sortType: 'lcColor',
                    sortHeader: "S_2.2.1_ทุนสำรองสุทธิ(Networking Capital)"
                },
                {
                    title: "2.2.2 Cash Ratio ≥0.8",
                    checkHeader: "2.2.2 Cash Ratio",
                    subIndicators: [
                        { header: "S_2.2.2_Cash R", label: "Cash Ratio" }
                    ],
                    sortType: 'lcColor',
                    sortHeader: "S_2.2.2_Cash R"
                }
            ]
        }
    ];

    let html = "";

    reportStructure.forEach(sec => {
        html += `<div class="report-section">
                    <div class="report-section-title">${sec.section}</div>`;

        sec.items.forEach(item => {
            if (item.subHeading) {
                html += `<div style="background: #f1f5f9; padding: 0.8rem 1.5rem; font-weight: 600; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 0.95rem;">${item.subHeading}</div>`;
            }
            const passGroup = [];
            const failGroup = [];

            cols.forEach(hospital => {
                if (hospital.isLoading) return;

                const allRows = Object.values(hospital.data);
                let targetRow = null;
                if (allRows.length > 0) {
                    const h = hospital.headersMap ? (hospital.headersMap[comparisonYear] || sourceHeaders) : sourceHeaders;
                    let yIdx = h ? h.findIndex(sh => String(sh).trim() === 'ปี') : 2;
                    let qIdx = h ? h.findIndex(sh => String(sh).trim() === 'ไตรมาส') : 3;

                    for (let r of allRows) {
                        if (String(r[yIdx] || "").trim() === String(comparisonYear) && String(r[qIdx] || "").trim() === String(quarter)) {
                            targetRow = r;
                            break;
                        }
                    }
                }

                if (targetRow) {
                    const h = hospital.headersMap ? (hospital.headersMap[comparisonYear] || sourceHeaders) : sourceHeaders;
                    const checkVal = getCell(targetRow, item.checkHeader, h);
                    const isFail = checkVal === 0 || checkVal === "0" || parseFloat(String(checkVal).replace(/,/g, '')) === 0;

                    const subValues = item.subIndicators.map(si => {
                        let rawVal = getCell(targetRow, si.header, h);
                        let formattedVal = formatValue(rawVal);
                        let num = parseFloat(formattedVal.replace(/,/g, ''));
                        // LC/MC Invert Sign for Difference
                        if (item.sortType === 'lcInvert' && si.header.includes('ผลต่าง')) {
                            num = -num;
                            formattedVal = formatValue(num);
                        }
                        return { label: si.label, value: formattedVal, numeric: isNaN(num) ? -999999 : num };
                    });

                    // Indicators were already processed in subValues map

                    // Add custom "Percentage Difference" column for Unit Cost or SumAdjRW
                    if ((item.sortType === 'unitCostPct' || item.sortType === 'sumAdjRWPct') && item.diffSource) {
                        const val1 = parseFloat(String(getCell(targetRow, item.diffSource[0], h)).replace(/,/g, '')) || 0;
                        const val2 = parseFloat(String(getCell(targetRow, item.diffSource[1], h)).replace(/,/g, '')) || 0;
                        let pct = 0;
                        if (item.sortType === 'unitCostPct') {
                            // ((Mean - Cost) / Mean) * 100
                            pct = val2 === 0 ? 0 : ((val2 - val1) / val2) * 100;
                        } else {
                            // ((Actual - Median) / Median) * 100
                            pct = val2 === 0 ? 0 : ((val1 - val2) / val2) * 100;
                        }
                        const pctStr = formatNumberWithoutRounding(pct) + "%";
                        subValues.push({ label: "ผลต่าง (%)", value: pctStr, numeric: pct });
                    }

                    let sortVal = 0;
                    if (item.sortType === 'unitCostPct' || item.sortType === 'sumAdjRWPct') {
                        sortVal = subValues[subValues.length - 1].numeric;
                    } else if (item.sortHeader) {
                        const sVal = getCell(targetRow, item.sortHeader, h);
                        sortVal = parseFloat(String(sVal).replace(/,/g, '')) || 0;
                    } else if (subValues.length > 0) {
                        sortVal = subValues[0].numeric;
                    }

                    const hData = { name: hospital.name, subValues, sortVal };

                    if (isFail) failGroup.push(hData);
                    else passGroup.push(hData);
                }
            });

            // Sorting Logic based on Requirements
            const sortFunc = (group, isPass) => {
                const type = item.sortType;
                group.sort((a, b) => {
                    if (type === 'ascFailDesc') {
                        return isPass ? (a.sortVal - b.sortVal) : (b.sortVal - a.sortVal);
                    } else if (type === 'nearZero') {
                        const absA = Math.abs(a.sortVal);
                        const absB = Math.abs(b.sortVal);
                        return isPass ? (absA - absB) : (absB - absA);
                    } else if (type === 'unitCostPct' || type === 'sumAdjRWPct' || type === 'lcColor' || type === 'mcColorRed') {
                        // For Pct, EBITDA, OPM, ROA, SumAdjRW: 
                        // Pass: Descending (Greatest first)
                        // Fail: Ascending (Least first - most negative/worst first)
                        return isPass ? (b.sortVal - a.sortVal) : (a.sortVal - b.sortVal);
                    } else if (type === 'lcInvert') {
                        return isPass ? (a.sortVal - b.sortVal) : (b.sortVal - a.sortVal);
                    } else {
                        const o = item.sortOrder === 'asc' ? 1 : -1;
                        return (a.sortVal - b.sortVal) * o;
                    }
                });
            };

            sortFunc(passGroup, true);
            sortFunc(failGroup, false);

            // Add dynamic column header if needed
            let headersHTML = item.subIndicators.map(si => `<th>${si.label}</th>`).join('');
            if (item.sortType === 'unitCostPct' || item.sortType === 'sumAdjRWPct') {
                headersHTML += `<th>ผลต่าง (%)</th>`;
            }

            const renderTable = (group, isPass) => {
                if (group.length === 0) {
                    return isPass ? '<div style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:10px;">- ทุกหน่วยงานไม่ผ่าน -</div>' : '<div style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:10px;">- ทุกหน่วยงานผ่าน -</div>';
                }

                const allSortVals = group.map(g => g.sortVal);
                const min = Math.min(...allSortVals);
                const max = Math.max(...allSortVals);

                return `
                            <div style="overflow-x: auto; width: 100%;">
                                <table class="report-table">
                                    <thead>
                                        <tr>
                                            <th class="hospital-name-cell">โรงพยาบาล</th>
                                            ${headersHTML}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${group.map(g => {
                    let cells = g.subValues.map((sv, idx) => {
                        let style = "";
                        if ((item.sortType === 'unitCostPct' || item.sortType === 'sumAdjRWPct' || item.sortType === 'lcInvert' || item.sortType === 'lcColor' || item.sortType === 'mcColorRed') && idx === g.subValues.length - 1) {
                            const ratio = max === min ? 0 : (g.sortVal - min) / (max - min);
                            if (item.sortType === 'lcInvert') {
                                if (isPass) {
                                    const intensity = Math.round(155 + (ratio * 100));
                                    style = `background-color: rgb(${intensity}, 255, ${intensity});`;
                                } else {
                                    const intensity = Math.round(255 - (ratio * 100));
                                    style = `background-color: rgb(255, ${intensity}, ${intensity});`;
                                }
                            } else {
                                if (isPass) {
                                    const intensity = Math.round(255 - (ratio * 100));
                                    style = `background-color: rgb(${intensity}, 255, ${intensity});`;
                                } else {
                                    const intensity = Math.round(155 + (ratio * 100));
                                    style = `background-color: rgb(255, ${intensity}, ${intensity});`;
                                }
                            }
                        }
                        const valText = formatValue(sv.value);

                        let tdContent = valText;
                        let finalStyle = style;

                        const valStr = String(sv.value).replace(/,/g, '');
                        const isZeroValue = sv.numeric === 0 || valStr === '0' || valStr === '0.00';
                        if (isZeroValue) {
                            finalStyle += "color: #ef4444; font-weight: 700; background-color: #fff1f2;";
                        }

                        return `<td style="${finalStyle}">${tdContent}</td>`;
                    }).join('');
                    return `<tr><td class="hospital-name-cell">${g.name}</td>${cells}</tr>`;
                }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
            };

            html += `
                    <div class="report-item">
                        <div class="report-item-header">📌 ${item.title}</div>
                        <div class="report-grid">
                            <div class="report-col pass">
                                <div class="report-col-title">✅ ผ่าน (${passGroup.length})</div>
                                ${renderTable(passGroup, true)}
                            </div>
                            <div class="report-col fail">
                                <div class="report-col-title">❌ ไม่ผ่าน (${failGroup.length})</div>
                                ${renderTable(failGroup, false)}
                            </div>
                        </div>
                    </div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

// Chart Modal Functions
function chartSelectedRows() {
    const checkboxes = document.querySelectorAll('.row-select-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('กรุณาเลือกรายการที่ต้องการเปรียบเทียบจากตาราง');
        return;
    }
    const indicators = Array.from(checkboxes).map(cb => ({
        code: cb.dataset.code,
        label: cb.dataset.label,
        fullHeader: cb.dataset.fullHeader || `${cb.dataset.code},${cb.dataset.label}`
    }));
    openChartModal(indicators);
}

function openChartModal(input, labelInput = null, unused = null, sourceType = 'mgmt') {
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    // Normalize input to array
    let indicators = [];
    let mainLabel = "";
    let isMulti = false;

    if (Array.isArray(input)) {
        indicators = input;
        mainLabel = "เปรียบเทียบ " + indicators.length + " รายการ";
        isMulti = true;
    } else {
        indicators = [{ code: input, label: labelInput }];
        mainLabel = labelInput;
    }

    // เก็บรายการโรงพยาบาลที่จะแสดงในกราฟ
    const selectedHospitals = comparisonList.filter(h => !h.isLoading).map(h => ({
        code: h.code,
        name: h.name,
        visible: true
    }));

    if (selectedHospitals.length === 0) return;

    // Refactored Data Structure:
    const allChartData = {};
    let allKeys = new Set();
    const yearQuarterInfo = {};

    selectedHospitals.forEach(hosp => {
        const hospital = comparisonList.find(c => c.code === hosp.code);
        if (!hospital) return;

        // Determine data source
        let dataToUse, headersMapToUse;
        if (sourceType === 'mgmt') {
            dataToUse = hospital.mgmtData || {};
            headersMapToUse = hospital.mgmtHeadersMap || {};
        } else {
            dataToUse = hospital.data || {};
            headersMapToUse = hospital.headersMap || {};
        }

        const allRows = Object.values(dataToUse);

        if (!allChartData[hosp.code]) allChartData[hosp.code] = {};

        // Loop through indicators for this hospital
        indicators.forEach(ind => {
            const chartData = {};
            allRows.forEach(row => {
                if (!row) return;

                let h = null;
                for (let year in headersMapToUse) {
                    const headers = headersMapToUse[year];
                    const yIdx = headers.findIndex(h => String(h).trim() === 'ปี');
                    const rowYear = String(row[yIdx >= 0 ? yIdx : 2] || '').trim();
                    if (rowYear === year) {
                        h = headers;
                        break;
                    }
                }
                // Fallback
                if (!h) {
                    const firstYear = Object.keys(headersMapToUse)[0];
                    h = headersMapToUse[firstYear] || Object.values(headersMapToUse)[0]; // Assuming sourceHeaders is Object.values(headersMapToUse)[0]
                }

                let yIdx = h.findIndex(item => String(item).trim() === 'ปี');
                let qIdx = h.findIndex(item => String(item).trim() === 'ไตรมาส');
                if (yIdx === -1) yIdx = 2; // Default
                if (qIdx === -1) qIdx = 3; // Default

                const year = row[yIdx];
                const quarter = row[qIdx];
                const key = `${year}-Q${quarter}`;
                allKeys.add(key);
                yearQuarterInfo[key] = { year, quarter };

                // Find index for this indicator code
                let valIdx = -1;
                // Correct logic to find index based on code
                // The header usually is "Code,Label" or just "Code"
                valIdx = h.findIndex(item => {
                    const s = String(item).trim();
                    return s.startsWith(ind.code + ',') || s === ind.code || (ind.fullHeader && s === ind.fullHeader.trim());
                });


                if (valIdx !== -1) {
                    let valStr = String(row[valIdx]);
                    let val = parseFloat(valStr.replace(/,/g, ''));
                    if (isNaN(val)) val = 0;
                    chartData[key] = { num: val, raw: valStr };
                } else {
                    chartData[key] = { num: 0, raw: '-' }; // Default if not found
                }
            });
            allChartData[hosp.code][ind.code] = chartData;
        });
    });

    const keys = Array.from(allKeys).sort((a, b) => {
        const partsA = a.split('-Q');
        const partsB = b.split('-Q');
        const yA = parseInt(partsA[0]);
        const yB = parseInt(partsB[0]);
        if (yA !== yB) return yA - yB;
        return parseInt(partsA[1]) - parseInt(partsB[1]);
    });
    const labels = keys;
    const tableLabels = [...labels].reverse();


    // Calculate available years for filter
    const availableYears = Array.from(new Set(keys.map(k => parseInt(k.split('-')[0])))).sort((a, b) => a - b);
    const minYear = availableYears[0];
    const maxYear = availableYears[availableYears.length - 1];

    // Capture previous filter values or use persisted state
    if (!window.chartFilterState) window.chartFilterState = { startYear: null, endYear: null, quarter: 'All' };

    // Prioritize current DOM values if exist (during re-render), otherwise use persisted state
    const currentStartYearEl = document.getElementById('chartStartYear');
    const currentEndYearEl = document.getElementById('chartEndYear');
    const currentQuarterEl = document.getElementById('chartQuarterFilter');

    const prevStartYear = currentStartYearEl ? currentStartYearEl.value : (window.chartFilterState.startYear || String(minYear));
    const prevEndYear = currentEndYearEl ? currentEndYearEl.value : (window.chartFilterState.endYear || String(maxYear));
    const prevQuarter = currentQuarterEl ? currentQuarterEl.value : (window.chartFilterState.quarter || 'All');

    // Update state immediately
    window.chartFilterState = { startYear: prevStartYear, endYear: prevEndYear, quarter: prevQuarter };

    // Generate Year Options
    const startYearOptions = availableYears.map(y => {
        const isSelected = (String(y) === String(prevStartYear));
        return `<option value="${y}" ${isSelected ? 'selected' : ''}>${y}</option>`;
    }).join('');

    const endYearOptions = availableYears.map(y => {
        const isSelected = (String(y) === String(prevEndYear));
        return `<option value="${y}" ${isSelected ? 'selected' : ''}>${y}</option>`;
    }).join('');

    const chartFilterHTML = `
                <div style="display:flex; align-items:center; gap:8px; padding-right:1rem; border-right:1px solid var(--border-color); margin-right:1rem;">
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span style="font-size:0.85rem; color:var(--text-secondary);">ปี:</span>
                        <select id="chartStartYear" onchange="window.chartFilterState.startYear=this.value; renderComparisonChart('none')" style="padding:2px 4px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.9rem; min-width:auto;">${startYearOptions}</select>
                        <span style="font-size:0.85rem; color:var(--text-secondary);">-</span>
                        <select id="chartEndYear" onchange="window.chartFilterState.endYear=this.value; renderComparisonChart('none')" style="padding:2px 4px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.9rem; min-width:auto;">${endYearOptions}</select>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px; margin-left:8px;">
                        <span style="font-size:0.85rem; color:var(--text-secondary);">Q:</span>
                        <select id="chartQuarterFilter" onchange="window.chartFilterState.quarter=this.value; renderComparisonChart('none')" style="padding:2px 4px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.9rem; min-width:auto;">
                            <option value="All" ${prevQuarter === 'All' ? 'selected' : ''}>ทั้งหมด</option>
                            <option value="1" ${prevQuarter === '1' ? 'selected' : ''}>Q1</option>
                            <option value="2" ${prevQuarter === '2' ? 'selected' : ''}>Q2</option>
                            <option value="3" ${prevQuarter === '3' ? 'selected' : ''}>Q3</option>
                            <option value="4" ${prevQuarter === '4' ? 'selected' : ''}>Q4</option>
                        </select>
                    </div>
                </div>
            `;

    // --- Generate Flat Items & Sync Structure ---
    const flatItems = [];
    const flatItemsMap = {};
    selectedHospitals.forEach((hosp, hIdx) => {
        indicators.forEach((ind, iIdx) => {
            const globalIdx = hIdx * indicators.length + iIdx;
            const color = getChartColor(globalIdx);
            const id = `${hosp.code}|${ind.code}`;
            const label = isMulti ? `${hosp.name} - ${ind.label}` : hosp.name;

            const item = {
                id,
                hospCode: hosp.code,
                indCode: ind.code,
                label,
                color,
                globalIdx
            };
            flatItems.push(item);
            flatItemsMap[id] = item;
        });
    });

    syncLegendStructure(flatItems);

    const historyTableHTML = `
                <h4 style="margin:0 0 0.8rem 0; font-weight:600; color:var(--text-main); font-size:0.95rem;">ข้อมูลย้อนหลัง (เรียงจากล่าสุด)</h4>
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr style="background:#e0f2fe; border-bottom:2px solid var(--border-color);">
                            <th style="padding:6px; text-align:left; font-weight:600;">ปี/ไตรมาส</th>
                            ${selectedHospitals.map(h =>
        indicators.map(ind => `<th style="padding:6px; text-align:right; font-weight:600; font-size:0.8rem;">${h.name.substring(0, 10)} (${ind.label.substring(0, 10)}..)</th>`).join('')
    ).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableLabels.map((k, i) => `
                            <tr style="border-bottom:1px solid var(--border-color); ${i % 2 === 0 ? 'background:#f8fafc;' : ''}">
                                <td style="padding:6px; text-align:left; font-weight:500;">${k}</td>
                                ${selectedHospitals.map(h =>
        indicators.map(ind => {
            const val = allChartData[h.code][ind.code][k];
            const disp = val ? formatValue(val.raw) : '-';
            return `<td style="padding:6px; text-align:right; font-size:0.8rem;">${disp}</td>`;
        }).join('')
    ).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;

    // Update State
    window.currentChartData = {
        code: isMulti ? indicators[0].code : indicators[0].code,
        indicators: indicators,
        isMulti: isMulti,
        allChartData: allChartData,
        selectedHospitals: selectedHospitals,
        labels: keys,
        keys: keys,
        yearQuarterInfo: yearQuarterInfo,
        options: window.chartOptions || { showValues: true, showDiff: true, useAbbreviated: true },
        flatItemsMap: flatItemsMap // Store for legend rendering
    };


    const existing = document.getElementById('chartModal');
    if (existing) {
        // Update Existing Modal
        document.getElementById('chartModalTitle').textContent = mainLabel;
        document.getElementById('chartModalSubtitle').textContent = `เปรียบเทียบ ${selectedHospitals.length} โรงพยาบาล ${isMulti ? `(${indicators.length} ตัวชี้วัด)` : ''}`;

        renderChartLegend(); // Dynamic Render

        document.getElementById('chartHistoryContainer').innerHTML = historyTableHTML;

        const filterContainer = document.getElementById('chartFilterContainer');
        if (filterContainer) filterContainer.innerHTML = chartFilterHTML;

        const opts = window.currentChartData.options;
        document.getElementById('showChartValues').checked = opts.showValues;
        document.getElementById('showChartDiff').checked = opts.showDiff;
        document.getElementById('showChartAbbreviated').checked = opts.useAbbreviated;

        const navDisplay = isMulti ? 'none' : 'flex';
        document.getElementById('chartNavButtons').style.display = navDisplay;

    } else {
        // Create New Modal
        const navDisplay = isMulti ? 'none' : 'flex';

        const modalHTML = `
                    <div id="chartModal" class="modal" style="display:block;" onclick="if(event.target === this) closeChartModal()">
                        <div class="modal-content" style="max-width:1400px; width:95%; max-height:96vh; display:flex; flex-direction:column;">
                            <div class="modal-header">
                                <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                                    <div>
                                        <h2 id="chartModalTitle" style="margin:0;">${mainLabel}</h2>
                                        <div id="chartModalSubtitle" style="font-size:0.9rem; color:var(--text-secondary); margin-top:4px;">เปรียบเทียบ ${selectedHospitals.length} โรงพยาบาล ${isMulti ? `(${indicators.length} ตัวชี้วัด)` : ''}</div>
                                    </div>
                                    <div style="display:flex; gap: 0.5rem; margin-left: auto; margin-right: 2rem; align-items: center;">
                                        
                                        <!-- Time Filters -->
                                        <div id="chartFilterContainer">
                                            ${chartFilterHTML}
                                        </div>

                                        <div style="display:flex; gap:10px; margin-right: 1rem; border-right: 1px solid var(--border-color); padding-right: 1rem;">
                                            <!-- Show Values Toggle -->
                                            <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="document.getElementById('showChartValues').click()">
                                                <label class="toggle-switch" onclick="event.stopPropagation()">
                                                    <input type="checkbox" id="showChartValues" ${window.currentChartData.options.showValues ? 'checked' : ''} onchange="toggleChartOption('showValues')">
                                                    <span class="slider"></span>
                                                </label>
                                                <span style="font-weight:500; font-size:0.9rem; color:var(--text-main);">แสดงค่า</span>
                                            </div>

                                            <!-- Show Diff Toggle -->
                                            <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="document.getElementById('showChartDiff').click()">
                                                <label class="toggle-switch" onclick="event.stopPropagation()">
                                                    <input type="checkbox" id="showChartDiff" ${window.currentChartData.options.showDiff ? 'checked' : ''} onchange="toggleChartOption('showDiff')">
                                                    <span class="slider"></span>
                                                </label>
                                                <span style="font-weight:500; font-size:0.9rem; color:var(--text-main);">แสดงผลต่าง</span>
                                            </div>

                                            <!-- Abbreviated Numbers Toggle -->
                                            <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="document.getElementById('showChartAbbreviated').click()">
                                                <label class="toggle-switch" onclick="event.stopPropagation()">
                                                    <input type="checkbox" id="showChartAbbreviated" ${window.currentChartData.options.useAbbreviated ? 'checked' : ''} onchange="toggleChartOption('useAbbreviated')">
                                                    <span class="slider"></span>
                                                </label>
                                                <span style="font-weight:500; font-size:0.9rem; color:var(--text-main);">ย่อตัวเลข</span>
                                            </div>
                                        </div>
                                        <div id="chartNavButtons" style="display:${navDisplay}; gap: 0.5rem;">
                                             <button onclick="navigateChart(-1)" style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; background: white; cursor: pointer;">&larr; ก่อนหน้า</button>
                                             <button onclick="navigateChart(1)" style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; background: white; cursor: pointer;">ถัดไป &rarr;</button>
                                        </div>
                                    </div>
                                </div>
                                <span class="close-modal" onclick="closeChartModal()" style="margin-left:auto; position:relative; z-index:4010; font-size:24px; cursor:pointer; padding:5px;">✕</span>
                            </div>
                            <div class="modal-body" style="display: grid; grid-template-columns: 1fr 280px; gap: 2rem; overflow:hidden; flex:1;">
                                <div style="display:flex; flex-direction:column; min-height:0;">
                                    <div style="flex:1; display:flex; align-items:center; justify-content:center; position:relative;">
                                        <canvas id="comparisonChart"></canvas>
                                    </div>
                                </div>
                                <div id="chartLegendContainer" style="overflow-y:auto; background:#f8fafc; padding:1rem; border-radius:8px; border:1px solid var(--border-color);">
                                    <!-- Populated by renderChartLegend() -->
                                </div>
                            </div>
                            <div id="chartHistoryContainer" style="padding:1rem 2rem; border-top:1px solid var(--border-color); background:#f8fafc; max-height:200px; overflow-y:auto;">
                                ${historyTableHTML}
                            </div>
                        </div>
                    </div>
                `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        renderChartLegend(); // Initial Render
    }

    // Small delay to ensure DOM is ready before first render if fresh
    setTimeout(() => renderComparisonChart(), 0);
}



function navigateChart(direction) {
    if (!window.currentChartData) return;
    // Disable navigation if multi-chart
    if (window.currentChartData.isMulti) return;

    const currentCode = window.currentChartData.code;

    let idx = MGMT_HEADERS.findIndex(h => h.startsWith(currentCode + ','));
    if (idx === -1) return;

    let nextIdx = idx;
    let found = false;
    let newCode = null;
    let newLabel = null;

    let count = 0;
    while (!found && count < MGMT_HEADERS.length) {
        nextIdx += direction;
        if (nextIdx < 0 || nextIdx >= MGMT_HEADERS.length) break;

        count++;
        const rawHeader = MGMT_HEADERS[nextIdx];
        const parts = rawHeader.split(',');
        const code = parts[0];
        const label = parts[1] || parts[0];

        if (code === "รหัสโรงพยาบาล" || code === "เขต" || code === "จังหวัด" || code === "ชื่อหน่วยงาน") continue;

        newCode = code;
        newLabel = label;
        found = true;
    }

    if (found && newCode) {
        // closeChartModal(); // Don't close, rely on update mechanism
        openChartModal(newCode, newLabel);
    }
}

function getChartColor(index) {
    const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    return colors[index % colors.length];
}

// Global Set to track hidden hospitals across chart navigations
if (!window.chartHiddenHospitals) {
    window.chartHiddenHospitals = new Set();
}

// Global Options Store
if (!window.chartOptions) {
    window.chartOptions = { showValues: true, showDiff: true, useAbbreviated: true };
}

function toggleChartOption(option) {
    const checkbox = document.getElementById(option === 'showValues' ? 'showChartValues' : (option === 'showDiff' ? 'showChartDiff' : 'showChartAbbreviated'));
    if (checkbox && window.currentChartData) {
        window.currentChartData.options[option] = checkbox.checked;
        // Update Global Options
        if (!window.chartOptions) window.chartOptions = {};
        window.chartOptions[option] = checkbox.checked;

        window.prevChartOptions = window.currentChartData.options;
        // Update UI only (no animation) for toggle options
        renderComparisonChart('none');
    }
}

function renderComparisonChart(animationMode = 'progressive') {
    if (!window.currentChartData) return;
    const { code, label, allChartData, selectedHospitals, labels, yearQuarterInfo, indicators, isMulti } = window.currentChartData;

    setTimeout(() => {
        const ctx = document.getElementById('comparisonChart');
        if (ctx && window.Chart) {

            // --- Filtering Logic ---
            const startYearEl = document.getElementById('chartStartYear');
            const endYearEl = document.getElementById('chartEndYear');
            const quarterFilterEl = document.getElementById('chartQuarterFilter');

            let filteredLabels = labels;

            if (startYearEl && endYearEl && quarterFilterEl) {
                const startYear = parseInt(startYearEl.value);
                const endYear = parseInt(endYearEl.value);
                const qFilter = quarterFilterEl.value; // "All", "1", "2", "3", "4"

                filteredLabels = labels.filter(label => {
                    const [yearStr, qStr] = label.split('-Q');
                    const year = parseInt(yearStr);
                    // qStr is "1", "2", etc.

                    // Year Range Check
                    if (year < startYear || year > endYear) return false;

                    // Quarter Check
                    if (qFilter !== 'All' && qStr !== qFilter) return false;

                    return true;
                });
            }

            const sortedLabels = filteredLabels; // Use filtered list

            // Animation Configuration based on Mode
            let animationConfig = {};

            if (animationMode === 'progressive') {
                // "Elite Cascade" Animation: Fast, smooth vertical rise with staggered entry
                const delayPerPoint = 20; // ms per point 120
                const pointDuration = 100; // ms for each point to rise1000

                animationConfig = {
                    x: { duration: 0 }, // X position is fixed immediately
                    y: {
                        type: 'number',
                        easing: 'easeOutQuart', // Fast start, very smooth stop
                        duration: pointDuration,
                        from: (ctx) => {
                            if (ctx.type !== 'data') return;
                            // Start from value 0 (bottom axis)
                            return ctx.chart.scales.y.getPixelForValue(0);
                        },
                        delay(ctx) {
                            if (ctx.type !== 'data' || ctx.yStarted) return 0;
                            return ctx.index * delayPerPoint;
                        }
                    },
                    opacity: {
                        duration: pointDuration * 0.8,
                        from: 0,
                        to: 1,
                        easing: 'easeOutQuad',
                        delay(ctx) {
                            if (ctx.type !== 'data') return 0;
                            return ctx.index * delayPerPoint;
                        }
                    }
                };
            } else {
                // No Animation (Instant)
                animationConfig = {
                    duration: 0
                };
            }

            const showValues = window.currentChartData.options.showValues;
            const showDiff = window.currentChartData.options.showDiff;
            const useAbbreviated = window.currentChartData.options.useAbbreviated;

            // Custom Plugin for Drawing Text
            const dataLabelPlugin = {
                id: 'customDataLabel',
                afterDatasetsDraw(chart, args, options) {
                    // อ่านค่า Options ล่าสุดเสมอ
                    const currentOptions = window.currentChartData ? window.currentChartData.options : { showValues: true, showDiff: true, useAbbreviated: true };
                    const showValues = currentOptions.showValues;
                    const showDiff = currentOptions.showDiff;
                    const useAbbreviated = currentOptions.useAbbreviated;

                    const { ctx } = chart;
                    if (!showValues && !showDiff) return;

                    chart.data.datasets.forEach((dataset, i) => {
                        if (!chart.isDatasetVisible(i) || dataset.hidden) return;

                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((element, index) => {
                            if (index === null || dataset.data[index] === null || dataset.data[index] === undefined) return;

                            // Optimization: Don't draw label if point is not yet animated/visible (optional but good for progressive)
                            // But since we use standard animation delay, the point appears with delay.
                            // The plugin runs after draw, so it usually follows.

                            const val = dataset.data[index];
                            const x = element.x;
                            const y = element.y;

                            ctx.save();
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.font = 'bold 11px sans-serif';

                            // Show Value
                            if (showValues) {
                                ctx.fillStyle = dataset.borderColor;
                                ctx.fillText(formatAbbreviatedDirect(val, useAbbreviated), x, y - 8);
                            }

                            // Show Diff
                            if (showDiff && index > 0) {
                                const prevVal = dataset.data[index - 1];
                                if (prevVal !== null && prevVal !== undefined) {
                                    const diff = val - prevVal;
                                    const diffStr = (diff > 0 ? '+' : '') + formatAbbreviatedDirect(diff, useAbbreviated);

                                    ctx.font = '10px sans-serif';
                                    ctx.fillStyle = diff >= 0 ? '#10b981' : '#ef4444';
                                    ctx.fillText(diffStr, x, showValues ? y - 22 : y - 8);
                                }
                            }

                            ctx.restore();
                        });
                    });
                }
            };

            const datasets = [];
            selectedHospitals.forEach((hosp, hIdx) => {
                const isHidden = window.chartHiddenHospitals.has(hosp.code);
                indicators.forEach((ind, iIdx) => {
                    // Use filteredLabels here
                    const dataPoints = filteredLabels.map(k => {
                        const d = allChartData[hosp.code][ind.code][k];
                        return d ? d.num : null;
                    });
                    const globalIdx = hIdx * indicators.length + iIdx;
                    const color = getChartColor(globalIdx);
                    const labelStr = isMulti ? `${hosp.name} - ${ind.label}` : hosp.name;

                    datasets.push({
                        label: labelStr,
                        data: dataPoints,
                        borderColor: color,
                        backgroundColor: color + '20',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: color,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        spanGaps: true,
                        hidden: isHidden,
                        _hospCode: hosp.code,
                        _indCode: ind.code
                    });
                });
            });

            if (window.comparisonChartInstance) {
                const chart = window.comparisonChartInstance;
                chart.data.labels = filteredLabels;
                chart.data.datasets = datasets;

                // Apply Animation Config Dynamically
                chart.options.animation = animationConfig;

                if (animationMode === 'none') {
                    chart.update('none');
                } else {
                    chart.update();
                }
            } else {
                // Initial Create
                if (animationMode === 'none') {
                    animationConfig = { duration: 0 };
                }

                // Create Year Background Zones Plugin
                const yearBackgroundPlugin = {
                    id: 'yearBackgroundZones',
                    beforeDraw(chart) {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const xAxis = chart.scales.x;
                        if (!chartArea || !xAxis) return;

                        // Use visible labels from chart data
                        const currentLabels = chart.data.labels || [];

                        const colors = [
                            'rgba(255, 255, 255, 0)',   // White (Transparent/White)
                            'rgba(209, 213, 219, 0.4)' // More visible Gray
                        ];

                        // Helper to get Fiscal Year from label
                        const getFiscalYearOfIntervalStart = (label) => {
                            const parts = label.split('-');
                            if (parts.length < 2) return parseInt(label);
                            const year = parseInt(parts[0]);
                            const quarter = parseInt(parts[1].replace('Q', ''));
                            return (quarter === 4) ? year + 1 : year;
                        };

                        const totalPoints = currentLabels.length;
                        if (totalPoints === 0) return;

                        // 1. Identify "Milestone Indices" (Boundary Points)
                        const boundaries = new Set();
                        boundaries.add(0);
                        boundaries.add(totalPoints - 1);

                        let lastFY = null;
                        currentLabels.forEach((label, index) => {
                            const fy = getFiscalYearOfIntervalStart(label);
                            if (lastFY !== null && fy !== lastFY) {
                                boundaries.add(index);
                            }
                            lastFY = fy;
                            if (label.includes('-Q4')) {
                                boundaries.add(index + 1);
                            }
                        });

                        // Sort boundaries
                        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

                        // 2. Iterate through intervals between boundaries
                        for (let i = 0; i < sortedBoundaries.length - 1; i++) {
                            const startIndex = sortedBoundaries[i];
                            const endIndex = sortedBoundaries[i + 1];

                            const fiscalYear = getFiscalYearOfIntervalStart(currentLabels[startIndex]);
                            const colorIndex = fiscalYear % colors.length;

                            const xStart = xAxis.getPixelForValue(startIndex);
                            const xEnd = xAxis.getPixelForValue(endIndex);

                            ctx.save();
                            ctx.fillStyle = colors[colorIndex];

                            const width = xEnd - xStart;
                            if (width > 0) {
                                ctx.fillRect(xStart, chartArea.top, width, chartArea.bottom - chartArea.top);

                                ctx.fillStyle = '#6b7280';
                                ctx.font = 'bold 12px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'top';

                                const qFilter = document.getElementById('chartQuarterFilter')?.value;
                                if (!qFilter || qFilter === 'All') {
                                    ctx.fillText(fiscalYear, (xStart + xEnd) / 2, chartArea.bottom + 25);
                                }
                            }
                            ctx.restore();
                        }
                    }
                };

                window.comparisonChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: { messages: [], labels: filteredLabels, datasets: datasets },
                    plugins: [yearBackgroundPlugin, dataLabelPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 30,
                                bottom: 30
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        animation: animationConfig,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        let label = context.dataset.label || '';
                                        if (label) { label += ': '; }
                                        if (context.parsed.y !== null) {
                                            label += formatAbbreviatedDirect(context.parsed.y, useAbbreviated);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    callback: function (val, index) {
                                        const label = this.getLabelForValue(val);
                                        const qFilter = document.getElementById('chartQuarterFilter')?.value;
                                        if (qFilter && qFilter !== 'All') {
                                            return label; // Show full "2567-Q1" for clarity when filtered
                                        }
                                        const parts = label.split('-');
                                        return parts.length > 1 ? parts[1] : parts[0];
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grace: '15%',
                                ticks: {
                                    callback: function (value) {
                                        const currentOptions = window.currentChartData ? window.currentChartData.options : { useAbbreviated: true };
                                        return formatAbbreviatedDirect(value, currentOptions.useAbbreviated);
                                    }
                                }
                            }
                        }
                    }
                });
            }

            if (labels.length > 0) {
                const lastKey = labels[labels.length - 1];
                const info = yearQuarterInfo[lastKey];
                const infoText = info ? `ข้อมูลล่าสุด: ปี ${info.year} ไตรมาส ${info.quarter}` : '';
                const infoDiv = document.getElementById('chartYearQuarterInfo');
                if (infoDiv) infoDiv.textContent = infoText;
            }
        }
    }, 100);
}

function toggleHospitalVisibility(element, code, label) {
    if (!window.currentChartData) return;

    const hospitalCode = element.dataset.hosp || code;

    const isCurrentlyHidden = window.chartHiddenHospitals.has(hospitalCode);
    if (isCurrentlyHidden) {
        window.chartHiddenHospitals.delete(hospitalCode);
    } else {
        window.chartHiddenHospitals.add(hospitalCode);
    }

    renderChartLegend(); // Update UI
    renderComparisonChart('none'); // Re-render chart
}



function closeChartModal() {
    document.body.style.overflow = ''; // Restore background scrolling
    clearChartHighlight(); // Ensure animation stops
    const modal = document.getElementById('chartModal');
    if (modal) modal.remove();
    if (window.comparisonChartInstance) {
        window.comparisonChartInstance.destroy();
        window.comparisonChartInstance = null;
    }
    // Do NOT nullify currentChartData completely, as we might want to preserve some state?
    // Actually, we already sync options to window.chartOptions.
    // So it's safe to nullify, BUT we must ensure window.chartFilterState is NOT nullified.
    window.currentChartData = null;
}

let marqueeInterval = null;
let pulsePhase = 0; // For pulsing effect

function highlightChartSegment(hospCode, indCode) {
    const chart = window.comparisonChartInstance;
    if (!chart) return;

    // Find dataset by our injected metadata
    let targetIndex = -1;
    chart.data.datasets.forEach((ds, i) => {
        if (ds._hospCode === hospCode && ds._indCode === indCode) targetIndex = i;
    });

    if (targetIndex !== -1) {
        if (marqueeInterval) clearInterval(marqueeInterval);

        // Store original properties if not already
        const ds = chart.data.datasets[targetIndex];
        if (!ds._originalColor) ds._originalColor = ds.borderColor;
        if (!ds._originalWidth) ds._originalWidth = ds.borderWidth;

        // Configure for animation
        ds.borderWidth = 5; // Thicker
        ds.borderCapStyle = 'round';

        // Start Animation Loop
        marqueeInterval = setInterval(() => {
            const chartInstance = window.comparisonChartInstance;
            if (!chartInstance) { clearInterval(marqueeInterval); return; }

            const dataset = chartInstance.data.datasets[targetIndex];
            if (!dataset) return;

            // Dash Animation (Running Line)
            pulsePhase -= 1;
            dataset.borderDash = [10, 6];
            dataset.borderDashOffset = pulsePhase;

            // Glow / Pulse Color Effect
            // We can simulate a glow by oscillating brightness or shadow
            // Chart.js canvas shadow support is Tricky, but we can set shadow properties on the dataset context if using a custom plugin, 
            // OR just rely on dash movement + width for now which is robust.
            // Let's add a subtle color pulse if possible, or just keep the high contrast dashed line.
            // The request asks for "beautiful animation to know it's emphasized".

            // Let's stick to the Running Dash + Thickness as it is most performance friendly and clear.
            // We already increased thickness to 5.

            chartInstance.update('none');
        }, 40);
    }
}

function clearChartHighlight() {
    if (marqueeInterval) {
        clearInterval(marqueeInterval);
        marqueeInterval = null;
    }
    const chart = window.comparisonChartInstance;
    if (chart) {
        chart.data.datasets.forEach(ds => {
            // Restore Defaults
            if (ds._originalColor) ds.borderColor = ds._originalColor;
            if (ds._originalWidth) ds.borderWidth = ds._originalWidth;

            ds.borderDash = [];
            ds.borderDashOffset = 0;
            ds.borderCapStyle = 'butt';
        });
        chart.update('none');
    }
}

// --- Legend Grouping Logic ---

function renderChartLegend() {
    const container = document.getElementById('chartLegendContainer');
    if (!container || !window.currentChartData) return;

    // Allow dropping on the container to move to root (ungroup)
    container.ondragover = dragOver;
    container.ondrop = (e) => dropLegendItem(e, '__ROOT__');

    const { flatItemsMap } = window.currentChartData;

    let html = `<h4 style="margin:0 0 1rem 0; font-weight:600; color:var(--text-main);">ตัวเลือกข้อมูล</h4>`;

    window.chartLegendStructure.forEach((item, index) => {
        if (typeof item === 'string') {
            const data = flatItemsMap[item];
            if (data) html += renderLegendItemHTML(data, false);
        } else if (item.type === 'group') {
            html += renderLegendGroupHTML(item, flatItemsMap);
        }
    });
    container.innerHTML = html;
}

function renderLegendItemHTML(data, isNested) {
    const isHidden = window.chartHiddenHospitals && window.chartHiddenHospitals.has(data.hospCode);
    const btnBg = isHidden ? '#f1f5f9' : '#fff';
    const btnBorder = isHidden ? '#cbd5e1' : data.color;
    const indOpacity = isHidden ? '0.3' : '1';

    return `
                <div class="legend-item" 
                    draggable="true" 
                    ondragstart="dragStart(event, '${data.id}')"
                    ondragover="dragOver(event)"
                    ondrop="dropLegendItem(event, '${data.id}')"
                    data-hosp="${data.hospCode}" data-ind="${data.indCode}" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    margin-bottom: 8px;
                    background: ${btnBg};
                    border: 2px solid ${btnBorder};
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    user-select: none;
                    ${isNested ? 'margin-left: 0; margin-bottom: 4px;' : ''}
                "
                onclick="toggleHospitalVisibility(this, '${data.hospCode}', '${data.indCode}')"
                onmouseenter="highlightChartSegment('${data.hospCode}', '${data.indCode}')"
                onmouseleave="clearChartHighlight()">
                    <span style="
                        width: 20px;
                        height: 20px;
                        border-radius: 4px;
                        background: ${data.color};
                        opacity: ${indOpacity};
                        flex-shrink: 0;
                    " class="toggle-indicator"></span>
                    <span style="flex: 1; color: #1e293b; font-size:0.85rem;">${data.label}</span>
                </div>
             `;
}

function renderLegendGroupHTML(group, flatItemsMap) {
    const itemsHTML = group.collapsed ? '' : group.items.map(itemId => {
        const data = flatItemsMap[itemId];
        return data ? renderLegendItemHTML(data, true) : '';
    }).join('');

    const isAllVisible = !group.items.some(itemId => {
        const data = flatItemsMap[itemId];
        return data && window.chartHiddenHospitals.has(data.hospCode);
    });

    const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary-color)"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#94a3b8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    return `
                <div class="legend-group" 
                     ondragover="dragOver(event)" 
                     ondrop="dropLegendItem(event, '__GROUP__${group.id}')">
                    <div class="legend-group-header" 
                         onclick="toggleGroupCollapse('${group.id}')" 
                         style="cursor: pointer; user-select: none;">
                        <button class="group-toggle-btn" style="pointer-events:none;" title="ย่อ/ขยาย">
                            ${group.collapsed ? '▶' : '▼'}
                        </button>
                        <span style="font-weight:600; font-size:0.9rem; flex:1;">${group.name || 'กลุ่มข้อมูล'}</span>
                        <div style="display:flex; gap:4px;">
                            <button class="group-toggle-btn" 
                                onclick="event.stopPropagation(); toggleGroupVisibility('${group.id}', ${!isAllVisible})"
                                style="font-size:1.1rem; display:flex; align-items:center; justify-content:center; width:24px; height:24px;">
                                ${isAllVisible ? eyeOpen : eyeClosed}
                            </button>
                        </div>
                    </div>
                    <div class="legend-group-items" style="display:${group.collapsed ? 'none' : 'block'}">
                        ${itemsHTML}
                    </div>
                </div>
            `;
}

// --- Drag & Drop Handlers ---

function dragStart(e, id) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.target.closest('.legend-item, .legend-group');
    if (target) {
        target.classList.add('drag-over-target');
    }
}

// Remove highlight on drag leave/end is usually needed but simplified here by simple re-render on drop
document.addEventListener('dragenter', (e) => {
    const target = e.target.closest('.legend-item, .legend-group');
    if (target) target.classList.add('drag-over-target');
}, true);

document.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.legend-item, .legend-group');
    if (target) target.classList.remove('drag-over-target');
}, true);

function dropLegendItem(e, targetId) {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    // Ref to state
    let struct = window.chartLegendStructure;
    const flatMap = window.currentChartData ? window.currentChartData.flatItemsMap : {};

    // Helper: Generate Group Name
    const generateGroupName = (ids) => {
        const uniqueNames = new Set();
        ids.forEach(id => {
            const item = flatMap[id];
            if (!item) return;
            let name = item.label;
            // Heuristic to extract Hospital Name if Multi-indicator mode
            if (window.currentChartData.isMulti && name.includes(' - ')) {
                // Assume format "HospName - IndName", take first part
                // If hospital name has " - " this might clip it, but acceptable for short name view
                name = name.split(' - ')[0];
            }
            name = name.replace(/^โรงพยาบาล/, '').replace(/^รพ\./, '').trim();
            if (name) uniqueNames.add(name);
        });
        const arr = Array.from(uniqueNames);
        const n1 = arr[0] || '';
        const n2 = arr[1] || '';

        if (!n1) return 'กลุ่มข้อมูล';
        return `${n1}${n2 ? ', ' + n2 : ''}`;
    };

    // Remove source from its current location
    let sourceItem = null;

    // 1. Check top level
    const topIdx = struct.findIndex(x => x === sourceId);
    if (topIdx !== -1) {
        sourceItem = struct[topIdx];
        struct.splice(topIdx, 1);
    } else {
        // 2. Check inside groups
        struct.forEach(g => {
            if (g.type === 'group') {
                const idx = g.items.indexOf(sourceId);
                if (idx !== -1) {
                    sourceItem = g.items[idx];
                    g.items.splice(idx, 1);
                }
            }
        });
    }
    if (!sourceItem) sourceItem = sourceId;

    // Target Logic
    if (targetId === '__ROOT__') {
        // Dropped outside -> Move to root end
        struct.push(sourceId);
    } else if (targetId.startsWith('__GROUP__')) {
        // Dropped into existing group
        const groupId = targetId.replace('__GROUP__', '');
        const group = struct.find(x => x.type === 'group' && x.id === groupId);
        if (group) {
            group.items.push(sourceId);
            group.collapsed = false;
        } else {
            struct.push(sourceId);
        }
    } else {
        // Target is an item -> create group or insert
        const targetIdx = struct.findIndex(x => x === targetId);

        if (targetIdx !== -1) {
            // Create new Group replacing target
            const newItems = [targetId, sourceId];
            const newGroup = {
                type: 'group',
                id: 'g_' + Date.now(),
                name: generateGroupName(newItems),
                items: newItems,
                collapsed: false
            };
            struct[targetIdx] = newGroup;
        } else {
            // Target might be inside a group
            let handled = false;
            struct.forEach(g => {
                if (g.type === 'group') {
                    const idx = g.items.indexOf(targetId);
                    if (idx !== -1) {
                        // Insert source next to target in the same group
                        g.items.splice(idx + 1, 0, sourceId);
                        handled = true;
                    }
                }
            });
            if (!handled) struct.push(sourceId);
        }
    }

    // Cleanup Logic: Explode single-item groups and Update Persistence
    const finalStruct = [];

    // We need to rebuild savedChartGroups entirely based on the new valid structure
    // But we should preserve 'hidden' groups? 
    // The user wants "Change then change same all". So the current state dictates the global state.
    const newSavedGroups = [];

    struct.forEach(x => {
        if (x.type === 'group') {
            if (x.items.length < 2) {
                // Explode: Group disbanded if < 2 items
                if (x.items.length === 1) finalStruct.push(x.items[0]);
                // It is NOT added to newSavedGroups, so it is effectively deleted from persistence
            } else {
                finalStruct.push(x);

                // Extract Hospital Codes for Universal Persistence
                const hospCodes = new Set();
                x.items.forEach(itemId => {
                    const item = flatMap[itemId];
                    if (item) hospCodes.add(item.hospCode);
                });

                newSavedGroups.push({
                    id: x.id,
                    name: x.name,
                    collapsed: x.collapsed,
                    hospCodes: Array.from(hospCodes)
                });
            }
        } else {
            finalStruct.push(x);
        }
    });

    window.chartLegendStructure = finalStruct;
    window.savedChartGroups = newSavedGroups; // Update Global State

    renderChartLegend();
}

// --- Group State Controls ---

function toggleGroupCollapse(groupId) {
    const group = window.chartLegendStructure.find(x => x.type === 'group' && x.id === groupId);
    if (group) {
        group.collapsed = !group.collapsed;

        // Update Persistence
        const saved = window.savedChartGroups.find(g => g.id === groupId);
        if (saved) saved.collapsed = group.collapsed;

        renderChartLegend();
    }
}

function toggleGroupVisibility(groupId, show) {
    const group = window.chartLegendStructure.find(x => x.type === 'group' && x.id === groupId);
    if (group && window.currentChartData) {
        const { flatItemsMap } = window.currentChartData;
        group.items.forEach(itemId => {
            const data = flatItemsMap[itemId];
            if (data) {
                if (show) window.chartHiddenHospitals.delete(data.hospCode);
                else window.chartHiddenHospitals.add(data.hospCode);
            }
        });
        renderChartLegend(); // Update UI icons
        renderComparisonChart('none'); // Update Chart
    }
}


// --- OPD Data Integration ---
const PROVINCE_MAP = {
    "กรุงเทพมหานคร": "10", "สมุทรปราการ": "11", "นนทบุรี": "12", "ปทุมธานี": "13", "พระนครศรีอยุธยา": "14", "อ่างทอง": "15",
    "ลพบุรี": "16", "สิงห์บุรี": "17", "ชัยนาท": "18", "สระบุรี": "19", "ชลบุรี": "20", "ระยอง": "21", "จันทบุรี": "22",
    "ตราด": "23", "ฉะเชิงเทรา": "24", "ปราจีนบุรี": "25", "นครนายก": "26", "สระแก้ว": "27", "นครราชสีมา": "30",
    "บุรีรัมย์": "31", "สุรินทร์": "32", "ศรีสะเกษ": "33", "อุบลราชธานี": "34", "ยโสธร": "35", "ชัยภูมิ": "36",
    "อำนาจเจริญ": "37", "บึงกาฬ": "38", "หนองบัวลำภู": "39", "ขอนแก่น": "40", "อุดรธานี": "41", "เลย": "42",
    "หนองคาย": "43", "มหาสารคาม": "44", "ร้อยเอ็ด": "45", "กาฬสินธุ์": "46", "สกลนคร": "47", "นครพนม": "48",
    "มุกดาหาร": "49", "เชียงใหม่": "50", "ลำพูน": "51", "ลำปาง": "52", "อุตรดิตถ์": "53", "แพร่": "54",
    "น่าน": "55", "พะเยา": "56", "เชียงราย": "57", "แม่ฮ่องสอน": "58", "นครสวรรค์": "60", "อุทัยธานี": "61",
    "กำแพงเพชร": "62", "ตาก": "63", "สุโขทัย": "64", "พิษณุโลก": "65", "พิจิตร": "66", "เพชรบูรณ์": "67",
    "ราชบุรี": "70", "กาญจนบุรี": "71", "สุพรรณบุรี": "72", "นครปฐม": "73", "สมุทรสาคร": "74", "สมุทรสงคราม": "75",
    "เพชรบุรี": "76", "ประจวบคีรีขันธ์": "77", "นครศรีธรรมราช": "80", "กระบี่": "81", "พังงา": "82", "ภูเก็ต": "83",
    "สุราษฎร์ธานี": "84", "ระนอง": "85", "ชุมพร": "86", "สงขลา": "90", "สตูล": "91", "ตรัง": "92", "พัทลุง": "93",
    "ปัตตานี": "94", "ยะลา": "95", "นราธิวาส": "96"
};

async function fetchMOPHReportData(tableName, provinceCode, year, hospCode) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch("https://opendata.moph.go.th/api/report_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                "tableName": tableName,
                "year": String(year),
                "province": String(provinceCode),
                "type": "json"
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;
        const data = await response.json();

        if (Array.isArray(data)) {
            return data.find(function (item) {
                const code = String(item.hospcode || item.off_id || '').trim();
                const target = String(hospCode || '').trim();
                return code === target;
            });
        }
        return null;
    } catch (e) {
        clearTimeout(timeoutId);
        console.warn(`${tableName} API Error for year ${year}:`, e.name === 'AbortError' ? 'Timeout' : e.message);
        return null;
    }
}

async function loadServiceData(hospital) {
    const container = document.getElementById('opdDataContainer');
    if (!container) return;

    // 1. Ensure we have the correct persistent hospital object reference
    let hospitalItem = hospital;
    if (typeof comparisonList !== 'undefined') {
        const found = comparisonList.find(h => String(h.code) === String(hospital.code));
        if (found) hospitalItem = found;
    }

    // 2. Check Cache
    if (hospitalItem && hospitalItem.serviceData && hospitalItem.serviceData.lastUpdated) {
        // Use pre-loaded data
        console.log(`✨ Using pre-loaded service data for ${hospitalItem.name || hospitalItem.code}`);

        if (!window.currentFinData) window.currentFinData = {};
        window.currentFinData.opdData = hospitalItem.serviceData.opdData || {};
        window.currentFinData.ipdData = hospitalItem.serviceData.ipdData || {};

        // Render the data immediately
        renderServiceDataDisplay(container, hospital);
        return;
    }

    // 3. Fallback: Load data if not pre-loaded
    // Resolve Province Name (handle missing 'p' in comparisonList objects)
    let pName = (hospitalItem.p || "").trim();
    if (!pName && window.hospitalData) {
        const masterHosp = window.hospitalData.find(h => String(h.hospcode) === String(hospital.code));
        if (masterHosp) pName = (masterHosp.province_name || masterHosp.province || "").trim();
    }

    const provinceCode = PROVINCE_MAP[pName];

    if (!provinceCode) {
        container.innerHTML = `<div style="padding:40px; text-align:center; color:#94a3b8; background:#f8fafc; border-radius:12px;">ไม่พบรหัสจังหวัดสำหรับ "${pName}" (รหัส: ${hospital.code})</div>`;
        return;
    }

    // Prepare Years
    let years = [];
    if (window.finFilterState && window.finFilterState.startYear) {
        for (let y = window.finFilterState.startYear; y <= window.finFilterState.endYear; y++) years.push(y);
    } else if (window.currentFinData && window.currentFinData.labels && window.currentFinData.labels.length > 0) {
        years = [...new Set(window.currentFinData.labels.map(l => parseInt(l.split(' ')[0])))];
    } else {
        let curYear = new Date().getFullYear() + 543;
        years = [curYear, curYear - 1, curYear - 2];
    }
    years = years.filter(y => !isNaN(y)).sort();

    if (!window.currentFinData) window.currentFinData = {};
    window.currentFinData.opdData = {};
    window.currentFinData.ipdData = {};

    // Fetch Sequentially for both OPD and IPD
    for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const apiYear = year < 2500 ? year + 543 : year; // Ensure BE for MOPH

        container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:150px; color:#64748b; font-size:0.9rem; flex-direction:column; gap:12px;">
                    <div style="font-weight:600;">กำลังโหลดข้อมูลสถิติบริการปี ${apiYear} (${i + 1}/${years.length})...</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">จังหวัด: ${pName}, รหัส: ${hospital.code}</div>
                </div>`;

        try {
            // OPD Data
            const oData = await fetchMOPHReportData("s_opd_all", provinceCode, apiYear, hospital.code);
            if (oData) {
                const getR = (m) => parseInt(String(oData['result' + m] || '0').replace(/,/g, '')) || 0;
                const getT = (m) => parseInt(String(oData['target' + m] || '0').replace(/,/g, '')) || 0;
                oData._totalResult = (getR('10') + getR('11') + getR('12') + getR('01') + getR('02') + getR('03') + getR('04') + getR('05') + getR('06') + getR('07') + getR('08') + getR('09')) || parseInt(String(oData.result || '0').replace(/,/g, ''));
                oData._totalTarget = (getT('10') + getT('11') + getT('12') + getT('01') + getT('02') + getT('03') + getT('04') + getT('05') + getT('06') + getT('07') + getT('08') + getT('09')) || parseInt(String(oData.target || '0').replace(/,/g, ''));
                window.currentFinData.opdData[year] = oData;
            }

            // IPD Data
            const iData = await fetchMOPHReportData("s_ipd_all", provinceCode, apiYear, hospital.code);
            if (iData) {
                const getR = (m) => parseInt(String(iData['result' + m] || '0').replace(/,/g, '')) || 0;
                const getT = (m) => parseInt(String(iData['target' + m] || '0').replace(/,/g, '')) || 0;
                iData._totalResult = getR('10') + getR('11') + getR('12') + getR('01') + getR('02') + getR('03') + getR('04') + getR('05') + getR('06') + getR('07') + getR('08') + getR('09');
                iData._totalTarget = getT('10') + getT('11') + getT('12') + getT('01') + getT('02') + getT('03') + getT('04') + getT('05') + getT('06') + getT('07') + getT('08') + getT('09');
                window.currentFinData.ipdData[year] = iData;
            }

            // OPD Rights Data (s_op_instype_all) - YEARLY
            const oRightData = await fetchMOPHReportData("s_op_instype_all", provinceCode, apiYear, hospital.code);
            if (oRightData) {
                if (!window.currentFinData.opdData[year]) window.currentFinData.opdData[year] = {};
                window.currentFinData.opdData[year].rights = oRightData;
            }

            // IPD Rights Data (s_ip_instype_all) - YEARLY
            const iRightData = await fetchMOPHReportData("s_ip_instype_all", provinceCode, apiYear, hospital.code);
            if (iRightData) {
                if (!window.currentFinData.ipdData[year]) window.currentFinData.ipdData[year] = {};
                window.currentFinData.ipdData[year].rights = iRightData;
            }
        } catch (err) {
            console.warn(`Year ${year} service fetch failed:`, err);
        }

        if (i < years.length - 1) await new Promise(r => setTimeout(r, 400));
    }

    // 4. Save Fetched Data to Cache (hospitalItem in comparisonList)
    if (hospitalItem) {
        hospitalItem.serviceData = {
            opdData: JSON.parse(JSON.stringify(window.currentFinData.opdData)),
            ipdData: JSON.parse(JSON.stringify(window.currentFinData.ipdData)),
            lastUpdated: Date.now()
        };
    }

    renderServiceDataDisplay(container, hospital);
}

function renderServiceDataDisplay(container, hospital) {
    const hasOPD = window.currentFinData && Object.keys(window.currentFinData.opdData || {}).length > 0;
    const hasIPD = window.currentFinData && Object.keys(window.currentFinData.ipdData || {}).length > 0;

    if (!hasOPD && !hasIPD) {
        container.innerHTML = `
                <div style="padding:40px; text-align:center; color:#94a3b8; background:#f8fafc; border-radius:12px; border:1px dashed #e2e8f0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px; opacity:0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div style="font-weight:600; color:#64748b;">ไม่พบข้อมูลสถิติบริการ (OPD/IPD)</div>
                    <div style="font-size:0.8rem; margin-top:4px;">ระบบ MOPH Open Data อาจไม่มีข้อมูลสำหรับช่วงเลาหรือพื้นที่ที่เลือก</div>
                </div>`;
    } else {
        // Update allRows with the new data
        if (window.currentFinData && window.currentFinData.allRows) {
            const allRows = window.currentFinData.allRows;
            // Determine Max Quarter per Year to map yearly data to the LAST available quarter
            const maxQPerYear = {};
            allRows.forEach(r => {
                const y = parseInt(r.year);
                const q = parseInt(r.quarter);
                if (!maxQPerYear[y] || q > maxQPerYear[y]) maxQPerYear[y] = q;
            });

            allRows.forEach(row => {
                const year = parseInt(row.year);
                const q = parseInt(row.quarter);

                // OPD Processing
                const oD = window.currentFinData.opdData[year];
                if (oD) {
                    const getRMVal = (m) => parseInt(String(oD['result' + m] || '0').replace(/,/g, '')) || 0;
                    const getTMVal = (m) => parseInt(String(oD['target' + m] || '0').replace(/,/g, '')) || 0;

                    const rq1 = getRMVal('10') + getRMVal('11') + getRMVal('12');
                    const rq2 = getRMVal('01') + getRMVal('02') + getRMVal('03');
                    const rq3 = getRMVal('04') + getRMVal('05') + getRMVal('06');
                    const rq4 = getRMVal('07') + getRMVal('08') + getRMVal('09');

                    const tq1 = getTMVal('10') + getTMVal('11') + getTMVal('12');
                    const tq2 = getTMVal('01') + getTMVal('02') + getTMVal('03');
                    const tq3 = getTMVal('04') + getTMVal('05') + getTMVal('06');
                    const tq4 = getTMVal('07') + getTMVal('08') + getTMVal('09');

                    if (q === 1) { row.OPD_Result = rq1; row.OPD_Target = tq1 || parseInt(String(oD.target || '0').replace(/,/g, '')); }
                    else if (q === 2) { row.OPD_Result = rq1 + rq2; row.OPD_Target = (tq1 + tq2) || parseInt(String(oD.target || '0').replace(/,/g, '')); }
                    else if (q === 3) { row.OPD_Result = rq1 + rq2 + rq3; row.OPD_Target = (tq1 + tq2 + tq3) || parseInt(String(oD.target || '0').replace(/,/g, '')); }
                    else { row.OPD_Result = rq1 + rq2 + rq3 + rq4; row.OPD_Target = (tq1 + tq2 + tq3 + tq4) || parseInt(String(oD.target || '0').replace(/,/g, '')); }
                }

                // IPD Processing
                const iD = window.currentFinData.ipdData[year];
                if (iD) {
                    const getRMVal = (m) => parseInt(String(iD['result' + m] || '0').replace(/,/g, '')) || 0;
                    const getTMVal = (m) => parseInt(String(iD['target' + m] || '0').replace(/,/g, '')) || 0;

                    const rq1 = getRMVal('10') + getRMVal('11') + getRMVal('12');
                    const rq2 = getRMVal('01') + getRMVal('02') + getRMVal('03');
                    const rq3 = getRMVal('04') + getRMVal('05') + getRMVal('06');
                    const rq4 = getRMVal('07') + getRMVal('08') + getRMVal('09');

                    const tq1 = getTMVal('10') + getTMVal('11') + getTMVal('12');
                    const tq2 = getTMVal('01') + getTMVal('02') + getTMVal('03');
                    const tq3 = getTMVal('04') + getTMVal('05') + getTMVal('06');
                    const tq4 = getTMVal('07') + getTMVal('08') + getTMVal('09');

                    if (q === 1) { row.IPD_Result = rq1; row.IPD_Target = tq1; }
                    else if (q === 2) { row.IPD_Result = rq1 + rq2; row.IPD_Target = tq1 + tq2; }
                    else if (q === 3) { row.IPD_Result = rq1 + rq2 + rq3; row.IPD_Target = tq1 + tq2 + tq3; }
                    else { row.IPD_Result = rq1 + rq2 + rq3 + rq4; row.IPD_Target = tq1 + tq2 + tq3 + tq4; }

                    // Explicit mapping for IPD Total Stats
                    row.IPD_Admissions = row.IPD_Target;
                    row.IPD_Days = row.IPD_Result;
                }

                // Process Rights Data (Yearly cumulative - apply to ALL available quarters)
                // Note: s_ip_instype_all and s_op_instype_all return YEARLY totals.
                // The user requested to show the same data across all quarters for consistency.
                const oRights = window.currentFinData.opdData[year]?.rights;
                if (oRights) {
                    const p = (k) => parseInt(String(oRights[k] || '0').replace(/,/g, '')) || 0;
                    // Update: Use Person (inscl) for 'Person' chart
                    row.OPD_R_Civil_P = p('inscl1'); row.OPD_R_Civil_V = p('inscl_visit1');
                    row.OPD_R_SS_P = p('inscl2'); row.OPD_R_SS_V = p('inscl_visit2');
                    row.OPD_R_UC_P = p('inscl3'); row.OPD_R_UC_V = p('inscl_visit3');
                    row.OPD_R_Alien_P = p('inscl4'); row.OPD_R_Alien_V = p('inscl_visit4');
                    row.OPD_R_Other_P = p('inscl5'); row.OPD_R_Other_V = p('inscl_visit5');
                }
                const iRights = window.currentFinData.ipdData[year]?.rights;
                if (iRights) {
                    const p = (k) => parseInt(String(iRights[k] || '0').replace(/,/g, '')) || 0;
                    // Update: Use Person (inscl) for 'Person' chart
                    row.IPD_R_Civil_P = p('inscl1'); row.IPD_R_Civil_D = p('inscl_visit1');
                    row.IPD_R_SS_P = p('inscl2'); row.IPD_R_SS_D = p('inscl_visit2');
                    row.IPD_R_UC_P = p('inscl3'); row.IPD_R_UC_D = p('inscl_visit3');
                    row.IPD_R_Alien_P = p('inscl4'); row.IPD_R_Alien_D = p('inscl_visit4');
                    row.IPD_R_Other_P = p('inscl5'); row.IPD_R_Other_D = p('inscl_visit5');
                }
            });
            updateFinancialChart();
        }
        renderServiceStats();
    }
}

function renderServiceStats() {
    const container = document.getElementById('opdDataContainer');
    if (!container) return;
    const opdData = window.currentFinData.opdData;
    const ipdData = window.currentFinData.ipdData;

    let html = `<div style="display:flex; flex-direction:column; gap:24px; padding-top:10px;">`;

    // OPD Table
    if (Object.keys(opdData).length > 0) {
        const years = Object.keys(opdData).sort();
        html += `
                <div class="data-card">
                    <div class="data-card-header">
                        <span>ข้อมูลผู้รับบริการผู้ป่วยนอก (OPD) - MOPH Open Data</span>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ปี พ.ศ.</th>
                                <th class="right">รวม (คน)</th>
                                <th class="right">รวม (ครั้ง)</th>
                                <th class="right">ครั้ง/คน</th>
                            </tr>
                        </thead>
                        <tbody>`;
        years.forEach(y => {
            const d = opdData[y];
            const target = d._totalTarget || 0;
            const result = d._totalResult || 0;
            const rate = target > 0 ? (result / target).toFixed(2) : '-';
            html += `
                        <tr>
                            <td>${y}</td>
                            <td class="right">${formatAbbreviated(target)}</td>
                            <td class="right highlight">${formatAbbreviated(result)}</td>
                            <td class="right">${rate}</td>
                        </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    // IPD Table
    if (Object.keys(ipdData).length > 0) {
        const years = Object.keys(ipdData).sort();
        html += `
                <div class="data-card">
                    <div class="data-card-header">
                        <span>ข้อมูลผู้รับบริการผู้ป่วยใน (IPD) - MOPH & TPS Analysis</span>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ปี พ.ศ.</th>
                                <th class="right">ประชากร (คน)</th>
                                <th class="right">วันนอนรวม</th>
                                <th class="right">วัน/คน</th>
                                <th class="right bg-green-light">Sum AdjRW</th>
                                <th class="right bg-green-light">CMI</th>
                            </tr>
                        </thead>
                        <tbody>`;
        years.forEach(y => {
            const d = ipdData[y];
            const target = d._totalTarget || 0;
            const result = d._totalResult || 0;
            const rate = target > 0 ? (result / target).toFixed(2) : '-';

            // Lookup TPS data directly from raw storage for this year (prefer Q4)
            const hospital = window.currentFinData.hospitalInfo;
            let sumAdjRWVal = '-';
            let cmiVal = '-';

            if (hospital && hospital.data) {
                const tpsRows = Object.values(hospital.data);
                const tpsHMap = hospital.headersMap || {};
                const h = tpsHMap[y] || sourceHeaders;

                // Try to find row for Year y, Quarter 4
                let row = tpsRows.find(r => String(r[2]) === String(y) && String(r[3]) === '4');
                // Fallback to any quarter if Q4 not found
                if (!row) row = tpsRows.find(r => String(r[2]) === String(y));

                if (row && h) {
                    const getVal = (header) => {
                        const idx = h.indexOf(header);
                        if (idx === -1) return '-';
                        const v = row[idx];
                        return (v && v !== '-' && v !== '') ? parseFloat(String(v).replace(/,/g, '')) : '-';
                    };
                    sumAdjRWVal = getVal("S_1.3.1.2_Sum AdjRW");
                    cmiVal = getVal("S_1.3.3.1_CMI");
                }
            }

            const sumAdjRW = sumAdjRWVal !== '-' ? formatAbbreviated(sumAdjRWVal) : '-';
            const cmi = cmiVal !== '-' ? cmiVal.toFixed(4) : '-';

            html += `
                        <tr>
                            <td>${y}</td>
                            <td class="right">${formatAbbreviated(target)}</td>
                            <td class="right highlight-green">${formatAbbreviated(result)}</td>
                            <td class="right">${rate}</td>
                            <td class="right highlight-dark-green">${sumAdjRW}</td>
                            <td class="right highlight-dark-green">${cmi}</td>
                        </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

function openFinancialChartModal(hospitalCode) {
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    const hospital = comparisonList.find(c => c.code === hospitalCode);
    if (!hospital) return;

    const allRows = Object.values(hospital.mgmtData || {});
    if (allRows.length === 0) {
        alert('ไม่พบข้อมูลสำหรับกราฟ');
        return;
    }

    let years = new Set();
    const headersMap = hospital.mgmtHeadersMap || {};

    const rowObjects = allRows.map(row => {
        let h = null;
        // Try to guess headers. Simple approach: use the headers map if key matches a column.
        // But we don't know the year yet if we don't know the index.
        // Chicken and egg.
        // Fallback: use the first available headers to find indices.
        const firstHeaders = (Object.values(headersMap)[0] || sourceHeaders);

        // Find indices
        let yIdx = firstHeaders ? firstHeaders.findIndex(sh => String(sh).trim() === 'ปี') : 2;
        let qIdx = firstHeaders ? firstHeaders.findIndex(sh => String(sh).trim() === 'ไตรมาส') : 3;
        if (yIdx === -1) yIdx = 2;
        if (qIdx === -1) qIdx = 3;

        const yearVal = row[yIdx];
        const quarterVal = row[qIdx];

        // Now refine headers based on the actual year found
        if (headersMap[yearVal]) h = headersMap[yearVal];
        else h = firstHeaders;

        const getVal = (code) => {
            if (!h) return 0;
            let idx = h.findIndex(item => String(item).trim().startsWith(code + ',') || String(item).trim().startsWith(code + ' ') || String(item).trim() === code);
            if (idx === -1) return 0;
            const v = row[idx];
            if (!v || v === '-' || v === '') return 0;
            return parseFloat(String(v).replace(/,/g, ''));
        };

        return {
            year: yearVal,
            quarter: quarterVal,
            Assets: getVal('A1291'),
            CurrentAssets: getVal('A119'),
            Cash: getVal('A1111S'),
            UC_AR: getVal('A11211S'),
            Inventory: getVal('A1131S'),
            NonCurrentAssets: getVal('A129'),
            LandBuild: getVal('A1211010'),
            Equipment: getVal('A1211020'),
            FixedDeposit: getVal('A1211001'),
            Liabilities: getVal('A291'),
            L_Trade: getVal('A2111S'),
            L_Trade_Pharma: getVal('A2111010'),
            L_Trade_MedSupply: getVal('A2111020'),
            L_Trade_Lab: getVal('A2111030'),
            L_Trade_OtherMat: getVal('A2111040'),
            L_Trade_Others: getVal('A2111050') + getVal('A2111060') + getVal('A2111070') + getVal('A2111080') + getVal('A2111090'),
            L_Medical: getVal('A2112S'),
            L_FundDeposit: getVal('A2122020') + getVal('A2122021') + getVal('A2122022') + getVal('A2122023') + getVal('A2122024'),
            L_AccruedExp: getVal('A2131010'),
            L_CurrentOtherAll: getVal('A218'),
            L_NonCurrent: getVal('A29'),
            R_GrandTotal: getVal('A49'),
            R_Medical: getVal('A419S'),
            R_Personnel: getVal('A4201010'),
            R_UC_Total: getVal('A410S'),
            R_UC_OP: getVal('A4101040'),
            R_UC_PP: getVal('A4101043'),
            R_UC_IP: getVal('A4101080'),
            R_UC_CR: getVal('A4102050.30'),
            R_CS: getVal('A4131050.0'),
            R_SS: getVal('A414301S'),
            R_OtherGeneral: getVal('A9010S'),
            E_Med_Labour: getVal('A5001040') + getVal('A5001050') + getVal('A5001050.1') + getVal('A5001050.2') + getVal('A5001060'),
            E_Med_Material: getVal('A500110070'),
            E_Med_Depre: getVal('A5002010') + getVal('A5002020') + getVal('A5002030'),
            E_Med_Total: getVal('A5009D'),
            E_Op_Labour: getVal('A5101010') + getVal('A5101020') + getVal('A5101020.1') + getVal('A5101020.2') + getVal('A5101030'),
            E_Op_Material: getVal('A510107030'),
            E_Op_Depre: getVal('A5102010') + getVal('A5102020') + getVal('A5102030'),
            E_Op_Total: getVal('A519D'),
            E_Other: getVal('A60SS'),
            // Service Statistics (Will be populated by loadServiceData asynchronously)
            OPD_Result: 0,
            OPD_Target: 0,
            IPD_Result: 0,
            IPD_Target: 0,
            // Internal TPS Metrics
            SumAdjRW: (function () {
                const tpsRows = Object.values(hospital.data || {});
                const tpsHMap = hospital.headersMap || {};
                const targetTPSHeader = "S_1.3.1.2_Sum AdjRW";
                const row = tpsRows.find(r => String(r[2]) === String(yearVal) && String(r[3]) === String(quarterVal));
                if (!row) return 0;
                const h = tpsHMap[yearVal] || sourceHeaders;
                const idx = h.indexOf(targetTPSHeader);
                if (idx === -1) return 0;
                const v = row[idx];
                return (v && v !== '-' && v !== '') ? parseFloat(String(v).replace(/,/g, '')) : 0;
            })(),
            CMI: (function () {
                const tpsRows = Object.values(hospital.data || {});
                const tpsHMap = hospital.headersMap || {};
                const targetTPSHeader = "S_1.3.3.1_CMI";
                const row = tpsRows.find(r => String(r[2]) === String(yearVal) && String(r[3]) === String(quarterVal));
                if (!row) return 0;
                const h = tpsHMap[yearVal] || sourceHeaders;
                const idx = h.indexOf(targetTPSHeader);
                if (idx === -1) return 0;
                const v = row[idx];
                return (v && v !== '-' && v !== '') ? parseFloat(String(v).replace(/,/g, '')) : 0;
            })()
        };
    });

    // Store ALL data, filtering happens in updateFinancialChart
    window.currentFinData = {
        title: hospital.name,
        hospitalInfo: hospital, // Store hospital info for OPD fetching
        allRows: rowObjects,
        labels: [] // Will be generated in updateFinancialChart
    };
    window.currentFinHospitalCode = hospitalCode;

    // Determine Years available
    const availableYears = [...new Set(rowObjects.map(r => parseInt(r.year)))].sort((a, b) => a - b);
    const maxYear = availableYears[availableYears.length - 1] || new Date().getFullYear() + 543;
    const minYear = availableYears[0] || maxYear - 10;

    // Default Logic: Last 5 years, matching selected quarter
    // Persist Quarter Selection: use existing window.finFilterState.quarter if exists, otherwise default '4'
    const persistedQ = (window.finFilterState && window.finFilterState.quarter) ? window.finFilterState.quarter : '4';

    // Initialize Global Filter State if not present or reset
    window.finFilterState = {
        startYear: Math.max(minYear, maxYear - 4),
        endYear: maxYear,
        quarter: persistedQ
    };

    window.finGroupState = null;
    window.finSubGroupVisibility = null; // Reset to default (all shown)
    window.finSubItemState = null; // Reset item states
    window.finStackState = null; // Reset stack states (will default to Assets ONLY)

    setupFinancialChartModal();

    // Populate Filters after Modal Setup
    loadServiceData(hospital); // Load Service Data (OPD & IPD)
    const startSel = document.getElementById('finStartYear');
    const endSel = document.getElementById('finEndYear');
    const qSel = document.getElementById('finQuarter');

    if (startSel && endSel && qSel) {
        const opts = availableYears.map(y => `<option value="${y}">${y}</option>`).join('');
        startSel.innerHTML = opts;
        endSel.innerHTML = opts;

        startSel.value = window.finFilterState.startYear;
        endSel.value = window.finFilterState.endYear;
        qSel.value = window.finFilterState.quarter;
    }

    updateFinancialChart();
}

// Global settings
// Global settings
// Global settings
window.showFinValues = true;
window.showFinDiff = true; // Default ON as requested
window.useAbbreviatedNumbers = true;
window.finSortByValue = false; // Add sorting toggle state
window.finGroupState = null; // Replaced single finDetailLevel with per-group state

function closeFinancialChartModal() {
    document.body.style.overflow = ''; // Restore background scrolling
    const modal = document.getElementById('finChartModal');
    if (modal) modal.remove();
    if (window.finChartInstance) {
        window.finChartInstance.destroy();
        window.finChartInstance = null;
    }
}


window.reloadServiceStatistics = async function () {
    const code = window.currentFinHospitalCode;
    console.log("Reloading service stats for:", code);
    if (!code) return;

    // Visual Feedback
    const btn = document.querySelector('span[onclick*="reloadServiceStatistics"]');
    if (btn) {
        btn.style.animation = 'spin 1s linear infinite';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    }

    // Construct a hospital object compatible with loadServiceData
    let hospital = { code: code };

    // Try to find full info to ensure province lookup works
    if (typeof comparisonList !== 'undefined') {
        const found = comparisonList.find(c => String(c.code) === String(code));
        if (found) {
            hospital = found;
            // Clear Cache
            hospital.serviceData = null;
        }
    }

    // Also clear cache in specific hospital item if it wasn't found in comparisonList but exists in global data
    if (window.currentFinData && window.currentFinData.hospitalInfo && String(window.currentFinData.hospitalInfo.code || window.currentFinData.hospitalInfo.c) === String(code)) {
        window.currentFinData.hospitalInfo.serviceData = null;
        // Ensure we have province info
        if (!hospital.p) {
            hospital.p = window.currentFinData.hospitalInfo.p || window.currentFinData.hospitalInfo.province_name;
        }
    }

    const container = document.getElementById('opdDataContainer');
    if (container) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:#64748b; background:#f8fafc; border-radius:8px;"><span class="spinner-sm"></span> กำลังดึงข้อมูลจาก MOPH...</div>`;
    }

    try {
        await loadServiceData(hospital);
    } catch (e) {
        console.error("Reload failed", e);
        if (container) container.innerHTML = `<div style="text-align:center; color:#ef4444;">เกิดข้อผิดพลาด: ${e.message}</div>`;
    } finally {
        if (btn) {
            btn.style.animation = '';
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        }
    }
};

function setupFinancialChartModal() {
    let modal = document.getElementById('finChartModal');
    if (!modal) {
        const modalHTML = `
                <div id="finChartModal" class="modal" style="z-index: 4100; display: block;" onclick="if(event.target === this) closeFinancialChartModal()">
                    <div class="modal-content" style="max-width:1400px; width:95%; height:95vh; display: flex; flex-direction: column;">
                        <div class="modal-header" style="padding: 10px 20px;">
                            <h2 id="finChartTitle" style="font-size:1.1rem; margin:0;"></h2>
                            <span class="close-modal" onclick="closeFinancialChartModal()" style="font-size:24px; cursor:pointer; padding:5px;">&times;</span>
                        </div>
                        
                        <!-- Streamlined Toggle Controls -->
                        <div id="finChartControls" class="modal-controls">
                             
                             <!-- Date Filters -->
                             <div class="control-group">
                                <select id="finStartYear" onchange="window.updateFinFilters()" class="control-select"></select>
                                <span style="color:#64748b;">-</span>
                                <select id="finEndYear" onchange="window.updateFinFilters()" class="control-select"></select>
                                <select id="finQuarter" onchange="window.updateFinFilters()" class="control-select">
                                    <option value="All">ทุกไตรมาส</option>
                                    <option value="1">Q1 (ต.ค. - ธ.ค.)</option>
                                    <option value="2">Q2 (ม.ค. - มี.ค.)</option>
                                    <option value="3">Q3 (เม.ย. - มิ.ย.)</option>
                                    <option value="4">Q4 (ก.ค. - ก.ย.) - ทั้งปี</option>
                                </select>
                             </div>

                             <!-- Display Mode Controls -->
                             <div class="control-group" onclick="document.getElementById('showFinDiffToggle').click()">
                                <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                    <input type="checkbox" id="showFinDiffToggle" checked onchange="window.showFinDiff = this.checked; if(window.finChartInstance) window.finChartInstance.update('none');">
                                    <span class="slider"></span>
                                </label>
                                <span class="control-label">แสดงผลต่าง</span>
                             </div>

                             <div class="control-group" onclick="document.getElementById('showFinValuesToggle').click()">
                                <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                    <input type="checkbox" id="showFinValuesToggle" checked onchange="window.showFinValues = this.checked; if(window.finChartInstance) window.finChartInstance.update('none');">
                                    <span class="slider"></span>
                                </label>
                                <span class="control-label">แสดงค่า</span>
                             </div>

                             <div class="control-group" onclick="document.getElementById('useAbbreviatedToggle').click()">
                                <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                    <input type="checkbox" id="useAbbreviatedToggle" checked onchange="window.useAbbreviatedNumbers = this.checked; if(window.finChartInstance) window.finChartInstance.update('none');">
                                    <span class="slider"></span>
                                </label>
                                <span class="control-label">ย่อตัวเลข</span>
                             </div>

                             <div style="display:flex; align-items:center; gap:8px;" onclick="document.getElementById('finSortToggle').click()">
                                <label class="toggle-switch" style="transform:scale(0.8); transform-origin:left center;" onclick="event.stopPropagation()">
                                    <input type="checkbox" id="finSortToggle" onchange="window.finSortByValue = this.checked; updateFinancialChart();">
                                    <span class="slider"></span>
                                </label>
                                <span class="control-label">เรียงตามผลต่าง</span>
                             </div>
                        </div>

                        <div class="modal-body chart-body-grid">
                            <div class="chart-container-wrapper">
                                <div class="chart-area">
                                    <canvas id="finChartCanvas"></canvas>
                                </div>
                                <div id="opdDataContainer" class="chart-opd-container"></div>
                            </div>
                            <div id="finSidebarContent" class="chart-sidebar">
                                <!-- Sidebar generated by renderFinancialSidebar -->
                            </div>
                        </div>
                    </div>
                </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('finChartModal');
    }

    document.getElementById('finChartTitle').innerText = 'โครงสร้างทางการเงิน: ' + window.currentFinData.title;

    // Reset UI to defaults (or current state)
    if (document.getElementById('showFinValuesToggle')) document.getElementById('showFinValuesToggle').checked = window.showFinValues;
    if (document.getElementById('showFinDiffToggle')) document.getElementById('showFinDiffToggle').checked = window.showFinDiff;
    if (document.getElementById('useAbbreviatedToggle')) document.getElementById('useAbbreviatedToggle').checked = window.useAbbreviatedNumbers;
    if (document.getElementById('finSortToggle')) document.getElementById('finSortToggle').checked = window.finSortByValue;
    if (document.getElementById('finViewLevel')) document.getElementById('finViewLevel').value = window.finDetailLevel;

    updateFinancialChart();
}

// --- Configuration for Financial Chart Hierarchy ---
// Defined globally so it can be used by both chart and sidebar
window.FIN_STRUCTURE = [
    {
        id: 'Assets', label: 'สินทรัพย์ (Assets)', color: '#3b82f6',
        subgroups: [
            {
                id: 'CurrentAssets', label: 'สินทรัพย์หมุนเวียน',
                summary: { label: 'สินทรัพย์หมุนเวียน (Current)', accessor: d => d.CurrentAssets, color: '#3b82f6', border: '#2563eb' },
                items: [
                    { key: 'Cash', label: 'เงินสดและรายการเทียบเท่า', accessor: d => d.Cash, color: '#3b82f6', border: '#2563eb' },
                    { key: 'UC_AR', label: 'ลูกหนี้ค่ารักษา', accessor: d => d.UC_AR, color: '#60a5fa', border: '#3b82f6' },
                    { key: 'Inventory', label: 'ยาและวัสดุคงเหลือ', accessor: d => d.Inventory, color: '#93c5fd', border: '#60a5fa' },
                    { key: 'OtherCurrent', label: 'สินทรัพย์หมุนเวียนอื่น', accessor: d => Math.max(0, d.CurrentAssets - (d.Cash + d.UC_AR + d.Inventory)), color: '#bfdbfe', border: '#93c5fd' }
                ]
            },
            {
                id: 'NonCurrentAssets', label: 'สินทรัพย์ไม่หมุนเวียน',
                summary: { label: 'สินทรัพย์ไม่หมุนเวียน (Non-Current)', accessor: d => d.NonCurrentAssets, color: '#1e3a8a', border: '#172554' },
                items: [
                    { key: 'LandBuild', label: 'ที่ดินและสิ่งปลูกสร้าง', accessor: d => d.LandBuild, color: '#1d4ed8', border: '#1e40af' },
                    { key: 'Equipment', label: 'ครุภัณฑ์', accessor: d => d.Equipment, color: '#1e40af', border: '#1e3a8a' },
                    { key: 'FixedDeposit', label: 'เงินฝากสถาบันการเงิน-งบลงทุน', accessor: d => d.FixedDeposit, color: '#1e3a8a', border: '#172554' },
                    { key: 'OtherNonCurrent', label: 'สินทรัพย์ไม่หมุนเวียนอื่น', accessor: d => Math.max(0, d.NonCurrentAssets - (d.LandBuild + d.Equipment + d.FixedDeposit)), color: '#abc4ff', border: '#93c5fd' }
                ]
            }
        ]
    },
    {
        id: 'Liabilities', label: 'หนี้สิน (Liabilities)', color: '#ef4444',
        subgroups: [
            {
                id: 'CurrentLiabilities', label: 'หนี้สินหมุนเวียน',
                summary: { label: 'หนี้สินหมุนเวียน (Current)', accessor: d => d.L_Trade + d.L_Medical + d.L_CurrentOtherAll, color: '#ef4444', border: '#dc2626' },
                items: [
                    { key: 'L_Trade_Pharma', label: 'เจ้าหนี้การค้าค่ายา', accessor: d => d.L_Trade_Pharma, color: '#ef4444', border: '#dc2626' },
                    { key: 'L_Trade_MedSupply', label: 'เจ้าหนี้ค่าเวชภัณฑ์มิใช่ยา', accessor: d => d.L_Trade_MedSupply, color: '#f87171', border: '#ef4444' },
                    { key: 'L_Trade_Lab', label: 'เจ้าหนี้วัสดุวิทยาศาสตร์', accessor: d => d.L_Trade_Lab, color: '#fca5a5', border: '#f87171' },
                    { key: 'L_Trade_OtherMat', label: 'เจ้าหนี้วัสดุอื่นๆ', accessor: d => d.L_Trade_OtherMat, color: '#fee2e2', border: '#fca5a5' },
                    { key: 'L_Trade_Others', label: 'เจ้าหนี้อื่น', accessor: d => d.L_Trade_Others, color: '#991b1b', border: '#7f1d1d' },
                    { key: 'L_Medical', label: 'เจ้าหนี้ค่ารักษา', accessor: d => d.L_Medical, color: '#666', border: '#333' },
                    { key: 'L_FundDeposit', label: 'เงินกองทุนและเงินรับฝาก', accessor: d => d.L_FundDeposit, color: '#fb7185', border: '#f43f5e' },
                    { key: 'L_AccruedExp', label: 'ค่าใช้จ่ายค้างจ่าย', accessor: d => d.L_AccruedExp, color: '#fda4af', border: '#fb7185' },
                    { key: 'L_OtherCurrent', label: 'หนี้สินหมุนเวียนอื่น', accessor: d => Math.max(0, d.L_CurrentOtherAll - (d.L_FundDeposit + d.L_AccruedExp)), color: '#fecdd3', border: '#fda4af' }
                ]
            },
            {
                id: 'NonCurrentLiabilities', label: 'หนี้สินไม่หมุนเวียน',
                summary: { label: 'หนี้สินไม่หมุนเวียน (Non-Current)', accessor: d => d.L_NonCurrent, color: '#b91c1c', border: '#991b1b' },
                items: [
                    { key: 'L_NonCurrent', label: 'หนี้สินไม่หมุนเวียน', accessor: d => d.L_NonCurrent, color: '#b91c1c', border: '#991b1b' }
                ]
            }
        ]
    },
    {
        id: 'Revenue', label: 'รายได้ (Revenue)', color: '#10b981', stack: 'Revenue',
        subgroups: [
            {
                id: 'UCRevenue', label: 'รวมรายได้ UC',
                summary: { label: 'รวมรายได้ UC (Total)', accessor: d => d.R_UC_Total, color: '#10b981', border: '#059669' },
                items: [
                    { key: 'R_UC_OP', label: 'รายได้ค่ารักษาพยาบาล UC-OP ใน CUP สุทธิ', accessor: d => d.R_UC_OP, color: '#064e3b', border: '#065f46' },
                    { key: 'R_UC_PP', label: 'รายได้ค่ารักษาด้านการสร้างเสริมสุขภาพและป้องกันโรค P&P สุทธิ', accessor: d => d.R_UC_PP, color: '#065f46', border: '#047857' },
                    { key: 'R_UC_IP', label: 'รายได้ค่ารักษาพยาบาล UC-IP เหมาจ่ายรายหัว สุทธิ', accessor: d => d.R_UC_IP, color: '#10b981', border: '#059669' },
                    { key: 'R_UC_CR', label: 'รายได้ค่ารักษา UC - บริการเฉพาะ (CR)- สุทธิ', accessor: d => d.R_UC_CR, color: '#34d399', border: '#10b981' },
                    { key: 'R_UC_Other', label: 'รายได้ UC อื่นๆ', accessor: d => Math.max(0, d.R_UC_Total - (d.R_UC_OP + d.R_UC_PP + d.R_UC_IP + d.R_UC_CR)), color: '#6ee7b7', border: '#34d399' }
                ]
            },
            {
                id: 'CSRevenue', label: 'รวมรายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง',
                summary: { label: 'รวมรายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง', accessor: d => d.R_CS, color: '#2563eb', border: '#1d4ed8' },
                items: [{ key: 'R_CS', label: 'รายได้กรมบัญชีกลาง', accessor: d => d.R_CS, color: '#2563eb', border: '#1d4ed8' }]
            },
            {
                id: 'SSRevenue', label: 'รายได้ค่ารักษาประกันสังคม',
                summary: { label: 'รายได้ค่ารักษาประกันสังคม', accessor: d => d.R_SS, color: '#f59e0b', border: '#d97706' },
                items: [{ key: 'R_SS', label: 'รายได้ประกันสังคม', accessor: d => d.R_SS, color: '#f59e0b', border: '#d97706' }]
            },
            {
                id: 'OtherMedRevenue', label: 'รายได้ค่ารักษาอื่นๆ',
                summary: { label: 'รายได้ค่ารักษาอื่นๆ', accessor: d => Math.max(0, d.R_Medical - (d.R_UC_Total + d.R_CS + d.R_SS)), color: '#a7f3d0', border: '#6ee7b7' },
                items: [{ key: 'R_Medical_Other', label: 'รายได้ค่ารักษาอื่นๆ', accessor: d => Math.max(0, d.R_Medical - (d.R_UC_Total + d.R_CS + d.R_SS)), color: '#a7f3d0', border: '#6ee7b7' }]
            },
            {
                id: 'OtherRevGroup', label: 'รายได้อื่น',
                summary: { label: 'รวมรายได้อื่น', accessor: d => d.R_Personnel + d.R_OtherGeneral, color: '#0d9488', border: '#0f766e' },
                items: [
                    { key: 'R_Personnel', label: 'งบประมาณส่วนบุคลากร', accessor: d => d.R_Personnel, color: '#16a34a', border: '#15803d' },
                    { key: 'R_OtherGeneral', label: 'รายได้อื่นๆ', accessor: d => d.R_OtherGeneral, color: '#14b8a6', border: '#0d9488' }
                ]
            }
        ]
    },
    {
        id: 'Expenses', label: 'ค่าใช้จ่าย (Expenses)', color: '#f59e0b',
        subgroups: [
            {
                id: 'MedicalExpense', label: 'ต้นทุนบริการ',
                summary: { label: 'ต้นทุนบริการ (Medical Cost)', accessor: d => d.E_Med_Total, color: '#92400e', border: '#78350f' },
                items: [
                    { key: 'E_Med_Labour', label: 'ค่าแรงบริการ', accessor: d => d.E_Med_Labour, color: '#78350f', border: '#451a03' },
                    { key: 'E_Med_Material', label: 'ค่าของบริการ', accessor: d => d.E_Med_Material, color: '#92400e', border: '#78350f' },
                    { key: 'E_Med_Depre', label: 'ค่าเสื่อมบริการ', accessor: d => d.E_Med_Depre, color: '#b45309', border: '#92400e' },
                    { key: 'E_Med_Other', label: 'ค่าใช้สอยบริการอื่น', accessor: d => Math.max(0, d.E_Med_Total - (d.E_Med_Labour + d.E_Med_Material + d.E_Med_Depre)), color: '#d97706', border: '#b45309' }
                ]
            },
            {
                id: 'OperationExpense', label: 'ค่าใช้จ่ายดำเนินงาน',
                summary: { label: 'ค่าใช้จ่ายดำเนินงาน (Op Cost)', accessor: d => d.E_Op_Total, color: '#d97706', border: '#b45309' },
                items: [
                    { key: 'E_Op_Labour', label: 'ค่าแรงสนับสนุน', accessor: d => d.E_Op_Labour, color: '#d97706', border: '#b45309' },
                    { key: 'E_Op_Material', label: 'ค่าของสนับสนุน', accessor: d => d.E_Op_Material, color: '#fbbf24', border: '#d97706' },
                    { key: 'E_Op_Depre', label: 'ค่าเสื่อมสนับสนุน', accessor: d => d.E_Op_Depre, color: '#fcd34d', border: '#fbbf24' },
                    { key: 'E_Op_Other', label: 'ค่าใช้สอยสนับสนุน', accessor: d => Math.max(0, d.E_Op_Total - (d.E_Op_Labour + d.E_Op_Material + d.E_Op_Depre)), color: '#fde68a', border: '#fcd34d' }
                ]
            },
            {
                id: 'OtherExpense', label: 'ค่าใช้จ่ายอื่นๆ',
                summary: { label: 'ค่าใช้จ่ายอื่นๆ (Other)', accessor: d => d.E_Other, color: '#9a3412', border: '#7c2d12' },
                items: [
                    { key: 'E_Other', label: 'รวมค่าใช้จ่ายอื่นๆ', accessor: d => d.E_Other, color: '#9a3412', border: '#7c2d12' }
                ]
            }
        ]
    },
    {
        id: 'Services', label: 'สถิติบริการ (Services)', color: '#6366f1',
        subgroups: [
            {
                id: 'OPDRightPerson', label: 'จำนวนผู้รับบริการ OPD (คน)',
                summary: { label: 'OPD รายสิทธิ (คน)', accessor: d => (d.OPD_R_UC_P || 0) + (d.OPD_R_Civil_P || 0) + (d.OPD_R_SS_P || 0) + (d.OPD_R_Alien_P || 0) + (d.OPD_R_Other_P || 0), color: '#818cf8', border: '#6366f1' },
                items: [
                    { key: 'OPD_R_Civil_P', label: 'ข้าราชการ/รัฐวิสาหกิจ (คน)', accessor: d => d.OPD_R_Civil_P || 0, color: '#2563eb', border: '#1d4ed8' },
                    { key: 'OPD_R_SS_P', label: 'ประกันสังคม (คน)', accessor: d => d.OPD_R_SS_P || 0, color: '#f59e0b', border: '#d97706' },
                    { key: 'OPD_R_UC_P', label: 'UC (คน)', accessor: d => d.OPD_R_UC_P || 0, color: '#10b981', border: '#059669' },
                    { key: 'OPD_R_Alien_P', label: 'ต่างด้าว (คน)', accessor: d => d.OPD_R_Alien_P || 0, color: '#8b5cf6', border: '#7c3aed' },
                    { key: 'OPD_R_Other_P', label: 'อื่นๆ (คน)', accessor: d => d.OPD_R_Other_P || 0, color: '#94a3b8', border: '#64748b' }
                ]
            },
            {
                id: 'OPDRightVisits', label: 'จำนวนรับบริการ OPD (ครั้ง)',
                summary: { label: 'OPD รายสิทธิ (ครั้ง)', accessor: d => (d.OPD_R_UC_V || 0) + (d.OPD_R_Civil_V || 0) + (d.OPD_R_SS_V || 0) + (d.OPD_R_Alien_V || 0) + (d.OPD_R_Other_V || 0), color: '#6366f1', border: '#4f46e5' },
                items: [
                    { key: 'OPD_R_Civil_V', label: 'ข้าราชการ/รัฐวิสาหกิจ (ครั้ง)', accessor: d => d.OPD_R_Civil_V || 0, color: '#2563eb', border: '#1d4ed8' },
                    { key: 'OPD_R_SS_V', label: 'ประกันสังคม (ครั้ง)', accessor: d => d.OPD_R_SS_V || 0, color: '#f59e0b', border: '#d97706' },
                    { key: 'OPD_R_UC_V', label: 'UC (ครั้ง)', accessor: d => d.OPD_R_UC_V || 0, color: '#10b981', border: '#059669' },
                    { key: 'OPD_R_Alien_V', label: 'ต่างด้าว (ครั้ง)', accessor: d => d.OPD_R_Alien_V || 0, color: '#8b5cf6', border: '#7c3aed' },
                    { key: 'OPD_R_Other_V', label: 'อื่นๆ (ครั้ง)', accessor: d => d.OPD_R_Other_V || 0, color: '#94a3b8', border: '#64748b' }
                ]
            },
            {
                id: 'IPDRightPerson', label: 'จำนวนผู้รับบริการ IPD (คน)',
                summary: { label: 'IPD รายสิทธิ (คน)', accessor: d => (d.IPD_R_UC_P || 0) + (d.IPD_R_Civil_P || 0) + (d.IPD_R_SS_P || 0) + (d.IPD_R_Alien_P || 0) + (d.IPD_R_Other_P || 0), color: '#34d399', border: '#059669' },
                items: [
                    { key: 'IPD_R_Civil_P', label: 'ข้าราชการ/รัฐวิสาหกิจ (คน)', accessor: d => d.IPD_R_Civil_P || 0, color: '#2563eb', border: '#1d4ed8' },
                    { key: 'IPD_R_SS_P', label: 'ประกันสังคม (คน)', accessor: d => d.IPD_R_SS_P || 0, color: '#f59e0b', border: '#d97706' },
                    { key: 'IPD_R_UC_P', label: 'UC (คน)', accessor: d => d.IPD_R_UC_P || 0, color: '#10b981', border: '#059669' },
                    { key: 'IPD_R_Alien_P', label: 'ต่างด้าว (คน)', accessor: d => d.IPD_R_Alien_P || 0, color: '#8b5cf6', border: '#7c3aed' },
                    { key: 'IPD_R_Other_P', label: 'อื่นๆ (คน)', accessor: d => d.IPD_R_Other_P || 0, color: '#94a3b8', border: '#64748b' }
                ]
            },
            {
                id: 'IPDRightDays', label: 'จำนวนวันนอน IPD (วัน)',
                summary: { label: 'IPD รายสิทธิ (วัน)', accessor: d => (d.IPD_R_UC_D || 0) + (d.IPD_R_Civil_D || 0) + (d.IPD_R_SS_D || 0) + (d.IPD_R_Alien_D || 0) + (d.IPD_R_Other_D || 0), color: '#10b981', border: '#047857' },
                items: [
                    { key: 'IPD_R_Civil_D', label: 'ข้าราชการ/รัฐวิสาหกิจ (วัน)', accessor: d => d.IPD_R_Civil_D || 0, color: '#2563eb', border: '#1d4ed8' },
                    { key: 'IPD_R_SS_D', label: 'ประกันสังคม (วัน)', accessor: d => d.IPD_R_SS_D || 0, color: '#f59e0b', border: '#d97706' },
                    { key: 'IPD_R_UC_D', label: 'UC (วัน)', accessor: d => d.IPD_R_UC_D || 0, color: '#10b981', border: '#059669' },
                    { key: 'IPD_R_Alien_D', label: 'ต่างด้าว (วัน)', accessor: d => d.IPD_R_Alien_D || 0, color: '#8b5cf6', border: '#7c3aed' },
                    { key: 'IPD_R_Other_D', label: 'อื่นๆ (วัน)', accessor: d => d.IPD_R_Other_D || 0, color: '#94a3b8', border: '#64748b' }
                ]
            }
        ]
    }
];

function updateFinancialChart() {
    if (!window.currentFinData) return;

    // Initialize GLOBAL persistent state objects if they don't exist
    // These states will persist across different hospitals
    if (!window.globalFinGroupState) {
        window.globalFinGroupState = {}; // Key: subgroup.id, Value: 'summary' or 'detailed'
        window.FIN_STRUCTURE.forEach(g => g.subgroups.forEach(sg => window.globalFinGroupState[sg.id] = 'summary'));
    }

    if (!window.globalFinSubItemState) {
        window.globalFinSubItemState = {};
        window.FIN_STRUCTURE.forEach(g => g.subgroups.forEach(sg => sg.items.forEach(item => {
            // Default ON for all items, except within Services where we only want OPD Person Count
            if (g.id === 'Services') {
                window.globalFinSubItemState[item.key] = (sg.id === 'OPDRightPerson');
            } else {
                window.globalFinSubItemState[item.key] = true;
            }
        })));
    }

    if (!window.globalFinStackState) {
        window.globalFinStackState = {};
        window.FIN_STRUCTURE.forEach(g => {
            // 'Assets' and 'Services' are TRUE by default
            window.globalFinStackState[g.id] = (g.id === 'Assets' || g.id === 'Services');
        });
    }

    if (!window.globalFinSubGroupVisibility) {
        window.globalFinSubGroupVisibility = {};
        window.FIN_STRUCTURE.forEach(g => g.subgroups.forEach(sg => {
            if (g.id === 'Services') {
                // Services group: only 'จำนวนผู้รับบริการ OPD (คน)' is visible by default
                window.globalFinSubGroupVisibility[sg.id] = (sg.id === 'OPDRightPerson');
            } else {
                window.globalFinSubGroupVisibility[sg.id] = true;
            }
        }));
    }

    // Point local state references to global state (so all code uses the same state)
    window.finGroupState = window.globalFinGroupState;
    window.finSubItemState = window.globalFinSubItemState;
    window.finStackState = window.globalFinStackState;
    window.finSubGroupVisibility = window.globalFinSubGroupVisibility;

    renderFinancialSidebar();

    // Apply Filters to Data
    if (!window.finFilterState) window.finFilterState = { startYear: 0, endYear: 9999, quarter: 'All' };
    const filter = window.finFilterState;
    const { allRows } = window.currentFinData;

    // Check if allRows exists (backward compat)
    let filteredData = [];
    if (allRows) {
        filteredData = allRows.filter(r => {
            const y = parseInt(r.year);
            if (y < filter.startYear || y > filter.endYear) return false;
            if (filter.quarter !== 'All' && String(r.quarter) !== String(filter.quarter)) return false;
            return true;
        });
        filteredData.sort((a, b) => {
            const dy = a.year - b.year;
            if (dy !== 0) return dy;
            return a.quarter - b.quarter;
        });
    } else {
        // Fallback if allRows not set yet
        filteredData = window.currentFinData.rawData || [];
    }

    // Update Global Data Ref
    const labels = filteredData.map(d => {
        if (filter.quarter === 'All') {
            return d.year + ` Q${d.quarter}`;
        }
        return d.year;
    });
    window.currentFinData.labels = labels;
    window.currentFinData.rawData = filteredData;

    const rawData = filteredData;
    let datasets = [];

    // Helper
    const mkDS = (label, dataMap, color, borderColor, stack, hidden, customKey, subgroupId) => ({
        label,
        data: rawData.map(dataMap),
        backgroundColor: color,
        _originalColor: color, // Store for highlight reset
        borderColor: borderColor,
        _originalBorder: borderColor, // Store for highlight reset
        borderWidth: 1,
        stack,
        hidden: hidden, // Use Chart.js 'hidden' property
        _customKey: customKey, // Store Key for matching
        _subgroupId: subgroupId, // Store Subgroup ID for focus
        yAxisID: (stack === 'Services' || subgroupId === 'OPDStats' || subgroupId === 'IPDStats' || group_id_check === 'Services') ? 'y1' : 'y' // Use second Y-axis for service stats
    });
    // Temp fix for scoping issue in helper above: we pass group.id logic during call

    // Generate Datasets based onConfig
    window.FIN_STRUCTURE.forEach(group => {
        const isStackShown = window.finStackState ? (window.finStackState[group.id] !== false) : true;

        // STANDARD STACK LOGIC:
        // If group has a 'stack' prop (like Revenue), use it. Otherwise use group.id.
        let baseStackId = group.stack || group.id;

        // Sort Subgroups if sorting is enabled
        let sortedSubgroups = [...group.subgroups];
        if (window.finSortByValue && rawData.length > 0) {
            const lastRow = rawData[rawData.length - 1];
            const prevRow = rawData.length > 1 ? rawData[rawData.length - 2] : null;
            const getSubDiff = (sg) => {
                const cur = sg.summary.accessor(lastRow) || 0;
                const prev = prevRow ? (sg.summary.accessor(prevRow) || 0) : 0;
                return Math.abs(cur - prev);
            };
            sortedSubgroups.sort((a, b) => getSubDiff(a) - getSubDiff(b)); // Ascending
        }

        sortedSubgroups.forEach(subgroup => {
            const mode = window.finGroupState[subgroup.id];
            const isSubGroupVisible = window.finSubGroupVisibility ? (window.finSubGroupVisibility[subgroup.id] !== false) : true;
            // Global visibility check: Parent Stack must be ON AND SubGroup must be ON
            const isGroupGenerallyVisible = isStackShown && isSubGroupVisible;

            // FIX FOR Scoping in mkDS yAxisID check
            const isServicesGroup = (group.id === 'Services');

            if (mode === 'summary') {
                // Add Summary Dataset
                const s = subgroup.summary;

                // For Services, we want distinct bars (not stacked) if multiple service subgroups shown.
                // Use subgroup ID as stack if it's Services group.
                let currentStack = baseStackId;
                if (isServicesGroup) {
                    currentStack = subgroup.id;
                }

                // Re-define mkDS call to pass correct yAxisID logic via closure or inline check
                datasets.push({
                    label: s.label,
                    data: rawData.map(s.accessor),
                    backgroundColor: s.color,
                    _originalColor: s.color,
                    borderColor: s.border,
                    _originalBorder: s.border,
                    borderWidth: 1,
                    stack: currentStack,
                    hidden: !isGroupGenerallyVisible,
                    _customKey: subgroup.id,
                    _subgroupId: subgroup.id,
                    yAxisID: isServicesGroup ? 'y1' : 'y'
                });
            } else {
                // Add Detailed Datasets
                let items = subgroup.items;
                if (window.finSortByValue && rawData.length > 0) {
                    const lastRow = rawData[rawData.length - 1];
                    const prevRow = rawData.length > 1 ? rawData[rawData.length - 2] : null;
                    const getDiff = (it) => {
                        const cur = it.accessor(lastRow) || 0;
                        const prev = prevRow ? (it.accessor(prevRow) || 0) : 0;
                        return Math.abs(cur - prev);
                    };
                    items = [...subgroup.items].sort((a, b) => {
                        return getDiff(a) - getDiff(b); // Ascending
                    });
                }

                items.forEach(item => {
                    // Determine visibility based on finSubItemState AND master toggles
                    const isItemChecked = window.finSubItemState ? (window.finSubItemState[item.key] !== false) : true;
                    const isHidden = !isGroupGenerallyVisible || !isItemChecked;

                    // For Services Items: Unique stack per item -> Side-by-side bars
                    let currentStack = baseStackId;
                    if (isServicesGroup) {
                        currentStack = item.key;
                    }

                    datasets.push({
                        label: item.label,
                        data: rawData.map(item.accessor),
                        backgroundColor: item.color,
                        _originalColor: item.color,
                        borderColor: item.border,
                        _originalBorder: item.border,
                        borderWidth: 1,
                        stack: currentStack,
                        hidden: isHidden,
                        _customKey: item.key,
                        _subgroupId: subgroup.id,
                        yAxisID: isServicesGroup ? 'y1' : 'y'
                    });
                });
            }
        });
    });

    // Custom Plugin (unchanged logic, just re-declaring to be safe within closure if needed, but we can reuse)
    const finLabelsPlugin = {
        id: 'finLabelsPlugin',
        afterDatasetsDraw(chart, args, options) {
            if (!window.showFinValues && !window.showFinDiff) return;

            const { ctx } = chart;

            chart.data.datasets.forEach((dataset, i) => {
                if (!chart.isDatasetVisible(i)) return;

                const meta = chart.getDatasetMeta(i);
                meta.data.forEach((element, index) => {
                    const val = dataset.data[index];
                    if (val === null || val === undefined || val === 0) return;

                    const model = element;
                    const height = model.height;
                    const width = model.width;
                    const x = model.x;
                    const y = model.y;
                    const base = model.base;
                    const centerY = (y + base) / 2;

                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 2;

                    if (window.showFinValues && height > 15) {
                        const fontSize = Math.min(11, width / 4.5);
                        ctx.font = `bold ${fontSize}px sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        const valStr = formatAbbreviated(val);

                        if (height > 45) {
                            let shortName = dataset.label.split(' ')[0].replace(/^\d+\./, '');
                            ctx.font = `${fontSize * 0.85}px sans-serif`;
                            const maxWidth = width * 0.95;
                            let nameToDraw = shortName;
                            if (ctx.measureText(nameToDraw).width > maxWidth) {
                                while (nameToDraw.length > 0 && ctx.measureText(nameToDraw + "..").width > maxWidth) {
                                    nameToDraw = nameToDraw.slice(0, -1);
                                }
                                nameToDraw += "..";
                            }
                            ctx.fillText(nameToDraw, x, centerY - fontSize / 1.1);
                            ctx.font = `bold ${fontSize}px sans-serif`;
                            ctx.fillText(valStr, x, centerY + fontSize / 1.1);
                        } else {
                            ctx.fillText(valStr, x, centerY);
                        }
                    }

                    if (window.showFinDiff && index > 0) {
                        const prevVal = dataset.data[index - 1];
                        if (prevVal !== null && prevVal !== undefined) {
                            const diff = val - prevVal;
                            const prevMeta = meta.data[index - 1];
                            const midX = (x + prevMeta.x) / 2;
                            // Calculate midY between the CENTER of current bar and CENTER of previous bar
                            const midY = (centerY + (prevMeta.y + prevMeta.base) / 2) / 2;

                            const sign = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
                            const diffValStr = formatAbbreviated(Math.abs(diff));
                            const diffStr = `${sign} ${diffValStr}`;
                            const color = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : '#64748b');

                            // Highlight Check
                            const hlKey = window.activeFinHighlightKey;
                            const isHL = hlKey && (dataset._customKey === hlKey || dataset.stack === hlKey);

                            // Design Config (Dynamic)
                            const fontSize = isHL ? 13 : 11;
                            const paddingX = isHL ? 10 : 8;
                            const paddingY = isHL ? 6 : 4;

                            ctx.font = `bold ${fontSize}px sans-serif`;
                            const textMetrics = ctx.measureText(diffStr);
                            const textWidth = textMetrics.width;
                            const boxWidth = textWidth + (paddingX * 2);
                            const boxHeight = fontSize + (paddingY * 2);
                            const boxX = midX - boxWidth / 2;
                            const boxY = midY - boxHeight / 2;
                            const radius = 6;

                            // Draw Pill Background with Shadow
                            ctx.save();
                            ctx.shadowColor = isHL ? 'rgba(37, 99, 235, 0.4)' : 'rgba(0, 0, 0, 0.1)';
                            ctx.shadowBlur = isHL ? 12 : 6;
                            ctx.shadowOffsetY = isHL ? 3 : 2;
                            ctx.fillStyle = 'rgba(255, 255, 255, 1)';

                            ctx.beginPath();
                            if (ctx.roundRect) {
                                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
                            } else {
                                // Fallback for browsers without roundRect
                                ctx.moveTo(boxX + radius, boxY);
                                ctx.lineTo(boxX + boxWidth - radius, boxY);
                                ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
                                ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
                                ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
                                ctx.lineTo(boxX + radius, boxY + boxHeight);
                                ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
                                ctx.lineTo(boxX, boxY + radius);
                                ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
                            }
                            ctx.closePath();
                            ctx.fill();

                            // Border (Extra prominent if highlighted)
                            ctx.strokeStyle = isHL ? color : (color + '40');
                            ctx.lineWidth = isHL ? 2 : 1;
                            ctx.stroke();
                            ctx.restore();

                            // Draw Text
                            ctx.fillStyle = color;
                            ctx.textBaseline = 'middle';
                            ctx.textAlign = 'center';
                            ctx.fillText(diffStr, midX, midY + 1); // +1 for visual centering
                        }
                    }
                    ctx.restore();
                });
            });
        }
    };

    const ctx = document.getElementById('finChartCanvas').getContext('2d');

    // --- SMART UPDATE & ANIMATION LOGIC ---
    // We consider the structure "stable" if the number of datasets and labels remain the same.
    // FORCE RE-CREATE to ensure custom properties (_customKey) are always synced
    const isStable = false;
    // Original Logic Disable:
    // const isStable = window.finChartInstance && ...

    if (isStable) {
        const labelsMatch = window.finChartInstance.data.datasets.every((ds, i) => ds.label === datasets[i].label);
        if (labelsMatch) {
            window.finChartInstance.data.labels = labels;
            window.finChartInstance.data.datasets.forEach((ds, i) => {
                ds.data = datasets[i].data;
                ds.hidden = datasets[i].hidden;
                ds.backgroundColor = datasets[i].backgroundColor;
                ds.borderColor = datasets[i].borderColor;
            });

            // Update main stack visibility from state
            window.FIN_STRUCTURE.forEach(group => {
                const isStackShown = window.finStackState ? (window.finStackState[group.id] !== false) : true;
                window.finChartInstance.data.datasets.forEach((ds, idx) => {
                    if (ds.stack === group.id) {
                        const isItemHiddenByConfig = datasets[idx].hidden;
                        window.finChartInstance.setDatasetVisibility(idx, isStackShown && !isItemHiddenByConfig);
                    }
                });
            });

            // Use default update (smooth transition) for value changes
            window.finChartInstance.update();
            return;
        }
    }

    // Re-create chart for "rising up" animation when structure changes (e.g., summary vs detailed)
    if (window.finChartInstance) window.finChartInstance.destroy();

    // Integrated Highlighter Plugin (Marquee + Glow)
    const finHighlighterPlugin = {
        id: 'finHighlighterPlugin',
        afterDatasetsDraw(chart) {
            const key = window.activeFinHighlightKey;
            if (!key) return;

            const ctx = chart.ctx;
            const now = Date.now();

            // Animation factors
            const dashOffset = (now / 35) % 16;
            const pulse = (Math.sin(now / 250) + 1) / 2;
            const glowBlur = 6 + (pulse * 10);
            const glowColor = `rgba(59, 130, 246, ${0.5 + (pulse * 0.4)})`;

            chart.data.datasets.forEach((ds, i) => {
                if (!chart.isDatasetVisible(i)) return;

                // Match logic: Item Key OR Subgroup ID OR Main Stack ID
                const isMatch = (ds._customKey === key) || (ds._subgroupId === key) || (ds.stack === key);

                if (isMatch) {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((element) => {
                        const { x, y, width, base } = element;
                        const top = Math.min(y, base);
                        const h = Math.abs(base - y);
                        if (h < 1) return;

                        const left = x - width / 2;

                        ctx.save();

                        // 1. Pulsing Outer Glow
                        ctx.shadowColor = '#3b82f6';
                        ctx.shadowBlur = glowBlur;
                        ctx.strokeStyle = glowColor;
                        ctx.lineWidth = 3;
                        ctx.setLineDash([]);
                        ctx.strokeRect(left, top, width, h);

                        // 2. Moving Marquee Dashes
                        ctx.shadowBlur = 0;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.lineDashOffset = -dashOffset;
                        ctx.setLineDash([6, 4]);
                        ctx.strokeRect(left, top, width, h);

                        ctx.restore();
                    });
                }
            });
        }
    };

    window.finChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        plugins: [finHighlighterPlugin, finLabelsPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            barPercentage: 0.85,
            categoryPercentage: 0.9,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    min: 0,
                    title: { display: true, text: 'จำนวนเงิน (บาท)', font: { weight: 'bold' } }
                },
                y1: {
                    stacked: true,
                    beginAtZero: true,
                    min: 0,
                    position: 'right',
                    display: true,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'สถิติบริการ (ครั้ง/คน)', font: { weight: 'bold' } }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw;
                            const prevVal = context.dataIndex > 0 ? context.dataset.data[context.dataIndex - 1] : null;
                            const labelLines = [];
                            labelLines.push(context.dataset.label.split(' ')[0] + ': ' + formatNumberWithoutRounding(val));
                            if (prevVal !== null && prevVal !== undefined) {
                                const diff = val - prevVal;
                                const sign = diff > 0 ? '+' : '';
                                labelLines.push('ผลต่างจากปีก่อน: ' + sign + formatNumberWithoutRounding(diff));
                            }
                            return labelLines;
                        }
                    }
                },
                legend: { display: false }
            }
        }
    });

}

function renderFinancialSidebar() {
    const container = document.getElementById('finSidebarContent');
    if (!container) return;

    let html = '';

    window.FIN_STRUCTURE.forEach(g => {
        const isStackChecked = window.finStackState ? (window.finStackState[g.id] !== false) : true;
        html += `
                <div style="margin-bottom: 24px; opacity: ${isStackChecked ? '1' : '0.6'}; transition: opacity 0.3s;">
                    <!-- Main Group Header -->
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid ${g.color}; cursor: default;"
                         onmouseover="window.highlightFinSegment('${g.id}')" 
                         onmouseout="window.clearFinHighlight()">
                        <span style="font-weight:700; color:${g.color}; font-size:1rem; display:flex; align-items:center; gap:6px;">
                            ${g.label}
                            ${g.id === 'Services' ? `<span onclick="event.stopPropagation(); window.reloadServiceStatistics()" title="โหลดข้อมูลใหม่" style="cursor:pointer; font-size:1.1rem; color:${g.color}; display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:rgba(99, 102, 241, 0.1); margin-left:4px;">↻</span>` : ''}
                        </span>
                        <label class="toggle-switch" style="transform:scale(0.8);">
                            <input type="checkbox" id="stack-${g.id}-check" ${isStackChecked ? 'checked' : ''} onchange="window.toggleFinancialStack('${g.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:8px;">`;

        // Sort Subgroups if sorting is enabled
        let sortedSubgroups = [...g.subgroups];
        if (window.finSortByValue && window.currentFinData.rawData && window.currentFinData.rawData.length > 0) {
            const rData = window.currentFinData.rawData;
            const lastRow = rData[rData.length - 1];
            const prevRow = rData.length > 1 ? rData[rData.length - 2] : null;
            const getSubDiff = (sg) => {
                const cur = sg.summary.accessor(lastRow) || 0;
                const prev = prevRow ? (sg.summary.accessor(prevRow) || 0) : 0;
                return Math.abs(cur - prev);
            };
            sortedSubgroups.sort((a, b) => getSubDiff(b) - getSubDiff(a)); // Descending -> Largest at top of list
        }

        sortedSubgroups.forEach(sg => {
            const isDetailed = window.finGroupState[sg.id] === 'detailed';

            html += `
                    <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:white; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <!-- Subgroup Header (Clickable) -->
                        <div onclick="window.toggleFinGroupState('${sg.id}')" 
                             style="display:flex; align-items:center; justify-content:space-between; padding: 10px 12px; cursor:pointer; background:white; transition:background 0.2s;"
                             onmouseover="this.style.background='#f8fafc'; window.highlightFinSegment('${sg.id}')" 
                             onmouseout="this.style.background='white'; window.clearFinHighlight()"
                             onmouseenter=""
                             onmouseleave="">
                             
                             <div style="display:flex; align-items:center; gap:10px;">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#334155;">${sg.label}</span>
                                    <span style="font-size:0.75rem; color:${isDetailed ? '#3b82f6' : '#64748b'}; font-weight:${isDetailed ? '600' : '400'};">
                                        ${isDetailed ? 'แสดงรายละเอียด (Detailed)' : 'แสดงยอดรวม (Summary)'}
                                    </span>
                                </div>
                             </div>

                             <div style="display:flex; align-items:center; gap:10px;">
                                <label class="toggle-switch" style="transform:scale(0.75);" onclick="event.stopPropagation()">
                                    <input type="checkbox" 
                                           ${(window.finSubGroupVisibility && window.finSubGroupVisibility[sg.id] !== false) ? 'checked' : ''} 
                                           onchange="window.toggleFinSubGroupVisibility('${sg.id}', this.checked)">
                                    <span class="slider"></span>
                                </label>

                                <div style="color:#94a3b8; transition:transform 0.3s; transform: rotate(${isDetailed ? '180deg' : '0deg'});">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                             </div>
                        </div>
                        `;

            if (isDetailed) {
                const isSubGroupOn = (window.finSubGroupVisibility && window.finSubGroupVisibility[sg.id] !== false);
                html += `<div style="background:#f8fafc; padding: 8px 12px; border-top:1px solid #e2e8f0; display:grid; gap:6px; animation: fadeIn 0.3s; opacity: ${isSubGroupOn ? '1' : '0.5'}; pointer-events: ${isSubGroupOn ? 'auto' : 'none'};">`;

                let itemsToRender = sg.items;
                if (window.finSortByValue && window.currentFinData.rawData && window.currentFinData.rawData.length > 0) {
                    const rData = window.currentFinData.rawData;
                    const lastRow = rData[rData.length - 1];
                    const prevRow = rData.length > 1 ? rData[rData.length - 2] : null;
                    const getDiff = (it) => {
                        const cur = it.accessor(lastRow) || 0;
                        const prev = prevRow ? (it.accessor(prevRow) || 0) : 0;
                        return Math.abs(cur - prev);
                    };
                    itemsToRender = [...sg.items].sort((a, b) => {
                        return getDiff(b) - getDiff(a); // Descending -> Largest at top of list
                    });
                }

                itemsToRender.forEach(item => {
                    const isChecked = window.finSubItemState ? (window.finSubItemState[item.key] !== false) : true;

                    html += `
                            <div onclick="event.stopPropagation(); window.toggleFinSubItem('${item.key}', ${!isChecked})" 
                                 class="fin-item-row"
                                 onmouseover="window.highlightFinSegment('${item.key}')"
                                 onmouseout="window.clearFinHighlight()"
                                 style="cursor:pointer; display:flex; align-items:center; gap:10px; padding: 6px 10px; border-radius: 6px; transition: all 0.2s; 
                                        opacity: ${isChecked ? '1' : '0.6'}; 
                                        background: ${isChecked ? 'white' : 'transparent'}; 
                                        border: 1px solid ${isChecked ? '#cbd5e1' : 'transparent'};
                                        box-shadow: ${isChecked ? '0 1px 2px rgba(0,0,0,0.03)' : 'none'};">
                                <div style="width: 12px; height: 12px; border-radius: 3px; background-color: ${item.color}; border: 1px solid rgba(0,0,0,0.1); flex-shrink:0;"></div>
                                <span style="font-size:0.85rem; color:#334155; font-weight:${isChecked ? '500' : '400'}; text-decoration:${isChecked ? 'none' : 'line-through'}; flex:1;">${item.label}</span>
                                ${!isChecked ? '<span style="font-size:0.75rem; color:#94a3b8;">(ซ่อน)</span>' : ''}
                            </div>
                            `;
                });
                html += `</div>`;
            }

            html += `</div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

window.toggleFinGroupState = function (groupId) {
    window.finGroupState[groupId] = window.finGroupState[groupId] === 'summary' ? 'detailed' : 'summary';
    updateFinancialChart();
};

window.toggleFinSubItem = function (itemKey, isChecked) {
    if (!window.finSubItemState) window.finSubItemState = {};
    window.finSubItemState[itemKey] = isChecked;
    updateFinancialChart();
};

window.toggleFinSubGroup = function (subgroupId, isChecked) {
    // Deprecated - kept for safety
    window.toggleFinSubGroupVisibility(subgroupId, isChecked);
};

window.toggleFinSubGroupVisibility = function (subgroupId, isChecked) {
    if (!window.finSubGroupVisibility) window.finSubGroupVisibility = {};
    window.finSubGroupVisibility[subgroupId] = isChecked;

    // Cascade to child items for UI consistency
    const group = window.FIN_STRUCTURE.find(g => g.subgroups.some(sg => sg.id === subgroupId));
    if (group) {
        const subgroup = group.subgroups.find(sg => sg.id === subgroupId);
        if (subgroup) {
            if (!window.finSubItemState) window.finSubItemState = {};
            subgroup.items.forEach(item => {
                window.finSubItemState[item.key] = isChecked;
            });
        }
    }
    updateFinancialChart();
};

window.updateFinFilters = function () {
    const startYear = parseInt(document.getElementById('finStartYear').value);
    const endYear = parseInt(document.getElementById('finEndYear').value);
    const quarter = document.getElementById('finQuarter').value;

    window.finFilterState = {
        startYear, endYear, quarter
    };
    updateFinancialChart();

    // Reload Service Data as years might have changed
    if (window.currentFinData && window.currentFinData.hospitalInfo) {
        loadServiceData(window.currentFinData.hospitalInfo);
    }
};

window.renderFinancialSidebar = renderFinancialSidebar;

window.toggleFinancialStack = function (stackName, isShown, silent = false) {
    // Update state
    if (!window.finStackState) window.finStackState = {};
    window.finStackState[stackName] = isShown;

    // Cascade to all sub-items if not silent
    // (When user manually toggles the main switch, sync all children)
    if (!silent && window.FIN_STRUCTURE) {
        const group = window.FIN_STRUCTURE.find(g => g.id === stackName);
        if (group) {
            group.subgroups.forEach(sg => {
                sg.items.forEach(item => {
                    window.finSubItemState[item.key] = isShown;
                });
            });
        }
    }

    if (!silent) {
        updateFinancialChart();
    } else {
        const chart = window.finChartInstance;
        if (chart) {
            chart.data.datasets.forEach((ds, index) => {
                if (ds.stack === stackName) {
                    chart.setDatasetVisibility(index, isShown);
                }
            });
            chart.update();
        }
    }
};

window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.renderReportContent = renderReportContent;
window.removeHospital = removeHospital;
window.closeChartModal = closeChartModal;
window.closeFinancialChartModal = closeFinancialChartModal;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReportModal();
});

window.selectHospital = selectHospital;
window.toggleRow = toggleRow;
window.removeHospital = removeHospital;
window.renderTableBodyComparison = renderTableBodyComparison;
window.openFinancialChartModal = openFinancialChartModal;
window.updateFinancialChart = updateFinancialChart;
window.setupFinancialChartModal = setupFinancialChartModal;

// Marquee Animation Control Logic
window.activeFinHighlightKey = null;
let finAnimLoop = null;

window.highlightFinSegment = function (key) {
    if (window.activeFinHighlightKey === key) return; // Ignore repeated calls

    window.activeFinHighlightKey = key;
    const chart = window.finChartInstance;
    if (!chart) return;

    if (finAnimLoop) cancelAnimationFrame(finAnimLoop);

    if (key) {
        const loop = () => {
            if (!window.finChartInstance || window.activeFinHighlightKey !== key) {
                if (finAnimLoop) cancelAnimationFrame(finAnimLoop);
                return;
            }
            window.finChartInstance.draw();
            finAnimLoop = requestAnimationFrame(loop);
        };
        finAnimLoop = requestAnimationFrame(loop);
    } else {
        window.finChartInstance.draw();
    }
};

window.clearFinHighlight = function () {
    window.highlightFinSegment(null);
};

document.addEventListener('DOMContentLoaded', function () {
    // Ensure Search Input is interactive
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Fix potential z-index issues directly
        searchInput.style.zIndex = '1001';
        searchInput.parentElement.style.zIndex = '1001';
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            const sugg = document.getElementById('suggestions');
            if (sugg) sugg.style.display = 'none';
        }
        if (e.target.classList.contains('modal')) {
            // Check which modal
            if (e.target.id === 'finChartModal') closeFinancialChartModal();
            if (e.target.id === 'reportModal') closeReportModal();
        }
    });

    if (typeof initialize === 'function') {
        initialize();
    }
});
