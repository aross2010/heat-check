import subprocess
from ultralytics import YOLO
from pathlib import Path

# break original test video into three parts

BASE = Path(__file__).parent / 'model'

result = subprocess.run(
    ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{BASE}/test.mp4'],
    capture_output=True, text=True
)
duration = float(result.stdout.strip())
segment_duration = duration / 3

subprocess.run([
    'ffmpeg', '-i', f'{BASE}/test.mp4',
    '-f', 'segment',
    '-segment_time', str(segment_duration),
    '-c', 'copy',
    f'{BASE}/part%d.mp4'
])

model = YOLO(f'{BASE}/best.pt')

for i in range(3):
    part_path = f'{BASE}/part{i}.mp4'
    print(f'\nProcessing part {i}...')
    results = model.predict(
        source=part_path,
        save=True,
        conf=0.5,
        stream=True,
        imgsz=640,
        show_labels=True,
        show_conf=True,
        project=BASE,
        name=f'output_part{i}',
    )
    for r in results:
        pass