
import Meteor from '@meteorrn/core';
import React, { useState } from 'react';
import { Alert, Text, View, TextInput, TouchableOpacity } from 'react-native';

export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = e => {
    console.log("Logging in");
    Meteor.loginWithPassword({username}, password, err => {
      if(err) {
        Alert.alert(err.reason);
      }
      else {
        console.log("Logged in!");
      }
    });
  };

  const loggingIn = Meteor.useTracker(() => Meteor.loggingIn());

  return (
    <View style={{flexDirection:"column", height:"100%", justifyContent:"center", alignItems:"center"}}>
      <View>
        <Text>Username</Text>
        <TextInput
          onChangeText={setUsername}
          value={username}
          placeholder="Username"
          style={{borderWidth:1, borderColor:"black", width:200, height:25}}
        />
      </View>

      <View>
        <Text>Password</Text>

        <TextInput
          onChangeText={setPassword}
          value={password}
          placeholder="Password"
          secureTextEntry={true}
          style={{borderWidth:1, borderColor:"black", width:200, height:25}}
        />
      </View>
      <View>
        <TouchableOpacity onPress={submit}><Text>{loggingIn ? "Loading..." : "Log In"}</Text></TouchableOpacity>
      </View>
    </View>
  );
};
