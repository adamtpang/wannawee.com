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

// In-memory storage for development fallback
class InMemoryStorage implements IStorage {
  private amenities: Amenity[] = [];
  private users: User[] = [];
  private reviews: Review[] = [];
  private adminActions: AdminAction[] = [];
  private messageQueue: MessageQueue[] = [];

  async getAmenities(type?: string): Promise<Amenity[]> {
    return type ? this.amenities.filter(a => a.type === type) : this.amenities;
  }

  async getAmenity(id: number): Promise<Amenity | undefined> {
    return this.amenities.find(a => a.id === id);
  }

  async createAmenity(amenity: InsertAmenity): Promise<Amenity> {
    const newAmenity = { ...amenity, id: Date.now(), lastUpdated: new Date() } as Amenity;
    this.amenities.push(newAmenity);
    return newAmenity;
  }

  async updateAmenity(id: number, amenity: Partial<InsertAmenity>): Promise<Amenity | undefined> {
    const index = this.amenities.findIndex(a => a.id === id);
    if (index >= 0) {
      this.amenities[index] = { ...this.amenities[index], ...amenity, lastUpdated: new Date() };
      return this.amenities[index];
    }
    return undefined;
  }

  async deleteAmenity(id: number): Promise<boolean> {
    const index = this.amenities.findIndex(a => a.id === id);
    if (index >= 0) {
      this.amenities.splice(index, 1);
      return true;
    }
    return false;
  }

  async getAmenitiesByBounds(): Promise<Amenity[]> {
    return this.amenities; // In development, return all
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const newUser = { ...user, createdAt: new Date(), updatedAt: new Date() } as User;
    const index = this.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.users[index] = { ...this.users[index], ...user, updatedAt: new Date() };
      return this.users[index];
    } else {
      this.users.push(newUser);
      return newUser;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index >= 0) {
      this.users[index] = { ...this.users[index], role, updatedAt: new Date() };
      return this.users[index];
    }
    return undefined;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview = { 
      ...review, 
      id: Date.now(), 
      status: 'approved', 
      flagCount: 0, 
      helpfulCount: 0, 
      isVerified: false,
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Review;
    this.reviews.push(newReview);
    return newReview;
  }

  async getReviewsByAmenity(amenityId: number, status?: string): Promise<Review[]> {
    return this.reviews.filter(r => r.amenityId === amenityId && (!status || r.status === status));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return this.reviews.filter(r => r.userId === userId);
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.find(r => r.id === id);
  }

  async updateReview(id: number, userId: string, reviewData: UpdateReview): Promise<Review | undefined> {
    const index = this.reviews.findIndex(r => r.id === id && r.userId === userId);
    if (index >= 0) {
      this.reviews[index] = { ...this.reviews[index], ...reviewData, updatedAt: new Date() };
      return this.reviews[index];
    }
    return undefined;
  }

  async deleteReview(id: number, userId: string): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === id && r.userId === userId);
    if (index >= 0) {
      this.reviews.splice(index, 1);
      return true;
    }
    return false;
  }

  async getAverageRating(amenityId: number): Promise<number | null> {
    const amenityReviews = this.reviews.filter(r => r.amenityId === amenityId && r.status === 'approved');
    if (amenityReviews.length === 0) return null;
    const sum = amenityReviews.reduce((acc, r) => acc + r.cleanlinessRating, 0);
    return sum / amenityReviews.length;
  }

  async moderateReview(id: number, moderatorId: string, data: ModerateReview): Promise<Review | undefined> {
    const index = this.reviews.findIndex(r => r.id === id);
    if (index >= 0) {
      this.reviews[index] = { 
        ...this.reviews[index], 
        status: data.status, 
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationNote: data.moderationNote,
        isVerified: data.isVerified || false,
        updatedAt: new Date() 
      };
      return this.reviews[index];
    }
    return undefined;
  }

  async getPendingReviews(): Promise<Review[]> {
    return this.reviews.filter(r => r.status === 'pending');
  }

  async getFlaggedReviews(): Promise<Review[]> {
    return this.reviews.filter(r => r.status === 'flagged');
  }

  async flagReview(reviewId: number, userId: string): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index >= 0) {
      this.reviews[index].flagCount = (this.reviews[index].flagCount || 0) + 1;
      if (this.reviews[index].flagCount && this.reviews[index].flagCount >= 2) {
        this.reviews[index].status = 'flagged';
      }
      return true;
    }
    return false;
  }

  async markReviewHelpful(reviewId: number, userId: string): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index >= 0) {
      this.reviews[index].helpfulCount = (this.reviews[index].helpfulCount || 0) + 1;
      return true;
    }
    return false;
  }

  async logAdminAction(adminId: string, action: string, targetType: string, targetId: number, reason?: string): Promise<AdminAction> {
    const adminAction = {
      id: Date.now(),
      adminId,
      action,
      targetType,
      targetId,
      reason,
      createdAt: new Date()
    } as AdminAction;
    this.adminActions.push(adminAction);
    return adminAction;
  }

  async getAdminActions(limit: number = 50): Promise<AdminAction[]> {
    return this.adminActions.slice(0, limit);
  }

  async queueMessage(reviewId: number, contactInfo: string, contactType: string, messageContent: string): Promise<MessageQueue> {
    const message = {
      id: Date.now(),
      reviewId,
      contactInfo,
      contactType,
      messageContent,
      status: 'pending',
      createdAt: new Date()
    } as MessageQueue;
    this.messageQueue.push(message);
    return message;
  }

  async getPendingMessages(): Promise<MessageQueue[]> {
    return this.messageQueue.filter(m => m.status === 'pending');
  }

  async markMessageSent(id: number): Promise<boolean> {
    const index = this.messageQueue.findIndex(m => m.id === id);
    if (index >= 0) {
      this.messageQueue[index].status = 'sent';
      this.messageQueue[index].sentAt = new Date();
      return true;
    }
    return false;
  }

  async markMessageFailed(id: number, errorMessage: string): Promise<boolean> {
    const index = this.messageQueue.findIndex(m => m.id === id);
    if (index >= 0) {
      this.messageQueue[index].status = 'failed';
      this.messageQueue[index].errorMessage = errorMessage;
      return true;
    }
    return false;
  }
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

// Smart storage selection - use in-memory for development if database fails
async function createStorage(): Promise<IStorage> {
  try {
    // Try database connection
    const dbStorage = new DatabaseStorage();
    // Test connection with a simple query
    await dbStorage.getAmenities();
    console.log("✅ Connected to database successfully");
    return dbStorage;
  } catch (error) {
    console.log("⚠️  Database connection failed, falling back to in-memory storage");
    console.log("   This is normal for development without a database");
    return new InMemoryStorage();
  }
}

// Export a promise that resolves to the appropriate storage
export const storagePromise = createStorage();

// For backward compatibility, export storage that will work in most cases
export const storage = new InMemoryStorage();