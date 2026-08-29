'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Database, KeyRound, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SyncRunSummary } from '@/types/game';

interface Props { isOpen: boolean; onClose: () => void; }
const TERMINAL = new Set(['succeeded', 'partial', 'failed']);

export function DataRefreshModal({ isOpen, onClose }: Props) {
  const { catalogMeta, refreshCatalog } = useApp();
  const [password, setPassword] = useState('');
  const [run, setRun] = useState<SyncRunSummary | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatchedAt = useRef(0);

  useEffect(() => {
    if (!isOpen || (!runId && !dispatchedAt.current) || (run && TERMINAL.has(run.status))) return;
    const timer = window.setInterval(async () => {
      try {
        const suffix = runId ? `?runId=${encodeURIComponent(runId)}` : '';
        const response = await fetch(`/api/sync-status${suffix}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !data.run) return;
        const candidate = data.run as SyncRunSummary;
        if (!runId && new Date(candidate.startedAt).getTime() < dispatchedAt.current - 5000) return;
        setRun(candidate);
        if (TERMINAL.has(candidate.status)) {
          if (candidate.status !== 'failed') void refreshCatalog();
          setMessage(candidate.status === 'succeeded'
            ? 'Oyun fiyatları ve TCMB kuru başarıyla güncellendi.'
            : candidate.status === 'partial'
              ? 'Oyunlar güncellendi; kur kaynağı için uyarı oluştu.'
              : candidate.errorSummary || 'Yenileme başarısız oldu.');
        }
      } catch {}
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, refreshCatalog, run, runId]);

  if (!isOpen) return null;

  const startRefresh = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true); setMessage(null); setRun(null);
    try {
      const response = await fetch('/api/admin/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Yenileme başlatılamadı.');
      dispatchedAt.current = Date.now();
      setRunId(data.runId || null); setPassword('');
      setMessage('Yenileme GitHub Actions kuyruğuna alındı. Durum otomatik izlenecek.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Yenileme başlatılamadı.');
    } finally { setIsSubmitting(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
    <div className="w-full max-w-md bg-[#181818] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-[#202020] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40"><Database className="w-5 h-5 text-red-400" /></div>
          <div><h3 className="font-bold">CeX Verilerini Yenile</h3><p className="text-xs text-zinc-400">Yetkili yönetici işlemi</p></div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5 space-y-4 text-xs">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Doğrulamalı tam tarama</div>
          <p className="mt-1">Beş platform doğrulanmadan canlı veri değişmez.</p>
          <p className="mt-2 font-mono">Son başarılı kayıt: {catalogMeta.lastSuccessfulSyncAt
            ? new Date(catalogMeta.lastSuccessfulSyncAt).toLocaleString('tr-TR') : 'Henüz yok'}</p>
        </div>
        <form onSubmit={startRefresh} className="space-y-3">
          <label className="block font-semibold text-zinc-300">Admin parolası</label>
          <div className="relative"><KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3 py-2 text-sm outline-none focus:border-red-500" />
          </div>
          <button disabled={isSubmitting || run?.status === 'running'} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 font-bold flex items-center justify-center gap-2">
            {isSubmitting || run?.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {run?.status === 'running' ? 'Yenileniyor...' : 'Verileri Şimdi Yenile'}
          </button>
        </form>
        {run && <div className="rounded-xl border border-zinc-800 bg-black/30 p-3 font-mono text-zinc-300">
          Durum: {run.status} · Görülen: {run.gamesSeen} · Değişen: {run.gamesChanged}
        </div>}
        {message && <div className={`rounded-xl border p-3 ${run?.status === 'failed' ? 'border-rose-800 bg-rose-950/30 text-rose-300' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>{message}</div>}
      </div>
    </div>
  </div>;
}
