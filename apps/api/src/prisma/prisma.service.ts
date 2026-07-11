import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const modelNames = Object.keys(this).filter(
      (key) => !key.startsWith('_') && typeof (this as Record<string, unknown>)[key] === 'object' && (this as Record<string, unknown>)[key] !== null,
    );

    for (const modelName of modelNames) {
      const model = (this as Record<string, unknown>)[modelName] as Record<string, unknown> | undefined;
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
      }
    }
  }
}
