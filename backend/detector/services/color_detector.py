import cv2
import numpy as np
from PIL import Image

def get_limits(color="yellow"):
    colors = {
        'brown': ([10, 50, 50], [20, 255, 255]),
        'green': ([40, 50, 50], [80, 255, 255]),
        'blue': ([100, 50, 50], [140, 255, 255]),
        'yellow': ([20, 100, 100], [30, 255, 255]),
    }
    return colors.get(color.lower(), ([0, 0, 0], [0, 0, 0]))

def detect_id_color(file):
    image = Image.open(file).convert("RGB")
    frame = np.array(image)
    hsvImage = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)

    colors_to_detect = ['yellow', 'brown', 'green', 'blue']
    max_pixels = 0
    detected_color = "unknown"

    for color in colors_to_detect:
        lowerLimit, upperLimit = get_limits(color)
        mask = cv2.inRange(hsvImage, np.array(lowerLimit), np.array(upperLimit))
        pixel_count = cv2.countNonZero(mask)

        if pixel_count > max_pixels:
            max_pixels = pixel_count
            detected_color = color

    return detected_color

        
    