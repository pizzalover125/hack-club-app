import NavigationBar from "@/components/NavigationBar";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
        Hackatime
      </Text>
      <NavigationBar />
    </View>
  );
}
