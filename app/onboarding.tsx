import * as React from "react";
import { View, ScrollView, Dimensions, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { useTheme } from "~/theming/ThemeProvider";
import LucideIcon from "~/lib/icons/LucideIcon";
import { router } from "expo-router";

interface OnboardingSlide {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: "ShoppingBag",
    title: "Welcome to the Fam",
    description:
      "Discover unique BeaTrackFam merchandise and streetwear. Premium quality, authentic designs, and limited drops made with loyalty and integrity.",
    color: "#000000",
  },
  {
    icon: "Palette",
    title: "Custom Designs",
    description:
      "Request custom merch tailored to your vision. Work directly with our design team to create something truly unique that represents your style.",
    color: "#000000",
  },
  {
    icon: "Heart",
    title: "Built on Loyalty",
    description:
      "More than just clothing - we're a community. Every purchase supports our mission to give back and lift others. Loyalty Above All.",
    color: "#000000",
  },
];

function Slide({
  slide,
  width,
  height,
}: {
  slide: OnboardingSlide;
  width: number;
  height: number;
}) {
  const { theme } = useTheme();

  // Responsive sizing based on screen dimensions
  const isSmallScreen = width < 375 || height < 667;
  const iconContainerSize = isSmallScreen
    ? Math.min(width * 0.4, 140)
    : Math.min(width * 0.45, 192);
  const iconSize = iconContainerSize * 0.5;
  const horizontalPadding = Math.max(width * 0.08, 24);

  return (
    <View
      style={{ width, paddingHorizontal: horizontalPadding }}
      className="flex-1 items-center justify-center"
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: iconContainerSize,
          height: iconContainerSize,
          backgroundColor: `${slide.color}15`,
          marginBottom: isSmallScreen ? 32 : 48,
        }}
      >
        <LucideIcon
          name={slide.icon as any}
          size={iconSize}
          color={slide.color}
          strokeWidth={1.5}
        />
      </View>

      <Text
        className="mb-4 text-center font-bold text-foreground"
        style={{ fontSize: isSmallScreen ? 24 : 32 }}
      >
        {slide.title}
      </Text>
      <Text
        className="text-center text-muted-foreground"
        style={{
          fontSize: isSmallScreen ? 14 : 16,
          lineHeight: isSmallScreen ? 20 : 24,
        }}
      >
        {slide.description}
      </Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Responsive sizing
  const isSmallScreen = width < 375 || height < 667;
  const horizontalPadding = Math.max(width * 0.08, 24);
  const bottomPadding = isSmallScreen ? 24 : 48;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace("/onboarding-notifications");
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {slides.map((slide, index) => (
          <Slide key={index} slide={slide} width={width} height={height} />
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={{ paddingHorizontal: horizontalPadding, paddingBottom: bottomPadding }}>
        {/* Pagination Dots */}
        <View
          className="mb-3 flex-row items-center justify-center"
          style={{ marginBottom: isSmallScreen ? 12 : 16 }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              className="mx-1 rounded-full"
              style={{
                width: currentIndex === index ? (isSmallScreen ? 20 : 24) : 8,
                height: 8,
                backgroundColor: currentIndex === index ? theme.colors.primary : theme.colors.muted,
              }}
            />
          ))}
        </View>

        {/* Skip Button */}
        {currentIndex < slides.length - 1 && (
          <View className="mb-4 items-center" style={{ marginBottom: isSmallScreen ? 12 : 16 }}>
            <Pressable onPress={handleSkip} className="rounded-lg px-6 py-2">
              <Text
                className="font-semibold text-primary"
                style={{ fontSize: isSmallScreen ? 14 : 16 }}
              >
                Skip
              </Text>
            </Pressable>
          </View>
        )}

        {/* Next/Get Started Button */}
        <Button onPress={handleNext} size={isSmallScreen ? "default" : "lg"} className="w-full">
          <Text className="font-semibold" style={{ fontSize: isSmallScreen ? 14 : 16 }}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Button>

        {/* Branding */}
        <View className="mt-4 items-center" style={{ marginTop: isSmallScreen ? 16 : 24 }}>
          <Text className="text-muted-foreground" style={{ fontSize: isSmallScreen ? 12 : 14 }}>
            BeaTrackFam
          </Text>
          <Text className="text-muted-foreground" style={{ fontSize: isSmallScreen ? 10 : 12 }}>
            Loyalty Above All
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
