import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { deliveryApi, DailySummary } from '../../src/api/delivery';
import { authApi } from '../../src/api/auth';
import { colors } from '../../src/constants/colors';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [attendanceCheckedIn, setAttendanceCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await deliveryApi.getDailySummary();
      setSummary(data as DailySummary);
    } catch (e: any) {
      console.error('Failed to fetch daily summary:', e?.message || e);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchSummary();
      setIsLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setIsRefreshing(false);
  };

  const handleAttendance = async () => {
    try {
      if (attendanceCheckedIn) {
        await authApi.markAttendance({ type: 'CHECK_OUT' });
        setAttendanceCheckedIn(false);
        Alert.alert('Attendance', 'Checked out successfully');
      } else {
        await authApi.markAttendance({ type: 'CHECK_IN' });
        setAttendanceCheckedIn(true);
        Alert.alert('Attendance', 'Checked in successfully');
      }
      await fetchSummary();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleStartRoute = () => {
    Alert.alert('Start Route', 'Are you sure you want to start your route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: () => router.push('/(tabs)/route'),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'Partner'} 👋</Text>
        <TouchableOpacity
          style={[
            styles.attendanceBadge,
            attendanceCheckedIn ? styles.checkedIn : styles.checkedOut,
          ]}
          onPress={handleAttendance}
        >
          <Text style={styles.attendanceText}>
            {attendanceCheckedIn ? '✅ Checked In' : '⏰ Check In'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCards}>
        <View style={styles.routeSummary}>
          <Text style={styles.sectionTitle}>Today's Route</Text>
          <View style={styles.statsRow}>
            <StatBox label="Total" value={summary?.totalStops || 0} color={colors.primary} />
            <StatBox label="Done" value={summary?.completed || 0} color={colors.completed} />
            <StatBox label="Pending" value={summary?.pending || 0} color={colors.pending} />
            <StatBox label="Failed" value={summary?.failed || 0} color={colors.failed} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>💰 Cash to Collect</Text>
          <Text style={styles.cardValue}>₹{summary?.cashToCollect || 0}</Text>
        </View>

        <View style={styles.bottleCards}>
          <View style={styles.bottleCard}>
            <Text style={styles.bottleEmoji}>🍶</Text>
            <Text style={styles.bottleCount}>{summary?.bottlesToIssue || 0}</Text>
            <Text style={styles.bottleLabel}>To Issue</Text>
          </View>
          <View style={styles.bottleCard}>
            <Text style={styles.bottleEmoji}>♻️</Text>
            <Text style={styles.bottleCount}>{summary?.bottlesToCollect || 0}</Text>
            <Text style={styles.bottleLabel}>To Collect</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
        <Text style={styles.startButtonText}>🚀 Start Route</Text>
      </TouchableOpacity>

      <View style={styles.dailyStats}>
        <Text style={styles.sectionTitle}>Daily Summary</Text>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Deliveries</Text>
          <Text style={styles.statValue}>{summary?.totalStops || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Completion Rate</Text>
          <Text style={styles.statValue}>
            {summary?.totalStops
              ? Math.round(((summary.completed || 0) / summary.totalStops) * 100)
              : 0}
            %
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Revenue Collected</Text>
          <Text style={styles.statValue}>₹{summary?.cashToCollect || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  checkedIn: {
    backgroundColor: colors.success,
  },
  checkedOut: {
    backgroundColor: colors.secondary,
  },
  attendanceText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCards: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  routeSummary: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statBoxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottleCards: {
    flexDirection: 'row',
    gap: 12,
  },
  bottleCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bottleEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  bottleCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dailyStats: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
