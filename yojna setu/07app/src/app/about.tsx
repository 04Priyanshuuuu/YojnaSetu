import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Languages,
  ArrowRight,
  CheckCircle2,
  Landmark,
  Users,
  FileCheck2,
  Sparkles,
  MapPin,
  Calculator,
  Search,
  HeartHandshake,
  BadgeCheck,
  Globe2,
  LockKeyhole,
  CircleCheck,
  Shield,
} from 'lucide-react-native';

const COLORS = {
  background: '#FEF9F3',
  white: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',

  maroon: '#861823',
  maroonDark: '#521827',
  navy: '#071B2B',

  saffron: '#FFB347',
  saffronDark: '#D97706',

  sky: '#0284C7',
  emerald: '#059669',
  amber: '#D97706',
  orange: '#EA580C',
  indigo: '#4F46E5',
};

type Capability = {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
};

type JourneyStep = {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  background: string;
  border: string;
  iconColor: string;
};

type Principle = {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
};

const capabilities: Capability[] = [
  {
    title: 'Scheme Discovery',
    description:
      'Search and explore government schemes using keywords, categories, ministries, and welfare focus areas.',
    icon: Search,
    iconBackground: '#EFF6FF',
    iconBorder: '#BFDBFE',
    iconColor: '#2563EB',
  },
  {
    title: 'Smart Scheme Matching',
    description:
      "Discover schemes that may match a citizen's demographic, financial, and occupational profile.",
    icon: Sparkles,
    iconBackground: '#FFFBEB',
    iconBorder: '#FDE68A',
    iconColor: '#D97706',
  },
  {
    title: 'Eligibility Guidance',
    description:
      'Understand eligibility requirements through explicit, rule-based scheme conditions.',
    icon: ShieldCheck,
    iconBackground: '#ECFDF5',
    iconBorder: '#A7F3D0',
    iconColor: '#059669',
  },
  {
    title: 'Financial Calculator',
    description:
      'Estimate loan EMIs, interest burden, payable amounts, and applicable subsidy benefits.',
    icon: Calculator,
    iconBackground: '#FFF7ED',
    iconBorder: '#FED7AA',
    iconColor: '#EA580C',
  },
  {
    title: 'Nearby Assistance',
    description:
      'Locate authorized banks, channel partners, and assistance centres supporting welfare schemes.',
    icon: MapPin,
    iconBackground: '#EEF2FF',
    iconBorder: '#C7D2FE',
    iconColor: '#4F46E5',
  },
  {
    title: 'Multilingual Access',
    description:
      'Access welfare information through multilingual support designed to make the platform easier to use across India.',
    icon: Globe2,
    iconBackground: '#F0F9FF',
    iconBorder: '#BAE6FD',
    iconColor: '#0284C7',
  },
];

const journeySteps: JourneyStep[] = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Search or browse government schemes based on your area of interest.',
    icon: Search,
    background: '#FFFBEB',
    border: '#FDE68A',
    iconColor: '#D97706',
  },
  {
    number: '02',
    title: 'Check Eligibility',
    description:
      'Understand whether the scheme conditions align with your profile.',
    icon: ShieldCheck,
    background: '#EFF6FF',
    border: '#BFDBFE',
    iconColor: '#2563EB',
  },
  {
    number: '03',
    title: 'Understand Benefits',
    description:
      'Review scheme benefits, requirements, and important details in one place.',
    icon: FileCheck2,
    background: '#FFF7ED',
    border: '#FED7AA',
    iconColor: '#EA580C',
  },
  {
    number: '04',
    title: 'Reach the Official Route',
    description:
      'Find official application routes and nearby assistance partners when required.',
    icon: MapPin,
    background: '#ECFDF5',
    border: '#A7F3D0',
    iconColor: '#059669',
  },
];

const principles: Principle[] = [
  {
    title: 'Trust',
    description: 'Clear information and transparent guidance.',
    icon: ShieldCheck,
    iconColor: '#7DD3FC',
  },
  {
    title: 'Accessibility',
    description: 'Designed around diverse citizen needs.',
    icon: Users,
    iconColor: '#34D399',
  },
  {
    title: 'Inclusion',
    description: 'Multilingual access for wider reach.',
    icon: Languages,
    iconColor: COLORS.saffron,
  },
  {
    title: 'Clarity',
    description: 'Simple presentation of complex scheme information.',
    icon: FileCheck2,
    iconColor: '#FDBA74',
  },
];

const About: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. ABOUT HERO
        ============================================================ */}

        <View style={styles.heroSection}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <View style={styles.heroGlowRight} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Landmark
                size={15}
                color={COLORS.saffron}
                strokeWidth={2.5}
              />

              <Text style={styles.heroBadgeText}>
                GOVERNMENT CITIZEN PLATFORM
              </Text>
            </View>

            <Text style={styles.heroTitle}>About YojnaSetu</Text>

            <Text style={styles.heroDescription}>
              YojnaSetu is a national civic-tech welfare guidance platform
              designed to bridge the gap between Indian citizens and
              government welfare, credit, and subsidy programs.
            </Text>

            <View style={styles.heroTrustChips}>
              <TrustChip
                icon={
                  <BadgeCheck
                    size={15}
                    color="#34D399"
                    strokeWidth={2.4}
                  />
                }
                text="Verified Government Schemes"
              />

              <TrustChip
                icon={
                  <ShieldCheck
                    size={15}
                    color="#7DD3FC"
                    strokeWidth={2.4}
                  />
                }
                text="Rule-Based Eligibility"
              />

              <TrustChip
                icon={
                  <Languages
                    size={15}
                    color={COLORS.saffron}
                    strokeWidth={2.4}
                  />
                }
                text="Multilingual Access"
              />
            </View>
          </View>
        </View>

        {/* ============================================================
            2. WHO WE ARE
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.whoWeAreCard}>
            <View style={styles.sectionIconRow}>
              <View style={styles.sectionIconBox}>
                <Users
                  size={21}
                  color={COLORS.maroon}
                  strokeWidth={2.2}
                />
              </View>

              <View style={styles.sectionHeadingContainer}>
                <Text style={styles.sectionEyebrow}>WHO WE ARE</Text>

                <Text style={styles.sectionHeading}>
                  Connecting Citizens With Welfare Opportunities
                </Text>
              </View>
            </View>

            <View style={styles.paragraphContainer}>
              <Text style={styles.bodyText}>
                Government welfare schemes can provide valuable support in
                areas such as entrepreneurship, agriculture, education,
                healthcare, social security, and financial assistance.
              </Text>

              <Text style={styles.bodyText}>
                However, citizens often have to navigate multiple portals,
                eligibility conditions, application procedures, and official
                guidelines to identify the schemes relevant to them.
              </Text>

              <Text style={styles.bodyText}>
                YojnaSetu brings this discovery journey together through a
                citizen-focused interface that helps users explore schemes,
                understand eligibility requirements, calculate financial
                benefits, and find official assistance channels.
              </Text>
            </View>
          </View>

          {/* Mission */}
          <View style={styles.missionCard}>
            <View style={styles.missionGlow} />

            <View style={styles.missionContent}>
              <View style={styles.missionIconBox}>
                <HeartHandshake
                  size={22}
                  color={COLORS.saffron}
                  strokeWidth={2.2}
                />
              </View>

              <Text style={styles.missionEyebrow}>OUR MISSION</Text>

              <Text style={styles.missionTitle}>
                Making welfare discovery simpler for every citizen.
              </Text>

              <Text style={styles.missionDescription}>
                One platform to discover relevant schemes, understand
                eligibility, and reach official channels with confidence.
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================
            3. WHAT YOJNASETU OFFERS
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.centerHeader}>
            <View style={styles.capabilityBadge}>
              <Sparkles
                size={14}
                color={COLORS.saffronDark}
                strokeWidth={2.4}
              />

              <Text style={styles.capabilityBadgeText}>
                PLATFORM CAPABILITIES
              </Text>
            </View>

            <Text style={styles.centerHeading}>
              Everything You Need to Navigate Welfare Schemes
            </Text>

            <Text style={styles.centerDescription}>
              Simple tools and guidance designed around the needs of citizens.
            </Text>
          </View>

          <View style={styles.capabilityList}>
            {capabilities.map((capability) => (
              <CapabilityCard
                key={capability.title}
                capability={capability}
              />
            ))}
          </View>
        </View>

        {/* ============================================================
            4. TRUST & TRANSPARENCY
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.trustContainer}>
            <View style={styles.trustMain}>
              <View style={styles.transparencyBadge}>
                <ShieldCheck
                  size={14}
                  color={COLORS.emerald}
                  strokeWidth={2.4}
                />

                <Text style={styles.transparencyBadgeText}>
                  TRUST & TRANSPARENCY
                </Text>
              </View>

              <Text style={styles.trustHeading}>
                Designed Around Citizen Trust
              </Text>

              <Text style={styles.trustDescription}>
                YojnaSetu focuses on clear eligibility guidance, official
                scheme information, transparent routes, and a simple citizen
                experience.
              </Text>

              <View style={styles.trustPoints}>
                <TrustPoint
                  icon={
                    <FileCheck2
                      size={17}
                      color="#0284C7"
                      strokeWidth={2.3}
                    />
                  }
                  iconBackground="#F0F9FF"
                  iconBorder="#BAE6FD"
                  title="Explicit Eligibility Rules"
                  description="Eligibility guidance is based on defined scheme conditions rather than arbitrary recommendations."
                />

                <TrustPoint
                  icon={
                    <CircleCheck
                      size={17}
                      color={COLORS.emerald}
                      strokeWidth={2.3}
                    />
                  }
                  iconBackground="#ECFDF5"
                  iconBorder="#A7F3D0"
                  title="Official Scheme Information"
                  description="The platform is built around official scheme details and government sources."
                />

                <TrustPoint
                  icon={
                    <LockKeyhole
                      size={17}
                      color={COLORS.amber}
                      strokeWidth={2.3}
                    />
                  }
                  iconBackground="#FFFBEB"
                  iconBorder="#FDE68A"
                  title="Privacy-Conscious Experience"
                  description="The platform is designed to minimize unnecessary document and personal-data handling."
                />
              </View>
            </View>

            <View style={styles.trustDarkPanel}>
              <View style={styles.trustDarkGlowTop} />
              <View style={styles.trustDarkGlowBottom} />

              <View style={styles.trustDarkContent}>
                <View style={styles.trustShieldBox}>
                  <Shield
                    size={24}
                    color="#7DD3FC"
                    strokeWidth={2.2}
                  />
                </View>

                <Text style={styles.trustDarkTitle}>
                  Clear. Guided. Citizen-Focused.
                </Text>

                <Text style={styles.trustDarkDescription}>
                  From discovering a scheme to finding the right assistance
                  channel, YojnaSetu aims to make every step easier to
                  understand.
                </Text>

                <View style={styles.darkChecks}>
                  <DarkCheck text="Verified information" />
                  <DarkCheck text="Rule-based guidance" />
                  <DarkCheck text="Official routes" />
                  <DarkCheck text="Citizen-first design" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            5. HOW YOJNASETU HELPS
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.centerHeader}>
            <View style={styles.journeyBadge}>
              <CompassIcon />

              <Text style={styles.journeyBadgeText}>
                CITIZEN JOURNEY
              </Text>
            </View>

            <Text style={styles.centerHeading}>
              From Discovery to Action
            </Text>

            <Text style={styles.centerDescription}>
              A straightforward journey to help citizens find and understand
              relevant welfare opportunities.
            </Text>
          </View>

          <View style={styles.journeyList}>
            {journeySteps.map((step) => (
              <JourneyStepCard key={step.number} step={step} />
            ))}
          </View>
        </View>

        {/* ============================================================
            6. PLATFORM PRINCIPLES
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.principlesContainer}>
            <View style={styles.principlesGlow} />

            <View style={styles.principlesContent}>
              <View style={styles.principlesHeader}>
                <View style={styles.principlesBadge}>
                  <ShieldCheck
                    size={14}
                    color={COLORS.saffron}
                    strokeWidth={2.4}
                  />

                  <Text style={styles.principlesBadgeText}>
                    OUR PRINCIPLES
                  </Text>
                </View>

                <Text style={styles.principlesHeading}>
                  Built for Simplicity, Transparency & Access
                </Text>

                <Text style={styles.principlesDescription}>
                  The platform experience is centered around making welfare
                  information easier to discover and understand.
                </Text>
              </View>

              <View style={styles.principlesList}>
                {principles.map((principle) => {
                  const Icon = principle.icon;

                  return (
                    <View
                      key={principle.title}
                      style={styles.principleCard}
                    >
                      <Icon
                        size={21}
                        color={principle.iconColor}
                        strokeWidth={2.2}
                      />

                      <Text style={styles.principleTitle}>
                        {principle.title}
                      </Text>

                      <Text style={styles.principleDescription}>
                        {principle.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            7. FINAL CTA
        ============================================================ */}

        <View style={styles.section}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaText}>
              <View style={styles.getStartedBadge}>
                <Sparkles
                  size={14}
                  color={COLORS.saffronDark}
                  strokeWidth={2.4}
                />

                <Text style={styles.getStartedText}>GET STARTED</Text>
              </View>

              <Text style={styles.ctaHeading}>
                Find Government Schemes That Fit You
              </Text>

              <Text style={styles.ctaDescription}>
                Explore schemes, check eligibility, and discover relevant
                government welfare opportunities.
              </Text>
            </View>

            <View style={styles.ctaButtons}>
              <Pressable
                onPress={() => router.push('/(tabs)/match')}
                style={({ pressed }) => [
                  styles.matchButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Find Matching Schemes"
              >
                <Sparkles
                  size={17}
                  color={COLORS.white}
                  strokeWidth={2.3}
                />

                <Text style={styles.matchButtonText}>
                  Find Matching Schemes
                </Text>

                <ArrowRight
                  size={17}
                  color={COLORS.white}
                  strokeWidth={2.4}
                />
              </Pressable>

              <Pressable
                onPress={() => router.push('/(tabs)/schemes')}
                style={({ pressed }) => [
                  styles.exploreButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Explore Schemes"
              >
                <Search
                  size={17}
                  color={COLORS.white}
                  strokeWidth={2.3}
                />

                <Text style={styles.exploreButtonText}>
                  Explore Schemes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================================================================
   SMALL REUSABLE COMPONENTS
================================================================ */

const TrustChip = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => {
  return (
    <View style={styles.trustChip}>
      {icon}

      <Text style={styles.trustChipText}>{text}</Text>
    </View>
  );
};

const CapabilityCard = ({
  capability,
}: {
  capability: Capability;
}) => {
  const Icon = capability.icon;

  return (
    <View style={styles.capabilityCard}>
      <View
        style={[
          styles.capabilityIconBox,
          {
            backgroundColor: capability.iconBackground,
            borderColor: capability.iconBorder,
          },
        ]}
      >
        <Icon
          size={21}
          color={capability.iconColor}
          strokeWidth={2.2}
        />
      </View>

      <Text style={styles.capabilityTitle}>
        {capability.title}
      </Text>

      <Text style={styles.capabilityDescription}>
        {capability.description}
      </Text>
    </View>
  );
};

const TrustPoint = ({
  icon,
  iconBackground,
  iconBorder,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  iconBorder: string;
  title: string;
  description: string;
}) => {
  return (
    <View style={styles.trustPoint}>
      <View
        style={[
          styles.trustPointIcon,
          {
            backgroundColor: iconBackground,
            borderColor: iconBorder,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.trustPointContent}>
        <Text style={styles.trustPointTitle}>{title}</Text>

        <Text style={styles.trustPointDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const DarkCheck = ({ text }: { text: string }) => {
  return (
    <View style={styles.darkCheck}>
      <CheckCircle2
        size={16}
        color="#34D399"
        strokeWidth={2.4}
      />

      <Text style={styles.darkCheckText}>{text}</Text>
    </View>
  );
};

const JourneyStepCard = ({
  step,
}: {
  step: JourneyStep;
}) => {
  const Icon = step.icon;

  return (
    <View style={styles.journeyCard}>
      <View style={styles.journeyCardTop}>
        <Text style={styles.journeyNumber}>{step.number}</Text>

        <View
          style={[
            styles.journeyIconBox,
            {
              backgroundColor: step.background,
              borderColor: step.border,
            },
          ]}
        >
          <Icon
            size={17}
            color={step.iconColor}
            strokeWidth={2.3}
          />
        </View>
      </View>

      <Text style={styles.journeyTitle}>{step.title}</Text>

      <Text style={styles.journeyDescription}>
        {step.description}
      </Text>
    </View>
  );
};

const CompassIcon: React.FC = () => {
  return (
    <View style={styles.compassOuter}>
      <View style={styles.compassInner} />
    </View>
  );
};

/* ================================================================
   STYLES
================================================================ */

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
    paddingBottom: 30,
  },

  pressed: {
    opacity: 0.78,
  },

  /* ==============================================================
     HERO
  ============================================================== */

  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.maroonDark,
    borderWidth: 1,
    borderColor: '#A52A38',
    minHeight: 425,
    position: 'relative',
  },

  heroGlowTop: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#861823',
    opacity: 0.72,
    right: -125,
    top: -125,
  },

  heroGlowBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#8B1E2D',
    opacity: 0.35,
    left: -115,
    bottom: -135,
  },

  heroGlowRight: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#0284C7',
    opacity: 0.09,
    right: 30,
    bottom: -70,
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingVertical: 29,
    zIndex: 2,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,157,46,0.30)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 17,
  },

  heroBadgeText: {
    color: COLORS.saffron,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  heroDescription: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 13,
  },

  heroTrustChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 22,
  },

  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    maxWidth: '100%',
  },

  trustChipText: {
    color: COLORS.white,
    fontSize: 10,
    lineHeight: 14,
    flexShrink: 1,
  },

  /* ==============================================================
     COMMON SECTION
  ============================================================== */

  section: {
    paddingHorizontal: 16,
    marginTop: 30,
  },

  /* ==============================================================
     WHO WE ARE
  ============================================================== */

  whoWeAreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
    shadowColor: '#0F172A',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8EDEF',
    borderWidth: 1,
    borderColor: '#F1D9DE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  sectionHeadingContainer: {
    flex: 1,
  },

  sectionEyebrow: {
    color: COLORS.saffronDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  sectionHeading: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.25,
  },

  paragraphContainer: {
    marginTop: 18,
    gap: 12,
  },

  bodyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
  },

  missionCard: {
    marginTop: 14,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: COLORS.maroonDark,
    borderWidth: 1,
    borderColor: '#A52A38',
    position: 'relative',
  },

  missionGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.saffron,
    opacity: 0.08,
    right: -70,
    top: -65,
  },

  missionContent: {
    padding: 20,
    zIndex: 2,
  },

  missionIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  missionEyebrow: {
    color: COLORS.saffron,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  missionTitle: {
    color: COLORS.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 6,
  },

  missionDescription: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
  },

  /* ==============================================================
     CAPABILITIES
  ============================================================== */

  centerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },

  capabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  capabilityBadgeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  centerHeading: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  centerDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  capabilityList: {
    gap: 12,
  },

  capabilityCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  capabilityIconBox: {
    width: 41,
    height: 41,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  capabilityTitle: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },

  capabilityDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  /* ==============================================================
     TRUST & TRANSPARENCY
  ============================================================== */

  trustContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    overflow: 'hidden',
  },

  trustMain: {
    padding: 20,
  },

  transparencyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 13,
  },

  transparencyBadgeText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  trustHeading: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  trustDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  trustPoints: {
    marginTop: 19,
    gap: 14,
  },

  trustPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  trustPointIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  trustPointContent: {
    flex: 1,
  },

  trustPointTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  trustPointDescription: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  trustDarkPanel: {
    backgroundColor: COLORS.navy,
    overflow: 'hidden',
    position: 'relative',
  },

  trustDarkGlowTop: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#0284C7',
    opacity: 0.08,
    right: -75,
    top: -80,
  },

  trustDarkGlowBottom: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.maroon,
    opacity: 0.3,
    left: -90,
    bottom: -90,
  },

  trustDarkContent: {
    padding: 20,
    zIndex: 2,
  },

  trustShieldBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  trustDarkTitle: {
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },

  trustDarkDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  darkChecks: {
    marginTop: 18,
    gap: 9,
  },

  darkCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },

  darkCheckText: {
    color: COLORS.white,
    fontSize: 11,
    flex: 1,
  },

  /* ==============================================================
     JOURNEY
  ============================================================== */

  journeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  journeyBadgeText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  compassOuter: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  compassInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },

  journeyList: {
    gap: 12,
  },

  journeyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  journeyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  journeyNumber: {
    color: '#CBD5E1',
    fontSize: 21,
    fontWeight: '900',
  },

  journeyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  journeyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  journeyDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
  },

  /* ==============================================================
     PRINCIPLES
  ============================================================== */

  principlesContainer: {
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: COLORS.maroonDark,
    borderWidth: 1,
    borderColor: '#A52A38',
    position: 'relative',
  },

  principlesGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.saffron,
    opacity: 0.07,
    right: -100,
    top: -110,
  },

  principlesContent: {
    padding: 20,
    zIndex: 2,
  },

  principlesHeader: {
    marginBottom: 20,
  },

  principlesBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,157,46,0.30)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },

  principlesBadgeText: {
    color: COLORS.saffron,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  principlesHeading: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 11,
    letterSpacing: -0.3,
  },

  principlesDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  principlesList: {
    gap: 9,
  },

  principleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 15,
    padding: 15,
  },

  principleTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  principleDescription: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  /* ==============================================================
     CTA
  ============================================================== */

  ctaCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  ctaText: {
    marginBottom: 19,
  },

  getStartedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 11,
  },

  getStartedText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  ctaHeading: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  ctaDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  ctaButtons: {
    gap: 10,
  },

  matchButton: {
    minHeight: 49,
    borderRadius: 12,
    backgroundColor: COLORS.saffronDark,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.saffronDark,
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  matchButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },

  exploreButton: {
    minHeight: 49,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  exploreButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default About;

