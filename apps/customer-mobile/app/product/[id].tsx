import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCartStore } from '../../src/stores/cartStore';
import { productsApi } from '../../src/api/products';
import { colors } from '../../src/constants/colors';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await productsApi.getOne(id!);
      setProduct(data as any);
      if ((data as any)?.variants?.length > 0) {
        setSelectedVariant((data as any).variants[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Product not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem({
      productVariantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name || `${selectedVariant.unitValue}${selectedVariant.unit}`,
      price: Number(selectedVariant.price),
      discountPrice: selectedVariant.discountPrice ? Number(selectedVariant.discountPrice) : undefined,
      quantity,
      image: product.images?.[0]?.url,
    });
    Alert.alert('Added to Cart', `${product.name} added to your cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  };

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const price = selectedVariant?.discountPrice || selectedVariant?.price || 0;
  const savings = selectedVariant?.discountPrice ? Number(selectedVariant.price) - Number(selectedVariant.discountPrice) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
          <Text style={styles.cartText}>🛒 {cartItemCount > 0 ? `(${cartItemCount})` : ''}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          <Text style={styles.imagePlaceholder}>🥛</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.badgeRow}>
            {product.isFeatured && <View style={styles.badge}><Text style={styles.badgeText}>Featured</Text></View>}
            {product.isTrending && <View style={[styles.badge, styles.trendingBadge]}><Text style={styles.badgeText}>Trending</Text></View>}
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category?.name}</Text>
          {product.shortDescription && <Text style={styles.shortDesc}>{product.shortDescription}</Text>}

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{Number(price).toFixed(0)}</Text>
            {savings > 0 && <Text style={styles.originalPrice}>₹{Number(selectedVariant.price).toFixed(0)}</Text>}
            {savings > 0 && <View style={styles.savingsBadge}><Text style={styles.savingsText}>Save ₹{savings.toFixed(0)}</Text></View>}
          </View>
        </View>

        {product.variants?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Variant</Text>
            <View style={styles.variantRow}>
              {product.variants.map((v: any) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.variantChip, selectedVariant?.id === v.id && styles.variantActive]}
                  onPress={() => setSelectedVariant(v)}
                >
                  <Text style={[styles.variantText, selectedVariant?.id === v.id && styles.variantTextActive]}>
                    {v.name || `${v.unitValue}${v.unit}`}
                  </Text>
                  <Text style={[styles.variantPrice, selectedVariant?.id === v.id && styles.variantTextActive]}>
                    ₹{Number(v.discountPrice || v.price).toFixed(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {product.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.description}>{product.benefits}</Text>
          </View>
        )}

        {product.shelfLife && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shelf Life</Text>
            <Text style={styles.description}>{product.shelfLife}</Text>
          </View>
        )}

        {product.storageInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage</Text>
            <Text style={styles.description}>{product.storageInstructions}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantityRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart - ₹{(Number(price) * quantity).toFixed(0)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 16, color: colors.primary.DEFAULT, fontWeight: '600' },
  cartBtn: { padding: 8 },
  cartText: { fontSize: 18 },
  content: { paddingBottom: 100 },
  imageContainer: {
    height: 250,
    backgroundColor: colors.background.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: { fontSize: 80 },
  info: { padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { backgroundColor: colors.primary.light, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trendingBadge: { backgroundColor: '#FFF3CD' },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary.DEFAULT },
  name: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  category: { fontSize: 14, color: colors.text.secondary, marginBottom: 8 },
  shortDesc: { fontSize: 14, color: colors.text.muted, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  price: { fontSize: 28, fontWeight: '700', color: colors.primary.DEFAULT },
  originalPrice: { fontSize: 18, color: colors.text.muted, textDecorationLine: 'line-through' },
  savingsBadge: { backgroundColor: colors.status.success + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  savingsText: { fontSize: 12, fontWeight: '600', color: colors.status.success },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variantChip: {
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  variantActive: { borderColor: colors.primary.DEFAULT, backgroundColor: colors.primary.light },
  variantText: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  variantTextActive: { color: colors.primary.DEFAULT },
  variantPrice: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  description: { fontSize: 14, color: colors.text.secondary, lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: colors.primary.DEFAULT },
  qtyText: { fontSize: 16, fontWeight: '600', color: colors.text.primary, paddingHorizontal: 12 },
  addToCartBtn: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
