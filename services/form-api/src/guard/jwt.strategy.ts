import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { KnexService } from '../database/knex.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private readonly knexService: KnexService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SECRET || "SSST"
        })
    }    

    async validate(payload: { id?: number; username?: string }){
        const user = await this.knexService.userConnection('users')
            .select('id', 'username')
            .where({ id: payload.id, username: payload.username })
            .first()

        if (!user) {
            throw new UnauthorizedException('Token tidak sesuai dengan data user')
        }

        return {
            id: user.id,
            username: user.username
        }
    }
}