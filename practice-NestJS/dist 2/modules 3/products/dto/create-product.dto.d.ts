export declare enum ProductCategory {
    ELECTRONICS = "electronics",
    CLOTHING = "clothing",
    ACCESSORIES = "accessories",
    HOME = "home",
    SPORTS = "sports",
    BOOKS = "books",
    BEAUTY = "beauty",
    FOOD = "food",
    OTHER = "other"
}
export declare enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    OUT_OF_STOCK = "out_of_stock",
    DISCONTINUED = "discontinued"
}
export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    discountPrice?: number;
    category: ProductCategory;
    status?: ProductStatus;
    stock?: number;
    imageUrls?: string[];
    tags?: string[];
    brand?: string;
    weight?: number;
    dimensions?: string;
}
