import { AUDIO_KINDS } from "./audioTypes";

const KINDS = Object.values(AUDIO_KINDS);
const DESCRIPTOR_DEFAULTS = Object.freeze({ gain: 1, maxVoices: 4, cooldownMs: 0, loopStart: 0, loopEnd: 0 });
const DESCRIPTOR_FIELDS = new Set(["key", "kind", "url", "preload", "loop", ...Object.keys(DESCRIPTOR_DEFAULTS)]);

const isNonNegative = (value) => Number.isFinite(value) && value >= 0;

function findProblem(descriptor) {
  const unknownField = Object.keys(descriptor).find((field) => !DESCRIPTOR_FIELDS.has(field));
  if (unknownField) return `unknown field "${unknownField}"`;
  if (typeof descriptor.key !== "string" || descriptor.key === "") return "key must be a non-empty string";
  if (!KINDS.includes(descriptor.kind)) return `kind must be one of ${KINDS.join(", ")}`;
  if (typeof descriptor.url !== "string" || descriptor.url === "") return "url must be a non-empty string";
  if (!isNonNegative(descriptor.gain) || descriptor.gain > 1) return "gain must be between 0 and 1";
  if (typeof descriptor.preload !== "boolean") return "preload must be a boolean";
  if (!Number.isInteger(descriptor.maxVoices) || descriptor.maxVoices < 1) return "maxVoices must be a positive integer";
  if (!isNonNegative(descriptor.cooldownMs)) return "cooldownMs must be zero or more";
  if (!isNonNegative(descriptor.loopStart) || !isNonNegative(descriptor.loopEnd)) return "loopStart and loopEnd must be zero or more";
  if (descriptor.loopEnd > 0 && descriptor.loopEnd <= descriptor.loopStart) return "loopEnd must come after loopStart";
  if (descriptor.kind !== AUDIO_KINDS.MUSIC && "loop" in descriptor) return "loop applies to music only";
  if (descriptor.kind === AUDIO_KINDS.MUSIC && typeof descriptor.loop !== "boolean") return "loop must be a boolean";
  return null;
}

function normalizeDescriptor(input) {
  const isMusic = input?.kind === AUDIO_KINDS.MUSIC;
  const descriptor = { ...DESCRIPTOR_DEFAULTS, preload: !isMusic, ...(isMusic && { loop: true }), ...input };
  const problem = findProblem(descriptor);
  if (problem) throw new Error(`Invalid audio descriptor "${descriptor.key}": ${problem}`);
  return Object.freeze(descriptor);
}

const isSameDescriptor = (a, b) => Object.keys(a).every((field) => a[field] === b[field]);

export function createAudioRegistry() {
  const descriptors = new Map();

  return {
    register(manifest) {
      const incoming = new Map();
      manifest.map(normalizeDescriptor).forEach((descriptor) => {
        if (incoming.has(descriptor.key)) throw new Error(`Duplicate audio key "${descriptor.key}" in one manifest`);
        const existing = descriptors.get(descriptor.key);
        if (existing && !isSameDescriptor(existing, descriptor)) {
          throw new Error(`Audio key "${descriptor.key}" is already registered with another asset`);
        }
        incoming.set(descriptor.key, descriptor);
      });
      incoming.forEach((descriptor, key) => descriptors.set(key, descriptor));
    },
    get: (key) => descriptors.get(key) ?? null,
    list: () => [...descriptors.values()],
  };
}
