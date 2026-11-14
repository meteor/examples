import { Mongo } from "meteor/mongo";
import { createModule } from "meteor-rpc";

import {
  CreateTaskSchema,
  DeleteTaskSchema,
  FilterSchema,
  type Task,
  UpdateTaskSchema,
} from "./taskSchema";

export const TasksCollection = new Mongo.Collection<Task>("tasks");

const server = createModule()
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
    const query: Mongo.Selector<Task> = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.priority) query.priority = filter.priority;
    return TasksCollection.find(query, { sort: { createdAt: -1 } });
  })
  .build();

export type TaskApi = typeof server;
