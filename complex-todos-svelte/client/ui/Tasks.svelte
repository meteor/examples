<script>
  import {Meteor} from 'meteor/meteor';
  import {useTracker} from 'meteor/rdb:svelte-meteor-data';
  import Task from './Task.svelte';
  import {taskRepository} from '../../imports/modules/tasks/taskRepository.js';
  import TaskAddNewForm from './TaskAddNewForm.svelte';
  import {TASKS_PUBLICATION} from '../../imports/modules/tasks/enums/publications.js';
  
  let hideCompleted = false;
  let tasks;
  let currentUser;
  
  $: Meteor.subscribe(TASKS_PUBLICATION.TASKS);
  
  $: incompleteCount = useTracker(() => taskRepository.find({checked: {$ne: true}}).count());
  
  $: currentUser = useTracker(() => Meteor.user());
  
  const taskStore = taskRepository.find({}, {sort: {createdAt: -1}});
  
  $: {
    tasks = $taskStore;
  
    if(hideCompleted)
    {
      tasks = tasks.filter(task => !task.checked);
    }
  }
</script>

<div class="container">
  <div class="row mb-3">
    <div class="col-sm">
      {#if $currentUser}
        <TaskAddNewForm/>
      {/if}
    </div>
  </div>
  
  <h2>Pending Items ({ $incompleteCount })</h2>
  
  <div class="row">
    <div class="col-sm">
      <table class="table table-striped">
        <thead>
        <tr>
          <th>
            <label>
              <input
                type="checkbox"
                class="form-check-input"
                bind:checked={hideCompleted}
              />
              Hide Completed Tasks
            </label>
          </th>
          <th class="text-end">
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        {#each tasks as task}
          <Task
            key={task._id}
            task={task}
          />
        {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>