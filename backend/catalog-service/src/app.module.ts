import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL!),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisHost = process.env.REDIS_HOST || 'redis-service';
        if (redisHost === 'none') {
          return {
            ttl: 3600 * 1000, // 1 hour default time-to-live
          };
        }
        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            ttl: 3600 * 1000, // 1 hour default time-to-live
          }),
        };
      },
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

