import {log} from '../../../imports/shared/logger/logger.js';
import {_} from 'meteor/underscore';
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
  lastExecutedMigration()
  {
    let lastMigratedTo = 0;
    let migrations = migrationRepository.findOne();
    
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
      log.error(__fn, `An error occurred while parsing version ${EJSON.stringify(versionStr)}`);
      throw e;
    }
  };
  
  /**
   * Saves last executed version to db
   * @locus server
   * @param version {string}
   */
  saveLastExecutedMigration(version)
  {
    let migrations = migrationRepository.findOne();
    
    if(migrations)
    {
      migrationRepository.update({_id: migrations._id}, {
        $set: {
          version: version
        }
      });
    }
    else
    {
      migrationRepository.insert({version: version});
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
  run()
  {
    let self = this;
    
    if(this.migrationsExecuted)
    {
      log.warn(__fn, 'Migrations already executed');
      return;
    }
    
    //
    // Sort migrations using version number
    //
    let sortedArray = _.sortBy(this.migrations, (m) =>
    {
      return this._parseVersion(m.version);
    });
    
    sortedArray.forEach(function runMigration(migration)
    {
      let lastMigratedTo = self.lastExecutedMigration();
      
      let migrationVersion = self._parseVersion(migration.version);
      
      if(migrationVersion <= lastMigratedTo)
      {
        return; // No need to run this migration
      }
      
      //
      // Provided version is newer. Let's execute it...
      //
      try
      {
        log.info(__fn, `Migrating version to ${migration.version}`);
  
        let dateBeforeMigration = new Date();
        
        migration.upFunction();
  
        let dateAfterMigration = new Date();
        let timeDiff = dateAfterMigration.getTime() - dateBeforeMigration.getTime();
  
        log.info(migration.version, `Migrating version ${migration.version} completed in ${timeDiff} ms`);
        
        migrationService.saveLastExecutedMigration(migration.version);
      }
      catch(e)
      {
        log.error(__fn, e.toString());
      }
    });
    
    migrationService.finish(); // Mark as true so we don't try to execute it again!
  }
}

export const migrationService = new MigrationService();