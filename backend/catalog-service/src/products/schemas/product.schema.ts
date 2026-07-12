import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, unique: true, index: true })
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  stockCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  attributes: Record<string, any>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
