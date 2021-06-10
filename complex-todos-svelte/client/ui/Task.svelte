<script>
  import {useTracker} from 'meteor/rdb:svelte-meteor-data';
  import {tasksRemove, tasksUpdateAsChecked, tasksUpdateAsPrivate} from '../../imports/modules/tasks/tasks.methods.js';
  
  export let key;
  export let task;
  let showButton = false;
  
  $: currentUser = useTracker(() => Meteor.user());
  
  $: {
    if($currentUser)
    {
      showButton = task.owner === $currentUser._id;
    }
  }
  
  function toggleChecked()
  {
    // Set the checked property to the opposite of its current value
    tasksUpdateAsChecked.call({taskId: task._id, setChecked: !task.checked});
  }
  
  function deleteThisTask()
  {
    tasksRemove.call({taskId: task._id});
  }
  
  function togglePrivate()
  {
    tasksUpdateAsPrivate.call({taskId: task._id, setPrivate: !task.private});
  }
</script>

<tr class:checked="{task.checked}"
    class:private="{task.private}"
    class:text-danger="{task.expired}">
  <td>
    <div class="form-check">
      <label><strong>{ task.username }</strong>: { task.text }
        {#if showButton}
          <input type="checkbox"
                 class="form-check-input"
                 readonly
                 checked={!!task.checked}
                 on:click={toggleChecked}
          />
        {/if}
      </label>
    </div>
  </td>
  <td class="text-end">
    {#if showButton}
      <button class="btn btn-sm btn-outline btn-success"
              on:click={togglePrivate}>
        { task.private ? "Private" : "Public" }
      </button>
      <button class="btn btn-sm btn-outline btn-danger"
              on:click={deleteThisTask}>
        Delete
      </button>
    {/if}
  </td>
</tr>