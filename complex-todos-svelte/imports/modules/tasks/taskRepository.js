import {BaseRepository} from '../../shared/repository/baseRepository.js';
import {Tasks} from './database/tasks';

/** @extends {BaseRepository<import('./database/tasks').Task>} */
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