import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Scheme } from '../../types';
import theme from '../../constants/theme';

interface SchemeCardProps {
  scheme: Scheme;
}

const formatAmount = (amount?: number | null): string => {
  if (amount === null || amount === undefined) {
    return '';
  }

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lakh`;
  }

  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const cleanText = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/;/g, ' • ')
    .trim();
};

const getVerificationStyle = (status?: string) => {
  const normalized = (status || '').toUpperCase();

  if (
    normalized.includes('VERIFIED') ||
    normalized === 'ACTIVE' ||
    normalized === 'APPROVED'
  ) {
    return {
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      color: '#047857',
      icon: 'checkmark-circle' as const,
      label: 'Verified',
    };
  }

  if (
    normalized.includes('PENDING') ||
    normalized.includes('REVIEW')
  ) {
    return {
      backgroundColor: '#FFFBEB',
      borderColor: '#FDE68A',
      color: '#B45309',
      icon: 'time' as const,
      label: 'Under Review',
    };
  }

  return {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    color: '#475569',
    icon: 'shield-checkmark-outline' as const,
    label: status || 'Verified',
  };
};

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme }) => {
  const router = useRouter();

  const verification = getVerificationStyle(
    scheme.verification_status
  );

  const rawType = scheme.scheme_type || scheme.support_type;
  const typeText =
    rawType && rawType !== 'UNKNOWN'
      ? cleanText(rawType).toUpperCase()
      : null;

  const ministry =
    scheme.ministry ||
    scheme.implementing_agency ||
    'Government of India';

  const description =
    scheme.short_description ||
    scheme.objective ||
    scheme.purpose ||
    'Verified government welfare and enterprise support scheme.';

  const isCreditScheme = scheme.is_credit_scheme !== false;

  const hasLoanInformation =
    isCreditScheme &&
    (scheme.max_loan_amount !== null &&
      scheme.max_loan_amount !== undefined ||
      scheme.interest_rate_max !== null &&
        scheme.interest_rate_max !== undefined);

  const maxSupport = scheme.max_loan_amount
    ? formatAmount(scheme.max_loan_amount)
    : scheme.max_loan_amount_raw &&
        scheme.max_loan_amount_raw !== 'UNKNOWN'
      ? scheme.max_loan_amount_raw
      : 'As per appraisal';

  let interestRate = 'As per bank';

  if (
    scheme.interest_rate !== null &&
    scheme.interest_rate !== undefined
  ) {
    interestRate =
      scheme.interest_rate === 0
        ? '0% (Interest-Free)'
        : `${scheme.interest_rate}% p.a.`;
  } else if (
    scheme.interest_rate_max !== null &&
    scheme.interest_rate_max !== undefined
  ) {
    interestRate =
      scheme.interest_rate_max === 0
        ? '0% (Interest-Free)'
        : `${scheme.interest_rate_max}% p.a.`;
  }

  const getAssistanceType = () => {
    switch (scheme.financial_category) {
      case 'GRANT_SUBSIDY':
        if (scheme.subsidy_percentage) {
          return `Subsidy (${scheme.subsidy_percentage}%)`;
        }

        if (scheme.grant_amount) {
          return `Grant (${formatAmount(scheme.grant_amount)})`;
        }

        return 'Capital Subsidy';

      case 'SCHOLARSHIP':
        return 'Scholarship Grant';

      case 'TRAINING_SKILL':
        return 'Free Training / Kit';

      case 'DIRECT_BENEFIT':
        return 'Direct Benefit / DBT';

      case 'GUARANTEE_CREDIT_SUPPORT':
        return 'Credit Guarantee';

      default:
        return 'Welfare Support';
    }
  };

  const rawTarget =
    scheme.target_groups ||
    scheme.marginalized_group ||
    scheme.target_beneficiary;

  const targetText =
    !rawTarget || rawTarget === 'UNKNOWN'
      ? 'All Citizens'
      : cleanText(rawTarget);

  const handleOpenDetails = () => {
    router.push({
      pathname: '/schemes/[id]',
      params: {
        id: scheme.scheme_id,
      },
    });
  };

  const handleCalculator = () => {
    router.push({
      pathname: '/calculator',
      params: {
        scheme: scheme.scheme_id,
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Badges */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.verificationBadge,
              {
                backgroundColor: verification.backgroundColor,
                borderColor: verification.borderColor,
              },
            ]}
          >
            <Ionicons
              name={verification.icon}
              size={13}
              color={verification.color}
            />

            <Text
              style={[
                styles.verificationText,
                { color: verification.color },
              ]}
              numberOfLines={1}
            >
              {verification.label}
            </Text>
          </View>

          {typeText ? (
            <View style={styles.typeBadge}>
              <Text
                style={styles.typeText}
                numberOfLines={1}
              >
                {typeText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {scheme.scheme_name}
        </Text>

        {/* Ministry */}
        <View style={styles.ministryRow}>
          <Ionicons
            name="business-outline"
            size={15}
            color="#94A3B8"
          />

          <Text
            style={styles.ministry}
            numberOfLines={1}
          >
            {ministry}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {description}
        </Text>

        {/* Financial Information */}
        <View style={styles.financeBox}>
          {hasLoanInformation ? (
            <>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  MAX SUPPORT
                </Text>

                <Text
                  style={styles.financeValue}
                  numberOfLines={1}
                >
                  {maxSupport}
                </Text>
              </View>

              <View style={styles.financeDivider} />

              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  INTEREST RATE
                </Text>

                <Text
                  style={styles.financeValue}
                  numberOfLines={2}
                >
                  {interestRate}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  ASSISTANCE TYPE
                </Text>

                <Text
                  style={styles.financeValue}
                  numberOfLines={2}
                >
                  {getAssistanceType()}
                </Text>
              </View>

              <View style={styles.financeDivider} />

              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  LOAN FACILITY
                </Text>

                <Text style={styles.notApplicable}>
                  Not applicable
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Target Tags */}
        <View style={styles.tagsRow}>
          <View style={styles.targetTag}>
            <Ionicons
              name="people-outline"
              size={12}
              color="#92400E"
            />

            <Text
              style={styles.targetTagText}
              numberOfLines={1}
            >
              Target: {targetText}
            </Text>
          </View>

          {scheme.sector &&
          scheme.sector !== 'UNKNOWN' ? (
            <View style={styles.sectorTag}>
              <Ionicons
                name="grid-outline"
                size={11}
                color="#075985"
              />

              <Text
                style={styles.sectorTagText}
                numberOfLines={1}
              >
                {cleanText(scheme.sector)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleOpenDetails}
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.detailsText}>
            View Details
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color="#0369A1"
          />
        </Pressable>

        <View style={styles.actionButtons}>
          {hasLoanInformation ? (
            <Pressable
              onPress={handleCalculator}
              style={({ pressed }) => [
                styles.calculatorButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="calculator-outline"
                size={14}
                color="#047857"
              />

              <Text style={styles.calculatorText}>
                EMI
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleOpenDetails}
              style={({ pressed }) => [
                styles.guidelinesButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#475569"
              />

              <Text style={styles.guidelinesText}>
                Guidelines
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  content: {
    padding: 16,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },

  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '55%',
  },

  verificationText: {
    fontSize: 10,
    fontWeight: '800',
  },

  typeBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 1,
  },

  typeText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
  },

  title: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 8,
  },

  ministryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },

  ministry: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },

  description: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 14,
  },

  financeBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 11,
    marginBottom: 13,
  },

  financeItem: {
    flex: 1,
    minWidth: 0,
  },

  financeDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },

  financeLabel: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.4,
  },

  financeValue: {
    color: '#1E293B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  notApplicable: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  targetTag: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  targetTagText: {
    maxWidth: 190,
    color: '#92400E',
    fontSize: 9.5,
    fontWeight: '600',
  },

  sectorTag: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  sectorTagText: {
    maxWidth: 150,
    color: '#075985',
    fontSize: 9.5,
    fontWeight: '600',
  },

  footer: {
    minHeight: 58,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  detailsButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },

  detailsText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800',
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  calculatorButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 9,
    paddingHorizontal: 10,
  },

  calculatorText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },

  guidelinesButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingHorizontal: 10,
  },

  guidelinesText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});