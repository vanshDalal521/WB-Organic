import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../src/constants/colors';
import { ordersApi } from '../../src/api/orders';

type TabFilter = 'Today' | 'Upcoming' | 'Past' | 'Cancelled';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Delivered' | 'Out for Delivery' | 'Processing' | 'Scheduled' | 'Cancelled';
}

const tabs: TabFilter[] = ['Today', 'Upcoming', 'Past', 'Cancelled'];

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'Delivered':
      return colors.status.success;
    case 'Out for Delivery':
      return colors.primary.DEFAULT;
    case 'Processing':
      return colors.status.info;
    case 'Scheduled':
      return colors.status.warning;
    case 'Cancelled':
      return colors.status.error;
    default:
      return colors.text.muted;
  }
};

const getStatusBg = (status: Order['status']) => {
  switch (status) {
    case 'Delivered':
      return colors.primary.light;
    case 'Out for Delivery':
      return colors.primary.light;
    case 'Processing':
      return '#E3F2FD';
    case 'Scheduled':
      return '#FFF8E1';
    case 'Cancelled':
      return '#FFEBEE';
    default:
      return colors.background.soft;
  }
};

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<TabFilter>('Today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (tab: TabFilter) => {
    try {
      const params: Record<string, string> = {};
      if (tab !== 'All') params.tab = tab.toLowerCase();
      const res = await ordersApi.getAll(params);
      const data = res?.data?.data || res?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders(activeTab).finally(() => setLoading(false));
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(activeTab);
    setRefreshing(false);
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        <ScrollView
          style={styles.orderList}
          contentContainerStyle={styles.orderListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'Today'
                  ? "You don't have any orders for today"
                  : `No ${activeTab.toLowerCase()} orders found`}
              </Text>
            </View>
          ) : (
            orders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.8}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Items Summary */}
                <View style={styles.itemsContainer}>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                  ))}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>₹{order.total}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background.soft,
  },
  tabActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  orderList: {
    flex: 1,
  },
  orderListContent: {
    padding: 20,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: colors.text.muted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});
