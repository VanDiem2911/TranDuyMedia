import { ProductBrowser } from "@/components/gallery";
import { Container } from "@/components/ui";
import { PageHeader } from "@/components/sections";
import { getProducts } from "@/lib/products";
import { createMetadata } from "@/lib/metadata";

// Nền đầu trang: 6 cột ảnh trôi so le — khung hình từ chính các sản phẩm đã thực hiện (clip & ảnh trên Drive)
const HEADER_IMAGES = [
  "/images/clips/short-3.webp",
  "/images/services/itvc-elip-1.webp",
  "/images/about-hd/event-ballroom.webp",
  "/images/clips/short-4.webp",
  "/images/clips/itvc-6.webp",
  "/images/services/itvc-elip-3.webp",
  "/images/clips/short-6.webp",
  "/images/clips/itvc-2.webp",
  "/images/about-hd/corporate-factory.webp",
  "/images/clips/short-8.webp",
  "/images/services/itvc-elip-2.webp",
  "/images/clips/itvc-9.webp",
  "/images/clips/short-2.webp",
  "/images/clips/itvc-7.webp",
  "/images/about-hd/jewelry-store.webp",
  "/images/clips/short-7.webp",
  "/images/services/itvc-elip-4.webp",
  "/images/about-hd/event-stage-girls.webp",
];
const headerColumns = Array.from({ length: 6 }, (_, i) =>
  [0, 1, 2].map((k) => HEADER_IMAGES[i * 3 + k]),
);

export const metadata = createMetadata({
  title: "Sản phẩm đã thực hiện",
  description:
    "Các dự án video marketing, chụp ảnh thương mại, chụp ảnh sự kiện do Trần Duy Media Studio thực hiện — từ ý tưởng, sản xuất đến hậu kỳ.",
  path: "/san-pham",
  image: "/images/vintage-green/vintage-green-03.webp",
});

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeader
        title="Sản phẩm"
        eyebrow="Dự án đã thực hiện"
        description="Những dự án video marketing, chụp ảnh thương mại và sự kiện do Trần Duy Media thực hiện — từ ý tưởng đến hậu kỳ."
        columns={headerColumns}
      />

      <section
        className="bg-paper pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24"
        data-nav-theme="light"
      >
        <Container>
          <ProductBrowser products={products} />
        </Container>
      </section>
    </>
  );
}
