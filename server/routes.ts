import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isModerator } from "./replitAuth";
import { insertAmenitySchema, insertReviewSchema, updateReviewSchema, moderateReviewSchema, SF_BOUNDS, sfLocations } from "@shared/schema";
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
  
  // Get amenities from Overpass API
  app.get("/api/amenities/bathrooms", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="toilets"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="toilets"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const bathrooms = await fetchFromOverpass(query, 'bathroom');
      res.json(bathrooms);
    } catch (error) {
      console.error("Error fetching bathrooms:", error);
      res.status(500).json({ message: "Failed to fetch bathrooms" });
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

  // SF specific fitness facilities endpoints
  app.get("/api/amenities/fitness-stations", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_station"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="fitness_station"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="exercise_equipment"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="exercise_equipment"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["fitness_station"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["fitness_station"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["exercise"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["exercise"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const fitnessStations = await fetchFromOverpass(query, 'fitness_station');
      res.json(fitnessStations);
    } catch (error) {
      console.error("Error fetching fitness stations:", error);
      res.status(500).json({ message: "Failed to fetch fitness stations" });
    }
  });

  app.get("/api/amenities/outdoor-gyms", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="fitness_centre"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["sport"="fitness"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["sport"="fitness"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["leisure"="fitness_centre"]["outdoor"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="fitness_centre"]["outdoor"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["sport"="fitness"]["outdoor"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["sport"="fitness"]["outdoor"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="exercise_equipment"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="exercise_equipment"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["fitness_station"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["fitness_station"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["exercise"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["exercise"="yes"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="fitness_centre"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="fitness_centre"]["location"="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="outdoor_fitness"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="outdoor_fitness"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const outdoorGyms = await fetchFromOverpass(query, 'outdoor_gym');
      res.json(outdoorGyms);
    } catch (error) {
      console.error("Error fetching outdoor gyms:", error);
      res.status(500).json({ message: "Failed to fetch outdoor gyms" });
    }
  });

  app.get("/api/amenities/swimming-pools", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="swimming_pool"]["access"~"^(public|yes)$"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="swimming_pool"]["access"~"^(public|yes)$"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="swimming_pool"]["access"~"^(public|yes)$"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="swimming_pool"]["access"~"^(public|yes)$"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const swimmingPools = await fetchFromOverpass(query, 'swimming_pool');
      res.json(swimmingPools);
    } catch (error) {
      console.error("Error fetching swimming pools:", error);
      res.status(500).json({ message: "Failed to fetch swimming pools" });
    }
  });

  // Prayer room endpoints for WannaPray
  app.get("/api/amenities/mosques", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="place_of_worship"]["religion"="muslim"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["building"="mosque"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["building"="mosque"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const mosques = await fetchFromOverpass(query, 'mosque');
      res.json(mosques);
    } catch (error) {
      console.error("Error fetching mosques:", error);
      res.status(500).json({ message: "Failed to fetch mosques" });
    }
  });

  app.get("/api/amenities/churches", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="christian"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="place_of_worship"]["religion"="christian"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["building"="church"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["building"="church"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const churches = await fetchFromOverpass(query, 'church');
      res.json(churches);
    } catch (error) {
      console.error("Error fetching churches:", error);
      res.status(500).json({ message: "Failed to fetch churches" });
    }
  });

  app.get("/api/amenities/prayer-rooms", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="place_of_worship"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="prayer_room"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="prayer_room"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const prayerRooms = await fetchFromOverpass(query, 'prayer_room');
      res.json(prayerRooms);
    } catch (error) {
      console.error("Error fetching prayer rooms:", error);
      res.status(500).json({ message: "Failed to fetch prayer rooms" });
    }
  });

  app.get("/api/amenities/gyms", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"]["location"!="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="fitness_centre"]["location"!="outdoor"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["leisure"="fitness_centre"][!"location"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="fitness_centre"][!"location"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const gyms = await fetchFromOverpass(query, 'gym');
      res.json(gyms);
    } catch (error) {
      console.error("Error fetching gyms:", error);
      res.status(500).json({ message: "Failed to fetch gyms" });
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

  // Fitness facilities endpoints
  app.get("/api/amenities/fitness-stations/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;

      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_station"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="fitness_station"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="fitness_station"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="exercise_equipment"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="exercise_equipment"](${swLat},${swLng},${neLat},${neLng});
          node["fitness_station"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["fitness_station"="yes"](${swLat},${swLng},${neLat},${neLng});
          node["exercise"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["exercise"="yes"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      

      const fitnessStations = await fetchFromOverpass(query, 'fitness_station');
      res.json(fitnessStations);
    } catch (error) {
      console.error("Error fetching fitness stations for bounds:", error);
      res.status(500).json({ message: "Failed to fetch fitness stations" });
    }
  });

  app.get("/api/amenities/outdoor-gyms/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="fitness_centre"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="fitness_centre"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          node["sport"="fitness"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          way["sport"="fitness"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          relation["sport"="fitness"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          node["leisure"="fitness_centre"]["outdoor"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="fitness_centre"]["outdoor"="yes"](${swLat},${swLng},${neLat},${neLng});
          node["sport"="fitness"]["outdoor"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["sport"="fitness"]["outdoor"="yes"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="exercise_equipment"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="exercise_equipment"](${swLat},${swLng},${neLat},${neLng});
          node["fitness_station"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["fitness_station"="yes"](${swLat},${swLng},${neLat},${neLng});
          node["exercise"="yes"](${swLat},${swLng},${neLat},${neLng});
          way["exercise"="yes"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="fitness_centre"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="fitness_centre"]["location"="outdoor"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="outdoor_fitness"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="outdoor_fitness"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const outdoorGyms = await fetchFromOverpass(query, 'outdoor_gym');
      res.json(outdoorGyms);
    } catch (error) {
      console.error("Error fetching outdoor gyms for bounds:", error);
      res.status(500).json({ message: "Failed to fetch outdoor gyms" });
    }
  });

  app.get("/api/amenities/swimming-pools/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="swimming_pool"]["access"~"^(public|yes)$"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="swimming_pool"]["access"~"^(public|yes)$"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="swimming_pool"]["access"~"^(public|yes)$"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="swimming_pool"]["access"~"^(public|yes)$"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="swimming_pool"]["access"~"^(public|yes)$"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const swimmingPools = await fetchFromOverpass(query, 'swimming_pool');
      res.json(swimmingPools);
    } catch (error) {
      console.error("Error fetching swimming pools for bounds:", error);
      res.status(500).json({ message: "Failed to fetch swimming pools" });
    }
  });

  app.get("/api/amenities/gyms/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"]["location"!="outdoor"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="fitness_centre"]["location"!="outdoor"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="fitness_centre"]["location"!="outdoor"](${swLat},${swLng},${neLat},${neLng});
          node["leisure"="fitness_centre"][!"location"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="fitness_centre"][!"location"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="fitness_centre"][!"location"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const gyms = await fetchFromOverpass(query, 'gym');
      res.json(gyms);
    } catch (error) {
      console.error("Error fetching gyms for bounds:", error);
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });

  // Playground API endpoints for WannaPlay
  app.get("/api/amenities/playgrounds", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="playground"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="playground"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          relation["leisure"="playground"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const playgrounds = await fetchFromOverpass(query, 'playground');
      res.json(playgrounds);
    } catch (error) {
      console.error("Error fetching playgrounds:", error);
      res.status(500).json({ message: "Failed to fetch playgrounds" });
    }
  });

  app.get("/api/amenities/playgrounds/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="playground"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="playground"](${swLat},${swLng},${neLat},${neLng});
          relation["leisure"="playground"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const playgrounds = await fetchFromOverpass(query, 'playground');
      res.json(playgrounds);
    } catch (error) {
      console.error("Error fetching playgrounds for bounds:", error);
      res.status(500).json({ message: "Failed to fetch playgrounds" });
    }
  });

  // Prayer room bounds endpoints for WannaPray
  app.get("/api/amenities/mosques/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="place_of_worship"]["religion"="muslim"](${swLat},${swLng},${neLat},${neLng});
          node["building"="mosque"](${swLat},${swLng},${neLat},${neLng});
          way["building"="mosque"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const mosques = await fetchFromOverpass(query, 'mosque');
      res.json(mosques);
    } catch (error) {
      console.error("Error fetching mosques for bounds:", error);
      res.status(500).json({ message: "Failed to fetch mosques" });
    }
  });

  app.get("/api/amenities/churches/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="christian"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="place_of_worship"]["religion"="christian"](${swLat},${swLng},${neLat},${neLng});
          node["building"="church"](${swLat},${swLng},${neLat},${neLng});
          way["building"="church"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const churches = await fetchFromOverpass(query, 'church');
      res.json(churches);
    } catch (error) {
      console.error("Error fetching churches for bounds:", error);
      res.status(500).json({ message: "Failed to fetch churches" });
    }
  });

  app.get("/api/amenities/prayer-rooms/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="place_of_worship"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="prayer_room"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="prayer_room"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const prayerRooms = await fetchFromOverpass(query, 'prayer_room');
      res.json(prayerRooms);
    } catch (error) {
      console.error("Error fetching prayer rooms for bounds:", error);
      res.status(500).json({ message: "Failed to fetch prayer rooms" });
    }
  });

  // Skate park endpoints for WannaRoll
  app.get("/api/amenities/skate-parks", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="playground"]["playground"~"skatepark|skateboard"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="playground"]["playground"~"skatepark|skateboard"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["sport"="skateboard"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["sport"="skateboard"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="skate_park"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="skate_park"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const skateParks = await fetchFromOverpass(query, 'skate_park');
      res.json(skateParks);
    } catch (error) {
      console.error("Error fetching skate parks:", error);
      res.status(500).json({ message: "Failed to fetch skate parks" });
    }
  });

  app.get("/api/amenities/bmx-tracks", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["sport"="bmx"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["sport"="bmx"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["leisure"="track"]["sport"="bmx"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["leisure"="track"]["sport"="bmx"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const bmxTracks = await fetchFromOverpass(query, 'bmx_track');
      res.json(bmxTracks);
    } catch (error) {
      console.error("Error fetching BMX tracks:", error);
      res.status(500).json({ message: "Failed to fetch BMX tracks" });
    }
  });

  app.get("/api/amenities/skate-parks/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="playground"]["playground"~"skatepark|skateboard"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="playground"]["playground"~"skatepark|skateboard"](${swLat},${swLng},${neLat},${neLng});
          node["sport"="skateboard"](${swLat},${swLng},${neLat},${neLng});
          way["sport"="skateboard"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="skate_park"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="skate_park"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const skateParks = await fetchFromOverpass(query, 'skate_park');
      res.json(skateParks);
    } catch (error) {
      console.error("Error fetching skate parks for bounds:", error);
      res.status(500).json({ message: "Failed to fetch skate parks" });
    }
  });

  app.get("/api/amenities/bmx-tracks/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing boundary parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["sport"="bmx"](${swLat},${swLng},${neLat},${neLng});
          way["sport"="bmx"](${swLat},${swLng},${neLat},${neLng});
          node["leisure"="track"]["sport"="bmx"](${swLat},${swLng},${neLat},${neLng});
          way["leisure"="track"]["sport"="bmx"](${swLat},${swLng},${neLat},${neLng});
        );
        out geom;
      `;
      
      const bmxTracks = await fetchFromOverpass(query, 'bmx_track');
      res.json(bmxTracks);
    } catch (error) {
      console.error("Error fetching BMX tracks for bounds:", error);
      res.status(500).json({ message: "Failed to fetch BMX tracks" });
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

  // Waxing salon endpoints for WannaWax
  app.get("/api/amenities/waxing-salons", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["shop"="beauty"]["beauty"~"waxing"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["shop"="beauty"]["beauty"~"waxing"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="waxing_salon"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="waxing_salon"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["shop"="beauty"]["service"~"waxing"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["shop"="beauty"]["service"~"waxing"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const waxingSalons = await fetchFromOverpass(query, 'waxing_salon');
      res.json(waxingSalons);
    } catch (error) {
      console.error("Error fetching waxing salons:", error);
      res.status(500).json({ message: "Failed to fetch waxing salons" });
    }
  });

  app.get("/api/amenities/waxing-salons/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["shop"="beauty"]["beauty"~"waxing"](${swLat},${swLng},${neLat},${neLng});
          way["shop"="beauty"]["beauty"~"waxing"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="waxing_salon"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="waxing_salon"](${swLat},${swLng},${neLat},${neLng});
          node["shop"="beauty"]["service"~"waxing"](${swLat},${swLng},${neLat},${neLng});
          way["shop"="beauty"]["service"~"waxing"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const waxingSalons = await fetchFromOverpass(query, 'waxing_salon');
      res.json(waxingSalons);
    } catch (error) {
      console.error("Error fetching waxing salons for bounds:", error);
      res.status(500).json({ message: "Failed to fetch waxing salons" });
    }
  });

  // Nail salon endpoints for WannaManiPedi
  app.get("/api/amenities/nail-salons", async (req, res) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["shop"="beauty"]["beauty"~"nails"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["shop"="beauty"]["beauty"~"nails"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["amenity"="nail_salon"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["amenity"="nail_salon"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["shop"="beauty"]["service"~"manicure"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["shop"="beauty"]["service"~"manicure"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          node["shop"="beauty"]["service"~"pedicure"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
          way["shop"="beauty"]["service"~"pedicure"](${SF_BOUNDS.southwest[0]},${SF_BOUNDS.southwest[1]},${SF_BOUNDS.northeast[0]},${SF_BOUNDS.northeast[1]});
        );
        out center;
      `;
      
      const nailSalons = await fetchFromOverpass(query, 'nail_salon');
      res.json(nailSalons);
    } catch (error) {
      console.error("Error fetching nail salons:", error);
      res.status(500).json({ message: "Failed to fetch nail salons" });
    }
  });

  app.get("/api/amenities/nail-salons/bounds", async (req, res) => {
    try {
      const { swLat, swLng, neLat, neLng } = req.query;
      
      if (!swLat || !swLng || !neLat || !neLng) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const query = `
        [out:json][timeout:25];
        (
          node["shop"="beauty"]["beauty"~"nails"](${swLat},${swLng},${neLat},${neLng});
          way["shop"="beauty"]["beauty"~"nails"](${swLat},${swLng},${neLat},${neLng});
          node["amenity"="nail_salon"](${swLat},${swLng},${neLat},${neLng});
          way["amenity"="nail_salon"](${swLat},${swLng},${neLat},${neLng});
          node["shop"="beauty"]["service"~"manicure"](${swLat},${swLng},${neLat},${neLng});
          way["shop"="beauty"]["service"~"manicure"](${swLat},${swLng},${neLat},${neLng});
          node["shop"="beauty"]["service"~"pedicure"](${swLat},${swLng},${neLat},${neLng});
          way["shop"="beauty"]["service"~"pedicure"](${swLat},${swLng},${neLat},${neLng});
        );
        out center;
      `;
      
      const nailSalons = await fetchFromOverpass(query, 'nail_salon');
      res.json(nailSalons);
    } catch (error) {
      console.error("Error fetching nail salons for bounds:", error);
      res.status(500).json({ message: "Failed to fetch nail salons" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchFromOverpass(query: string, type: 'bathroom' | 'dog_park' | 'shower' | 'fitness_station' | 'outdoor_gym' | 'swimming_pool' | 'gym' | 'playground' | 'mosque' | 'church' | 'prayer_room' | 'waxing_salon' | 'nail_salon'): Promise<any[]> {
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
      

      
      const mapped = data.elements.map((element: any) => {
        const tags = element.tags || {};
        
        let lat, lon;

        
        if (element.lat && element.lon) {
          lat = element.lat;
          lon = element.lon;

        } else if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;

        } else if (element.geometry && element.geometry.length > 0) {
          // For ways and relations with geometry, use the first coordinate point
          lat = element.geometry[0].lat;
          lon = element.geometry[0].lon;

        } else if (element.bounds) {
          // For elements with bounds, calculate center
          lat = (element.bounds.minlat + element.bounds.maxlat) / 2;
          lon = (element.bounds.minlon + element.bounds.maxlon) / 2;

        }

        if (!lat || !lon) {

          return null;
        }


        // Type-specific name defaults
        let defaultName = 'Public Amenity';
        if (type === 'bathroom') defaultName = 'Public Bathroom';
        if (type === 'mosque') defaultName = 'Mosque';
        if (type === 'church') defaultName = 'Church';
        if (type === 'prayer_room') defaultName = 'Prayer Room';
        if (type === 'playground') defaultName = 'Playground';
        else if (type === 'dog_park') defaultName = 'Dog Park';
        else if (type === 'shower') defaultName = 'Public Shower';
        else if (type === 'fitness_station') defaultName = 'Fitness Equipment';
        else if (type === 'outdoor_gym') defaultName = 'Outdoor Gym';
        else if (type === 'swimming_pool') defaultName = 'Swimming Pool';
        else if (type === 'gym') defaultName = 'Gym';
        else if (type === 'playground') defaultName = 'Playground';

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
          barrier: tags.barrier || null,
          offLeash: tags.dog === 'unleashed' || tags.dog === 'off-leash' ? true : null,
          drinkingWater: tags.drinking_water === 'yes' ? true : tags.drinking_water === 'no' ? false : null,
          dogWasteBins: tags.waste_basket === 'dog_yes' || tags.dog_waste_bin === 'yes' || tags.waste_basket === 'yes' ? true : tags.waste_basket === 'no' ? false : null,
          changingTable: tags.changing_table === 'yes' ? true : tags.changing_table === 'no' ? false : null,
          bidet: tags.bidet === 'yes' ? true : tags.bidet === 'no' ? false : null,
          toiletPaper: tags.toilet_paper === 'yes' || tags.toiletries === 'yes' ? true : tags.toilet_paper === 'no' ? false : null,
          handDryer: tags.hand_dryer === 'yes' || tags.dryer === 'yes' ? true : tags.hand_dryer === 'no' ? false : null,
          sanitaryDisposal: tags.sanitary_disposal === 'yes' || tags.bin === 'yes' ? true : tags.sanitary_disposal === 'no' ? false : null,
          selfCleaning: tags.self_cleaning === 'yes' ? true : tags.self_cleaning === 'no' ? false : null,
          // Shower-specific fields
          hotWater: tags.hot_water === 'yes' ? true : tags.hot_water === 'no' ? false : null,
          accessType: tags.access || null,
          gender: tags.male === 'yes' ? 'male' : tags.female === 'yes' ? 'female' : tags.unisex === 'yes' ? 'unisex' : null,
          building: tags.building === 'yes' ? true : tags.building === 'no' ? false : null,
          covered: tags.covered === 'yes' ? true : tags.covered === 'no' ? false : null,
          supervised: tags.supervised === 'yes' ? true : tags.supervised === 'no' ? false : null,
          operator: tags.operator || null,
          // Fitness facility specific fields
          equipmentType: tags.fitness_station || tags.exercise || tags.sport || null,
          material: tags.material || null,
          lighting: tags.lit === 'yes' ? true : tags.lit === 'no' ? false : null,
          surface: tags.surface || null,
          difficulty: tags.difficulty || null,
          multipleStations: tags.multiple === 'yes' || tags.count ? true : null,
          parkingNearby: tags.parking === 'yes' ? true : tags.parking === 'no' ? false : null,
          drinkingWaterFitness: tags.drinking_water === 'yes' ? true : tags.drinking_water === 'no' ? false : null,
          restrooms: tags.toilets === 'yes' ? true : tags.toilets === 'no' ? false : null,
          manufacturer: tags.manufacturer || null,
          // Playground-specific fields
          ageGroup: tags.min_age || tags.max_age || tags.age_group || null,
          equipment: tags.playground || tags.equipment || null,
          surfacing: tags.surface || null,
          fenced: tags.barrier === 'fence' || tags.fenced === 'yes' ? true : tags.fenced === 'no' ? false : null,
          shaded: tags.shade === 'yes' || tags.natural === 'tree' ? true : tags.shade === 'no' ? false : null,
          waterPlay: tags.water_play === 'yes' || tags.water === 'yes' ? true : tags.water_play === 'no' ? false : null,
          babyChange: tags.changing_table === 'yes' || tags.baby_changing === 'yes' ? true : tags.changing_table === 'no' ? false : null,
          tags: tags
        };
      }).filter(Boolean);
      

      return mapped;
      
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      continue;
    }
  }
  
  throw new Error('All Overpass API endpoints failed');
}