import {BaseRepository} from '../../../imports/shared/repository/baseRepository.js';
import {Migrations} from './database/migrations.js';

/**
 * @locus server
 */
class MigrationRepository extends BaseRepository
{
  /**
   * @constructor
   * @locus server
   */
  constructor()
  {
    super(Migrations);
  }
}

export const migrationRepository = new MigrationRepository();