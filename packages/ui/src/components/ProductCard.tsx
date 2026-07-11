import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

interface ProductCardProps {
  name: string;
  variant: string;
  price: number;
  discountPrice?: number;
  image?: string;
  badges?: string[];
  quantity?: number;
  onAdd?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  variant,
  price,
  discountPrice,
  image,
  badges = [],
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
}) => {
  const discount = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🥛</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {badges.includes('BEST_SELLER') && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.bestsellerText}>Best Seller</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.variant}>{variant}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{discountPrice || price}</Text>
          {discountPrice && (
            <Text style={styles.originalPrice}>₹{price}</Text>
          )}
        </View>

        <View style={styles.badgesRow}>
          {badges.includes('ORGANIC') && (
            <View style={[styles.badge, styles.organicBadge]}>
              <Text style={styles.badgeText}>🌿 Organic</Text>
            </View>
          )}
          {badges.includes('A2') && (
            <View style={[styles.badge, styles.a2Badge]}>
              <Text style={styles.badgeText}>A2</Text>
            </View>
          )}
        </View>

        {quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={onDecrement}>
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={onIncrement}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: colors.background.soft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  bestsellerText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  variant: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  organicBadge: {
    backgroundColor: '#E8F5E9',
  },
  a2Badge: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  addButton: {
    backgroundColor: colors.primary.light,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.primary.DEFAULT,
    fontSize: 14,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  quantityButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  quantityButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
});
