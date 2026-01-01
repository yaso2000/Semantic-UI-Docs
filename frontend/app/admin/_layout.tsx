import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Admin Dashboard',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          title: 'User Management',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="packages" 
        options={{ 
          title: 'Manage Packages',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="chatlogs" 
        options={{ 
          title: 'Chat Logs',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="package-form" 
        options={{ 
          title: 'Package Details',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="chat-detail" 
        options={{ 
          title: 'Conversation Details',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}