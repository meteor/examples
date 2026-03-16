<script>
  import {Meteor} from 'meteor/meteor';
  import {Accounts} from 'meteor/accounts-base';
  import {useTracker} from '../lib/useTracker.js';

  let username = '';
  let password = '';
  let error = '';
  let isRegistering = false;

  $: currentUser = useTracker(() => Meteor.user());

  function handleLogin()
  {
    error = '';
    Meteor.loginWithPassword(username, password, (err) =>
    {
      if(err)
      {
        error = err.reason || err.message;
      }
      else
      {
        username = '';
        password = '';
      }
    });
  }

  function handleRegister()
  {
    error = '';
    Accounts.createUser({username, password}, (err) =>
    {
      if(err)
      {
        error = err.reason || err.message;
      }
      else
      {
        username = '';
        password = '';
        isRegistering = false;
      }
    });
  }

  function handleLogout()
  {
    Meteor.logout();
  }

  function toggleMode()
  {
    isRegistering = !isRegistering;
    error = '';
  }
</script>

{#if $currentUser}
  <div class="d-flex align-items-center gap-2">
    <span class="text-muted">{$currentUser.username}</span>
    <button class="btn btn-sm btn-outline-secondary" on:click={handleLogout}>
      Sign Out
    </button>
  </div>
{:else}
  <form class="d-flex align-items-center gap-2" on:submit|preventDefault={isRegistering ? handleRegister : handleLogin}>
    <input
      type="text"
      class="form-control form-control-sm"
      placeholder="Username"
      bind:value={username}
      style="max-width: 120px"
    />
    <input
      type="password"
      class="form-control form-control-sm"
      placeholder="Password"
      bind:value={password}
      style="max-width: 120px"
    />
    <button type="submit" class="btn btn-sm btn-primary">
      {isRegistering ? 'Register' : 'Sign In'}
    </button>
    <button type="button" class="btn btn-sm btn-link" on:click={toggleMode}>
      {isRegistering ? 'Sign In' : 'Register'}
    </button>
  </form>
  {#if error}
    <div class="text-danger small mt-1">{error}</div>
  {/if}
{/if}
