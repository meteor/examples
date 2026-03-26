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
  class="card preset-filled-surface-100-900 p-3 flex items-center gap-3 transition-opacity"
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
    <span class="badge preset-tonal-secondary text-xs mr-1" data-testid="task-owner">{task.username}</span>
    <span class:line-through={task.checked} data-testid="task-text">{task.text}</span>
  </div>

  <div class="flex items-center gap-1 flex-shrink-0">
    {#if task.expired}
      <span class="badge preset-filled-error-500 text-xs">Expired</span>
    {/if}
    {#if task.private}
      <span class="badge preset-filled-warning-500 text-xs">Private</span>
    {/if}
    {#if showButton}
      <button class="btn btn-sm preset-tonal-warning" data-testid="toggle-private-btn" onclick={togglePrivate}>
        {task.private ? 'Make Public' : 'Make Private'}
      </button>
      <button class="btn btn-sm preset-filled-error-500" data-testid="delete-task-btn" onclick={deleteThisTask}>
        Delete
      </button>
    {/if}
  </div>
</div>
