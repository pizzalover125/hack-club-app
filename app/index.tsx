import NavigationBar from "@/components/NavigationBar";
import { Text, View, Image } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      <Image
        source={{ uri: "https://assets.hackclub.com/icon-rounded.png" }}
        style={{ width: 200, height: 200, marginBottom: 20 }}
      />
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
        Welcome to the unofficial Hack Club app!
      </Text>
      <NavigationBar />
    </View>
  );
}
