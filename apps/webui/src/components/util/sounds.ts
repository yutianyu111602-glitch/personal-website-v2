// Type for the sound types we support
export type SoundType = 'reminder' | 'confirmation' | 'completion';

// Audio context for sound creation
let audioContext: AudioContext | null = null;

// Initialize audio context (browser policies require user interaction)
export const initAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play completion sound (when a reminder is marked as done)
export const playCompletionSound = () => {
  if (!audioContext) return;
  
  // Create audio nodes
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.value = 0.12; // Soft volume
  
  // Create a gentle completion sound
  const createCompletionTone = (freq: number, type: OscillatorType, delay: number, gainValue: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    // Create a gentle envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(gainValue, now + delay + 0.08);
    
    // Gentle decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    
    // Schedule the oscillator
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  };
  
  // Base frequency - A4 (440 Hz) - pleasing "success" sound
  const baseFreq = 440;
  
  // Create tones in an upward pattern (signifying completion)
  createCompletionTone(baseFreq, 'sine', 0, 0.3, 0.7);
  createCompletionTone(baseFreq * 1.25, 'sine', 0.1, 0.2, 0.6); // Major third up
  createCompletionTone(baseFreq * 1.5, 'sine', 0.2, 0.15, 0.5); // Perfect fifth up
};