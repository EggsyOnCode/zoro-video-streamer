import { Module } from '@nestjs/common';
import { UsageMgmtServiceController } from './usage-mgmt-service.controller';
import { UsageMgmtService } from './usage-mgmt-service.service';
import { DatabaseModule, UserStorageRepository } from 'libs/database';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    DatabaseModule,
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
      envFilePath: './apps/usage-mgmt-service/.env',
    }),
  ],
  controllers: [UsageMgmtServiceController],
  providers: [UsageMgmtService, UserStorageRepository],
})
export class UsageMgmtServiceModule {}
