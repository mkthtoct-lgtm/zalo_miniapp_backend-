function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return errorResponse("Máy chủ bận");

  try {
    var props = PropertiesService.getScriptProperties();
    var spreadsheetId = props.getProperty("spreadsheet_id");
    var ss = spreadsheetId
      ? SpreadsheetApp.openById(spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    var p = JSON.parse(e.postData.contents);

    // --- PHÂN LOẠI DỮ LIỆU ---
    var isVisa = p.visaType || p.country || (p.sheet_name === "VISA_DATA");
    var isNumerologyLead =
      p.sheet_name === "NUMEROLOGY_LEADS" ||
      p.event_type === "numerology_lead_sync";
    var isNumerologyFeedback =
      p.sheet_name === "NUMEROLOGY_FEEDBACK" ||
      p.event_type === "numerology_feedback_sync";
    var isNumerologyAutomation =
      p.sheet_name === "NUMEROLOGY_AUTOMATION" ||
      p.event_type === "consultation_completed";

    var sheetName = "HITO_DATA";
    if (isVisa) {
      sheetName = "VISA_DATA";
    } else if (isNumerologyLead) {
      sheetName = "NUMEROLOGY_LEADS";
    } else if (isNumerologyFeedback) {
      sheetName = "NUMEROLOGY_FEEDBACK";
    } else if (isNumerologyAutomation) {
      sheetName = "NUMEROLOGY_AUTOMATION";
    }

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      try {
        sheet = ss.insertSheet(sheetName);
      } catch (insertError) {
        return errorResponse("Khong tao duoc sheet " + sheetName + ": " + insertError);
      }

      if (isVisa) {
        sheet.appendRow([
          "Thời gian",
          "Họ Tên",
          "SĐT",
          "Email",
          "Ngày sinh",
          "Quốc gia",
          "Loại Visa",
          "Điểm",
          "Xếp hạng"
        ]);
      } else if (isNumerologyLead) {
        sheet.appendRow([
          "Thời gian",
          "Loại",
          "ID Gửi",
          "Họ Tên",
          "SĐT",
          "Email",
          "Ngày sinh",
          "Tỉnh/Thành",
          "Quận/Huyện",
          "Trình độ học vấn",
          "Đường đời (Life Path)",
          "Sứ mệnh (Destiny)",
          "Linh hồn (Soul Urge)",
          "Thị trường gợi ý",
          "Ghi chú"
        ]);
      } else if (isNumerologyFeedback) {
        sheet.appendRow([
          "Thời gian",
          "Loại",
          "ID Gửi",
          "ID Khách",
          "ID Nhân viên",
          "ID Phản hồi",
          "Họ Tên",
          "SĐT",
          "Email",
          "Ngày sinh",
          "Đánh giá",
          "Độ cấp thiết",
          "Bình luận"
        ]);
      } else if (isNumerologyAutomation) {
        sheet.appendRow([
          "Thời gian",
          "Loại",
          "ID Gửi",
          "ID Khách",
          "ID Nhân viên",
          "Tên nhân viên",
          "Học sinh",
          "SĐT",
          "Email",
          "Ngày sinh",
          "Chương trình gợi ý",
          "Link phản hồi",
          "Trạng thái"
        ]);
      } else {
        sheet.appendRow([
          "Thời gian",
          "Loại",
          "Họ Tên",
          "SĐT",
          "Email",
          "Ngày sinh",
          "Điểm",
          "Quà tặng"
        ]);
      }
    }

    var time = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    if (isVisa) {
      // --- LOGIC CŨ CHO VISA TEST ---
      var name = p.fullName || p.full_name || "Khách Visa";
      var phone = p.phone || "";
      var email = p.email || "";
      var birthday = p.birthDate || p.birth_date || "";
      var country = p.country || "";
      var vType = p.visaType || "";
      var score = p.totalScore || "0";
      var rating = p.rating || "";

      sheet.appendRow([time, name, phone, email, birthday, country, vType, score, rating]);

      sendToBizfly({
        "fullname": name,
        "phone": phone,
        "qr_code": "VISA_TEST_" + country.toUpperCase(),
        "language": "Visa: " + vType + " | Điểm: " + score + " | Xếp hạng: " + rating + " | NS: " + birthday
      });
    } else if (isNumerologyLead) {
      // --- THÊM MỚI: NUMEROLOGY LEAD ---
      var nLeadName = p.full_name || p.fullName || "Khách Numerology";
      var nLeadPhone = p.phone || "";
      var nLeadEmail = p.email || "";
      var nLeadBirth = p.birth_date || p.birthDate || "";
      var nLeadProvince = p.province || "";
      var nLeadDistrict = p.district || "";
      var nLeadEducation = p.education_level || p.educationLevel || "";
      var nLeadLifePath = p.score || p.life_path || "";
      var nLeadDestiny = p.destiny || "";
      var nLeadSoulUrge = p.soul_urge || "";
      var nLeadMarket = p.gift_name || p.suggested_market || "";
      var nLeadNote = p.note || "";
      var nLeadSubmissionId = p.submission_id || "";

      sheet.appendRow([
        time,
        "NUMEROLOGY_LEAD",
        nLeadSubmissionId,
        nLeadName,
        nLeadPhone,
        nLeadEmail,
        nLeadBirth,
        nLeadProvince,
        nLeadDistrict,
        nLeadEducation,
        nLeadLifePath,
        nLeadDestiny,
        nLeadSoulUrge,
        nLeadMarket,
        nLeadNote
      ]);

      sendToBizfly({
        "fullname": nLeadName,
        "phone": nLeadPhone,
        "qr_code": "NUMEROLOGY_LEAD",
        "language":
          "Đường đời: " + nLeadLifePath +
          " | Thị trường: " + nLeadMarket +
          " | Học vấn: " + nLeadEducation +
          " | NS: " + nLeadBirth
      });
    } else if (isNumerologyFeedback) {
      // --- THÊM MỚI: NUMEROLOGY FEEDBACK ---
      var nFeedbackName = p.full_name || p.fullName || "Khách Phản hồi";
      var nFeedbackPhone = p.phone || "";
      var nFeedbackEmail = p.email || "";
      var nFeedbackBirth = p.birth_date || p.birthDate || "";
      var nFeedbackSubmissionId = p.submission_id || "";
      var nFeedbackLeadId = p.lead_id || "";
      var nFeedbackStaffId = p.staff_id || "";
      var nFeedbackId = p.feedback_id || "";
      var nFeedbackRating = p.rating || p.score || "";
      var nFeedbackUrgency = p.urgency || "";
      var nFeedbackComment = p.comment || p.gift_name || "";

      sheet.appendRow([
        time,
        "NUMEROLOGY_FEEDBACK",
        nFeedbackSubmissionId,
        nFeedbackLeadId,
        nFeedbackStaffId,
        nFeedbackId,
        nFeedbackName,
        nFeedbackPhone,
        nFeedbackEmail,
        nFeedbackBirth,
        nFeedbackRating,
        nFeedbackUrgency,
        nFeedbackComment
      ]);

      sendToBizfly({
        "fullname": nFeedbackName,
        "phone": nFeedbackPhone,
        "qr_code": "NUMEROLOGY_FEEDBACK",
        "language":
          "Đánh giá: " + nFeedbackRating +
          " | Cấp thiết: " + nFeedbackUrgency +
          " | Bình luận: " + nFeedbackComment
      });
    } else if (isNumerologyAutomation) {
      // --- THÊM MỚI: NUMEROLOGY AUTOMATION / HOÀN TẤT TƯ VẤN ---
      var nAutoStudent = p.student_name || p.full_name || "Khách Tư Vấn";
      var nAutoPhone = p.phone || "";
      var nAutoEmail = p.email || "";
      var nAutoBirth = p.birth_date || p.birthDate || "";
      var nAutoSubmissionId = p.submission_id || "";
      var nAutoLeadId = p.lead_id || "";
      var nAutoStaffId = p.staff_id || "";
      var nAutoStaffName = p.staff_name || "";
      var nAutoProgram = p.suggested_program || p.score || "";
      var nAutoFeedbackLink = p.feedback_link || p.gift_name || "";
      var nAutoStatus = p.status || "";

      sheet.appendRow([
        time,
        "NUMEROLOGY_AUTOMATION",
        nAutoSubmissionId,
        nAutoLeadId,
        nAutoStaffId,
        nAutoStaffName,
        nAutoStudent,
        nAutoPhone,
        nAutoEmail,
        nAutoBirth,
        nAutoProgram,
        nAutoFeedbackLink,
        nAutoStatus
      ]);

      sendToBizfly({
        "fullname": nAutoStudent,
        "phone": nAutoPhone,
        "qr_code": "NUMEROLOGY_AUTOMATION",
        "language":
          "Chương trình: " + nAutoProgram +
          " | Nhân viên: " + nAutoStaffName +
          " | Trạng thái: " + nAutoStatus
      });
    } else {
      // --- LOGIC CŨ CHO HITO GAME ---
      var name = p.full_name || "Khách Game";
      var phone = p.phone || "";
      var email = p.email || "";
      var score = p.score || "0";
      var birthday = p.birth_date || p.birthDate || "";
      var gift = p.gift_name || "";

      sheet.appendRow([time, "HITO_GAME", name, phone, email, birthday, score, gift]);

      sendToBizfly({
        "fullname": name,
        "phone": phone,
        "qr_code": "HITO_ADVENTURE",
        "language": "Điểm: " + score + " | Quà: " + gift + " | NS: " + birthday
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "sheet": sheetName }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return errorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

function sendToBizfly(data) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("weburl");
  if (!webhookUrl) {
    console.warn("Chưa cấu hình weburl trong Property Service");
    return;
  }

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(data),
    "muteHttpExceptions": true
  };
  UrlFetchApp.fetch(webhookUrl, options);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ "result": "error", "message": msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
