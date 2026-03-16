<script>
  import LoginButtons from './LoginButtons.svelte';
  import Tasks from './Tasks.svelte';
  import About from './About.svelte';

  let currentPage = $state('tasks');

  function navigate(page)
  {
    currentPage = page;
    window.history.pushState({page}, '', `/${page}`);
  }

  // Set initial page from URL
  const path = window.location.pathname.replace('/', '') || 'tasks';
  currentPage = ['tasks', 'about'].includes(path) ? path : 'tasks';

  // Handle browser back/forward
  window.addEventListener('popstate', (event) =>
  {
    if(event.state && event.state.page)
    {
      currentPage = event.state.page;
    }
  });
</script>

<div class="container">
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a href="/tasks" class="navbar-brand" onclick={(e) => { e.preventDefault(); navigate('tasks'); }}>Meteor.js & Svelte Example</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a href="/tasks" class="nav-link" class:active={currentPage === 'tasks'} onclick={(e) => { e.preventDefault(); navigate('tasks'); }}>Tasks</a>
          </li>
          <li class="nav-item">
            <a href="/about" class="nav-link" class:active={currentPage === 'about'} onclick={(e) => { e.preventDefault(); navigate('about'); }}>About</a>
          </li>
          <li class="nav-item nav-login">
            <LoginButtons/>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  {#if currentPage === 'tasks'}
    <Tasks/>
  {:else if currentPage === 'about'}
    <About/>
  {/if}
</div>