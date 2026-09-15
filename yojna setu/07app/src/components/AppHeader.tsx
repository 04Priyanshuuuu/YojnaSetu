import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'YojnaSetu',
  subtitle,
  showLogo = true,
  rightContent,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showLogo && (
          <View style={styles.logo}>
            <Ionicons
              name="shield-checkmark"
              size={21}
              color={colors.saffron}
            />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>

          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {rightContent ? (
        <View style={styles.rightSection}>
          {rightContent}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.saffronLight,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  titleContainer: {
    flexShrink: 1,
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textMuted,
  },

  rightSection: {
    marginLeft: 12,
  },
});

export default AppHeader;