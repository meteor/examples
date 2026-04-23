import {log} from '../../shared/logger/logger.js';
import {migrationRepository} from './migrationRepository.js';
import {EJSON} from 'meteor/ejson';

/**
 * Migration service to change database or any other data
 * @locus server
 */
class MigrationService
{
  /**
   * @constructor
   * @locus server
   */
  constructor()
  {
    this.migrationsExecuted = false;
    
    this.migrations = [];
  }
  
  /**
   * Returns last executed migration version from db
   * @locus server
   * @returns {number}
   */
  async lastExecutedMigration()
  {
    let lastMigratedTo = 0;
    let migrations = await migrationRepository.findOne();

    if(migrations)
    {
      lastMigratedTo = this._parseVersion(migrations.version);
    }

    return lastMigratedTo;
  }
  
  /**
   * @locus server
   * @param versionStr {string}
   * @returns {number}
   * @private
   */
  _parseVersion = function(versionStr)
  {
    try
    {
      let parts = versionStr.split('.');
      
      if(parts.length !== 3)
      {
        throw new Meteor.Error(`Provided version number ${versionStr} doesn't have 3 parts`);
      }
      
      let major = parseInt(parts[0]);
      let minor = parseInt(parts[1]);
      let build = parseInt(parts[2]);
      
      return major * 1000000 + minor * 1000 + build;
    }
    catch(e)
    {
      log.error('MigrationService._parseVersion', `An error occurred while parsing version ${EJSON.stringify(versionStr)}`);
      throw e;
    }
  };
  
  /**
   * Saves last executed version to db
   * @locus server
   * @param version {string}
   */
  async saveLastExecutedMigration(version)
  {
    let migrations = await migrationRepository.findOne();

    if(migrations)
    {
      await migrationRepository.update({_id: migrations._id}, {
        $set: {
          version: version
        }
      });
    }
    else
    {
      await migrationRepository.insert({version: version});
    }
  }
  
  /**
   * Adds a new migration for provided version number
   * @locus server
   * @param version {string}
   * @param upFunction {function}
   */
  addMigration(version, upFunction)
  {
    let migrationObject = {version: version, upFunction: upFunction};
    
    this.migrations.push(migrationObject);
  }
  
  /**
   * Marks migrations as finished so that we don't try to run again
   * @locus server
   */
  finish()
  {
    this.migrationsExecuted = true;
  }
  
  /**
   * Executes provided migrations
   * @locus server
   */
  async run()
  {
    if(this.migrationsExecuted)
    {
      log.warn('MigrationService.run', 'Migrations already executed');
      return;
    }

    //
    // Sort migrations using version number
    //
    let sortedArray = [...this.migrations].sort((a, b) =>
    {
      return this._parseVersion(a.version) - this._parseVersion(b.version);
    });

    for(const migration of sortedArray)
    {
      let lastMigratedTo = await this.lastExecutedMigration();

      let migrationVersion = this._parseVersion(migration.version);

      if(migrationVersion <= lastMigratedTo)
      {
        continue; // No need to run this migration
      }

      //
      // Provided version is newer. Let's execute it...
      //
      try
      {
        log.info('MigrationService.run', `Migrating version to ${migration.version}`);

        let dateBeforeMigration = new Date();

        await migration.upFunction();

        let dateAfterMigration = new Date();
        let timeDiff = dateAfterMigration.getTime() - dateBeforeMigration.getTime();

        log.info(migration.version, `Migrating version ${migration.version} completed in ${timeDiff} ms`);

        await migrationService.saveLastExecutedMigration(migration.version);
      }
      catch(e)
      {
        log.error('MigrationService.run', e.toString());
      }
    }

    migrationService.finish(); // Mark as true so we don't try to execute it again!
  }
}

export const migrationService = new MigrationService();