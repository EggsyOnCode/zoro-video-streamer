import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserStorageInfo,
  UserStorageInfoSchema,
} from './repositories/user-storage.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: UserStorageInfo.name, schema: UserStorageInfoSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
