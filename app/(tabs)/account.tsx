import * as React from "react";
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCustomer, useCustomerDelete } from "~/lib/shopify/hooks";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const PROFILE_PICTURE_KEY = "@beatrackfam:profile_picture";

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} className="flex-row items-center rounded-2xl bg-card p-4 mb-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 mr-4">
        <LucideIcon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      {showChevron && (
        <LucideIcon name="ChevronRight" size={20} color={theme.colors.mutedForeground} />
      )}
    </Pressable>
  );
}

export default function AccountScreen() {
  const { theme } = useTheme();
  const { accessToken, logout } = useAuth();
  const { clearCart } = useCartContext();
  const { data: customer } = useCustomer(accessToken);
  const customerDelete = useCustomerDelete();
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);

  // Load profile picture when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadProfilePicture();
    }, []),
  );

  const loadProfilePicture = async () => {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      setProfilePicture(uri);
    } catch (error) {
      console.error("Failed to load profile picture:", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out BeaTrackFam - Loyalty Above All! Download the app today.",
        title: "BeaTrackFam",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Success", "You have been logged out");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account from BeaTrackFam and all associated data, including:\n\n• Your profile and preferences\n• Order history\n• Saved addresses\n• Wishlist items\n\nThis action cannot be undone. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            if (!accessToken) {
              Alert.alert("Error", "You must be logged in to delete your account.");
              return;
            }

            try {
              console.log("Attempting to delete customer account from Shopify...");

              // Try to delete account from Shopify
              await customerDelete.mutateAsync({ accessToken });

              console.log("Account deleted from Shopify successfully");

              // Clear all local data
              await logout();
              await clearCart();

              Alert.alert(
                "Account Deleted Successfully",
                "Your BeaTrackFam account and all associated data have been permanently deleted, including your profile, order history, saved addresses, and wishlist.\n\nYou can create a new account anytime by signing up again. Thank you for being part of the BeaTrackFam community.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(tabs)"),
                  },
                ],
              );
            } catch (error) {
              console.error("Delete account error:", error);

              // Even if Shopify deletion fails, still clear local data
              await logout();
              await clearCart();

              const handleEmailSupport = async () => {
                const email = "contact@beatrackfam.info";
                const subject = "Account Deletion Request";
                const body = `Hello BeaTrackFam Support,\n\nI would like to request the permanent deletion of my account from your Shopify system.\n\nAccount Details:\nEmail: ${customer?.email || "N/A"}\nName: ${customer?.displayName || "N/A"}\n\nPlease confirm once my account has been permanently deleted.\n\nThank you.`;

                const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                try {
                  const canOpen = await Linking.canOpenURL(mailtoUrl);
                  if (canOpen) {
                    await Linking.openURL(mailtoUrl);
                    router.replace("/(tabs)");
                  } else {
                    Alert.alert(
                      "Unable to Open Email",
                      "Please email us at contact@beatrackfam.info to request account deletion.",
                    );
                  }
                } catch (emailError) {
                  console.error("Failed to open email:", emailError);
                  Alert.alert(
                    "Unable to Open Email",
                    "Please email us at contact@beatrackfam.info to request account deletion.",
                  );
                }
              };

              Alert.alert(
                "Account Removed from App",
                "Your account has been removed from this app and all local data has been cleared.\n\nTo permanently delete your account from our Shopify system, please contact support by clicking the button below.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => router.replace("/(tabs)"),
                  },
                  {
                    text: "Email Support",
                    onPress: handleEmailSupport,
                  },
                ],
              );
            }
          },
        },
      ],
    );
  };

  const handleSupport = () => {
    router.push("/support");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleEditProfile = () => {
    router.push("/profile");
  };

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to Open Link", "Please try again later.");
      }
    } catch (error) {
      Alert.alert("Unable to Open Link", "Please try again later.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* User Info */}
        {customer ? (
          <View className="pt-4 pb-6">
            <View
              className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <View className="flex-row items-center">
                <Pressable onPress={handleEditProfile} className="mr-4">
                  <View className="relative">
                    {profilePicture ? (
                      <Image
                        key={profilePicture}
                        source={{ uri: profilePicture }}
                        style={{ width: 72, height: 72, borderRadius: 36 }}
                      />
                    ) : (
                      <View
                        className="items-center justify-center bg-background"
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                        }}
                      >
                        <LucideIcon name="User" size={32} color={theme.colors.primary} />
                      </View>
                    )}
                    <View
                      className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 bg-background"
                      style={{ borderColor: theme.colors.primary }}
                    >
                      <LucideIcon name="Camera" size={14} color={theme.colors.primary} />
                    </View>
                  </View>
                </Pressable>
                <View className="flex-1">
                  <Text
                    className="text-xl font-bold mb-1"
                    style={{ color: theme.colors.primaryForeground }}
                  >
                    {customer.displayName}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.primaryForeground, opacity: 0.8 }}
                  >
                    {customer.email}
                  </Text>
                  <Pressable onPress={handleEditProfile} className="mt-2">
                    <Text
                      className="text-xs font-medium"
                      style={{ color: theme.colors.primaryForeground }}
                    >
                      Edit Profile →
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="pt-4 pb-6">
            <View className="rounded-2xl bg-card p-6 mb-4 border border-border">
              <View className="items-center mb-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-muted mb-3">
                  <LucideIcon name="User" size={32} color={theme.colors.mutedForeground} />
                </View>
                <Text className="text-lg font-bold text-foreground mb-1">
                  Welcome to BeaTrackFam
                </Text>
                <Text className="text-sm text-center text-muted-foreground">
                  Sign in to access exclusive features and track your orders
                </Text>
              </View>
              <Button onPress={() => router.push("/auth/login")} className="mb-3" size="lg">
                <Text>Log In</Text>
              </Button>
              <Button onPress={() => router.push("/auth/signup")} variant="outline" size="lg">
                <Text className="text-foreground">Create Account</Text>
              </Button>
            </View>
          </View>
        )}

        {/* My Account Section */}
        {customer && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              MY ACCOUNT
            </Text>
            <MenuItem
              icon="User"
              title="My Profile"
              subtitle="View your profile and stats"
              onPress={() => router.push("/my-profile")}
            />
            <MenuItem
              icon="Package"
              title="Order History"
              subtitle="Track your purchases"
              onPress={() => router.push("/orders")}
            />
            <MenuItem
              icon="MapPin"
              title="Addresses"
              subtitle="Manage shipping addresses"
              onPress={() => router.push("/addresses")}
            />
          </View>
        )}

        {/* App Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            {customer ? "APP" : "EXPLORE"}
          </Text>
          <MenuItem
            icon="Palette"
            title="Custom Design Request"
            subtitle="Design your own merch"
            onPress={() => router.push("/custom-request")}
          />
          <MenuItem
            icon="Share2"
            title="Share App"
            subtitle="Tell your friends about BeaTrackFam"
            onPress={handleShare}
          />
          <MenuItem
            icon="Headset"
            title="Support"
            subtitle="Get help with your order"
            onPress={handleSupport}
          />
          <MenuItem
            icon="Settings"
            title="Settings"
            subtitle="App preferences and information"
            onPress={handleSettings}
          />
        </View>

        {/* Logout & Delete Account */}
        {customer && (
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              ACCOUNT ACTIONS
            </Text>
            <Button onPress={handleLogout} variant="outline" className="mb-3">
              <View className="flex-row items-center">
                <LucideIcon name="LogOut" size={18} color={theme.colors.foreground} />
                <Text className="ml-2 text-foreground">Log Out</Text>
              </View>
            </Button>
            <Button
              onPress={handleDeleteAccount}
              variant="outline"
              className="border-destructive"
              disabled={customerDelete.isPending}
            >
              {customerDelete.isPending ? (
                <ActivityIndicator color={theme.colors.destructive} />
              ) : (
                <View className="flex-row items-center">
                  <LucideIcon name="Trash2" size={18} color={theme.colors.destructive} />
                  <Text className="ml-2 text-destructive">Delete Account</Text>
                </View>
              )}
            </Button>
          </View>
        )}

        {/* Social Media */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            CONNECT WITH US
          </Text>
          <View className="rounded-2xl bg-card p-5">
            <View className="flex-row items-center justify-around">
              <Pressable
                onPress={() => handleOpenUrl("https://instagram.com/beatrackfam")}
                className="flex-1 items-center"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <LucideIcon name="Instagram" size={24} color={theme.colors.primary} />
                </View>
                <Text className="text-xs font-medium text-foreground">Instagram</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOpenUrl("https://tiktok.com/@beatrackfam")}
                className="flex-1 items-center"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <LucideIcon name="Music4" size={24} color={theme.colors.primary} />
                </View>
                <Text className="text-xs font-medium text-foreground">TikTok</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOpenUrl("https://facebook.com/beatrackfam")}
                className="flex-1 items-center"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <LucideIcon name="Facebook" size={24} color={theme.colors.primary} />
                </View>
                <Text className="text-xs font-medium text-foreground">Facebook</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* About Us */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">ABOUT US</Text>
          <View className="rounded-2xl bg-card p-5">
            <Text className="text-lg font-semibold text-foreground mb-3">
              🖤 The BeaTrackFam Story
            </Text>
            <Text className="text-sm text-muted-foreground leading-6">
              Loyalty Over Logic{"\n\n"}
              The Vision: More Than Just Threads{"\n\n"}
              At BeaTrackFam, we believe that true style isn't about fleeting trends or empty
              promises—it’s about loyalty, authenticity, and giving back to the community that
              supports us. We believe every person has a unique, powerful "beat to their heart," and
              our mission is to translate that genuine energy into custom-designed apparel and
              accessories.{"\n\n"}
              We are not here for quick profits. We built this brand to be known as a loyal brand, a
              true family, and not a money gimmick or scheme like so many others. BeaTrackFam is the
              commitment where integrity meets creativity, ensuring every design we release is
              worthy of your trust.{"\n\n"}
              👤 Meet the Founder: A Commitment to Community{"\n\n"}
              BeaTrackFam was born from the personal journey and deep conviction of Mr. Joseph Gabay
              or well known as Joey.{"\n\n"}
              Growing up, Joey knew firsthand what it was like to struggle. This experience
              instilled an unshakeable commitment to operating with transparency and purpose. The
              idea solidified when Joey realized that the best form of self-expression wasn't just
              about what you wear, but what you stand for.{"\n\n"}
              This brand is the manifestation of that vision: a promise that if we ever have enough,
              we will give back to help those facing similar challenges. From a single idea sketched
              on an old, paint-splattered t-shirt that was destined for the bin, BeaTrackFam has
              grown into an inclusive family built on mutual respect and community.{"\n\n"}
              Our Pledge: If we succeed, it is our duty to lift others. BeaTrackFam is built on
              loyalty, and that loyalty extends beyond our customers and into our community.{"\n\n"}
              What is BeaTrackFam? The Ethos of Loyalty{"\n\n"}
              The name BeaTrackFam is the core of our philosophy:{"\n\n"}
              Beat: Represents the heartbeat of your unique journey, a rhythm that guides your path
              and speaks to your authenticity.{"\n\n"}
              Track: Our clothing serves as the signature look that keeps you on your unique
              journey—a straight track built on honesty, not a crooked scheme.{"\n\n"}
              Fam: The essential element of community and belonging, built on mutual support. When
              you wear BeaTrackFam, you're investing in a brand with a conscience.{"\n\n"}
              Every item we design carries a 'beat' that is meant to become a part of your 'family,'
              a family built on trust, honesty and love.{"\n\n"}
              Our Designs: Built on Vibe and Integrity{"\n\n"}
              Our apparel is crafted for the creators and originals who value authenticity above all
              else. Our custom designs are heavily inspired by visualizing inner resilience and
              mental toughness, featuring bold, geometric lines and colors that represent the
              strength needed to overcome struggle. We fuse this with the iconic, bold simplicity of
              late 90s/early 2000s streetwear and graphics, fusing that nostalgic loyalty with a
              crisp, modern aesthetic.{"\n\n"}
              Honest Craftsmanship: We prioritize quality materials, such as premium, heavy-weight
              cotton blends and durable fleece designed to handle years of wear and wash, because
              every dollar you spend is earned with effort, and we respect that investment.{"\n\n"}
              Unique Custom Graphics: We specialize in hand-drawn, gritty illustrations and layered,
              high-definition screen prints that feel authentic and non-commercial that tell a
              visual story rooted in real life.{"\n\n"}
              The Signature Piece: Look for our iconic, unique, woven interior neck label stamped
              with the message "Loyalty Above All"—the visual marker of the Fam.{"\n\n"}
              Join the Fam: Wear Your Loyalty{"\n\n"}
              BeaTrackFam is a welcoming collective where integrity is celebrated. When you choose
              our apparel, you are choosing:{"\n\n"}
              Trust: A brand transparently built on ethics, not exploitation.{"\n\n"}
              Connection: A community ("the Fam") that supports one another.{"\n\n"}
              Purpose: Gear that empowers you to walk your own path, knowing your purchase fuels a
              brand committed to giving back.{"\n\n"}
              Express Your True Rhythm. Become Part of the Family, The BeaTrackFam.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-xs text-muted-foreground">© 2025 BeaTrackFam</Text>
          <Text className="text-xs text-muted-foreground">Loyalty Above All</Text>
        </View>
      </ScrollView>
    </View>
  );
}
