import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductStatus } from '../../../common/types';
import { Product } from '../../../database/entities/product.entity';

/**
 * 상품 응답 DTO입니다.
 * 
 * ✨ 최신 개선사항:
 * - Product 엔티티와 완벽하게 일치하는 필드 구조
 * - ProductStatus, ProductCategory enum 활용
 * - 할인가격, 다중 이미지, 태그 시스템 지원
 * - 실제 엔티티의 모든 필드를 적절히 매핑
 */
export class ProductResponseDto {
  @ApiProperty({
    description: '상품 고유 ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: '상품명',
    example: '프리미엄 스마트폰 보호 케이스 (iPhone 15 Pro)'
  })
  name!: string;

  @ApiProperty({
    description: '상품 상세 설명',
    example: '프리미엄 실리콘 소재로 제작된 고급 스마트폰 보호 케이스입니다.',
    nullable: true
  })
  description?: string;

  @ApiProperty({
    description: '상품 정가',
    example: 25000
  })
  price!: number;

  @ApiProperty({
    description: '할인 가격 (정가보다 낮은 경우에만)',
    example: 20000,
    nullable: true
  })
  discountPrice?: number;

  @ApiProperty({
    description: '상품 카테고리',
    example: ProductCategory.ACCESSORIES,
    enum: ProductCategory
  })
  category!: ProductCategory;

  @ApiProperty({
    description: '상품 상태',
    example: ProductStatus.ACTIVE,
    enum: ProductStatus
  })
  status!: ProductStatus;

  @ApiProperty({
    description: '재고 수량',
    example: 50
  })
  stock!: number;

  @ApiProperty({
    description: '상품 이미지 URL 배열',
    example: [
      'https://example.com/images/product-main.jpg',
      'https://example.com/images/product-detail1.jpg',
      'https://example.com/images/product-detail2.jpg'
    ],
    type: [String],
    nullable: true
  })
  imageUrls?: string[];

  @ApiProperty({
    description: '상품 태그 (검색 및 분류용)',
    example: ['스마트폰', '케이스', '보호', '실리콘', '아이폰'],
    type: [String],
    nullable: true
  })
  tags?: string[];

  @ApiProperty({
    description: '상품 브랜드',
    example: 'Apple',
    nullable: true
  })
  brand?: string;

  @ApiProperty({
    description: '상품 무게 (그램 단위)',
    example: 150,
    nullable: true
  })
  weight?: number;

  @ApiProperty({
    description: '상품 치수 (가로 x 세로 x 높이, cm 단위)',
    example: '14.7 x 7.1 x 0.8',
    nullable: true
  })
  dimensions?: string;

  @ApiProperty({
    description: '상품 등록 시간',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt!: Date;

  @ApiProperty({
    description: '상품 정보 수정 시간',
    example: '2024-01-10T15:30:00.000Z'
  })
  updatedAt!: Date;

  // 계산된 필드들 (엔티티의 유틸리티 메서드 결과)
  @ApiProperty({
    description: '할인율 (퍼센트)',
    example: 20
  })
  discountRate!: number;

  @ApiProperty({
    description: '실제 판매 가격 (할인가가 있으면 할인가, 없으면 정가)',
    example: 20000
  })
  sellingPrice!: number;

  @ApiProperty({
    description: '구매 가능 여부 (ACTIVE 상태이고 재고가 있는 경우)',
    example: true
  })
  isAvailableForPurchase!: boolean;

  @ApiProperty({
    description: '대표 이미지 URL',
    example: 'https://example.com/images/product-main.jpg',
    nullable: true
  })
  mainImageUrl!: string | null;

  /**
   * Product 엔티티를 ProductResponseDto로 변환합니다.
   * 
   * 엔티티의 모든 필드와 유틸리티 메서드 결과를 DTO에 매핑합니다.
   */
  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    
    // 기본 필드들
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = Number(product.price); // decimal to number 변환
    dto.discountPrice = product.discountPrice ? Number(product.discountPrice) : undefined;
    dto.category = product.category;
    dto.status = product.status;
    dto.stock = product.stock;
    dto.imageUrls = product.imageUrls;
    dto.tags = product.tags;
    dto.brand = product.brand;
    dto.weight = product.weight;
    dto.dimensions = product.dimensions;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    
    // 계산된 필드들 (엔티티의 유틸리티 메서드 활용)
    dto.discountRate = product.getDiscountRate();
    dto.sellingPrice = Number(product.getSellingPrice());
    dto.isAvailableForPurchase = product.isAvailableForPurchase();
    dto.mainImageUrl = product.getMainImageUrl();
    
    return dto;
  }

  /**
   * 여러 Product 엔티티를 ProductResponseDto 배열로 변환합니다.
   */
  static fromEntities(products: Product[]): ProductResponseDto[] {
    return products.map(product => this.fromEntity(product));
  }
}

/**
 * 페이지네이션된 상품 목록 응답 DTO입니다.
 * 
 * 프론트엔드에서 페이지네이션 UI를 구성하는 데 필요한 모든 정보를 포함합니다.
 */
export class PaginatedProductResponseDto {
  @ApiProperty({
    description: '현재 페이지의 상품 목록',
    type: [ProductResponseDto]
  })
  data!: ProductResponseDto[];

  @ApiProperty({
    description: '전체 상품 수',
    example: 250
  })
  total!: number;

  @ApiProperty({
    description: '현재 페이지 번호',
    example: 1
  })
  page!: number;

  @ApiProperty({
    description: '페이지당 상품 수',
    example: 10
  })
  limit!: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 25
  })
  totalPages!: number;

  @ApiProperty({
    description: '이전 페이지 존재 여부',
    example: false
  })
  hasPreviousPage!: boolean;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true
  })
  hasNextPage!: boolean;

  /**
   * 페이지네이션 응답 DTO를 생성합니다.
   */
  static create(
    data: ProductResponseDto[],
    total: number,
    page: number,
    limit: number
  ): PaginatedProductResponseDto {
    const totalPages = Math.ceil(total / limit);
    
    const result = new PaginatedProductResponseDto();
    result.data = data;
    result.total = total;
    result.page = page;
    result.limit = limit;
    result.totalPages = totalPages;
    result.hasPreviousPage = page > 1;
    result.hasNextPage = page < totalPages;
    
    return result;
  }
}

/**
 * 간단한 상품 정보 DTO입니다.
 * 
 * 목록 화면이나 검색 결과에서 사용할 수 있는 
 * 핵심 정보만 포함하는 경량 DTO입니다.
 */
export class SimpleProductResponseDto {
  @ApiProperty({
    description: '상품 고유 ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: '상품명',
    example: '프리미엄 스마트폰 보호 케이스'
  })
  name!: string;

  @ApiProperty({
    description: '실제 판매 가격',
    example: 20000
  })
  sellingPrice!: number;

  @ApiProperty({
    description: '원래 가격 (할인이 있는 경우 표시)',
    example: 25000,
    nullable: true
  })
  originalPrice?: number;

  @ApiProperty({
    description: '할인율 (퍼센트)',
    example: 20
  })
  discountRate!: number;

  @ApiProperty({
    description: '상품 카테고리',
    example: ProductCategory.ACCESSORIES,
    enum: ProductCategory
  })
  category!: ProductCategory;

  @ApiProperty({
    description: '구매 가능 여부',
    example: true
  })
  isAvailableForPurchase!: boolean;

  @ApiProperty({
    description: '대표 이미지 URL',
    example: 'https://example.com/images/product-main.jpg',
    nullable: true
  })
  mainImageUrl!: string | null;

  /**
   * Product 엔티티를 SimpleProductResponseDto로 변환합니다.
   */
  static fromEntity(product: Product): SimpleProductResponseDto {
    const dto = new SimpleProductResponseDto();
    
    dto.id = product.id;
    dto.name = product.name;
    dto.sellingPrice = Number(product.getSellingPrice());
    dto.originalPrice = product.discountPrice ? Number(product.price) : undefined;
    dto.discountRate = product.getDiscountRate();
    dto.category = product.category;
    dto.isAvailableForPurchase = product.isAvailableForPurchase();
    dto.mainImageUrl = product.getMainImageUrl();
    
    return dto;
  }

  /**
   * 여러 Product 엔티티를 SimpleProductResponseDto 배열로 변환합니다.
   */
  static fromEntities(products: Product[]): SimpleProductResponseDto[] {
    return products.map(product => this.fromEntity(product));
  }
}
