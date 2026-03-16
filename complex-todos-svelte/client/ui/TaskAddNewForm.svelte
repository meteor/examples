<script>
  import {tasksInsert} from '../../imports/modules/tasks/tasks.methods.js';
  
  let newTask = '';
  
  function handleSubmit(event)
  {
    event.preventDefault();
    
    tasksInsert({text: newTask});
    
    // Clear form
    newTask = '';
  }
</script>
<form class="new-task my-3" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label for="new-task-input">New Task</label>
    <div class="input-group">
      <input id="new-task-input"
             type="text"
             class="form-control"
             placeholder="Type to add new tasks and press enter"
             bind:value={newTask}>
      
      <button type="submit"
              class="btn btn-primary">
        Submit
      </button>
    </div>
  </div>
</form>