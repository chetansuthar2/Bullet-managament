# 🚗 Vehicle Repair Management System

A modern, full-stack web application for managing vehicle repair services with real-time data synchronization and cloud storage.

## 🎯 Live Demo

🌐 **Live Application**:
(https://vehicle-managament.vercel.app/)

## 🌟 Features

### Core Functionality
- **🔐 User Authentication** - Secure login/signup with Clerk
- **📝 Repair Entry Management** - Create, update, and track repair entries
- **📸 Image Upload** - Upload and manage vehicle images with MongoDB GridFS
- **📊 Status Tracking** - Track repair status (Pending/Delivered)
- **💰 Billing System** - Manage parts, pricing, and advance payments
- **🔍 Search & Filter** - Find entries by customer, vehicle, or date
- **📄 PDF Generation** - Generate repair bills and invoices

### Technical Features
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **☁️ Hybrid Cloud Storage** - Firebase for data + MongoDB Atlas for images
- **⚡ Real-time Updates** - Live data synchronization with Firebase
- **🚀 Production Ready** - Deployed on Vercel with auto-scaling
- **🔒 Secure** - Environment-based configuration and data isolation
- **📈 Scalable** - Built to handle growing business needs

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components
- **React Hook Form** - Form management with validation

### Backend & Database
- **Firebase Firestore** - Real-time database for repair entries
- **MongoDB Atlas** - Cloud database for image storage (GridFS)
- **Clerk** - Authentication and user management
- **Vercel** - Serverless deployment platform

### Storage Architecture
- **Repair Entries** → Firebase Firestore (real-time sync)
- **Company Details** → Firebase Firestore (user settings)
- **Images** → MongoDB Atlas GridFS (optimized storage)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Firebase account
- MongoDB Atlas account
- Clerk account

### 1. Clone Repository
```bash
git clone <repository-url>
cd vehicle-repair-management
npm install
```

### 2. Service Setup

#### A. Clerk Authentication Setup
1. Go to [clerk.dev](https://clerk.dev) and create account
2. Create new application
3. Copy API keys from dashboard

#### B. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Firestore Database
4. Copy configuration from Project Settings

#### C. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster (M0 tier)
3. Create database user
4. Configure network access (allow 0.0.0.0/0)
5. Get connection string

### 3. Environment Configuration
Create `.env.local` file in root directory:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB Atlas (for image storage)
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/VehicleRepairDB

# Storage Configuration
NEXT_PUBLIC_STORAGE_TYPE=hybrid
NEXT_PUBLIC_DATA_STORAGE=firebase
NEXT_PUBLIC_IMAGE_STORAGE=mongodb
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── repair-entries/ # Repair CRUD operations
│   │   ├── upload-image/  # Image upload handler
│   │   ├── images/[id]/   # Image serving endpoint
│   │   └── test-db/       # Database connection test
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   ├── dashboard/         # Dashboard page
│   └── page.tsx           # Main application page
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── firebaseStorage.ts # Firebase Firestore operations
│   ├── mongodb.ts         # MongoDB connection
│   └── mongoImageStorage.ts # MongoDB GridFS operations
├── components/            # Reusable UI components
└── public/               # Static assets
```

## 🔧 API Endpoints

### Repair Entries
- `GET /api/repair-entries?userId={id}` - Get user's repair entries
- `POST /api/repair-entries` - Create new repair entry
- `PUT /api/repair-entries` - Update repair entry
- `DELETE /api/repair-entries?id={id}` - Delete repair entry

### Images
- `POST /api/upload-image` - Upload vehicle image
- `GET /api/images/[id]` - Serve image by ID
- `DELETE /api/images/[id]` - Delete image

### Utilities
- `GET /api/test-db` - Test database connections
- `GET /api/data-summary` - Get storage statistics

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables

3. **Environment Variables**
Add these in Vercel dashboard:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_value
CLERK_SECRET_KEY=your_value
NEXT_PUBLIC_FIREBASE_API_KEY=your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
NEXT_PUBLIC_FIREBASE_APP_ID=your_value
MONGODB_ATLAS_URI=your_atlas_connection_string
NEXT_PUBLIC_STORAGE_TYPE=hybrid
NEXT_PUBLIC_DATA_STORAGE=firebase
NEXT_PUBLIC_IMAGE_STORAGE=mongodb
```

4. **Deploy**
- Click "Deploy"
- Your app will be live at `https://your-app.vercel.app`

## 🔒 Security Features

- **Authentication** - Secure user authentication with Clerk
- **Data Isolation** - User data is isolated by userId
- **Environment Variables** - Sensitive data stored securely
- **HTTPS** - All communications encrypted
- **Input Validation** - Form data validated on client and server

## 📱 Mobile Responsive

- **Responsive Design** - Works on all screen sizes
- **Touch Friendly** - Optimized for mobile interactions
- **Fast Loading** - Optimized images and code splitting
- **Offline Support** - Basic offline functionality

## 🧪 Testing

### Database Connection Test
```bash
# Visit in browser to test connections
http://localhost:3000/api/test-db

# Check data summary
http://localhost:3000/api/data-summary
```

### Build Test
```bash
npm run build
npm run start
```

### Manual Testing Checklist
- [ ] User can sign up/login
- [ ] Create new repair entry
- [ ] Upload vehicle image
- [ ] Update repair status
- [ ] Generate PDF bill
- [ ] Data persists after refresh

## 🐛 Troubleshooting

### Common Issues

#### 1. "Firebase not initialized" Error
```bash
# Check Firebase configuration in .env.local
# Ensure all NEXT_PUBLIC_FIREBASE_* variables are set
```

#### 2. "MongoDB connection failed" Error
```bash
# Verify MongoDB Atlas URI
# Check network access settings in Atlas
# Ensure database user has proper permissions
```

#### 3. "Clerk authentication failed" Error
```bash
# Verify Clerk API keys
# Check if domain is added in Clerk dashboard
```

#### 4. Images not loading
```bash
# Check MongoDB Atlas connection
# Verify MONGODB_ATLAS_URI is correct
# Test image upload endpoint: POST /api/upload-image
```

#### 5. Build errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npm run type-check
```

### Debug Mode
Enable detailed logging by adding to `.env.local`:
```env
NODE_ENV=development
DEBUG=true
```

## 📊 Performance

- **Lighthouse Score** - 90+ on all metrics
- **Core Web Vitals** - Optimized for speed
- **Image Optimization** - Automatic image compression
- **Code Splitting** - Lazy loading for better performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request



## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database
- [Clerk](https://clerk.dev/) - Authentication
- [Vercel](https://vercel.com/) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📸 Screenshots
![login](https://github.com/user-attachments/assets/0f93238b-45a7-4f04-af22-9b58999010b0)
![welcome](https://github.com/user-attachments/assets/ea3c93ba-c3dc-48dd-b91d-5079c2410703)
![Dashborad](https://github.com/user-attachments/assets/8e925dfc-9388-41a9-985b-59fc960f8a5a)
![Profile](https://github.com/user-attachments/assets/aa4779d6-a39d-436a-b0b7-d037e93eaa61)
![Developer](https://github.com/user-attachments/assets/9fc18137-45ac-4117-bbaf-2da0edcc26ba)
![Pending](https://github.com/user-attachments/assets/36a5a38a-b9f0-49cf-8780-a0d410e6c750)
![Delivered](https://github.com/user-attachments/assets/0f9d17c4-35d7-4f48-b823-3e43af1db6a7)
![View Detail](https://github.com/user-attachments/assets/504a15e1-8cf0-43f1-81f2-f9f821d183cf)
![Create Bill](https://github.com/user-attachments/assets/10585c11-50dd-44c4-9e77-57042ab164ae)


