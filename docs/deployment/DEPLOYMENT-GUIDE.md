# Deployment Guide

## Prerequisites

- Vercel account
- Neon PostgreSQL database
- Environment variables configured

## Environment Variables

```env
DATABASE_URL=postgresql://...
```

## Deployment Steps

### 1. Connect Repository
- Connect GitHub repo to Vercel
- Select the correct branch (main/production)

### 2. Configure Environment
- Add all required environment variables in Vercel dashboard
- Ensure DATABASE_URL is set correctly

### 3. Deploy
- Vercel will automatically deploy on push
- Monitor build logs for any errors

### 4. Post-Deployment
- Verify all API endpoints working
- Test authentication flow
- Check database connections

## Rollback

If issues occur:
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"
