import { useState, useEffect } from "react";
import LandingPage from "@/pages/LandingPage";
import BookingPage from "@/pages/BookingPage";
import SuccessPage from "@/pages/SuccessPage";
import "./index.css";

type Page = "landing" | "booking" | "success";

export default function App() {
  const [page, setPage] = useState<Page>("landing");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  if (page === "booking") {
    return (
      <BookingPage
        onBack={() => setPage("landing")}
        onSuccess={() => setPage("success")}
      />
    );
  }

  if (page === "success") {
    return <SuccessPage onBack={() => setPage("landing")} />;
  }

  return <LandingPage onBook={() => setPage("booking")} />;
}
