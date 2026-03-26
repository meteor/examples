<script>
  import {AppBar} from '@skeletonlabs/skeleton-svelte';
  import LoginButtons from './LoginButtons.svelte';
  import Tasks from './Tasks.svelte';
  import About from './About.svelte';

  let currentPage = $state('tasks');

  function navigate(page) {
    currentPage = page;
    window.history.pushState({page}, '', `/${page}`);
  }

  // Set initial page from URL
  const path = window.location.pathname.replace('/', '') || 'tasks';
  currentPage = ['tasks', 'about'].includes(path) ? path : 'tasks';

  // Handle browser back/forward
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
      currentPage = event.state.page;
    }
  });
</script>

<AppBar>
  <AppBar.Toolbar>
    <AppBar.Lead>
      <a href="/tasks" class="text-lg font-bold no-underline" onclick={(e) => { e.preventDefault(); navigate('tasks'); }}>
        Meteor & Svelte Todos
      </a>
    </AppBar.Lead>
    <AppBar.Trail>
      <nav class="flex items-center gap-2">
        <a
          href="/tasks"
          class="btn btn-sm {currentPage === 'tasks' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          data-testid="nav-tasks"
          onclick={(e) => { e.preventDefault(); navigate('tasks'); }}
        >Tasks</a>
        <a
          href="/about"
          class="btn btn-sm {currentPage === 'about' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          data-testid="nav-about"
          onclick={(e) => { e.preventDefault(); navigate('about'); }}
        >About</a>
        <span class="border-l border-surface-300 dark:border-surface-600 h-6 mx-1"></span>
        <LoginButtons />
      </nav>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>

<main class="max-w-2xl mx-auto p-4">
  {#if currentPage === 'tasks'}
    <Tasks />
  {:else if currentPage === 'about'}
    <About />
  {/if}
</main>
