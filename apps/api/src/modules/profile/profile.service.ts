import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { S3Service } from '../../infra/s3/s3.service.js';

export const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const PERSON_SELECT = { name: true, profile: { select: { displayName: true } } } as const;

type Person = Prisma.UserGetPayload<{ select: typeof PERSON_SELECT }>;

const followsKey = (name: string) => `profile:${name}:follows`;

const toPerson = ({ name, profile }: Person) => ({
  name,
  displayName: profile?.displayName ?? null,
});

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly redis: RedisService,
  ) {}

  // Public GET /profile/:name, cached for 10 min (less than the 1h signed avatar url).
  // Redis errors fall through to the db so the page still works if Redis is down
  async getByName(name: string) {
    const key = `profile:${name}`;
    const cached = await this.redis.get(key).catch(() => null);
    if (cached) return JSON.parse(cached) as Awaited<ReturnType<ProfileService['get']>>;

    const data = await this.get({ name });
    await this.redis.set(key, JSON.stringify(data), 'EX', 600).catch(() => null);
    return data;
  }

  // A user who never edited their profile gets profile: null
  async get(where: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({
      where,
      select: { name: true, profile: true },
    });
    if (!user) throw new NotFoundException('Profile not found');

    if (!user.profile) return { name: user.name, avatarUrl: null, profile: null };
    const { id: _id, userId: _userId, avatarKey, ...profile } = user.profile;
    return {
      name: user.name,
      avatarUrl: avatarKey ? await this.s3.signedUrl(avatarKey) : null,
      profile,
    };
  }

  /** Who the user follows and who follows them, cached until either list changes */
  async getFollows(name: string) {
    const cached = await this.redis.get(followsKey(name)).catch(() => null);
    if (cached) return JSON.parse(cached) as Awaited<ReturnType<ProfileService['loadFollows']>>;
    const data = await this.loadFollows(name);
    await this.redis.set(followsKey(name), JSON.stringify(data), 'EX', 600).catch(() => null);
    return data;
  }

  /** Follows the user, or unfollows if you already do */
  async toggleFollow(followerId: number, name: string) {
    const [target, me] = await Promise.all([
      this.prisma.user.findUnique({ where: { name }, select: { id: true } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: followerId }, select: { name: true } }),
    ]);
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) throw new BadRequestException("You can't follow yourself");
    const pair = { followerId, followingId: target.id };
    const { count } = await this.prisma.follow.deleteMany({ where: pair });
    // skipDuplicates: a double click racing two inserts still ends with one follow
    if (!count) await this.prisma.follow.createMany({ data: pair, skipDuplicates: true });
    // Both lists changed: their followers and your following
    await this.redis.del(followsKey(name), followsKey(me.name)).catch(() => null);
    return { following: !count };
  }

  async update(userId: number, dto: UpdateProfileDto) {
    await this.prisma.profile.upsert({
      where: { userId },
      create: Object.assign({ userId }, dto),
      update: dto,
    });
    return this.fresh(userId);
  }

  // After a write: read the new profile and drop the cached copy
  private async fresh(userId: number) {
    const data = await this.get({ id: userId });
    await this.redis.del(`profile:${data.name}`).catch(() => null);
    return data;
  }

  // Key = avatars/<userId>/<uuid>.<ext>: unique, and you can tell whose it is from the key alone
  async uploadAvatar(userId: number, file: Express.Multer.File) {
    const key = `avatars/${userId}/${randomUUID()}.${AVATAR_TYPES[file.mimetype]}`;

    // Upload first, so the db never points at an object that doesn't exist
    await this.s3.upload(key, file.buffer, file.mimetype);

    const old = await this.prisma.profile.findUnique({
      where: { userId },
      select: { avatarKey: true },
    });
    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarKey: key },
      update: { avatarKey: key },
    });

    // The old picture is no longer referenced; a failed delete only leaves a stray file
    if (old?.avatarKey) {
      await this.s3
        .delete(old.avatarKey)
        .catch((err: Error) =>
          this.logger.warn(`Could not delete ${old.avatarKey}: ${err.message}`),
        );
    }
    return this.fresh(userId);
  }

  private async loadFollows(name: string) {
    const user = await this.prisma.user.findUnique({
      where: { name },
      select: {
        following: {
          orderBy: { createdAt: 'desc' },
          select: { following: { select: PERSON_SELECT } },
        },
        followers: {
          orderBy: { createdAt: 'desc' },
          select: { follower: { select: PERSON_SELECT } },
        },
      },
    });
    if (!user) throw new NotFoundException('Profile not found');
    const following = user.following.map((follow) => toPerson(follow.following));
    const followers = user.followers.map((follow) => toPerson(follow.follower));
    return {
      followingCount: following.length,
      followerCount: followers.length,
      following,
      followers,
    };
  }
}
