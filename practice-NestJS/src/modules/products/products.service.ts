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
 * 🏪 비즈니스 컨텍스트로 이해하기:
 * 이 서비스는 마치 백화점의 상품 관리 부서와 같습니다. 
 * 새로운 상품이 입고되면 검수하고, 진열하고, 재고를 관리하며, 
 * 판매가 종료되면 적절히 처리하는 모든 업무를 담당합니다.
 * 
 * 🎯 핵심 설계 원칙:
 * 1. **비즈니스 무결성 우선**: 할인가 > 정가 같은 논리적 오류는 절대 허용하지 않음
 * 2. **상태 관리의 정확성**: 재고와 상품 상태를 항상 동기화
 * 3. **감사 추적 가능**: 모든 중요한 변경사항을 로깅
 * 4. **성능과 단순성의 균형**: 복잡한 최적화보다는 이해하기 쉬운 코드 우선
 * 
 * ✨ 왜 Repository 패턴을 사용하는가?
 * 데이터베이스 접근을 추상화하여 비즈니스 로직에서 분리합니다.
 * 이렇게 하면 나중에 MongoDB나 다른 데이터베이스로 변경할 때 
 * 서비스 로직은 전혀 수정하지 않아도 됩니다.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  /**
   * 의존성 주입을 통한 Repository 획득
   * 
   * 🤔 왜 생성자에서 주입받는가?
   * NestJS의 IoC(Inversion of Control) 컨테이너가 자동으로 Repository 인스턴스를 
   * 생성하고 주입해줍니다. 이는 테스트할 때 Mock Repository를 쉽게 주입할 수 있게 하고,
   * 코드의 결합도를 낮춰주는 중요한 역할을 합니다.
   */
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  /**
   * 새로운 상품을 생성합니다.
   * 
   * 🏪 실제 상황으로 이해하기:
   * 새로운 상품이 매장에 입고될 때의 과정을 생각해보세요.
   * 1. 먼저 상품 정보를 꼼꼼히 확인합니다 (데이터 검증)
   * 2. 가격 체계가 올바른지 확인합니다 (비즈니스 규칙 검증)
   * 3. 상품을 시스템에 등록합니다 (데이터베이스 저장)
   * 4. 등록 완료를 관련 부서에 알립니다 (로깅)
   * 
   * @param createProductDto 생성할 상품의 정보
   * @returns 생성된 상품의 안전한 정보 (ProductResponseDto)
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      // ============================================================
      // 📋 1단계: 비즈니스 규칙 검증 (Business Logic Validation)
      // ============================================================
      
      /**
       * 💰 가격 정합성 검사
       * 
       * 왜 이 검사가 중요한가?
       * 할인가가 정가보다 높다면 고객에게 손해를 끼치는 것은 물론,
       * 회계 시스템과 마케팅 데이터에도 심각한 오류를 야기합니다.
       * 
       * 🎯 실무에서의 중요성:
       * 실제 쇼핑몰에서 이런 오류가 발생하면 고객 신뢰 손실은 물론,
       * 법적 문제까지 발생할 수 있습니다. (표시광고법 위반 등)
       */
      if (createProductDto.discountPrice && createProductDto.discountPrice >= createProductDto.price) {
        // 📊 에러 상황 로깅 (감사 추적을 위해)
        this.logger.warn(
          `가격 정합성 위반 감지: 상품 "${createProductDto.name}" - ` +
          `정가: ${createProductDto.price}, 할인가: ${createProductDto.discountPrice}`
        );
        
        throw new BadRequestException('할인 가격은 정가보다 낮아야 합니다.');
      }

      // ============================================================
      // 🏗️ 2단계: 엔티티 생성 (Entity Creation)  
      // ============================================================
      
      /**
       * TypeORM의 create() vs save()의 차이점 이해하기
       * 
       * 🤔 왜 create()를 먼저 호출하는가?
       * - create(): 메모리상에서 엔티티 인스턴스만 생성 (DB 접근 X)
       * - save(): 실제로 데이터베이스에 저장 (DB 접근 O)
       * 
       * 이렇게 두 단계로 나누는 이유:
       * 1. 엔티티의 생명주기 훅 (@BeforeInsert 등)을 올바르게 실행
       * 2. 데이터 검증을 두 번 수행 (DTO 레벨 + 엔티티 레벨)
       * 3. 트랜잭션 내에서 여러 엔티티를 조작할 때 성능상 유리
       */
      const newProduct = this.productRepository.create(createProductDto);

      // ============================================================
      // 💾 3단계: 데이터베이스 저장 (Database Persistence)
      // ============================================================
      
      /**
       * save() 메서드의 내부 동작 이해하기
       * 
       * TypeORM의 save()는 매우 똑똑합니다:
       * 1. ID가 없으면 INSERT 쿼리 실행
       * 2. ID가 있으면 해당 레코드가 존재하는지 확인 후 INSERT 또는 UPDATE 결정
       * 3. 트랜잭션 내에서 안전하게 실행
       * 4. 저장 후 완전한 엔티티 객체 반환 (ID, 타임스탬프 포함)
       * 
       * 🚀 성능 고려사항:
       * save()는 편리하지만 대량 데이터 처리시에는 insert()나 upsert()가 더 효율적입니다.
       */
      const savedProduct = await this.productRepository.save(newProduct);

      // ============================================================
      // 📝 4단계: 감사 로깅 (Audit Logging)
      // ============================================================
      
      /**
       * 🔍 왜 상세한 로깅이 필요한가?
       * 
       * 운영 관점에서 생각해보면:
       * - 어떤 상품이 언제 등록되었는지 추적 가능
       * - 문제 발생 시 신속한 원인 파악
       * - 비즈니스 인사이트 도출 (어떤 종류의 상품이 많이 등록되는가?)
       * - 컴플라이언스 요구사항 충족 (감사 추적)
       */
      this.logger.log(
        `✅ 상품 생성 성공: "${savedProduct.name}" (ID: ${savedProduct.id}) ` +
        `카테고리: ${savedProduct.category}, 가격: ${savedProduct.price}원`
      );

      // ============================================================
      // 🔄 5단계: 응답 데이터 변환 (Response Transformation)
      // ============================================================
      
      /**
       * 왜 엔티티를 직접 반환하지 않고 DTO로 변환하는가?
       * 
       * 보안과 성능의 이중 효과:
       * 1. **보안**: 민감한 내부 정보 노출 방지
       * 2. **성능**: 불필요한 연관 관계 데이터 제외
       * 3. **유연성**: API 버전별로 다른 응답 형태 가능
       * 4. **명확성**: 클라이언트가 받을 데이터 구조를 명확히 정의
       */
      return ProductResponseDto.fromEntity(savedProduct);

    } catch (error: unknown) {
      // ============================================================
      // 🚨 예외 처리 (Exception Handling)
      // ============================================================
      
      /**
       * 계층적 에러 처리 전략
       * 
       * 1️⃣ 예상 가능한 비즈니스 에러는 그대로 전파 (BadRequestException)
       * 2️⃣ 예상치 못한 시스템 에러는 로깅 후 일반화된 에러로 변환
       * 3️⃣ 민감한 시스템 정보는 로그에만 기록하고 사용자에게는 숨김
       * 
       * 🛡️ 보안 고려사항:
       * 데이터베이스 연결 문제나 제약 조건 위반 같은 시스템 에러를 
       * 그대로 클라이언트에 노출하면 공격자에게 시스템 구조 정보를 제공할 수 있습니다.
       */
      if (error instanceof BadRequestException) {
        // 비즈니스 로직 에러는 그대로 전파
        throw error;
      }

      // 시스템 에러 상세 로깅
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `❌ 상품 생성 실패: "${createProductDto.name}" - ${errorMessage}`,
        errorStack
      );
      
      // 사용자에게는 일반화된 에러 메시지만 제공
      throw new BadRequestException('상품 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품 목록을 조회합니다.
   * 
   * 📊 페이지네이션과 필터링의 실무적 고려사항:
   * 
   * 왜 모든 상품을 한 번에 반환하지 않는가?
   * 1. **성능**: 수십만 개의 상품을 한 번에 로딩하면 서버와 클라이언트 모두 멈춤
   * 2. **사용자 경험**: 사용자는 보통 첫 페이지만 보고 검색으로 좁혀나감
   * 3. **네트워크 비용**: 모바일 사용자를 위한 데이터 절약
   * 4. **메모리 효율성**: 서버 메모리 사용량 제어
   * 
   * @param page 페이지 번호 (1부터 시작)
   * @param limit 페이지당 항목 수
   * @param category 카테고리 필터 (선택사항)
   * @returns 페이지네이션된 상품 목록
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string
  ): Promise<PaginatedProductResponseDto> {
    try {
      // ============================================================
      // 🔍 동적 쿼리 구성 (Dynamic Query Building)
      // ============================================================
      
      /**
       * QueryBuilder vs Repository methods 선택 기준
       * 
       * 🤔 언제 QueryBuilder를 사용해야 하는가?
       * - 복잡한 조건문이 필요한 경우 (이 경우: 선택적 카테고리 필터)
       * - JOIN이 필요한 경우
       * - 성능 최적화를 위한 특정 컬럼만 SELECT하는 경우
       * - 동적으로 쿼리 조건을 구성해야 하는 경우
       * 
       * Repository의 find() 메서드는 간단한 조건에만 적합합니다.
       */
      let queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where('product.status = :status', { status: ProductStatus.ACTIVE });

      // 선택적 카테고리 필터링
      if (category) {
        /**
         * 💡 SQL Injection 방지
         * 
         * 절대 하면 안 되는 방식:
         * .where(`product.category = '${category}'`) ❌
         * 
         * 올바른 방식:
         * .andWhere('product.category = :category', { category }) ✅
         * 
         * TypeORM의 매개변수 바인딩을 사용하면 자동으로 SQL Injection을 방지합니다.
         */
        queryBuilder = queryBuilder.andWhere('product.category = :category', { category });
      }

      // ============================================================
      // 📄 페이지네이션 적용 (Pagination Implementation)
      // ============================================================
      
      /**
       * OFFSET vs Cursor 기반 페이지네이션
       * 
       * 현재 사용: OFFSET 기반 (skip/take)
       * 장점: 구현 간단, 임의 페이지 이동 가능
       * 단점: 대용량 데이터에서 성능 저하
       * 
       * 대안: Cursor 기반 (lastId 기준)
       * 장점: 대용량 데이터에서도 일정한 성능
       * 단점: 임의 페이지 이동 불가, 구현 복잡
       */
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder
        .orderBy('product.createdAt', 'DESC')  // 최신 상품부터
        .skip(offset)
        .take(limit);

      // ============================================================
      // 🎯 효율적인 데이터 조회 (Efficient Data Fetching)
      // ============================================================
      
      /**
       * getManyAndCount()의 내부 동작 이해
       * 
       * 이 메서드는 실제로 두 개의 쿼리를 실행합니다:
       * 1. 실제 데이터를 가져오는 SELECT 쿼리
       * 2. 전체 개수를 세는 COUNT 쿼리
       * 
       * 🚀 성능 최적화 팁:
       * 만약 전체 개수가 필요없다면 getMany()만 사용하여 성능 향상 가능
       */
      const [products, total] = await queryBuilder.getManyAndCount();

      // ============================================================
      // 🔄 응답 데이터 변환 및 메타데이터 구성
      // ============================================================
      
      /**
       * 왜 메타데이터가 중요한가?
       * 
       * 프론트엔드 관점에서 생각해보면:
       * - "다음 페이지" 버튼 표시 여부 결정
       * - "전체 1,234개 상품 중 1-10개 표시" 같은 정보 표시
       * - 무한 스크롤 구현시 더 가져올 데이터가 있는지 판단
       */
      const productDtos = ProductResponseDto.fromEntities(products);
      const result = PaginatedProductResponseDto.create(productDtos, total, page, limit);

      // 성능 모니터링을 위한 로깅
      this.logger.debug(
        `📊 상품 목록 조회: ${products.length}개 반환 (총 ${total}개) ` +
        `페이지: ${page}/${Math.ceil(total / limit)}` +
        `${category ? ` 카테고리: ${category}` : ''}`
      );

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `❌ 상품 목록 조회 실패: 페이지 ${page}, 한계 ${limit}` +
        `${category ? `, 카테고리: ${category}` : ''} - ${errorMessage}`,
        errorStack
      );
      
      throw new BadRequestException('상품 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 상품을 조회합니다.
   * 
   * 🎯 단일 리소스 조회 패턴의 핵심:
   * 이 메서드는 간단해 보이지만, 실제로는 여러 중요한 원칙들이 적용되어 있습니다.
   * 
   * @param id 조회할 상품의 고유 ID
   * @returns 상품 상세 정보 또는 404 에러
   */
  async findOne(id: number): Promise<ProductResponseDto> {
    try {
      /**
       * 🔍 기본키 기반 조회의 성능적 우수성
       * 
       * 왜 ID로 조회하는 것이 가장 빠른가?
       * 1. Primary Key는 자동으로 클러스터드 인덱스 생성
       * 2. B-Tree 인덱스로 O(log n) 시간 복잡도
       * 3. 데이터베이스 옵티마이저가 가장 효율적인 실행 계획 선택
       * 
       * 💡 실무 팁:
       * 단순한 ID 조회는 Redis 같은 캐시보다 PostgreSQL 직접 조회가 더 빠를 수 있습니다.
       * 네트워크 홉이나 직렬화 오버헤드를 고려하면 말이죠.
       */
      const product = await this.productRepository.findOne({ where: { id } });

      /**
       * 🚫 리소스 부재 처리의 HTTP 표준 준수
       * 
       * 왜 404 Not Found를 사용하는가?
       * - 리소스가 존재하지 않음을 명확히 표현
       * - 클라이언트가 예측 가능한 에러 처리 가능
       * - REST API 표준 준수
       * 
       * 🔄 대안적 접근법들:
       * - null 반환: 클라이언트에서 추가 처리 필요
       * - 빈 배열 반환: 의미적으로 부정확
       * - 200 + empty response: HTTP 의미론 위반
       */
      if (!product) {
        this.logger.warn(`🔍 존재하지 않는 상품 조회 시도: ID ${id}`);
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // 성공적인 조회 로깅 (성능 모니터링용)
      this.logger.debug(`✅ 상품 조회 성공: "${product.name}" (ID: ${id})`);

      return ProductResponseDto.fromEntity(product);

    } catch (error: unknown) {
      // NotFoundException은 의도된 비즈니스 로직이므로 그대로 전파
      if (error instanceof NotFoundException) {
        throw error;
      }

      // 예상치 못한 시스템 에러 처리
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`❌ 상품 조회 중 시스템 오류: ID ${id} - ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품 정보를 수정합니다.
   * 
   * 🔄 업데이트 연산의 복잡성과 주의사항:
   * 단순해 보이는 업데이트 작업이지만, 실제로는 많은 고려사항이 있습니다.
   * 
   * @param id 수정할 상품 ID
   * @param updateProductDto 수정할 데이터
   * @returns 수정된 상품 정보
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      // ============================================================
      // 🔍 1단계: 리소스 존재 확인 (Resource Existence Check)
      // ============================================================
      
      /**
       * 왜 업데이트 전에 먼저 조회하는가?
       * 
       * 1. **정확한 에러 메시지**: 존재하지 않는 리소스에 대한 명확한 피드백
       * 2. **비즈니스 검증**: 현재 상태를 기반으로 한 업데이트 가능 여부 판단
       * 3. **감사 로그**: 변경 전후 상태 비교를 위한 기준점
       * 4. **동시성 제어**: 낙관적 잠금 등의 동시성 제어 메커니즘 적용 가능
       */
      const existingProduct = await this.productRepository.findOne({ where: { id } });
      
      if (!existingProduct) {
        this.logger.warn(`🔍 존재하지 않는 상품 수정 시도: ID ${id}`);
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      // ============================================================
      // ⚖️ 2단계: 비즈니스 규칙 재검증 (Business Rule Re-validation)
      // ============================================================
      
      /**
       * 업데이트 시 비즈니스 규칙 검증의 특별한 고려사항
       * 
       * 기존 값과 새로운 값을 조합하여 최종 결과를 예측해야 합니다.
       * 예: 가격만 변경하고 할인가는 그대로 둘 때, 새로운 가격이 기존 할인가보다 낮아질 수 있음
       */
      const newPrice = updateProductDto.price ?? existingProduct.price;
      const newDiscountPrice = updateProductDto.discountPrice ?? existingProduct.discountPrice;
      
      if (newDiscountPrice && Number(newDiscountPrice) >= Number(newPrice)) {
        this.logger.warn(
          `💰 가격 정합성 위반: "${existingProduct.name}" (ID: ${id}) ` +
          `새 정가: ${newPrice}, 새 할인가: ${newDiscountPrice}`
        );
        throw new BadRequestException('할인 가격은 정가보다 낮아야 합니다.');
      }

      // ============================================================
      // 🔧 3단계: 타입 안전한 업데이트 데이터 구성
      // ============================================================
      
      /**
       * Partial Update의 타입 안전성 보장
       * 
       * updateProductDto는 모든 필드가 optional이므로, 
       * undefined 값들을 데이터베이스에 전달하지 않도록 주의해야 합니다.
       * 
       * 🎯 이 방식의 장점:
       * - 명시적으로 변경하려는 필드만 업데이트
       * - undefined와 null을 구분하여 처리 가능
       * - TypeScript 타입 체킹의 모든 이점 활용
       */
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

      // ============================================================
      // 💾 4단계: 원자적 업데이트 실행 (Atomic Update)
      // ============================================================
      
      /**
       * TypeORM의 update() vs save()의 차이점
       * 
       * update() 사용 이유:
       * - 변경된 필드만 UPDATE 쿼리에 포함
       * - 네트워크 트래픽 최소화
       * - 동시성 충돌 가능성 감소
       * - 성능상 우수함
       * 
       * save()의 경우:
       * - 전체 엔티티를 재저장
       * - 생명주기 훅 실행 (@BeforeUpdate 등)
       * - 관계 엔티티까지 함께 저장
       */
      await this.productRepository.update(id, updateData);

      // ============================================================
      // 🔄 5단계: 업데이트된 데이터 조회 (Fetch Updated Data)
      // ============================================================
      
      /**
       * 왜 업데이트 후 다시 조회하는가?
       * 
       * 1. **데이터베이스 트리거**: DB에서 자동 생성되는 값들 (수정 시각 등) 반영
       * 2. **계산 필드**: 업데이트로 인해 변경될 수 있는 계산된 값들
       * 3. **일관성**: 클라이언트가 받는 데이터가 실제 저장된 데이터와 일치 보장
       * 4. **감사**: 실제로 어떤 값이 저장되었는지 확인
       */
      const updatedProduct = await this.productRepository.findOne({ where: { id } });

      if (!updatedProduct) {
        // 이론적으로는 발생하지 않아야 하지만, 동시성 문제로 발생할 수 있음
        this.logger.error(`🚨 업데이트 후 상품 조회 실패: ID ${id}`);
        throw new NotFoundException('상품 업데이트 후 조회에 실패했습니다.');
      }

      // 성공 로깅 (변경사항 요약)
      const changedFields = Object.keys(updateData);
      this.logger.log(
        `✅ 상품 정보 수정 완료: "${updatedProduct.name}" (ID: ${id}) ` +
        `변경 필드: [${changedFields.join(', ')}]`
      );

      return ProductResponseDto.fromEntity(updatedProduct);

    } catch (error: unknown) {
      // 비즈니스 로직 에러는 그대로 전파
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // 시스템 에러 처리
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `❌ 상품 수정 실패: ID ${id} - ${errorMessage}`,
        errorStack
      );
      
      throw new BadRequestException('상품 수정 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상품을 삭제합니다 (소프트 삭제 방식).
   * 
   * 🗑️ 소프트 삭제 vs 하드 삭제의 전략적 선택:
   * 
   * 실제 비즈니스에서는 데이터를 완전히 삭제하는 것보다는 
   * '사용 불가' 상태로 만드는 것이 훨씬 더 안전하고 유용합니다.
   * 
   * @param id 삭제할 상품 ID
   */
  async remove(id: number): Promise<void> {
    try {
      /**
       * 🔍 삭제 전 존재 확인의 중요성
       * 
       * RESTful API에서 DELETE 요청에 대한 응답:
       * - 리소스가 존재했고 삭제됨: 200 OK 또는 204 No Content
       * - 리소스가 존재하지 않음: 404 Not Found
       * - 삭제 권한이 없음: 403 Forbidden
       * 
       * 클라이언트가 이 차이를 구분할 수 있어야 적절한 UX를 제공할 수 있습니다.
       */
      const product = await this.productRepository.findOne({ where: { id } });
      
      if (!product) {
        this.logger.warn(`🔍 존재하지 않는 상품 삭제 시도: ID ${id}`);
        throw new NotFoundException(`ID ${id}에 해당하는 상품을 찾을 수 없습니다.`);
      }

      /**
       * 🔄 소프트 삭제 구현
       * 
       * 왜 ProductStatus.DISCONTINUED를 사용하는가?
       * 
       * 1. **데이터 보존**: 고객 주문 이력, 매출 분석 등에 필요한 데이터 유지
       * 2. **복구 가능성**: 실수로 삭제된 상품을 쉽게 복구 가능
       * 3. **법적 요구사항**: 일부 국가에서는 거래 기록을 일정 기간 보존 의무
       * 4. **비즈니스 인사이트**: 어떤 상품이 왜 단종되었는지 분석 가능
       * 5. **참조 무결성**: 다른 테이블에서 이 상품을 참조하는 경우 외래키 오류 방지
       */
      await this.productRepository.update(id, { status: ProductStatus.DISCONTINUED });

      // 상세한 삭제 로그 (감사 추적)
      this.logger.log(
        `🗑️ 상품 삭제(단종 처리) 완료: "${product.name}" (ID: ${id}) ` +
        `카테고리: ${product.category}, 이전 상태: ${product.status}`
      );

    } catch (error: unknown) {
      // NotFoundException은 의도된 비즈니스 로직
      if (error instanceof NotFoundException) {
        throw error;
      }

      // 시스템 에러 처리
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`❌ 상품 삭제 실패: ID ${id} - ${errorMessage}`, errorStack);
      throw new BadRequestException('상품 삭제 중 오류가 발생했습니다.');
    }
  }
}
