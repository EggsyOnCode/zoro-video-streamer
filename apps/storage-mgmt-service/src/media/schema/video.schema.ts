import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'libs/database/abstract.schema';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Video extends AbstractDocument {
  @Prop({ required: true, type: String, ref: 'User' })
  user: string; // Reference to the User schema

  @Prop({ required: true, unique: true, default: uuidv4 })
  videoID: string; // UUID for video ID

  @Prop({ required: true, type: Number })
  length: number; // Length in seconds

  @Prop({ required: true, type: String })
  videoTitle: string;

  @Prop({ required: true, type: String })
  thumbnailUrl: string;

  @Prop({ required: true, type: String }) // need this for bucket storage reference
  thumbnailFilename: string;

  @Prop({ required: true, type: String })
  videoUrl: string; // Path to the file

  @Prop({ required: true, type: Number })
  size: number; // Size in MB

  @Prop({ required: true, type: Date, default: () => new Date() })
  uploadDate: Date; // ISODate for upload timestamp
}

export const VideoSchema = SchemaFactory.createForClass(Video);