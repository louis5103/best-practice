"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../database/entities/product.entity");
const dto_1 = require("./dto");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(productRepository) {
        this.productRepository = productRepository;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async create(createProductDto) {
        try {
            const newProduct = this.productRepository.create(createProductDto);
            const savedProduct = await this.productRepository.save(newProduct);
            this.logger.log(`상품 생성 성공: ${savedProduct.name} (ID: ${savedProduct.id})`);
            return dto_1.ProductResponseDto.fromEntity(savedProduct);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`상품 생성 중 오류 발생: ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('상품 생성 중 오류가 발생했습니다.');
        }
    }
    async findAll(page = 1, limit = 10, category) {
        try {
            let queryBuilder = this.productRepository
                .createQueryBuilder('product')
                .where('product.isActive = :isActive', { isActive: true });
            if (category) {
                queryBuilder = queryBuilder.andWhere('product.category = :category', { category });
            }
            const offset = (page - 1) * limit;
            queryBuilder = queryBuilder
                .orderBy('product.createdAt', 'DESC')
                .skip(offset)
                .take(limit);
            const [products, total] = await queryBuilder.getManyAndCount();
            const productDtos = dto_1.ProductResponseDto.fromEntities(products);
            const result = dto_1.PaginatedProductResponseDto.create(productDtos, total, page, limit);
            this.logger.debug(`상품 목록 조회 완료: ${products.length}개 (총 ${total}개)`);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`상품 목록 조회 중 오류 발생: ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('상품 목록 조회 중 오류가 발생했습니다.');
        }
    }
    async findOne(id) {
        try {
            const product = await this.productRepository.findOne({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
            }
            return dto_1.ProductResponseDto.fromEntity(product);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`상품 조회 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('상품 조회 중 오류가 발생했습니다.');
        }
    }
    async update(id, updateProductDto) {
        try {
            const existingProduct = await this.productRepository.findOne({ where: { id } });
            if (!existingProduct) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
            }
            await this.productRepository.update(id, updateProductDto);
            const updatedProduct = await this.productRepository.findOne({ where: { id } });
            this.logger.log(`상품 정보 수정 완료: ID ${id}`);
            return dto_1.ProductResponseDto.fromEntity(updatedProduct);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`상품 수정 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('상품 수정 중 오류가 발생했습니다.');
        }
    }
    async remove(id) {
        try {
            const product = await this.productRepository.findOne({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
            }
            await this.productRepository.update(id, { isActive: false });
            this.logger.log(`상품 삭제 완료: ID ${id} (${product.name})`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`상품 삭제 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('상품 삭제 중 오류가 발생했습니다.');
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map