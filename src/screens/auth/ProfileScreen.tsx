import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

export const ProfileScreen: React.FC = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { user, status, updateProfile, logout } = useAuthStore();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar || '');
      setCurrency(user.currency || 'USD');
      setDateFormat(user.dateFormat || 'MM/DD/YYYY');
    }
  }, [user, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        currency,
        dateFormat,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const pickImage = async () => {
    // Request permission first
    const { status: cameraRollStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraRollStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to pick an avatar.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Img = `data:image/png;base64,${result.assets[0].base64}`;
        setAvatar(base64Img);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderAvatar = () => {
    if (avatar && avatar.startsWith('data:image')) {
      return <Image source={{ uri: avatar }} style={styles.avatarImage} />;
    } else if (avatar) {
      return <Image source={{ uri: avatar }} style={styles.avatarImage} onError={() => setAvatar('')} />;
    }
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.border }]}>
        <MaterialIcons name="person" size={50} color={themeColors.textMuted} />
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[TextStyles.titleMedium, { color: themeColors.text }]}>Profile Settings</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.actionBtn}>
            <MaterialIcons name={isEditing ? 'close' : 'edit'} size={24} color={Colors.primary} />
          </Pressable>
          {!isEditing && (
            <Pressable onPress={handleLogout} style={styles.actionBtn}>
              <MaterialIcons name="logout" size={24} color={Colors.error} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.avatarContainer}>
        {renderAvatar()}
        {isEditing && (
          <Pressable onPress={pickImage} style={styles.cameraBtn}>
            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <View style={styles.form}>
        <AppTextField
          label="Full Name"
          value={name}
          onChangeText={setName}
          leftIcon="person"
          inputStyle={!isEditing ? { color: themeColors.textMuted } : undefined}
          style={!isEditing ? { opacity: 0.8 } : undefined}
        />

        <AppTextField
          label="Avatar URL"
          placeholder="https://example.com/avatar.jpg"
          value={avatar}
          onChangeText={setAvatar}
          leftIcon="image"
          inputStyle={!isEditing ? { color: themeColors.textMuted } : undefined}
          style={!isEditing ? { opacity: 0.8 } : undefined}
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Currency Preference</Text>
        <View style={styles.selectorContainer}>
          {CURRENCIES.map((curr) => (
            <Pressable
              key={curr}
              disabled={!isEditing}
              onPress={() => setCurrency(curr)}
              style={[
                styles.selectorItem,
                { borderColor: themeColors.border },
                currency === curr && { backgroundColor: Colors.primary, borderColor: Colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: themeColors.text },
                  currency === curr && { color: '#FFFFFF', fontWeight: 'bold' },
                ]}
              >
                {curr}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: themeColors.text, marginTop: 24 }]}>Date Format</Text>
        <View style={styles.selectorContainer}>
          {DATE_FORMATS.map((format) => (
            <Pressable
              key={format}
              disabled={!isEditing}
              onPress={() => setDateFormat(format)}
              style={[
                styles.selectorItem,
                { borderColor: themeColors.border, flex: 1, paddingVertical: 12 },
                dateFormat === format && { backgroundColor: Colors.primary, borderColor: Colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: themeColors.text, fontSize: Typography.fontSizes.sm },
                  dateFormat === format && { color: '#FFFFFF', fontWeight: 'bold' },
                ]}
              >
                {format}
              </Text>
            </Pressable>
          ))}
        </View>

        {isEditing && (
          <AppButton
            title="Save Changes"
            onPress={handleSave}
            loading={status === 'loading'}
            style={styles.saveBtn}
          />
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 12,
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 32,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  form: {
    width: '100%',
    marginBottom: 80,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    marginBottom: 8,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  saveBtn: {
    marginTop: 40,
  },
});
