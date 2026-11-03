/**
 * 5 dịch vụ chính theo feedback khách hàng (02/11) — đúng thứ tự trong hồ sơ:
 *   a. Sản xuất video short marketing · b. Sản xuất iTVC, Viral · c. Sản xuất phim doanh nghiệp, sự kiện
 *   d. Chụp ảnh quảng cáo · e. Cho thuê studio, bối cảnh
 * `slug`: đường dẫn trang con /dich-vu/[slug] và giá trị chọn sẵn trong form đặt lịch (data-booking)
 *   — phải khớp danh sách SERVICES ở be/src/validators/booking.validator.js.
 * `menuDesc`: mô tả ngắn (≤ ~30 ký tự, vừa 1 dòng) trong dropdown header. `highlights`: 3 số liệu nổi bật ở phần giới thiệu.
 * Trang con a–d dùng chung bố cục 8 phần; chỉ phần Giới thiệu (`description`, `items`…),
 * Sản phẩm thực tế (`works`) và Báo giá (`pricing`) viết riêng theo từng dịch vụ.
 * Trang (e) Cho thuê studio có bố cục riêng (`kind: "studio"`).
 */

/** Clip lưu trên Google Drive (thư mục khách gửi) — xem bằng trình phát nhúng của Drive. */
const clip = (id, title, poster, vertical = false) => ({ id, title, poster, vertical });
const P = (name) => `/images/clips/${name}.webp`;

// Giá: khách chưa chốt → `price: null` hiện "Liên hệ báo giá".
// Khi có giá, điền chuỗi hiển thị, vd. price: "Từ 3.000.000đ" và unit: "/ video".
export const services = [
  {
    slug: "san-xuat-video-short",
    // Đoạn showreel làm nền đầu trang (giây [bắt đầu, kết thúc]) — chỉ cảnh quay của dịch vụ, bỏ màn chữ
    heroClip: [[24.3, 34.5]],
    number: "01",
    icon: "play",
    title: "Sản xuất video short marketing",
    menuDesc: "TikTok, Reels, Shorts",
    tagline: "Video ngắn giữ chân người xem từ 3 giây đầu.",
    // Tiêu đề phần Giới thiệu dịch vụ = tên dịch vụ; accent = vế tô cam (chuỗi con của headline)
    headline: "Sản xuất video short marketing.",
    accent: "video short marketing.",
    heroDesc:
      "Video dọc 9:16 cho TikTok, Reels, YouTube Shorts — kịch bản bắt trend, hook mạnh, quay dựng trọn gói theo tuần hoặc theo tháng.",
    description:
      "Trần Duy Media sản xuất video short thương mại cho doanh nghiệp: từ ý tưởng, kịch bản, diễn viên đến quay dựng và tối ưu cho từng nền tảng — giúp thương hiệu xuất hiện đều đặn, đúng nhịp xu hướng và chuyển đổi thành đơn hàng.",
    image: "/images/clips/short-3.webp",
    imagePos: "center 35%",
    highlights: [
      { value: "9:16", label: "Chuẩn TikTok, Reels" },
      { value: "3 giây", label: "Hook mở đầu" },
      { value: "2 vòng", label: "Chỉnh sửa hậu kỳ" },
    ],
    items: [
      {
        name: "Video review, giới thiệu sản phẩm",
        image: "/images/clips/short-3.webp",
        desc: "Làm nổi bật công dụng, điểm khác biệt của sản phẩm trong 15–60 giây.",
      },
      {
        name: "Video kể chuyện thương hiệu",
        image: "/images/clips/short-5.webp",
        desc: "Storytelling ngắn có diễn viên, tình huống đời thường — dễ chia sẻ, dễ nhớ.",
      },
      {
        name: "Chuỗi nội dung theo tháng",
        image: "/images/clips/short-2.webp",
        desc: "Lên lịch, kịch bản và quay theo đợt — kênh luôn có nội dung đều đặn.",
      },
      {
        name: "Video quảng cáo performance",
        image: "/images/clips/short-1.webp",
        desc: "Nhiều phiên bản hook, CTA để chạy quảng cáo và A/B test hiệu quả.",
      },
    ],
    // 3 ảnh đầu = cụm ảnh phần giới thiệu — khung hình sạch (không chữ / sticker) từ clip short MOVE + mỹ phẩm
    pool: [
      { src: "/images/services/short-showroom.webp", pos: "50% 55%" },
      { src: "/images/services/short-outdoor.webp", pos: "50% 45%" },
      { src: "/images/clips/short-8.webp", pos: "50% 55%" },
      "/images/clips/short-3.webp",
      "/images/clips/short-2.webp",
      "/images/clips/short-7.webp",
      "/images/clips/short-5.webp",
      "/images/clips/short-1.webp",
    ],
    works: {
      type: "clips",
      title: "Video short đã thực hiện.",
      clips: [
        clip(
          "1LsolX8l7gcp_OGEz9F4UP0Rsk4Fx4Wn6",
          "ANSTY - Video short phụ kiện",
          P("short-1"),
          true,
        ),
        clip("1N0xLQ9MLjIELUssW9a9WFTOV0nDgUL8Q", "MOVE - Xe điện thế hệ mới", P("short-2"), true),
        clip("19gOWdOcQEJ7L1U3_kcP_vUMFemR8IYSn", "MOVE - Review xe điện", P("short-3"), true),
        clip("1kMTzIS_ZRdqdJUK2LZ_uzGHoMkQrCdS4", "MOVE - Tư vấn tại showroom", P("short-4"), true),
        clip("1CVw-yoNReBBsFoim9C3cmNOmynFotqDp", "MOVE - Video lifestyle", P("short-5"), true),
        clip("1zPvIPB-9ZIunPfEVbxpBFMmQvU-7Fbmd", "MOVE - Video trend", P("short-6"), true),
        clip(
          "10dkR1dfhgYoWRB1rM1_-2S2GgdcurlGq",
          "MOVE - Tình huống đời thường",
          P("short-7"),
          true,
        ),
        clip(
          "1RVTZjs8e6ZcsCPgBGumzGuqQqrmUJ4Ix",
          "FOREVER-KEY - Video sản phẩm",
          P("short-8"),
          true,
        ),
      ],
    },
    pricing: {
      plans: [
        {
          name: "Video lẻ",
          desc: "Thử nghiệm ý tưởng, ra mắt sản phẩm mới.",
          price: null,
          includes: [
            "1 video 30–60s",
            "Kịch bản & hook mở đầu",
            "Quay 1 buổi, dựng & phụ đề",
            "2 vòng chỉnh sửa",
          ],
        },
        {
          name: "Combo 4 video",
          desc: "Đủ nội dung cho một đợt chạy quảng cáo.",
          price: null,
          featured: true,
          includes: [
            "4 video 30–60s",
            "Kịch bản theo chiến dịch",
            "Diễn viên / KOC theo yêu cầu",
            "Nhiều phiên bản hook để test",
          ],
        },
        {
          name: "Gói theo tháng",
          desc: "Kênh doanh nghiệp có nội dung đều đặn.",
          price: null,
          includes: [
            "8–12 video mỗi tháng",
            "Lên lịch nội dung",
            "Quay theo đợt, tối ưu chi phí",
            "Báo cáo & điều chỉnh hằng tháng",
          ],
        },
      ],
    },
  },
  {
    slug: "san-xuat-itvc-viral",
    // Đoạn showreel làm nền đầu trang (giây [bắt đầu, kết thúc]) — chỉ cảnh quay của dịch vụ, bỏ màn chữ
    heroClip: [[37.6, 43.5]],
    number: "02",
    icon: "sparkle",
    title: "Sản xuất iTVC, Viral",
    menuDesc: "Quảng cáo online 15–60s",
    tagline: "Một thông điệp, đúng người xem, đúng nền tảng.",
    // Tiêu đề phần Giới thiệu dịch vụ = tên dịch vụ; accent = vế tô cam (chuỗi con của headline)
    headline: "Sản xuất iTVC, Viral.",
    accent: "iTVC, Viral.",
    heroDesc:
      "iTVC 15–60s cho YouTube, Facebook, TikTok và video viral theo chiến dịch — concept sáng tạo, kịch bản, casting, quay 4K, hậu kỳ chỉnh màu chuẩn quảng cáo.",
    description:
      "Sản xuất iTVC và video viral cho chiến dịch ra mắt, khuyến mãi, xây dựng thương hiệu: concept rõ thông điệp, hình ảnh điện ảnh, bàn giao đủ các phiên bản cắt ngắn và tỉ lệ khung cho từng nền tảng quảng cáo.",
    image: "/images/services/itvc-elip-1.webp",
    imagePos: "center 40%",
    highlights: [
      { value: "15–60s", label: "Thời lượng iTVC" },
      { value: "4K", label: "Quay & bàn giao" },
      { value: "Đa tỉ lệ", label: "16:9 · 9:16 · 1:1" },
    ],
    items: [
      {
        name: "iTVC quảng cáo sản phẩm",
        image: "/images/services/itvc-elip-1.webp",
        desc: "Quảng cáo online 15s – 60s, hình ảnh chỉn chu, thông điệp rõ ràng.",
      },
      {
        name: "Video viral theo chiến dịch",
        image: "/images/about/reel-food.webp",
        desc: "Ý tưởng bắt trend, tình huống gây tò mò — tăng lượt chia sẻ tự nhiên.",
      },
      {
        name: "TVC ra mắt thương hiệu",
        image: "/images/bts/bts-16.webp",
        desc: "Concept điện ảnh, casting diễn viên, bối cảnh và đạo cụ theo kịch bản.",
      },
      {
        name: "Bản cut đa nền tảng",
        image: "/images/services/itvc-elip-3.webp",
        desc: "Bản 15s / 30s / 60s, tỉ lệ 16:9 – 9:16 – 1:1 cho từng kênh quảng cáo.",
      },
    ],
    // 3 ảnh đầu = cụm ảnh phần giới thiệu (ô cao dọc + 2 ô nhỏ) — khung hình iTVC ELIPSPORT thành phẩm,
    // kèm vị trí cắt riêng (pos) để giữ trọn người mẫu / sản phẩm
    pool: [
      // ô dọc: khung chân dung (cắt dọc vẫn tự nhiên); 2 ô gần vuông: người mẫu + ghế, ghế sản phẩm
      { src: "/images/services/itvc-elip-1.webp", pos: "35% 50%" },
      { src: "/images/services/itvc-elip-model.webp", pos: "62% 50%" },
      { src: "/images/services/itvc-elip-product.webp", pos: "50% 60%" },
      "/images/bts/bts-16.webp",
      "/images/services/itvc-elip-1.webp",
      "/images/services/itvc-elip-4.webp",
      "/images/bts/bts-09.webp",
      "/images/services/itvc-elip-5.webp",
      "/images/bts/bts-10.webp",
      "/images/about/reel-food.webp",
    ],
    works: {
      type: "clips",
      title: "iTVC & viral đã thực hiện.",
      clips: [
        clip("1Do1xT86dWGkmLEYgHWIPDtYnru8jXnfk", "ELIPSPORT - Ghế massage Elip G9", P("itvc-3")),
        clip("1O9941m5zN2_kIVmlCbgadZmp_nig7g0P", "iTVC ghế massage", P("itvc-4")),
      ],
    },
    pricing: {
      plans: [
        {
          name: "iTVC 15–30s",
          desc: "Quảng cáo ngắn cho một thông điệp chính.",
          price: null,
          includes: [
            "Concept & kịch bản",
            "Quay 1 ngày, 4K",
            "Dựng, chỉnh màu, âm thanh",
            "Bản 16:9 và 9:16",
          ],
        },
        {
          name: "iTVC 30–60s",
          desc: "Chiến dịch ra mắt, xây dựng thương hiệu.",
          price: null,
          featured: true,
          includes: [
            "Concept, kịch bản, storyboard",
            "Casting diễn viên, bối cảnh",
            "Bản cut 15s / 30s / 60s",
            "Đồ hoạ, lồng tiếng, nhạc bản quyền",
          ],
        },
        {
          name: "Viral / chiến dịch",
          desc: "Chuỗi nội dung lan toả theo chiến dịch.",
          price: null,
          includes: [
            "Ý tưởng viral theo mục tiêu",
            "1 iTVC + chuỗi video short",
            "Đa tỉ lệ khung cho mọi kênh",
            "Tư vấn phân phối nội dung",
          ],
        },
      ],
    },
  },
  {
    slug: "phim-doanh-nghiep-su-kien",
    // Đoạn showreel làm nền đầu trang (giây [bắt đầu, kết thúc]) — chỉ cảnh quay của dịch vụ, bỏ màn chữ
    heroClip: [
      [87.2, 93.5],
      [73.2, 82.8],
      [62, 71],
    ],
    number: "03",
    icon: "film",
    title: "Sản xuất phim doanh nghiệp, sự kiện",
    menuDesc: "Doanh nghiệp, talkshow, sự kiện",
    tagline: "Kể câu chuyện doanh nghiệp bằng hình ảnh thật.",
    // Tiêu đề phần Giới thiệu dịch vụ = tên dịch vụ; accent = vế tô cam (chuỗi con của headline)
    headline: "Sản xuất phim doanh nghiệp, sự kiện.",
    accent: "phim doanh nghiệp, sự kiện.",
    heroDesc:
      "Phim giới thiệu doanh nghiệp, documentary, talkshow & testimonial, quay phim và chụp ảnh sự kiện — ekip đa máy, bàn giao nhanh cho truyền thông.",
    description:
      "Sản xuất phim giới thiệu năng lực, nhà xưởng, văn hoá doanh nghiệp; documentary, talkshow, testimonial khách hàng; quay phim và chụp ảnh hội nghị, khai trương, tất niên — ghi lại câu chuyện thật, phục vụ đấu thầu, tuyển dụng và truyền thông nội bộ.",
    image: "/images/about-hd/corporate-team.webp",
    imagePos: "center",
    highlights: [
      { value: "2–5 phút", label: "Phim doanh nghiệp" },
      { value: "Multi-cam", label: "Talkshow & sự kiện" },
      { value: "Ảnh + video", label: "Cùng một ekip" },
    ],
    items: [
      {
        name: "Phim giới thiệu doanh nghiệp",
        image: "/images/about-hd/corporate-team.webp",
        desc: "Profile công ty, năng lực sản xuất, nhà xưởng, quy trình — có flycam.",
      },
      {
        name: "Documentary, talkshow & testimonial",
        image: "/images/about-hd/interview-elder.webp",
        desc: "Chân dung nhà sáng lập, phỏng vấn khách hàng, talkshow setup đa máy.",
      },
      {
        name: "Quay phim & chụp ảnh sự kiện",
        image: "/images/about-hd/event-ballroom.webp",
        desc: "Hội nghị, ra mắt, khai trương, tất niên — đủ góc sân khấu, khách mời, hậu trường.",
      },
      {
        name: "Video recap sự kiện",
        image: "/images/about-hd/event-party.webp",
        desc: "Highlight 1–3 phút bàn giao nhanh để kịp đăng truyền thông.",
      },
    ],
    pool: [
      "/images/about-hd/corporate-team.webp",
      "/images/about-hd/event-ballroom.webp",
      "/images/about-hd/interview-elder.webp",
      "/images/about-hd/event-party.webp",
      "/images/about-hd/corporate-factory.webp",
      "/images/about-hd/event-stage-girls.webp",
      "/images/bts/bts-12.webp",
      "/images/about-hd/event-booth.webp",
      "/images/bts/bts-17.webp",
    ],
    works: {
      type: "clips",
      title: "Phim doanh nghiệp & sự kiện đã thực hiện.",
      clips: [
        clip("1nWh2XfcNMhmfV130K_OL5wAXORP-9TvT", "MOVE - Phim giới thiệu nhà máy", P("itvc-6")),
        clip("1wrkhK5Y0_b2zKbpKu7-AWbTjW5EkP1we", "COASTAL - Phim doanh nghiệp", P("itvc-7")),
        clip("1qeP5vcxKdpF_LNUHSAbjYeYyQG2dLDvK", "Teaser ra mắt sản phẩm", P("itvc-1")),
        clip("1cqRx0nlGo9xbsqxoxKyXeiCblg7rUC3R", "ZEMA - Talkshow", P("itvc-2")),
        clip(
          "1eLViBwDzLk3gfmam8rnBVyLX3tgKGjjY",
          "Đông Dương Group - Phim giới thiệu",
          P("itvc-5"),
        ),
        clip(
          "1rz9dGvMBV3CEm-_lPJ2FFDwB-Uae9Fdl",
          "Đông Dương Group - Kỷ nguyên vươn mình",
          P("itvc-9"),
        ),
        clip("1Vzh00TIE-CfTTyHSmeVl8dBJt4kM1vqN", "Giải tennis giao hữu doanh nghiệp", P("itvc-8")),
      ],
      photos: [
        "/images/about-hd/event-ballroom.webp",
        "/images/about-hd/event-party.webp",
        "/images/about-hd/event-stage-girls.webp",
        "/images/about-hd/event-booth.webp",
        "/images/about-hd/event-backdrop.webp",
        "/images/about-hd/interview-elder.webp",
        "/images/about-hd/talkshow-set.webp",
      ],
    },
    pricing: {
      plans: [
        {
          name: "Quay chụp sự kiện",
          desc: "Hội nghị, khai trương, tất niên.",
          price: null,
          includes: [
            "Ekip quay & chụp theo quy mô",
            "Ảnh chọn lọc gửi trong ngày",
            "Video recap 1–3 phút",
            "Trọn bộ ảnh đã chỉnh màu",
          ],
        },
        {
          name: "Phim doanh nghiệp",
          desc: "Hồ sơ năng lực, đấu thầu, tuyển dụng.",
          price: null,
          featured: true,
          includes: [
            "Kịch bản & phỏng vấn",
            "Quay nhà xưởng, văn phòng, flycam",
            "Phim 2–5 phút + bản cut ngắn",
            "Lồng tiếng, phụ đề, đồ hoạ",
          ],
        },
        {
          name: "Documentary, talkshow",
          desc: "Chân dung, testimonial, chương trình.",
          price: null,
          includes: [
            "Setup đa máy, âm thanh studio",
            "Đạo diễn & dẫn dắt phỏng vấn",
            "Dựng bản dài + clip ngắn",
            "Có thể quay tại studio 150m²",
          ],
        },
      ],
    },
  },
  {
    slug: "chup-anh-quang-cao",
    // Đoạn showreel làm nền đầu trang (giây [bắt đầu, kết thúc]) — chỉ cảnh quay của dịch vụ, bỏ màn chữ
    heroClip: [
      [29.5, 34.5],
      [41.5, 43.5],
    ],
    number: "04",
    icon: "camera",
    title: "Chụp ảnh quảng cáo",
    menuDesc: "Sản phẩm, concept, key visual",
    tagline: "Sản phẩm đẹp, bán hàng tốt hơn.",
    // Tiêu đề phần Giới thiệu dịch vụ = tên dịch vụ; accent = vế tô cam (chuỗi con của headline)
    headline: "Chụp ảnh quảng cáo.",
    accent: "quảng cáo.",
    heroDesc:
      "Chụp ảnh quảng cáo sản phẩm — nền trắng chuẩn sàn TMĐT, ảnh có bối cảnh và key visual cho chiến dịch, bàn giao đủ bản web và bản in.",
    description:
      "Chụp ảnh quảng cáo cho sản phẩm và thương hiệu: ảnh nền trắng cho sàn thương mại điện tử, ảnh có bối cảnh cho mạng xã hội, key visual cho chiến dịch — đồng bộ với video để thương hiệu luôn nhất quán.",
    image: "/images/about-hd/jewelry-team.webp",
    imagePos: "center 40%",
    highlights: [
      { value: "3–5 ngày", label: "Bàn giao ảnh" },
      { value: "Web + in", label: "Đủ định dạng" },
      { value: "12 tháng", label: "Lưu trữ file gốc" },
    ],
    items: [
      {
        name: "Ảnh sản phẩm nền trắng",
        image: "/images/box-studio/box-studio-06.webp",
        desc: "Chuẩn kích thước, ánh sáng cho Shopee, Lazada, TikTok Shop và website.",
      },
      {
        name: "Ảnh sản phẩm có bối cảnh",
        image: "/images/vintage-green/vintage-green-15.webp",
        desc: "Đặt sản phẩm vào không gian sử dụng thật — lifestyle cho social và quảng cáo.",
      },
      {
        name: "Key visual quảng cáo",
        image: "/images/christmas/christmas-07.webp",
        desc: "Ảnh chủ đạo cho chiến dịch, banner, billboard, landing page.",
      },
      {
        name: "Ảnh thương hiệu, cửa hàng",
        image: "/images/about-hd/jewelry-store.webp",
        desc: "Không gian cửa hàng, đội ngũ, khoảnh khắc tư vấn khách hàng.",
      },
    ],
    pool: [
      "/images/about-hd/jewelry-store.webp",
      "/images/about-hd/product-shoot.webp",
      "/images/about-hd/jewelry-consult-2.webp",
      "/images/christmas/christmas-07.webp",
      "/images/vintage-green/vintage-green-15.webp",
      "/images/christmas/christmas-16.webp",
      "/images/tet/tet-07.webp",
      "/images/vintage-green/vintage-green-10.webp",
      "/images/christmas/christmas-06.webp",
      "/images/box-studio/box-studio-06.webp",
      "/images/about-hd/jewelry-team.webp",
      "/images/tet/tet-02.webp",
    ],
    works: {
      type: "photos",
      title: "Ảnh quảng cáo đã thực hiện.",
      photos: [
        "/images/about-hd/jewelry-store.webp",
        "/images/christmas/christmas-07.webp",
        "/images/about-hd/jewelry-consult-2.webp",
        "/images/vintage-green/vintage-green-15.webp",
        "/images/about-hd/product-shoot.webp",
        "/images/about-hd/jewelry-team.webp",
        "/images/box-studio/box-studio-06.webp",
      ],
    },
    pricing: {
      plans: [
        {
          name: "Ảnh nền trắng",
          desc: "Ảnh sản phẩm cho sàn TMĐT, website.",
          price: null,
          includes: [
            "Chụp tại studio",
            "Retouch, tách nền",
            "Đúng tỉ lệ từng sàn",
            "Bàn giao 3–5 ngày",
          ],
        },
        {
          name: "Ảnh concept",
          desc: "Ảnh có bối cảnh cho social, quảng cáo.",
          price: null,
          featured: true,
          includes: [
            "Lên concept & moodboard",
            "Đạo cụ, bối cảnh theo sản phẩm",
            "Người mẫu khi cần",
            "Bản web & bản in",
          ],
        },
        {
          name: "Key visual chiến dịch",
          desc: "Ảnh chủ đạo cho chiến dịch lớn.",
          price: null,
          includes: [
            "Concept đồng bộ với video",
            "Chụp & hậu kỳ chuyên sâu",
            "Bản cho banner, billboard",
            "Lưu trữ file gốc 12 tháng",
          ],
        },
      ],
    },
  },
  {
    slug: "cho-thue-studio",
    kind: "studio",
    number: "05",
    icon: "studio",
    title: "Cho thuê studio, bối cảnh",
    menuDesc: "Room 24m² & 150m², theo giờ",
    tagline: "Hai không gian, sẵn sàng cho mọi buổi quay chụp.",
    // Tiêu đề phần Giới thiệu dịch vụ = tên dịch vụ; accent = vế tô cam (chuỗi con của headline)
    headline: "Cho thuê studio, bối cảnh.",
    accent: "studio, bối cảnh.",
    heroDesc:
      "Studio tại Nhà Bè gồm Room 1 (24m²) tối giản và Room 2 (150m²) rộng thoáng — sẵn đèn, phông nền, đạo cụ; thuê theo giờ cho chụp ảnh, quay video, livestream.",
    description:
      "Cho thuê studio và bối cảnh quay chụp: Room 1 tone trắng đen, box concept minimalist cho lookbook, profile, livestream, sản phẩm nhỏ; Room 2 rộng 150m² cho TVC, phim doanh nghiệp, talkshow và các setup lớn — đặt lịch linh hoạt, có hỗ trợ kỹ thuật tại chỗ.",
    image: "/images/about-hd/studio-hall.webp",
    imagePos: "center",
    highlights: [
      { value: "2 room", label: "24m² & 150m²" },
      { value: "2 giờ", label: "Thuê tối thiểu" },
      { value: "8–21h", label: "Mở cửa mỗi ngày" },
    ],
    // Tóm tắt hạng mục (trang tổng hợp Dịch vụ)
    items: [
      { name: "Room 1 - 24m² Box Studio", image: "/images/studio/room-1-03.webp", desc: "" },
      { name: "Room 2 - 150m² Production", image: "/images/about-hd/studio-hall.webp", desc: "" },
      { name: "Chụp ảnh, lookbook, livestream", image: "/images/studio/room-1-01.webp", desc: "" },
      { name: "Quay TVC, talkshow, podcast", image: "/images/bts/bts-17.webp", desc: "" },
    ],
    // 4 điểm nổi bật — icon + tiêu đề + mô tả, xếp 4 cột canh giữa
    features: [
      {
        icon: "studio",
        title: "Không gian linh hoạt",
        desc: "Room 1 (24m²) tối giản cho lookbook, livestream; Room 2 (150m²) rộng thoáng, trần cao cho TVC và setup lớn.",
      },
      {
        icon: "light",
        title: "Thiết bị sẵn có",
        desc: "Đèn Godox, softbox, phông nền nhiều màu và đạo cụ concept — đến là quay, không cần mang thêm.",
      },
      {
        icon: "clock",
        title: "Thuê theo giờ",
        desc: "Tối thiểu 2 giờ, mở cửa 8:00 – 21:00 mỗi ngày, xác nhận lịch ngay trong ngày.",
      },
      {
        icon: "headset",
        title: "Hỗ trợ tận tâm",
        desc: "Kỹ thuật viên hỗ trợ setup ánh sáng tại chỗ, có thể thuê kèm ekip quay chụp trọn gói.",
      },
    ],
    rooms: [
      {
        name: "Room 1",
        size: "24m²",
        label: "Box Studio - Minimalist",
        short:
          "Không gian tone trắng đen tối giản cho lookbook, profile, livestream và sản phẩm nhỏ.",
        desc: "Không gian tone trắng đen và box concept minimalist giúp bạn tự do sáng tạo. Phù hợp chụp ảnh, quay video lookbook, profile, livestream, sản phẩm nhỏ, beauty, sinh nhật.",
        fits: ["Lookbook, profile", "Livestream bán hàng", "Sản phẩm nhỏ, beauty"],
        folder: "https://drive.google.com/drive/folders/1ymBD46f0ujliHPp35ivmoSl2Xv5NAYEB",
        images: [
          "/images/studio/room-1-03.webp",
          "/images/studio/room-1-01.webp",
          "/images/studio/room-1-02.webp",
          "/images/studio/room-1-04.webp",
          "/images/studio/room-1-05.webp",
          "/images/studio/room-1-06.webp",
        ],
      },
      {
        name: "Room 2",
        size: "150m²",
        label: "Production Studio",
        short:
          "Không gian rộng, trần cao cho TVC, phim doanh nghiệp, talkshow và setup nhiều bối cảnh.",
        desc: "Không gian rộng, trần cao, dễ dựng nhiều bối cảnh cùng lúc. Phù hợp quay TVC, phim doanh nghiệp, talkshow, podcast, chụp ảnh nhóm và các buổi sản xuất cần nhiều thiết bị.",
        fits: ["TVC, phim doanh nghiệp", "Talkshow, podcast", "Setup nhiều bối cảnh"],
        folder: "https://drive.google.com/drive/folders/1nMPmqJPpXQo1nRNYAp3311ofqSbEiY4f",
        images: [
          "/images/about-hd/studio-hall.webp",
          "/images/about-hd/studio-white.webp",
          "/images/studio/room-2-01.webp",
          "/images/bts/bts-17.webp",
          "/images/bts/bts-09.webp",
          "/images/about-hd/studio-cinema.webp",
        ],
      },
    ],
    pool: [
      "/images/studio/room-1-03.webp",
      "/images/about-hd/studio-hall.webp",
      "/images/studio/room-1-01.webp",
      "/images/vintage-green/vintage-green-03.webp",
      "/images/about-hd/studio-white.webp",
      "/images/studio/room-1-02.webp",
      "/images/studio/room-2-01.webp",
    ],
    pricing: {
      plans: [
        {
          name: "Room 1 - 24m²",
          desc: "Box studio minimalist.",
          price: null,
          unit: "/ giờ",
          includes: [
            "Đèn Godox & softbox",
            "Phông nền, đạo cụ sẵn có",
            "Bàn trang điểm",
            "Tối thiểu 2 giờ",
          ],
        },
        {
          name: "Room 2 - 150m²",
          desc: "Studio sản xuất quy mô lớn.",
          price: null,
          unit: "/ giờ",
          featured: true,
          includes: [
            "Không gian rộng, trần cao",
            "Dựng nhiều bối cảnh cùng lúc",
            "Hỗ trợ setup ánh sáng",
            "Tối thiểu 2 giờ",
          ],
        },
        {
          name: "Studio + ekip",
          desc: "Thuê kèm ekip quay chụp trọn gói.",
          price: null,
          includes: [
            "Studio theo nhu cầu",
            "Nhiếp ảnh / quay phim",
            "Hậu kỳ ảnh, dựng video",
            "Báo giá theo buổi",
          ],
        },
      ],
    },
  },
];

// Slug cũ (trước feedback 02/11) → slug mới: dùng cho chuyển hướng (next.config) và
// hiển thị đúng tên dịch vụ của các yêu cầu đặt lịch cũ trong trang quản trị.
export const legacyServices = {
  "san-xuat-video": { to: "san-xuat-video-short", title: "Sản xuất video marketing" },
  "chup-anh-thuong-mai": { to: "chup-anh-quang-cao", title: "Chụp ảnh thương mại" },
  "chup-anh-su-kien": { to: "phim-doanh-nghiep-su-kien", title: "Chụp ảnh sự kiện" },
  "cho-thue-studio": { to: "cho-thue-studio", title: "Cho thuê studio" },
};

// Gói gợi ý trên trang tổng hợp Dịch vụ: các dịch vụ con kết hợp cho mục tiêu cụ thể của SME
export const packages = [
  {
    title: "Ra mắt sản phẩm",
    goal: "Tạo tiếng vang trong tuần đầu mở bán",
    includes: ["iTVC 30s & bản cut 15s", "Ảnh quảng cáo sản phẩm", "3 video short dọc 9:16"],
    services: ["san-xuat-itvc-viral", "chup-anh-quang-cao", "san-xuat-video-short"],
    image: "/images/services/itvc-elip-1.webp",
    pos: "center 40%",
  },
  {
    title: "Nội dung social hằng tháng",
    goal: "Đều đặn nội dung, chi phí dự đoán được",
    includes: [
      "8–12 video short TikTok / Reels",
      "Bộ ảnh sản phẩm hằng tháng",
      "Quay tại studio theo đợt",
    ],
    services: ["san-xuat-video-short", "chup-anh-quang-cao", "cho-thue-studio"],
    image: "/images/clips/short-4.webp",
    pos: "center 30%",
    featured: true,
  },
  {
    title: "Sự kiện doanh nghiệp",
    goal: "Lưu giữ & lan toả hình ảnh thương hiệu",
    includes: [
      "Quay phim & chụp ảnh sự kiện",
      "Video recap trong ngày",
      "Phim giới thiệu doanh nghiệp",
    ],
    services: ["phim-doanh-nghiep-su-kien"],
    image: "/images/about-hd/event-ballroom.webp",
    pos: "center",
  },
];

export const getService = (slug) => services.find((s) => s.slug === slug);

// Quy trình sản xuất 7 bước (feedback 02/11)
export const processSteps = [
  {
    step: "01",
    image: "/images/about-hd/jewelry-consult.webp",
    imagePos: "center 40%",
    title: "Tiếp nhận",
    desc: "Tiếp nhận nhu cầu khách hàng, mục tiêu dự án, format video, ngân sách và thời gian.",
  },
  {
    step: "02",
    image: "/images/about-hd/crew-portrait.webp",
    imagePos: "center 35%",
    title: "Đề xuất định hướng",
    desc: "Đề xuất ý tưởng, bảng giá và timeline thực hiện.",
  },
  {
    step: "03",
    image: "/images/about-hd/handshake.webp",
    imagePos: "center 40%",
    title: "Hợp đồng",
    desc: "Ký hợp đồng và đặt cọc.",
  },
  {
    step: "04",
    image: "/images/bts/bts-04.webp",
    imagePos: "center",
    title: "Tiền kỳ",
    desc: "Kịch bản chi tiết, treatment, sitecheck, diễn viên, bối cảnh, meeting tổng duyệt nội dung trước khi onset.",
  },
  {
    step: "05",
    image: "/images/bts/bts-11.webp",
    imagePos: "center",
    title: "Onset",
    desc: "Sản xuất theo đúng timeline đã thống nhất.",
  },
  {
    step: "06",
    image: "/images/about-hd/tvc-monitor.webp",
    imagePos: "center 45%",
    title: "Hậu kỳ",
    desc: "Hậu kỳ, feedback và chỉnh sửa",
  },
  {
    step: "07",
    image: "/images/about-hd/partner-award.webp",
    imagePos: "center 40%",
    title: "Nghiệm thu & bàn giao",
    desc: "Bàn giao bản final, toàn bộ source qua ổ cứng, nghiệm thu, thanh lý hợp đồng và xuất hoá đơn.",
  },
];

// Vì sao khách hàng chọn Trần Duy Media — dùng chung: trang Về chúng tôi + "3 thế mạnh" ở trang dịch vụ
export const values = [
  {
    title: "Uy tín",
    image: "/images/bts/bts-05.webp",
    imagePos: "center 35%",
    desc: "10+ năm đồng hành cùng khách hàng, đối tác và doanh nghiệp — cam kết đúng tiến độ, đúng dự toán.",
  },
  {
    title: "Tối ưu chi phí",
    image: "/images/bts/bts-04.webp",
    imagePos: "center",
    desc: "Thiết bị, studio và ekip riêng — dự toán rõ từng hạng mục, không phát sinh ẩn.",
  },
  {
    title: "Tận tâm",
    image: "/images/bts/bts-06.webp",
    imagePos: "center 30%",
    desc: "Mỗi sản phẩm là một câu chuyện. Ekip dành thời gian hiểu thương hiệu trước khi hiểu máy quay.",
  },
];

//   = khoảng trắng không ngắt: giữ liền từ ghép ("dịch vụ", "trọn gói"…) khi nhãn xuống dòng
export const stats = [
  { value: "10+", label: "Năm kinh nghiệm thực chiến" },
  { value: "5", label: "Mảng dịch vụ trọn gói" },
  { value: "2", label: "Studio 24m² & 150m²" },
  { value: "A–Z", label: "Một đầu mối chịu trách nhiệm" },
];

// Ngành hàng đã đồng hành — hiện dạng dải chữ chạy. Khi có logo đối tác, thay bằng ảnh tại src/data/partners.js
export const industries = [
  "F&B",
  "Thời trang",
  "Trang sức",
  "Bất động sản",
  "Giáo dục",
  "Công nghệ",
  "Mỹ phẩm",
  "Nội thất",
  "Y tế",
  "Tài chính",
];

// Loại sản phẩm đã làm cho từng ngành — tầng dưới của dải "Đã đồng hành"
export const industryWork = [
  "TVC món ăn",
  "Lookbook thời trang",
  "Key visual trang sức",
  "Phim dự án bất động sản",
  "Video tuyển sinh",
  "Demo sản phẩm công nghệ",
  "Review mỹ phẩm",
  "Chụp ảnh nội thất",
  "Phim giới thiệu phòng khám",
  "Phim thương hiệu tài chính",
];

export const faqs = [
  {
    q: "Chi phí sản xuất một video quảng cáo là bao nhiêu?",
    a: "Tuỳ thời lượng, số ngày quay, diễn viên và mức độ hậu kỳ. Sau buổi trao đổi, chúng tôi đề xuất ý tưởng, bảng giá và timeline trong 24–48 giờ, chia theo hạng mục để bạn chủ động điều chỉnh.",
  },
  {
    q: "Thời gian hoàn thành một dự án video?",
    a: "Video short / video sự kiện: 3–7 ngày. Phim doanh nghiệp / iTVC: 2–4 tuần tính từ lúc duyệt kịch bản. Dự án gấp có thể thoả thuận ekip tăng cường.",
  },
  {
    q: "Thuê studio tính phí thế nào, có bao gồm đèn không?",
    a: "Tính theo giờ, tối thiểu 2 giờ, đã gồm hệ đèn Godox, phông nền và đạo cụ sẵn có. Có Room 1 (24m²) và Room 2 (150m²), có thể thuê kèm kỹ thuật viên ánh sáng hoặc ekip quay chụp.",
  },
  {
    q: "Có hỗ trợ ý tưởng và kịch bản nếu chúng tôi chưa có gì?",
    a: "Có. Đây là phần việc mặc định trong quy trình: chúng tôi đề xuất định hướng, kịch bản chi tiết và treatment để duyệt trước khi onset.",
  },
  {
    q: "Bàn giao những gì khi kết thúc dự án?",
    a: "Bản final theo đúng các tỉ lệ khung đã thống nhất, kèm toàn bộ source qua ổ cứng; sau đó nghiệm thu, thanh lý hợp đồng và xuất hoá đơn.",
  },
];
