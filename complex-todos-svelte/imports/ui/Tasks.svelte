<script>
  import {Meteor} from 'meteor/meteor';
  import {useTracker} from './lib/useTracker.js';
  import Task from './Task.svelte';
  import {taskRepository} from '../modules/tasks/taskRepository.js';
  import TaskAddNewForm from './TaskAddNewForm.svelte';
  import {TASKS_PUBLICATION} from '../modules/tasks/enums/publications.js';

  let hideCompleted = $state(false);

  Meteor.subscribe(TASKS_PUBLICATION.TASKS);

  const incompleteCount = useTracker(() => taskRepository.find({checked: {$ne: true}}).count());
  const currentUser = useTracker(() => Meteor.user());
  const allTasks = useTracker(() => taskRepository.find({}, {sort: {createdAt: -1}}).fetch());

  let tasks = $derived(
    hideCompleted ? $allTasks.filter(task => !task.checked) : $allTasks
  );
</script>

<div class="space-y-5">
  {#if $currentUser}
    <TaskAddNewForm />
  {/if}

  <header class="flex items-center justify-between">
    <h2 class="h3 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-6 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8Z" /><path d="M15 3v4a1 1 0 001 1h4" />
      </svg>
      Pending Tasks
      <span class="badge preset-filled-primary-500 text-sm">{$incompleteCount}</span>
    </h2>
    <label class="flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-1.5 hover:preset-tonal-surface transition-colors">
      <input type="checkbox" class="checkbox" bind:checked={hideCompleted} />
      <span class="text-sm">Hide completed</span>
    </label>
  </header>

  {#if tasks.length === 0}
    <div class="card preset-tonal-surface p-12 text-center space-y-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-12 mx-auto opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><line x1="13" y1="6" x2="21" y2="6" /><line x1="13" y1="12" x2="21" y2="12" /><line x1="13" y1="18" x2="21" y2="18" />
      </svg>
      <p class="text-lg opacity-60">
        {#if hideCompleted}
          All tasks are completed! Great work.
        {:else if $currentUser}
          No tasks yet — add one above to get started!
        {:else}
          Sign in to start adding tasks.
        {/if}
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each tasks as task (task._id)}
        <Task {task} />
      {/each}
    </div>
  {/if}
</div>
