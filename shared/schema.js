import { pgTable, text, serial, real, boolean, timestamp, integer, varchar, bigint, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
export const amenities = pgTable("amenities", {
    id: serial("id").primaryKey(),
    osmId: text("osm_id").notNull().unique(),
    type: text("type").notNull(), // 'bathroom', 'dog_park', or 'shower'
    name: text("name"),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    fee: boolean("fee"),
    wheelchair: boolean("wheelchair"),
    openingHours: text("opening_hours"),
    barrier: text("barrier"), // for dog parks
    offLeash: boolean("off_leash"), // for dog parks
    drinkingWater: boolean("drinking_water"),
    dogWasteBins: boolean("dog_waste_bins"), // for dog parks with poo disposal bins
    changingTable: boolean("changing_table"), // for bathrooms with baby changing tables
    bidet: boolean("bidet"), // for bathrooms with bidets
    toiletPaper: boolean("toilet_paper"), // for bathrooms with toilet paper
    handDryer: boolean("hand_dryer"), // for bathrooms with hand dryers
    sanitaryDisposal: boolean("sanitary_disposal"), // for bathrooms with sanitary disposal bins
    selfCleaning: boolean("self_cleaning"), // for self-cleaning bathrooms
    // Shower-specific fields
    hotWater: boolean("hot_water"), // for showers with hot water
    accessType: text("access_type"), // 'yes', 'customers', 'private', 'permit'
    gender: text("gender"), // 'male', 'female', 'unisex'
    building: boolean("building"), // if shower is in a building
    covered: boolean("covered"), // weather protection
    supervised: boolean("supervised"), // staffed/cleaned regularly
    operator: text("operator"),
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
    barrier: true,
    offLeash: true,
    drinkingWater: true,
    dogWasteBins: true,
    changingTable: true,
    bidet: true,
    toiletPaper: true,
    handDryer: true,
    sanitaryDisposal: true,
    selfCleaning: true,
    hotWater: true,
    accessType: true,
    gender: true,
    building: true,
    covered: true,
    supervised: true,
    operator: true,
});
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
];
export const SF_BOUNDS = {
    southwest: [37.70, -122.55],
    northeast: [37.83, -122.35]
};
export const SF_CENTER = [37.7749, -122.4194];
// Session storage table for Replit Auth
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
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
