<script>
  import {tasksInsert} from '../modules/tasks/tasks.methods.js';

  let newTask = $state('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!newTask.trim()) return;
    tasksInsert({text: newTask});
    newTask = '';
  }
</script>

<form onsubmit={handleSubmit} class="card preset-outlined-surface-200-800 p-4 space-y-2">
  <label class="text-sm font-semibold flex items-center gap-2" for="new-task-input">
    <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
    Add New Task
  </label>
  <div class="input-group grid-cols-[1fr_auto]">
    <input
      id="new-task-input"
      type="text"
      class="ig-input"
      placeholder="What needs to be done?"
      data-testid="new-task-input"
      bind:value={newTask}
    />
    <button type="submit" class="ig-btn preset-filled-primary-500" data-testid="add-task-btn">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Add
    </button>
  </div>
</form>
