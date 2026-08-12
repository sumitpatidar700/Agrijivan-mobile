import React from "react";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";

export function Logo({ width = 100, height = 100 }: { width?: number; height?: number }) {
  // Dynamically resolve mylogo.svg from assets folder at runtime
  const asset = Asset.fromModule(require("../../../assets/mylogo.svg"));
  const uri = asset.localUri || asset.uri;

  return <SvgUri uri={uri} width={width} height={height} />;
}
