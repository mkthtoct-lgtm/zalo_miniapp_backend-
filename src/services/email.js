const nodemailer = require("nodemailer");

// --- Helper Functions ---

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function toPort(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildAddress(name, email) {
  if (!email) return "";
  if (String(email).includes("<")) return String(email);
  const safeName = String(name || "").replace(/"/g, '\\"').trim();
  return safeName ? `"${safeName}" <${email}>` : String(email);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- core Logic ---

function getSmtpConfig(env = process.env) {
  const host = env.SMTP_HOST || env.MAIL_HOST || "";
  const secureDefault = String(env.SMTP_PORT || env.MAIL_PORT || "") === "465";
  const secure = toBoolean(env.SMTP_SECURE || env.MAIL_SECURE, secureDefault);
  const port = toPort(env.SMTP_PORT || env.MAIL_PORT, secure ? 465 : 587);
  const user = env.SMTP_USER || env.MAIL_USER || "";
  const pass = env.SMTP_PASS || env.MAIL_PASS || "";
  const fromEmail = env.SMTP_FROM_EMAIL || env.MAIL_FROM_EMAIL || env.MAIL_FROM || user;
  const fromName = env.SMTP_FROM_NAME || env.MAIL_FROM_NAME || "HTO Group";
  const replyTo = env.SMTP_REPLY_TO || env.MAIL_REPLY_TO || "";

  const transportOptions = {
    host,
    port,
    secure,
    // Thêm pool để tối ưu hiệu suất nếu gửi nhiều mail
    pool: true,
    maxConnections: 5,
    auth: user || pass ? { user, pass } : undefined,
  };

  return {
    host,
    from: buildAddress(fromName, fromEmail),
    replyTo,
    transportOptions,
  };
}

function buildReportHtml(fullName) {
  const safeName = escapeHtml(fullName || "Bạn");
  const primaryColor = "#2563eb"; // Định nghĩa lại biến bị thiếu trong bản cũ

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Báo cáo Thần số học HTO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header (Logo) -->
          <tr>
            <td align="center" style="padding: 40px 32px 24px 32px;">
              <a href="https://hto.edu.vn/" target="_blank" style="text-decoration: none;">
                <img src="https://i.ibb.co/YFKdtZZB/Logo-HTO-GROUP.png" alt="HTO GROUP" border="0" width="120" style="display: block; width: 120px; height: auto;">
              </a>
              <div style="margin-top: 20px; height: 3px; width: 40px; background-color: ${primaryColor}; border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px 40px; color: #1e293b; font-size: 16px; line-height: 1.6;">
              <p style="margin-top: 0; font-size: 18px; color: #0f172a;">Xin chào <strong>${safeName}</strong>,</p>
              <p>Cảm ơn bạn đã tin tưởng lựa chọn <strong>HTO Group</strong> để cùng khám phá những tiềm năng ẩn giấu của bản thân qua Thần số học.</p>
              <p>Chúng mình xin gửi kèm bản <span style="color: ${primaryColor}; font-weight: 600;">Báo cáo Thần số học & Định hướng sự nghiệp</span> chi tiết trong tệp đính kèm.</p>

              <!-- Box Note -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #f1f5f9; border-left: 4px solid ${primaryColor}; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #475569;">
                      <strong style="color: #334155;">💡 Lưu ý:</strong> 
                      Báo cáo này bao gồm các phân tích sâu về con số chủ đạo, năng lực bẩm sinh và các giai đoạn biến đổi quan trọng của bạn trong năm 2026.
                    </p>
                  </td>
                </tr>
              </table>

              <p>Nếu cần hỗ trợ giải mã chi tiết hơn hoặc có bất kỳ thắc mắc nào, bạn có thể:</p>
              <ul style="padding-left: 20px; margin: 16px 0; color: #334155;">
                <li style="margin-bottom: 8px;">Phản hồi trực tiếp email này.</li>
                <li style="margin-bottom: 8px;">Gọi Hotline: <a href="tel:18009078" style="color: ${primaryColor}; text-decoration: none; font-weight: bold;">1800 9078</a></li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Trân trọng,<br />
                <strong style="color: #1e293b; font-size: 15px; text-transform: uppercase;">Đội ngũ HTO Group</strong>
              </p>
              <div style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">© 2026 HTO Group. All rights reserved.</p>
                <p style="margin: 4px 0 0 0;">Đây là email hệ thống, vui lòng không trả lời trực tiếp.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReportText(fullName) {
  return [
    `Xin chào ${fullName || "bạn"},`,
    "",
    "HTO Group xin gửi bạn báo cáo PDF Thần số học và định hướng sự nghiệp trong tệp đính kèm.",
    "Nếu cần tư vấn chi tiết hơn, vui lòng phản hồi email này hoặc liên hệ hotline 1800 9078.",
    "",
    "Trân trọng,",
    "HTO Group",
  ].join("\n");
}

function sanitizeMailResult(info) {
  return {
    messageId: info.messageId || null,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    response: info.response || null,
  };
}

// --- Service Factory ---

function createEmailService(env = process.env) {
  const config = getSmtpConfig(env);
  const enabled = Boolean(config.host && config.from);
  
  // Khởi tạo transporter một lần duy nhất để tận dụng pool
  const transporter = enabled ? nodemailer.createTransport(config.transportOptions) : null;

  return {
    enabled,
    async sendNumerologyReport({ submission, report, to }) {
      if (!enabled) throw new Error("Email service is not configured");
      if (!to) throw new Error("Missing recipient email");

      const input = submission?.input || {};
      const fullName = input.fullName || "Khách hàng";

      const info = await transporter.sendMail({
        from: config.from,
        to,
        replyTo: config.replyTo || undefined,
        subject: `Báo cáo Thần số học HTO - ${fullName}`,
        text: buildReportText(fullName),
        html: buildReportHtml(fullName),
        attachments: [
          {
            filename: report.filename,
            content: report.buffer,
            contentType: report.contentType || 'application/pdf',
          },
        ],
      });

      return sanitizeMailResult(info);
    },
  };
}

module.exports = { createEmailService };