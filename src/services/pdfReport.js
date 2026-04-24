const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

function getCeoImageBase64() {
  try {
    const ceoPath = path.join(__dirname, "..", "public", "images", "CEO.png");
    const base64 = fs.readFileSync(ceoPath).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return "";
  }
}

function slugifyName(value) {
  return (
    String(value || "Khach-hang")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "Khach-hang"
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPdfFilename(fullName) {
  return `Bao-cao-HTO-${slugifyName(fullName)}.pdf`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN");
}

function labelEducation(value) {
  const labels = {
    high_school: "Cấp 3",
    college_student: "Đang học Đại học",
    university_graduated: "Đã tốt nghiệp Đại học",
  };

  return labels[value] || value || "";
}

function labelRadar(key) {
  const labels = {
    leadership: "Lãnh đạo",
    technical: "Kỹ thuật",
    empathy: "Thấu cảm",
    creativity: "Sáng tạo",
    discipline: "Kỷ luật",
  };

  return labels[key] || key;
}

function renderRadarBars(radarScores) {
  return Object.entries(radarScores || {})
    .map(
      ([key, value]) => `
        <div class="bar-item">
          <div class="bar-label-row">
            <span>${escapeHtml(labelRadar(key))}</span>
            <strong>${escapeHtml(value)}/100</strong>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderBulletList(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function buildHtml(submission) {
  const input = submission.input || {};
  const result = submission.result || {};
  const summary = result.summary || {};
  const program = result.suggestedProgram || {};
  const core = result.coreNumbers || {};
  const radar = result.radarScores || {};
  const location = [input.district, input.province].filter(Boolean).join(", ");
  const fullName = input.fullName || "Ten_Hoc_Sinh";
  const ceoImgSrc = getCeoImageBase64();
  const lifePath = core.lifePath || "";
  const destiny = core.destiny || "";
  const soulUrge = core.soulUrge || "";
  const topRadar = (summary.topRadar || []).map(labelRadar).join(", ");
  const programTitle = program.title || "Lộ trình đang cập nhật";
  const programDescription =
    program.description || "Đang cập nhật mô tả lộ trình.";
  const programTags = (program.tags || []).join(" | ");
  const radarPolygon = `100,${200 - (Number(radar.leadership) || 0) * 1.5} ${100 + (Number(radar.technical) || 0) * 0.9
    },${100 - (Number(radar.technical) || 0) * 0.25} ${100 + (Number(radar.creativity) || 0) * 0.55
    },${100 + (Number(radar.creativity) || 0) * 0.85} ${100 - (Number(radar.empathy) || 0) * 0.55
    },${100 + (Number(radar.empathy) || 0) * 0.85} ${100 - (Number(radar.discipline) || 0) * 0.9
    },${100 - (Number(radar.discipline) || 0) * 0.25}`;

  return `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(buildPdfFilename(input.fullName).replace(/\.pdf$/i, ""))}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          position: relative;
          background: white;
          page-break-after: always;
        }
        .cosmic-bg {
          background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
        }
        .text-gold { color: #d4af37; }
        .bg-gold { background-color: #d4af37; }
        .border-gold { border-color: #d4af37; }
        .card-border {
          border: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body class="bg-gray-100">
      <section class="page cosmic-bg text-white flex flex-col justify-between p-16">
             <div class="flex justify-between items-center">
                <img src="https://i.ibb.co/gZ4D2MdP/Logo-HTO-GROUP-1-1.png" alt="Logo HTO GROUP 1 1" width="100px">
            <div class="text-right text-sm opacity-70">Hotline: 1800 9078</div>
        </div>

        <div class="relative z-10">
          <h1 class="text-6xl font-bold leading-tight mb-8">BẢN ĐỒ <br> GIẢI MÃ NĂNG LỰC <br> & ĐỊNH HƯỚNG <br> <span class="text-gold">SỰ NGHIỆP TOÀN CẦU</span></h1>
          <div class="h-1 w-32 bg-gold mb-8"></div>
          <div class="text-xl">
            <p class="opacity-70 mb-1">Dành riêng cho bạn:</p>
            <p class="font-bold text-2xl uppercase tracking-widest text-gold">${escapeHtml(fullName)}</p>
          </div>
        </div>

        <div class="flex justify-between items-end border-t border-white/20 pt-8">
          <p class="text-sm opacity-50 max-w-xs italic">Kiến tạo lộ trình thực chất cho nguồn lực Việt vươn tầm thế giới.</p>
          <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <span class="text-xs">2026</span>
          </div>
        </div>
      </section>

      <section class="page p-16 flex flex-col justify-center">
        <div class="max-w-2xl">
          <h2 class="text-blue-900 text-3xl font-bold mb-10 uppercase border-l-4 border-gold pl-6">Thông điệp từ HTO & Triết lý Sư Tử Te</h2>
          <div class="text-slate-700 leading-relaxed space-y-6 text-lg">
            <p class="italic font-semibold text-blue-800 text-2xl">"Chúng tôi không vẽ màu hồng, chúng tôi thiết kế lộ trình thực chất."</p>
            <p>Chào ${escapeHtml(fullName)}, HTO tin rằng mỗi cá nhân là một thực thể độc lập với những thế mạnh riêng biệt cần được khai phá đúng cách.</p>
            <p>Bản báo cáo này tổng hợp dữ liệu thần số học, xu hướng năng lực và lộ trình quốc tế để giúp đội ngũ tư vấn HTO đồng hành cùng bạn một cách rõ ràng hơn.</p>
            <p>Thông tin khai báo hiện tại: ${escapeHtml(location || "Đang cập nhật khu vực")} | Học vấn: ${escapeHtml(labelEducation(input.educationLevel))}.</p>
          </div>

          <div class="mt-16 pt-10 border-t border-slate-100">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-slate-200 rounded-full">
                <img src="${ceoImgSrc}" alt="Logo">
              </div>
              <div>
                <p class="font-bold text-blue-900">HTO GROUP</p>
                <p class="text-sm text-slate-500">Ký xác nhận báo cáo định hướng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="page p-12 bg-slate-50">
        <h2 class="text-center text-2xl font-bold text-blue-900 mb-12 uppercase">Giải mã những con số cốt lõi</h2>
        <div class="grid grid-cols-2 gap-8 mb-12">
          <div class="bg-white p-8 card-border">
            <h3 class="text-gold font-bold mb-2">Chỉ số Đường đời (Life Path)</h3>
            <div class="text-4xl font-bold text-blue-900 mb-4">Số ${escapeHtml(lifePath)}</div>
            <p class="text-sm text-slate-600">${escapeHtml(summary.summary || "Đang cập nhật diễn giải Life Path.")}</p>
          </div>
          <div class="bg-white p-8 card-border text-white bg-blue-900">
            <h3 class="text-gold font-bold mb-2">Linh hồn & Sứ mệnh</h3>
            <p class="text-sm opacity-90 mb-4">Soul Urge ${escapeHtml(soulUrge)} và Destiny ${escapeHtml(destiny)} cho thấy động lực nội tại và cách bạn muốn được công nhận.</p>
            <p class="font-semibold italic">"${escapeHtml(summary.title || "Sinh ra để phát triển năng lực riêng.")}"</p>
          </div>
        </div>

        <div class="bg-white p-8 card-border flex flex-col items-center">
          <h3 class="font-bold text-blue-900 mb-8 uppercase tracking-wider">Biểu đồ năng lực (Radar Chart)</h3>
          <svg viewBox="0 0 200 200" class="w-64 h-64">
            <polygon points="100,20 180,80 150,170 50,170 20,80" fill="none" stroke="#e2e8f0" stroke-width="1"/>
            <polygon points="100,50 160,90 140,150 60,150 40,90" fill="none" stroke="#cbd5e1" stroke-width="1"/>
            <polygon points="${radarPolygon}" fill="rgba(212, 175, 55, 0.4)" stroke="#d4af37" stroke-width="2"/>
            <text x="100" y="15" text-anchor="middle" font-size="8" font-weight="bold">Lãnh đạo</text>
            <text x="190" y="85" text-anchor="start" font-size="8">Kỹ thuật</text>
            <text x="155" y="180" text-anchor="middle" font-size="8">Sáng tạo</text>
            <text x="45" y="180" text-anchor="middle" font-size="8">Thấu cảm</text>
            <text x="10" y="85" text-anchor="end" font-size="8">Kỷ luật</text>
          </svg>
          <p class="text-sm text-slate-600 mt-4">Top năng lực: ${escapeHtml(topRadar || "Đang cập nhật")}</p>
        </div>
      </section>

      <section class="page p-16">
        <div class="grid grid-cols-1 gap-12">
          <div>
            <h2 class="text-2xl font-bold text-blue-900 mb-6 uppercase">Phân tích chuyên sâu & Ưu nhược điểm</h2>
            <div class="space-y-4">
              <div class="flex gap-4">
                <span class="text-green-600 font-bold">✓</span>
                <p><span class="font-bold">Ưu điểm:</span> ${escapeHtml((summary.strengths || []).join(", ") || "Đang cập nhật.")}</p>
              </div>
              <div class="flex gap-4">
                <span class="text-red-600 font-bold">!</span>
                <p><span class="font-bold">Cần lưu ý:</span> ${escapeHtml(summary.detail || "Cần được tư vấn sau hơn để tránh chọn lộ trình theo cảm tính.")}</p>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 p-10 border-r-8 border-blue-900">
            <h2 class="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>AI</span> CẢNH BÁO THỜI ĐẠI 4.0
            </h2>
            <p class="text-slate-700 leading-relaxed italic">
              "Trong kỷ nguyên trí tuệ nhân tạo, những gì máy móc làm tốt là tính toán và lặp lại. Những gì bạn cần giữ là khả năng tư duy độc lập, nhìn vấn đề theo chiều sâu và tạo giá trị thực tế." Đây là lý do HTO ưu tiên đánh giá theo năng lực cốt lõi, không chỉ theo bằng cấp.
            </p>
          </div>
        </div>
      </section>

      <section class="page p-12 bg-blue-900 text-white">
        <h2 class="text-2xl font-bold text-gold mb-10 text-center uppercase tracking-widest">Lộ trình sự nghiệp đề xuất</h2>
        <div class="space-y-6">
          <div class="bg-white/10 p-6 border border-white/20">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold text-gold">Lựa chọn 1: ${escapeHtml(programTitle.toUpperCase())}</h3>
              <span class="bg-gold text-blue-900 text-xs px-2 py-1 font-bold">ƯU TIÊN NHẤT</span>
            </div>
            <p class="text-sm mb-4 opacity-80">${escapeHtml(programDescription)}</p>
            <div class="grid grid-cols-2 gap-4 text-sm font-semibold">
              <div class="bg-blue-800 p-3">THỊ TRƯỜNG: ${escapeHtml(program.market || "Đang cập nhật")}</div>
              <div class="bg-blue-800 p-3">THẾ MẠNH: ${escapeHtml(programTags || "Đang cập nhật")}</div>
            </div>
          </div>

          <div class="bg-white/5 p-6 border border-white/10">
            <h3 class="text-xl font-bold mb-2">Nhận định HTO</h3>
            <p class="text-sm mb-4 opacity-70 text-gold italic">${escapeHtml(summary.recommendation || "Đang cập nhật khuyến nghị.")}</p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="border border-white/20 p-3 italic">Nguồn nội dung: ${escapeHtml(result.contentSource || "local_seed")}</div>
              <div class="border border-white/20 p-3 italic">Chỉ số ưu tiên: Life Path ${escapeHtml(lifePath)}</div>
            </div>
          </div>

          <div class="bg-white/5 p-6 border border-white/10">
            <h3 class="text-xl font-bold mb-2 text-slate-300">Ghi chú tư vấn</h3>
            <p class="text-sm opacity-70 italic">${escapeHtml(summary.note || "Đang cập nhật ghi chú tư vấn.")}</p>
          </div>
        </div>
      </section>

      <section class="page p-16">
        <h2 class="text-2xl font-bold text-blue-900 mb-12 text-center uppercase">Hệ sinh thái hỗ trợ HTO Group</h2>
        <div class="grid grid-cols-1 gap-8">
          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">01</div>
            <div>
              <h4 class="font-bold text-lg mb-1">Định hướng hồ sơ & chọn thị trường</h4>
              <p class="text-slate-600 text-sm italic">HTO đối chiếu năng lực, học vấn và mục tiêu để chọn lộ trình thực chất hơn.</p>
            </div>
          </div>

          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">02</div>
            <div>
              <h4 class="font-bold text-lg mb-1">Công nghệ minh bạch (CRM System)</h4>
              <p class="text-slate-600 text-sm">Toàn bộ dữ liệu lead, feedback và trạng thái báo cáo được đồng bộ để tối ưu tư vấn theo sát.</p>
            </div>
          </div>

          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">03</div>
            <div>
              <h4 class="font-bold text-lg mb-1">Hỗ trợ địa phương và quốc tế</h4>
              <p class="text-slate-600 text-sm">Văn phòng, đối tác và hệ thống đồng hành giúp bạn đi xa hơn sau tư vấn.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="page p-16 flex flex-col justify-between bg-slate-50">
        <div class="text-center mt-20">
          <h2 class="text-4xl font-bold text-blue-900 mb-6 italic">"Học tinh hoa thế giới - <br> Trở về xây dựng quê hương"</h2>
          <div class="h-1 w-20 bg-gold mx-auto"></div>
        </div>

        <div class="bg-white p-10 border-2 border-dashed border-gold text-center relative">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-blue-900 px-4 py-1 text-xs font-bold uppercase">Quà tặng đặc biệt</div>
          <h3 class="text-xl font-bold mb-2 text-blue-900 italic">VOUCHER TƯ VẤN CHUYÊN SÂU 1:1</h3>
          <p class="text-sm text-slate-500 mb-4 italic">Dành riêng cho ${escapeHtml(fullName)} sau khi hoàn thành trắc nghiệm</p>
          <div class="text-lg font-mono tracking-tighter text-blue-900 font-bold">MA: HTO-SPECIAL-2026</div>
        </div>

        <div class="grid grid-cols-2 gap-10 items-end pb-10">
          <div>
            <p class="text-xs uppercase tracking-widest text-slate-400 mb-4">Liên hệ chuyên viên</p>
            <div class="space-y-2 text-sm text-slate-700">
              <p><strong>Hotline:</strong> 1800 9078</p>
              <p><strong>Email:</strong> ${escapeHtml(input.email || "administrator@htogroup.com.vn")}</p>
              <p class="text-blue-600 underline">www.htogroup.vn</p>
            </div>
          </div>
          <div class="text-right">
            <div class="inline-block p-2 bg-white border border-slate-200">
              <div class="w-24 h-24 bg-slate-100 flex items-center justify-center text-[8px] text-center p-2 uppercase">Quét Zalo <br> Nhận tư vấn</div>
            </div>
          </div>
        </div>
      </section>
    </body>
  </html>`;
}

async function generateNumerologyPdf({ submission }) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const input = submission.input || {};
    const filename = buildPdfFilename(input.fullName);
    const page = await browser.newPage();
    await page.setContent(buildHtml(submission), {
      waitUntil: "networkidle0",
    });

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return {
      buffer: Buffer.from(pdfBytes),
      filename,
      contentType: "application/pdf",
      pageCount: 6,
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateNumerologyPdf,
  buildPdfFilename,
};
