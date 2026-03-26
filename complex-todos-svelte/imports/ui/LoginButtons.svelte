<script>
  import {Meteor} from 'meteor/meteor';
  import {Accounts} from 'meteor/accounts-base';
  import {useTracker} from './lib/useTracker.js';
  import {Dialog} from '@skeletonlabs/skeleton-svelte';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let isRegistering = $state(false);

  const currentUser = useTracker(() => Meteor.user());

  function handleSubmit(event) {
    event.preventDefault();
    error = '';

    if (isRegistering) {
      Accounts.createUser({username, password}, (err) => {
        if (err) {
          error = err.reason || err.message;
        } else {
          resetForm();
        }
      });
    } else {
      Meteor.loginWithPassword(username, password, (err) => {
        if (err) {
          error = err.reason || err.message;
        } else {
          resetForm();
        }
      });
    }
  }

  function resetForm() {
    username = '';
    password = '';
    error = '';
    isRegistering = false;
  }

  function handleLogout() {
    Meteor.logout();
  }

  function toggleMode() {
    isRegistering = !isRegistering;
    error = '';
  }
</script>

{#if $currentUser}
  <div class="flex items-center gap-2">
    <span class="badge preset-tonal-primary" data-testid="logged-in-user">{$currentUser.username}</span>
    <button class="btn btn-sm preset-tonal-error" data-testid="sign-out-btn" onclick={handleLogout}>
      Sign Out
    </button>
  </div>
{:else}
  <Dialog>
    <Dialog.Trigger>
      <button class="btn btn-sm preset-filled-primary-500" data-testid="open-sign-in-btn">Sign In</button>
    </Dialog.Trigger>
    <Dialog.Backdrop class="fixed inset-0 bg-black/50 z-40" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center z-50">
      <Dialog.Content class="card preset-filled-surface-100-900 p-6 w-full max-w-sm shadow-xl space-y-4">
        <Dialog.Title class="h4 text-center">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </Dialog.Title>
        <Dialog.Description class="text-sm text-center opacity-70">
          {isRegistering ? 'Register a new account to get started.' : 'Sign in to manage your tasks.'}
        </Dialog.Description>

        <form class="space-y-3" onsubmit={handleSubmit}>
          <label class="block space-y-1">
            <span class="text-sm font-medium">Username</span>
            <input
              type="text"
              class="input w-full"
              placeholder="Enter your username"
              data-testid="username-input"
              bind:value={username}
            />
          </label>
          <label class="block space-y-1">
            <span class="text-sm font-medium">Password</span>
            <input
              type="password"
              class="input w-full"
              placeholder="Enter your password"
              data-testid="password-input"
              bind:value={password}
            />
          </label>

          {#if error}
            <div class="text-error-500 text-sm text-center" data-testid="auth-error">{error}</div>
          {/if}

          <button type="submit" class="btn preset-filled-primary-500 w-full" data-testid="submit-auth-btn">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div class="text-center">
          <button type="button" class="btn btn-sm preset-tonal-surface" data-testid="toggle-auth-mode-btn" onclick={toggleMode}>
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

        <div class="flex justify-end">
          <Dialog.CloseTrigger>
            <button class="btn btn-sm preset-tonal-surface" onclick={resetForm}>Close</button>
          </Dialog.CloseTrigger>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog>
{/if}
