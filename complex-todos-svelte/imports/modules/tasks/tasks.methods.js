import {ValidatedMethod} from 'meteor/mdg:validated-method';
import SimpleSchema from 'simpl-schema';
import {taskService} from './taskService.js';
import {LoggedInMixin} from '../../shared/mixins/LoggedInMixin.js';
import {TASKS_METHOD} from './enums/methodNames.js';

/**
 * @type {ValidatedMethod}
 */
export const tasksInsert = new ValidatedMethod({
  name: TASKS_METHOD.INSERT,
  mixins: [LoggedInMixin],
  validate: new SimpleSchema({
    text: {type: String}
  }).validator(),
  /**
   * @param text {string}
   * @returns {string}
   */
  run({text})
  {
    return taskService.insert(text);
  }
});

/**
 * @type {ValidatedMethod}
 */
export const tasksRemove = new ValidatedMethod({
  name: TASKS_METHOD.REMOVE,
  mixins: [LoggedInMixin],
  validate: new SimpleSchema({
    taskId: {type: String}
  }).validator(),
  /**
   * @param taskId {string}
   */
  run({taskId})
  {
    taskService.remove(taskId);
  }
});

/**
 * @type {ValidatedMethod}
 */
export const tasksUpdateAsChecked = new ValidatedMethod({
  name: TASKS_METHOD.UPDATE_AS_CHECKED,
  mixins: [LoggedInMixin],
  validate: new SimpleSchema({
    taskId: {type: String},
    setChecked: {type: Boolean}
  }).validator(),
  /**
   * @param taskId {string}
   * @param setChecked {boolean}
   */
  run({taskId, setChecked})
  {
    taskService.updateAsChecked(taskId, setChecked);
  }
});

/**
 * @type {ValidatedMethod}
 */
export const tasksUpdateAsPrivate = new ValidatedMethod({
  name: TASKS_METHOD.UPDATE_AS_PRIVATE,
  mixins: [LoggedInMixin],
  validate: new SimpleSchema({
    taskId: {type: String},
    setPrivate: {type: Boolean}
  }).validator(),
  /**
   * @param taskId {string}
   * @param setPrivate {boolean}
   */
  run({taskId, setPrivate})
  {
    taskService.updateAsPrivate(taskId, setPrivate);
  }
});