# HeatCheck

HeatCheck is a basketball shot-tracking app that uses on-device computer vision to automatically detect and log shots in real time without any manual input. Point your phone at the hoop, start a session, and HeatCheck tracks makes, misses, streaks, percentages, and shot location as you shoot.

## How it works

A custom YOLOv8 model (`model/best_float32.tflite`) is trained to detect three objects in each camera frame: the ball, the hoop, and the player. The mobile app runs this model on-device at 30fps using TensorFlow Lite via Core ML. A multi-stage detection pipeline watches for the ball moving above the hoop, passing through it, and appearing below — classifying the result as a make or miss based on trajectory, disappearance, and post-rim ball position. Shot location (left, center, right) is derived from the player's position relative to the hoop center at the moment of release.

## Project structure

```
heat-check/
├── mobile/          # Expo React Native app
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── home/        # Session history, stats
│   │   │   └── profile/     # User info, sign out
│   │   └── (modals)/
│   │       ├── session-form.tsx  # Generate new session
│   │       ├── live.tsx          # Live camera + shot detection
│   │       └── session.tsx       # Session detail + shot chart
│   ├── hooks/
│   │   └── use-shot-detection.ts # Frame processor + detection logic
│   └── components/
├── server/          # Next.js API server
│   ├── app/api/
│   │   ├── auth/    # Apple, Google, token refresh
│   │   ├── sessions/ # CRUD for sessions and shots
│   │   └── home/    # Aggregated stats per user
│   └── db/
│       └── schema.ts  # users, sessions, shots tables
├── shared/          # Shared TypeScript types and constants
└── model/           # YOLOv8 training + Python detection prototype
    ├── best.pt              # PyTorch weights
    ├── best_float32.tflite  # TFLite model used on-device
    └── shot-detection.py    # Python detection algorithm (more accurate, 60fps, not live)
    
```

