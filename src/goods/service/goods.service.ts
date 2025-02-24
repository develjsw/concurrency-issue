import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GoodsRepository } from '../repository/goods.repository';
import { DecreaseGoodsStockDto } from '../dto/decrease-goods-stock.dto';
import { GoodsEntity } from '../entity/goods.entity';
import { GoodsLockService } from './goods-lock.service';

@Injectable()
export class GoodsService {
    constructor(
        private readonly goodsRepository: GoodsRepository,
        private readonly goodsLockService: GoodsLockService
    ) {}

    async decreaseGoodsStock(goodsId: number, dto: DecreaseGoodsStockDto): Promise<void> {
        const goods: GoodsEntity = await this.goodsRepository.findGoodsById(goodsId);

        if (!goods) {
            throw new NotFoundException('일치하는 상품이 존재하지 않습니다.');
        }

        const updateStock: number = goods.stock - dto.stock;
        if (updateStock < 0) {
            throw new BadRequestException('기존 상품 재고보다 많은 재고를 소진할 수는 없습니다.');
        }

        await this.goodsLockService.withLock(
            goodsId,
            1000 * 60 * 2,
            async () => await this.goodsRepository.updateGoodsById(goodsId, { stock: updateStock })
        );
    }
}
