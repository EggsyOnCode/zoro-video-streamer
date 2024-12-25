import { IsString } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  videoTitle: string;
}
