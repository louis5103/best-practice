import { ProductCategory, ProductStatus } from '../../common/types';
export declare class Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    discountPrice?: number;
    category: ProductCategory;
    status: ProductStatus;
    stock: number;
    imageUrls?: string[];
    tags?: string[];
    brand?: string;
    weight?: number;
    dimensions?: string;
    createdAt: Date;
    updatedAt: Date;
    getDiscountRate(): number;
    getSellingPrice(): number;
    isAvailableForPurchase(): boolean;
    getMainImageUrl(): string | null;
}
