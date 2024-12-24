import { Module } from '@nestjs/common';
import { UserAccMgmtServiceController } from './user-acc-mgmt-service.controller';
import { UserAccMgmtServiceService } from './user-acc-mgmt-service.service';

@Module({
  imports: [],
  controllers: [UserAccMgmtServiceController],
  providers: [UserAccMgmtServiceService],
})
export class UserAccMgmtServiceModule {}
