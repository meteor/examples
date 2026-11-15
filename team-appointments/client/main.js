import { provideTemporal } from 'meteor/dupontbertrand:calendar';
import '/imports/api/appointments';
import '/imports/ui/app';

import './main.html';
import './main.css';

// The calendar computes with Temporal. Browsers without it load the polyfill,
// in a chunk of its own; the others never fetch it.
provideTemporal(() => import('temporal-polyfill').then((module) => module.Temporal));
