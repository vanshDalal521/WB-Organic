import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { deliveryApi, RouteStop } from '../../src/api/delivery';
import { colors } from '../../src/constants/colors';

export default function RouteScreen() {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeStarted, setRouteStarted] = useState(false);
  const [routeEnded, setRouteEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStops = async () => {
    try {
      const data = await deliveryApi.getRouteStops();
      setStops(data as RouteStop[]);
    } catch (e: any) {
      console.error('Failed to fetch route stops:', e?.message || e);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStops();
      setIsLoading(false);
    })();
  }, []);

  const handleStartRoute = async () => {
    try {
      await deliveryApi.startRoute();
      setRouteStarted(true);
      Alert.alert('Route Started', 'Your route has been started. Follow the order of stops.');
    } catch {
      Alert.alert('Error', 'Failed to start route');
    }
  };

  const handleEndRoute = () => {
    Alert.alert('End Route', 'Are you sure you want to end your route for today?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Route',
        style: 'destructive',
        onPress: async () => {
          try {
            await deliveryApi.endRoute();
            setRouteEnded(true);
            Alert.alert('Route Ended', 'Your route has been completed.');
          } catch {
            Alert.alert('Error', 'Failed to end route');
          }
        },
      },
    ]);
  };

  const handleNavigate = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [failModalVisible, setFailModalVisible] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState('');
  const [bottlesIssued, setBottlesIssued] = useState('0');
  const [bottlesCollected, setBottlesCollected] = useState('0');
  const [paymentCollected, setPaymentCollected] = useState('0');
  const [failReason, setFailReason] = useState('');

  const handleCompleteStop = (stopId: string) => {
    setSelectedStopId(stopId);
    setBottlesIssued('0');
    setBottlesCollected('0');
    setPaymentCollected('0');
    setCompleteModalVisible(true);
  };

  const submitComplete = async () => {
    try {
      await deliveryApi.completeStop(selectedStopId, {
        bottlesIssued: parseInt(bottlesIssued) || 0,
        bottlesCollected: parseInt(bottlesCollected) || 0,
        paymentCollected: parseInt(paymentCollected) || 0,
      });
      setCompleteModalVisible(false);
      fetchStops();
    } catch {
      Alert.alert('Error', 'Failed to complete stop');
    }
  };

  const handleFailStop = (stopId: string) => {
    setSelectedStopId(stopId);
    setFailReason('');
    setFailModalVisible(true);
  };

  const submitFail = async () => {
    if (!failReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    try {
      await deliveryApi.failStop(selectedStopId, failReason);
      setFailModalVisible(false);
      fetchStops();
    } catch {
      Alert.alert('Error', 'Failed to mark stop as failed');
    }
  };

  const completedCount = stops.filter((s) => s.status === 'COMPLETED').length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map View</Text>
        <Text style={styles.mapSubtext}>GPS navigation will appear here</Text>
      </View>

      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>
          Stop {completedCount}/{stops.length} completed
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: stops.length ? `${(completedCount / stops.length) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.stopsList}>
        {stops.map((stop, index) => (
          <View
            key={stop.id}
            style={[
              styles.stopCard,
              stop.status === 'COMPLETED' && styles.stopCompleted,
              stop.status === 'FAILED' && styles.stopFailed,
            ]}
          >
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.customerName}>{stop.customerName}</Text>
                <Text style={styles.address}>{stop.address}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  stop.status === 'COMPLETED' && styles.statusCompleted,
                  stop.status === 'FAILED' && styles.statusFailed,
                ]}
              >
                <Text style={styles.statusText}>{stop.status}</Text>
              </View>
            </View>

            <View style={styles.productsRow}>
              {stop.products.map((p, i) => (
                <Text key={i} style={styles.productTag}>
                  {p.name} x{p.quantity}
                </Text>
              ))}
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentType}>{stop.paymentType}</Text>
              <Text style={styles.amount}>₹{stop.totalAmount}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(stop.customerPhone)}
              >
                <Text style={styles.actionBtnText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleNavigate(stop.latitude, stop.longitude)}
              >
                <Text style={styles.actionBtnText}>🧭 Navigate</Text>
              </TouchableOpacity>
              {stop.status === 'PENDING' && routeStarted && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.completeBtn]}
                    onPress={() => handleCompleteStop(stop.id)}
                  >
                    <Text style={styles.actionBtnText}>✅ Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.failBtn]}
                    onPress={() => handleFailStop(stop.id)}
                  >
                    <Text style={styles.actionBtnText}>❌ Fail</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        {!routeStarted ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
            <Text style={styles.startButtonText}>🚀 Start Route</Text>
          </TouchableOpacity>
        ) : !routeEnded ? (
          <TouchableOpacity style={styles.endButton} onPress={handleEndRoute}>
            <Text style={styles.endButtonText}>🏁 End Route</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.routeEndedBadge}>
            <Text style={styles.routeEndedText}>Route Completed ✅</Text>
          </View>
        )}
      </View>

      <Modal
        visible={completeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCompleteModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Complete Stop</Text>
              <Text style={styles.modalSubtitle}>Enter delivery details</Text>

              <Text style={styles.modalLabel}>Bottles Issued</Text>
              <TextInput
                style={styles.modalInput}
                value={bottlesIssued}
                onChangeText={setBottlesIssued}
                keyboardType="number-pad"
                placeholder="0"
              />

              <Text style={styles.modalLabel}>Bottles Collected</Text>
              <TextInput
                style={styles.modalInput}
                value={bottlesCollected}
                onChangeText={setBottlesCollected}
                keyboardType="number-pad"
                placeholder="0"
              />

              <Text style={styles.modalLabel}>Payment Collected (₹)</Text>
              <TextInput
                style={styles.modalInput}
                value={paymentCollected}
                onChangeText={setPaymentCollected}
                keyboardType="number-pad"
                placeholder="0"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCompleteModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={submitComplete}>
                  <Text style={styles.modalConfirmText}>Complete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={failModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setFailModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Mark as Failed</Text>
              <Text style={styles.modalSubtitle}>Enter the reason for failure</Text>

              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={failReason}
                onChangeText={setFailReason}
                placeholder="Enter reason..."
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setFailModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalFailBtn} onPress={submitFail}>
                  <Text style={styles.modalConfirmText}>Mark Failed</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  routeInfo: {
    padding: 16,
    backgroundColor: colors.white,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stopsList: {
    flex: 1,
    padding: 16,
  },
  stopCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  stopCompleted: {
    borderLeftColor: colors.completed,
    opacity: 0.7,
  },
  stopFailed: {
    borderLeftColor: colors.failed,
    opacity: 0.7,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stopInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.pending,
  },
  statusCompleted: {
    backgroundColor: colors.completed,
  },
  statusFailed: {
    backgroundColor: colors.failed,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: colors.success,
  },
  failBtn: {
    backgroundColor: colors.error,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeEndedBadge: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  routeEndedText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 14,
    backgroundColor: colors.background,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalFailBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
