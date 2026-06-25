import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AUDIO_DIR = join(ROOT, "public", "audio");
const SAMPLE_RATE = 22_050;
const TWO_PI = Math.PI * 2;

function clamp(value, min = -1, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function midiToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function sine(frequency, time) {
  return Math.sin(TWO_PI * frequency * time);
}

function triangle(frequency, time) {
  return (2 / Math.PI) * Math.asin(sine(frequency, time));
}

function envelope(time, start, length, attack = 0.012, release = 0.16) {
  const age = time - start;
  if (age < 0 || age > length) {
    return 0;
  }
  if (age < attack) {
    return age / attack;
  }

  const releaseStart = Math.max(attack, length - release);
  if (age > releaseStart) {
    return Math.max(0, (length - age) / release);
  }

  return 1;
}

function addTone(samples, start, length, frequency, volume, wave = triangle, attack, release) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(samples.length, Math.floor((start + length) * SAMPLE_RATE));

  for (let index = startIndex; index < endIndex; index += 1) {
    const time = index / SAMPLE_RATE;
    const age = time - start;
    const amp = envelope(time, start, length, attack, release);
    samples[index] += wave(frequency, age) * amp * volume;
  }
}

function addNoise(samples, start, length, volume, seed = 1) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(samples.length, Math.floor((start + length) * SAMPLE_RATE));
  let state = seed;

  for (let index = startIndex; index < endIndex; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const time = index / SAMPLE_RATE;
    const amp = envelope(time, start, length, 0.001, length * 0.85);
    samples[index] += (((state / 2 ** 32) * 2 - 1) * amp * volume);
  }
}

function normalize(samples, target = 0.92) {
  const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  if (peak === 0) {
    return samples;
  }

  return samples.map((sample) => clamp((sample / peak) * target));
}

function writeWav(fileName, samples) {
  mkdirSync(AUDIO_DIR, { recursive: true });

  const normalized = normalize(samples);
  const dataSize = normalized.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < normalized.length; index += 1) {
    buffer.writeInt16LE(Math.round(clamp(normalized[index]) * 32767), 44 + index * 2);
  }

  writeFileSync(join(AUDIO_DIR, fileName), buffer);
}

function createSamples(seconds) {
  return new Array(Math.ceil(seconds * SAMPLE_RATE)).fill(0);
}

function generateLoop() {
  const bpm = 96;
  const beat = 60 / bpm;
  const bars = 8;
  const duration = bars * 4 * beat;
  const samples = createSamples(duration);
  const melody = [72, 74, 75, 79, 77, 75, 74, 70, 72, 75, 77, 82, 80, 77, 75, 74];
  const bass = [48, 48, 53, 53, 55, 55, 51, 51];
  const harmony = [60, 63, 67, 65, 68, 72, 67, 70, 74, 63, 67, 72, 58, 62, 65, 70];

  for (let bar = 0; bar < bars; bar += 1) {
    const barStart = bar * 4 * beat;
    const bassNote = midiToFrequency(bass[bar]);

    for (let quarter = 0; quarter < 4; quarter += 1) {
      const beatStart = barStart + quarter * beat;
      addTone(samples, beatStart, beat * 0.54, bassNote / (quarter === 2 ? 1 : 2), 0.22, sine, 0.006, 0.2);
      addNoise(samples, beatStart, 0.035, quarter === 0 ? 0.1 : 0.055, 40 + bar * 8 + quarter);
      addTone(samples, beatStart + beat * 0.5, 0.045, 130, 0.08, sine, 0.001, 0.025);
    }

    for (let step = 0; step < 4; step += 1) {
      const start = barStart + step * beat;
      const noteIndex = (bar * 2 + step) % melody.length;
      const lead = midiToFrequency(melody[noteIndex]);
      const accent = step === 0 ? 1 : 0.8;

      addTone(samples, start, beat * 0.72, lead, 0.2 * accent, triangle, 0.014, 0.22);
      addTone(samples, start, beat * 0.72, lead * 2, 0.055 * accent, sine, 0.014, 0.18);
      addTone(samples, start + beat * 0.5, beat * 0.34, midiToFrequency(harmony[noteIndex]), 0.08, triangle, 0.01, 0.14);
    }
  }

  return samples;
}

function generateCorrect() {
  const samples = createSamples(0.9);
  [72, 76, 79, 84].forEach((note, index) => {
    addTone(samples, index * 0.11, 0.42, midiToFrequency(note), 0.34, triangle, 0.005, 0.2);
  });
  addTone(samples, 0.46, 0.34, midiToFrequency(91), 0.13, sine, 0.005, 0.26);

  return samples;
}

function generateWrong() {
  const samples = createSamples(0.82);
  [67, 63, 60].forEach((note, index) => {
    addTone(samples, index * 0.12, 0.34, midiToFrequency(note), 0.24, triangle, 0.006, 0.16);
  });
  addNoise(samples, 0.08, 0.12, 0.05, 91);

  return samples;
}

function generateWin() {
  const samples = createSamples(3.2);
  const notes = [72, 76, 79, 84, 86, 84, 79, 88];

  notes.forEach((note, index) => {
    const start = index * 0.22;
    addTone(samples, start, 0.7, midiToFrequency(note), 0.27, triangle, 0.008, 0.28);
    addTone(samples, start, 0.7, midiToFrequency(note - 12), 0.09, sine, 0.008, 0.26);
  });

  [60, 64, 67, 72].forEach((note, index) => {
    addTone(samples, 1.75, 1.2, midiToFrequency(note), 0.11 - index * 0.01, sine, 0.02, 0.7);
  });
  addNoise(samples, 1.72, 0.18, 0.08, 123);

  return samples;
}

writeWav("nonogarm-loop.wav", generateLoop());
writeWav("correct.wav", generateCorrect());
writeWav("wrong.wav", generateWrong());
writeWav("win.wav", generateWin());
