import React, { useEffect, useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { Text, View, ScrollView, StyleSheet, Linking, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, Share, Alert } from "react-native";
import { XMLParser } from "fast-xml-parser";
import { Clock, ChevronDown, Check, Share2 } from "lucide-react-native";

interface YSWSItem {
  title: string;
  link: string;
  description: string;
  deadline: string;
  discussionLink: string;
  isPassed: boolean;
}

interface ProgramStatus {
  [key: string]: string;
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress", color: "#ec3750" },
  { value: "interested", label: "Interested", color: "#5bc0de" },
  { value: "applied", label: "Applied", color: "#f1c40f" },
  { value: "uninterested", label: "Uninterested", color: "#8492a6" },
  { value: "completed", label: "Completed", color: "#33d6a6" },
];

export default function Index() {
  const [programs, setPrograms] = useState<YSWSItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});
  const [programStatuses, setProgramStatuses] = useState<ProgramStatus>({});
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);

  const isDeadlinePassed = (deadlineStr: string): boolean => {
    if (deadlineStr === "No deadline provided") return false;
    try {
      const deadlineDate = new Date(deadlineStr);
      const now = new Date();
      return deadlineDate < now;
    } catch (error) {
      return false;
    }
  };

  const getProgramKey = (program: YSWSItem, index: number): string => {
    return `${program.title}-${index}`;
  };

  const getStatusColor = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption ? statusOption.color : "#666666";
  };

  const getStatusLabel = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption ? statusOption.label : "Set Status";
  };

  const getStatusPriority = (status: string): number => {
    const statusPriority = {
      "in_progress": 1,
      "interested": 2,
      "applied": 3,
      "": 4,
      "uninterested": 5,
      "completed": 6
    };
    return statusPriority[status as keyof typeof statusPriority] || 4;
  };

  const updateProgramStatus = (programKey: string, status: string) => {
    setProgramStatuses(prev => ({
      ...prev,
      [programKey]: status
    }));
    setDropdownVisible(null);
  };

  const handleLongPress = async (program: YSWSItem) => {
    try {
      const shareContent = {
        title: program.title,
        message: `Check out this program: ${program.title}\n\n${program.description}\n\nDeadline: ${program.deadline}\n\nLearn more: ${program.link}`,
        url: program.link,
      };

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share program details');
    }
  };

  const StatusPicker = ({ programKey, currentStatus }: { programKey: string; currentStatus: string }) => {
    return (
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[styles.statusButton, { borderColor: getStatusColor(currentStatus) }]}
          onPress={() => setDropdownVisible(programKey)}
        >
          <Text style={[styles.statusButtonText, { color: getStatusColor(currentStatus) }]}>
            {getStatusLabel(currentStatus)}
          </Text>
          <ChevronDown 
            color={getStatusColor(currentStatus)} 
            size={16} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: {[key: string]: string} = {};
      programs.forEach((program, index) => {
        if (!program.isPassed && program.deadline !== "No deadline provided") {
          const now = new Date();
          const deadlineDate = new Date(program.deadline);
          if (deadlineDate > now) {
            const timeDiff = deadlineDate.getTime() - now.getTime();
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            if (days > 0) {
              newCountdowns[`${program.title}-${index}`] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
              newCountdowns[`${program.title}-${index}`] = `${hours}h ${minutes}m ${seconds}s`;
            } else {
              newCountdowns[`${program.title}-${index}`] = `${minutes}m ${seconds}s`;
            }
          }
        }
      });
      setCountdowns(newCountdowns);
    };

    if (programs.length > 0) {
      updateCountdowns();
      const interval = setInterval(updateCountdowns, 1000);
      return () => clearInterval(interval);
    }
  }, [programs]);

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
            isPassed: isDeadlinePassed(deadline),
          };
        });

        const sortedPrograms = formattedPrograms.sort((a, b) => {
          if (!a.isPassed && b.isPassed) return -1;
          if (a.isPassed && !b.isPassed) return 1;
          return 0;
        });

        setPrograms(sortedPrograms);
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

  useEffect(() => {
  }, [dropdownVisible]);

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

    const upcomingPrograms = programs.filter(program => !program.isPassed);
    const passedPrograms = programs.filter(program => program.isPassed);

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {upcomingPrograms.map((program, index) => {
          const programKey = getProgramKey(program, index);
          const currentStatus = programStatuses[programKey] || "";
          
          return (
            <TouchableOpacity
              key={`upcoming-${index}`}
              style={styles.card}
              onLongPress={() => handleLongPress(program)}
              delayLongPress={500}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                  {program.title}
                </Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleLongPress(program)}
                  >
                    <Share2 color="#CCCCCC" size={18} />
                  </TouchableOpacity>
                  <StatusPicker programKey={programKey} currentStatus={currentStatus} />
                </View>
              </View>
              
              <Text style={styles.description} numberOfLines={4}>
                {program.description}
              </Text>
              <Text style={styles.deadline}>Deadline: {program.deadline}</Text>
              
              {countdowns[`${program.title}-${index}`] && (
                <View style={styles.countdownContainer}>
                  <Clock color="#ec3750" size={16} />
                  <Text style={styles.countdownText}>
                    Deadline in {countdowns[`${program.title}-${index}`]}
                  </Text>
                </View>
              )}
              
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
            </TouchableOpacity>
          );
        })}

        {passedPrograms.length > 0 && (
          <>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Past Programs</Text>
            </View>
            {passedPrograms.map((program, index) => (
              <TouchableOpacity
                key={`passed-${index}`}
                style={[styles.card, styles.passedCard]}
                onLongPress={() => handleLongPress(program)}
                delayLongPress={500}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.title, styles.passedTitle]} numberOfLines={2} ellipsizeMode="tail">
                    {program.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleLongPress(program)}
                  >
                    <Share2 color="#666666" size={18} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.description, styles.passedDescription]} numberOfLines={4}>
                  {program.description}
                </Text>
                <Text style={[styles.deadline, styles.passedDeadline]}>Deadline: {program.deadline} (Passed)</Text>
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.passedButton]}
                    onPress={() => Linking.openURL(program.link)}
                  >
                    <Text style={styles.passedButtonText}>Learn More</Text>
                  </TouchableOpacity>
                  
                  {program.discussionLink && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton, styles.passedSecondaryButton]}
                      onPress={() => Linking.openURL(program.discussionLink)}
                    >
                      <Text style={[styles.secondaryButtonText, styles.passedSecondaryButtonText]}>Join Discussion</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.longPressHint}>
                  <Text style={[styles.longPressHintText, styles.passedLongPressHint]}>Long press to share</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        
        <View style={styles.navbarSpacer} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      <Modal
        visible={dropdownVisible !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  dropdownVisible && programStatuses[dropdownVisible] === option.value && styles.selectedModalOption
                ]}
                onPress={() => {
                  if (dropdownVisible) {
                    updateProgramStatus(dropdownVisible, option.value);
                  }
                }}
              >
                <Text style={[styles.modalOptionText, { color: option.color }]}>
                  {option.label}
                </Text>
                {dropdownVisible && programStatuses[dropdownVisible] === option.value && (
                  <Check color={option.color} size={18} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },

  passedCard: {
    backgroundColor: "#161616",
    borderColor: "#2A2A2A",
    opacity: 0.7,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF", 
    flex: 1,
    marginRight: 12,
  },

  passedTitle: {
    color: "#777777",
  },

  description: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 12,
  },

  passedDescription: {
    color: "#666666",
  },

  deadline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#ec3750",
    marginBottom: 16,
  },

  passedDeadline: {
    color: "#666666",
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
    minWidth: 120, 
  },

  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1F1F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ec3750",
    alignSelf: "flex-start", 
    minWidth: 120,           
  },

  passedButton: {
    backgroundColor: "#555555",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  passedButtonText: {
    color: "#AAAAAA",
  },

  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ec3750",
  },

  passedSecondaryButton: {
    borderColor: "#555555",
  },

  secondaryButtonText: {
    color: "#ec3750",
    fontWeight: "600",
    fontSize: 14,
  },

  passedSecondaryButtonText: {
    color: "#777777",
  },

  sectionDivider: {
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#AAAAAA",
    textAlign: "center",
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
  },

  countdownText: {
    color: "#ec3750",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  statusContainer: {
    position: "relative",
  },

  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },

  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#333333",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },

  selectedModalOption: {
    backgroundColor: "#333333",
  },

  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },

  longPressHint: {
    marginTop: 8,
    alignItems: "center",
  },

  longPressHintText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },

  passedLongPressHint: {
    color: "#444444",
  },
});
