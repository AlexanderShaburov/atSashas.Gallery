import { PropsWithChildren } from "react";
import { ThemeProvider as InnerThemeProvider } from "@/shared/lib/theme/ThemeContext";

export function ThemeProvider({ children }: PropsWithChildren) {
    return <InnerThemeProvider>{children}</InnerThemeProvider>
}