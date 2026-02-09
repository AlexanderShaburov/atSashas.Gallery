import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider as InnerThemeProvider } from "@/shared/lib/theme/ThemeContext";
export function ThemeProvider({ children }) {
    return _jsx(InnerThemeProvider, { children: children });
}
