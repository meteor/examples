import Meteor from '@meteorrn/core';
import React, { useState, Fragment } from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
const { useTracker } = Meteor;

import { TasksCollection } from './collections.js';
import { Task } from './Task';
import { TaskForm } from './TaskForm';
import { LoginForm } from './LoginForm';

Meteor.connect("wss://react-tutorial.meteorapp.com/websocket");

const toggleChecked = ({ _id, isChecked }) => {
  console.log({_id, isChecked})
  Meteor.call('tasks.setIsChecked', _id, isChecked);
}

const deleteTask = ({ _id }) => {
  Meteor.call('tasks.remove', _id);
}

export const App = () => {
  const user = useTracker(() => Meteor.user());

  const [hideCompleted, setHideCompleted] = useState(false);

  const hideCompletedFilter = { isChecked: { $ne: true } };

  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  const { tasks, pendingTasksCount, isLoading } = useTracker(() => {
    const noDataAvailable = { tasks: [], pendingTasksCount: 0 };
    if (!Meteor.user()) {
      return noDataAvailable;
    }
    const handler = Meteor.subscribe('tasks');

    if (!handler.ready()) {
      return { ...noDataAvailable, isLoading: true };
    }

    const tasks = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetch();
    const pendingTasksCount = TasksCollection.find(pendingOnlyFilter).count();

    return { tasks, pendingTasksCount };
  });

  const pendingTasksTitle = `${
    pendingTasksCount ? ` (${pendingTasksCount})` : ''
  }`;

  const logout = () => Meteor.logout();

  return (
    <SafeAreaView style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <View style={{background:"#d2edf4", paddingTop:20, paddingRight:15, paddingBottom:15, paddingLeft:15, position:"relative"}}>
        <View style={{display:"flex", justifyContent:"space-between"}}>
          <View style={{fontSize:20, margin:0, marginRight:15}}>
            <Text>
              📝️ To Do List
              {pendingTasksTitle}
            </Text>
          </View>
        </View>
      </View>
      <View style={{display:"flex", flexDirection:"column", flexGrow:1, overflow:"scroll", background:"white"}}>
        {user ? (
          <Fragment>
            <TouchableOpacity style={{display:"flex", alignSelf:"flex-end"}} onPress={logout}>
              <Text>{user.username} 🚪</Text>
            </TouchableOpacity>

            <TaskForm />

            <View style={{display:"flex", justifyContent:"center"}}>
              <TouchableOpacity style={{backgroundColor:"$62807e"}} onClick={() => setHideCompleted(!hideCompleted)}>
                <Text>{hideCompleted ? 'Show All' : 'Hide Completed'}</Text>
              </TouchableOpacity>
            </View>

            {isLoading && <View style={{display:"flex", height:"100%", justifyContent:"center", alignItems:"center"}}><Text>loading...</Text></View>}

            <FlatList
              data={tasks}
              renderItem={({item:task}) => (
                <Task
                  task={task}
                  onCheckboxClick={toggleChecked}
                  onDeleteClick={deleteTask}
                />
              )}
              keyExtractor={task => task._id}
            />
          </Fragment>
        ) : (
          <LoginForm />
        )}
      </View>
    </SafeAreaView>
  );
};
