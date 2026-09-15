import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Unauthorized: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <ShieldAlert size={32} color="#be123c" strokeWidth={2.5} />
        </View>

        {/* Heading */}
        <Text style={styles.title}>
          403 — {t('errors.unauthorized')}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {t('errors.unauthorizedDesc')}
        </Text>

        {/* Sign In Button */}
        <View style={styles.buttonWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/login')}
          >
            <ArrowLeft size={16} color="#ffffff" strokeWidth={2.5} />

            <Text style={styles.buttonText}>
              {t('auth.signInBtn')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Unauthorized;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 80,
    alignItems: 'center',
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 12,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 400,
  },

  buttonWrapper: {
    paddingTop: 8,
    width: '100%',
    alignItems: 'center',
  },

  signInButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

