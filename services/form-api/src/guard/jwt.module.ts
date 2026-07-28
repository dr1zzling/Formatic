import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from "./jwt.auth.guard";
import { JwtStrategy } from "./jwt.strategy";

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.SECRET || "SST",
            signOptions: { expiresIn: '365d'}
        })
    ],
    providers: [JwtStrategy, JwtAuthGuard],
    exports: [JwtAuthGuard, JwtModule, PassportModule]
})


export class AuthModule {}