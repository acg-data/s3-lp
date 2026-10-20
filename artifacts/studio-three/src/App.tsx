import LandingPage from "@/pages/LandingPage";
import ThankYouPage from "@/pages/ThankYouPage";
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trackPageView } from "@/lib/meta-pixel";
import "./index.css";

export default function App() {
  const [path] = useLocation();
  const previousPath = useRef(path);
  const thankYou = /^\/thank-you\/?$/.test(path);
  useLayoutEffect(() => {
    document.title = thankYou
      ? "Thank You — Studio Three Brickell"
      : "Studio Three Brickell — Founding Memberships";
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        "href",
        `https://studiothreefounders.com/${thankYou ? "thank-you/" : ""}`,
      );
    if (thankYou) {
      const robots =
        document.querySelector('meta[name="robots"]') ||
        document.head.appendChild(document.createElement("meta"));
      robots.setAttribute("name", "robots");
      robots.setAttribute("content", "noindex, nofollow");
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else {
      document.querySelector('meta[name="robots"]')?.remove();
    }
    if (previousPath.current !== path) {
      trackPageView();
      previousPath.current = path;
    }
  }, [path, thankYou]);
  return thankYou ? <ThankYouPage /> : <LandingPage />;
}
