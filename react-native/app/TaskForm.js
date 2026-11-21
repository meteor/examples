import Meteor from '@meteorrn/core';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export const TaskForm = () => {
  const [text, setText] = useState('');

  const handleSubmit = e => {
    e.preventDefault();

    if (!text) return;

    Meteor.call('tasks.insert', text);

    setText('');
  };

  return (
    <View style={{padding:15}}>
      <TextInput
        placeholder="Type to add new tasks"
        value={text}
        onChangeText={setText}
        style={{borderWidth:1, borderColor:"black", padding:5}}
      />
      <TouchableOpacity onPress={handleSubmit}><Text>Add Task</Text></TouchableOpacity>
    </View>
  );
};
