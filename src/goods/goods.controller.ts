import { Body, Controller, Param, ParseIntPipe, Patch, ValidationPipe } from '@nestjs/common';
import { GoodsService } from './service/goods.service';
import { DecreaseGoodsStockDto } from './dto/decrease-goods-stock.dto';

@Controller('goods')
export class GoodsController {
    constructor(private readonly goodsService: GoodsService) {}

    @Patch(':goodsId/stocks')
    async decreaseGoodsStock(
        @Param('goodsId', ParseIntPipe) goodsId: number,
        @Body(new ValidationPipe({ transform: true })) dto: DecreaseGoodsStockDto
    ): Promise<void> {
        await this.goodsService.decreaseGoodsStock(goodsId, dto);
    }
}
