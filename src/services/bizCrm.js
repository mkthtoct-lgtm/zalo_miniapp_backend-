const axios = require("axios");

function mapLeadPayload(payload) {
  return {
    sheet_name: "NUMEROLOGY_LEADS",
    event_type: "numerology_lead_sync",
    source: "Zalo_MiniApp_Numerology",
    full_name: payload.customer?.full_name || "Khach Numerology",
    phone: payload.customer?.phone || "",
    email: payload.customer?.email || "",
    submission_id: payload.submission_id || "",
    education_level: payload.customer?.education_level || "",
    address: payload.customer?.address || "",
    score: String(payload.numerology_result?.life_path || ""),
    life_path: payload.numerology_result?.life_path || "",
    suggested_market: payload.numerology_result?.suggested_market || "",
    gift_name: payload.numerology_result?.suggested_market || "",
    note: payload.numerology_result?.note || "",
    marketing: payload.marketing || {},
  };
}

function mapFeedbackPayload(payload) {
  return {
    sheet_name: "NUMEROLOGY_FEEDBACK",
    event_type: "numerology_feedback_sync",
    full_name: payload.student_name || "Khach Feedback",
    phone: payload.phone || "",
    email: payload.email || "",
    birth_date: payload.birth_date || "",
    submission_id: payload.submission_id || "",
    lead_id: payload.lead_id || "",
    staff_id: payload.staff_id || "",
    feedback_id: payload.feedback_id || "",
    score: String(payload.rating || ""),
    rating: payload.rating || "",
    urgency: payload.urgency || "",
    comment: payload.comment || "",
    gift_name: payload.comment || payload.urgency || "",
  };
}

function mapConsultationPayload(payload) {
  return {
    sheet_name: "NUMEROLOGY_AUTOMATION",
    event_type: "consultation_completed",
    full_name: payload.student_name || "Khach Tu Van",
    phone: payload.phone || "",
    email: payload.email || "",
    birth_date: payload.birth_date || "",
    submission_id: payload.submission_id || "",
    lead_id: payload.lead_id || "",
    staff_id: payload.staff_id || "",
    staff_name: payload.staff_name || "",
    score: payload.suggested_program || "",
    suggested_program: payload.suggested_program || "",
    feedback_link: payload.feedback_link || "",
    gift_name: payload.feedback_link || "",
    status: payload.status || "",
  };
}

function createBizCrmService() {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
  const enabled = Boolean(webhookUrl);

  async function post(payload) {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    return {
      enabled: true,
      status: "sent",
      target: webhookUrl,
      httpStatus: response.status,
      data: response.data,
      transport: "google_sheet_webhook",
    };
  }

  async function pushLead(payload) {
    if (!enabled) {
      return {
        enabled: false,
        status: "skipped",
        message: "GOOGLE_SHEET_WEBHOOK_URL is not configured",
      };
    }

    return post(mapLeadPayload(payload));
  }

  async function pushFeedback(payload) {
    if (!enabled) {
      return {
        enabled: false,
        status: "skipped",
        message: "GOOGLE_SHEET_WEBHOOK_URL is not configured",
      };
    }

    return post(mapFeedbackPayload(payload));
  }

  async function markConsultationCompleted(payload) {
    if (!enabled) {
      return {
        enabled: false,
        status: "skipped",
        message: "GOOGLE_SHEET_WEBHOOK_URL is not configured",
      };
    }

    return post(mapConsultationPayload(payload));
  }

  return {
    enabled,
    pushLead,
    pushFeedback,
    markConsultationCompleted,
  };
}

module.exports = {
  createBizCrmService,
  mapLeadPayload,
  mapFeedbackPayload,
  mapConsultationPayload,
};
