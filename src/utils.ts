export function formatStation(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dateToKey(value: Date) {
  return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
}

export const SCIENCE_CLASS_TERMS = [
  'science',
  'biology',
  'chemistry',
  'physics',
  'environment',
  'earth science',
  'geology',
  'astronomy',
  'physical science',
  'life science',
  'anatomy',
  'zoology',
];

export function isScienceClass(value: string) {
  const name = value.toLowerCase();
  return SCIENCE_CLASS_TERMS.some((term) => name.includes(term));
}

export function scheduleEmoji(role: string, name: string) {
  if (role === 'lunch') return '🍕';
  if (role === 'advisory') return '🧑‍🏫';
  if (role === 'free') return '🥳';
  if (role === 'event' && name.toLowerCase().includes('activity')) return '🎯';
  if (role === 'event' && name.toLowerCase().includes('assembly')) return '📣';
  if (role !== 'class') return '📚';

  const value = name.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ['📊', ['stat', 'statistics', 'data science']],
    ['🎮', ['game', 'gaming']],
    ['🏃', ['fitness', 'wellness', 'gym', 'physical education', 'phys ed', ' pe']],
    ['🩺', ['health', 'medical', 'nursing', 'ems']],
    ['🌱', ['environment', 'horticulture', 'apes']],
    ['🌋', ['earth', 'geology']],
    ['🔭', ['astronomy', 'astro']],
    ['🔬', ['research', 'physical science', 'stem']],
    ['⚛️', ['physics', 'phys']],
    ['🧪', ['chemistry', 'chem']],
    ['🧬', ['biology', 'bio']],
    ['🍳', ['culinary', 'gourmet', 'food']],
    ['💰', ['accounting', 'finance', 'investing', 'econ', 'economics']],
    ['⚖️', ['law', 'legal', 'criminal justice', 'csi']],
    ['💼', ['business', 'entrepreneur', 'marketing']],
    ['🧠', ['psychology', 'psych']],
    ['📐', ['calculus', 'precalculus', 'algebra', 'geometry', 'math', 'trigonometry']],
    ['⚙️', ['engineering', 'robotics', 'manufacturing', 'pltw']],
    ['💻', ['computer', 'programming', 'software', 'web', ' cs', 'csa', 'csp']],
    ['📷', ['photography']],
    ['🎬', ['video', 'film', 'animation', 'multimedia']],
    ['🎭', ['theater', 'theatre', 'acting', 'drama']],
    ['🎹', ['piano']],
    ['🎸', ['guitar']],
    ['🎻', ['orchestra']],
    ['🎺', ['band', 'symphonic', 'wind ensemble']],
    ['🎤', ['choir', 'chorus', 'broadcast', 'public speaking']],
    ['🎵', ['music']],
    ['🩰', ['dance', 'ballet', 'jazz']],
    ['📰', ['journalism', 'journal']],
    ['🎨', ['art', 'design', 'drawing', 'painting']],
    ['🏛️', ['government', 'history', 'civics', 'politics', 'apush', 'apgov']],
    ['🌍', ['spanish', 'french', 'german', 'latin', 'geography', 'language']],
    ['🤝', ['sociology', 'mentor', 'leadership']],
    ['🎓', ['college prep', 'act', 'sat', 'preparatory']],
    ['📝', ['writing', 'essay']],
    ['📚', ['english', 'literature', 'literacy', 'reading', 'composition', 'ela']],
  ];
  return rules.find(([, terms]) => terms.some((term) => value.includes(term)))?.[0] ?? '📚';
}
