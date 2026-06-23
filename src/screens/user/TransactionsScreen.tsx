import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { AppTextField } from '../../components/AppTextField';
import { CategoryIcon } from '../../components/CategoryIcon';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CurrencyFormatter, CurrencyConverter } from '../../utils/currency';

type TransactionsScreenNavigationProp = NativeStackNavigationProp<any>;

interface TransactionsScreenProps {
  navigation: TransactionsScreenNavigationProp;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const { transactions, loadTransactions, deleteTransactions } = useTransactionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const currency = user?.currency || 'USD';

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      const updated = selectedIds.filter((item) => item !== id);
      setSelectedIds(updated);
      if (updated.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleLongPressItem = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredTransactions.map((tx) => tx.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all filtered items
      setSelectedIds(selectedIds.filter((id) => !allFilteredIds.includes(id)));
      if (selectedIds.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      // Select all filtered items
      const newSelection = Array.from(new Set([...selectedIds, ...allFilteredIds]));
      setSelectedIds(newSelection);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedIds.length} transaction(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransactions(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const descMatch = tx.description.toLowerCase().includes(query);
    const dateMatch = new Date(tx.date).getFullYear().toString().includes(query);
    const catMatch = tx.category.name.toLowerCase().includes(query);
    return descMatch || dateMatch || catMatch;
  });

  const calculateBalanceSummary = () => {
    let balance = 0;
    let income = 0;
    let expenses = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
        balance += tx.amount;
      } else {
        expenses += tx.amount;
        balance -= tx.amount;
      }
    });

    return {
      balance: CurrencyConverter.convert(balance, 'USD', currency),
      income: CurrencyConverter.convert(income, 'USD', currency),
      expenses: CurrencyConverter.convert(expenses, 'USD', currency),
    };
  };

  const summary = calculateBalanceSummary();

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isSelected = selectedIds.includes(item.id);
    const color = item.category.color;
    const convertedAmount = CurrencyConverter.convert(item.amount, 'USD', currency);

    return (
      <Pressable
        onPress={() => {
          if (isSelectionMode) {
            handleSelectItem(item.id);
          } else {
            navigation.navigate('TransactionDetails', { transaction: item });
          }
        }}
        onLongPress={() => handleLongPressItem(item.id)}
        style={[
          styles.txItem,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          isSelected && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
        ]}
      >
        {isSelectionMode ? (
          <View style={styles.checkboxContainer}>
            <MaterialIcons
              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={isSelected ? Colors.primary : themeColors.textMuted}
            />
          </View>
        ) : (
          <View style={[styles.txAvatar, { backgroundColor: color + '15' }]}>
            <CategoryIcon icon={item.category.icon} color={color} size={20} />
          </View>
        )}

        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, { color: themeColors.text }]}>{item.category.name}</Text>
          <Text style={[styles.txSubtitle, { color: themeColors.textMuted }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        <Text
          style={[
            styles.txAmount,
            { color: item.type === 'income' ? Colors.success : Colors.error },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}{CurrencyFormatter.format(convertedAmount, currency)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Dynamic Header based on selection state */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <Pressable
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              style={styles.headerBtn}
            >
              <MaterialIcons name="close" size={24} color={themeColors.text} />
            </Pressable>
            <Text style={[TextStyles.titleMedium, { color: themeColors.text, flex: 1, marginLeft: 16 }]}>
              {selectedIds.length} Selected
            </Text>
            <View style={styles.headerActions}>
              <Pressable onPress={handleSelectAll} style={styles.headerBtn}>
                <MaterialIcons name="select-all" size={24} color={themeColors.text} />
              </Pressable>
              {selectedIds.length > 0 && (
                <Pressable onPress={handleDeleteSelected} style={styles.headerBtn}>
                  <MaterialIcons name="delete" size={24} color={Colors.error} />
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
            </Pressable>
            <Text style={[TextStyles.titleMedium, { color: themeColors.text, flex: 1, marginLeft: 16 }]}>
              Transactions
            </Text>
            <Pressable onPress={() => navigation.navigate('Analysis')} style={styles.headerBtn}>
              <MaterialIcons name="analytics" size={24} color={themeColors.text} />
            </Pressable>
          </>
        )}
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Total Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Total Balance</Text>
              <Text
                style={[
                  styles.summaryBalance,
                  { color: summary.balance >= 0 ? Colors.success : Colors.error },
                ]}
              >
                {CurrencyFormatter.format(summary.balance, currency)}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemTitle}>
                    <MaterialIcons name="arrow-upward" size={14} color={Colors.success} />
                    <Text style={[styles.summaryItemText, { color: themeColors.textMuted }]}>Income</Text>
                  </View>
                  <Text style={[styles.summaryItemAmount, { color: Colors.success }]}>
                    {CurrencyFormatter.format(summary.income, currency)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemTitle}>
                    <MaterialIcons name="arrow-downward" size={14} color={Colors.error} />
                    <Text style={[styles.summaryItemText, { color: themeColors.textMuted }]}>Expenses</Text>
                  </View>
                  <Text style={[styles.summaryItemAmount, { color: Colors.error }]}>
                    {CurrencyFormatter.format(summary.expenses, currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <AppTextField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by notes or category..."
              leftIcon="search"
              style={styles.searchBar}
            />
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            No transactions found.
          </Text>
        }
      />

      {!isSelectionMode && (
        <Pressable
          onPress={() => navigation.navigate('AddTransaction')}
          style={styles.fab}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerBtn: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  summaryBalance: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  summaryItemText: {
    fontSize: Typography.fontSizes.xs,
  },
  summaryItemAmount: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  searchBar: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 48,
    fontSize: Typography.fontSizes.md,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkboxContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
