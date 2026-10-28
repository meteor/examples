import { z } from "zod";

export const StatusEnum = z.enum(["todo", "in-progress", "done"]);
export const PriorityEnum = z.enum(["low", "medium", "high"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  status: StatusEnum.optional().default("todo"),
  priority: PriorityEnum.optional().default("medium"),
});

export type Task = z.output<typeof CreateTaskSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const UpdateTaskSchema = z.object({
  _id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
});

export const DeleteTaskSchema = z.object({
  _id: z.string(),
});

export const FilterSchema = z
  .object({
    status: StatusEnum.optional(),
    priority: PriorityEnum.optional(),
  })
  .optional();
