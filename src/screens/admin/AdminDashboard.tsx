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
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { CategoryIcon } from '../../components/CategoryIcon';
import { GlassCard } from '../../components/GlassCard';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';

type Props = NativeStackScreenProps<any, 'AdminDashboard'>;

const POPULAR_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Orange', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
];

const SELECTABLE_ICONS = [
  'shopping-cart',
  'restaurant',
  'commute',
  'home',
  'electrical-services',
  'water-drop',
  'phone-iphone',
  'wifi',
  'health-and-safety',
  'school',
  'flight',
  'hotel',
  'directions-car',
  'directions-bike',
  'movie',
  'sports-esports',
  'fitness-center',
  'pets',
  'work',
  'savings',
  'credit-card',
  'category',
];

export const AdminDashboard: React.FC<Props> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const {
    stats,
    categories,
    loadStats,
    loadCategories,
    addCategory,
    deleteCategory,
    status,
  } = useAdminStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#EF4444');
  const [catIcon, setCatIcon] = useState('category');

  useEffect(() => {
    loadStats('monthly');
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!catName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      await addCategory({
        name: catName.trim(),
        type: catType,
        color: catColor,
        icon: catIcon,
      });

      // Reset & close
      setCatName('');
      setCatType('expense');
      setCatColor('#EF4444');
      setCatIcon('category');
      setShowAddModal(false);
      Alert.alert('Success', 'Category added successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${name}"? This will delete it system-wide.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
              Alert.alert('Success', 'Category deleted');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  if (status === 'loading' && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSub, { color: themeColors.textMuted }]}>Admin Dashboard</Text>
          <Text style={[styles.headerGreeting, { color: themeColors.text }]}>
            Hey, {user?.name || 'Admin'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('UserManagement')}
            style={[styles.headerBtn, { backgroundColor: themeColors.border }]}
          >
            <MaterialIcons name="people" size={22} color={themeColors.text} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={[styles.headerBtn, { backgroundColor: themeColors.border }]}
          >
            <MaterialIcons name="person" size={22} color={themeColors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Statistics Banner Card */}
        <View style={[styles.statsCard, { backgroundColor: Colors.primary }]}>
          <View style={styles.statsIconBox}>
            <MaterialIcons name="people-outline" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsLabel}>Total Registered Users</Text>
            <Text style={styles.statsValue}>{stats?.total || 0}</Text>
          </View>
        </View>

        {/* Categories Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>System Categories</Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.addCatBtn, { backgroundColor: Colors.primary + '1A' }]}
          >
            <MaterialIcons name="add" size={16} color={Colors.primary} />
            <Text style={[styles.addCatBtnText, { color: Colors.primary }]}>Add Category</Text>
          </Pressable>
        </View>

        {/* Categories List */}
        {categories.length === 0 ? (
          <View style={styles.emptyCategories}>
            <Text style={{ color: themeColors.textMuted }}>No system categories found.</Text>
          </View>
        ) : (
          <View style={styles.categoriesList}>
            {categories.map((cat) => {
              const color = cat.color || Colors.primary;
              return (
                <GlassCard key={cat.id} style={styles.categoryListItem}>
                  <View style={styles.catRow}>
                    <View style={[styles.catIconWrapper, { backgroundColor: color + '15' }]}>
                      <CategoryIcon icon={cat.icon} color={color} size={22} />
                    </View>
                    <View style={styles.catDetails}>
                      <Text style={[styles.catName, { color: themeColors.text }]}>{cat.name}</Text>
                      <Text style={[styles.catType, { color: themeColors.textMuted }]}>
                        Type: {cat.type.toUpperCase()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteCategory(cat.id, cat.name)}
                      style={styles.deleteBtn}
                    >
                      <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Category Modal Sheet */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalSheetOverlay}>
          <View style={[styles.modalSheetContent, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <Text style={[TextStyles.titleMedium, { color: themeColors.text }]}>Add Category</Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <MaterialIcons name="close" size={20} color={themeColors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Category Name */}
              <AppTextField
                label="Category Name"
                placeholder="e.g. Health, Subscriptions"
                value={catName}
                onChangeText={setCatName}
                leftIcon="label"
              />

              {/* Type Toggle */}
              <Text style={[styles.pickerLabel, { color: themeColors.text }]}>Type</Text>
              <View style={[styles.segmentedContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Pressable
                  onPress={() => setCatType('expense')}
                  style={[
                    styles.segmentItem,
                    catType === 'expense' && { backgroundColor: Colors.error + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: catType === 'expense' ? Colors.error : themeColors.textMuted },
                      catType === 'expense' && { fontWeight: 'bold' },
                    ]}
                  >
                    Expense
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setCatType('income')}
                  style={[
                    styles.segmentItem,
                    catType === 'income' && { backgroundColor: Colors.success + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: catType === 'income' ? Colors.success : themeColors.textMuted },
                      catType === 'income' && { fontWeight: 'bold' },
                    ]}
                  >
                    Income
                  </Text>
                </Pressable>
              </View>

              {/* Color Grid */}
              <Text style={[styles.pickerLabel, { color: themeColors.text }]}>Color</Text>
              <View style={styles.colorGrid}>
                {POPULAR_COLORS.map((col) => {
                  const isSelected = catColor === col.hex;
                  return (
                    <Pressable
                      key={col.hex}
                      onPress={() => setCatColor(col.hex)}
                      style={[
                        styles.colorCard,
                        { borderColor: themeColors.border },
                        isSelected && { borderColor: col.hex, borderWidth: 2 },
                      ]}
                    >
                      <View style={[styles.colorDot, { backgroundColor: col.hex }]} />
                      <Text
                        style={[
                          styles.colorText,
                          { color: themeColors.text },
                          isSelected && { fontWeight: 'bold', color: col.hex },
                        ]}
                      >
                        {col.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Icon Select Grid */}
              <Text style={[styles.pickerLabel, { color: themeColors.text }]}>Select Icon</Text>
              <View style={styles.iconGrid}>
                {SELECTABLE_ICONS.map((ico) => {
                  const isSelected = catIcon === ico;
                  return (
                    <Pressable
                      key={ico}
                      onPress={() => setCatIcon(ico)}
                      style={[
                        styles.iconCard,
                        { borderColor: themeColors.border },
                        isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primary + '15', borderWidth: 2 },
                      ]}
                    >
                      <CategoryIcon icon={ico} size={22} color={isSelected ? Colors.primary : themeColors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>

              {/* Action Button */}
              <AppButton
                title="Add Category"
                onPress={handleAddCategory}
                style={{ marginTop: 24, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerSub: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  headerGreeting: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  statsIconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  statsInfo: {},
  statsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  statsValue: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addCatBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyCategories: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  categoriesList: {
    gap: 12,
  },
  categoryListItem: {
    padding: 0,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  catIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  catType: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
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
  pickerLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    marginVertical: 12,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorCard: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconCard: {
    width: '14.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
  },
});
