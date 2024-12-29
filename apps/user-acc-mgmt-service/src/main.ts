import { NestFactory } from '@nestjs/core';
import { UserAccMgmtServiceModule } from './user-acc-mgmt-service.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(UserAccMgmtServiceModule);
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT ?? 3000;
  // const corsOptions = {
  //   origin: ['http://alacrity.space', 'http://localhost:3000'], // Allow only this origin
  // };
  app.use(cookieParser());
  // app.use(cors(corsOptions));
  app.enableCors({
    origin: ['http://alacrity.space', 'http://localhost:3000'],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on http://0.0.0.0:${port}`);
  });
}
bootstrap();
