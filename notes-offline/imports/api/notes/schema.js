import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().optional().default(''),
});

export const UpdateNoteSchema = z.object({
  _id: z.string(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const NoteIdSchema = z.object({
  _id: z.string(),
});
