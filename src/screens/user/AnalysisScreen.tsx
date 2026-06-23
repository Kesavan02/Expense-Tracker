import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CurrencyConverter, CurrencyFormatter } from '../../utils/currency';
import { GlassCard } from '../../components/GlassCard';

type Props = NativeStackScreenProps<UserStackParamList, 'Analysis'>;
type Period = 'weekly' | 'monthly' | 'yearly';

export const AnalysisScreen: React.FC<Props> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const currency = user?.currency || 'USD';

  const { transactions, loadTransactions, status } = useTransactionStore();

  const [period, setPeriod] = useState<Period>('yearly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [drilledMonth, setDrilledMonth] = useState<number>(new Date().getMonth() + 1); // 1-indexed
  const [drilledWeek, setDrilledWeek] = useState<number>(1);

  // Interaction / Tapped State
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [hoveredIncome, setHoveredIncome] = useState<number>(0);
  const [hoveredExpense, setHoveredExpense] = useState<number>(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Determine available years from transaction history
  const availableYears = React.useMemo(() => {
    if (transactions.length === 0) return [new Date().getFullYear()];
    const years = transactions.map((t) => new Date(t.date).getFullYear());
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
    return uniqueYears;
  }, [transactions]);

  // Make sure selectedYear is in availableYears
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  // Group transactions depending on selected period and year/month/week
  const groupedData = React.useMemo(() => {
    const grouped: Record<string, { income: number; expense: number; index: number }> = {};
    const targetYear = selectedYear;

    if (period === 'weekly') {
      // Days of the specific week of the month (Week 1-5)
      // Display 7 days starting from: (drilledWeek - 1) * 7 + 1
      const startDay = (drilledWeek - 1) * 7 + 1;
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Initialize days
      for (let i = 0; i < 7; i++) {
        const d = new Date(targetYear, drilledMonth - 1, startDay + i);
        // Ensure day is still in the same month
        if (d.getMonth() + 1 !== drilledMonth) break;
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[dayStr] = { income: 0, expense: 0, index: i };
      }

      transactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === targetYear && txDate.getMonth() + 1 === drilledMonth) {
          let weekNum = Math.floor((txDate.getDate() - 1) / 7) + 1;
          if (weekNum > 5) weekNum = 5;
          
          if (weekNum === drilledWeek) {
            const dayStr = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (grouped[dayStr]) {
              const convertedAmount = CurrencyConverter.convert(tx.amount, 'USD', currency);
              if (tx.type === 'income') {
                grouped[dayStr].income += convertedAmount;
              } else {
                grouped[dayStr].expense += convertedAmount;
              }
            }
          }
        }
      });
    } else if (period === 'monthly') {
      // Weeks of the selected month
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      weeks.forEach((w, idx) => {
        grouped[w] = { income: 0, expense: 0, index: idx };
      });

      transactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === targetYear && txDate.getMonth() + 1 === drilledMonth) {
          let weekNum = Math.floor((txDate.getDate() - 1) / 7) + 1;
          if (weekNum > 5) weekNum = 5;
          const weekStr = `Week ${weekNum}`;
          if (grouped[weekStr]) {
            const convertedAmount = CurrencyConverter.convert(tx.amount, 'USD', currency);
            if (tx.type === 'income') {
              grouped[weekStr].income += convertedAmount;
            } else {
              grouped[weekStr].expense += convertedAmount;
            }
          }
        }
      });
    } else {
      // 12 Months of the selected year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((m, idx) => {
        grouped[m] = { income: 0, expense: 0, index: idx };
      });

      transactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === targetYear) {
          const monthStr = months[txDate.getMonth()];
          if (grouped[monthStr]) {
            const convertedAmount = CurrencyConverter.convert(tx.amount, 'USD', currency);
            if (tx.type === 'income') {
              grouped[monthStr].income += convertedAmount;
            } else {
              grouped[monthStr].expense += convertedAmount;
            }
          }
        }
      });
    }

    return grouped;
  }, [transactions, period, selectedYear, drilledMonth, drilledWeek, currency]);

  // Construct chart data for react-native-gifted-charts
  const chartData = React.useMemo(() => {
    const data: any[] = [];
    const keys = Object.keys(groupedData);

    keys.forEach((label, idx) => {
      const { income, expense, index } = groupedData[label];
      
      // Income Bar
      data.push({
        value: income,
        label: label,
        spacing: 2,
        labelWidth: 32,
        frontColor: Colors.success,
        onPress: () => handleBarPress(label, income, expense, index),
      });

      // Expense Bar
      data.push({
        value: expense,
        frontColor: Colors.error,
        onPress: () => handleBarPress(label, income, expense, index),
      });
    });

    return data;
  }, [groupedData]);

  // Handle drill down logic
  const handleBarPress = (label: string, income: number, expense: number, index: number) => {
    setHoveredLabel(label);
    setHoveredIncome(income);
    setHoveredExpense(expense);

    // Drill down on double tap or after setting state, wait for user's explicit gesture
    // In React Native, since we can't easily track double taps in gifted-charts, we can drill down immediately if we are on Yearly or Monthly
  };

  const handleDrillDown = () => {
    if (!hoveredLabel) return;
    
    // Find index of selected item
    const itemData = groupedData[hoveredLabel];
    if (!itemData) return;

    if (period === 'yearly') {
      setPeriod('monthly');
      setDrilledMonth(itemData.index + 1);
      setHoveredLabel(null);
    } else if (period === 'monthly') {
      setPeriod('weekly');
      setDrilledWeek(itemData.index + 1);
      setHoveredLabel(null);
    }
  };

  // Back button functionality
  const handleBack = () => {
    setHoveredLabel(null);
    if (period === 'weekly') {
      setPeriod('monthly');
    } else if (period === 'monthly') {
      setPeriod('yearly');
    }
  };

  // Breadcrumbs text
  const getBreadcrumbs = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (period === 'weekly') {
      return `${selectedYear}  ›  ${monthNames[drilledMonth - 1]}  ›  Week ${drilledWeek}`;
    }
    if (period === 'monthly') {
      return `${selectedYear}  ›  ${monthNames[drilledMonth - 1]}`;
    }
    return `${selectedYear}`;
  };

  const renderActiveDetails = () => {
    if (!hoveredLabel) {
      return (
        <View style={styles.tipContainer}>
          <Text style={[styles.tipText, { color: themeColors.textMuted }]}>
            Tap a bar to see values. Double tap/click 'Drill Down' to zoom in.
          </Text>
        </View>
      );
    }

    const net = hoveredIncome - hoveredExpense;
    const isPositive = net >= 0;

    return (
      <GlassCard style={styles.hoverDetailCard}>
        <View style={styles.hoverHeader}>
          <Text style={[styles.hoverTitle, { color: themeColors.text }]}>{hoveredLabel}</Text>
          <Text
            style={[
              styles.hoverNetText,
              { color: isPositive ? Colors.success : Colors.error },
            ]}
          >
            {isPositive ? '+' : ''}
            {CurrencyFormatter.format(net, currency)}
          </Text>
        </View>
        <View style={styles.hoverValuesRow}>
          <View style={styles.hoverValueCol}>
            <View style={[styles.colorDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.hoverValueLabel, { color: themeColors.textMuted }]}>Income</Text>
            <Text style={[styles.hoverValueAmount, { color: themeColors.text }]}>
              {CurrencyFormatter.format(hoveredIncome, currency)}
            </Text>
          </View>
          <View style={styles.hoverValueCol}>
            <View style={[styles.colorDot, { backgroundColor: Colors.error }]} />
            <Text style={[styles.hoverValueLabel, { color: themeColors.textMuted }]}>Expenses</Text>
            <Text style={[styles.hoverValueAmount, { color: themeColors.text }]}>
              {CurrencyFormatter.format(hoveredExpense, currency)}
            </Text>
          </View>
        </View>

        {period !== 'weekly' && (
          <Pressable onPress={handleDrillDown} style={styles.drillDownBtn}>
            <Text style={styles.drillDownBtnText}>Drill Down</Text>
            <MaterialIcons name="zoom-in" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </GlassCard>
    );
  };

  if (status === 'loading' && transactions.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)' }]}
        >
          <MaterialIcons name="chevron-left" size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[TextStyles.bodyLarge, { color: themeColors.text, fontWeight: 'bold' }]}>
          Financial Analysis
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Navigation Breadcrumb & Year selector */}
      <View style={[styles.breadcrumbRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border }]}>
        {period !== 'yearly' && (
          <Pressable onPress={handleBack} style={styles.chevronBackBtn}>
            <MaterialIcons name="chevron-left" size={20} color={Colors.primary} />
          </Pressable>
        )}
        <Text style={[styles.breadcrumbText, { color: Colors.primary }]} numberOfLines={1}>
          {getBreadcrumbs()}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScroll}>
          {availableYears.map((yr) => (
            <Pressable
              key={yr}
              onPress={() => {
                setSelectedYear(yr);
                setPeriod('yearly');
                setHoveredLabel(null);
              }}
              style={[
                styles.yearChip,
                selectedYear === yr && { backgroundColor: Colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.yearChipText,
                  { color: themeColors.text },
                  selectedYear === yr && { color: '#FFFFFF', fontWeight: 'bold' },
                ]}
              >
                {yr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Legends */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={[styles.legendText, { color: themeColors.text }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={[styles.legendText, { color: themeColors.text }]}>Expense</Text>
        </View>
      </View>

      {/* Bar Chart Container */}
      <View style={styles.chartWrapper}>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={12}
            spacing={8}
            roundedTop
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={themeColors.border}
            yAxisTextStyle={{ color: themeColors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: themeColors.text, fontSize: 9, fontWeight: 'bold' }}
            height={220}
            isAnimated
            animationDuration={400}
            // Auto calculate Y axis intervals
            yAxisLabelPrefix=""
            yAxisLabelSuffix=""
          />
        ) : (
          <View style={styles.emptyChartContainer}>
            <Text style={{ color: themeColors.textMuted }}>No transactions found for this range.</Text>
          </View>
        )}
      </View>

      {/* Active Selection Details Card */}
      {renderActiveDetails()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 24,
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
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  chevronBackBtn: {
    backgroundColor: Colors.primary + '20',
    padding: 4,
    borderRadius: 12,
  },
  breadcrumbText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  yearScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  yearChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  yearChipText: {
    fontSize: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  chartWrapper: {
    paddingHorizontal: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContainer: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 20,
  },
  tipText: {
    fontSize: Typography.fontSizes.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hoverDetailCard: {
    marginHorizontal: 24,
    marginBottom: 40,
  },
  hoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoverTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  hoverNetText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  hoverValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  hoverValueCol: {
    flex: 1,
    position: 'relative',
    paddingLeft: 16,
  },
  colorDot: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hoverValueLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  hoverValueAmount: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    marginTop: 2,
  },
  drillDownBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  drillDownBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.fontSizes.sm,
  },
});
