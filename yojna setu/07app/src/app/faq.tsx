import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  HelpCircle,
  ChevronDown,
  Search,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Calculator,
  UserCheck,
} from 'lucide-react-native';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'GENERAL',
    question: 'What is YojnaSetu?',
    answer:
      'YojnaSetu is a citizen-focused platform that helps users discover government welfare schemes, understand their eligibility, compare suitable schemes, and access useful financial and application guidance.',
  },
  {
    category: 'GENERAL',
    question: 'Who can use YojnaSetu?',
    answer:
      'Any citizen looking for information about government welfare schemes can use YojnaSetu to explore schemes, understand eligibility requirements, and access relevant resources.',
  },
  {
    category: 'SCHEMES',
    question: 'How can I find a suitable government scheme?',
    answer:
      'You can explore the Schemes section to browse available welfare schemes. You can also use the matching and recommendation features to find schemes based on your requirements and eligibility information.',
  },
  {
    category: 'SCHEMES',
    question: 'How do I know if I am eligible for a scheme?',
    answer:
      'Each scheme has its own eligibility conditions. Open the scheme details page to review requirements such as age, income, occupation, category, location, or other scheme-specific conditions.',
  },
  {
    category: 'SCHEMES',
    question: 'Can I compare different schemes?',
    answer:
      'Yes. YojnaSetu provides a comparison feature that allows you to compare relevant schemes and understand their important differences before making a decision.',
  },
  {
    category: 'APPLICATIONS',
    question: 'Does YojnaSetu submit my application for me?',
    answer:
      'YojnaSetu primarily helps citizens discover and understand schemes. Application submission depends on the concerned government department or official application channel specified for the scheme.',
  },
  {
    category: 'APPLICATIONS',
    question: 'What documents do I need to apply?',
    answer:
      'Required documents vary from scheme to scheme. Always check the specific scheme details and the concerned official authority for the latest document requirements before applying.',
  },
  {
    category: 'FINANCE',
    question: 'Can I calculate my EMI on YojnaSetu?',
    answer:
      'Yes. The Financial Calculator can help you estimate your EMI using standard reducing-balance loan calculations and understand how loan amount, interest rate, and tenure affect repayment.',
  },
  {
    category: 'FINANCE',
    question: 'What is the difference between a subsidy and a loan?',
    answer:
      'A loan is borrowed money that generally needs to be repaid with applicable interest. A subsidy is financial assistance provided under a scheme according to its specific terms and conditions. Some schemes may combine credit with subsidy support.',
  },
  {
    category: 'PRIVACY',
    question: 'Does YojnaSetu store my personal information?',
    answer:
      'YojnaSetu follows a privacy-conscious approach and is designed to minimize unnecessary collection of personally identifiable information. Always review the platform and applicable service policies for the exact information handled by a particular feature.',
  },
  {
    category: 'PRIVACY',
    question: 'Is the information on YojnaSetu official?',
    answer:
      'YojnaSetu is designed around verified government scheme information and official guidance. However, scheme rules and application requirements can change, so users should verify the latest terms with the concerned official authority before applying.',
  },
  {
    category: 'SUPPORT',
    question: 'Where can I get help if I have a problem?',
    answer:
      'You can refer to the Resources & Guidelines section for citizen support and grievance information. For scheme-specific issues, contact the concerned government department or official helpdesk.',
  },
];

const categories = [
  'ALL',
  'GENERAL',
  'SCHEMES',
  'APPLICATIONS',
  'FINANCE',
  'PRIVACY',
  'SUPPORT',
];

const Faq: React.FC = () => {
  const router = useRouter();

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'ALL' || faq.category === activeCategory;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setOpenIndex(null);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setOpenIndex(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ============================================================
            HERO
        ============================================================ */}

        <View style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <HelpCircle
                size={16}
                color={COLORS.saffron}
                strokeWidth={2.4}
              />

              <Text style={styles.heroBadgeText}>
                CITIZEN SUPPORT
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Frequently Asked{' '}
              <Text style={styles.heroAccent}>Questions</Text>
            </Text>

            <Text style={styles.heroDescription}>
              Find quick answers about YojnaSetu, government schemes,
              eligibility, applications, financial tools and privacy.
            </Text>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search
                size={20}
                color="#94A3B8"
                strokeWidth={2.2}
              />

              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search your question..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
                accessibilityLabel="Search frequently asked questions"
              />
            </View>
          </View>
        </View>

        {/* ============================================================
            CATEGORY FILTER
        ============================================================ */}

        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => {
              const active = activeCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryChange(category)}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    active
                      ? styles.categoryButtonActive
                      : styles.categoryButtonInactive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Filter by ${category}`}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      active
                        ? styles.categoryButtonTextActive
                        : styles.categoryButtonTextInactive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================
            FAQ CONTENT
        ============================================================ */}

        <View style={styles.mainContent}>
          <View style={styles.helpHeader}>
            <Text style={styles.helpEyebrow}>HELP CENTRE</Text>

            <Text style={styles.helpTitle}>How can we help?</Text>

            <Text style={styles.resultCount}>
              {filteredFaqs.length} question
              {filteredFaqs.length !== 1 ? 's' : ''} found
            </Text>
          </View>

          {filteredFaqs.length > 0 ? (
            <View style={styles.faqList}>
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <View
                    key={`${faq.question}-${index}`}
                    style={[
                      styles.faqCard,
                      isOpen
                        ? styles.faqCardOpen
                        : styles.faqCardClosed,
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        setOpenIndex(isOpen ? null : index)
                      }
                      style={({ pressed }) => [
                        styles.faqQuestionButton,
                        pressed && styles.faqPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      accessibilityLabel={faq.question}
                    >
                      <View style={styles.questionLeft}>
                        <View
                          style={[
                            styles.questionIcon,
                            isOpen
                              ? styles.questionIconOpen
                              : styles.questionIconClosed,
                          ]}
                        >
                          <HelpCircle
                            size={17}
                            color={
                              isOpen
                                ? COLORS.white
                                : COLORS.maroon
                            }
                            strokeWidth={2.2}
                          />
                        </View>

                        <View style={styles.questionTextContainer}>
                          <Text style={styles.faqCategory}>
                            {faq.category}
                          </Text>

                          <Text style={styles.faqQuestion}>
                            {faq.question}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.chevronContainer,
                          isOpen && styles.chevronContainerOpen,
                        ]}
                      >
                        <ChevronDown
                          size={20}
                          color={
                            isOpen
                              ? COLORS.maroon
                              : '#94A3B8'
                          }
                          strokeWidth={2.3}
                        />
                      </View>
                    </Pressable>

                    {isOpen && (
                      <View style={styles.answerContainer}>
                        <Text style={styles.faqAnswer}>
                          {faq.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            /* ========================================================
               NO RESULTS
            ======================================================== */

            <View style={styles.noResultsCard}>
              <View style={styles.noResultsIcon}>
                <Search
                  size={22}
                  color="#94A3B8"
                  strokeWidth={2.2}
                />
              </View>

              <Text style={styles.noResultsTitle}>
                No questions found
              </Text>

              <Text style={styles.noResultsDescription}>
                Try a different search term or category.
              </Text>

              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.resetButtonText}>
                  Clear Filters
                </Text>
              </Pressable>
            </View>
          )}

          {/* ==========================================================
              QUICK LINKS
          ========================================================== */}

          <View style={styles.quickLinksSection}>
            <View style={styles.quickLinksHeader}>
              <Text style={styles.quickLinksEyebrow}>
                NEED MORE INFORMATION?
              </Text>

              <Text style={styles.quickLinksTitle}>
                Explore YojnaSetu
              </Text>
            </View>

            <View style={styles.quickLinksList}>
              {/* Explore Schemes */}
              <QuickLinkCard
                icon={
                  <BookOpen
                    size={24}
                    color={COLORS.maroon}
                    strokeWidth={2.2}
                  />
                }
                title="Explore Schemes"
                description="Browse government welfare schemes and understand their eligibility."
                actionText="View Schemes"
                onPress={() => router.push('/(tabs)/schemes')}
              />

              {/* Resources */}
              <QuickLinkCard
                icon={
                  <ShieldCheck
                    size={24}
                    color={COLORS.emerald}
                    strokeWidth={2.2}
                  />
                }
                title="Resources & Guidelines"
                description="Access official guidance, financial literacy and citizen support resources."
                actionText="View Resources"
                onPress={() => router.push('/resources')}
              />

              {/* Calculator */}
              <QuickLinkCard
                icon={
                  <Calculator
                    size={24}
                    color={COLORS.amber}
                    strokeWidth={2.2}
                  />
                }
                title="Financial Calculator"
                description="Estimate EMI and understand your potential repayment obligations."
                actionText="Open Calculator"
                onPress={() =>
                  router.push('/(tabs)/calculator')
                }
              />
            </View>
          </View>

          {/* ==========================================================
              FINAL SUPPORT CARD
          ========================================================== */}

          <View style={styles.supportCard}>
            <View style={styles.supportGlowTop} />
            <View style={styles.supportGlowBottom} />

            <View style={styles.supportContent}>
              <View style={styles.supportInfo}>
                <View style={styles.supportIconBox}>
                  <UserCheck
                    size={24}
                    color={COLORS.saffron}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.supportTextContainer}>
                  <Text style={styles.supportTitle}>
                    Still have questions?
                  </Text>

                  <Text style={styles.supportDescription}>
                    Check the relevant scheme details or refer to
                    the official authority before submitting an
                    application.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/schemes')}
                style={({ pressed }) => [
                  styles.findSchemeButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Find a Scheme"
              >
                <Text style={styles.findSchemeButtonText}>
                  Find a Scheme
                </Text>

                <ArrowRight
                  size={17}
                  color={COLORS.maroon}
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================================================================
   QUICK LINK CARD
================================================================ */

const QuickLinkCard = ({
  icon,
  title,
  description,
  actionText,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickLinkCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${actionText}`}
    >
      <View style={styles.quickLinkIcon}>{icon}</View>

      <Text style={styles.quickLinkTitle}>{title}</Text>

      <Text style={styles.quickLinkDescription}>
        {description}
      </Text>

      <View style={styles.quickLinkAction}>
        <Text style={styles.quickLinkActionText}>
          {actionText}
        </Text>

        <ArrowRight
          size={15}
          color={COLORS.maroon}
          strokeWidth={2.5}
        />
      </View>
    </Pressable>
  );
};

/* ================================================================
   COLORS
================================================================ */

const COLORS = {
  background: '#FEF9F3',
  white: '#FFFFFF',

  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',

  maroon: '#861823',
  maroonDark: '#5B1827',
  navy: '#071B2B',

  saffron: '#FFB347',
  saffronDark: '#D97706',

  emerald: '#047857',
  amber: '#D97706',
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

  faqPressed: {
    backgroundColor: '#FAFAFA',
  },

  /* ==============================================================
     HERO
  ============================================================== */

  hero: {
    minHeight: 410,
    backgroundColor: COLORS.maroonDark,
    overflow: 'hidden',
    position: 'relative',
  },

  heroGlowTop: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: COLORS.maroon,
    opacity: 0.72,
    top: -135,
    right: -115,
  },

  heroGlowBottom: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0284C7',
    opacity: 0.08,
    bottom: -190,
    left: -145,
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 42,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },

  heroBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 37,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  heroAccent: {
    color: COLORS.saffron,
  },

  heroDescription: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },

  searchContainer: {
    marginTop: 25,
    minHeight: 54,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 52,
    paddingVertical: 0,
  },

  /* ==============================================================
     CATEGORY FILTER
  ============================================================== */

  categoryContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  categoryButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryButtonActive: {
    backgroundColor: COLORS.maroon,
    shadowColor: COLORS.maroon,
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  categoryButtonInactive: {
    backgroundColor: '#F1F5F9',
  },

  categoryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  categoryButtonTextActive: {
    color: COLORS.white,
  },

  categoryButtonTextInactive: {
    color: '#64748B',
  },

  /* ==============================================================
     MAIN
  ============================================================== */

  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 38,
  },

  helpHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },

  helpEyebrow: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  helpTitle: {
    color: COLORS.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: 6,
  },

  resultCount: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 8,
  },

  /* ==============================================================
     FAQ
  ============================================================== */

  faqList: {
    gap: 11,
  },

  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
  },

  faqCardOpen: {
    borderColor: '#DFAEB6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  faqCardClosed: {
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  faqQuestionButton: {
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },

  questionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },

  questionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  questionIconOpen: {
    backgroundColor: COLORS.maroon,
  },

  questionIconClosed: {
    backgroundColor: '#F8EDEF',
  },

  questionTextContainer: {
    flex: 1,
    paddingTop: 1,
  },

  faqCategory: {
    color: COLORS.maroon,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },

  faqQuestion: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },

  chevronContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  chevronContainerOpen: {
    transform: [{ rotate: '180deg' }],
  },

  answerContainer: {
    paddingHorizontal: 14,
    paddingLeft: 63,
    paddingBottom: 17,
  },

  faqAnswer: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
  },

  /* ==============================================================
     NO RESULTS
  ============================================================== */

  noResultsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },

  noResultsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noResultsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 13,
  },

  noResultsDescription: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  resetButton: {
    marginTop: 17,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ==============================================================
     QUICK LINKS
  ============================================================== */

  quickLinksSection: {
    marginTop: 42,
  },

  quickLinksHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },

  quickLinksEyebrow: {
    color: COLORS.saffronDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  quickLinksTitle: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 6,
  },

  quickLinksList: {
    gap: 11,
  },

  quickLinkCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  quickLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#F8EDEF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickLinkTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 14,
  },

  quickLinkDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  quickLinkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },

  quickLinkActionText: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: '900',
  },

  /* ==============================================================
     FINAL SUPPORT
  ============================================================== */

  supportCard: {
    marginTop: 30,
    borderRadius: 22,
    backgroundColor: COLORS.maroonDark,
    overflow: 'hidden',
    position: 'relative',
  },

  supportGlowTop: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.maroon,
    opacity: 0.55,
    top: -85,
    right: -65,
  },

  supportGlowBottom: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.navy,
    opacity: 0.75,
    bottom: -100,
    left: -85,
  },

  supportContent: {
    padding: 20,
    zIndex: 2,
  },

  supportInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  supportIconBox: {
    width: 47,
    height: 47,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  supportTextContainer: {
    flex: 1,
  },

  supportTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },

  supportDescription: {
    color: 'rgba(255,255,255,0.67)',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  findSchemeButton: {
    minHeight: 48,
    marginTop: 19,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  findSchemeButtonText: {
    color: COLORS.maroon,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default Faq;

