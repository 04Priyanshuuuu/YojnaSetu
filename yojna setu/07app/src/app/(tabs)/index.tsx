import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Dimensions, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

function SearchIcon({ color = Colors.slate400 }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
      <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRight({ color = Colors.white }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const QUICK_CATEGORIES = [
  { label: 'Agriculture', emoji: '\uD83C\uDF3E', category: 'Agriculture' },
  { label: 'Education', emoji: '\uD83D\uDCDA', category: 'Education' },
  { label: 'Health', emoji: '\uD83C\uDFE5', category: 'Health' },
  { label: 'Housing', emoji: '\uD83C\uDFE0', category: 'Housing' },
  { label: 'Business', emoji: '\uD83D\uDCBC', category: 'Business' },
  { label: 'Women', emoji: '\uD83D\uDC69', category: 'Women' },
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/(tabs)/schemes', params: { q: searchQuery.trim() } });
    }
  }, [searchQuery, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.burgundy} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>YS</Text></View>
              <TouchableOpacity
                style={styles.loginBadge}
                onPress={() => isAuthenticated ? router.push('/(tabs)/profile') : router.push('/(auth)/login')}
              >
                <Text style={styles.loginBadgeText}>
                  {isAuthenticated ? (user?.full_name?.split(' ')[0] ?? 'Profile') : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroTitle}>
              {isAuthenticated ? `Welcome, ${user?.full_name?.split(' ')[0] ?? 'there'}!` : 'Find Government Schemes'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Discover 90+ central and state government schemes tailored for you
            </Text>
          </View>
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Search schemes, ministries..."
                placeholderTextColor={Colors.slate400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleSearch} style={styles.searchGo}>
                  <ArrowRight color={Colors.burgundy} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value="90+" label="Schemes" />
          <View style={styles.statDivider} />
          <StatCard value="128" label="Partners" />
          <View style={styles.statDivider} />
          <StatCard value="12" label="Languages" />
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/(tabs)/match')} activeOpacity={0.85}>
            <Text style={styles.primaryCtaText}>Find Matching Schemes</Text>
            <ArrowRight />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryCta} onPress={() => router.push('/(tabs)/schemes')} activeOpacity={0.85}>
            <Text style={styles.secondaryCtaText}>Explore All Schemes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Browse by Category</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {QUICK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.category}
              style={styles.categoryPill}
              onPress={() => router.push({ pathname: '/(tabs)/schemes', params: { category: cat.category } })}
              activeOpacity={0.75}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>How It Works</Text></View>
        <View style={styles.infoCards}>
          {[
            { step: '1', title: 'Build Your Profile', desc: 'Enter your details once for personalized matches' },
            { step: '2', title: 'AI Smart Match', desc: 'Our AI finds schemes most relevant to your profile' },
            { step: '3', title: 'Apply & Track', desc: 'Track your applications and documents in one place' },
          ].map((item) => (
            <View key={item.step} style={styles.infoCard}>
              <View style={styles.stepBadge}><Text style={styles.stepNumber}>{item.step}</Text></View>
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>{item.title}</Text>
                <Text style={styles.infoCardDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {!isAuthenticated && (
          <View style={styles.authPrompt}>
            <Text style={styles.authPromptTitle}>Get personalized recommendations</Text>
            <Text style={styles.authPromptDesc}>Create a free account to unlock Smart Match, save schemes, and track applications.</Text>
            <TouchableOpacity style={styles.authPromptBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.authPromptBtnText}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.authPromptLink}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  hero: { backgroundColor: Colors.burgundy, paddingBottom: 32 },
  heroContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: 16, paddingBottom: 8 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoBadge: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  logoBadgeText: { color: Colors.burgundy, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.base },
  loginBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  loginBadgeText: { color: Colors.white, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium },
  heroTitle: { color: Colors.white, fontSize: Fonts.sizes['3xl'], fontWeight: Fonts.weights.bold, lineHeight: 38, marginBottom: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: Fonts.sizes.base, lineHeight: 22 },
  searchWrapper: { paddingHorizontal: Spacing.screenPadding, marginTop: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: Fonts.sizes.base, color: Colors.textPrimary },
  searchGo: { padding: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.screenPadding, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, paddingVertical: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Fonts.sizes['2xl'], fontWeight: Fonts.weights.bold, color: Colors.burgundy },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  ctaSection: { paddingHorizontal: Spacing.screenPadding, marginTop: Spacing.xl, gap: Spacing.sm },
  primaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.burgundy, borderRadius: Radius.xl, paddingVertical: 16, gap: 8 },
  primaryCtaText: { color: Colors.white, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  secondaryCta: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.burgundy, borderRadius: Radius.xl, paddingVertical: 14 },
  secondaryCtaText: { color: Colors.burgundy, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  sectionHeader: { paddingHorizontal: Spacing.screenPadding, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.textPrimary },
  categoriesRow: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.sm },
  categoryPill: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12, minWidth: 72, borderWidth: 1, borderColor: Colors.border },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryLabel: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  infoCards: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.sm },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  stepBadge: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.burgundySubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  stepNumber: { fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.bold, color: Colors.burgundy },
  infoCardContent: { flex: 1 },
  infoCardTitle: { fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.semibold, color: Colors.textPrimary, marginBottom: 4 },
  infoCardDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, lineHeight: 20 },
  authPrompt: { margin: Spacing.screenPadding, marginTop: Spacing.xl, backgroundColor: Colors.burgundySubtle, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(134,24,35,0.15)' },
  authPromptTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.burgundy, marginBottom: 8 },
  authPromptDesc: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  authPromptBtn: { backgroundColor: Colors.burgundy, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  authPromptBtnText: { color: Colors.white, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.base },
  authPromptLink: { color: Colors.burgundy, textAlign: 'center', fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium },
});
