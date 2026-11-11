import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { radius, useTheme } from "@/theme";
import { RouteSvg, type RouteViewProps } from "./route-svg";

const hasAndroidKey = Boolean(Constants.expoConfig?.extra?.hasAndroidMapsKey);
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// Google Maps on Android renders blank without an API key, so fall back to the SVG route.
const canUseMap = process.env.EXPO_OS === "ios" || hasAndroidKey || inExpoGo;

export function RouteMap({ points, height, accessibilityLabel, follow }: RouteViewProps & { follow?: boolean }) {
  const theme = useTheme();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => points.map(([latitude, longitude]) => ({ latitude, longitude })), [points]);
  const last = coords[coords.length - 1];

  useEffect(() => {
    if (!map.current || coords.length === 0) return;
    if (follow && last) {
      map.current.animateCamera({ center: last }, { duration: 400 });
    } else if (coords.length > 1) {
      map.current.fitToCoordinates(coords, { edgePadding: { top: 32, right: 32, bottom: 32, left: 32 }, animated: false });
    }
  }, [coords, follow, last]);

  if (!canUseMap) return <RouteSvg points={points} height={height} accessibilityLabel={accessibilityLabel} />;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ height, borderRadius: radius.section, borderCurve: "continuous", overflow: "hidden", backgroundColor: theme.surfaceAlt }}
    >
      <MapView
        ref={map}
        style={{ flex: 1 }}
        userInterfaceStyle={theme.scheme}
        showsUserLocation={follow}
        pitchEnabled={false}
        toolbarEnabled={false}
        initialRegion={last ? { ...last, latitudeDelta: 0.01, longitudeDelta: 0.01 } : undefined}
      >
        {coords.length > 1 ? <Polyline coordinates={coords} strokeColor={theme.accent} strokeWidth={5} /> : null}
        {coords.length > 0 && !follow ? <Marker coordinate={coords[0]} pinColor={theme.primary} /> : null}
      </MapView>
    </View>
  );
}
