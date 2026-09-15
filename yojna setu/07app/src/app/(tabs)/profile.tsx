import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { colors } from '../../constants/theme';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type FeedbackType = 'success' | 'error' | 'info';

interface MissingFieldDetail {
  field: string;
  label: string;
  impact_reason?: string;
}

interface ProfileData {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;

  social_category?: string | null;
  is_sc?: boolean | null;
  is_pwd?: boolean | null;
  is_minority?: boolean | null;

  annual_income?: number | null;
  employment_status?: string | null;

  education_level?: string | null;
  applicant_type?: string | null;

  entrepreneur_type?: string | null;
  is_artisan?: boolean | null;
  is_farmer?: boolean | null;
  is_street_vendor?: boolean | null;
  is_safai_karamchari?: boolean | null;

  business_stage?: string | null;
  is_new_unit?: boolean | null;

  sector?: string | null;
  activity_type?: string | null;

  project_cost?: number | null;
  requested_loan_amount?: number | null;

  collateral_available?: boolean | null;
  application_route?: string | null;

  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const INDIAN_STATES = [
  'ALL_INDIA',
  'ANDHRA_PRADESH',
  'ARUNACHAL_PRADESH',
  'ASSAM',
  'BIHAR',
  'CHHATTISGARH',
  'DELHI',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL_PRADESH',
  'JAMMU_AND_KASHMIR',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'LADAKH',
  'MADHYA_PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL_NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR_PRADESH',
  'UTTARAKHAND',
  'WEST_BENGAL',
];

const SECTORS = [
  {
    value: 'MSME',
    label: 'Micro, Small & Medium Enterprise (MSME)',
  },
  {
    value: 'AGRICULTURE',
    label: 'Agriculture, Dairy & Allied Activities',
  },
  {
    value: 'HANDICRAFTS',
    label: 'Handicrafts, Handloom & Artisan Trades',
  },
  {
    value: 'TEXTILES',
    label: 'Textiles, Garments & Tailoring',
  },
  {
    value: 'SERVICES',
    label: 'Service Sector (Transport, Repair, Salons, etc.)',
  },
  {
    value: 'TRADING',
    label: 'Retail & Wholesale Trading',
  },
  {
    value: 'FOOD_PROCESSING',
    label: 'Food Processing & Agribusiness',
  },
  {
    value: 'SANITATION',
    label: 'Sanitation & Waste Management',
  },
  {
    value: 'GREEN_ENERGY',
    label: 'Solar & Renewable Green Energy',
  },
  {
    value: 'HEALTHCARE',
    label: 'Healthcare & Wellness',
  },
  {
    value: 'EDUCATION',
    label: 'Education & Skill Development',
  },
];

const DEFAULT_PROFILE: ProfileData = {
  age: 28,
  gender: 'FEMALE',
  state: 'MAHARASHTRA',
  district: '',

  social_category: 'SC',
  is_sc: true,
  is_pwd: false,
  is_minority: false,

  annual_income: 180000,
  employment_status: 'SELF_EMPLOYED',

  education_level: '10TH_PASS',
  applicant_type: 'INDIVIDUAL',

  entrepreneur_type: 'MICRO',
  is_artisan: false,
  is_farmer: false,
  is_street_vendor: false,
  is_safai_karamchari: false,

  business_stage: 'NEW_BUSINESS',
  is_new_unit: true,

  sector: 'MSME',
  activity_type: 'TRADITIONAL_TRADE_18',

  project_cost: 100000,
  requested_loan_amount: 90000,

  collateral_available: false,
  application_route: 'PARTNER_ASSISTED',
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const displayLabel = (value?: string | null) => {
  if (!value) return '';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const formatCurrency = (value?: number | null) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return '₹0';
  }

  return `₹${Number(value).toLocaleString('en-IN')}`;
};

const parseNumber = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  title: string;
  description: string;
}

const SectionHeader = ({
  icon,
  iconBackground,
  iconColor,
  title,
  description,
}: SectionHeaderProps) => {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={iconColor}
        />
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
};

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

const FieldLabel = ({
  children,
  required,
}: FieldLabelProps) => {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? ' *' : ''}
    </Text>
  );
};

interface SelectFieldProps {
  label: string;
  value?: string | null;
  placeholder: string;
  options: {
    value: string;
    label: string;
  }[];
  onChange: (value: string) => void;
  required?: boolean;
}

const SelectField = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  required,
}: SelectFieldProps) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (option) => option.value === value
  );

  return (
    <View style={styles.fieldContainer}>
      <FieldLabel required={required}>
        {label}
      </FieldLabel>

      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          styles.selectButton,
          open && styles.selectButtonActive,
        ]}
      >
        <Text
          numberOfLines={2}
          style={[
            styles.selectButtonText,
            !selected &&
              styles.selectPlaceholder,
          ]}
        >
          {selected
            ? selected.label
            : placeholder}
        </Text>

        <Ionicons
          name={
            open
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color="#64748B"
        />
      </Pressable>

      {open && (
        <View style={styles.optionsContainer}>
          <ScrollView
            nestedScrollEnabled
            style={styles.optionsScroll}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const active =
                option.value === value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.optionItem,
                    active &&
                      styles.optionItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
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
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

interface NumberFieldProps {
  label: string;
  value?: number | null;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  onChange: (value: number | null) => void;
  required?: boolean;
  min?: number;
}

const NumberField = ({
  label,
  value,
  placeholder,
  prefix,
  suffix,
  onChange,
  required,
  min,
}: NumberFieldProps) => {
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel required={required}>
        {label}
      </FieldLabel>

      <View style={styles.numberField}>
        {prefix && (
          <Text style={styles.inputPrefix}>
            {prefix}
          </Text>
        )}

        <TextInput
          value={
            value === null ||
            value === undefined
              ? ''
              : String(value)
          }
          onChangeText={(text) => {
            if (!text.trim()) {
              onChange(null);
              return;
            }

            const parsed =
              parseNumber(text);

            onChange(
              min !== undefined
                ? Math.max(min, parsed)
                : parsed
            );
          }}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={[
            styles.numberInput,
            prefix && styles.numberInputWithPrefix,
            suffix &&
              styles.numberInputWithSuffix,
          ]}
        />

        {suffix && (
          <Text style={styles.inputSuffix}>
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
};

interface TextFieldProps {
  label: string;
  value?: string | null;
  placeholder: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const TextField = ({
  label,
  value,
  placeholder,
  onChange,
  required,
}: TextFieldProps) => {
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel required={required}>
        {label}
      </FieldLabel>

      <TextInput
        value={value || ''}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.textInput}
      />
    </View>
  );
};

interface CheckOptionProps {
  checked: boolean;
  title: string;
  onPress: () => void;
}

const CheckOption = ({
  checked,
  title,
  onPress,
}: CheckOptionProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.checkOption,
        checked &&
          styles.checkOptionActive,
      ]}
    >
      <View
        style={[
          styles.checkbox,
          checked &&
            styles.checkboxActive,
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={13}
            color="#FFFFFF"
          />
        )}
      </View>

      <Text
        style={[
          styles.checkText,
          checked &&
            styles.checkTextActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */
/* Profile Screen                                                             */
/* -------------------------------------------------------------------------- */

export default function ProfileScreen() {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
  } = useAuth();

  const [profileData, setProfileData] =
    useState<ProfileData>(
      DEFAULT_PROFILE
    );

  const [completionScore, setCompletionScore] =
    useState(0);

  const [missingFields, setMissingFields] =
    useState<MissingFieldDetail[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState<{
      type: FeedbackType;
      message: string;
    } | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Load Profile                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      if (isAuthenticated) {
        const response =
          await authApi.getProfile();

        /*
         * Handles both:
         * { profile: {...}, completion_percentage: ... }
         *
         * and a direct profile object.
         */

        const raw =
          response as any;

        const profile =
          raw?.profile ||
          raw?.data ||
          raw;

        if (profile) {
          setProfileData({
            ...DEFAULT_PROFILE,
            ...profile,
          });
        }

        if (
          raw?.completion_percentage !==
          undefined
        ) {
          setCompletionScore(
            Number(
              raw.completion_percentage
            )
          );
        } else {
          calculateCompletionScore(
            profile || DEFAULT_PROFILE
          );
        }

        if (
          Array.isArray(
            raw?.missing_fields
          )
        ) {
          setMissingFields(
            raw.missing_fields
          );
        } else {
          setMissingFields([]);
        }
      } else {
        /*
         * Native app does not use localStorage.
         *
         * For guest mode we keep the profile
         * in component state and calculate
         * readiness locally.
         */

        setProfileData(
          DEFAULT_PROFILE
        );

        calculateCompletionScore(
          DEFAULT_PROFILE
        );
      }
    } catch (error) {
      console.warn(
        'Profile fetch error:',
        error
      );

      setProfileData(
        DEFAULT_PROFILE
      );

      calculateCompletionScore(
        DEFAULT_PROFILE
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Completion Score                                                         */
  /* ------------------------------------------------------------------------ */

  const calculateCompletionScore = (
    profile: ProfileData
  ) => {
    const coreKeys = [
      'age',
      'gender',
      'state',
      'social_category',
      'annual_income',
      'applicant_type',
      'education_level',
      'sector',
      'business_stage',
      'project_cost',
    ];

    let count = 0;

    coreKeys.forEach((key) => {
      const value =
        profile[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        count++;
      }
    });

    const score = Math.round(
      (count / coreKeys.length) *
        100
    );

    setCompletionScore(score);
  };

  /* ------------------------------------------------------------------------ */
  /* Handle Change                                                            */
  /* ------------------------------------------------------------------------ */

  const handleChange = (
    field: keyof ProfileData,
    value: any
  ) => {
    setProfileData((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field ===
        'social_category'
      ) {
        if (value === 'SC') {
          updated.is_sc = true;
        } else {
          updated.is_sc = false;
        }
      }

      if (
        field === 'project_cost'
      ) {
        if (
          value !== null &&
          value !== undefined &&
          value > 0
        ) {
          updated.requested_loan_amount =
            Math.round(
              value * 0.9
            );
        }
      }

      return updated;
    });

    /*
     * Guest readiness updates instantly.
     */

    if (!isAuthenticated) {
      const next = {
        ...profileData,
        [field]: value,
      };

      calculateCompletionScore(
        next
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Save Profile                                                             */
  /* ------------------------------------------------------------------------ */

  const handleSave = async () => {
    setFeedback(null);

    /* Validation */

    if (
      profileData.age !==
        null &&
      profileData.age !==
        undefined &&
      (profileData.age < 14 ||
        profileData.age > 120)
    ) {
      setFeedback({
        type: 'error',
        message:
          'Age must be between 14 and 120 years.',
      });

      return;
    }

    if (
      profileData.annual_income !==
        null &&
      profileData.annual_income !==
        undefined &&
      profileData.annual_income < 0
    ) {
      setFeedback({
        type: 'error',
        message:
          'Annual income cannot be negative.',
      });

      return;
    }

    if (
      profileData.project_cost !==
        null &&
      profileData.project_cost !==
        undefined &&
      profileData.project_cost < 0
    ) {
      setFeedback({
        type: 'error',
        message:
          'Project cost cannot be negative.',
      });

      return;
    }

    if (
      profileData.requested_loan_amount !==
        null &&
      profileData.requested_loan_amount !==
        undefined &&
      profileData.requested_loan_amount < 0
    ) {
      setFeedback({
        type: 'error',
        message:
          'Requested loan amount cannot be negative.',
      });

      return;
    }

    setIsSaving(true);

    try {
      if (isAuthenticated) {
        const response =
          await authApi.updateProfile(
            profileData
          );

        const raw =
          response as any;

        const savedProfile =
          raw?.profile ||
          raw?.data ||
          raw;

        if (savedProfile) {
          setProfileData({
            ...DEFAULT_PROFILE,
            ...savedProfile,
          });
        }

        if (
          raw?.completion_percentage !==
          undefined
        ) {
          setCompletionScore(
            Number(
              raw.completion_percentage
            )
          );
        } else {
          calculateCompletionScore(
            savedProfile ||
              profileData
          );
        }

        if (
          Array.isArray(
            raw?.missing_fields
          )
        ) {
          setMissingFields(
            raw.missing_fields
          );
        }

        setFeedback({
          type: 'success',
          message:
            'Citizen profile updated and verified successfully! Smart matching is ready.',
        });
      } else {
        calculateCompletionScore(
          profileData
        );

        setFeedback({
          type: 'success',
          message:
            'Profile updated successfully. Login to sync your profile with YojnaSetu.',
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data
          ?.detail ||
        error?.message ||
        'Failed to save profile. Please check your inputs.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Score UI                                                                 */
  /* ------------------------------------------------------------------------ */

  const scoreMessage = useMemo(() => {
    if (completionScore >= 80) {
      return 'Comprehensive profile — all schemes can be evaluated accurately.';
    }

    return 'Complete missing details below to unlock more accurate scheme matches.';
  }, [completionScore]);

  const scoreColor =
    completionScore >= 80
      ? '#10B981'
      : completionScore >= 50
      ? '#F59E0B'
      : colors.sky;

  /* ------------------------------------------------------------------------ */
  /* Options                                                                  */
  /* ------------------------------------------------------------------------ */

  const genderOptions = [
    {
      value: 'FEMALE',
      label:
        'Female (Women schemes & subsidies)',
    },
    {
      value: 'MALE',
      label: 'Male',
    },
    {
      value: 'TRANSGENDER',
      label: 'Transgender',
    },
    {
      value: 'OTHER',
      label: 'Other',
    },
  ];

  const categoryOptions = [
    {
      value: 'SC',
      label:
        'Scheduled Caste (SC)',
    },
    {
      value: 'ST',
      label:
        'Scheduled Tribe (ST)',
    },
    {
      value: 'OBC',
      label:
        'Other Backward Class (OBC)',
    },
    {
      value: 'MINORITY',
      label:
        'Notified Minority Community',
    },
    {
      value: 'GENERAL',
      label:
        'General / Unreserved',
    },
  ];

  const stateOptions =
    INDIAN_STATES.map(
      (state) => ({
        value: state,
        label: displayLabel(state),
      })
    );

  const employmentOptions = [
    {
      value: 'SELF_EMPLOYED',
      label:
        'Self Employed / Small Enterprise',
    },
    {
      value: 'UNEMPLOYED',
      label:
        'Unemployed / Seeking livelihood scheme',
    },
    {
      value: 'SALARIED',
      label:
        'Salaried Worker',
    },
    {
      value: 'STUDENT',
      label:
        'Student / Trainee',
    },
    {
      value: 'DAILY_WAGE',
      label:
        'Daily Wage Earner / Informal Worker',
    },
  ];

  const educationOptions = [
    {
      value: 'ILLITERATE',
      label:
        'No Formal Education',
    },
    {
      value: 'BELOW_8TH',
      label:
        'Below 8th Standard',
    },
    {
      value: '8TH_PASS',
      label:
        '8th Pass',
    },
    {
      value: '10TH_PASS',
      label:
        '10th Pass (Matriculation)',
    },
    {
      value: '12TH_PASS',
      label:
        '12th Pass (Higher Secondary)',
    },
    {
      value: 'DIPLOMA',
      label:
        'Technical Diploma / ITI',
    },
    {
      value: 'GRADUATE',
      label:
        'Graduate (Bachelor Degree)',
    },
    {
      value: 'POST_GRADUATE',
      label:
        'Post Graduate / Masters',
    },
  ];

  const applicantOptions = [
    {
      value: 'INDIVIDUAL',
      label:
        'Individual Citizen / Beneficiary',
    },
    {
      value: 'ARTISAN',
      label:
        'Traditional Artisan / Craftsman',
    },
    {
      value: 'FARMER',
      label:
        'Farmer / Agricultural Producer',
    },
    {
      value: 'STREET_VENDOR',
      label:
        'Street Vendor',
    },
    {
      value: 'WOMEN_ENTREPRENEUR',
      label:
        'Women Entrepreneur',
    },
    {
      value: 'SHG',
      label:
        'Self Help Group (SHG / NRLM)',
    },
    {
      value: 'MICRO_ENTERPRISE',
      label:
        'Micro Enterprise Owner',
    },
    {
      value: 'STUDENT',
      label:
        'Student / Scholarship Seeker',
    },
  ];

  const sectorOptions =
    SECTORS.map(
      (sector) => ({
        value: sector.value,
        label: sector.label,
      })
    );

  const businessStageOptions = [
    {
      value: 'NEW_BUSINESS',
      label:
        'New Unit / Greenfield Startup',
    },
    {
      value: 'EXISTING_BUSINESS',
      label:
        'Existing Business Expansion',
    },
  ];

  const applicationRouteOptions = [
    {
      value: 'PARTNER_ASSISTED',
      label:
        'Authorized Channel Partner Assistance',
    },
    {
      value: 'DIRECT_PORTAL',
      label:
        'Direct Online Government Portal',
    },
  ];

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <Screen>
        <AppHeader
          title="Citizen Profile"
          subtitle="Eligibility parameters"
          rightContent={
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.sky}
            />
          }
        />

        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={colors.sky}
          />

          <Text
            style={styles.loadingText}
          >
            Loading your profile...
          </Text>
        </View>
      </Screen>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <Screen>
      <AppHeader
        title="Citizen Profile"
        subtitle="Eligibility parameters"
        rightContent={
          <Ionicons
            name="person-circle-outline"
            size={24}
            color={colors.sky}
          />
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.container
          }
        >
          {/* ================================================================ */}
          {/* TOP BANNER                                                       */}
          {/* ================================================================ */}

          <View style={styles.hero}>
            <View
              style={
                styles.heroBadge
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color="#7DD3FC"
              />

              <Text
                style={
                  styles.heroBadgeText
                }
              >
                AUTHORITATIVE CITIZEN PROFILE
              </Text>
            </View>

            <Text
              style={styles.heroTitle}
            >
              Citizen Profile & Eligibility
              Parameters
            </Text>

            <Text
              style={
                styles.heroDescription
              }
            >
              Your structured profile acts as
              the single source of truth for
              deterministic eligibility
              evaluation across government
              schemes.
            </Text>

            <View
              style={
                styles.heroBottom
              }
            >
              <Ionicons
                name="document-text-outline"
                size={15}
                color="#CBD5E1"
              />

              <Text
                style={
                  styles.heroBottomText
                }
              >
                No document uploads required
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* FEEDBACK                                                         */}
          {/* ================================================================ */}

          {feedback && (
            <View
              style={[
                styles.feedback,
                feedback.type ===
                  'success' &&
                  styles.feedbackSuccess,
                feedback.type ===
                  'error' &&
                  styles.feedbackError,
                feedback.type ===
                  'info' &&
                  styles.feedbackInfo,
              ]}
            >
              <Ionicons
                name={
                  feedback.type ===
                  'success'
                    ? 'checkmark-circle'
                    : feedback.type ===
                      'error'
                    ? 'alert-circle'
                    : 'information-circle'
                }
                size={20}
                color={
                  feedback.type ===
                  'success'
                    ? '#059669'
                    : feedback.type ===
                      'error'
                    ? '#DC2626'
                    : '#0369A1'
                }
              />

              <View
                style={
                  styles.feedbackContent
                }
              >
                <Text
                  style={
                    styles.feedbackText
                  }
                >
                  {feedback.message}
                </Text>

                {feedback.type ===
                  'success' && (
                  <Pressable
                    onPress={() =>
                      router.push(
                        '/(tabs)/match'
                      )
                    }
                    style={
                      styles.feedbackAction
                    }
                  >
                    <Text
                      style={
                        styles.feedbackActionText
                      }
                    >
                      View Smart Recommendations
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color="#0369A1"
                    />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ================================================================ */}
          {/* PROFILE READINESS                                                */}
          {/* ================================================================ */}

          <View
            style={
              styles.readinessCard
            }
          >
            <View
              style={
                styles.progressCircleOuter
              }
            >
              <View
                style={[
                  styles.progressCircle,
                  {
                    borderColor:
                      scoreColor,
                  },
                ]}
              >
                <Text
                  style={
                    styles.progressPercentage
                  }
                >
                  {completionScore}%
                </Text>
              </View>
            </View>

            <View
              style={
                styles.readinessContent
              }
            >
              <Text
                style={
                  styles.readinessTitle
                }
              >
                Profile Readiness Score
              </Text>

              <Text
                style={
                  styles.readinessDescription
                }
              >
                {scoreMessage}
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* MISSING FIELDS                                                   */}
          {/* ================================================================ */}

          {missingFields.length >
            0 && (
            <View
              style={
                styles.missingCard
              }
            >
              <View
                style={
                  styles.missingHeader
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#D97706"
                />

                <Text
                  style={
                    styles.missingTitle
                  }
                >
                  Missing Information
                </Text>
              </View>

              <View
                style={
                  styles.missingList
                }
              >
                {missingFields
                  .slice(0, 6)
                  .map((field) => (
                    <View
                      key={
                        field.field
                      }
                      style={
                        styles.missingChip
                      }
                    >
                      <Ionicons
                        name="warning"
                        size={11}
                        color="#D97706"
                      />

                      <Text
                        style={
                          styles.missingChipText
                        }
                      >
                        {field.label}
                      </Text>
                    </View>
                  ))}
              </View>

              {missingFields.length >
                6 && (
                <Text
                  style={
                    styles.moreMissing
                  }
                >
                  +
                  {missingFields.length -
                    6}{' '}
                  more missing fields
                </Text>
              )}
            </View>
          )}

          {/* ================================================================ */}
          {/* SECTION 1                                                        */}
          {/* ================================================================ */}

          <View style={styles.card}>
            <SectionHeader
              icon="person-outline"
              iconBackground="#F0F9FF"
              iconColor="#0369A1"
              title="1. Personal & Social Identity"
              description="Demographic parameters used for age criteria and affirmative social credit schemes."
            />

            <View style={styles.formGrid}>
              <NumberField
                label="Applicant Age (Years)"
                value={
                  profileData.age
                }
                onChange={(value) =>
                  handleChange(
                    'age',
                    value
                  )
                }
                placeholder="e.g. 28"
                required
                min={0}
              />

              <SelectField
                label="Gender"
                value={
                  profileData.gender
                }
                placeholder="Select gender"
                options={
                  genderOptions
                }
                onChange={(value) =>
                  handleChange(
                    'gender',
                    value
                  )
                }
                required
              />

              <SelectField
                label="Social Category"
                value={
                  profileData.social_category
                }
                placeholder="Select category"
                options={
                  categoryOptions
                }
                onChange={(value) =>
                  handleChange(
                    'social_category',
                    value
                  )
                }
                required
              />

              <SelectField
                label="State of Residence / Enterprise"
                value={
                  profileData.state
                }
                placeholder="Select state"
                options={
                  stateOptions
                }
                onChange={(value) =>
                  handleChange(
                    'state',
                    value
                  )
                }
                required
              />

              <TextField
                label="District"
                value={
                  profileData.district
                }
                placeholder="e.g. Pune, Lucknow, Patna"
                onChange={(value) =>
                  handleChange(
                    'district',
                    value
                  )
                }
              />
            </View>

            {/* Special Affirmations */}

            <View
              style={
                styles.affirmationBox
              }
            >
              <View
                style={
                  styles.affirmationHeader
                }
              >
                <Ionicons
                  name="ribbon-outline"
                  size={17}
                  color="#475569"
                />

                <Text
                  style={
                    styles.affirmationTitle
                  }
                >
                  SPECIAL BENEFICIARY
                  AFFIRMATIONS
                </Text>
              </View>

              <View
                style={
                  styles.checkGrid
                }
              >
                <CheckOption
                  checked={
                    !!profileData.is_pwd
                  }
                  title="Person with Disability (Divyangjan)"
                  onPress={() =>
                    handleChange(
                      'is_pwd',
                      !profileData.is_pwd
                    )
                  }
                />

                <CheckOption
                  checked={
                    !!profileData.is_minority
                  }
                  title="Minority Community"
                  onPress={() =>
                    handleChange(
                      'is_minority',
                      !profileData.is_minority
                    )
                  }
                />

                <CheckOption
                  checked={
                    !!profileData.is_artisan
                  }
                  title="Traditional Artisan / Craftsman"
                  onPress={() =>
                    handleChange(
                      'is_artisan',
                      !profileData.is_artisan
                    )
                  }
                />

                <CheckOption
                  checked={
                    !!profileData.is_safai_karamchari
                  }
                  title="Sanitation Worker / Safai Karamchari"
                  onPress={() =>
                    handleChange(
                      'is_safai_karamchari',
                      !profileData.is_safai_karamchari
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/* ================================================================ */}
          {/* SECTION 2                                                        */}
          {/* ================================================================ */}

          <View style={styles.card}>
            <SectionHeader
              icon="wallet-outline"
              iconBackground="#ECFDF5"
              iconColor="#047857"
              title="2. Economic Status & Family Income"
              description="Required for income ceiling checks on means-tested welfare and interest subvention schemes."
            />

            <NumberField
              label="Annual Family Income (INR ₹)"
              value={
                profileData.annual_income
              }
              onChange={(value) =>
                handleChange(
                  'annual_income',
                  value
                )
              }
              placeholder="e.g. 180000"
              prefix="₹"
              required
              min={0}
            />

            {profileData.annual_income !==
              null &&
              profileData.annual_income !==
                undefined && (
                <View
                  style={
                    styles.incomeHint
                  }
                >
                  <Ionicons
                    name={
                      profileData
                        .annual_income <=
                      300000
                        ? 'checkmark-circle'
                        : 'information-circle'
                    }
                    size={15}
                    color={
                      profileData
                        .annual_income <=
                      300000
                        ? '#059669'
                        : '#64748B'
                    }
                  />

                  <Text
                    style={
                      styles.incomeHintText
                    }
                  >
                    {profileData.annual_income <=
                    300000
                      ? 'Eligible for BPL / concessional social welfare schemes under ₹3.0 Lakh indicative ceiling.'
                      : 'Above ₹3.0 Lakh indicative limit for concessional welfare; other credit schemes may still apply.'}
                  </Text>
                </View>
              )}

            <SelectField
              label="Current Employment Status"
              value={
                profileData.employment_status
              }
              placeholder="Select employment status"
              options={
                employmentOptions
              }
              onChange={(value) =>
                handleChange(
                  'employment_status',
                  value
                )
              }
              required
            />
          </View>

          {/* ================================================================ */}
          {/* SECTION 3                                                        */}
          {/* ================================================================ */}

          <View style={styles.card}>
            <SectionHeader
              icon="school-outline"
              iconBackground="#F5F3FF"
              iconColor="#7C3AED"
              title="3. Education & Vocation Category"
              description="Helps match schemes requiring education thresholds or specialized artisan credit."
            />

            <SelectField
              label="Highest Education Completed"
              value={
                profileData.education_level
              }
              placeholder="Select education level"
              options={
                educationOptions
              }
              onChange={(value) =>
                handleChange(
                  'education_level',
                  value
                )
              }
              required
            />

            <SelectField
              label="Applicant Vocation Classification"
              value={
                profileData.applicant_type
              }
              placeholder="Select applicant classification"
              options={
                applicantOptions
              }
              onChange={(value) =>
                handleChange(
                  'applicant_type',
                  value
                )
              }
              required
            />
          </View>

          {/* ================================================================ */}
          {/* SECTION 4                                                        */}
          {/* ================================================================ */}

          <View style={styles.card}>
            <SectionHeader
              icon="briefcase-outline"
              iconBackground="#FFFBEB"
              iconColor="#B45309"
              title="4. Business, Project & Credit Parameters"
              description="Pre-fills the Financial Calculator and matches loan limit ceilings."
            />

            <SelectField
              label="Economic Sector"
              value={
                profileData.sector
              }
              placeholder="Select economic sector"
              options={
                sectorOptions
              }
              onChange={(value) =>
                handleChange(
                  'sector',
                  value
                )
              }
              required
            />

            <SelectField
              label="Business Stage"
              value={
                profileData.business_stage
              }
              placeholder="Select business stage"
              options={
                businessStageOptions
              }
              onChange={(value) =>
                handleChange(
                  'business_stage',
                  value
                )
              }
              required
            />

            <NumberField
              label="Estimated Project Cost (INR ₹)"
              value={
                profileData.project_cost
              }
              onChange={(value) =>
                handleChange(
                  'project_cost',
                  value
                )
              }
              placeholder="e.g. 100000"
              prefix="₹"
              min={0}
            />

            <NumberField
              label="Requested Loan Amount (INR ₹)"
              value={
                profileData.requested_loan_amount
              }
              onChange={(value) =>
                handleChange(
                  'requested_loan_amount',
                  value
                )
              }
              placeholder="e.g. 90000"
              prefix="₹"
              min={0}
            />

            <View
              style={
                styles.syncNote
              }
            >
              <Ionicons
                name="calculator-outline"
                size={15}
                color="#0369A1"
              />

              <Text
                style={
                  styles.syncNoteText
                }
              >
                Requested loan amount is used
                to pre-fill the Financial
                Calculator for matched loan
                schemes.
              </Text>
            </View>

            <SelectField
              label="Collateral Security Available?"
              value={
                profileData.collateral_available
                  ? 'YES'
                  : 'NO'
              }
              placeholder="Select collateral status"
              options={[
                {
                  value: 'NO',
                  label:
                    'No — Prefer collateral-free loans',
                },
                {
                  value: 'YES',
                  label:
                    'Yes — Collateral security available',
                },
              ]}
              onChange={(value) =>
                handleChange(
                  'collateral_available',
                  value === 'YES'
                )
              }
            />

            <SelectField
              label="Preferred Application Route"
              value={
                profileData.application_route
              }
              placeholder="Select application route"
              options={
                applicationRouteOptions
              }
              onChange={(value) =>
                handleChange(
                  'application_route',
                  value
                )
              }
            />
          </View>

          {/* ================================================================ */}
          {/* PRIVACY BOX                                                      */}
          {/* ================================================================ */}

          <View
            style={
              styles.privacyCard
            }
          >
            <View
              style={
                styles.privacyIcon
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#0284C7"
              />
            </View>

            <View
              style={
                styles.privacyContent
              }
            >
              <Text
                style={
                  styles.privacyTitle
                }
              >
                Privacy & Zero-Document Upload
              </Text>

              <Text
                style={
                  styles.privacyText
                }
              >
                YojnaSetu stores structured
                eligibility attributes only.
                No Aadhaar scans, certificates
                or personal identification
                documents are uploaded through
                this profile.
              </Text>
            </View>
          </View>

          {/* ================================================================ */}
          {/* LOGIN NOTICE                                                     */}
          {/* ================================================================ */}

          {!isAuthenticated && (
            <View
              style={
                styles.loginNotice
              }
            >
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color="#D97706"
              />

              <View
                style={
                  styles.loginNoticeContent
                }
              >
                <Text
                  style={
                    styles.loginNoticeTitle
                  }
                >
                  Guest Profile
                </Text>

                <Text
                  style={
                    styles.loginNoticeText
                  }
                >
                  You can edit your profile as a
                  guest. Login to sync these
                  eligibility parameters with your
                  YojnaSetu account.
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/(auth)/login'
                    )
                  }
                  style={
                    styles.loginButton
                  }
                >
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Login to Sync
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="#B45309"
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* ================================================================ */}
          {/* ACTIONS                                                          */}
          {/* ================================================================ */}

          <View
            style={styles.actions}
          >
            <Pressable
              onPress={loadProfile}
              disabled={isSaving}
              style={
                styles.resetStoredButton
              }
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#475569"
              />

              <Text
                style={
                  styles.resetStoredText
                }
              >
                Reset to Stored Values
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveButton,
                isSaving &&
                  styles.saveButtonDisabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="save-outline"
                  size={18}
                  color="#FFFFFF"
                />
              )}

              <Text
                style={
                  styles.saveButtonText
                }
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save Profile'}
              </Text>
            </Pressable>
          </View>

          {/* ================================================================ */}
          {/* SMART MATCH CTA                                                  */}
          {/* ================================================================ */}

          <Pressable
            onPress={() =>
              router.push(
                '/(tabs)/match'
              )
            }
            style={
              styles.matchCard
            }
          >
            <View
              style={
                styles.matchIcon
              }
            >
              <Ionicons
                name="sparkles"
                size={22}
                color="#7DD3FC"
              />
            </View>

            <View
              style={
                styles.matchContent
              }
            >
              <Text
                style={
                  styles.matchTitle
                }
              >
                Ready for Smart Matching?
              </Text>

              <Text
                style={
                  styles.matchText
                }
              >
                Use your saved profile to find
                government schemes you may qualify
                for.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#7DD3FC"
            />
          </Pressable>

          <View
            style={{
              height: 30,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Loading */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Hero */

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#D7832D',
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
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 8,
  },

  heroDescription: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 18,
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.10)',
  },

  heroBottomText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '700',
  },

  /* Feedback */

  feedback: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15,
  },

  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },

  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  feedbackInfo: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },

  feedbackContent: {
    flex: 1,
  },

  feedbackText: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  feedbackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },

  feedbackActionText: {
    color: '#0369A1',
    fontSize: 9,
    fontWeight: '900',
  },

  /* Readiness */

  readinessCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 12,
  },

  progressCircleOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  progressCircle: {
    width: 63,
    height: 63,
    borderRadius: 32,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  progressPercentage: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },

  readinessContent: {
    flex: 1,
  },

  readinessTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 5,
  },

  readinessDescription: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 14,
  },

  /* Missing */

  missingCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 17,
    padding: 14,
    marginBottom: 16,
  },

  missingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },

  missingTitle: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
  },

  missingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  missingChipText: {
    color: '#92400E',
    fontSize: 8,
    fontWeight: '800',
  },

  moreMissing: {
    color: '#78716C',
    fontSize: 8,
    marginTop: 8,
    fontWeight: '700',
  },

  /* Cards */

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 17,
    marginBottom: 16,
  },

  /* Section */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 15,
    marginBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },

  sectionDescription: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 14,
  },

  /* Form */

  formGrid: {
    gap: 15,
  },

  fieldContainer: {
    marginBottom: 15,
  },

  fieldLabel: {
    color: '#334155',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.55,
    marginBottom: 7,
    textTransform: 'uppercase',
  },

  textInput: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },

  numberField: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputPrefix: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900',
    paddingLeft: 13,
  },

  numberInput: {
    flex: 1,
    minHeight: 45,
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },

  numberInputWithPrefix: {
    paddingLeft: 7,
  },

  numberInputWithSuffix: {
    paddingRight: 7,
  },

  inputSuffix: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    paddingRight: 13,
  },

  /* Select */

  selectButton: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#FFFFFF',
  },

  selectButtonText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
    paddingRight: 8,
  },

  selectPlaceholder: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  optionsContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  optionsScroll: {
    maxHeight: 230,
  },

  optionItem: {
    minHeight: 45,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  optionItemActive: {
    backgroundColor: '#F0F9FF',
  },

  optionText: {
    flex: 1,
    color: '#475569',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    paddingRight: 10,
  },

  optionTextActive: {
    color: '#0369A1',
    fontWeight: '900',
  },

  /* Affirmations */

  affirmationBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 13,
    marginTop: 2,
  },

  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },

  affirmationTitle: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  checkGrid: {
    gap: 8,
  },

  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
  },

  checkOptionActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },

  checkText: {
    flex: 1,
    color: '#475569',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700',
  },

  checkTextActive: {
    color: '#0C4A6E',
  },

  /* Income */

  incomeHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 9,
    marginTop: -6,
    marginBottom: 15,
  },

  incomeHintText: {
    flex: 1,
    color: '#64748B',
    fontSize: 8,
    lineHeight: 13,
    fontWeight: '600',
  },

  /* Sync */

  syncNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 11,
    padding: 10,
    marginTop: -5,
    marginBottom: 15,
  },

  syncNoteText: {
    flex: 1,
    color: '#075985',
    fontSize: 8,
    lineHeight: 13,
    fontWeight: '600',
  },

  /* Privacy */

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  privacyIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    color: '#0C4A6E',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },

  privacyText: {
    color: '#075985',
    fontSize: 8,
    lineHeight: 14,
  },

  /* Login */

  loginNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
  },

  loginNoticeContent: {
    flex: 1,
  },

  loginNoticeTitle: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },

  loginNoticeText: {
    color: '#92400E',
    fontSize: 8,
    lineHeight: 14,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  loginButtonText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '900',
  },

  /* Actions */

  actions: {
    gap: 10,
    marginTop: 3,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  resetStoredButton: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  resetStoredText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  /* Smart Match */

  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    padding: 15,
    marginTop: 16,
  },

  matchIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(14,165,233,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  matchContent: {
    flex: 1,
  },

  matchTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },

  matchText: {
    color: '#94A3B8',
    fontSize: 8,
    lineHeight: 13,
  },
});