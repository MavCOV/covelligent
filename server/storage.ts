import { db } from "./db";
import {
  users, conversations, messages, searches, subscriptions,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Search, type InsertSearch,
  type Subscription, type InsertSubscription,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(user: InsertUser): User;
  updateUserPlan(id: number, plan: string): User | undefined;

  // Subscriptions
  getSubscription(userId: number): Subscription | undefined;
  upsertSubscription(data: InsertSubscription): Subscription;

  // Conversations
  getConversations(userId: number): Conversation[];
  getConversation(id: number): Conversation | undefined;
  createConversation(conv: InsertConversation): Conversation;
  deleteConversation(id: number): void;

  // Messages
  getMessages(conversationId: number): Message[];
  createMessage(msg: InsertMessage): Message;

  // Searches
  getRecentSearches(userId: number, limit?: number): Search[];
  createSearch(search: InsertSearch): Search;
}

export class DatabaseStorage implements IStorage {
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(user: InsertUser): User {
    return db.insert(users).values(user).returning().get();
  }

  updateUserPlan(id: number, plan: string): User | undefined {
    return db.update(users).set({ plan }).where(eq(users.id, id)).returning().get();
  }

  getSubscription(userId: number): Subscription | undefined {
    return db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  }

  upsertSubscription(data: InsertSubscription): Subscription {
    const existing = this.getSubscription(data.userId);
    if (existing) {
      return db.update(subscriptions)
        .set(data)
        .where(eq(subscriptions.userId, data.userId))
        .returning()
        .get();
    }
    return db.insert(subscriptions).values(data).returning().get();
  }

  getConversations(userId: number): Conversation[] {
    return db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .all();
  }

  getConversation(id: number): Conversation | undefined {
    return db.select().from(conversations).where(eq(conversations.id, id)).get();
  }

  createConversation(conv: InsertConversation): Conversation {
    return db.insert(conversations).values(conv).returning().get();
  }

  deleteConversation(id: number): void {
    db.delete(messages).where(eq(messages.conversationId, id)).run();
    db.delete(conversations).where(eq(conversations.id, id)).run();
  }

  getMessages(conversationId: number): Message[] {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .all();
  }

  createMessage(msg: InsertMessage): Message {
    return db.insert(messages).values(msg).returning().get();
  }

  getRecentSearches(userId: number, limit = 10): Search[] {
    return db.select().from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt))
      .limit(limit)
      .all();
  }

  createSearch(search: InsertSearch): Search {
    return db.insert(searches).values(search).returning().get();
  }
}

export const storage = new DatabaseStorage();
