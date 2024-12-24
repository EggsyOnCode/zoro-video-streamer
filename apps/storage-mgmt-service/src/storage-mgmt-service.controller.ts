import { Controller, Get } from '@nestjs/common';
import { StorageMgmtServiceService } from './storage-mgmt-service.service';

@Controller()
export class StorageMgmtServiceController {
  constructor(private readonly storageMgmtService: StorageMgmtServiceService) {}

  @Get()
  getHello(): string {
    return this.storageMgmtService.getHello();
  }
}
