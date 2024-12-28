import { Module } from '@nestjs/common';
import { StorageMgmtServiceController } from './storage-mgmt-service.controller';
import { StorageMgmtServiceService } from './storage-mgmt-service.service';
import { MediaModule } from './media/media.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from 'libs/database';
import { JwtStrategy } from 'apps/user-acc-mgmt-service/src/services/jwt.strategy';

@Module({
  imports: [
    DatabaseModule,
    MediaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // JWT_SECRET: Joi.string().required(),
        // JWT_EXPIRATION: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
        BUCKET_NAME_VIDEOS: Joi.string().required(),
        BUCKET_NAME_THUMBNAILS: Joi.string().required(),
        PROJECT_ID: Joi.string().required(),
        PUBSUB_TOPIC: Joi.string().required(),
        PUBSUB_SUBSCRIPTION: Joi.string().required(),
      }),
      envFilePath: './apps/storage-mgmt-service/.env',
    }),
  ],
  controllers: [StorageMgmtServiceController],
  providers: [StorageMgmtServiceService, JwtStrategy],
})
export class StorageMgmtServiceModule {}
