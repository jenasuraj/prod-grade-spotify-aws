import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// An S3 object is key -> bytes. We only ever store the key in the db and sign a url when reading
@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('S3_BUCKET_NAME');
    this.s3 = new S3Client({
      region: config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
      // Otherwise presigned PUTs carry a checksum of an empty body and every browser upload fails
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }

  /** A 15 min PUT url for the browser. Type and exact size are signed, so S3 rejects anything else */
  signUpload(key: string, contentType: string, size: number) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    return getSignedUrl(this.s3, command, {
      expiresIn: 900,
      signableHeaders: new Set(['content-type']),
    });
  }

  async upload(key: string, body: Buffer, contentType: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /** Removes several objects in one request. Keys that don't exist are not an error */
  async deleteMany(keys: string[]) {
    if (!keys.length) return;
    const { Errors } = await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    // S3 reports per-key failures (e.g. AccessDenied) in the body, not as a thrown error
    if (Errors?.length) throw new Error(Errors.map((e) => `${e.Key}: ${e.Code}`).join(', '));
  }

  // The bucket stays private; this url works for 1 hour
  signedUrl(key: string) {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 3600,
    });
  }
}