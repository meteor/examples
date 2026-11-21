import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

export const Task = ({ task, onCheckboxClick, onDeleteClick }) => {
  return (
    <View style={{display:"flex", flexDirection:"row", width:"100%", padding:5, justifyContent:"space-between"}}>
      <View style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
        <CheckBox
          type="checkbox"
          value={!!task.isChecked}
          onValueChange={(isChecked) => onCheckboxClick({_id:task._id, isChecked})}
          readOnly
        />
        <Text style={{marginLeft:10}}>{task.text}</Text>
      </View>
      <TouchableOpacity onPress={() => onDeleteClick(task)} style={{justifySelf:"flex-end"}}><Text>X</Text></TouchableOpacity>
    </View>
  );
};
