# ezface

> This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

This app functions as a proof of concept for trying out various facial recognition models in combination with several facial detection models, distance metrics and databases.

Models:

- VGG-Face
- Facenet
- Facenet512
- DeepFace
- DeepID
- ArcFace
- Dlib
- OpenFace
- SFace

Detectors:

- OpenCV
- MTCNN
- RetinaFace
- Mediapipe
- Dlib
- SSD

Distance metrics:

- Cosine
- Euclidean

Databases:

- PostgreSQL
- Qdrant
- Redis

## Deployment

### Prerequisites

- Node.js
- Docker
- [uploadthing](https://uploadthing.com/) account

### Local

Copy `.env.example` to `.env` and configure the variables

```bash
npm install
docker compose up -d
npx prisma db push
npm run dev
```

## Acknowledgements

- [t3](https://create.t3.gg)
- [deepface](https://github.com/serengil/deepface)
- [uploadthing](https://uploadthing.com/)
