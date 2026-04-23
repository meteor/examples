<script>
  import {Meteor} from 'meteor/meteor';
  import {useTracker} from './lib/useTracker.js';
  import {tasksRemove, tasksUpdateAsChecked, tasksUpdateAsPrivate} from '../modules/tasks/tasks.methods.js';

  let {task} = $props();

  const currentUser = useTracker(() => Meteor.user());

  let showButton = $derived($currentUser ? task.owner === $currentUser._id : false);

  function toggleChecked() {
    tasksUpdateAsChecked({taskId: task._id, setChecked: !task.checked});
  }

  function deleteThisTask() {
    tasksRemove({taskId: task._id});
  }

  function togglePrivate() {
    tasksUpdateAsPrivate({taskId: task._id, setPrivate: !task.private});
  }
</script>

<div
  class="card preset-filled-surface-100-900 p-4 flex items-center gap-3 transition-all hover:ring-1 hover:ring-surface-400/30"
  class:opacity-50={task.checked}
  data-testid="task-card"
>
  {#if showButton}
    <input
      type="checkbox"
      class="checkbox"
      checked={!!task.checked}
      data-testid="task-checkbox"
      onclick={toggleChecked}
    />
  {/if}

  <div class="flex-1 min-w-0">
    <span class="badge preset-tonal-secondary text-xs mr-1.5" data-testid="task-owner">{task.username}</span>
    <span class:line-through={task.checked} class:opacity-60={task.checked} data-testid="task-text">{task.text}</span>
  </div>

  <div class="flex items-center gap-1.5 flex-shrink-0">
    {#if task.expired}
      <span class="badge preset-filled-error-500 text-xs">Expired</span>
    {/if}
    {#if task.private}
      <span class="badge preset-filled-warning-500 text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Private
      </span>
    {/if}
    {#if showButton}
      <button class="btn btn-sm preset-tonal-surface" data-testid="toggle-private-btn" onclick={togglePrivate}>
        {#if task.private}
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          Public
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Private
        {/if}
      </button>
      <button class="btn btn-sm preset-filled-error-500" data-testid="delete-task-btn" onclick={deleteThisTask}>
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        Delete
      </button>
    {/if}
  </div>
</div>
