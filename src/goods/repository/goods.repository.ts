import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GoodsEntity } from '../entity/goods.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GoodsRepository {
    constructor(
        @InjectRepository(GoodsEntity, 'mysql-orm')
        private readonly goodsRepository: Repository<GoodsEntity>
    ) {}

    async findGoodsById(goodsId: number): Promise<GoodsEntity> {
        return await this.goodsRepository.findOneBy({
            goodsId
        });
    }

    async updateGoodsById(goodsId: number, data: Partial<GoodsEntity>): Promise<void> {
        await this.goodsRepository.update(goodsId, {
            ...data
        });
    }
}
