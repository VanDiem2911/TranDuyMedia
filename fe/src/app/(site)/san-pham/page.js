import { ProductBrowser } from "@/components/gallery";
import { Container } from "@/components/ui";
import { ProductsHeader } from "@/components/about/ProductsHeader";
import { getProducts } from "@/lib/products";
import { createMetadata } from "@/lib/metadata";
import { getSiteContent } from "@/lib/site";
import { getProductsPage } from "@/lib/products-page";

// Tiêu đề + mô tả hiện trên Google / khi chia sẻ link: chỉnh ở trang quản trị (Chân trang, menu & SEO)
export async function generateMetadata() {
  const { seo } = await getSiteContent();
  return createMetadata({
    title: seo.products.title,
    description: seo.products.description,
    path: "/san-pham",
    image: "/images/vintage-green/vintage-green-03.webp",
  });
}

export default async function ProductsPage() {
  const [products, page] = await Promise.all([getProducts(), getProductsPage()]);
  return (
    <>
      <ProductsHeader header={page.header} />

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
