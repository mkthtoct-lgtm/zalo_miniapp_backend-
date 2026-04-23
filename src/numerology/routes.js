const express = require("express");
const crypto = require("crypto");

const { analyzeNumerology } = require("./calculate");
const { EDUCATION_LEVELS, FEEDBACK_RATINGS } = require("./content");
const {
  mapLeadPayload,
  mapFeedbackPayload,
  mapConsultationPayload,
} = require("../services/bizCrm");

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

function buildDefaultCrmState() {
  return {
    enabled: false,
    status: "skipped",
    message: "Biz CRM integration is not configured",
  };
}

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

function validateSubmission(body) {
  const requiredFields = ["fullName", "phone", "email", "birthDate", "educationLevel"];
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length) {
    return `Thieu truong bat buoc: ${missing.join(", ")}`;
  }

  if (!EDUCATION_LEVELS.some((item) => item.value === body.educationLevel)) {
    return "educationLevel khong hop le";
  }

  return null;
}

function createNumerologyRouter(repository, services = {}) {
  const router = express.Router();
  const crmService = services.crmService;
  const automationService = services.automationService;

  router.get("/meta", (req, res) => {
    return res.json({
      success: true,
      data: {
        educationLevels: EDUCATION_LEVELS,
        feedbackRatings: FEEDBACK_RATINGS,
      },
    });
  });

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

  router.post("/feedback", async (req, res) => {
    try {
      const { submissionId, staffId, rating, comment, leadId } = req.body;

      if (!submissionId || !rating) {
        return res.status(400).json({
          success: false,
          message: "Thieu submissionId hoac rating",
        });
      }

      if (!FEEDBACK_RATINGS.some((item) => item.value === Number(rating))) {
        return res.status(400).json({
          success: false,
          message: "rating khong hop le",
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
              ? "Tao ticket cham soc khan tren CRM"
              : "Ghi nhan feedback va tiep tuc flow nuoi duong",
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

  router.post("/consultation-completed", async (req, res) => {
    try {
      const { submissionId, leadId, staffId, staffName, studentName } = req.body;

      if (!submissionId) {
        return res.status(400).json({
          success: false,
          message: "Thieu submissionId",
        });
      }

      const submission = repository?.getSubmissionById
        ? await repository.getSubmissionById(submissionId)
        : null;

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Khong tim thay submission",
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
            message: "Thieu submissionId hoac rating",
          });
        }

        const submission = repository?.getSubmissionById
          ? await repository.getSubmissionById(submissionId)
          : null;

        if (!submission) {
          return res.status(404).json({
            success: false,
            message: "Khong tim thay submission",
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
            message: "Thieu submissionId",
          });
        }

        const submission = repository?.getSubmissionById
          ? await repository.getSubmissionById(submissionId)
          : null;

        if (!submission) {
          return res.status(404).json({
            success: false,
            message: "Khong tim thay submission",
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
        message: "type khong hop le",
      });
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
