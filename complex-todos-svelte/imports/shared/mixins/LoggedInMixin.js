/**
 * Mixin for validated methods
 * @param methodOptions {object}
 * @returns {*}
 * @constructor
 */
export const LoggedInMixin = function(methodOptions)
{
  const runFunction = methodOptions.run;
  
  methodOptions.run = function()
  {
    if(!this.userId)
    {
      throw new Meteor.Error(`Only users can run this`);
    }
    
    return runFunction.call(this, ...arguments);
  };
  
  return methodOptions;
};