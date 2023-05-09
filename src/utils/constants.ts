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

export const SIMILARITY_METRICS = ["Cosine", "Euclidean"] as const;

export const DATABASES = ["PostgreSQL", "Qdrant", "Pinecone"] as const;
