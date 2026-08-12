import { Injectable, UnauthorizedException } from "@nestjs/common";
import { KnexService } from "src/database/knex.service";
import { ValidateIsCreator } from "src/Pipe/validate.is.creator";

@Injectable()
export class SubmitService{
  constructor(private knexService: KnexService, private isCreator: ValidateIsCreator) {}
  
  // Get All Submit By Form
  async getAllSubmitByForm(req: { id: number }, form){
    // const checkRole = await this.isCreator.isCreator(req.id, form.id)
    // if(checkRole == false) throw new UnauthorizedException("Anda Tidak Berhak")
    
    const 
  }
}