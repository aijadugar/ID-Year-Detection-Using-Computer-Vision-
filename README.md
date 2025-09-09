# ID-Year-Detection-Using-Computer-Vision

This project is a **real-time student year detection system** that uses **Computer Vision + AI** to detect the color of a student’s college ID card and determine their current year of study.

## 🎯 Project Goal
To assist lab assistants and teachers in quickly identifying which year students belong to during lab sessions, ensuring smooth management and organization.

## ⚡ Features
- Real-time ID card color detection using webcam.
- Detects 4 ID colors:
  - 🟤 **Brown → First Year Student**
  - 🟢 **Green → Second Year Student**
  - 🔵 **Blue → Third Year Student**
  - 🟡 **Yellow → Fourth Year Student**
- Audio feedback with speech synthesis for detected year.
- Detection history with animations.
- Responsive Next.js frontend built with **shadcn/ui + Tailwind CSS**.
- Backend powered by **Django** for handling image processing & detection.

## 🛠️ Tech Stack
- **Frontend**: Next.js, Tailwind CSS, shadcn/ui  
- **Backend**: Django (REST API)  
- **Computer Vision**: OpenCV, AI-based color detection  
- **Deployment**: Vercel (Frontend) + Render (Backend)  

## 📦 Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/ID-Year-Detection-Using-Computer-Vision.git
   cd ID-Year-Detection-Using-Computer-Vision
