import { z } from 'zod';

const OwnerIdSchema = z.string().min(1).max(100);

export const CreateNoteSchema = z.object({
  ownerId: OwnerIdSchema,
  title: z.string().min(1).max(200),
  body: z.string().optional().default(''),
});

export const UpdateNoteSchema = z.object({
  _id: z.string(),
  ownerId: OwnerIdSchema,
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const NoteIdSchema = z.object({
  _id: z.string(),
  ownerId: OwnerIdSchema,
});

export const OwnerScopedSchema = z.object({
  ownerId: OwnerIdSchema,
});
