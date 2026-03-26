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

<div class="space-y-4">
  {#if $currentUser}
    <TaskAddNewForm />
  {/if}

  <header class="flex items-center justify-between">
    <h2 class="h3 flex items-center gap-2">
      Pending Tasks
      <span class="badge preset-filled-primary-500">{$incompleteCount}</span>
    </h2>
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" class="checkbox" bind:checked={hideCompleted} />
      <span class="text-sm">Hide completed</span>
    </label>
  </header>

  {#if tasks.length === 0}
    <div class="card preset-tonal-surface p-8 text-center">
      <p class="text-lg opacity-60">
        {#if hideCompleted}
          All tasks are completed!
        {:else if $currentUser}
          No tasks yet — add one above!
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
