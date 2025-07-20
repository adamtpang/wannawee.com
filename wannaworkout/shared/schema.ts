import { pgTable, text, serial, real, boolean, timestamp, integer, varchar, bigint, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  osmId: text("osm_id").notNull().unique(),
  type: text("type").notNull(), // 'fitness_station', 'outdoor_gym', 'calisthenics', 'playground'
  name: text("name"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  fee: boolean("fee"),
  wheelchair: boolean("wheelchair"),
  openingHours: text("opening_hours"),
  // Workout equipment specific fields
  equipmentType: text("equipment_type"), // 'pull_up_bar', 'parallel_bars', 'rings', 'balance_beam', 'lat_pulldown', 'leg_press', 'cardio', 'mixed'
  material: text("material"), // 'metal', 'wood', 'rubber', 'mixed'
  covered: boolean("covered"), // weather protection
  lighting: boolean("lighting"), // has lighting for evening use
  surface: text("surface"), // 'grass', 'rubber', 'concrete', 'wood_chips', 'sand'
  ageGroup: text("age_group"), // 'adults', 'children', 'seniors', 'all_ages'
  difficulty: text("difficulty"), // 'beginner', 'intermediate', 'advanced', 'mixed'
  multipleStations: boolean("multiple_stations"), // multiple exercise stations
  parkingNearby: boolean("parking_nearby"), // parking available nearby
  drinkingWater: boolean("drinking_water"), // water fountain nearby
  restrooms: boolean("restrooms"), // restroom facilities nearby
  operator: text("operator"),
  manufacturer: text("manufacturer"), // equipment manufacturer
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAmenitySchema = createInsertSchema(amenities).pick({
  osmId: true,
  type: true,
  name: true,
  latitude: true,
  longitude: true,
  fee: true,
  wheelchair: true,
  openingHours: true,
  equipmentType: true,
  material: true,
  covered: true,
  lighting: true,
  surface: true,
  ageGroup: true,
  difficulty: true,
  multipleStations: true,
  parkingNearby: true,
  drinkingWater: true,
  restrooms: true,
  operator: true,
  manufacturer: true,
});

export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type Amenity = typeof amenities.$inferSelect;

// Search locations for San Francisco
export const sfLocations = [
  { name: 'Mission District', lat: 37.7599, lng: -122.4148 },
  { name: 'Castro District', lat: 37.7609, lng: -122.4350 },
  { name: 'Haight-Ashbury', lat: 37.7692, lng: -122.4481 },
  { name: 'North Beach', lat: 37.8067, lng: -122.4103 },
  { name: 'Chinatown', lat: 37.7941, lng: -122.4078 },
  { name: 'Financial District', lat: 37.7946, lng: -122.3999 },
  { name: 'Union Square', lat: 37.7880, lng: -122.4074 },
  { name: 'Golden Gate Park', lat: 37.7694, lng: -122.4862 },
  { name: 'Fisherman\'s Wharf', lat: 37.8080, lng: -122.4177 },
  { name: 'Lombard Street', lat: 37.8021, lng: -122.4187 },
  { name: 'Pacific Heights', lat: 37.7938, lng: -122.4371 },
  { name: 'Russian Hill', lat: 37.8025, lng: -122.4186 },
  { name: 'SoMa', lat: 37.7749, lng: -122.4094 },
  { name: 'Presidio', lat: 37.7989, lng: -122.4662 },
  { name: 'Richmond District', lat: 37.7806, lng: -122.4644 }
] as const;

export const SF_BOUNDS = {
  southwest: [37.70, -122.55] as const,
  northeast: [37.83, -122.35] as const
};

export const SF_CENTER = [37.7749, -122.4194] as const;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("user"), // 'user', 'moderator', 'admin'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User reviews table for amenity ratings and photos
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  amenityId: bigint("amenity_id", { mode: "number" }).notNull(),
  userId: varchar("user_id").references(() => users.id), // Link to authenticated user (optional for anonymous reviews)
  userNickname: varchar("user_nickname", { length: 50 }).notNull(),
  cleanlinessRating: integer("cleanliness_rating").notNull(), // 1-5 scale
  hasToiletPaper: boolean("has_toilet_paper"),
  hasMirror: boolean("has_mirror"),
  hasHotWaterSoap: boolean("has_hot_water_soap"),
  hasSoap: boolean("has_soap"),
  hasSanitaryDisposal: boolean("has_sanitary_disposal"),
  handDryerType: text("hand_dryer_type"), // 'electric', 'paper', or 'none'
  photoUrl: text("photo_url"), // URL to uploaded photo
  comments: text("comments"),
  contactInfo: varchar("contact_info", { length: 200 }), // Phone/username for thank you messages
  contactType: varchar("contact_type", { length: 20 }), // 'whatsapp', 'telegram', 'signal', 'sms'
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected', 'flagged'
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNote: text("moderation_note"),
  isVerified: boolean("is_verified").default(false), // For verified facility features
  flagCount: integer("flag_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin actions log for tracking moderation
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // 'approve_review', 'reject_review', 'delete_review', etc.
  targetType: varchar("target_type", { length: 20 }).notNull(), // 'review', 'user', 'photo'
  targetId: integer("target_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message queue for thank you messages
export const messageQueue = pgTable("message_queue", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  contactInfo: varchar("contact_info", { length: 200 }).notNull(),
  contactType: varchar("contact_type", { length: 20 }).notNull(), // 'whatsapp', 'telegram', 'sms'
  messageContent: text("message_content").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations between all tables
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  moderatedReviews: many(reviews, { relationName: "moderatedReviews" }),
  adminActions: many(adminActions),
}));

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  amenity: one(amenities, {
    fields: [reviews.amenityId],
    references: [amenities.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [reviews.moderatedBy],
    references: [users.id],
    relationName: "moderatedReviews",
  }),
  messages: many(messageQueue),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, {
    fields: [adminActions.adminId],
    references: [users.id],
  }),
}));

export const messageQueueRelations = relations(messageQueue, ({ one }) => ({
  review: one(reviews, {
    fields: [messageQueue.reviewId],
    references: [reviews.id],
  }),
}));

// Review schemas
export const insertReviewSchema = createInsertSchema(reviews).pick({
  amenityId: true,
  userId: true,
  userNickname: true,
  cleanlinessRating: true,
  hasToiletPaper: true,
  hasMirror: true,
  hasHotWaterSoap: true,
  hasSoap: true,
  hasSanitaryDisposal: true,
  handDryerType: true,
  photoUrl: true,
  comments: true,
  contactInfo: true,
  contactType: true,
}).extend({
  cleanlinessRating: z.number().min(1).max(5),
  userNickname: z.string().min(1).max(50),
  handDryerType: z.enum(['electric', 'paper', 'none']).nullable(),
  contactType: z.enum(['whatsapp', 'telegram', 'sms', 'none']).nullable(),
});

export const updateReviewSchema = createInsertSchema(reviews).pick({
  cleanlinessRating: true,
  hasToiletPaper: true,
  hasMirror: true,
  hasHotWaterSoap: true,
  hasSoap: true,
  hasSanitaryDisposal: true,
  handDryerType: true,
  comments: true,
}).extend({
  cleanlinessRating: z.number().min(1).max(5),
  handDryerType: z.enum(['electric', 'paper', 'none']).nullable(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'flagged']),
  moderationNote: z.string().optional(),
  isVerified: z.boolean().optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type UpdateReview = z.infer<typeof updateReviewSchema>;
export type ModerateReview = z.infer<typeof moderateReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;
export type MessageQueue = typeof messageQueue.$inferSelect;
