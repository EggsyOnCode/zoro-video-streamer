import { Controller, Get } from '@nestjs/common';
import { UserAccMgmtServiceService } from './user-acc-mgmt-service.service';

@Controller()
export class UserAccMgmtServiceController {
  constructor(private readonly userAccMgmtServiceService: UserAccMgmtServiceService) {}

  @Get()
  getHello(): string {
    return this.userAccMgmtServiceService.getHello();
  }
}
