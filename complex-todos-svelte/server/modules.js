import '/imports/modules/tasks/tasks.ensureIndexes.js';
import '/imports/modules/tasks/tasks.events.js';
import '/imports/modules/tasks/tasks.guards.js';
import '/imports/modules/tasks/tasks.publications.js';
import '/imports/modules/tasks/tasks.methods.js';
import {userCache} from '/imports/modules/users/user.cache.js';
import {setUserDetailsFetcher} from '/imports/shared/functions/user.js';

setUserDetailsFetcher(userId => userCache.get(userId));

import '/imports/modules/dummies/dummies.methods.js';
import '/imports/modules/jobs/tasks.expire.js';
import '/imports/modules/migrations/migrations.guards.js';
import '/imports/modules/migrations/1.0.1.js';
