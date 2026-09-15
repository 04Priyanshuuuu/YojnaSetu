import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MapPin,
  Building2,
  CheckCircle2,
  Globe,
  Layers,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Scheme, SchemeDocument } from '../../types';

interface SchemeDocumentGuidanceProps {
  scheme: Scheme;
  onOpenPortalModal?: () => void;
}

export const SchemeDocumentGuidance: React.FC<
  SchemeDocumentGuidanceProps
> = ({
  scheme,
  onOpenPortalModal,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  /*
   * ============================================================
   * APPLICATION ROUTE
   * ============================================================
   */

  const partnerSchemeIds = [
    'SIH26092-053',
    'SIH26092-054',
    'SIH26092-055',
    'SIH26092-056',
    'SIH26092-057',
    'SIH26092-058',
    'SIH26092-059',
    'SIH26092-060',
    'SIH26092-061',
    'SIH26092-062',
    'SIH26092-063',
    'SIH26092-068',
    'SIH26092-069',
    'SIH26092-070',
    'SIH26092-074',
    'SIH26092-031',
    'SIH26092-032',
    'SIH26092-033',
  ];

  const isPartnerRouted =
    scheme.application_route === 'CHANNEL_PARTNER' ||
    (scheme.partner_count !== undefined &&
      scheme.partner_count !== null &&
      scheme.partner_count > 0) ||
    partnerSchemeIds.includes(scheme.scheme_id);

  const officialUrl =
    scheme.application_url ||
    scheme.official_portal ||
    scheme.official_source_url;

  const isDirectPortal =
    !isPartnerRouted &&
    (scheme.application_route === 'DIRECT_PORTAL' ||
      Boolean(
        officialUrl &&
          (officialUrl.startsWith('http://') ||
            officialUrl.startsWith('https://')) &&
          (scheme.application_mode === 'ONLINE' ||
            scheme.scheme_type === 'PORTAL_SCHEME' ||
            Boolean(scheme.official_portal))
      ));

  const isUnverifiedRoute =
    !isPartnerRouted && !isDirectPortal;

  /*
   * ============================================================
   * DOCUMENTS
   * ============================================================
   */

  const docs: SchemeDocument[] = (
    scheme.documents || []
  ).filter((document) => document.active !== false);

  /*
   * ============================================================
   * APPLICATION STEPS
   * ============================================================
   */

  const parseRawSteps = (
    rawSteps?: string | null
  ): string[] => {
    if (!rawSteps || rawSteps.trim() === '') {
      return [];
    }

    return rawSteps
      .split(/(?:\r?\n|;|\d+\.\s+)/)
      .map((step) => step.trim())
      .filter((step) => step.length > 5);
  };

  const customSteps = parseRawSteps(
    scheme.application_steps
  );

  /*
   * ============================================================
   * ROUTE ACTIONS
   * ============================================================
   */

  const handleOfficialPortal = async () => {
    if (onOpenPortalModal) {
      onOpenPortalModal();
      return;
    }

    if (!officialUrl) {
      return;
    }

    try {
      const supported =
        await Linking.canOpenURL(officialUrl);

      if (supported) {
        await Linking.openURL(officialUrl);
      }
    } catch {
      // Keep the UI safe if the external URL cannot be opened.
    }
  };

  const handlePartnerLocator = () => {
    router.push({
      pathname: '/partners',
      params: {
        scheme_id: scheme.scheme_id,
      },
    });
  };

  /*
   * ============================================================
   * ROUTE BADGE
   * ============================================================
   */

  const routeBadge = isDirectPortal
    ? t(
        'howToApply.routePortalBadge',
        'Direct Govt Portal'
      )
    : isPartnerRouted
      ? t(
          'howToApply.routePartnerBadge',
          'Channel Partner Route'
        )
      : t(
          'howToApply.routeUnverifiedBadge',
          'Departmental Route'
        );

  return (
    <View style={styles.container}>
      {/* ========================================================
          1. HOW TO APPLY
      ========================================================= */}

      <View style={styles.sectionCard}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <View style={styles.titleRow}>
              <Building2
                size={20}
                color="#0369a1"
                strokeWidth={2}
              />

              <Text style={styles.sectionTitle}>
                {t(
                  'howToApply.title',
                  'How to Apply'
                )}
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>
              {t(
                'howToApply.subtitle',
                'Official step-by-step application guidance based on verified government directives.'
              )}
            </Text>
          </View>

          <View
            style={[
              styles.routeBadge,
              isDirectPortal
                ? styles.portalBadge
                : isPartnerRouted
                  ? styles.partnerBadge
                  : styles.departmentBadge,
            ]}
          >
            <Text
              style={[
                styles.routeBadgeText,
                isDirectPortal
                  ? styles.portalBadgeText
                  : isPartnerRouted
                    ? styles.partnerBadgeText
                    : styles.departmentBadgeText,
              ]}
            >
              {routeBadge}
            </Text>
          </View>
        </View>

        {/* ======================================================
            DIRECT GOVERNMENT PORTAL
        ======================================================= */}

        {isDirectPortal && (
          <View style={styles.routeContent}>
            {/* Information Card */}
            <View style={styles.portalInfoCard}>
              <View style={styles.routeTitleRow}>
                <Globe
                  size={17}
                  color="#0369a1"
                  strokeWidth={2}
                />

                <Text style={styles.portalInfoTitle}>
                  {t(
                    'howToApply.directPortalTitle',
                    'Apply through Official Government Portal'
                  )}
                </Text>
              </View>

              <Text style={styles.portalInfoDescription}>
                {t(
                  'howToApply.directPortalDesc',
                  'Applications for this scheme are handled directly on the verified official government portal. You do not need to visit middle-men or unverified agencies.'
                )}
              </Text>
            </View>

            {/* Steps Heading */}
            <View style={styles.stepsHeadingRow}>
              <Layers
                size={15}
                color="#94a3b8"
                strokeWidth={2}
              />

              <Text style={styles.stepsHeading}>
                {t(
                  'howToApply.stepsHeading',
                  'Application Steps'
                )}
              </Text>
            </View>

            {/* Custom Steps */}
            {customSteps.length > 0 ? (
              <View style={styles.stepsList}>
                {customSteps.map((step, index) => (
                  <StepCard
                    key={`${index}-${step}`}
                    number={index + 1}
                    text={step}
                    color="blue"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.stepsList}>
                <StepCard
                  number={1}
                  title={t(
                    'howToApply.step1PortalTitle',
                    'Prepare Required Documents'
                  )}
                  text={t(
                    'howToApply.step1PortalDesc',
                    'Keep digital copies of your Aadhaar, bank passbook, and proof of category/income ready.'
                  )}
                  color="blue"
                />

                <StepCard
                  number={2}
                  title={t(
                    'howToApply.step2PortalTitle',
                    'Visit the Official Government Portal'
                  )}
                  text={t(
                    'howToApply.step2PortalDesc',
                    'Click the button below to safely open the official government portal in a secure window.'
                  )}
                  color="blue"
                />

                <StepCard
                  number={3}
                  title={t(
                    'howToApply.step3PortalTitle',
                    'Submit Online Application'
                  )}
                  text={t(
                    'howToApply.step3PortalDesc',
                    'Authenticate via Aadhaar OTP, complete the scheme form, and save your Application Reference Number.'
                  )}
                  color="blue"
                />
              </View>
            )}

            {/* Official Portal CTA */}
            {(onOpenPortalModal || officialUrl) && (
              <Pressable
                onPress={handleOfficialPortal}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'howToApply.ctaPortal',
                  'Apply on Official Portal'
                )}
                style={({ pressed }) => [
                  styles.primaryCta,
                  pressed && styles.ctaPressed,
                ]}
              >
                <Text style={styles.primaryCtaText}>
                  {t(
                    'howToApply.ctaPortal',
                    'Apply on Official Portal'
                  )}
                </Text>

                <ExternalLink
                  size={17}
                  color="#ffffff"
                  strokeWidth={2}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* ======================================================
            CHANNEL PARTNER ROUTE
        ======================================================= */}

        {isPartnerRouted && (
          <View style={styles.routeContent}>
            {/* Partner Info */}
            <View style={styles.partnerInfoCard}>
              <View style={styles.routeTitleRow}>
                <Building2
                  size={17}
                  color="#4338ca"
                  strokeWidth={2}
                />

                <Text style={styles.partnerInfoTitle}>
                  {t(
                    'howToApply.partnerTitle',
                    'Apply through an Authorized Channel Partner'
                  )}
                </Text>
              </View>

              <Text style={styles.partnerInfoDescription}>
                {t(
                  'howToApply.partnerDesc',
                  'This scheme is disbursed through authorized State Channelizing Agencies (SCAs), Public Sector Banks (PSBs), and Regional Rural Banks (RRBs).'
                )}
              </Text>
            </View>

            {/* Steps Heading */}
            <View style={styles.stepsHeadingRow}>
              <Layers
                size={15}
                color="#94a3b8"
                strokeWidth={2}
              />

              <Text style={styles.stepsHeading}>
                {t(
                  'howToApply.stepsHeading',
                  'Application Steps'
                )}
              </Text>
            </View>

            {/* Partner Steps */}
            {customSteps.length > 0 ? (
              <View style={styles.stepsList}>
                {customSteps.map((step, index) => (
                  <StepCard
                    key={`${index}-${step}`}
                    number={index + 1}
                    text={step}
                    color="indigo"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.stepsList}>
                <StepCard
                  number={1}
                  title={t(
                    'howToApply.step1PartnerTitle',
                    'Check Required Documents Checklist'
                  )}
                  text={t(
                    'howToApply.step1PartnerDesc',
                    'Ensure you have physical originals and copies of all documents listed below.'
                  )}
                  color="indigo"
                />

                <StepCard
                  number={2}
                  title={t(
                    'howToApply.step2PartnerTitle',
                    'Locate Nearest Authorized Partner'
                  )}
                  text={t(
                    'howToApply.step2PartnerDesc',
                    'Use our verified GPS locator to find the closest State Channelizing Agency or bank branch.'
                  )}
                  color="indigo"
                />

                <StepCard
                  number={3}
                  title={t(
                    'howToApply.step3PartnerTitle',
                    'Submit Application to Partner Office'
                  )}
                  text={t(
                    'howToApply.step3PartnerDesc',
                    'Submit your application form and project proposal directly at the partner counter.'
                  )}
                  color="indigo"
                />
              </View>
            )}

            {/* Partner Locator */}
            <Pressable
              onPress={handlePartnerLocator}
              accessibilityRole="button"
              accessibilityLabel={t(
                'howToApply.ctaPartner',
                'Find Authorized Channel Partners'
              )}
              style={({ pressed }) => [
                styles.partnerCta,
                pressed && styles.ctaPressed,
              ]}
            >
              <MapPin
                size={17}
                color="#bae6fd"
                strokeWidth={2}
              />

              <Text style={styles.partnerCtaText}>
                {t(
                  'howToApply.ctaPartner',
                  'Find Authorized Channel Partners'
                )}
              </Text>
            </Pressable>

            {/* Official Guidelines */}
            {officialUrl && onOpenPortalModal && (
              <Pressable
                onPress={onOpenPortalModal}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'howToApply.ctaOfficialGuidelines',
                  'View Official Guidelines'
                )}
                style={({ pressed }) => [
                  styles.secondaryCta,
                  pressed && styles.secondaryCtaPressed,
                ]}
              >
                <Text style={styles.secondaryCtaText}>
                  {t(
                    'howToApply.ctaOfficialGuidelines',
                    'View Official Guidelines'
                  )}
                </Text>

                <ExternalLink
                  size={15}
                  color="#475569"
                  strokeWidth={2}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* ======================================================
            DEPARTMENTAL / UNVERIFIED ROUTE
        ======================================================= */}

        {isUnverifiedRoute && (
          <View style={styles.routeContent}>
            {/* Unverified Information */}
            <View style={styles.departmentInfoCard}>
              <View style={styles.routeTitleRow}>
                <AlertCircle
                  size={17}
                  color="#b45309"
                  strokeWidth={2}
                />

                <Text style={styles.departmentInfoTitle}>
                  {t(
                    'howToApply.unverifiedTitle',
                    'Departmental Application Route'
                  )}
                </Text>
              </View>

              <Text style={styles.departmentInfoDescription}>
                {t(
                  'howToApply.unverifiedDesc',
                  'Application route could not be verified from an open online portal or channel partner registry. Applications are accepted directly through concerned District Departments or institutional windows.'
                )}
              </Text>
            </View>

            {/* Department Steps */}
            <View style={styles.stepsList}>
              <StepCard
                number={1}
                title={t(
                  'howToApply.step1UnverifiedTitle',
                  'Review Official Scheme Gazette'
                )}
                text={t(
                  'howToApply.step1UnverifiedDesc',
                  'Check the authoritative ministry notification link below for eligibility criteria.'
                )}
                color="amber"
              />

              <StepCard
                number={2}
                title={t(
                  'howToApply.step2UnverifiedTitle',
                  'Contact Local District Office'
                )}
                text={t(
                  'howToApply.step2UnverifiedDesc',
                  'Visit your local District Welfare Officer, DIC, or Lead Bank District Manager.'
                )}
                color="amber"
              />
            </View>

            {/* Source CTA */}
            {officialUrl && onOpenPortalModal ? (
              <Pressable
                onPress={onOpenPortalModal}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'howToApply.ctaSource',
                  'View Official Source Guidelines'
                )}
                style={({ pressed }) => [
                  styles.primaryCta,
                  pressed && styles.ctaPressed,
                ]}
              >
                <Text style={styles.primaryCtaText}>
                  {t(
                    'howToApply.ctaSource',
                    'View Official Source Guidelines'
                  )}
                </Text>

                <ExternalLink
                  size={17}
                  color="#ffffff"
                  strokeWidth={2}
                />
              </Pressable>
            ) : (
              <Text style={styles.noSourceText}>
                {t(
                  'howToApply.noSourceLink',
                  'Official online application route is currently not verified.'
                )}
              </Text>
            )}
          </View>
        )}

        {/* ======================================================
            TRANSPARENCY DISCLAIMER
        ======================================================= */}

        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerTitleRow}>
            <Info
              size={15}
              color="#0284c7"
              strokeWidth={2}
            />

            <Text style={styles.disclaimerTitle}>
              {t(
                'howToApply.disclaimerTitle',
                'Official Notice'
              )}
            </Text>
          </View>

          <Text style={styles.disclaimerText}>
            {t(
              'howToApply.disclaimer',
              'Eligibility guidance only. Final eligibility and approval are determined by the concerned government authority.'
            )}
          </Text>
        </View>
      </View>

      {/* ========================================================
          2. DOCUMENTS YOU MAY NEED
      ========================================================= */}

      <View style={styles.sectionCard}>
        {/* Documents Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <View style={styles.titleRow}>
              <FileText
                size={20}
                color="#4f46e5"
                strokeWidth={2}
              />

              <Text style={styles.sectionTitle}>
                {t(
                  'documents.title',
                  'Required Documents Checklist'
                )}
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>
              {t(
                'documents.subtitle',
                'Official documents required before application submission.'
              )}
            </Text>
          </View>

          {docs.length > 0 && (
            <View style={styles.requirementBadge}>
              <Text style={styles.requirementBadgeText}>
                {docs.length}{' '}
                {docs.length === 1
                  ? t(
                      'documents.officialRequirement',
                      'Requirement'
                    )
                  : t(
                      'documents.officialRequirements',
                      'Requirements'
                    )}
              </Text>
            </View>
          )}
        </View>

        {/* ======================================================
            NO DOCUMENTS
        ======================================================= */}

        {docs.length === 0 ? (
          <View style={styles.uncertaintyContainer}>
            <AlertCircle
              size={21}
              color="#d97706"
              strokeWidth={2}
            />

            <View style={styles.uncertaintyContent}>
              <Text style={styles.uncertaintyTitle}>
                {t(
                  'documents.uncertaintyTitle',
                  'Document List Under Review'
                )}
              </Text>

              <Text style={styles.uncertaintyDescription}>
                {t(
                  'documents.uncertaintyDesc',
                  'Specific document guidelines are being verified from authoritative ministry gazettes. Please carry standard KYC documents (Aadhaar, Bank Passbook, Proof of Residence).'
                )}
              </Text>
            </View>
          </View>
        ) : (
          /* ======================================================
             DOCUMENT LIST
          ======================================================= */
          <View style={styles.documentsList}>
            {docs.map((doc) => (
              <DocumentCard
                key={doc.document_id}
                document={doc}
                t={t}
              />
            ))}
          </View>
        )}

        {/* ======================================================
            DOCUMENT STORAGE ADVISORY
        ======================================================= */}

        <View style={styles.documentAdvisory}>
          <View style={styles.disclaimerTitleRow}>
            <ShieldCheck
              size={15}
              color="#0284c7"
              strokeWidth={2}
            />

            <Text style={styles.disclaimerTitle}>
              {t(
                'documents.carryOriginals',
                'Carry Original Verification Documents'
              )}
            </Text>
          </View>

          <Text style={styles.disclaimerText}>
            {t(
              'documents.zeroStorage',
              'Zero Document Storage: YojnaSetu never uploads, stores, or requests sensitive documents. Present physical or DigiLocker documents only to authorized centers.'
            )}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* =================================================================
   STEP CARD
================================================================= */

interface StepCardProps {
  number: number;
  title?: string;
  text: string;
  color: 'blue' | 'indigo' | 'amber';
}

const StepCard: React.FC<StepCardProps> = ({
  number,
  title,
  text,
  color,
}) => {
  const numberStyle =
    color === 'blue'
      ? styles.stepNumberBlue
      : color === 'indigo'
        ? styles.stepNumberIndigo
        : styles.stepNumberAmber;

  return (
    <View style={styles.stepCard}>
      <View style={[styles.stepNumber, numberStyle]}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.stepContent}>
        {title ? (
          <Text style={styles.stepTitle}>
            {title}
          </Text>
        ) : null}

        <Text
          style={[
            styles.stepDescription,
            !title && styles.stepDescriptionWithoutTitle,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
};

/* =================================================================
   DOCUMENT CARD
================================================================= */

interface DocumentCardProps {
  document: SchemeDocument;
  t: TFunction;
}
const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  t,
}) => {
  const isMandatory =
    document.requirement_type === 'REQUIRED' ||
    document.requirement_type === 'MANDATORY';

  const isConditional =
    document.requirement_type === 'CONDITIONAL';

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentTopRow}>
        <View style={styles.documentMain}>
          <CheckCircle2
            size={17}
            color="#059669"
            strokeWidth={2}
          />

          <View style={styles.documentTextContainer}>
            <Text style={styles.documentName}>
              {document.document_name}
            </Text>

            {document.condition ? (
              <Text style={styles.documentCondition}>
                {document.condition}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Requirement Type */}
        <View
          style={[
            styles.documentTypeBadge,
            isMandatory
              ? styles.mandatoryBadge
              : isConditional
                ? styles.conditionalBadge
                : styles.optionalBadge,
          ]}
        >
          <Text
            style={[
              styles.documentTypeText,
              isMandatory
                ? styles.mandatoryText
                : isConditional
                  ? styles.conditionalText
                  : styles.optionalText,
            ]}
          >
            {isMandatory
              ? t(
                  'documents.mandatory',
                  'Mandatory'
                )
              : isConditional
                ? t(
                    'documents.conditional',
                    'Conditional'
                  )
                : t(
                    'documents.optional',
                    'Optional'
                  )}
          </Text>
        </View>
      </View>

      {/* Source Provenance */}
      <View style={styles.documentSource}>
        <View style={styles.documentSourceLeft}>
          <ShieldCheck
            size={12}
            color="#059669"
            strokeWidth={2}
          />

          <Text
            style={styles.documentId}
            numberOfLines={1}
          >
            {document.document_id}
          </Text>
        </View>

        {document.source_section ? (
          <Text
            style={styles.sourceSection}
            numberOfLines={2}
          >
            {t('documents.sourceLabel', 'Source:')}{' '}
            {document.source_section}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

/* =================================================================
   STYLES
================================================================= */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },

  /* ==============================================================
     SECTION
  ============================================================== */

  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },

  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  /* ==============================================================
     ROUTE BADGES
  ============================================================== */

  routeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 130,
  },

  routeBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  portalBadge: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },

  portalBadgeText: {
    color: '#0369a1',
  },

  partnerBadge: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },

  partnerBadgeText: {
    color: '#4338ca',
  },

  departmentBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },

  departmentBadgeText: {
    color: '#b45309',
  },

  /* ==============================================================
     ROUTE CONTENT
  ============================================================== */

  routeContent: {
    marginTop: 16,
    gap: 14,
  },

  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  /* ==============================================================
     PORTAL INFO
  ============================================================== */

  portalInfoCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 13,
  },

  portalInfoTitle: {
    flex: 1,
    color: '#082f49',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  portalInfoDescription: {
    color: '#075985',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  /* ==============================================================
     PARTNER INFO
  ============================================================== */

  partnerInfoCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 13,
  },

  partnerInfoTitle: {
    flex: 1,
    color: '#312e81',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  partnerInfoDescription: {
    color: '#3730a3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  /* ==============================================================
     DEPARTMENT INFO
  ============================================================== */

  departmentInfoCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 13,
  },

  departmentInfoTitle: {
    flex: 1,
    color: '#451a03',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  departmentInfoDescription: {
    color: '#92400e',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  /* ==============================================================
     STEPS
  ============================================================== */

  stepsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },

  stepsHeading: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  stepsList: {
    gap: 8,
  },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },

  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  stepNumberBlue: {
    backgroundColor: '#0369a1',
  },

  stepNumberIndigo: {
    backgroundColor: '#4f46e5',
  },

  stepNumberAmber: {
    backgroundColor: '#d97706',
  },

  stepNumberText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },

  stepContent: {
    flex: 1,
    minWidth: 0,
  },

  stepTitle: {
    color: '#0f172a',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  stepDescription: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },

  stepDescriptionWithoutTitle: {
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 0,
  },

  /* ==============================================================
     CTA BUTTONS
  ============================================================== */

  primaryCta: {
    minHeight: 46,
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },

  primaryCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  partnerCta: {
    minHeight: 46,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },

  partnerCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  secondaryCta: {
    minHeight: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  secondaryCtaText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  secondaryCtaPressed: {
    backgroundColor: '#e2e8f0',
  },

  ctaPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  noSourceText: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },

  /* ==============================================================
     DISCLAIMER
  ============================================================== */

  disclaimerContainer: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 13,
    marginTop: 16,
  },

  disclaimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  disclaimerTitle: {
    flex: 1,
    color: '#1e293b',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },

  disclaimerText: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  /* ==============================================================
     DOCUMENTS
  ============================================================== */

  requirementBadge: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 125,
  },

  requirementBadgeText: {
    color: '#4338ca',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  documentsList: {
    marginTop: 16,
    gap: 10,
  },

  documentCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 13,
  },

  documentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  documentMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  documentTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  documentName: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  documentCondition: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  documentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },

  documentTypeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  mandatoryBadge: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },

  mandatoryText: {
    color: '#be123c',
  },

  conditionalBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },

  conditionalText: {
    color: '#b45309',
  },

  optionalBadge: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },

  optionalText: {
    color: '#334155',
  },

  documentSource: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  documentSourceLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  documentId: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 9,
    lineHeight: 13,
    fontFamily: 'monospace',
  },

  sourceSection: {
    flex: 1,
    color: '#64748b',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'right',
  },

  /* ==============================================================
     DOCUMENT UNCERTAINTY
  ============================================================== */

  uncertaintyContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 13,
    gap: 10,
  },

  uncertaintyContent: {
    flex: 1,
    minWidth: 0,
  },

  uncertaintyTitle: {
    color: '#78350f',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  uncertaintyDescription: {
    color: '#92400e',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  /* ==============================================================
     DOCUMENT ADVISORY
  ============================================================== */

  documentAdvisory: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 13,
    marginTop: 14,
  },
});

export default SchemeDocumentGuidance;

