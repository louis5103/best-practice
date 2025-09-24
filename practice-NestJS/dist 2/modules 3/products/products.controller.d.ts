import { Request } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, PaginatedProductResponseDto } from './dto';
export declare class ProductsController {
    private readonly productsService;
    private readonly logger;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, req: Request): Promise<ProductResponseDto>;
    findAll(page?: string, limit?: string, category?: string): Promise<PaginatedProductResponseDto>;
    findOne(id: number): Promise<ProductResponseDto>;
    update(id: number, updateProductDto: UpdateProductDto, req: Request): Promise<ProductResponseDto>;
    remove(id: number, req: Request): Promise<{
        message: string;
    }>;
}
