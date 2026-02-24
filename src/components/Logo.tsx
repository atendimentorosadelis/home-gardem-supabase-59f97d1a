import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import logoDark from "@/assets/logo-home-garden.png";
import logoLight from "@/assets/logo-home-garden-light.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && theme === "dark" ? logoDark : logoLight;
  const isHomePage = location.pathname === "/";

  const handleClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link to="/" className={`flex items-center group ${className}`} onClick={handleClick}>
      <img src={logoSrc} alt="Home Garden" width={200} height={80} className="h-20 w-auto" />
    </Link>
  );
}
