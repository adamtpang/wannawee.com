import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isModerator } from "./replitAuth";
import { insertAmenitySchema, insertReviewSchema, updateReviewSchema, moderateReviewSchema, globalLocations } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const BACKUP_OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const pendingReviews = await storage.getPendingReviews();
      const flaggedReviews = await storage.getFlaggedReviews();
      // Add basic stats - we'll enhance these later
      res.json({
        pendingReviews: pendingReviews.length,
        flaggedReviews: flaggedReviews.length,
        totalReviews: 0, // TODO: implement total count
        totalUsers: 0, // TODO: implement user count
        pendingMessages: 0, // TODO: implement message count
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/reviews/pending', isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getPendingReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ message: "Failed to fetch pending reviews" });
    }
  });

  app.get('/api/admin/reviews/flagged', isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getFlaggedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching flagged reviews:", error);
      res.status(500).json({ message: "Failed to fetch flagged reviews" });
    }
  });

  app.post('/api/admin/reviews/moderate', isAdmin, async (req: any, res) => {
    try {
      const data = moderateReviewSchema.parse(req.body);
      const moderatorId = req.user.claims.sub;
      const reviewId = req.body.reviewId;
      
      const review = await storage.moderateReview(reviewId, moderatorId, data);
      await storage.logAdminAction(moderatorId, `moderate_review_${data.status}`, 'review', reviewId, data.moderationNote);
      
      res.json(review);
    } catch (error) {
      console.error("Error moderating review:", error);
      res.status(500).json({ message: "Failed to moderate review" });
    }
  });

  // Enhanced review routes with authentication
  app.get("/api/reviews/:amenityId", async (req, res) => {
    try {
      const amenityId = parseInt(req.params.amenityId);
      const reviews = await storage.getReviewsByAmenity(amenityId, "approved");
      const averageRating = await storage.getAverageRating(amenityId);
      
      res.json({
        reviews,
        averageRating,
        totalReviews: reviews.length,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // User's own reviews
  app.get("/api/my-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Update user's own review
  app.put("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const data = updateReviewSchema.parse(req.body);
      
      const review = await storage.updateReview(reviewId, userId, data);
      if (!review) {
        return res.status(404).json({ message: "Review not found or unauthorized" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Delete user's own review
  app.delete("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const success = await storage.deleteReview(reviewId, userId);
      if (!success) {
        return res.status(404).json({ message: "Review not found or unauthorized" });
      }
      
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Flag a review
  app.post("/api/reviews/:id/flag", async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || 'anonymous';
      
      const success = await storage.flagReview(reviewId, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error flagging review:", error);
      res.status(500).json({ message: "Failed to flag review" });
    }
  });

  // Mark review as helpful
  app.post("/api/reviews/:id/helpful", async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || 'anonymous';
      
      const success = await storage.markReviewHelpful(reviewId, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error marking review helpful:", error);
      res.status(500).json({ message: "Failed to mark review helpful" });
    }
  });
  
  // Get workout equipment from Overpass API
  app.get("/api/amenities/workout-equipment", async (req, res) => {
    try {
      const { bounds } = req.query;
      let query;
      
      if (bounds) {
        const boundsArray = (bounds as string).split(',').map(Number);
        const [south, west, north, east] = boundsArray;
        
        query = `
          [out:json][timeout:25];
          (
            nwr["leisure"="fitness_station"](${south},${west},${north},${east});
            nwr["leisure"="outdoor_gym"](${south},${west},${north},${east});
            nwr["sport"="fitness"](${south},${west},${north},${east});
            nwr["amenity"="gym"]["outdoor"="yes"](${south},${west},${north},${east});
            nwr["fitness_station"="yes"](${south},${west},${north},${east});
            nwr["exercise"="yes"](${south},${west},${north},${east});
            nwr["outdoor_gym"="yes"](${south},${west},${north},${east});
            nwr["fitness"="outdoor"](${south},${west},${north},${east});
          );
          out geom;
        `;
      } else {
        query = `
          [out:json][timeout:25];
          (
            nwr["leisure"="fitness_station"];
            nwr["leisure"="outdoor_gym"];
            nwr["sport"="fitness"];
            nwr["amenity"="gym"]["outdoor"="yes"];
            nwr["fitness_station"="yes"];
            nwr["exercise"="yes"];
            nwr["outdoor_gym"="yes"];
            nwr["fitness"="outdoor"];
          );
          out geom;
        `;
      }
      
      const workoutEquipment = await fetchFromOverpass(query, 'fitness_station');
      res.json(workoutEquipment);
    } catch (error) {
      console.error("Error fetching workout equipment:", error);
      res.status(500).json({ message: "Failed to fetch workout equipment" });
    }
  });

  app.get("/api/amenities/dog-parks", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          way["leisure"="dog_park"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          relation["leisure"="dog_park"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          area["leisure"="dog_park"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const dogParks = await fetchFromOverpass(query, 'dog_park');
      res.json(dogParks);
    } catch (error) {
      console.error("Error fetching dog parks:", error);
      res.status(500).json({ message: "Failed to fetch dog parks" });
    }
  });

  app.get("/api/amenities/showers", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="shower"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="shower"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          relation["amenity"="shower"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out geom;
      `;
      
      const showers = await fetchFromOverpass(query, 'shower');
      res.json(showers);
    } catch (error) {
      console.error("Error fetching showers:", error);
      res.status(500).json({ message: "Failed to fetch showers" });
    }
  });

  // Dynamic amenity endpoints with custom bounds
  app.get("/api/amenities/bathrooms/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="toilets"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="toilets"](${swLat},${swLng},${neLat},${neLng});
          relation["amenity"="toilets"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const bathrooms = await fetchFromOverpass(query, 'bathroom');
      res.json(bathrooms);
    } catch (error) {
      console.error("Error fetching bathrooms for bounds:", error);
      res.status(500).json({ message: "Failed to fetch bathrooms" });
    }
  });

  app.get("/api/amenities/dog-parks/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          way["leisure"="dog_park"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="dog_park"](${swLat},${swLng},${neLat},${neLng});
          area["leisure"="dog_park"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const dogParks = await fetchFromOverpass(query, 'dog_park');
      res.json(dogParks);
    } catch (error) {
      console.error("Error fetching dog parks for bounds:", error);
      res.status(500).json({ message: "Failed to fetch dog parks" });
    }
  });

  app.get("/api/amenities/showers/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="shower"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="shower"](${swLat},${swLng},${neLat},${neLng});
          relation["amenity"="shower"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const showers = await fetchFromOverpass(query, 'shower');
      res.json(showers);
    } catch (error) {
      console.error("Error fetching showers for bounds:", error);
      res.status(500).json({ message: "Failed to fetch showers" });
    }
  });

  // Search locations endpoint - Global search using Nominatim
  app.get("/api/search/locations", async (req, res) => {
    const query = req.query.q as string;
    const language = req.query.lang as string || 'en';
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    try {
      // Map our language codes to Nominatim accepted language codes
      const langMap: Record<string, string> = {
        'en': 'en',
        'es': 'es', 
        'fr': 'fr',
        'ru': 'ru',
        'id': 'id',
        'ms': 'ms',
        'ar': 'ar',
        'zh': 'zh',
        'ja': 'ja',
        'ko': 'ko',
        'de': 'de',
        'hi': 'hi',
        'mn': 'mn'
      };
      
      const nominatimLang = langMap[language] || 'en';
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=${nominatimLang}`;
      
      // Use Nominatim (OpenStreetMap's geocoding service) for global search
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Wanna-Wee-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Search request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform Nominatim results to our format
      const results = data.map((result: any) => ({
        name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }));
      
      res.json(results);
    } catch (error) {
      console.error('Search failed:', error);
      res.json([]); // Return empty array on error
    }
  });

  // Configure multer for photo uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Ensure upload directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const storage_config = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Review API Routes
  app.post("/api/reviews", upload.single('photo'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null; // Optional authentication
      
      const reviewData = {
        amenityId: parseInt(req.body.amenityId),
        userId: userId,
        userNickname: req.body.userNickname || "Anonymous",
        cleanlinessRating: parseInt(req.body.cleanlinessRating),
        hasToiletPaper: req.body.hasToiletPaper === 'true' ? true : req.body.hasToiletPaper === 'false' ? false : null,
        hasMirror: req.body.hasMirror === 'true' ? true : req.body.hasMirror === 'false' ? false : null,
        hasHotWaterSoap: req.body.hasHotWaterSoap === 'true' ? true : req.body.hasHotWaterSoap === 'false' ? false : null,
        hasSoap: req.body.hasSoap === 'true' ? true : req.body.hasSoap === 'false' ? false : null,
        hasSanitaryDisposal: req.body.hasSanitaryDisposal === 'true' ? true : req.body.hasSanitaryDisposal === 'false' ? false : null,
        handDryerType: req.body.handDryerType || null,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        comments: req.body.comments || null,
        contactInfo: req.body.contactInfo || null,
        contactType: req.body.contactType === 'none' ? null : req.body.contactType || null,
      };

      const validatedReview = insertReviewSchema.parse(reviewData);
      const review = await storage.createReview(validatedReview);
      
      // Queue thank you message if contact info provided
      if (reviewData.contactInfo && reviewData.contactType && reviewData.contactType !== 'none') {
        const messageContent = `Thank you for your review! Your contribution helps other dog owners find great facilities. Your review is now pending approval.`;
        await storage.queueMessage(review.id, reviewData.contactInfo, reviewData.contactType, messageContent);
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create review"
      });
    }
  });

  app.get("/api/amenities/:id/reviews", async (req, res) => {
    try {
      const amenityId = parseInt(req.params.id);
      if (isNaN(amenityId)) {
        return res.status(400).json({ message: "Invalid amenity ID" });
      }

      const reviews = await storage.getReviewsByAmenity(amenityId);
      const averageRating = await storage.getAverageRating(amenityId);
      
      res.json({
        reviews,
        averageRating: averageRating ? Number(averageRating.toFixed(1)) : null,
        totalReviews: reviews.length
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchFromOverpass(query: string, type: 'fitness_station'): Promise<any[]> {
  const urls = [OVERPASS_API_URL, BACKUP_OVERPASS_URL];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.elements.map((element: any) => {
        const tags = element.tags || {};
        
        let lat, lon;
        if (element.lat && element.lon) {
          lat = element.lat;
          lon = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        }

        if (!lat || !lon) return null;

        // Type-specific name defaults
        let defaultName = 'Fitness Station';
        if (type === 'fitness_station') defaultName = 'Fitness Station';

        return {
          id: element.id,
          osmId: `${element.type}_${element.id}`,
          type,
          name: tags.name || defaultName,
          latitude: lat,
          longitude: lon,
          fee: tags.fee === 'yes' ? true : tags.fee === 'no' ? false : null,
          wheelchair: tags.wheelchair === 'yes' ? true : tags.wheelchair === 'no' ? false : null,
          openingHours: tags.opening_hours || null,
          // Fitness equipment specific fields
          equipmentType: tags.fitness_station || tags.exercise || tags.sport || null,
          material: tags.material || null,
          covered: tags.covered === 'yes' ? true : tags.covered === 'no' ? false : null,
          lighting: tags.lit === 'yes' ? true : tags.lit === 'no' ? false : null,
          surface: tags.surface || null,
          ageGroup: tags.min_age || tags.age_group || null,
          difficulty: tags.difficulty || null,
          multipleStations: tags.multiple === 'yes' || tags.count ? true : null,
          parkingNearby: tags.parking === 'yes' ? true : tags.parking === 'no' ? false : null,
          drinkingWater: tags.drinking_water === 'yes' ? true : tags.drinking_water === 'no' ? false : null,
          restrooms: tags.toilets === 'yes' ? true : tags.toilets === 'no' ? false : null,
          operator: tags.operator || null,
          manufacturer: tags.manufacturer || null,
          tags: tags
        };
      }).filter(Boolean);
      
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      continue;
    }
  }
  
  throw new Error('All Overpass API endpoints failed');
}