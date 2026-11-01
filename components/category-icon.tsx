import {
  Boxes,
  Camera,
  Cloud,
  Code2,
  CreditCard,
  Gamepad2,
  Gift,
  Globe,
  HardDrive,
  Headphones,
  Home,
  Monitor,
  Music,
  Package,
  Router,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Watch
} from "lucide-react";

const iconMap: Record<string, any> = {
  boxes: Boxes,
  smartphone: Smartphone,
  monitor: Monitor,
  tv: Tv,
  "gamepad-2": Gamepad2,
  "code-2": Code2,
  gift: Gift,
  music: Music,
  cloud: Cloud,
  "shield-check": ShieldCheck,
  "credit-card": CreditCard,
  camera: Camera,
  globe: Globe,
  headphones: Headphones,
  "hard-drive": HardDrive,
  router: Router,
  watch: Watch,
  home: Home,
  sparkles: Sparkles,
  package: Package
};

export const CATEGORY_ICON_OPTIONS = [
  { value: "boxes", label: "General / Other" },
  { value: "smartphone", label: "Phones & tablets" },
  { value: "monitor", label: "Computers & screens" },
  { value: "tv", label: "TV & streaming" },
  { value: "gamepad-2", label: "Gaming" },
  { value: "code-2", label: "Software & tools" },
  { value: "gift", label: "Gift cards" },
  { value: "music", label: "Music & audio" },
  { value: "cloud", label: "Cloud services" },
  { value: "shield-check", label: "Security" },
  { value: "credit-card", label: "Payments" },
  { value: "camera", label: "Photography" },
  { value: "globe", label: "Online services" },
  { value: "headphones", label: "Support & audio" },
  { value: "hard-drive", label: "Storage" },
  { value: "router", label: "Network devices" },
  { value: "watch", label: "Wearables" },
  { value: "home", label: "Home & appliances" },
  { value: "sparkles", label: "AI & premium" },
  { value: "package", label: "Products & bundles" }
] as const;

export function CategoryIcon({ name, size = 22, className }: { name?: string; size?: number; className?: string }) {
  const Icon = iconMap[name || "boxes"] || Boxes;
  return <Icon size={size} className={className} strokeWidth={1.8} aria-hidden="true" />;
}

export function getCategoryIconName(category: { icon?: string; name?: string; slug?: string }) {
  if (category.icon && category.icon !== "boxes") return category.icon;
  const key = `${category.slug || ""} ${category.name || ""}`.toLowerCase();
  if (/apple|iphone|ipad|mobile|phone/.test(key)) return "smartphone";
  if (/netflix|stream|shahid|tv|movie|cinema/.test(key)) return "tv";
  if (/game|playstation|xbox|steam/.test(key)) return "gamepad-2";
  if (/software|office|windows|productivity|tool/.test(key)) return "code-2";
  if (/gift|top.?up|card/.test(key)) return "gift";
  if (/music|audio|spotify/.test(key)) return "music";
  if (/ai|artificial|premium/.test(key)) return "sparkles";
  if (/security|vpn|antivirus/.test(key)) return "shield-check";
  if (/cloud|storage|drive/.test(key)) return "cloud";
  if (/device|computer|laptop|monitor/.test(key)) return "monitor";
  if (/home|appliance|kitchen/.test(key)) return "home";
  return category.icon || "boxes";
}
