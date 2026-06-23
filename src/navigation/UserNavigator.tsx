import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/user/HomeScreen';
import { TransactionsScreen } from '../screens/user/TransactionsScreen';
import { AddTransactionScreen } from '../screens/user/AddTransactionScreen';
import { TransactionDetailsScreen } from '../screens/user/TransactionDetailsScreen';
import { AnalysisScreen } from '../screens/user/AnalysisScreen';
import { BudgetScreen } from '../screens/user/BudgetScreen';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { Transaction } from '../store/transactionStore';

export type UserStackParamList = {
  Home: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
  TransactionDetails: { transaction: Transaction };
  Analysis: undefined;
  BudgetOverview: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();

export const UserNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
      <Stack.Screen name="BudgetOverview" component={BudgetScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
