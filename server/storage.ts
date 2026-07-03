import { db } from "./db";
import { users, conversations, messages, searches, subscriptions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type {
  User, InsertUser,
  Conversation, InsertConversation,
  Message, InsertMessage,
  Search, InsertSearch,
  Subscription, InsertSubscription,
} from "@shared/schema";

export class DatabaseStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }
  async createUser(user: InsertUser): Promise<User> {
    const rows = await db.insert(users).values(user).returning();
    return rows[0];
  }
  async updateUserPlan(id: number, plan: string): Promise<User | undefined> {
    const rows = await db.update(users).set({ plan }).where(eq(users.id, id)).returning();
    return rows[0];
  }

  // Subscriptions
  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return rows[0];
  }
  async upsertSubscription(data: InsertSubscription): Promise<Subscription> {
    const existing = await this.getSubscription(data.userId);
    if (existing) {
      const rows = await db.update(subscriptions).set(data).where(eq(subscriptions.userId, data.userId)).returning();
      return rows[0];
    }
    const rows = await db.insert(subscriptions).values(data).returning();
    return rows[0];
  }

  // Conversations
  async getConversations(userId: number): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
  }
  async getConversation(id: number): Promise<Conversation | undefined> {
    const rows = await db.select().from(conversations).where(eq(conversations.id, id));
    return rows[0];
  }
  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const rows = await db.insert(conversations).values(conv).returning();
    return rows[0];
  }
  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createMessage(msg: InsertMessage): Promise<Message> {
    const rows = await db.insert(messages).values(msg).returning();
    return rows[0];
  }

  // Searches
  async getRecentSearches(userId: number, limit = 10): Promise<Search[]> {
    return db.select().from(searches).where(eq(searches.userId, userId)).orderBy(desc(searches.createdAt)).limit(limit);
  }
  async createSearch(search: InsertSearch): Promise<Search> {
    const rows = await db.insert(searches).values(search).returning();
    return rows[0];
  }
}

export const storage = new DatabaseStorage();
