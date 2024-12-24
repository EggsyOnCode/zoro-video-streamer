import { NestFactory } from '@nestjs/core';
import { UsageMgmtServiceModule } from './usage-mgmt-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UsageMgmtServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
