import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Toilet, Church, Dumbbell, Baby, Zap } from "lucide-react";

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
    description: "Find public bathrooms and dog parks worldwide",
    icon: <Toilet className="w-8 h-8" />,
    color: "bg-blue-500",
    features: ["Public Restrooms", "Dog Parks", "Baby Changing", "Wheelchair Access"],
    targetAudience: "Dog owners and urban travelers"
  },
  {
    id: "wannapray",
    name: "WannaPray", 
    description: "Discover prayer rooms and places of worship",
    icon: <Church className="w-8 h-8" />,
    color: "bg-purple-500",
    features: ["Prayer Rooms", "Mosques", "Churches", "Multi-faith Spaces"],
    targetAudience: "People seeking prayer facilities"
  },
  {
    id: "wannaworkout",
    name: "WannaWorkOut",
    description: "Find public fitness equipment and outdoor gyms",
    icon: <Dumbbell className="w-8 h-8" />,
    color: "bg-green-500", 
    features: ["Outdoor Gyms", "Fitness Equipment", "Exercise Stations", "Calisthenics"],
    targetAudience: "Fitness enthusiasts"
  },
  {
    id: "wannaplay",
    name: "WannaPlay",
    description: "Locate playgrounds designed for children under 12",
    icon: <Baby className="w-8 h-8" />,
    color: "bg-pink-500",
    features: ["Playgrounds", "Toddler Areas", "Water Play", "Safe Equipment"],
    targetAudience: "Parents with young children"
  },
  {
    id: "wannaroll", 
    name: "WannaRoll",
    description: "Discover skate parks, BMX tracks, and roller venues",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-orange-500",
    features: ["Skate Parks", "BMX Tracks", "Vert Ramps", "Street Plazas"],
    targetAudience: "Skaters and BMX riders"
  }
];

interface HomePageProps {
  onAppSelect: (appId: string) => void;
}

export default function HomePage({ onAppSelect }: HomePageProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleAppClick = (appId: string) => {
    setSelectedApp(appId);
    // Add a small delay for visual feedback
    setTimeout(() => {
      onAppSelect(appId);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Wanna Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your global companion for discovering essential locations worldwide. 
            Choose your adventure and explore with confidence.
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
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {app.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic">
                    Perfect for {app.targetAudience}
                  </p>
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