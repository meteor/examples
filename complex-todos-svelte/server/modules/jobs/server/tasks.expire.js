import {Jobs} from 'meteor/msavin:sjobs';
import {DateUtility} from '../../../../imports/shared/utilities/dateUtility.js';
import {eventEmitter} from '../../../../imports/modules/eventEmitter/eventEmitterService.js';
import {EVENT} from '../../../../imports/shared/enums/events.js';

Jobs.register({
  'tasks.expire': function()
  {
    let date = DateUtility.beforeDays(1);
    
    eventEmitter.emit(EVENT.TASKS.EXPIRE, {maxDate: date});
  }
});
