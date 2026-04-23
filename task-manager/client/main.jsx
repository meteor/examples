import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Meteor } from "meteor/meteor";
import { createRoot } from "react-dom/client";
import { App } from "/imports/ui/App";
import "./main.css";

const queryClient = new QueryClient();

Meteor.startup(() => {
  const root = createRoot(document.getElementById("app"));
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
});
