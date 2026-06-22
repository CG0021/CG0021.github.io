// ==========================================================
// ไฟล์สูตรการคำนวณ (Formulas)
// ==========================================================
// เขียนเป็นภาษาที่เข้าใจง่าย เพื่อให้คุณตรวจสอบและแก้ไขสูตรได้ด้วยตัวเอง

const FORMULAS = {
    "uc_collection_period": {
        name: "ระยะเวลาถัวเฉลี่ยในการเรียกเก็บหนี้สิทธิ UC",
        unit: "วัน",
        // รับตัวแปร ar_key และ rev_key เข้ามา เพื่อให้ใช้สูตรนี้กับกลุ่มย่อยไหนก็ได้
        calculate: function (ar_key, rev_key, getBeginBalance, getEndBalance, getMovement, getPrevSepBalance, getDaysInPeriod) {

            // รายได้สุทธิ (ใช้ยอดยกไป)
            let rev_uc = getEndBalance(rev_key);

            // ลูกหนี้ต้นงวด (บังคับใช้ยอดยกไปของเดือนกันยายนปีก่อน ถ้าไม่มีคือถือว่าไม่มีข้อมูลต้นงวด)
            let ar_uc_start = getPrevSepBalance(ar_key);

            // ลูกหนี้ปลายงวด (ยอดยกไป)
            let ar_uc_end = getEndBalance(ar_key);

            // 2. คำนวณตามสูตร
            // ถ้าไม่มียอดต้นงวด ให้ถือว่าไม่มีข้อมูล (n/a)
            if (ar_uc_start === null || ar_uc_start === 0) {
                return {
                    days_in_period: getDaysInPeriod(),
                    rev_uc: null,
                    ar_uc_start: null,
                    ar_uc_end: null,
                    avg_ar: null,
                    turnover_ratio: null,
                    collection_days: null
                };
            }

            // ลูกหนี้เฉลี่ย = (ลูกหนี้ต้นงวด + ลูกหนี้ปลายงวด) / 2
            let avg_ar = (ar_uc_start + ar_uc_end) / 2;

            // อัตราหมุนเวียนลูกหนี้ = รายได้รวมสุทธิ / ลูกหนี้เฉลี่ย
            let turnover_ratio = 0;
            if (avg_ar > 0) {
                turnover_ratio = rev_uc / avg_ar;
            }

            // ระยะเวลาเก็บหนี้ (วัน) = จำนวนวันสะสม / อัตราหมุนเวียนลูกหนี้
            // โดยนับเดือนละ 30 วัน (เช่น ตุลาคม = 30 วัน, พฤศจิกายน = 60 วัน)
            let days_in_period = getDaysInPeriod();
            let collection_days = 0;
            if (turnover_ratio > 0) {
                collection_days = days_in_period / turnover_ratio;
            }

            // คำนวณลูกหนี้ที่ควรจะเป็น และหนี้ไม่เคลื่อนไหวโดยประมาณ (เกณฑ์ 60 วัน)
            // ลูกหนี้ที่ควรจะเป็น = รายได้ทั้งปี ÷ 6 = (รายได้ของคาบเวลา / จำนวนวันในคาบเวลา) * 360 / 6 = รายได้ของคาบเวลา * 60 / จำนวนวันในคาบเวลา
            let should_be_ar = null;
            let inactive_ar = null;
            if (rev_uc !== null && days_in_period > 0) {
                should_be_ar = (rev_uc / days_in_period) * 60;
                if (avg_ar !== null) {
                    inactive_ar = Math.max(0, avg_ar - should_be_ar);
                }
            }

            // 3. ส่งค่ากลับไปแสดงผล
            return {
                days_in_period: days_in_period,
                rev_uc: rev_uc,
                ar_uc_start: ar_uc_start,
                ar_uc_end: ar_uc_end,
                avg_ar: avg_ar,
                turnover_ratio: turnover_ratio,
                collection_days: collection_days,
                should_be_ar: should_be_ar,
                inactive_ar: inactive_ar
            };
        }
    }
};
