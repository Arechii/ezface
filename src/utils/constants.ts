export const MODELS = [
  "VGG-Face",
  "FaceNet",
  "FaceNet512",
  "DeepFace",
  "DeepID",
  "ArcFace",
  "Dlib",
  "OpenFace",
  "SFace",
] as const;

export const DETECTORS = [
  "OpenCV",
  "MTCNN",
  "RetinaFace",
  "Mediapipe",
  "Dlib",
  "SSD",
] as const;

export const DISTANCE_METRICS = ["Cosine", "Euclidean"] as const;

export const DATABASES = ["PostgreSQL", "Qdrant", "Redis"] as const;

// ripped from https://github.com/serengil/deepface/blob/master/deepface/commons/distance.py#L32
export const THRESHOLDS: Record<
  (typeof MODELS)[number],
  Record<(typeof DISTANCE_METRICS)[number], number>
> = {
  "VGG-Face": { Cosine: 0.4, Euclidean: 0.86 },
  FaceNet: { Cosine: 0.4, Euclidean: 0.8 },
  FaceNet512: { Cosine: 0.3, Euclidean: 1.04 },
  DeepFace: { Cosine: 0.23, Euclidean: 0.64 },
  DeepID: { Cosine: 0.015, Euclidean: 0.17 },
  ArcFace: { Cosine: 0.68, Euclidean: 1.13 },
  Dlib: { Cosine: 0.07, Euclidean: 0.4 },
  OpenFace: { Cosine: 0.1, Euclidean: 0.55 },
  SFace: { Cosine: 0.593, Euclidean: 1.055 },
};
