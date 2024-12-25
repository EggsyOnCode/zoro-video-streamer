import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { VideoSchema } from './schema/video.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { GcpStorageService } from './services/gcp-storage.service';
import { VideosRepository } from './repositories/video.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Video', schema: VideoSchema }]),
  ],
  controllers: [MediaController],
  providers: [MediaService, GcpStorageService, VideosRepository],
})
export class MediaModule {}
