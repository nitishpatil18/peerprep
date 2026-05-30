import { cn } from "./cn.js";

export default function Container({ size = "md", className, children }) {
  const sizes = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
  };
  return (
    <div className={cn("mx-auto w-full px-4 md:px-6", sizes[size], className)}>
      {children}
    </div>
  );
}
