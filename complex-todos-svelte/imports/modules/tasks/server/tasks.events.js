import {eventEmitter} from '../../eventEmitter/eventEmitterService.js';
import {EVENT} from '../../../shared/enums/events.js';
import {log} from '../../../shared/logger/logger.js';
import {taskRepository} from '../taskRepository.js';

eventEmitter.on(EVENT.TASKS.EXPIRE, ({maxDate}) =>
{
  log.debug(`Event ${EVENT.TASKS.EXPIRE} triggered`);
  
  taskRepository.updateMany({createdAt: {$lte: maxDate}}, {$set: {expired: true}});
});