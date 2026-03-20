import { Mongo } from "meteor/mongo";

const TestTasks = new Mongo.Collection("tasks");

describe("task-manager", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    if (name !== "task-manager") throw new Error("Expected task-manager");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      if (Meteor.isServer) throw new Error("Expected client");
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      if (Meteor.isClient) throw new Error("Expected server");
    });

    it("inserts and finds a task", async function () {
      const taskId = await TestTasks.insertAsync({
        title: "Test task",
        description: "",
        status: "todo",
        priority: "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const task = await TestTasks.findOneAsync(taskId);
      if (task.title !== "Test task") throw new Error("Title mismatch");
      if (task.status !== "todo") throw new Error("Status mismatch");

      await TestTasks.removeAsync(taskId);
    });

    it("removes a task", async function () {
      const taskId = await TestTasks.insertAsync({
        title: "Task to remove",
        status: "todo",
        priority: "low",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await TestTasks.removeAsync(taskId);
      const task = await TestTasks.findOneAsync(taskId);
      if (task !== undefined) throw new Error("Expected undefined");
    });
  }
});
