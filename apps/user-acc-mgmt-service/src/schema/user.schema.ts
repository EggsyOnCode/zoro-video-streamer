import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'libs/database/abstract.schema';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class User extends AbstractDocument {
  @Prop({
    required: true,
    unique: true,
    default: uuidv4, // Automatically generate UUID for userId
  })
  userId: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email regex validation
  })
  email: string;

  @Prop({
    required: true,
    minlength: 8,
    // select: false, // Exclude passwordHash from queries by default
  })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
