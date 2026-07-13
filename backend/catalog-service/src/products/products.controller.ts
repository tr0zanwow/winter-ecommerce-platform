import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Post()
  async create(@Body() dto: any) {
    return this.productsService.create(dto);
  }

  @Patch('decrement-stock')
  async decrementStock(@Body() items: { sku: string; quantity: number }[]) {
    for (const item of items) {
      await this.productsService.decrementStock(item.sku, item.quantity);
    }
    return { success: true };
  }
}

