import { Redirect } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/theme";

export default function Index() {
  const { user, isLoading } = useCurrentUser();

  // Show loading while checking user
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background.light }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect admin to admin dashboard
  if (user?.role === "admin") {
    return <Redirect href="/(admin)/dashboard" />;
  }

  // Redirect regular users to home
  return <Redirect href="/(tabs)/home" />;
}
