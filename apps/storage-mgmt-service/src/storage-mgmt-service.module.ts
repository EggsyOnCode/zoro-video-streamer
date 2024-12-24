import { Module } from '@nestjs/common';
import { StorageMgmtServiceController } from './storage-mgmt-service.controller';
import { StorageMgmtServiceService } from './storage-mgmt-service.service';

@Module({
  imports: [],
  controllers: [StorageMgmtServiceController],
  providers: [StorageMgmtServiceService],
})
export class StorageMgmtServiceModule {}
