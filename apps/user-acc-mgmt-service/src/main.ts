import { NestFactory } from '@nestjs/core';
import { UserAccMgmtServiceModule } from './user-acc-mgmt-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UserAccMgmtServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
