import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';

// Simple SVG icon wrapper for tab bar
import Svg, { Path, Circle } from 'react-native-svg';

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SchemesIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MatchIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalcIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke={color} strokeWidth={2} />
      <Path d="M8 10h8M8 14h4M8 6h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (isLoading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.burgundy,
        tabBarInactiveTintColor: Colors.slate400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 56 + insets.bottom : 64,
        },
        tabBarLabelStyle: {
          fontSize: Fonts.sizes.xs,
          fontWeight: Fonts.weights.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home', 'Home'),
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: t('nav.schemes', 'Schemes'),
          tabBarIcon: ({ color, size }) => <SchemesIcon color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: t('nav.smartMatch', 'Match'),
          tabBarIcon: ({ color, size }) => <MatchIcon color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: t('nav.calculator', 'Calculator'),
          tabBarIcon: ({ color, size }) => <CalcIcon color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile', 'Profile'),
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
