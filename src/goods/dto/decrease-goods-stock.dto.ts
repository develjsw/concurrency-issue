import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DecreaseGoodsStockDto {
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    stock: number;
}
