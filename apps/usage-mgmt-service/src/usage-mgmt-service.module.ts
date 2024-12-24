import { Module } from '@nestjs/common';
import { UsageMgmtServiceController } from './usage-mgmt-service.controller';
import { UsageMgmtServiceService } from './usage-mgmt-service.service';

@Module({
  imports: [],
  controllers: [UsageMgmtServiceController],
  providers: [UsageMgmtServiceService],
})
export class UsageMgmtServiceModule {}
