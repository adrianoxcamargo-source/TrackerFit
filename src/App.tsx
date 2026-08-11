import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ActiveAthleteProvider } from "@/hooks/use-active-athlete";
import { RestTimerProvider } from "@/hooks/use-rest-timer";
import { routers } from "./router";

const queryClient = new QueryClient();

const App = () => {
  const router = createBrowserRouter(routers);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveAthleteProvider>
          <RestTimerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <RouterProvider router={router} />
            </TooltipProvider>
          </RestTimerProvider>
        </ActiveAthleteProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
