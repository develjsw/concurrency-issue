import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('goods')
export class GoodsEntity {
    @PrimaryGeneratedColumn('increment', {
        type: 'int',
        name: 'goodsId'
    })
    goodsId: number;

    @Column({
        type: 'varchar',
        name: 'goodsName'
    })
    goodsName: string;

    @Column({
        type: 'int',
        name: 'stock'
    })
    stock: number;
}
