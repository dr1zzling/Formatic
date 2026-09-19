import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from "./jwt.auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { KnexModule } from "../database/knex.module";

@Module({
    imports: [
        PassportModule,
        KnexModule,
        JwtModule.register({
            secret: process.env.SECRET || "SST",
            signOptions: { expiresIn: '365d'}
        })
    ],
    providers: [JwtStrategy, JwtAuthGuard],
    exports: [JwtAuthGuard, JwtModule, PassportModule]
})


export class AuthModule {}