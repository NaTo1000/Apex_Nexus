// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Apex Nexus.
 */
const MAPPING = {
  // Navigation tabs
  "house.fill": "home",
  "music.note.list": "library-music",
  "arrow.up.circle.fill": "cloud-upload",
  "person.2.fill": "group",
  "person.crop.circle.fill": "account-circle",
  // DJ / Mixer
  "dial.knob": "tune",
  "waveform": "graphic-eq",
  "headphones": "headphones",
  "music.note": "music-note",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "skip-next",
  "backward.fill": "skip-previous",
  "shuffle": "shuffle",
  "repeat": "repeat",
  // Mastering
  "slider.horizontal.3": "tune",
  "waveform.path.ecg": "show-chart",
  "bolt.fill": "bolt",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  // Collab
  "message.fill": "chat",
  "person.badge.plus": "person-add",
  "link": "link",
  "star.fill": "star",
  // General
  "gear": "settings",
  "magnifyingglass": "search",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-vert",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "arrow.left": "arrow-back",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "pencil": "edit",
  "photo": "photo",
  "folder": "folder",
  "doc.fill": "description",
  "clock": "access-time",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "record.circle": "fiber-manual-record",
  "circle.fill": "circle",
  "square.grid.2x2": "grid-view",
  "list.bullet": "list",
  "arrow.clockwise": "refresh",
  "xmark": "close",
  "info.circle": "info",
  "lock.fill": "lock",
  "wifi": "wifi",
  "antenna.radiowaves.left.and.right": "cell-tower",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
