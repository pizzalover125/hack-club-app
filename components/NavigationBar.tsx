import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Home, Hammer, BarChart, Computer, Timer } from 'lucide-react-native';

export default function NavigationBar() {
  return (
    <View style={styles.container}>
      <Link href="/" asChild>
        <TouchableOpacity style={styles.tab}>
          <Home color="#FFFFFF" size={24} />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/ysws" asChild>
        <TouchableOpacity style={styles.tab}>
          <Hammer color="#FFFFFF" size={24} />
          <Text style={styles.tabText}>YSWS</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/stats" asChild>
        <TouchableOpacity style={styles.tab}>
          <BarChart color="#FFFFFF" size={24} />
          <Text style={styles.tabText}>Stats</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/hackathons" asChild>
        <TouchableOpacity style={styles.tab}>
          <Computer color="#FFFFFF" size={24} />
          <Text style={styles.tabText}>Events</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/hackatime" asChild>
        <TouchableOpacity style={styles.tab}>
          <Timer color="#FFFFFF" size={24} />
          <Text style={styles.tabText}>HTime</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    height: 70,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 5,
    fontSize: 12,
  },
});