import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Category } from '../../store/transactionStore';
import { useBudgetStore, Budget } from '../../store/budgetStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CategoryIcon } from '../../components/CategoryIcon';
import { GlassCard } from '../../components/GlassCard';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';
import { CurrencyConverter, CurrencyFormatter } from '../../utils/currency';
import { DateFormatter } from '../../utils/dates';

type Props = NativeStackScreenProps<UserStackParamList, 'BudgetOverview'>;

export const BudgetScreen: React.FC<Props> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const currency = user?.currency || 'USD';
  const currencySymbol = CurrencyFormatter.getSymbol(currency);
  const dateFormat = user?.dateFormat || 'MM/DD/YYYY';

  const { budgets, loadBudgets, addBudget, status: budgetStatus } = useBudgetStore();
  const { transactions, categories, loadTransactions, loadCategories } = useTransactionStore();

  // Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days ahead

  // Date selection states inside modal
  const [datePickingTarget, setDatePickingTarget] = useState<'start' | 'end' | null>(null);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadBudgets();
    loadTransactions();
    loadCategories();
  }, []);

  // Filter categories to only expense type
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate spent amount for a specific budget
  const calculateSpent = (budget: Budget) => {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);

    const spent = transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          tx.category.id === budget.category.id &&
          tx.type === 'expense' &&
          txDate >= budgetStart &&
          txDate <= budgetEnd
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    return spent;
  };

  const handleCreateBudget = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (startDate >= endDate) {
      Alert.alert('Error', 'End Date must be after Start Date');
      return;
    }

    try {
      // Convert budget amount from local currency to USD before sending to backend
      const enteredAmount = parseFloat(amount);
      const amountInUSD = CurrencyConverter.convert(enteredAmount, currency, 'USD');

      await addBudget({
        categoryId: selectedCategory.id,
        amount: amountInUSD,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Clear Form & Close Modal
      setSelectedCategory(null);
      setAmount('');
      setStartDate(new Date());
      setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setShowAddModal(false);
      Alert.alert('Success', 'Budget set successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create budget');
    }
  };

  // Calendar Helper Functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({ day: 0, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push({ day: i, isCurrentMonth: true });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const changeMonth = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
        if (pickerMonth === 0) {
          setPickerMonth(11);
          setPickerYear(pickerYear - 1);
        } else {
          setPickerMonth(pickerMonth - 1);
        }
      } else {
        if (pickerMonth === 11) {
          setPickerMonth(0);
          setPickerYear(pickerYear + 1);
        } else {
          setPickerMonth(pickerMonth + 1);
        }
      }
    };

    return (
      <View style={[styles.calendarCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => changeMonth('prev')} style={styles.calNavBtn}>
            <MaterialIcons name="chevron-left" size={24} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.calendarMonthText, { color: themeColors.text }]}>
            {monthNames[pickerMonth]} {pickerYear}
          </Text>
          <Pressable onPress={() => changeMonth('next')} style={styles.calNavBtn}>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.text} />
          </Pressable>
        </View>

        <View style={styles.weekHeaders}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={idx} style={[styles.weekDayLabel, { color: themeColors.textMuted }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {daysArray.map((item, index) => {
            const dateToCompare = datePickingTarget === 'start' ? startDate : endDate;
            const isSelected =
              item.isCurrentMonth &&
              dateToCompare.getDate() === item.day &&
              dateToCompare.getMonth() === pickerMonth &&
              dateToCompare.getFullYear() === pickerYear;

            return (
              <Pressable
                key={index}
                disabled={!item.isCurrentMonth}
                onPress={() => {
                  const newDate = new Date(pickerYear, pickerMonth, item.day);
                  if (datePickingTarget === 'start') {
                    setStartDate(newDate);
                  } else {
                    setEndDate(newDate);
                  }
                  setDatePickingTarget(null);
                }}
                style={[
                  styles.calendarDayCell,
                  isSelected && { backgroundColor: Colors.primary },
                ]}
              >
                {item.day > 0 && (
                  <Text
                    style={[
                      styles.calendarDayText,
                      { color: item.isCurrentMonth ? themeColors.text : 'transparent' },
                      isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                    ]}
                  >
                    {item.day}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="account-balance-wallet" size={72} color={themeColors.textMuted + '50'} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Budgets Set</Text>
        <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
          Create a budget limits tracker for expense categories to save money!
        </Text>
        <AppButton
          title="Create Budget"
          onPress={() => setShowAddModal(true)}
          style={{ width: 200, marginTop: 24 }}
        />
      </View>
    );
  };

  if (budgetStatus === 'loading' && budgets.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: themeColors.background }]}>
      {/* Top Header Bar */}
      <View style={styles.appHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)' }]}
        >
          <MaterialIcons name="chevron-left" size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[TextStyles.bodyLarge, { color: themeColors.text, fontWeight: 'bold' }]}>
          Category Budgets
        </Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.backBtn, { backgroundColor: Colors.primary + '20' }]}
        >
          <MaterialIcons name="add" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      {budgets.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {budgets.map((budget) => {
            const spent = calculateSpent(budget);
            const percent = budget.amount > 0 ? Math.min(spent / budget.amount, 1.0) : 0;
            const isOver = spent > budget.amount;
            const catColor = budget.category.color || Colors.primary;

            // Currency Conversions
            const spentLocal = CurrencyConverter.convert(spent, 'USD', currency);
            const budgetLimitLocal = CurrencyConverter.convert(budget.amount, 'USD', currency);

            return (
              <GlassCard key={budget.id} style={styles.budgetCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: catColor + '1F' }]}>
                    <CategoryIcon icon={budget.category.icon} color={catColor} />
                  </View>
                  <View style={styles.titleArea}>
                    <Text style={[styles.catName, { color: themeColors.text }]}>{budget.category.name}</Text>
                    <Text style={[styles.spentRatioText, { color: themeColors.textMuted }]}>
                      {CurrencyFormatter.format(spentLocal, currency)} of{' '}
                      {CurrencyFormatter.format(budgetLimitLocal, currency)} spent
                    </Text>
                  </View>
                  {isOver && (
                    <MaterialIcons name="warning" size={24} color={Colors.error} />
                  )}
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percent * 100}%`,
                        backgroundColor: isOver ? Colors.error : catColor,
                      },
                    ]}
                  />
                </View>

                {/* Footnotes */}
                <View style={styles.footerRow}>
                  <Text
                    style={[
                      styles.percentText,
                      { color: isOver ? Colors.error : themeColors.textMuted },
                      isOver && { fontWeight: 'bold' },
                    ]}
                  >
                    {Math.round(percent * 100)}% used
                  </Text>
                  <Text style={[styles.expiryText, { color: themeColors.textMuted }]}>
                    Ends {DateFormatter.format(budget.endDate, dateFormat)}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {budgets.length > 0 && (
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.fab, { backgroundColor: Colors.primary }]}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Add Budget Sheet Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalSheetOverlay}>
          <View style={[styles.modalSheetContent, { backgroundColor: themeColors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalSheetHeader}>
              <Text style={[TextStyles.titleMedium, { color: themeColors.text }]}>Create Budget</Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <MaterialIcons name="close" size={20} color={themeColors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Category Picker */}
              <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Category</Text>
              {expenseCategories.length === 0 ? (
                <Text style={{ color: Colors.error, marginVertical: 12 }}>
                  Please load/create categories first.
                </Text>
              ) : (
                <View style={styles.categoryGrid}>
                  {expenseCategories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    const catColor = cat.color || Colors.primary;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat)}
                        style={[
                          styles.catGridCard,
                          { borderColor: themeColors.border },
                          isSelected && {
                            borderColor: catColor,
                            backgroundColor: catColor + '15',
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <View style={[styles.catIconCircle, { backgroundColor: catColor + '1F' }]}>
                          <Text style={styles.catEmoji}>{cat.icon || '💰'}</Text>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.catGridName,
                            { color: themeColors.text },
                            isSelected && { color: catColor, fontWeight: 'bold' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Amount Input */}
              <AppTextField
                label="Budget limit"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                leftIcon="attach-money"
                prefixText={currencySymbol}
              />

              {/* Date Ranges selectors */}
              <View style={styles.dateSelectorRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Start Date</Text>
                  <Pressable
                    onPress={() => {
                      setPickerYear(startDate.getFullYear());
                      setPickerMonth(startDate.getMonth());
                      setDatePickingTarget('start');
                    }}
                    style={[styles.dateSelectorField, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  >
                    <Text style={[styles.dateSelectorText, { color: themeColors.text }]}>
                      {DateFormatter.format(startDate, dateFormat)}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { color: themeColors.text }]}>End Date</Text>
                  <Pressable
                    onPress={() => {
                      setPickerYear(endDate.getFullYear());
                      setPickerMonth(endDate.getMonth());
                      setDatePickingTarget('end');
                    }}
                    style={[styles.dateSelectorField, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  >
                    <Text style={[styles.dateSelectorText, { color: themeColors.text }]}>
                      {DateFormatter.format(endDate, dateFormat)}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Submit */}
              <AppButton
                title="Create Budget"
                onPress={handleCreateBudget}
                loading={budgetStatus === 'loading'}
                style={{ marginTop: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickingTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickingTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickingTarget(null)}>
          <Pressable style={{ width: '90%' }}>
            {renderCalendar()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appHeader: {
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
  scrollList: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  budgetCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
  },
  catName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  spentRatioText: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    fontSize: Typography.fontSizes.xs,
  },
  expiryText: {
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheetContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    marginVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  catGridCard: {
    width: '22%',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catEmoji: {
    fontSize: 20,
  },
  catGridName: {
    fontSize: 10,
    textAlign: 'center',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateSelectorField: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateSelectorText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
  },
  calendarMonthText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  weekHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayLabel: {
    width: '13%',
    textAlign: 'center',
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  calendarDayText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});
