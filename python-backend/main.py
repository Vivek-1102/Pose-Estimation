import cv2
import numpy as np
import mediapipe as mp
import base64
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Optional
import logging
import traceback
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize Mediapipe Pose in a more robust way
try:
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    # Initialize pose estimation once and reuse it
    pose = None  # We'll initialize it lazily to avoid startup errors
except Exception as e:
    logger.error(f"Error initializing MediaPipe: {e}")
    traceback.print_exc()

# Angle Calculator
class ClinicalAngleCalculator:
    @staticmethod
    def calculate_angle(p1, p2, p3):
        try:
            angle = np.arctan2(p3[1] - p2[1], p3[0] - p2[0]) - np.arctan2(p1[1] - p2[1], p1[0] - p2[0])
            angle = np.abs(angle * 180.0 / np.pi)
            return 360 - angle if angle > 180 else angle
        except Exception as e:
            logger.error(f"Error calculating angle: {e}")
            return None

    @staticmethod
    def calculate_metric_angles(metric, keypoints, side="right"):
        # Create dictionary of keypoints
        key_dict = {}
        for kp in keypoints:
            key_dict[kp["name"]] = (kp["x"], kp["y"])
        
        logger.info(f"Calculating angle for {metric} ({side} side)")
        
        try:
            if metric == "ankle":
                return ClinicalAngleCalculator.calculate_angle(
                    key_dict["RIGHT_KNEE" if side == "right" else "LEFT_KNEE"], 
                    key_dict["RIGHT_ANKLE" if side == "right" else "LEFT_ANKLE"], 
                    key_dict["RIGHT_FOOT_INDEX" if side == "right" else "LEFT_FOOT_INDEX"]
                )
            elif metric == "knee":
                return ClinicalAngleCalculator.calculate_angle(
                    key_dict["RIGHT_HIP" if side == "right" else "LEFT_HIP"], 
                    key_dict["RIGHT_KNEE" if side == "right" else "LEFT_KNEE"], 
                    key_dict["RIGHT_ANKLE" if side == "right" else "LEFT_ANKLE"]
                )
            elif metric == "hipFlexion":
                hip_key = "RIGHT_HIP" if side == "right" else "LEFT_HIP"
                knee_key = "RIGHT_KNEE" if side == "right" else "LEFT_KNEE"
                imaginary_point = (key_dict[hip_key][0] - (100 if side == "right" else -100), key_dict[hip_key][1])
                return ClinicalAngleCalculator.calculate_angle(key_dict[knee_key], key_dict[hip_key], imaginary_point)
            elif metric == "R1":
                return ClinicalAngleCalculator.calculate_angle(
                    key_dict["RIGHT_ANKLE" if side == "right" else "LEFT_ANKLE"], 
                    key_dict["RIGHT_KNEE" if side == "right" else "LEFT_KNEE"], 
                    key_dict["RIGHT_HIP" if side == "right" else "LEFT_HIP"]
                )
            elif metric == "popliteal":
                knee_key = "RIGHT_KNEE" if side == "right" else "LEFT_KNEE"
                ankle_key = "RIGHT_ANKLE" if side == "right" else "LEFT_ANKLE"
                imaginary_vertical = (key_dict[knee_key][0], key_dict[knee_key][1] - 100)
                return ClinicalAngleCalculator.calculate_angle(key_dict[ankle_key], key_dict[knee_key], imaginary_vertical)
            elif metric == "R2":
                return ClinicalAngleCalculator.calculate_angle(
                    key_dict["RIGHT_ANKLE" if side == "right" else "LEFT_ANKLE"], 
                    key_dict["RIGHT_KNEE" if side == "right" else "LEFT_KNEE"], 
                    key_dict["RIGHT_HIP" if side == "right" else "LEFT_HIP"]
                )
        except KeyError as e:
            logger.error(f"KeyError in {metric}: {e}, available keys: {list(key_dict.keys())}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in calculate_metric_angles: {e}")
            return None

# Preprocess Image
def preprocess_image(file_content: bytes) -> np.ndarray:
    try:
        image = np.frombuffer(file_content, np.uint8)
        img = cv2.imdecode(image, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
        
        # Preserve aspect ratio while resizing
        height, width = img.shape[:2]
        max_dim = 800  # Reduced from 1024 to save memory
        if height > max_dim or width > max_dim:
            if height > width:
                new_height = max_dim
                new_width = int(width * (max_dim / height))
            else:
                new_width = max_dim
                new_height = int(height * (max_dim / width))
            img = cv2.resize(img, (new_width, new_height))
        
        return img
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise

# Convert Image to Base64
def encode_image_to_base64(image: np.ndarray) -> str:
    try:
        _, buffer = cv2.imencode(".jpg", image)  # Using jpg for smaller size
        if buffer is None:
            raise ValueError("Failed to encode image")
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        # Return a simple error image if encoding fails
        error_img = np.zeros((100, 300, 3), dtype=np.uint8)
        cv2.putText(error_img, "Encoding error", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        _, buffer = cv2.imencode(".jpg", error_img)
        return base64.b64encode(buffer).decode("utf-8")

# Draw landmarks and angles on image
def draw_landmarks_and_angles(image, landmarks, angle, metric, side):
    try:
        # Create a copy to avoid modifying the original
        annotated_img = image.copy()
        
        # Draw all pose landmarks if available
        if landmarks:
            mp_drawing.draw_landmarks(
                annotated_img,
                landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=1)
            )
        
        # Draw angle text
        if angle is not None:
            cv2.putText(
                annotated_img,
                f"{metric}: {angle:.1f}°",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2
            )
            cv2.putText(
                annotated_img,
                f"Side: {side}",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2
            )
        
        return annotated_img
    except Exception as e:
        logger.error(f"Error drawing landmarks: {e}")
        # Return original image if drawing fails
        return image

# Health check endpoint
@app.get("/")
async def read_root():
    return {"status": "API is running", "cors": "enabled"}

# Initialize pose model on first API call
def get_pose_model():
    global pose
    if pose is None:
        try:
            pose = mp_pose.Pose(
                static_image_mode=True,
                model_complexity=1,  # Using 1 instead of 2 to reduce memory usage
                min_detection_confidence=0.5,
                enable_segmentation=False
            )
            logger.info("Pose model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize pose model: {e}")
            traceback.print_exc()
    return pose

# Pose Estimation API
@app.post("/analyze-metrics")
async def analyze_metrics(
    ankle: Optional[UploadFile] = File(None),
    knee: Optional[UploadFile] = File(None),
    hipFlexion: Optional[UploadFile] = File(None),
    R1: Optional[UploadFile] = File(None),
    popliteal: Optional[UploadFile] = File(None),
    R2: Optional[UploadFile] = File(None),
    side: str = Form("right")
):
    try:
        # Initialize pose model if not already done
        pose_model = get_pose_model()
        if pose_model is None:
            raise HTTPException(status_code=500, detail="Failed to initialize pose model")
        
        metrics = ["ankle", "knee", "hipFlexion", "R1", "popliteal", "R2"]
        files = {m: locals()[m] for m in metrics if locals()[m] is not None}

        if not files:
            raise HTTPException(status_code=400, detail="No images provided")

        results: Dict[str, Dict] = {}
        logger.info(f"Processing {len(files)} images for side: {side}")

        for metric, file in files.items():
            try:
                logger.info(f"Processing {metric} image")
                # Read the file content
                file_content = await file.read()
                if not file_content:
                    logger.warning(f"Empty file for {metric}")
                    results[metric] = {"error": "Empty file", "angle": None, "image": None}
                    continue
                
                img = preprocess_image(file_content)
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                # Run Pose Estimation - processing one image at a time to avoid memory issues
                results_pose = pose_model.process(img_rgb)
                
                if not results_pose.pose_landmarks:
                    logger.warning(f"No pose detected for {metric}")
                    # Create a basic image with error text
                    cv2.putText(img, "No pose detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
                    encoded_image = encode_image_to_base64(img)
                    results[metric] = {
                        "error": "No pose detected", 
                        "angle": None, 
                        "image": f"data:image/jpeg;base64,{encoded_image}"
                    }
                    continue

                # Extract keypoints with proper names
                keypoints = [
                    {
                        "name": mp_pose.PoseLandmark(i).name,
                        "x": int(lm.x * img.shape[1]),
                        "y": int(lm.y * img.shape[0])
                    }
                    for i, lm in enumerate(results_pose.pose_landmarks.landmark)
                ]

                # Calculate angle
                angle = ClinicalAngleCalculator.calculate_metric_angles(metric, keypoints, side)
                logger.info(f"Calculated angle for {metric}: {angle}")
                
                # Draw landmarks and angle
                annotated_img = draw_landmarks_and_angles(img, results_pose.pose_landmarks, angle, metric, side)
                
                # Encode image
                encoded_image = encode_image_to_base64(annotated_img)

                # Store results
                results[metric] = {
                    "angle": angle,
                    "keypoints": keypoints,
                    "image": f"data:image/jpeg;base64,{encoded_image}"
                }
                logger.info(f"Successfully processed {metric}")
                
                # Explicitly release memory
                del img, img_rgb, annotated_img
                
            except Exception as e:
                logger.error(f"Error processing {metric}: {str(e)}")
                traceback.print_exc()
                
                # Create an error image
                error_img = np.zeros((300, 400, 3), dtype=np.uint8)
                cv2.putText(error_img, f"Error: {str(e)[:30]}...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                encoded_error_img = encode_image_to_base64(error_img)
                
                results[metric] = {
                    "error": str(e), 
                    "angle": None, 
                    "image": f"data:image/jpeg;base64,{encoded_error_img}"
                }

        return results
    except Exception as e:
        logger.error(f"Global error in analyze_metrics: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Run Server
if __name__ == "__main__":
    # Set environment variables to suppress TensorFlow warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU usage
    
    uvicorn.run(app, host="0.0.0.0", port=5000)