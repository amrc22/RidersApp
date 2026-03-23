import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RidersService } from './riders.service';
import { ListRidersQueryDto } from './dto/list-riders-query.dto';
import { CreateRiderDto } from './dto/create-rider.dto';

@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get()
  list(@Query() query: ListRidersQueryDto) {
    return this.ridersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateRiderDto) {
    return this.ridersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ridersService.findOne(id);
  }

  @Get(':id/evaluation')
  evaluate(@Param('id', ParseIntPipe) id: number) {
    return this.ridersService.evaluate(id);
    return this.ridersService.evaluate(id);
  }
}
