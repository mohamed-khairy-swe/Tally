import timerCompleteUrl from "../assets/sounds/mixkit-software-interface-back-2575.mp3";

let completionAudio: HTMLAudioElement | null = null;

/**
 * Plays the baked-in "timer finished" sound.
 *
 * The same audio element is reused: if the sound is still playing when
 * another timer finishes, it simply restarts. Failing to play (for
 * example, a missing audio device) must never break the timer, so every
 * error is caught and only logged.
 */
export function playCompletionSound(): void {
  try {
    if (completionAudio === null) {
      completionAudio = new Audio(timerCompleteUrl);
    }

    completionAudio.currentTime = 0;

    void completionAudio.play().catch((error: unknown) => {
      console.warn("Tally: could not play the completion sound.", error);
    });
  } catch (error) {
    console.warn("Tally: could not play the completion sound.", error);
  }
}