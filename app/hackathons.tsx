import React, { useEffect, useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { Text, View, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Image, TouchableOpacity, TextInput, Linking } from "react-native";
import { Search } from "lucide-react-native";

export default function Hackathons() {
    const [hackathons, setHackathons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchHackathons = async () => {
            try {
                const response = await fetch("https://dash.hackathons.hackclub.com/api/v1/hackathons");
                const data = await response.json();
                setHackathons(data.data);
            } catch (error) {
                console.error("Error fetching hackathons:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHackathons();
    }, []);

    const getHackathonStatus = (hackathon: any) => {
        const now = new Date();
        const startsAt = new Date(hackathon.starts_at);
        const endsAt = new Date(hackathon.ends_at);

        if (endsAt < now) {
            return "ended";
        } else if (hackathon.location.city) {
            return "in-person";
        } else {
            return "online";
        }
    };

    const filteredHackathons = hackathons.filter((hackathon) =>
        hackathon.location.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ec3750" />
                <Text style={styles.loadingText}>Loading hackathons...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Search color="#888" size={20} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search by city"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {filteredHackathons.map((hackathon) => {
                    const status = getHackathonStatus(hackathon);
                    const isEnded = status === "ended";
                    
                    return (
                        <TouchableOpacity
                            key={hackathon.id}
                            style={[
                                styles.card,
                                isEnded && styles.endedCard
                            ]}
                            onPress={() => hackathon.website && Linking.openURL(hackathon.website)}
                            disabled={isEnded}
                        >
                            <Image 
                                source={{ uri: hackathon.logo_url }} 
                                style={[
                                    styles.logo,
                                    isEnded && styles.grayedImage
                                ]} 
                            />
                            <View style={styles.cardHeader}>
                                <Text style={[
                                    styles.name,
                                    isEnded && styles.grayedText
                                ]}>
                                    {hackathon.name}
                                </Text>
                            </View>
                            <Text style={[
                                styles.date,
                                isEnded && styles.grayedText
                            ]}>
                                {new Date(hackathon.starts_at).toLocaleDateString()} - {new Date(hackathon.ends_at).toLocaleDateString()}
                            </Text>
                            <Text style={[
                                styles.location,
                                isEnded && styles.grayedText
                            ]}>
                                {hackathon.location.city || "Online"}, {hackathon.location.country || ""}
                            </Text>
                            <View style={[
                                styles.statusTag,
                                status === "ended" ? styles.endedPill : 
                                status === "in-person" ? styles.inPersonPill : styles.onlinePill
                            ]}>
                                <Text style={styles.statusText}>
                                    {status === "ended" ? "Ended" : 
                                        status === "in-person" ? "In-person" : "Online"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
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
        borderColor: "#333", 
    },
    endedCard: {
        backgroundColor: "#1A1A1A",
        borderColor: "#2A2A2A",
        opacity: 0.7,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginBottom: 12,
    },
    grayedImage: {
        opacity: 0.5,
    },
    name: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#FFFFFF",
        flex: 1,
        marginRight: 10,
    },
    grayedText: {
        color: "#777777",
    },
    date: {
        fontSize: 14,
        color: "#CCCCCC",
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: "#CCCCCC",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#CCCCCC",
    },
    navbarSpacer: {
        height: 90,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E1E1E",
        borderRadius: 8,
        paddingHorizontal: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: "#444",
    },
    searchBar: {
        flex: 1,
        height: 40,
        color: "#FFFFFF",
        marginLeft: 8,
    },
    statusTag: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    statusText: {   
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 12,
        textAlign: "center",
    },
    endedPill: {
        backgroundColor: "#800800",
    },
    inPersonPill: {
        backgroundColor: "#1c8000",
    },
    onlinePill: {
        backgroundColor: "#000d80",
    },
});