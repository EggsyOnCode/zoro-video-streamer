import { NestFactory } from '@nestjs/core';
import { StorageMgmtServiceModule } from './storage-mgmt-service.module';

async function bootstrap() {
  const app = await NestFactory.create(StorageMgmtServiceModule);

  await app.listen(process.env.port ?? 4000);
}
bootstrap();
