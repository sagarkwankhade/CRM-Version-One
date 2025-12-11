# Deployment Checklist

## Pre-Deployment Security Checklist

- [x] Removed hardcoded MongoDB credentials
- [x] Created `.env.example` template
- [x] Updated `.gitignore` to exclude `.env` files
- [x] All sensitive data moved to environment variables

## Before Deploying

1. **Set Environment Variables** on your hosting platform:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_strong_random_secret_key_here
   PORT=4000
   ```

2. **Generate a Strong JWT Secret**:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

3. **Verify MongoDB Connection**:
   - Test your MongoDB connection string
   - Ensure database is accessible from your hosting platform
   - Whitelist your hosting platform's IP in MongoDB Atlas (if using Atlas)

## Deployment Platforms

### Heroku
1. Create a new Heroku app
2. Set config vars (environment variables) in Heroku dashboard
3. Connect your GitHub repository
4. Deploy branch

### Railway
1. Create new project
2. Connect GitHub repository
3. Add environment variables in project settings
4. Deploy automatically

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Vercel / Netlify
- These platforms are better for frontend apps
- For backend APIs, consider Railway, Render, or Heroku

## Post-Deployment

1. **Create Admin User**:
   ```bash
   # SSH into your server or use one-time dyno (Heroku)
   npm run create-admin
   ```

2. **Verify API Endpoints**:
   - Test login: `POST /api/auth/login`
   - Check health: Server should respond on root or `/health`

3. **Monitor Logs**:
   - Check application logs for any errors
   - Verify database connections

## Important Notes

- ⚠️ **Never commit `.env` file to git**
- ⚠️ **Change JWT_SECRET in production** (don't use default)
- ⚠️ **Use strong passwords** for admin accounts
- ⚠️ **Enable HTTPS** in production (most platforms do this automatically)
- ⚠️ **Configure CORS** properly for your frontend domain

## Troubleshooting

### Database Connection Issues
- Check `MONGO_URI` format
- Verify network access (IP whitelist for MongoDB Atlas)
- Check connection timeout settings

### Authentication Issues
- Verify `JWT_SECRET` is set correctly
- Check token expiration settings
- Ensure passwords are hashed (not plain text)

### Port Issues
- Most platforms set `PORT` automatically
- Don't hardcode port in production
- Use `process.env.PORT || 4000`

