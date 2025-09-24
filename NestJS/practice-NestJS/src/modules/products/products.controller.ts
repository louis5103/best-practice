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

import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  PaginatedProductResponseDto
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles, USER_ROLES } from '../../common/decorators/roles.decorator';

/**
 * 상품 관리 API를 처리하는 컨트롤러입니다.
 * 
 * 이 컨트롤러는 쇼핑몰의 상품 관리 시스템과 같은 역할을 합니다.
 * 권한 관리 시스템이 크게 개선되어 다음과 같은 장점들을 제공합니다:
 * 
 * 1. **선언적 보안**: @Roles() 데코레이터로 권한을 명시적으로 표현
 * 2. **코드 간소화**: 반복적인 권한 체크 로직 제거
 * 3. **가독성 향상**: 메서드 시그니처만 보고도 필요 권한 파악 가능
 * 4. **일관성 보장**: 모든 권한 체크가 동일한 방식으로 처리
 * 5. **유지보수 용이**: 권한 로직 변경 시 가드만 수정하면 됨
 * 
 * 권한 체계:
 * - 상품 조회: 누구나 가능 (@Public)
 * - 상품 등록/수정/삭제: 관리자만 가능 (@Roles('admin'))
 * 
 * 이전에는 각 메서드마다 수동으로 권한을 체크했지만,
 * 이제는 데코레이터 한 줄로 모든 권한 체크가 자동화됩니다.
 */
@ApiTags('📦 products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // 전체 컨트롤러에 가드 적용
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * 새로운 상품을 등록합니다.
   * 
   * ⚡ 개선된 권한 관리:
   * - 이전: 수동 권한 체크 (15줄의 보일러플레이트 코드)
   * - 현재: @Roles() 데코레이터 (1줄로 권한 체크 완료)
   * 
   * 이제 권한 체크는 RolesGuard에서 자동으로 처리되므로,
   * 비즈니스 로직에만 집중할 수 있습니다.
   */
  @Post()
  @Roles(USER_ROLES.ADMIN) // 🎯 관리자만 접근 가능
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '상품 등록 (관리자 전용)',
    description: '새로운 상품을 시스템에 등록합니다. 관리자 권한이 필요합니다.'
  })
  @ApiBody({
    type: CreateProductDto,
    description: '등록할 상품 정보'
  })
  @ApiResponse({
    status: 201,
    description: '상품 등록 성공',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async create(
    @Body() createProductDto: CreateProductDto
  ): Promise<ProductResponseDto> {
    // 권한 체크는 RolesGuard에서 자동 처리되므로 제거
    // 오직 비즈니스 로직에만 집중!
    
    this.logger.log(`상품 등록 요청: ${createProductDto.name}`);
    
    return await this.productsService.create(createProductDto);
  }

  /**
   * 상품 목록을 조회합니다.
   * 
   * 💡 공개 접근:
   * - @Public() 데코레이터로 인증 없이도 접근 가능
   * - 쇼핑몰의 상품 목록은 누구나 볼 수 있어야 하므로 공개
   * - JWT 토큰이 없어도 정상적으로 동작
   */
  @Get()
  @Public() // 🌍 누구나 접근 가능
  @ApiOperation({
    summary: '상품 목록 조회',
    description: '활성화된 상품 목록을 페이지네이션과 함께 조회합니다. 인증이 필요하지 않습니다.'
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
    name: 'category',
    required: false,
    type: String,
    description: '카테고리 필터',
    example: '액세서리'
  })
  @ApiResponse({
    status: 200,
    description: '상품 목록 조회 성공',
    type: PaginatedProductResponseDto
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string
  ): Promise<PaginatedProductResponseDto> {
    // 매개변수 변환 및 검증
    const validatedPage = Math.max(parseInt(page ?? '1') || 1, 1);
    const validatedLimit = Math.min(Math.max(parseInt(limit ?? '10') || 10, 1), 50);

    this.logger.log(
      `상품 목록 조회: 페이지 ${validatedPage}, 한계 ${validatedLimit}` +
      `${category ? `, 카테고리: "${category}"` : ''}`
    );

    return await this.productsService.findAll(validatedPage, validatedLimit, category);
  }

  /**
   * 특정 상품의 상세 정보를 조회합니다.
   * 
   * 💡 공개 접근:
   * - 상품 상세 페이지도 누구나 접근 가능해야 함
   * - SEO 최적화를 위해서도 공개 접근 필요
   */
  @Get(':id')
  @Public() // 🌍 누구나 접근 가능
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '특정 상품의 상세 정보를 조회합니다. 인증이 필요하지 않습니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '상품 ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '상품 조회 성공',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '상품을 찾을 수 없음'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    this.logger.log(`상품 상세 조회: ID ${id}`);
    
    return await this.productsService.findOne(id);
  }

  /**
   * 상품 정보를 수정합니다.
   * 
   * ⚡ 개선된 권한 관리:
   * - 복잡한 권한 체크 로직을 @Roles() 데코레이터 한 줄로 대체
   * - 메서드가 훨씬 간결해지고 비즈니스 로직에만 집중 가능
   */
  @Put(':id')
  @Roles(USER_ROLES.ADMIN) // 🎯 관리자만 접근 가능
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 정보 수정 (관리자 전용)',
    description: '기존 상품의 정보를 수정합니다. 관리자 권한이 필요합니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '수정할 상품 ID',
    example: 1
  })
  @ApiBody({
    type: UpdateProductDto,
    description: '수정할 상품 정보'
  })
  @ApiResponse({
    status: 200,
    description: '상품 수정 성공',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능'
  })
  @ApiResponse({
    status: 404,
    description: '상품을 찾을 수 없음'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    // 권한 체크는 RolesGuard에서 자동 처리
    // 깔끔하고 간결한 비즈니스 로직!
    
    this.logger.log(`상품 수정 요청: ID ${id}`);
    
    return await this.productsService.update(id, updateProductDto);
  }

  /**
   * 상품을 삭제합니다.
   * 
   * ⚡ 개선된 권한 관리:
   * - 삭제는 매우 중요한 작업이므로 관리자만 접근 가능
   * - 이전의 15줄 권한 체크 코드가 1줄의 데코레이터로 간소화
   */
  @Delete(':id')
  @Roles(USER_ROLES.ADMIN) // 🎯 관리자만 접근 가능
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '상품 삭제 (관리자 전용)',
    description: '지정된 상품을 시스템에서 삭제합니다. 관리자 권한이 필요합니다.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '삭제할 상품 ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '상품 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '상품이 성공적으로 삭제되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 - 관리자만 접근 가능'
  })
  @ApiResponse({
    status: 404,
    description: '상품을 찾을 수 없음'
  })
  async remove(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    // 권한 체크는 RolesGuard에서 자동 처리
    // 비즈니스 로직에만 집중!
    
    this.logger.log(`상품 삭제 요청: ID ${id}`);
    
    await this.productsService.remove(id);
    
    return {
      message: '상품이 성공적으로 삭제되었습니다.'
    };
  }
}
