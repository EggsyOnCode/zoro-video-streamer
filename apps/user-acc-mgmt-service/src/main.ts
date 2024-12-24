import { NestFactory } from '@nestjs/core';
import { UserAccMgmtServiceModule } from './user-acc-mgmt-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(UserAccMgmtServiceModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
