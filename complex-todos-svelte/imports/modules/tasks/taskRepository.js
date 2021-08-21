import {BaseRepository} from '../../shared/repository/baseRepository.js';
import {Tasks} from './database/tasks.js';

class TaskRepository extends BaseRepository
{
  /**
   * @constructor
   */
  constructor()
  {
    super(Tasks);
  }
}

export const taskRepository = new TaskRepository();