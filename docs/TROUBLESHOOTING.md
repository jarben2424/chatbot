# Troubleshooting Guide

This guide is designed to help you solve common issues that may arise when using our application.

## Authentication Issues

### Problem: "You must be logged in" error when adding metrics to dashboard

**Symptoms:**
- You receive a "You must be logged in" error when trying to add metrics to your dashboard
- Chat messages work fine, but metrics don't seem to be saving properly
- The `userid` in `ChatGeneratedMetrics` table shows as all zeros

**Solution:**

1. **Check your authentication status:**
   - Navigate to the application and ensure you're properly logged in
   - If the login session appears to be expired, log out and log back in

2. **Verify environment variables:**
   - Make sure `NEXT_PUBLIC_BASE_URL` is set correctly in your `.env.local` file
   - For local development, it should be: `NEXT_PUBLIC_BASE_URL=http://localhost:3000`

3. **Clear browser cache and cookies:**
   - Sometimes authentication issues can be resolved by clearing cookies
   - Try an incognito/private browsing window to rule out browser cache issues

4. **Test API endpoints:**
   - Run the API test script to verify endpoints are working:
     ```
     npm run test:api
     ```
   - Check the output for any errors in authentication or API responses

5. **Check server logs:**
   - Look at the Next.js server console for any error messages
   - Pay special attention to authentication-related errors

## Database Issues

### Problem: Data not being saved to Supabase tables

**Symptoms:**
- Metrics aren't showing up in the `ChatGeneratedMetrics` table
- User dashboard is empty despite adding metrics

**Solution:**

1. **Check database connection:**
   - Verify that your Supabase connection is working
   - Ensure Supabase URL and key are correctly set in environment variables

2. **Check RLS policies:**
   - Verify that Row Level Security policies in Supabase allow the current user to insert data
   - Common issue: RLS policies might be too restrictive

3. **Check database schema:**
   - Ensure the database schema matches what the application expects
   - Fields should have the correct names and types

4. **Enable verbose logging:**
   - Set `DEBUG=true` in your `.env.local` file to enable more detailed logging
   - Check logs for database-related errors

## Application Performance Issues

### Problem: Application is slow or unresponsive

**Symptoms:**
- Long loading times for dashboards
- Delays when saving metrics

**Solution:**

1. **Check network performance:**
   - Use browser dev tools to inspect network requests
   - Look for slow requests or failed requests

2. **Optimize database queries:**
   - Consider adding indexes to frequently queried columns
   - Review query performance in Supabase dashboard

3. **Check for browser compatibility issues:**
   - Try a different browser to rule out browser-specific issues
   - Update your browser to the latest version

## For Developers

### Debugging Tips

1. **Enable detailed logging:**
   ```javascript
   console.log('Debug info:', { 
     userId: session?.user?.id,
     requestBody: body,
     responseData: data 
   });
   ```

2. **Test API endpoints directly:**
   Use a tool like Postman or the included test script to test API endpoints directly

3. **Check for CORS issues:**
   If you're seeing CORS errors in the console, verify that your API routes are properly handling CORS

### Common Code Issues

1. **Authentication token not being passed:**
   - Ensure fetch requests include `credentials: 'include'`
   - Check that cookies are being properly set and sent

2. **API routes not handling errors properly:**
   - Make sure all API routes have proper try/catch blocks
   - Return appropriate status codes and error messages

3. **Next.js specific issues:**
   - Remember that Next.js API routes are serverless functions
   - Avoid using browser-specific APIs in server components/API routes

## Getting More Help

If you're still experiencing issues after trying these solutions:

1. Check the GitHub Issues page to see if others have reported similar problems
2. Submit a detailed bug report including:
   - Steps to reproduce the issue
   - Expected behavior
   - Actual behavior
   - Screenshots or error messages
   - Browser and OS information 