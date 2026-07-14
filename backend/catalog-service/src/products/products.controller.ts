import { Controller, Get, Post, Patch, Body, Param, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }
    return product;
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

