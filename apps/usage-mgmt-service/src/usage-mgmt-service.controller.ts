import { Controller } from '@nestjs/common';
import { UsageMgmtService } from './usage-mgmt-service.service';
import { Ctx, EventPattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

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

  @EventPattern(undefined)
  async handleMediaConsumed(@Ctx() context: GCPubSubContext) {
    const msg = JSON.parse(context.getMessage().data.toString());
    return await this.usageMgmtServiceService.processMediaConsumed(msg);
  }
}
