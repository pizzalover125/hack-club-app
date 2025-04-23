import React, { useEffect, useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { Text, View, ScrollView, StyleSheet, Linking, SafeAreaView, ActivityIndicator, TouchableOpacity } from "react-native";
import { XMLParser } from "fast-xml-parser";

interface YSWSItem {
  title: string;
  link: string;
  description: string;
  deadline: string;
  discussionLink: string;
}

export default function Index() {
  const [programs, setPrograms] = useState<YSWSItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://ysws.hackclub.com/feed.xml");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlData = await response.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsedData = parser.parse(xmlData);
        const items = parsedData.rss.channel.item;

        const formattedPrograms = (Array.isArray(items) ? items : [items]).map((item: any) => {
          const HTMLParser = require("react-native-html-parser").DOMParser;
          const descriptionDoc = new HTMLParser().parseFromString(item.description, "text/html");
          const deadlineElement = descriptionDoc.getElementsByTagName("strong")[0];
          const deadline = deadlineElement?.textContent === "Deadline:" 
            ? deadlineElement.parentNode?.textContent?.replace("Deadline: ", "").trim() || "No deadline provided"
            : "No deadline provided";

          if (deadlineElement?.parentNode) {
            deadlineElement.parentNode.removeChild(deadlineElement);
          }

          const discussionLinkElement = descriptionDoc.getElementsByTagName("a")[0];
          const discussionLink = discussionLinkElement?.getAttribute("href") || "";

          return {
            title: item.title,
            link: item.link,
            description: descriptionDoc.documentElement.textContent?.trim() || "No description available",
            deadline,
            discussionLink,
          };
        });

        setPrograms(formattedPrograms);
        setError(null);
      } catch (error) {
        console.error("Error fetching the feed:", error);
        setError("Failed to load programs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ec3750" />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (programs.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No programs available at the moment.</Text>
        </View>
      );
    }

    return (
      <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      >
      {programs.map((program, index) => (
        <View key={index} style={styles.card}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {program.title}
        </Text>
        <Text style={styles.description} numberOfLines={4}>
          {program.description}
        </Text>
        <Text style={styles.deadline}>Deadline: {program.deadline}</Text>
        <View style={styles.linkContainer}>
          <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL(program.link)}
          >
          <Text style={styles.buttonText}>Learn More</Text>
          </TouchableOpacity>
          
          {program.discussionLink && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => Linking.openURL(program.discussionLink)}
          >
            <Text style={styles.secondaryButtonText}>Join Discussion</Text>
          </TouchableOpacity>
          )}
        </View>
        </View>
      ))}
      <View style={styles.navbarSpacer} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
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
    marginBottom: 70, 
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF", 
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 12,
  },
  deadline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#ec3750",
    marginBottom: 16,
  },
  linkContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#ec3750", 
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ec3750",
  },
  secondaryButtonText: {
    color: "#ec3750",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  errorText: {
    color: "#EF4444", 
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    color: "#CCCCCC",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  navbarSpacer: {
    height: 90, 
  }
});