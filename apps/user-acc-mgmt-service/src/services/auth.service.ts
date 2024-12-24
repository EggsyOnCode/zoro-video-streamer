import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccMgmtServiceService } from '../user-acc-mgmt-service.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserAccMgmtServiceService,
    private jwtService: JwtService,
  ) {}
  async validateUser(username: string, pwd: string) {
    const user = await this.userService.validate(username, pwd);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  //signing the req.user payload returned from Passport Local strategy
  async login(user) {
    const payload = {
      username: user.username,
      sub: user.userId,
      // email: user.email,
    };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.userId,
      username: user.username,
      // email: user.email,
    };
  }
}
