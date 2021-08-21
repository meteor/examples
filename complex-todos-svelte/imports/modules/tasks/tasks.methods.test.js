import {assert} from 'chai';
import {taskRepository} from './taskRepository.js';
import {tasksInsert, tasksRemove, tasksUpdateAsChecked} from './tasks.methods.js';
import {UNIT_TEST} from '../../../tests/enums/users.js';

describe('Tasks methods', () =>
{
  const userId = UNIT_TEST.USER_ID;
  let taskId;
  
  beforeEach(function()
  {
    taskRepository.remove({});
  });
  
  it('tasksInsert', () =>
  {
    // Set up method arguments and context
    const context = {userId};
    
    const args = {text: 'new task'};
    
    // Execute the method
    tasksInsert._execute(context, args);
    
    // Verify that the method does what we expected
    assert.equal(taskRepository.find().count(), 1);
  });
  
  it('tasksRemove', () =>
  {
    // Set up method arguments and context
    const context = {userId};
    
    taskId = taskRepository.insert({
      text: 'test task',
      createdAt: new Date(),
      owner: userId,
      username: 'john doe'
    });
    
    const args = {taskId};
    
    // Execute the method
    tasksRemove._execute(context, args);
    
    // Verify that the method does what we expected
    assert.equal(taskRepository.find().count(), 0);
  });
  
  it('tasksUpdateAsChecked', () =>
  {
    // Set up method arguments and context
    const context = {userId};
  
    taskId = taskRepository.insert({
      text: 'test task',
      createdAt: new Date(),
      owner: userId,
      username: 'john doe'
    });
  
    const args = {
      taskId: taskId,
      setChecked: true
    };
  
    // Execute the method
    tasksUpdateAsChecked._execute(context, args);
    
    let task = taskRepository.findOne(taskId);
  
    // Verify that the method does what we expected
    assert.equal(task.checked, true);
  });
});