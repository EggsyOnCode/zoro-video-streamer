import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { v4 as uuidv4 } from 'uuid';
import { User } from './schema/user.schema';
import { hashPassword, matchPassword } from '../utils/hashing';

@Injectable()
export class UserAccMgmtServiceService {
  constructor(private readonly userRepo: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserRequest(createUserDto);
    const hashedPassword = hashPassword(createUserDto.password);
    console.log(hashedPassword);

    const newUser = await this.userRepo.create({
      ...createUserDto,
      userId: uuidv4(),
      passwordHash: hashedPassword,
    });
    console.log('helllo...');

    return newUser;
  }

  private async validateCreateUserRequest(request: CreateUserDto) {
    let user: User;
    console.log(request);

    try {
      user = await this.userRepo.findOne({
        email: request.email,
      });
      console.log(user);
    } catch (err) {
      throw new InternalServerErrorException("couldn't validate user req");
    }

    if (user) {
      throw new UnprocessableEntityException('Email already exists.');
    } else {
      return;
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

    if (!user || !(await matchPassword(password, user.passwordHash))) {
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
      updateFields.passwordHash = await hashPassword(updateUserDto.password);
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
    return await matchPassword(password, hash);
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
