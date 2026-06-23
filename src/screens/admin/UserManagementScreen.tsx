import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { useAdminStore } from '../../store/adminStore';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { DateFormatter } from '../../utils/dates';
import { GlassCard } from '../../components/GlassCard';

type Props = NativeStackScreenProps<any, 'UserManagement'>;
type Range = 'weekly' | 'monthly' | 'yearly';

export const UserManagementScreen: React.FC<Props> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const {
    users,
    stats,
    loadUsers,
    loadStats,
    deleteUser,
    status,
  } = useAdminStore();

  const [range, setRange] = useState<Range>('monthly');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
    loadStats(range);
  }, [range]);

  const handleConfirmDelete = (userId: string, name: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // Construct chart data for registrations
  const chartData = React.useMemo(() => {
    if (!stats || !stats.chartPoints || stats.chartPoints.length === 0) return [];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return stats.chartPoints.map((point) => {
      let label = `${point.year}`;
      if (point.week !== undefined) {
        label = `W${point.week}`;
      } else if (point.month !== undefined) {
        label = monthNames[point.month - 1] || `${point.month}`;
      }

      return {
        value: point.count,
        label: label,
        frontColor: Colors.primary,
        topLabelComponent: () => (
          <Text style={{ fontSize: 9, color: themeColors.text, fontWeight: 'bold', marginBottom: 2 }}>
            {point.count}
          </Text>
        ),
      };
    });
  }, [stats, themeColors]);

  const renderStatsGrid = () => {
    if (!stats) return null;

    const cards = [
      { label: 'Total Users', value: stats.total, icon: 'people', color: Colors.primary },
      { label: 'This Week', value: stats.thisWeek, icon: 'date-range', color: Colors.secondary },
      { label: 'This Month', value: stats.thisMonth, icon: 'calendar-today', color: Colors.success },
      { label: 'This Year', value: stats.thisYear, icon: 'analytics', color: Colors.warning },
    ];

    return (
      <View style={styles.statsGrid}>
        {cards.map((c, idx) => (
          <View
            key={idx}
            style={[
              styles.gridCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: c.color + '15' }]}>
              <MaterialIcons name={c.icon as any} size={20} color={c.color} />
            </View>
            <View style={styles.gridInfo}>
              <Text style={[styles.gridValue, { color: themeColors.text }]}>{c.value}</Text>
              <Text style={[styles.gridLabel, { color: themeColors.textMuted }]} numberOfLines={1}>
                {c.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)' }]}
        >
          <MaterialIcons name="chevron-left" size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[TextStyles.bodyLarge, { color: themeColors.text, fontWeight: 'bold' }]}>
          User Management
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stat Cards */}
        {renderStatsGrid()}

        {/* Chart Header */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 24 }]}>
          Registration Trend
        </Text>

        {/* Time range selector chips */}
        <View style={styles.rangeSelector}>
          {(['weekly', 'monthly', 'yearly'] as Range[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeChip,
                { borderColor: themeColors.border },
                range === r && { backgroundColor: Colors.primary, borderColor: Colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  { color: themeColors.text },
                  range === r && { color: '#FFFFFF', fontWeight: 'bold' },
                ]}
              >
                {r.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={[styles.chartContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {chartData.length > 0 ? (
            <BarChart
              data={chartData}
              barWidth={18}
              spacing={16}
              roundedTop
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={themeColors.border}
              yAxisTextStyle={{ color: themeColors.textMuted, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: themeColors.text, fontSize: 9, fontWeight: 'bold' }}
              height={140}
              isAnimated
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={{ color: themeColors.textMuted }}>No trend data found.</Text>
            </View>
          )}
        </View>

        {/* Users Details Title */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 28 }]}>
          User Directories
        </Text>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <MaterialIcons name="search" size={20} color={themeColors.textMuted} />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: themeColors.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={themeColors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* User Accounts List */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyUsers}>
            <Text style={{ color: themeColors.textMuted }}>No users found.</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {filteredUsers.map((userAccount, idx) => {
              const isAdmin = userAccount.role === 'admin';
              const nameInitial = userAccount.name ? userAccount.name[0].toUpperCase() : '?';

              return (
                <GlassCard key={userAccount.id} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: Colors.primary + '20' }]}>
                      <Text style={styles.avatarText}>{nameInitial}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: themeColors.text }]}>{userAccount.name}</Text>
                        <View
                          style={[
                            styles.roleBadge,
                            { backgroundColor: isAdmin ? Colors.warning + '20' : Colors.secondary + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: isAdmin ? Colors.warning : Colors.secondary },
                            ]}
                          >
                            {userAccount.role.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.userEmail, { color: themeColors.textMuted }]}>{userAccount.email}</Text>
                      
                      <View style={styles.metadataRow}>
                        <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                          Cur: {userAccount.currency}
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: themeColors.border }]} />
                        <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                          Joined {DateFormatter.format(userAccount.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {!isAdmin && (
                      <Pressable
                        onPress={() => handleConfirmDelete(userAccount.id, userAccount.name)}
                        style={styles.deleteUserBtn}
                      >
                        <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  gridIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gridInfo: {
    flex: 1,
  },
  gridValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  gridLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: 12,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  rangeChipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyChart: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: Typography.fontSizes.sm,
    padding: 0,
  },
  emptyUsers: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  userList: {
    gap: 12,
  },
  userCard: {
    padding: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaText: {
    fontSize: 10,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  deleteUserBtn: {
    padding: 6,
  },
});
