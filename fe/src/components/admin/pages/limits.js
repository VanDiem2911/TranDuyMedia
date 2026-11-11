/**
 * Số ký tự tối đa của ô chữ — dùng chung cho các trang chỉnh sửa trực tiếp (trừ "Về chúng tôi" có bảng riêng).
 * Quy theo tên trường cuối cùng của đường dẫn; trang chủ / dịch vụ… chỉ cần giữ chữ không quá dài làm vỡ bố cục.
 */
const BY_KEY = {
  title: 140,
  titleLead: 140,
  titleAccent: 140,
  name: 120,
  desc: 400,
  description: 500,
  text: 600,
  alt: 200,
  eyebrow: 80,
  label: 80,
  tagline: 80,
  shot: 60,
  href: 300,
  value: 40,
  bigNumber: 12,
  step: 8,
  question: 200,
  answer: 800,
  note: 300,
};

export function makeLimitOf(extra = {}) {
  return (path) => {
    if (/eyebrow\.\d+$/.test(path)) return 40; // các từ ngăn cách của dòng nhỏ
    const last = path.split(".").pop();
    return extra[last] ?? BY_KEY[last] ?? 200;
  };
}
