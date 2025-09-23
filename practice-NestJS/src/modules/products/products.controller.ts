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

import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  PaginatedProductResponseDto
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 상품 관리 API를 처리하는 컨트롤러입니다.
 * 
 * 이 컨트롤러는 쇼핑몰의 상품 관리 시스템과 같은 역할을 합니다.
 * 상품 조회는 누구나 가능하지만, 등록/수정/삭제는 관리자 권한이 필요합니다.
 */
@ApiTags('상품 관리')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * 새로운 상품을 등록합니다.
   * 관리자만 접근 가능합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '상품 등록 (관리자 전용)',
    description: '새로운 상품을 시스템에 등록합니다.'
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
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request
  ): Promise<ProductResponseDto> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 상품 등록 시도: ${currentUser.email}`);
      throw new ForbiddenException('상품 등록은 관리자만 가능합니다.');
    }

    this.logger.log(`상품 등록 요청: ${createProductDto.name} (관리자: ${currentUser.email})`);
    
    return await this.productsService.create(createProductDto);
  }

  /**
   * 상품 목록을 조회합니다.
   * 누구나 접근 가능합니다.
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: '상품 목록 조회',
    description: '활성화된 상품 목록을 페이지네이션과 함께 조회합니다.'
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
   * 누구나 접근 가능합니다.
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '특정 상품의 상세 정보를 조회합니다.'
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
   * 관리자만 접근 가능합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '상품 정보 수정 (관리자 전용)',
    description: '기존 상품의 정보를 수정합니다.'
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
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request
  ): Promise<ProductResponseDto> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 상품 수정 시도: ${currentUser.email}`);
      throw new ForbiddenException('상품 수정은 관리자만 가능합니다.');
    }

    this.logger.log(`상품 수정 요청: ID ${id} (관리자: ${currentUser.email})`);
    
    return await this.productsService.update(id, updateProductDto);
  }

  /**
   * 상품을 삭제합니다.
   * 관리자만 접근 가능합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '상품 삭제 (관리자 전용)',
    description: '지정된 상품을 시스템에서 삭제합니다.'
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
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ): Promise<{ message: string }> {
    const currentUser = (req as any).user;
    
    // 관리자 권한 확인
    if (currentUser.role !== 'admin') {
      this.logger.warn(`권한 없는 상품 삭제 시도: ${currentUser.email}`);
      throw new ForbiddenException('상품 삭제는 관리자만 가능합니다.');
    }

    this.logger.log(`상품 삭제 요청: ID ${id} (관리자: ${currentUser.email})`);
    
    await this.productsService.remove(id);
    
    return {
      message: '상품이 성공적으로 삭제되었습니다.'
    };
  }
}
