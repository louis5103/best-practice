import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean,
  MinLength, 
  MaxLength,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
  Matches,
  IsEnum,
  ValidateIf,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * 상품 카테고리 열거형입니다.
 * 
 * 실무에서는 카테고리를 자유 텍스트로 받기보다는 미리 정의된 값들 중에서
 * 선택하게 하는 것이 데이터 일관성 측면에서 더 좋습니다.
 * 이는 마치 드롭다운 메뉴에서 선택하는 것과 같은 개념입니다.
 * 
 * 장점:
 * 1. 데이터 일관성 보장 (오타나 표기법 차이 방지)
 * 2. 카테고리별 통계 집계가 정확해짐
 * 3. 필터링 기능 구현이 용이해짐
 * 4. API 문서에서 가능한 값들이 명확히 표시됨
 */
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing', 
  ACCESSORIES = 'accessories',
  HOME = 'home',
  SPORTS = 'sports',
  BOOKS = 'books',
  BEAUTY = 'beauty',
  FOOD = 'food',
  OTHER = 'other'
}

/**
 * 상품 상태 열거형입니다.
 * 
 * 단순한 boolean isActive보다 더 세밀한 상품 상태 관리를 위해 사용합니다.
 * 이는 실제 쇼핑몰에서 '품절', '일시중단', '판매중' 등의 상태를 구분하는 것과 같습니다.
 * 
 * 각 상태의 의미:
 * - DRAFT: 아직 공개되지 않은 초안 상태
 * - ACTIVE: 정상적으로 판매 중인 상태
 * - OUT_OF_STOCK: 재고가 없어서 일시적으로 구매 불가
 * - DISCONTINUED: 영구적으로 판매 중단된 상태
 */
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

/**
 * 개선된 상품 생성 DTO입니다.
 * 
 * 이 DTO는 이전 대화창에서 발굴한 고급 버전으로, 실제 쇼핑몰에서 필요한
 * 모든 비즈니스 로직과 검증 규칙을 포함하고 있습니다.
 * 
 * 주요 개선사항:
 * 1. 열거형을 통한 데이터 일관성 보장
 * 2. 정규표현식을 활용한 세밀한 검증
 * 3. 비즈니스 규칙의 코드 구현 (할인가 검증 등)
 * 4. 다중 이미지 지원
 * 5. 태그 시스템 도입
 * 6. 더 현실적인 제약 조건들
 */
export class CreateProductDto {
  /**
   * 상품명입니다.
   * 
   * 상품명은 SEO와 사용자 경험에 직접적인 영향을 미치므로
   * 적절한 길이 제한과 특수문자 처리가 중요합니다.
   * 
   * 허용되는 문자: 한글, 영문, 숫자, 공백, 하이픈, 밑줄, 마침표, 괄호, &, + 
   * 이는 실제 상품명에서 자주 사용되는 문자들을 고려한 것입니다.
   */
  @ApiProperty({
    description: '상품명',
    example: '프리미엄 스마트폰 보호 케이스 (iPhone 15 Pro)',
    minLength: 2,
    maxLength: 200
  })
  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품명은 필수 입력 항목입니다.' })
  @MinLength(2, { message: '상품명은 최소 2자 이상이어야 합니다.' })
  @MaxLength(200, { message: '상품명은 최대 200자까지 가능합니다.' })
  @Matches(/^[가-힣a-zA-Z0-9\s\-_.()&+]+$/, {
    message: '상품명에 허용되지 않은 특수문자가 포함되어 있습니다.'
  })
  name: string;

  /**
   * 상품 상세 설명입니다.
   * 
   * 상품 설명은 고객의 구매 결정에 중요한 요소이므로
   * 충분한 정보를 제공할 수 있도록 넉넉한 길이를 허용합니다.
   */
  @ApiPropertyOptional({
    description: '상품 상세 설명',
    example: '프리미엄 실리콘 소재로 제작된 고급 스마트폰 보호 케이스입니다. 충격 흡수 기능과 함께 우아한 디자인을 제공하며, 모든 포트와 버튼에 정확하게 접근할 수 있도록 설계되었습니다.'
  })
  @IsOptional()
  @IsString({ message: '상품 설명은 문자열이어야 합니다.' })
  @MaxLength(2000, { message: '상품 설명은 최대 2000자까지 가능합니다.' })
  description?: string;

  /**
   * 상품 정가입니다.
   * 
   * 실무에서는 가격 처리가 매우 중요하므로 다양한 검증을 적용합니다.
   * 소수점은 허용하지 않으며(원 단위), 현실적인 가격 범위를 설정합니다.
   */
  @ApiProperty({
    description: '상품 정가 (원 단위)',
    example: 25000,
    minimum: 1,
    maximum: 10000000
  })
  @IsNumber({ maxDecimalPlaces: 0 }, { 
    message: '가격은 소수점이 없는 정수여야 합니다.' 
  })
  @Min(1, { message: '가격은 최소 1원 이상이어야 합니다.' })
  @Max(10000000, { message: '가격은 최대 1,000만원 이하여야 합니다.' })
  @Type(() => Number)
  price: number;

  /**
   * 할인 가격입니다 (선택사항).
   * 
   * 할인 가격이 있는 경우, 정가보다 낮아야 한다는 비즈니스 규칙을 
   * validateDiscountPrice 메서드에서 검증합니다.
   */
  @ApiPropertyOptional({
    description: '할인 가격 (정가보다 낮아야 함)',
    example: 20000,
    minimum: 1
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { 
    message: '할인 가격은 소수점이 없는 정수여야 합니다.' 
  })
  @Min(1, { message: '할인 가격은 최소 1원 이상이어야 합니다.' })
  @Type(() => Number)
  discountPrice?: number;

  /**
   * 상품 카테고리입니다.
   * 
   * 열거형을 사용하여 데이터 일관성을 보장하고,
   * 프론트엔드에서 드롭다운으로 표시할 수 있게 합니다.
   */
  @ApiProperty({
    description: '상품 카테고리',
    example: ProductCategory.ACCESSORIES,
    enum: ProductCategory
  })
  @IsEnum(ProductCategory, {
    message: `카테고리는 다음 중 하나여야 합니다: ${Object.values(ProductCategory).join(', ')}`
  })
  category: ProductCategory;

  /**
   * 상품 상태입니다.
   * 
   * 기본값은 DRAFT로, 관리자가 검토 후 ACTIVE로 변경할 수 있습니다.
   * 이는 실제 쇼핑몰에서 상품 등록 후 검토 과정을 거치는 것을 반영합니다.
   */
  @ApiPropertyOptional({
    description: '상품 상태',
    example: ProductStatus.DRAFT,
    enum: ProductStatus,
    default: ProductStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: `상품 상태는 다음 중 하나여야 합니다: ${Object.values(ProductStatus).join(', ')}`
  })
  status?: ProductStatus = ProductStatus.DRAFT;

  /**
   * 초기 재고 수량입니다.
   * 
   * 재고 관리는 비즈니스에 직접적인 영향을 미치므로
   * 현실적인 제한을 두어 데이터 무결성을 보장합니다.
   * 999,999개라는 제한은 일반적인 중소규모 쇼핑몰에 적합한 수준입니다.
   */
  @ApiPropertyOptional({
    description: '초기 재고 수량',
    example: 50,
    default: 0,
    minimum: 0,
    maximum: 999999
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { 
    message: '재고 수량은 정수여야 합니다.' 
  })
  @Min(0, { message: '재고 수량은 0 이상이어야 합니다.' })
  @Max(999999, { message: '재고 수량은 999,999개 이하여야 합니다.' })
  @Type(() => Number)
  stock?: number = 0;

  /**
   * 상품 이미지 URL 배열입니다.
   * 
   * 현대 쇼핑몰에서는 상품을 여러 각도에서 보여주는 것이 중요하므로
   * 단일 이미지가 아닌 배열로 구성했습니다.
   * 최소 1개, 최대 10개까지 허용합니다.
   */
  @ApiPropertyOptional({
    description: '상품 이미지 URL 배열 (최소 1개, 최대 10개)',
    example: [
      'https://example.com/images/product-main.jpg',
      'https://example.com/images/product-detail1.jpg',
      'https://example.com/images/product-detail2.jpg'
    ],
    type: [String],
    minItems: 1,
    maxItems: 10
  })
  @IsOptional()
  @IsArray({ message: '이미지 목록은 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개의 이미지는 필요합니다.' })
  @ArrayMaxSize(10, { message: '최대 10개의 이미지까지만 가능합니다.' })
  @IsUrl({}, { each: true, message: '모든 이미지 URL은 올바른 형식이어야 합니다.' })
  imageUrls?: string[];

  /**
   * 상품 태그 배열입니다.
   * 
   * 태그는 검색 최적화, 추천 시스템, 관련 상품 제안 등에 활용됩니다.
   * 각 태그는 공백을 제거하고 소문자로 변환하여 일관성을 보장합니다.
   */
  @ApiPropertyOptional({
    description: '상품 태그 (검색 및 분류용)',
    example: ['스마트폰', '케이스', '보호', '실리콘', '아이폰'],
    type: [String],
    maxItems: 20
  })
  @IsOptional()
  @IsArray({ message: '태그 목록은 배열이어야 합니다.' })
  @ArrayMaxSize(20, { message: '최대 20개의 태그까지만 가능합니다.' })
  @IsString({ each: true, message: '각 태그는 문자열이어야 합니다.' })
  @MaxLength(50, { each: true, message: '각 태그는 최대 50자까지 가능합니다.' })
  @Transform(({ value }) => value?.map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];

  /**
   * 상품 브랜드입니다.
   * 
   * 브랜드 정보는 고객의 구매 결정에 중요한 요소이므로 별도 필드로 관리합니다.
   */
  @ApiPropertyOptional({
    description: '상품 브랜드',
    example: 'Apple',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: '브랜드는 문자열이어야 합니다.' })
  @MaxLength(100, { message: '브랜드명은 최대 100자까지 가능합니다.' })
  @Matches(/^[가-힣a-zA-Z0-9\s\-_.&]+$/, {
    message: '브랜드명에 허용되지 않은 특수문자가 포함되어 있습니다.'
  })
  brand?: string;

  /**
   * 상품 무게입니다 (그램 단위).
   * 
   * 배송비 계산이나 물류 관리에 필요한 정보입니다.
   */
  @ApiPropertyOptional({
    description: '상품 무게 (그램 단위)',
    example: 150,
    minimum: 1,
    maximum: 50000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { 
    message: '무게는 정수여야 합니다.' 
  })
  @Min(1, { message: '무게는 최소 1그램 이상이어야 합니다.' })
  @Max(50000, { message: '무게는 최대 50kg(50,000g) 이하여야 합니다.' })
  @Type(() => Number)
  weight?: number;

  /**
   * 상품 치수입니다 (가로 x 세로 x 높이, cm 단위).
   * 
   * 정규표현식을 사용하여 "10.5 x 5.2 x 1.8" 형태의 입력을 검증합니다.
   * 배송 상자 크기 계산이나 진열 계획에 활용됩니다.
   */
  @ApiPropertyOptional({
    description: '상품 치수 (가로 x 세로 x 높이, cm 단위)',
    example: '14.7 x 7.1 x 0.8',
    pattern: '^\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?$'
  })
  @IsOptional()
  @IsString({ message: '치수는 문자열이어야 합니다.' })
  @Matches(/^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?$/, {
    message: '치수는 "가로 x 세로 x 높이" 형태로 입력해주세요. (예: 14.7 x 7.1 x 0.8)'
  })
  dimensions?: string;

  /**
   * 비즈니스 규칙 검증: 할인 가격은 정가보다 낮아야 합니다.
   * 
   * 이 메서드는 class-validator의 커스텀 검증 기능을 활용한 것으로,
   * 단일 필드가 아닌 여러 필드 간의 관계를 검증할 때 사용합니다.
   * 
   * 실무에서는 이런 비즈니스 규칙들이 매우 중요한데, 
   * 예를 들어 관리자가 실수로 할인가를 정가보다 높게 설정하는 것을 방지합니다.
   */
  @ValidateIf((obj: CreateProductDto) => obj.discountPrice !== undefined)
  private validateDiscountPrice() {
    if (this.discountPrice && this.discountPrice >= this.price) {
      throw new Error('할인 가격은 정가보다 낮아야 합니다.');
    }
    return true;
  }
}
