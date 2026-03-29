from ultralytics import YOLO
import cv2
import numpy as np

model = YOLO('best.pt')
cap = cv2.VideoCapture('test.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

ball_pos = []
hoop_pos = []
player_pos = []

ball_above = False
ball_below = False
frame_above = 0
frame_below = 0
frame_count = 0
frames_since_ball_seen = 0
saved_hoop = None
saved_ball_at_release = None
saved_player_at_release = None
shot_cooldown = 0
shot_log = []


def frame_to_timestamp(frame_num, fps):
    total_seconds = frame_num / fps
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f'{minutes}:{seconds:05.2f}'


def get_zone(ball_at_release, player_at_release, hoop_at_shot):
    # uses player x position relative to hoop, falls back to ball
    if hoop_at_shot is None:
        return 'Unknown'

    hoop_cx = hoop_at_shot[0][0]
    hoop_w = hoop_at_shot[2]

    if player_at_release is not None:
        ref_cx = player_at_release[0][0]
    elif ball_at_release is not None:
        ref_cx = ball_at_release[0][0]
    else:
        return 'Unknown'

    h_ratio = (ref_cx - hoop_cx) / hoop_w

    if h_ratio < -1.5:
        return 'Left'
    elif h_ratio > 1.5:
        return 'Right'
    else:
        return 'Center'


def detect_above(ball_pos, hoop_pos):
    # ball must be above hoop and moving upward (not just passing by)
    if len(ball_pos) < 3 or not hoop_pos:
        return False

    hoop_cx, hoop_cy = hoop_pos[-1][0]
    hoop_w = hoop_pos[-1][2]
    hoop_h = hoop_pos[-1][3]
    bx, by = ball_pos[-1][0]

    in_x = hoop_cx - 4 * hoop_w < bx < hoop_cx + 4 * hoop_w
    in_y = hoop_cy - 2 * hoop_h < by < hoop_cy
    if not (in_x and in_y):
        return False

    recent = ball_pos[-3:]
    upward_count = sum(
        1 for i in range(1, len(recent))
        if recent[i][0][1] < recent[i - 1][0][1]
    )
    return upward_count >= 1


def detect_below(ball_pos, hoop_pos):
    if not ball_pos or not hoop_pos:
        return False
    hoop_cy = hoop_pos[-1][0][1]
    hoop_h = hoop_pos[-1][3]
    by = ball_pos[-1][0][1]
    return by > hoop_cy + 0.5 * hoop_h


def detect_shot(ball_above, ball_below, frame_above, frame_below):
    return ball_above and ball_below and frame_above < frame_below


def detect_make(ball_pos, saved_hoop, frame_above, frame_below):
    # two methods — either one returning true = make
    #   1. trajectory: ball stays in tight corridor below hoop (clean swish)
    #   2. disappearance: ball vanishes near rim, reappears centered below (net occlusion)
    if saved_hoop is None:
        return False

    hoop_cx, hoop_cy = saved_hoop[0]
    hoop_w = saved_hoop[2]
    hoop_h = saved_hoop[3]

    # method 1: trajectory check
    post_rim_balls = [b for b in ball_pos if frame_below <= b[1] <= frame_below + 12]
    trajectory_make = False

    if len(post_rim_balls) >= 2:
        max_lateral_offset = max(abs(b[0][0] - hoop_cx) for b in post_rim_balls)
        stayed_narrow = max_lateral_offset < hoop_w * 0.75

        first_y = post_rim_balls[0][0][1]
        last_y = post_rim_balls[-1][0][1]
        moved_down = last_y >= first_y

        avg_x = np.mean([b[0][0] for b in post_rim_balls])
        centered = abs(avg_x - hoop_cx) < hoop_w * 0.6

        trajectory_make = stayed_narrow and moved_down and centered

    # method 2: disappearance near rim
    shot_balls = [b for b in ball_pos if frame_above <= b[1] <= frame_below + 15]

    # last ball detected near the rim (within 1.5 hoop-heights above, horizontally close)
    last_near_rim = None
    for b in reversed(shot_balls):
        by = b[0][1]
        bx = b[0][0]
        near_v = hoop_cy - 1.5 * hoop_h < by < hoop_cy
        near_h = abs(bx - hoop_cx) < hoop_w * 1.5
        if near_v and near_h:
            last_near_rim = b
            break

    # first ball detected below rim
    first_below = None
    for b in shot_balls:
        if b[0][1] > hoop_cy + 0.5 * hoop_h:
            first_below = b
            break

    disappearance_make = False
    if last_near_rim and first_below:
        frame_gap = first_below[1] - last_near_rim[1]
        gap_detections = len([b for b in shot_balls
                              if last_near_rim[1] < b[1] < first_below[1]])
        missing_frames = frame_gap - gap_detections

        first_bx = first_below[0][0]
        near_hoop_below = abs(first_bx - hoop_cx) < hoop_w * 0.6

        disappearance_make = missing_frames >= 3 and near_hoop_below

    return trajectory_make or disappearance_make


while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, conf=0.4, verbose=False)

    current_ball = None
    current_hoop = None
    current_player = None

    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            w = x2 - x1
            h = y2 - y1

            if cls == 1 and conf > 0.3:
                current_ball = ((cx, cy), frame_count, w, h, conf)
            elif cls == 2 and conf > 0.5:
                current_hoop = ((cx, cy), frame_count, w, h, conf)
            elif cls == 3 and conf > 0.4:
                current_player = ((cx, cy), frame_count, w, h, conf)

    if current_ball:
        ball_pos.append(current_ball)
        frames_since_ball_seen = 0
    else:
        frames_since_ball_seen += 1

    if current_hoop:
        hoop_pos.append(current_hoop)

    if current_player:
        player_pos.append(current_player)

    if len(ball_pos) > 120:
        ball_pos.pop(0)
    if len(hoop_pos) > 25:
        hoop_pos.pop(0)
    if len(player_pos) > 10:
        player_pos.pop(0)

    if shot_cooldown > 0:
        shot_cooldown -= 1
    elif hoop_pos and ball_pos:
        if not ball_above:
            ball_above = detect_above(ball_pos, hoop_pos)
            if ball_above:
                frame_above = frame_count
                saved_ball_at_release = ball_pos[-1] if ball_pos else None
                # save hoop now while it's visible (before ball occludes it)
                saved_hoop = hoop_pos[-1] if hoop_pos else None
                saved_player_at_release = player_pos[-1] if player_pos else None

        # keep looking for player if we missed it at release
        if ball_above and saved_player_at_release is None and player_pos:
            saved_player_at_release = player_pos[-1]

        if ball_above and not ball_below:
            # use saved hoop since current hoop may be occluded by ball
            if saved_hoop:
                ball_below = detect_below(ball_pos, [saved_hoop])
            if ball_below:
                frame_below = frame_count

        if detect_shot(ball_above, ball_below, frame_above, frame_below):
            # wait 12 frames after ball-below for post-rim trajectory data
            if frame_count - frame_below >= 12:
                zone = get_zone(saved_ball_at_release, saved_player_at_release,
                                saved_hoop)
                made = detect_make(ball_pos, saved_hoop, frame_above, frame_below)
                result = 'MAKE' if made else 'MISS'
                timestamp = frame_to_timestamp(frame_count, fps)

                shot_log.append({
                    'frame': frame_count,
                    'timestamp': timestamp,
                    'result': result,
                    'zone': zone,
                })

                ball_above = False
                ball_below = False
                saved_hoop = None
                saved_ball_at_release = None
                saved_player_at_release = None
                frames_since_ball_seen = 0
                shot_cooldown = int(fps * 1.5)

    frame_count += 1

cap.release()

makes = sum(1 for s in shot_log if s['result'] == 'MAKE')
misses = sum(1 for s in shot_log if s['result'] == 'MISS')
print(f'Shots: {len(shot_log)} | Makes: {makes} | Misses: {misses}')
for i, s in enumerate(shot_log, 1):
    print(f'  {i}. {s["timestamp"]} | {s["result"]} | {s["zone"]}')