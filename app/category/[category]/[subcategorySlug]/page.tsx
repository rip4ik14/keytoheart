import { redirect } from 'next/navigation';

export default async function SubcategoryRedirect({
  params,
  searchParams,
}: {
  params: { category: string; subcategorySlug: string };
  searchParams: { sort?: string };
}) {
  const { category, subcategorySlug } = params;
  const { sort = 'newest' } = searchParams;

  // Перенаправляем на страницу категории с параметром subcategory
  redirect(`/category/${category}?sort=${sort}&subcategory=${subcategorySlug}`);
}
