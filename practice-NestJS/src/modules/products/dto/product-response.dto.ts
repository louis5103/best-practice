import { ApiProperty } from '@nestjs/swagger';

/**
 * 상품 응답 DTO입니다.
 */
export class ProductResponseDto {
  @ApiProperty({
    description: '상품 고유 ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: '상품명',
    example: '스마트폰 케이스'
  })
  name!: string;

  @ApiProperty({
    description: '상품 설명',
    example: '고품질 실리콘 재질로 제작된 스마트폰 보호 케이스입니다.',
    nullable: true
  })
  description?: string;

  @ApiProperty({
    description: '상품 가격',
    example: 15000
  })
  price!: number;

  @ApiProperty({
    description: '상품 카테고리',
    example: '액세서리'
  })
  category!: string;

  @ApiProperty({
    description: '재고 수량',
    example: 100
  })
  stock!: number;

  @ApiProperty({
    description: '상품 활성화 상태',
    example: true
  })
  isActive!: boolean;

  @ApiProperty({
    description: '상품 이미지 URL',
    example: 'https://example.com/images/product.jpg',
    nullable: true
  })
  imageUrl?: string;

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

  /**
   * Product 엔티티를 ProductResponseDto로 변환합니다.
   */
  static fromEntity(product: any): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.price;
    dto.category = product.category;
    dto.stock = product.stock;
    dto.isActive = product.isActive;
    dto.imageUrl = product.imageUrl;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    
    return dto;
  }

  /**
   * 여러 Product 엔티티를 ProductResponseDto 배열로 변환합니다.
   */
  static fromEntities(products: any[]): ProductResponseDto[] {
    return products.map(product => this.fromEntity(product));
  }
}

/**
 * 페이지네이션된 상품 목록 응답 DTO입니다.
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
  hasPrevious!: boolean;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true
  })
  hasNext!: boolean;

  static create(
    data: ProductResponseDto[],
    total: number,
    page: number,
    limit: number
  ): PaginatedProductResponseDto {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages
    };
  }
}
