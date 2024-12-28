import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'libs/database/abstract.schema';

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class UserStorageInfo extends AbstractDocument {
  @Prop({ required: true, type: String, unique: true })
  user: string; // ObjectId as a string for referencing User

  @Prop({ required: true, type: Number, default: 0 })
  total_videos: number; // Total number of videos uploaded by the user

  @Prop({ required: true, type: Number, default: 0 })
  total_storage_used: number; // Total storage used in MB

  @Prop({ required: true, type: Number, default: 0 })
  dailyBandwidthUsed: number; // Daily bandwidth used in MB

  @Prop({ required: true, type: Date, default: () => new Date() })
  lastBandwidthReset: Date; // ISODate for last bandwidth reset

  @Prop({ required: true, type: Number, default: 50 }) // Default limit is 50MB
  storageLimit: number; // Storage limit in MB

  @Prop({ required: true, type: Date, default: () => new Date() })
  lastUpdated: Date; // ISODate for last update timestamp
}

export const UserStorageInfoSchema =
  SchemaFactory.createForClass(UserStorageInfo);
