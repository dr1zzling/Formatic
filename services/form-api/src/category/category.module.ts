import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { KnexModule } from 'src/database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
