import {
  amenities,
  reviews,
  users,
  adminActions,
  messageQueue,
  type Amenity,
  type InsertAmenity,
  type Review,
  type InsertReview,
  type UpdateReview,
  type ModerateReview,
  type User,
  type UpsertUser,
  type AdminAction,
  type MessageQueue,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, count, sql, avg } from "drizzle-orm";

export interface IStorage {
  // Amenity operations
  getAmenities(type?: string): Promise<Amenity[]>;
  getAmenity(id: number): Promise<Amenity | undefined>;
  createAmenity(amenity: InsertAmenity): Promise<Amenity>;
  updateAmenity(id: number, amenity: Partial<InsertAmenity>): Promise<Amenity | undefined>;
  deleteAmenity(id: number): Promise<boolean>;
  getAmenitiesByBounds(
    swLat: number, 
    swLng: number, 
    neLat: number, 
    neLng: number, 
    type?: string
  ): Promise<Amenity[]>;
  
  // User operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByAmenity(amenityId: number, status?: string): Promise<Review[]>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  updateReview(id: number, userId: string, review: UpdateReview): Promise<Review | undefined>;
  deleteReview(id: number, userId: string): Promise<boolean>;
  getAverageRating(amenityId: number): Promise<number | null>;
  
  // Moderation operations
  moderateReview(id: number, moderatorId: string, data: ModerateReview): Promise<Review | undefined>;
  getPendingReviews(): Promise<Review[]>;
  getFlaggedReviews(): Promise<Review[]>;
  flagReview(reviewId: number, userId: string): Promise<boolean>;
  markReviewHelpful(reviewId: number, userId: string): Promise<boolean>;
  
  // Admin operations
  logAdminAction(adminId: string, action: string, targetType: string, targetId: number, reason?: string): Promise<AdminAction>;
  getAdminActions(limit?: number): Promise<AdminAction[]>;
  
  // Message queue operations
  queueMessage(reviewId: number, contactInfo: string, contactType: string, messageContent: string): Promise<MessageQueue>;
  getPendingMessages(): Promise<MessageQueue[]>;
  markMessageSent(id: number): Promise<boolean>;
  markMessageFailed(id: number, errorMessage: string): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getAmenities(type?: string): Promise<Amenity[]> {
    const query = db.select().from(amenities);
    if (type) {
      return await query.where(eq(amenities.type, type));
    }
    return await query;
  }

  async getAmenity(id: number): Promise<Amenity | undefined> {
    const [amenity] = await db.select().from(amenities).where(eq(amenities.id, id));
    return amenity;
  }

  async createAmenity(insertAmenity: InsertAmenity): Promise<Amenity> {
    const [amenity] = await db.insert(amenities).values(insertAmenity).returning();
    return amenity;
  }

  async updateAmenity(id: number, updateData: Partial<InsertAmenity>): Promise<Amenity | undefined> {
    const [amenity] = await db
      .update(amenities)
      .set(updateData)
      .where(eq(amenities.id, id))
      .returning();
    return amenity;
  }

  async deleteAmenity(id: number): Promise<boolean> {
    const result = await db.delete(amenities).where(eq(amenities.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAmenitiesByBounds(
    swLat: number,
    swLng: number, 
    neLat: number,
    neLng: number,
    type?: string
  ): Promise<Amenity[]> {
    let query = db.select().from(amenities).where(
      and(
        gte(amenities.latitude, swLat),
        lte(amenities.latitude, neLat),
        gte(amenities.longitude, swLng),
        lte(amenities.longitude, neLng)
      )
    );
    
    if (type) {
      query = db.select().from(amenities).where(
        and(
          gte(amenities.latitude, swLat),
          lte(amenities.latitude, neLat),
          gte(amenities.longitude, swLng),
          lte(amenities.longitude, neLng),
          eq(amenities.type, type)
        )
      );
    }
    
    return await query;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getAverageRating(amenityId: number): Promise<number | null> {
    const result = await db
      .select({ avgRating: avg(reviews.cleanlinessRating) })
      .from(reviews)
      .where(and(eq(reviews.amenityId, amenityId), eq(reviews.status, "approved")));
    
    return result[0]?.avgRating ? Number(result[0].avgRating) : null;
  }

  // User operations (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Enhanced review operations
  async getReviewsByAmenity(amenityId: number, status?: string): Promise<Review[]> {
    if (status) {
      return await db.select().from(reviews)
        .where(and(eq(reviews.amenityId, amenityId), eq(reviews.status, status)))
        .orderBy(desc(reviews.createdAt));
    }
    return await db.select().from(reviews)
      .where(eq(reviews.amenityId, amenityId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt));
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async updateReview(id: number, userId: string, reviewData: UpdateReview): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ ...reviewData, updatedAt: new Date() })
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .returning();
    return review;
  }

  async deleteReview(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Moderation operations
  async moderateReview(id: number, moderatorId: string, data: ModerateReview): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({
        status: data.status,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationNote: data.moderationNote,
        isVerified: data.isVerified || false,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async getPendingReviews(): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.status, "pending")).orderBy(desc(reviews.createdAt));
  }

  async getFlaggedReviews(): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.status, "flagged")).orderBy(desc(reviews.createdAt));
  }

  async flagReview(reviewId: number, userId: string): Promise<boolean> {
    const [review] = await db
      .update(reviews)
      .set({ 
        flagCount: sql`${reviews.flagCount} + 1`,
        status: sql`CASE WHEN ${reviews.flagCount} >= 2 THEN 'flagged' ELSE ${reviews.status} END`,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return !!review;
  }

  async markReviewHelpful(reviewId: number, userId: string): Promise<boolean> {
    const [review] = await db
      .update(reviews)
      .set({ 
        helpfulCount: sql`${reviews.helpfulCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return !!review;
  }

  // Admin operations
  async logAdminAction(adminId: string, action: string, targetType: string, targetId: number, reason?: string): Promise<AdminAction> {
    const [adminAction] = await db
      .insert(adminActions)
      .values({
        adminId,
        action,
        targetType,
        targetId,
        reason,
      })
      .returning();
    return adminAction;
  }

  async getAdminActions(limit: number = 50): Promise<AdminAction[]> {
    return await db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(limit);
  }

  // Message queue operations
  async queueMessage(reviewId: number, contactInfo: string, contactType: string, messageContent: string): Promise<MessageQueue> {
    const [message] = await db
      .insert(messageQueue)
      .values({
        reviewId,
        contactInfo,
        contactType,
        messageContent,
      })
      .returning();
    return message;
  }

  async getPendingMessages(): Promise<MessageQueue[]> {
    return await db.select().from(messageQueue).where(eq(messageQueue.status, "pending")).orderBy(desc(messageQueue.createdAt));
  }

  async markMessageSent(id: number): Promise<boolean> {
    const [message] = await db
      .update(messageQueue)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(messageQueue.id, id))
      .returning();
    return !!message;
  }

  async markMessageFailed(id: number, errorMessage: string): Promise<boolean> {
    const [message] = await db
      .update(messageQueue)
      .set({ status: "failed", errorMessage })
      .where(eq(messageQueue.id, id))
      .returning();
    return !!message;
  }
}

export const storage = new DatabaseStorage();