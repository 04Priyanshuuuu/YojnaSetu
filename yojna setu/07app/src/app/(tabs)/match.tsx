import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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

import { colors, radius, shadows, spacing } from '../../constants/theme';

import { useAuth } from '../../context/AuthContext';

import { authApi } from '../../api/authApi';

import {
  recommendationApi,
  BeneficiaryProfileInput,
  RecommendationItem,
  RecommendationResponse,
  MissingFieldDetail,
} from '../../api/recommendationApi';

import { aiApi } from '../../api/aiApi';

type InputMode = 'PROFILE' | 'TYPE' | 'FORM';

type TabFilter =
  | 'ELIGIBLE'
  | 'INSUFFICIENT'
  | 'INELIGIBLE'
  | 'ALL';

const DEFAULT_USER_TEXT =
  'I am a 28 year old woman from Uttar Pradesh. I belong to SC category. My annual income is around 1.8 lakh. I want to start a small tailoring business with a project cost of 1 lakh.';

const cleanReasonText = (text?: string): string => {
  if (!text) {
    return '';
  }

  let clean = text;

  clean = clean.replace(
    /^(?:Rule\s+[A-Z0-9_-]+:?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Condition satisfied(?:\s+for)?:?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Condition failed(?:\s+for)?:?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Exact\s+(?:sector|category|income|state|age)\s+match(?:\s+for)?:?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Passed\s+(?:rule|criteria):?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Failed\s+(?:rule|criteria):?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Requirement\s+(?:Field|satisfied|failed):?\s*)/i,
    ''
  );

  clean = clean.replace(
    /^(?:Missing\s+(?:parameter|requirement|field|information):?\s*)/i,
    ''
  );

  clean = clean.replace(
    /Field:\s*[\w_]+\s*(?:==|!=|<=|>=|<|>|IN)\s*[^;]+;/gi,
    ''
  );

  clean = clean.replace(
    /\b(?:PM_SURAJ|AUTHORISED_SCA|AUTHORISED_CA)\b/g,
    'Authorized Partner Portal'
  );

  clean = clean.replace(
    /\bTRADITIONAL_TRADE_\d+\b/g,
    'Traditional Trade'
  );

  clean = clean.replace(
    /\bSMALL_MICRO_BUSINESS\b/g,
    'Small & Micro Business'
  );

  clean = clean.replace(
    /\bAPPLICATION_ROUTE\b/g,
    'Application Route'
  );

  clean = clean
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) {
    return '';
  }

  return (
    clean.charAt(0).toUpperCase() +
    clean.slice(1)
  );
};

const calculateProfileCompletion = (
  profile: BeneficiaryProfileInput | null
): number => {
  if (!profile) {
    return 0;
  }

  const coreFields = [
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

  for (const field of coreFields) {
    const value = profile[field];

    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'UNKNOWN' &&
      value !== 'NOT_SPECIFIED'
    ) {
      count += 1;
    }
  }

  return Math.min(
    100,
    Math.round(
      (count / coreFields.length) * 100
    )
  );
};

const getErrorMessage = (error: any): string => {
  if (
    error?.userFriendlyMessage &&
    typeof error.userFriendlyMessage === 'string'
  ) {
    return error.userFriendlyMessage;
  }

  if (
    error?.response?.data?.detail &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const formatIndianCurrency = (
  amount?: number | null
): string => {
  if (
    amount === undefined ||
    amount === null ||
    Number.isNaN(amount)
  ) {
    return '';
  }

  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const formatEnum = (
  value?: string | null
): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function MatchScreen() {
  const router = useRouter();

  const {
    isAuthenticated,
  } = useAuth();

  const [canonicalProfile, setCanonicalProfile] =
    useState<BeneficiaryProfileInput | null>(
      null
    );

  const [profileCompletion, setProfileCompletion] =
    useState(0);

  const [missingProfileFields, setMissingProfileFields] =
    useState<MissingFieldDetail[]>([]);

  const [inputMode, setInputMode] =
    useState<InputMode>(
      isAuthenticated ? 'PROFILE' : 'TYPE'
    );

  const [userText, setUserText] =
    useState(DEFAULT_USER_TEXT);

  const [formAge, setFormAge] =
    useState('28');

  const [formGender, setFormGender] =
    useState('FEMALE');

  const [formState, setFormState] =
    useState('UTTAR_PRADESH');

  const [formSocialCategory, setFormSocialCategory] =
    useState('SC');

  const [formIncomeSlab, setFormIncomeSlab] =
    useState('180000');

  const [formNeed, setFormNeed] =
    useState('START_BUSINESS');

  const [formBusinessStage, setFormBusinessStage] =
    useState('NEW');

  const [formProjectCostSlab, setFormProjectCostSlab] =
    useState('100000');

  const [formLoanRequired, setFormLoanRequired] =
    useState(true);

  const [standardResult, setStandardResult] =
    useState<RecommendationResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSavingProfile, setIsSavingProfile] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [successMsg, setSuccessMsg] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<TabFilter>('ELIGIBLE');

  const [expandedDetails, setExpandedDetails] =
    useState<Record<string, boolean>>({});

  const topK = 10;

  useEffect(() => {
    if (
      !isAuthenticated &&
      inputMode === 'PROFILE'
    ) {
      setInputMode('TYPE');
    }
  }, [isAuthenticated, inputMode]);

  const syncFormFromProfile = useCallback(
    (profile: BeneficiaryProfileInput) => {
      if (profile.age !== undefined) {
        setFormAge(String(profile.age));
      }

      if (profile.gender) {
        setFormGender(String(profile.gender));
      }

      if (profile.state) {
        setFormState(String(profile.state));
      }

      if (profile.social_category) {
        setFormSocialCategory(
          String(profile.social_category)
        );
      }

      if (profile.annual_income !== undefined) {
        setFormIncomeSlab(
          String(profile.annual_income)
        );
      }

      if (profile.project_cost !== undefined) {
        setFormProjectCostSlab(
          String(profile.project_cost)
        );
      }

      if (profile.business_stage) {
        setFormBusinessStage(
          String(profile.business_stage)
        );
      }
    },
    []
  );

  const loadProfile = useCallback(
    async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response =
          await authApi.getProfile();

        const rawProfile =
          (response as any)?.profile ||
          response;

        if (!rawProfile) {
          return;
        }

        const profile =
          rawProfile as BeneficiaryProfileInput;

        setCanonicalProfile(profile);

        const completion =
          (response as any)
            ?.completion_percentage ??
          calculateProfileCompletion(profile);

        setProfileCompletion(
          Number(completion) || 0
        );

        setMissingProfileFields(
          ((response as any)?.missing_fields ||
            []) as MissingFieldDetail[]
        );

        syncFormFromProfile(profile);

        if (
          profile.age ||
          profile.annual_income ||
          profile.social_category
        ) {
          setIsLoading(true);

          try {
            const result =
              await recommendationApi.getRecommendations(
                profile,
                topK
              );

            setStandardResult(result);
          } catch {
            // Initial automatic recommendation failure
            // should not block the screen.
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.warn(
          'Failed to load citizen profile:',
          error
        );
      }
    },
    [
      isAuthenticated,
      syncFormFromProfile,
    ]
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const buildProfileFromForm =
    useCallback((): BeneficiaryProfileInput => {
      let sector = 'MICRO_FINANCE';
      let activity =
        'SMALL_MICRO_BUSINESS';

      if (
        formNeed === 'START_BUSINESS'
      ) {
        sector = 'MICRO_FINANCE';
        activity =
          'SMALL_MICRO_BUSINESS';
      } else if (
        formNeed === 'EXPAND_BUSINESS'
      ) {
        sector = 'MICRO_FINANCE';
        activity =
          'BUSINESS_EXPANSION';
      } else if (
        formNeed === 'EDUCATION'
      ) {
        sector = 'EDUCATION';
        activity =
          'HIGHER_EDUCATION';
      } else if (
        formNeed === 'SKILL_TRAINING'
      ) {
        sector = 'SKILL_DEVELOPMENT';
        activity =
          'VOCATIONAL_TRAINING';
      } else if (
        formNeed === 'AGRICULTURE'
      ) {
        sector = 'AGRICULTURE';
        activity =
          'FARMING_ALLIED';
      } else if (
        formNeed === 'HOUSING'
      ) {
        sector = 'HOUSING';
        activity =
          'HOME_RENOVATION';
      }

      const age =
        Number(formAge) || 28;

      const income =
        Number(formIncomeSlab) || 180000;

      const projectCost =
        Number(formProjectCostSlab) ||
        100000;

      return {
        age,
        gender: formGender,
        state: formState,
        social_category:
          formSocialCategory ===
          'NOT_SPECIFIED'
            ? 'GENERAL'
            : formSocialCategory,
        is_sc:
          formSocialCategory === 'SC',
        annual_income: income,
        sector,
        activity_type: activity,
        business_stage:
          formBusinessStage,
        is_new_unit:
          formBusinessStage === 'NEW' ||
          formBusinessStage === 'CONCEPT',
        project_cost: projectCost,
        requested_loan_amount:
          formLoanRequired
            ? Math.round(
                projectCost * 0.9
              )
            : 0,
        applicant_type: 'INDIVIDUAL',
      };
    }, [
      formAge,
      formGender,
      formState,
      formSocialCategory,
      formIncomeSlab,
      formNeed,
      formBusinessStage,
      formProjectCostSlab,
      formLoanRequired,
    ]);

    const handleFindSchemes =
  useCallback(async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setStandardResult(null);

    try {
      let profile:
        | BeneficiaryProfileInput
        | null = null;

      if (inputMode === 'PROFILE') {
        profile = canonicalProfile;

        if (!profile) {
          throw new Error(
            'Your Citizen Profile is not available yet.'
          );
        }
      }

      if (inputMode === 'FORM') {
        profile = buildProfileFromForm();
      }

      if (inputMode === 'TYPE') {
        if (!userText.trim()) {
          throw new Error(
            'Please describe your requirements first.'
          );
        }

        const extraction =
          await aiApi.extractProfile(
            userText.trim()
          );

        profile =
          extraction.extracted_profile;

        if (!profile) {
          throw new Error(
            'Could not build a profile from the provided information.'
          );
        }
      }

      if (!profile) {
        throw new Error(
          'Could not build a profile from the provided information.'
        );
      }

      const result =
        await recommendationApi.getRecommendations(
          profile,
          topK
        );

      setStandardResult(result);
      setActiveTab('ELIGIBLE');
      setSuccessMsg(
        'Smart Match completed successfully.'
      );
    } catch (error: any) {
      setErrorMsg(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    inputMode,
    canonicalProfile,
    buildProfileFromForm,
    userText,
  ]);

  const handleSaveFormToProfile =
    useCallback(async () => {
      const profile =
        buildProfileFromForm();

      setIsSavingProfile(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
        const response =
          await authApi.updateProfile(
            profile
          );

        const savedProfile =
          (response as any)?.profile ||
          profile;

        setCanonicalProfile(
          savedProfile
        );

        const completion =
          (response as any)
            ?.completion_percentage ??
          calculateProfileCompletion(
            savedProfile
          );

        setProfileCompletion(
          Number(completion) || 0
        );

        setMissingProfileFields(
          ((response as any)?.missing_fields ||
            []) as MissingFieldDetail[]
        );

        setSuccessMsg(
          'Your Citizen Profile has been updated with these parameters.'
        );
      } catch (error: any) {
        setErrorMsg(
          getErrorMessage(error)
        );
      } finally {
        setIsSavingProfile(false);
      }
    }, [buildProfileFromForm]);

  const handleResetToStoredProfile =
    useCallback(() => {
      if (!canonicalProfile) {
        Alert.alert(
          'Profile unavailable',
          'No saved Citizen Profile is available.'
        );
        return;
      }

      syncFormFromProfile(
        canonicalProfile
      );

      setSuccessMsg(
        'Form reset to your saved Citizen Profile values.'
      );
    }, [
      canonicalProfile,
      syncFormFromProfile,
    ]);

  const toggleDetails = (
    schemeId: string
  ) => {
    setExpandedDetails(
      (previous) => ({
        ...previous,
        [schemeId]:
          !previous[schemeId],
      })
    );
  };

  const openProfile = () => {
    router.push('/(tabs)/profile');
  };

  const openScheme = (
    schemeId: string
  ) => {
    router.push({
      pathname: '/schemes/[id]',
      params: {
        id: schemeId,
      },
    });
  };

  const openCalculator = (
    schemeId: string,
    amount: number | ''
  ) => {
    router.push({
      pathname: '/(tabs)/calculator',
      params: {
        scheme: schemeId,
        amount:
          amount === ''
            ? undefined
            : String(amount),
      },
    });
  };

  const openPartner = (
    schemeId: string
  ) => {
    router.push({
      pathname: '/partners',
      params: {
        scheme_id: schemeId,
        state:
          String(
            canonicalProfile?.state ||
              formState ||
              ''
          ),
      },
    });
  };

  const openOfficialPortal =
    async (
      scheme: RecommendationItem
    ) => {
      const url =
        scheme.application_url ||
        scheme.official_portal ||
        scheme.official_source_url;

      if (!url) {
        return;
      }

      try {
        const supported =
          await Linking.canOpenURL(
            url
          );

        if (!supported) {
          Alert.alert(
            'Unable to open link',
            'The official portal link could not be opened on this device.'
          );

          return;
        }

        Alert.alert(
          'Official Government Portal',
          `You are about to open the official application portal for ${scheme.scheme_name}.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Portal',
              onPress: () => {
                Linking.openURL(url);
              },
            },
          ]
        );
      } catch {
        Alert.alert(
          'Unable to open link',
          'Please try again.'
        );
      }
    };

  const getMatchLabel = (
    score: number
  ) => {
    if (score >= 85) {
      return 'Strong Fit';
    }

    if (score >= 70) {
      return 'Good Fit';
    }

    if (score >= 50) {
      return 'Moderate Fit';
    }

    return 'Basic Fit';
  };

  const displayedItems =
    useMemo(() => {
      if (!standardResult) {
        return [];
      }

      const eligible =
        standardResult.recommendations ||
        [];

      const insufficient =
        standardResult.insufficient_info_schemes ||
        [];

      const ineligible =
        standardResult.ineligible_schemes ||
        [];

      if (
        activeTab === 'ELIGIBLE'
      ) {
        return eligible;
      }

      if (
        activeTab === 'INSUFFICIENT'
      ) {
        return insufficient;
      }

      if (
        activeTab === 'INELIGIBLE'
      ) {
        return ineligible;
      }

      return [
        ...eligible,
        ...insufficient,
        ...ineligible,
      ];
    }, [
      standardResult,
      activeTab,
    ]);

  const emptyMessage =
    useMemo(() => {
      if (
        activeTab === 'ELIGIBLE'
      ) {
        return 'No schemes passed all mandatory eligibility criteria for the provided profile.';
      }

      if (
        activeTab === 'INSUFFICIENT'
      ) {
        return 'No schemes are pending missing profile information.';
      }

      if (
        activeTab === 'INELIGIBLE'
      ) {
        return 'No schemes were excluded by hard eligibility gates.';
      }

      return 'No evaluated schemes found.';
    }, [activeTab]);

  return (
    <Screen
      scroll={false}
      style={styles.screen}
    >
      <AppHeader
        title="Smart Match"
        subtitle="Find government schemes suited to you"
        rightContent={
          <Pressable
            onPress={openProfile}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed &&
                styles.pressed,
            ]}
            accessibilityLabel="Open profile"
          >
            <Ionicons
              name="person-outline"
              size={19}
              color={colors.blue}
            />
          </Pressable>
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
          style={styles.flex}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO */}
          <View
            style={
              styles.hero
            }
          >
            <View
              style={
                styles.heroBadge
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={15}
                color="#A7F3D0"
              />

              <Text
                style={
                  styles.heroBadgeText
                }
              >
                Deterministic Smart Matching Engine
              </Text>
            </View>

            <Text
              style={
                styles.heroTitle
              }
            >
              Smart Scheme Matching
            </Text>

            <Text
              style={
                styles.heroTitleSecond
              }
            >
              & Explainable Eligibility
            </Text>

            <Text
              style={
                styles.heroDescription
              }
            >
              Evaluate verified government
              schemes against your profile and
              understand why you qualify, need
              more information, or do not qualify.
            </Text>

            <Pressable
              onPress={
                openProfile
              }
              style={({ pressed }) => [
                styles.heroProfileButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={17}
                color="#FDE68A"
              />

              <Text
                style={
                  styles.heroProfileButtonText
                }
              >
                View / Edit Profile
              </Text>
            </Pressable>
          </View>

          {/* ERROR */}
          {errorMsg ? (
            <View
              style={
                styles.errorBanner
              }
            >
              <Ionicons
                name="alert-circle"
                size={19}
                color={colors.rose}
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {errorMsg}
              </Text>

              <Pressable
                onPress={() =>
                  setErrorMsg(null)
                }
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={
                    colors.textMuted
                  }
                />
              </Pressable>
            </View>
          ) : null}

          {/* SUCCESS */}
          {successMsg ? (
            <View
              style={
                styles.successBanner
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={19}
                color={
                  colors.emerald
                }
              />

              <Text
                style={
                  styles.successText
                }
              >
                {successMsg}
              </Text>

              <Pressable
                onPress={() =>
                  setSuccessMsg(
                    null
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={
                    colors.textMuted
                  }
                />
              </Pressable>
            </View>
          ) : null}

          {/* MISSING PROFILE */}
          {missingProfileFields.length >
          0 ? (
            <View
              style={
                styles.warningCard
              }
            >
              <View
                style={
                  styles.warningIcon
                }
              >
                <Ionicons
                  name="warning-outline"
                  size={19}
                  color={
                    colors.amber
                  }
                />
              </View>

              <Text
                style={
                  styles.warningTitle
                }
              >
                Complete your profile for
                more accurate recommendations.
              </Text>

              <Text
                style={
                  styles.warningDescription
                }
              >
                Some eligibility parameters are
                currently missing.
              </Text>

              <View
                style={
                  styles.missingList
                }
              >
                {missingProfileFields
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
                      <Text
                        style={
                          styles.missingChipText
                        }
                      >
                        •{' '}
                        {field.label}
                      </Text>
                    </View>
                  ))}
              </View>

              <Pressable
                onPress={
                  openProfile
                }
                style={({ pressed }) => [
                  styles.warningButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={
                    colors.white
                  }
                />

                <Text
                  style={
                    styles.warningButtonText
                  }
                >
                  Complete Profile
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* ACTIVE PROFILE */}
          {canonicalProfile ? (
            <View
              style={
                styles.profileCard
              }
            >
              <View
                style={
                  styles.profileTopRow
                }
              >
                <View
                  style={
                    styles.profileAvatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={19}
                    color={
                      colors.sky
                    }
                  />
                </View>

                <View
                  style={
                    styles.profileInfo
                  }
                >
                  <View
                    style={
                      styles.profileTitleRow
                    }
                  >
                    <Text
                      style={
                        styles.profileTitle
                      }
                    >
                      Saved Citizen Profile
                    </Text>

                    <View
                      style={[
                        styles.completionBadge,
                        profileCompletion >=
                          100
                          ? styles.completionFull
                          : profileCompletion >=
                            50
                          ? styles.completionMedium
                          : styles.completionLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.completionText,
                          profileCompletion >=
                            100
                            ? styles.completionFullText
                            : profileCompletion >=
                              50
                            ? styles.completionMediumText
                            : styles.completionLowText,
                        ]}
                      >
                        {profileCompletion}%
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.profileSummary
                    }
                    numberOfLines={
                      3
                    }
                  >
                    {[
                      canonicalProfile.gender,
                      canonicalProfile.age
                        ? `Age ${canonicalProfile.age}`
                        : null,
                      canonicalProfile.social_category
                        ? `Category ${canonicalProfile.social_category}`
                        : null,
                      canonicalProfile.annual_income
                        ? `Income ${formatIndianCurrency(
                            Number(
                              canonicalProfile.annual_income
                            )
                          )}`
                        : null,
                      canonicalProfile.state
                        ? formatEnum(
                            String(
                              canonicalProfile.state
                            )
                          )
                        : null,
                    ]
                      .filter(Boolean)
                      .join(
                        ' • '
                      )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.profileActions
                }
              >
                <AppButton
                  title="Recalculate Match"
                  onPress={
                    handleFindSchemes
                  }
                  loading={
                    isLoading
                  }
                  icon="refresh-outline"
                  variant="primary"
                  style={
                    styles.flexButton
                  }
                />

                <Pressable
                  onPress={
                    openProfile
                  }
                  style={({ pressed }) => [
                    styles.updateProfileButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.updateProfileText
                    }
                  >
                    Update Profile
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={
                      colors.blue
                    }
                  />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* MODE TITLE */}
          <Text
            style={
              styles.sectionTitle
            }
          >
            Evaluation Mode
          </Text>

          {/* MODE SELECTOR */}
          <View
            style={
              styles.modeList
            }
          >
            {/* PROFILE */}
            <Pressable
              disabled={
                !isAuthenticated
              }
              onPress={() =>
                setInputMode(
                  'PROFILE'
                )
              }
              style={({ pressed }) => [
                styles.modeCard,
                inputMode ===
                  'PROFILE' &&
                  styles.modeCardProfileSelected,
                !isAuthenticated &&
                  styles.modeDisabled,
                pressed &&
                  isAuthenticated &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.modeHeader
                }
              >
                <View
                  style={[
                    styles.modeIcon,
                    styles.modeIconBlue,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={
                      colors.blue
                    }
                  />
                </View>

                {inputMode ===
                'PROFILE' &&
                isAuthenticated ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={
                      colors.blue
                    }
                  />
                ) : null}
              </View>

              <Text
                style={
                  styles.modeTitle
                }
              >
                Saved Citizen Profile
              </Text>

              <Text
                style={
                  styles.modeDescription
                }
              >
                Uses your saved profile parameters.
              </Text>

              {!isAuthenticated ? (
                <Text
                  style={
                    styles.modeLocked
                  }
                >
                  🔒 Sign in first
                </Text>
              ) : null}
            </Pressable>

            {/* TYPE */}
            <Pressable
              onPress={() =>
                setInputMode(
                  'TYPE'
                )
              }
              style={({ pressed }) => [
                styles.modeCard,
                inputMode ===
                  'TYPE' &&
                  styles.modeCardPurpleSelected,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.modeHeader
                }
              >
                <View
                  style={[
                    styles.modeIcon,
                    styles.modeIconPurple,
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#7C3AED"
                  />
                </View>

                {inputMode ===
                'TYPE' ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#7C3AED"
                  />
                ) : null}
              </View>

              <Text
                style={
                  styles.modeTitle
                }
              >
                Natural Language
              </Text>

              <Text
                style={
                  styles.modeDescription
                }
              >
                Describe your situation in everyday language.
              </Text>
            </Pressable>

            {/* FORM */}
            <Pressable
              onPress={() =>
                setInputMode(
                  'FORM'
                )
              }
              style={({ pressed }) => [
                styles.modeCard,
                inputMode ===
                  'FORM' &&
                  styles.modeCardGreenSelected,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.modeHeader
                }
              >
                <View
                  style={[
                    styles.modeIcon,
                    styles.modeIconGreen,
                  ]}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={
                      colors.emerald
                    }
                  />
                </View>

                {inputMode ===
                'FORM' ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={
                      colors.emerald
                    }
                  />
                ) : null}
              </View>

              <Text
                style={
                  styles.modeTitle
                }
              >
                Quick Override Form
              </Text>

              <Text
                style={
                  styles.modeDescription
                }
              >
                Simulate another age, category, income or project.
              </Text>
            </Pressable>
          </View>

          {/* NATURAL LANGUAGE */}
          {inputMode ===
          'TYPE' ? (
            <View
              style={
                styles.inputCard
              }
            >
              <View
                style={
                  styles.inputCardHeader
                }
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={
                    colors.blue
                  }
                />

                <Text
                  style={
                    styles.inputCardTitle
                  }
                >
                  Describe your requirements
                </Text>
              </View>

              <Text
                style={
                  styles.inputHint
                }
              >
                Tell us about your age, state,
                category, income and what you want
                to do.
              </Text>

              <TextInput
                value={
                  userText
                }
                onChangeText={
                  setUserText
                }
                multiline
                textAlignVertical="top"
                placeholder="Example: I am a 28 year old woman from Uttar Pradesh..."
                placeholderTextColor={
                  colors.textMuted
                }
                style={
                  styles.textArea
                }
              />

              <View
                style={
                  styles.privacyRow
                }
              >
                <Ionicons
                  name="shield-checkmark"
                  size={17}
                  color={
                    colors.emerald
                  }
                />

                <Text
                  style={
                    styles.privacyText
                  }
                >
                  Natural language is parsed on-the-fly.
                </Text>
              </View>

              <AppButton
                title="Evaluate Eligibility & Rank"
                onPress={
                  handleFindSchemes
                }
                loading={
                  isLoading
                }
                icon="sparkles-outline"
                variant="secondary"
                style={
                  styles.fullButton
                }
              />
            </View>
          ) : null}

          {/* QUICK FORM */}
          {inputMode ===
          'FORM' ? (
            <View
              style={
                styles.inputCard
              }
            >
              <View
                style={
                  styles.simulationBanner
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={
                    colors.sky
                  }
                />

                <Text
                  style={
                    styles.simulationText
                  }
                >
                  Temporary simulation. These values
                  do not overwrite your saved profile
                  unless you choose Update My Profile.
                </Text>
              </View>

              <Text
                style={
                  styles.formSectionTitle
                }
              >
                Applicant Details
              </Text>

              <View
                style={
                  styles.formGrid
                }
              >
                <FormField
                  label="Applicant Age"
                  value={
                    formAge
                  }
                  onChangeText={
                    setFormAge
                  }
                  keyboardType="numeric"
                />

                <SelectField
                  label="Gender"
                  value={
                    formGender
                  }
                  options={[
                    [
                      'FEMALE',
                      'Female',
                    ],
                    [
                      'MALE',
                      'Male',
                    ],
                    [
                      'TRANSGENDER',
                      'Transgender',
                    ],
                    [
                      'OTHER',
                      'Other',
                    ],
                  ]}
                  onChange={
                    setFormGender
                  }
                />

                <SelectField
                  label="State"
                  value={
                    formState
                  }
                  options={[
                    [
                      'ALL_INDIA',
                      'All India / Central',
                    ],
                    [
                      'UTTAR_PRADESH',
                      'Uttar Pradesh',
                    ],
                    [
                      'MAHARASHTRA',
                      'Maharashtra',
                    ],
                    [
                      'BIHAR',
                      'Bihar',
                    ],
                    [
                      'WEST_BENGAL',
                      'West Bengal',
                    ],
                    [
                      'MADHYA_PRADESH',
                      'Madhya Pradesh',
                    ],
                    [
                      'TAMIL_NADU',
                      'Tamil Nadu',
                    ],
                    [
                      'RAJASTHAN',
                      'Rajasthan',
                    ],
                    [
                      'KARNATAKA',
                      'Karnataka',
                    ],
                    [
                      'GUJARAT',
                      'Gujarat',
                    ],
                    [
                      'DELHI',
                      'Delhi',
                    ],
                  ]}
                  onChange={
                    setFormState
                  }
                />

                <SelectField
                  label="Social Category"
                  value={
                    formSocialCategory
                  }
                  options={[
                    [
                      'SC',
                      'Scheduled Caste (SC)',
                    ],
                    [
                      'OBC',
                      'Other Backward Class (OBC)',
                    ],
                    [
                      'ST',
                      'Scheduled Tribe (ST)',
                    ],
                    [
                      'MINORITY',
                      'Notified Minority Community',
                    ],
                    [
                      'GENERAL',
                      'General / Unreserved',
                    ],
                  ]}
                  onChange={
                    setFormSocialCategory
                  }
                />

                <SelectField
                  label="Annual Family Income"
                  value={
                    formIncomeSlab
                  }
                  options={[
                    [
                      '90000',
                      'Below ₹1 Lakh',
                    ],
                    [
                      '180000',
                      '₹1 Lakh – ₹2 Lakh',
                    ],
                    [
                      '300000',
                      '₹2 Lakh – ₹3 Lakh',
                    ],
                    [
                      '500000',
                      '₹3 Lakh – ₹5 Lakh',
                    ],
                    [
                      '1000000',
                      'Above ₹5 Lakh',
                    ],
                  ]}
                  onChange={
                    setFormIncomeSlab
                  }
                />

                <SelectField
                  label="Project Cost"
                  value={
                    formProjectCostSlab
                  }
                  options={[
                    [
                      '50000',
                      'Up to ₹50,000',
                    ],
                    [
                      '100000',
                      '₹1 Lakh',
                    ],
                    [
                      '500000',
                      '₹5 Lakh',
                    ],
                    [
                      '1500000',
                      '₹15 Lakh',
                    ],
                    [
                      '5000000',
                      'Above ₹50 Lakh',
                    ],
                  ]}
                  onChange={
                    setFormProjectCostSlab
                  }
                />

                <SelectField
                  label="Primary Need"
                  value={
                    formNeed
                  }
                  options={[
                    [
                      'START_BUSINESS',
                      'Start Business',
                    ],
                    [
                      'EXPAND_BUSINESS',
                      'Expand Business',
                    ],
                    [
                      'EDUCATION',
                      'Education',
                    ],
                    [
                      'SKILL_TRAINING',
                      'Skill Training',
                    ],
                    [
                      'AGRICULTURE',
                      'Agriculture',
                    ],
                    [
                      'HOUSING',
                      'Housing',
                    ],
                  ]}
                  onChange={
                    setFormNeed
                  }
                />

                <SelectField
                  label="Business Stage"
                  value={
                    formBusinessStage
                  }
                  options={[
                    [
                      'NEW',
                      'New',
                    ],
                    [
                      'CONCEPT',
                      'Concept',
                    ],
                    [
                      'EXISTING',
                      'Existing',
                    ],
                  ]}
                  onChange={
                    setFormBusinessStage
                  }
                />
              </View>

              <Pressable
                onPress={() =>
                  setFormLoanRequired(
                    (value) =>
                      !value
                  )
                }
                style={
                  styles.loanToggle
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formLoanRequired &&
                      styles.checkboxChecked,
                  ]}
                >
                  {formLoanRequired ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={
                        colors.white
                      }
                    />
                  ) : null}
                </View>

                <Text
                  style={
                    styles.loanToggleText
                  }
                >
                  I need a loan for this project
                </Text>
              </Pressable>

              <View
                style={
                  styles.formActions
                }
              >
                <Pressable
                  onPress={
                    handleResetToStoredProfile
                  }
                  style={({ pressed }) => [
                    styles.resetButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.resetButtonText
                    }
                  >
                    Reset
                  </Text>
                </Pressable>

                {isAuthenticated ? (
                  <Pressable
                    onPress={
                      handleSaveFormToProfile
                    }
                    disabled={
                      isSavingProfile
                    }
                    style={({ pressed }) => [
                      styles.saveProfileButton,
                      pressed &&
                        styles.pressed,
                      isSavingProfile &&
                        styles.disabled,
                    ]}
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          colors.white
                        }
                      />
                    ) : (
                      <Ionicons
                        name="person-add-outline"
                        size={17}
                        color={
                          colors.white
                        }
                      />
                    )}

                    <Text
                      style={
                        styles.saveProfileText
                      }
                    >
                      Update Profile
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <AppButton
                title="Evaluate Scheme Eligibility & Rank"
                onPress={
                  handleFindSchemes
                }
                loading={
                  isLoading
                }
                icon="search-outline"
                variant="secondary"
                style={
                  styles.fullButton
                }
              />
            </View>
          ) : null}

          {/* RESULTS */}
          {standardResult ? (
            <View
              style={
                styles.resultsSection
              }
            >
              <View
                style={
                  styles.resultsHeader
                }
              >
                <View
                  style={
                    styles.resultsTitleRow
                  }
                >
                  <View
                    style={
                      styles.awardIcon
                    }
                  >
                    <Ionicons
                      name="trophy-outline"
                      size={20}
                      color={
                        colors.saffron
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.resultsHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.resultsTitle
                      }
                    >
                      Scheme Eligibility & Rankings
                    </Text>

                    <Text
                      style={
                        styles.resultsSubtitle
                      }
                    >
                      Evaluated{' '}
                      {
                        standardResult.evaluated_scheme_count
                      }{' '}
                      official schemes
                    </Text>
                  </View>
                </View>
              </View>

              {/* COUNTERS */}
              <View
                style={
                  styles.counterGrid
                }
              >
                <SummaryCounter
                  value={
                    standardResult.eligible_scheme_count
                  }
                  label="Eligible"
                  icon="checkmark-circle"
                  background={
                    colors.emeraldLight
                  }
                  iconColor={
                    colors.emerald
                  }
                  textColor="#047857"
                />

                <SummaryCounter
                  value={
                    standardResult.insufficient_info_scheme_count
                  }
                  label="Info Needed"
                  icon="warning-outline"
                  background={
                    colors.amberLight
                  }
                  iconColor={
                    colors.amber
                  }
                  textColor="#B45309"
                />

                <SummaryCounter
                  value={
                    standardResult.excluded_scheme_count
                  }
                  label="Excluded"
                  icon="close-circle-outline"
                  background={
                    colors.roseLight
                  }
                  iconColor={
                    colors.rose
                  }
                  textColor="#BE123C"
                />
              </View>

              {/* FILTERS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterScroll
                }
              >
                <FilterButton
                  label="Why You Qualify"
                  count={
                    standardResult.eligible_scheme_count
                  }
                  active={
                    activeTab ===
                    'ELIGIBLE'
                  }
                  color={
                    colors.emerald
                  }
                  onPress={() =>
                    setActiveTab(
                      'ELIGIBLE'
                    )
                  }
                  icon="checkmark-circle"
                />

                <FilterButton
                  label="More Info"
                  count={
                    standardResult.insufficient_info_scheme_count
                  }
                  active={
                    activeTab ===
                    'INSUFFICIENT'
                  }
                  color={
                    colors.amber
                  }
                  onPress={() =>
                    setActiveTab(
                      'INSUFFICIENT'
                    )
                  }
                  icon="warning-outline"
                />

                <FilterButton
                  label="Why Not"
                  count={
                    standardResult.excluded_scheme_count
                  }
                  active={
                    activeTab ===
                    'INELIGIBLE'
                  }
                  color={
                    colors.rose
                  }
                  onPress={() =>
                    setActiveTab(
                      'INELIGIBLE'
                    )
                  }
                  icon="close-circle-outline"
                />

                <FilterButton
                  label="All"
                  count={
                    standardResult.evaluated_scheme_count
                  }
                  active={
                    activeTab ===
                    'ALL'
                  }
                  color={
                    colors.text
                  }
                  onPress={() =>
                    setActiveTab(
                      'ALL'
                    )
                  }
                  icon="document-text-outline"
                />
              </ScrollView>

              {/* EMPTY */}
              {displayedItems.length ===
              0 ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={38}
                    color={
                      colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No schemes found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    {emptyMessage}
                  </Text>
                </View>
              ) : (
                displayedItems.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <RecommendationCard
                      key={`${recommendation.scheme_id}-${index}`}
                      recommendation={
                        recommendation
                      }
                      index={
                        index
                      }
                      expanded={
                        !!expandedDetails[
                          recommendation.scheme_id
                        ]
                      }
                      onToggleDetails={() =>
                        toggleDetails(
                          recommendation.scheme_id
                        )
                      }
                      onOpenScheme={() =>
                        openScheme(
                          recommendation.scheme_id
                        )
                      }
                      onCalculate={() =>
                        openCalculator(
                          recommendation.scheme_id,
                          Number(
                            canonicalProfile?.requested_loan_amount ||
                              canonicalProfile?.project_cost ||
                              formProjectCostSlab ||
                              0
                          )
                        )
                      }
                      onFindPartner={() =>
                        openPartner(
                          recommendation.scheme_id
                        )
                      }
                      onOfficialPortal={() =>
                        openOfficialPortal(
                          recommendation
                        )
                      }
                    />
                  )
                )
              )}
            </View>
          ) : null}

          {/* Bottom spacing */}
          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ============================================================
 * FORM FIELD
 * ========================================================== */

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'email-address'
    | 'phone-pad';
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: FormFieldProps) {
  return (
    <View
      style={
        styles.formField
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        keyboardType={
          keyboardType
        }
        style={
          styles.input
        }
        placeholderTextColor={
          colors.textMuted
        }
      />
    </View>
  );
}

/* ============================================================
 * SELECT FIELD
 * ========================================================== */

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<
    [string, string]
  >;
  onChange: (
    value: string
  ) => void;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const selected =
    options.find(
      ([optionValue]) =>
        optionValue === value
    )?.[1] || value;

  return (
    <View
      style={
        styles.formField
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <Pressable
        onPress={() =>
          setExpanded(
            (previous) =>
              !previous
          )
        }
        style={({ pressed }) => [
          styles.selectButton,
          pressed &&
            styles.pressed,
        ]}
      >
        <Text
          style={
            styles.selectText
          }
          numberOfLines={1}
        >
          {selected}
        </Text>

        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={17}
          color={
            colors.textMuted
          }
        />
      </Pressable>

      {expanded ? (
        <View
          style={
            styles.optionsBox
          }
        >
          {options.map(
            ([
              optionValue,
              optionLabel,
            ]) => (
              <Pressable
                key={
                  optionValue
                }
                onPress={() => {
                  onChange(
                    optionValue
                  );
                  setExpanded(
                    false
                  );
                }}
                style={[
                  styles.optionRow,
                  optionValue ===
                    value &&
                    styles.selectedOptionRow,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    optionValue ===
                      value &&
                      styles.selectedOptionText,
                  ]}
                >
                  {optionLabel}
                </Text>

                {optionValue ===
                value ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={
                      colors.blue
                    }
                  />
                ) : null}
              </Pressable>
            )
          )}
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================
 * SUMMARY COUNTER
 * ========================================================== */

interface SummaryCounterProps {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  iconColor: string;
  textColor: string;
}

function SummaryCounter({
  value,
  label,
  icon,
  background,
  iconColor,
  textColor,
}: SummaryCounterProps) {
  return (
    <View
      style={[
        styles.summaryCounter,
        {
          backgroundColor:
            background,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={
          iconColor
        }
      />

      <Text
        style={[
          styles.summaryCounterValue,
          {
            color:
              textColor,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.summaryCounterLabel,
          {
            color:
              textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
 * FILTER BUTTON
 * ========================================================== */

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function FilterButton({
  label,
  count,
  active,
  color,
  icon,
  onPress,
}: FilterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && {
          backgroundColor:
            color,
          borderColor:
            color,
        },
        pressed &&
          styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={15}
        color={
          active
            ? colors.white
            : color
        }
      />

      <Text
        style={[
          styles.filterButtonText,
          active &&
            styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.filterCount,
          active &&
            styles.filterCountActive,
        ]}
      >
        {count}
      </Text>
    </Pressable>
  );
}

/* ============================================================
 * RECOMMENDATION CARD
 * ========================================================== */

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  index: number;
  expanded: boolean;
  onToggleDetails: () => void;
  onOpenScheme: () => void;
  onCalculate: () => void;
  onFindPartner: () => void;
  onOfficialPortal: () => void;
}

function RecommendationCard({
  recommendation,
  index,
  expanded,
  onToggleDetails,
  onOpenScheme,
  onCalculate,
  onFindPartner,
  onOfficialPortal,
}: RecommendationCardProps) {
  const score =
    Math.round(
      Number(
        recommendation.score || 50
      )
    );

  const matchLabel =
    getMatchLabelLocal(
      score
    );

  const status =
    recommendation.eligibility_status;

  const isEligible =
    status === 'ELIGIBLE';

  const isInsufficient =
    status ===
    'INSUFFICIENT_INFORMATION';

  const isIneligible =
    status === 'INELIGIBLE';

  const reasons =
    (
      recommendation.matched_rules &&
      recommendation.matched_rules.length >
        0
        ? recommendation.matched_rules
        : recommendation.eligibility_reasons ||
          []
    )
      .map(cleanReasonText)
      .filter(Boolean);

  const recommendationReasons =
    (
      recommendation.recommendation_reasons ||
      []
    )
      .map(cleanReasonText)
      .filter(Boolean);

  const eligibleReasons =
    [
      ...reasons,
      ...recommendationReasons,
    ];

  const failedReasons =
    (
      recommendation.failed_rules &&
      recommendation.failed_rules.length >
        0
        ? recommendation.failed_rules
        : recommendation.eligibility_reasons ||
          []
    )
      .map(cleanReasonText)
      .filter(Boolean);

  const missingReasons =
    (
      recommendation.missing_information &&
      recommendation.missing_information.length >
        0
        ? recommendation.missing_information
        : [
            'Additional demographic or financial parameters required.',
          ]
    )
      .map(cleanReasonText)
      .filter(Boolean);

  const visibleReasons =
    (
      isEligible
        ? eligibleReasons
        : isIneligible
        ? failedReasons
        : missingReasons
    ).slice(0, 3);

  const remainingReasons =
    (
      isEligible
        ? eligibleReasons
        : isIneligible
        ? failedReasons
        : missingReasons
    ).slice(3);

  const officialUrl =
    recommendation.application_url ||
    recommendation.official_portal ||
    recommendation.official_source_url;

  const hasLoan =
    recommendation.is_credit_scheme !==
      false &&
    (
      recommendation.max_loan_amount !==
        undefined &&
      recommendation.max_loan_amount !==
        null ||
      recommendation.interest_rate !==
        undefined &&
      recommendation.interest_rate !==
        null
    );

  const statusColor =
    isEligible
      ? colors.emerald
      : isInsufficient
      ? colors.amber
      : colors.rose;

  return (
    <View
      style={[
        styles.recommendationCard,
        isEligible &&
          styles.eligibleCard,
        isInsufficient &&
          styles.insufficientCard,
        isIneligible &&
          styles.ineligibleCard,
      ]}
    >
      {/* CARD HEADER */}
      <View
        style={
          styles.recommendationHeader
        }
      >
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor:
                statusColor,
            },
          ]}
        >
          <Text
            style={
              styles.rankText
            }
          >
            #
            {recommendation.rank ||
              index + 1}
          </Text>
        </View>

        <View
          style={
            styles.recommendationHeaderContent
          }
        >
          <Text
            style={
              styles.recommendationTitle
            }
            numberOfLines={3}
          >
            {
              recommendation.scheme_name
            }
          </Text>

          <View
            style={
              styles.schemeMeta
            }
          >
            <View
              style={
                styles.schemeIdBadge
              }
            >
              <Text
                style={
                  styles.schemeIdText
                }
              >
                {
                  recommendation.scheme_id
                }
              </Text>
            </View>

            {recommendation.is_direct_portal_scheme ? (
              <View
                style={
                  styles.directPortalBadge
                }
              >
                <Text
                  style={
                    styles.directPortalText
                  }
                >
                  Direct Govt Portal
                </Text>
              </View>
            ) : null}
          </View>

          {recommendation.ministry ? (
            <Text
              style={
                styles.ministryText
              }
              numberOfLines={2}
            >
              {recommendation.ministry}
            </Text>
          ) : null}

          <View
            style={
              styles.statusFitRow
            }
          >
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    isEligible
                      ? colors.emeraldLight
                      : isInsufficient
                      ? colors.amberLight
                      : colors.roseLight,
                },
              ]}
            >
              <Ionicons
                name={
                  isEligible
                    ? 'checkmark-circle'
                    : isInsufficient
                    ? 'warning-outline'
                    : 'close-circle-outline'
                }
                size={13}
                color={
                  statusColor
                }
              />

              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      statusColor,
                  },
                ]}
              >
                {isEligible
                  ? 'Eligible'
                  : isInsufficient
                  ? 'More Info Needed'
                  : 'Not Eligible'}
              </Text>
            </View>

            <View
              style={
                styles.fitBadge
              }
            >
              <Text
                style={
                  styles.fitScore
                }
              >
                {score}%
              </Text>

              <Text
                style={
                  styles.fitLabel
                }
              >
                {matchLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* REASON PANEL */}
      <View
        style={[
          styles.reasonPanel,
          {
            backgroundColor:
              isEligible
                ? '#F0FDF4'
                : isInsufficient
                ? '#FFFBEB'
                : '#FFF1F2',
            borderColor:
              isEligible
                ? '#BBF7D0'
                : isInsufficient
                ? '#FDE68A'
                : '#FECDD3',
          },
        ]}
      >
        <View
          style={
            styles.reasonHeader
          }
        >
          <View
            style={
              styles.reasonTitleRow
            }
          >
            <Ionicons
              name={
                isEligible
                  ? 'checkmark-circle'
                  : isInsufficient
                  ? 'warning-outline'
                  : 'close-circle-outline'
              }
              size={18}
              color={
                statusColor
              }
            />

            <Text
              style={[
                styles.reasonTitle,
                {
                  color:
                    isEligible
                      ? '#065F46'
                      : isInsufficient
                      ? '#78350F'
                      : '#881337',
                },
              ]}
            >
              {isEligible
                ? 'Why You Qualify'
                : isInsufficient
                ? 'Missing Information'
                : "Why You Don't Qualify"}
            </Text>
          </View>

          {(
            isEligible
              ? eligibleReasons
              : isIneligible
              ? failedReasons
              : missingReasons
          ).length > 0 ? (
            <View
              style={
                styles.criteriaCount
              }
            >
              <Text
                style={
                  styles.criteriaCountText
                }
              >
                {
                  (
                    isEligible
                      ? eligibleReasons
                      : isIneligible
                      ? failedReasons
                      : missingReasons
                  ).length
                }
              </Text>
            </View>
          ) : null}
        </View>

        {visibleReasons.map(
          (
            reason,
            reasonIndex
          ) => (
            <View
              key={
                `${recommendation.scheme_id}-reason-${reasonIndex}`
              }
              style={
                styles.reasonRow
              }
            >
              <Text
                style={[
                  styles.reasonBullet,
                  {
                    color:
                      statusColor,
                  },
                ]}
              >
                {isEligible
                  ? '✓'
                  : isInsufficient
                  ? '⚠'
                  : '✕'}
              </Text>

              <Text
                style={
                  styles.reasonText
                }
              >
                {reason}
              </Text>
            </View>
          )
        )}

        {expanded &&
        remainingReasons.length >
          0 ? (
          <View
            style={
              styles.remainingReasons
            }
          >
            {remainingReasons.map(
              (
                reason,
                reasonIndex
              ) => (
                <View
                  key={
                    `remaining-${recommendation.scheme_id}-${reasonIndex}`
                  }
                  style={
                    styles.reasonRow
                  }
                >
                  <Text
                    style={[
                      styles.reasonBullet,
                      {
                        color:
                          statusColor,
                      },
                    ]}
                  >
                    {isEligible
                      ? '✓'
                      : isInsufficient
                      ? '⚠'
                      : '✕'}
                  </Text>

                  <Text
                    style={
                      styles.reasonText
                    }
                  >
                    {reason}
                  </Text>
                </View>
              )
            )}
          </View>
        ) : null}

        {(
          remainingReasons.length >
            0 ||
          (
            recommendation.score_breakdown ||
            []
          ).length > 0
        ) ? (
          <Pressable
            onPress={
              onToggleDetails
            }
            style={({ pressed }) => [
              styles.breakdownButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.breakdownButtonText,
                {
                  color:
                    statusColor,
                },
              ]}
            >
              {expanded
                ? 'Hide Criteria Breakdown'
                : `View Criteria Breakdown${
                    remainingReasons.length >
                    0
                      ? ` (+${remainingReasons.length} more)`
                      : ''
                  }`}
            </Text>

            <Ionicons
              name={
                expanded
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={16}
              color={
                statusColor
              }
            />
          </Pressable>
        ) : null}
      </View>

      {/* FULL BREAKDOWN */}
      {expanded &&
      recommendation.score_breakdown &&
      recommendation.score_breakdown
        .length > 0 ? (
        <View
          style={
            styles.breakdownPanel
          }
        >
          <View
            style={
              styles.breakdownHeader
            }
          >
            <View
              style={
                styles.breakdownTitleRow
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={
                  colors.blue
                }
              />

              <Text
                style={
                  styles.breakdownTitle
                }
              >
                Full Eligibility & Scoring
              </Text>
            </View>

            <Text
              style={
                styles.breakdownTotal
              }
            >
              {Number(
                recommendation.score ||
                  0
              ).toFixed(1)}{' '}
              / 100
            </Text>
          </View>

          {recommendation.score_breakdown.map(
            (
              breakdown,
              breakdownIndex
            ) => {
              const match =
                breakdown.result ===
                'MATCH';

              const unmet =
                breakdown.result ===
                'NO_MATCH';

              const pending =
                breakdown.result ===
                  'PARTIAL_MATCH' ||
                breakdown.result ===
                  'NOT_EVALUATED';

              return (
                <View
                  key={
                    `breakdown-${breakdownIndex}`
                  }
                  style={[
                    styles.breakdownItem,
                    {
                      backgroundColor:
                        match
                          ? '#F0FDF4'
                          : unmet
                          ? '#FFF1F2'
                          : '#FFFBEB',
                      borderColor:
                        match
                          ? '#BBF7D0'
                          : unmet
                          ? '#FECDD3'
                          : '#FDE68A',
                    },
                  ]}
                >
                  <View
                    style={
                      styles.breakdownContent
                    }
                  >
                    <View
                      style={
                        styles.breakdownDimensionRow
                      }
                    >
                      <View
                        style={[
                          styles.breakdownStatusBadge,
                          {
                            backgroundColor:
                              match
                                ? colors.emeraldLight
                                : unmet
                                ? colors.roseLight
                                : colors.amberLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.breakdownStatusText,
                            {
                              color:
                                match
                                  ? '#047857'
                                  : unmet
                                  ? '#BE123C'
                                  : '#B45309',
                            },
                          ]}
                        >
                          {match
                            ? '✓ Matched'
                            : unmet
                            ? '! Unmet'
                            : '○ Verify'}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.breakdownDimension
                        }
                      >
                        {formatEnum(
                          breakdown.dimension
                        )}
                      </Text>
                    </View>

                    {breakdown.reason ? (
                      <Text
                        style={
                          styles.breakdownReason
                        }
                      >
                        {cleanReasonText(
                          breakdown.reason
                        )}
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.breakdownScore,
                      {
                        color:
                          match
                            ? colors.emerald
                            : unmet
                            ? colors.rose
                            : colors.amber,
                      },
                    ]}
                  >
                    +
                    {Number(
                      breakdown.score
                    ).toFixed(1)}
                    {' / '}
                    {Number(
                      breakdown.max_weight
                    ).toFixed(1)}
                  </Text>
                </View>
              );
            }
          )}

          {recommendation.source_document ? (
            <View
              style={
                styles.sourceRow
              }
            >
              <Ionicons
                name="document-text-outline"
                size={15}
                color={
                  colors.textMuted
                }
              />

              <Text
                style={
                  styles.sourceText
                }
                numberOfLines={2}
              >
                Official Rules Source:{' '}
                {
                  recommendation.source_document
                }
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* DISCLAIMER */}
      <View
        style={
          styles.disclaimer
        }
      >
        <Ionicons
          name="information-circle-outline"
          size={15}
          color={
            colors.sky
          }
        />

        <Text
          style={
            styles.disclaimerText
          }
        >
          Eligibility guidance only. Final eligibility
          and approval are determined by the concerned
          government authority.
        </Text>
      </View>

      {/* ACTIONS */}
      <View
        style={
          styles.actions
        }
      >
        <Pressable
          onPress={
            onOpenScheme
          }
          style={({ pressed }) => [
            styles.primaryAction,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={17}
            color={
              colors.white
            }
          />

          <Text
            style={
              styles.primaryActionText
            }
          >
            View Scheme
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color={
              colors.white
            }
          />
        </Pressable>

        <View
          style={
            styles.actionRow
          }
        >
          {hasLoan ? (
            <Pressable
              onPress={
                onCalculate
              }
              style={({ pressed }) => [
                styles.secondaryAction,
                styles.emiAction,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="calculator-outline"
                size={17}
                color={
                  colors.emerald
                }
              />

              <Text
                style={
                  styles.emiActionText
                }
              >
                Calculate EMI
              </Text>
            </Pressable>
          ) : null}

          {isEligible ? (
            <Pressable
              onPress={
                onFindPartner
              }
              style={({ pressed }) => [
                styles.secondaryAction,
                styles.partnerAction,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={17}
                color={
                  colors.indigo
                }
              />

              <Text
                style={
                  styles.partnerActionText
                }
              >
                Find Partner
              </Text>
            </Pressable>
          ) : null}
        </View>

        {officialUrl ? (
          <Pressable
            onPress={
              onOfficialPortal
            }
            style={({ pressed }) => [
              styles.portalAction,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.portalActionText
              }
            >
              Apply on Official Portal
            </Text>

            <Ionicons
              name="open-outline"
              size={16}
              color={
                colors.white
              }
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================
 * LOCAL HELPERS
 * ========================================================== */

const getMatchLabelLocal = (
  score: number
) => {
  if (score >= 85) {
    return 'Strong Fit';
  }

  if (score >= 70) {
    return 'Good Fit';
  }

  if (score >= 50) {
    return 'Moderate Fit';
  }

  return 'Basic Fit';
};

/* ============================================================
 * STYLES
 * ========================================================== */

const styles = StyleSheet.create({
  screen: {
    backgroundColor:
      colors.background,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal:
      spacing.lg,
    paddingBottom: 34,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  disabled: {
    opacity: 0.55,
  },

  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* HERO */

  hero: {
    backgroundColor:
      colors.blueDark,
    borderRadius:
      radius.xxl,
    padding:
      spacing.xl,
    marginBottom:
      spacing.lg,
    borderBottomWidth: 4,
    borderBottomColor:
      colors.saffron,
    overflow: 'hidden',
    ...shadows.elevated,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor:
      'rgba(215,131,45,0.18)',
    borderWidth: 1,
    borderColor:
      'rgba(215,131,45,0.42)',
    borderRadius:
      radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },

  heroBadgeText: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },

  heroTitle: {
    color:
      colors.white,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  heroTitleSecond: {
    color:
      colors.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    marginBottom: 10,
  },

  heroDescription: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 17,
  },

  heroProfileButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius:
      radius.lg,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.2)',
    backgroundColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  heroProfileButtonText: {
    color:
      colors.white,
    fontSize: 12,
    fontWeight: '800',
  },

  /* BANNERS */

  errorBanner: {
    backgroundColor:
      colors.roseLight,
    borderWidth: 1,
    borderColor:
      '#FECDD3',
    borderRadius:
      radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },

  errorText: {
    flex: 1,
    color: '#9F1239',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  successBanner: {
    backgroundColor:
      colors.emeraldLight,
    borderWidth: 1,
    borderColor:
      '#A7F3D0',
    borderRadius:
      radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },

  successText: {
    flex: 1,
    color: '#047857',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  warningCard: {
    backgroundColor:
      colors.amberLight,
    borderWidth: 1,
    borderColor:
      '#FCD34D',
    borderRadius:
      radius.xl,
    padding: 16,
    marginBottom: 14,
  },

  warningIcon: {
    width: 38,
    height: 38,
    borderRadius:
      radius.md,
    backgroundColor:
      '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  warningTitle: {
    color: '#78350F',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  warningDescription: {
    color: '#92400E',
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
  },

  missingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 12,
  },

  missingChip: {
    backgroundColor:
      colors.white,
    borderWidth: 1,
    borderColor:
      '#FCD34D',
    borderRadius:
      radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  missingChipText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '700',
  },

  warningButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.amber,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  warningButtonText: {
    color:
      colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  /* PROFILE */

  profileCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.xl,
    padding: 15,
    marginBottom: 20,
    ...shadows.card,
  },

  profileTopRow: {
    flexDirection: 'row',
    gap: 11,
  },

  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.skyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfo: {
    flex: 1,
  },

  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  profileTitle: {
    flex: 1,
    color:
      colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
  },

  completionBadge: {
    borderRadius:
      radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },

  completionFull: {
    backgroundColor:
      colors.emeraldLight,
    borderColor:
      '#A7F3D0',
  },

  completionMedium: {
    backgroundColor:
      colors.amberLight,
    borderColor:
      '#FDE68A',
  },

  completionLow: {
    backgroundColor:
      '#F1F5F9',
    borderColor:
      colors.border,
  },

  completionText: {
    fontSize: 9,
    fontWeight: '900',
  },

  completionFullText: {
    color:
      '#047857',
  },

  completionMediumText: {
    color:
      '#B45309',
  },

  completionLowText: {
    color:
      colors.textSecondary,
  },

  profileSummary: {
    color:
      colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 4,
  },

  profileActions: {
    marginTop: 13,
    gap: 8,
  },

  flexButton: {
    minHeight: 45,
  },

  updateProfileButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor:
      colors.white,
  },

  updateProfileText: {
    color:
      colors.blue,
    fontSize: 11,
    fontWeight: '800',
  },

  /* SECTION */

  sectionTitle: {
    color:
      colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },

  modeList: {
    gap: 9,
    marginBottom: 16,
  },

  modeCard: {
    backgroundColor:
      colors.white,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.xl,
    padding: 15,
    ...shadows.card,
  },

  modeCardProfileSelected: {
    backgroundColor:
      '#F0F9FF',
    borderColor:
      colors.blue,
    borderWidth: 1.5,
  },

  modeCardPurpleSelected: {
    backgroundColor:
      '#FAF5FF',
    borderColor:
      '#7C3AED',
    borderWidth: 1.5,
  },

  modeCardGreenSelected: {
    backgroundColor:
      colors.emeraldLight,
    borderColor:
      colors.emerald,
    borderWidth: 1.5,
  },

  modeDisabled: {
    opacity: 0.62,
    backgroundColor:
      '#F8FAFC',
  },

  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 9,
  },

  modeIcon: {
    width: 37,
    height: 37,
    borderRadius:
      radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeIconBlue: {
    backgroundColor:
      colors.blueLight,
  },

  modeIconPurple: {
    backgroundColor:
      '#F3E8FF',
  },

  modeIconGreen: {
    backgroundColor:
      colors.emeraldLight,
  },

  modeTitle: {
    color:
      colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  modeDescription: {
    color:
      colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  modeLocked: {
    color:
      colors.rose,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  /* INPUT */

  inputCard: {
    backgroundColor:
      colors.white,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.xl,
    padding: 16,
    marginBottom: 20,
    ...shadows.card,
  },

  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inputCardTitle: {
    color:
      colors.text,
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },

  inputHint: {
    color:
      colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 12,
  },

  textArea: {
    minHeight: 150,
    borderWidth: 1,
    borderColor:
      '#CBD5E1',
    borderRadius:
      radius.lg,
    backgroundColor:
      colors.white,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color:
      colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    marginBottom: 12,
  },

  privacyText: {
    color:
      colors.textMuted,
    fontSize: 10.5,
    flex: 1,
  },

  fullButton: {
    width: '100%',
  },

  simulationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor:
      colors.skyLight,
    borderWidth: 1,
    borderColor:
      '#BAE6FD',
    borderRadius:
      radius.md,
    padding: 11,
    marginBottom: 16,
  },

  simulationText: {
    flex: 1,
    color:
      '#075985',
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: '600',
  },

  formSectionTitle: {
    color:
      colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 11,
  },

  formGrid: {
    gap: 12,
  },

  formField: {
    width: '100%',
  },

  fieldLabel: {
    color:
      colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor:
      '#CBD5E1',
    borderRadius:
      radius.md,
    backgroundColor:
      colors.white,
    paddingHorizontal: 12,
    color:
      colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  selectButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor:
      '#CBD5E1',
    borderRadius:
      radius.md,
    backgroundColor:
      colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 8,
  },

  selectText: {
    flex: 1,
    color:
      colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  optionsBox: {
    marginTop: 5,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.md,
    overflow: 'hidden',
    backgroundColor:
      colors.white,
  },

  optionRow: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      '#F1F5F9',
  },

  selectedOptionRow: {
    backgroundColor:
      colors.blueLight,
  },

  optionText: {
    flex: 1,
    color:
      colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },

  selectedOptionText: {
    color:
      '#0369A1',
    fontWeight: '800',
  },

  loanToggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor:
      '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor:
      colors.emerald,
    borderColor:
      colors.emerald,
  },

  loanToggleText: {
    color:
      colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },

  resetButton: {
    flex: 1,
    minHeight: 45,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.md,
    backgroundColor:
      '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  resetButtonText: {
    color:
      colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  saveProfileButton: {
    flex: 1.5,
    minHeight: 45,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  saveProfileText: {
    color:
      colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  /* RESULTS */

  resultsSection: {
    marginTop: 4,
  },

  resultsHeader: {
    marginBottom: 13,
  },

  resultsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  awardIcon: {
    width: 42,
    height: 42,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.saffronLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultsHeaderText: {
    flex: 1,
  },

  resultsTitle: {
    color:
      colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  resultsSubtitle: {
    color:
      colors.textMuted,
    fontSize: 10.5,
    marginTop: 2,
  },

  counterGrid: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },

  summaryCounter: {
    flex: 1,
    minHeight: 76,
    borderRadius:
      radius.md,
    padding: 9,
    justifyContent:
      'center',
    alignItems: 'center',
  },

  summaryCounterValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  summaryCounterLabel: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 1,
  },

  filterScroll: {
    gap: 7,
    paddingBottom: 12,
  },

  filterButton: {
    minHeight: 40,
    borderRadius:
      radius.pill,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      '#F1F5F9',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  filterButtonText: {
    color:
      colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },

  filterButtonTextActive: {
    color:
      colors.white,
  },

  filterCount: {
    color:
      colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },

  filterCountActive: {
    color:
      colors.white,
  },

  emptyCard: {
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor:
      '#CBD5E1',
    borderRadius:
      radius.xl,
    padding: 30,
    alignItems: 'center',
    marginTop: 3,
  },

  emptyTitle: {
    color:
      colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },

  emptyText: {
    color:
      colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },

  /* RECOMMENDATION CARD */

  recommendationCard: {
    backgroundColor:
      colors.white,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.xl,
    padding: 14,
    marginBottom: 14,
    ...shadows.card,
  },

  eligibleCard: {
    borderColor:
      '#A7F3D0',
  },

  insufficientCard: {
    borderColor:
      '#FDE68A',
  },

  ineligibleCard: {
    borderColor:
      '#E2E8F0',
  },

  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  rankBadge: {
    width: 35,
    height: 35,
    borderRadius:
      radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  rankText: {
    color:
      colors.white,
    fontSize: 12,
    fontWeight: '900',
  },

  recommendationHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  recommendationTitle: {
    color:
      colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  schemeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },

  schemeIdBadge: {
    backgroundColor:
      '#F1F5F9',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  schemeIdText: {
    color:
      colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
  },

  directPortalBadge: {
    backgroundColor:
      colors.skyLight,
    borderRadius:
      radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  directPortalText: {
    color:
      '#075985',
    fontSize: 8.5,
    fontWeight: '800',
  },

  ministryText: {
    color:
      colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  statusFitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  statusBadge: {
    minHeight: 25,
    borderRadius:
      radius.pill,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },

  fitBadge: {
    minHeight: 25,
    borderRadius:
      radius.pill,
    backgroundColor:
      colors.skyLight,
    borderWidth: 1,
    borderColor:
      '#BAE6FD',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  fitScore: {
    color:
      '#0369A1',
    fontSize: 10,
    fontWeight: '900',
  },

  fitLabel: {
    color:
      colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },

  /* REASON */

  reasonPanel: {
    borderWidth: 1,
    borderRadius:
      radius.lg,
    padding: 11,
    marginTop: 13,
  },

  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 8,
    marginBottom: 7,
  },

  reasonTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  reasonTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },

  criteriaCount: {
    minWidth: 25,
    height: 22,
    borderRadius:
      radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  criteriaCountText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
  },

  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 5,
  },

  reasonBullet: {
    width: 15,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },

  reasonText: {
    flex: 1,
    color:
      colors.text,
    fontSize: 10.5,
    lineHeight: 16,
  },

  remainingReasons: {
    borderTopWidth: 1,
    borderTopColor:
      'rgba(148,163,184,0.25)',
    marginTop: 8,
    paddingTop: 6,
  },

  breakdownButton: {
    minHeight: 34,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },

  breakdownButtonText: {
    fontSize: 10,
    fontWeight: '900',
  },

  /* FULL BREAKDOWN */

  breakdownPanel: {
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.lg,
    padding: 11,
    marginTop: 9,
  },

  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 7,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    marginBottom: 8,
  },

  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  breakdownTitle: {
    color:
      colors.text,
    fontSize: 11,
    fontWeight: '900',
  },

  breakdownTotal: {
    color:
      colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '800',
  },

  breakdownItem: {
    borderWidth: 1,
    borderRadius:
      radius.md,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 6,
  },

  breakdownContent: {
    flex: 1,
  },

  breakdownDimensionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },

  breakdownStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  breakdownStatusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  breakdownDimension: {
    color:
      colors.text,
    fontSize: 10,
    fontWeight: '900',
  },

  breakdownReason: {
    color:
      colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 4,
  },

  breakdownScore: {
    fontSize: 9,
    fontWeight: '900',
    paddingTop: 2,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    marginTop: 5,
    paddingTop: 8,
  },

  sourceText: {
    flex: 1,
    color:
      colors.textMuted,
    fontSize: 8.5,
    lineHeight: 13,
  },

  /* DISCLAIMER */

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    borderRadius:
      radius.md,
    padding: 9,
    marginTop: 9,
  },

  disclaimerText: {
    flex: 1,
    color:
      colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  /* ACTIONS */

  actions: {
    marginTop: 10,
    gap: 7,
  },

  primaryAction: {
    minHeight: 45,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
  },

  primaryActionText: {
    color:
      colors.white,
    fontSize: 11,
    fontWeight: '900',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 7,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius:
      radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    paddingHorizontal: 7,
  },

  emiAction: {
    backgroundColor:
      colors.emeraldLight,
    borderColor:
      '#A7F3D0',
  },

  emiActionText: {
    color:
      '#047857',
    fontSize: 9.5,
    fontWeight: '900',
    textAlign: 'center',
  },

  partnerAction: {
    backgroundColor:
      colors.indigoLight,
    borderColor:
      '#C7D2FE',
  },

  partnerActionText: {
    color:
      '#4338CA',
    fontSize: 9.5,
    fontWeight: '900',
    textAlign: 'center',
  },

  portalAction: {
    minHeight: 44,
    borderRadius:
      radius.md,
    backgroundColor:
      colors.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
  },

  portalActionText: {
    color:
      colors.white,
    fontSize: 11,
    fontWeight: '900',
  },

  bottomSpace: {
    height: 20,
  },
});