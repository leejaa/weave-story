import { useState } from 'react';

export function useWeaveForm() {
  const [seed, setSeed] = useState('');
  const [moods, setMoods] = useState<Set<string>>(new Set(['mystery', 'slowBurn']));
  const [length, setLength] = useState('medium');

  const toggleMood = (moodKey: string) => {
    setMoods(prev => {
      const next = new Set(prev);
      next.has(moodKey) ? next.delete(moodKey) : next.add(moodKey);
      return next;
    });
  };

  return { seed, setSeed, moods, toggleMood, length, setLength };
}
