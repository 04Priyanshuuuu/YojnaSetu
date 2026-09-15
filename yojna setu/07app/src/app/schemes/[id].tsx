import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import theme from "../../constants/theme";
import apiClient from "../../api/client";

type SchemeRule = {
  rule_id?: string | number;
  field?: string | null;
  value?: string | number | null;
  rule_type?: string | null;
  description?: string | null;
  error_message?: string | null;
};

type Scheme = {
  scheme_id: string;
  scheme_name: string;
  scheme_code?: string | null;
  ministry?: string | null;
  implementing_agency?: string | null;
  scheme_type?: string | null;
  sector?: string | null;
  objective?: string | null;
  target_groups?: string | null;
  applicant_types?: string | null;
  marginalized_group?: string | null;
  sc_required?: string | null;
  business_stage?: string | null;
  activity_type?: string | null;
  support_type?: string | null;
  new_business_allowed?: string | null;
  existing_business_allowed?: string | null;
  state_restriction?: string | null;
  state_coverage?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  loan_available?: string | null;
  min_loan_amount?: number | null;
  max_loan_amount?: number | null;
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
  collateral_required?: string | null;
  application_mode?: string | null;
  application_route?: string | null;
  partner_count?: number | null;
  application_steps?: string | null;
  required_documents?: string | null;
  application_url?: string | null;
  official_portal?: string | null;
  official_source_url?: string | null;
  short_description?: string | null;
  purpose?: string | null;
  target_beneficiary?: string | null;
  max_loan_amount_raw?: string | null;
  financial_category?: string | null;
  is_credit_scheme?: boolean;
  calculator_applicable?: boolean;
  financial_assistance_summary?: string | null;
  grant_amount?: number | null;
  repayment_period_max_months?: number | null;
  verification_status?: string | null;
  last_verified_date?: string | null;
  source_date?: string | null;
  updated_at?: string | null;
  source_organization?: string | null;
  rules?: SchemeRule[];
  verifications?: Array<{
    verification_status?: string | null;
  }>;
};

type Citation = {
  snippet?: string;
  [key: string]: unknown;
};

type AIChatResponse = {
  answer: string;
  citations?: Citation[];
};

const formatCurrency = (
  value?: number | null
): string => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "Not specified";
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

const formatPercent = (
  value?: number | null
): string => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "Not specified";
  }

  return `${value}%`;
};

const formatValue = (
  value?: string | number | null
): string => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "Not specified";
  }

  return String(value);
};

const cleanDisplayValue = (
  value?: string | null
): string => {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getRuleDisplay = (
  rule: SchemeRule
): string => {
  const field = (
    rule.field || ""
  ).toLowerCase();

  const value = String(
    rule.value ?? ""
  ).trim();

  if (field === "age_min") {
    return `Minimum Age: ${value} years`;
  }

  if (field === "age_max") {
    return `Maximum Age: ${value} years`;
  }

  if (
    field === "annual_income_max" ||
    field === "income_limit"
  ) {
    const numberValue = Number(value);

    if (
      !Number.isNaN(numberValue) &&
      numberValue > 0
    ) {
      return `Annual Family Income Limit: ${formatCurrency(
        numberValue
      )}`;
    }

    return `Annual Income Limit: ${value}`;
  }

  if (
    field === "gender_condition" ||
    field === "gender"
  ) {
    return `Eligible Gender: ${
      value === "F" ||
      value === "FEMALE"
        ? "Female Beneficiaries"
        : value
    }`;
  }

  if (
    field === "social_category" ||
    field === "caste"
  ) {
    return `Target Social Category: ${value}`;
  }

  if (
    field === "activity_type" ||
    field === "trade"
  ) {
    if (
      value === "TRADITIONAL_TRADE_18"
    ) {
      return "Covered Trades: 18 traditional artisan and craft trades";
    }

    return `Eligible Activities: ${cleanDisplayValue(
      value
    )}`;
  }

  if (
    field === "state_coverage" ||
    field === "state"
  ) {
    return `Geographic Coverage: ${value}`;
  }

  if (field === "project_cost_max") {
    const numberValue = Number(value);

    if (
      !Number.isNaN(numberValue) &&
      numberValue > 0
    ) {
      return `Maximum Project Cost: ${formatCurrency(
        numberValue
      )}`;
    }

    return `Project Cost Limit: ${value}`;
  }

  if (
    rule.description &&
    !rule.description.includes("RULE-")
  ) {
    return rule.description;
  }

  return `${cleanDisplayValue(
    rule.field || "Eligibility"
  )}: ${value}`;
};

export default function SchemeDetailScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
      amount?: string;
      loan_amount?: string;
      requested_loan_amount?: string;
    }>();

  const schemeId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const initialLoanAmount = useMemo(() => {
    const amount =
      params.amount ||
      params.loan_amount ||
      params.requested_loan_amount;

    if (!amount) return null;

    const parsed = Number(amount);

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }, [
    params.amount,
    params.loan_amount,
    params.requested_loan_amount,
  ]);

  const [scheme, setScheme] =
    useState<Scheme | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [chatMessage, setChatMessage] =
    useState("");

  const [chatResult, setChatResult] =
    useState<AIChatResponse | null>(null);

  const [isChatLoading, setIsChatLoading] =
    useState(false);

  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>({
      overview: true,
      financial: true,
      eligibility: true,
      documents: true,
      application: true,
      provenance: false,
      ai: false,
    });

  const fetchSchemeDetail = async (
    id: string,
    refreshing = false
  ) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMsg(null);

    try {
      /*
       * Same backend resource used by the website's
       * schemeApi.getSchemeById(id).
       */
      const response =
        await apiClient.get<Scheme>(
          `/schemes/${encodeURIComponent(id)}`
        );

      setScheme(response.data);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.userFriendlyMessage ||
        error?.message ||
        "Unable to load scheme details.";

      setErrorMsg(
        `Unable to load scheme details. ${detail}`
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (schemeId) {
      fetchSchemeDetail(schemeId);
    } else {
      setIsLoading(false);
      setErrorMsg(
        "Scheme ID was not provided."
      );
    }
  }, [schemeId]);

  const toggleSection = (
    section: string
  ) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const openExternalUrl = async (
    url?: string | null
  ) => {
    if (!url) return;

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error(
        "Unable to open URL:",
        error
      );
    }
  };

  const handleAskSchemeAI = async () => {
    if (
      !schemeId ||
      !chatMessage.trim()
    ) {
      return;
    }

    setIsChatLoading(true);
    setErrorMsg(null);

    try {
      /*
       * This is the native equivalent of:
       * aiApi.askAboutScheme(
       *   schemeId,
       *   { message: chatMessage }
       * )
       */
      const response =
        await apiClient.post<AIChatResponse>(
          `/ai/schemes/${encodeURIComponent(
            schemeId
          )}/ask`,
          {
            message: chatMessage.trim(),
          }
        );

      setChatResult(response.data);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.userFriendlyMessage ||
        error?.message ||
        "Unable to get AI guidance.";

      setErrorMsg(
        `AI guidance failed: ${detail}`
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#0E766E"
          />

          <Text style={styles.loadingText}>
            Loading scheme details...
          </Text>
        </View>
      </Screen>
    );
  }

  if (errorMsg || !scheme) {
    return (
      <Screen scrollable>
        <View style={styles.errorPage}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#B42318"
            />
          </View>

          <Text style={styles.errorTitle}>
            Scheme Not Found
          </Text>

          <Text style={styles.errorDescription}>
            {errorMsg ||
              "The requested scheme could not be loaded."}
          </Text>

          <Pressable
            onPress={() =>
              router.replace(
                "/(tabs)/schemes"
              )
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.backButtonText}>
              Back to Schemes
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const officialUrl =
    scheme.application_url ||
    scheme.official_portal ||
    scheme.official_source_url;

  const verificationStatus =
    scheme.verification_status ||
    scheme.verifications?.[0]
      ?.verification_status ||
    "VERIFIED";

  const ministry =
    scheme.ministry ||
    scheme.implementing_agency ||
    scheme.source_organization ||
    "Government of India";

  const isVerified =
    verificationStatus
      .toUpperCase()
      .includes("VERIF");

  const hasFinancialData =
    scheme.is_credit_scheme ||
    scheme.loan_available ||
    scheme.min_loan_amount ||
    scheme.max_loan_amount ||
    scheme.max_subsidy_amount ||
    scheme.subsidy_percentage ||
    scheme.interest_rate ||
    scheme.interest_rate_min ||
    scheme.interest_rate_max ||
    scheme.grant_amount;

  const rules = scheme.rules || [];

  const documents =
    scheme.required_documents
      ?.split(/\r?\n|[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean) || [];

  const applicationSteps =
    scheme.application_steps
      ?.split(/\r?\n/)
      .map((item) =>
        item
          .replace(
            /^\s*(?:\d+[\).\-\:]|\-)\s*/,
            ""
          )
          .trim()
      )
      .filter(Boolean) || [];

  return (
    <Screen>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() =>
                schemeId &&
                fetchSchemeDetail(
                  schemeId,
                  true
                )
              }
              tintColor="#0E766E"
            />
          }
          contentContainerStyle={
            styles.contentContainer
          }
        >
          {/* Back Navigation */}
          <Pressable
            onPress={() => router.back()}
            style={styles.topBackButton}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#344054"
            />

            <Text style={styles.topBackText}>
              Back to Schemes
            </Text>
          </Pressable>

          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View
                style={styles.schemeTypeBadge}
              >
                <Text
                  style={styles.schemeTypeText}
                  numberOfLines={1}
                >
                  {scheme.scheme_type ||
                    "CENTRAL SCHEME"}
                </Text>
              </View>

              {isVerified && (
                <View
                  style={styles.verifiedBadge}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color="#A7F3D0"
                  />

                  <Text
                    style={
                      styles.verifiedBadgeText
                    }
                  >
                    VERIFIED
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={styles.heroTitle}
            >
              {scheme.scheme_name}
            </Text>

            <View style={styles.ministryRow}>
              <Ionicons
                name="business-outline"
                size={17}
                color="#F7B955"
              />

              <Text
                style={styles.ministryText}
                numberOfLines={3}
              >
                {ministry}
              </Text>
            </View>

            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>
                SCHEME ID
              </Text>

              <Text
                style={styles.schemeId}
                selectable
              >
                {scheme.scheme_id}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={styles.actionCard}
              onPress={() =>
                router.push({
                  pathname:
                    "/(tabs)/calculator",
                  params: {
                    scheme:
                      scheme.scheme_id,
                    amount:
                      initialLoanAmount
                        ? String(
                            initialLoanAmount
                          )
                        : undefined,
                  },
                })
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  styles.actionIconGreen,
                ]}
              >
                <Ionicons
                  name="calculator-outline"
                  size={20}
                  color="#047857"
                />
              </View>

              <Text
                style={styles.actionText}
                numberOfLines={2}
              >
                Calculate EMI
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() =>
                router.push({
                  pathname: "/partners",
                  params: {
                    scheme_id:
                      scheme.scheme_id,
                  },
                })
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  styles.actionIconBlue,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#4338CA"
                />
              </View>

              <Text
                style={styles.actionText}
                numberOfLines={2}
              >
                Find Center
              </Text>
            </Pressable>

            {officialUrl && (
              <Pressable
                style={styles.actionCard}
                onPress={() =>
                  openExternalUrl(
                    officialUrl
                  )
                }
              >
                <View
                  style={[
                    styles.actionIcon,
                    styles.actionIconOrange,
                  ]}
                >
                  <Ionicons
                    name="open-outline"
                    size={20}
                    color="#C2410C"
                  />
                </View>

                <Text
                  style={styles.actionText}
                  numberOfLines={2}
                >
                  Official Portal
                </Text>
              </Pressable>
            )}
          </View>

          {/* PURPOSE / OVERVIEW */}
          <SectionHeader
            title="Purpose & Overview"
            icon="information-circle-outline"
            expanded={
              expandedSections.overview
            }
            onPress={() =>
              toggleSection("overview")
            }
          />

          {expandedSections.overview && (
            <View style={styles.sectionCard}>
              <Text style={styles.bodyText}>
                {scheme.objective ||
                  scheme.purpose ||
                  scheme.short_description ||
                  "Verified scheme under Government of India welfare guidelines."}
              </Text>

              <InfoGrid
                items={[
                  {
                    label: "Sector",
                    value:
                      scheme.sector,
                    icon: "briefcase-outline",
                  },
                  {
                    label: "Support Type",
                    value:
                      scheme.support_type,
                    icon: "gift-outline",
                  },
                  {
                    label:
                      "Target Beneficiary",
                    value:
                      scheme.target_beneficiary ||
                      scheme.target_groups,
                    icon: "people-outline",
                  },
                  {
                    label:
                      "State Coverage",
                    value:
                      scheme.state_coverage ||
                      scheme.state_restriction,
                    icon: "map-outline",
                  },
                ]}
              />
            </View>
          )}

          {/* FINANCIAL */}
          {hasFinancialData && (
            <>
              <SectionHeader
                title="Financial Assistance"
                icon="cash-outline"
                expanded={
                  expandedSections.financial
                }
                onPress={() =>
                  toggleSection(
                    "financial"
                  )
                }
              />

              {expandedSections.financial && (
                <View
                  style={styles.sectionCard}
                >
                  {scheme
                    .financial_assistance_summary && (
                    <Text
                      style={
                        styles.bodyText
                      }
                    >
                      {
                        scheme.financial_assistance_summary
                      }
                    </Text>
                  )}

                  <InfoGrid
                    items={[
                      {
                        label:
                          "Loan Available",
                        value:
                          scheme.loan_available,
                        icon: "cash-outline",
                      },
                      {
                        label:
                          "Minimum Loan",
                        value:
                          scheme.min_loan_amount
                            ? formatCurrency(
                                scheme.min_loan_amount
                              )
                            : null,
                        icon: "remove-outline",
                      },
                      {
                        label:
                          "Maximum Loan",
                        value:
                          scheme.max_loan_amount
                            ? formatCurrency(
                                scheme.max_loan_amount
                              )
                            : scheme.max_loan_amount_raw,
                        icon: "trending-up-outline",
                      },
                      {
                        label:
                          "Subsidy",
                        value:
                          scheme.subsidy_percentage !==
                          null &&
                          scheme.subsidy_percentage !==
                            undefined
                            ? formatPercent(
                                scheme.subsidy_percentage
                              )
                            : scheme.max_subsidy_amount
                            ? formatCurrency(
                                scheme.max_subsidy_amount
                              )
                            : null,
                        icon: "pricetag-outline",
                      },
                      {
                        label:
                          "Interest Rate",
                        value:
                          scheme.interest_rate !==
                          null &&
                          scheme.interest_rate !==
                            undefined
                            ? formatPercent(
                                scheme.interest_rate
                              )
                            : scheme.interest_rate_min !==
                                null &&
                              scheme.interest_rate_min !==
                                undefined
                            ? `${formatPercent(
                                scheme.interest_rate_min
                              )} - ${formatPercent(
                                scheme.interest_rate_max
                              )}`
                            : null,
                        icon: "stats-chart-outline",
                      },
                      {
                        label:
                          "Repayment Period",
                        value:
                          scheme.repayment_period_max_months ||
                          scheme.repayment_period_months
                            ? `${
                                scheme.repayment_period_max_months ||
                                scheme.repayment_period_months
                              } months`
                            : null,
                        icon: "time-outline",
                      },
                      {
                        label:
                          "Moratorium",
                        value:
                          scheme.moratorium_period_months
                            ? `${scheme.moratorium_period_months} months`
                            : null,
                        icon: "pause-circle-outline",
                      },
                      {
                        label:
                          "Collateral",
                        value:
                          scheme.collateral_required,
                        icon: "shield-checkmark-outline",
                      },
                    ]}
                  />
                </View>
              )}
            </>
          )}

          {/* ELIGIBILITY */}
          <SectionHeader
            title={`Eligibility ${
              rules.length
                ? `(${rules.length})`
                : ""
            }`}
            icon="shield-checkmark-outline"
            expanded={
              expandedSections.eligibility
            }
            onPress={() =>
              toggleSection(
                "eligibility"
              )
            }
          />

          {expandedSections.eligibility && (
            <View style={styles.sectionCard}>
              <View
                style={styles.guidanceBox}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#0369A1"
                />

                <View
                  style={
                    styles.guidanceContent
                  }
                >
                  <Text
                    style={
                      styles.guidanceTitle
                    }
                  >
                    Eligibility Guidance
                  </Text>

                  <Text
                    style={
                      styles.guidanceText
                    }
                  >
                    Eligibility conditions are
                    shown from the verified scheme
                    data.
                  </Text>
                </View>
              </View>

              {rules.length === 0 ? (
                <Text
                  style={styles.emptyText}
                >
                  Standard scheme conditions
                  apply. Detailed structured
                  eligibility rules are not
                  available in the current data.
                </Text>
              ) : (
                rules.map(
                  (rule, index) => (
                    <View
                      key={
                        rule.rule_id ??
                        index
                      }
                      style={
                        styles.ruleCard
                      }
                    >
                      <View
                        style={
                          styles.ruleHeader
                        }
                      >
                        <Text
                          style={
                            styles.ruleField
                          }
                        >
                          {cleanDisplayValue(
                            rule.field ||
                              "Eligibility"
                          )}
                        </Text>

                        <View
                          style={[
                            styles.ruleType,
                            (
                              rule.rule_type ||
                              ""
                            ).toUpperCase() ===
                              "ELIGIBILITY"
                              ? styles.ruleTypeBlue
                              : styles.ruleTypeGreen,
                          ]}
                        >
                          <Text
                            style={
                              styles.ruleTypeText
                            }
                          >
                            {rule.rule_type ||
                              "RULE"}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.ruleValue
                        }
                      >
                        {getRuleDisplay(
                          rule
                        )}
                      </Text>

                      {rule.error_message &&
                        !rule.error_message.includes(
                          "RULE-"
                        ) && (
                          <Text
                            style={
                              styles.ruleDescription
                            }
                          >
                            {
                              rule.error_message
                            }
                          </Text>
                        )}
                    </View>
                  )
                )
              )}
            </View>
          )}

          {/* DOCUMENTS */}
          <SectionHeader
            title="Required Documents"
            icon="document-text-outline"
            expanded={
              expandedSections.documents
            }
            onPress={() =>
              toggleSection(
                "documents"
              )
            }
          />

          {expandedSections.documents && (
            <View style={styles.sectionCard}>
              {documents.length > 0 ? (
                documents.map(
                  (document, index) => (
                    <View
                      key={`${document}-${index}`}
                      style={
                        styles.documentRow
                      }
                    >
                      <View
                        style={
                          styles.documentIcon
                        }
                      >
                        <Ionicons
                          name="document-outline"
                          size={17}
                          color="#0369A1"
                        />
                      </View>

                      <Text
                        style={
                          styles.documentText
                        }
                      >
                        {document}
                      </Text>
                    </View>
                  )
                )
              ) : (
                <Text
                  style={styles.emptyText}
                >
                  Required documents are not
                  specified in the available
                  scheme data.
                </Text>
              )}
            </View>
          )}

          {/* HOW TO APPLY */}
          <SectionHeader
            title="How to Apply"
            icon="navigate-outline"
            expanded={
              expandedSections.application
            }
            onPress={() =>
              toggleSection(
                "application"
              )
            }
          />

          {expandedSections.application && (
            <View style={styles.sectionCard}>
              <InfoGrid
                items={[
                  {
                    label:
                      "Application Mode",
                    value:
                      scheme.application_mode,
                    icon: "apps-outline",
                  },
                  {
                    label:
                      "Application Route",
                    value:
                      scheme.application_route,
                    icon: "git-branch-outline",
                  },
                  {
                    label:
                      "Partner Centers",
                    value:
                      scheme.partner_count !==
                        null &&
                      scheme.partner_count !==
                        undefined
                        ? String(
                            scheme.partner_count
                          )
                        : null,
                    icon: "people-circle-outline",
                  },
                ]}
              />

              {applicationSteps.length >
                0 && (
                <View
                  style={
                    styles.stepsContainer
                  }
                >
                  <Text
                    style={
                      styles.subsectionTitle
                    }
                  >
                    Application Steps
                  </Text>

                  {applicationSteps.map(
                    (step, index) => (
                      <View
                        key={`${step}-${index}`}
                        style={
                          styles.stepRow
                        }
                      >
                        <View
                          style={
                            styles.stepNumber
                          }
                        >
                          <Text
                            style={
                              styles.stepNumberText
                            }
                          >
                            {index + 1}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.stepText
                          }
                        >
                          {step}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          )}

          {/* PROVENANCE */}
          <SectionHeader
            title="Official Provenance & Verification"
            icon="shield-checkmark-outline"
            expanded={
              expandedSections.provenance
            }
            onPress={() =>
              toggleSection(
                "provenance"
              )
            }
          />

          {expandedSections.provenance && (
            <View style={styles.sectionCard}>
              <InfoGrid
                items={[
                  {
                    label:
                      "Official Source / Ministry",
                    value:
                      scheme.ministry ||
                      scheme.implementing_agency ||
                      scheme.source_organization,
                    icon: "business-outline",
                  },
                  {
                    label:
                      "Verification Status",
                    value:
                      verificationStatus,
                    icon: "checkmark-circle-outline",
                  },
                  {
                    label:
                      "Last Verified",
                    value:
                      scheme.last_verified_date ||
                      scheme.updated_at
                        ? formatDate(
                            scheme.last_verified_date ||
                              scheme.updated_at
                          )
                        : null,
                    icon: "calendar-outline",
                  },
                ]}
              />

              {officialUrl && (
                <Pressable
                  onPress={() =>
                    openExternalUrl(
                      officialUrl
                    )
                  }
                  style={
                    styles.sourceUrlButton
                  }
                >
                  <Ionicons
                    name="link-outline"
                    size={18}
                    color="#0369A1"
                  />

                  <Text
                    style={
                      styles.sourceUrlText
                    }
                    numberOfLines={2}
                  >
                    {officialUrl}
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={16}
                    color="#0369A1"
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* AI Q&A */}
          <SectionHeader
            title="Ask YojnaSetu AI"
            icon="sparkles-outline"
            expanded={
              expandedSections.ai
            }
            onPress={() =>
              toggleSection("ai")
            }
          />

          {expandedSections.ai && (
            <View style={styles.sectionCard}>
              <View
                style={styles.aiHeader}
              >
                <View
                  style={styles.aiIcon}
                >
                  <Ionicons
                    name="sparkles"
                    size={19}
                    color="#FFFFFF"
                  />
                </View>

                <View
                  style={styles.aiHeaderText}
                >
                  <Text
                    style={styles.aiTitle}
                  >
                    Scheme-specific AI
                  </Text>

                  <Text
                    style={styles.aiSubtitle}
                  >
                    Ask questions about this
                    scheme.
                  </Text>
                </View>

                <View
                  style={styles.aiVerified}
                >
                  <Text
                    style={
                      styles.aiVerifiedText
                    }
                  >
                    VERIFIED INFO
                  </Text>
                </View>
              </View>

              <View
                style={styles.chatInputRow}
              >
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Ask about eligibility, benefits..."
                  placeholderTextColor="#98A2B3"
                  multiline
                  editable={!isChatLoading}
                  style={
                    styles.chatInput
                  }
                />

                <Pressable
                  onPress={
                    handleAskSchemeAI
                  }
                  disabled={
                    isChatLoading ||
                    !chatMessage.trim()
                  }
                  style={[
                    styles.sendButton,
                    (isChatLoading ||
                      !chatMessage.trim()) &&
                      styles.sendButtonDisabled,
                  ]}
                >
                  {isChatLoading ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                      size="small"
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>
              </View>

              {chatResult && (
                <View
                  style={styles.answerCard}
                >
                  <View
                    style={
                      styles.answerHeader
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={18}
                      color="#0369A1"
                    />

                    <Text
                      style={
                        styles.answerTitle
                      }
                    >
                      Answer
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.answerText
                    }
                  >
                    {chatResult.answer}
                  </Text>

                  {chatResult.citations &&
                    chatResult.citations
                      .length > 0 && (
                      <View
                        style={
                          styles.citations
                        }
                      >
                        <View
                          style={
                            styles.citationsTitleRow
                          }
                        >
                          <Ionicons
                            name="bookmark-outline"
                            size={15}
                            color="#047857"
                          />

                          <Text
                            style={
                              styles.citationsTitle
                            }
                          >
                            Sources
                          </Text>
                        </View>

                        {chatResult.citations.map(
                          (
                            citation,
                            index
                          ) => (
                            <View
                              key={index}
                              style={
                                styles.citationCard
                              }
                            >
                              <Text
                                style={
                                  styles.citationLabel
                                }
                              >
                                Verified Information
                              </Text>

                              {citation.snippet && (
                                <Text
                                  style={
                                    styles.citationText
                                  }
                                >
                                  "{citation.snippet}"
                                </Text>
                              )}
                            </View>
                          )
                        )}
                      </View>
                    )}
                </View>
              )}
            </View>
          )}

          {/* Bottom spacing for sticky CTA */}
          <View
            style={styles.bottomSpacer}
          />
        </ScrollView>

        {/* Sticky Bottom Action Bar */}
        <View
          style={styles.bottomActionBar}
        >
          <Pressable
            style={styles.secondaryAction}
            onPress={() => {
              /*
               * Save functionality can be connected
               * to the mobile saved-scheme API when
               * that mobile service is added.
               */
              router.push("/saved");
            }}
          >
            <Ionicons
              name="bookmark-outline"
              size={20}
              color="#344054"
            />

            <Text
              style={
                styles.secondaryActionText
              }
            >
              Save
            </Text>
          </Pressable>

          <Pressable
            style={styles.primaryAction}
            onPress={() => {
              if (
                scheme.application_route ===
                  "CHANNEL_PARTNER" ||
                (scheme.partner_count &&
                  scheme.partner_count > 0)
              ) {
                router.push({
                  pathname: "/partners",
                  params: {
                    scheme_id:
                      scheme.scheme_id,
                  },
                });

                return;
              }

              if (officialUrl) {
                openExternalUrl(
                  officialUrl
                );
              }
            }}
          >
            <Ionicons
              name={
                scheme.application_route ===
                  "CHANNEL_PARTNER" ||
                (scheme.partner_count &&
                  scheme.partner_count > 0)
                  ? "location-outline"
                  : "open-outline"
              }
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.primaryActionText
              }
            >
              {scheme.application_route ===
                "CHANNEL_PARTNER" ||
              (scheme.partner_count &&
                scheme.partner_count > 0)
                ? "Find Center"
                : "Apply / Official Portal"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

type SectionHeaderProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onPress: () => void;
};

function SectionHeader({
  title,
  icon,
  expanded,
  onPress,
}: SectionHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.sectionHeader}
    >
      <View
        style={styles.sectionHeaderLeft}
      >
        <View
          style={styles.sectionHeaderIcon}
        >
          <Ionicons
            name={icon}
            size={19}
            color="#0E766E"
          />
        </View>

        <Text
          style={styles.sectionHeaderTitle}
        >
          {title}
        </Text>
      </View>

      <Ionicons
        name={
          expanded
            ? "chevron-up"
            : "chevron-down"
        }
        size={20}
        color="#667085"
      />
    </Pressable>
  );
}

type InfoItem = {
  label: string;
  value?: string | number | null;
  icon: keyof typeof Ionicons.glyphMap;
};

function InfoGrid({
  items,
}: {
  items: InfoItem[];
}) {
  const visibleItems = items.filter(
    (item) =>
      item.value !== null &&
      item.value !== undefined &&
      String(item.value).trim() !== ""
  );

  if (visibleItems.length === 0) {
    return (
      <Text style={styles.emptyText}>
        Not specified in available scheme
        data.
      </Text>
    );
  }

  return (
    <View style={styles.infoGrid}>
      {visibleItems.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          style={styles.infoItem}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name={item.icon}
              size={17}
              color="#0E766E"
            />
          </View>

          <View
            style={styles.infoItemContent}
          >
            <Text
              style={styles.infoLabel}
            >
              {item.label}
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatValue(item.value)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 14,
    color: "#667085",
    fontSize: 14,
  },

  errorPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FEF3F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorTitle: {
    color: "#101828",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  errorDescription: {
    color: "#667085",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  backButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#0E766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  topBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    marginBottom: 10,
  },

  topBackText: {
    color: "#475467",
    fontSize: 13,
    fontWeight: "700",
  },

  hero: {
    backgroundColor: "#123B52",
    borderRadius: 22,
    padding: 20,
    overflow: "hidden",
    borderBottomWidth: 4,
    borderBottomColor: "#F7B955",
    marginBottom: 12,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  schemeTypeBadge: {
    flexShrink: 1,
    backgroundColor: "#F7B955",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  schemeTypeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.35)",
  },

  verifiedBadgeText: {
    color: "#A7F3D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 15,
  },

  ministryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },

  ministryText: {
    flex: 1,
    color: "#D0D5DD",
    fontSize: 12,
    lineHeight: 18,
  },

  idContainer: {
    alignSelf: "flex-start",
    marginTop: 15,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  idLabel: {
    color: "#98A2B3",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  schemeId: {
    color: "#E4E7EC",
    fontSize: 11,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "ios"
        ? "Menlo"
        : undefined,
    marginTop: 2,
  },

  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },

  actionCard: {
    flex: 1,
    minHeight: 83,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAECF0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingVertical: 9,
  },

  actionIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  actionIconGreen: {
    backgroundColor: "#ECFDF3",
  },

  actionIconBlue: {
    backgroundColor: "#EEF2FF",
  },

  actionIconOrange: {
    backgroundColor: "#FFF7ED",
  },

  actionText: {
    color: "#344054",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  sectionHeader: {
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 15,
    marginTop: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 9,
  },

  sectionHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderTitle: {
    flex: 1,
    color: "#101828",
    fontSize: 14,
    fontWeight: "800",
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 15,
    marginTop: 7,
    padding: 15,
  },

  bodyText: {
    color: "#475467",
    fontSize: 13,
    lineHeight: 20,
  },

  infoGrid: {
    marginTop: 13,
    gap: 9,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 11,
    padding: 10,
  },

  infoIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },

  infoItemContent: {
    flex: 1,
  },

  infoLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 3,
  },

  infoValue: {
    color: "#101828",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  guidanceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF8FF",
    borderWidth: 1,
    borderColor: "#B2DDFF",
    borderRadius: 12,
    padding: 11,
    gap: 9,
    marginBottom: 11,
  },

  guidanceContent: {
    flex: 1,
  },

  guidanceTitle: {
    color: "#0C4A6E",
    fontSize: 12,
    fontWeight: "800",
  },

  guidanceText: {
    color: "#075985",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  ruleCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    padding: 11,
    marginTop: 8,
  },

  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  ruleField: {
    flex: 1,
    color: "#344054",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  ruleType: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  ruleTypeBlue: {
    backgroundColor: "#E0F2FE",
  },

  ruleTypeGreen: {
    backgroundColor: "#DCFCE7",
  },

  ruleTypeText: {
    color: "#344054",
    fontSize: 8,
    fontWeight: "900",
  },

  ruleValue: {
    color: "#101828",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    marginTop: 7,
  },

  ruleDescription: {
    color: "#667085",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  emptyText: {
    color: "#98A2B3",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },

  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

  documentIcon: {
    width: 33,
    height: 33,
    borderRadius: 9,
    backgroundColor: "#EFF8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  documentText: {
    flex: 1,
    color: "#344054",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  stepsContainer: {
    marginTop: 17,
  },

  subsectionTitle: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 11,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  stepText: {
    flex: 1,
    color: "#475467",
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 4,
  },

  sourceUrlButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF8FF",
    borderWidth: 1,
    borderColor: "#B2DDFF",
    borderRadius: 11,
    padding: 10,
  },

  sourceUrlText: {
    flex: 1,
    color: "#0369A1",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },

  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },

  aiIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
  },

  aiHeaderText: {
    flex: 1,
  },

  aiTitle: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "800",
  },

  aiSubtitle: {
    color: "#667085",
    fontSize: 10,
    marginTop: 2,
  },

  aiVerified: {
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  aiVerifiedText: {
    color: "#047857",
    fontSize: 7,
    fontWeight: "900",
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  chatInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 105,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    color: "#101828",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  answerCard: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 13,
    padding: 12,
  },

  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  answerTitle: {
    color: "#101828",
    fontSize: 12,
    fontWeight: "800",
  },

  answerText: {
    color: "#344054",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  citations: {
    borderTopWidth: 1,
    borderTopColor: "#E4E7EC",
    marginTop: 12,
    paddingTop: 10,
  },

  citationsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 7,
  },

  citationsTitle: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  citationCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 9,
    padding: 9,
    marginTop: 6,
  },

  citationLabel: {
    color: "#344054",
    fontSize: 9,
    fontWeight: "800",
  },

  citationText: {
    color: "#667085",
    fontSize: 10,
    lineHeight: 15,
    fontStyle: "italic",
    marginTop: 4,
  },

  bottomSpacer: {
    height: 78,
  },

  bottomActionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 68,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 9,
  },

  secondaryAction: {
    width: 82,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  secondaryActionText: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "800",
  },

  primaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});