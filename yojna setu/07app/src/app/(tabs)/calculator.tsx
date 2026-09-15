import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import { schemeApi } from '../../api/schemeApi';
import {
  financialApi,
  FinancialCalculationResult,
} from '../../api/financialApi';
import { colors } from '../../constants/theme';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TenureUnit = 'YEARS' | 'MONTHS';
type ScheduleViewMode = 'MONTHLY' | 'YEARLY';

interface Scheme {
  scheme_id: string;
  scheme_name: string;

  ministry?: string | null;

  interest_rate?: number | null;
  interest_rate_min?: number | null;

  max_loan_amount?: number | null;
  repayment_period_months?: number | null;

  is_credit_scheme?: boolean | null;
  financial_category?: string | null;
}

interface AmortizationEntry {
  installment_number: number;
  period_label: string;

  opening_principal: number;
  installment_amount: number;
  principal_component: number;
  interest_component: number;
  closing_principal: number;
}

interface YearlyEntry {
  year: number;
  opening_principal: number;
  principal_paid: number;
  interest_paid: number;
  total_installment: number;
  closing_principal: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) {
    return '₹0';
  }

  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

const parseNumber = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function CalculatorScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    scheme?: string;
  }>();

  const defaultSchemeParam =
    typeof params.scheme === 'string'
      ? params.scheme
      : '';

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [schemes, setSchemes] = useState<Scheme[]>([]);

  const [selectedSchemeId, setSelectedSchemeId] =
    useState<string>(defaultSchemeParam);

  const [loanAmount, setLoanAmount] =
    useState<number>(100000);

  const [annualInterestRate, setAnnualInterestRate] =
    useState<number>(7);

  const [tenureValue, setTenureValue] =
    useState<number>(3);

  const [tenureUnit, setTenureUnit] =
    useState<TenureUnit>('YEARS');

  const [projectCost, setProjectCost] =
    useState<number>(120000);

  const [showSchemePicker, setShowSchemePicker] =
    useState(false);

  const [showFullSchedule, setShowFullSchedule] =
    useState(false);

  const [scheduleViewMode, setScheduleViewMode] =
    useState<ScheduleViewMode>('MONTHLY');

  const [backendResult, setBackendResult] =
    useState<FinancialCalculationResult | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Load schemes                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const loadSchemes = async () => {
      try {
        const data = await schemeApi.getSchemes({
          page_size: 100,
        });

        if (!mounted) {
          return;
        }

        setSchemes(
          (data?.items || []) as Scheme[]
        );
      } catch (error) {
        console.error(
          'Failed to load schemes:',
          error
        );
      }
    };

    loadSchemes();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Selected Scheme                                                          */
  /* ------------------------------------------------------------------------ */

  const selectedScheme = useMemo(() => {
    return schemes.find(
      (scheme) =>
        scheme.scheme_id === selectedSchemeId
    );
  }, [schemes, selectedSchemeId]);

  /* ------------------------------------------------------------------------ */
  /* Scheme Autofill                                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedScheme) {
      return;
    }

    if (
      selectedScheme.interest_rate !==
        undefined &&
      selectedScheme.interest_rate !== null
    ) {
      setAnnualInterestRate(
        Number(selectedScheme.interest_rate)
      );
    } else if (
      selectedScheme.interest_rate_min !==
        undefined &&
      selectedScheme.interest_rate_min !== null
    ) {
      setAnnualInterestRate(
        Number(selectedScheme.interest_rate_min)
      );
    }

    if (
      selectedScheme.max_loan_amount &&
      Number(selectedScheme.max_loan_amount) > 0
    ) {
      const maxLoan = Number(
        selectedScheme.max_loan_amount
      );

      setLoanAmount((current) =>
        Math.min(current, maxLoan)
      );
    }

    if (
      selectedScheme.repayment_period_months &&
      Number(
        selectedScheme.repayment_period_months
      ) > 0
    ) {
      const months = Number(
        selectedScheme.repayment_period_months
      );

      if (tenureUnit === 'YEARS') {
        setTenureValue(
          Math.max(
            1,
            Math.round(months / 12)
          )
        );
      } else {
        setTenureValue(months);
      }
    }
  }, [selectedSchemeId, schemes]);

  /* ------------------------------------------------------------------------ */
  /* Total Months                                                             */
  /* ------------------------------------------------------------------------ */

  const totalMonths = useMemo(() => {
    const months =
      tenureUnit === 'YEARS'
        ? tenureValue * 12
        : tenureValue;

    return Math.max(
      1,
      Math.min(
        Math.round(months),
        360
      )
    );
  }, [tenureValue, tenureUnit]);

  /* ------------------------------------------------------------------------ */
  /* Client EMI Calculation                                                   */
  /* ------------------------------------------------------------------------ */

  const calculatedData = useMemo(() => {
    const principal = Math.max(
      0,
      Number(loanAmount) || 0
    );

    const annualRate = Math.max(
      0,
      Number(annualInterestRate) || 0
    );

    const months = totalMonths;

    if (
      principal <= 0 ||
      months <= 0
    ) {
      return {
        emi: 0,
        totalInterest: 0,
        totalRepayment: 0,
        principalPercent: 100,
        interestPercent: 0,
        schedule: [] as AmortizationEntry[],
        yearlySchedule: [] as YearlyEntry[],
      };
    }

    let emi = 0;
    let totalInterest = 0;

    const schedule: AmortizationEntry[] = [];

    /* ---------------------------------------------------------------------- */
    /* 0% Interest                                                            */
    /* ---------------------------------------------------------------------- */

    if (annualRate === 0) {
      emi =
        Math.round(
          (principal / months) * 100
        ) / 100;

      let balance = principal;

      for (
        let month = 1;
        month <= months;
        month++
      ) {
        const principalComponent =
          month === months
            ? balance
            : Math.min(
                balance,
                emi
              );

        const closingBalance =
          Math.max(
            0,
            Math.round(
              (
                balance -
                principalComponent
              ) * 100
            ) / 100
          );

        schedule.push({
          installment_number: month,
          period_label: `Month ${month}`,
          opening_principal:
            Math.round(
              balance * 100
            ) / 100,
          installment_amount:
            Math.round(
              principalComponent *
                100
            ) / 100,
          principal_component:
            Math.round(
              principalComponent *
                100
            ) / 100,
          interest_component: 0,
          closing_principal:
            closingBalance,
        });

        balance = closingBalance;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Reducing Balance                                                       */
    /* ---------------------------------------------------------------------- */

    else {
      const monthlyRate =
        annualRate /
        (12 * 100);

      const power = Math.pow(
        1 + monthlyRate,
        months
      );

      emi =
        Math.round(
          (
            (principal *
              monthlyRate *
              power) /
            (power - 1)
          ) * 100
        ) / 100;

      let balance = principal;

      for (
        let month = 1;
        month <= months;
        month++
      ) {
        const opening = balance;

        const interest =
          Math.round(
            opening *
              monthlyRate *
              100
          ) / 100;

        let principalComponent: number;
        let installmentAmount: number;

        if (month === months) {
          principalComponent = opening;

          installmentAmount =
            Math.round(
              (
                principalComponent +
                interest
              ) * 100
            ) / 100;

          balance = 0;
        } else {
          principalComponent =
            Math.round(
              (
                emi -
                interest
              ) * 100
            ) / 100;

          installmentAmount = emi;

          balance =
            Math.max(
              0,
              Math.round(
                (
                  opening -
                  principalComponent
                ) * 100
              ) / 100
            );
        }

        totalInterest += interest;

        schedule.push({
          installment_number: month,
          period_label: `Month ${month}`,
          opening_principal:
            opening,
          installment_amount:
            installmentAmount,
          principal_component:
            principalComponent,
          interest_component:
            interest,
          closing_principal:
            balance,
        });
      }

      totalInterest =
        Math.round(
          totalInterest * 100
        ) / 100;
    }

    const totalRepayment =
      Math.round(
        (
          principal +
          totalInterest
        ) * 100
      ) / 100;

    const principalPercent =
      totalRepayment > 0
        ? Math.round(
            (
              principal /
              totalRepayment
            ) * 1000
          ) / 10
        : 100;

    const interestPercent =
      totalRepayment > 0
        ? Math.round(
            (
              totalInterest /
              totalRepayment
            ) * 1000
          ) / 10
        : 0;

    /* ---------------------------------------------------------------------- */
    /* Yearly Schedule                                                        */
    /* ---------------------------------------------------------------------- */

    const yearlySchedule: YearlyEntry[] = [];

    let year = 1;
    let yearPrincipal = 0;
    let yearInterest = 0;
    let yearOpening = principal;

    schedule.forEach(
      (entry, index) => {
        yearPrincipal +=
          entry.principal_component;

        yearInterest +=
          entry.interest_component;

        const isYearEnd =
          (index + 1) % 12 === 0 ||
          index ===
            schedule.length - 1;

        if (isYearEnd) {
          yearlySchedule.push({
            year,
            opening_principal:
              yearOpening,
            principal_paid:
              Math.round(
                yearPrincipal *
                  100
              ) / 100,
            interest_paid:
              Math.round(
                yearInterest *
                  100
              ) / 100,
            total_installment:
              Math.round(
                (
                  yearPrincipal +
                  yearInterest
                ) * 100
              ) / 100,
            closing_principal:
              entry.closing_principal,
          });

          year++;

          yearPrincipal = 0;
          yearInterest = 0;

          yearOpening =
            entry.closing_principal;
        }
      }
    );

    return {
      emi,
      totalInterest,
      totalRepayment,
      principalPercent,
      interestPercent,
      schedule,
      yearlySchedule,
    };
  }, [
    loanAmount,
    annualInterestRate,
    totalMonths,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Backend Calculator                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedSchemeId) {
      setBackendResult(null);
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setIsLoading(true);

          const result =
            await financialApi.calculate({
              scheme_id:
                selectedSchemeId,

              requested_loan_amount:
                loanAmount,

              project_cost:
                projectCost ||
                loanAmount * 1.15,

              repayment_period_months:
                totalMonths,

              interest_rate:
                annualInterestRate,

              repayment_frequency:
                'MONTHLY',
            });

          setBackendResult(result);
        } catch (error) {
          console.error(
            'Financial calculation API failed:',
            error
          );

          /*
           * Backend result is optional.
           * Local EMI calculation continues
           * to work even if API fails.
           */
          setBackendResult(null);
        } finally {
          setIsLoading(false);
        }
      },
      400
    );

    return () =>
      clearTimeout(timer);
  }, [
    selectedSchemeId,
    loanAmount,
    projectCost,
    totalMonths,
    annualInterestRate,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleLoanChange = (
    value: number
  ) => {
    const clean = Number.isFinite(value)
      ? Math.max(0, value)
      : 0;

    setLoanAmount(clean);

    if (projectCost < clean) {
      setProjectCost(
        Math.round(
          clean * 1.15
        )
      );
    }

    if (clean <= 0) {
      setValidationError(
        'Please enter a positive loan amount.'
      );
    } else {
      setValidationError(null);
    }
  };

  const handleRateChange = (
    value: number
  ) => {
    const clean = Number.isFinite(value)
      ? Math.max(
          0,
          Math.min(value, 50)
        )
      : 0;

    setAnnualInterestRate(clean);
  };

  const handleTenureChange = (
    value: number
  ) => {
    const clean = Number.isFinite(value)
      ? Math.max(1, value)
      : 1;

    setTenureValue(clean);
  };

  const handleReset = () => {
    setSelectedSchemeId(
      defaultSchemeParam || ''
    );

    setLoanAmount(100000);
    setAnnualInterestRate(7);
    setTenureValue(3);
    setTenureUnit('YEARS');
    setProjectCost(120000);

    setShowFullSchedule(false);
    setScheduleViewMode('MONTHLY');
    setValidationError(null);
    setBackendResult(null);
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                        */
  /* ------------------------------------------------------------------------ */

  return (
    <Screen>
      <AppHeader
        title="Financial Calculator"
        subtitle="Loan EMI & subsidy calculator"
        rightContent={
          <Ionicons
            name="calculator-outline"
            size={23}
            color={colors.sky}
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.container
        }
      >
        {/* ================================================================ */}
        {/* HERO                                                             */}
        {/* ================================================================ */}

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons
              name="calculator"
              size={14}
              color="#7DD3FC"
            />

            <Text style={styles.heroBadgeText}>
              FINANCIAL CALCULATOR
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Loan EMI, Interest & Subsidy
          </Text>

          <Text style={styles.heroSubtitle}>
            Compute mathematically accurate
            reducing-balance EMI, total
            interest and repayment amount
            for government loan schemes.
          </Text>
        </View>

        {/* ================================================================ */}
        {/* WARNING                                                          */}
        {/* ================================================================ */}

        {validationError && (
          <View style={styles.warningBox}>
            <Ionicons
              name="warning-outline"
              size={19}
              color="#B45309"
            />

            <Text style={styles.warningText}>
              {validationError}
            </Text>
          </View>
        )}

        {/* ================================================================ */}
        {/* FINANCING PARAMETERS                                             */}
        {/* ================================================================ */}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="cash-outline"
                size={19}
                color={colors.sky}
              />

              <Text style={styles.sectionTitle}>
                FINANCING PARAMETERS
              </Text>
            </View>

            <Pressable
              onPress={handleReset}
              style={styles.resetButton}
            >
              <Ionicons
                name="refresh"
                size={15}
                color="#64748B"
              />

              <Text style={styles.resetText}>
                Reset
              </Text>
            </Pressable>
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Scheme                                                           */}
          {/* -------------------------------------------------------------- */}

          <Text style={styles.label}>
            TARGET GOVERNMENT SCHEME
          </Text>

          <Pressable
            onPress={() =>
              setShowSchemePicker(
                !showSchemePicker
              )
            }
            style={styles.selectBox}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.selectText,
                !selectedScheme &&
                  styles.placeholderText,
              ]}
            >
              {selectedScheme
                ? selectedScheme.scheme_name
                : 'Standard General Loan (Custom Parameters)'}
            </Text>

            <Ionicons
              name={
                showSchemePicker
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={19}
              color="#64748B"
            />
          </Pressable>

          {showSchemePicker && (
            <View style={styles.schemeList}>
              <Pressable
                onPress={() => {
                  setSelectedSchemeId('');
                  setShowSchemePicker(false);
                }}
                style={styles.schemeOption}
              >
                <Text
                  style={[
                    styles.schemeOptionText,
                    !selectedSchemeId &&
                      styles.selectedOptionText,
                  ]}
                >
                  Standard General Loan
                </Text>

                {!selectedSchemeId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color={colors.sky}
                  />
                )}
              </Pressable>

              {schemes.map(
                (scheme) => {
                  const active =
                    scheme.scheme_id ===
                    selectedSchemeId;

                  return (
                    <Pressable
                      key={
                        scheme.scheme_id
                      }
                      onPress={() => {
                        setSelectedSchemeId(
                          scheme.scheme_id
                        );

                        setShowSchemePicker(
                          false
                        );
                      }}
                      style={[
                        styles.schemeOption,
                        active &&
                          styles.activeSchemeOption,
                      ]}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.schemeOptionText,
                          active &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {scheme.scheme_name}
                      </Text>

                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={19}
                          color={colors.sky}
                        />
                      )}
                    </Pressable>
                  );
                }
              )}
            </View>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Scheme Info                                                      */}
          {/* -------------------------------------------------------------- */}

          {selectedScheme && (
            <View
              style={[
                styles.schemeInfo,
                selectedScheme.is_credit_scheme ===
                false
                  ? styles.nonCreditInfo
                  : styles.creditInfo,
              ]}
            >
              <Ionicons
                name={
                  selectedScheme.is_credit_scheme ===
                  false
                    ? 'information-circle-outline'
                    : 'ribbon-outline'
                }
                size={20}
                color={
                  selectedScheme.is_credit_scheme ===
                  false
                    ? '#D97706'
                    : colors.sky
                }
              />

              <View
                style={
                  styles.schemeInfoContent
                }
              >
                <Text
                  style={
                    styles.schemeName
                  }
                >
                  {
                    selectedScheme.scheme_name
                  }
                </Text>

                <View
                  style={
                    styles.categoryBadge
                  }
                >
                  <Text
                    style={
                      styles.categoryText
                    }
                  >
                    {(
                      selectedScheme.financial_category ||
                      (selectedScheme.is_credit_scheme
                        ? 'LOAN_CREDIT'
                        : 'GRANT_SUBSIDY')
                    ).replace(
                      /_/g,
                      ' '
                    )}
                  </Text>
                </View>

                {selectedScheme.is_credit_scheme ===
                false ? (
                  <Text
                    style={
                      styles.nonCreditText
                    }
                  >
                    Loan / EMI calculation
                    may not apply to this
                    scheme. Assistance may
                    be provided as subsidy,
                    grant or welfare benefit.
                  </Text>
                ) : (
                  <>
                    <Text
                      style={
                        styles.schemeMeta
                      }
                    >
                      {selectedScheme.ministry ||
                        'Government of India'}
                    </Text>

                    <Text
                      style={
                        styles.schemeMeta
                      }
                    >
                      {selectedScheme.max_loan_amount
                        ? `Max Limit: ${formatCurrency(
                            Number(
                              selectedScheme.max_loan_amount
                            )
                          )}`
                        : 'Maximum amount: As per appraisal'}
                    </Text>

                    <Text
                      style={
                        styles.schemeMeta
                      }
                    >
                      {selectedScheme.interest_rate !==
                      undefined &&
                      selectedScheme.interest_rate !==
                        null
                        ? `Official Scheme Rate: ${selectedScheme.interest_rate}% p.a.`
                        : 'Interest rate: As determined by financing institution'}
                    </Text>
                  </>
                )}

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname:
                        '/schemes/[id]',
                      params: {
                        id:
                          selectedScheme.scheme_id,
                      },
                    })
                  }
                  style={
                    styles.viewSchemeButton
                  }
                >
                  <Text
                    style={
                      styles.viewSchemeText
                    }
                  >
                    View Scheme Details
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.sky}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Loan Amount                                                      */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>
                LOAN AMOUNT (PRINCIPAL)
              </Text>

              <Text
                style={styles.valueBadge}
              >
                {formatCurrency(
                  loanAmount
                )}
              </Text>
            </View>

            <View
              style={
                styles.inputWithPrefix
              }
            >
              <Text
                style={styles.prefix}
              >
                ₹
              </Text>

              <TextInput
                value={
                  loanAmount
                    ? String(
                        loanAmount
                      )
                    : ''
                }
                onChangeText={(text) =>
                  handleLoanChange(
                    parseNumber(
                      text
                    )
                  )
                }
                keyboardType="numeric"
                placeholder="Enter loan amount"
                placeholderTextColor="#94A3B8"
                style={
                  styles.numberInput
                }
              />
            </View>

            <View
              style={styles.stepper}
            >
              <Pressable
                onPress={() =>
                  handleLoanChange(
                    Math.max(
                      10000,
                      loanAmount -
                        10000
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>

              <Text
                style={
                  styles.stepperValue
                }
              >
                {formatCurrency(
                  loanAmount
                )}
              </Text>

              <Pressable
                onPress={() =>
                  handleLoanChange(
                    Math.min(
                      5000000,
                      loanAmount +
                        10000
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>
            </View>

            <View style={styles.chips}>
              {[
                50000,
                100000,
                500000,
                1000000,
                2500000,
              ].map(
                (amount) => {
                  const active =
                    loanAmount ===
                    amount;

                  return (
                    <Pressable
                      key={amount}
                      onPress={() =>
                        handleLoanChange(
                          amount
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.blueChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.activeChipText,
                        ]}
                      >
                        {formatCurrency(
                          amount
                        )}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Interest Rate                                                    */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>
                ANNUAL INTEREST RATE
              </Text>

              <Text
                style={styles.rateBadge}
              >
                {annualInterestRate}% p.a.
              </Text>
            </View>

            <View
              style={
                styles.inputWithSuffix
              }
            >
              <TextInput
                value={String(
                  annualInterestRate
                )}
                onChangeText={(text) =>
                  handleRateChange(
                    parseNumber(
                      text
                    )
                  )
                }
                keyboardType="decimal-pad"
                placeholder="e.g. 7.0"
                placeholderTextColor="#94A3B8"
                style={
                  styles.numberInput
                }
              />

              <Text
                style={styles.suffix}
              >
                %
              </Text>
            </View>

            <View
              style={styles.stepper}
            >
              <Pressable
                onPress={() =>
                  handleRateChange(
                    Math.max(
                      0,
                      annualInterestRate -
                        0.25
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>

              <Text
                style={[
                  styles.stepperValue,
                  {
                    color: '#B45309',
                  },
                ]}
              >
                {annualInterestRate}%
              </Text>

              <Pressable
                onPress={() =>
                  handleRateChange(
                    Math.min(
                      24,
                      annualInterestRate +
                        0.25
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>
            </View>

            <View style={styles.chips}>
              {[
                {
                  label:
                    '0% Interest-Free',
                  rate: 0,
                },
                {
                  label:
                    '4% Concessional',
                  rate: 4,
                },
                {
                  label:
                    '7% MUDRA/PMEGP',
                  rate: 7,
                },
                {
                  label:
                    '9.5% Bank Base',
                  rate: 9.5,
                },
                {
                  label:
                    '12% Commercial',
                  rate: 12,
                },
              ].map((item) => {
                const active =
                  annualInterestRate ===
                  item.rate;

                return (
                  <Pressable
                    key={item.rate}
                    onPress={() =>
                      handleRateChange(
                        item.rate
                      )
                    }
                    style={[
                      styles.chip,
                      active &&
                        styles.amberChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active &&
                          styles.activeChipText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Tenure                                                           */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>
                LOAN TENURE
              </Text>

              <View style={styles.toggle}>
                <Pressable
                  onPress={() => {
                    if (
                      tenureUnit ===
                      'MONTHS'
                    ) {
                      setTenureValue(
                        Math.max(
                          1,
                          Math.round(
                            tenureValue /
                              12
                          )
                        )
                      );

                      setTenureUnit(
                        'YEARS'
                      );
                    }
                  }}
                  style={[
                    styles.toggleItem,
                    tenureUnit ===
                      'YEARS' &&
                      styles.activeToggle,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      tenureUnit ===
                        'YEARS' &&
                        styles.activeToggleText,
                    ]}
                  >
                    Years
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (
                      tenureUnit ===
                      'YEARS'
                    ) {
                      setTenureValue(
                        tenureValue *
                          12
                      );

                      setTenureUnit(
                        'MONTHS'
                      );
                    }
                  }}
                  style={[
                    styles.toggleItem,
                    tenureUnit ===
                      'MONTHS' &&
                      styles.activeToggle,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      tenureUnit ===
                        'MONTHS' &&
                        styles.activeToggleText,
                    ]}
                  >
                    Months
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={styles.tenureRow}
            >
              <TextInput
                value={String(
                  tenureValue
                )}
                onChangeText={(text) =>
                  handleTenureChange(
                    parseNumber(
                      text
                    )
                  )
                }
                keyboardType="numeric"
                style={
                  styles.tenureInput
                }
              />

              <View
                style={
                  styles.tenureEquivalent
                }
              >
                <Text
                  style={
                    styles.tenureEquivalentText
                  }
                >
                  {tenureUnit ===
                  'YEARS'
                    ? `${tenureValue * 12} Months`
                    : `${(
                        tenureValue /
                        12
                      ).toFixed(
                        1
                      )} Years`}
                </Text>
              </View>
            </View>

            <View
              style={styles.stepper}
            >
              <Pressable
                onPress={() =>
                  handleTenureChange(
                    Math.max(
                      1,
                      tenureValue -
                        1
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>

              <Text
                style={[
                  styles.stepperValue,
                  {
                    color: '#4F46E5',
                  },
                ]}
              >
                {tenureValue}{' '}
                {tenureUnit ===
                'YEARS'
                  ? 'Years'
                  : 'Months'}
              </Text>

              <Pressable
                onPress={() =>
                  handleTenureChange(
                    Math.min(
                      tenureUnit ===
                        'YEARS'
                        ? 30
                        : 360,
                      tenureValue +
                        1
                    )
                  )
                }
                style={
                  styles.stepperButton
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#0F172A"
                />
              </Pressable>
            </View>

            <View style={styles.chips}>
              {[1, 3, 5, 7, 10].map(
                (year) => {
                  const value =
                    tenureUnit ===
                    'YEARS'
                      ? year
                      : year * 12;

                  const active =
                    tenureValue ===
                    value;

                  return (
                    <Pressable
                      key={year}
                      onPress={() =>
                        handleTenureChange(
                          value
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.indigoChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.activeChipText,
                        ]}
                      >
                        {year}{' '}
                        {year === 1
                          ? 'Year'
                          : 'Years'}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
        </View>

        {/* ================================================================ */}
        {/* FORMULA                                                          */}
        {/* ================================================================ */}

        <View style={styles.formulaCard}>
          <View
            style={
              styles.formulaTitleRow
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#059669"
            />

            <Text
              style={styles.formulaTitle}
            >
              STANDARD REDUCING BALANCE EMI
              FORMULA
            </Text>
          </View>

          <Text style={styles.formula}>
            EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)
          </Text>

          <Text
            style={
              styles.formulaDescription
            }
          >
            P = Principal, r = Monthly Rate
            (Annual% / 1200), n = Total
            Months.
          </Text>
        </View>

        {/* ================================================================ */}
        {/* RESULTS HEADER                                                   */}
        {/* ================================================================ */}

        <View
          style={styles.resultsHeader}
        >
          <Text
            style={styles.resultsTitle}
          >
            CALCULATION RESULTS
          </Text>

          {isLoading && (
            <ActivityIndicator
              size="small"
              color={colors.sky}
            />
          )}
        </View>

        {/* ================================================================ */}
        {/* KPI 1                                                            */}
        {/* ================================================================ */}

        <View style={styles.kpiCard}>
          <View style={styles.kpiTopRow}>
            <Text style={styles.kpiLabel}>
              MONTHLY EMI
            </Text>

            <View
              style={styles.kpiDot}
            />
          </View>

          <Text style={styles.kpiValue}>
            {formatCurrency(
              calculatedData.emi
            )}
          </Text>

          <Text
            style={
              styles.kpiDescription
            }
          >
            Payable monthly for{' '}
            {totalMonths} installments
          </Text>
        </View>

        {/* ================================================================ */}
        {/* KPI 2                                                            */}
        {/* ================================================================ */}

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>
            TOTAL INTEREST
          </Text>

          <Text
            style={[
              styles.kpiValue,
              {
                color: '#D97706',
              },
            ]}
          >
            {formatCurrency(
              calculatedData.totalInterest
            )}
          </Text>

          <Text
            style={
              styles.kpiDescription
            }
          >
            {
              calculatedData.interestPercent
            }
            % of total payment
          </Text>
        </View>

        {/* ================================================================ */}
        {/* KPI 3                                                            */}
        {/* ================================================================ */}

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>
            TOTAL REPAYMENT
          </Text>

          <Text
            style={[
              styles.kpiValue,
              {
                color: '#0F172A',
              },
            ]}
          >
            {formatCurrency(
              calculatedData.totalRepayment
            )}
          </Text>

          <Text
            style={
              styles.kpiDescription
            }
          >
            Principal + Total Interest
          </Text>
        </View>

        {/* ================================================================ */}
        {/* BREAKDOWN                                                        */}
        {/* ================================================================ */}

        <View style={styles.card}>
          <View
            style={
              styles.breakdownHeader
            }
          >
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Ionicons
                name="pie-chart-outline"
                size={19}
                color={colors.sky}
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                PRINCIPAL VS INTEREST
              </Text>
            </View>

            <Text
              style={
                styles.breakdownTotal
              }
            >
              Total:{' '}
              {formatCurrency(
                calculatedData.totalRepayment
              )}
            </Text>
          </View>

          <View
            style={
              styles.breakdownBar
            }
          >
            <View
              style={[
                styles.principalBar,
                {
                  width: `${calculatedData.principalPercent}%`,
                },
              ]}
            />

            <View
              style={[
                styles.interestBar,
                {
                  width: `${calculatedData.interestPercent}%`,
                },
              ]}
            />
          </View>

          <View
            style={styles.legendList}
          >
            <View
              style={styles.legendBox}
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.sky,
                  },
                ]}
              />

              <View
                style={styles.legendContent}
              >
                <Text
                  style={
                    styles.legendLabel
                  }
                >
                  PRINCIPAL AMOUNT
                </Text>

                <Text
                  style={
                    styles.legendValue
                  }
                >
                  {formatCurrency(
                    loanAmount
                  )}{' '}
                  (
                  {
                    calculatedData.principalPercent
                  }
                  %)
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.legendBox,
                {
                  backgroundColor:
                    '#FFFBEB',
                  borderColor:
                    '#FDE68A',
                },
              ]}
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      '#F59E0B',
                  },
                ]}
              />

              <View
                style={styles.legendContent}
              >
                <Text
                  style={
                    styles.legendLabel
                  }
                >
                  TOTAL INTEREST
                </Text>

                <Text
                  style={[
                    styles.legendValue,
                    {
                      color: '#B45309',
                    },
                  ]}
                >
                  {formatCurrency(
                    calculatedData.totalInterest
                  )}{' '}
                  (
                  {
                    calculatedData.interestPercent
                  }
                  %)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================ */}
        {/* SUBSIDY                                                         */}
        {/* ================================================================ */}

        {backendResult &&
          (backendResult.subsidy_amount ||
            backendResult.beneficiary_contribution_amount) && (
            <View
              style={
                styles.subsidyCard
              }
            >
              <View
                style={
                  styles.subsidyHeader
                }
              >
                <View
                  style={
                    styles.subsidyBadge
                  }
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color="#6EE7B7"
                  />

                  <Text
                    style={
                      styles.subsidyBadgeText
                    }
                  >
                    OFFICIAL SCHEME BENEFITS
                  </Text>
                </View>

                {selectedScheme && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname:
                          '/schemes/[id]',
                        params: {
                          id:
                            selectedScheme.scheme_id,
                        },
                      })
                    }
                  >
                    <Text
                      style={
                        styles.rulesText
                      }
                    >
                      View Rules →
                    </Text>
                  </Pressable>
                )}
              </View>

              {backendResult.subsidy_amount !==
                undefined &&
                backendResult.subsidy_amount !==
                  null && (
                  <View
                    style={
                      styles.subsidyItem
                    }
                  >
                    <Text
                      style={
                        styles.subsidyLabel
                      }
                    >
                      ESTIMATED GOVT SUBSIDY
                    </Text>

                    <Text
                      style={
                        styles.subsidyValue
                      }
                    >
                      {formatCurrency(
                        Number(
                          backendResult.subsidy_amount
                        )
                      )}
                    </Text>
                  </View>
                )}

              {backendResult.beneficiary_contribution_amount !==
                undefined &&
                backendResult.beneficiary_contribution_amount !==
                  null && (
                  <View
                    style={
                      styles.subsidyItem
                    }
                  >
                    <Text
                      style={
                        styles.subsidyLabel
                      }
                    >
                      APPLICANT CONTRIBUTION
                    </Text>

                    <Text
                      style={[
                        styles.subsidyValue,
                        {
                          color:
                            '#C4B5FD',
                        },
                      ]}
                    >
                      {formatCurrency(
                        Number(
                          backendResult.beneficiary_contribution_amount
                        )
                      )}
                    </Text>
                  </View>
                )}
            </View>
          )}

        {/* ================================================================ */}
        {/* AMORTIZATION                                                     */}
        {/* ================================================================ */}

        <View
          style={
            styles.scheduleCard
          }
        >
          <View
            style={
              styles.scheduleHeader
            }
          >
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Ionicons
                name="grid-outline"
                size={19}
                color={colors.sky}
              />

              <Text
                style={
                  styles.scheduleTitle
                }
              >
                LOAN AMORTIZATION
              </Text>
            </View>

            <Text
              style={
                styles.scheduleSubtitle
              }
            >
              Complete breakdown of principal
              reduction and interest deduction
              over tenure.
            </Text>
          </View>

          {/* Schedule Toggle */}

          <View
            style={
              styles.scheduleToggle
            }
          >
            <Pressable
              onPress={() =>
                setScheduleViewMode(
                  'MONTHLY'
                )
              }
              style={[
                styles.scheduleToggleItem,
                scheduleViewMode ===
                  'MONTHLY' &&
                  styles.activeScheduleToggle,
              ]}
            >
              <Text
                style={[
                  styles.scheduleToggleText,
                  scheduleViewMode ===
                    'MONTHLY' &&
                    styles.activeScheduleToggleText,
                ]}
              >
                Monthly View
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setScheduleViewMode(
                  'YEARLY'
                )
              }
              style={[
                styles.scheduleToggleItem,
                scheduleViewMode ===
                  'YEARLY' &&
                  styles.activeScheduleToggle,
              ]}
            >
              <Text
                style={[
                  styles.scheduleToggleText,
                  scheduleViewMode ===
                    'YEARLY' &&
                    styles.activeScheduleToggleText,
                ]}
              >
                Yearly Summary
              </Text>
            </Pressable>
          </View>

          {/* Monthly */}

          {scheduleViewMode ===
          'MONTHLY' ? (
            <>
              {(showFullSchedule
                ? calculatedData.schedule
                : calculatedData.schedule.slice(
                    0,
                    12
                  )
              ).map((row) => (
                <View
                  key={
                    row.installment_number
                  }
                  style={
                    styles.monthRow
                  }
                >
                  <View
                    style={
                      styles.monthHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.monthNumber
                        }
                      >
                        Month{' '}
                        {
                          row.installment_number
                        }
                      </Text>

                      <Text
                        style={
                          styles.openingText
                        }
                      >
                        Opening:{' '}
                        {formatCurrency(
                          row.opening_principal
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.emiAmount
                      }
                    >
                      {formatCurrency(
                        row.installment_amount
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <View
                      style={
                        styles.detailItem
                      }
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        Principal
                      </Text>

                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              colors.sky,
                          },
                        ]}
                      >
                        {formatCurrency(
                          row.principal_component
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.detailItem
                      }
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        Interest
                      </Text>

                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              '#D97706',
                          },
                        ]}
                      >
                        {formatCurrency(
                          row.interest_component
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailItem,
                        {
                          alignItems:
                            'flex-end',
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.detailLabel
                        }
                      >
                        Closing
                      </Text>

                      <Text
                        style={
                          styles.detailValue
                        }
                      >
                        {formatCurrency(
                          row.closing_principal
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              {calculatedData.yearlySchedule.map(
                (year) => (
                  <View
                    key={year.year}
                    style={
                      styles.monthRow
                    }
                  >
                    <View
                      style={
                        styles.monthHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.monthNumber
                          }
                        >
                          Year {year.year}
                        </Text>

                        <Text
                          style={
                            styles.openingText
                          }
                        >
                          Opening:{' '}
                          {formatCurrency(
                            year.opening_principal
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.emiAmount
                        }
                      >
                        {formatCurrency(
                          year.total_installment
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.detailRow
                      }
                    >
                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          Principal
                        </Text>

                        <Text
                          style={[
                            styles.detailValue,
                            {
                              color:
                                colors.sky,
                            },
                          ]}
                        >
                          {formatCurrency(
                            year.principal_paid
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          Interest
                        </Text>

                        <Text
                          style={[
                            styles.detailValue,
                            {
                              color:
                                '#D97706',
                            },
                          ]}
                        >
                          {formatCurrency(
                            year.interest_paid
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.detailItem,
                          {
                            alignItems:
                              'flex-end',
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          Closing
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {formatCurrency(
                            year.closing_principal
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              )}
            </>
          )}

          {/* Full Schedule */}

          {scheduleViewMode ===
            'MONTHLY' &&
            calculatedData.schedule.length >
              12 && (
              <Pressable
                onPress={() =>
                  setShowFullSchedule(
                    !showFullSchedule
                  )
                }
                style={
                  styles.fullScheduleButton
                }
              >
                <Text
                  style={
                    styles.fullScheduleText
                  }
                >
                  {showFullSchedule
                    ? 'Show First 12 Months Only'
                    : `Show Full ${totalMonths}-Month Schedule`}
                </Text>

                <Ionicons
                  name={
                    showFullSchedule
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={17}
                  color={colors.sky}
                />
              </Pressable>
            )}
        </View>

        {/* ================================================================ */}
        {/* DISCLAIMER                                                       */}
        {/* ================================================================ */}

        <View
          style={styles.disclaimer}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#64748B"
          />

          <Text
            style={
              styles.disclaimerText
            }
          >
            This calculator provides an
            estimated mathematical calculation.
            Actual EMI, interest, subsidy and
            repayment terms may vary according
            to the financing institution and
            official scheme guidelines.
          </Text>
        </View>

        <View
          style={{ height: 25 }}
        />
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Hero */

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 21,
    marginBottom: 16,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor:
      'rgba(14,165,233,0.16)',
    borderWidth: 1,
    borderColor:
      'rgba(56,189,248,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  heroBadgeText: {
    color: '#7DD3FC',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 31,
    marginBottom: 8,
  },

  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 18,
  },

  /* Warning */

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 13,
    borderRadius: 14,
    marginBottom: 15,
  },

  warningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Card */

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 17,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 13,
    marginBottom: 17,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 5,
  },

  resetText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Labels */

  label: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  /* Scheme */

  selectBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  selectText: {
    flex: 1,
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    paddingRight: 10,
  },

  placeholderText: {
    color: '#64748B',
  },

  schemeList: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    marginTop: 6,
    overflow: 'hidden',
  },

  schemeOption: {
    minHeight: 47,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  activeSchemeOption: {
    backgroundColor: '#F0F9FF',
  },

  schemeOptionText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    paddingRight: 10,
  },

  selectedOptionText: {
    color: '#0369A1',
    fontWeight: '800',
  },

  schemeInfo: {
    flexDirection: 'row',
    gap: 9,
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
  },

  creditInfo: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },

  nonCreditInfo: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },

  schemeInfoContent: {
    flex: 1,
  },

  schemeName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
    marginBottom: 5,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
  },

  categoryText: {
    color: '#075985',
    fontSize: 7,
    fontWeight: '900',
  },

  schemeMeta: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 15,
  },

  nonCreditText: {
    color: '#92400E',
    fontSize: 9,
    lineHeight: 15,
  },

  viewSchemeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },

  viewSchemeText: {
    color: '#0369A1',
    fontSize: 9,
    fontWeight: '900',
  },

  /* Inputs */

  inputSection: {
    marginTop: 20,
  },

  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  valueBadge: {
    color: '#0C4A6E',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '900',
  },

  rateBadge: {
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '900',
  },

  inputWithPrefix: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  prefix: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
    paddingLeft: 13,
  },

  inputWithSuffix: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  numberInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 9,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  suffix: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
    paddingRight: 13,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: 9,
  },

  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperValue: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '900',
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  chipText: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },

  blueChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },

  amberChip: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },

  indigoChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },

  activeChipText: {
    color: '#FFFFFF',
  },

  /* Tenure */

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  toggleItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  activeToggle: {
    backgroundColor: '#FFFFFF',
  },

  toggleText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
  },

  activeToggleText: {
    color: '#0F172A',
  },

  tenureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  tenureInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  tenureEquivalent: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingHorizontal: 12,
  },

  tenureEquivalentText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Formula */

  formulaCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
  },

  formulaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },

  formulaTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  formula: {
    color: '#475569',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 5,
  },

  formulaDescription: {
    color: '#64748B',
    fontSize: 8,
    lineHeight: 13,
  },

  /* Results */

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 10,
  },

  resultsTitle: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  /* KPI */

  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
  },

  kpiTopRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  kpiLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  kpiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D7832D',
  },

  kpiValue: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 6,
  },

  kpiDescription: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
  },

  /* Breakdown */

  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 14,
  },

  breakdownTotal: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },

  breakdownBar: {
    height: 15,
    borderRadius: 99,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
  },

  principalBar: {
    height: 15,
    backgroundColor: '#0284C7',
  },

  interestBar: {
    height: 15,
    backgroundColor: '#F59E0B',
  },

  legendList: {
    gap: 8,
    marginTop: 12,
  },

  legendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 11,
  },

  legendDot: {
    width: 13,
    height: 13,
    borderRadius: 4,
  },

  legendContent: {
    flex: 1,
  },

  legendLabel: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  legendValue: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },

  /* Subsidy */

  subsidyCard: {
    backgroundColor: '#052E2B',
    borderWidth: 1,
    borderColor: '#065F46',
    borderRadius: 22,
    padding: 17,
    marginBottom: 16,
  },

  subsidyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 8,
    marginBottom: 12,
  },

  subsidyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor:
      'rgba(52,211,153,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 1,
  },

  subsidyBadgeText: {
    color: '#6EE7B7',
    fontSize: 7,
    fontWeight: '900',
  },

  rulesText: {
    color: '#7DD3FC',
    fontSize: 8,
    fontWeight: '800',
  },

  subsidyItem: {
    backgroundColor:
      'rgba(15,23,42,0.65)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 13,
    padding: 12,
    marginTop: 7,
  },

  subsidyLabel: {
    color: '#94A3B8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  subsidyValue: {
    color: '#34D399',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },

  /* Schedule */

  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },

  scheduleHeader: {
    padding: 17,
    paddingBottom: 8,
  },

  scheduleTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },

  scheduleSubtitle: {
    color: '#64748B',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 5,
  },

  scheduleToggle: {
    flexDirection: 'row',
    marginHorizontal: 17,
    marginBottom: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
    borderRadius: 11,
  },

  scheduleToggleItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },

  activeScheduleToggle: {
    backgroundColor: '#FFFFFF',
  },

  scheduleToggleText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
  },

  activeScheduleToggleText: {
    color: '#0F172A',
  },

  monthRow: {
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  monthNumber: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },

  openingText: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 3,
  },

  emiAmount: {
    color: '#0C4A6E',
    fontSize: 11,
    fontWeight: '900',
  },

  detailRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    padding: 9,
    marginTop: 10,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    color: '#94A3B8',
    fontSize: 7,
    fontWeight: '800',
    marginBottom: 3,
  },

  detailValue: {
    color: '#334155',
    fontSize: 8,
    fontWeight: '800',
  },

  fullScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  fullScheduleText: {
    color: '#0369A1',
    fontSize: 9,
    fontWeight: '900',
  },

  /* Disclaimer */

  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 13,
  },

  disclaimerText: {
    flex: 1,
    color: '#64748B',
    fontSize: 8,
    lineHeight: 13,
  },
});