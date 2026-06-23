import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { useBudgetStore, Budget } from '../../store/budgetStore';
import { BalanceCard, AnalysisPeriod } from '../../components/BalanceCard';
import { CategoryIcon } from '../../components/CategoryIcon';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CurrencyFormatter, CurrencyConverter } from '../../utils/currency';

type HomeScreenNavigationProp = NativeStackNavigationProp<any>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const { transactions, loadTransactions, loadCategories, status: txStatus } = useTransactionStore();
  const { budgets, loadBudgets } = useBudgetStore();

  const [period, setPeriod] = useState<AnalysisPeriod>('monthly');
  const [refreshing, setRefreshing] = useState(false);

  const currency = user?.currency || 'USD';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadBudgets(),
      ]);
    } catch (e) {
      console.error('Error fetching home screen data:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const calculatePeriodTotals = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let income = 0;
    let expenses = 0;

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      let include = false;

      switch (period) {
        case 'weekly': {
          const daysToSubtract = today.getDay(); // 0 is Sunday, 1 is Monday...
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - daysToSubtract);
          if (txDate >= weekStart) include = true;
          break;
        }
        case 'monthly':
          if (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()) {
            include = true;
          }
          break;
        case 'yearly':
          if (txDate.getFullYear() === now.getFullYear()) {
            include = true;
          }
          break;
      }

      if (include) {
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expenses += tx.amount;
        }
      }
    });

    return {
      balance: CurrencyConverter.convert(income - expenses, 'USD', currency),
      income: CurrencyConverter.convert(income, 'USD', currency),
      expenses: CurrencyConverter.convert(expenses, 'USD', currency),
    };
  };

  const totals = calculatePeriodTotals();

  const getCategorySpent = (budget: Budget) => {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);

    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          tx.category.id === budget.category.id &&
          txDate >= start &&
          txDate <= end
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const spent = getCategorySpent(item);
    const amountInCurrency = CurrencyConverter.convert(item.amount, 'USD', currency);
    const percent = Math.min(spent / item.amount, 1.0);
    const color = item.category.color;

    return (
      <View style={[styles.budgetCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={styles.budgetCardHeader}>
          <CategoryIcon icon={item.category.icon} size={16} color={color} />
          <Text style={[styles.budgetCardTitle, { color: themeColors.text }]} numberOfLines={1}>
            {item.category.name}
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percent * 100}%`,
                backgroundColor: percent >= 1.0 ? Colors.error : color,
              },
            ]}
          />
        </View>

        <Text style={[styles.budgetCardFooterText, { color: themeColors.textMuted }]}>
          {Math.round(percent * 100)}% of {CurrencyFormatter.format(amountInCurrency, currency)}
        </Text>
      </View>
    );
  };

  const renderRecentTransaction = (tx: Transaction) => {
    const color = tx.category.color;
    const convertedAmount = CurrencyConverter.convert(tx.amount, 'USD', currency);

    return (
      <Pressable
        key={tx.id}
        onPress={() => navigation.navigate('TransactionDetails', { transaction: tx })}
        style={[styles.txItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
      >
        <View style={[styles.txAvatar, { backgroundColor: color + '15' }]}>
          <CategoryIcon icon={tx.category.icon} color={color} size={20} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, { color: themeColors.text }]}>{tx.category.name}</Text>
          <Text style={[styles.txSubtitle, { color: themeColors.textMuted }]}>
            {new Date(tx.date).toLocaleDateString()}
          </Text>
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: tx.type === 'income' ? Colors.success : Colors.error },
          ]}
        >
          {tx.type === 'income' ? '+' : '-'}{CurrencyFormatter.format(convertedAmount, currency)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: themeColors.textMuted }]}>Welcome back,</Text>
          <Text style={[TextStyles.titleLarge, { color: themeColors.text }]}>
            {user?.name || 'User'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Analysis')} style={styles.actionBtn}>
            <MaterialIcons name="analytics" size={24} color={themeColors.text} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('BudgetOverview')} style={styles.actionBtn}>
            <MaterialIcons name="account-balance-wallet" size={24} color={themeColors.text} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.actionBtn}>
            <MaterialIcons name="person" size={24} color={themeColors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        <BalanceCard
          balance={totals.balance}
          income={totals.income}
          expenses={totals.expenses}
          currency={currency}
          selectedPeriod={period}
          onPeriodChanged={setPeriod}
        />

        {budgets.length > 0 && (
          <View style={styles.budgetsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Budget Overview</Text>
              <Pressable onPress={() => navigation.navigate('BudgetOverview')}>
                <Text style={styles.seeAllText}>View All</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={budgets}
              keyExtractor={(item) => item.id}
              renderItem={renderBudgetCard}
              contentContainerStyle={styles.budgetsList}
            />
          </View>
        )}

        <View style={styles.txSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Transactions</Text>
            <Pressable onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          {txStatus === 'loading' && transactions.length === 0 ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 24 }} />
          ) : transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              No transactions for this month.
            </Text>
          ) : (
            <View style={styles.txList}>
              {transactions.slice(0, 5).map(renderRecentTransaction)}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('AddTransaction')}
        style={styles.fab}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  seeAllText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  budgetsSection: {
    marginTop: 24,
  },
  budgetsList: {
    paddingRight: 24,
    gap: 12,
  },
  budgetCard: {
    width: 180,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    marginLeft: 8,
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetCardFooterText: {
    fontSize: 10,
  },
  txSection: {
    marginTop: 24,
  },
  txList: {
    gap: 8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  txSubtitle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  txAmount: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 32,
    fontSize: Typography.fontSizes.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
