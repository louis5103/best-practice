import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * 헬스체크 기능을 담당하는 모듈입니다.
 * 
 * 이 모듈은 시스템의 건강 상태를 확인하는 모든 기능들을 관리합니다.
 * 마치 병원의 검진 센터와 같은 역할로, 다양한 검사 장비(서비스)와
 * 접수창구(컨트롤러)를 하나로 묶어서 제공합니다.
 * 
 * 헬스체크 모듈의 특징:
 * 
 * 1. **독립성**: 다른 비즈니스 모듈과 분리되어 있어 영향을 받지 않음
 * 2. **경량성**: 시스템에 부담을 주지 않는 최소한의 리소스만 사용
 * 3. **확장성**: 새로운 헬스체크 기능을 쉽게 추가할 수 있는 구조
 * 4. **표준화**: 업계 표준 헬스체크 패턴을 따름
 * 5. **모니터링 친화적**: 외부 모니터링 도구들과 쉽게 연동 가능
 * 
 * 실무에서 헬스체크 모듈은 다음과 같은 상황에서 중요합니다:
 * - 마이크로서비스 환경에서 각 서비스의 상태 확인
 * - 쿠버네티스 클러스터의 파드 상태 관리
 * - 로드 밸런서의 트래픽 라우팅 결정
 * - 자동 스케일링 시스템의 판단 기준
 * - 장애 발생 시 빠른 원인 파악
 * 
 * 이 모듈을 통해 제공되는 엔드포인트들:
 * - GET /health          → 종합적인 시스템 상태 확인
 * - GET /health/ping     → 간단한 생존 신호 확인
 * - GET /health/detailed → 상세한 시스템 정보 제공
 */
@Module({
  /**
   * 이 모듈에서 제공하는 컨트롤러들입니다.
   * 
   * HealthController는 HTTP 요청을 받아서 적절한 응답을 반환하는
   * 인터페이스 역할을 담당합니다. 실제 비즈니스 로직은 서비스에서 처리합니다.
   */
  controllers: [HealthController],

  /**
   * 이 모듈에서 제공하는 서비스들입니다.
   * 
   * HealthService는 실제 헬스체크 로직을 담당합니다.
   * 데이터베이스 연결 확인, 메모리 사용량 체크, 디스크 공간 확인 등
   * 모든 실제 검사 작업을 수행합니다.
   * 
   * 서비스는 providers 배열에 등록되어 NestJS의 의존성 주입 시스템에 의해
   * 자동으로 인스턴스가 생성되고 컨트롤러에 주입됩니다.
   */
  providers: [HealthService],

  /**
   * 다른 모듈에서 사용할 수 있도록 내보내는 요소들입니다.
   * 
   * 현재는 HealthService만 내보내고 있는데, 이는 다른 모듈에서도
   * 헬스체크 기능을 활용할 수 있게 하기 위함입니다.
   * 
   * 예를 들어, 관리자 모듈에서 시스템 상태를 대시보드로 보여주거나,
   * 알림 모듈에서 시스템 문제 발생 시 알림을 보내는 등의 용도로
   * HealthService를 재사용할 수 있습니다.
   * 
   * 컨트롤러는 일반적으로 내보내지 않습니다. 왜냐하면 컨트롤러는
   * HTTP 엔드포인트를 정의하는 역할이므로 다른 모듈에서 직접 사용하지 않기 때문입니다.
   */
  exports: [HealthService],
})
export class HealthModule {
  /**
   * 모듈이 초기화될 때 실행되는 생성자입니다.
   * 
   * 헬스체크 모듈은 특별한 초기화 로직이 필요하지 않으므로
   * 현재는 비어있지만, 향후 필요한 경우 여기에 초기화 코드를 추가할 수 있습니다.
   * 
   * 예를 들어:
   * - 외부 모니터링 시스템과의 연결 설정
   * - 헬스체크 스케줄러 초기화
   * - 커스텀 메트릭 수집기 설정
   * - 알림 시스템 연동 등
   */
  constructor() {
    // 향후 초기화 로직이 필요한 경우 여기에 추가
  }
}

/**
 * HealthModule 사용법:
 * 
 * 1. AppModule에 임포트:
 * ```typescript
 * @Module({
 *   imports: [HealthModule],
 *   // ...
 * })
 * export class AppModule {}
 * ```
 * 
 * 2. 다른 모듈에서 HealthService 사용:
 * ```typescript
 * @Module({
 *   imports: [HealthModule],
 *   // ...
 * })
 * export class AdminModule {
 *   constructor(private healthService: HealthService) {
 *     // 관리자 대시보드에서 시스템 상태 표시
 *   }
 * }
 * ```
 * 
 * 3. 커스텀 헬스체크 추가:
 * ```typescript
 * // health.service.ts에 새로운 체크 메서드 추가
 * private async checkCustomService() {
 *   // 커스텀 서비스 상태 확인 로직
 * }
 * ```
 * 
 * 이런 모듈화된 접근 방식을 통해 헬스체크 기능을
 * 체계적이고 확장 가능한 형태로 관리할 수 있습니다.
 */
