import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseGuards,
  Request,
  Res,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './services/jwt-auth.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserAccMgmtServiceService } from './user-acc-mgmt-service.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserAccMgmtServiceController {
  constructor(
    private readonly usersService: UserAccMgmtServiceService,
    private readonly configService: ConfigService,
    private readonly authSerivce: AuthService,
  ) {}

  @Post('register')
  @HttpCode(201)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return {
      id: user.userId,
      username: user.username,
      email: user.email,
    };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(200)
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    console.log(req.user);

    const res = await this.authSerivce.login(req.user);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000); // 24 hour in milliseconds

    response.cookie('jwt', res.access_token, {
      httpOnly: true,
      expires: expiryDate,
    });
    return {
      // jwt: res.access_token,
      userId: res.userId,
      userName: res.username,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getInfo(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);

    if (!user) {
      return new BadRequestException('User not found');
    } else {
      return {
        id: user.userId,
        username: user.username,
        email: user.email,
      };
    }
  }

  // @Post('logout')
  // logout(@Request() req) {
  //   return this.usersService.logout(req.user.userId);
  // }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @HttpCode(201)
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.userId, updateUserDto);

    return {
      id: user.userId,
      username: user.username,
      email: user.email,
    };
  }
}
