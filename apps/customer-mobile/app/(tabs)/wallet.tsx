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
  Alert,
} from 'react-native';
import { colors } from '../../src/constants/colors';
import { walletApi } from '../../src/api/wallet';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
  icon?: string;
}

const quickAmounts = [100, 200, 500, 1000];

export default function WalletScreen() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(),
      ]);
      const balance = balanceRes?.data?.data?.balance ?? balanceRes?.data?.balance ?? 0;
      setWalletBalance(balance);
      const txData = txRes?.data?.data || txRes?.data || [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch {
      setWalletBalance(0);
      setTransactions([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchWalletData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, []);

  const handleAddMoney = async () => {
    if (!selectedAmount) {
      Alert.alert('Select Amount', 'Please select an amount to add');
      return;
    }
    setAddingMoney(true);
    try {
      await walletApi.addMoney(selectedAmount);
      Alert.alert('Success', `₹${selectedAmount} added to your wallet`);
      setSelectedAmount(null);
      await fetchWalletData();
    } catch {
      Alert.alert('Error', 'Failed to add money. Please try again.');
    } finally {
      setAddingMoney(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wallet</Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceInner}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceIcon}>💰</Text>
              </View>
              <Text style={styles.balanceAmount}>₹{walletBalance}</Text>
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => setSelectedAmount(null)}
              >
                <Text style={styles.addMoneyButtonText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickAmountRow}>
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    selectedAmount === amount && styles.quickAmountButtonActive,
                  ]}
                  onPress={() => setSelectedAmount(amount)}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      selectedAmount === amount && styles.quickAmountTextActive,
                    ]}
                  >
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.confirmAddButton, addingMoney && styles.confirmAddButtonDisabled]}
              onPress={handleAddMoney}
              disabled={addingMoney}
            >
              {addingMoney ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmAddButtonText}>
                  Add ₹{selectedAmount || 0} to Wallet
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.transactionList}>
              {loading ? (
                <View style={styles.transactionLoading}>
                  <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
                </View>
              ) : transactions.length === 0 ? (
                <View style={styles.emptyTransactions}>
                  <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <Text style={styles.transactionIcon}>{tx.icon || '💳'}</Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text style={styles.transactionDate}>{tx.date}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        tx.type === 'credit' ? styles.creditAmount : styles.debitAmount,
                      ]}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </Text>
                  </View>
                ))
              )}
            </View>
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
    gap: 20,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary.dark,
  },
  balanceInner: {
    padding: 24,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  balanceIcon: {
    fontSize: 24,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 16,
  },
  addMoneyButton: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  quickAmountButtonActive: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.DEFAULT,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  quickAmountTextActive: {
    color: colors.primary.DEFAULT,
  },
  confirmAddButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmAddButtonDisabled: {
    opacity: 0.7,
  },
  confirmAddButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  transactionList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIcon: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  creditAmount: {
    color: colors.status.success,
  },
  debitAmount: {
    color: colors.status.error,
  },
  transactionLoading: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTransactions: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
  },
});
