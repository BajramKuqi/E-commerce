export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    createdAt: string;
    rowVersion: number;
    imageUrl?: string;
}