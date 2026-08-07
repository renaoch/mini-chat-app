import { supabase, isSupabaseConfigured } from './supabase';
import { API_BASE } from './apiBase';

export type DurationType = '24h' | 'custom' | 'weekly' | 'permanent';
export type TargetGender = 'male' | 'female' | 'all';
export type TaskStatus = 'active' | 'inactive';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  reward_coins: number;
  target_gender: TargetGender;
  duration_type: DurationType;
  expiry_date: string | null;
  target_count: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientTask {
  task_id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  reward_coins: number;
  duration_type: DurationType;
  expiry_date: string | null;
  target_count: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export async function getClientTasks(userId: string, userGender?: string): Promise<ClientTask[]> {
  const isUuid = Boolean(userId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  if (isSupabaseConfigured() && supabase && isUuid) {
    try {
      const { data, error } = await supabase.rpc('get_client_tasks', { p_user_id: userId });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((t: any) => ({
          task_id: t.task_id || t.id,
          title: t.title,
          description: t.description,
          icon_url: t.icon_url,
          reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
          duration_type: t.duration_type || t.durationType || '24h',
          expiry_date: t.expiry_date || t.expiryDate || null,
          target_count: t.target_count ?? t.targetCount ?? 1,
          progress: t.progress ?? 0,
          completed: Boolean(t.completed || t.isCompleted),
          claimed: Boolean(t.claimed || t.isClaimed),
        }));
      }
    } catch (e) {
      console.warn('Supabase get_client_tasks RPC note, fallback to REST API:', e);
    }
  }

  // REST API fallback
  const query = new URLSearchParams();
  if (userId) query.append('userId', userId);
  if (userGender) query.append('gender', userGender);
  const res = await fetch(`${API_BASE}/api/tasks?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load client tasks');
  const json = await res.json();
  const rawList = json.tasks || [];

  return rawList.map((t: any) => ({
    task_id: t.task_id || t.id,
    title: t.title,
    description: t.description || null,
    icon_url: t.icon_url || t.iconUrl || t.icon || null,
    reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
    duration_type: t.duration_type || t.durationType || '24h',
    expiry_date: t.expiry_date || t.expiryDate || null,
    target_count: t.target_count ?? t.targetCount ?? 1,
    progress: t.progress ?? 0,
    completed: Boolean(t.completed || (t.progress != null && t.targetCount != null && t.progress >= t.targetCount)),
    claimed: Boolean(t.claimed || t.isClaimed),
  }));
}

export async function incrementTaskProgress(userId: string, taskId: string, amount = 1) {
  const isUuidUser = Boolean(userId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const isUuidTask = Boolean(taskId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);

  if (isSupabaseConfigured() && supabase && isUuidUser && isUuidTask) {
    try {
      const { data, error } = await supabase.rpc('increment_task_progress', {
        p_user_id: userId,
        p_task_id: taskId,
        p_amount: amount,
      });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase increment_task_progress note, fallback to REST API:', e);
    }
  }

  const res = await fetch(`${API_BASE}/api/tasks/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, amount }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update task progress');
  }
  return await res.json();
}

export async function claimTaskReward(userId: string, taskId: string): Promise<number> {
  const isUuidUser = Boolean(userId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const isUuidTask = Boolean(taskId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);

  if (isSupabaseConfigured() && supabase && isUuidUser && isUuidTask) {
    try {
      const { data, error } = await supabase.rpc('claim_task_reward', {
        p_user_id: userId,
        p_task_id: taskId,
      });
      if (!error && typeof data === 'number') return data;
    } catch (e) {
      console.warn('Supabase claim_task_reward note, fallback to REST API:', e);
    }
  }

  const res = await fetch(`${API_BASE}/api/tasks/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to claim reward');
  }
  const json = await res.json();
  return json.coins as number;
}

export async function adminListTasks(): Promise<Task[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_list_tasks');
      if (!error && Array.isArray(data)) {
        return data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          icon_url: t.icon_url || t.iconUrl || null,
          reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
          target_gender: t.target_gender || t.targetGender || 'all',
          duration_type: t.duration_type || t.durationType || '24h',
          expiry_date: t.expiry_date || t.expiryDate || null,
          target_count: t.target_count ?? t.targetCount ?? 1,
          status: (t.status || 'active').toLowerCase() as TaskStatus,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn('Supabase admin_list_tasks note, fallback to REST API:', e);
    }
  }

  const savedSession = sessionStorage.getItem('vibelive_admin_session');
  const token = savedSession ? JSON.parse(savedSession)?.token : '';

  const res = await fetch(`${API_BASE}/api/admin/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Admin-Role': 'Level 3 - Super Admin',
    },
  });
  if (!res.ok) throw new Error('Failed to load admin tasks');
  const json = await res.json();
  const rawList = Array.isArray(json) ? json : json.tasks || [];

  return rawList.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || null,
    icon_url: t.icon_url || t.iconUrl || null,
    reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
    target_gender: (t.target_gender || t.targetGender || 'all').toLowerCase() as TargetGender,
    duration_type: (t.duration_type || t.durationType || '24h').toLowerCase() as DurationType,
    expiry_date: t.expiry_date || t.expiryDate || null,
    target_count: t.target_count ?? t.targetCount ?? 1,
    status: (t.status || 'active').toLowerCase() as TaskStatus,
    created_at: t.created_at || t.createdAt || new Date().toISOString(),
    updated_at: t.updated_at || t.updatedAt || new Date().toISOString(),
  }));
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  iconUrl?: string;
  rewardCoins: number;
  targetGender: TargetGender;
  durationType: DurationType;
  expiryDate?: string | null;
  targetCount?: number;
}

export async function adminCreateTask(input: CreateTaskInput): Promise<Task> {
  validateTaskInput(input);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_create_task', {
        p_title: input.title,
        p_description: input.description ?? null,
        p_icon_url: input.iconUrl ?? null,
        p_reward_coins: input.rewardCoins,
        p_target_gender: input.targetGender,
        p_duration_type: input.durationType,
        p_expiry_date: input.durationType === 'custom' ? input.expiryDate : null,
        p_target_count: input.targetCount ?? 1,
      });
      if (!error && data) return data as Task;
    } catch (e) {
      console.warn('Supabase admin_create_task note, fallback to REST API:', e);
    }
  }

  const savedSession = sessionStorage.getItem('vibelive_admin_session');
  const token = savedSession ? JSON.parse(savedSession)?.token : '';

  const res = await fetch(`${API_BASE}/api/admin/tasks/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Admin-Role': 'Level 3 - Super Admin',
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description || null,
      iconUrl: input.iconUrl || null,
      rewardCoins: input.rewardCoins,
      targetGender: input.targetGender,
      durationType: input.durationType,
      expiryDate: input.durationType === 'custom' ? input.expiryDate : null,
      targetCount: input.targetCount ?? 1,
      status: 'active',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create task');
  }

  const json = await res.json();
  const t = json.task || json;
  return {
    id: t.id,
    title: t.title,
    description: t.description || null,
    icon_url: t.icon_url || t.iconUrl || null,
    reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
    target_gender: (t.target_gender || t.targetGender || 'all').toLowerCase() as TargetGender,
    duration_type: (t.duration_type || t.durationType || '24h').toLowerCase() as DurationType,
    expiry_date: t.expiry_date || t.expiryDate || null,
    target_count: t.target_count ?? t.targetCount ?? 1,
    status: (t.status || 'active').toLowerCase() as TaskStatus,
    created_at: t.created_at || t.createdAt || new Date().toISOString(),
    updated_at: t.updated_at || t.updatedAt || new Date().toISOString(),
  };
}

export interface UpdateTaskInput extends CreateTaskInput {
  id: string;
  status: TaskStatus;
}

export async function adminUpdateTask(input: UpdateTaskInput): Promise<Task> {
  validateTaskInput(input);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_update_task', {
        p_task_id: input.id,
        p_title: input.title,
        p_description: input.description ?? null,
        p_icon_url: input.iconUrl ?? null,
        p_reward_coins: input.rewardCoins,
        p_target_gender: input.targetGender,
        p_duration_type: input.durationType,
        p_expiry_date: input.durationType === 'custom' ? input.expiryDate : null,
        p_status: input.status,
        p_target_count: input.targetCount ?? 1,
      });
      if (!error && data) return data as Task;
    } catch (e) {
      console.warn('Supabase admin_update_task note, fallback to REST API:', e);
    }
  }

  const savedSession = sessionStorage.getItem('vibelive_admin_session');
  const token = savedSession ? JSON.parse(savedSession)?.token : '';

  const res = await fetch(`${API_BASE}/api/admin/tasks/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Admin-Role': 'Level 3 - Super Admin',
    },
    body: JSON.stringify({
      id: input.id,
      title: input.title,
      description: input.description || null,
      iconUrl: input.iconUrl || null,
      rewardCoins: input.rewardCoins,
      targetGender: input.targetGender,
      durationType: input.durationType,
      expiryDate: input.durationType === 'custom' ? input.expiryDate : null,
      targetCount: input.targetCount ?? 1,
      status: input.status,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update task');
  }

  const json = await res.json();
  const t = json.task || json;
  return {
    id: t.id,
    title: t.title,
    description: t.description || null,
    icon_url: t.icon_url || t.iconUrl || null,
    reward_coins: t.reward_coins ?? t.rewardCoins ?? 0,
    target_gender: (t.target_gender || t.targetGender || 'all').toLowerCase() as TargetGender,
    duration_type: (t.duration_type || t.durationType || '24h').toLowerCase() as DurationType,
    expiry_date: t.expiry_date || t.expiryDate || null,
    target_count: t.target_count ?? t.targetCount ?? 1,
    status: (t.status || 'active').toLowerCase() as TaskStatus,
    created_at: t.created_at || t.createdAt || new Date().toISOString(),
    updated_at: t.updated_at || t.updatedAt || new Date().toISOString(),
  };
}

export async function adminDeleteTask(taskId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.rpc('admin_delete_task', { p_task_id: taskId });
      if (!error) return;
    } catch (e) {
      console.warn('Supabase admin_delete_task note, fallback to REST API:', e);
    }
  }

  const savedSession = sessionStorage.getItem('vibelive_admin_session');
  const token = savedSession ? JSON.parse(savedSession)?.token : '';

  const res = await fetch(`${API_BASE}/api/admin/tasks/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Admin-Role': 'Level 3 - Super Admin',
    },
    body: JSON.stringify({ id: taskId }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete task');
  }
}

function validateTaskInput(input: CreateTaskInput) {
  if (!input.title?.trim()) throw new Error('Task title is required');
  if (input.rewardCoins == null || Number.isNaN(Number(input.rewardCoins)) || Number(input.rewardCoins) < 0) {
    throw new Error('Reward coins cannot be negative');
  }
  if (!input.durationType) throw new Error('Duration type is required');
  if (!input.targetGender) throw new Error('Gender selection is required');
  if (input.durationType === 'custom') {
    if (!input.expiryDate) throw new Error('Custom duration requires an expiry date');
    if (new Date(input.expiryDate).getTime() < Date.now()) throw new Error('Expiry date cannot be in the past');
  }
}

export function formatRemainingTime(expiryDate: string | null): string {
  if (!expiryDate) return 'Permanent';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 2) return `${diffDays} Days remaining`;
  if (diffDays === 1) return 'Expires Tomorrow';
  if (diffHours >= 1) return `${diffHours}h ${diffMinutes % 60}m remaining`;
  return `${diffMinutes}m remaining`;
}

export function isTaskExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() <= Date.now();
}
