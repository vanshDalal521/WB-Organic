import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { colors } from '../../src/constants/colors';

const logoImg = require('../../assets/logo.jpeg');

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [countryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.sendOtp(phone, countryCode);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone, countryCode },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image source={logoImg} style={styles.logoImage} resizeMode="cover" />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login or Sign up</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.phoneInput}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 {countryCode}</Text>
              </View>
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.phonePrefix}>+91</Text>
                <View style={styles.phoneDivider} />
                <TextInput
                  style={styles.phoneInputField}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.text.muted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.sendOtpButton, loading && styles.disabledButton]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              <Text style={styles.sendOtpButtonText}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleButton}>
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By continuing you agree to our{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  form: {
    flex: 1,
  },
  phoneInput: {
    marginBottom: 16,
  },
  countryCode: {
    marginBottom: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  phonePrefix: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: 12,
  },
  phoneInputField: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  error: {
    fontSize: 14,
    color: colors.status.error,
    marginBottom: 16,
  },
  sendOtpButton: {
    backgroundColor: colors.primary.DEFAULT,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendOtpButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.DEFAULT,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.text.muted,
  },
  googleButton: {
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  appleButton: {
    backgroundColor: colors.black,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '500',
  },
});
