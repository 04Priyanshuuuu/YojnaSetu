import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, {
  Callout,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

import { partnerApi, NearestPartnerResponse } from "../../api/partnerApi";

import {
  MapPin,
  Navigation,
  Search,
  Building2,
  Building,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Lock,
  Unlock,
  Globe,
  ChevronDown,
} from "lucide-react-native";

export interface MapLocatorProps {
  onSelectPartner?: (partnerId: string) => void;
  selectedPartnerId?: string | null;
  schemeId?: string;
  schemeName?: string;
  loanCategory?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface ActiveOrigin {
  lat: number;
  lng: number;
  label: string;
  isGps: boolean;
}

interface OSRMRouteInfo {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  distanceKm: number;
  durationMins: number;
}

const INDIA_CENTER = {
  latitude: 22.5937,
  longitude: 78.9629,
};

const DEFAULT_DELTA = {
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const geocodeCache = new Map<
  string,
  {
    lat: number;
    lng: number;
    displayName: string;
  }
>();

export const isValidCoord = (lat: unknown, lng: unknown): boolean => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const calculateHaversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  if (!isValidCoord(lat1, lon1) || !isValidCoord(lat2, lon2)) {
    return 0;
  }

  const R = 6371;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
};

const formatDistance = (distance: number) => {
  if (!Number.isFinite(distance)) return "—";
  return `${distance.toLocaleString()} km`;
};

const formatDuration = (minutes: number) => {
  if (!Number.isFinite(minutes)) return "—";

  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
  }

  return `${minutes} mins`;
};

const getPartnerPinColor = (partner: NearestPartnerResponse["partner"]) => {
  const category = partner?.partner_category;
  const type = partner?.partner_type;

  if (category === "AUTHORIZED_SCHEME_PARTNER") {
    return "#2563eb";
  }

  if (category === "IMPLEMENTING_ASSISTANCE_CENTRE") {
    return "#059669";
  }

  if (category === "NEARBY_FINANCIAL_SERVICE_POINT") {
    return "#d97706";
  }

  if (type === "PSB") return "#2563eb";
  if (type === "RRB") return "#16a34a";
  if (type === "NBFC_MFI") return "#9333ea";
  if (type === "SCA") return "#ea580c";

  return "#475569";
};

const openDirections = async (latitude: number, longitude: number) => {
  if (!isValidCoord(latitude, longitude)) {
    return;
  }

  const destination = `${latitude},${longitude}`;

  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          destination,
        )}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Unable to open maps",
      "Please install or enable a maps application on your device.",
    );
  }
};

const openWebsite = async (url: string) => {
  if (!url) return;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Unable to open website",
      "The provided website could not be opened.",
    );
  }
};

const callPhone = async (phone: string) => {
  if (!phone) return;

  try {
    await Linking.openURL(`tel:${phone}`);
  } catch {
    Alert.alert(
      "Unable to make call",
      "Calling is not available on this device.",
    );
  }
};

const sendEmail = async (email: string) => {
  if (!email) return;

  try {
    await Linking.openURL(`mailto:${email}`);
  } catch {
    Alert.alert("Unable to open email", "No email application is available.");
  }
};

const CategoryBadge = ({
  label,
  color,
  backgroundColor,
  borderColor,
  icon,
}: {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: React.ReactNode;
}) => {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {icon}

      <Text
        style={[
          styles.badgeText,
          {
            color,
          },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
};

const PartnerCard = ({
  item,
  index,
  isSelected,
  schemeId,
  onSelect,
  onDirections,
  t,
}: {
  item: NearestPartnerResponse;
  index: number;
  isSelected: boolean;
  schemeId?: string;
  onSelect: () => void;
  onDirections: () => void;
  t: any;
}) => {
  const partner = item.partner;

  if (!partner) return null;

  const category = partner.partner_category || "AUTHORIZED_SCHEME_PARTNER";

  const pinColor = getPartnerPinColor(partner);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Select ${partner.name}`}
      style={({ pressed }) => [
        styles.partnerCard,
        isSelected && styles.partnerCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.partnerHeader}>
        <View style={styles.partnerTitleRow}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>{index + 1}</Text>
          </View>

          <Text style={styles.partnerName} numberOfLines={3}>
            {partner.name}
          </Text>
        </View>

        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {item.distance_km != null
              ? formatDistance(item.distance_km ?? 0)
              : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.partnerContent}>
        {category === "AUTHORIZED_SCHEME_PARTNER" && (
          <CategoryBadge
            label={t(
              "partnerLocator.badgeAuthorized",
              "OFFICIALLY VERIFIED SCHEME PARTNER",
            )}
            color="#1e40af"
            backgroundColor="#eff6ff"
            borderColor="#bfdbfe"
            icon={<ShieldCheck size={13} color="#2563eb" />}
          />
        )}

        {category === "IMPLEMENTING_ASSISTANCE_CENTRE" && (
          <CategoryBadge
            label={t(
              "partnerLocator.badgeAssistance",
              "GOVERNMENT ASSISTANCE CENTRE",
            )}
            color="#065f46"
            backgroundColor="#ecfdf5"
            borderColor="#a7f3d0"
            icon={<Building2 size={13} color="#059669" />}
          />
        )}

        {category === "NEARBY_FINANCIAL_SERVICE_POINT" && (
          <CategoryBadge
            label={t(
              "partnerLocator.badgeFinancial",
              "FINANCIAL INSTITUTION (GENERAL ROUTE)",
            )}
            color="#92400e"
            backgroundColor="#fffbeb"
            borderColor="#fde68a"
            icon={<Building size={13} color="#d97706" />}
          />
        )}

        {partner.institution_type && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {partner.institution_type.replace(/_/g, " ")}
            </Text>
          </View>
        )}

        {partner.address && (
          <View style={styles.infoRow}>
            <MapPin size={15} color="#94a3b8" />

            <Text style={styles.infoText}>{partner.address}</Text>
          </View>
        )}

        <View style={styles.contactRow}>
          {partner.phone && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                callPhone(partner.phone!);
              }}
              style={styles.contactButton}
              accessibilityRole="button"
              accessibilityLabel={`Call ${partner.name}`}
            >
              <Phone size={13} color="#64748b" />
              <Text style={styles.contactButtonText} numberOfLines={1}>
                {partner.phone}
              </Text>
            </Pressable>
          )}

          {partner.email && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                sendEmail(partner.email!);
              }}
              style={styles.contactButton}
              accessibilityRole="button"
              accessibilityLabel={`Email ${partner.name}`}
            >
              <Mail size={13} color="#64748b" />
              <Text style={styles.contactButtonText} numberOfLines={1}>
                Email
              </Text>
            </Pressable>
          )}

          {partner.website && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                openWebsite(partner.website!);
              }}
              style={styles.websiteButton}
              accessibilityRole="button"
              accessibilityLabel={`Open website for ${partner.name}`}
            >
              <Globe size={13} color="#0284c7" />

              <Text style={styles.websiteButtonText}>
                {t("partnerLocator.website", "Website")}
              </Text>
            </Pressable>
          )}
        </View>

        {partner.source_url && (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              openWebsite(partner.source_url!);
            }}
            style={styles.sourceButton}
            accessibilityRole="link"
            accessibilityLabel={`Open official source for ${partner.name}`}
          >
            <ExternalLink size={13} color="#4f46e5" />

            <Text style={styles.sourceButtonText}>
              {t("partnerLocator.officialSource", "Official Source")}
            </Text>
          </Pressable>
        )}

        {partner.supported_schemes && partner.supported_schemes.length > 0 && (
          <View style={styles.supportedSchemes}>
            <Text style={styles.supportedLabel}>
              {t("partnerLocator.schemesSupported", "Schemes Supported")}:{" "}
            </Text>

            <Text style={styles.supportedText}>
              {partner.supported_schemes.slice(0, 3).join(", ")}

              {partner.supported_schemes.length > 3 && (
                <Text style={styles.moreSchemes}>
                  {` +${partner.supported_schemes.length - 3} more`}
                </Text>
              )}
            </Text>
          </View>
        )}

        {item.is_scheme_matched ? (
          <View style={styles.authorizationSuccess}>
            <ShieldCheck size={15} color="#059669" />

            <Text style={styles.authorizationSuccessText}>
              {t("map.authorizedForScheme", "Authorized for selected scheme")}

              {item.service_type
                ? ` (${item.service_type.replace(/_/g, " ")})`
                : ""}
            </Text>
          </View>
        ) : schemeId ? (
          <View style={styles.authorizationWarning}>
            <AlertCircle size={15} color="#d97706" />

            <Text style={styles.authorizationWarningText}>
              {t(
                "map.authPending",
                "Scheme-specific authorization not confirmed",
              )}
            </Text>
          </View>
        ) : null}

        <View style={styles.verifiedRow}>
          <Text style={styles.verifiedLabel}>
            {t("partnerLocator.lastVerified", "Last verified")}:
          </Text>

          <Text style={styles.verifiedValue}>
            {partner.last_verified_date || "Not available"}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.selectedIndicator}>
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>

            <Text style={styles.selectText}>
              {t("map.selectPartner", "Select Partner")}
            </Text>
          </View>

          {isValidCoord(partner.latitude, partner.longitude) && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDirections();
              }}
              style={({ pressed }) => [
                styles.directionsButton,
                pressed && styles.directionsButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Get directions to ${partner.name}`}
            >
              <ExternalLink size={13} color="#7dd3fc" />

              <Text style={styles.directionsText}>
                {t("partnerLocator.getDirections", "Get Directions")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export const MapLocator: React.FC<MapLocatorProps> = ({
  onSelectPartner,
  selectedPartnerId: initialSelectedId = null,
  schemeId,
  schemeName,
  loanCategory,
}) => {
  const { t } = useTranslation();

  const mapRef = useRef<MapView | null>(null);

  const [gpsLocation, setGpsLocation] = useState<UserLocation | null>(null);

  const [isGpsActive, setIsGpsActive] = useState(false);

  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const [pinCode, setPinCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isLocating, setIsLocating] = useState(false);

  const [partners, setPartners] = useState<NearestPartnerResponse[]>([]);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    initialSelectedId,
  );

  useEffect(() => {
    setSelectedPartnerId(initialSelectedId);
  }, [initialSelectedId]);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [routeInfo, setRouteInfo] = useState<OSRMRouteInfo | null>(null);

  const [routeStatus, setRouteStatus] = useState<string | null>(null);

  const [isMapLocked, setIsMapLocked] = useState(false);

  const filteredPartners = useMemo(() => {
    if (selectedCategoryFilter === "ALL") {
      return partners;
    }

    if (selectedCategoryFilter === "AUTHORIZED_SCHEME_PARTNER") {
      return partners.filter(
        (item) =>
          item.partner?.partner_category === "AUTHORIZED_SCHEME_PARTNER",
      );
    }

    if (selectedCategoryFilter === "IMPLEMENTING_ASSISTANCE_CENTRE") {
      return partners.filter(
        (item) =>
          item.partner?.partner_category === "IMPLEMENTING_ASSISTANCE_CENTRE",
      );
    }

    if (selectedCategoryFilter === "NEARBY_FINANCIAL_SERVICE_POINT") {
      return partners.filter(
        (item) =>
          item.partner?.partner_category === "NEARBY_FINANCIAL_SERVICE_POINT",
      );
    }

    if (selectedCategoryFilter === "TRAINING_HANDHOLDING_CENTRE") {
      return partners.filter((item) => {
        const partner = item.partner;

        return (
          partner?.institution_type === "RSETI_TRAINING_INSTITUTE" ||
          partner?.partner_type === "RSETI_TRAINING_INSTITUTE" ||
          item.service_type?.includes("TRAINING") ||
          partner?.service_type?.includes("TRAINING")
        );
      });
    }

    if (selectedCategoryFilter === "VERIFIED") {
      return partners.filter(
        (item) => item.partner?.verification_status === "VERIFIED_OFFICIAL",
      );
    }

    return partners;
  }, [partners, selectedCategoryFilter]);

  const activeOrigin = useMemo<ActiveOrigin | null>(() => {
    if (
      isGpsActive &&
      gpsLocation &&
      isValidCoord(gpsLocation.lat, gpsLocation.lng)
    ) {
      return {
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        label: "your current location",
        isGps: true,
      };
    }

    if (
      searchLocation &&
      isValidCoord(searchLocation.lat, searchLocation.lng)
    ) {
      return {
        lat: searchLocation.lat,
        lng: searchLocation.lng,
        label: searchLocation.label,
        isGps: false,
      };
    }

    return null;
  }, [gpsLocation, isGpsActive, searchLocation]);

  const selectedPartnerObj = useMemo(() => {
    return (
      partners.find((item) => item.partner?.partner_id === selectedPartnerId) ||
      null
    );
  }, [partners, selectedPartnerId]);

  const processAndSetPartners = useCallback(
    (
      rawPartners: NearestPartnerResponse[],
      originLat: number,
      originLng: number,
    ) => {
      const validPartners = (Array.isArray(rawPartners) ? rawPartners : [])
        .filter(
          (item) =>
            item?.partner &&
            typeof item.partner.latitude === "number" &&
            typeof item.partner.longitude === "number" &&
            isValidCoord(item.partner.latitude, item.partner.longitude),
        )
        .map((item) => {
          const latitude = item.partner!.latitude as number;

          const longitude = item.partner!.longitude as number;

          return {
            ...item,
            distance_km: calculateHaversineKm(
              originLat,
              originLng,
              latitude,
              longitude,
            ),
          };
        })
        .sort((a, b) => a.distance_km - b.distance_km);

      setPartners(validPartners);

      if (validPartners.length > 0) {
        const firstId = validPartners[0].partner.partner_id;

        setSelectedPartnerId(firstId);
        onSelectPartner?.(firstId);
        setErrorMsg(null);
      } else {
        setSelectedPartnerId(null);

        if (schemeId) {
          setErrorMsg(
            "No verified channel partner is currently mapped to this scheme in this area. Please apply directly through the official government portal.",
          );
        } else {
          setErrorMsg(
            "No verified channel partner was found matching this criteria.",
          );
        }
      }
    },
    [onSelectPartner, schemeId],
  );

  const fetchPartners = useCallback(
    async (latitude?: number, longitude?: number, radiusKm = 2500) => {
      setIsLoading(true);
      setErrorMsg(null);

      const queryLat = latitude ?? activeOrigin?.lat ?? 28.6139;

      const queryLng = longitude ?? activeOrigin?.lng ?? 77.209;

      try {
        const data = await partnerApi.getNearestPartners(
          queryLat,
          queryLng,
          radiusKm,
          schemeId,
          loanCategory,
        );

        processAndSetPartners(data, queryLat, queryLng);
      } catch (error: any) {
        console.error("Failed to load nearest partners:", error);

        setErrorMsg(
          error?.response?.data?.detail ||
            "Unable to connect to partner directory service.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeOrigin, loanCategory, processAndSetPartners, schemeId],
  );

  useEffect(() => {
    fetchPartners();
  }, [schemeId, loanCategory]);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setErrorMsg(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setErrorMsg(
          "Location services are disabled. Please enable location services or search by PIN/city.",
        );
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg(
          "Location permission denied. Please allow location access or search by PIN/city.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;

      const lng = location.coords.longitude;

      if (!isValidCoord(lat, lng)) {
        setErrorMsg("Received invalid GPS coordinates.");
        return;
      }

      setGpsLocation({
        lat,
        lng,
      });

      setIsGpsActive(true);
      setSearchLocation(null);

      await fetchPartners(lat, lng, 350);

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          ...DEFAULT_DELTA,
        },
        700,
      );
    } catch (error) {
      console.error("Location error:", error);

      setErrorMsg(
        "Unable to retrieve your location. Please search by PIN or city.",
      );
    } finally {
      setIsLocating(false);
    }
  }, [fetchPartners]);

  const handleSearch = useCallback(async () => {
    const cleanInput = pinCode.trim();

    if (!cleanInput) {
      setErrorMsg("Please enter a valid PIN code, district, or state name.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    let searchLat: number | null = null;

    let searchLng: number | null = null;

    let displayName = cleanInput;

    const cached = geocodeCache.get(cleanInput.toLowerCase());

    if (cached) {
      searchLat = cached.lat;
      searchLng = cached.lng;
      displayName = cached.displayName;
    } else {
      try {
        const query = `${cleanInput}, India`;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query,
          )}&format=json&addressdetails=1&limit=1&countrycodes=in`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "YojnaSetu-Mobile/1.0",
            },
          },
        );

        if (response.ok) {
          const results = await response.json();

          if (Array.isArray(results) && results.length > 0) {
            const lat = Number(results[0].lat);

            const lng = Number(results[0].lon);

            if (isValidCoord(lat, lng)) {
              searchLat = lat;
              searchLng = lng;

              displayName = results[0].display_name || cleanInput;

              geocodeCache.set(cleanInput.toLowerCase(), {
                lat,
                lng,
                displayName,
              });
            }
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);

        setErrorMsg(
          "Network error while searching location. Please check your internet connection.",
        );

        setIsLoading(false);
        return;
      }
    }

    if (!isValidCoord(searchLat, searchLng)) {
      setErrorMsg(
        `Could not locate "${cleanInput}". Please try another PIN code or district name.`,
      );

      setIsLoading(false);
      return;
    }

    const lat = searchLat as number;
    const lng = searchLng as number;

    setSearchLocation({
      lat,
      lng,
      label: cleanInput,
    });

    setIsGpsActive(false);

    try {
      const data = await partnerApi.getNearestPartners(
        lat,
        lng,
        500,
        schemeId,
        loanCategory,
      );

      processAndSetPartners(data, lat, lng);

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          ...DEFAULT_DELTA,
        },
        700,
      );
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.detail || "Failed to fetch nearby partners.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loanCategory, pinCode, processAndSetPartners, schemeId]);

  const handleQuickCity = useCallback(
    async (name: string, lat: number, lng: number) => {
      setPinCode(name);
      setSearchLocation({
        lat,
        lng,
        label: name,
      });
      setIsGpsActive(false);

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const data = await partnerApi.getNearestPartners(
          lat,
          lng,
          250,
          schemeId,
          loanCategory,
        );

        processAndSetPartners(data, lat, lng);

        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            ...DEFAULT_DELTA,
          },
          700,
        );
      } catch (error: any) {
        setErrorMsg(
          error?.response?.data?.detail || "Failed to fetch nearby partners.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loanCategory, processAndSetPartners, schemeId],
  );

  const calculateRoute = useCallback(async () => {
    if (!activeOrigin || !selectedPartnerObj?.partner) {
      setRouteInfo(null);
      setRouteStatus(null);
      return;
    }

    const partner = selectedPartnerObj.partner;

    if (!isValidCoord(partner.latitude, partner.longitude)) {
      setRouteInfo(null);
      setRouteStatus(null);
      return;
    }

    setRouteStatus("Calculating driving route...");

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${activeOrigin.lng},${activeOrigin.lat};` +
        `${partner.longitude},${partner.latitude}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("OSRM request failed");
      }

      const data = await response.json();

      if (
        data.code !== "Ok" ||
        !Array.isArray(data.routes) ||
        !data.routes.length
      ) {
        throw new Error("Route unavailable");
      }

      const route = data.routes[0];

      const coordinates = Array.isArray(route.geometry?.coordinates)
        ? route.geometry.coordinates
            .filter(
              (point: unknown) =>
                Array.isArray(point) &&
                point.length >= 2 &&
                isValidCoord(Number(point[1]), Number(point[0])),
            )
            .map((point: [number, number]) => ({
              latitude: Number(point[1]),
              longitude: Number(point[0]),
            }))
        : [];

      if (coordinates.length < 2) {
        throw new Error("Invalid route coordinates");
      }

      setRouteInfo({
        coordinates,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMins: Math.round(route.duration / 60),
      });

      setRouteStatus(null);
    } catch (error) {
      console.warn("OSRM route unavailable:", error);

      setRouteInfo(null);
      setRouteStatus("Route unavailable right now.");
    }
  }, [activeOrigin, selectedPartnerObj]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const selectPartner = useCallback(
    (partnerId: string) => {
      setSelectedPartnerId(partnerId);

      onSelectPartner?.(partnerId);
    },
    [onSelectPartner],
  );

  const recenterMap = useCallback(() => {
    if (activeOrigin && isValidCoord(activeOrigin.lat, activeOrigin.lng)) {
      mapRef.current?.animateToRegion(
        {
          latitude: activeOrigin.lat,
          longitude: activeOrigin.lng,
          ...DEFAULT_DELTA,
        },
        600,
      );

      return;
    }

    if (filteredPartners.length > 0) {
      const valid = filteredPartners.filter(
        (item) =>
          item.partner &&
          isValidCoord(item.partner.latitude, item.partner.longitude),
      );

      if (valid.length > 0) {
        const lats = valid.map((item) => item.partner.latitude!);

        const lngs = valid.map((item) => item.partner.longitude!);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        mapRef.current?.fitToCoordinates(
          valid.map((item) => ({
            latitude: item.partner.latitude!,
            longitude: item.partner.longitude!,
          })),
          {
            edgePadding: {
              top: 80,
              right: 50,
              bottom: 80,
              left: 50,
            },
            animated: true,
          },
        );

        void minLat;
        void maxLat;
        void minLng;
        void maxLng;
        return;
      }
    }

    mapRef.current?.animateToRegion(
      {
        ...INDIA_CENTER,
        ...DEFAULT_DELTA,
      },
      600,
    );
  }, [activeOrigin, filteredPartners]);

  const mapCenter = activeOrigin
    ? {
        latitude: activeOrigin.lat,
        longitude: activeOrigin.lng,
      }
    : INDIA_CENTER;

  return (
    <View style={styles.container}>
      {/* ─────────────────────────────
          HEADER
      ───────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MapPin size={22} color="#4f46e5" />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {t("partnerLocator.title", "Channel Partner Locator")}
          </Text>

          <Text style={styles.headerSubtitle}>
            {schemeId
              ? t(
                  "partnerLocator.authorizedPartnersFor",
                  "Authorized channel partners for {{scheme}}",
                  {
                    scheme: schemeName || schemeId,
                  },
                )
              : t(
                  "partnerLocator.officialAgencies",
                  "Official channelizing agencies & banks",
                )}
          </Text>
        </View>
      </View>

      {/* ─────────────────────────────
          SEARCH CONTROLS
      ───────────────────────────── */}
      <View style={styles.controls}>
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={isLocating || isLoading}
          style={({ pressed }) => [
            styles.locationButton,
            isGpsActive && styles.locationButtonActive,
            pressed && styles.locationButtonPressed,
            (isLocating || isLoading) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Navigation size={17} color="#ffffff" />
          )}

          <Text style={styles.locationButtonText}>
            {isGpsActive
              ? `✓ ${t(
                  "partnerLocator.currentGpsActive",
                  "Current GPS Location Active",
                )}`
              : t(
                  "partnerLocator.useCurrentLocation",
                  "Use My Current Location",
                )}
          </Text>
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />

          <Text style={styles.orText}>
            {t("partnerLocator.orFilterArea", "OR SEARCH AREA")}
          </Text>

          <View style={styles.orLine} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Search size={17} color="#94a3b8" />

            <TextInput
              value={pinCode}
              onChangeText={setPinCode}
              onSubmitEditing={handleSearch}
              placeholder={t(
                "partnerLocator.searchPlaceholder",
                "Enter state, PIN or city",
              )}
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              autoCapitalize="words"
              returnKeyType="search"
            />
          </View>

          <Pressable
            onPress={handleSearch}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchButtonPressed,
              isLoading && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search location"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Search size={16} color="#ffffff" />
            )}

            <Text style={styles.searchButtonText}>
              {t("partnerLocator.search", "Search")}
            </Text>
          </Pressable>
        </View>

        {/* QUICK CITIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickCities}
        >
          <Text style={styles.quickLabel}>
            {t("partnerLocator.quickFocus", "Quick Focus:")}
          </Text>

          {[
            {
              name: "Gorakhpur",
              lat: 26.7606,
              lng: 83.3732,
            },
            {
              name: "Lucknow",
              lat: 26.8467,
              lng: 80.9462,
            },
            {
              name: "Varanasi",
              lat: 25.3176,
              lng: 82.9739,
            },
            {
              name: "Kanpur",
              lat: 26.4499,
              lng: 80.3319,
            },
            {
              name: "Prayagraj",
              lat: 25.4358,
              lng: 81.8463,
            },
          ].map((city) => {
            const active = pinCode.toLowerCase() === city.name.toLowerCase();

            return (
              <Pressable
                key={city.name}
                onPress={() => handleQuickCity(city.name, city.lat, city.lng)}
                style={[styles.cityChip, active && styles.cityChipActive]}
              >
                <Text
                  style={[
                    styles.cityChipText,
                    active && styles.cityChipTextActive,
                  ]}
                >
                  {city.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ORIGIN STATUS */}
        {activeOrigin && (
          <View
            style={[
              styles.originBanner,
              activeOrigin.isGps ? styles.gpsBanner : styles.searchBanner,
            ]}
          >
            {activeOrigin.isGps ? (
              <Navigation size={15} color="#059669" />
            ) : (
              <MapPin size={15} color="#475569" />
            )}

            <Text
              style={[
                styles.originText,
                activeOrigin.isGps && styles.originGpsText,
              ]}
            >
              {activeOrigin.isGps
                ? t(
                    "partnerLocator.distGps",
                    "Distances computed from your GPS location",
                  )
                : t(
                    "partnerLocator.distCustom",
                    "Distances computed from {{label}}",
                    {
                      label: activeOrigin.label,
                    },
                  )}
            </Text>
          </View>
        )}
      </View>

      {/* ─────────────────────────────
          CATEGORY FILTER
      ───────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {[
          {
            id: "ALL",
            label: t("partnerLocator.categoryAll", "All Partners"),
          },
          {
            id: "AUTHORIZED_SCHEME_PARTNER",
            label: t(
              "partnerLocator.categoryAuthorized",
              "Authorized Partners",
            ),
          },
          {
            id: "IMPLEMENTING_ASSISTANCE_CENTRE",
            label: t("partnerLocator.categoryAssistance", "Assistance Centres"),
          },
          {
            id: "TRAINING_HANDHOLDING_CENTRE",
            label: t("partnerLocator.categoryTraining", "Training / EDP"),
          },
          {
            id: "NEARBY_FINANCIAL_SERVICE_POINT",
            label: t(
              "partnerLocator.categoryFinancial",
              "Financial Institutions",
            ),
          },
        ].map((tab) => {
          const active = selectedCategoryFilter === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => setSelectedCategoryFilter(tab.id)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ─────────────────────────────
          MAP
      ───────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            ...mapCenter,
            ...DEFAULT_DELTA,
          }}
          showsUserLocation={isGpsActive}
          showsMyLocationButton={false}
          showsCompass
          rotateEnabled={false}
          scrollEnabled={!isMapLocked}
          zoomEnabled={!isMapLocked}
          pitchEnabled={!isMapLocked}
          toolbarEnabled={false}
        >
          {/* ACTIVE ORIGIN */}
          {activeOrigin && isValidCoord(activeOrigin.lat, activeOrigin.lng) && (
            <Marker
              coordinate={{
                latitude: activeOrigin.lat,
                longitude: activeOrigin.lng,
              }}
              pinColor={activeOrigin.isGps ? "#ea580c" : "#334155"}
              title={
                activeOrigin.isGps ? "Your Current Location" : "Searched Area"
              }
              description={
                activeOrigin.isGps ? "GPS location" : activeOrigin.label
              }
            />
          )}

          {/* ROUTE */}
          {routeInfo && routeInfo.coordinates.length > 1 && (
            <Polyline
              coordinates={routeInfo.coordinates}
              strokeColor="#4f46e5"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* PARTNERS */}
          {filteredPartners.map((item, index) => {
            const partner = item.partner;

            if (
              !partner ||
              !isValidCoord(partner.latitude, partner.longitude)
            ) {
              return null;
            }

            const isSelected = selectedPartnerId === partner.partner_id;

            return (
              <Marker
                key={partner.partner_id}
                coordinate={{
                  latitude: partner.latitude!,
                  longitude: partner.longitude!,
                }}
                pinColor={isSelected ? "#4f46e5" : getPartnerPinColor(partner)}
                title={`${index + 1}. ${partner.name}`}
                description={
                  partner.address ||
                  partner.institution_type ||
                  partner.partner_type ||
                  undefined
                }
                onPress={() => selectPartner(partner.partner_id)}
              >
                <Callout
                  tooltip
                  onPress={() => selectPartner(partner.partner_id)}
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle} numberOfLines={2}>
                      {index + 1}. {partner.name}
                    </Text>

                    <Text style={styles.calloutInstitution}>
                      {partner.institution_type || partner.partner_type}
                    </Text>

                    {partner.address && (
                      <Text style={styles.calloutAddress} numberOfLines={3}>
                        {partner.address}
                      </Text>
                    )}

                    {item.is_scheme_matched && (
                      <View style={styles.calloutAuthorized}>
                        <ShieldCheck size={12} color="#059669" />

                        <Text style={styles.calloutAuthorizedText}>
                          Scheme Authorized
                        </Text>
                      </View>
                    )}

                    <Text style={styles.calloutDistance}>
                      {item.distance_km != null
                        ? formatDistance(item.distance_km)
                        : "—"}
                    </Text>

                    <Pressable
                      onPress={() =>
                        openDirections(partner.latitude!, partner.longitude!)
                      }
                      style={styles.calloutDirections}
                    >
                      <ExternalLink size={13} color="#ffffff" />

                      <Text style={styles.calloutDirectionsText}>
                        {t("partnerLocator.getDirections", "Get Directions")}
                      </Text>
                    </Pressable>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* MAP CONTROLS */}
        <View style={styles.mapControls}>
          <Pressable
            onPress={() =>
              mapRef.current?.getCamera().then((camera) => {
                mapRef.current?.animateCamera(
                  {
                    ...camera,
                    zoom: (camera.zoom || 10) + 1,
                  },
                  {
                    duration: 250,
                  },
                );
              })
            }
            style={styles.mapButton}
            accessibilityLabel="Zoom in"
          >
            <Text style={styles.zoomText}>+</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              mapRef.current?.getCamera().then((camera) => {
                mapRef.current?.animateCamera(
                  {
                    ...camera,
                    zoom: Math.max(2, (camera.zoom || 10) - 1),
                  },
                  {
                    duration: 250,
                  },
                );
              })
            }
            style={styles.mapButton}
            accessibilityLabel="Zoom out"
          >
            <Text style={styles.zoomText}>−</Text>
          </Pressable>

          <Pressable
            onPress={recenterMap}
            style={styles.mapButton}
            accessibilityLabel="Recenter map"
          >
            <RotateCcw size={18} color="#475569" />
          </Pressable>

          <Pressable
            onPress={() => setIsMapLocked((value) => !value)}
            style={[styles.mapButton, isMapLocked && styles.mapButtonLocked]}
            accessibilityLabel={
              isMapLocked ? "Unlock map gestures" : "Lock map gestures"
            }
          >
            {isMapLocked ? (
              <Lock size={17} color="#ffffff" />
            ) : (
              <Unlock size={17} color="#475569" />
            )}
          </Pressable>
        </View>

        {/* ROUTE STATUS */}
        {routeStatus && (
          <View style={styles.routeStatus}>
            <ActivityIndicator size="small" color="#4f46e5" />

            <Text style={styles.routeStatusText}>{routeStatus}</Text>
          </View>
        )}
      </View>

      {/* ─────────────────────────────
          SCHEME INFO
      ───────────────────────────── */}
      {schemeId && (
        <View style={styles.schemeBanner}>
          <View style={styles.schemeBannerTop}>
            <View style={styles.schemeTitleRow}>
              <ShieldCheck size={17} color="#4f46e5" />

              <Text style={styles.schemeBannerTitle} numberOfLines={2}>
                {t(
                  "partnerLocator.partnersForScheme",
                  "Partners for: {{scheme}}",
                  {
                    scheme: schemeName || schemeId,
                  },
                )}
              </Text>
            </View>

            <View style={styles.authorizedCount}>
              <Text style={styles.authorizedCountText}>
                {filteredPartners.length}{" "}
                {t("partnerLocator.authorized", "Authorized")}
              </Text>
            </View>
          </View>

          <Text style={styles.schemeDescription}>
            {t(
              "partnerLocator.verifiedDesc",
              "Only displaying verified partners officially authorized to deliver this scheme.",
            )}
          </Text>
        </View>
      )}

      {/* ─────────────────────────────
          ROUTE SUMMARY
      ───────────────────────────── */}
      {routeInfo && selectedPartnerObj && (
        <View style={styles.routeSummary}>
          <View>
            <Text style={styles.routeSummaryTitle}>
              {t("partnerLocator.drivingRoute", "Driving Route")}
            </Text>

            <Text style={styles.routeSummaryValue}>
              {routeInfo.distanceKm.toLocaleString()} km • ~
              {formatDuration(routeInfo.durationMins)}
            </Text>
          </View>

          <View style={styles.drivingBadge}>
            <Navigation size={13} color="#4338ca" />

            <Text style={styles.drivingBadgeText}>
              {t("partnerLocator.driving", "Driving")}
            </Text>
          </View>
        </View>
      )}

      {/* ─────────────────────────────
          ERROR
      ───────────────────────────── */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <AlertCircle size={19} color="#d97706" />

          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* ─────────────────────────────
          PARTNER COUNT
      ───────────────────────────── */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {schemeId
            ? t(
                "partnerLocator.authorizedPartners",
                "Authorized Channel Partners ({{count}})",
                {
                  count: filteredPartners.length,
                },
              )
            : t(
                "partnerLocator.recommendedPartners",
                "Recommended Channel Partners ({{count}})",
                {
                  count: filteredPartners.length,
                },
              )}
        </Text>

        <ChevronDown size={17} color="#64748b" />
      </View>

      {/* ─────────────────────────────
          PARTNER LIST
      ───────────────────────────── */}
      <View style={styles.partnerList}>
        {isLoading && filteredPartners.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#4f46e5" />

            <Text style={styles.loadingText}>
              Finding nearby verified partners...
            </Text>
          </View>
        )}

        {!isLoading && filteredPartners.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <AlertCircle size={28} color="#d97706" />
            </View>

            <Text style={styles.emptyTitle}>
              {t(
                "partnerLocator.noPartnerTitle",
                "No verified authorized partner was found for this scheme in this area.",
              )}
            </Text>

            <Text style={styles.emptyDescription}>
              {t(
                "partnerLocator.noPartnerDesc",
                "Submissions for this scheme are handled directly via the official government portal or statutory district office.",
              )}
            </Text>

            <Pressable
              onPress={() => handleQuickCity("Gorakhpur", 26.7606, 83.3732)}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>
                {t(
                  "partnerLocator.browseGorakhpur",
                  "Browse verified Gorakhpur & UP centres →",
                )}
              </Text>
            </Pressable>
          </View>
        )}

        {filteredPartners.map((item, index) => (
          <PartnerCard
            key={item.partner?.partner_id || `partner-${index}`}
            item={item}
            index={index}
            isSelected={selectedPartnerId === item.partner?.partner_id}
            schemeId={schemeId}
            onSelect={() =>
              item.partner && selectPartner(item.partner.partner_id)
            }
            onDirections={() =>
              item.partner &&
              openDirections(item.partner.latitude!, item.partner.longitude!)
            }
            t={t}
          />
        ))}
      </View>

      {/* APPLICATION NOTICE */}
      {selectedPartnerId && (
        <View style={styles.applicationNotice}>
          <AlertCircle size={15} color="#d97706" />

          <Text style={styles.applicationNoticeText}>
            YojnaSetu only provides eligibility guidance and partner discovery.
            Applications are submitted directly on official government/bank
            portals.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },

  headerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 2,
  },

  controls: {
    padding: 14,
    backgroundColor: "#ffffff",
  },

  locationButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    gap: 8,
  },

  locationButtonActive: {
    backgroundColor: "#059669",
  },

  locationButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  locationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.55,
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },

  orText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },

  searchRow: {
    flexDirection: "row",
    gap: 8,
  },

  searchInputContainer: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: "#ffffff",
  },

  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 0,
  },

  searchButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  searchButtonPressed: {
    opacity: 0.85,
  },

  searchButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  quickCities: {
    alignItems: "center",
    gap: 6,
    paddingTop: 11,
    paddingBottom: 2,
  },

  quickLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  cityChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },

  cityChipActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#7dd3fc",
  },

  cityChipText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
  },

  cityChipTextActive: {
    color: "#075985",
  },

  originBanner: {
    marginTop: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  gpsBanner: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },

  searchBanner: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  originText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    fontWeight: "600",
  },

  originGpsText: {
    color: "#065f46",
  },

  categoryContainer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 7,
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  categoryChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },

  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },

  categoryTextActive: {
    color: "#ffffff",
  },

  mapContainer: {
    height: 330,
    backgroundColor: "#e2e8f0",
    position: "relative",
  },

  mapControls: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 7,
  },

  mapButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  mapButtonLocked: {
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
  },

  zoomText: {
    fontSize: 25,
    lineHeight: 27,
    color: "#475569",
    fontWeight: "400",
  },

  routeStatus: {
    position: "absolute",
    left: 12,
    right: 65,
    bottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },

  routeStatusText: {
    flex: 1,
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },

  callout: {
    width: 245,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  calloutTitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#0f172a",
    fontWeight: "800",
  },

  calloutInstitution: {
    marginTop: 4,
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },

  calloutAddress: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 14,
    color: "#475569",
  },

  calloutAuthorized: {
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  calloutAuthorizedText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "800",
  },

  calloutDistance: {
    marginTop: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: 10,
    fontWeight: "800",
  },

  calloutDirections: {
    marginTop: 9,
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  calloutDirectionsText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  schemeBanner: {
    margin: 14,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },

  schemeBannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  schemeTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  schemeBannerTitle: {
    flex: 1,
    color: "#312e81",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },

  authorizedCount: {
    backgroundColor: "#c7d2fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  authorizedCountText: {
    color: "#3730a3",
    fontSize: 9,
    fontWeight: "800",
  },

  schemeDescription: {
    marginTop: 6,
    color: "#4338ca",
    fontSize: 9,
    lineHeight: 14,
  },

  routeSummary: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  routeSummaryTitle: {
    color: "#4338ca",
    fontSize: 10,
    fontWeight: "800",
  },

  routeSummaryValue: {
    marginTop: 3,
    color: "#312e81",
    fontSize: 11,
    fontWeight: "600",
  },

  drivingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#c7d2fe",
  },

  drivingBadgeText: {
    color: "#4338ca",
    fontSize: 9,
    fontWeight: "800",
  },

  errorBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: "#78350f",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
  },

  listHeader: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  listHeaderText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  partnerList: {
    padding: 12,
    backgroundColor: "#f8fafc",
    gap: 10,
  },

  partnerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 12,
  },

  partnerCardSelected: {
    borderColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  pressed: {
    opacity: 0.92,
  },

  partnerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  partnerTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  numberBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  partnerName: {
    flex: 1,
    color: "#0f172a",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },

  distanceText: {
    color: "#4338ca",
    fontSize: 9,
    fontWeight: "800",
  },

  partnerContent: {
    marginLeft: 32,
    marginTop: 7,
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 5,
  },

  badgeText: {
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 11,
    flexShrink: 1,
  },

  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    marginBottom: 6,
  },

  typeBadgeText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 7,
  },

  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
  },

  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 5,
  },

  contactButton: {
    maxWidth: "100%",
    minHeight: 29,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  contactButtonText: {
    maxWidth: 150,
    color: "#334155",
    fontSize: 8,
    fontWeight: "700",
  },

  websiteButton: {
    minHeight: 29,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  websiteButtonText: {
    color: "#0369a1",
    fontSize: 8,
    fontWeight: "800",
  },

  sourceButton: {
    alignSelf: "flex-start",
    minHeight: 29,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },

  sourceButtonText: {
    color: "#4338ca",
    fontSize: 8,
    fontWeight: "800",
  },

  supportedSchemes: {
    marginBottom: 7,
  },

  supportedLabel: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "800",
  },

  supportedText: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
  },

  moreSchemes: {
    color: "#4f46e5",
    fontWeight: "800",
  },

  authorizationSuccess: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 6,
  },

  authorizationSuccessText: {
    flex: 1,
    color: "#065f46",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },

  authorizationWarning: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 6,
  },

  authorizationWarningText: {
    flex: 1,
    color: "#92400e",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "600",
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    gap: 4,
  },

  verifiedLabel: {
    color: "#94a3b8",
    fontSize: 8,
  },

  verifiedValue: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
  },

  actionRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },

  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  radioOuter: {
    width: 17,
    height: 17,
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

  selectText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "800",
  },

  directionsButton: {
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  directionsButtonPressed: {
    opacity: 0.8,
  },

  directionsText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },

  loadingState: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 22,
    alignItems: "center",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    textAlign: "center",
    color: "#0f172a",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  emptyDescription: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },

  browseButton: {
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  browseButtonText: {
    color: "#0284c7",
    fontSize: 10,
    fontWeight: "800",
  },

  applicationNotice: {
    marginHorizontal: 14,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  applicationNoticeText: {
    flex: 1,
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
  },
});

export default MapLocator;
