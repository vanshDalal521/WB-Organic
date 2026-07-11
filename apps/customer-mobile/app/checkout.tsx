import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../src/stores/cartStore';
import { useAuthStore } from '../src/stores/authStore';
import { ordersApi } from '../src/api/orders';
import { colors } from '../src/constants/colors';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('COD');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [deliverySlots] = useState([
    { id: 'slot1', label: 'Morning (6:00 AM - 8:00 AM)', time: '06:00-08:00' },
    { id: 'slot2', label: 'Afternoon (12:00 PM - 2:00 PM)', time: '12:00-14:00' },
    { id: 'slot3', label: 'Evening (5:00 PM - 7:00 PM)', time: '17:00-19:00' },
  ]);

  const total = getTotal();
  const deliveryCharge = total >= 200 ? 0 : 30;
  const grandTotal = total + deliveryCharge;

  useEffect(() => {
    if (deliverySlots.length > 0) setSelectedSlot(deliverySlots[0]);
  }, []);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deliveryDate = tomorrow.toISOString().split('T')[0];

      await ordersApi.create({
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        })),
        paymentMethod: selectedPayment === 'COD' ? 'CASH_ON_DELIVERY' : 'WALLET',
        deliveryDate,
        deliverySlotId: selectedSlot?.id,
      });

      await clearCart();
      Alert.alert('Order Placed!', 'Your order has been placed successfully.', [
        { text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{user?.customerProfile?.fullName || 'Customer'}</Text>
            <Text style={styles.addressText}>Default delivery address</Text>
            <Text style={styles.addressText}>{user?.phone || ''}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          {deliverySlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotCard, selectedSlot?.id === slot.id && styles.slotActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <View style={[styles.radio, selectedSlot?.id === slot.id && styles.radioActive]} />
              <Text style={styles.slotLabel}>{slot.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {['COD', 'WALLET'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentCard, selectedPayment === method && styles.paymentActive]}
              onPress={() => setSelectedPayment(method)}
            >
              <View style={[styles.radio, selectedPayment === method && styles.radioActive]} />
              <Text style={styles.paymentLabel}>
                {method === 'COD' ? 'Cash on Delivery' : 'Pay with Wallet'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryName}>{item.productName} ({item.variantName}) x{item.quantity}</Text>
              <Text style={styles.summaryPrice}>₹{((item.discountPrice || item.price) * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.deliveryLabel}>Delivery</Text>
          <Text style={styles.deliveryValue}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderText}>
            {loading ? 'Placing Order...' : `Place Order - ₹${grandTotal.toFixed(0)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 50 },
  backText: { fontSize: 16, color: colors.primary.DEFAULT, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  content: { padding: 16, paddingBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.DEFAULT,
  },
  addressName: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  addressText: { fontSize: 13, color: colors.text.secondary, lineHeight: 20 },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  slotActive: { borderColor: colors.primary.DEFAULT, backgroundColor: colors.primary.light },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    marginRight: 12,
  },
  radioActive: { borderColor: colors.primary.DEFAULT, backgroundColor: colors.primary.DEFAULT },
  slotLabel: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  paymentActive: { borderColor: colors.primary.DEFAULT, backgroundColor: colors.primary.light },
  paymentLabel: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  summaryName: { fontSize: 13, color: colors.text.secondary, flex: 1, paddingRight: 10 },
  summaryPrice: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: colors.text.secondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  deliveryLabel: { fontSize: 14, color: colors.text.secondary },
  deliveryValue: { fontSize: 14, fontWeight: '600', color: colors.status.success },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: colors.border.light, paddingTop: 10, marginTop: 4 },
  grandTotalLabel: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  grandTotalValue: { fontSize: 20, fontWeight: '700', color: colors.primary.DEFAULT },
  placeOrderBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  disabledBtn: { opacity: 0.6 },
  placeOrderText: { fontSize: 18, fontWeight: '600', color: colors.white },
});
