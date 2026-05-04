const nodemailer = require("nodemailer");

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function toPort(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildAddress(name, email) {
  if (!email) {
    return "";
  }

  if (String(email).includes("<")) {
    return String(email);
  }

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
  };

  if (user || pass) {
    transportOptions.auth = { user, pass };
  }

  return {
    host,
    from: buildAddress(fromName, fromEmail),
    replyTo,
    transportOptions,
  };
}

function buildReportHtml(fullName) {
  const safeName = escapeHtml(fullName || "ban");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Xin chao ${safeName},</p>
      <p>HTO Group gui ban bao cao PDF Than so hoc va dinh huong su nghiep trong tep dinh kem.</p>
      <p>Neu can tu van chi tiet hon, vui long phan hoi email nay hoac lien he hotline 1800 9078.</p>
      <p style="margin-top:24px">Tran trong,<br/>HTO Group</p>
    </div>
  `;
}

function buildReportText(fullName) {
  return [
    `Xin chao ${fullName || "ban"},`,
    "",
    "HTO Group gui ban bao cao PDF Than so hoc va dinh huong su nghiep trong tep dinh kem.",
    "Neu can tu van chi tiet hon, vui long phan hoi email nay hoac lien he hotline 1800 9078.",
    "",
    "Tran trong,",
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

function createEmailService(env = process.env) {
  const config = getSmtpConfig(env);
  const enabled = Boolean(config.host && config.from);

  return {
    enabled,
    async sendNumerologyReport({ submission, report, to }) {
      if (!enabled) {
        throw new Error("Email service is not configured");
      }

      if (!to) {
        throw new Error("Missing recipient email");
      }

      const input = submission.input || {};
      const fullName = input.fullName || "Khach hang";
      const transporter = nodemailer.createTransport(config.transportOptions);
      const info = await transporter.sendMail({
        from: config.from,
        to,
        replyTo: config.replyTo || undefined,
        subject: `Bao cao Than so hoc HTO - ${fullName}`,
        text: buildReportText(fullName),
        html: buildReportHtml(fullName),
        attachments: [
          {
            filename: report.filename,
            content: report.buffer,
            contentType: report.contentType,
          },
        ],
      });

      return sanitizeMailResult(info);
    },
  };
}

module.exports = {
  createEmailService,
};