import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { productsApi } from '../../src/api/products';
import { useCartStore } from '../../src/stores/cartStore';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  variant?: string;
  price: number;
  discountPrice?: number;
  icon?: string;
  categoryId?: string;
  category?: string;
  productVariantId?: string;
  image?: string;
}

export default function ProductsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('Popular');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const addItem = useCartStore((s) => s.addItem);

  const sortOptions = ['Popular', 'Price Low to High', 'Price High to Low'];

  const fetchCategories = async () => {
    try {
      const res = await productsApi.getCategories();
      const cats = res?.data?.data || res?.data || [];
      const names = cats.map((c: { name: string }) => c.name);
      setCategories(['All', ...names]);
    } catch {
      setCategories(['All']);
    }
  };

  const fetchProducts = async () => {
    try {
      const params: Record<string, string | number> = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'All') params.categoryId = selectedCategory;
      if (selectedSort === 'Price Low to High') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (selectedSort === 'Price High to Low') {
        params.sortBy = 'price';
        params.sortOrder = 'desc';
      }
      const res = await productsApi.getAll(params);
      const data = res?.data?.data || res?.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts().finally(() => setLoading(false));
  }, [selectedCategory, selectedSort, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setRefreshing(false);
  }, []);

  const handleAdd = async (product: Product) => {
    await addItem({
      productVariantId: product.productVariantId || product.id,
      productName: product.name,
      variantName: product.variant || '',
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      image: product.image,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Products</Text>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat as any)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Bar */}
        <View style={styles.sortBar}>
          <Text style={styles.resultCount}>{products.length} Products</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text style={styles.sortIcon}>↕️</Text>
            <Text style={styles.sortText}>{selectedSort}</Text>
            <Text style={styles.sortArrow}>{showSortDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Dropdown */}
        {showSortDropdown && (
          <View style={styles.sortDropdown}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  selectedSort === option && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSelectedSort(option);
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    selectedSort === option && styles.sortOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Product Grid */}
        <ScrollView
          style={styles.productList}
          contentContainerStyle={styles.productGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
            </View>
          ) : (
            products.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{item.icon || '🥛'}</Text>
                  {item.discountPrice && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productVariant}>{item.variant || ''}</Text>
                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>₹{item.discountPrice || item.price}</Text>
                    {item.discountPrice && (
                      <Text style={styles.originalPrice}>₹{item.price}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAdd(item)}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cartBadge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.text.muted,
    paddingLeft: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultCount: {
    fontSize: 13,
    color: colors.text.muted,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortIcon: {
    fontSize: 14,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sortArrow: {
    fontSize: 10,
    color: colors.text.muted,
  },
  sortDropdown: {
    position: 'absolute',
    top: 195,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingVertical: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  sortOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: colors.primary.light,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  sortOptionTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  productList: {
    flex: 1,
  },
  productGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
  },
  productImage: {
    height: 110,
    backgroundColor: colors.background.soft,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  productEmoji: {
    fontSize: 44,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.status.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  productVariant: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
});
