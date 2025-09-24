import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 인증 관련 API를 처리하는 컨트롤러입니다.
 * 
 * 이 컨트롤러는 마치 호텔의 체크인/체크아웃 카운터와 같은 역할을 합니다.
 * 고객(클라이언트)이 방문해서 다양한 요청을 하면, 접수 직원(컨트롤러)이
 * 그 요청을 받아서 적절한 부서(서비스)로 전달하고 결과를 다시 고객에게 전달합니다.
 * 
 * Spring Boot의 @RestController와 동일한 개념으로,
 * HTTP 요청을 받아서 적절한 서비스 메서드를 호출하고,
 * 그 결과를 HTTP 응답으로 변환하는 역할을 담당합니다.
 * 
 * 이 컨트롤러에서 처리하는 주요 엔드포인트들:
 * - POST /auth/register : 회원가입
 * - POST /auth/login : 로그인
 * - POST /auth/logout : 로그아웃
 * - GET /auth/profile : 사용자 정보 조회
 * 
 * 모든 엔드포인트는 기본적으로 JWT 인증을 요구하지만,
 * @Public() 데코레이터를 사용해서 일부 엔드포인트는 인증 없이 접근 가능하게 설정했습니다.
 */
@ApiTags('인증')
@Controller('auth')
@UseGuards(JwtAuthGuard) // 이 컨트롤러의 모든 엔드포인트에 JWT 인증을 적용
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입 엔드포인트입니다.
   * 
   * 이 엔드포인트는 마치 은행에서 새 계좌를 개설하는 창구와 같습니다.
   * 고객이 필요한 서류(회원가입 정보)를 가져오면,
   * 직원이 확인하고 처리해서 새 계좌(사용자 계정)을 만들어줍니다.
   * 
   * @Public() 데코레이터가 있으므로 JWT 인증이 필요하지 않습니다.
   * 왜냐하면 아직 계정이 없는 사람이 계정을 만들어야 하기 때문입니다.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자 계정을 생성합니다.',
  })
  @ApiBody({
    description: '회원가입에 필요한 정보',
    schema: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: '사용자 이메일 주소',
        },
        password: {
          type: 'string',
          minLength: 8,
          example: 'MyPassword123!',
          description: '비밀번호 (영문, 숫자, 특수문자 포함)',
        },
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
          example: '홍길동',
          description: '사용자 실명',
        },
        role: {
          type: 'string',
          enum: ['user', 'moderator', 'admin'],
          default: 'user',
          description: '사용자 역할 (기본값: user)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '회원가입이 완료되었습니다.' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: '홍길동' },
            role: { type: 'string', example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
        token: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT 인증 토큰'
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: '이미 사용 중인 이메일 주소입니다.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async register(@Body(ValidationPipe) registerDto: any) {
    return await this.authService.register(registerDto);
  }

  /**
   * 로그인 엔드포인트입니다.
   * 
   * 이 엔드포인트는 마치 호텔에서 체크인하는 과정과 같습니다.
   * 고객이 예약 정보(이메일)와 신분증(비밀번호)을 제시하면,
   * 직원이 확인하고 룸키(JWT 토큰)를 발급해줍니다.
   * 
   * @Public() 데코레이터가 있으므로 JWT 인증이 필요하지 않습니다.
   * 로그인을 하려면 토큰이 있어야 하는데, 토큰을 받으려면 로그인을 해야 하는
   * 순환 문제를 해결하기 위해서입니다.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '사용자 인증을 수행하고 JWT 토큰을 발급합니다.',
  })
  @ApiBody({
    description: '로그인에 필요한 정보',
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: '등록된 이메일 주소',
        },
        password: {
          type: 'string',
          example: 'MyPassword123!',
          description: '계정 비밀번호',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '로그인이 완료되었습니다.' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: '홍길동' },
            role: { type: 'string', example: 'user' },
            isActive: { type: 'boolean', example: true },
            lastLoginAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          },
        },
        token: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT 인증 토큰'
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      },
    },
  })
  async login(@Body(ValidationPipe) loginDto: any) {
    return await this.authService.login(loginDto);
  }

  /**
   * 로그아웃 엔드포인트입니다.
   * 
   * 이 엔드포인트는 마치 호텔에서 체크아웃하는 과정과 같습니다.
   * 고객이 룸키(JWT 토큰)를 반납하면, 직원이 그 키를 무효화해서
   * 더 이상 사용할 수 없게 만듭니다.
   * 
   * JWT 인증이 필요합니다. 로그아웃하려면 먼저 로그인 상태여야 하기 때문입니다.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그아웃',
    description: '현재 JWT 토큰을 무효화하고 로그아웃합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '로그아웃이 완료되었습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 요청',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '인증이 필요합니다.' },
      },
    },
  })
  async logout(@Req() req: Request) {
    // Authorization 헤더에서 Bearer 토큰을 추출합니다.
    // 이 토큰을 블랙리스트에 추가해서 무효화시킵니다.
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return { message: '토큰이 제공되지 않았습니다.' };
    }

    return await this.authService.logout(token);
  }

  /**
   * 사용자 프로필 조회 엔드포인트입니다.
   * 
   * 이 엔드포인트는 마치 은행에서 계좌 정보를 조회하는 것과 같습니다.
   * 고객이 신분증(JWT 토큰)을 제시하면, 직원이 확인하고
   * 해당 계좌의 정보를 보여줍니다.
   * 
   * JWT 인증이 필요합니다. 본인의 정보만 조회할 수 있기 때문입니다.
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 프로필 조회',
    description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: '홍길동' },
        role: { type: 'string', example: 'user' },
        isActive: { type: 'boolean', example: true },
        isEmailVerified: { type: 'boolean', example: true },
        lastLoginAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 요청',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '인증이 필요합니다.' },
      },
    },
  })
  async getProfile(@Req() req: Request) {
    // JWT Guard를 통과한 요청에는 req.user에 사용자 정보가 담겨 있습니다.
    // 이는 JWT Strategy의 validate 메서드에서 반환한 정보입니다.
    const user = (req as any).user;
    return await this.authService.getProfile(user.id);
  }
}
