import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

/**
 * Product 엔티티 - 상품 정보를 저장하는 데이터베이스 테이블의 구조를 정의합니다.
 * 
 * 이 엔티티는 쇼핑몰의 상품 카탈로그와 같은 역할을 합니다.
 * 각 상품의 기본 정보, 가격, 재고 등을 체계적으로 관리할 수 있습니다.
 */
@Entity('products')
@Index(['category']) // 카테고리별 검색 성능 향상
@Index(['isActive']) // 활성 상품 조회 성능 향상
export class Product {
  /**
   * 상품 고유 식별자입니다.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 상품명입니다.
   */
  @Column({ 
    length: 200,
    comment: '상품명'
  })
  name: string;

  /**
   * 상품 상세 설명입니다.
   */
  @Column({ 
    type: 'text',
    nullable: true,
    comment: '상품 상세 설명'
  })
  description?: string;

  /**
   * 상품 가격입니다.
   */
  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '상품 가격'
  })
  price: number;

  /**
   * 상품 카테고리입니다.
   */
  @Column({ 
    length: 100,
    comment: '상품 카테고리'
  })
  category: string;

  /**
   * 재고 수량입니다.
   */
  @Column({ 
    default: 0,
    comment: '재고 수량'
  })
  stock: number;

  /**
   * 상품 활성화 상태입니다.
   */
  @Column({ 
    default: true,
    comment: '상품 활성화 여부'
  })
  isActive: boolean;

  /**
   * 상품 이미지 URL입니다.
   */
  @Column({ 
    nullable: true,
    length: 500,
    comment: '상품 이미지 URL'
  })
  imageUrl?: string;

  /**
   * 상품 등록 시간입니다.
   */
  @CreateDateColumn({ 
    name: 'created_at',
    comment: '상품 등록 시간'
  })
  createdAt: Date;

  /**
   * 상품 정보 수정 시간입니다.
   */
  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: '상품 정보 수정 시간'
  })
  updatedAt: Date;
}
