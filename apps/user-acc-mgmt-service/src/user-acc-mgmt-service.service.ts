import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from './schema/user.schema';

@Injectable()
export class UserAccMgmtServiceService {
  constructor(private readonly userRepo: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserRequest(createUserDto);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.userRepo.create({
      ...createUserDto,
      userId: uuidv4(),
      passwordHash: hashedPassword,
    });
    return newUser;
  }

  private async validateCreateUserRequest(request: CreateUserDto) {
    let user: User;
    try {
      user = await this.userRepo.findOne({
        email: request.email,
      });
    } catch (err) {}

    if (user) {
      throw new UnprocessableEntityException('Email already exists.');
    }
  }

  async findOne(userId: string) {
    const user = await this.userRepo.findOne({ userId: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // not using this
  async login(username: string, password: string) {
    console.log(username, password);
    const user = await this.userRepo.findOne({ username: username });
    console.log(user);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new NotFoundException('Invalid credentials');
    }
    // return null;
    // return this.authService.login(user);
  }

  // async logout(userId: string) {
  //   // Implement logout logic (e.g., token invalidation) if necessary
  //   return { message: 'Logged out successfully' };
  // }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const updateFields: Partial<User> = {};

    if (updateUserDto.email) {
      updateFields.email = updateUserDto.email;
    }
    if (updateUserDto.username) {
      updateFields.username = updateUserDto.username;
    }
    if (updateUserDto.password) {
      updateFields.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = (await this.userRepo.upsert(
      { userId: userId },
      updateFields,
    )) as User;

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  private async checkPwdAgainstHash(hash: string, password: string) {
    return await bcrypt.compare(password, hash);
  }

  async validate(username: string, pwd: string) {
    const user = await this.userRepo.findOne({
      username: username,
    });

    if (user && (await this.checkPwdAgainstHash(user.passwordHash, pwd))) {
      const { ...result } = user;
      return result;
    }
    return null;
  }
}
