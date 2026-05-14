import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;

export async function loadSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/complete.wav'),
      { shouldPlay: false }
    );
    soundObject = sound;
  } catch (e) {
    console.warn('Sound failed to load:', e);
  }
}

export async function playCompleteSound(): Promise<void> {
  try {
    if (!soundObject) await loadSound();
    if (!soundObject) return;

    // Rewind to start in case it was played before
    await soundObject.setPositionAsync(0);
    await soundObject.playAsync();
  } catch (e) {
    console.warn('Sound failed to play:', e);
  }
}

export async function unloadSound(): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }
  } catch (e) {
    console.warn('Sound failed to unload:', e);
  }
}