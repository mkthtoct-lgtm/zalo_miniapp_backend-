const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// =============================
// CONFIG
// =============================
const ZALO_SECRET_KEY_1 = "08vwXY668Oh4P42I7qC8";//HT Đại Dương Đánh Giá Năng Lực Ngoại Ngữ(Ko đc xoá)
const ZALO_SECRET_KEY_2 = "YMXGYUd1sQ6D6B3uHZuG";//HT Đại Dương Trắc Nghiệm Hướng Nghiệp(ko đc xoá)
const ZALO_DV_ID = "77HL8lDBUm8qiNi2D3RT";//HT Tổng hợp(ko đc xoá)

// ⚠️ NÊN đưa vào .env
const STATIC_OA_ACCESS_TOKEN = "ndtOSHNMRoN7VDrn4DLk8CfvsciVjWLRdrwp3HUbJX2QTvWYIzuiB9e3t30rj3u5aKJNBoUs63khTDilCwC48wbkv7SUmX1-inB2NmJXF5kZBODd1Dz-S8TmW6SIf6bsYLoyMrYrI5Z_7e5MBz1UKVWlbNfGqY8lsphY7M6GBWxaKk1IDeKoKfbynN8jkIHD_dF97bUe8mxNNv4OGvnaFCH1l6nrgmbesWVOIGxn57-WFgieTj997-02loLfqMWg_p-aFr7eJpNa0hW7IlPQ4DWegWHl-caulX6PEZBATncPCRWwBkXWCQSGrdbms0j8z0FBP3kl5KwNMTzxFliMKUGAmd1omWujw1pZ4Mkm5nFGRQ80HhbW4-b9q1f4wsGzwIIH1s7uRmwkLua82OTjEgb7XpHoLt7YceTb4Cbi8G";

// Link Google Sheet (Để gửi data Hito Adventure)
// const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzD2kuNV0ZUqQrw9k3OAJU5xjPiQbAME79OwhDtezVnpQ6oCpyNTM8k029lNHhQ6thT/exec";
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzu3wXv7Le7XgtNnie9fjFzVNbGPMmmLANaR8rGKYUaHlJa-87-egf2FQKJChi5-r2H/exec";
// =============================
// 1. GET PHONE
// =============================
app.post('/get-phone', async (req, res) => {
    const { accessToken, code } = req.body;

    if (!accessToken || !code) {
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }

    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: {
                access_token: accessToken,
                code: code,
                secret_key: ZALO_DV_ID
                
            }
        });

        return res.json(response.data);

    } catch (err) {
        console.error("🔥 get-phone error:", err.response?.data || err.message);
        return res.status(500).json({ error: err.message });
    }
});

// =============================
// 2. GET PHONE NEW
// =============================
app.post('/get-phone-new', async (req, res) => {
    const { accessToken, code } = req.body;

    if (!accessToken || !code) {
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }

    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: {
                access_token: accessToken,
                code: code,
                secret_key: ZALO_SECRET_KEY_2
            }
        });

        return res.json(response.data);

    } catch (err) {
        console.error("🔥 get-phone-new error:", err.response?.data || err.message);
        return res.status(500).json({ error: err.message });
    }
});

// =============================
// 3. SEND OA MESSAGE (FINAL)
// =============================
app.post('/send-oa-message', async (req, res) => {
    const { userId, userName, score, strongestSkill, weakestSkill, actionUrl } = req.body;

    if (!userId || userId.includes('guest')) {
        return res.status(400).json({
            success: false,
            message: "userId không hợp lệ"
        });
    }

   const payload = {
    recipient: {
        user_id: userId
    },
    message: {
        attachment: {
            type: "template",
            payload: {
                template_type: "list", // ⚠️ đổi generic -> list cho ổn định
                elements: [
                    {
                        title: "Kết quả đánh giá",
                        subtitle: `👤 ${userName || 'Bạn'} - ${score}/100`,
                        image_url: "https://i.imgur.com/4M34hi2.png",
                        default_action: {
                            type: "oa.open.url",
                            url: actionUrl || "https://zalo.me/"
                        }
                    }
                ],
                buttons: [
                    {
                        title: "Chi tiết ngành học",
                        type: "oa.open.url",
                        url: actionUrl || "https://zalo.me/"
                    }
                ]
            }
        }
    }
};

    try {
        console.log("📤 Payload:", payload);

    const response = await axios.post(
    "https://openapi.zalo.me/v3.0/oa/message/cs",
    payload,
    {
        headers: {
            "Content-Type": "application/json",
            access_token: STATIC_OA_ACCESS_TOKEN
        }
    }
);

        console.log("📩 Zalo response:", response.data);

        return res.json(response.data);

    } catch (err) {
        console.error("🔥 ERROR:", err.response?.data || err.message);

        return res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});

// =============================
// 4. HITO ADVENTURE - SUBMIT (Đoạn mới thêm vào)
// =============================
app.post('/api/hito/submit', async (req, res) => {
    try {
        const data = req.body;
        console.log("-------------------------------------------");
        console.log("🎮 [HITO ADVENTURE] NHẬN DATA MỚI:");
        console.log(`👤 Tên: ${data.full_name}`);
        console.log(`📞 SĐT: ${data.phone}`);
        console.log(`🏆 Điểm: ${data.score} | 🎁 Quà: ${data.gift_name}`);
        console.log("-------------------------------------------");

        // Gửi sang Google Sheet (GAS sẽ tự đẩy sang Bizfly CRM)
        axios.post(GOOGLE_SHEET_WEBHOOK_URL, data)
            .then(() => console.log("✅ Đã đẩy sang Google Sheet thành công."))
            .catch(err => console.error("❌ Lỗi Sheet:", err.message));

        return res.json({ success: true, message: "Backend đã nhận và đang xử lý" });
    } catch (err) {
        console.error("🔥 Lỗi Route Submit:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// =============================
// 5. VISA TEST - SUBMIT FULL PROFILE
// =============================
app.post('/api/visa/submit-full', async (req, res) => {
    try {
        const data = req.body;
        
        // Log để kiểm tra xem dữ liệu thực tế bay lên là gì
        console.log("-------------------------------------------");
        console.log("✈️ [VISA TEST] NHẬN HỒ SƠ TƯ VẤN:", JSON.stringify(data));
        
        // Kiểm tra dữ liệu bắt buộc
        if (!data.phone) {
            return res.status(400).json({ success: false, message: "Thiếu số điện thoại" });
        }

        const payload = {
            ...data,
            sheet_name: "VISA_DATA" 
        };

        // Gửi sang Google Sheet
        axios.post(GOOGLE_SHEET_WEBHOOK_URL, payload)
            .then(() => console.log("✅ Đã lưu vào Google Sheet"))
            .catch(err => console.error("❌ Lỗi Sheet:", err.message));

        return res.json({ success: true, message: "Hồ sơ Visa đã được tiếp nhận." });
    } catch (err) {
        console.error("🔥 Lỗi Route Visa Submit:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// =============================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});