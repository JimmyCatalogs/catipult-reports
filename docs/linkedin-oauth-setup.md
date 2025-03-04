# LinkedIn OAuth 2.0 Integration Setup

This document provides step-by-step instructions for setting up the LinkedIn OAuth 2.0 integration for the LinkedIn Ads tab in the application.

## Prerequisites

1. A LinkedIn account with access to LinkedIn Campaign Manager
2. A LinkedIn Developer account (you can create one at [LinkedIn Developers](https://www.linkedin.com/developers/))

## Step 1: Create a LinkedIn Developer App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click on "Create app"
3. Fill in the required information:
   - App name: "Catipult Reports" (or your preferred name)
   - LinkedIn Page: Your company's LinkedIn page (or your personal page)
   - App logo: Upload a logo (optional)
   - Legal agreement: Check the box to agree to terms
4. Click "Create app"

## Step 2: Configure OAuth 2.0 Settings

1. In your app dashboard, go to the "Auth" tab
2. Under "OAuth 2.0 settings", add an appropriate Redirect URL for your OAuth flow
3. Under "OAuth 2.0 scopes", add the following scopes:
   - r_emailaddress
   - r_liteprofile
   - rw_ads (or the specific ad scopes you need)
4. Save changes

## Step 3: Get Your Client ID and Client Secret

1. In your app dashboard, go to the "Auth" tab
2. Note down your Client ID and Client Secret (you'll need these for the next steps)

## Step 4: Get Your LinkedIn Account ID

1. Log in to [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager/)
2. Your Account ID is visible in the URL when you're viewing your account:
   ```
   https://www.linkedin.com/campaignmanager/accounts/xxxxxxxx/...
   ```
   The number after "accounts/" is your Account ID.

## Step 5: Generate a Refresh Token

Generate a refresh token using LinkedIn's OAuth 2.0 flow. You can do this through:
- LinkedIn's developer tools
- A third-party OAuth client like Postman
- Your own implementation of the OAuth flow

The refresh token will be used to automatically generate access tokens for API calls.

## Step 6: Update Environment Variables

1. Open your `.env.local` file
2. Update the LinkedIn OAuth credentials:
   ```
   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id
   NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID=your_account_id
   NEXT_PUBLIC_LINKEDIN_REFRESH_TOKEN=your_refresh_token
   ```
3. Save the file

## Step 7: Restart the Application

1. Restart your Next.js development server:
   ```
   npm run dev
   ```
2. Navigate to the LinkedIn Ads tab to verify the integration is working

## Refresh Token Management

LinkedIn refresh tokens eventually expire. When this happens:
1. Generate a new refresh token using your preferred method
2. Update the `NEXT_PUBLIC_LINKEDIN_REFRESH_TOKEN` value in your `.env.local` file
3. Restart the application

## Troubleshooting

### Token Refresh Issues

If you encounter issues with token refresh:

1. Ensure your Client ID, Client Secret, and Refresh Token are correct
2. Check that your app has the necessary scopes enabled
3. Generate a new refresh token

### API Access Issues

If you encounter issues accessing the LinkedIn Marketing API:

1. Ensure your LinkedIn account has access to Campaign Manager
2. Verify that your app has the necessary API permissions
3. Check the LinkedIn Marketing API documentation for any rate limits or restrictions

## Additional Resources

- [LinkedIn Marketing API Documentation](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
