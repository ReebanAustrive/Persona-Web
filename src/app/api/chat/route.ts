export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function buildProgressContext(uid: string): Promise<string> {
  // Last 30 days of progress logs
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [logsSnap, tracksSnap, userSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).collection('progressLogs')
      .where('date', '>=', fromStr).orderBy('date', 'desc').get(),
    adminDb.collection('users').doc(uid).collection('tracks')
      .where('status', '==', 'active').get(),
    adminDb.collection('users').doc(uid).get(),
  ]);

  const user = userSnap.data() ?? {};
  const tracks = tracksSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string; name: string; bucket: string; status: string;
  }>;

  const trackMap: Record<string, string> = {};
  for (const t of tracks) trackMap[t.id] = `${t.name} (${t.bucket})`;

  // Summarise per-track time over last 30 days
  const summary: Record<string, number> = {};
  for (const doc of logsSnap.docs) {
    const log = doc.data();
    for (const entry of log.entries ?? []) {
      const label = trackMap[entry.trackId] ?? entry.trackId;
      summary[label] = (summary[label] ?? 0) + (entry.minutesLogged ?? 0);
    }
  }

  const summaryLines = Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .map(([label, mins]) => `  - ${label}: ${Math.round(mins / 60 * 10) / 10}h`);

  const context = `
You are an AI coach embedded in Persona — the user's personal progress tracker.
You have READ access to the following summarized data. Do NOT make up data beyond what is listed.

## User stats (today)
- Current streak: ${user.currentStreak ?? 0} days
- Longest streak: ${user.longestStreak ?? 0} days

## Active tracks
${tracks.map((t) => `- ${t.name} (${t.bucket})`).join('\n') || '  (none)'}

## Time logged — last 30 days
${summaryLines.join('\n') || '  (no logs yet)'}

## Today's date
${new Date().toDateString()}

Answer in a friendly, encouraging coaching tone. Be concise. If the user asks about data you don't have, say so honestly.
`.trim();

  return context;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  };

  if (!messages?.length) return NextResponse.json({ error: 'messages required' }, { status: 400 });

  const context = await buildProgressContext(session.user.id);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: context }],
      },
      {
        role: 'model',
        parts: [{ text: "Understood. I'm your Persona AI coach — I have access to your progress data and I'm ready to help. What would you like to know?" }],
      },
      ...messages.slice(0, -1),
    ],
    generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.parts[0].text);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
