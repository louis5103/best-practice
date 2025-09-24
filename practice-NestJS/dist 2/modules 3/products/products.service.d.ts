import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, PaginatedProductResponseDto } from './dto';
export declare class ProductsService {
    private readonly productRepository;
    private readonly logger;
    constructor(productRepository: Repository<Product>);
    create(createProductDto: CreateProductDto): Promise<ProductResponseDto>;
    findAll(page?: number, limit?: number, category?: string): Promise<PaginatedProductResponseDto>;
    findOne(id: number): Promise<ProductResponseDto>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto>;
    remove(id: number): Promise<void>;
}
