import React, { createContext, useCallback, useContext, useState } from "react";
import { Animated, Dimensions } from "react-native";

type FlyItem = {
  id: number;
  image?: string;
  translate: Animated.ValueXY;
  opacity: Animated.Value;
  scale: Animated.Value;
};

type CartFlyContextType = {
  flyItems: FlyItem[];
  flyToCart: (x: number, y: number, image?: string) => void;
};

const CartFlyContext = createContext<CartFlyContextType>({
  flyItems: [],
  flyToCart: () => {},
});

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Approximate on-screen position of the cart icon in the header - close enough
// across every screen's header since they all place it near the top-right.
const TARGET_X = SCREEN_WIDTH - 36;
const TARGET_Y = 56;

let nextFlyId = 0;

export function CartFlyProvider({ children }: { children: React.ReactNode }) {
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);

  const flyToCart = useCallback((x: number, y: number, image?: string) => {
    const id = nextFlyId++;
    const translate = new Animated.ValueXY({ x, y });
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(1);

    setFlyItems((items) => [...items, { id, image, translate, opacity, scale }]);

    Animated.parallel([
      Animated.timing(translate, {
        toValue: { x: TARGET_X, y: TARGET_Y },
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.3,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        delay: 320,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFlyItems((items) => items.filter((item) => item.id !== id));
    });
  }, []);

  return (
    <CartFlyContext.Provider value={{ flyItems, flyToCart }}>
      {children}
    </CartFlyContext.Provider>
  );
}

export function useCartFly() {
  return useContext(CartFlyContext);
}
