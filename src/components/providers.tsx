import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { makeQueryClient } from "@/lib/react-query";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { CartFlyProvider } from "@/lib/cart-fly-context";
import { ActiveFarmingProvider } from "@/lib/active-farming-context";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <ActiveFarmingProvider>
            <CartProvider>
              <CartFlyProvider>
                {children}
              </CartFlyProvider>
            </CartProvider>
          </ActiveFarmingProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
