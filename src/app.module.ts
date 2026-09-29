import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HotelsService } from './hotels/hotels.service';
import { HotelsController } from './hotels/hotels.controller';
import { HotelsModule } from './hotels/hotels.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
    HotelsModule],
  controllers: [AppController, HotelsController],
  providers: [AppService, HotelsService, RedisService],
})
export class AppModule { }