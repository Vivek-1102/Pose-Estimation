import os
import io
import base64
import numpy as np
import cv2
import mediapipe as mp
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

class ClinicalAngleCalculator:
    @staticmethod
    def calculate_angle(p1, p2, p3):
        """
        Calculate angle between three points
        :param p1: First point (dict with x, y)
        :param p2: Vertex point (dict with x, y)
        :param p3: Third point (dict with x, y)
        :return: Angle in degrees
        """
        radian = math.atan2(p3['y'] - p2['y'], p3['x'] - p2['x']) - \
                 math.atan2(p1['y'] - p2['y'], p1['x'] - p2['x'])
        angle = abs((radian * 180) / math.pi)
        return min(angle, 360 - angle)

    @staticmethod
    def calculate_metric_angles(metric, keypoints, side='right'):
        """
        Calculate angles for specific metrics
        :param metric: Metric to calculate
        :param keypoints: List of detected keypoints
        :param side: Side of the body (right/left)
        :return: Calculated angle
        """
        prefix = 'right_' if side == 'right' else 'left_'
        
        def get_point(name):
            return next((kp for kp in keypoints if kp['name'] == f"{prefix}{name}"), None)
        
        metrics = {
            'ankle': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('knee'), get_point('ankle'), get_point('foot_index')
            ),
            'knee': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('hip'), get_point('knee'), get_point('ankle')
            ),
            'hipFlexion': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('knee'), 
                get_point('hip'), 
                {'x': get_point('hip')['x'] + (100 if side == 'right' else -100), 
                 'y': get_point('hip')['y']}
            ),
            'R1': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('ankle'), get_point('knee'), get_point('hip')
            ),
            'popliteal': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('ankle'), 
                get_point('knee'), 
                {'x': get_point('knee')['x'], 'y': get_point('knee')['y'] - 100}
            ),
            'R2': lambda: ClinicalAngleCalculator.calculate_angle(
                get_point('ankle'), get_point('knee'), get_point('hip')
            )
        }
        
        return metrics[metric]() if metric in metrics else None

def preprocess_image(image_buffer):
    """
    Preprocess the input image for pose estimation
    :param image_buffer: Image buffer
    :return: Preprocessed image
    """
    # Convert buffer to numpy array
    nparr = np.frombuffer(image_buffer, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Resize and normalize
    img = cv2.resize(img, (640, 480))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    return img

def draw_annotations(keypoints, image, metric, angle, side):
    """
    Draw keypoints, lines and angle on the image
    :param keypoints: List of detected keypoints
    :param image: Image to draw on
    :param metric: Current metric being processed
    :param angle: Calculated angle
    :param side: Side of the body
    :return: Annotated image
    """
    # Convert image back to BGR for drawing
    image_draw = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    # Draw keypoints
    for kp in keypoints:
        x, y = int(kp['x']), int(kp['y'])
        cv2.circle(image_draw, (x, y), 5, (0, 255, 0), -1)
    
    # Add angle text
    cv2.putText(image_draw, 
                f"{metric} Angle: {angle:.2f}°", 
                (50, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                (255, 0, 0), 
                2)
    
    return image_draw

def get_metric_keypoints(metric, side='right'):
    """
    Get required keypoints for a specific metric
    :param metric: Metric to get keypoints for
    :param side: Side of the body
    :return: List of required keypoint names
    """
    prefix = 'right_' if side == 'right' else 'left_'
    
    metric_keypoints = {
        'ankle': [f"{prefix}knee", f"{prefix}ankle", f"{prefix}foot_index"],
        'knee': [f"{prefix}hip", f"{prefix}knee", f"{prefix}ankle"],
        'hipFlexion': [f"{prefix}knee", f"{prefix}hip"],
        'R1': [f"{prefix}ankle", f"{prefix}knee", f"{prefix}hip"],
        'popliteal': [f"{prefix}ankle", f"{prefix}knee"],
        'R2': [f"{prefix}ankle", f"{prefix}knee", f"{prefix}hip"]
    }
    
    return metric_keypoints.get(metric, [])

# Flask App Setup
app = Flask(__name__)
CORS(app)

# MediaPipe Pose Estimation Setup
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True, 
    model_complexity=2, 
    enable_segmentation=True, 
    min_detection_confidence=0.5
)

@app.route('/analyze-metrics', methods=['POST'])
def analyze_metrics():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    side = request.form.get('side', 'right')
    results = {}
    
    required_metrics = ['ankle', 'knee', 'hipFlexion', 'R1', 'popliteal', 'R2']
    
    for metric in required_metrics:
        file = request.files.get(f"{metric}")
        if not file:
            results[metric] = {"error": "No image provided"}
            continue
        
        # Read image 
        img_bytes = file.read()
        processed_img = preprocess_image(img_bytes)
        
        # Estimate pose
        results_pose = pose.process(processed_img)
        
        if not results_pose.pose_landmarks:
            results[metric] = {"error": "No pose detected"}
            continue
        
        # Convert keypoints
        keypoints = [
            {
                'name': mp_pose.PoseLandmark(i).name.lower(), 
                'x': landmark.x * processed_img.shape[1], 
                'y': landmark.y * processed_img.shape[0],
                'score': landmark.visibility
            } 
            for i, landmark in enumerate(results_pose.pose_landmarks.landmark)
        ]
        
        # Filter and validate keypoints
        metric_kp_names = get_metric_keypoints(metric, side)
        filtered_keypoints = [kp for kp in keypoints if kp['name'] in metric_kp_names]
        
        if len(filtered_keypoints) < len(metric_kp_names):
            results[metric] = {"error": "Insufficient keypoints"}
            continue
        
        # Calculate angle
        angle = ClinicalAngleCalculator.calculate_metric_angles(metric, keypoints, side)
        
        # Draw annotations
        annotated_img = draw_annotations(filtered_keypoints, processed_img, metric, angle, side)
        
        # Convert image to base64
        _, buffer = cv2.imencode('.png', annotated_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        results[metric] = {
            'angle': angle,
            'image': f"data:image/png;base64,{img_base64}"
        }
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)