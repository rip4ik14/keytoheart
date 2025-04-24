export interface Product {
    id: number;
    title: string;
    price: number;
    image: string;
  }
  
  export const popularProducts: Product[] = [
    {
      id: 1,
      title: "Клубничный букет #1",
      price: 2990,
      image: "https://via.placeholder.com/300x200.png?text=Strawberry+Bouquet+1",
    },
    {
      id: 2,
      title: "Клубничный бокс #2",
      price: 1990,
      image: "https://via.placeholder.com/300x200.png?text=Strawberry+Box+2",
    },
  ];
  