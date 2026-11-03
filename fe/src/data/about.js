// Nội dung trang "Về chúng tôi". Thứ tự theo hồ sơ khách hàng: câu chuyện → tầm nhìn → sứ mệnh →
// chuẩn mực sản xuất → hệ sinh thái dịch vụ (năng lực sản xuất) → vì sao chọn chúng tôi.
// Ảnh /images/about-hd/* là ảnh HD gốc do studio cung cấp (WebP, cạnh dài ≤ 3200px);
// /images/about/reel-* là khung hình trích từ showreel 2026 — chỉ giữ cho khung thành phẩm chưa có ảnh chụp.

const A = (name) => `/images/about/${name}.webp`;
const H = (name) => `/images/about-hd/${name}.webp`;

// Nền đầu trang: 6 cột ảnh trôi — ưu tiên ảnh có người & máy quay ở 3 cột đầu (mobile chỉ hiện 3 cột)
export const aboutHeaderColumns = [
  [H("camera-operator"), H("event-screen"), A("reel-short")],
  [H("crew-portrait"), H("talkshow-set"), H("jewelry-consult")],
  [H("documentary-set"), H("interview"), H("event-backdrop")],
  [H("tvc-monitor"), A("reel-food"), H("event-hall")],
  [H("lighting-setup"), H("handshake"), A("reel-spa")],
  [H("product-shoot"), H("tvc-bedroom"), A("reel-portrait")],
];

// Hồ sơ doanh nghiệp — thông tin nhanh
export const companyFacts = [
  { label: "Thương hiệu", value: "Trần Duy Media" },
  { label: "Lĩnh vực", value: "Gia công video, hình ảnh thương mại quảng cáo" },
  { label: "Kinh nghiệm", value: "Hơn 10 năm thực chiến" },
  { label: "Phương châm", value: "Uy tín – Tối ưu chi phí – Tận tâm" },
];

// Ảnh đại diện phần câu chuyện — khách chọn để lại 1 ảnh (feedback 02/11)
export const profileImage = {
  src: H("camera-operator-bw"),
  alt: "Quay phim với máy cinema tại studio Trần Duy Media",
  pos: "center 30%",
};

// Hệ sinh thái dịch vụ cốt lõi (feedback 02/11) — danh sách chữ + ảnh cuộn ngang, mỗi mục dẫn tới trang dịch vụ
export const ecosystem = [
  {
    name: "Sản xuất video short thương mại",
    desc: "TikTok, Reels, Shorts — nhịp nhanh, bám xu hướng.",
    src: "/images/clips/short-6.webp", // ảnh dọc 9:16 → phủ kín thẻ 4:5 (ảnh reel-short có viền đen 2 bên)
    pos: "center 35%",
    href: "/dich-vu/san-xuat-video-short",
  },
  {
    name: "TVC & iTVC",
    desc: "Quảng cáo truyền hình và online — kịch bản, casting, quay, dựng.",
    // Khung hình iTVC lấy trọn ghế + người mẫu (khung dọc cắt từ ảnh ngang vẫn đủ nét)
    src: "/images/services/itvc-elip-2.webp",
    pos: "58% 50%",
    href: "/dich-vu/san-xuat-itvc-viral",
  },
  {
    name: "Sản xuất phim doanh nghiệp",
    desc: "Năng lực, nhà xưởng, quy trình — phục vụ đấu thầu, tuyển dụng.",
    src: H("corporate-team"),
    pos: "center 40%",
    href: "/dich-vu/phim-doanh-nghiep-su-kien",
  },
  {
    name: "Video documentary, talkshow & testimonial",
    desc: "Chân dung nhà sáng lập, phỏng vấn, talkshow đa máy.",
    // Ảnh dọc gốc độ phân giải cao (1920×2560) → sắc nét trong thẻ dọc 4:5
    src: H("talkshow-set"),
    pos: "center 45%",
    href: "/dich-vu/phim-doanh-nghiep-su-kien",
  },
  {
    name: "Quay phim và chụp ảnh sự kiện",
    desc: "Hội nghị, khai trương, tất niên — bàn giao nhanh.",
    src: H("event-ballroom"),
    pos: "center 45%",
    href: "/dich-vu/phim-doanh-nghiep-su-kien",
  },
  {
    name: "Cho thuê studio",
    desc: "Room 24m² & 150m² — sẵn đèn, phông nền, thuê theo giờ.",
    // Ảnh dọc gốc (1365×2048) → nét trong thẻ 4:5 (ảnh studio 150m² gốc chỉ 1200px, dễ mờ khi cắt dọc)
    src: "/images/studio/room-1-01.webp",
    pos: "center 40%",
    href: "/dich-vu/cho-thue-studio",
  },
];

// Giá trị cốt lõi — thẻ khung hình điện ảnh (bản ban đầu): ảnh nền phủ màu, câu tuyên bố lớn.
// Nội dung text theo feedback 02/11.
export const mission = {
  title: "Sứ mệnh",
  en: "Mission",
  text: "Đồng hành cùng kiến tạo và nâng tầm giá trị doanh nghiệp — mỗi sản phẩm phục vụ đúng mục tiêu của khách hàng với mức chi phí tối ưu nhất.",
  image: "/images/bts/bts-05.webp",
  imagePos: "center 35%",
};
export const vision = {
  title: "Tầm nhìn",
  en: "Vision",
  text: "Định hình là đối tác uy tín hàng đầu trong ngành gia công nội dung thương mại quảng cáo.",
  image: "/images/about/reel-aerial.webp",
  imagePos: "center 60%",
};

// Chuẩn mực sản xuất — Trần Duy Media cam kết trong mọi dự án (theo hồ sơ doanh nghiệp)
export const productionStandards = [
  {
    title: "Khách hàng là trọng tâm",
    desc: "Lấy kết quả, sự hài lòng và mục tiêu của khách hàng làm trọng tâm cho mọi sản phẩm.",
  },
  {
    title: "Linh hoạt & sáng tạo",
    desc: "Linh hoạt cải tiến cách làm, luôn tìm ý tưởng mới phù hợp với từng thương hiệu.",
  },
  {
    title: "Đội ngũ tử tế",
    desc: "Quy tụ đội ngũ sản xuất chuyên môn, làm việc tận tâm và tử tế.",
  },
  {
    title: "Tối ưu chi phí",
    desc: "Tối ưu chi phí sản xuất, dự toán rõ ràng theo từng hạng mục.",
  },
  {
    title: "Chia sẻ & biết ơn",
    desc: "Giữ tinh thần chia sẻ và biết ơn trong mọi mối quan hệ hợp tác.",
  },
];

// Hậu trường sản xuất — 3 hàng ảnh lướt ngang (trang chủ, trang dịch vụ); chia đều 18 ảnh cho 3 hàng.
// Lưu ý: kho ảnh có nhiều ảnh giống hệt nhau dưới tên khác (vd. bts-11 = crew-portrait) — đã lọc để không lặp. Ảnh thật do studio gửi (feedback 02/11).
const B = (n) => `/images/bts/bts-${n}.webp`;
export const btsGallery = [
  { src: B("11"), alt: "Đạo diễn hình ảnh trên trường quay", pos: "center 35%" },
  { src: B("14"), alt: "Quay TVC tại bối cảnh phòng ngủ", pos: "center" },
  { src: B("09"), alt: "Setup máy quay cinema & gimbal", pos: "center" },
  { src: B("12"), alt: "Quay phỏng vấn tại bối cảnh", pos: "center" },
  { src: B("13"), alt: "Theo dõi khung hình qua monitor", pos: "center" },
  { src: B("15"), alt: "Quay video short tại studio", pos: "center" },
  { src: B("16"), alt: "Quay sản phẩm ghế massage với crane", pos: "center" },
  { src: B("17"), alt: "Setup talkshow tại studio", pos: "center" },
  { src: B("08"), alt: "Hệ thống đèn và softbox tại Box Studio", pos: "center" },
  { src: B("10"), alt: "Quay cận cảnh sản phẩm", pos: "center" },
  { src: H("camera-operator"), alt: "Quay phim với máy cinema", pos: "center 35%" },
  { src: H("jewelry-team"), alt: "Buổi chụp thương mại cho cửa hàng trang sức", pos: "center" },
  { src: H("talkshow-set"), alt: "Setup talkshow nhiều máy quay", pos: "center 55%" },
  { src: B("03"), alt: "Hậu trường buổi chụp tại studio", pos: "center" },
  { src: B("05"), alt: "Ekip quay phim trên trường quay", pos: "center" },
  { src: H("jewelry-shoot"), alt: "Chụp sản phẩm trang sức", pos: "center 40%" },
  { src: B("07"), alt: "Hệ thống đèn tại Box Studio", pos: "center" },
  { src: H("interview-elder"), alt: "Phỏng vấn documentary", pos: "center 40%" },
];
