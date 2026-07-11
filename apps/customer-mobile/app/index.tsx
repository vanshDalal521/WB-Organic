import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useCartStore } from '../src/stores/cartStore';
import { colors } from '../src/constants/colors';

const logoImg = require('../assets/logo.jpeg');

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const navigated = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (navigated.current) return;
    if (!isLoading) {
      navigated.current = true;
      setTimeout(() => {
        if (isAuthenticated) {
          if (user?.customerProfile?.isProfileComplete === false) {
            router.replace('/(auth)/profile-setup');
          } else {
            useCartStore.getState().loadCart();
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(auth)/login');
        }
      }, 1500);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image source={logoImg} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Animated.Text style={styles.title}>WB ORGANIC DAIRY</Animated.Text>
        <Animated.Text style={styles.tagline}>
          Pure by Nature, Healthy by Choice
        </Animated.Text>
        <Animated.Text style={styles.features}>
          100% Pure • Organic • Healthy
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    fontStyle: 'italic',
    marginBottom: 32,
  },
  features: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
  },
});
