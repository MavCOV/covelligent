import { get, all, run } from "./db";

// ── Types ────────────────────────────────────────────────────────────────────
export interface User { id: number; name: string; email: string; plan: string; created_at: string; }
export interface Conversation { id: number; user_id: number; title: string; created_at: string; }
export interface Message { id: number; conversation_id: number; role: string; content: string; sources: string | null; created_at: string; }
export interface Search { id: number; user_id: number; query: string; created_at: string; }
export interface Subscription { id: number; user_id: number; stripe_customer_id: string | null; stripe_subscription_id: string | null; status: string; plan: string; current_period_end: string | null; created_at: string; }

export class DatabaseStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return get<User>("SELECT * FROM users WHERE id = ?", [id]);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return get<User>("SELECT * FROM users WHERE email = ?", [email]);
  }
  async createUser(data: { name: string; email: string; plan?: string }): Promise<User> {
    const now = new Date().toISOString();
    await run("INSERT INTO users (name, email, plan, created_at) VALUES (?, ?, ?, ?)",
      [data.name, data.email, data.plan || "free", now]);
    return get<User>("SELECT * FROM users WHERE email = ?", [data.email]) as Promise<User>;
  }
  async updateUserPlan(id: number, plan: string): Promise<User | undefined> {
    await run("UPDATE users SET plan = ? WHERE id = ?", [plan, id]);
    return get<User>("SELECT * FROM users WHERE id = ?", [id]);
  }

  // Subscriptions
  async getSubscription(userId: number): Promise<Subscription | undefined> {
    return get<Subscription>("SELECT * FROM subscriptions WHERE user_id = ?", [userId]);
  }
  async upsertSubscription(data: Omit<Subscription, "id">): Promise<Subscription> {
    const existing = await this.getSubscription(data.user_id);
    if (existing) {
      await run(`UPDATE subscriptions SET stripe_customer_id=?, stripe_subscription_id=?, status=?, plan=?, current_period_end=? WHERE user_id=?`,
        [data.stripe_customer_id, data.stripe_subscription_id, data.status, data.plan, data.current_period_end, data.user_id]);
    } else {
      await run(`INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, created_at) VALUES (?,?,?,?,?,?,?)`,
        [data.user_id, data.stripe_customer_id, data.stripe_subscription_id, data.status, data.plan, data.current_period_end, data.created_at]);
    }
    return get<Subscription>("SELECT * FROM subscriptions WHERE user_id = ?", [data.user_id]) as Promise<Subscription>;
  }

  // Conversations
  async getConversations(userId: number): Promise<Conversation[]> {
    return all<Conversation>("SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC", [userId]);
  }
  async getConversation(id: number): Promise<Conversation | undefined> {
    return get<Conversation>("SELECT * FROM conversations WHERE id = ?", [id]);
  }
  async createConversation(data: { user_id: number; title: string }): Promise<Conversation> {
    const now = new Date().toISOString();
    await run("INSERT INTO conversations (user_id, title, created_at) VALUES (?, ?, ?)", [data.user_id, data.title, now]);
    const row = await get<Conversation>("SELECT * FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1", [data.user_id]);
    return row!;
  }
  async deleteConversation(id: number): Promise<void> {
    await run("DELETE FROM messages WHERE conversation_id = ?", [id]);
    await run("DELETE FROM conversations WHERE id = ?", [id]);
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    return all<Message>("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", [conversationId]);
  }
  async createMessage(data: { conversation_id: number; role: string; content: string; sources?: string | null }): Promise<Message> {
    const now = new Date().toISOString();
    await run("INSERT INTO messages (conversation_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?)",
      [data.conversation_id, data.role, data.content, data.sources || null, now]);
    const row = await get<Message>("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1", [data.conversation_id]);
    return row!;
  }

  // Searches
  async getRecentSearches(userId: number, limit = 10): Promise<Search[]> {
    return all<Search>("SELECT * FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]);
  }
  async createSearch(data: { user_id: number; query: string }): Promise<Search> {
    const now = new Date().toISOString();
    await run("INSERT INTO searches (user_id, query, created_at) VALUES (?, ?, ?)", [data.user_id, data.query, now]);
    const row = await get<Search>("SELECT * FROM searches WHERE user_id = ? ORDER BY id DESC LIMIT 1", [data.user_id]);
    return row!;
  }
}

export const storage = new DatabaseStorage();
