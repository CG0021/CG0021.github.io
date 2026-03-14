// --- Authentication System (New Script) ---
// Note: You can deploy this as a separate Web App

function doGet(e) {
    const callback = e.parameter.callback || 'callback';
    const action = e.parameter.action;

    let result = { error: true, message: 'Invalid action' };

    if (action === 'login') {
        const user = e.parameter.username;
        const pass = e.parameter.password;

        // รายชื่อผู้ใช้งานทั้งหมด (สามารถเพิ่มได้ตามต้องการ)
        const USERS = {
            "admin": "admin123",
            "user1": "pass123",
            "sky": "tps2024",
            "hospital": "tps999"
        };

        if (USERS[user] && USERS[user] === pass) {
            result = {
                success: true,
                token: generateToken(user), // สร้าง Token สุ่มเพื่อให้ Client เก็บไว้
                message: 'Login successful'
            };
        } else {
            result = { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        }
    }

    // Return JSONP
    const output = callback + "(" + JSON.stringify(result) + ")";
    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ฟังก์ชันสร้าง Token แบบง่ายๆ (สำหรับจำลอง session)
function generateToken(username) {
    const secret = "TPS_SECRET_KEY_2024";
    const date = new Date().toDateString();
    return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, username + date + secret));
}
