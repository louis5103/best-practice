import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../../database/entities/product.entity';

/**
 * 상품 관리 모듈입니다.
 * 
 * 이 모듈은 쇼핑몰의 상품 카탈로그 시스템과 같은 역할을 합니다.
 * 상품의 등록, 조회, 수정, 삭제 등의 기본적인 상품 관리 기능과
 * 카테고리별 필터링, 페이지네이션 등의 고급 기능을 제공합니다.
 */
@Module({
  imports: [
    /**
     * Product 엔티티를 이 모듈에서 사용할 수 있도록 등록합니다.
     * 
     * 이렇게 등록하면 ProductsService에서 @InjectRepository(Product)를 통해
     * Product 리포지토리를 주입받아 데이터베이스 작업을 수행할 수 있습니다.
     */
    TypeOrmModule.forFeature([Product]),
  ],

  /**
   * 상품 관련 HTTP 요청을 처리할 컨트롤러입니다.
   * 
   * ProductsController는 /products/* 경로의 모든 요청을 처리합니다:
   * - GET /products - 상품 목록 조회 (공개)
   * - GET /products/:id - 상품 상세 조회 (공개)
   * - POST /products - 상품 등록 (관리자 전용)
   * - PUT /products/:id - 상품 수정 (관리자 전용)
   * - DELETE /products/:id - 상품 삭제 (관리자 전용)
   */
  controllers: [ProductsController],

  /**
   * 상품 관리의 핵심 비즈니스 로직을 담당하는 서비스입니다.
   * 
   * ProductsService는 다음과 같은 기능을 제공합니다:
   * - 상품 CRUD 작업
   * - Redis 캐싱을 통한 성능 최적화
   * - 카테고리별 필터링
   * - 페이지네이션 지원
   * - 에러 처리 및 로깅
   */
  providers: [
    ProductsService,
    
    // 향후 확장 가능한 서비스들:
    // ProductCategoryService, // 카테고리 관리
    // ProductInventoryService, // 재고 관리
    // ProductReviewService, // 상품 리뷰 관리
    // ProductImageService, // 상품 이미지 관리
  ],

  /**
   * 다른 모듈에서 사용할 수 있도록 내보낼 서비스들입니다.
   * 
   * ProductsService를 export함으로써 다른 모듈에서 상품 정보를
   * 조회하거나 활용할 수 있습니다. 예를 들어:
   * - OrderModule: 주문 처리 시 상품 정보 확인
   * - CartModule: 장바구니에 상품 정보 표시
   * - RecommendationModule: 상품 추천 시스템
   * - AnalyticsModule: 상품 판매 분석
   */
  exports: [
    ProductsService,
  ],
})
export class ProductsModule {
  /**
   * 모듈 초기화 시 실행되는 생성자입니다.
   */
  constructor() {
    console.log('🛍️  ProductsModule이 초기화되었습니다');
  }
}
