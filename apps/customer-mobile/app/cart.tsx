import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../src/stores/cartStore';
import { colors } from '../src/constants/colors';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  const handleQuantityChange = (variantId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(variantId);
    } else {
      updateQuantity(variantId, newQty);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some fresh dairy products!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/(tabs)/products')}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemImage}>
              <Text style={styles.itemEmoji}>🥛</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemVariant}>{item.variantName}</Text>
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>₹{item.discountPrice || item.price}</Text>
                {item.discountPrice && item.discountPrice < item.price && (
                  <Text style={styles.itemOriginalPrice}>₹{item.price}</Text>
                )}
              </View>
            </View>
            <View style={styles.itemActions}>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityChange(item.productVariantId, item.quantity, -1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityChange(item.productVariantId, item.quantity, 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>₹{((item.discountPrice || item.price) * item.quantity).toFixed(0)}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{getTotal().toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
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
  clearBtn: { width: 50, alignItems: 'flex-end' },
  clearText: { fontSize: 14, color: colors.status.error, fontWeight: '500' },
  list: { padding: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, marginBottom: 24 },
  shopBtn: { backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  shopBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.background.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  itemVariant: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary.DEFAULT },
  itemOriginalPrice: { fontSize: 12, color: colors.text.muted, textDecorationLine: 'line-through' },
  itemActions: { alignItems: 'flex-end' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 8,
    marginBottom: 6,
  },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary.DEFAULT },
  qtyText: { fontSize: 14, fontWeight: '600', paddingHorizontal: 8 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalLabel: { fontSize: 18, fontWeight: '600', color: colors.text.primary },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.primary.DEFAULT },
  checkoutBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { fontSize: 18, fontWeight: '600', color: colors.white },
});
