import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hasRunningSync } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function secretsMatch(candidate: string, expected: string) {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_REFRESH_SECRET;
  const githubToken = process.env.GITHUB_ACTIONS_TOKEN;
  if (!adminSecret || !githubToken) {
    return NextResponse.json({ success: false, error: 'Yenileme servisi yapılandırılmadı.' }, { status: 503 });
  }
  let password = '';
  try { password = String((await request.json()).password || ''); } catch {}
  if (!secretsMatch(password, adminSecret)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz işlem.' }, { status: 401 });
  }
  try {
    if (await hasRunningSync()) {
      return NextResponse.json({ success: false, error: 'Bir yenileme işlemi zaten çalışıyor.' }, { status: 409 });
    }
    const repository = process.env.GITHUB_REPOSITORY || 'leidenfrost-effect/cex-uk-tracker';
    const workflow = process.env.GITHUB_WORKFLOW_FILE || 'daily-price-tracker.yml';
    const ref = process.env.GITHUB_DEFAULT_BRANCH || 'main';
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, inputs: { trigger: 'site' }, return_run_details: true }),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error('GitHub dispatch failed:', response.status, (await response.text()).slice(0, 300));
      return NextResponse.json({ success: false, error: 'GitHub yenileme işi başlatılamadı.' }, { status: 502 });
    }
    const details = response.status === 204 ? null : await response.json().catch(() => null);
    return NextResponse.json({ success: true, status: 'queued', runId: details?.workflow_run_id?.toString() || null });
  } catch (error) {
    console.error('Refresh dispatch failed:', error);
    return NextResponse.json({ success: false, error: 'Yenileme işi başlatılamadı.' }, { status: 503 });
  }
}
