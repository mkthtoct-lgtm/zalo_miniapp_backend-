const EDUCATION_LEVELS = [
  { value: "high_school", label: "Cấp 3" },
  { value: "college_student", label: "Đang học Đại học" },
  { value: "university_graduated", label: "Đã tốt nghiệp Đại học" },
];

const NUMEROLOGY_MEANINGS = [
  {
    number: 1,
    title: "Người dẫn đường",
    strengths: ["Quyết đoán", "Tự chủ", "Mở đường"],
    summary: "Thiên hướng dẫn dắt, thích tự mình hành động và tạo ảnh hưởng rõ ràng.",
    detail: "Phù hợp môi trường cần chủ động, tốc độ và khả năng ra quyết định.",
  },
  {
    number: 2,
    title: "Người kết nối",
    strengths: ["Thấu cảm", "Hợp tác", "Kiên nhẫn"],
    summary: "Giỏi xây dựng quan hệ và phù hợp môi trường cần chăm sóc con người.",
    detail: "Phù hợp các vai trò cần đồng hành, kết nối và tạo cảm giác an toàn.",
  },
  {
    number: 3,
    title: "Người truyền cảm hứng",
    strengths: ["Giao tiếp", "Linh hoạt", "Sáng tạo"],
    summary: "Dễ tạo thiện cảm, phù hợp nhóm ngành cần tương tác và lan tỏa năng lượng.",
    detail: "Nổi bật trong các môi trường dịch vụ, truyền thông hoặc vận hành linh hoạt.",
  },
  {
    number: 4,
    title: "Người xây nền tảng",
    strengths: ["Kỷ luật", "Logic", "Hệ thống"],
    summary: "Mạnh về cấu trúc, bền bỉ và phù hợp công việc kỹ thuật hoặc vận hành.",
    detail: "Phù hợp những lộ trình cần độ chính xác, kỷ luật và kỹ năng thực hành.",
  },
  {
    number: 5,
    title: "Người khám phá",
    strengths: ["Thích nghi", "Giao tiếp", "Đam mê"],
    summary: "Phù hợp môi trường thay đổi nhanh, cần xoay chuyển và mở rộng trải nghiệm.",
    detail: "Có khả năng phát triển tốt ở môi trường quốc tế, dịch vụ và logistics.",
  },
  {
    number: 6,
    title: "Người chăm sóc",
    strengths: ["Tử tế", "Phục vụ", "Trách nhiệm"],
    summary: "Phù hợp vai trò chăm sóc, đồng hành và tạo cảm giác an toàn cho người khác.",
    detail: "Mạnh ở các lộ trình thiên về sức khỏe, cộng đồng và hỗ trợ con người.",
  },
  {
    number: 7,
    title: "Người phân tích",
    strengths: ["Quan sát", "Đào sâu", "Tư duy độc lập"],
    summary: "Thiên hướng nghiên cứu, kỹ thuật và những lộ trình cần chiều sâu chuyên môn.",
    detail: "Rất phù hợp các nhóm ngành kỹ thuật, cơ khí, ô tô và phân tích hệ thống.",
  },
  {
    number: 8,
    title: "Người điều phối",
    strengths: ["Quản lý", "Tư duy mục tiêu", "Bản lĩnh"],
    summary: "Phù hợp vai trò quản trị, điều phối nguồn lực và dẫn dắt hiệu quả.",
    detail: "Có khả năng phát triển ở môi trường kinh doanh, vận hành và điều phối đội nhóm.",
  },
  {
    number: 9,
    title: "Người phụng sự",
    strengths: ["Nhân văn", "Bao quát", "Cống hiến"],
    summary: "Có xu hướng tạo giá trị cho cộng đồng và phù hợp nhóm ngành dịch vụ con người.",
    detail: "Thường hợp các nhóm ngành chăm sóc sức khỏe, giáo dục và dịch vụ xã hội.",
  },
];

const CAREER_MAPPINGS = [
  {
    id: "germany_18b",
    market: "Germany",
    title: "Đức diện 18b - Kỹ thuật chuyên sâu",
    description: "Phù hợp nhóm kỹ thuật, cơ khí, ô tô hoặc ngành cần chiều sâu tay nghề.",
    tags: ["Kỹ thuật", "Ổn định", "Thu nhập dài hạn"],
    lifePathNumbers: [4, 7, 8],
    educationLevels: ["university_graduated"],
    priority: 100,
  },
  {
    id: "germany_vocational",
    market: "Germany",
    title: "Du học nghề Đức - Kỹ thuật / dịch vụ",
    description: "Danh cho hồ sơ cấp 3 hoặc đang học, muốn đi theo lộ trình nghề thực chiến.",
    tags: ["Du học nghề", "Thực hành", "Cơ hội việc làm"],
    lifePathNumbers: [3, 4, 5, 7],
    educationLevels: ["high_school", "college_student"],
    priority: 80,
  },
  {
    id: "canada_healthcare",
    market: "Canada",
    title: "Canada / Úc - Chăm sóc sức khỏe",
    description: "Phù hợp nhóm có thiên hướng từ tế, chăm sóc và muốn môi trường ổn định.",
    tags: ["Điều dưỡng", "Healthcare", "Định cư"],
    lifePathNumbers: [2, 6, 9],
    educationLevels: ["university_graduated"],
    priority: 90,
  },
  {
    id: "korea_taiwan_business",
    market: "Korea/Taiwan",
    title: "Hàn / Đài - Kinh tế, quản trị, logistics",
    description: "Phù hợp nhóm giao tiếp tốt, năng động hoặc có xu hướng điều phối.",
    tags: ["Kinh doanh", "Linh hoạt", "Chi phí tối ưu"],
    lifePathNumbers: [1, 3, 5, 8],
    educationLevels: ["high_school", "college_student", "university_graduated"],
    priority: 70,
  },
];

const FEEDBACK_RATINGS = [
  { value: 1, label: "Rất chưa hài lòng" },
  { value: 2, label: "Chưa hài lòng" },
  { value: 3, label: "Bình thường" },
  { value: 4, label: "Hài lòng" },
  { value: 5, label: "Rất hài lòng" },
];

module.exports = {
  EDUCATION_LEVELS,
  NUMEROLOGY_MEANINGS,
  CAREER_MAPPINGS,
  FEEDBACK_RATINGS,
};
