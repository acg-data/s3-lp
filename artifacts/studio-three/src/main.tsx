import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { campaignAttribution } from "./lib/campaign";

campaignAttribution();

createRoot(document.getElementById("root")!).render(<App />);
