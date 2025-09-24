import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { Request } from 'express';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * 사용자 관리 API를 처리하는 컨트롤러입니다.
 * 
 * 이 컨트롤러는 마치 회사의 인사팀 창구와 같은 역할을 합니다.
 * 직원(사용자) 관리에 관한 모든 요청을 접수하고 처리합니다.
 * 
 * 모든 엔드포인트는 JWT 인증이 필요하며,
 * 일부 관리자 전용 기능들은 추가적인 권한 검사를 수행합니다.
 */
@ApiTags('사용자 관리')
@Controller('users')
@UseGuards(JwtAuthGuard) // 모든 엔드포인트에 JWT 인증 적용
@ApiBearerAuth() // Swagger에서 Authorization 헤더 표시
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * 새로운 사용자를 생성합니다.
   * 
   * 관리자만 다른 사용자를 생성할 수 있습니다.
   * 일반 사용자는 회원가입 API(/auth/register)를 사용해야 합니다.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '사용자 생성 (관리자 전용)',
    description: '관리자가 새로운 사용자를 직접 생성합니다.'
  })
  @ApiBody({
    type: CreateUserDto,
    description: '생성할 사용자 정보',
    examples: {
      example1: {
        summary: '일반 사용자 생성',
        value: {
          email: 'newuser@example.com',
          name: '새로운사용자',
          password: 'TempPassword123!',
          role: 'user',
          isActive: true,
          isEmailVerified: false
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '사용자 생성 성공',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능'
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복'
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request
  ): Promise<UserResponseDto> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 사용자 생성 시도: ${currentUser.email} (역할: ${currentUser.role})`);
      throw new ForbiddenException('사용자 생성은 관리자만 가능합니다.');
    }

    this.logger.log(`사용자 생성 요청: ${createUserDto.email} (관리자: ${currentUser.email})`);
    
    const result = await this.usersService.create(createUserDto);
    
    this.logger.log(`사용자 생성 완료: ${result.email} (ID: ${result.id})`);
    return result;
  }

  /**
   * 사용자 목록을 조회합니다.
   * 
   * 페이지네이션과 검색 기능을 제공하며,
   * 일반 사용자는 제한된 정보만, 관리자는 모든 정보를 볼 수 있습니다.
   */
  @Get()
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '페이지네이션과 검색 기능을 지원하는 사용자 목록을 조회합니다.'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호 (기본값: 1)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 10, 최대: 50)',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '검색 키워드 (이름 또는 이메일)',
    example: '김철수'
  })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
    type: PaginatedUserResponseDto
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패'
  })
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ): Promise<PaginatedUserResponseDto> {
    const currentUser = (req as any).user;
    
    // 매개변수 변환 및 검증
    const validatedPage = Math.max(parseInt(page ?? '1') || 1, 1);
    const validatedLimit = Math.min(Math.max(parseInt(limit ?? '10') || 10, 1), 50);
    const searchTerm = search || undefined;

    this.logger.log(
      `사용자 목록 조회: 페이지 ${validatedPage}, 한계 ${validatedLimit}` +
      `${searchTerm ? `, 검색: "${searchTerm}"` : ''} (요청자: ${currentUser.email})`
    );

    return await this.usersService.findAll(validatedPage, validatedLimit, searchTerm);
  }

  /**
   * 특정 사용자의 상세 정보를 조회합니다.
   * 
   * 일반 사용자는 자신의 정보만, 관리자는 모든 사용자 정보를 조회할 수 있습니다.
   */
  @Get(':id')
  @ApiOperation({
    summary: '사용자 상세 조회',
    description: '특정 사용자의 상세 정보를 조회합니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '사용자 ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '사용자 조회 성공',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음'
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 자신의 정보 또는 관리자만 접근 가능'
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ): Promise<UserResponseDto> {
    const currentUser = (req as any).user;
    
    // 권한 확인: 본인 정보이거나 관리자인 경우에만 허용
    if (currentUser.userId !== id && currentUser.role !== 'admin') {
      this.logger.warn(
        `권한 없는 사용자 정보 조회 시도: ${currentUser.email}이 사용자 ID ${id} 정보 요청`
      );
      throw new ForbiddenException('자신의 정보만 조회할 수 있습니다.');
    }

    this.logger.log(`사용자 상세 조회: ID ${id} (요청자: ${currentUser.email})`);
    
    return await this.usersService.findOne(id);
  }

  /**
   * 사용자 정보를 수정합니다.
   * 
   * 일반 사용자는 자신의 기본 정보만 수정할 수 있고,
   * 관리자는 모든 사용자의 모든 정보를 수정할 수 있습니다.
   */
  @Put(':id')
  @ApiOperation({
    summary: '사용자 정보 수정',
    description: '사용자의 정보를 수정합니다. 권한에 따라 수정 가능한 필드가 달라집니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '수정할 사용자 ID',
    example: 1
  })
  @ApiBody({
    type: UpdateUserDto,
    description: '수정할 사용자 정보',
    examples: {
      userUpdate: {
        summary: '일반 사용자 정보 수정',
        value: {
          name: '변경된이름',
          email: 'newemail@example.com'
        }
      },
      adminUpdate: {
        summary: '관리자가 수정하는 경우',
        value: {
          name: '변경된이름',
          role: 'moderator',
          isActive: false
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 수정 성공',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음'
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음'
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request
  ): Promise<UserResponseDto> {
    const currentUser = (req as any).user;
    
    // 권한 확인
    if (currentUser.userId !== id && currentUser.role !== 'admin') {
      throw new ForbiddenException('자신의 정보만 수정할 수 있습니다.');
    }

    // 일반 사용자는 민감한 필드 수정 불가
    if (currentUser.role !== 'admin') {
      const restrictedFields = ['role', 'isActive', 'isEmailVerified'];
      const hasRestrictedField = restrictedFields.some(field => 
        field in updateUserDto && (updateUserDto as any)[field] !== undefined
      );
      
      if (hasRestrictedField) {
        this.logger.warn(
          `일반 사용자의 제한된 필드 수정 시도: ${currentUser.email} (대상: ID ${id})`
        );
        throw new ForbiddenException('해당 필드는 관리자만 수정할 수 있습니다.');
      }
    }

    this.logger.log(
      `사용자 정보 수정 요청: ID ${id} (수정자: ${currentUser.email}, 역할: ${currentUser.role})`
    );
    
    const result = await this.usersService.update(id, updateUserDto);
    
    this.logger.log(`사용자 정보 수정 완료: ID ${id}`);
    return result;
  }

  /**
   * 비밀번호를 변경합니다.
   * 
   * 보안을 위해 현재 비밀번호 확인이 필요합니다.
   * 사용자는 자신의 비밀번호만 변경할 수 있습니다.
   */
  @Put(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 확인한 후 새로운 비밀번호로 변경합니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '사용자 ID',
    example: 1
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: '비밀번호 변경 정보',
    examples: {
      example1: {
        summary: '비밀번호 변경',
        value: {
          currentPassword: 'currentPassword123!',
          newPassword: 'newPassword456!',
          newPasswordConfirm: 'newPassword456!'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '비밀번호가 성공적으로 변경되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 - 현재 비밀번호 불일치 또는 새 비밀번호 형식 오류'
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 자신의 비밀번호만 변경 가능'
  })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request
  ): Promise<{ message: string }> {
    const currentUser = (req as any).user;
    
    // 본인 비밀번호만 변경 가능
    if (currentUser.userId !== id) {
      this.logger.warn(
        `다른 사용자 비밀번호 변경 시도: ${currentUser.email}이 사용자 ID ${id} 비밀번호 변경 요청`
      );
      throw new ForbiddenException('자신의 비밀번호만 변경할 수 있습니다.');
    }

    this.logger.log(`비밀번호 변경 요청: 사용자 ID ${id}`);
    
    await this.usersService.changePassword(id, changePasswordDto);
    
    this.logger.log(`비밀번호 변경 완료: 사용자 ID ${id}`);
    
    return {
      message: '비밀번호가 성공적으로 변경되었습니다.'
    };
  }

  /**
   * 사용자를 삭제합니다.
   * 
   * 관리자만 사용자를 삭제할 수 있으며, 자기 자신은 삭제할 수 없습니다.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '사용자 삭제 (관리자 전용)',
    description: '지정된 사용자를 시스템에서 삭제합니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '삭제할 사용자 ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '사용자 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '사용자가 성공적으로 삭제되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능 또는 자기 자신 삭제 시도'
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음'
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ): Promise<{ message: string }> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 사용자 삭제 시도: ${currentUser.email}`);
      throw new ForbiddenException('사용자 삭제는 관리자만 가능합니다.');
    }

    // 자기 자신 삭제 방지
    if (currentUser.userId === id) {
      this.logger.warn(`관리자 자기 자신 삭제 시도: ${currentUser.email} (ID: ${id})`);
      throw new ForbiddenException('자기 자신을 삭제할 수 없습니다.');
    }

    this.logger.log(`사용자 삭제 요청: ID ${id} (관리자: ${currentUser.email})`);
    
    await this.usersService.remove(id);
    
    this.logger.log(`사용자 삭제 완료: ID ${id}`);
    
    return {
      message: '사용자가 성공적으로 삭제되었습니다.'
    };
  }

  /**
   * 사용자 통계 정보를 조회합니다.
   * 
   * 관리자만 접근할 수 있으며, 대시보드에서 활용할 수 있는 
   * 다양한 사용자 관련 통계를 제공합니다.
   */
  @Get('admin/stats')
  @ApiOperation({
    summary: '사용자 통계 조회 (관리자 전용)',
    description: '전체 사용자 수, 활성 사용자 수, 역할별 분포 등의 통계 정보를 조회합니다.'
  })
  @ApiResponse({
    status: 200,
    description: '사용자 통계 조회 성공',
    type: UserStatsDto
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async getStats(@Req() req: Request): Promise<UserStatsDto> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 통계 조회 시도: ${currentUser.email}`);
      throw new ForbiddenException('사용자 통계는 관리자만 조회할 수 있습니다.');
    }

    this.logger.log(`사용자 통계 조회: ${currentUser.email}`);
    
    return await this.usersService.getStats();
  }
}
