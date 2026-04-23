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
      <a href="/tasks" class="flex items-center gap-2 no-underline" onclick={(e) => { e.preventDefault(); navigate('tasks'); }}>
        <svg xmlns="http://www.w3.org/2000/svg" class="size-6 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <span class="text-lg font-bold">Meteor & Svelte Todos</span>
      </a>
    </AppBar.Lead>
    <AppBar.Trail>
      <nav class="flex items-center gap-2">
        <a
          href="/tasks"
          class="btn btn-sm {currentPage === 'tasks' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          data-testid="nav-tasks"
          onclick={(e) => { e.preventDefault(); navigate('tasks'); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Tasks
        </a>
        <a
          href="/about"
          class="btn btn-sm {currentPage === 'about' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          data-testid="nav-about"
          onclick={(e) => { e.preventDefault(); navigate('about'); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          About
        </a>
        <span class="border-l border-surface-300 dark:border-surface-600 h-6 mx-1"></span>
        <LoginButtons />
      </nav>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>

<main class="max-w-3xl mx-auto px-4 py-6">
  {#if currentPage === 'tasks'}
    <Tasks />
  {:else if currentPage === 'about'}
    <About />
  {/if}
</main>
