import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Armchair, Baby, Activity, Dog, Dumbbell, Church } from "lucide-react";

// Custom Icons
function ToiletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.5"/>
      <path d="M7 8h2v3l1 2v5h-2v-3l-1-7z"/>
      <rect x="10" y="13" width="8" height="2" rx="1"/>
      <rect x="9" y="18" width="10" height="3" rx="1"/>
      <path d="M12 15h4v2h-4z"/>
    </svg>
  );
}

function SlideIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="5" r="2"/>
      <path d="M7 8h2l1 3v5h-2v-3l-1-5z"/>
      <path d="M12 12l8-4v2l-6 3v5h8v2H12V12z"/>
    </svg>
  );
}

function SkateboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="4" r="2"/>
      <path d="M5 7h2l2 4v2l-2-1-2-5z"/>
      <rect x="3" y="18" width="18" height="2" rx="1"/>
      <circle cx="6" cy="19" r="1.5"/>
      <circle cx="18" cy="19" r="1.5"/>
      <path d="M12 14l3-2v2l-3 2z"/>
    </svg>
  );
}

function DogWalkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="4" r="2"/>
      <path d="M5 7h2v4l1 2v5h-2v-3l-1-8z"/>
      <path d="M8 11h4l1 1v2l-1-1h-4z"/>
      <ellipse cx="17" cy="15" rx="3" ry="2"/>
      <circle cx="16" cy="14" r="0.5"/>
      <path d="M14 16h2v2h-2z"/>
      <path d="M19 16h2v2h-2z"/>
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="8" width="3" height="8" rx="1"/>
      <rect x="19" y="8" width="3" height="8" rx="1"/>
      <rect x="5" y="11" width="14" height="2" rx="1"/>
      <rect x="4" y="7" width="2" height="10" rx="0.5"/>
      <rect x="18" y="7" width="2" height="10" rx="0.5"/>
    </svg>
  );
}

function MultiReligionIcon({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">✝️</div>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">☪️</div>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">🕎</div>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">☸️</div>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">🕉️</div>
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm">☯️</div>
    </div>
  );
}

interface AppInfo {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  features: string[];
  targetAudience: string;
}

const apps: AppInfo[] = [
  {
    id: "wannawee",
    name: "WannaWee",
    description: "Public restrooms with accessibility features",
    icon: <ToiletIcon className="w-9 h-9" />,
    color: "bg-blue-500",
    features: ["Public Restrooms", "Baby Changing", "Wheelchair Access", "Bidet"],
    targetAudience: "Urban travelers"
  },
  {
    id: "wannaplay",
    name: "WannaPlay",
    description: "Playgrounds designed for children under 12",
    icon: <SlideIcon className="w-9 h-9" />,
    color: "bg-pink-500",
    features: ["Playgrounds", "Toddler Areas", "Water Play", "Safe Equipment"],
    targetAudience: "Parents with young children"
  },
  {
    id: "wannaroll", 
    name: "WannaRoll",
    description: "Skate parks, BMX tracks, and roller venues",
    icon: <SkateboardIcon className="w-9 h-9" />,
    color: "bg-orange-500",
    features: ["Skate Parks", "BMX Tracks", "Vert Ramps", "Street Plazas"],
    targetAudience: "Skaters and BMX riders"
  },
  {
    id: "wannawalkthedog",
    name: "WannaWalktheDog",
    description: "Dog-friendly parks and walking areas",
    icon: <DogWalkIcon className="w-9 h-9" />,
    color: "bg-amber-500",
    features: ["Dog Parks", "Off-leash Areas", "Waste Bins", "Water Access"],
    targetAudience: "Dog owners"
  },
  {
    id: "wannaworkout",
    name: "WannaWorkOut",
    description: "Outdoor fitness equipment and shower facilities",
    icon: <DumbbellIcon className="w-9 h-9" />,
    color: "bg-green-500", 
    features: ["Outdoor Gyms", "Fitness Equipment", "Exercise Stations", "Showers"],
    targetAudience: "Fitness enthusiasts"
  },
  {
    id: "wannapray",
    name: "WannaPray", 
    description: "Prayer rooms and places of worship including Sikh temples",
    icon: <MultiReligionIcon className="w-9 h-9" />,
    color: "bg-purple-500",
    features: ["Prayer Rooms", "Mosques", "Churches", "Sikh Temples", "Multi-faith Spaces"],
    targetAudience: "People seeking prayer facilities"
  },
  {
    id: "wannawax",
    name: "WannaWax",
    description: "Professional waxing and hair removal services",
    icon: <Armchair className="w-9 h-9" />,
    color: "bg-teal-500",
    features: ["Waxing Salons", "Hair Removal", "Beauty Services", "Professional Care"],
    targetAudience: "Beauty and grooming enthusiasts"
  },
  {
    id: "wannamanipedi",
    name: "WannaManiPedi",
    description: "Manicure and pedicure services worldwide",
    icon: <Baby className="w-9 h-9" />,
    color: "bg-rose-500",
    features: ["Nail Salons", "Manicures", "Pedicures", "Nail Art", "Hand Care"],
    targetAudience: "Nail care enthusiasts"
  }
];

interface AppSelectorProps {
  onAppSelect: (appId: string) => void;
}

export default function AppSelector({ onAppSelect }: AppSelectorProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleAppClick = (appId: string) => {
    setSelectedApp(appId);
    setTimeout(() => {
      onAppSelect(appId);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with auth */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Wanna Suite</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Hello, {user?.firstName || user?.email || 'User'}
                </span>
                {user?.role === 'admin' && (
                  <Button asChild variant="outline" size="sm">
                    <a href="/admin">Admin</a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <a href="/api/logout">Logout</a>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <a href="/api/login">Login</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Main Title */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Wanna Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find private places in public spaces anywhere you are.
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Live. Pray. Play.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <span className="text-gray-500">Available worldwide with real-time data</span>
          </div>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {apps.map((app) => (
            <Card 
              key={app.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                selectedApp === app.id ? 'ring-4 ring-blue-500 scale-105' : ''
              }`}
              onClick={() => handleAppClick(app.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className={`${app.color} text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                  {app.icon}
                </div>
                <CardTitle className="text-2xl">{app.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {app.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {app.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button 
                  className={`w-full ${app.color} hover:opacity-90`}
                  disabled={selectedApp === app.id}
                >
                  {selectedApp === app.id ? 'Loading...' : 'Explore Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose Wanna Suite?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
              <p className="text-gray-600">
                Access real-time data from OpenStreetMap covering every corner of the world
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multilingual</h3>
              <p className="text-gray-600">
                Automatic language detection and support for 13+ languages worldwide
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Optimized</h3>
              <p className="text-gray-600">
                Designed for on-the-go use with geolocation and offline-friendly features
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by OpenStreetMap • Built with ❤️ for global travelers</p>
        </div>
      </div>
    </div>
  );
}