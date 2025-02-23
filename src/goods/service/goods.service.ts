import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { GoodsRepository } from '../repository/goods.repository';
import { RedisService } from '../../redis/redis.service';
import { DecreaseGoodsStockDto } from '../dto/decrease-goods-stock.dto';
import { GoodsEntity } from '../entity/goods.entity';
import { Lock } from 'redlock';

@Injectable()
export class GoodsService {
    constructor(private readonly redisService: RedisService, private readonly goodsRepository: GoodsRepository) {}

    async decreaseGoodsStock(goodsId: number, dto: DecreaseGoodsStockDto): Promise<void> {
        const goods: GoodsEntity = await this.goodsRepository.findGoodsById(goodsId);

        if (!goods) {
            throw new NotFoundException('일치하는 상품이 존재하지 않습니다.');
        }

        const updateStock = goods.stock - dto.stock;
        if (updateStock < 0) {
            throw new BadRequestException('기존 상품 재고보다 많은 재고를 소진할 수는 없습니다.');
        }

        let lock: Lock;

        try {
            // Redis Lock 획득
            lock = await this.redisService.acquireLock(`goods-stock-count:${goodsId}`, 10000);
            console.log(lock);

            // 재고 Update 진행
            await this.goodsRepository.updateGoodsById(goodsId, { stock: updateStock });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('재고 소진작업 중 에러가 발생했습니다.');
            /*
                acquireLock 함수의 매개변수인 lockTTLMs 값을 통해
                일정시간 이후 만료되어 자동 Lock이 해제되긴 하지만,
                작업이 완료되었으므로(성공/실패) Lock을 명시적으로 해제시켜 줌
            */
        } /* finally {
            console.log('Lock이 해제되었습니다.');
            await lock.release();
        }*/
    }
}
