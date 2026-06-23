import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CategoryIcon } from '../../components/CategoryIcon';
import { CurrencyConverter, CurrencyFormatter } from '../../utils/currency';
import { DateFormatter } from '../../utils/dates';
import { GlassCard } from '../../components/GlassCard';

type Props = NativeStackScreenProps<UserStackParamList, 'TransactionDetails'>;

export const TransactionDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { transaction } = route.params;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const currency = user?.currency || 'USD';
  const dateFormat = user?.dateFormat || 'MM/DD/YYYY';

  const isIncome = transaction.type === 'income';
  
  // Convert amount from USD back to preferred user currency
  const convertedAmount = CurrencyConverter.convert(transaction.amount, 'USD', currency);
  const formattedAmount = CurrencyFormatter.format(convertedAmount, currency);

  const categoryColor = transaction.category.color || Colors.primary;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)' }]}
        >
          <MaterialIcons name="chevron-left" size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[TextStyles.bodyLarge, { color: themeColors.text, fontWeight: 'bold' }]}>
          Transaction Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Hero Graphic */}
      <View style={styles.heroContainer}>
        <View
          style={[
            styles.heroCircle,
            {
              backgroundColor: categoryColor + '1F', // ~12% opacity
            },
          ]}
        >
          <CategoryIcon icon={transaction.category.icon} size={48} color={categoryColor} />
        </View>
        
        {/* Amount */}
        <Text
          style={[
            styles.amountText,
            {
              color: isIncome ? Colors.success : Colors.error,
            },
          ]}
        >
          {isIncome ? '+' : '-'}{formattedAmount}
        </Text>

        {/* Category Name */}
        <Text style={[styles.categoryText, { color: themeColors.textMuted }]}>
          {transaction.category.name}
        </Text>
      </View>

      {/* Details Card */}
      <GlassCard style={styles.detailsCard}>
        {/* Date Row */}
        <View style={styles.detailRow}>
          <View style={styles.rowLabelContainer}>
            <MaterialIcons name="calendar-today" size={20} color={themeColors.textMuted} style={styles.rowIcon} />
            <Text style={[styles.rowLabel, { color: themeColors.text }]}>Date</Text>
          </View>
          <Text style={[styles.rowValue, { color: themeColors.text }]}>
            {DateFormatter.format(transaction.date, dateFormat)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        {/* Transaction Type Row */}
        <View style={styles.detailRow}>
          <View style={styles.rowLabelContainer}>
            <MaterialIcons name="swap-vert" size={22} color={themeColors.textMuted} style={styles.rowIcon} />
            <Text style={[styles.rowLabel, { color: themeColors.text }]}>Type</Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isIncome ? Colors.success + '1F' : Colors.error + '1F',
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color: isIncome ? Colors.success : Colors.error,
                },
              ]}
            >
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        {transaction.description ? (
          <>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            
            {/* Notes Section */}
            <View style={styles.noteContainer}>
              <View style={styles.rowLabelContainer}>
                <MaterialIcons name="notes" size={20} color={themeColors.textMuted} style={styles.rowIcon} />
                <Text style={[styles.rowLabel, { color: themeColors.text }]}>Note</Text>
              </View>
              <Text style={[styles.noteText, { color: themeColors.text }]}>
                {transaction.description}
              </Text>
            </View>
          </>
        ) : null}
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountText: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  detailsCard: {
    marginTop: 20,
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 10,
  },
  rowLabel: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  rowValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'capitalize',
  },
  noteContainer: {
    paddingVertical: 14,
  },
  noteText: {
    fontSize: Typography.fontSizes.md,
    marginTop: 8,
    lineHeight: 22,
  },
});
