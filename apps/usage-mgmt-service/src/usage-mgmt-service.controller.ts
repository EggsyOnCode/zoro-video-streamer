import { Controller } from '@nestjs/common';
import { UsageMgmtService } from './usage-mgmt-service.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller()
export class UsageMgmtServiceController {
  topic: string;
  constructor(
    private readonly usageMgmtServiceService: UsageMgmtService,
    private readonly configSerivce: ConfigService,
  ) {
    this.topic =
      this.configSerivce.get<string>('PUBSUB_TOPIC') ??
      'projects/cc-final-445817/topics/media_consumed';
  }

  @EventPattern('media_consumed')
  async handleMediaConsumed(@Payload() data: any) {
    const res = Buffer.from(data.data, 'base64').toString();
    const resObj = this.usageMgmtServiceService.parseMediaConsumedMsg(res);
    console.log(`Received message:`, resObj);
  }
}
