// The crash recorder must load before the router so errors during startup are captured too.
import "./src/services/crash-log";
import "expo-router/entry";
