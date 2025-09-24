import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../database/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * 인증 모듈입니다.
 * 
 * 이 모듈은 두 가지 인증 방식을 보여줍니다:
 * 1. 커스텀 JWT Guard (보존용, src/common/guards/custom-implementations/)
 * 2. Passport 기반 인증 (현재 활성화)
 * 
 * 🎓 교육적 가치:
 * 두 방식을 모두 경험해봄으로써 다음을 학습할 수 있습니다:
 * - 직접 구현의 장단점
 * - 표준 라이브러리 사용의 이점
 * - 언제 어떤 방식을 선택해야 하는지
 * 
 * 🏗️ Passport 통합 아키텍처:
 * 
 * AuthModule ──┐
 *             ├── JwtStrategy (토큰 검증 + 사용자 조회)
 *             ├── AuthService (비즈니스 로직)
 *             └── AuthController (HTTP 요청 처리)
 *                      │
 *                      ▼
 *             JwtAuthGuard (Public 체크 + Passport 위임)
 *                      │
 *                      ▼
 *             Passport Framework (토큰 추출, 검증, Strategy 실행)
 */
@Module({
  imports: [
    /**
     * TypeORM 모듈 설정
     * 
     * User 엔티티를 이 모듈에서 사용할 수 있도록 등록합니다.
     * JwtStrategy에서 사용자 정보를 조회할 때 필요합니다.
     */
    TypeOrmModule.forFeature([User]),
    
    /**
     * PassportModule 등록
     * 
     * 🔍 왜 PassportModule을 등록해야 할까요?
     * 
     * PassportModule은 NestJS와 Passport 라이브러리 사이의 다리 역할을 합니다.
     * 마치 번역기와 같아서, NestJS의 방식과 Passport의 방식을 서로 연결해줍니다.
     * 
     * defaultStrategy를 'jwt'로 설정하면:
     * - @UseGuards(AuthGuard()) 처럼 strategy 이름을 생략할 수 있습니다
     * - 여러 strategy가 있을 때 기본값으로 JWT를 사용합니다
     * 
     * 하지만 명확성을 위해 @UseGuards(AuthGuard('jwt'))처럼 
     * 명시적으로 작성하는 것을 권장합니다.
     */
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      /**
       * session: false 설정
       * 
       * JWT는 stateless 인증 방식이므로 세션을 사용하지 않습니다.
       * 이는 서버가 사용자 상태를 기억하지 않는다는 의미입니다.
       * 
       * 마치 영화관에서 매번 티켓을 확인하는 것과 같습니다.
       * 출입할 때마다 티켓(JWT)을 보여주면 되고, 
       * 영화관(서버)은 이전에 누가 들어왔는지 기억할 필요가 없습니다.
       */
      session: false 
    }),
  ],

  /**
   * 컨트롤러 등록
   * 
   * AuthController는 /auth/* 경로의 모든 요청을 처리합니다.
   */
  controllers: [AuthController],

  /**
   * 프로바이더 등록
   * 
   * 여기가 핵심입니다! 🎯
   * 
   * providers 배열에 JwtStrategy를 추가함으로써:
   * 1. NestJS가 JwtStrategy를 인스턴스화합니다
   * 2. PassportModule이 이 Strategy를 'jwt'라는 이름으로 등록합니다
   * 3. AuthGuard('jwt')가 호출될 때 이 Strategy가 실행됩니다
   * 
   * 🔄 등록 과정의 마법:
   * 
   * JwtStrategy extends PassportStrategy(Strategy)
   *           ▼
   * PassportModule이 자동으로 감지
   *           ▼  
   * 'jwt'라는 이름으로 Passport에 등록
   *           ▼
   * AuthGuard('jwt')에서 사용 가능
   */
  providers: [
    AuthService,
    JwtStrategy,  // 🌟 새로 추가된 Passport Strategy
    
    /**
     * 향후 추가할 수 있는 다른 Strategy들:
     * 
     * GoogleStrategy,    // 구글 OAuth 로그인
     * FacebookStrategy,  // 페이스북 로그인  
     * LocalStrategy,     // 이메일/비밀번호 로그인
     * LdapStrategy,      // 기업용 LDAP 인증
     * 
     * Passport의 장점은 이런 다양한 인증 방식을 
     * 동일한 패턴으로 추가할 수 있다는 것입니다.
     */
  ],

  /**
   * 외부 모듈에서 사용할 수 있도록 내보냅니다.
   * 
   * 🤔 왜 JwtStrategy도 export해야 할까요?
   * 
   * 일반적으로는 AuthService만 export하면 되지만,
   * 다음과 같은 경우에 JwtStrategy도 필요할 수 있습니다:
   * 
   * 1. 다른 모듈에서 같은 Strategy를 재사용하고 싶을 때
   * 2. 테스트에서 Strategy를 직접 테스트하고 싶을 때
   * 3. 다른 모듈에서 사용자 인증 상태를 확인하고 싶을 때
   * 
   * PassportModule도 export하는 이유:
   * 다른 모듈에서 AuthGuard를 사용하려면 PassportModule이 필요합니다.
   */
  exports: [
    AuthService,
    JwtStrategy,      // Strategy 외부 사용 가능
    PassportModule,   // Guard 사용을 위해 필요
  ],
})
export class AuthModule {
  /**
   * 모듈 초기화 시 로깅
   * 
   * 개발 중에는 어떤 모듈이 로드되는지 확인하는 것이 도움이 됩니다.
   * 특히 Strategy가 제대로 등록되었는지 확인할 때 유용합니다.
   */
  constructor() {
    console.log('🔐 AuthModule이 초기화되었습니다 (Passport 통합)');
  }
}
