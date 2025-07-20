# Wanna Suite - Global Location Discovery Platform

## Overview

A comprehensive suite of six specialized global mapping applications:

1. **WannaWee** - Public bathrooms with accessibility features and bidets
2. **WannaPlay** - Playgrounds designed for children under 12
3. **WannaRoll** - Skate parks, BMX tracks, and roller sports venues
4. **WannaWalktheDog** - Dog-friendly parks and walking areas
5. **WannaWorkOut** - Public fitness equipment, outdoor gyms, and shower facilities
6. **WannaPray** - Prayer rooms and places of worship (Islamic, Christian, Sikh, Multi-faith)

Each application provides real-time global data from OpenStreetMap via the Overpass API, presented through intuitive map interfaces built with Leaflet. Users can search worldwide, filter specialized amenities, and get directions to selected facilities.

## Application Suite Architecture

The platform consists of five independent applications sharing a common architectural foundation:

- **Shared Architecture**: Common components, utilities, and design patterns across all apps
- **Independent Deployment**: Each app can be deployed separately with unique ports and configurations
- **Specialized Data Models**: App-specific amenity types, filters, and feature tagging systems
- **Global Search**: Worldwide location search using Nominatim geocoding service
- **Multilingual Support**: Comprehensive language support with automatic detection and manual override

### Application Deployment
- **Unified Deployment**: All applications accessible through single interface at port 5000
- **App Selector**: Central hub for accessing all six specialized mapping services
- **Seamless Navigation**: Switch between services without separate deployments

### Specialized Features by Application

#### WannaPray (Prayer Rooms)
- Islamic, Christian, Multi-faith filtering
- Denomination support, prayer times, ablution facilities
- Qibla direction, prayer mats, quiet space indicators
- Shoes removal and accessibility features

#### WannaWorkOut (Fitness Equipment)  
- Equipment categorization, surface materials, accessibility
- Lighting, covered areas, multiple stations
- Water access, restrooms, parking, difficulty levels

#### WannaPlay (Playgrounds)
- Age-specific filtering (toddler, children under 12)
- Equipment types (swings, slides, climbing, sandbox)
- Surface materials (rubber, grass, sand), fencing, shade
- Water play, accessibility, restrooms, parking

#### WannaRoll (Skate Parks)
- Park types (street, vert, bowl, mixed)
- Features (rails, ramps, bowls, halfpipe)
- Difficulty levels (beginner, intermediate, advanced)
- Surface materials, lighting, covered areas, fees

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: React Query for server state and React hooks for local state
- **Map Library**: Leaflet for interactive mapping capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful endpoints with JSON responses
- **Data Sources**: OpenStreetMap via Overpass API
- **Middleware**: Express middleware for request logging and error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema**: Single amenities table storing bathroom and dog park data
- **Fallback Storage**: In-memory storage implementation for development
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

## Key Components

### Map Component (`client/src/components/Map.tsx`)
- Leaflet-based interactive map centered on San Francisco
- Custom marker clustering and styling for different amenity types
- Real-time data fetching with automatic refresh capabilities
- Geolocation support for user positioning

### Filter Controls (`client/src/components/FilterControls.tsx`)
- Toggle controls for bathroom and dog park visibility
- "Locate Me" functionality with geolocation API integration
- Error handling for location permission issues

### Search Bar (`client/src/components/SearchBar.tsx`)
- Autocomplete search for San Francisco neighborhoods and landmarks
- Real-time search suggestions with debouncing
- Location selection with map centering

### Info Panel (`client/src/components/InfoPanel.tsx`)
- Detailed amenity information display
- Distance calculation from user location
- Directions integration with external mapping services

## Data Flow

1. **Initial Load**: App fetches bathroom and dog park data from Overpass API via backend endpoints
2. **User Interaction**: Filter changes trigger map marker updates without refetching data
3. **Search**: Location search queries predefined SF locations with fuzzy matching
4. **Geolocation**: User location requests use browser geolocation API with fallback handling
5. **Marker Selection**: Clicking markers displays detailed information with calculated distances

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection (Neon serverless)
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **leaflet**: Interactive mapping library
- **@radix-ui/\***: Accessible UI component primitives
- **wouter**: Lightweight React router

### Development Dependencies
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production build bundling for server code

### External APIs
- **Overpass API**: OpenStreetMap data querying (overpass-api.de with kumi.systems fallback)
- **Browser Geolocation API**: User location detection
- **External Mapping Services**: Directions and navigation

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes

### Environment Configuration
- **Development**: Local Vite dev server with Express backend
- **Production**: Served static files with Express in production mode
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Hosting Considerations
- Static assets served from Express in production
- Database migrations applied via `npm run db:push`
- Environment variables required: DATABASE_URL

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Added baby changing table feature
  * New changingTable field in amenity schema
  * Purple markers for bathrooms with baby changing tables
  * Additional filter control for baby changing facilities
  * Enhanced info panels showing changing table availability
- July 05, 2025. Added wheelchair accessibility feature
  * Blue markers for wheelchair accessible bathrooms
  * Additional filter control for accessible facilities
  * Smart marker prioritization to avoid duplicate markers
  * Enhanced filtering logic for specialized bathroom amenities
- July 05, 2025. Added user-generated content system
  * PostgreSQL database integration with Drizzle ORM
  * Photo upload capability with 5MB limit and image validation
  * Cleanliness rating system (1-5 stars)
  * Facility verification (toilet paper, mirrors, sanitary bins)
  * User review display with color-coded feature indicators
  * Review form modal with comprehensive facility checks
  * Database-backed user reviews and ratings storage
- July 05, 2025. Enhanced facility features and review system
  * Added "Self Cleaning" feature to bathroom amenities with teal badge
  * Updated review section with specific checkboxes: toilet paper, mirrors, hot water & soap, sanitary disposal
  * Restructured review form with organized grid layout and clear section headers
  * Enhanced database schema with selfCleaning field for amenities
  * Updated all components to support new review fields and facility features
- July 05, 2025. Simplified review interface and fixed database issues
  * Removed detailed header text from review section for cleaner interface
  * Eliminated "Unknown" option from facility checkboxes (now only Yes/No)
  * Fixed database integer overflow error by updating amenity_id to bigint
  * Streamlined review form with simpler checkbox layout
- July 05, 2025. Added hand dryer category to review system
  * Added fifth facility category "Hand Dryer" with three options: electric, paper, none
  * Enhanced database schema with handDryerType field for reviews
  * Updated review form with dedicated hand dryer selection buttons
  * Integrated color-coded display in review results (blue=electric, yellow=paper, red=none)
- July 05, 2025. Mobile optimization and messaging integration
  * Removed nickname requirement - all reviews now automatically use "Anonymous"
  * Optimized review form for mobile devices with compact spacing and single-column layout
  * Added optional contact information collection for thank you messages
  * Integrated support for WhatsApp, Telegram, and SMS messaging platforms
  * Enhanced database schema with contactInfo and contactType fields
  * Moved photo upload to top of form for better mobile UX
- July 05, 2025. Added early submit functionality
  * Added "I'm done. Submit" button between cleanliness rating and facility details
  * Users can now submit reviews with just photo and rating for quicker contributions
  * Simplified messaging text for thank you collection section
- July 05, 2025. Comprehensive authentication and moderation system
  * Implemented Replit Auth with full user session management
  * Added user roles (user, moderator, admin) with PostgreSQL storage
  * Created admin dashboard with pending/flagged review management
  * Added review ownership - users can edit/delete their own reviews
  * Implemented review status workflow (pending -> approved/rejected/flagged)
  * Added content moderation tools with admin action logging
  * Created message queue system for automated thank you messages
  * Enhanced security with role-based route protection
  * Added user flagging and helpful voting system
  * Integrated navigation header with login/logout functionality
- July 05, 2025. Branding and dog waste bin feature
  * Updated app name from "SF Dog Owner's Map" to "Wanna Wee"
  * Added dog waste bin detection for dog parks from OpenStreetMap data
  * Enhanced InfoPanel with waste bin badges and detailed information
  * Updated database schema with dogWasteBins field for amenities
  * Integrated waste basket tags from OSM (waste_basket, dog_waste_bin)
  * Restructured app branding for global expansion with city-specific naming (e.g., "Wanna Wee - SF")
- July 08, 2025. Global search functionality implementation
  * Implemented worldwide city search using Nominatim (OpenStreetMap geocoding)
  * Added dynamic data fetching for any global location with bounds-based queries
  * Removed SF geographic bounds restrictions for truly global map access
  * Enhanced SearchBar with proper z-index for dropdown visibility
  * Verified functionality across major cities: London, Tokyo, Singapore, Seoul, Ulaanbaatar, Mumbai
  * Simplified app name from "Wanna Wee - SF" to just "Wanna Wee" for global branding
- July 08, 2025. Mobile optimization and multilingual support
  * Optimized mobile layout with responsive header and full-width search bar
  * Added comprehensive language support: English, Spanish, French, Russian, Indonesian, Malay, Arabic, Chinese, Japanese, Korean, German, Hindi, Mongolian
  * Implemented language toggle button with auto-detection and manual override
  * Added emoji/text toggle for mobile filter buttons
  * Fixed map sizing for proper mobile display
- July 08, 2025. Enhanced language consistency and user control
  * Improved search result language matching - dropdown results now match input language
  * Added visual language toggle button showing detected language with instant switching
  * Enhanced Unicode detection for Arabic, Chinese, Japanese, Korean, and Cyrillic scripts
  * Implemented user override capability - can manually choose between detected language and interface language
  * Search results now consistently use detected language when available, ensuring coherent multilingual experience
- July 08, 2025. Automatic location detection and mobile-first UX
  * Implemented automatic geolocation on app startup to center map on user's current location
  * Added loading screen with spinner while detecting location, with multilingual support
  * Graceful fallback to San Francisco if geolocation permission denied or unavailable  
  * Enhanced mobile experience - app immediately shows nearby facilities upon opening
  * Location detection works globally - users see their local area first, then can search worldwide
  * Fixed map centering conflicts - removed redundant setView calls that prevented proper positioning
  * System correctly detects non-SF locations and fetches global data automatically
  * Works with VPNs and privacy browsers (requires location permission approval)
  * Successfully tested with user in Malaysia using VPN - detects Singapore coordinates and displays local facilities
  * Mobile-first experience verified: app opens directly to user's area with nearby bathrooms, dog parks, and facilities
  * Resolved browser compatibility issues - Edge browser displays correctly, Brave has tile caching limitations
- July 08, 2025. Browser cache fixes and automatic language switching
  * Added cache-busting parameters to map tiles to prevent stale browser caching
  * Implemented global event system for automatic language switching based on search location
  * Enhanced console logging for debugging geolocation and language detection
  * Modified map initialization to start at neutral coordinates (0,0) instead of hardcoded SF coordinates
  * Added direct component synchronization for language toggle updates
  * Fixed persistent browser caching issues that prevented map positioning updates in Edge and Brave
  * Requires fresh deployment to clear cached assets and enable proper map centering
- July 17, 2025. Integrated popup consolidation and comprehensive feature tagging
  * Consolidated review functionality into main popup with tabbed interface (Details, Reviews, Add Review)
  * Removed second popup completely - all functionality now in single unified interface
  * Implemented comprehensive feature tagging system for all amenity properties from fee to sanitary disposal
  * Added complete visual tags for bathroom features: Fee, Accessibility, Baby Change, Bidet, Toilet Paper, Hand Dryer, Sanitary Disposal, Self Cleaning
  * Added dog park feature tags: Off-leash, Waste Bins, Water, Fencing, Operator
  * Added shower facility tags: Hot Water, Covered, Indoor, Supervised, Gender-specific, Access Type, Operator
  * Enhanced mobile button sizing with 48px minimum height for better touch experience
  * Improved popup layout with scrollable content and larger width for better mobile usability
- July 17, 2025. Expanded application suite with WannaPlay and WannaRoll
  * Built complete WannaPlay application for finding playgrounds designed for children under 12
  * Created WannaRoll application for discovering skate parks, BMX tracks, and roller sports venues
  * Implemented specialized data models, filters, and feature tagging for each new application
  * Added age-specific playground filtering (toddler areas, equipment types, surface materials)
  * Created skate park categorization (street, vert, bowl, difficulty levels, features)
  * Configured independent deployment with separate ports (5175 for WannaPlay, 5176 for WannaRoll)
  * Maintained consistent architectural patterns across all five applications in the Wanna Suite
  * Each application includes geolocation, global search, multilingual support, and mobile optimization
- July 17, 2025. Unified application interface implementation
  * Created single unified app with beautiful app selector interface displaying all five mapping services
  * Users can now access WannaWee, WannaPray, WannaWorkOut, WannaPlay, and WannaRoll from one central hub
  * Implemented seamless switching between different location discovery services
  * Maintained individual authentication, admin access, and specialized filtering for each service
  * Enhanced user experience with cohesive branding and intuitive navigation between services
  * Single deployment at port 5000 provides access to all global location discovery tools
- July 17, 2025. Updated messaging and service organization
  * Changed main tagline to "Find private places in public spaces anywhere you are. Live. Pray. Play."
  * Removed "Dog Parks" category from WannaWee and created new "WannaWalktheDog" service
  * Added "Sikh Temples" to WannaPray service for comprehensive religious facility coverage
  * Added "Showers" category to WannaWorkOut for complete fitness facility support
  * Added "Bidet" feature to WannaWee for enhanced bathroom amenity coverage
  * Reordered product suite: WannaWee, WannaPlay, WannaRoll, WannaWalktheDog, WannaWorkOut, WannaPray
  * Updated service icons: toilet symbol for WannaWee, slide for WannaPlay, activity for WannaRoll, dog for WannaWalktheDog, dumbbell for WannaWorkOut, horizontal circular multi-religious symbols for WannaPray
  * Streamlined service descriptions by removing "Key features" sections and "Perfect for..." statements
  * Simplified app messaging to focus on local, personal spaces rather than generic discovery language
- July 17, 2025. Enhanced language toggle and amenity button localization
  * Removed confusing "ES" language indicator from search box for cleaner interface
  * Fixed language toggle to properly switch between detected language and English only
  * Added comprehensive translations for all WannaWee amenity buttons: Bidé, Papel Higiénico, Secador, Contenedor
  * Language toggle now shows clear ES ⇄ EN switching indicators
  * All amenity buttons update text correctly when toggling between Spanish and English
  * Enhanced component re-rendering to ensure UI updates immediately on language changes
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```