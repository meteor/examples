import {taskRepository} from './taskRepository.js';
import {Meteor} from 'meteor/meteor';
import {User} from '../../shared/functions/user.js';

class TaskService
{
  /**
   * @param taskId {string}
   * @returns {*}
   */
  getTask(taskId)
  {
    return taskRepository.findOne(taskId);
  }
  
  /**
   * @param text {string}
   * @returns {string}
   */
  insert(text)
  {
    return taskRepository.insert({
      text,
      createdAt: new Date(),
      owner: User._id,
      username: User.details.username
    });
  }
  
  /**
   * @param taskId
   */
  remove(taskId)
  {
    const task = this.getTask(taskId);
    
    if(task.private && task.owner !== User._id)
    {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }
    
    taskRepository.remove(taskId);
  }
  
  /**
   * @param taskId {string}
   * @param setChecked
   */
  updateAsChecked(taskId, setChecked)
  {
    const task = this.getTask(taskId);
    
    if(task.private && task.owner !== User._id)
    {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }
    
    taskRepository.update(taskId, {$set: {checked: setChecked}});
  }
  
  /**
   * @param taskId {string}
   * @param setPrivate {boolean}
   */
  updateAsPrivate(taskId, setPrivate)
  {
    const task = this.getTask(taskId);
    
    // Make sure only the task owner can make a task private
    if(task.owner !== User._id)
    {
      throw new Meteor.Error('not-authorized');
    }
    
    taskRepository.update(taskId, {$set: {private: setPrivate}});
  }
}

export const taskService = new TaskService();