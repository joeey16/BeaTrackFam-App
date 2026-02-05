import React from "react";
import * as icons from "lucide-react-native/icons";
import type { LucideProps } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";

type IconName = keyof typeof icons;
type IconProps = LucideProps & { name: IconName; className?: string };

const Icon: React.FC<IconProps> = memo(({ name, className, ...rest }) => {
  const CustomIcon = useMemo(() => {
    const IconComponent = icons[name];

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in lucide-react-native`);
      return null;
    }

    // Safely set displayName if possible
    if (IconComponent && typeof IconComponent === "function") {
      IconComponent.displayName = name;
    }

    return cssInterop(IconComponent, {
      className: {
        target: "style",
        nativeStyleToProp: {
          color: true,
          opacity: true,
          width: true,
          height: true,
        },
      },
    });
  }, [name]);

  if (!CustomIcon) return null;

  return <CustomIcon className={className} {...rest} />;
});

Icon.displayName = "LucideIcon";

export default Icon;
