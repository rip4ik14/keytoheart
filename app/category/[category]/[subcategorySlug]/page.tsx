import { redirect } from 'next/navigation';

export default async function SubcategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subcategorySlug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { category, subcategorySlug } = await params;
  const { sort = 'newest' } = await searchParams;

  // Перенаправляем на страницу категории с параметром subcategory
  redirect(`/category/${category}?sort=${sort}&subcategory=${subcategorySlug}`);
}
