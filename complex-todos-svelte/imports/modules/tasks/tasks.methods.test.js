import {assert} from 'chai';
import {taskRepository} from './taskRepository.js';
import {tasksInsert, tasksRemove, tasksUpdateAsChecked} from './tasks.methods.js';
import {UNIT_TEST} from '../../../tests/enums/users.js';

describe('Tasks methods', () =>
{
  const userId = UNIT_TEST.USER_ID;
  let taskId;

  beforeEach(async function()
  {
    await taskRepository.remove({});
  });

  it('tasksInsert', async () =>
  {
    const context = {userId};
    const args = {text: 'new task'};

    await tasksInsert.call(context, args);

    assert.equal(await taskRepository.count(), 1);
  });

  it('tasksRemove', async () =>
  {
    const context = {userId};

    taskId = await taskRepository.insert({
      text: 'test task',
      createdAt: new Date(),
      owner: userId,
      username: 'john doe'
    });

    const args = {taskId};

    await tasksRemove.call(context, args);

    assert.equal(await taskRepository.count(), 0);
  });

  it('tasksUpdateAsChecked', async () =>
  {
    const context = {userId};

    taskId = await taskRepository.insert({
      text: 'test task',
      createdAt: new Date(),
      owner: userId,
      username: 'john doe'
    });

    const args = {
      taskId: taskId,
      setChecked: true
    };

    await tasksUpdateAsChecked.call(context, args);

    let task = await taskRepository.findOne(taskId);

    assert.equal(task.checked, true);
  });
});
