<script>
  import { Link, Route, Router } from 'svelte-routing';
  import Tasks from './Tasks.svelte';
  import About from './About.svelte';

  export let url = '';

  // Tasks svelte is the homepage of the application. Thus set "/tasks" on "/" load
  if(window.location.pathname === '/')
  {
    url = '/tasks';
  }
</script>

<Router url="{url}">
  <div class="container">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <Link to="tasks" class="navbar-brand">Meteor.js & Svelte Example</Link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <Link to="tasks" class="nav-link">Tasks</Link>
            </li>
            <li class="nav-item">
              <Link to="about" class="nav-link">About</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <Route path="tasks" component="{Tasks}"/>
    <Route path="about" component="{About}"/>
  </div>
</Router>