import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  UploadedFiles,
  Req,
  BadRequestException,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from 'apps/user-acc-mgmt-service/src/services/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from './pipes/FileSizeValidationPipe';

@Controller('/storage/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 }, // Expect 1 file for the 'video' field
      { name: 'thumbnail', maxCount: 1 }, // Expect 1 file for the 'thumbnail' field
    ]),
  )
  @Post('/video')
  async create(
    @Body(ValidationPipe) createMediaDto: CreateMediaDto,
    @UploadedFiles(new FileSizeValidationPipe({ video: 50, thumbnail: 2 }))
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Req() req: any, // to get user from the request
  ) {
    const video = files.video?.[0];
    const thumbnail = files.thumbnail?.[0];

    // Validate files before passing them to the service
    if (!video || !thumbnail) {
      throw new BadRequestException('Both video and thumbnail are required');
    }

    return this.mediaService.create(
      createMediaDto,
      video,
      thumbnail,
      req.user.userId,
      req.user.username,
    );
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 }, // Expect 1 file for the 'video' field (optional)
      { name: 'thumbnail', maxCount: 1 }, // Expect 1 file for the 'thumbnail' field (optional)
    ]),
  )
  @Patch('/video/:id')
  async update(
    @Param('id') id: string,
    @Req() req: any, // to get user from the request
    @Body() updateMediaDto: UpdateMediaDto,
    @UploadedFiles(new FileSizeValidationPipe({ video: 50, thumbnail: 2 }))
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    const video = files.video?.[0];
    const thumbnail = files.thumbnail?.[0];

    return this.mediaService.update(
      id,
      updateMediaDto,
      req.user.userId,
      video,
      thumbnail,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/video/:id')
  @HttpCode(200)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.mediaService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/video/:id')
  @HttpCode(200)
  async findOne(@Param('id') id: string) {
    return this.mediaService.getVideo(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/dashboard-videos')
  @HttpCode(200)
  async getDashboardVideos(
    @Query('pageIndex') pageIndex: number = 0,
    @Query('pageSize') pageSize: number = 50,
  ) {
    return this.mediaService.getPaginatedVideos(pageIndex, pageSize);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/videos/bulk')
  @HttpCode(200)
  async bulkRemove(@Body() body: { videoIds: string[] }, @Req() req: any) {
    const { videoIds } = body;
    console.log(videoIds);

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      throw new Error('Invalid input: videoIds must be a non-empty array.');
    }

    return this.mediaService.bulkRemove(videoIds, req.user.userId);
  }
}
