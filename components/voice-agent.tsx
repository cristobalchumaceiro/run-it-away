'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConversationProvider,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
  type HookOptions
} from '@elevenlabs/react';
import { endThinkingSession, saveRunnerUtterance } from '@/app/actions';

type VoiceAgentProps = {
  sessionId: string;
  problemId: string;
  problemContext: string;
  agentId: string;
};

type ConversationLine = {
  id: number;
  role: 'user' | 'agent';
  message: string;
};

type MessagePayload = NonNullable<HookOptions['onMessage']> extends (payload: infer Payload) => void ? Payload : never;
type VoiceAgentInnerProps = VoiceAgentProps & { lines: ConversationLine[] };

function VoiceAgentInner({ sessionId, problemContext, agentId, lines }: VoiceAgentInnerProps) {
  const { startSession, endSession } = useConversationControls();
  const { status, message: statusMessage } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const [callError, setCallError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const autoStartRef = useRef(false);
  const attemptInFlightRef = useRef(false);
  const startedRef = useRef(false);

  const startCall = useCallback(async () => {
    if (attemptInFlightRef.current) return;
    attemptInFlightRef.current = true;
    setCallError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      startedRef.current = true;
      startSession({
        agentId,
        dynamicVariables: { problem_context: problemContext }
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCallError('Microphone access was denied. Allow microphone access to start the voice call.');
      } else {
        setCallError('The voice agent could not connect. Check your connection and try again.');
      }
    } finally {
      attemptInFlightRef.current = false;
    }
  }, [agentId, problemContext, startSession]);

  useEffect(() => {
    if (autoStartRef.current) return;
    autoStartRef.current = true;
    void startCall();
  }, [startCall]);

  useEffect(() => {
    if (status === 'error') {
      setCallError(statusMessage ?? 'The voice agent could not connect. Try starting the voice call again.');
    }
  }, [status, statusMessage]);

  async function endRun() {
    if (ending) return;
    setEnding(true);
    try {
      endSession();
    } catch {
      setCallError('The voice call had already ended. Ending the thinking session.');
    }
    await endThinkingSession(sessionId, new FormData());
  }

  const indicator = callError
    ? { label: 'Voice call error', tone: 'border-orange-300/40 bg-orange-300/15 text-orange-100' }
    : status === 'connecting'
      ? { label: 'Connecting to your sparring partner…', tone: 'border-lime-300/40 bg-lime-300/10 text-lime-100' }
      : status === 'connected' && isSpeaking
        ? { label: 'Sparring partner is talking', tone: 'border-lime-300/50 bg-lime-300/20 text-lime-50' }
        : status === 'connected' && isListening
          ? { label: 'Listening — talk to it', tone: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-50' }
          : startedRef.current
            ? { label: 'Voice call ended', tone: 'border-white/20 bg-white/[0.06] text-white/70' }
            : { label: 'Connecting to your sparring partner…', tone: 'border-lime-300/40 bg-lime-300/10 text-lime-100' };

  return (
    <div className="mt-6">
      <div aria-live="polite" className={`rounded-3xl border p-6 text-center text-2xl font-black leading-tight sm:text-3xl ${indicator.tone}`}>
        {indicator.label}
      </div>

      {callError ? (
        <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-300/[0.07] p-4">
          <p className="text-sm leading-6 text-orange-100">{callError}</p>
          <button
            type="button"
            onClick={() => void startCall()}
            className="mt-4 min-h-16 w-full rounded-2xl bg-lime-300 px-5 text-base font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30"
          >
            Start voice call
          </button>
        </div>
      ) : null}

      <div aria-live="polite" className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        {lines.length ? (
          lines.map((line) => (
            <article key={line.id} className="break-words [overflow-wrap:anywhere]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-200">
                {line.role === 'user' ? 'You' : 'Sparring partner'}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-base leading-7 text-white/80">{line.message}</p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-white/45">Your conversation will appear here.</p>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-orange-100/75">Transcription of your speech may be imperfect.</p>

      <button
        type="button"
        onClick={() => void endRun()}
        disabled={ending}
        className="mt-6 min-h-16 w-full rounded-2xl bg-orange-300 px-6 text-lg font-black text-ink transition hover:bg-orange-200 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-orange-300/30 active:scale-[0.99]"
      >
        {ending ? 'Ending run…' : 'End run'}
      </button>
    </div>
  );
}

export function VoiceAgent(props: VoiceAgentProps) {
  const [lines, setLines] = useState<ConversationLine[]>([]);
  const seenEventIdsRef = useRef(new Set<number>());
  const lineIdRef = useRef(0);
  const handleMessage = useCallback((payload: MessagePayload) => {
    const { message, role } = payload;
    if (payload.event_id !== undefined) {
      if (seenEventIdsRef.current.has(payload.event_id)) return;
      seenEventIdsRef.current.add(payload.event_id);
    }
    setLines((current) => [...current, { id: lineIdRef.current++, role, message }]);
    if (role === 'user') {
      void saveRunnerUtterance(props.sessionId, props.problemId, message);
    }
  }, [props.problemId, props.sessionId]);

  return (
    <ConversationProvider onMessage={handleMessage}>
      <VoiceAgentInner {...props} lines={lines} />
    </ConversationProvider>
  );
}
