// ✅ Путь: /app/corporate/page.tsx
import CorporateHero from "@components/CorporateHero";
import CorporateForm from "@components/CorporateForm";
import CorporateHighlights from "@components/CorporateHighlights";
import CorporateSteps from "@components/CorporateSteps";
import CorporateGallerySlider from "@components/CorporateGallerySlider";
import CorporateOfferings from "@components/CorporateOfferings";
import CorporateFooterCTA from "@components/CorporateFooterCTA";

/** SEO‑мета для корпоративного лендинга */
export const metadata = {
  title: "Корпоративные подарки и букеты — KeyToHeart",
  description:
    "Фруктово‑цветочные подарки, брендированные боксы и букеты для сотрудников и партнёров. Документы для юрлиц, бесплатная доставка по Краснодару.",
  openGraph: {
    images: "/og-cover.jpg",
  },
};

export default function CorporatePage() {
  return (
    <main className="bg-white text-black">
      <CorporateHero />
      <CorporateForm />
      <CorporateHighlights />
      <CorporateSteps />
      <CorporateGallerySlider />
      <CorporateOfferings />
      <CorporateFooterCTA />
    </main>
  );
}
