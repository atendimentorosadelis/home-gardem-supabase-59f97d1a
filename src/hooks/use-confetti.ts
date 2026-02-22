import confetti from 'canvas-confetti';

export function useConfetti() {
  const fireConfetti = () => {
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#DCFCE7'] });
      setTimeout(() => { try { confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22C55E', '#16A34A', '#4ADE80'] }); } catch { /* ignore */ } }, 150);
      setTimeout(() => { try { confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22C55E', '#16A34A', '#4ADE80'] }); } catch { /* ignore */ } }, 300);
    } catch { /* ignore */ }
  };
  return { fireConfetti };
}
