import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryIconProps {
  icon: string;
  size?: number;
  color?: string;
}

// Map Flutter/Material design icon names (snake_case) to Expo MaterialIcons names (kebab-case / standard names)
const iconNameMap: Record<string, keyof typeof MaterialIcons.glyphMap | string> = {
  'shopping_cart': 'shopping-cart',
  'restaurant': 'restaurant',
  'commute': 'commute',
  'home': 'home',
  'electrical_services': 'electrical-services',
  'water_drop': 'water-drop',
  'phone_iphone': 'phone-iphone',
  'wifi': 'wifi',
  'health_and_safety': 'health-and-safety',
  'school': 'school',
  'flight': 'flight',
  'hotel': 'hotel',
  'directions_car': 'directions-car',
  'directions_bus': 'directions-bus',
  'directions_bike': 'directions-bike',
  'movie': 'movie',
  'sports_esports': 'sports-esports',
  'fitness_center': 'fitness-center',
  'spa': 'spa',
  'local_grocery_store': 'local-grocery-store',
  'pets': 'pets',
  'child_care': 'child-care',
  'work': 'work',
  'attach_money': 'attach-money',
  'trending_up': 'trending-up',
  'payment': 'payment',
  'account_balance': 'account-balance',
  'savings': 'savings',
  'credit_card': 'credit-card',
  'receipt_long': 'receipt-long',
  'inventory': 'inventory',
  'construction': 'construction',
  'cleaning_services': 'cleaning-services',
  'local_shipping': 'local-shipping',
  'delivery_dining': 'delivery-dining',
  'fastfood': 'fastfood',
  'local_cafe': 'local-cafe',
  'cake': 'cake',
  'celebration': 'celebration',
  'checkroom': 'checkroom',
  'stroller': 'child-friendly', // closest in material icons
  'toys': 'toys',
  'category': 'category',
  'help_outline': 'help-outline',
  'more_horiz': 'more-horiz',
  'person': 'person',
  'group': 'group',
  'public': 'public',
  'star': 'star',
  'favorite': 'favorite',
};

const isEmoji = (iconStr: string): boolean => {
  if (!iconStr) return false;
  // Common emoji range checks
  const charCode = iconStr.codePointAt(0) || 0;
  return charCode > 0x1f000 || iconStr.length > 2; // general emoji checks
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  size = 24,
  color = '#FFFFFF',
}) => {
  if (isEmoji(icon)) {
    return <Text style={{ fontSize: size * 0.9 }}>{icon}</Text>;
  }

  const mappedName = iconNameMap[icon] || icon || 'help-outline';
  return (
    <MaterialIcons
      name={mappedName as any}
      size={size}
      color={color}
    />
  );
};
