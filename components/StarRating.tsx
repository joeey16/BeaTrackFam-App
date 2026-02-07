import * as React from "react";
import { View } from "react-native";
import LucideIcon from "~/lib/icons/LucideIcon";
import { Text } from "~/components/ui/text";
import { useTheme } from "~/theming/ThemeProvider";

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = 16,
  showNumber = true,
  reviewCount = 0,
}: StarRatingProps) {
  const { theme } = useTheme();
  const stars = [];
  const actualRating = rating || 0;

  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= Math.floor(actualRating);
    const isHalf = i === Math.ceil(actualRating) && actualRating % 1 !== 0;

    stars.push(
      <LucideIcon
        key={i}
        name="Star"
        size={size}
        color={isFilled || isHalf ? "#FFD700" : theme.colors.border}
        fill={isFilled || isHalf ? "#FFD700" : "none"}
      />,
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      {stars}
      {showNumber && (
        <Text className="ml-1 text-sm font-medium text-foreground">{actualRating.toFixed(1)}</Text>
      )}
      {reviewCount > 0 && (
        <Text className="ml-1 text-sm text-muted-foreground">({reviewCount})</Text>
      )}
    </View>
  );
}
