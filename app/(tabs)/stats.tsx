import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { BarChart3, TrendingUp, Award, Flame, Zap, Target } from 'lucide-react-native';

import { Colors, Spacing, BorderRadius, Layout } from '../../src/constants/theme';
import { QuizStorage, UserStats } from '../../src/storage/quizStorage';

export default function StatisticsScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    const data = await QuizStorage.getUserStats();
    setStats(data);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const StatItem = ({ icon: Icon, label, value, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  // Generate chart data for last 7 days
  const getChartData = () => {
    const activity = stats?.dailyActivity || {};
    const data = [];
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Max value for scaling (min 10 to avoid 0 height issues)
    let maxSolved = 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const solved = activity[dateStr] || 0;
      if (solved > maxSolved) maxSolved = solved;
      
      data.push({
        label: days[date.getDay()],
        value: solved,
        isToday: i === 0
      });
    }

    const scale = maxSolved > 0 ? 100 / maxSolved : 0;
    return data.map(d => ({
      ...d,
      height: d.value > 0 ? Math.max(10, d.value * scale) : 0
    }));
  };

  const chartData = getChartData();

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>Analytics — MCfy</title>
      </Head>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Tracking your academic growth</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadStats} tintColor={Colors.primary} />
        }
      >
        <View style={styles.mainScoreSection}>
          <View style={styles.accuracyRing}>
            <View style={styles.accuracyInner}>
              <Text style={styles.accuracyValue}>
                {stats?.overallAccuracy ? stats.overallAccuracy.toFixed(0) : 0}%
              </Text>
              <Text style={styles.accuracySubtext}>Accuracy</Text>
            </View>
          </View>
          <View style={styles.mainMetrics}>
            <View style={styles.metricRow}>
              <Flame color={Colors.warning} size={18} />
              <Text style={styles.metricText}>{stats?.streak || 0} Day Streak</Text>
            </View>
            <View style={styles.metricRow}>
              <Award color={Colors.primary} size={18} />
              <Text style={styles.metricText}>Best: {stats?.bestScore ? stats.bestScore.toFixed(0) : 0}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <StatItem 
            icon={Zap} 
            label="Total Solved" 
            value={stats?.totalMCQsSolved || 0} 
            color={Colors.primary} 
          />
          <StatItem 
            icon={Target} 
            label="Correct" 
            value={stats?.totalCorrect || 0} 
            color={Colors.success} 
          />
          <StatItem 
            icon={BarChart3} 
            label="Completed" 
            value={stats?.totalQuizzesCompleted || 0} 
            color={Colors.info} 
          />
          <StatItem 
            icon={TrendingUp} 
            label="Avg/Study Day" 
            value={stats?.totalMCQsSolved ? (stats.totalMCQsSolved / Math.max(1, Object.keys(stats.dailyActivity).length)).toFixed(1) : 0} 
            color={Colors.secondary} 
          />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Study Frequency</Text>
            <Text style={styles.chartSubtitle}>Last 7 days (MCQs Solved)</Text>
          </View>
          <View style={styles.barChart}>
            {chartData.map((item, i) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.barTrack}>
                  <View style={[
                    styles.barFill, 
                    { height: `${item.height}%` },
                    item.isToday && { backgroundColor: Colors.primary }
                  ]} />
                </View>
                <Text style={[styles.barLabel, item.isToday && { color: Colors.primary, fontWeight: '800' }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  mainScoreSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accuracyRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  accuracyInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  accuracyValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  accuracySubtext: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainMetrics: {
    flex: 1,
    gap: Spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    backgroundColor: Colors.card,
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartHeader: {
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 7,
  },
  barLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
