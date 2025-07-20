import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function LocationRefreshButton() {
  const handleRefresh = () => {
    // Force page refresh to clear tile cache and show actual location
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className="gap-2"
      title="Refresh map to show your actual location"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh Map
    </Button>
  );
}