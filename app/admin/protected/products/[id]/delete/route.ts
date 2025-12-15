import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("in_stock")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ success: false, message: "Ошибка получения товара" }, { status: 500 });
  }

  const newValue = !product.in_stock;

  const { error } = await supabase
    .from("products")
    .update({ in_stock: newValue })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  revalidatePath("/admin/products");

  return NextResponse.json({ success: true, newValue });
}
