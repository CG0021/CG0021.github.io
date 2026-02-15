# การโหลดข้อมูลสถิติบริการ (Services) ไว้พื้นหลัง

## สรุปการแก้ไข

ได้ทำการปรับปรุงระบบให้โหลดข้อมูล **สถิติบริการ (Services)** ไว้ล่วงหน้าพร้อมกับข้อมูลหลัก เพื่อไม่ต้องรอโหลดใหม่ทุกครั้งที่เปิดกราฟโครงสร้างทางการเงิน

## ปัญหาเดิม

เมื่อเปิดกราฟโครงสร้างทางการเงิน:
1. ระบบจะโหลดข้อมูล TPS และ Management ไว้แล้ว
2. แต่ข้อมูล **สถิติบริการ (OPD/IPD)** จะโหลดใหม่ทุกครั้งที่เปิดกราฟ
3. ทำให้ต้องรอ 5-10 วินาที เพื่อดึงข้อมูลจาก MOPH Open Data API
4. หากเปิดกราฟหลายครั้ง จะต้องรอโหลดซ้ำๆ

## วิธีแก้ไข

### 1. โหลดข้อมูล Services ไว้พื้นหลัง (Background Loading)

เพิ่มฟังก์ชัน `loadServiceDataInBackground()` ที่ทำงานหลังจากโหลดข้อมูล TPS/Management เสร็จ:

```javascript
async function loadServiceDataInBackground(hospitalItem) {
    // โหลดข้อมูล OPD และ IPD สำหรับ 5 ปีย้อนหลัง
    // เก็บไว้ใน hospitalItem.serviceData
    // ทำงานแบบ asynchronous ไม่บล็อก UI
}
```

**จุดเด่น:**
- ทำงานเบื้องหลังไม่รบกวนผู้ใช้
- โหลดข้อมูล 5 ปีย้อนหลังพร้อมกัน
- มี delay 300ms ระหว่างแต่ละ request เพื่อไม่ให้ API ล้น
- มี console log แจ้งสถานะการโหลด

### 2. ใช้ข้อมูลที่โหลดไว้แล้ว (Cache Usage)

ปรับปรุงฟังก์ชัน `loadServiceData()` ให้ตรวจสอบ cache ก่อน:

```javascript
async function loadServiceData(hospital) {
    // ตรวจสอบว่ามีข้อมูลที่โหลดไว้แล้วหรือไม่
    const hospitalItem = comparisonList.find(h => String(h.code) === String(hospital.code));
    if (hospitalItem && hospitalItem.serviceData && hospitalItem.serviceData.lastUpdated) {
        // ใช้ข้อมูลที่โหลดไว้แล้ว - ไม่ต้องรอ!
        console.log(`✨ Using pre-loaded service data`);
        renderServiceDataDisplay(container, hospital);
        return;
    }
    
    // ถ้าไม่มี ให้โหลดใหม่ (fallback)
    // ...
}
```

### 3. แยกส่วนแสดงผลออกมา

สร้างฟังก์ชัน `renderServiceDataDisplay()` เพื่อแสดงผลข้อมูล:
- ใช้ได้ทั้งกรณีมีข้อมูล cache และโหลดใหม่
- แสดงข้อมูล OPD/IPD ตามไตรมาสที่เลือก
- อัพเดทกราฟทันที

## ผลลัพธ์

### ก่อนแก้ไข
```
1. เลือกโรงพยาบาล → โหลด TPS/Management (2-3 วินาที)
2. กดเปิดกราฟ → รอโหลด Services (5-10 วินาที) ⏳
3. ปิดกราฟ
4. กดเปิดกราฟอีกครั้ง → รอโหลด Services อีกรอบ (5-10 วินาที) ⏳
```

### หลังแก้ไข
```
1. เลือกโรงพยาบาล → โหลด TPS/Management (2-3 วินาที)
   └─ พื้นหลัง: โหลด Services ไว้ (ไม่บล็อก UI) 🔄
2. กดเปิดกราฟ → แสดงทันที! ✨ (ใช้ข้อมูลที่โหลดไว้)
3. ปิดกราฟ
4. กดเปิดกราฟอีกครั้ง → แสดงทันที! ✨ (ใช้ข้อมูลเดิม)
```

## รายละเอียดทางเทคนิค

### โครงสร้างข้อมูลที่เก็บ

```javascript
hospitalItem.serviceData = {
    opdData: {
        2568: { result10: 1234, target10: 5678, ... },
        2567: { ... },
        // ... ข้อมูล 5 ปี
    },
    ipdData: {
        2568: { result10: 890, target10: 1234, ... },
        2567: { ... },
        // ... ข้อมูล 5 ปี
    },
    lastUpdated: Date // เวลาที่โหลดล่าสุด
}
```

### การทำงานของ Background Loading

1. **เมื่อเลือกโรงพยาบาล** (`selectHospital`)
   - โหลด TPS และ Management data (blocking)
   - เรียก `loadServiceDataInBackground()` (non-blocking)
   - UI ยังใช้งานได้ปกติ

2. **Background Loading Process**
   - ดึงรหัสจังหวัดจาก `PROVINCE_MAP`
   - Loop โหลดข้อมูล 5 ปีย้อนหลัง
   - แต่ละปีโหลด OPD และ IPD
   - Delay 300ms ระหว่าง request
   - เก็บข้อมูลใน `hospitalItem.serviceData`

3. **เมื่อเปิดกราฟ** (`loadServiceData`)
   - ตรวจสอบ `hospitalItem.serviceData.lastUpdated`
   - ถ้ามี → ใช้ทันที (instant)
   - ถ้าไม่มี → โหลดใหม่ (fallback)

## ประโยชน์

1. **ประสบการณ์ผู้ใช้ดีขึ้น** 
   - ไม่ต้องรอโหลดข้อมูล Services ทุกครั้ง
   - เปิดกราฟได้ทันที

2. **ลดภาระ API**
   - โหลดครั้งเดียวต่อโรงพยาบาล
   - ไม่ต้อง request ซ้ำๆ

3. **ทำงานเบื้องหลัง**
   - ไม่บล็อก UI
   - ผู้ใช้ทำงานอื่นได้ต่อ

4. **Fallback ที่แข็งแกร่ง**
   - ถ้า cache ไม่มี ก็โหลดใหม่ได้
   - ระบบยังทำงานได้ปกติ

## Console Messages

เมื่อระบบทำงาน จะเห็น log ดังนี้:

```
📊 Background loading service data for โรงพยาบาลทดสอบ (12345)...
✅ Service data loaded for โรงพยาบาลทดสอบ
✨ Using pre-loaded service data for โรงพยาบาลทดสอบ
```

## ข้อควรระวัง

1. **ข้อมูลอาจไม่ใหม่ล่าสุด**
   - ข้อมูลถูก cache ไว้ตั้งแต่เลือกโรงพยาบาล
   - ถ้าต้องการข้อมูลใหม่ ให้เลือกโรงพยาบาลใหม่

2. **ใช้หน่วยความจำมากขึ้น**
   - เก็บข้อมูล Services ของทุกโรงพยาบาลที่เลือก
   - แต่ไม่มากเกินไป (ประมาณ 50-100 KB ต่อโรงพยาบาล)

3. **API Timeout**
   - ถ้า API ช้าหรือไม่ตอบสนอง
   - Background loading จะ fail แต่ไม่กระทบ UI
   - เมื่อเปิดกราฟจะโหลดใหม่อัตโนมัติ

---

**ไฟล์ที่แก้ไข:** `Financial_Structure.html`

**ฟังก์ชันที่เพิ่ม/แก้ไข:**
- `loadServiceDataInBackground()` - ใหม่
- `renderServiceDataDisplay()` - ใหม่
- `selectHospital()` - แก้ไข (เพิ่มการเรียก background loading)
- `loadServiceData()` - แก้ไข (เพิ่มการตรวจสอบ cache)

วันที่อัพเดท: 18 มกราคม 2026
