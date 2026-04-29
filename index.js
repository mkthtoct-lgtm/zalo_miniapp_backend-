const express = require("express");
const axios = require("axios");
const cors = require("cors");

const { loadEnvFile } = require("./src/config/loadEnv");
const { createRepository } = require("./src/storage/repository");
const { createNumerologyRouter } = require("./src/numerology/routes");
const { registerSwagger } = require("./src/docs/swagger");
const { createBizCrmService } = require("./src/services/bizCrm");
const { createAutomationService } = require("./src/services/automation");

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3003;
const repository = createRepository();
const crmService = createBizCrmService();
const automationService = createAutomationService();

app.use(cors());
app.use(express.json());
registerSwagger(app);

const ZALO_SECRET_KEY_1 = process.env.ZALO_SECRET_KEY_1 || "";
const ZALO_SECRET_KEY_2 = process.env.ZALO_SECRET_KEY_2 || "";
const ZALO_DV_ID = process.env.ZALO_DV_ID || "";
const STATIC_OA_ACCESS_TOKEN = process.env.STATIC_OA_ACCESS_TOKEN || "";
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbx3338E4GqYvfisTHl0PBIdpuYeMXwjs6M-vzXDNIpBK4F4PurrBCusHV18_qZwk2M/exec";

app.get("/health", (req, res) => {
  return res.json({
    success: true,
    service: "zalo-backend",
    version: process.env.COMMIT_SHA || "local",
    time: new Date().toISOString(),
    integrations: {
      mongodb: Boolean(process.env.MONGODB_URI),
      googleSheetWebhook: crmService.enabled,
    },
  });
});

app.use("/api/numerology", createNumerologyRouter(repository, { crmService, automationService }));

app.post("/get-phone", async (req, res) => {
  const { accessToken, code } = req.body;
  if (!accessToken || !code) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  try {
    const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
      headers: { access_token: accessToken, code, secret_key: ZALO_DV_ID },
    });
    return res.json(response.data);
  } catch (err) {
    console.error("get-phone error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/get-phone-new", async (req, res) => {
  const { accessToken, code } = req.body;
  if (!accessToken || !code) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  try {
    const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
      headers: { access_token: accessToken, code, secret_key: ZALO_DV_ID },
    });
    return res.json(response.data);
  } catch (err) {
    console.error("get-phone-new error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/send-oa-message", async (req, res) => {
  const { userId, userName, score, actionUrl } = req.body;
  if (!userId || userId.includes("guest")) {
    return res.status(400).json({ success: false, message: "userId không hợp lệ" });
  }

  const payload = {
    recipient: { user_id: userId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          elements: [
            {
              title: "Kết quả đánh giá",
              subtitle: `${userName || "Bạn"} - ${score || 0}/100`,
              image_url: "https://i.imgur.com/4M34hi2.png",
              default_action: { type: "oa.open.url", url: actionUrl || "https://zalo.me/" },
            },
          ],
          buttons: [
            { title: "Chi tiết ngành học", type: "oa.open.url", url: actionUrl || "https://zalo.me/" },
          ],
        },
      },
    },
  };

  try {
    const response = await axios.post("https://openapi.zalo.me/v3.0/oa/message/cs", payload, {
      headers: { "Content-Type": "application/json", access_token: STATIC_OA_ACCESS_TOKEN },
    });
    return res.json(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post("/api/hito/submit", async (req, res) => {
  try {
    const data = req.body;
    axios.post(GOOGLE_SHEET_WEBHOOK_URL, data).catch((err) => console.error("Sheet error:", err.message));
    return res.json({ success: true, message: "Backend đã nhận và đang xử lý" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/visa/submit-full", async (req, res) => {
  try {
    const data = req.body;
    if (!data.phone) {
      return res.status(400).json({ success: false, message: "Thiếu số điện thoại" });
    }

    const payload = { ...data, sheet_name: "VISA_DATA" };
    axios.post(GOOGLE_SHEET_WEBHOOK_URL, payload).catch((err) => console.error("Sheet error:", err.message));
    return res.json({ success: true, message: "Hồ sơ Visa đã được tiếp nhận." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/countries", (req, res) => res.json([]));
app.get("/questions", (req, res) => res.json([]));
app.post("/calculate", (req, res) =>
  res.json({ totalScore: 0, rating: "Đang xử lý", suggestions: [] })
);

app.post("/decode-phone", async (req, res) => {
  const { accessToken, code } = req.body;
  try {
    const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
      headers: { access_token: accessToken, code, secret_key: ZALO_DV_ID },
    });
    return res.json({ success: true, phone: response.data.data?.number, data: response.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/user-info", async (req, res) => {
  const { accessToken, code } = req.body;
  try {
    const response = await axios.get("https://graph.zalo.me/v2.0/me/info", {
      headers: { access_token: accessToken, code, secret_key: ZALO_DV_ID },
    });
    return res.json({ success: true, data: response.data.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =================================================================
// CẬP NHẬT: API XỬ LÝ KHẢO SÁT HITO CÓ GẮN AWAIT BẮT LỖI
// =================================================================
app.post("/api/khao-sat/submit", async (req, res) => {
  try {
    const data = req.body;

    if (!data.phone) {
      return res.status(400).json({ success: false, message: "Thiếu số điện thoại khách hàng" });
    }

    const payloadToSheet = {
      ...data,
      sheet_name: "KHAO_SAT_HITO_V1",
    };

    // ĐÃ THÊM AWAIT VÀ CHUYỂN VÀO TRY-CATCH
    await axios.post(GOOGLE_SHEET_WEBHOOK_URL, payloadToSheet);

    return res.json({ success: true, message: "Hồ sơ Khảo sát đã được tiếp nhận thành công." });
  } catch (err) {
    console.error("❌ Lỗi khi đẩy Khảo Sát lên Google Sheet:", err.message);
    // Báo lỗi 500 thẳng ra Postman
    return res.status(500).json({ success: false, error: err.message, message: "Lỗi kết nối tới Google Sheet" });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));