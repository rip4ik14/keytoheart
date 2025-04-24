// utils/repeatOrder.ts

export const repeatOrder = (order: any) => {
    // ⚠️ Предполагаем, что order.order_items — массив товаров в заказе
    if (!order || !order.order_items) return [];
  
    return order.order_items.map((item: any) => ({
      id: item.product_id,
      title: item.product_name,
      price: item.unit_price,
      quantity: item.quantity,
      imageUrl: item.image_url, // имя поля должно соответствовать твоей структуре
    }));
  };
  