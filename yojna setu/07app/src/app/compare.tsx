import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  Plus,
  Scale,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react-native";

import { schemeApi } from "../api/schemeApi";

/* ============================================================
   LOCAL TYPES
   ============================================================ */

type ComparisonStatus =
  | "ELIGIBLE"
  | "INSUFFICIENT_INFORMATION"
  | "INELIGIBLE"
  | string;

interface ComparisonRule {
  field: string;
  operator?: string;
  value?: string | number | boolean | null;
  description?: string | null;
}

interface ComparisonDocument {
  document_name: string;
  requirement_type?: string | null;
}

interface ComparisonScheme {
  scheme_id: string;
  scheme_name: string;
  scheme_code?: string | null;
  ministry?: string | null;
  implementing_agency?: string | null;
  scheme_type?: string | null;
  sector?: string | null;
  objective?: string | null;

  target_groups?: string[] | null;
  applicant_types?: string[] | null;
  marginalized_group?: string | null;
  sc_required?: boolean | null;
  business_stage?: string | null;
  activity_type?: string | null;
  support_type?: string | null;
  new_business_allowed?: boolean | null;
  existing_business_allowed?: boolean | null;
  state_restriction?: string | null;
  state_coverage?: string[] | null;

  min_age?: number | null;
  max_age?: number | null;

  loan_available?: boolean | string | null;
  min_loan_amount?: number | null;
  max_loan_amount?: number | null;
  max_loan_amount_raw?: string | number | null;

  max_project_cost?: number | null;
  max_subsidy_amount?: number | null;
  subsidy_percentage?: number | null;
  financing_percentage?: number | null;
  interest_rate?: number | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;

  benefit_description?: string | null;
  repayment_period_months?: number | null;
  moratorium_period_months?: number | null;
  collateral_required?: boolean | string | null;

  application_mode?: string | null;
  application_route?: string | null;
  partner_count?: number | null;
  application_steps?: string[] | null;
  required_documents?: string[] | null;

  application_url?: string | null;
  official_portal?: string | null;
  official_source_url?: string | null;

  short_description?: string | null;
  purpose?: string | null;
  target_beneficiary?: string | null;

  financial_category?: string | null;
  is_credit_scheme?: boolean | null;
  calculator_applicable?: boolean | null;
  financial_assistance_summary?: string | null;
  grant_amount?: number | null;
  repayment_period_max_months?: number | null;
  verification_status?: string | null;

  rules?: ComparisonRule[];
  documents?: ComparisonDocument[];
}

interface PersonalizedEligibility {
  status: ComparisonStatus;
  reasons?: string[];
  missing_fields?: string[];
}

interface ComparisonItem {
  scheme: ComparisonScheme;
  personalized_eligibility?: PersonalizedEligibility | null;
}

interface ComparisonResponse {
  compared_schemes: ComparisonItem[];
  invalid_ids?: string[];
}

/* ============================================================
   SECTION CARD
   ============================================================ */

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}

function SectionCard({
  title,
  subtitle,
  icon,
  badge,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>{icon}</View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{title}</Text>

            {subtitle ? (
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {badge ? (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/* ============================================================
   COMPARISON ROW
   ============================================================ */

interface ComparisonRowProps {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  items: ComparisonItem[];
  renderValue: (item: ComparisonItem) => React.ReactNode;
  last?: boolean;
}

function ComparisonRow({
  label,
  hint,
  icon,
  items,
  renderValue,
  last = false,
}: ComparisonRowProps) {
  return (
    <View style={[styles.comparisonRow, !last && styles.comparisonRowBorder]}>
      <View style={styles.comparisonLabelContainer}>
        <View style={styles.comparisonLabelRow}>
          {icon ? <View style={styles.rowIcon}>{icon}</View> : null}

          <Text style={styles.comparisonLabel}>{label}</Text>
        </View>

        {hint ? <Text style={styles.comparisonHint}>{hint}</Text> : null}
      </View>

      <View style={styles.valuesContainer}>
        {items.map((item) => (
          <View key={item.scheme.scheme_id} style={styles.valueCard}>
            <View style={styles.valueSchemeHeader}>
              <Text style={styles.valueSchemeCode}>
                {item.scheme.scheme_code || item.scheme.scheme_id}
              </Text>

              <Text style={styles.valueSchemeName} numberOfLines={2}>
                {item.scheme.scheme_name}
              </Text>
            </View>

            <View style={styles.valueContent}>{renderValue(item)}</View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================
   SMALL INFO HELPERS
   ============================================================ */

function NotSpecified() {
  return (
    <Text style={styles.notSpecified}>
      Not specified in available official data
    </Text>
  );
}

function NotApplicable() {
  return <Text style={styles.notApplicable}>Not applicable</Text>;
}

function openExternalUrl(url?: string | null) {
  if (!url) {
    return;
  }

  Linking.openURL(url).catch((error) => {
    console.warn("Unable to open URL:", error);
  });
}

/* ============================================================
   MAIN SCREEN
   ============================================================ */

export default function CompareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    schemes?: string | string[];
  }>();

  const schemesParam = Array.isArray(params.schemes)
    ? params.schemes[0]
    : params.schemes || "";

  const schemeIds = useMemo(() => {
    return schemesParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [schemesParam]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] =
    useState<ComparisonResponse | null>(null);

  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [schemeToRemove, setSchemeToRemove] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    if (schemeIds.length === 0) {
      setComparisonData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await schemeApi.getComparison(schemeIds);

      setComparisonData(data as unknown as ComparisonResponse);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load scheme comparison data.",
      );
    } finally {
      setLoading(false);
    }
  }, [schemeIds]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const items = comparisonData?.compared_schemes || [];

  const maxLoanValue = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }

    return Math.max(...items.map(({ scheme }) => scheme.max_loan_amount || 0));
  }, [items]);

  const minInterestValue = useMemo(() => {
    if (items.length === 0) {
      return 999;
    }

    return Math.min(
      ...items.map(({ scheme }) => {
        return scheme.interest_rate_min || scheme.interest_rate || 999;
      }),
    );
  }, [items]);

  /* ============================================================
     REMOVE SCHEME
     ============================================================ */

  const requestRemoveScheme = (schemeId: string) => {
    setSchemeToRemove(schemeId);
    setRemoveModalVisible(true);
  };

  const confirmRemoveScheme = () => {
    if (!schemeToRemove) {
      return;
    }

    const updatedIds = schemeIds.filter((id) => id !== schemeToRemove);

    setRemoveModalVisible(false);
    setSchemeToRemove(null);

    if (updatedIds.length === 0) {
      router.replace("/compare");
      return;
    }

    router.replace(
      `/compare?schemes=${encodeURIComponent(updatedIds.join(","))}` as any,
    );
  };

  /* ============================================================
     CLEAR ALL
     ============================================================ */

  const handleClearAll = () => {
    router.replace("/compare");
  };

  /* ============================================================
     FORMATTERS
     ============================================================ */

  const formatLoanAmount = (scheme: ComparisonScheme) => {
    if (scheme.is_credit_scheme === false || scheme.loan_available === "NO") {
      return (
        <Text style={styles.italicMuted}>
          Not applicable (Grant / Subsidy Scheme)
        </Text>
      );
    }

    if (scheme.max_loan_amount && scheme.max_loan_amount > 0) {
      const isHighest =
        scheme.max_loan_amount === maxLoanValue && items.length > 1;

      return (
        <View style={styles.valueStack}>
          <Text style={styles.bigValue}>
            ₹{scheme.max_loan_amount.toLocaleString("en-IN")}
          </Text>

          {isHighest ? (
            <View style={styles.greenBadge}>
              <Text style={styles.greenBadgeText}>Highest stated</Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (scheme.max_loan_amount_raw) {
      return <Text style={styles.bigValue}>{scheme.max_loan_amount_raw}</Text>;
    }

    return <NotSpecified />;
  };

  const formatInterestRate = (scheme: ComparisonScheme) => {
    if (scheme.is_credit_scheme === false || scheme.loan_available === "NO") {
      return <NotApplicable />;
    }

    const minRate = scheme.interest_rate_min || scheme.interest_rate;

    const maxRate = scheme.interest_rate_max;

    if (minRate) {
      const isLowest =
        minRate === minInterestValue &&
        minInterestValue < 999 &&
        items.length > 1;

      return (
        <View style={styles.valueStack}>
          <Text style={styles.bigValue}>
            {minRate}%{maxRate ? ` – ${maxRate}%` : ""} p.a.
          </Text>

          {isLowest ? (
            <View style={styles.blueBadge}>
              <Text style={styles.blueBadgeText}>Lowest stated</Text>
            </View>
          ) : null}
        </View>
      );
    }

    return <NotSpecified />;
  };

  const formatTenure = (scheme: ComparisonScheme) => {
    if (scheme.is_credit_scheme === false || scheme.loan_available === "NO") {
      return <NotApplicable />;
    }

    const months =
      scheme.repayment_period_months || scheme.repayment_period_max_months;

    if (months && months > 0) {
      const years = (months / 12).toFixed(1).replace(".0", "");

      return (
        <Text style={styles.strongValue}>
          {months} months ({years} years)
        </Text>
      );
    }

    return <NotSpecified />;
  };

  const renderEligibility = (item: ComparisonItem) => {
    const eligibility = item.personalized_eligibility;

    if (!eligibility) {
      return (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Log in or complete your profile to evaluate personalized
            eligibility.
          </Text>
        </View>
      );
    }

    if (eligibility.status === "ELIGIBLE") {
      return (
        <View>
          <View style={styles.eligibleBadge}>
            <CheckCircle2 size={17} color="#059669" />

            <Text style={styles.eligibleText}>Eligible</Text>
          </View>

          {eligibility.reasons && eligibility.reasons.length > 0 ? (
            <View style={styles.reasonList}>
              {eligibility.reasons.slice(0, 3).map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.reasonText}>
                  • {reason}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      );
    }

    if (eligibility.status === "INSUFFICIENT_INFORMATION") {
      return (
        <View>
          <View style={styles.warningBadge}>
            <AlertTriangle size={17} color="#d97706" />

            <Text style={styles.warningText}>More Info Required</Text>
          </View>

          {eligibility.missing_fields &&
          eligibility.missing_fields.length > 0 ? (
            <View style={styles.missingBox}>
              <Text style={styles.missingTitle}>Missing attributes</Text>

              <Text style={styles.missingText}>
                {eligibility.missing_fields.join(", ")}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (eligibility.status === "INELIGIBLE") {
      return (
        <View>
          <View style={styles.ineligibleBadge}>
            <XCircle size={17} color="#dc2626" />

            <Text style={styles.ineligibleText}>Not Eligible</Text>
          </View>

          {eligibility.reasons && eligibility.reasons.length > 0 ? (
            <View style={styles.reasonList}>
              {eligibility.reasons.slice(0, 3).map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.reasonText}>
                  • {reason}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      );
    }

    return <Text style={styles.strongValue}>{eligibility.status}</Text>;
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0284c7" />

          <Text style={styles.loadingTitle}>
            Fetching official scheme comparison data...
          </Text>

          <Text style={styles.loadingSubtitle}>
            Please wait while we compare the selected schemes.
          </Text>
        </View>
      </View>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.errorPage}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={17} color="#475569" />

            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <View style={styles.errorCard}>
            <View style={styles.errorIconCircle}>
              <AlertTriangle size={30} color="#dc2626" />
            </View>

            <Text style={styles.errorTitle}>Unable to Compare Schemes</Text>

            <Text style={styles.errorMessage}>{error}</Text>

            <Pressable onPress={fetchComparison} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ============================================================
     MAIN UI
     ============================================================ */

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.headerCard}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={17} color="#64748b" />

            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <View style={styles.headerTitleRow}>
            <View style={styles.mainIcon}>
              <Scale size={25} color="#0284c7" strokeWidth={2} />
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.mainTitle}>Compare Schemes</Text>

              <Text style={styles.mainSubtitle}>
                Compare 2 to 4 schemes side-by-side in clear vertical sections.
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {items.length > 0 ? (
              <Pressable onPress={handleClearAll} style={styles.clearButton}>
                <X size={15} color="#64748b" />

                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.push("/schemes")}
              style={styles.addButton}
            >
              <Plus size={17} color="#ffffff" strokeWidth={2.5} />

              <Text style={styles.addButtonText}>Add Scheme</Text>
            </Pressable>
          </View>
        </View>

        {/* INVALID IDS */}
        {comparisonData?.invalid_ids &&
        comparisonData.invalid_ids.length > 0 ? (
          <View style={styles.invalidCard}>
            <AlertTriangle size={19} color="#d97706" />

            <View style={styles.invalidTextContainer}>
              <Text style={styles.invalidTitle}>
                Some schemes could not be loaded
              </Text>

              <Text style={styles.invalidText}>
                {comparisonData.invalid_ids.join(", ")}
              </Text>
            </View>
          </View>
        ) : null}

        {/* EMPTY */}
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Scale size={34} color="#94a3b8" />
            </View>

            <Text style={styles.emptyTitle}>
              No Schemes Selected for Comparison
            </Text>

            <Text style={styles.emptyDescription}>
              Select 2 to 4 schemes from Scheme Discovery or Recommendations to
              view a side-by-side comparison.
            </Text>

            <Pressable
              onPress={() => router.push("/schemes")}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>Browse Schemes</Text>

              <ArrowRight size={16} color="#ffffff" />
            </Pressable>
          </View>
        ) : (
          <>
            {/* SCHEME CARDS */}
            <View style={styles.schemesCard}>
              <View style={styles.comparingHeader}>
                <View>
                  <Text style={styles.comparingTitle}>
                    Comparing {items.length} Scheme
                    {items.length > 1 ? "s" : ""}
                  </Text>

                  <Text style={styles.comparingSubtitle}>
                    Swipe vertically through each comparison section.
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.schemeCardsScroll}
              >
                {items.map(({ scheme }) => (
                  <View key={scheme.scheme_id} style={styles.schemeCard}>
                    <Pressable
                      onPress={() => requestRemoveScheme(scheme.scheme_id)}
                      style={styles.removeSchemeButton}
                      accessibilityLabel={`Remove ${scheme.scheme_name}`}
                    >
                      <X size={15} color="#64748b" />
                    </Pressable>

                    <View style={styles.schemeCardTop}>
                      <View style={styles.schemeBadgeRow}>
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeBadgeText}>
                            {scheme.scheme_code || scheme.scheme_id}
                          </Text>
                        </View>

                        {scheme.is_credit_scheme ? (
                          <View style={styles.creditBadge}>
                            <Text style={styles.creditBadgeText}>Credit</Text>
                          </View>
                        ) : (
                          <View style={styles.welfareBadge}>
                            <Text style={styles.welfareBadgeText}>Welfare</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.schemeCardTitle} numberOfLines={3}>
                        {scheme.scheme_name}
                      </Text>

                      <Text style={styles.schemeCardMinistry} numberOfLines={2}>
                        {scheme.ministry || "Government of India"}
                      </Text>
                    </View>

                    <View style={styles.schemeCardActions}>
                      <Pressable
                        onPress={() =>
                          router.push(`/schemes/${scheme.scheme_id}` as any)
                        }
                        style={styles.detailsButton}
                      >
                        <Text style={styles.detailsText}>Details</Text>

                        <ExternalLink size={13} color="#0284c7" />
                      </Pressable>

                      {scheme.calculator_applicable !== false &&
                      scheme.is_credit_scheme !== false ? (
                        <Pressable
                          onPress={() =>
                            router.push(
                              `/calculator?scheme_id=${encodeURIComponent(
                                scheme.scheme_id,
                              )}` as any,
                            )
                          }
                          style={styles.emiButton}
                        >
                          <Calculator size={14} color="#047857" />

                          <Text style={styles.emiButtonText}>EMI</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* PERSONALIZED ELIGIBILITY */}
            <SectionCard
              title="Your Eligibility Fit"
              subtitle="Automated assessment based on your registered citizen profile"
              icon={<Sparkles size={20} color="#10b981" />}
              badge="Personalized"
            >
              <ComparisonRow
                label="Eligibility Status"
                hint="Personalized assessment"
                items={items}
                last
                renderValue={renderEligibility}
              />
            </SectionCard>

            {/* OVERVIEW */}
            <SectionCard
              title="Scheme Overview"
              subtitle="Core mandate, ministry sponsoring body, and geographical scope"
              icon={<Building2 size={20} color="#0284c7" />}
            >
              <ComparisonRow
                label="Scheme Type"
                items={items}
                renderValue={({ scheme }) => (
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>
                      {scheme.financial_category
                        ? scheme.financial_category.replace(/_/g, " ")
                        : scheme.scheme_type || "CREDIT / LOAN"}
                    </Text>
                  </View>
                )}
              />

              <ComparisonRow
                label="Ministry / Department"
                items={items}
                renderValue={({ scheme }) => (
                  <View>
                    <Text style={styles.strongValue}>
                      {scheme.ministry || "Government of India"}
                    </Text>

                    {scheme.implementing_agency ? (
                      <Text style={styles.secondaryValue}>
                        {scheme.implementing_agency}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <ComparisonRow
                label="Target Beneficiary"
                items={items}
                renderValue={({ scheme }) => (
                  <Text style={styles.strongValue}>
                    {scheme.target_beneficiary ||
                      scheme.target_groups ||
                      "General Citizens"}
                  </Text>
                )}
              />

              <ComparisonRow
                label="Scheme Purpose & Benefits"
                items={items}
                renderValue={({ scheme }) => (
                  <Text style={styles.bodyValue} numberOfLines={5}>
                    {scheme.financial_assistance_summary ||
                      scheme.benefit_description ||
                      scheme.short_description ||
                      scheme.purpose ||
                      "Refer to official scheme guidelines"}
                  </Text>
                )}
              />

              <ComparisonRow
                label="Geographic Coverage"
                items={items}
                last
                icon={<MapPin size={15} color="#64748b" />}
                renderValue={({ scheme }) => (
                  <View style={styles.inlineValue}>
                    <MapPin size={15} color="#64748b" />

                    <Text style={styles.strongValue}>
                      {scheme.state_restriction &&
                      scheme.state_restriction !== "ALL_INDIA"
                        ? scheme.state_restriction.replace(/_/g, " ")
                        : "All India / Central Scheme"}
                    </Text>
                  </View>
                )}
              />
            </SectionCard>

            {/* ELIGIBILITY CRITERIA */}
            <SectionCard
              title="Eligibility Criteria"
              subtitle="Age, income, social category, and vocational qualification"
              icon={<ShieldCheck size={20} color="#0284c7" />}
            >
              <ComparisonRow
                label="Age Criteria"
                items={items}
                renderValue={({ scheme }) => {
                  if (scheme.min_age || scheme.max_age) {
                    return (
                      <Text style={styles.strongValue}>
                        {scheme.min_age ? `Min ${scheme.min_age} yrs` : ""}
                        {scheme.min_age && scheme.max_age ? " – " : ""}
                        {scheme.max_age ? `Max ${scheme.max_age} yrs` : ""}
                      </Text>
                    );
                  }

                  return <NotSpecified />;
                }}
              />

              <ComparisonRow
                label="Income Limit / Ceiling"
                items={items}
                renderValue={({ scheme }) => {
                  const rule = scheme.rules?.find((item) =>
                    item.field?.toLowerCase().includes("income"),
                  );

                  if (rule) {
                    return (
                      <Text style={styles.strongValue}>
                        {rule.description ||
                          `${rule.operator || ""} ${rule.value ?? ""}`}
                      </Text>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      No mandatory income ceiling specified
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Social Category & Gender"
                items={items}
                renderValue={({ scheme }) => {
                  const genderRule = scheme.rules?.find(
                    (item) => item.field === "gender",
                  );

                  return (
                    <View>
                      <Text style={styles.strongValue}>
                        {scheme.marginalized_group ||
                          scheme.target_groups ||
                          "All Categories"}
                      </Text>

                      {genderRule ? (
                        <Text style={styles.secondaryValue}>
                          Gender: {String(genderRule.value ?? "")}
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
              />

              <ComparisonRow
                label="Sector / Vocation"
                items={items}
                renderValue={({ scheme }) => (
                  <Text style={styles.strongValue}>
                    {scheme.sector
                      ? scheme.sector.replace(/_/g, " ")
                      : "All Sectors"}
                  </Text>
                )}
              />

              <ComparisonRow
                label="Key Conditions"
                items={items}
                last
                renderValue={({ scheme }) => {
                  const rules = scheme.rules || [];

                  if (rules.length > 0) {
                    return (
                      <View style={styles.bulletList}>
                        {rules.slice(0, 3).map((rule, index) => (
                          <Text
                            key={`${rule.field}-${index}`}
                            style={styles.bodyValue}
                          >
                            •{" "}
                            {rule.description ||
                              `${rule.field.replace(/_/g, " ")}: ${
                                rule.value ?? ""
                              }`}
                          </Text>
                        ))}
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      Standard KYC and official ministry guidelines apply.
                    </Text>
                  );
                }}
              />
            </SectionCard>

            {/* FINANCIAL */}
            <SectionCard
              title="Financial Assistance & Credit Terms"
              subtitle="Credit ceiling, interest rates, tenure, subsidy, and collateral"
              icon={<Banknote size={20} color="#0284c7" />}
            >
              <ComparisonRow
                label="Loan Facility Available"
                items={items}
                renderValue={({ scheme }) => {
                  const available =
                    scheme.is_credit_scheme !== false &&
                    scheme.loan_available !== "NO";

                  return available ? (
                    <View style={styles.loanYesBadge}>
                      <Check size={14} color="#047857" />

                      <Text style={styles.loanYesBadgeText}>
                        Yes — Credit Facility
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.loanNoBadge}>
                      <X size={14} color="#475569" />

                      <Text style={styles.loanNoBadgeText}>
                        No — Grant / Subsidy / Welfare
                      </Text>
                    </View>
                  );
                }}
              />

              <ComparisonRow
                label="Maximum Stated Loan"
                items={items}
                renderValue={({ scheme }) => formatLoanAmount(scheme)}
              />

              <ComparisonRow
                label="Interest Rate"
                items={items}
                renderValue={({ scheme }) => formatInterestRate(scheme)}
              />

              <ComparisonRow
                label="Repayment Tenure"
                items={items}
                renderValue={({ scheme }) => formatTenure(scheme)}
              />

              <ComparisonRow
                label="Moratorium Period"
                items={items}
                renderValue={({ scheme }) => {
                  if (
                    scheme.is_credit_scheme === false ||
                    scheme.loan_available === "NO"
                  ) {
                    return <NotApplicable />;
                  }

                  if (
                    scheme.moratorium_period_months &&
                    scheme.moratorium_period_months > 0
                  ) {
                    return (
                      <Text style={styles.strongValue}>
                        {scheme.moratorium_period_months} months
                      </Text>
                    );
                  }

                  return <NotSpecified />;
                }}
              />

              <ComparisonRow
                label="Subsidy / Grant Assistance"
                items={items}
                renderValue={({ scheme }) => {
                  if (
                    scheme.subsidy_percentage &&
                    scheme.subsidy_percentage > 0
                  ) {
                    return (
                      <Text style={styles.greenStrongValue}>
                        Up to {scheme.subsidy_percentage}%
                        {scheme.max_subsidy_amount
                          ? ` (Max ₹${scheme.max_subsidy_amount.toLocaleString(
                              "en-IN",
                            )})`
                          : ""}
                      </Text>
                    );
                  }

                  if (
                    scheme.max_subsidy_amount &&
                    scheme.max_subsidy_amount > 0
                  ) {
                    return (
                      <Text style={styles.greenStrongValue}>
                        Up to ₹
                        {scheme.max_subsidy_amount.toLocaleString("en-IN")}
                      </Text>
                    );
                  }

                  if (scheme.grant_amount && scheme.grant_amount > 0) {
                    return (
                      <Text style={styles.greenStrongValue}>
                        Grant: ₹{scheme.grant_amount.toLocaleString("en-IN")}
                      </Text>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      {scheme.is_credit_scheme
                        ? "Direct interest subvention / credit guarantee"
                        : "Direct benefit transfer / non-loan subsidy"}
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Beneficiary Contribution"
                items={items}
                renderValue={({ scheme }) => {
                  if (
                    scheme.financing_percentage &&
                    scheme.financing_percentage > 0 &&
                    scheme.financing_percentage < 100
                  ) {
                    return (
                      <Text style={styles.strongValue}>
                        {100 - scheme.financing_percentage}% of project cost
                      </Text>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      Standard 5% - 10% or as per lending institution
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Collateral Requirement"
                items={items}
                renderValue={({ scheme }) => {
                  if (
                    scheme.collateral_required === "NO" ||
                    scheme.collateral_required === "NONE"
                  ) {
                    return (
                      <View style={styles.noCollateralBadge}>
                        <ShieldCheck size={15} color="#047857" />

                        <Text style={styles.noCollateralText}>
                          No collateral required
                        </Text>
                      </View>
                    );
                  }

                  if (scheme.collateral_required) {
                    return (
                      <Text style={styles.strongValue}>
                        {scheme.collateral_required}
                      </Text>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      No collateral for loans up to statutory limits.
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Calculator"
                items={items}
                last
                renderValue={({ scheme }) => {
                  if (
                    scheme.calculator_applicable !== false &&
                    scheme.is_credit_scheme !== false
                  ) {
                    return (
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/calculator?scheme_id=${encodeURIComponent(
                              scheme.scheme_id,
                            )}` as any,
                          )
                        }
                        style={styles.calculateButton}
                      >
                        <Calculator size={16} color="#047857" />

                        <Text style={styles.calculateButtonText}>
                          Calculate EMI
                        </Text>
                      </Pressable>
                    );
                  }

                  return <NotApplicable />;
                }}
              />
            </SectionCard>

            {/* DOCUMENTS */}
            <SectionCard
              title="Documents & Proofs"
              subtitle="Mandatory identity, residence, business, and conditional proofs"
              icon={<FileText size={20} color="#0284c7" />}
            >
              <ComparisonRow
                label="Mandatory Documents"
                items={items}
                renderValue={({ scheme }) => {
                  const docs = scheme.documents || [];

                  const requiredDocs = docs.filter(
                    (doc) =>
                      doc.requirement_type === "MANDATORY" ||
                      doc.requirement_type === "REQUIRED",
                  );

                  if (requiredDocs.length > 0) {
                    return (
                      <View style={styles.documentList}>
                        {requiredDocs.map((doc, index) => (
                          <View
                            key={`${doc.document_name}-${index}`}
                            style={styles.documentRow}
                          >
                            <FileText size={14} color="#0284c7" />

                            <Text style={styles.documentText}>
                              {doc.document_name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.bodyValue}>
                      {scheme.required_documents ||
                        "Standard KYC & ID Proof only"}
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Optional / Conditional Proofs"
                items={items}
                last
                renderValue={({ scheme }) => {
                  const docs = scheme.documents || [];

                  const optionalDocs = docs.filter(
                    (doc) =>
                      doc.requirement_type === "OPTIONAL" ||
                      doc.requirement_type === "CONDITIONAL",
                  );

                  if (optionalDocs.length > 0) {
                    return (
                      <View style={styles.documentList}>
                        {optionalDocs.map((doc, index) => (
                          <Text
                            key={`${doc.document_name}-${index}`}
                            style={styles.bodyValue}
                          >
                            • {doc.document_name}
                          </Text>
                        ))}
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.notSpecified}>
                      No conditional documents specified
                    </Text>
                  );
                }}
              />
            </SectionCard>

            {/* APPLICATION */}
            <SectionCard
              title="Application & Access Route"
              subtitle="Submission channels, authorized portal links, and channel partners"
              icon={<SendHorizontal size={20} color="#0284c7" />}
            >
              <ComparisonRow
                label="Application Mode"
                items={items}
                renderValue={({ scheme }) => (
                  <Text style={styles.strongValue}>
                    {scheme.application_mode || "Online / Institutional"}
                  </Text>
                )}
              />

              <ComparisonRow
                label="Application Route"
                items={items}
                renderValue={({ scheme }) => {
                  if (scheme.application_route === "DIRECT_PORTAL") {
                    return (
                      <View style={styles.routeGreen}>
                        <ExternalLink size={14} color="#047857" />

                        <Text style={styles.routeGreenText}>
                          Direct Online Portal
                        </Text>
                      </View>
                    );
                  }

                  if (scheme.application_route === "CHANNEL_PARTNER") {
                    return (
                      <View style={styles.routeBlue}>
                        <Building2 size={14} color="#3730a3" />

                        <Text style={styles.routeBlueText}>
                          Channel Partner / Agency
                        </Text>
                      </View>
                    );
                  }

                  if (scheme.application_route === "PARTNER_ASSISTED") {
                    return (
                      <View style={styles.routeBlue}>
                        <Building2 size={14} color="#1d4ed8" />

                        <Text style={styles.routeBlueText}>
                          Channel Partner / Bank Assisted
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.secondaryValue}>
                      Official Government Route
                    </Text>
                  );
                }}
              />

              <ComparisonRow
                label="Official Portal"
                items={items}
                renderValue={({ scheme }) => {
                  const portalUrl =
                    scheme.official_portal || scheme.application_url;

                  if (!portalUrl) {
                    return <NotSpecified />;
                  }

                  return (
                    <Pressable
                      onPress={() => openExternalUrl(portalUrl)}
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText} numberOfLines={3}>
                        {portalUrl}
                      </Text>

                      <ExternalLink size={15} color="#0284c7" />
                    </Pressable>
                  );
                }}
              />

              <ComparisonRow
                label="Implementing Agency"
                items={items}
                renderValue={({ scheme }) => (
                  <Text style={styles.strongValue}>
                    {scheme.implementing_agency ||
                      scheme.ministry ||
                      "Government of India"}
                  </Text>
                )}
              />

              <ComparisonRow
                label="Application CTA"
                items={items}
                last
                renderValue={({ scheme }) => {
                  const portalUrl =
                    scheme.official_portal || scheme.application_url;

                  return (
                    <View style={styles.ctaStack}>
                      {portalUrl ? (
                        <Pressable
                          onPress={() => openExternalUrl(portalUrl)}
                          style={styles.officialButton}
                        >
                          <Text style={styles.officialButtonText}>
                            Official Portal
                          </Text>

                          <ExternalLink size={15} color="#ffffff" />
                        </Pressable>
                      ) : null}

                      <Pressable
                        onPress={() =>
                          router.push(
                            `/partners?scheme_id=${encodeURIComponent(
                              scheme.scheme_id,
                            )}` as any,
                          )
                        }
                        style={styles.partnerButton}
                      >
                        <Building2 size={15} color="#047857" />

                        <Text style={styles.partnerButtonText}>
                          Find Partners
                        </Text>
                      </Pressable>
                    </View>
                  );
                }}
              />
            </SectionCard>

            {/* VERIFICATION */}
            <SectionCard
              title="Verification & Official Coverage"
              subtitle="Official source validation and geographical coverage"
              icon={<CheckCircle2 size={20} color="#059669" />}
            >
              <ComparisonRow
                label="Government Verification"
                items={items}
                renderValue={({ scheme }) => (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={15} color="#047857" />

                    <Text style={styles.verifiedText}>
                      {scheme.verification_status || "VERIFIED_OFFICIAL"}
                    </Text>
                  </View>
                )}
              />

              <ComparisonRow
                label="Official Source"
                items={items}
                renderValue={({ scheme }) => {
                  if (!scheme.official_source_url) {
                    return <NotSpecified />;
                  }

                  return (
                    <Pressable
                      onPress={() =>
                        openExternalUrl(scheme.official_source_url)
                      }
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText} numberOfLines={3}>
                        {scheme.official_source_url}
                      </Text>

                      <ExternalLink size={14} color="#0284c7" />
                    </Pressable>
                  );
                }}
              />

              <ComparisonRow
                label="Last Verified Date"
                items={items}
                renderValue={() => (
                  <Text style={styles.monoValue}>2026-09-01</Text>
                )}
              />

              <ComparisonRow
                label="States / UTs"
                items={items}
                last
                renderValue={({ scheme }) => (
                  <Text style={styles.strongValue}>
                    {scheme.state_restriction &&
                    scheme.state_restriction !== "ALL_INDIA"
                      ? scheme.state_restriction.replace(/_/g, " ")
                      : "All India / Central Scheme"}
                  </Text>
                )}
              />
            </SectionCard>
          </>
        )}
      </ScrollView>

      {/* REMOVE CONFIRMATION */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <X size={24} color="#dc2626" />
            </View>

            <Text style={styles.confirmTitle}>Remove Scheme?</Text>

            <Text style={styles.confirmDescription}>
              Remove this scheme from the comparison?
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => {
                  setRemoveModalVisible(false);
                  setSchemeToRemove(null);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmRemoveScheme}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  centerScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loadingCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 30,
    alignItems: "center",
  },

  loadingTitle: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },

  loadingSubtitle: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 5,
    marginBottom: 11,
  },

  backButtonText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  mainIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  mainTitle: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "900",
  },

  mainSubtitle: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
  },

  clearButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  clearButtonText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
  },

  addButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  invalidCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 13,
    padding: 13,
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },

  invalidTextContainer: {
    flex: 1,
  },

  invalidTitle: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "800",
  },

  invalidText: {
    color: "#a16207",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  schemesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 15,
    marginBottom: 12,
  },

  comparingHeader: {
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  comparingTitle: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  comparingSubtitle: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 3,
  },

  schemeCardsScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },

  schemeCard: {
    width: 270,
    minHeight: 155,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 13,
    position: "relative",
  },

  removeSchemeButton: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  schemeCardTop: {
    paddingRight: 28,
  },

  schemeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },

  codeBadge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  codeBadgeText: {
    color: "#0369a1",
    fontSize: 8,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  creditBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  creditBadgeText: {
    color: "#047857",
    fontSize: 8,
    fontWeight: "800",
  },

  welfareBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  welfareBadgeText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "800",
  },

  schemeCardTitle: {
    color: "#0f172a",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  schemeCardMinistry: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  schemeCardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 11,
    paddingTop: 10,
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detailsText: {
    color: "#0284c7",
    fontSize: 10,
    fontWeight: "800",
  },

  emiButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  emiButtonText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 12,
  },

  sectionHeader: {
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  sectionHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  sectionBadge: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  sectionBadgeText: {
    color: "#047857",
    fontSize: 8,
    fontWeight: "800",
  },

  sectionBody: {
    paddingHorizontal: 14,
  },

  comparisonRow: {
    paddingVertical: 14,
  },

  comparisonRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  comparisonLabelContainer: {
    marginBottom: 9,
  },

  comparisonLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  rowIcon: {
    width: 19,
    alignItems: "center",
  },

  comparisonLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  comparisonHint: {
    color: "#94a3b8",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },

  valuesContainer: {
    gap: 8,
  },

  valueCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 11,
    padding: 10,
  },

  valueSchemeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    gap: 7,
  },

  valueSchemeCode: {
    color: "#0369a1",
    backgroundColor: "#e0f2fe",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 7,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  valueSchemeName: {
    flex: 1,
    color: "#64748b",
    fontSize: 9,
    fontWeight: "600",
  },

  valueContent: {
    minHeight: 22,
    justifyContent: "center",
  },

  strongValue: {
    color: "#0f172a",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },

  greenStrongValue: {
    color: "#047857",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
  },

  secondaryValue: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "600",
  },

  bodyValue: {
    color: "#475569",
    fontSize: 10,
    lineHeight: 16,
  },

  bigValue: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },

  monoValue: {
    color: "#475569",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
  },

  italicMuted: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },

  notApplicable: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },

  notSpecified: {
    color: "#94a3b8",
    fontSize: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },

  valueStack: {
    alignItems: "flex-start",
    gap: 6,
  },

  greenBadge: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  greenBadgeText: {
    color: "#166534",
    fontSize: 8,
    fontWeight: "800",
  },

  blueBadge: {
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  blueBadgeText: {
    color: "#1e40af",
    fontSize: 8,
    fontWeight: "800",
  },

  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  typePillText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  inlineValue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  eligibleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  eligibleText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "800",
  },

  warningBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  warningText: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "800",
  },

  ineligibleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ineligibleText: {
    color: "#b91c1c",
    fontSize: 10,
    fontWeight: "800",
  },

  reasonList: {
    marginTop: 8,
    gap: 4,
  },

  reasonText: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 15,
  },

  missingBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },

  missingTitle: {
    color: "#92400e",
    fontSize: 9,
    fontWeight: "800",
  },

  missingText: {
    color: "#a16207",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  infoBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 9,
  },

  infoBoxText: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 15,
    fontStyle: "italic",
  },

  loanYesBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  loanYesBadgeText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  loanNoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  loanNoBadgeText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "800",
  },

  noCollateralBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  noCollateralText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  calculateButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  calculateButtonText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "800",
  },

  documentList: {
    gap: 7,
  },

  documentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  documentText: {
    flex: 1,
    color: "#475569",
    fontSize: 10,
    lineHeight: 15,
  },

  bulletList: {
    gap: 5,
  },

  routeGreen: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  routeGreenText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  routeBlue: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  routeBlueText: {
    color: "#3730a3",
    fontSize: 9,
    fontWeight: "800",
  },

  linkButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  linkText: {
    flex: 1,
    color: "#0284c7",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },

  ctaStack: {
    gap: 8,
  },

  officialButton: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#0284c7",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  officialButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  partnerButton: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  partnerButtonText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "800",
  },

  verifiedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  verifiedText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 25,
    paddingVertical: 45,
    alignItems: "center",
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 330,
  },

  browseButton: {
    minHeight: 43,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 18,
  },

  browseButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  errorPage: {
    flexGrow: 1,
    padding: 14,
    justifyContent: "center",
  },

  errorCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  errorIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    color: "#991b1b",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
  },

  errorMessage: {
    color: "#b91c1c",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  retryButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
  },

  retryButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 13,
  },

  confirmDescription: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  confirmActions: {
    width: "100%",
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
  },

  removeButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
});
