import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * 상품 수정 DTO입니다.
 * 
 * PartialType을 사용하여 CreateProductDto의 모든 필드를 선택사항으로 만듭니다.
 * 이렇게 하면 필요한 필드만 선택적으로 업데이트할 수 있습니다.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  // PartialType이 모든 필드를 자동으로 선택사항으로 만들어주므로
  // 별도의 필드 정의가 필요하지 않습니다.
  // 
  // 만약 특정 필드에 대해 추가 검증이나 설명이 필요하다면
  // 여기에 오버라이드해서 정의할 수 있습니다.
}
