import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSelector from "@/pages/app-selector";
import UnifiedMapPage from "@/pages/unified-map";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleAppSelect = (appId: string) => {
    setSelectedApp(appId);
  };

  const handleBackToSelector = () => {
    setSelectedApp(null);
  };

  return (
    <div className="min-h-screen">
      <main>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/wannawee">
            <UnifiedMapPage appType="wannawee" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannapray">
            <UnifiedMapPage appType="wannapray" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannaworkout">
            <UnifiedMapPage appType="wannaworkout" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannaplay">
            <UnifiedMapPage appType="wannaplay" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannaroll">
            <UnifiedMapPage appType="wannaroll" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannawalkthedog">
            <UnifiedMapPage appType="wannawalkthedog" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannawax">
            <UnifiedMapPage appType="wannawax" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/wannamanipedi">
            <UnifiedMapPage appType="wannamanipedi" onBackToSelector={handleBackToSelector} />
          </Route>
          <Route path="/">
            {selectedApp ? (
              <UnifiedMapPage 
                appType={selectedApp} 
                onBackToSelector={handleBackToSelector}
              />
            ) : (
              <AppSelector onAppSelect={handleAppSelect} />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
