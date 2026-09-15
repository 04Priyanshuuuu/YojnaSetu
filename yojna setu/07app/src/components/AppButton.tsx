import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dark'
  | 'outline'
  | 'ghost';

interface AppButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}) => {
  const isDisabled = disabled || loading;
  const buttonText = title ?? label ?? '';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'dark' && styles.dark,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost'
              ? colors.blue
              : colors.white
          }
        />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={
                variant === 'outline' || variant === 'ghost'
                  ? colors.blue
                  : colors.white
              }
            />
          ) : null}

          <Text
            style={[
              styles.text,
              (variant === 'outline' || variant === 'ghost') &&
                styles.outlineText,
            ]}
          >
            {buttonText}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primary: {
    backgroundColor: colors.saffron,
  },

  secondary: {
    backgroundColor: colors.blue,
  },

  dark: {
    backgroundColor: '#0F172A',
  },

  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  outlineText: {
    color: colors.blue,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.55,
  },
});

export default AppButton;