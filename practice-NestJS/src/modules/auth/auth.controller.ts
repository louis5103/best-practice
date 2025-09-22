import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Logger
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponseDto, 
  RegisterResponseDto,
  LogoutResponseDto 
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 인증 관련 API를 처리하는 컨트롤러입니다.
 * 
 * 이 컨트롤러는 마치 호텔의 프런트 데스크와 같은 역할을 합니다.
 * 고객(클라이언트)의 요청을 받아서 적절한 부서(서비스)로 전달하고,
 * 처리 결과를 다시 고객에게 전달합니다.
 * 
 * 모든 인증 관련 엔드포인트(/auth/*)는 이 컨트롤러에서 처리됩니다.
 */
@ApiTags('인증')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 로그인 엔드포인트입니다.
   * 
   * 이메일과 비밀번호를 받아서 검증한 후,
   * 성공 시 JWT 토큰과 사용자 정보를 반환합니다.
   * 
   * @Public 데코레이터를 사용하여 인증 없이 접근 가능하게 설정했습니다.
   * (로그인을 위해서는 당연히 기존 토큰이 필요 없어야 합니다)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // 로그인은 201(Created)이 아닌 200(OK)이 적절
  @ApiOperation({ 
    summary: '사용자 로그인',
    description: '이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.'
  })
  @ApiBody({ 
    type: LoginDto,
    description: '로그인 요청 정보',
    examples: {
      example1: {
        summary: '일반 사용자 로그인',
        value: {
          email: 'user@example.com',
          password: 'MyPassword123!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '로그인 성공',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 잘못된 이메일 또는 비밀번호',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 - 유효성 검사 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`로그인 시도: ${loginDto.email}`);
    
    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`로그인 성공: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`로그인 실패: ${loginDto.email} - ${error.message}`);
      throw error; // 서비스에서 처리한 예외를 그대로 전달
    }
  }

  /**
   * 사용자 회원가입 엔드포인트입니다.
   * 
   * 새로운 사용자 계정을 생성하고 데이터베이스에 저장합니다.
   * 보안을 위해 비밀번호는 자동으로 해시화되어 저장됩니다.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 새로운 리소스 생성이므로 201 사용
  @ApiOperation({ 
    summary: '사용자 회원가입',
    description: '새로운 사용자 계정을 생성합니다. 이메일 중복 확인이 자동으로 수행됩니다.'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: '회원가입 요청 정보',
    examples: {
      example1: {
        summary: '일반 사용자 회원가입',
        value: {
          email: 'newuser@example.com',
          name: '홍길동',
          password: 'MySecurePassword123!',
          passwordConfirm: 'MySecurePassword123!',
          role: 'user'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '회원가입 성공',
    type: RegisterResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: '이메일 중복',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: '이미 사용 중인 이메일 주소입니다.' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 - 유효성 검사 실패 또는 비밀번호 불일치',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    this.logger.log(`회원가입 시도: ${registerDto.email}`);
    
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`회원가입 성공: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`회원가입 실패: ${registerDto.email} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 현재 인증된 사용자의 정보를 조회하는 엔드포인트입니다.
   * 
   * JWT 토큰을 통해 인증된 사용자만 접근할 수 있으며,
   * 토큰에서 추출한 사용자 정보를 반환합니다.
   * 
   * 이는 마치 신분증을 보여주고 본인 정보를 확인하는 것과 같습니다.
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Swagger에서 Authorization 헤더 표시
  @ApiOperation({ 
    summary: '현재 사용자 프로필 조회',
    description: 'JWT 토큰으로 인증된 현재 사용자의 정보를 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '프로필 조회 성공',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 유효하지 않은 토큰',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '유효하지 않은 토큰입니다.' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async getProfile(@Req() req: Request): Promise<{ user: any }> {
    // JwtAuthGuard에서 이미 검증된 사용자 정보가 req.user에 저장되어 있습니다
    const user = (req as any).user;
    
    this.logger.log(`프로필 조회: 사용자 ID ${user.userId}`);
    
    return {
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        // 추가 정보가 필요하다면 데이터베이스에서 조회할 수 있습니다
      }
    };
  }

  /**
   * 로그아웃 엔드포인트입니다.
   * 
   * JWT 토큰을 블랙리스트에 등록하여 해당 토큰의 추가 사용을 방지합니다.
   * 클라이언트에서도 토큰을 삭제해야 완전한 로그아웃이 됩니다.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '로그아웃',
    description: '현재 사용 중인 JWT 토큰을 무효화하고 로그아웃합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '로그아웃 성공',
    type: LogoutResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 유효하지 않은 토큰' 
  })
  async logout(@Req() req: Request): Promise<LogoutResponseDto> {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';
    
    const user = (req as any).user;
    this.logger.log(`로그아웃 요청: 사용자 ID ${user.userId}`);
    
    try {
      const result = await this.authService.logout(token);
      this.logger.log(`로그아웃 성공: 사용자 ID ${user.userId}`);
      return result;
    } catch (error) {
      this.logger.warn(`로그아웃 처리 중 오류: 사용자 ID ${user.userId} - ${error.message}`);
      // 로그아웃은 실패하더라도 클라이언트 측에서는 성공으로 처리
      return {
        message: '로그아웃 처리가 완료되었습니다.',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 토큰 유효성 검증 엔드포인트입니다.
   * 
   * 클라이언트에서 현재 보유한 토큰이 여전히 유효한지 확인할 때 사용합니다.
   * 단순히 토큰 검증만 수행하고 사용자 정보는 반환하지 않습니다.
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '토큰 유효성 검증',
    description: '현재 JWT 토큰이 유효한지 확인합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '토큰 유효함',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: '토큰이 유효합니다.' },
        expiresAt: { type: 'string', example: '2024-01-02T12:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '토큰 무효함' 
  })
  async verifyToken(@Req() req: Request): Promise<{ valid: boolean; message: string; expiresAt: string }> {
    const user = (req as any).user;
    
    // JWT 가드를 통과했다면 토큰이 유효합니다
    const expiresAt = new Date(user.exp * 1000).toISOString();
    
    return {
      valid: true,
      message: '토큰이 유효합니다.',
      expiresAt
    };
  }
}
