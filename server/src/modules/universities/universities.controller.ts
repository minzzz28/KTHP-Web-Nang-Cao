import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUniversityDto } from './dto/create-university.dto';
import { ListUniversitiesQueryDto } from './dto/list-universities-query.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UniversitiesService } from './universities.service';

@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  async list(@Query() query: ListUniversitiesQueryDto) {
    const result = await this.universitiesService.list(query);

    return {
      success: true,
      message: 'Thành công',
      ...result,
    };
  }

  @Get(':id')
  async show(@Param('id', new ParsePositiveIntPipe('universityId')) id: number) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.universitiesService.findById(id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: CreateUniversityDto) {
    return {
      success: true,
      message: 'Đã tạo trường đại học',
      data: await this.universitiesService.create(input),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', new ParsePositiveIntPipe('universityId')) id: number,
    @Body() input: UpdateUniversityDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật trường đại học',
      data: await this.universitiesService.update(id, input),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', new ParsePositiveIntPipe('universityId')) id: number) {
    await this.universitiesService.remove(id);
    return { success: true, message: 'Đã xóa trường đại học', data: null };
  }
}
