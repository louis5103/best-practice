import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../../database/entities/product.entity';
import { ProductStatus } from '../../common/types';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  PaginatedProductResponseDto
} from './dto';

/**
 * 상품 관리 서비스입니다.
 * 
 * ✨ 최신 개선사항:
 * - ProductStatus enum을 활용한 정확한 상품 상태 관리
 * - 공통 타입 시스템과 완벽하게 통합
 * - TypeScript strict 모드 완전 호환
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  /**
   * 새로운 상품을 생성합니다.
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      // 비즈니스 로직 검증
      if (createProductDto.discountPrice && createProductDto.discountPrice >= createProductDto.price) {
        throw new BadRequestException('할인 가격은 정가보다 낮아야 합니다.');
      }

      const newProduct = this.productRepository.create(createProductDto);
      const savedProduct = await this.productRepository.save(newProduct);

      this.logger.log(`상품 생성 성공: ${savedProduct.name} (ID: ${savedProduct.id})`);

      return ProductResponseDto.fromEntity(savedProduct);

    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 생성 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품 목록을 조회합니다.
   * 
   * ✨ 개선사항: status 필드를 활용한 정확한 상품 필터링
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string
  ): Promise<PaginatedProductResponseDto> {
    try {
      // 쿼리 빌더 생성 - ACTIVE 상태의 상품만 조회
      let queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where('product.status = :status', { status: ProductStatus.ACTIVE });

      // 카테고리 필터 적용
      if (category) {
        queryBuilder = queryBuilder.andWhere('product.category = :category', { category });
      }

      // 페이지네이션 적용
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      // 데이터 조회
      const [products, total] = await queryBuilder.getManyAndCount();

      // DTO 변환
      const productDtos = ProductResponseDto.fromEntities(products);
      const result = PaginatedProductResponseDto.create(productDtos, total, page, limit);

      this.logger.debug(`상품 목록 조회 완료: ${products.length}개 (총 ${total}개)`);

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 목록 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 상품을 조회합니다.
   */
  async findOne(id: number): Promise<ProductResponseDto> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      return ProductResponseDto.fromEntity(product);

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 조회 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품 정보를 수정합니다.
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      const existingProduct = await this.productRepository.findOne({ where: { id } });
      
      if (!existingProduct) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // 비즈니스 로직 검증 - 할인가격이 정가보다 높지 않은지 확인
      const newPrice = updateProductDto.price ?? existingProduct.price;
      const newDiscountPrice = updateProductDto.discountPrice ?? existingProduct.discountPrice;
      
      if (newDiscountPrice && newDiscountPrice >= Number(newPrice)) {
        throw new BadRequestException('할인 가격은 정가보다 낮아야 합니다.');
      }

      // 업데이트 실행 - 타입 안전성 보장
      const updateData: Partial<Product> = {};
      
      if (updateProductDto.name !== undefined) updateData.name = updateProductDto.name;
      if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
      if (updateProductDto.price !== undefined) updateData.price = updateProductDto.price;
      if (updateProductDto.discountPrice !== undefined) updateData.discountPrice = updateProductDto.discountPrice;
      if (updateProductDto.category !== undefined) updateData.category = updateProductDto.category;
      if (updateProductDto.status !== undefined) updateData.status = updateProductDto.status;
      if (updateProductDto.stock !== undefined) updateData.stock = updateProductDto.stock;
      if (updateProductDto.imageUrls !== undefined) updateData.imageUrls = updateProductDto.imageUrls;
      if (updateProductDto.tags !== undefined) updateData.tags = updateProductDto.tags;
      if (updateProductDto.brand !== undefined) updateData.brand = updateProductDto.brand;
      if (updateProductDto.weight !== undefined) updateData.weight = updateProductDto.weight;
      if (updateProductDto.dimensions !== undefined) updateData.dimensions = updateProductDto.dimensions;

      await this.productRepository.update(id, updateData);

      // 업데이트된 상품 정보 조회
      const updatedProduct = await this.productRepository.findOne({ where: { id } });

      if (!updatedProduct) {
        throw new NotFoundException('상품 업데이트 후 조회에 실패했습니다.');
      }

      this.logger.log(`상품 정보 수정 완료: ID ${id}`);

      return ProductResponseDto.fromEntity(updatedProduct);

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 수정 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 수정 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품을 삭제합니다 (소프트 삭제).
   */
  async remove(id: number): Promise<void> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      
      if (!product) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // 소프트 삭제 - status를 DISCONTINUED로 변경
      await this.productRepository.update(id, { status: ProductStatus.DISCONTINUED });

      this.logger.log(`상품 삭제 완료: ID ${id} (${product.name})`);

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 삭제 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 관리자용 상품 목록 조회 (모든 상태 포함)
   */
  async findAllForAdmin(
    page: number = 1,
    limit: number = 10,
    category?: string,
    status?: ProductStatus
  ): Promise<PaginatedProductResponseDto> {
    try {
      // 쿼리 빌더 생성 - 상태 제한 없음
      let queryBuilder = this.productRepository.createQueryBuilder('product');

      // 조건 추가
      const conditions: string[] = [];
      const parameters: Record<string, any> = {};

      if (category) {
        conditions.push('product.category = :category');
        parameters.category = category;
      }

      if (status) {
        conditions.push('product.status = :status');
        parameters.status = status;
      }

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(conditions.join(' AND '), parameters);
      }

      // 페이지네이션 적용
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      // 데이터 조회
      const [products, total] = await queryBuilder.getManyAndCount();

      // DTO 변환
      const productDtos = ProductResponseDto.fromEntities(products);
      const result = PaginatedProductResponseDto.create(productDtos, total, page, limit);

      this.logger.debug(`관리자용 상품 목록 조회 완료: ${products.length}개 (총 ${total}개)`);

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`관리자용 상품 목록 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 재고 업데이트 메서드
   */
  async updateStock(id: number, quantity: number): Promise<ProductResponseDto> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      
      if (!product) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      const newStock = product.stock + quantity;
      
      if (newStock < 0) {
        throw new BadRequestException('재고가 부족합니다.');
      }

      // 재고 업데이트
      const updateData: Partial<Product> = { stock: newStock };
      
      // 재고가 0이 되면 품절 상태로 변경
      if (newStock === 0 && product.status === ProductStatus.ACTIVE) {
        updateData.status = ProductStatus.OUT_OF_STOCK;
      }
      // 재고가 다시 생기면 활성 상태로 변경 (품절 상태였던 경우)
      else if (newStock > 0 && product.status === ProductStatus.OUT_OF_STOCK) {
        updateData.status = ProductStatus.ACTIVE;
      }

      await this.productRepository.update(id, updateData);

      // 업데이트된 상품 정보 조회
      const updatedProduct = await this.productRepository.findOne({ where: { id } });

      if (!updatedProduct) {
        throw new NotFoundException('재고 업데이트 후 상품 조회에 실패했습니다.');
      }

      this.logger.log(`재고 업데이트 완료: ID ${id}, 변경량: ${quantity}, 현재 재고: ${newStock}`);

      return ProductResponseDto.fromEntity(updatedProduct);

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`재고 업데이트 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('재고 업데이트 중 오류가 발생했습니다.');
    }
  }
}
