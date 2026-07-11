import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { deliveryApi, BottleSummary } from '../../src/api/delivery';
import { colors } from '../../src/constants/colors';

export default function BottlesScreen() {
  const [summary, setSummary] = useState<BottleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await deliveryApi.getBottleSummary();
      setSummary(data as BottleSummary);
    } catch (e: any) {
      console.error('Failed to fetch bottle summary:', e?.message || e);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchSummary();
      setIsLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setIsRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bottle data...</Text>
        </View>
      ) : (
      <>
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>🍶 Bottle Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{summary?.loaded || 0}</Text>
            <Text style={styles.statLabel}>Loaded</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📤</Text>
            <Text style={styles.statValue}>{summary?.issued || 0}</Text>
            <Text style={styles.statLabel}>Issued Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📥</Text>
            <Text style={styles.statValue}>{summary?.collected || 0}</Text>
            <Text style={styles.statLabel}>Collected Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statValue}>{summary?.pending || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.reconciliationCard}>
        <Text style={styles.cardTitle}>📊 Reconciliation</Text>
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Bottles Loaded</Text>
          <Text style={styles.reconValue}>{summary?.loaded || 0}</Text>
        </View>
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Bottles Issued</Text>
          <Text style={styles.reconValue}>-{summary?.issued || 0}</Text>
        </View>
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Bottles Collected</Text>
          <Text style={styles.reconValue}>+{summary?.collected || 0}</Text>
        </View>
        <View style={[styles.reconRow, styles.reconTotal]}>
          <Text style={styles.reconTotalLabel}>Remaining</Text>
          <Text style={styles.reconTotalValue}>
            {(summary?.loaded || 0) - (summary?.issued || 0) + (summary?.collected || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How Bottle Tracking Works</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Loaded:</Text> Bottles you took from the dairy today
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Issued:</Text> Bottles delivered to customers (new milk)
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Collected:</Text> Empty bottles picked up from customers
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Pending:</Text> Bottles not yet accounted for
        </Text>
      </View>
      </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  reconciliationCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  reconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reconLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reconValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reconTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  reconTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  reconTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
