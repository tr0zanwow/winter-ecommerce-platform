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

  async findBySlug(slug: string): Promise<ProductDocument | null> {
    try {
      const cacheKey = `product_slug_${slug}`;
      const cachedData = await this.cacheManager.get<any>(cacheKey);
      if (cachedData) {
        return typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      }
    } catch (error) {
      console.error('Redis cache-aside get error:', error);
    }

    const product = await this.productModel.findOne({ slug, isActive: true }).exec();

    if (product) {
      try {
        const cacheKey = `product_slug_${slug}`;
        await this.cacheManager.set(cacheKey, JSON.stringify(product));
      } catch (error) {
        console.error('Redis cache-aside set error:', error);
      }
    }

    return product;
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

  async decrementStock(sku: string, quantity: number): Promise<any> {
    const productBefore = await this.productModel.findOne({ sku }).exec();
    const result = await this.productModel.updateOne({ sku }, { $inc: { stockCount: -quantity } }).exec();
    try {
      await this.cacheManager.del('winter_catalog_active_products');
      await this.cacheManager.del('all_active_products');
      if (productBefore?.slug) {
        await this.cacheManager.del(`product_slug_${productBefore.slug}`);
      }
    } catch (error) {
      console.error('Redis cache eviction error:', error);
    }
    return result;
  }
}


