import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";
import AppButton from "../../components/AppButton";
import { schemeApi } from "../../api/schemeApi";
import { colors, radius, shadows, spacing } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Category {
  title: string;
  description: string;
  count: string;
  query: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  iconColor: string;
}

interface HowItWorksItem {
  step: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  iconColor: string;
}

const HERO_SLIDES = [
  {
    eyebrow: "Government Welfare Portal",
    title: "Find Government Schemes That Fit You",
    description:
      "Discover welfare schemes, check eligibility, and find the right government support for you and your family.",
    icon: "people-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    eyebrow: "Simple & Accessible",
    title: "Discover Benefits Made for You",
    description:
      "Explore government schemes across education, agriculture, health, business and social welfare.",
    icon: "sparkles-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    eyebrow: "Trusted Information",
    title: "Government Schemes, Simplified",
    description:
      "Understand eligibility, benefits and official application routes in one simple mobile experience.",
    icon: "shield-checkmark-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    eyebrow: "Smart Discovery",
    title: "Find Support That Matches You",
    description:
      "Use YojnaSetu to discover schemes based on your needs, interests and circumstances.",
    icon: "search-outline" as keyof typeof Ionicons.glyphMap,
  },
];

const CATEGORIES: Category[] = [
  {
    title: "MSME & Business",
    description:
      "Loans, entrepreneurship support and business development schemes.",
    count: "PMEGP, MUDRA, Stand-Up India",
    query: "MUDRA",
    icon: "business-outline",
    background: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    title: "Agriculture",
    description:
      "Financial support, farming assistance and agricultural schemes.",
    count: "KCC, NLM, PM-KUSUM",
    query: "Agriculture",
    icon: "leaf-outline",
    background: "#ECFDF5",
    iconColor: "#059669",
  },
  {
    title: "Artisans & Crafts",
    description:
      "Support, training and financial assistance for traditional artisans.",
    count: "PM Vishwakarma, NSFDC",
    query: "Vishwakarma",
    icon: "hammer-outline",
    background: "#FFFBEB",
    iconColor: "#D97706",
  },
  {
    title: "Education",
    description:
      "Scholarships and educational support for students and learners.",
    count: "PM-YASASVI, NMMS",
    query: "Scholarship",
    icon: "school-outline",
    background: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  {
    title: "Social Security",
    description: "Pension, insurance and financial security programmes.",
    count: "APY, PMSBY, PMJJBY",
    query: "Pension",
    icon: "heart-outline",
    background: "#FFF1F2",
    iconColor: "#E11D48",
  },
  {
    title: "Health & Family",
    description: "Healthcare and family welfare support programmes.",
    count: "AB-PMJAY, PMMVY, SSY",
    query: "Health",
    icon: "medkit-outline",
    background: "#F0FDFA",
    iconColor: "#0D9488",
  },
];

const HOW_IT_WORKS: HowItWorksItem[] = [
  {
    step: "01",
    title: "Tell Us About You",
    description: "Share basic information about your needs and interests.",
    icon: "document-text-outline",
    background: "#FFFBEB",
    iconColor: "#D97706",
  },
  {
    step: "02",
    title: "Check Eligibility",
    description: "Understand which schemes may match your circumstances.",
    icon: "shield-checkmark-outline",
    background: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    step: "03",
    title: "Discover Schemes",
    description: "Explore relevant government welfare schemes and benefits.",
    icon: "sparkles-outline",
    background: "#FFF7ED",
    iconColor: colors.saffron,
  },
  {
    step: "04",
    title: "Follow Official Route",
    description:
      "Get guidance towards the appropriate official application route.",
    icon: "location-outline",
    background: "#ECFDF5",
    iconColor: "#059669",
  },
];

const POPULAR_FOCUS = [
  {
    label: "MUDRA Loan",
    query: "MUDRA",
  },
  {
    label: "Women Entrepreneurs",
    query: "Women",
  },
  {
    label: "PM Vishwakarma",
    query: "Vishwakarma",
  },
  {
    label: "Agriculture & Dairy",
    query: "Agriculture",
  },
  {
    label: "Scholarships",
    query: "Scholarship",
  },
  {
    label: "Ayushman Bharat",
    query: "Ayushman",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  const [stats, setStats] = useState({
    totalSchemes: 0,
    verifiedSchemes: 0,
    verifiedPercentage: 0,
  });

  useEffect(() => {
    let isMounted = true;

    schemeApi
      .getSchemes({ page_size: 100 })
      .then((response) => {
        if (!isMounted) return;

        const total = response.total || response.items?.length || 0;

        const verified =
          response.items?.filter((scheme) => {
            const verificationStatus = (
              scheme.verification_status || ""
            ).toUpperCase();

            return (
              verificationStatus === "VERIFIED" ||
              verificationStatus === "VERIFIED_OFFICIAL" ||
              verificationStatus === "SOURCE_VERIFIED"
            );
          }).length || total;

        const verifiedPercentage =
          total > 0 ? Math.round((verified / total) * 100) : 100;

        setStats({
          totalSchemes: total,
          verifiedSchemes: verified,
          verifiedPercentage,
        });
      })
      .catch((error) => {
        console.error("Failed to load scheme statistics:", error);
      });

    const interval = setInterval(() => {
      setActiveSlide((current) => {
        return (current + 1) % HERO_SLIDES.length;
      });
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentSlide = useMemo(() => HERO_SLIDES[activeSlide], [activeSlide]);

  const goToSchemes = (query?: string) => {
    if (query && query.trim()) {
      router.push({
        pathname: "/(tabs)/schemes",
        params: {
          search: query.trim(),
        },
      });
    } else {
      router.push("/(tabs)/schemes");
    }
  };

  const goToSmartMatch = () => {
    router.push("/(tabs)/match");
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();

    if (query) {
      goToSchemes(query);
    } else {
      goToSchemes();
    }
  };

  const previousSlide = () => {
    setActiveSlide((current) => {
      return (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    });
  };

  const nextSlide = () => {
    setActiveSlide((current) => {
      return (current + 1) % HERO_SLIDES.length;
    });
  };

  const handleHeroSwipe = (
    event: NativeSyntheticEvent<{
      contentOffset: {
        x: number;
        y: number;
      };
    }>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);

    if (index >= 0 && index < HERO_SLIDES.length && index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  return (
    <Screen>
      <AppHeader title="YojnaSetu" subtitle="Government schemes, simplified" />

      {/* ============================================================
          HERO
      ============================================================ */}

      <View style={styles.heroWrapper}>
        <View style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />

          <View style={styles.heroContent}>
            <View style={styles.portalBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.portalBadgeText}>{currentSlide.eyebrow}</Text>

              <View style={styles.badgeDivider} />

              <Text style={styles.portalCount}>
                {stats.totalSchemes} schemes
              </Text>
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name={currentSlide.icon} size={28} color="#FFD28A" />
            </View>

            <Text style={styles.heroTitle}>{currentSlide.title}</Text>

            <Text style={styles.heroDescription}>
              {currentSlide.description}
            </Text>

            <View style={styles.heroButtons}>
              <AppButton
                title="Find Matching Schemes"
                icon="sparkles"
                onPress={goToSmartMatch}
                style={styles.heroPrimaryButton}
              />

              <AppButton
                title="Explore All Schemes"
                icon="search-outline"
                variant="dark"
                onPress={() => goToSchemes()}
                style={styles.heroSecondaryButton}
              />
            </View>
          </View>

          <View style={styles.heroNavigation}>
            <Pressable
              onPress={previousSlide}
              accessibilityRole="button"
              accessibilityLabel="Previous hero slide"
              style={({ pressed }) => [
                styles.heroArrow,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>

            <View style={styles.dots}>
              {HERO_SLIDES.map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setActiveSlide(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show slide ${index + 1}`}
                  style={[
                    styles.dot,
                    index === activeSlide && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={nextSlide}
              accessibilityRole="button"
              accessibilityLabel="Next hero slide"
              style={({ pressed }) => [
                styles.heroArrow,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Swipe helper / native horizontal interaction */}
        <View style={styles.swipeTrack}>
          <View
            style={[
              styles.swipeIndicator,
              {
                width: (SCREEN_WIDTH - 64) / HERO_SLIDES.length,
              },
            ]}
          />
        </View>
      </View>

      {/* ============================================================
          STATS
      ============================================================ */}

      <View style={styles.section}>
        <View style={styles.statsGrid}>
          <StatCard
            value={String(stats.totalSchemes)}
            label="Government Schemes"
            valueColor={colors.text}
          />

          <StatCard
            value="128"
            label="Channel Partners"
            valueColor={colors.saffron}
          />

          <StatCard
            value="12"
            label="Indian Languages"
            valueColor={colors.sky}
          />
        </View>
      </View>

      {/* ============================================================
          SMART MATCHING
      ============================================================ */}

      <View style={styles.section}>
        <View style={styles.matchingCard}>
          <View style={styles.matchingGlowOne} />
          <View style={styles.matchingGlowTwo} />

          <View style={styles.matchingContent}>
            <View style={styles.matchingBadge}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#FFB347"
              />

              <Text style={styles.matchingBadgeText}>SMART MATCHING</Text>
            </View>

            <Text style={styles.matchingTitle}>
              Find schemes that match your needs
            </Text>

            <View style={styles.pillars}>
              <FeaturePill text="Personalized Matching" />

              <FeaturePill text="Rule Based Eligibility" />

              <FeaturePill text="Official Sources" />

              <FeaturePill text="No Document Upload" />
            </View>

            <AppButton
              title="Find Matching Schemes"
              icon="sparkles"
              onPress={goToSmartMatch}
              style={styles.matchButton}
            />
          </View>
        </View>
      </View>

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}

      <View style={styles.section}>
        <SectionHeading
          icon="compass-outline"
          badge="HOW IT WORKS"
          title="Simple steps to discover support"
          subtitle="From your needs to the right government scheme."
        />

        <View style={styles.stepsGrid}>
          {HOW_IT_WORKS.map((item) => (
            <HowItWorksCard key={item.step} item={item} />
          ))}
        </View>
      </View>

      {/* ============================================================
          SEARCH
      ============================================================ */}

      <View style={styles.section}>
        <View style={styles.searchCard}>
          <View style={styles.searchHeadingRow}>
            <View style={styles.searchIconCircle}>
              <Ionicons name="search-outline" size={18} color={colors.sky} />
            </View>

            <View style={styles.searchHeadingText}>
              <Text style={styles.searchTitle}>Search Schemes</Text>

              <Text style={styles.searchSubtitle}>
                Search by keyword or popular focus area.
              </Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color="#94A3B8" />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search schemes..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              accessibilityLabel="Search government schemes"
            />

            <Pressable
              onPress={handleSearchSubmit}
              accessibilityRole="button"
              accessibilityLabel="Search"
              style={({ pressed }) => [
                styles.searchButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.searchButtonText}>Search</Text>

              <Ionicons name="arrow-forward" size={15} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.popularHeader}>
            <Ionicons
              name="trending-up-outline"
              size={15}
              color={colors.amber}
            />

            <Text style={styles.popularTitle}>POPULAR FOCUS</Text>
          </View>

          <View style={styles.chips}>
            {POPULAR_FOCUS.map((chip) => (
              <Pressable
                key={chip.label}
                onPress={() => goToSchemes(chip.query)}
                accessibilityRole="button"
                accessibilityLabel={`Search ${chip.label}`}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* ============================================================
          CATEGORIES
      ============================================================ */}

      <View style={styles.section}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryBadge}>
            <Ionicons name="flash-outline" size={13} color={colors.saffron} />

            <Text style={styles.categoryBadgeText}>EXPLORE</Text>
          </View>

          <Text style={styles.sectionTitle}>Explore by Category</Text>

          <Text style={styles.sectionSubtitle}>
            Browse government support across major areas.
          </Text>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.title}
              category={category}
              onPress={() => goToSchemes(category.query)}
            />
          ))}
        </View>
      </View>

      {/* ============================================================
          TRUST
      ============================================================ */}

      <View style={styles.section}>
        <View style={styles.trustCard}>
          <View style={styles.trustHeader}>
            <View style={styles.trustBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={colors.emerald}
              />

              <Text style={styles.trustBadgeText}>
                TRUST & OFFICIAL PROVENANCE
              </Text>
            </View>

            <Text style={styles.trustTitle}>Information you can rely on</Text>

            <Text style={styles.trustDescription}>
              YojnaSetu is designed to make government scheme discovery easier
              while keeping users connected to official information and
              application routes.
            </Text>
          </View>

          <View style={styles.trustGrid}>
            <TrustPillar
              icon="document-text-outline"
              iconColor={colors.sky}
              title="Official Information"
              description="Scheme information is organized around official sources."
            />

            <TrustPillar
              icon="checkmark-circle-outline"
              iconColor={colors.emerald}
              title="Verified Details"
              description="Important scheme details are presented clearly."
            />

            <TrustPillar
              icon="business-outline"
              iconColor={colors.amber}
              title="Government Schemes"
              description="Discover programmes across multiple welfare areas."
            />

            <TrustPillar
              icon="shield-outline"
              iconColor={colors.indigo}
              title="User Focused"
              description="Designed to make scheme discovery simpler and clearer."
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

/* ================================================================
   SMALL REUSABLE COMPONENTS
================================================================ */

interface StatCardProps {
  value: string;
  label: string;
  valueColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, valueColor }) => {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface FeaturePillProps {
  text: string;
}

const FeaturePill: React.FC<FeaturePillProps> = ({ text }) => {
  return (
    <View style={styles.featurePill}>
      <Ionicons name="checkmark-circle" size={16} color="#34D399" />

      <Text style={styles.featurePillText}>{text}</Text>
    </View>
  );
};

interface SectionHeadingProps {
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  title: string;
  subtitle: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  icon,
  badge,
  title,
  subtitle,
}) => {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingBadge}>
        <Ionicons name={icon} size={14} color={colors.blue} />

        <Text style={styles.sectionHeadingBadgeText}>{badge}</Text>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>

      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
};

interface HowItWorksCardProps {
  item: HowItWorksItem;
}

const HowItWorksCard: React.FC<HowItWorksCardProps> = ({ item }) => {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepTopRow}>
        <Text style={styles.stepNumber}>{item.step}</Text>

        <View
          style={[
            styles.stepIcon,
            {
              backgroundColor: item.background,
              borderColor: `${item.iconColor}30`,
            },
          ]}
        >
          <Ionicons name={item.icon} size={19} color={item.iconColor} />
        </View>
      </View>

      <Text style={styles.stepTitle}>{item.title}</Text>

      <Text style={styles.stepDescription}>{item.description}</Text>
    </View>
  );
};

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${category.title}`}
      style={({ pressed }) => [
        styles.categoryCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.categoryTop}>
        <View
          style={[
            styles.categoryIcon,
            {
              backgroundColor: category.background,
              borderColor: `${category.iconColor}30`,
            },
          ]}
        >
          <Ionicons name={category.icon} size={22} color={category.iconColor} />
        </View>

        <Ionicons name="arrow-forward" size={17} color="#94A3B8" />
      </View>

      <Text style={styles.categoryTitle}>{category.title}</Text>

      <Text style={styles.categoryDescription}>{category.description}</Text>

      <View style={styles.categoryFooter}>
        <Text style={styles.categoryCount} numberOfLines={2}>
          {category.count}
        </Text>

        <Text style={styles.categoryAction}>View</Text>
      </View>
    </Pressable>
  );
};

interface TrustPillarProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
}

const TrustPillar: React.FC<TrustPillarProps> = ({
  icon,
  iconColor,
  title,
  description,
}) => {
  return (
    <View style={styles.trustPillar}>
      <View style={styles.trustPillarTitleRow}>
        <Ionicons name={icon} size={18} color={iconColor} />

        <Text style={styles.trustPillarTitle}>{title}</Text>
      </View>

      <Text style={styles.trustPillarDescription}>{description}</Text>
    </View>
  );
};

/* ================================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({
  /* ---------- General ---------- */

  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },

  sectionTitle: {
    marginTop: 7,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },

  pressed: {
    opacity: 0.82,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  /* ---------- Hero ---------- */

  heroWrapper: {
    paddingHorizontal: 12,
    marginTop: 4,
  },

  hero: {
    minHeight: 510,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.maroon,
    position: "relative",
    borderBottomWidth: 4,
    borderBottomColor: colors.saffron,
    ...shadows.elevated,
  },

  heroGlowTop: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -70,
    backgroundColor: "rgba(215,131,45,0.18)",
  },

  heroGlowBottom: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    left: -130,
    bottom: -130,
    backgroundColor: "rgba(79,14,22,0.65)",
  },

  heroContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 82,
    justifyContent: "center",
  },

  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  portalBadgeText: {
    color: "#FFB347",
    fontSize: 10,
    fontWeight: "800",
  },

  badgeDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#94A3B8",
    marginHorizontal: 7,
  },

  portalCount: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "600",
  },

  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 17,
  },

  heroTitle: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  heroDescription: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 13,
    maxWidth: 330,
  },

  heroButtons: {
    width: "100%",
    marginTop: 23,
    gap: 10,
  },

  heroPrimaryButton: {
    width: "100%",
  },

  heroSecondaryButton: {
    width: "100%",
    backgroundColor: "rgba(15,23,42,0.80)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.55)",
  },

  heroNavigation: {
    position: "absolute",
    bottom: 16,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(134,24,35,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  activeDot: {
    width: 27,
    backgroundColor: colors.saffron,
  },

  swipeTrack: {
    display: "none",
  },

  swipeIndicator: {
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.saffron,
  },

  /* ---------- Stats ---------- */

  statsGrid: {
    flexDirection: "row",
    gap: 9,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 17,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    ...shadows.card,
  },

  statValue: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    color: colors.textMuted,
    fontWeight: "600",
  },

  /* ---------- Matching ---------- */

  matchingCard: {
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#351827",
    borderWidth: 1,
    borderColor: "#A52A38",
    position: "relative",
    ...shadows.elevated,
  },

  matchingGlowOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -80,
    top: -80,
    backgroundColor: "rgba(217,95,36,0.16)",
  },

  matchingGlowTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    left: -100,
    bottom: -100,
    backgroundColor: "rgba(139,30,45,0.30)",
  },

  matchingContent: {
    padding: 20,
    position: "relative",
  },

  matchingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,157,46,0.30)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },

  matchingBadgeText: {
    color: "#FFB347",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  matchingTitle: {
    marginTop: 15,
    color: colors.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },

  pillars: {
    marginTop: 17,
    gap: 8,
  },

  featurePill: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
  },

  featurePillText: {
    flex: 1,
    marginLeft: 9,
    color: "#F1F5F9",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },

  matchButton: {
    marginTop: 17,
  },

  /* ---------- How It Works ---------- */

  sectionHeading: {
    marginBottom: 17,
  },

  sectionHeadingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionHeadingBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  stepsGrid: {
    gap: 10,
  },

  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },

  stepTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stepNumber: {
    color: "#CBD5E1",
    fontSize: 24,
    fontWeight: "900",
  },

  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stepTitle: {
    marginTop: 13,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "800",
  },

  stepDescription: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  /* ---------- Search ---------- */

  searchCard: {
    backgroundColor: colors.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    ...shadows.card,
  },

  searchHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchIconCircle: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.skyLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  searchHeadingText: {
    flex: 1,
  },

  searchTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },

  searchSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  searchBox: {
    minHeight: 53,
    marginTop: 16,
    padding: 5,
    paddingLeft: 12,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
    paddingHorizontal: 9,
    paddingVertical: 8,
  },

  searchButton: {
    minHeight: 41,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  searchButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },

  popularHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  popularTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  chips: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  chip: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  chipPressed: {
    backgroundColor: "#E2E8F0",
  },

  chipText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },

  /* ---------- Categories ---------- */

  categoryHeader: {
    marginBottom: 17,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 6,
  },

  categoryBadgeText: {
    color: colors.saffron,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  categoryGrid: {
    gap: 10,
  },

  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },

  categoryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryTitle: {
    marginTop: 13,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  categoryDescription: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  categoryFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryCount: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
    paddingRight: 8,
  },

  categoryAction: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "900",
  },

  /* ---------- Trust ---------- */

  trustCard: {
    backgroundColor: colors.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    ...shadows.card,
  },

  trustHeader: {
    marginBottom: 17,
  },

  trustBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.emeraldLight,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 6,
  },

  trustBadgeText: {
    color: "#166534",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  trustTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  trustDescription: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  trustGrid: {
    gap: 9,
  },

  trustPillar: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },

  trustPillarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  trustPillarTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  trustPillarDescription: {
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
