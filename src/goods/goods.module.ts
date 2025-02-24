import { Module } from '@nestjs/common';
import { GoodsController } from './goods.controller';
import { GoodsService } from './service/goods.service';
import { GoodsRepository } from './repository/goods.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsEntity } from './entity/goods.entity';
import { GoodsLockService } from './service/goods-lock.service';

@Module({
    imports: [TypeOrmModule.forFeature([GoodsEntity], 'mysql-orm')],
    controllers: [GoodsController],
    providers: [GoodsService, GoodsRepository, GoodsLockService],
    exports: []
})
export class GoodsModule {}