import {Tasks} from './database/tasks';

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