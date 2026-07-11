import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { walletApi } from '../../src/api/wallet';

interface MenuItem {
  id: string;
  icon: string;
  title: string;
}

const menuItems: MenuItem[] = [
  { id: '1', icon: '👤', title: 'My Profile' },
  { id: '2', icon: '📍', title: 'Addresses' },
  { id: '3', icon: '💳', title: 'Payment Methods' },
  { id: '4', icon: '📦', title: 'My Subscriptions' },
  { id: '5', icon: '🔔', title: 'Notifications' },
  { id: '6', icon: '💬', title: 'Help & Support' },
  { id: '7', icon: 'ℹ️', title: 'About' },
  { id: '8', icon: '🚪', title: 'Logout' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [walletBalance, setWalletBalance] = useState(0);

  const userName = user?.customerProfile?.fullName || 'User';
  const userPhone = user?.phone || '';

  useEffect(() => {
    walletApi.getBalance().then((res) => {
      const balance = res?.data?.data?.balance ?? res?.data?.balance ?? 0;
      setWalletBalance(balance);
    }).catch(() => {});
  }, []);

  const handleMenuPress = (item: MenuItem) => {
    if (item.title === 'Logout') {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
      return;
    }
    Alert.alert('Coming soon', `${item.title} will be available soon`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profilePhone}>{userPhone}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Coming soon', 'Edit profile will be available soon')}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Wallet Quick Access */}
          <TouchableOpacity
            style={styles.walletCard}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <View style={styles.walletLeft}>
              <Text style={styles.walletIcon}>💰</Text>
              <View>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletAmount}>₹{walletBalance}</Text>
              </View>
            </View>
            <Text style={styles.walletArrow}>→</Text>
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                  item.id === '8' && styles.logoutItem,
                ]}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item)}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuTitle,
                      item.id === '8' && styles.logoutText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.menuArrow,
                    item.id === '8' && styles.logoutText,
                  ]}
                >
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>WB Organic Dairy v1.0.0</Text>
          </View>

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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarIcon: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: colors.text.muted,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    borderRadius: 16,
    padding: 20,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    fontSize: 28,
  },
  walletLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 2,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary.DEFAULT,
  },
  walletArrow: {
    fontSize: 20,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  menuArrow: {
    fontSize: 18,
    color: colors.text.muted,
  },
  logoutItem: {
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: colors.status.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  versionText: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
