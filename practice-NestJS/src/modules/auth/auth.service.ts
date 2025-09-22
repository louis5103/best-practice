import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';

import { User } from '../../database/entities/user.entity';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponseDto, 
  RegisterResponseDto,
  UserInfoDto 
} from './dto';

/**
 * 인증 서비스입니다.
 * 
 * 이 서비스는 마치 은행의 보안팀과 같은 역할을 합니다.
 * 고객(사용자)의 신원을 확인하고, 계좌(계정)를 개설하며,
 * 안전한 거래(API 접근)를 위한 인증서(JWT 토큰)를 발급합니다.
 * 
 * 모든 보안 관련 비즈니스 로직이 이곳에 집중되어 있어
 * 일관된 보안 정책을 적용할 수 있습니다.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  /**
   * 사용자 로그인을 처리합니다.
   * 
   * 이 메서드는 마치 은행 창구에서 신분증과 도장을 확인하는 과정과 같습니다.
   * 이메일과 비밀번호를 확인한 후, 모든 것이 정확하다면
   * 은행 업무를 위한 임시 신분증(JWT 토큰)을 발급합니다.
   * 
   * @param loginDto 로그인 요청 정보
   * @returns AuthResponseDto 인증 성공 응답
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    try {
      // 1. 이메일로 사용자 찾기
      // 비밀번호 비교를 위해 password 필드도 함께 조회해야 합니다.
      // (기본적으로는 보안상 password가 select에서 제외될 수 있음)
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();

      if (!user) {
        this.logger.warn(`로그인 실패 - 존재하지 않는 이메일: ${email}`);
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 2. 계정 상태 확인
      if (!user.isActive) {
        this.logger.warn(`로그인 실패 - 비활성화된 계정: ${email}`);
        throw new UnauthorizedException('비활성화된 계정입니다. 관리자에게 문의하세요.');
      }

      // 3. 비밀번호 검증
      // User 엔티티의 validatePassword 메서드를 활용합니다.
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        this.logger.warn(`로그인 실패 - 잘못된 비밀번호: ${email}`);
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 4. JWT 토큰 생성
      const payload = {
        sub: user.id,          // JWT 표준: subject (사용자 ID)
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000), // issued at
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // 5. 마지막 로그인 시간 업데이트
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date()
      });

      // 6. 로그인 성공 로그
      this.logger.log(`로그인 성공: ${email} (ID: ${user.id})`);

      // 7. 응답 데이터 구성
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.getTokenExpirationSeconds(),
        user: this.transformToUserInfo(user),
        message: '로그인에 성공했습니다.',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // 이미 처리된 예외는 그대로 재throw
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // 예상치 못한 오류는 로그를 남기고 일반적인 메시지 반환
      this.logger.error(`로그인 처리 중 오류 발생: ${error.message}`, error.stack);
      throw new UnauthorizedException('로그인 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 새로운 사용자를 등록합니다.
   * 
   * 이 메서드는 마치 은행에서 새 계좌를 개설하는 과정과 같습니다.
   * 필요한 서류(정보)를 모두 확인하고, 중복 계좌가 없는지 검사한 후,
   * 새로운 계좌(사용자 계정)를 안전하게 생성합니다.
   * 
   * @param registerDto 회원가입 요청 정보
   * @returns RegisterResponseDto 회원가입 성공 응답
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, name, password, passwordConfirm, role } = registerDto;

    try {
      // 1. 비밀번호 확인 검증
      if (password !== passwordConfirm) {
        throw new BadRequestException('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      }

      // 2. 이메일 중복 체크
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        this.logger.warn(`회원가입 실패 - 중복된 이메일: ${email}`);
        throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
      }

      // 3. 새로운 사용자 엔티티 생성
      const newUser = this.userRepository.create({
        email,
        name,
        password, // 비밀번호는 엔티티의 @BeforeInsert 훅에서 자동 해시화됩니다
        role: role || 'user',
        isActive: true,
        isEmailVerified: false // 이메일 인증은 별도 프로세스에서 처리
      });

      // 4. 데이터베이스에 저장
      const savedUser = await this.userRepository.save(newUser);

      // 5. 회원가입 성공 로그
      this.logger.log(`회원가입 성공: ${email} (ID: ${savedUser.id})`);

      // 6. 응답 데이터 구성 (비밀번호는 제외)
      return {
        message: '회원가입이 완료되었습니다.',
        user: this.transformToUserInfo(savedUser),
        nextStep: '로그인하여 서비스를 이용해 주세요.',
        timestamp: new Date().toISOString()
      };

      // TODO: 이메일 인증 메일 발송 로직 추가 가능

    } catch (error) {
      // 이미 처리된 예외는 그대로 재throw
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }

      // 예상치 못한 오류 처리
      this.logger.error(`회원가입 처리 중 오류 발생: ${error.message}`, error.stack);
      throw new BadRequestException('회원가입 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * JWT 토큰을 검증하고 사용자 정보를 반환합니다.
   * 
   * 이 메서드는 마치 출입 카드를 스캔하여 유효성을 확인하는 것과 같습니다.
   * 토큰이 위조되지 않았는지, 만료되지 않았는지 확인하고,
   * 유효하다면 해당 사용자의 정보를 제공합니다.
   * 
   * @param token JWT 토큰
   * @returns User 사용자 엔티티
   */
  async validateToken(token: string): Promise<User> {
    try {
      // JWT 토큰 검증 및 디코딩
      const payload = await this.jwtService.verifyAsync(token);
      
      // 토큰에서 추출한 사용자 ID로 사용자 정보 조회
      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException('토큰에 해당하는 사용자를 찾을 수 없습니다.');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('비활성화된 계정입니다.');
      }

      return user;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`토큰 검증 중 오류 발생: ${error.message}`);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 로그아웃을 처리합니다.
   * 
   * JWT는 stateless하므로 서버에서 토큰을 무효화할 수 없습니다.
   * 대신 블랙리스트를 사용하여 해당 토큰의 사용을 차단합니다.
   * 이는 마치 분실 신고된 카드를 블랙리스트에 등록하는 것과 같습니다.
   * 
   * @param token 로그아웃할 JWT 토큰
   */
  async logout(token: string): Promise<{ message: string; timestamp: string }> {
    try {
      // 토큰을 디코딩하여 만료 시간 확인
      const payload = await this.jwtService.verifyAsync(token);
      const expiresAt = payload.exp * 1000; // 초를 밀리초로 변환
      const now = Date.now();
      
      // 토큰이 아직 유효한 경우에만 블랙리스트에 추가
      if (expiresAt > now) {
        const redis = this.redisService.getOrThrow();
        const remainingTime = Math.floor((expiresAt - now) / 1000); // 초 단위
        
        // Redis에 블랙리스트로 등록 (토큰 만료 시간까지)
        await redis.setex(`blacklist:${token}`, remainingTime, 'true');
        
        this.logger.log(`토큰 블랙리스트 등록: 사용자 ID ${payload.sub}`);
      }

      return {
        message: '성공적으로 로그아웃되었습니다.',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`로그아웃 처리 중 오류 발생: ${error.message}`, error.stack);
      // 로그아웃은 실패하더라도 클라이언트에서는 성공으로 처리하는 것이 UX상 좋습니다
      return {
        message: '로그아웃 처리가 완료되었습니다.',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * User 엔티티를 UserInfoDto로 변환합니다.
   * 
   * 이 메서드는 민감한 정보를 제거하고 클라이언트에게
   * 안전한 사용자 정보만을 제공하는 역할을 합니다.
   * 
   * @param user User 엔티티
   * @returns UserInfoDto 안전한 사용자 정보
   */
  private transformToUserInfo(user: User): UserInfoDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };
  }

  /**
   * JWT 토큰의 만료 시간을 초 단위로 반환합니다.
   * 
   * @returns number 토큰 만료 시간 (초)
   */
  private getTokenExpirationSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
    
    // 시간 문자열을 초로 변환 (간단한 구현)
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    }
    
    // 기본값: 24시간
    return 86400;
  }
}
