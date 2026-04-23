import { Mongo } from "meteor/mongo";
import { createModule } from "meteor-rpc";
import { z } from "zod";

export const TasksCollection = new Mongo.Collection("tasks");

const StatusEnum = z.enum(["todo", "in-progress", "done"]);
const PriorityEnum = z.enum(["low", "medium", "high"]);

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  status: StatusEnum.optional().default("todo"),
  priority: PriorityEnum.optional().default("medium"),
});

const UpdateTaskSchema = z.object({
  _id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
});

const DeleteTaskSchema = z.object({
  _id: z.string(),
});

const FilterSchema = z
  .object({
    status: StatusEnum.optional(),
    priority: PriorityEnum.optional(),
  })
  .optional();

const _server = createModule()
  .addMethod("createTask", CreateTaskSchema, async (input) => {
    const now = new Date();
    const taskId = await TasksCollection.insertAsync({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    return taskId;
  })
  .addMethod("updateTask", UpdateTaskSchema, async ({ _id, ...fields }) => {
    await TasksCollection.updateAsync(_id, {
      $set: { ...fields, updatedAt: new Date() },
    });
    return _id;
  })
  .addMethod("removeTask", DeleteTaskSchema, async ({ _id }) => {
    await TasksCollection.removeAsync(_id);
    return _id;
  })
  .addPublication("tasks", FilterSchema, (filter) => {
    const query = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.priority) query.priority = filter.priority;
    return TasksCollection.find(query, { sort: { createdAt: -1 } });
  })
  .build();
