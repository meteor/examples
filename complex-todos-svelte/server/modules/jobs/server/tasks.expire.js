import {DateUtility} from '../../../../imports/shared/utilities/dateUtility.js';
import {eventEmitter} from '../../../../imports/modules/eventEmitter/eventEmitterService.js';
import {EVENT} from '../../../../imports/shared/enums/events.js';

/**
 * Expire tasks older than 1 day
 */
export function runTasksExpire()
{
  let date = DateUtility.beforeDays(1);
  eventEmitter.emit(EVENT.TASKS.EXPIRE, {maxDate: date});
}
