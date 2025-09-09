import cv2
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def detect(request):
    if request.method == "POST":
        if "image" not in request.FILES:
            return JsonResponse({"error": "No image uploaded"}, status=400)

        image_file = request.FILES["image"]
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return JsonResponse({"error": "Invalid image format"}, status=400)

        # Resize for performance
        resized = cv2.resize(img, (200, 200))

        # Convert to HSV
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)

        # Define HSV ranges
        color_ranges = {
            "Brown": [(10, 100, 20), (20, 255, 200)],   # tweak if needed
            "Green": [(35, 50, 50), (85, 255, 255)],
            "Blue": [(90, 50, 50), (130, 255, 255)],
            "Yellow": [(20, 100, 100), (30, 255, 255)],
        }

        detected_color = "Unknown"
        max_pixels = 0

        for color_name, (lower, upper) in color_ranges.items():
            lower_np = np.array(lower, dtype=np.uint8)
            upper_np = np.array(upper, dtype=np.uint8)
            mask = cv2.inRange(hsv, lower_np, upper_np)
            count = cv2.countNonZero(mask)

            if count > max_pixels:  # Pick the color with largest pixel count
                max_pixels = count
                detected_color = color_name

        return JsonResponse({
            "detected_color": detected_color,
            "pixel_count": int(max_pixels)  # int for JSON serialization
        })

    return JsonResponse({"error": "Invalid request"}, status=400)
