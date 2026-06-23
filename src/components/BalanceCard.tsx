import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, useColorScheme, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, TextStyles } from '../constants/typography';
import { CurrencyFormatter } from '../utils/currency';

export type AnalysisPeriod = 'weekly' | 'monthly' | 'yearly';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  currency: string;
  selectedPeriod: AnalysisPeriod;
  onPeriodChanged: (period: AnalysisPeriod) => void;
}

const getPeriodName = (period: AnalysisPeriod): string => {
  switch (period) {
    case 'weekly':
      return 'Week';
    case 'monthly':
      return 'Month';
    case 'yearly':
      return 'Year';
  }
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  income,
  expenses,
  currency,
  selectedPeriod,
  onPeriodChanged,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectPeriod = (period: AnalysisPeriod) => {
    onPeriodChanged(period);
    setModalVisible(false);
  };

  const renderIncomeExpenseColumn = (
    title: string,
    amount: number,
    icon: keyof typeof MaterialIcons.glyphMap | string,
    iconColor: string
  ) => {
    return (
      <View style={styles.summaryCol}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.summaryTextWrapper}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryAmount} numberOfLines={1}>
            {CurrencyFormatter.format(amount, currency)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Current {getPeriodName(selectedPeriod)} Balance
        </Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.dropdownTrigger}
        >
          <Text style={styles.dropdownText}>{getPeriodName(selectedPeriod)}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={styles.balanceText} numberOfLines={1}>
        {CurrencyFormatter.format(balance, currency)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        {renderIncomeExpenseColumn('Income', income, 'arrow-downward', Colors.success)}
        {renderIncomeExpenseColumn('Expenses', expenses, 'arrow-upward', '#F87171')}
      </View>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            {(['weekly', 'monthly', 'yearly'] as AnalysisPeriod[]).map((period) => (
              <Pressable
                key={period}
                onPress={() => handleSelectPeriod(period)}
                style={[
                  styles.modalItem,
                  selectedPeriod === period && { backgroundColor: Colors.primary + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: themeColors.text },
                    selectedPeriod === period && { color: Colors.primary, fontWeight: 'bold' },
                  ]}
                >
                  {getPeriodName(period)}
                </Text>
                {selectedPeriod === period && (
                  <MaterialIcons name="check" size={18} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  summaryTextWrapper: {
    flex: 1,
  },
  summaryTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
