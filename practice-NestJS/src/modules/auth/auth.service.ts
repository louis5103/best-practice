import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@liaoliaots/nestjs-redis';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';

/**
 * 인증 서비스입니다.
 * 
 * 이 서비스는 마치 은행의 계좌 담당자와 같은 역할을 합니다.
 * 고객(사용자)이 계좌 개설(회원가입), 신원 확인(로그인), 계좌 해지(로그아웃) 등의
 * 요청을 할 때 필요한 모든 업무를 처리하는 핵심 서비스입니다.
 * 
 * Spring Boot의 Service 클래스와 동일한 개념으로,
 * 컨트롤러에서 받은 요청을 실제 비즈니스 로직으로 처리하고,
 * 데이터베이스와 상호작용하며, 결과를 반환하는 역할을 담당합니다.
 * 
 * 이 서비스에서 처리하는 주요 기능들:
 * - 사용자 회원가입 (비밀번호 해시화, 중복 확인)
 * - 사용자 로그인 (비밀번호 검증, JWT 토큰 발급)
 * - 로그아웃 (토큰 블랙리스트 처리)
 * - 사용자 정보 조회 및 검증
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Redis 클라이언트를 미리 가져와서 성능을 향상시킵니다.
  // 매번 getOrThrow()를 호출하는 것보다 효율적입니다.
  private readonly redis = this.redisService.getOrThrow();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 새로운 사용자를 등록합니다.
   * 
   * 이 메서드는 마치 은행에서 새 계좌를 개설하는 과정과 같습니다.
   * 고객의 신원을 확인하고, 중복된 계좌가 없는지 체크하며,
   * 모든 절차가 완료되면 계좌(사용자 계정)을 생성합니다.
   */
  async register(registerDto: any) {
    const { email, password, name, role = 'user' } = registerDto;

    try {
      // 1단계: 이메일 중복 확인
      // 이미 사용 중인 이메일인지 확인합니다.
      // 이는 은행에서 동일한 주민등록번호로 여러 계좌를 만들 수 없는 것과 같습니다.
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`회원가입 실패 - 중복된 이메일: ${email}`);
        throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
      }

      // 2단계: 비밀번호 해시화
      // 비밀번호를 평문으로 저장하는 것은 매우 위험하므로,
      // bcrypt를 사용해서 안전하게 해시화합니다.
      // 해시화 라운드 수는 보안과 성능의 균형을 고려해서 설정합니다.
      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 3단계: 새 사용자 생성
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true,
        isEmailVerified: false, // 이메일 인증은 별도 과정에서 처리
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4단계: 데이터베이스에 저장
      const savedUser = await this.userRepository.save(newUser);

      // 5단계: JWT 토큰 생성
      // 회원가입과 동시에 로그인 처리를 위해 토큰을 발급합니다.
      const token = await this.generateJwtToken(savedUser);

      this.logger.log(`새 사용자 등록 완료: ${email} (ID: ${savedUser.id})`);

      // 비밀번호는 절대 응답에 포함하지 않습니다.
      const { password: _, ...userWithoutPassword } = savedUser;

      return {
        message: '회원가입이 완료되었습니다.',
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`회원가입 중 오류 발생: ${error.message}`, error.stack);
      throw new BadRequestException('회원가입 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 로그인을 처리합니다.
   * 
   * 이 메서드는 마치 은행에서 본인 확인을 하는 과정과 같습니다.
   * 신분증(이메일)과 서명(비밀번호)을 확인해서
   * 본인이 맞으면 거래(서비스 이용) 권한을 부여합니다.
   */
  async login(loginDto: any) {
    const { email, password } = loginDto;

    try {
      // 1단계: 사용자 조회
      // 입력된 이메일로 사용자를 찾습니다.
      // 이때 비밀번호도 함께 조회해야 비교할 수 있습니다.
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password', 'name', 'role', 'isActive', 'isEmailVerified'],
      });

      // 2단계: 사용자 존재 확인
      if (!user) {
        this.logger.warn(`로그인 실패 - 존재하지 않는 이메일: ${email}`);
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 3단계: 계정 상태 확인
      if (!user.isActive) {
        this.logger.warn(`로그인 실패 - 비활성화된 계정: ${email}`);
        throw new UnauthorizedException('비활성화된 계정입니다.');
      }

      // 4단계: 비밀번호 검증
      // bcrypt.compare를 사용해서 평문 비밀번호와 해시된 비밀번호를 비교합니다.
      // 이 함수는 내부적으로 동일한 salt를 사용해서 해시를 만들어 비교합니다.
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`로그인 실패 - 잘못된 비밀번호: ${email}`);
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 5단계: 마지막 로그인 시간 업데이트
      // 사용자의 활동을 추적하고 보안 모니터링에 도움이 됩니다.
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // 6단계: JWT 토큰 생성
      const token = await this.generateJwtToken(user);

      this.logger.log(`로그인 성공: ${email} (ID: ${user.id})`);

      // 비밀번호는 절대 응답에 포함하지 않습니다.
      const { password: _, ...userWithoutPassword } = user;

      return {
        message: '로그인이 완료되었습니다.',
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`로그인 중 오류 발생: ${error.message}`, error.stack);
      throw new BadRequestException('로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 로그아웃을 처리합니다.
   * 
   * JWT는 기본적으로 stateless하므로 서버에서 토큰을 무효화할 방법이 없습니다.
   * 하지만 보안상 로그아웃 시 토큰을 즉시 무효화해야 하는 경우가 있으므로,
   * Redis를 활용한 토큰 블랙리스트 방식을 사용합니다.
   */
  async logout(token: string) {
    try {
      // JWT 토큰을 디코드해서 만료 시간을 확인합니다.
      const decoded = this.jwtService.decode(token) as any;
      
      if (decoded && decoded.exp) {
        // 토큰의 남은 수명만큼 Redis에 저장합니다.
        // 토큰이 만료되면 자동으로 Redis에서도 삭제됩니다.
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (ttl > 0) {
          await this.redis.setex(`blacklist:${token}`, ttl, '1');
          this.logger.log('토큰이 블랙리스트에 추가되었습니다.');
        }
      }

      return {
        message: '로그아웃이 완료되었습니다.',
      };
    } catch (error) {
      this.logger.error(`로그아웃 중 오류 발생: ${error.message}`, error.stack);
      throw new BadRequestException('로그아웃 중 오류가 발생했습니다.');
    }
  }

  /**
   * JWT 토큰을 생성합니다.
   * 
   * 이 메서드는 사용자의 신원을 디지털 서명이 담긴 토큰으로 변환하는 과정입니다.
   * 마치 은행에서 거래 시 사용할 수 있는 임시 증명서를 발급하는 것과 같습니다.
   */
  private async generateJwtToken(user: User): Promise<string> {
    // JWT payload에 포함할 정보를 정의합니다.
    // 보안상 민감한 정보(비밀번호 등)는 절대 포함하지 않습니다.
    const payload = {
      sub: user.id,           // subject: 토큰의 주체 (사용자 ID)
      email: user.email,      // 사용자 이메일
      role: user.role,        // 사용자 권한
      iat: Math.floor(Date.now() / 1000), // issued at: 발급 시간
    };

    // JWT 서비스를 사용해서 토큰을 생성합니다.
    // 서명에 사용될 비밀키와 만료시간은 환경변수에서 가져옵니다.
    return this.jwtService.signAsync(payload);
  }

  /**
   * 현재 로그인한 사용자의 정보를 조회합니다.
   * 
   * 이 메서드는 JWT Guard를 통과한 요청에서 사용자 정보를 반환합니다.
   * 프론트엔드에서 "내 정보" 페이지를 구성할 때 유용합니다.
   */
  async getProfile(userId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 비밀번호는 절대 반환하지 않습니다.
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`프로필 조회 중 오류 발생: ${error.message}`, error.stack);
      throw new BadRequestException('프로필 조회 중 오류가 발생했습니다.');
    }
  }
}
