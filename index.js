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
const ZALO_SECRET_KEY_1 = "08vwXY668Oh4P42I7qC8"; // HT Đại Dương Đánh Giá Năng Lực Ngoại Ngữ
const ZALO_SECRET_KEY_2 = "YMXGYUd1sQ6D6B3uHZuG"; // HT Đại Dương Trắc Nghiệm Hướng Nghiệp
const ZALO_DV_ID = "77HL8lDBUm8qiNi2D3RT";       // HT Tổng hợp

const STATIC_OA_ACCESS_TOKEN = "ndtOSHNMRoN7VDrn4DLk8CfvsciVjWLRdrwp3HUbJX2QTvWYIzuiB9e3t30rj3u5aKJNBoUs63khTDilCwC48wbkv7SUmX1-inB2NmJXF5kZBODd1Dz-S8TmW6SIf6bsYLoyMrYrI5Z_7e5MBz1UKVWlbNfGqY8lsphY7M6GBWxaKk1IDeKoKfbynN8jkIHD_dF97bUe8mxNNv4OGvnaFCH1l6nrgmbesWVOIGxn57-WFgieTj997-02loLfqMWg_p-aFr7eJpNa0hW7IlPQ4DWegWHl-caulX6PEZBATncPCRWwBkXWCQSGrdbms0j8z0FBP3kl5KwNMTzxFliMKUGAmd1omWujw1pZ4Mkm5nFGRQ80HhbW4-b9q1f4wsGzwIIH1s7uRmwkLua82OTjEgb7XpHoLt7YceTb4Cbi8G";

const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzu3wXv7Le7XgtNnie9fjFzVNbGPMmmLANaR8rGKYUaHlJa-87-egf2FQKJChi5-r2H/exec";

// =============================
// 1. GET PHONE
// =============================
app.post('/get-phone', async (req, res) => {
    const { accessToken, code } = req.body;
    if (!accessToken || !code) return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: { access_token: accessToken, code: code, secret_key: ZALO_DV_ID }
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
    if (!accessToken || !code) return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: { access_token: accessToken, code: code, secret_key: ZALO_SECRET_KEY_2 }
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
    const { userId, userName, score, actionUrl } = req.body;
    if (!userId || userId.includes('guest')) return res.status(400).json({ success: false, message: "userId không hợp lệ" });

    const payload = {
        recipient: { user_id: userId },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "list",
                    elements: [{
                        title: "Kết quả đánh giá",
                        subtitle: `👤 ${userName || 'Bạn'} - ${score}/100`,
                        image_url: "https://i.imgur.com/4M34hi2.png",
                        default_action: { type: "oa.open.url", url: actionUrl || "https://zalo.me/" }
                    }],
                    buttons: [{ title: "Chi tiết ngành học", type: "oa.open.url", url: actionUrl || "https://zalo.me/" }]
                }
            }
        }
    };

    try {
        const response = await axios.post("https://openapi.zalo.me/v3.0/oa/message/cs", payload, {
            headers: { "Content-Type": "application/json", access_token: STATIC_OA_ACCESS_TOKEN }
        });
        return res.json(response.data);
    } catch (err) {
        return res.status(500).json({ error: err.response?.data || err.message });
    }
});

// =============================
// 4. HITO ADVENTURE - SUBMIT
// =============================
app.post('/api/hito/submit', async (req, res) => {
    try {
        const data = req.body;
        axios.post(GOOGLE_SHEET_WEBHOOK_URL, data).catch(err => console.error("❌ Lỗi Sheet:", err.message));
        return res.json({ success: true, message: "Backend đã nhận và đang xử lý" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// =============================
// 5. VISA TEST - SUBMIT FULL PROFILE
// =============================
app.post('/api/visa/submit-full', async (req, res) => {
    try {
        const data = req.body;
        console.log("✈️ [VISA TEST] NHẬN HỒ SƠ:", JSON.stringify(data));
        if (!data.phone) return res.status(400).json({ success: false, message: "Thiếu số điện thoại" });
        const payload = { ...data, sheet_name: "VISA_DATA" };
        axios.post(GOOGLE_SHEET_WEBHOOK_URL, payload).catch(err => console.error("❌ Lỗi Sheet:", err.message));
        return res.json({ success: true, message: "Hồ sơ Visa đã được tiếp nhận." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// =============================
// 6. BỔ SUNG ROUTE CHO VISA TEST (Tránh lỗi 404 Zalo)
// =============================
app.get('/countries', (req, res) => res.json([]));
app.get('/questions', (req, res) => res.json([]));
app.post('/calculate', (req, res) => res.json({ totalScore: 0, rating: "Đang xử lý", suggestions: [] }));

app.post('/decode-phone', async (req, res) => {
    const { accessToken, code } = req.body;
    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: { access_token: accessToken, code: code, secret_key: ZALO_DV_ID }
        });
        return res.json({ success: true, phone: response.data.data?.number, data: response.data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/user-info', async (req, res) => {
    const { accessToken, code } = req.body;
    try {
        const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
            headers: { access_token: accessToken, code: code, secret_key: ZALO_DV_ID }
        });
        return res.json({ success: true, data: response.data.data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));