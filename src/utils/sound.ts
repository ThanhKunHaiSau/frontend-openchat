/**
 * Phát âm thanh thông báo nhẹ nhàng bằng Web Audio API
 * Không cần tải file mp3 bên ngoài, hoạt động mượt mà và tức thì.
 */
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Hai nốt nhạc dịu nhẹ: D5 -> A5
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Bỏ qua nếu trình duyệt chưa kích hoạt tương tác âm thanh
  }
};

