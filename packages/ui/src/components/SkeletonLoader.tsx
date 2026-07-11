import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/spacing';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius: br = borderRadius.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: br,
          backgroundColor: colors.border.light,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonLoader height={140} borderRadius={borderRadius.xl} />
      <View style={skeletonStyles.content}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
        <SkeletonLoader width="30%" height={18} style={{ marginTop: 8 }} />
        <SkeletonLoader width="100%" height={36} borderRadius={borderRadius.md} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
});

import { spacing } from '../theme/spacing';
