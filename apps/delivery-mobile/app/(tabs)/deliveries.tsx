import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { deliveryApi, Delivery } from '../../src/api/delivery';
import { colors } from '../../src/constants/colors';

type FilterTab = 'ALL' | 'PENDING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'FAILED';

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDeliveries = async () => {
    try {
      const params = activeFilter !== 'ALL' ? { status: activeFilter } : undefined;
      const data = await deliveryApi.getDeliveries(params);
      setDeliveries(data as Delivery[]);
    } catch (e: any) {
      console.error('Failed to fetch deliveries:', e?.message || e);
    }
  };

  useEffect(() => {
    (async () => {
      if (!isRefreshing) setIsLoading(true);
      await fetchDeliveries();
      setIsLoading(false);
    })();
  }, [activeFilter]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDeliveries();
    setIsRefreshing(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out' },
    { key: 'COMPLETED', label: 'Done' },
    { key: 'FAILED', label: 'Failed' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text
              style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading deliveries...</Text>
          </View>
        ) : (
        <>
        {deliveries.map((delivery) => (
          <View key={delivery.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{delivery.customerName}</Text>
                <Text style={styles.address}>{delivery.address}</Text>
              </View>
              <View style={[styles.badge, styles[`badge_${delivery.status.toLowerCase()}`]]}>
                <Text style={styles.badgeText}>
                  {delivery.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.productsRow}>
              {delivery.products.map((p, i) => (
                <Text key={i} style={styles.productTag}>
                  {p.name} x{p.quantity}
                </Text>
              ))}
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentType}>
                {delivery.paymentType === 'COD' ? '💵' : '💳'} {delivery.paymentType}
              </Text>
              <Text style={styles.amount}>₹{delivery.totalAmount}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(delivery.customerPhone)}
              >
                <Text style={styles.actionBtnText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleNavigate(delivery.latitude, delivery.longitude)}
              >
                <Text style={styles.actionBtnText}>🧭 Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {deliveries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No deliveries found</Text>
          </View>
        )}
        </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
    padding: 16,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badge_pending: {
    backgroundColor: colors.pending,
  },
  badge_out_for_delivery: {
    backgroundColor: colors.outForDelivery,
  },
  badge_completed: {
    backgroundColor: colors.completed,
  },
  badge_failed: {
    backgroundColor: colors.failed,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentType: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
