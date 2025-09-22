import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';

/**
 * 사용자 관리 모듈입니다.
 * 
 * 이 모듈은 마치 회사의 인사부서와 같은 역할을 합니다.
 * 직원(사용자) 관리에 필요한 모든 기능을 하나로 묶어서 제공하며,
 * 다른 부서(모듈)에서 필요할 때 인사 정보를 조회할 수 있도록
 * 필요한 서비스를 외부로 공개합니다.
 * 
 * 사용자 관리의 핵심 기능들:
 * - 사용자 생성, 조회, 수정, 삭제 (CRUD)
 * - 사용자 목록 조회 및 검색
 * - 비밀번호 변경
 * - 사용자 통계 정보 제공
 * - Redis를 활용한 캐싱 시스템
 */
@Module({
  imports: [
    /**
     * TypeOrmModule.forFeature()를 통해 이 모듈에서 사용할 엔티티를 등록합니다.
     * 
     * 이는 마치 특정 부서에 필요한 서류 캐비넷을 배정하는 것과 같습니다.
     * UsersModule에서는 User 엔티티만 사용하므로 User만 등록합니다.
     * 
     * 이렇게 등록하면 UsersService에서 @InjectRepository(User)를 통해
     * User 리포지토리를 주입받아 데이터베이스 작업을 수행할 수 있습니다.
     */
    TypeOrmModule.forFeature([User]),
  ],

  /**
   * 이 모듈에서 HTTP 요청을 처리할 컨트롤러들을 등록합니다.
   * 
   * UsersController는 /users/* 경로의 모든 요청을 처리합니다.
   * 예시 엔드포인트들:
   * - GET /users - 사용자 목록 조회
   * - GET /users/:id - 특정 사용자 조회
   * - POST /users - 새 사용자 생성 (관리자 전용)
   * - PUT /users/:id - 사용자 정보 수정
   * - PUT /users/:id/password - 비밀번호 변경
   * - DELETE /users/:id - 사용자 삭제 (관리자 전용)
   * - GET /users/admin/stats - 사용자 통계 (관리자 전용)
   */
  controllers: [UsersController],

  /**
   * 이 모듈에서 제공하는 서비스들을 등록합니다.
   * 
   * 여기에 등록된 서비스들은 NestJS의 의존성 주입 컨테이너에 의해 관리되며,
   * 컨트롤러나 다른 서비스에서 생성자 주입을 통해 사용할 수 있습니다.
   * 
   * UsersService는 사용자 관리의 핵심 비즈니스 로직을 담당합니다:
   * - 데이터베이스 CRUD 작업
   * - Redis 캐싱 관리
   * - 비즈니스 규칙 적용 (권한 검사, 데이터 검증 등)
   * - 에러 처리 및 로깅
   */
  providers: [
    UsersService,
    
    // 향후 추가될 수 있는 다른 프로바이더들:
    // UserProfileService, // 사용자 프로필 세부 관리
    // UserPreferencesService, // 사용자 설정 관리
    // UserActivityService, // 사용자 활동 로그 관리
    // UserNotificationService, // 사용자 알림 관리
  ],

  /**
   * 다른 모듈에서 사용할 수 있도록 내보낼 서비스들을 지정합니다.
   * 
   * 이는 마치 회사에서 다른 부서가 인사정보를 조회할 수 있도록
   * 필요한 인터페이스를 제공하는 것과 같습니다.
   * 
   * UsersService를 export함으로써 다른 모듈에서 다음과 같은 작업이 가능합니다:
   * - AuthModule: 로그인 시 사용자 정보 조회 및 검증
   * - OrderModule: 주문 시 고객 정보 확인
   * - NotificationModule: 알림 발송을 위한 사용자 정보 조회
   * - ReportModule: 리포트 생성을 위한 사용자 통계 활용
   * 
   * 하지만 모든 메서드가 공개되는 것은 아니며, 각 모듈은
   * 자신에게 필요한 기능만 사용해야 합니다.
   */
  exports: [
    UsersService,
    
    // TypeOrmModule도 export할 수 있지만, 일반적으로 권장되지 않습니다.
    // 다른 모듈에서 직접 리포지토리에 접근하는 것보다는
    // 서비스 레이어를 통해 접근하는 것이 좋은 아키텍처입니다.
    // TypeOrmModule,
  ],
})
export class UsersModule {
  /**
   * 모듈이 초기화될 때 실행되는 생성자입니다.
   * 
   * 개발 중에는 모듈 로딩 상태를 확인하기 위한 로그를 출력할 수 있습니다.
   * 프로덕션 환경에서는 이런 로그를 제거하거나 레벨을 조정하는 것이 좋습니다.
   */
  constructor() {
    console.log('👥 UsersModule이 초기화되었습니다');
  }
}
