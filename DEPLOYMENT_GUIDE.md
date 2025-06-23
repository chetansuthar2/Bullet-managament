# Deployment Guide - Vehicle Repair Management System

## 🚨 Important: Database Configuration for Production

Your application is currently configured for **local development** with MongoDB running on your machine. For production deployment, you need a **cloud database**.

## Option 1: MongoDB Atlas (Recommended - FREE)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click "Try Free" 
3. Sign up with email/Google account

### Step 2: Create Free Cluster
1. Choose **FREE tier (M0)**
2. Select cloud provider (AWS/Google/Azure)
3. Choose region closest to your deployment
4. Cluster name: `VehicleRepairCluster`
5. Click "Create Cluster"

### Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `vehiclerepair-user`
5. Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Clusters" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your user password
6. Replace `<dbname>` with `VehicleRepairDB`

Example connection string:
```
mongodb+srv://vehiclerepair-user:YOUR_PASSWORD@vehiclecluster.xxxxx.mongodb.net/VehicleRepairDB?retryWrites=true&w=majority
```

## Deployment Platforms

### Vercel Deployment
1. Push code to GitHub
2. Connect Vercel to your GitHub repo
3. Add environment variables in Vercel dashboard:
   ```
   MONGODB_ATLAS_URI=mongodb+srv://vehiclerepair-user:YOUR_PASSWORD@vehiclecluster.xxxxx.mongodb.net/VehicleRepairDB?retryWrites=true&w=majority
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xhc3NpYy1idXp6YXJkLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ
   CLERK_SECRET_KEY=sk_test_hBSUhUF49mMl0RHoeB0CdMyAX90UPkykV98VqeopnL
   NEXT_PUBLIC_STORAGE_TYPE=mongodb
   ```
4. Deploy

### Netlify Deployment
1. Push code to GitHub
2. Connect Netlify to your GitHub repo
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables in Netlify dashboard (same as above)
6. Deploy

## Environment Variables Summary

### For Production:
```env
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/VehicleRepairDB
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_STORAGE_TYPE=mongodb
```

### For Local Development:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/VehicleRepairDB
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_STORAGE_TYPE=mongodb
```

## Troubleshooting

### Issue: "Cloud MongoDB URI required for production deployment"
**Solution:** Set `MONGODB_ATLAS_URI` environment variable in your deployment platform

### Issue: "Connection timeout" 
**Solution:** Check Network Access settings in MongoDB Atlas - ensure 0.0.0.0/0 is allowed

### Issue: "Authentication failed"
**Solution:** Verify username/password in connection string and database user permissions

### Issue: Images not loading
**Solution:** Ensure `NEXT_PUBLIC_STORAGE_TYPE=mongodb` is set in production environment

## Testing Production Database
After setting up Atlas, you can test locally by temporarily changing your `.env.local`:
```env
MONGODB_URI=mongodb+srv://your-atlas-connection-string
```

## Security Notes
- Never commit `.env.local` to git
- Use strong passwords for database users
- Regularly rotate database passwords
- Monitor database access logs in Atlas dashboard
