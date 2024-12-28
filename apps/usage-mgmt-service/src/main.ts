import { NestFactory } from '@nestjs/core';
import { UsageMgmtServiceModule } from './usage-mgmt-service.module';
import { GCPubSubServer } from 'nestjs-google-pubsub-microservice';

async function bootstrap() {
  const topic = process.env.PUBSUB_TOPIC;
  const subscription = process.env.PUBSUB_SUBSCRIPTION;
  const app = await NestFactory.createMicroservice(UsageMgmtServiceModule, {
    strategy: new GCPubSubServer({
      topic: topic,
      subscription: subscription,
      client: {
        projectId: process.env.PROJECT_ID,
      },
    }),
  });
  await app.listen();
  console.log('Usage Management Service is listening for messages...');
}
bootstrap();
