import { Injectable } from '@nestjs/common';
import { Bucket, Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GcpStorageService {
  private storage: Storage;
  private bucketName: string;
  private bucketNameThumbnail: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: 'cc-final-445817',
    });

    this.bucketName = this.configService.get<string>('BUCKET_NAME_VIDEOS');
    this.bucketNameThumbnail = this.configService.get<string>(
      'BUCKET_NAME_THUMBNAILS',
    );

    // this.initializeBuckets();
  }

  private async initializeBuckets(): Promise<void> {
    await this.ensureBucketExists(this.bucketName);
    await this.ensureBucketExists(this.bucketNameThumbnail);
  }

  private async ensureBucketExists(bucketName: string): Promise<void> {
    const [exists] = await this.storage.bucket(bucketName).exists();

    if (!exists) {
      console.log(`Bucket ${bucketName} does not exist. Creating...`);
      await this.storage.createBucket(bucketName, {
        location: 'US',
        storageClass: 'STANDARD',
      });
      console.log(`Bucket ${bucketName} created.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  }

  async uploadFile(
    filename: string,
    fileBuffer: Buffer,
    video: boolean,
  ): Promise<string> {
    // console.log(await this.storage.getBuckets());
    await this.initializeBuckets();

    const bucket = this.getBucket(video);
    const file = bucket.file(filename);

    try {
      console.log('Uploading file...');
      await file.save(fileBuffer, {
        resumable: false,
      });

      // Construct the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      console.log(`Public URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error(`Failed to upload file ${filename}:`, error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(filename: string, video: boolean): Promise<void> {
    const bucket = this.getBucket(video);
    try {
      await bucket.file(filename).delete();
      console.log(`File ${filename} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
      throw new Error('Failed to delete file');
    }
  }

  private getBucket(video: boolean): Bucket {
    return this.storage.bucket(
      video ? this.bucketName : this.bucketNameThumbnail,
    );
  }

  getFileUrl(filename: string, video: boolean): string {
    const bucketName = video ? this.bucketName : this.bucketNameThumbnail;
    return `https://storage.googleapis.com/${bucketName}/${filename}`;
  }

  async generateSignedUrl(
    filename: string,
    video: boolean,
    expiresInSeconds: number = 3600, // Default 1 hour expiration
  ): Promise<string> {
    const bucket = this.getBucket(video);
    const file = bucket.file(filename);

    try {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
      return url;
    } catch (error) {
      console.error(`Error generating signed URL for ${filename}:`, error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async getFileMetadata(filename: string, video: boolean): Promise<any> {
    const bucket = this.getBucket(video);
    const file = bucket.file(filename);

    try {
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error(`Error retrieving metadata for ${filename}:`, error);
      throw new Error('Failed to retrieve file metadata');
    }
  }

  async listFiles(
    video: boolean,
    startIndex: number,
    pageSize: number,
  ): Promise<any[]> {
    const bucket = this.getBucket(video);
    const [files] = await bucket.getFiles({
      maxResults: pageSize,
      autoPaginate: false,
    });

    return files.slice(startIndex, startIndex + pageSize);
  }
}
