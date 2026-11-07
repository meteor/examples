import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Meteor } from "meteor/meteor";
import { createRoot } from "react-dom/client";
import { App } from "/imports/ui/App";
import "./main.css";

const queryClient = new QueryClient();

Meteor.startup(() => {
  const container = document.getElementById("app");
  if (!container) throw new Error("Missing app container");
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
});
