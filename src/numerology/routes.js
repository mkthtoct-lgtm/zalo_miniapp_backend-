/**
 * Numerology Routes Module
 * Handles API endpoints for numerology calculation, lead feedback, consultation tracking, and PDF generation.
 */
const express = require("express");
const crypto = require("crypto");

const { analyzeNumerology } = require("./calculate");
const { EDUCATION_LEVELS, FEEDBACK_RATINGS } = require("./content");
const {
  mapLeadPayload,
  mapFeedbackPayload,
  mapConsultationPayload,
} = require("../services/bizCrm");
const { generateNumerologyPdf } = require("../services/pdfReport");

/**
 * Builds the payload structure required by the CRM system for a new lead.
 * Formats addresses, education levels, and suggested markets to match CRM specifications.
 * 
 * @param {Object} input - The raw user input from the submission form.
 * @param {Object} result - The calculated numerology results.
 * @param {string} submissionId - Unique identifier for this submission.
 * @returns {Object} The formatted CRM payload containing customer, result, and marketing data.
 */
function buildCrmPayload(input, result, submissionId) {
  const addressParts = [input.district, input.province].filter(Boolean);

  function formatEducationLevel(value) {
    switch (value) {
      case "high_school":
        return "High_School";
      case "college_student":
        return "University_Student";
      case "university_graduated":
        return "University_Graduated";
      default:
        return value || "";
    }
  }

  function formatSuggestedMarket(value) {
    if (!value) return "";

    return String(value)
      .split("_")
      .map((part) => {
        if (part === "18b") return "18b";
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("_");
  }

  return {
    customer: {
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      address: addressParts.join(", "),
      education_level: formatEducationLevel(input.educationLevel),
    },
    numerology_result: {
      life_path: result.coreNumbers.lifePath,
      suggested_market: formatSuggestedMarket(result.suggestedProgram.id),
      note: result.summary.note,
    },
    marketing: {
      source: input.source || "Zalo_MiniApp_Numerology",
      campaign: input.campaign || null,
      pdf_status: "Sent_To_Email",
    },
  };
}

/**
 * Generates a default, skipped state for CRM synchronization.
 * Used when the CRM service is not configured or disabled.
 * 
 * @returns {Object} Default CRM sync state object.
 */
function buildDefaultCrmState() {
  return {
    enabled: false,
    status: "skipped",
    message: "Biz CRM integration is not configured",
  };
}

/**
 * Saves an automation event (e.g., CRM sync result, PDF generation) to the database.
 * 
 * @param {Object} repository - Database repository instance.
 * @param {Object} payload - The automation event data to persist.
 * @returns {Promise<Object|null>} The saved automation log or null if saving is not supported.
 */
async function persistAutomationEvent(repository, payload) {
  if (!repository?.saveAutomationEvent) {
    return null;
  }

  return repository.saveAutomationEvent({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload,
  });
}

/**
 * Validates the required fields and constraints for a new numerology submission.
 * 
 * @param {Object} body - The request body to validate.
 * @returns {string|null} An error message if validation fails, or null if successful.
 */
function validateSubmission(body) {
  const requiredFields = ["fullName", "phone", "email", "birthDate", "educationLevel"];
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length) {
    return `Thiếu trường bắt buộc: ${missing.join(", ")}`;
  }

  if (!EDUCATION_LEVELS.some((item) => item.value === body.educationLevel)) {
    return "educationLevel không hợp lệ";
  }

  return null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function persistReportPdf(repository, submissionId, report, pdfInfo = {}) {
  if (!repository?.updateSubmissionPdf) {
    return null;
  }

  return repository.updateSubmissionPdf(submissionId, {
    status: "generated",
    filename: report.filename,
    contentType: report.contentType,
    sizeInBytes: report.buffer.length,
    pageCount: report.pageCount,
    generatedAt: new Date().toISOString(),
    ...pdfInfo,
  });
}

/**
 * Factory function to create the Express router for numerology endpoints.
 * Injects necessary dependencies like the database repository and external services.
 * 
 * @param {Object} repository - Data access layer for submissions, feedbacks, etc.
 * @param {Object} services - External services (e.g., crmService, automationService).
 * @returns {express.Router} The configured Express router.
 */
function createNumerologyRouter(repository, services = {}) {
  const router = express.Router();
  const crmService = services.crmService;
  const automationService = services.automationService;
  const emailService = services.emailService;

  /**
   * GET /meta
   * Returns metadata used by the frontend, such as education level options and feedback ratings.
   */
  router.get("/meta", (req, res) => {
    return res.json({
      success: true,
      data: {
        educationLevels: EDUCATION_LEVELS,
        feedbackRatings: FEEDBACK_RATINGS,
      },
    });
  });

  /**
   * POST /analyze
   * Main endpoint to process a numerology submission.
   * Validates input, calculates core numbers, saves the submission,
   * attempts to sync with the CRM, and logs the automation event.
   */
  router.post("/analyze", async (req, res) => {
    try {
      const validationError = validateSubmission(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const submissionId = crypto.randomUUID();
      const input = {
        fullName: req.body.fullName,
        phone: req.body.phone,
        email: req.body.email,
        birthDate: req.body.birthDate,
        province: req.body.province || "",
        district: req.body.district || "",
        educationLevel: req.body.educationLevel,
        zaloUserId: req.body.zaloUserId || "",
        source: req.body.source,
        campaign: req.body.campaign,
      };

      const result = await analyzeNumerology(input, repository);
      const crmPayload = buildCrmPayload(input, result, submissionId);

      const persistence = await repository.saveSubmission({
        id: submissionId,
        createdAt: new Date().toISOString(),
        input,
        result,
        crmPayload,
      });

      let crmSync = buildDefaultCrmState();
      try {
        crmSync = crmService ? await crmService.pushLead(crmPayload) : crmSync;
      } catch (error) {
        crmSync = {
          enabled: true,
          status: "failed",
          message: error.message,
        };
      }

      const automationLog = await persistAutomationEvent(repository, {
        type: "crm_lead_sync",
        submissionId,
        payload: crmPayload,
        result: crmSync,
      });

      return res.json({
        success: true,
        data: {
          submissionId,
          result,
          crmPayload,
          persistence,
          crmSync,
          automationLog,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /feedback
   * Handles staff feedback on a specific numerology lead.
   * Calculates urgency based on rating, saves feedback to DB,
   * syncs with CRM, and determines next action (e.g., high priority care).
   */
  router.post("/feedback", async (req, res) => {
    try {
      const { submissionId, staffId, rating, comment, leadId } = req.body;

      if (!submissionId || !rating) {
        return res.status(400).json({
          success: false,
          message: "Thiếu submissionId hoặc rating",
        });
      }

      if (!FEEDBACK_RATINGS.some((item) => item.value === Number(rating))) {
        return res.status(400).json({
          success: false,
          message: "rating không hợp lệ",
        });
      }

      const feedbackId = crypto.randomUUID();
      const urgency = Number(rating) <= 2 ? "high" : Number(rating) === 3 ? "medium" : "low";
      const submission = repository?.getSubmissionById
        ? await repository.getSubmissionById(submissionId)
        : null;

      const persistence = await repository.saveFeedback({
        id: feedbackId,
        submissionId,
        leadId: leadId || null,
        staffId: staffId || null,
        rating: Number(rating),
        comment: comment || "",
        urgency,
        createdAt: new Date().toISOString(),
      });

      const crmFeedbackPayload = {
        submission_id: submissionId,
        lead_id: leadId || null,
        staff_id: staffId || null,
        feedback_id: feedbackId,
        full_name: submission?.input?.fullName || "",
        phone: submission?.input?.phone || "",
        email: submission?.input?.email || "",
        birth_date: submission?.input?.birthDate || "",
        rating: Number(rating),
        comment: comment || "",
        urgency,
      };

      let crmSync = buildDefaultCrmState();
      try {
        crmSync = crmService ? await crmService.pushFeedback(crmFeedbackPayload) : crmSync;
      } catch (error) {
        crmSync = {
          enabled: true,
          status: "failed",
          message: error.message,
        };
      }

      const automationLog = await persistAutomationEvent(repository, {
        type: "crm_feedback_sync",
        submissionId,
        payload: crmFeedbackPayload,
        result: crmSync,
      });

      return res.json({
        success: true,
        data: {
          feedbackId,
          urgency,
          nextAction:
            urgency === "high"
              ? "Tạo ticket chăm sóc khẩn trên CRM"
              : "Ghi nhận feedback và tiếp tục flow nuôi dưỡng",
          persistence,
          crmSync,
          automationLog,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /consultation-completed
   * Marks a consultation as completed by a staff member.
   * Generates feedback links, updates the lead status in CRM,
   * and records the consultation completion event.
   */
  router.post("/consultation-completed", async (req, res) => {
    try {
      const { submissionId, leadId, staffId, staffName, studentName } = req.body;

      if (!submissionId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu submissionId",
        });
      }

      const submission = repository?.getSubmissionById
        ? await repository.getSubmissionById(submissionId)
        : null;

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy submission",
        });
      }

      const feedbackLink = automationService
        ? automationService.buildFeedbackLink({ submissionId, leadId, staffId })
        : null;
      const feedbackMessage = automationService
        ? automationService.buildFeedbackMessage({
          studentName: studentName || submission.input?.fullName,
          suggestedProgramTitle: submission.result?.suggestedProgram?.title,
          staffName,
          feedbackLink,
        })
        : null;

      const automationPayload = {
        submission_id: submissionId,
        lead_id: leadId || null,
        staff_id: staffId || null,
        staff_name: staffName || null,
        student_name: studentName || submission.input?.fullName || null,
        phone: submission.input?.phone || "",
        email: submission.input?.email || "",
        birth_date: submission.input?.birthDate || "",
        status: "consultation_completed",
        feedback_link: feedbackLink,
        suggested_program: submission.result?.suggestedProgram?.id || null,
      };

      let crmSync = buildDefaultCrmState();
      try {
        crmSync = crmService ? await crmService.markConsultationCompleted(automationPayload) : crmSync;
      } catch (error) {
        crmSync = {
          enabled: true,
          status: "failed",
          message: error.message,
        };
      }

      const automationLog = await persistAutomationEvent(repository, {
        type: "consultation_completed",
        submissionId,
        payload: automationPayload,
        result: crmSync,
      });

      return res.json({
        success: true,
        data: {
          submissionId,
          feedbackLink,
          feedbackMessage,
          crmSync,
          automationLog,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /debug-webhook-payload
   * Utility endpoint for developers to preview the exact payloads
   * that will be sent to external webhooks (CRM, Google Sheets, etc.)
   * without actually sending them or saving to the database.
   */
  router.post("/debug-webhook-payload", async (req, res) => {
    try {
      const { type } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Thieu type",
        });
      }

      if (type === "lead") {
        const validationError = validateSubmission(req.body);
        if (validationError) {
          return res.status(400).json({ success: false, message: validationError });
        }

        const input = {
          fullName: req.body.fullName,
          phone: req.body.phone,
          email: req.body.email,
          birthDate: req.body.birthDate,
          province: req.body.province || "",
          district: req.body.district || "",
          educationLevel: req.body.educationLevel,
          zaloUserId: req.body.zaloUserId || "",
          source: req.body.source,
          campaign: req.body.campaign,
        };

        const result = await analyzeNumerology(input, repository);
        const crmPayload = buildCrmPayload(input, result);

        return res.json({
          success: true,
          data: {
            type,
            crmPayload,
            googleWebhookPayload: mapLeadPayload(crmPayload),
          },
        });
      }

      if (type === "feedback") {
        const { submissionId, staffId, rating, comment, leadId } = req.body;

        if (!submissionId || !rating) {
          return res.status(400).json({
            success: false,
            message: "Thiếu submissionId hoặc rating",
          });
        }

        const submission = repository?.getSubmissionById
          ? await repository.getSubmissionById(submissionId)
          : null;

        if (!submission) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy submission",
          });
        }

        const urgency = Number(rating) <= 2 ? "high" : Number(rating) === 3 ? "medium" : "low";
        const crmFeedbackPayload = {
          submission_id: submissionId,
          lead_id: leadId || null,
          staff_id: staffId || null,
          feedback_id: "debug-feedback-id",
          full_name: submission?.input?.fullName || "",
          phone: submission?.input?.phone || "",
          email: submission?.input?.email || "",
          birth_date: submission?.input?.birthDate || "",
          rating: Number(rating),
          comment: comment || "",
          urgency,
        };

        return res.json({
          success: true,
          data: {
            type,
            crmPayload: crmFeedbackPayload,
            googleWebhookPayload: mapFeedbackPayload(crmFeedbackPayload),
          },
        });
      }

      if (type === "consultation") {
        const { submissionId, leadId, staffId, staffName, studentName } = req.body;

        if (!submissionId) {
          return res.status(400).json({
            success: false,
            message: "Thiếu submissionId",
          });
        }

        const submission = repository?.getSubmissionById
          ? await repository.getSubmissionById(submissionId)
          : null;

        if (!submission) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy submission",
          });
        }

        const feedbackLink = automationService
          ? automationService.buildFeedbackLink({ submissionId, leadId, staffId })
          : null;

        const automationPayload = {
          submission_id: submissionId,
          lead_id: leadId || null,
          staff_id: staffId || null,
          staff_name: staffName || null,
          student_name: studentName || submission.input?.fullName || null,
          phone: submission.input?.phone || "",
          email: submission.input?.email || "",
          birth_date: submission.input?.birthDate || "",
          status: "consultation_completed",
          feedback_link: feedbackLink,
          suggested_program: submission.result?.suggestedProgram?.id || null,
        };

        return res.json({
          success: true,
          data: {
            type,
            crmPayload: automationPayload,
            googleWebhookPayload: mapConsultationPayload(automationPayload),
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: "type không hợp lệ",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * POST /report/:submissionId/email
   * Generates a personalized PDF report and sends it to the submission email.
   */
  router.post("/report/:submissionId/email", async (req, res) => {
    try {
      const { submissionId } = req.params;
      const submission = repository?.getSubmissionById
        ? await repository.getSubmissionById(submissionId)
        : null;

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Khong tim thay submission",
        });
      }

      const recipientEmail = String(req.body?.email || submission.input?.email || "").trim();
      if (!isValidEmail(recipientEmail)) {
        return res.status(400).json({
          success: false,
          message: "Email khong hop le",
        });
      }

      if (!emailService?.enabled) {
        return res.status(503).json({
          success: false,
          message: "Dich vu email chua duoc cau hinh SMTP",
        });
      }

      const report = await generateNumerologyPdf({ submission });
      const mailResult = await emailService.sendNumerologyReport({
        submission,
        report,
        to: recipientEmail,
      });

      const pdfPersistence = await persistReportPdf(repository, submissionId, report, {
        status: "sent_to_email",
        email: recipientEmail,
        messageId: mailResult.messageId,
        emailedAt: new Date().toISOString(),
      });

      const automationLog = await persistAutomationEvent(repository, {
        type: "pdf_email_sent",
        submissionId,
        payload: {
          email: recipientEmail,
          filename: report.filename,
          sizeInBytes: report.buffer.length,
          pageCount: report.pageCount,
        },
        result: {
          mail: mailResult,
          pdf: pdfPersistence,
        },
      });

      return res.json({
        success: true,
        data: {
          submissionId,
          email: recipientEmail,
          filename: report.filename,
          mail: mailResult,
          pdfPersistence,
          automationLog,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * GET /report/:submissionId.pdf
   * Generates and returns a personalized PDF report for a given submission.
   * Updates the submission record with PDF metadata upon successful generation.
   */
  router.get("/report/:submissionId.pdf", async (req, res) => {
    try {
      const { submissionId } = req.params;
      const submission = repository?.getSubmissionById
        ? await repository.getSubmissionById(submissionId)
        : null;

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy submission",
        });
      }

      const report = await generateNumerologyPdf({ submission });

      const pdfPersistence = await persistReportPdf(repository, submissionId, report);
      await persistAutomationEvent(repository, {
        type: "pdf_generated",
        submissionId,
        payload: {
          filename: report.filename,
          sizeInBytes: report.buffer.length,
          pageCount: report.pageCount,
        },
        result: pdfPersistence,
      });

      res.setHeader("Content-Type", report.contentType);
      res.setHeader("Content-Length", report.buffer.length);
      res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
      return res.send(report.buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
}

module.exports = {
  createNumerologyRouter,
};
