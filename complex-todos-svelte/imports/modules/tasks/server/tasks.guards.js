import {Tasks} from '../database/tasks.js';

Tasks.allow({
  insert()
  {
    return false;
  },
  update()
  {
    return false;
  },
  remove()
  {
    return false;
  }
});