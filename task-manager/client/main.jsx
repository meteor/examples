import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Meteor } from "meteor/meteor";
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../imports/ui/App";
import "./main.css";

const queryClient = new QueryClient();

Meteor.startup(() => {
  const root = createRoot(document.getElementById("app"));
  root.render(
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-muted-foreground">
            Loading...
          </div>
        }
      >
        <App />
      </Suspense>
    </QueryClientProvider>
  );
});
