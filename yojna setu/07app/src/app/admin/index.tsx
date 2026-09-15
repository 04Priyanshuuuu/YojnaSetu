import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  History,
  Layers,
  Search,
  Eye,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Plus,
  Edit3,
  Power,
  PowerOff,
  X,
  ChevronDown,
} from 'lucide-react-native';

import {
  adminApi,
  AdminDashboardSummaryResponse,
  SchemeAuditItem,
} from '../../api/adminApi';

type AdminTab =
  | 'OVERVIEW'
  | 'SCHEME_MANAGEMENT'
  | 'PARTNER_MANAGEMENT'
  | 'SCHEMES'
  | 'RULES'
  | 'DOCUMENTS'
  | 'CHANGELOG'
  | 'AI_HEALTH';

const COLORS = {
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  slate: '#334155',
  navy: '#020617',
  maroon: '#9F1239',
  maroonDark: '#4C0519',
  emerald: '#059669',
  amber: '#D97706',
  sky: '#0284C7',
  indigo: '#4338CA',
  roseBg: '#FFF1F2',
  emeraldBg: '#ECFDF5',
  skyBg: '#F0F9FF',
  amberBg: '#FFFBEB',
};

const tabs = [
  { id: 'OVERVIEW', label: 'Overview', icon: Layers },
  {
    id: 'SCHEME_MANAGEMENT',
    label: 'Manage',
    icon: SlidersHorizontal,
  },
  {
    id: 'PARTNER_MANAGEMENT',
    label: 'Partners',
    icon: Building2,
  },
  {
    id: 'SCHEMES',
    label: 'Audit',
    icon: ShieldCheck,
  },
  {
    id: 'RULES',
    label: 'Rules',
    icon: Database,
  },
  {
    id: 'DOCUMENTS',
    label: 'Documents',
    icon: FileText,
  },
  {
    id: 'CHANGELOG',
    label: 'Logs',
    icon: History,
  },
  {
    id: 'AI_HEALTH',
    label: 'AI Health',
    icon: Sparkles,
  },
] as const;

export default function AdminDashboard() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] =
    useState<AdminTab>('OVERVIEW');

  const [summary, setSummary] =
    useState<AdminDashboardSummaryResponse | null>(null);

  const [schemes, setSchemes] = useState<SchemeAuditItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [ministryFilter, setMinistryFilter] = useState('');
  const [schemeTypeFilter, setSchemeTypeFilter] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [selectedScheme, setSelectedScheme] =
    useState<SchemeAuditItem | null>(null);

  const [deactivateTarget, setDeactivateTarget] =
    useState<SchemeAuditItem | null>(null);

  const [deactivateReason, setDeactivateReason] =
    useState('');

  const [toggling, setToggling] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [
    searchQuery,
    ministryFilter,
    schemeTypeFilter,
    statusFilter,
  ]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const dashboard =
        await adminApi.getDashboardSummary();

      setSummary(dashboard);

      const result =
        await adminApi.getSchemeAuditList({
          search: searchQuery || undefined,
          ministry: ministryFilter || undefined,
          status:
            statusFilter === 'ALL'
              ? undefined
              : statusFilter,
          scheme_type:
            schemeTypeFilter || undefined,
          page_size: 100,
        });

      setSchemes(result.items);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        'Unable to load admin dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  const ministries = useMemo(
    () =>
      Array.from(
        new Set(
          schemes
            .map((item) => item.ministry)
            .filter(Boolean)
        )
      ).sort(),
    [schemes]
  );

  const sectors = useMemo(
    () =>
      Array.from(
        new Set(
          schemes
            .map(
              (item) =>
                item.scheme_type || item.sector
            )
            .filter(Boolean)
        )
      ).sort(),
    [schemes]
  );

  const activateScheme = async (
    scheme: SchemeAuditItem
  ) => {
    try {
      setToggling(true);

      await adminApi.updateSchemeStatus(
        scheme.scheme_id,
        'ACTIVE',
        'Re-activated by system administrator'
      );

      setSuccessMessage(
        `${scheme.scheme_name} activated successfully.`
      );

      fetchDashboard();
    } catch {
      Alert.alert(
        'Error',
        'Failed to activate scheme.'
      );
    } finally {
      setToggling(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;

    try {
      setToggling(true);

      await adminApi.updateSchemeStatus(
        deactivateTarget.scheme_id,
        'INACTIVE',
        deactivateReason ||
          'Deactivated via Admin Dashboard'
      );

      setSuccessMessage(
        `${deactivateTarget.scheme_name} deactivated successfully.`
      );

      setDeactivateTarget(null);
      setDeactivateReason('');

      fetchDashboard();
    } catch {
      Alert.alert(
        'Error',
        'Failed to deactivate scheme.'
      );
    } finally {
      setToggling(false);
    }
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={
              <ShieldCheck
                size={24}
                color={COLORS.emerald}
              />
            }
            value={`${summary?.verified_schemes ?? 0}/${summary?.total_schemes ?? 0}`}
            label="Verified Schemes"
            color={COLORS.emerald}
          />

          <MetricCard
            icon={
              <Database
                size={24}
                color={COLORS.indigo}
              />
            }
            value={summary?.total_rules ?? 0}
            label="Configured Rules"
            color={COLORS.indigo}
          />

          <MetricCard
            icon={
              <FileText
                size={24}
                color={COLORS.sky}
              />
            }
            value={summary?.total_documents ?? 0}
            label="Documents"
            color={COLORS.sky}
          />

          <MetricCard
            icon={
              <CheckCircle2
                size={24}
                color={COLORS.amber}
              />
            }
            value={`${summary?.avg_parameter_completeness ?? 0}%`}
            label="Completeness"
            color={COLORS.amber}
          />
        </View>

        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <ShieldCheck
              size={22}
              color={COLORS.emerald}
            />

            <Text style={styles.healthTitle}>
              System Health
            </Text>
          </View>

          <Text style={styles.healthDescription}>
            Platform monitoring and governance overview.
          </Text>

          <View style={styles.healthStatus}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              System operational
            </Text>
          </View>
        </View>

        <View style={styles.governanceCard}>
          <Text style={styles.governanceTitle}>
            Platform Data Quality & Governance
          </Text>

          <Text style={styles.governanceSubtitle}>
            Authoritative metrics from government scheme catalog.
          </Text>

          <View style={styles.governanceGrid}>
            <SmallMetric
              value={summary?.total_ministries ?? 15}
              label="Ministries"
            />

            <SmallMetric
              value={summary?.total_changelogs ?? 0}
              label="Changelog"
            />

            <SmallMetric
              value="12"
              label="Languages"
            />

            <SmallMetric
              value="56"
              label="Partner Centers"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderManagement = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.managementHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.managementTitleRow}>
            <SlidersHorizontal
              size={20}
              color={COLORS.maroon}
            />

            <Text style={styles.managementTitle}>
              Scheme Management
            </Text>
          </View>

          <Text style={styles.managementSubtitle}>
            CRUD control and lifecycle management.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() =>
            Alert.alert(
              'Add Scheme',
              'Connect this button with the native SchemeFormModal component.'
            )
          }
        >
          <Plus size={17} color="#FFF" />

          <Text style={styles.addButtonText}>
            Add
          </Text>
        </Pressable>
      </View>

      <FilterPanel
        search={searchQuery}
        setSearch={setSearchQuery}
        ministries={ministries}
        ministry={ministryFilter}
        setMinistry={setMinistryFilter}
        sectors={sectors}
        sector={schemeTypeFilter}
        setSector={setSchemeTypeFilter}
        status={statusFilter}
        setStatus={setStatusFilter}
      />

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={schemes}
          keyExtractor={(item) => item.scheme_id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <SchemeManagementCard
              scheme={item}
              onEdit={() =>
                Alert.alert(
                  'Edit Scheme',
                  'Connect this action with the native SchemeFormModal.'
                )
              }
              onView={() => setSelectedScheme(item)}
              onDeactivate={() =>
                setDeactivateTarget(item)
              }
              onActivate={() =>
                activateScheme(item)
              }
            />
          )}
          ListEmptyComponent={
            <Empty text="No schemes found." />
          }
        />
      )}
    </View>
  );

  const renderAudit = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.auditHeader}>
        <ShieldCheck
          size={22}
          color={COLORS.emerald}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.auditTitle}>
            Scheme Knowledge Base Audit
          </Text>

          <Text style={styles.auditSubtitle}>
            Verified schemes with completeness and official source.
          </Text>
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={schemes}
          keyExtractor={(item) => item.scheme_id}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            paddingBottom: 30,
          }}
          renderItem={({ item }) => (
            <AuditCard
              scheme={item}
              onView={() => setSelectedScheme(item)}
            />
          )}
        />
      )}
    </View>
  );

  const renderPlaceholder = (
    title: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <View style={styles.placeholder}>
      {icon}

      <Text style={styles.placeholderTitle}>
        {title}
      </Text>

      <Text style={styles.placeholderText}>
        {description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}

        <View style={styles.hero}>
          <View style={styles.badge}>
            <ShieldAlert
              size={15}
              color="#FDA4AF"
            />

            <Text style={styles.badgeText}>
              GLOBAL SYSTEM ADMIN
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            YojnaSetu Admin Dashboard
          </Text>

          <Text style={styles.heroSubtitle}>
            Manage verified schemes, statutory rules,
            documents, AI health and audit governance.
          </Text>
        </View>

        {/* Success */}

        {successMessage && (
          <View style={styles.successBanner}>
            <CheckCircle2
              size={18}
              color={COLORS.emerald}
            />

            <Text style={styles.successText}>
              {successMessage}
            </Text>

            <Pressable
              onPress={() =>
                setSuccessMessage(null)
              }
            >
              <X
                size={18}
                color={COLORS.emerald}
              />
            </Pressable>
          </View>
        )}

        {/* Tabs */}

        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;

              const active =
                activeTab === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() =>
                    setActiveTab(
                      tab.id as AdminTab
                    )
                  }
                  style={[
                    styles.tab,
                    active && styles.activeTab,
                  ]}
                >
                  <Icon
                    size={16}
                    color={
                      active
                        ? '#FFF'
                        : COLORS.muted
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,
                      active &&
                        styles.activeTabText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}

        <View style={{ flex: 1 }}>
          {activeTab === 'OVERVIEW' &&
            renderOverview()}

          {activeTab ===
            'SCHEME_MANAGEMENT' &&
            renderManagement()}

          {activeTab === 'SCHEMES' &&
            renderAudit()}

          {activeTab ===
            'PARTNER_MANAGEMENT' &&
            renderPlaceholder(
              'Channel Partner Management',
              'Connect this tab with the native PartnerManagementTable component.',
              <Building2
                size={42}
                color={COLORS.sky}
              />
            )}

          {activeTab === 'RULES' &&
            renderPlaceholder(
              'Rules Engine',
              'Connect this tab with the native RuleAuditTable component.',
              <Database
                size={42}
                color={COLORS.indigo}
              />
            )}

          {activeTab === 'DOCUMENTS' &&
            renderPlaceholder(
              'Documents Checklist',
              'Connect this tab with the native DocumentAuditTable component.',
              <FileText
                size={42}
                color={COLORS.amber}
              />
            )}

          {activeTab === 'CHANGELOG' &&
            renderPlaceholder(
              'Scheme Changelogs',
              'Connect this tab with the native ChangelogTable component.',
              <History
                size={42}
                color={COLORS.maroon}
              />
            )}

          {activeTab === 'AI_HEALTH' &&
            renderPlaceholder(
              'AI & RAG Health',
              'Connect this tab with the native AIHealthCard component.',
              <Sparkles
                size={42}
                color={COLORS.emerald}
              />
            )}
        </View>
      </View>

      {/* Detail Modal */}

      <SchemeDetailModal
        scheme={selectedScheme}
        onClose={() =>
          setSelectedScheme(null)
        }
      />

      {/* Deactivate Modal */}

      <Modal
        visible={!!deactivateTarget}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.warningIcon}>
                <AlertTriangle
                  size={25}
                  color="#E11D48"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Deactivate Scheme?
                </Text>

                <Text style={styles.modalSubtitle}>
                  Soft deactivation confirmation
                </Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningScheme}>
                {deactivateTarget?.scheme_name}
              </Text>

              <Text style={styles.warningId}>
                {deactivateTarget?.scheme_id}
              </Text>

              <Text style={styles.warningText}>
                This scheme will be hidden from the
                public catalog and recommendations.
                Historical records remain preserved.
              </Text>
            </View>

            <Text style={styles.reasonLabel}>
              Deactivation Reason
            </Text>

            <TextInput
              value={deactivateReason}
              onChangeText={setDeactivateReason}
              placeholder="Reason..."
              multiline
              style={styles.reasonInput}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setDeactivateTarget(null);
                  setDeactivateReason('');
                }}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                disabled={toggling}
                onPress={confirmDeactivate}
              >
                {toggling ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <PowerOff
                      size={15}
                      color="#FFF"
                    />

                    <Text style={styles.confirmText}>
                      Confirm
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      {icon}

      <Text
        style={[
          styles.metricValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function SmallMetric({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.smallMetric}>
      <Text style={styles.smallMetricValue}>
        {value}
      </Text>

      <Text style={styles.smallMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator
        size="large"
        color={COLORS.maroon}
      />

      <Text style={styles.loadingText}>
        Loading dashboard...
      </Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Search
        size={36}
        color="#94A3B8"
      />

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

function FilterPanel({
  search,
  setSearch,
  ministries,
  ministry,
  setMinistry,
  sectors,
  sector,
  setSector,
  status,
  setStatus,
}: any) {
  return (
    <View style={styles.filterPanel}>
      <View style={styles.searchBox}>
        <Search
          size={17}
          color="#64748B"
        />

        <TextInput
          placeholder="Search scheme..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(
            (item) => (
              <Pressable
                key={item}
                onPress={() => setStatus(item)}
                style={[
                  styles.statusChip,
                  status === item &&
                    styles.statusChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    status === item &&
                      styles.statusChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </ScrollView>

      {ministries.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterChip,
                ministry === '' &&
                  styles.filterChipActive,
              ]}
              onPress={() => setMinistry('')}
            >
              <Text
                style={
                  ministry === ''
                    ? styles.filterChipActiveText
                    : styles.filterChipText
                }
              >
                All Ministries
              </Text>
            </Pressable>

            {ministries.map(
              (item: string) => (
                <Pressable
                  key={item}
                  style={[
                    styles.filterChip,
                    ministry === item &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setMinistry(item)
                  }
                >
                  <Text
                    style={
                      ministry === item
                        ? styles.filterChipActiveText
                        : styles.filterChipText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </ScrollView>
      )}

      {sectors.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterChip,
                sector === '' &&
                  styles.filterChipActive,
              ]}
              onPress={() => setSector('')}
            >
              <Text
                style={
                  sector === ''
                    ? styles.filterChipActiveText
                    : styles.filterChipText
                }
              >
                All Types
              </Text>
            </Pressable>

            {sectors.map(
              (item: string) => (
                <Pressable
                  key={item}
                  style={[
                    styles.filterChip,
                    sector === item &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSector(item)
                  }
                >
                  <Text
                    style={
                      sector === item
                        ? styles.filterChipActiveText
                        : styles.filterChipText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SchemeManagementCard({
  scheme,
  onEdit,
  onView,
  onDeactivate,
  onActivate,
}: any) {
  const active =
    scheme.scheme_status === 'ACTIVE' ||
    !scheme.scheme_status;

  const loan =
    scheme.loan_available === 'YES' ||
    scheme.loan_available === 'TRUE';

  return (
    <View style={styles.schemeCard}>
      <View style={styles.schemeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.schemeId}>
            {scheme.scheme_id}
          </Text>

          <Text style={styles.schemeName}>
            {scheme.scheme_name}
          </Text>

          <Text style={styles.schemeMinistry}>
            {scheme.ministry}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            active
              ? styles.activeBadge
              : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              active
                ? styles.activeText
                : styles.inactiveText,
            ]}
          >
            {active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.schemeInfoRow}>
        <Info label="Type" value={scheme.scheme_type || scheme.sector || 'General'} />
        <Info label="Loan" value={loan ? 'Available' : 'Grant'} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          Completeness
        </Text>

        <Text style={styles.progressValue}>
          {scheme.completeness_score}%
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${scheme.completeness_score}%`,
            },
          ]}
        />
      </View>

      <View style={styles.schemeActions}>
        <Pressable
          style={styles.outlineButton}
          onPress={onEdit}
        >
          <Edit3
            size={15}
            color={COLORS.indigo}
          />

          <Text style={styles.outlineText}>
            Edit
          </Text>
        </Pressable>

        {active ? (
          <Pressable
            style={styles.deactivateButton}
            onPress={onDeactivate}
          >
            <PowerOff
              size={15}
              color="#BE123C"
            />

            <Text style={styles.deactivateText}>
              Disable
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.activateButton}
            onPress={onActivate}
          >
            <Power
              size={15}
              color="#047857"
            />

            <Text style={styles.activateText}>
              Activate
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.iconButton}
          onPress={onView}
        >
          <Eye
            size={18}
            color={COLORS.slate}
          />
        </Pressable>
      </View>
    </View>
  );
}

function AuditCard({
  scheme,
  onView,
}: any) {
  return (
    <View style={styles.auditCard}>
      <View style={styles.auditTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.schemeId}>
            {scheme.scheme_id}
          </Text>

          <Text style={styles.schemeName}>
            {scheme.scheme_name}
          </Text>

          <Text style={styles.schemeMinistry}>
            {scheme.ministry}
          </Text>
        </View>

        <View style={styles.verifiedBadge}>
          <ShieldCheck
            size={13}
            color="#047857"
          />

          <Text style={styles.verifiedText}>
            VERIFIED
          </Text>
        </View>
      </View>

      <View style={styles.auditStats}>
        <Info
          label="Rules"
          value={`${scheme.rule_count}`}
        />

        <Info
          label="Documents"
          value={`${scheme.document_count}`}
        />

        <Info
          label="Complete"
          value={`${scheme.completeness_score}%`}
        />
      </View>

      <View style={styles.auditActions}>
        {scheme.official_source_url ? (
          <Pressable
            style={styles.sourceButton}
            onPress={() =>
              Linking.openURL(
                scheme.official_source_url
              )
            }
          >
            <ExternalLink
              size={15}
              color={COLORS.indigo}
            />

            <Text style={styles.sourceText}>
              Official Source
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          style={styles.auditDetailButton}
          onPress={onView}
        >
          <Eye
            size={15}
            color="#FFF"
          />

          <Text style={styles.auditDetailText}>
            Detail
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function SchemeDetailModal({
  scheme,
  onClose,
}: {
  scheme: SchemeAuditItem | null;
  onClose: () => void;
}) {
  if (!scheme) return null;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>
                Scheme Audit Detail
              </Text>

              <Text style={styles.detailId}>
                {scheme.scheme_id}
              </Text>
            </View>

            <Pressable onPress={onClose}>
              <X
                size={24}
                color={COLORS.slate}
              />
            </Pressable>
          </View>

          <ScrollView>
            <Detail label="Scheme" value={scheme.scheme_name} />
            <Detail label="Ministry" value={scheme.ministry} />
            <Detail
              label="Sector"
              value={scheme.scheme_type || scheme.sector || 'General'}
            />
            <Detail
              label="Status"
              value={scheme.scheme_status || 'ACTIVE'}
            />
            <Detail
              label="Completeness"
              value={`${scheme.completeness_score}%`}
            />
            <Detail
              label="Rules"
              value={`${scheme.rule_count}`}
            />
            <Detail
              label="Documents"
              value={`${scheme.document_count}`}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  hero: {
    backgroundColor: COLORS.navy,
    padding: 20,
    gap: 10,
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#881337',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    color: '#FFE4E6',
    fontSize: 10,
    fontWeight: '800',
  },

  heroTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },

  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },

  successBanner: {
    margin: 16,
    backgroundColor: COLORS.emeraldBg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  successText: {
    flex: 1,
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },

  tabsWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  tabs: {
    padding: 10,
    gap: 8,
  },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },

  activeTab: {
    backgroundColor: COLORS.navy,
  },

  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
  },

  activeTabText: {
    color: '#FFF',
  },

  section: {
    padding: 16,
    gap: 16,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  metricCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },

  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  metricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '700',
    textAlign: 'center',
  },

  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },

  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  healthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  healthDescription: {
    color: COLORS.muted,
    fontSize: 12,
  },

  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: COLORS.emerald,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.emerald,
  },

  governanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },

  governanceTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  governanceSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
  },

  governanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },

  smallMetric: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },

  smallMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  smallMetricLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
    textAlign: 'center',
  },

  managementHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  managementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  managementTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },

  managementSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  addButton: {
    backgroundColor: COLORS.maroon,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
  },

  addButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  filterPanel: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },

  searchBox: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },

  filterChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  filterChipText: {
    fontSize: 10,
    color: COLORS.slate,
    fontWeight: '700',
  },

  filterChipActiveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },

  statusChipActive: {
    backgroundColor: COLORS.maroon,
  },

  statusChipText: {
    fontSize: 10,
    color: COLORS.slate,
    fontWeight: '800',
  },

  statusChipTextActive: {
    color: '#FFF',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },

  emptyText: {
    color: COLORS.muted,
  },

  schemeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    gap: 12,
  },

  schemeTop: {
    flexDirection: 'row',
    gap: 10,
  },

  schemeId: {
    color: COLORS.sky,
    fontWeight: '900',
    fontSize: 11,
  },

  schemeName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 3,
  },

  schemeMinistry: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  activeBadge: {
    backgroundColor: '#D1FAE5',
  },

  inactiveBadge: {
    backgroundColor: '#FFE4E6',
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },

  activeText: {
    color: '#047857',
  },

  inactiveText: {
    color: '#BE123C',
  },

  schemeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },

  infoValue: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 2,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  progressLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },

  progressValue: {
    fontSize: 10,
    fontWeight: '900',
  },

  progressBar: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.emerald,
    borderRadius: 10,
  },

  schemeActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  outlineButton: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
  },

  outlineText: {
    color: COLORS.indigo,
    fontSize: 11,
    fontWeight: '800',
  },

  deactivateButton: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
  },

  deactivateText: {
    color: '#BE123C',
    fontSize: 11,
    fontWeight: '800',
  },

  activateButton: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
  },

  activateText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },

  iconButton: {
    marginLeft: 'auto',
    padding: 8,
  },

  auditHeader: {
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  auditTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  auditSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },

  auditCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    gap: 12,
  },

  auditTop: {
    flexDirection: 'row',
    gap: 8,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  verifiedText: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '900',
  },

  auditStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  auditActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sourceText: {
    color: COLORS.indigo,
    fontSize: 11,
    fontWeight: '800',
  },

  auditDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },

  auditDetailText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },

  placeholderTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },

  placeholderText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  warningIcon: {
    backgroundColor: '#FFE4E6',
    padding: 10,
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },

  modalSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
  },

  warningBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },

  warningScheme: {
    fontWeight: '900',
    color: '#881337',
  },

  warningId: {
    fontSize: 11,
    color: '#BE123C',
  },

  warningText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#9F1239',
    marginTop: 4,
  },

  reasonLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  cancelText: {
    fontWeight: '800',
    color: COLORS.slate,
  },

  confirmButton: {
    backgroundColor: '#BE123C',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  confirmText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },

  detailModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    maxHeight: '85%',
    padding: 18,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  detailId: {
    fontSize: 11,
    color: COLORS.sky,
    fontWeight: '800',
    marginTop: 3,
  },

  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },

  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 3,
  },
});