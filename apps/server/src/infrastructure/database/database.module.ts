import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.getOrThrow<string>("DB_HOST"),
        port: configService.getOrThrow<number>("DB_PORT"),
        username: configService.getOrThrow<string>("DB_USERNAME"),
        password: configService.getOrThrow<string>("DB_PASSWORD"),
        database: configService.getOrThrow<string>("DB_DATABASE"),
        autoLoadEntities: true,
        synchronize: configService.get("NODE_ENV") === "development",
        migrationsRun: false,
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
  ],
})
export class DatabaseModule {}
