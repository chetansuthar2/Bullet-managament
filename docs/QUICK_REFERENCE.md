# 📚 Quick Reference Guide

## 🚀 Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Testing
```bash
# Test database connections
curl http://localhost:3000/api/test-db

# Get data summary
curl http://localhost:3000/api/data-summary
```

## 🔗 Important URLs

### Local Development
- **Application**: http://localhost:3000
- **Database Test**: http://localhost:3000/api/test-db
- **Data Summary**: http://localhost:3000/api/data-summary

### API Endpoints
```
GET    /api/repair-entries?userId={id}  # Get user entries
POST   /api/repair-entries              # Create entry
PUT    /api/repair-entries              # Update entry
DELETE /api/repair-entries?id={id}      # Delete entry

POST   /api/upload-image                # Upload image
GET    /api/images/[id]                 # Get image
DELETE /api/images/[id]                 # Delete image
```

## 🔧 Environment Variables

### Required for Development
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
MONGODB_ATLAS_URI=mongodb+srv://...
```

### Storage Configuration
```env
NEXT_PUBLIC_STORAGE_TYPE=hybrid
NEXT_PUBLIC_DATA_STORAGE=firebase
NEXT_PUBLIC_IMAGE_STORAGE=mongodb
```

## 📁 Key Files

### Configuration
- `.env.local` - Environment variables
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config

### Core Application
- `app/page.tsx` - Main application page
- `app/api/repair-entries/route.ts` - Repair CRUD API
- `app/api/upload-image/route.ts` - Image upload API

### Libraries
- `lib/firebase.ts` - Firebase configuration
- `lib/firebaseStorage.ts` - Firestore operations
- `lib/mongodb.ts` - MongoDB connection
- `lib/mongoImageStorage.ts` - GridFS operations

## 🐛 Common Issues & Solutions

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Test connections
curl http://localhost:3000/api/test-db
```

### Environment Variable Issues
```bash
# Check if variables are loaded
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
```

## 📊 Data Flow

### Repair Entry Creation
```
1. User fills form → app/page.tsx
2. Form submits → /api/repair-entries (POST)
3. Data saves → Firebase Firestore
4. Response → UI updates
```

### Image Upload
```
1. User selects image → app/page.tsx
2. Image uploads → /api/upload-image (POST)
3. File saves → MongoDB Atlas GridFS
4. URL returns → Links to repair entry
```

## 🔒 Security Notes

- **Environment Variables**: Never commit `.env.local`
- **API Keys**: Use environment variables only
- **User Data**: Isolated by userId
- **Images**: Served through API with validation

## 📱 Browser Support

- **Chrome**: ✅ Latest 2 versions
- **Firefox**: ✅ Latest 2 versions
- **Safari**: ✅ Latest 2 versions
- **Edge**: ✅ Latest 2 versions
- **Mobile**: ✅ iOS Safari, Chrome Mobile

## 🎯 Performance Tips

- **Images**: Automatically optimized by Next.js
- **Code Splitting**: Automatic with App Router
- **Caching**: Static assets cached by Vercel
- **Database**: Firebase real-time, MongoDB GridFS optimized

---

**Need more help? Check the main README.md or create an issue!**
