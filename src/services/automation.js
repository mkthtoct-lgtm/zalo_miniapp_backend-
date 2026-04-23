function createAutomationService() {
  const publicBaseUrl = process.env.PUBLIC_APP_BASE_URL || "";
  const surveyDelayMinutes = Number(process.env.FEEDBACK_SURVEY_DELAY_MINUTES || 5);

  function buildFeedbackLink({ submissionId, leadId, staffId }) {
    const url = new URL(publicBaseUrl);
    url.searchParams.set("page", "feedback");
    url.searchParams.set("submission_id", submissionId);

    if (leadId) {
      url.searchParams.set("lead_id", leadId);
    }

    if (staffId) {
      url.searchParams.set("staff_id", staffId);
    }

    return url.toString();
  }

  function buildFeedbackMessage({ studentName, suggestedProgramTitle, staffName, feedbackLink }) {
    return {
      title: "Khảo sát trải nghiệm tư vấn HTO Group",
      body:
        `Chào ${studentName || "bạn"}, cảm ơn em đã trao đổi cùng HTO` +
        `${suggestedProgramTitle ? ` về lộ trình ${suggestedProgramTitle}` : ""}. ` +
        `Mời em dành 30 giây để đánh giá chất lượng tư vấn` +
        `${staffName ? ` của ${staffName}` : ""} nhé.`,
      ctaLabel: "Đánh giá ngay",
      feedbackLink,
      sendAfterMinutes: surveyDelayMinutes,
    };
  }

  return {
    buildFeedbackLink,
    buildFeedbackMessage,
  };
}

module.exports = {
  createAutomationService,
};
