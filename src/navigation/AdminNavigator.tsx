import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboard } from '../screens/admin/AdminDashboard';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { ProfileScreen } from '../screens/auth/ProfileScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  UserManagement: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
