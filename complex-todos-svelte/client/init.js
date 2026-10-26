import {Meteor} from 'meteor/meteor';
import {log} from '/imports/shared/logger/logger.js';
import {mount, unmount} from 'svelte';
import App from '/imports/ui/App.svelte';

document.documentElement.setAttribute('data-theme', 'cerberus');

let app;

/**
 * Initialize client at startup
 * @locus client
 */
Meteor.startup(function()
{
  log.info('Client is starting');

  const target = document.getElementById('app');

  app = mount(App, {target});

  if(import.meta.hot)
  {
    import.meta.hot.accept();
    import.meta.hot.dispose(() =>
    {
      if(app)
      {
        unmount(app, {outro: false});
        app = null;
      }
      target.innerHTML = '';
    });
  }
});
