import {taskRepository} from './taskRepository.js';
import {Meteor} from 'meteor/meteor';
import {User} from '../../shared/functions/user.js';

class TaskService
{
  /**
   * @param taskId {string}
   * @returns {*}
   */
  async getTask(taskId)
  {
    return taskRepository.findOne(taskId);
  }

  /**
   * @param text {string}
   * @returns {Promise<string>}
   */
  async insert(text)
  {
    const userDetails = await User.getDetailsAsync();
    return taskRepository.insert({
      text,
      createdAt: new Date(),
      owner: User._id,
      username: userDetails.username
    });
  }

  /**
   * @param taskId
   */
  async remove(taskId)
  {
    const task = await this.getTask(taskId);

    if(task.private && task.owner !== User._id)
    {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }

    await taskRepository.remove(taskId);
  }

  /**
   * @param taskId {string}
   * @param setChecked
   */
  async updateAsChecked(taskId, setChecked)
  {
    const task = await this.getTask(taskId);

    if(task.private && task.owner !== User._id)
    {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }

    await taskRepository.update(taskId, {$set: {checked: setChecked}});
  }

  /**
   * @param taskId {string}
   * @param setPrivate {boolean}
   */
  async updateAsPrivate(taskId, setPrivate)
  {
    const task = await this.getTask(taskId);

    // Make sure only the task owner can make a task private
    if(task.owner !== User._id)
    {
      throw new Meteor.Error('not-authorized');
    }

    await taskRepository.update(taskId, {$set: {private: setPrivate}});
  }
}

export const taskService = new TaskService();