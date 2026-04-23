import {createMethod} from 'meteor/jam:method';
import {z} from 'zod';
import {taskService} from './taskService.js';
import {TASKS_METHOD} from './enums/methodNames.js';
import {RATE_LIMITER} from './enums/rateLimitter.js';

const rateLimit = {
  limit: RATE_LIMITER.REQUEST_COUNT,
  interval: RATE_LIMITER.TIME_INTERVAL
};

export const tasksInsert = createMethod({
  name: TASKS_METHOD.INSERT,
  schema: z.object({
    text: z.string()
  }),
  rateLimit,
  async run({text})
  {
    return taskService.insert(text);
  }
});

export const tasksRemove = createMethod({
  name: TASKS_METHOD.REMOVE,
  schema: z.object({
    taskId: z.string()
  }),
  rateLimit,
  async run({taskId})
  {
    return taskService.remove(taskId);
  }
});

export const tasksUpdateAsChecked = createMethod({
  name: TASKS_METHOD.UPDATE_AS_CHECKED,
  schema: z.object({
    taskId: z.string(),
    setChecked: z.boolean()
  }),
  rateLimit,
  async run({taskId, setChecked})
  {
    return taskService.updateAsChecked(taskId, setChecked);
  }
});

export const tasksUpdateAsPrivate = createMethod({
  name: TASKS_METHOD.UPDATE_AS_PRIVATE,
  schema: z.object({
    taskId: z.string(),
    setPrivate: z.boolean()
  }),
  rateLimit,
  async run({taskId, setPrivate})
  {
    return taskService.updateAsPrivate(taskId, setPrivate);
  }
});
