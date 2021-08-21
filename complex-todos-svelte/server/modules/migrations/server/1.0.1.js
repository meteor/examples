import {migrationService} from '../migrationService.js';
import {log} from '../../../../imports/shared/logger/logger.js';

const version = '1.0.1';
const migrationName = 'A log for migration';

migrationService.addMigration(version, () =>
{
  log.info(version, migrationName);
});