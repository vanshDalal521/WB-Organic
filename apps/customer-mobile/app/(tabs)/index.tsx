import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useCartStore } from '../../src/stores/cartStore';
import { productsApi } from '../../src/api/products';
import { colors } from '../../src/constants/colors';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS = ['#E7F3E9', '#FFF3E0', '#E3F2FD', '#FFF8E1', '#F3E5F5', '#F1F7EF'];
const CATEGORY_ICONS: Record<string, string> = {
  milk: '🥛',
  curd: '🥣',
  paneer: '🧀',
  butter: '🧈',
  ghee: '🫙',
  cheese: '🧀',
  yogurt: '🥣',
  cream: '🍦',
  lassi: '🥛',
  default: '📦',
};

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function getCategoryIcon(slug?: string, name?: string) {
  const key = (slug || name || '').toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_ICONS.default;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getItemCount, addItem } = useCartStore();
  const cartCount = getItemCount();

  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, featRes, trendRes] = await Promise.allSettled([
        productsApi.getCategories(),
        productsApi.getFeatured(),
        productsApi.getTrending(),
      ]);

      if (catRes.status === 'fulfilled' && catRes.value.success) {
        setCategories(catRes.value.data);
      }
      if (featRes.status === 'fulfilled' && featRes.value.success) {
        setFeatured(featRes.value.data);
      }
      if (trendRes.status === 'fulfilled' && trendRes.value.success) {
        setTrending(trendRes.value.data);
      }
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleAddToCart = (product: any) => {
    const variant = product.variants?.[0];
    if (!variant) return;
    addItem({
      productVariantId: variant.id,
      productName: product.name,
      variantName: variant.name || variant.unit || '',
      price: variant.discountPrice || variant.price,
      discountPrice: variant.discountPrice,
      quantity: 1,
      image: product.images?.[0]?.url,
    });
  };

  const getProductName = (product: any) => product.name || 'Product';
  const getVariantLabel = (product: any) => {
    const v = product.variants?.[0];
    return v?.name || v?.unit || '';
  };
  const getProductPrice = (product: any) => {
    const v = product.variants?.[0];
    return v?.discountPrice || v?.price || 0;
  };
  const getProductImage = (product: any) => product.images?.[0]?.url;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
          colors={[colors.primary.DEFAULT]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Hello, {user?.customerProfile?.fullName?.split(' ')[0] || 'Guest'} 👋
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {user?.customerProfile?.fullName ? 'Welcome back!' : 'Set your delivery address'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.walletBadge}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <Text style={styles.walletIcon}>💰</Text>
            <Text style={styles.walletAmount}>₹0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationBadge}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartBadge}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartCountDot}>
                <Text style={styles.cartCountText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerContainer}
      >
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.primary.DEFAULT }]}
          activeOpacity={0.8}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Fresh Milk</Text>
            <Text style={styles.bannerSubtitle}>Trusted by Thousands of Families</Text>
            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Shop Now</Text>
            </View>
          </View>
          <Text style={styles.bannerEmoji}>🥛</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.secondary.DEFAULT }]}
          activeOpacity={0.8}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Get 20% Off</Text>
            <Text style={styles.bannerSubtitle}>First Order - Use code FIRST20</Text>
            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Order Now</Text>
            </View>
          </View>
          <Text style={styles.bannerEmoji}>🎉</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.quickActionIcon}>📦</Text>
          <Text style={styles.quickActionText}>Today's{'\n'}Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/wallet')}
        >
          <Text style={styles.quickActionIcon}>🫙</Text>
          <Text style={styles.quickActionText}>My{'\n'}Bottles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.quickActionIcon}>🚚</Text>
          <Text style={styles.quickActionText}>Track{'\n'}Order</Text>
        </TouchableOpacity>
      </View>

      {/* Shop by Category */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ marginLeft: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category: any, index: number) => (
              <TouchableOpacity
                key={category.id || index}
                style={[styles.categoryCard, { backgroundColor: getCategoryColor(index) }]}
                onPress={() => router.push('/(tabs)/products')}
              >
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(category.slug, category.name)}
                </Text>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ marginLeft: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featured.map((product: any) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.slug || product.id}`)}
              >
                <View style={styles.productImage}>
                  {getProductImage(product) ? (
                    <Image
                      source={{ uri: getProductImage(product) }}
                      style={styles.productImageSrc}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.productEmoji}>🥛</Text>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={1}>
                  {getProductName(product)}
                </Text>
                <Text style={styles.productVariant} numberOfLines={1}>
                  {getVariantLabel(product)}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>₹{getProductPrice(product)}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Trending Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ marginLeft: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trending.map((product: any) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.slug || product.id}`)}
              >
                <View style={styles.productImage}>
                  {getProductImage(product) ? (
                    <Image
                      source={{ uri: getProductImage(product) }}
                      style={styles.productImageSrc}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.productEmoji}>🥛</Text>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={1}>
                  {getProductName(product)}
                </Text>
                <Text style={styles.productVariant} numberOfLines={1}>
                  {getVariantLabel(product)}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>₹{getProductPrice(product)}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Farm Story Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Milk Journey</Text>
        </View>
        <View style={styles.journeyCard}>
          <Text style={styles.journeyEmoji}>🐄</Text>
          <Text style={styles.journeyTitle}>From Farm to Home</Text>
          <Text style={styles.journeySubtitle}>Pure & Fresh for You</Text>
          <View style={styles.journeySteps}>
            <View style={styles.journeyStep}>
              <Text style={styles.journeyStepIcon}>🥛</Text>
              <Text style={styles.journeyStepText}>Milking</Text>
            </View>
            <Text style={styles.journeyArrow}>→</Text>
            <View style={styles.journeyStep}>
              <Text style={styles.journeyStepIcon}>🧪</Text>
              <Text style={styles.journeyStepText}>Testing</Text>
            </View>
            <Text style={styles.journeyArrow}>→</Text>
            <View style={styles.journeyStep}>
              <Text style={styles.journeyStepIcon}>📦</Text>
              <Text style={styles.journeyStepText}>Packing</Text>
            </View>
            <Text style={styles.journeyArrow}>→</Text>
            <View style={styles.journeyStep}>
              <Text style={styles.journeyStepIcon}>🚚</Text>
              <Text style={styles.journeyStepText}>Delivery</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Refer & Earn */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.referCard}>
          <View style={styles.referContent}>
            <Text style={styles.referTitle}>Refer & Earn</Text>
            <Text style={styles.referSubtitle}>
              Share WB Organic Dairy App with your friends. They will love our fresh & organic
              products.
            </Text>
            <View style={styles.referButton}>
              <Text style={styles.referButtonText}>Share Now</Text>
            </View>
          </View>
          <Text style={styles.referEmoji}>🎁</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  address: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  walletIcon: {
    fontSize: 14,
  },
  walletAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  notificationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 18,
  },
  cartBadge: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 18,
  },
  cartCountDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  banner: {
    width: width - 60,
    height: 160,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  bannerEmoji: {
    fontSize: 64,
    opacity: 0.3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary.DEFAULT,
    fontWeight: '500',
  },
  categoryCard: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  productCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginLeft: 20,
  },
  productImage: {
    height: 80,
    backgroundColor: colors.background.soft,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImageSrc: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  productEmoji: {
    fontSize: 36,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  productVariant: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  addButton: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  journeyCard: {
    backgroundColor: colors.primary.light,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  journeyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.dark,
    marginBottom: 4,
  },
  journeySubtitle: {
    fontSize: 14,
    color: colors.primary.DEFAULT,
    marginBottom: 16,
  },
  journeySteps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyStep: {
    alignItems: 'center',
  },
  journeyStepIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  journeyStepText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.primary.dark,
  },
  journeyArrow: {
    fontSize: 16,
    color: colors.primary.DEFAULT,
    marginHorizontal: 8,
  },
  referCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary.DEFAULT,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  referContent: {
    flex: 1,
  },
  referTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  referSubtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 12,
    lineHeight: 18,
  },
  referButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  referButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  referEmoji: {
    fontSize: 64,
    opacity: 0.3,
    marginLeft: 8,
  },
});
