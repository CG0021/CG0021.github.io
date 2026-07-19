// ==========================================================
// ส่วนจัดการแสดงผลหน้าจอ งบบริหาร (Management Report UI Module)
// ==========================================================

// Global state variables for Management Report Visualization
window.selectedMgtCodes = window.selectedMgtCodes || ['A1291'];
window.mgtChartType = window.mgtChartType || 'line';
window.mgtActiveView = window.mgtActiveView || 'graph'; // 'graph' or 'table'
window.mgtTrendChartInstance = window.mgtTrendChartInstance || null;
window.mgtSelectSearchQuery = window.mgtSelectSearchQuery || '';

// ==========================================================
// ลำดับการแสดงผลและโครงสร้างความสัมพันธ์ งบบริหาร (Global Constants)
// ==========================================================
const MGT_DISPLAY_ORDER = [
    // กลุ่มสินทรัพย์
    'A1291',       // รวม สินทรัพย์  (Level 0 - top)
    'A119',      //   รวม สินทรัพย์หมุนเวียน  (Level 1)
    'A1111S',  //     รวมเงินสดฯ  (Level 2)
    'A1111040.20', //   รวมเงินสดฯ ไม่รวมบริจาค  (Level 3)
    'A1111010',    //     เงินสด  (Level 4)
    'A1111010.1',  //     เงินทดรองราชการ
    'A1111010.2',  //     บัญชีพัก
    'A1111020',    //     เงินฝากคลัง
    'A1111030',    //     เงินฝากธนาคารพาณิชย์
    'A1111040',    //     เงินฝากสถาบันการเงิน - นอกงบประมาณ
    'A1111040.1',  //     มีวัตถุประสงค์
    'A1111040.2',  //     รอจัดสรร
    'A1111040.3',  //   เงินบริจาค  (Level 3)
    'A11211S', //     รวมลูกหนี้ค่ารักษาพยาบาล  (Level 2)
    'A1121010',    //     UC
    'A1121020',    //     ตามจ่าย UC
    'A1121021',    //     OP Refer
    'A1121030',    //     กองทุนบริการเฉพาะ
    'A1121040',    //     UC-P&P
    'A1121050',    //     กรมบัญชีกลาง OP
    'A1121060',    //     กรมบัญชีกลาง IP
    'A1121060.1',  //     อปท
    'A1121070',    //     ต้นสังกัด
    'A1121080',    //     ประกันสังคม เเครือข่าย
    'A1121090',    //     ประกันสังคม นอกเครือข่าย
    'A1121100',    //     พรบ. ประกันภัย
    'A1121110',    //     แรงงานต่างด้าว
    'A1121120',    //     แรงงานต่างด้าวตามจ่าย
    'A1121130',    //     สิทธิและสถานะ
    'A1121140',    //     อื่นๆ
    'A1122S',  //     รวมลูกหนี้อื่น  (Level 2)
    'A1122010',    //     บริการอื่นๆ
    'A1122020',    //     เงินยืม
    'A1122030',    //     อื่นๆ
    'A1131S',  //     รวมยาและวัสดุ  (Level 2)
    'A1131000',    //     สินค้าคงเหลือ
    'A1131010',    //     ยา
    'A1131020',    //     เวชภัณฑ์มิใช่ยา
    'A1131030',    //     วิทยาศาสตร์การแพทย์
    'A1131040',    //     วัสดุ
    'A118',    //     รวมสินทรัพย์หมุนเวียนอื่นๆ  (Level 2)
    'A1141010',    //     รายได้ค้างรับ
    'A1142060',    //     จ่ายล่วงหน้า
    'A1143020',    //     อื่นๆ
    'A129',      //   รวม สินทรัพย์ไม่หมุนเวียน  (Level 1)
    'A1211001',    //     เงินฝากงบลงทุน
    'A1211010',    //     ที่ดิน/อาคาร
    'A1211020',    //     ครุภัณฑ์
    'A1212010',    //     สินทรัพย์ไม่มีตัวตน
    'A1212020',    //     สินทรัพย์ไม่หมุนเวียนอื่น

    // กลุ่มหนี้สินและทุน
    'A390',        // รวม หนี้สินและทุน  (Level 0 - top)
    'A291',      //   รวม หนี้สิน  (Level 1)
    'A219',    //     รวม หนี้สินหมุนเวียน  (Level 2)
    'A2111S', //       รวมเจ้าหนี้การค้า  (Level 3)
    'A2111010', //         เจ้าหนี้การค้าค่ายา  (Level 4)
    'A2111020', //         เจ้าหนี้การค้าค่าเวชภัณฑ์มิใช่ยา
    'A2111030', //         เจ้าหนี้การค้าค่าเวชภัณฑ์มิใช่ยา-วัสดุวิทยาศาสตร์การแพทย์
    'A2111031', //         เจ้าหนี้การค้า GR/IR ยาและเวชภัณฑ์มิใช่ยา
    'A2111040', //         เจ้าหนี้การค้าค่าวัสดุอื่นๆ
    'A2111050', //         เจ้าหนี้การค้าอื่น
    'A2111060', //         เจ้าหนี้การค้าค่าครุภัณฑ์
    'A2111070', //         เจ้าหนี้การค้าค่าอาคารและสิ่งปลูกสร้าง
    'A2111080', //         เจ้าหนี้- งบลงทุน UC
    'A2111090', //         เจ้าหนี้- เงินบริจาค
    'A2112S', //       รวมเจ้าหนี้ค่ารักษาพยาบาล/เจ้าหนี้ค่าบริการ  (Level 3)
    'A2112010', //         เจ้าหนี้ค่ารักษาพยาบาลตามจ่าย UC สังกัด สธ.
    'A2112020', //         เจ้าหนี้ค่ารักษาพยาบาลตามจ่าย UC นอกสังกัด สธ.
    'A2112030', //         เจ้าหนี้ค่ารักษาตามจ่ายตามจ่าย Non-UC
    'A2112050', //         เจ้าหนี้ค่าบริการจากหน่วยงานภายนอก
    'A218',   //       รวมหนี้สินหมุนเวียนอื่น  (Level 3)
    'A2121030', //         เงินกองทุน ประกันสังคม
    'A2121040.1', //       เงินกองทุน แรงงานต่างด้าว
    'A2122010', //         เงินประกัน
    'A2122020', //         เงินรับฝากทั่วไป
    'A2122021', //         เงินรับฝากกองทุน UC
    'A2122022', //         เงินรับฝากกองทุน UC- สนับสนุนเครือข่าย
    'A2122023', //         เงินรับฝากองทุน UC-งบลงทุน
    'A2122024', //         เงินรับฝากกองทุนแรงงานต่างด้าว
    'A2123010', //         รายได้รับล่วงหน้า
    'A2131010', //         ค่าใช้จ่ายค้างจ่าย
    'A2131011', //         รายได้รอการรับรู้
    'A2132010', //         หนี้สินหมุนเวียนอื่น
    'A29',      //     รวม หนี้สินไม่หมุนเวียน  (Level 2)
    'A2211020', //         เงินประกันระยะยาว
    'A2212020', //         รายได้รอการรับรู้
    'A2212030', //         หนี้สินระยะยาวอื่น
    'A32S',      //   รวมทุน  (Level 1)
    'A3111010', //         ทุนตั้งต้น
    'A3111020', //         ยอดสะสมยกมา
    'A3211010', //         รายได้สูง (ต่ำ) กว่าค่าใช้จ่ายงวดปัจจุบัน

    // กลุ่มรายได้
    'A49',         // รวมรายได้ค่ารักษาพยาบาล/รายได้งบประมาณส่วนบุคลากร/รายได้กองทุน (Level 0)
    'A419S',     //   รวมรายได้ค่ารักษาพยาบาล (Level 1)
    'A410S',   //     รวมรายได้ UC (Level 2)
    'A4101040',   //       รายได้ค่ารักษาพยาบาล UC-OP ใน CUP สุทธิ (Level 3)
    'A4100001',  //         รายได้จากกองทุน  UC - OP เหมาจ่ายต่อผู้มีสิทธิ (Level 4)
    'A4101010',  //         รายได้ค่ารักษาพยาบาล UC-OP ใน CUP (Level 4)
    'A4101020',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายรายหัว กองทุน UC OP ใน CUP (Level 4)
    'A4101021',  //         หัก ส่วนปรับลดค่าแรง OP (Level 4)
    'A4101040.1', //       รายได้จากกองทุน  UC - P&P เหมาจ่ายต่อผุ้มิสิทธิ (Level 3)
    'A4101041',   //       รายได้ค่ารักษาด้านการสร้างเสริมสุขภาพและป้องกันโรค P&P (Level 3)
    'A4101043',   //       รายได้ค่ารักษาด้านการสร้างเสริมสุขภาพและป้องกันโรค P&P สุทธิ (Level 3)
    'A4101042',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายรายหัว - กองทุน UC P&P (Level 4)
    'A4101042.1', //         หัก ส่วนปรับลดค่าแรง P&P (Level 4)
    'A4101080',   //       รายได้ค่ารักษาพยาบาล UC-IP เหมาจ่ายรายหัว สุทธิ (Level 3)
    'A4101050',  //         รายได้ค่ารักษาพยาบาล UC-IP (Level 4)
    'A4101060',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่ายตาม DRG กองทุน UC (Level 4)
    'A4101061',  //         หัก ส่วนปรับลดค่าแรง IP (Level 4)
    'A4101070',  //         บวกส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่ายตาม DRG กองทุน UC (Level 4)
    'A4102040',   //       รายได้จากการเรียกเก็บ UC   สุทธิ (Level 3)
    'A4102010',  //         รายได้จากการเรียกเก็บ UC  นอกCUP ในจังหวัด ต่างจังหวัด ต่างสังกัด สป. (Level 4)
    'A4102020',  //         หักส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการตามจ่าย OP UC (Level 4)
    'A4102030',  //         บวกส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการตามจ่าย OP UC (Level 4)
    'A4102041',   //       รายได้ค่ารักษา OP Refer (Level 3)
    'A4102050.30', //       รายได้ค่ารักษา UC - บริการเฉพาะ (CR)- สุทธิ (Level 3)
    'A4102050',  //         รายได้ค่ารักษา UC - บริการเฉพาะ (CR) (Level 4)
    'A4102050.10', //         หัก  ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่าย UC-บริการเฉพาะ (CR) (Level 4)
    'A4102050.20', //         บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่าย UC-บริการเฉพาะ (CR) (Level 4)
    'A4103040',   //       รายได้จากกองทุน UC - พื้นที่เฉพาะ (Level 3)
    'A4103050',   //       รายได้กองทุน UC P&P อื่น (Level 3)
    'A4103060',   //       รายได้จากกองทุนUC เฉพาะโรคอื่น (Level 3)
    'A4103070',   //       รายได้กองทุน UC- ตามผลงาน (Level 3)
    'A4103080',   //       รายได้กองทุน UC- อื่นๆ (Level 3)
    'A4103100',   //       รายได้กองทุน UC-CF (Level 3)
    'A4103101',   //       รายได้จากการยกหนี้กรณีส่งต่อผู้ป่วยระหว่าง รพ. (Level 3)
    'A4121010',     //     รายได้ค่ารักษาเบิกต้นสังกัด (Level 2)
    'A4131050.0',   //     รวมรายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง (Level 2)
    'A4131010',   //       รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง OP (Level 3)
    'A4131050',   //       รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชี IP  สุทธิ (Level 3)
    'A4131020',  //         รายได้ค่ารักษาเบิกจ่ายตรงกรมบัญชีกลาง IP (Level 4)
    'A4131030',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่ายเบิกจ่ายตรงกรมบัญชีกลาง (Level 4)
    'A4131040',  //         บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่ายเบิกจ่ายตรงกรมบัญชีกลาง (Level 4)
    'A413105S',     //     รวมรายได้ค่ารักษาเบิกจ่ายตรง อปท. (Level 2)
    'A4131050.1', //       รายได้ค่ารักษาเบิกจ่ายตรง อปท. OP (Level 3)
    'A4131050.5', //       รายได้ค่ารักษาเบิกจ่ายตรง อปท. IP สุทธิ (Level 3)
    'A4131050.2', //         รายได้ค่ารักษาเบิกจ่ายตรง อปท. IP (Level 4)
    'A4131050.3', //         หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการจ่ายตรง อปท. (Level 4)
    'A4131050.4', //         บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการจ่ายจรง อปท. (Level 4)
    'A414301S',     //     รายได้ค่ารักษาประกันสังคม (Level 2)
    'A4141040',   //       รายได้ค่ารักษาประกันสังคมเครือข่าย สุทธิ (Level 3)
    'A4141010',  //         รายได้ค่ารักษาประกันสังคมเครือข่าย (Level 4)
    'A4141020',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายรายหัวกองทุนประกันสังคม (Level 4)
    'A4141030',  //         บวกส่วนต่างค่ารักษาที่ต่ำกว่าเหมาจ่ายรายหัวกองทุนประกันสังคม (Level 4)
    'A4142010',   //       รายได้ค่ารักษาประกันสังคมนอกเครือข่าย (Level 3)
    'A4143010',   //       รายได้กองทุนประกันสังคม (Level 3)
    'A4143010.1', //       รายได้ค่าตอบแทนและพัฒนากิจการ (Level 3)
    'A4153S',       //     รายได้ค่ารักษาแรงงานต่างด้าว (Level 2)
    'A4151040',   //       รายได้ค่ารักษาจากแรงงานต่างด้าว สุทธิ (Level 3)
    'A4151010',  //         รายได้ค่ารักษาจากแรงงานต่างด้าว (Level 4)
    'A4151020',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าเหมาจ่ายกองทุนต่างด้าว (Level 4)
    'A4151030',  //         บวก ส่วนต่างค่ารักษาที่ต่ำกว่าเหมาจ่ายกองทุนต่างด้าว (Level 4)
    'A4152010',   //       รายได้ค่ารักษาแรงงานต่างด้าวนอก CUP (Level 3)
    'A4153010',   //       รายได้กองทุนแรงงานต่างด้าว (Level 3)
    'A4153011',   //       รายได้ค่าตรวจสุขภาพแรงงานต่างด้าว (Level 3)
    'A4161S',       //     รายได้เงินอุดหนุนบุคคลที่มีปัญหาสถานะและสิทธิ (Level 2)
    'A4161040',   //       รายได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธินอก CUP  สุทธิ (Level 3)
    'A4161010',  //         รายได้ค่ารักษาบุคคลที่มีปัญหาสถานะและสิทธินอก CUP (Level 4)
    'A4161020',  //         หัก ส่วนต่างค่ารักษาที่สูงกว่าข้อตกลงในการตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ (Level 4)
    'A4161030',  //         บวก ส่วนต่างค่ารักษาที่ต่ำกว่าข้อตกลงในการตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ (Level 4)
    'A4161050',   //       รายได้ค่ารักษา-บุคคลที่มีปัญหาสถานะและสิทธิ OP ใน CUP (Level 3)
    'A4161060',   //       รายได้เงินอุดหนุนเหมาจ่ายรายหัวสำหรับบุคคลที่มีปัญหาสถานะและสิทธิ (Level 3)
    'A4171010',     //     รายได้ค่ารักษาจาก พรบ.ประกันภัยบุคคลที่ 3 (Level 2)
    'A4191010',     //     รายได้ค่ารักษาพยาบาลอื่นๆ (Level 2)
    'A4191011',     //     รายได้จากระบบปฏิบัติการฉุกเฉิน (EMS) (Level 2)
    'A4192010',     //     รายได้ค่าบริการอื่นๆ (Level 2)
    'A4201010',       //   รายได้งบประมาณส่วนบุคลากร (Level 1)

    // กลุ่มต้นทุนค่ารักษาพยาบาล
    'A5009D',      // รวมต้นทุนค่ารักษาพยาบาล (Level 0)
    'A5009N',    //   รวมต้นทุนค่ารักษาพยาบาล(ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย) (Level 1)
    'A5001010',   //     ต้นทุนยา (Level 2)
    'A5001020',   //     ต้นทุนเวชภัณฑ์มิใช่ยา
    'A5001030',   //     ต้นทุนเวชภัณฑ์มิใช่ยา-วัสดุวิทยาศาสตร์การแพทย์
    'A5001031',   //     ต้นทุนวัสดุอื่น
    'A5001040',   //     เงินเดือนและค่าจ้างประจำ(บริการ)
    'A5001050',   //     ค่าจ้างชั่วคราว(บริการ)
    'A5001050.1', //     ค่าจ้างพนักงานกระทรวงสาธารณสุข(บริการ)
    'A5001050.2', //     ค่าจ้างเหมาบุคลากร (บริการ)
    'A5001060',   //     ค่าตอบแทน(บริการ)
    'A500107070', //     ค่าใช้จ่ายบุคลกรอื่น (สัดส่วน 70)
    'A500108070', //     ค่าใช้สอย (สัดส่วน 70)
    'A500109070', //     ค่าสาธารณูปโภค (สัดส่วน 70)
    'A500110070', //     วัสดุใช้ไป (สัดส่วน 70)
    'A5001110',   //     ค่ารักษาตามจ่าย UC
    'A5001120',   //     ค่ารักษาตามจ่ายในสังกัด สป
    'A5001130',   //     ค่ารักษาตามจ่ายต่างสังกัด สป
    'A5001140',   //     ค่ารักษาตามจ่ายแรงงานต่างด้าว
    'A5001150',   //     ค่ารักษาตามจ่ายบุคคลที่มีปัญหาสถานะและสิทธิ
    'A5001160',   //     ค่าจ้างตรวจทางห้องปฏิบัติการ
    'A5002010',  //   ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง (บริการ) (Level 1)
    'A5002020',  //   ค่าเสื่อมราคาครุภัณฑ์(บริการ)
    'A5002030',  //   ค่าตัดจำหน่าย (บริการ)
    'A510D',     //   รายได้สูง (ต่ำ) กว่าต้นทุนค่ารักษาพยาบาลก่อนหักค่าใช้จ่ายดำเนินงาน
    'A501D',     //   รายได้สูง (ต่ำ) กว่าต้นทุนค่ารักษาพยาบาลก่อนหักค่าใช้จ่ายดำเนินงาน
    'A501N',     //   รายได้สูง (ต่ำ) กว่า ต้นทุนค่ารักษาพยาบาลก่อนหักค่าใช้จ่ายดำเนินงาน(ไม่รวมค่าเสือมราคาและค่าตัดจำหน่าย)

    // กลุ่มค่าใช้จ่ายในการดำเนินงาน
    'A519D',       // รวมค่าใช้จ่ายในการดำเนินงาน (Level 0)
    'A519N',     //   รวมค่าใช้จ่ายในการดำเนินงาน (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย) (Level 1)
    'A5101010',   //     เงินเดือนและค่าจ้างประจำ(สนับสนุน) (Level 2)
    'A5101020',   //     ค่าจ้างชั่วคราว(สนับสนุน)
    'A5101020.1', //     ค่าจ้างพนักงานกระทรวงสาธารณสุข(สนับสนุน)
    'A5101020.2', //     ค่าจ้างเหมาบุคลากร (สนับสนุน)
    'A5101030',   //     ค่าตอบแทน(สนับสนุน)
    'A510104030', //     ค่าใช้จ่ายบุคลกรอื่น (สัดส่วน 30)
    'A510105030', //     ค่าใช้สอย (สัดส่วน 30)
    'A510106030', //     ค่าสาธารณูปโภค (สัดส่วน 30)
    'A510107030', //     วัสดุใช้ไป (สัดส่วน 30)
    'A5101090',   //     หนี้สงสัยจะสูญ จากค่ารักษา พรบ.ประกันภัยบุคคลที่ 3
    'A5101100',   //     หนี้สงสัยจะสูญ จากค่ารักษาประกันสังคมนอกเครือข่าย
    'A5101120',   //     หนี้สงสัยจะสูญ จากการเรียกเก็บ UC OPD
    'A5101130',   //     หนี้สงสัยจะสูญ จากค่ารักษาพยาบาลอื่นๆ
    'A5101140',   //     หนี้สงสัยจะสูญ จากค่าบริการอื่นๆ
    'A5101170',   //     หนี้สูญ จากค่ารักษา พรบ.ประกันภัยบุคคลที่ 3
    'A5101190',   //     หนี้สูญ จากค่ารักษาประกันสังคมนอกเครือข่าย
    'A5101201',   //     หนี้สูญ ลูกหนี้ค่ารักษา UC IP
    'A5101210',   //     หนี้สูญ จากการเรียกเก็บ UC OPD
    'A5101240',   //     หนี้สูญ จากค่ารักษาพยาบาลอื่นๆ
    'A5101250',   //     หนี้สูญ จากค่าบริการอื่นๆ
    'A5101260',   //     ค่าใช้จ่ายระหว่างหน่วยงาน (หน่วยเบิกจ่าย)
    'A5101261',   //     ค่าใช้จ่ายอื่น-ค่าใช้จ่ายระหว่างหน่วยงาน
    'A5101270',   //     ค่าใช้จ่ายในการดำเนินงานอื่นๆ
    'A5102010',  //   ค่าเสื่อมราคาอาคารและสิ่งปลูกสร้าง  (สนับสนุน) (Level 1)
    'A5102020',  //   ค่าเสื่อมราคาครุภัณฑ์ (สนับสนุน)
    'A5102030',  //   ค่าตัดจำหน่าย (สนับสนุน)
    'A529D',     //   รายได้สูง (ต่ำ) กว่า ต้นทุนค่ารักษาพยาบาลหลังหักค่าใช้จ่ายดำเนินงาน
    'A529N',     //   รายได้สูง (ต่ำ) กว่า ต้นทุนค่ารักษาพยาบาลหลังหักค่าใช้จ่ายดำเนินงาน(ไม่รวมค่าเสือมราคาและค่าตัดจำหน่าย)

    // กลุ่มรายได้/ค่าใช้จ่ายอื่น
    'A90S',        // รายได้/ค่าใช้จ่ายอื่น สุทธิ (Level 0)
    'A60SS',     //   รวมค่าใช้จ่ายอื่นๆ (Level 1)
    'A6001020',   //     ค่าใช้จ่ายโครงการ (Level 2)
    'A6001030',   //     ค่าใช้จ่ายโครงการ PP
    'A6001130',   //     ค่าใช้จ่ายอื่นเช่น ค่าใช้จ่ายลักษณะอื่น คืนเงินค่ารักษาพยาบาล อุปกรณ์ และอวัยวะเทียมฯลฯ
    'A6001140',   //     ค่าจ้าง /ค่าเช่า /ค่าซ่อม บำรุงสิ่งก่อสร้างและครุภัณฑ์ (งบลงทุน UC)
    'A9010S',    //   รวมรายได้อื่นๆ (Level 1)
    'A7001010',   //     รายได้จากการช่วยเหลือเพื่อการดำเนินงานจากหน่วยงานอื่นๆ (Level 2)
    'A7001020',   //     รายได้จากงบประมาณแผ่นดิน-งบลงทุน
    'A7001030',   //     รายได้งบลงทุนUC
    'A7001040',   //     รายได้จากงบประมาณแผ่นดิน-อื่นๆ
    'A7001050',   //     รายได้จากการรับบริจาค
    'A7001060',   //     รายได้ดอกเบี้ย
    'A7001070',   //     รับโอนจากแม่ข่าย(ไม่ใช่เงิน UC)
    'A7001080',   //     รายได้ค่าบริหารจัดการโครงการ UC
    'A7001090',   //     รายได้ค่าบริหารจัดการประกันสังคม
    'A7001100',   //     รายได้ค่าบริหารจัดการแรงงานต่างด้าว
    'A7001120',   //     รายได้อื่นๆ เช่น รายได้ค่าธรรมเนียม ฯลฯ
    'A7001121',   //     รายได้อื่น-รายได้ระหว่างหน่วยงาน
    'A8001010',   //     รายได้จากงบประมาณแผ่นดิน-เงินอุดหนุน
    'A9001010',   //     รายได้ระหว่างหน่วยงาน (หน่วยเบิกจ่าย)

    // กลุ่ม EBITDA
    'EBITDA',      // รายได้ (ไม่รวมงบลงทุน) หัก ค่าใช้จ่าย (ไม่รวมค่าเสื่อมราคาและค่าตัดจำหน่าย) (Level 0)
    'A911S',     //   รวมรายได้ทั้งหมด (Level 1)
    'A912S',     //   รวมค่าใช้จ่ายทั้งหมด
    'A91D',      //   รายได้สูงกว่า (ต่ำกว่า) ค่าใช้จ่ายสุทธิ
    'A91N',      //   รายได้สูงกว่า (ต่ำกว่า) ค่าใช้จ่ายสุทธิ (ไม่รวมค่าเสือมราคาและค่าตัดจำหน่าย)
    'E400S',     //   รายได้รวม  (ไม่รวมงบลงทุน / รายได้อื่น ระบบบัญชีอัตโนมัติ)
    'E500S'      //   ค่าใช้จ่ายรวม (ไม่รวมค่าเสื่อมฯและค่าตัดจำหน่าย / ค่าใช้จ่ายอื่น ระบบบัญชีอัตโนมัติ)
];

const MGT_ACCOUNTS_PARENT_MAP = {
    'A1291': ['A119', 'A129'],
    'A119': ['A1111S', 'A11211S', 'A1122S', 'A1131S', 'A118'],
    'A1111S': ['A1111040.20', 'A1111040.3'],
    'A1111040.20': ['A1111010', 'A1111010.1', 'A1111010.2', 'A1111020', 'A1111030', 'A1111040', 'A1111040.1', 'A1111040.2'],
    'A11211S': ['A1121010', 'A1121020', 'A1121021', 'A1121030', 'A1121040', 'A1121050', 'A1121060', 'A1121060.1', 'A1121070', 'A1121080', 'A1121090', 'A1121100', 'A1121110', 'A1121120', 'A1121130', 'A1121140'],
    'A1122S': ['A1122010', 'A1122020', 'A1122030'],
    'A1131S': ['A1131000', 'A1131010', 'A1131020', 'A1131030', 'A1131040'],
    'A118': ['A1141010', 'A1142060', 'A1143020'],
    'A129': ['A1211001', 'A1211010', 'A1211020', 'A1212010', 'A1212020'],

    // กลุ่มหนี้สินและทุน
    'A390': ['A291', 'A32S'],
    'A291': ['A219', 'A29'],
    'A219': ['A2111S', 'A2112S', 'A218'],
    'A2111S': ['A2111010', 'A2111020', 'A2111030', 'A2111031', 'A2111040', 'A2111050', 'A2111060', 'A2111070', 'A2111080', 'A2111090'],
    'A2112S': ['A2112010', 'A2112020', 'A2112030', 'A2112050'],
    'A218': ['A2121030', 'A2121040.1', 'A2122010', 'A2122020', 'A2122021', 'A2122022', 'A2122023', 'A2122024', 'A2123010', 'A2131010', 'A2131011', 'A2132010'],
    'A29': ['A2211020', 'A2212020', 'A2212030'],
    'A32S': ['A3111010', 'A3111020', 'A3211010'],

    // กลุ่มรายได้
    'A49': ['A419S', 'A4201010'],
    'A419S': ['A410S', 'A4121010', 'A4131050.0', 'A413105S', 'A414301S', 'A4153S', 'A4161S', 'A4171010', 'A4191010', 'A4191011', 'A4192010'],
    'A410S': ['A4101040', 'A4101040.1', 'A4101041', 'A4101043', 'A4101080', 'A4102040', 'A4102041', 'A4102050.30', 'A4103040', 'A4103050', 'A4103060', 'A4103070', 'A4103080', 'A4103100', 'A4103101'],
    'A4101040': ['A4100001', 'A4101010', 'A4101020', 'A4101021'],
    'A4101043': ['A4101040.1', 'A4101041', 'A4101042', 'A4101042.1'],
    'A4101080': ['A4101050', 'A4101060', 'A4101061', 'A4101070'],
    'A4102040': ['A4102010', 'A4102020', 'A4102030'],
    'A4102050.30': ['A4102050', 'A4102050.10', 'A4102050.20'],
    'A4131050.0': ['A4131010', 'A4131050'],
    'A4131050': ['A4131020', 'A4131030', 'A4131040'],
    'A413105S': ['A4131050.1', 'A4131050.5'],
    'A4131050.5': ['A4131050.2', 'A4131050.3', 'A4131050.4'],
    'A414301S': ['A4141040', 'A4142010', 'A4143010', 'A4143010.1'],
    'A4141040': ['A4141010', 'A4141020', 'A4141030'],
    'A4153S': ['A4151040', 'A4152010', 'A4153010', 'A4153011'],
    'A4151040': ['A4151010', 'A4151020', 'A4151030'],
    'A4161S': ['A4161040', 'A4161050', 'A4161060'],
    'A4161040': ['A4161010', 'A4161020', 'A4161030'],

    // กลุ่มต้นทุนค่ารักษาพยาบาล
    'A5009D': ['A5009N', 'A5002010', 'A5002020', 'A5002030', 'A501D', 'A501N'],
    'A5009N': ['A5001010', 'A5001020', 'A5001030', 'A5001031', 'A5001040', 'A5001050', 'A5001050.1', 'A5001050.2', 'A5001060', 'A500107070', 'A500108070', 'A500109070', 'A500110070', 'A5001110', 'A5001120', 'A5001130', 'A5001140', 'A5001150', 'A5001160'],

    // กลุ่มค่าใช้จ่ายในการดำเนินงาน
    'A519D': ['A519N', 'A5102010', 'A5102020', 'A5102030', 'A529D', 'A529N'],
    'A519N': ['A5101010', 'A5101020', 'A5101020.1', 'A5101020.2', 'A5101030', 'A510104030', 'A510105030', 'A510106030', 'A510107030', 'A5101090', 'A5101100', 'A5101120', 'A5101130', 'A5101140', 'A5101170', 'A5101190', 'A5101201', 'A5101210', 'A5101240', 'A5101250', 'A5101260', 'A5101261', 'A5101270'],

    // กลุ่มรายได้/ค่าใช้จ่ายอื่น
    'A90S': ['A60SS', 'A9010S'],
    'A60SS': ['A6001020', 'A6001030', 'A6001130', 'A6001140'],
    'A9010S': ['A7001010', 'A7001020', 'A7001030', 'A7001040', 'A7001050', 'A7001060', 'A7001070', 'A7001080', 'A7001090', 'A7001100', 'A7001120', 'A7001121', 'A8001010', 'A9001010'],

    // กลุ่ม EBITDA
    'EBITDA': ['A911S', 'A912S', 'A91D', 'A91N', 'E400S', 'E500S']
};

// Helper: check if row should be hidden (any ancestor collapsed)
function isMgtHidden(code, parentMap) {
    let cur = code;
    while (cur) {
        // find immediate parent
        let par = null;
        for (let p in parentMap) {
            if (parentMap[p].includes(cur)) {
                par = p;
                break;
            }
        }
        if (!par) return false;
        if (window.mgtCollapsedState[par]) return true;
        cur = par;
    }
    return false;
}

// Helper: determine if account balance should be Credit - Debit (normal Credit)
function isCreditNormal(code) {
    if (code.startsWith('A5') && code !== 'A501D' && code !== 'A501N' && code !== 'A529D' && code !== 'A529N') {
        return false;
    }
    if (code.startsWith('A6')) {
        return false;
    }
    if (code === 'A912S' || code === 'E500S') {
        return false;
    }
    if (code.startsWith('A1')) {
        return false;
    }
    return true;
}

// Renderer: Management Report (Upgraded with graph-first view and multi-line visual analysis)
function renderManagementReport() {
    const tableBody = document.getElementById('mgtReportTableBody');
    const tableHeader = document.querySelector('#subView_managementReport table thead');
    const colNav = document.getElementById('mgtColNav');

    // View containers
    const graphViewContainer = document.getElementById('mgtGraphViewContainer');
    const tableViewContainer = document.getElementById('mgtTableViewContainer');
    const mgtSearchContainer = document.getElementById('mgtSearchContainer');

    // Tab buttons
    const mgtShowGraphBtn = document.getElementById('mgtShowGraphBtn');
    const mgtShowTableBtn = document.getElementById('mgtShowTableBtn');

    if (monthlyResults.length === 0) {
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400 font-bold bg-white">กรุณาอัปโหลดไฟล์งบทดลองก่อน</td></tr>`;
        if (colNav) colNav.classList.add('hidden');
        if (tableHeader) {
            tableHeader.innerHTML = `
                <tr class="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                    <th class="px-6 py-3 font-bold">รหัสบัญชี</th>
                    <th class="px-6 py-3 font-bold">รายการบัญชีวิเคราะห์</th>
                    <th class="px-6 py-3 text-right font-bold">ยอดเงิน</th>
                </tr>
            `;
        }
        return;
    }

    // ======================================================
    // 1. Setup Toggle & Control Event Listeners
    // ======================================================
    if (mgtShowGraphBtn && mgtShowTableBtn) {
        mgtShowGraphBtn.onclick = () => {
            window.mgtActiveView = 'graph';
            updateMgtViewLayout();
        };
        mgtShowTableBtn.onclick = () => {
            window.mgtActiveView = 'table';
            updateMgtViewLayout();
        };
    }

    // Setup Collapse/Expand Checklist Panel (Sliding Drawer)
    const mgtFloatingToggleBtn = document.getElementById('mgtFloatingToggleBtn');
    const mgtSelectionPanel = document.getElementById('mgtSelectionPanel');
    const mgtFloatingToggleIcon = document.getElementById('mgtFloatingToggleIcon');

    if (mgtFloatingToggleBtn && mgtSelectionPanel) {
        mgtFloatingToggleBtn.onclick = () => {
            const isClosed = mgtSelectionPanel.classList.contains('closed');
            if (isClosed) {
                // Open panel
                mgtSelectionPanel.classList.remove('closed');
                mgtFloatingToggleBtn.title = "ซ่อนแผงเลือกบัญชี";
                if (mgtFloatingToggleIcon) {
                    mgtFloatingToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M9 5l7 7-7 7" />`;
                }
            } else {
                // Close/Hide panel
                mgtSelectionPanel.classList.add('closed');
                mgtFloatingToggleBtn.title = "แสดงแผงเลือกบัญชี";
                if (mgtFloatingToggleIcon) {
                    mgtFloatingToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M15 19l-7-7 7-7" />`;
                }
            }
            // Trigger redrawing chart to adapt to new width!
            setTimeout(() => {
                drawMgtTrendGraph();
            }, 305);
        };
    }

    function updateMgtViewLayout() {
        if (window.mgtActiveView === 'graph') {
            if (graphViewContainer) graphViewContainer.classList.remove('hidden');
            if (tableViewContainer) tableViewContainer.classList.add('hidden');
            if (mgtSearchContainer) mgtSearchContainer.classList.add('hidden');
            if (colNav) colNav.classList.add('hidden');
            if (mgtShowGraphBtn) {
                mgtShowGraphBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-white text-indigo-700 focus:outline-none';
            }
            if (mgtShowTableBtn) {
                mgtShowTableBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
            }
            renderMgtGraphView();
        } else {
            if (graphViewContainer) graphViewContainer.classList.add('hidden');
            if (tableViewContainer) tableViewContainer.classList.remove('hidden');
            if (mgtSearchContainer) mgtSearchContainer.classList.remove('hidden');
            if (mgtShowGraphBtn) {
                mgtShowGraphBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
            }
            if (mgtShowTableBtn) {
                mgtShowTableBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-white text-indigo-700 focus:outline-none';
            }
            renderMgtTableView();
        }
    }

    // Initial render call based on state
    updateMgtViewLayout();
}

// Helper: check if checklist item is hidden (any ancestor collapsed)
function isMgtChecklistHidden(code) {
    let cur = code;
    while (cur) {
        let par = null;
        for (let p in MGT_ACCOUNTS_PARENT_MAP) {
            if (MGT_ACCOUNTS_PARENT_MAP[p].includes(cur)) {
                par = p;
                break;
            }
        }
        if (!par) return false;
        if (window.mgtChecklistCollapsedState[par]) return true;
        cur = par;
    }
    return false;
}

function getMgtAncestors(code) {
    const ancestors = [];
    let cur = code;
    while (cur) {
        let par = null;
        for (let p in MGT_ACCOUNTS_PARENT_MAP) {
            if (MGT_ACCOUNTS_PARENT_MAP[p].includes(cur)) {
                par = p;
                break;
            }
        }
        if (par) {
            ancestors.push(par);
            cur = par;
        } else {
            break;
        }
    }
    return ancestors;
}

function getMgtDescendants(code) {
    let descendants = [];
    const children = MGT_ACCOUNTS_PARENT_MAP[code] || [];
    children.forEach(child => {
        descendants.push(child);
        descendants = descendants.concat(getMgtDescendants(child));
    });
    return descendants;
}

let mgtDashAnimationId = null;
function startMgtDashAnimation() {
    if (mgtDashAnimationId) return;
    window.mgtDashOffset = 0;
    function animate() {
        if (!window.mgtHoveredCode) {
            mgtDashAnimationId = null;
            return;
        }
        window.mgtDashOffset = (window.mgtDashOffset - 0.4) % 24;
        if (window.mgtTrendChartInstance) {
            const datasets = window.mgtTrendChartInstance.data.datasets;
            let updated = false;
            datasets.forEach(ds => {
                if (ds.mgtCode === window.mgtHoveredCode) {
                    ds.borderDashOffset = window.mgtDashOffset;
                    updated = true;
                }
            });
            if (updated) {
                window.mgtTrendChartInstance.update('none');
            }
        }
        mgtDashAnimationId = requestAnimationFrame(animate);
    }
    mgtDashAnimationId = requestAnimationFrame(animate);
}

// ── Rendering the Graph-First Dashboard ──
function renderMgtGraphView() {
    const checklistContainer = document.getElementById('mgtSelectionChecklist');
    const searchInput = document.getElementById('mgtSelectSearchInput');
    const clearBtn = document.getElementById('mgtClearSelectionBtn');
    const defaultBtn = document.getElementById('mgtDefaultSelectionBtn');
    const lineBtn = document.getElementById('mgtChartTypeLineBtn');
    const barBtn = document.getElementById('mgtChartTypeBarBtn');

    if (!checklistContainer) return;

    // Initialize checklist collapsed state
    window.mgtChecklistCollapsedState = window.mgtChecklistCollapsedState || {};
    if (Object.keys(window.mgtChecklistCollapsedState).length === 0) {
        for (let p in MGT_ACCOUNTS_PARENT_MAP) {
            window.mgtChecklistCollapsedState[p] = true; // collapsed by default
        }
    }

    // Build lookup
    const mgtByCode = {};
    if (typeof window.MGT_ACCOUNTS_MAP !== 'undefined') {
        window.MGT_ACCOUNTS_MAP.forEach(item => { mgtByCode[item.code] = item; });
    }

    // Filter list by search query
    const filterQuery = window.mgtSelectSearchQuery.toLowerCase().trim();
    const filteredCodes = MGT_DISPLAY_ORDER.filter(code => {
        const item = mgtByCode[code];
        if (!item) return false;
        if (!filterQuery) return true;
        return item.code.toLowerCase().includes(filterQuery) || item.name.toLowerCase().includes(filterQuery);
    });

    // ── Build Checklist DOM ──
    checklistContainer.innerHTML = '';
    filteredCodes.forEach(code => {
        const item = mgtByCode[code];
        if (!item) return;

        // Skip if hidden by collapsed parent (only when there's no search query)
        if (!filterQuery && isMgtChecklistHidden(code)) return;

        const isChecked = window.selectedMgtCodes.includes(code);
        const isParent = !!MGT_ACCOUNTS_PARENT_MAP[code];

        // Determine Level Indent level
        let indent = 0;
        let curCode = code;
        while (curCode) {
            let par = null;
            for (let p in MGT_ACCOUNTS_PARENT_MAP) {
                if (MGT_ACCOUNTS_PARENT_MAP[p].includes(curCode)) {
                    par = p;
                    break;
                }
            }
            if (par) {
                indent++;
                curCode = par;
            } else {
                break;
            }
        }

        // Caret symbol for expand/collapse in checklist
        let caretHtml = '';
        if (isParent) {
            const isCollapsed = !!window.mgtChecklistCollapsedState[code];
            caretHtml = `
                <span class="mgt-caret inline-block mr-1 hover:bg-slate-100 p-0.5 rounded transition-transform duration-200 cursor-pointer align-middle shrink-0 w-3.5 h-3.5 ${!isCollapsed ? 'open' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>
            `;
        } else {
            caretHtml = `<span class="w-3.5 inline-block shrink-0"></span>`;
        }

        // Category color for checklist item — must be computed BEFORE itemDiv is created
        let itemCatKey = 'slate';
        if (code.startsWith('A1')) itemCatKey = 'blue';
        else if (code.startsWith('A2') || code.startsWith('A3')) itemCatKey = 'orange';
        else if (code.startsWith('A4')) itemCatKey = 'green';
        else if (code.startsWith('A5') || code.startsWith('A6')) itemCatKey = 'red';

        const checklistCatColors = {
            blue: { dot: 'bg-sky-500', text: 'text-sky-900', border: 'border-sky-200', bg: 'bg-sky-50/40', chk: 'accent-sky-600' },
            orange: { dot: 'bg-orange-500', text: 'text-orange-900', border: 'border-orange-200', bg: 'bg-orange-50/40', chk: 'accent-orange-600' },
            green: { dot: 'bg-emerald-500', text: 'text-emerald-900', border: 'border-emerald-200', bg: 'bg-emerald-50/40', chk: 'accent-emerald-600' },
            red: { dot: 'bg-rose-500', text: 'text-rose-900', border: 'border-rose-200', bg: 'bg-rose-50/40', chk: 'accent-rose-600' },
            slate: { dot: 'bg-slate-400', text: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50/30', chk: 'accent-slate-600' }
        };
        const cc = checklistCatColors[itemCatKey];

        const itemDiv = document.createElement('div');
        itemDiv.className = `flex items-center gap-2 p-1.5 rounded-xl border cursor-pointer transition-all ${isChecked ? cc.bg + ' ' + cc.border : 'bg-white border-slate-100/60'} hover:opacity-90`;
        itemDiv.style.marginLeft = `${indent * 12}px`;

        itemDiv.innerHTML = `
            <span class="w-2 h-2 rounded-full shrink-0 ${cc.dot} ${indent === 0 ? 'opacity-100' : 'opacity-60'}"></span>
            <input type="checkbox" data-code="${code}" class="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer shrink-0 ${cc.chk}" ${isChecked ? 'checked' : ''} />
            ${caretHtml}
            <div class="flex flex-col min-w-0 flex-1">
                <span class="text-xs select-none ${isParent ? 'font-bold' : 'font-medium'} ${cc.text} whitespace-normal break-words leading-tight" title="${item.name}">${item.name}</span>
            </div>
        `;

        // Checkbox change listener
        const checkbox = itemDiv.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                if (!window.selectedMgtCodes.includes(code)) {
                    const ancestors = getMgtAncestors(code);
                    const descendants = getMgtDescendants(code);
                    window.selectedMgtCodes = window.selectedMgtCodes.filter(
                        c => !ancestors.includes(c) && !descendants.includes(c)
                    );
                    window.selectedMgtCodes.push(code);
                }
            } else {
                window.selectedMgtCodes = window.selectedMgtCodes.filter(c => c !== code);
            }
            renderMgtGraphView();
        });

        // Hover listeners to make graph line animated dashed line
        itemDiv.addEventListener('mouseenter', () => {
            const isSel = window.selectedMgtCodes.includes(code);
            if (!isSel) return;
            window.mgtHoveredCode = code;
            if (window.mgtTrendChartInstance) {
                window.mgtTrendChartInstance.data.datasets.forEach(ds => {
                    if (ds.mgtCode === code) {
                        ds.borderWidth = 5;
                        ds.borderDash = [8, 4];
                    }
                });
                window.mgtTrendChartInstance.update('none');
            }
            startMgtDashAnimation();
        });

        itemDiv.addEventListener('mouseleave', () => {
            if (window.mgtHoveredCode === code) {
                window.mgtHoveredCode = null;
                if (window.mgtTrendChartInstance) {
                    window.mgtTrendChartInstance.data.datasets.forEach(ds => {
                        if (ds.mgtCode === code) {
                            ds.borderWidth = 3;
                            ds.borderDash = [];
                            ds.borderDashOffset = 0;
                        }
                    });
                    window.mgtTrendChartInstance.update('none');
                }
            }
        });

        // caret click listener to toggle collapse
        const caretSpan = itemDiv.querySelector('.mgt-caret');
        if (caretSpan) {
            caretSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.mgtChecklistCollapsedState[code] = !window.mgtChecklistCollapsedState[code];
                renderMgtGraphView();
            });
        }

        // Entire row click logic (smart toggle)
        itemDiv.addEventListener('click', (e) => {
            if (e.target.closest('input[type="checkbox"]') || e.target.closest('.mgt-caret')) {
                return; // Let checkbox and caret handle themselves
            }
            if (isParent) {
                window.mgtChecklistCollapsedState[code] = !window.mgtChecklistCollapsedState[code];
                renderMgtGraphView();
            } else {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        checklistContainer.appendChild(itemDiv);
    });

    if (filteredCodes.length === 0) {
        checklistContainer.innerHTML = `<div class="text-center text-xs text-slate-400 py-8 font-bold">ไม่พบบัญชีบริหารที่ค้นหา</div>`;
    }

    // ── Search Input ──
    if (searchInput) {
        searchInput.value = window.mgtSelectSearchQuery;
        searchInput.oninput = (e) => {
            window.mgtSelectSearchQuery = e.target.value;
            renderMgtGraphView();
        };
    }

    // ── Clear Selection ──
    if (clearBtn) {
        clearBtn.onclick = () => {
            window.selectedMgtCodes = [];
            renderMgtGraphView();
            drawMgtTrendGraph();
        };
    }

    // ── Default Selection ──
    if (defaultBtn) {
        defaultBtn.onclick = () => {
            window.selectedMgtCodes = ['A1291'];
            renderMgtGraphView();
            drawMgtTrendGraph();
        };
    }

    // ── Line/Bar Toggles ──
    if (lineBtn && barBtn) {
        lineBtn.onclick = () => {
            window.mgtChartType = 'line';
            lineBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-indigo-600 text-white focus:outline-none';
            barBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
            drawMgtTrendGraph();
        };
        barBtn.onclick = () => {
            window.mgtChartType = 'bar';
            barBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-indigo-600 text-white focus:outline-none';
            lineBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
            drawMgtTrendGraph();
        };

        // Set initial button states
        if (window.mgtChartType === 'line') {
            lineBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-indigo-600 text-white focus:outline-none';
            barBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
        } else {
            barBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm bg-indigo-600 text-white focus:outline-none';
            lineBtn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-800 focus:outline-none';
        }
    }

    // Draw the actual trend chart
    drawMgtTrendGraph();
}

// ── Draw the Premium Multi-Series Chart ──
function drawMgtTrendGraph() {
    const canvas = document.getElementById('mgtTrendChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance
    if (window.mgtTrendChartInstance) {
        window.mgtTrendChartInstance.destroy();
        window.mgtTrendChartInstance = null;
    }

    if (monthlyResults.length === 0) return;

    const filteredMonths = typeof window.getFilteredMonths === 'function' ? window.getFilteredMonths(monthlyResults) : monthlyResults;

    if (filteredMonths.length === 0) return;

    // Build timeline labels
    const labels = [];
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    filteredMonths.forEach(month => {
        let y = month.dateObj.getFullYear();
        let m = month.dateObj.getMonth() + 1;
        let thaiYear = y > 2500 ? y : y + 543;
        labels.push(`${thaiMonths[m - 1]} ${thaiYear.toString().slice(-2)}`);
    });

    // Category-matched color palette (mirrors table color scheme)
    // For each code: blue=A1 assets, orange=A2/A3 liabilities/equity, green=A4 revenue, red=A5/A6 expenses, slate=others
    const CATEGORY_COLORS = {
        blue: ['#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#0369a1'],   // sky shades for assets
        orange: ['#f97316', '#fb923c', '#ea580c', '#fdba74', '#c2410c'],   // orange shades for liab/equity
        green: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'],   // emerald shades for revenue
        red: ['#f43f5e', '#fb7185', '#e11d48', '#fda4af', '#be123c'],   // rose shades for expenses
        slate: ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']   // indigo/purple fallback
    };
    const catUsageCount = { blue: 0, orange: 0, green: 0, red: 0, slate: 0 };

    function getColorForCode(code) {
        let cat = 'slate';
        if (code.startsWith('A1')) cat = 'blue';
        else if (code.startsWith('A2') || code.startsWith('A3')) cat = 'orange';
        else if (code.startsWith('A4')) cat = 'green';
        else if (code.startsWith('A5') || code.startsWith('A6')) cat = 'red';
        const palette = CATEGORY_COLORS[cat];
        const idx = catUsageCount[cat] % palette.length;
        catUsageCount[cat]++;
        return palette[idx];
    }

    // Build lookup
    const mgtByCode = {};
    if (typeof window.MGT_ACCOUNTS_MAP !== 'undefined') {
        window.MGT_ACCOUNTS_MAP.forEach(item => { mgtByCode[item.code] = item; });
    }

    // Generate datasets
    const datasets = [];
    window.selectedMgtCodes.forEach((code) => {
        const item = mgtByCode[code];
        if (!item) return;

        // Calculate values for all months
        const balances = filteredMonths.map(month => {
            return Math.abs(sumMgtAccount(month.tbData, code));
        });

        const color = getColorForCode(code);

        if (window.mgtChartType === 'line') {
            const isHovered = (code === window.mgtHoveredCode);
            datasets.push({
                label: item.name,
                mgtCode: code,
                data: balances,
                borderColor: color,
                backgroundColor: 'transparent',
                fill: false,
                borderWidth: isHovered ? 5 : 3,
                borderDash: isHovered ? [8, 4] : [],
                borderDashOffset: isHovered ? (window.mgtDashOffset || 0) : 0,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointBorderWidth: 2.5,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 2,
                tension: 0.35
            });
        } else {
            // Bar chart
            datasets.push({
                label: item.name,
                mgtCode: code,
                data: balances,
                backgroundColor: color + 'cc',
                borderColor: color,
                borderWidth: 1.5,
                borderRadius: 6,
                borderSkipped: false
            });
        }
    });


    // Create new chart instance
    window.mgtTrendChartInstance = new Chart(ctx, {
        type: window.mgtChartType,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 16,
                        font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 11 },
                        color: '#475569'
                    },
                    onHover: function(event, legendItem, legend) {
                        const chart = legend.chart;
                        const datasetIndex = legendItem.datasetIndex;
                        const dataset = chart.data.datasets[datasetIndex];
                        if (!dataset) return;
                        const code = dataset.mgtCode;
                        
                        if (window.mgtHoveredCode !== code) {
                            window.mgtHoveredCode = code;
                            chart.data.datasets.forEach((ds, idx) => {
                                if (idx === datasetIndex) {
                                    ds.borderWidth = 5;
                                    ds.borderDash = [8, 4];
                                } else {
                                    ds.borderWidth = 3;
                                    ds.borderDash = [];
                                    ds.borderDashOffset = 0;
                                }
                            });
                            chart.update('none');
                            startMgtDashAnimation();
                        }
                    },
                    onLeave: function(event, legendItem, legend) {
                        const chart = legend.chart;
                        window.mgtHoveredCode = null;
                        chart.data.datasets.forEach(ds => {
                            ds.borderWidth = 3;
                            ds.borderDash = [];
                            ds.borderDashOffset = 0;
                        });
                        chart.update('none');
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#E2E8F0',
                    titleFont: { weight: 'bold', family: "'Sarabun', sans-serif", size: 12 },
                    bodyFont: { family: "'Sarabun', sans-serif", size: 11 },
                    padding: 12,
                    borderRadius: 12,
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            const formatted = mgtNumberFormat === 'full'
                                ? val.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                                : formatAbbreviated(val);
                            return ` ${context.dataset.label}: ${formatted} บาท`;
                        }
                    }
                },
                datalabels: {
                    display: (context) => window.shouldShowLabels ? window.shouldShowLabels('mgtTrendChartCanvas') : true,
                    align: 'top',
                    anchor: 'end',
                    font: {
                        family: "'Sarabun', sans-serif",
                        size: 9,
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return mgtNumberFormat === 'full'
                            ? value.toLocaleString('th-TH', { maximumFractionDigits: 0 })
                            : formatAbbreviated(value);
                    },
                    color: '#475569'
                }
            },
            scales: {
                y: {
                    grid: {
                        color: '#F1F5F9'
                    },
                    ticks: {
                        color: '#64748B',
                        font: { family: "'Sarabun', sans-serif", size: 11 },
                        callback: (value) => value === 0 ? '0' : formatAbbreviated(value)
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: { weight: 'bold', family: "'Sarabun', sans-serif", size: 11 }
                    }
                }
            }
        }
    });
}

// ── Rendering the Classic Table View ──
function renderMgtTableView() {
    const tableBody = document.getElementById('mgtReportTableBody');
    const tableHeader = document.querySelector('#subView_managementReport table thead');
    const colNav = document.getElementById('mgtColNav');
    const tableColNav = document.getElementById('mgtTableColNav');

    if (!tableBody || !tableHeader) return;

    const windowSize = 3;
    const totalCols = monthlyResults.length;
    let visibleMonths = [];

    if (totalCols <= windowSize) {
        tbColStartIndex = 0;
        if (colNav) colNav.classList.add('hidden');
        if (tableColNav) tableColNav.classList.add('hidden');
        visibleMonths = monthlyResults;
    } else {
        if (colNav) colNav.classList.remove('hidden');
        if (tableColNav) tableColNav.classList.remove('hidden');

        // Ensure starting index is in bounds
        if (tbColStartIndex < 0) tbColStartIndex = 0;
        if (tbColStartIndex > totalCols - windowSize) {
            tbColStartIndex = totalCols - windowSize;
        }

        visibleMonths = monthlyResults.slice(tbColStartIndex, tbColStartIndex + windowSize);

        // Update Column Navigation labels and disabled states for both controls
        const prevBtn = document.getElementById('mgtColPrevBtn');
        const nextBtn = document.getElementById('mgtColNextBtn');
        const rangeText = document.getElementById('mgtColRangeText');

        const tablePrevBtn = document.getElementById('mgtTableColPrevBtn');
        const tableNextBtn = document.getElementById('mgtTableColNextBtn');
        const tableRangeText = document.getElementById('mgtTableColRangeText');

        if (prevBtn) prevBtn.disabled = (tbColStartIndex === 0);
        if (nextBtn) nextBtn.disabled = (tbColStartIndex >= totalCols - windowSize);
        if (tablePrevBtn) tablePrevBtn.disabled = (tbColStartIndex === 0);
        if (tableNextBtn) tableNextBtn.disabled = (tbColStartIndex >= totalCols - windowSize);

        const startLabel = visibleMonths[0].monthStr || visibleMonths[0].filename.replace('.xlsx', '').replace('.xls', '');
        const endLabel = visibleMonths[visibleMonths.length - 1].monthStr || visibleMonths[visibleMonths.length - 1].filename.replace('.xlsx', '').replace('.xls', '');
        if (rangeText) rangeText.textContent = `${startLabel} - ${endLabel}`;
        if (tableRangeText) tableRangeText.textContent = `${startLabel} - ${endLabel}`;
    }

    // Build dynamically side-by-side header columns (only for visible months)
    let headerHtml = `
        <tr class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <th class="px-3 py-3 font-black text-slate-700 tracking-wider text-xs">รายการบัญชีวิเคราะห์</th>
    `;

    visibleMonths.forEach(month => {
        const label = month.monthStr || month.filename.replace('.xlsx', '').replace('.xls', '');
        headerHtml += `
            <th class="px-3 py-3 text-right font-black text-slate-700 tracking-wider w-[110px] text-[11px]">${label}</th>
        `;
    });
    headerHtml += `</tr>`;
    tableHeader.innerHTML = headerHtml;

    tableBody.innerHTML = '';

    // Build lookup from code → account item
    const mgtByCode = {};
    if (typeof window.MGT_ACCOUNTS_MAP !== 'undefined') {
        window.MGT_ACCOUNTS_MAP.forEach(item => { mgtByCode[item.code] = item; });
    }

    // Filter query
    const query = mgtSearchQuery.toLowerCase().trim();

    // Helper to check if a specific code matches the query (either management code/name, or any mapped TB accounts)
    function matchesQuery(c) {
        const item = mgtByCode[c];
        if (!item) return false;
        if (item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)) return true;
        if (item.tbCodes) {
            for (let tbCode of item.tbCodes) {
                if (tbCode.toLowerCase().includes(query)) return true;
                const tbName = lookupAccountName(tbCode);
                if (tbName.toLowerCase().includes(query)) return true;
            }
        }
        return false;
    }

    // Helper to determine if a code should be rendered (either matches query itself, or has any descendant that matches)
    function shouldRenderCode(c) {
        if (!query) return true;
        if (matchesQuery(c)) return true;
        const children = MGT_ACCOUNTS_PARENT_MAP[c] || [];
        for (let child of children) {
            if (shouldRenderCode(child)) return true;
        }
        return false;
    }

    // Determine ordered codes to render
    const orderedCodes = [];
    MGT_DISPLAY_ORDER.forEach(code => {
        if (mgtByCode[code]) orderedCodes.push(code);
    });
    if (typeof window.MGT_ACCOUNTS_MAP !== 'undefined') {
        window.MGT_ACCOUNTS_MAP.forEach(item => {
            if (!orderedCodes.includes(item.code)) orderedCodes.push(item.code);
        });
    }

    const visibleCodes = orderedCodes.filter(code => shouldRenderCode(code));

    if (visibleCodes.length === 0) {
        const totalColsCount = visibleMonths.length + 1;
        tableBody.innerHTML = `<tr><td colspan="${totalColsCount}" class="px-3 py-12 text-center text-slate-400 font-medium bg-white">ไม่พบบัญชีบริหารที่ค้นหา</td></tr>`;
        return;
    }

    const rowMap = {}; // code → <tr>
    const tbRowMap = {}; // leafCode → Array of <tr>

    orderedCodes.forEach(code => {
        const item = mgtByCode[code];
        if (!item) return;

        // Search filter: skip if doesn't match and shouldn't render
        if (query && !shouldRenderCode(code)) return;

        // Calculate monthly balances
        const monthlyBalances = monthlyResults.map(month => {
            return sumMgtAccount(month.tbData, item.code);
        });

        const visibleBalances = totalCols <= windowSize
            ? monthlyBalances
            : monthlyBalances.slice(tbColStartIndex, tbColStartIndex + windowSize);

        const isParent = !!MGT_ACCOUNTS_PARENT_MAP[item.code];
        const hasTbDetail = false;

        // Dynamic Indentation
        let indent = 0;
        let curCode = item.code;
        while (curCode) {
            let par = null;
            for (let p in MGT_ACCOUNTS_PARENT_MAP) {
                if (MGT_ACCOUNTS_PARENT_MAP[p].includes(curCode)) {
                    par = p;
                    break;
                }
            }
            if (par) {
                indent++;
                curCode = par;
            } else {
                break;
            }
        }

        if (typeof window.mgtCollapsedState === 'undefined') {
            window.mgtCollapsedState = {};
            for (let p in MGT_ACCOUNTS_PARENT_MAP) {
                window.mgtCollapsedState[p] = true;
            }
        }
        if (hasTbDetail && window.mgtCollapsedState[item.code] === undefined) {
            window.mgtCollapsedState[item.code] = true;
        }

        const isCollapsed = query ? false : !!window.mgtCollapsedState[item.code];
        const shouldHide = !query && isMgtHidden(item.code, MGT_ACCOUNTS_PARENT_MAP);

        // Caret symbol
        let caretHtml = '';
        if (isParent || hasTbDetail) {
            caretHtml = `
                <span class="mgt-caret inline-block mr-1.5 transition-transform duration-200 align-middle shrink-0 w-3 h-3 ${!isCollapsed ? 'open' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>
            `;
        } else {
            caretHtml = `<span class="w-4.5 inline-block shrink-0"></span>`;
        }

        // Chart button (appears on hover)
        const chartBtn = `
            <button class="mgt-chart-btn ml-2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sky-100 text-sky-500 focus:outline-none transition-opacity duration-150 inline-flex items-center w-5 h-5 align-middle shrink-0" title="ดูกราฟแนวโน้ม">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </button>
        `;

        // Check if summary row
        const isSummaryRow = item.name.startsWith('รวม') || item.name.includes('สุทธิ') || item.name.includes('EBITDA');

        // Color Accents mapping
        let catKey = 'slate';
        if (item.code.startsWith('A1')) catKey = 'blue';
        else if (item.code.startsWith('A2') || item.code.startsWith('A3')) catKey = 'orange';
        else if (item.code.startsWith('A4')) catKey = 'green';
        else if (item.code.startsWith('A5') || item.code.startsWith('A6')) catKey = 'red';

        const rootColorMap = {
            blue: {
                level0: 'bg-sky-100 text-sky-950 font-black border-t border-b border-sky-200 hover:bg-sky-200/70',
                level1: 'bg-sky-50 text-sky-950 font-bold border-b border-sky-100 hover:bg-sky-100/50',
                summary: 'bg-sky-50/40 text-sky-900 font-semibold border-b border-sky-100/20 hover:bg-sky-50/60',
                detail: 'hover:bg-sky-50/15',
                textLevel0: 'text-sky-950 font-black',
                textGeneral: 'text-slate-700 group-hover:text-sky-850',
                codeColorLevel0: 'text-sky-800',
                codeColorSummary: 'text-sky-700',
                codeColorDetail: 'text-sky-400',
                valueColorLevel0Negative: 'text-red-700 font-black',
                valueColorLevel0Positive: 'text-sky-950 font-black',
                valueColorSummaryNegative: 'text-red-600 font-bold',
                valueColorSummaryPositive: 'text-sky-900 font-bold',
                valueColorDetailNegative: 'text-red-500 font-semibold',
                valueColorDetailPositive: 'text-slate-600 font-semibold'
            },
            orange: {
                level0: 'bg-orange-100 text-orange-950 font-black border-t border-b border-orange-200 hover:bg-orange-200/70',
                level1: 'bg-orange-50 text-orange-950 font-bold border-b border-orange-100 hover:bg-orange-100/50',
                summary: 'bg-orange-50/40 text-orange-900 font-semibold border-b border-orange-100/20 hover:bg-orange-50/60',
                detail: 'hover:bg-orange-50/15',
                textLevel0: 'text-orange-950 font-black',
                textGeneral: 'text-slate-700 group-hover:text-orange-850',
                codeColorLevel0: 'text-orange-800',
                codeColorSummary: 'text-orange-700',
                codeColorDetail: 'text-orange-400',
                valueColorLevel0Negative: 'text-red-700 font-black',
                valueColorLevel0Positive: 'text-orange-950 font-black',
                valueColorSummaryNegative: 'text-red-600 font-bold',
                valueColorSummaryPositive: 'text-orange-900 font-bold',
                valueColorDetailNegative: 'text-red-500 font-semibold',
                valueColorDetailPositive: 'text-slate-600 font-semibold'
            },
            green: {
                level0: 'bg-emerald-100 text-emerald-950 font-black border-t border-b border-emerald-200 hover:bg-emerald-200/70',
                level1: 'bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-100 hover:bg-emerald-100/50',
                summary: 'bg-emerald-50/40 text-emerald-900 font-semibold border-b border-emerald-100/20 hover:bg-emerald-50/60',
                detail: 'hover:bg-emerald-50/15',
                textLevel0: 'text-emerald-950 font-black',
                textGeneral: 'text-slate-700 group-hover:text-emerald-800',
                codeColorLevel0: 'text-emerald-800',
                codeColorSummary: 'text-emerald-700',
                codeColorDetail: 'text-emerald-400',
                valueColorLevel0Negative: 'text-red-700 font-black',
                valueColorLevel0Positive: 'text-emerald-950 font-black',
                valueColorSummaryNegative: 'text-red-600 font-bold',
                valueColorSummaryPositive: 'text-emerald-900 font-bold',
                valueColorDetailNegative: 'text-red-500 font-semibold',
                valueColorDetailPositive: 'text-slate-600 font-semibold'
            },
            red: {
                level0: 'bg-rose-100 text-rose-950 font-black border-t border-b border-rose-200 hover:bg-rose-200/70',
                level1: 'bg-rose-50 text-rose-950 font-bold border-b border-rose-100 hover:bg-rose-100/50',
                summary: 'bg-rose-50/40 text-rose-900 font-semibold border-b border-rose-100/20 hover:bg-rose-50/60',
                detail: 'hover:bg-rose-50/15',
                textLevel0: 'text-rose-950 font-black',
                textGeneral: 'text-slate-700 group-hover:text-rose-800',
                codeColorLevel0: 'text-rose-800',
                codeColorSummary: 'text-rose-700',
                codeColorDetail: 'text-rose-400',
                valueColorLevel0Negative: 'text-red-700 font-black',
                valueColorLevel0Positive: 'text-rose-950 font-black',
                valueColorSummaryNegative: 'text-red-600 font-bold',
                valueColorSummaryPositive: 'text-rose-900 font-bold',
                valueColorDetailNegative: 'text-red-500 font-semibold',
                valueColorDetailPositive: 'text-slate-600 font-semibold'
            },
            slate: {
                level0: 'bg-slate-200 text-slate-950 font-black border-t border-b border-slate-300 hover:bg-slate-300/70',
                level1: 'bg-slate-100 text-slate-950 font-bold border-b border-slate-200 hover:bg-slate-200/50',
                summary: 'bg-slate-50 text-slate-900 font-semibold border-b border-slate-200/50 hover:bg-slate-100',
                detail: 'hover:bg-slate-50/15',
                textLevel0: 'text-slate-950 font-black',
                textGeneral: 'text-slate-700 group-hover:text-slate-900',
                codeColorLevel0: 'text-slate-800',
                codeColorSummary: 'text-slate-700',
                codeColorDetail: 'text-slate-400',
                valueColorLevel0Negative: 'text-red-700 font-black',
                valueColorLevel0Positive: 'text-slate-950 font-black',
                valueColorSummaryNegative: 'text-red-600 font-bold',
                valueColorSummaryPositive: 'text-slate-900 font-bold',
                valueColorDetailNegative: 'text-red-500 font-semibold',
                valueColorDetailPositive: 'text-slate-600 font-semibold'
            }
        };

        const col = rootColorMap[catKey] || rootColorMap['slate'];

        // Row styling based on indentation and selected palette
        let rowBg = '';
        if (indent === 0) {
            rowBg = col.level0;
        } else if (indent === 1) {
            rowBg = col.level1;
        } else if (isSummaryRow) {
            rowBg = col.summary;
        } else {
            rowBg = col.detail;
        }

        const codeColor = (indent === 0) ? col.codeColorLevel0
            : isSummaryRow ? col.codeColorSummary
                : col.codeColorDetail;

        const tr = document.createElement('tr');
        tr.dataset.code = item.code;
        tr.className = [
            'mgt-row-animate transition-all border-b border-slate-100',
            rowBg,
            'cursor-pointer group',
            (isParent || hasTbDetail) ? 'mgt-parent-row' : '',
            (!isCollapsed && (isParent || hasTbDetail)) ? 'expanded' : ''
        ].filter(Boolean).join(' ');

        if (shouldHide) tr.style.display = 'none';

        let rowHtml = `
            <td class="px-3 py-2 text-slate-700 transition-colors whitespace-nowrap text-sm ${(indent === 0) ? col.textLevel0 : col.textGeneral}"
                style="${indent > 0 ? `padding-left: ${indent * 14 + 12}px;` : ''}">
                <span class="inline-flex items-center gap-0">
                    ${caretHtml}
                    <span class="align-middle">${item.name}</span>
                    ${chartBtn}
                </span>
            </td>
        `;

        visibleBalances.forEach(val => {
            let formatted = '-';
            let cellClass = (indent === 0)
                ? 'text-white font-black'
                : 'text-slate-400 font-medium';
            if (val !== 0) {
                formatted = mgtNumberFormat === 'full'
                    ? val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : formatAbbreviated(val);
                cellClass = val < 0
                    ? ((indent === 0) ? col.valueColorLevel0Negative : (isSummaryRow ? col.valueColorSummaryNegative : col.valueColorDetailNegative))
                    : ((indent === 0) ? col.valueColorLevel0Positive : (isSummaryRow ? col.valueColorSummaryPositive : col.valueColorDetailPositive));
            }
            rowHtml += `<td class="px-3 py-2 text-right whitespace-nowrap text-[11px] w-[110px] ${cellClass}">${formatted}</td>`;
        });

        tr.innerHTML = rowHtml;
        rowMap[item.code] = tr;
        tableBody.appendChild(tr);

        // Generate and append TB detail rows if this is a leaf account with mapped trial balance codes
        const tbRows = [];
        if (hasTbDetail) {
            item.tbCodes.forEach(tbCode => {
                const tbBalances = monthlyResults.map(month => {
                    let val = 0;
                    const tbData = month.tbData || [];
                    const row = tbData.find(r => String(r.code).trim() === tbCode);
                    if (row) {
                        if (isCreditNormal(item.code)) {
                            val = row.end_cr - row.end_dr;
                        } else {
                            val = row.end_dr - row.end_cr;
                        }
                    }
                    return val;
                });

                const visibleTbBalances = totalCols <= windowSize
                    ? tbBalances
                    : tbBalances.slice(tbColStartIndex, tbColStartIndex + windowSize);

                const tbName = lookupAccountName(tbCode);
                const tbTr = document.createElement('tr');
                tbTr.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition-all bg-slate-50/40 italic text-slate-500';

                let showTbRow = true;
                if (query) {
                    const tbMatches = tbCode.toLowerCase().includes(query) || tbName.toLowerCase().includes(query);
                    const parentMatches = item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query);
                    showTbRow = parentMatches || tbMatches;
                } else {
                    showTbRow = !isCollapsed;
                }

                if (shouldHide || !showTbRow) {
                    tbTr.style.display = 'none';
                }

                let tbRowHtml = `
                    <td class="px-3 py-1.5 whitespace-nowrap text-[10px] w-[100px] text-slate-400 font-mono pl-6">
                        ${tbCode}
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-xs text-slate-400" style="padding-left: ${(indent + 1) * 14 + 16}px;">
                        <span class="inline-flex items-center gap-1">
                            <span class="w-3.5 h-3.5 flex items-center justify-center text-slate-300">
                                ↳
                            </span>
                            <span class="align-middle">${tbName}</span>
                        </span>
                    </td>
                `;

                visibleTbBalances.forEach(val => {
                    let formatted = '-';
                    let cellClass = 'text-slate-400';
                    if (val !== 0) {
                        formatted = mgtNumberFormat === 'full'
                            ? val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : formatAbbreviated(val);
                        cellClass = val < 0 ? 'text-red-400' : 'text-slate-500 font-medium';
                    }
                    tbRowHtml += `<td class="px-3 py-1.5 text-right whitespace-nowrap text-[10px] w-[110px] ${cellClass}">${formatted}</td>`;
                });

                tbTr.innerHTML = tbRowHtml;
                tableBody.appendChild(tbTr);
                tbRows.push(tbTr);
            });
            tbRowMap[item.code] = tbRows;
        }

        // Toggle expand/collapse via DOM (no full re-render)
        tr.addEventListener('click', (e) => {
            // Chart button
            if (e.target.closest('.mgt-chart-btn')) {
                e.stopPropagation();
                showAccountTrendChart(item.code, item.name, monthlyBalances);
                return;
            }

            if (isParent) {
                // Toggle collapsed state
                window.mgtCollapsedState[item.code] = !window.mgtCollapsedState[item.code];
                const nowCollapsed = window.mgtCollapsedState[item.code];

                // Animate caret
                const caret = tr.querySelector('.mgt-caret');
                if (caret) {
                    if (nowCollapsed) caret.classList.remove('open');
                    else caret.classList.add('open');
                }
                // Toggle parent expanded class
                if (nowCollapsed) tr.classList.remove('expanded');
                else tr.classList.add('expanded');

                // Show/hide all descendant rows
                function toggleDescendants(parentCode, hide) {
                    const children = MGT_ACCOUNTS_PARENT_MAP[parentCode] || [];
                    children.forEach(childCode => {
                        const childRow = rowMap[childCode];
                        if (!childRow) return;
                        if (hide) {
                            childRow.style.display = 'none';
                            const childTbRows = tbRowMap[childCode];
                            if (childTbRows) {
                                childTbRows.forEach(r => r.style.display = 'none');
                            }
                        } else {
                            if (!isMgtHidden(childCode, MGT_ACCOUNTS_PARENT_MAP)) {
                                childRow.style.display = '';
                                childRow.classList.remove('mgt-row-animate');
                                void childRow.offsetWidth; // force reflow
                                childRow.classList.add('mgt-row-animate');

                                const childCollapsed = !!window.mgtCollapsedState[childCode];
                                const childTbRows = tbRowMap[childCode];
                                if (childTbRows) {
                                    childTbRows.forEach(r => {
                                        r.style.display = childCollapsed ? 'none' : '';
                                    });
                                }
                            }
                        }
                        if (MGT_ACCOUNTS_PARENT_MAP[childCode]) {
                            const childCollapsed = !!window.mgtCollapsedState[childCode];
                            toggleDescendants(childCode, hide || childCollapsed);
                        }
                    });
                }

                toggleDescendants(item.code, nowCollapsed);
            } else if (hasTbDetail) {
                // Toggle collapsed state for leaf account detail view
                window.mgtCollapsedState[item.code] = !window.mgtCollapsedState[item.code];
                const nowCollapsed = window.mgtCollapsedState[item.code];

                // Animate caret
                const caret = tr.querySelector('.mgt-caret');
                if (caret) {
                    if (nowCollapsed) caret.classList.remove('open');
                    else caret.classList.add('open');
                }
                if (nowCollapsed) tr.classList.remove('expanded');
                else tr.classList.add('expanded');

                // Show/hide TB detail rows
                tbRows.forEach(tbTr => {
                    tbTr.style.display = nowCollapsed ? 'none' : '';
                });
            } else {
                showAccountTrendChart(item.code, item.name, monthlyBalances);
            }
        });
    });
}
