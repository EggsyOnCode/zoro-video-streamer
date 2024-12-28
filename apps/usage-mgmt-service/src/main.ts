import { NestFactory } from '@nestjs/core';
import { UsageMgmtServiceModule } from './usage-mgmt-service.module';
import { PubSubServer } from 'nestjs-google-pubsub';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UsageMgmtServiceModule, {
    strategy: new PubSubServer({
      projectId: process.env.PROJECT_ID,
      topics: {
        media_consumed: {
          subscriptionId: process.env.PUBSUB_SUBSCRIPTION,
        },
      },
    }),
  });
  await app.listen();
  console.log('Usage Management Service is listening for messages...');
}
bootstrap();
