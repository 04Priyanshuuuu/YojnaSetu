import React, { useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Calculator,
  Landmark,
  Phone,
  FileCheck2,
  BadgeCheck,
  IndianRupee,
  PiggyBank,
  CreditCard,
  Wallet,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#FEF9F3',
  white: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  maroon: '#861823',
  maroonDark: '#5B1827',
  navy: '#071B2B',
  saffron: '#F4A51C',
  skyBg: '#E0F2FE',
  skyText: '#0369A1',
  emeraldBg: '#D1FAE5',
  emeraldText: '#047857',
  amberBg: '#FEF3C7',
  amberText: '#B45309',
  lightMaroon: '#F8EDEF',
};

type ResourceItem = {
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  tag: string;
};

type LiteracyArticle = {
  icon: React.ComponentType<any>;
  category: string;
  title: string;
  description: string;
  points: string[];
};

const resources: ResourceItem[] = [
  {
    icon: ShieldCheck,
    iconBg: COLORS.skyBg,
    iconColor: COLORS.skyText,
    title: 'National Gazette Verification Standard',
    description:
      'All 90 welfare schemes indexed on YojnaSetu are validated against official Gazette of India notifications, statutory ministry guidelines, and RBI/NABARD master circulars.',
    tag: 'Scheme Verification',
  },
  {
    icon: Calculator,
    iconBg: COLORS.emeraldBg,
    iconColor: COLORS.emeraldText,
    title: 'Financial Calculator Methodology',
    description:
      'Calculators use standardized reducing balance EMI calculations and accurate category-specific margin money / back-ended capital subsidy formulas.',
    tag: 'Financial Tools',
  },
  {
    icon: Phone,
    iconBg: COLORS.amberBg,
    iconColor: COLORS.amberText,
    title: 'Grievance Redressal & Helpdesk',
    description:
      'Toll-Free National Helpline: 1800–11–2026 (9:00 AM – 6:00 PM IST, Monday to Saturday).',
    tag: 'Citizen Support',
  },
];

const literacyArticles: LiteracyArticle[] = [
  {
    icon: IndianRupee,
    category: 'LOANS & EMI',
    title: 'Understanding EMI Before Taking a Loan',
    description:
      'Learn how principal, interest rate, tenure and monthly EMI work together before choosing a credit scheme.',
    points: [
      'What an EMI actually includes',
      'Impact of loan tenure on total interest',
      'Reducing balance vs. flat-rate calculations',
    ],
  },
  {
    icon: PiggyBank,
    category: 'SAVINGS',
    title: 'Build a Strong Financial Safety Net',
    description:
      'Simple principles for managing income, savings and emergency funds while planning for long-term goals.',
    points: [
      'Why emergency savings matter',
      'Separating needs from wants',
      'Setting realistic savings goals',
    ],
  },
  {
    icon: CreditCard,
    category: 'CREDIT',
    title: 'Know Your Credit Before Borrowing',
    description:
      'Understand responsible borrowing, repayment discipline and the basics of maintaining a healthy credit profile.',
    points: [
      'Borrow only what you can repay',
      'Importance of timely repayment',
      'Understanding loan obligations',
    ],
  },
  {
    icon: Wallet,
    category: 'GOVERNMENT SCHEMES',
    title: 'How Subsidy & Concessional Loans Work',
    description:
      'Understand the difference between a subsidy, a concessional loan, margin money support and regular credit.',
    points: [
      'Subsidy vs. loan explained',
      'Margin money basics',
      'Why scheme-specific rules matter',
    ],
  },
  {
    icon: Lightbulb,
    category: 'FINANCIAL BASICS',
    title: 'Read the Important Numbers First',
    description:
      'Before applying for financial assistance, know which numbers and conditions deserve your attention.',
    points: [
      'Maximum loan amount',
      'Interest and repayment period',
      'Eligibility and income limits',
    ],
  },
  {
    icon: FileCheck2,
    category: 'APPLICATION GUIDANCE',
    title: 'Prepare Before You Apply',
    description:
      'A simple checklist to help citizens understand scheme requirements and avoid unnecessary application delays.',
    points: [
      'Check eligibility first',
      'Review required documents',
      'Use the correct application channel',
    ],
  },
];

const JourneyCard = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) => {
  return (
    <View style={styles.journeyCard}>
      <Text style={styles.journeyNumber}>{number}</Text>

      <Text style={styles.journeyTitle}>{title}</Text>

      <Text style={styles.journeyDescription}>{description}</Text>
    </View>
  );
};

const CheckItem = ({ children }: { children: string }) => {
  return (
    <View style={styles.checkItem}>
      <View style={styles.checkCircle}>
        <CheckCircle2 size={14} color="#047857" strokeWidth={2.5} />
      </View>

      <Text style={styles.checkText}>{children}</Text>
    </View>
  );
};

const Resources: React.FC = () => {
  const router = useRouter();

  const scrollViewRef = useRef<ScrollView>(null);
  const officialResourcesY = useRef(0);
  const financialLiteracyY = useRef(0);

  const scrollToOfficialResources = () => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(officialResourcesY.current - 12, 0),
      animated: true,
    });
  };

  const scrollToFinancialLiteracy = () => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(financialLiteracyY.current - 12, 0),
      animated: true,
    });
  };

  const handleGuidePress = (articleTitle: string) => {
    // The original web implementation currently has no destination
    // for "Read Guide". Keep the interaction safe without inventing
    // a new route or business flow.
    console.log(`Read Guide pressed: ${articleTitle}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =========================================================
            HERO
        ========================================================= */}
        <View style={styles.hero}>
          {/* Decorative background shapes */}
          <View style={styles.heroCircleTop} />
          <View style={styles.heroCircleBottom} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <BookOpen
                size={16}
                color={COLORS.saffron}
                strokeWidth={2.5}
              />

              <Text style={styles.heroBadgeText}>CITIZEN RESOURCES</Text>
            </View>

            <Text style={styles.heroTitle}>
              Resources &{' '}
              <Text style={styles.heroTitleAccent}>Guidelines</Text>
            </Text>

            <Text style={styles.heroDescription}>
              Trusted guidance, financial tools and practical resources to help
              you understand government welfare schemes and make informed
              financial decisions.
            </Text>

            <View style={styles.heroButtons}>
              <Pressable
                onPress={scrollToOfficialResources}
                style={({ pressed }) => [
                  styles.primaryHeroButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Explore Resources"
              >
                <Text style={styles.primaryHeroButtonText}>
                  Explore Resources
                </Text>

                <ArrowRight
                  size={17}
                  color={COLORS.maroon}
                  strokeWidth={2.5}
                />
              </Pressable>

              <Pressable
                onPress={scrollToFinancialLiteracy}
                style={({ pressed }) => [
                  styles.secondaryHeroButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Financial Literacy"
              >
                <Text style={styles.secondaryHeroButtonText}>
                  Financial Literacy
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* =========================================================
            TRUST STRIP
        ========================================================= */}
        <View style={styles.trustStrip}>
          <TrustItem
            icon={<BadgeCheck size={21} color={COLORS.skyText} />}
            iconBackground={COLORS.skyBg}
            title="Verified Information"
            description="Government guidelines & sources"
          />

          <TrustItem
            icon={<Calculator size={21} color={COLORS.emeraldText} />}
            iconBackground={COLORS.emeraldBg}
            title="Practical Financial Tools"
            description="Understand your numbers"
          />

          <TrustItem
            icon={<Landmark size={21} color={COLORS.amberText} />}
            iconBackground={COLORS.amberBg}
            title="Citizen First"
            description="Simple and accessible guidance"
          />
        </View>

        {/* =========================================================
            OFFICIAL RESOURCES
        ========================================================= */}
        <View
          style={styles.section}
          onLayout={(event) => {
            officialResourcesY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>OFFICIAL GUIDANCE</Text>

            <Text style={styles.sectionTitle}>
              Citizen Welfare Resources
            </Text>

            <Text style={styles.sectionDescription}>
              Key standards, methodologies and support information used to make
              YojnaSetu more transparent and useful for citizens.
            </Text>
          </View>

          <View style={styles.resourceList}>
            {resources.map((resource) => {
              const Icon = resource.icon;

              return (
                <View key={resource.title} style={styles.resourceCard}>
                  <View style={styles.resourceTopRow}>
                    <View
                      style={[
                        styles.resourceIconBox,
                        { backgroundColor: resource.iconBg },
                      ]}
                    >
                      <Icon
                        size={25}
                        color={resource.iconColor}
                        strokeWidth={2.2}
                      />
                    </View>

                    <View
                      style={[
                        styles.resourceTag,
                        {
                          borderColor: resource.iconColor + '35',
                          backgroundColor: resource.iconBg + '75',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resourceTagText,
                          { color: resource.iconColor },
                        ]}
                        numberOfLines={2}
                      >
                        {resource.tag}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.resourceTitle}>{resource.title}</Text>

                  <Text style={styles.resourceDescription}>
                    {resource.description}
                  </Text>

                  <View style={styles.resourceFooter}>
                    <View style={styles.smallCheckCircle}>
                      <CheckCircle2
                        size={13}
                        color={COLORS.emeraldText}
                        strokeWidth={2.5}
                      />
                    </View>

                    <Text style={styles.resourceFooterText}>
                      YojnaSetu Resource
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* =========================================================
            FINANCIAL LITERACY
        ========================================================= */}
        <View
          style={styles.literacySection}
          onLayout={(event) => {
            financialLiteracyY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.literacyEyebrow}>LEARN BEFORE YOU BORROW</Text>

            <Text style={styles.sectionTitle}>Financial Literacy</Text>

            <Text style={styles.sectionDescription}>
              Simple guides to help citizens understand loans, EMIs,
              subsidies, savings and responsible financial planning.
            </Text>

            <Pressable
              onPress={() => router.push('/(tabs)/calculator')}
              style={({ pressed }) => [
                styles.calculatorButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Try Financial Calculator"
            >
              <Calculator
                size={17}
                color={COLORS.white}
                strokeWidth={2.3}
              />

              <Text style={styles.calculatorButtonText}>
                Try Financial Calculator
              </Text>
            </Pressable>
          </View>

          <View style={styles.literacyList}>
            {literacyArticles.map((article) => {
              const Icon = article.icon;

              return (
                <View key={article.title} style={styles.articleCard}>
                  <View style={styles.articleTopRow}>
                    <View style={styles.articleIconBox}>
                      <Icon
                        size={21}
                        color={COLORS.maroon}
                        strokeWidth={2.2}
                      />
                    </View>

                    <Text style={styles.articleCategory}>
                      {article.category}
                    </Text>
                  </View>

                  <Text style={styles.articleTitle}>{article.title}</Text>

                  <Text style={styles.articleDescription}>
                    {article.description}
                  </Text>

                  <View style={styles.pointsContainer}>
                    {article.points.map((point) => (
                      <CheckItem key={point}>{point}</CheckItem>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handleGuidePress(article.title)}
                    style={({ pressed }) => [
                      styles.readGuideButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Read Guide: ${article.title}`}
                  >
                    <Text style={styles.readGuideText}>Read Guide</Text>

                    <ArrowRight
                      size={15}
                      color={COLORS.maroon}
                      strokeWidth={2.6}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* =========================================================
            HOW TO USE YOJNASETU
        ========================================================= */}
        <View style={styles.journeySection}>
          <View style={styles.journeyContainer}>
            {/* Decorative layers to give the hero card a gradient-like
                visual without introducing another dependency. */}
            <View style={styles.journeyBackgroundMaroon} />
            <View style={styles.journeyBackgroundNavy} />

            <View style={styles.journeyContent}>
              <View style={styles.journeyTextColumn}>
                <View style={styles.journeyEyebrowRow}>
                  <BookOpen
                    size={16}
                    color={COLORS.saffron}
                    strokeWidth={2.4}
                  />

                  <Text style={styles.journeyEyebrow}>
                    MAKE BETTER DECISIONS
                  </Text>
                </View>

                <Text style={styles.journeyHeading}>
                  Use the right resource at the right stage.
                </Text>

                <Text style={styles.journeyDescriptionMain}>
                  Start by discovering suitable schemes, understand your
                  eligibility, use the financial calculator, and then review
                  the application guidance before proceeding.
                </Text>

                <View style={styles.journeyButtons}>
                  <Pressable
                    onPress={() => router.push('/(tabs)/schemes')}
                    style={({ pressed }) => [
                      styles.journeyPrimaryButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Explore Schemes"
                  >
                    <Text style={styles.journeyPrimaryButtonText}>
                      Explore Schemes
                    </Text>

                    <ArrowRight
                      size={17}
                      color={COLORS.maroon}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/(tabs)/match')}
                    style={({ pressed }) => [
                      styles.journeySecondaryButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Find Matching Schemes"
                  >
                    <Text style={styles.journeySecondaryButtonText}>
                      Find Matching Schemes
                    </Text>

                    <ExternalLink
                      size={16}
                      color={COLORS.white}
                      strokeWidth={2.2}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.journeyGrid}>
                <JourneyCard
                  number="01"
                  title="Discover"
                  description="Find schemes relevant to your needs."
                />

                <JourneyCard
                  number="02"
                  title="Understand"
                  description="Check eligibility and scheme conditions."
                />

                <JourneyCard
                  number="03"
                  title="Calculate"
                  description="Estimate EMI, subsidy and repayment."
                />

                <JourneyCard
                  number="04"
                  title="Apply"
                  description="Follow the correct application route."
                />
              </View>
            </View>
          </View>
        </View>

        {/* =========================================================
            FOOTER NOTE
        ========================================================= */}
        <View style={styles.footerNote}>
          <ShieldCheck
            size={16}
            color={COLORS.emeraldText}
            strokeWidth={2.3}
          />

          <Text style={styles.footerNoteText}>
            Always verify scheme-specific terms with the concerned official
            authority before applying.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const TrustItem = ({
  icon,
  iconBackground,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  description: string;
}) => {
  return (
    <View style={styles.trustItem}>
      <View
        style={[
          styles.trustIconBox,
          { backgroundColor: iconBackground },
        ]}
      >
        {icon}
      </View>

      <View style={styles.trustTextContainer}>
        <Text style={styles.trustTitle}>{title}</Text>

        <Text style={styles.trustDescription}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    paddingBottom: 28,
  },

  pressed: {
    opacity: 0.78,
  },

  // ===============================================================
  // HERO
  // ===============================================================

  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.maroonDark,
    minHeight: 440,
  },

  heroCircleTop: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#861823',
    opacity: 0.7,
    top: -145,
    right: -115,
  },

  heroCircleBottom: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: COLORS.navy,
    opacity: 0.85,
    bottom: -195,
    left: -145,
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 44,
    zIndex: 2,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18,
  },

  heroBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: width < 380 ? 36 : 40,
    lineHeight: width < 380 ? 43 : 47,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  heroTitleAccent: {
    color: COLORS.saffron,
  },

  heroDescription: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 17,
    maxWidth: 540,
  },

  heroButtons: {
    marginTop: 27,
    gap: 11,
  },

  primaryHeroButton: {
    minHeight: 50,
    paddingHorizontal: 17,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  primaryHeroButtonText: {
    color: COLORS.maroon,
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryHeroButton: {
    minHeight: 50,
    paddingHorizontal: 17,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryHeroButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // ===============================================================
  // TRUST STRIP
  // ===============================================================

  trustStrip: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 18,
  },

  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  trustIconBox: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  trustTextContainer: {
    flex: 1,
  },

  trustTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },

  trustDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  // ===============================================================
  // COMMON SECTION
  // ===============================================================

  section: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 43,
  },

  sectionHeader: {
    marginBottom: 23,
  },

  sectionEyebrow: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  literacyEyebrow: {
    color: COLORS.saffron,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  // ===============================================================
  // OFFICIAL RESOURCES
  // ===============================================================

  resourceList: {
    gap: 14,
  },

  resourceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.055,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  resourceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  resourceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceTag: {
    maxWidth: '57%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  resourceTagText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    textAlign: 'center',
  },

  resourceTitle: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 16,
  },

  resourceDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  resourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  smallCheckCircle: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceFooterText: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: '800',
  },

  // ===============================================================
  // FINANCIAL LITERACY
  // ===============================================================

  literacySection: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 43,
  },

  calculatorButton: {
    alignSelf: 'flex-start',
    minHeight: 47,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 17,
  },

  calculatorButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  literacyList: {
    gap: 14,
  },

  articleCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
  },

  articleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  articleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.lightMaroon,
    alignItems: 'center',
    justifyContent: 'center',
  },

  articleCategory: {
    flex: 1,
    color: COLORS.maroon,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'right',
  },

  articleTitle: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 16,
  },

  articleDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  pointsContainer: {
    marginTop: 14,
    gap: 9,
  },

  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  checkCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },

  checkText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  readGuideButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
    minHeight: 35,
  },

  readGuideText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: '900',
  },

  // ===============================================================
  // YOJNASETU JOURNEY
  // ===============================================================

  journeySection: {
    paddingHorizontal: 20,
    paddingTop: 39,
    paddingBottom: 14,
  },

  journeyContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: COLORS.maroonDark,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  journeyBackgroundMaroon: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.maroon,
    opacity: 0.45,
    top: -130,
    right: -100,
  },

  journeyBackgroundNavy: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.navy,
    opacity: 0.75,
    bottom: -190,
    left: -150,
  },

  journeyContent: {
    padding: 20,
    zIndex: 2,
  },

  journeyTextColumn: {
    marginBottom: 22,
  },

  journeyEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  journeyEyebrow: {
    color: COLORS.saffron,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  journeyHeading: {
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 10,
  },

  journeyDescriptionMain: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 11,
  },

  journeyButtons: {
    marginTop: 19,
    gap: 10,
  },

  journeyPrimaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  journeyPrimaryButtonText: {
    color: COLORS.maroon,
    fontSize: 13,
    fontWeight: '900',
  },

  journeySecondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  journeySecondaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  journeyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  journeyCard: {
    width: '48.5%',
    minHeight: 116,
    padding: 13,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  journeyNumber: {
    color: COLORS.saffron,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  journeyTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 7,
  },

  journeyDescription: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  // ===============================================================
  // FOOTER
  // ===============================================================

  footerNote: {
    paddingHorizontal: 25,
    paddingTop: 23,
    paddingBottom: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 7,
  },

  footerNoteText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});

export default Resources;

