import React, { useEffect, useState, useCallback } from 'react';
import {
  ClientTask,
  getClientTasks,
  claimTaskReward,
  incrementTaskProgress,
  formatRemainingTime,
  isTaskExpired,
} from '../lib/tasksApi';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Clock, CheckCircle2, Award, ChevronRight, RefreshCw } from 'lucide-react';

interface TasksPanelProps {
  userId: string;
  onCoinsUpdated?: (newBalance: number) => void;
}

export default function TasksPanel({ userId, onCoinsUpdated }: TasksPanelProps) {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [progressingId, setProgressingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const userGender = user?.gender || 'female';

  const loadTasks = useCallback(async () => {
    setError(null);
    try {
      const data = await getClientTasks(userId, userGender);
      setTasks(data.filter((t) => !isTaskExpired(t.expiry_date)));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [userId, userGender]);

  useEffect(() => {
    loadTasks();
    const refreshInterval = setInterval(loadTasks, 15000);
    const tickInterval = setInterval(() => setTick((n) => n + 1), 30000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [loadTasks]);

  async function handleClaim(taskId: string) {
    setClaimingId(taskId);
    setError(null);
    try {
      const newBalance = await claimTaskReward(userId, taskId);
      if (onCoinsUpdated) onCoinsUpdated(newBalance);
      await refreshProfile();
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  }

  async function handleDoTask(taskId: string) {
    setProgressingId(taskId);
    setError(null);
    try {
      await incrementTaskProgress(userId, taskId, 1);
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update task progress');
    } finally {
      setProgressingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading active missions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-white text-base font-bold">Daily Missions & Rewards</h2>
        </div>
        <button
          onClick={loadTasks}
          className="text-slate-400 hover:text-white text-xs flex items-center space-x-1 p-1 hover:bg-slate-800 rounded transition-all"
          title="Refresh tasks"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
          <p className="text-slate-300 text-xs font-medium">No missions available right now.</p>
          <p className="text-slate-500 text-[11px]">Check back soon for new task rewards!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const pct = Math.min(100, Math.round((task.progress / task.target_count) * 100));
            const remaining = formatRemainingTime(task.expiry_date);
            const isCompleted = task.completed || task.progress >= task.target_count;

            return (
              <div
                key={task.task_id}
                className={`bg-slate-900/80 border p-3.5 rounded-xl transition-all space-y-2.5 ${
                  task.claimed
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isCompleted
                    ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    {task.icon_url ? (
                      <img src={task.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-300 text-lg shrink-0">
                        🎯
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-white text-xs font-bold truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-0.5 leading-snug">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end">
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center space-x-1">
                      <span>🪙</span>
                      <span>+{task.reward_coins}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{remaining}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Status */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Progress: <strong className="text-white">{task.progress}</strong> / {task.target_count}
                    </span>
                    <span className="text-slate-400 text-[10px] font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.claimed
                          ? 'bg-emerald-500'
                          : isCompleted
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 animate-pulse'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-1 gap-2">
                  {task.claimed ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Claimed</span>
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(task.task_id)}
                      disabled={claimingId === task.task_id}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold rounded-lg transition-all shadow-md shadow-amber-500/30 flex items-center space-x-1 animate-bounce"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{claimingId === task.task_id ? 'Claiming...' : 'Claim Reward'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDoTask(task.task_id)}
                        disabled={progressingId === task.task_id}
                        className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 border border-indigo-400/30"
                      >
                        <span>{progressingId === task.task_id ? 'Updating...' : 'Do Mission'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
