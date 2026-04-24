const swaggerUi = require("swagger-ui-express");

function getServerUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function createSwaggerSpec(serverUrl) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Zalo Miniapp Backend API",
      version: "1.0.0",
      description: "Tài liệu API cho backend Zalo Mini App và nhóm Thần số học (Numerology).",
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "System", description: "Các tuyến đường (route) hệ thống" },
      { name: "Numerology", description: "Thần số học, phản hồi và tự động hóa" },
      { name: "Zalo", description: "Lấy thông tin người dùng Zalo và gửi tin nhắn OA" },
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            service: { type: "string", example: "zalo-backend" },
            time: { type: "string", format: "date-time" },
            integrations: {
              type: "object",
              properties: {
                mongodb: { type: "boolean", example: true },
                googleSheetWebhook: { type: "boolean", example: true },
              },
            },
          },
        },
        EducationLevel: {
          type: "object",
          properties: {
            value: { type: "string", example: "high_school" },
            label: { type: "string", example: "Cấp 3" },
          },
        },
        FeedbackRating: {
          type: "object",
          properties: {
            value: { type: "integer", example: 5 },
            label: { type: "string", example: "Rất hài lòng" },
          },
        },
        NumerologyAnalyzeRequest: {
          type: "object",
          required: ["fullName", "phone", "email", "birthDate", "educationLevel"],
          properties: {
            fullName: { type: "string", example: "Phan Đức Toàn" },
            phone: { type: "string", example: "0987654321" },
            email: { type: "string", format: "email", example: "pductoandev@gmail.com" },
            birthDate: { type: "string", format: "date", example: "2006-07-29" },
            province: { type: "string", example: "Cao Bằng" },
            district: { type: "string", example: "Cao Bằng" },
            educationLevel: {
              type: "string",
              enum: ["high_school", "college_student", "university_graduated"],
              example: "high_school",
            },
            zaloUserId: { type: "string", nullable: true, example: "1234567890" },
            source: { type: "string", example: "Zalo_MiniApp_Numerology" },
            campaign: { type: "string", nullable: true, example: "Career_Orientation_DCL_2026" },
          },
        },
        CrmPayload: {
          type: "object",
          properties: {
            customer: {
              type: "object",
              properties: {
                full_name: { type: "string", example: "Phan Đức Toàn" },
                phone: { type: "string", example: "0987654321" },
                email: { type: "string", example: "pductoandev@gmail.com" },
                address: { type: "string", example: "Cao Bằng, Cao Bằng" },
                education_level: { type: "string", example: "High_School" },
              },
            },
            numerology_result: {
              type: "object",
              properties: {
                life_path: { type: "integer", example: 8 },
                suggested_market: { type: "string", example: "Germany_18b" },
                note: { type: "string", example: "Tố chất kỹ thuật cao..." },
              },
            },
            marketing: {
              type: "object",
              properties: {
                source: { type: "string", example: "Zalo_MiniApp_Numerology" },
                campaign: { type: "string", example: "Career_Orientation_DCL_2026" },
                pdf_status: { type: "string", example: "Sent_To_Email" },
              },
            },
          },
        },
        CrmSyncResult: {
          type: "object",
          properties: {
            enabled: { type: "boolean", example: true },
            status: { type: "string", example: "sent" },
            message: { type: "string", nullable: true },
            target: { type: "string", nullable: true, example: "https://script.google.com/macros/s/..." },
            httpStatus: { type: "integer", nullable: true, example: 200 },
            transport: { type: "string", nullable: true, example: "google_sheet_webhook" },
            data: { type: "object", nullable: true },
          },
        },
        PersistenceResult: {
          type: "object",
          properties: {
            id: { type: "string" },
            storage: { type: "string", example: "mongodb" },
          },
        },
        NumerologyAnalyzeResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                submissionId: { type: "string", example: "4a524918-4839-4a74-8820-5c4503c2d600" },
                result: {
                  type: "object",
                  properties: {
                    coreNumbers: {
                      type: "object",
                      properties: {
                        lifePath: { type: "integer", example: 8 },
                        destiny: { type: "integer", example: 9 },
                        soulUrge: { type: "integer", example: 11 },
                      },
                    },
                    radarScores: {
                      type: "object",
                      properties: {
                        leadership: { type: "integer", example: 80 },
                        technical: { type: "integer", example: 45 },
                        empathy: { type: "integer", example: 45 },
                        creativity: { type: "integer", example: 45 },
                        discipline: { type: "integer", example: 45 },
                      },
                    },
                    suggestedProgram: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "korea_taiwan_business" },
                        market: { type: "string", example: "Korea/Taiwan" },
                        title: { type: "string", example: "Hàn / Đài - Kinh tế, quản trị, logistics" },
                        description: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        priority: { type: "integer", example: 70 },
                      },
                    },
                    summary: {
                      type: "object",
                      properties: {
                        title: { type: "string", example: "Người điều phối" },
                        summary: { type: "string" },
                        detail: { type: "string" },
                        strengths: { type: "array", items: { type: "string" } },
                        recommendation: { type: "string" },
                        note: { type: "string" },
                        topRadar: { type: "array", items: { type: "string" } },
                      },
                    },
                    contentSource: { type: "string", example: "mongodb" },
                  },
                },
                crmPayload: { $ref: "#/components/schemas/CrmPayload" },
                persistence: { $ref: "#/components/schemas/PersistenceResult" },
                crmSync: { $ref: "#/components/schemas/CrmSyncResult" },
                automationLog: { $ref: "#/components/schemas/PersistenceResult" },
              },
            },
          },
        },
        NumerologyFeedbackRequest: {
          type: "object",
          required: ["submissionId", "rating"],
          properties: {
            submissionId: { type: "string", example: "4a524918-4839-4a74-8820-5c4503c2d600" },
            leadId: { type: "string", nullable: true, example: "lead_123" },
            staffId: { type: "string", nullable: true, example: "NV01" },
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", example: "Tư vấn rõ ràng, dễ hiểu." },
          },
        },
        NumerologyFeedbackResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                feedbackId: { type: "string" },
                urgency: { type: "string", example: "low" },
                nextAction: { type: "string" },
                persistence: { $ref: "#/components/schemas/PersistenceResult" },
                crmSync: { $ref: "#/components/schemas/CrmSyncResult" },
                automationLog: { $ref: "#/components/schemas/PersistenceResult" },
              },
            },
          },
        },
        ConsultationCompletedRequest: {
          type: "object",
          required: ["submissionId"],
          properties: {
            submissionId: { type: "string", example: "4a524918-4839-4a74-8820-5c4503c2d600" },
            leadId: { type: "string", nullable: true, example: "lead_123" },
            staffId: { type: "string", nullable: true, example: "NV01" },
            staffName: { type: "string", nullable: true, example: "Tư vấn viên A" },
            studentName: { type: "string", nullable: true, example: "Phan Đức Toàn" },
          },
        },
        ConsultationCompletedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                submissionId: { type: "string" },
                feedbackLink: {
                  type: "string",
                  example: "https://zalo.me/s/HTO_App?page=feedback&submission_id=abc&lead_id=lead_123&staff_id=NV01",
                },
                feedbackMessage: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    ctaLabel: { type: "string" },
                    feedbackLink: { type: "string" },
                    sendAfterMinutes: { type: "integer", example: 5 },
                  },
                },
                crmSync: { $ref: "#/components/schemas/CrmSyncResult" },
                automationLog: { $ref: "#/components/schemas/PersistenceResult" },
              },
            },
          },
        },
        PdfMetadata: {
          type: "object",
          properties: {
            status: { type: "string", example: "generated" },
            filename: { type: "string", example: "Bao-cao-HTO-Phan-Duc-Toan.pdf" },
            contentType: { type: "string", example: "application/pdf" },
            sizeInBytes: { type: "integer", example: 148320 },
            pageCount: { type: "integer", example: 6 },
            generatedAt: { type: "string", format: "date-time" },
          },
        },
        DebugWebhookPayloadRequest: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["lead", "feedback", "consultation"],
              example: "lead",
            },
            fullName: { type: "string", example: "Phan Duc Toan" },
            phone: { type: "string", example: "0987654321" },
            email: { type: "string", example: "pductoandev@gmail.com" },
            birthDate: { type: "string", format: "date", example: "2006-07-29" },
            province: { type: "string", example: "Cao Bang" },
            district: { type: "string", example: "Cao Bang" },
            educationLevel: {
              type: "string",
              enum: ["high_school", "college_student", "university_graduated"],
              example: "high_school",
            },
            zaloUserId: { type: "string", nullable: true, example: "1234567890" },
            source: { type: "string", example: "Zalo_MiniApp_Numerology" },
            campaign: { type: "string", nullable: true, example: "Career_Orientation_DCL_2026" },
            submissionId: { type: "string", example: "4a524918-4839-4a74-8820-5c4503c2d600" },
            leadId: { type: "string", nullable: true, example: "lead_123" },
            staffId: { type: "string", nullable: true, example: "NV01" },
            staffName: { type: "string", nullable: true, example: "Tu van vien A" },
            studentName: { type: "string", nullable: true, example: "Nguyen Minh Anh" },
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", example: "Tu van ro rang, de hieu." },
          },
        },
        DebugWebhookPayloadResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                type: { type: "string", example: "lead" },
                crmPayload: { type: "object" },
                googleWebhookPayload: { type: "object" },
              },
            },
          },
        },
        ZaloPhoneRequest: {
          type: "object",
          required: ["accessToken", "code"],
          properties: {
            accessToken: { type: "string", example: "zalo_access_token" },
            code: { type: "string", example: "zalo_code" },
          },
        },
        SendOaMessageRequest: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", example: "123456789" },
            userName: { type: "string", example: "Phan Đức Toàn" },
            score: { type: "integer", example: 85 },
            actionUrl: { type: "string", example: "http://localhost:3000/" },
          },
        },
        GenericError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Yêu cầu không hợp lệ" },
            error: { oneOf: [{ type: "string" }, { type: "object" }] },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Kiểm tra trạng thái dịch vụ",
          responses: {
            200: {
              description: "Dịch vụ đang hoạt động bình thường",
              content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
            },
          },
        },
      },
      "/api/numerology/meta": {
        get: {
          tags: ["Numerology"],
          summary: "Lấy dữ liệu metadata cho frontend",
          responses: {
            200: {
              description: "Danh sách trình độ học vấn và mức đánh giá",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          educationLevels: { type: "array", items: { $ref: "#/components/schemas/EducationLevel" } },
                          feedbackRatings: { type: "array", items: { $ref: "#/components/schemas/FeedbackRating" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/numerology/analyze": {
        post: {
          tags: ["Numerology"],
          summary: "Phân tích Thần số học",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/NumerologyAnalyzeRequest" } } },
          },
          responses: {
            200: {
              description: "Phân tích thành công",
              content: { "application/json": { schema: { $ref: "#/components/schemas/NumerologyAnalyzeResponse" } } },
            },
            400: {
              description: "Thiếu thông tin hoặc dữ liệu sai định dạng",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
          },
        },
      },
      "/api/numerology/feedback": {
        post: {
          tags: ["Numerology"],
          summary: "Lưu phản hồi (feedback) sau tư vấn",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/NumerologyFeedbackRequest" } } },
          },
          responses: {
            200: {
              description: "Lưu phản hồi thành công",
              content: { "application/json": { schema: { $ref: "#/components/schemas/NumerologyFeedbackResponse" } } },
            },
            400: {
              description: "Yêu cầu không hợp lệ",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
          },
        },
      },
      "/api/numerology/consultation-completed": {
        post: {
          tags: ["Numerology"],
          summary: "Kích hoạt tự động hóa sau khi tư vấn viên hoàn tất cuộc gọi",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ConsultationCompletedRequest" } } },
          },
          responses: {
            200: {
              description: "Tạo link phản hồi và dữ liệu tự động hóa thành công",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ConsultationCompletedResponse" } } },
            },
            404: {
              description: "Không tìm thấy dữ liệu yêu cầu (submission)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
          },
        },
      },
      "/api/numerology/debug-webhook-payload": {
        post: {
          tags: ["Numerology"],
          summary: "Xem payload thuc te se gui len Google Sheet webhook",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/DebugWebhookPayloadRequest" } } },
          },
          responses: {
            200: {
              description: "Tra ve crmPayload va googleWebhookPayload da map",
              content: { "application/json": { schema: { $ref: "#/components/schemas/DebugWebhookPayloadResponse" } } },
            },
            400: {
              description: "Yeu cau khong hop le",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
            404: {
              description: "Khong tim thay submission",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
          },
        },
      },
      "/api/numerology/report/{submissionId}.pdf": {
        get: {
          tags: ["Numerology"],
          summary: "Tao va tai bao cao PDF theo submissionId",
          parameters: [
            {
              name: "submissionId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "4a524918-4839-4a74-8820-5c4503c2d600",
            },
          ],
          responses: {
            200: {
              description: "Tra ve file PDF bao cao numerology",
              content: {
                "application/pdf": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
            404: {
              description: "Khong tim thay submission",
              content: { "application/json": { schema: { $ref: "#/components/schemas/GenericError" } } },
            },
          },
        },
      },
      "/get-phone": {
        post: {
          tags: ["Zalo"],
          summary: "Lấy số điện thoại từ Zalo",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ZaloPhoneRequest" } } },
          },
          responses: {
            200: { description: "Kết quả trả về từ Zalo Graph API" },
            400: { description: "Thiếu accessToken hoặc mã code" },
          },
        },
      },
      "/get-phone-new": {
        post: {
          tags: ["Zalo"],
          summary: "Lấy số điện thoại từ Zalo với khóa bí mật (secret key) khác",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ZaloPhoneRequest" } } },
          },
          responses: {
            200: { description: "Kết quả trả về từ Zalo Graph API" },
            400: { description: "Thiếu accessToken hoặc mã code" },
          },
        },
      },
      "/decode-phone": {
        post: {
          tags: ["Zalo"],
          summary: "Giải mã số điện thoại từ Zalo",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ZaloPhoneRequest" } } },
          },
          responses: { 200: { description: "Giải mã thành công" } },
        },
      },
      "/user-info": {
        post: {
          tags: ["Zalo"],
          summary: "Lấy thông tin người dùng từ Zalo",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ZaloPhoneRequest" } } },
          },
          responses: { 200: { description: "Lấy thông tin người dùng thành công" } },
        },
      },
      "/send-oa-message": {
        post: {
          tags: ["Zalo"],
          summary: "Gửi tin nhắn từ tài khoản OA",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/SendOaMessageRequest" } } },
          },
          responses: {
            200: { description: "Gửi tin nhắn OA thành công" },
            400: { description: "ID người dùng (userId) không hợp lệ" },
          },
        },
      },
    },
  };
}

function registerSwagger(app) {
  app.get("/api-docs.json", (req, res) => {
    const spec = createSwaggerSpec(getServerUrl(req));
    return res.json(spec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      explorer: true,
      swaggerOptions: {
        url: "/api-docs.json",
      },
    })
  );
}

module.exports = {
  registerSwagger,
};
