import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Category } from '../../store/transactionStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';
import { CurrencyConverter, CurrencyFormatter } from '../../utils/currency';
import { DateFormatter } from '../../utils/dates';

type Props = NativeStackScreenProps<UserStackParamList, 'AddTransaction'>;

export const AddTransactionScreen: React.FC<Props> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const currency = user?.currency || 'USD';
  const currencySymbol = CurrencyFormatter.getSymbol(currency);
  const dateFormat = user?.dateFormat || 'MM/DD/YYYY';

  const { categories, loadCategories, addTransaction, status } = useTransactionStore();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Custom Date Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Clear selected category when type changes
  useEffect(() => {
    setSelectedCategory(null);
  }, [type]);

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      // Convert amount in user currency back to USD before saving
      const amountInLocal = parseFloat(amount);
      const amountInUSD = CurrencyConverter.convert(amountInLocal, currency, 'USD');

      await addTransaction({
        amount: amountInUSD,
        type,
        categoryId: selectedCategory.id,
        description: description.trim(),
        date: selectedDate.toISOString(),
      });

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save transaction');
    }
  };

  // Calendar Helper Functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday etc.
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
    
    const daysArray = [];
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({ day: 0, isCurrentMonth: false });
    }
    // Add actual days
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

        {/* Week Days Headers */}
        <View style={styles.weekHeaders}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={idx} style={[styles.weekDayLabel, { color: themeColors.textMuted }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {daysArray.map((item, index) => {
            const isSelected =
              item.isCurrentMonth &&
              selectedDate.getDate() === item.day &&
              selectedDate.getMonth() === pickerMonth &&
              selectedDate.getFullYear() === pickerYear;

            const isToday =
              item.isCurrentMonth &&
              new Date().getDate() === item.day &&
              new Date().getMonth() === pickerMonth &&
              new Date().getFullYear() === pickerYear;

            return (
              <Pressable
                key={index}
                disabled={!item.isCurrentMonth}
                onPress={() => {
                  const newDate = new Date(pickerYear, pickerMonth, item.day);
                  setSelectedDate(newDate);
                  setShowDatePicker(false);
                }}
                style={[
                  styles.calendarDayCell,
                  isSelected && { backgroundColor: Colors.primary },
                  !isSelected && isToday && { borderWidth: 1, borderColor: Colors.primary },
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

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)' }]}
          >
            <MaterialIcons name="chevron-left" size={28} color={themeColors.text} />
          </Pressable>
          <Text style={[TextStyles.bodyLarge, { color: themeColors.text, fontWeight: 'bold' }]}>
            Add Transaction
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Type Switcher */}
        <View style={[styles.segmentedContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Pressable
            onPress={() => setType('expense')}
            style={[
              styles.segmentItem,
              type === 'expense' && { backgroundColor: Colors.error + '22' },
            ]}
          >
            <MaterialIcons
              name="remove-circle-outline"
              size={18}
              color={type === 'expense' ? Colors.error : themeColors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                { color: type === 'expense' ? Colors.error : themeColors.textMuted },
                type === 'expense' && { fontWeight: 'bold' },
              ]}
            >
              Expense
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setType('income')}
            style={[
              styles.segmentItem,
              type === 'income' && { backgroundColor: Colors.success + '22' },
            ]}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={18}
              color={type === 'income' ? Colors.success : themeColors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                { color: type === 'income' ? Colors.success : themeColors.textMuted },
                type === 'income' && { fontWeight: 'bold' },
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <AppTextField
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon="attach-money"
          prefixText={currencySymbol}
        />

        {/* Category List Label */}
        <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Category</Text>

        {filteredCategories.length === 0 ? (
          <Text style={[styles.emptyCategoriesText, { color: Colors.error }]}>
            No categories available. Please sync categories.
          </Text>
        ) : (
          <View style={styles.categoryGrid}>
            {filteredCategories.map((item) => {
              const isSelected = selectedCategory?.id === item.id;
              const catColor = item.color || Colors.primary;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedCategory(item)}
                  style={[
                    styles.categoryCard,
                    { borderColor: themeColors.border },
                    isSelected && {
                      borderColor: catColor,
                      backgroundColor: catColor + '15',
                      borderWidth: 2,
                    },
                  ]}
                >
                  <View style={[styles.catIconCircle, { backgroundColor: catColor + '1F' }]}>
                    <Text style={styles.catEmoji}>{item.icon || '💰'}</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.categoryName,
                      { color: themeColors.text },
                      isSelected && { color: catColor, fontWeight: 'bold' },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Description Field */}
        <AppTextField
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChangeText={setDescription}
          leftIcon="description"
        />

        {/* Date Selector Field */}
        <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Date</Text>
        <Pressable
          onPress={() => {
            setPickerYear(selectedDate.getFullYear());
            setPickerMonth(selectedDate.getMonth());
            setShowDatePicker(true);
          }}
          style={[
            styles.datePickerSelector,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <MaterialIcons name="calendar-today" size={20} color={themeColors.textMuted} style={styles.fieldIcon} />
          <Text style={[styles.datePickerText, { color: themeColors.text }]}>
            {DateFormatter.format(selectedDate, dateFormat)}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={themeColors.textMuted} />
        </Pressable>

        {/* Action Button */}
        <AppButton
          title="Save Transaction"
          onPress={handleSave}
          loading={status === 'loading'}
          style={styles.saveBtn}
        />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={{ width: '90%' }}>
            {renderCalendar()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  segmentText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyCategoriesText: {
    fontSize: Typography.fontSizes.sm,
    marginVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
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
  categoryName: {
    fontSize: 10,
    textAlign: 'center',
  },
  datePickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 32,
  },
  fieldIcon: {
    marginRight: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  saveBtn: {
    marginTop: 16,
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
