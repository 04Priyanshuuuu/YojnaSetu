import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Scale, Check } from 'lucide-react-native';

import { useComparison } from '../../context/ComparisonContext';

interface CompareButtonProps {
  schemeId: string;
  variant?: 'button' | 'compact' | 'icon' | 'badge';
  style?: ViewStyle;
}

export const CompareButton: React.FC<CompareButtonProps> = ({
  schemeId,
  variant = 'button',
  style,
}) => {
  const { t } = useTranslation();
  const { isInComparison, toggleComparison } = useComparison();

  const selected = isInComparison(schemeId);

  const accessibilityLabel = selected
    ? t('compare.inComparison', 'In Comparison')
    : t('compare.addToCompare', 'Add to Compare');

  const handlePress = () => {
    toggleComparison(schemeId);
  };

  /*
   * Compact variant
   */
  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          selected,
        }}
        style={({ pressed }) => [
          styles.compactButton,
          selected
            ? styles.compactSelected
            : styles.compactUnselected,
          pressed && styles.pressed,
          style,
        ]}
      >
        {selected ? (
          <>
            <Check
              size={14}
              color="#059669"
              strokeWidth={2.5}
            />

            <Text style={styles.compactSelectedText}>
              {t('compare.comparing', 'Comparing')}
            </Text>
          </>
        ) : (
          <>
            <Scale
              size={14}
              color="#64748b"
              strokeWidth={2}
            />

            <Text style={styles.compactUnselectedText}>
              {t('compare.compare', 'Compare')}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  /*
   * Icon-only variant
   */
  if (variant === 'icon') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          selected,
        }}
        style={({ pressed }) => [
          styles.iconButton,
          selected
            ? styles.iconSelected
            : styles.iconUnselected,
          pressed && styles.pressed,
          style,
        ]}
      >
        <Scale
          size={18}
          color={selected ? '#ffffff' : '#475569'}
          strokeWidth={2}
        />
      </Pressable>
    );
  }

  /*
   * Badge variant
   *
   * The web component did not have a separate rendering branch
   * for "badge", so preserve the same behavior as the default
   * button variant.
   */
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        selected,
      }}
      style={({ pressed }) => [
        styles.button,
        selected
          ? styles.buttonSelected
          : styles.buttonUnselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {selected ? (
        <>
          <Check
            size={16}
            color="#ffffff"
            strokeWidth={2.5}
          />

          <Text style={styles.buttonSelectedText}>
            {t(
              'compare.addedToCompare',
              'Added to Compare'
            )}
          </Text>
        </>
      ) : (
        <>
          <Scale
            size={16}
            color="#0c4a6e"
            strokeWidth={2}
          />

          <Text style={styles.buttonUnselectedText}>
            {t(
              'compare.addToCompare',
              'Add to Compare'
            )}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /*
   * Default button
   */
  button: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  buttonSelected: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },

  buttonUnselected: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },

  buttonSelectedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  buttonUnselectedText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  /*
   * Compact button
   */
  compactButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },

  compactSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },

  compactUnselected: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },

  compactSelectedText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '700',
  },

  compactUnselectedText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },

  /*
   * Icon-only button
   */
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  iconSelected: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },

  iconUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },

  /*
   * Native touch feedback
   */
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});

export default CompareButton;

