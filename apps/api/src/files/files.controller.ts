import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/types/authenticated-request.type';
import { CreateFileDto, CreateFileResponseDto, ConfirmUploadResponseDto } from '@dto';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @HttpCode(201)
  createFile(
    @Body() dto: CreateFileDto,
    @CurrentUser() user: RequestUser,
  ): Promise<CreateFileResponseDto> {
    return this.filesService.createFile(dto, user.id);
  }

  @Post(':id/upload-complete')
  @HttpCode(200)
  confirmUpload(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ConfirmUploadResponseDto> {
    return this.filesService.confirmUpload(id, user.id);
  }
}
