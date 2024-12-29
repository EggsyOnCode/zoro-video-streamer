import { NestFactory } from '@nestjs/core';
import { UserAccMgmtServiceModule } from './user-acc-mgmt-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(UserAccMgmtServiceModule);
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on http://0.0.0.0:${port}`);
  });
}
bootstrap();
