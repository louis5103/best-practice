import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../../database/entities/product.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  PaginatedProductResponseDto
} from './dto';

/**
 * 상품 관리 서비스입니다.
 * 
 * 단순화된 버전으로, 실제 프로덕션 환경에서 점진적으로
 * 성능 최적화를 도입할 수 있도록 구성했습니다.
 * 
 * 현실적인 접근 방식:
 * - 초기에는 데이터베이스 직접 접근
 * - 성능 문제가 실제로 발생할 때 캐싱 도입
 * - 복잡한 쿼리나 외부 API 호출에만 캐싱 적용
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
   * 
   * 단순하고 직관적인 구현 - 상품 생성은 빈번하지 않은 작업이므로
   * 캐시 무효화의 복잡성보다는 코드의 명확성을 우선합니다.
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const newProduct = this.productRepository.create(createProductDto);
      const savedProduct = await this.productRepository.save(newProduct);

      this.logger.log(`상품 생성 성공: ${savedProduct.name} (ID: ${savedProduct.id})`);

      return ProductResponseDto.fromEntity(savedProduct);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 생성 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품 목록을 조회합니다.
   * 
   * 캐싱 없이 직접 데이터베이스 조회 - PostgreSQL은 이미 충분히 빠르며,
   * 인덱싱이 잘 되어 있다면 수천 개의 상품까지는 캐싱 없이도 빠른 응답이 가능합니다.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string
  ): Promise<PaginatedProductResponseDto> {
    try {
      // 쿼리 빌더 생성
      let queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where('product.isActive = :isActive', { isActive: true });

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
   * 
   * 단순한 ID 기반 조회는 데이터베이스가 가장 최적화된 작업 중 하나입니다.
   * 기본 키 인덱스를 사용하므로 매우 빠르며, 캐싱의 복잡성이 성능 이득을 상쇄할 수 있습니다.
   */
  async findOne(id: number): Promise<ProductResponseDto> {
    try {
      // 데이터베이스에서 직접 조회
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
   * 
   * 직관적인 업데이트 로직 - 복잡한 캐시 무효화보다는
   * 명확하고 이해하기 쉬운 코드를 우선합니다.
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      const existingProduct = await this.productRepository.findOne({ where: { id } });
      
      if (!existingProduct) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // 업데이트 실행
      await this.productRepository.update(id, updateProductDto);

      // 업데이트된 상품 정보 조회
      const updatedProduct = await this.productRepository.findOne({ where: { id } });

      this.logger.log(`상품 정보 수정 완료: ID ${id}`);

      return ProductResponseDto.fromEntity(updatedProduct);

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`상품 수정 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 수정 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품을 삭제합니다.
   * 
   * 소프트 삭제 방식으로 구현 - 실제 데이터는 유지하면서 비활성화만 수행
   * 이는 데이터 복구나 분석이 필요할 때 유용합니다.
   */
  async remove(id: number): Promise<void> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      
      if (!product) {
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // 소프트 삭제 (실제로는 비활성화)
      await this.productRepository.update(id, { isActive: false });

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
}
