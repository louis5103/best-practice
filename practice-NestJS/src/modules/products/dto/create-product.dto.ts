import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean,
  MinLength, 
  MaxLength,
  Min,
  IsUrl,
  IsNotEmpty
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 상품 생성 DTO입니다.
 */
export class CreateProductDto {
  @ApiProperty({
    description: '상품명',
    example: '스마트폰 케이스',
    minLength: 1,
    maxLength: 200
  })
  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품명은 필수 입력 항목입니다.' })
  @MinLength(1, { message: '상품명은 최소 1자 이상이어야 합니다.' })
  @MaxLength(200, { message: '상품명은 최대 200자까지 가능합니다.' })
  name: string;

  @ApiPropertyOptional({
    description: '상품 설명',
    example: '고품질 실리콘 재질로 제작된 스마트폰 보호 케이스입니다.'
  })
  @IsOptional()
  @IsString({ message: '상품 설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiProperty({
    description: '상품 가격',
    example: 15000,
    minimum: 0
  })
  @IsNumber({}, { message: '가격은 숫자여야 합니다.' })
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: '상품 카테고리',
    example: '액세서리'
  })
  @IsString({ message: '카테고리는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '카테고리는 필수 입력 항목입니다.' })
  @MaxLength(100, { message: '카테고리는 최대 100자까지 가능합니다.' })
  category: string;

  @ApiPropertyOptional({
    description: '재고 수량',
    example: 100,
    default: 0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({}, { message: '재고 수량은 숫자여야 합니다.' })
  @Min(0, { message: '재고 수량은 0 이상이어야 합니다.' })
  @Type(() => Number)
  stock?: number = 0;

  @ApiPropertyOptional({
    description: '상품 활성화 상태',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: '활성화 상태는 true 또는 false여야 합니다.' })
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: '상품 이미지 URL',
    example: 'https://example.com/images/product.jpg'
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식을 입력해주세요.' })
  imageUrl?: string;
}
