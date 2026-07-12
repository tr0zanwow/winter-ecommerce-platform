import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<ProductDocument[]> {
    try {
      const cachedData = await this.cacheManager.get<any>('all_active_products');
      if (cachedData) {
        return typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      }
    } catch (error) {
      console.error('Redis cache-aside get error:', error);
    }

    const products = await this.productModel.find({ isActive: true }).exec();

    try {
      await this.cacheManager.set('all_active_products', JSON.stringify(products));
    } catch (error) {
      console.error('Redis cache-aside set error:', error);
    }

    return products;
  }

  async create(dto: any): Promise<ProductDocument> {
    const product = await new this.productModel(dto).save();
    try {
      await this.cacheManager.del('all_active_products');
    } catch (error) {
      console.error('Redis cache-aside delete error:', error);
    }
    return product;
  }
}


