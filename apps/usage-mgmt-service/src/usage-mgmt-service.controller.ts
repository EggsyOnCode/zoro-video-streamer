import { Controller, Get } from '@nestjs/common';
import { UsageMgmtServiceService } from './usage-mgmt-service.service';

@Controller()
export class UsageMgmtServiceController {
  constructor(private readonly usageMgmtServiceService: UsageMgmtServiceService) {}

  @Get()
  getHello(): string {
    return this.usageMgmtServiceService.getHello();
  }
}
