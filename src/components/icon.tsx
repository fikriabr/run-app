import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type SymbolName = ComponentProps<typeof SymbolView>["name"];
type SF = Extract<SymbolName, string>;
type MD = NonNullable<Exclude<SymbolName, string>["android"]>;

const ICONS = {
  today: ["sun.max", "today"],
  plan: ["calendar", "calendar_month"],
  run: ["figure.run", "directions_run"],
  you: ["person.crop.circle", "person"],
  check: ["checkmark.circle.fill", "check_circle"],
  missed: ["exclamationmark.circle", "error"],
  skipped: ["minus.circle", "remove_circle"],
  chevron: ["chevron.right", "chevron_right"],
  play: ["play.fill", "play_arrow"],
  pause: ["pause.fill", "pause"],
  stop: ["stop.fill", "stop"],
  skip: ["forward.end.fill", "skip_next"],
  gps: ["location.fill", "my_location"],
  settings: ["gearshape", "settings"],
  share: ["square.and.arrow.up", "ios_share"],
  trash: ["trash", "delete"],
  close: ["xmark", "close"],
  minus: ["minus", "remove"],
  plus: ["plus", "add"],
  up: ["arrow.up.right", "trending_up"],
  down: ["arrow.down.right", "trending_down"],
  rest: ["moon.zzz", "bedtime"],
  route: ["point.topleft.down.to.point.bottomright.curvepath", "route"],
  book: ["book", "menu_book"],
  tick: ["checkmark", "check"],
  more: ["ellipsis", "more_horiz"],
  history: ["clock.arrow.circlepath", "history"],
  strength: ["dumbbell", "fitness_center"],
  video: ["play.rectangle", "smart_display"],
  search: ["magnifyingglass", "search"],
  up2: ["chevron.up", "keyboard_arrow_up"],
  down2: ["chevron.down", "keyboard_arrow_down"],
  timer: ["timer", "timer"],
  edit: ["pencil", "edit"],
  copy: ["doc.on.doc", "content_copy"],
} satisfies Record<string, [SF, MD]>;

export type IconName = keyof typeof ICONS;

/** SF Symbols on iOS, Material Symbols on Android and web (see DESIGN.md, Icons). */
export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: ColorValue }) {
  const [sf, md] = ICONS[name];
  return (
    <SymbolView
      name={{ ios: sf, android: md, web: md }}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
