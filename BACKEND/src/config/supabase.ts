import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Auth methods
  async signUp(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Supabase signup error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Supabase signin error:', error);
      throw error;
    }
  }

  async signOut(jwt: string) {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Supabase signout error:', error);
      throw error;
    }
  }

  async getUser(jwt: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(jwt);
      if (error) throw error;
      return data.user;
    } catch (error) {
      logger.error('Supabase get user error:', error);
      throw error;
    }
  }

  async refreshSession(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Supabase refresh session error:', error);
      throw error;
    }
  }

  // Database methods
  async insert(table: string, data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase insert error in ${table}:`, error);
      throw error;
    }
  }

  async select(table: string, query?: any) {
    try {
      let queryBuilder = this.supabase.from(table).select('*');

      if (query) {
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }

        if (query.order) {
          queryBuilder = queryBuilder.order(query.order.column, {
            ascending: query.order.ascending ?? true
          });
        }

        if (query.limit) {
          queryBuilder = queryBuilder.limit(query.limit);
        }

        if (query.offset) {
          queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Supabase select error in ${table}:`, error);
      throw error;
    }
  }

  async update(table: string, id: string, data: any) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase update error in ${table}:`, error);
      throw error;
    }
  }

  async delete(table: string, id: string) {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Supabase delete error in ${table}:`, error);
      throw error;
    }
  }

  async upsert(table: string, data: any, conflictColumn?: string) {
    try {
      let upsertBuilder = this.supabase
        .from(table)
        .upsert(data, { 
          onConflict: conflictColumn,
          ignoreDuplicates: false 
        })
        .select()
        .single();

      const { data: result, error } = await upsertBuilder;

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase upsert error in ${table}:`, error);
      throw error;
    }
  }

  async rpc(functionName: string, params?: any) {
    try {
      const { data, error } = await this.supabase.rpc(functionName, params);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Supabase RPC error for ${functionName}:`, error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;