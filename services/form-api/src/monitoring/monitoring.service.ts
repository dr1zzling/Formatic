import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';
import { ValidateIsCreator } from 'src/Pipe/validate.is.creator';

@Injectable()
export class MonitoringService {
    constructor(private knexService: KnexService, private isCreator: ValidateIsCreator){}

    // Get All Monitor
    async monitoringSubmit(req: { id: number }, form: any) {
        const checkRole = await this.isCreator.isCreator(req.id, form.id)
        if (checkRole === false) throw new ForbiddenException("Anda Tidak Berhak")

        const getAllStatusSubmit = await this.knexService.connection("form_submit")
            .select("user_id", "user_username", "start_at", "submitted_at", "status", "attemps")
            .where({ form_id: form.id })

        return {
            message: "Berhasil mendapatkan status submit",
            status: getAllStatusSubmit
        }
    }

    // Reset user
    async resetUser(req: { id: number }, form: any, user_id: number){
        const checkRole = await this.isCreator.isCreator(req.id, form.id)
        if (checkRole === false) throw new ForbiddenException("Anda Tidak Berhak")
        
        const getStatus = await this.knexService.connection("form_submit")
        .select("status")
        .where({ user_id: user_id, form_id: form.id})
        .first()

        if(!getStatus) throw new NotFoundException("Tidak Ada User Tersebut")
        if(getStatus.status != "progress") throw new BadRequestException("Reset hanya untuk progress")

        const resetUser = await this.knexService.connection("form_submit")
        .update({ status: "reset" })
        .where({ user_id: user_id, form_id: form.id })

        return {
            message: "Berhasil Reset"
        }
    }

}