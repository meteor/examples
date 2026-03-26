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

<form onsubmit={handleSubmit} class="card preset-outlined-surface-200-800 p-4">
  <label class="text-sm font-semibold mb-2 block" for="new-task-input">Add New Task</label>
  <div class="input-group grid-cols-[1fr_auto]">
    <input
      id="new-task-input"
      type="text"
      class="ig-input"
      placeholder="What needs to be done?"
      data-testid="new-task-input"
      bind:value={newTask}
    />
    <button type="submit" class="ig-btn preset-filled-primary-500" data-testid="add-task-btn">Add Task</button>
  </div>
</form>
