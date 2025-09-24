export declare class ProductResponseDto {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    stock: number;
    isActive: boolean;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(product: any): ProductResponseDto;
    static fromEntities(products: any[]): ProductResponseDto[];
}
export declare class PaginatedProductResponseDto {
    data: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    static create(data: ProductResponseDto[], total: number, page: number, limit: number): PaginatedProductResponseDto;
}
