import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactEntity } from "./contact.entity";

@Module({
  imports: [ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("HOST"),
        port: +configService.get("PORT"),
        username: configService.get("USERNAME"),
        password: configService.get("PASSWORD"),
        database: configService.get("DATABASE"),
        entities: [
          ContactEntity
        ],
        logging: true
      }),
      inject: [ConfigService]
    }), TypeOrmModule.forFeature([
      ContactEntity
    ])],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}
