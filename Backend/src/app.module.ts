import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RidersModule } from './riders/riders.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RidersModule,
    DeliveriesModule,
    SummaryModule,
  ],
})
export class AppModule {}
