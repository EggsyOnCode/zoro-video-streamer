import { NestFactory } from '@nestjs/core';
import { StorageMgmtServiceModule } from './storage-mgmt-service.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(StorageMgmtServiceModule);
  const config = new DocumentBuilder()
    .setTitle('Storage Management microservice')
    .setDescription('docs of storage mgmt endpoints')
    .setVersion('1.0')
    .addTag('storage-mgmt')
    .build();

  // const corsoptions = {
  //   origin: ['http://alacrity.space', 'http://localhost:3000'], // allow only this origin
  // };

  // app.use(cors(corsOptions));
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://alacrity.space', 'http://localhost:3000'],
    credentials: true,
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.port ?? 4000);
}
bootstrap();
