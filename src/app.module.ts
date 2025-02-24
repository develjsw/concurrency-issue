import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoodsModule } from './goods/goods.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        TypeOrmModule.forRoot({
            name: 'mysql-orm',
            type: 'mysql',
            host: process.env.MYSQL_ORM_HOST,
            port: parseInt(process.env.MYSQL_ORM_PORT, 10) || 3306,
            username: process.env.MYSQL_ORM_USERNAME,
            password: process.env.MYSQL_ORM_PASSWORD,
            database: process.env.MYSQL_ORM_DB,
            entities: [__dirname + '/**/entity/*.entity{.ts,.js}'],
            synchronize: false
        }),
        GoodsModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
