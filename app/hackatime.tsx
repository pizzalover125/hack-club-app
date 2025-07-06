import React, { useState, useEffect } from "react";
import { Text, View, TextInput, Button, ScrollView, ActivityIndicator, Alert, StyleSheet, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationBar from "@/components/NavigationBar";

interface Language {
  name: string;
  total_seconds: number;
  text: string;
  hours: number;
  minutes: number;
  percent: number;
  digital: string;
}

interface StatsData {
  username: string;
  user_id: string;
  is_coding_activity_visible: boolean;
  is_other_usage_visible: boolean;
  status: string;
  start: string;
  end: string;
  range: string;
  human_readable_range: string;
  total_seconds: number;
  daily_average: number;
  human_readable_total: string;
  human_readable_daily_average: string;
  languages: Language[];
}

interface ApiResponse {
  data: StatsData;
  trust_factor: {
    trust_level: string;
    trust_value: number;
  };
}

export default function Index() {
  const [slackId, setSlackId] = useState("");
  const [storedSlackId, setStoredSlackId] = useState<string | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [allTimeStats, setAllTimeStats] = useState<StatsData | null>(null);
  const [todayStats, setTodayStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("slackId").then((value) => {
      if (value) {
        setStoredSlackId(value);
        fetchStats(value);
      } else {
        setInputVisible(true);
      }
    });
  }, []);

  const fetchStats = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all-time stats
      const allTimeResponse = await fetch(`https://hackatime.hackclub.com/api/v1/users/${id}/stats`);
      if (!allTimeResponse.ok) {
        throw new Error(`Failed to fetch all-time stats: ${allTimeResponse.status}`);
      }
      const allTimeData: ApiResponse = await allTimeResponse.json();
      setAllTimeStats(allTimeData.data);

      // Fetch today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayResponse = await fetch(`https://hackatime.hackclub.com/api/v1/users/${id}/stats?start_date=${today}`);
      if (!todayResponse.ok) {
        throw new Error(`Failed to fetch today's stats: ${todayResponse.status}`);
      }
      const todayData: ApiResponse = await todayResponse.json();
      setTodayStats(todayData.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
      Alert.alert("Error", "Failed to fetch stats. Please check your Slack ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!slackId.trim()) {
      Alert.alert("Error", "Please enter a valid Slack ID");
      return;
    }

    await AsyncStorage.setItem("slackId", slackId);
    setStoredSlackId(slackId);
    setInputVisible(false);
    fetchStats(slackId);
  };

  const handleChangeId = () => {
    setInputVisible(true);
    setAllTimeStats(null);
    setTodayStats(null);
    setError(null);
  };

  const getFavoriteLanguage = (stats: StatsData | null) => {
    if (!stats || !stats.languages.length) return "N/A";
    const topLanguage = stats.languages.find(lang => lang.total_seconds > 0);
    return topLanguage ? topLanguage.name : "N/A";
  };

  const hackatimeStats = [
    { label: "Total Time (All Time)", value: allTimeStats?.human_readable_total || "N/A" },
    { label: "Daily Average", value: todayStats?.human_readable_total || "N/A" },
    { label: "Favorite Language", value: getFavoriteLanguage(allTimeStats) },
    { label: "Total Time (Today)", value: allTimeStats?.human_readable_daily_average || "0m" },
  ];

  if (inputVisible) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Hackatime</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter your Slack ID</Text>
            <TextInput
              value={slackId}
              onChangeText={setSlackId}
              placeholder="e.g. U12345678"
              placeholderTextColor="#aaa"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Save"
              onPress={handleSave}
              disabled={!slackId.trim()}
              color="#ec3750"
            />
          </View>
        </View>
        <NavigationBar />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ec3750" />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => storedSlackId && fetchStats(storedSlackId)} color="#ec3750" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.slackIdText}>Slack ID: {storedSlackId}</Text>
          <Button
            title="Change ID"
            onPress={handleChangeId}
            color="#ec3750"
          />
        </View>

        {hackatimeStats.map((stat, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.value}>{stat.value}</Text>
          </View>
        ))}

        {allTimeStats && allTimeStats.languages.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Top Languages (All Time)</Text>
            {allTimeStats.languages.slice(0, 5).map((lang, index) => (
              lang.total_seconds > 0 && (
                <View key={index} style={styles.languageRow}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageTime}>
                    {lang.text} ({lang.percent.toFixed(1)}%)
                  </Text>
                </View>
              )
            ))}
          </View>
        )}

        <View style={styles.navbarSpacer} />
      </ScrollView>
      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  slackIdText: {
    color: "#CCCCCC",
    marginBottom: 10,
    fontSize: 14,
  },
  inputContainer: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333333",
  },
  inputLabel: {
    color: "#FFFFFF",
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#23272f",
    color: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333333",
  },
  label: {
    fontSize: 12,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  value: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  languageName: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  languageTime: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  errorText: {
    color: "#ec3750",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },
  navbarSpacer: {
    height: 90,
  },
});

