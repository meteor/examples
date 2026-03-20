import assert from "assert";
import { Meteor } from "meteor/meteor";
// Import the API module to register Meteor methods
import "../imports/api/tasks";

describe("task-manager", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "task-manager");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      assert.strictEqual(Meteor.isClient, false);
    });

    describe("createTask method", function () {
      it("creates a task with defaults", async function () {
        const taskId = await Meteor.callAsync("createTask", {
          title: "Integration test task",
        });
        assert.ok(taskId);

        const { TasksCollection } = await import("../imports/api/tasks");
        const task = await TasksCollection.findOneAsync(taskId);
        assert.strictEqual(task.title, "Integration test task");
        assert.strictEqual(task.status, "todo");
        assert.strictEqual(task.priority, "medium");
        assert.strictEqual(task.description, "");
        assert.ok(task.createdAt instanceof Date);

        await TasksCollection.removeAsync(taskId);
      });

      it("creates a task with custom status and priority", async function () {
        const taskId = await Meteor.callAsync("createTask", {
          title: "High priority task",
          status: "in-progress",
          priority: "high",
          description: "Urgent work",
        });

        const { TasksCollection } = await import("../imports/api/tasks");
        const task = await TasksCollection.findOneAsync(taskId);
        assert.strictEqual(task.status, "in-progress");
        assert.strictEqual(task.priority, "high");
        assert.strictEqual(task.description, "Urgent work");

        await TasksCollection.removeAsync(taskId);
      });
    });

    describe("updateTask method", function () {
      it("updates task fields", async function () {
        const taskId = await Meteor.callAsync("createTask", {
          title: "Task to update",
        });

        await Meteor.callAsync("updateTask", {
          _id: taskId,
          title: "Updated title",
          status: "done",
        });

        const { TasksCollection } = await import("../imports/api/tasks");
        const task = await TasksCollection.findOneAsync(taskId);
        assert.strictEqual(task.title, "Updated title");
        assert.strictEqual(task.status, "done");

        await TasksCollection.removeAsync(taskId);
      });
    });

    describe("removeTask method", function () {
      it("deletes a task", async function () {
        const taskId = await Meteor.callAsync("createTask", {
          title: "Task to delete",
        });

        await Meteor.callAsync("removeTask", { _id: taskId });

        const { TasksCollection } = await import("../imports/api/tasks");
        const task = await TasksCollection.findOneAsync(taskId);
        assert.strictEqual(task, undefined);
      });
    });
  }
});
