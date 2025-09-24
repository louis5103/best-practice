import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { ProductCategory, ProductStatus } from '../../common/types';

/**
 * Product 엔티티 - 상품 정보를 저장하는 데이터베이스 테이블의 구조를 정의합니다.
 * 
 * ✨ 최신 개선사항:
 * - 공통 타입 시스템 도입으로 DTO와 100% 일치하는 필드 구조
 * - ProductCategory, ProductStatus enum을 공통 타입에서 import
 * - 타입 안전성과 코드 일관성 대폭 향상
 * - 중복된 enum 정의 제거로 단일 진실 원천(Single Source of Truth) 구현
 * 
 * 이 엔티티는 실제 쇼핑몰에서 필요한 모든 상품 정보를 포함하도록 설계되었습니다.
 * CreateProductDto와 완전히 일치하는 필드들을 가지고 있어, 데이터 일관성을 보장합니다.
 * 
 * 주요 특징:
 * 1. 🎯 DTO와 엔티티 간의 완벽한 필드 일치성
 * 2. 🔧 공통 타입 시스템을 통한 중복 제거
 * 3. 📦 다중 이미지 지원 (imageUrls 배열)
 * 4. 🏷️ 태그 시스템으로 검색 및 분류 기능 향상
 * 5. 💰 할인가격과 정가를 분리한 유연한 가격 체계
 * 6. 📊 브랜드, 무게, 치수 등 실무에서 필요한 상세 정보
 * 7. ⚡ 비즈니스 로직을 위한 유틸리티 메서드들
 */
@Entity('products')
@Index(['category']) // 카테고리별 검색 성능 향상
@Index(['status']) // 상품 상태별 조회 성능 향상 
@Index(['brand']) // 브랜드별 검색 성능 향상
@Index(['tags']) // 태그 검색 성능 향상 (GIN 인덱스 권장)
export class Product {
  /**
   * 상품 고유 식별자입니다.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 상품명입니다.
   * 
   * DTO와 동일한 길이 제한을 적용하여 일관성을 유지합니다.
   */
  @Column({ 
    length: 200,
    comment: '상품명'
  })
  name!: string;

  /**
   * 상품 상세 설명입니다.
   * 
   * text 타입을 사용하여 긴 설명도 저장할 수 있습니다.
   */
  @Column({ 
    type: 'text',
    nullable: true,
    comment: '상품 상세 설명'
  })
  description?: string;

  /**
   * 상품 정가입니다.
   * 
   * decimal 타입을 사용하여 정확한 금액 계산을 보장합니다.
   * precision 10, scale 2는 최대 99,999,999.99까지 저장 가능합니다.
   */
  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '상품 정가'
  })
  price!: number;

  /**
   * 할인 가격입니다.
   * 
   * 할인이 있는 상품의 경우에만 값이 설정되며, null이면 할인이 없는 것입니다.
   * 비즈니스 로직에서 이 값이 정가보다 낮은지 검증해야 합니다.
   */
  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '할인 가격 (정가보다 낮아야 함)'
  })
  discountPrice?: number;

  /**
   * 상품 카테고리입니다.
   * 
   * enum을 사용하여 데이터 일관성을 보장합니다.
   * PostgreSQL에서는 실제 enum 타입으로 저장됩니다.
   */
  @Column({
    type: 'enum',
    enum: ProductCategory,
    comment: '상품 카테고리'
  })
  category!: ProductCategory;

  /**
   * 상품 상태입니다.
   * 
   * 기존의 단순한 isActive boolean 대신 더 세밀한 상태 관리를 위해 enum을 사용합니다.
   * 이렇게 하면 '품절', '단종', '임시중단' 등의 상태를 구분할 수 있습니다.
   */
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    comment: '상품 상태'
  })
  status!: ProductStatus;

  /**
   * 재고 수량입니다.
   * 
   * 재고가 0이 되면 자동으로 status를 OUT_OF_STOCK으로 변경하는 로직을
   * 서비스 레이어에서 구현할 수 있습니다.
   */
  @Column({ 
    default: 0,
    comment: '재고 수량'
  })
  stock!: number;

  /**
   * 상품 이미지 URL 배열입니다.
   * 
   * 현대 쇼핑몰에서는 상품을 여러 각도에서 보여주는 것이 중요하므로
   * 단일 이미지가 아닌 배열로 저장합니다.
   * 
   * PostgreSQL의 경우 array 타입을 지원하지만, 호환성을 위해 
   * simple-array를 사용합니다. (쉼표로 구분된 문자열로 저장)
   */
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: '상품 이미지 URL 배열'
  })
  imageUrls?: string[];

  /**
   * 상품 태그 배열입니다.
   * 
   * 검색 최적화, 추천 시스템, 관련 상품 제안 등에 활용됩니다.
   * 태그는 소문자로 정규화되어 저장됩니다.
   */
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: '상품 태그 (검색 및 분류용)'
  })
  tags?: string[];

  /**
   * 상품 브랜드입니다.
   * 
   * 브랜드별 검색이나 필터링을 위해 별도 필드로 관리합니다.
   * 브랜드 정보는 고객의 구매 결정에 중요한 요소입니다.
   */
  @Column({ 
    nullable: true,
    length: 100,
    comment: '상품 브랜드'
  })
  brand?: string;

  /**
   * 상품 무게입니다 (그램 단위).
   * 
   * 배송비 계산이나 물류 관리에 필요한 정보입니다.
   * 디지털 상품이나 서비스의 경우에는 null일 수 있습니다.
   */
  @Column({ 
    nullable: true,
    comment: '상품 무게 (그램 단위)'
  })
  weight?: number;

  /**
   * 상품 치수입니다 (가로 x 세로 x 높이, cm 단위).
   * 
   * 배송 상자 크기 계산이나 진열 계획에 활용됩니다.
   * "14.7 x 7.1 x 0.8" 형태의 문자열로 저장됩니다.
   */
  @Column({ 
    nullable: true,
    length: 50,
    comment: '상품 치수 (가로 x 세로 x 높이, cm 단위)'
  })
  dimensions?: string;

  /**
   * 상품 등록 시간입니다.
   * 
   * 자동으로 현재 시간이 설정되며, 상품 등록 순서를 파악할 수 있습니다.
   */
  @CreateDateColumn({ 
    name: 'created_at',
    comment: '상품 등록 시간'
  })
  createdAt!: Date;

  /**
   * 상품 정보 수정 시간입니다.
   * 
   * 상품 정보가 변경될 때마다 자동으로 갱신됩니다.
   * 재고 변경, 가격 변경 등의 이력을 추적할 수 있습니다.
   */
  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: '상품 정보 수정 시간'
  })
  updatedAt!: Date;

  /**
   * 할인율을 계산하는 유틸리티 메서드입니다.
   * 
   * 비즈니스 로직을 엔티티에 포함시켜 재사용성을 높입니다.
   * 할인가가 있는 경우에만 할인율을 계산합니다.
   * 
   * @returns 할인율 (퍼센트), 할인이 없으면 0
   */
  getDiscountRate(): number {
    if (!this.discountPrice || this.discountPrice >= this.price) {
      return 0;
    }
    
    const discount = this.price - this.discountPrice;
    return Math.round((discount / this.price) * 100);
  }

  /**
   * 실제 판매 가격을 반환하는 유틸리티 메서드입니다.
   * 
   * 할인가가 있으면 할인가를, 없으면 정가를 반환합니다.
   * 프론트엔드에서 가격 표시할 때 유용합니다.
   * 
   * @returns 실제 판매 가격
   */
  getSellingPrice(): number {
    return this.discountPrice && this.discountPrice < this.price 
      ? this.discountPrice 
      : this.price;
  }

  /**
   * 상품이 구매 가능한 상태인지 확인하는 메서드입니다.
   * 
   * 상태가 ACTIVE이고 재고가 있는 경우에만 구매 가능합니다.
   * 장바구니나 주문 프로세스에서 사용할 수 있습니다.
   * 
   * @returns 구매 가능 여부
   */
  isAvailableForPurchase(): boolean {
    return this.status === ProductStatus.ACTIVE && this.stock > 0;
  }

  /**
   * 상품의 대표 이미지 URL을 반환합니다.
   * 
   * 이미지 배열에서 첫 번째 이미지를 대표 이미지로 사용합니다.
   * 이미지가 없는 경우 기본 이미지 URL을 반환할 수도 있습니다.
   * 
   * @returns 대표 이미지 URL 또는 null
   */
  getMainImageUrl(): string | null {
    return this.imageUrls && this.imageUrls.length > 0 
      ? this.imageUrls[0] 
      : null;
  }
}
