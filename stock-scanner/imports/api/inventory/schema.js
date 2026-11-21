import { Meteor } from 'meteor/meteor';
import { z } from 'zod';

export const CATEGORIES = [
  'Hardware',
  'Grocery',
  'Pharmacy',
  'Electronics',
  'Apparel',
  'Other',
];

const OwnerIdSchema = z.string().min(1).max(100);
const ItemIdSchema = z.string().min(1);
const SkuSchema = z.string().trim().min(1).max(64);
const NameSchema = z.string().trim().min(1).max(80);
const CategorySchema = z.enum(CATEGORIES).default('Other');
const CountSchema = z.number().int().min(0).max(99999);

export const ScanSkuSchema = z.object({
  ownerId: OwnerIdSchema,
  sku: SkuSchema,
});

export const AdjustStockSchema = z.object({
  ownerId: OwnerIdSchema,
  itemId: ItemIdSchema,
  delta: z.number().int().min(-9999).max(9999),
});

export const UpdateItemSchema = z.object({
  ownerId: OwnerIdSchema,
  itemId: ItemIdSchema,
  name: NameSchema,
  category: CategorySchema,
  minStock: CountSchema,
});

export function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw new Meteor.Error(
    'validation-error',
    result.error.issues.map((issue) => issue.message).join(', ')
  );
}
