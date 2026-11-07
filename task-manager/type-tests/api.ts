import type { Mongo } from "meteor/mongo";
import type { TaskApi } from "../imports/api/tasks";
import type { Task } from "../imports/api/taskSchema";

type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type PublicationTask = ReturnType<TaskApi["tasks"]["usePublication"]>["data"][number];

export type PublicationIsTyped = Assert<IsAny<PublicationTask> extends false ? true : false>;
export type PublicationMatchesModel = Assert<PublicationTask extends Task ? true : false>;

declare const api: TaskApi;
declare const tasks: Mongo.Collection<Task>;
declare const task: Task;

// Optional publication schemas accept no arguments.
api.tasks.usePublication();
api.tasks.usePublication({ status: "done" });
// @ts-expect-error Publication filters use the schema enum.
api.tasks.usePublication({ status: "finished" });

// Zod input defaults are optional to callers.
api.createTask({ title: "Typed task" });
// @ts-expect-error Task titles must be strings.
api.createTask({ title: 42 });
// @ts-expect-error Status is limited to the schema's enum.
api.updateTask({ _id: "task-id", status: "finished" });
// @ts-expect-error Native collection types must preserve document field types.
tasks.insertAsync({ ...task, title: 42 });
