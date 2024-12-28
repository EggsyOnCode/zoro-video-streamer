import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { VideoSchema } from './schema/video.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { GcpStorageService } from './services/gcp-storage.service';
import { VideosRepository } from './repositories/video.repository';
import { UserStorageRepository } from './repositories/user-storage.repository';
import { UserStorageInfoSchema } from '../schema/user-storage.schema';
import { GCPubSubController } from './services/GcpPubSubController.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Video', schema: VideoSchema }]),
    MongooseModule.forFeature([
      { name: 'UserStorageInfo', schema: UserStorageInfoSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    GcpStorageService,
    VideosRepository,
    UserStorageRepository,
    GCPubSubController,
  ],
  exports: [GCPubSubController],
})
export class MediaModule {}
