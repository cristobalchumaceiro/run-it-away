'use client';

import { useEffect, useState } from 'react';

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function ElapsedTime({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt.getTime());

  useEffect(() => {
    const update = () => setElapsed(Date.now() - startedAt.getTime());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  return <span aria-live="off">{formatElapsed(elapsed)}</span>;
}
