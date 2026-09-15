import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import Screen from "../../components/Screen";
import MapLocator from "./MapLocator";
import { schemeApi } from "../../api/schemeApi";
import type { Scheme } from "../../types";

export default function PartnersScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    scheme_id?: string | string[];
    loan_category?: string | string[];
  }>();

  const schemeIdParam = Array.isArray(params.scheme_id)
    ? params.scheme_id[0] ?? ""
    : params.scheme_id ?? "";

  const loanCategoryParam = Array.isArray(
    params.loan_category
  )
    ? params.loan_category[0] ?? ""
    : params.loan_category ?? "";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] =
    useState(schemeIdParam);
  const [selectedScheme, setSelectedScheme] =
    useState<Scheme | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] =
    useState<string | null>(null);
  const [isLoadingSchemes, setIsLoadingSchemes] =
    useState(true);

  const fetchSchemes = useCallback(async () => {
    try {
      setIsLoadingSchemes(true);

      const response = await schemeApi.getSchemes({
        page: 1,
        page_size: 100,
      });

      setSchemes(response.items ?? []);
    } catch (error) {
      console.error(
        "Failed to fetch schemes list:",
        error
      );
      setSchemes([]);
    } finally {
      setIsLoadingSchemes(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  useEffect(() => {
    setSelectedSchemeId(schemeIdParam);
  }, [schemeIdParam]);

  useEffect(() => {
    if (!selectedSchemeId) {
      setSelectedScheme(null);
      return;
    }

    const scheme =
      schemes.find(
        (item) =>
          item.scheme_id === selectedSchemeId
      ) ?? null;

    setSelectedScheme(scheme);
  }, [schemes, selectedSchemeId]);

  const handleSchemeChange = useCallback(
    (schemeId: string) => {
      setSelectedSchemeId(schemeId);
      setSelectedPartnerId(null);

      if (schemeId) {
        router.setParams({
          scheme_id: schemeId,
        });
      } else {
        router.setParams({
          scheme_id: undefined,
        });
      }
    },
    [router]
  );

  const handlePartnerSelect = useCallback(
    (partnerId: string) => {
      setSelectedPartnerId(partnerId);
    },
    []
  );

  const selectedSchemeName = useMemo(
    () => selectedScheme?.scheme_name ?? "",
    [selectedScheme]
  );

  return (
    <Screen scrollable={false}>
      <View style={styles.container}>
        {/* ─────────────────────────────
            HEADER BANNER
        ───────────────────────────── */}
        <View style={styles.headerBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.geoBadge}>
              <Text style={styles.geoBadgeText}>
                {t(
                  "channelPartners.geoService",
                  "GEO-LOCATION SERVICE"
                )}
              </Text>
            </View>

            <Text style={styles.verifiedText}>
              {t(
                "channelPartners.verifiedPartners",
                "Verified Partners"
              )}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <Building2
              size={29}
              color="#f59e0b"
            />

            <Text style={styles.title}>
              {t(
                "channelPartners.title",
                "Find a Nearby Channel Partner"
              )}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {t(
              "channelPartners.subtitle",
              "Locate authorized Public Sector Banks, Regional Rural Banks, NBFC-MFIs, and State Channelizing Agencies supporting official welfare schemes in your area."
            )}
          </Text>

          {/* Back to schemes */}
          <Pressable
            onPress={() => router.push("/(tabs)/schemes")}
            style={({ pressed }) => [
              styles.browseSchemesButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(
              "channelPartners.browseAllSchemes",
              "Browse All Schemes"
            )}
          >
            <ArrowLeft
              size={16}
              color="#e2e8f0"
            />

            <Text style={styles.browseSchemesText}>
              {t(
                "channelPartners.browseAllSchemes",
                "Browse All Schemes"
              )}
            </Text>
          </Pressable>
        </View>

        {/* ─────────────────────────────
            SCHEME SELECTOR
        ───────────────────────────── */}
        <View style={styles.schemeSelector}>
          <Text style={styles.selectorLabel}>
            {t(
              "channelPartners.selectedScheme",
              "Selected Welfare Scheme:"
            )}
          </Text>

          {isLoadingSchemes ? (
            <View style={styles.schemeLoading}>
              <ActivityIndicator
                size="small"
                color="#4f46e5"
              />

              <Text style={styles.schemeLoadingText}>
                Loading schemes...
              </Text>
            </View>
          ) : (
            <View style={styles.schemeOptions}>
              <Pressable
                onPress={() =>
                  handleSchemeChange("")
                }
                style={[
                  styles.schemeOption,
                  !selectedSchemeId &&
                    styles.schemeOptionSelected,
                ]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    !selectedSchemeId &&
                      styles.radioOuterSelected,
                  ]}
                >
                  {!selectedSchemeId && (
                    <View style={styles.radioInner} />
                  )}
                </View>

                <Text
                  style={[
                    styles.schemeOptionText,
                    !selectedSchemeId &&
                      styles.schemeOptionTextSelected,
                  ]}
                >
                  {t(
                    "channelPartners.allEligibleSchemes",
                    "All Eligible Schemes"
                  )}
                </Text>
              </Pressable>

              {schemes.map((scheme) => {
                const active =
                  selectedSchemeId ===
                  scheme.scheme_id;

                return (
                  <Pressable
                    key={scheme.scheme_id}
                    onPress={() =>
                      handleSchemeChange(
                        scheme.scheme_id
                      )
                    }
                    style={[
                      styles.schemeOption,
                      active &&
                        styles.schemeOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        active &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {active && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.schemeOptionText,
                        active &&
                          styles.schemeOptionTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {scheme.scheme_name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedScheme && (
            <View style={styles.selectedSchemeBanner}>
              <CheckCircle2
                size={16}
                color="#059669"
              />

              <Text
                style={styles.selectedSchemeText}
                numberOfLines={3}
              >
                {t(
                  "channelPartners.filteringFor",
                  "Filtering partners for {{scheme}}",
                  {
                    scheme:
                      selectedSchemeName,
                  }
                )}
              </Text>
            </View>
          )}
        </View>

        {/* ─────────────────────────────
            APPLICATION NOTICE
        ───────────────────────────── */}
        {selectedPartnerId && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              YojnaSetu only provides eligibility
              guidance and partner discovery.
              Applications are submitted directly
              on official government/bank portals.
            </Text>
          </View>
        )}

        {/* ─────────────────────────────
            NATIVE PARTNER LOCATOR
        ───────────────────────────── */}
        <MapLocator
          schemeId={
            selectedSchemeId || undefined
          }
          schemeName={
            selectedScheme?.scheme_name ||
            undefined
          }
          loanCategory={
            loanCategoryParam || undefined
          }
          selectedPartnerId={
            selectedPartnerId
          }
          onSelectPartner={
            handlePartnerSelect
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f8fafc",
  },

  headerBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#091928",
    borderBottomWidth: 4,
    borderBottomColor: "#f59e0b",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  geoBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },

  geoBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  verifiedText: {
    color: "#7dd3fc",
    fontSize: 10,
    fontWeight: "600",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  title: {
    flex: 1,
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  subtitle: {
    color: "#cbd5e1",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },

  browseSchemesButton: {
    alignSelf: "flex-start",
    marginTop: 15,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  browseSchemesText: {
    color: "#e2e8f0",
    fontSize: 10,
    fontWeight: "800",
  },

  schemeSelector: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  selectorLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 9,
  },

  schemeLoading: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  schemeLoadingText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
  },

  schemeOptions: {
    gap: 7,
  },

  schemeOption: {
    minHeight: 43,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  schemeOptionSelected: {
    borderColor: "#818cf8",
    backgroundColor: "#eef2ff",
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#4f46e5",
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
  },

  schemeOptionText: {
    flex: 1,
    color: "#475569",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },

  schemeOptionTextSelected: {
    color: "#312e81",
    fontWeight: "800",
  },

  selectedSchemeBanner: {
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  selectedSchemeText: {
    flex: 1,
    color: "#065f46",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },

  notice: {
    marginHorizontal: 14,
    marginBottom: 7,
    paddingHorizontal: 4,
  },

  noticeText: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
  },

  pressed: {
    opacity: 0.82,
  },
});

