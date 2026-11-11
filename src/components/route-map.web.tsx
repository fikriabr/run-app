import { RouteSvg, type RouteViewProps } from "./route-svg";

// react-native-maps has no web implementation; the web build shows the SVG route.
export function RouteMap({ points, height, accessibilityLabel }: RouteViewProps & { follow?: boolean }) {
  return <RouteSvg points={points} height={height} accessibilityLabel={accessibilityLabel} />;
}
