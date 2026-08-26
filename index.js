import { LogBox } from "react-native";

// The @msg91comm/sendotp-react-native package logs this at import time whenever
// its bundled (and unused) BiometricAuth native module isn't linked - which is
// always true under Expo Go, since it can't load third-party native modules.
// It's benign noise: our OTP send/verify/retry calls never touch that bridge.
LogBox.ignoreLogs(["BiometricAuth is undefined"]);

// Using require() instead of `import "expo-router/entry"` is deliberate: static
// imports are hoisted above the LogBox call above, which would defeat the point
// since expo-router's import chain is what pulls in the msg91 package in the
// first place. A plain require() runs at its actual position in the file.
require("expo-router/entry");
