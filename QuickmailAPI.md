# QuickMail API Integration Guide

This document provides a reference for integrating with the QuickMail API from the command line (CLI) or your application. It covers authentication, available endpoints, example requests, error handling, and rate limiting.

**Note:** For full details and any updates, please refer to the Official QuickMail API Documentation.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Campaigns](#campaigns)
  - [Prospects](#prospects)
  - [Templates](#templates)
  - [Additional Endpoints](#additional-endpoints)
- [Example Requests](#example-requests)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Using the API with CLI Tools](#using-the-api-with-cli-tools)
- [Additional Resources](#additional-resources)

## Overview

The QuickMail API offers a RESTful interface to programmatically manage your cold email campaigns, prospects, and templates. All requests and responses are in JSON format.

## Authentication

All requests to the API must include your API key. You can find your API key in your QuickMail account settings.

Include the API key in the HTTP header as follows:

```http
Authorization: Bearer YOUR_API_KEY
```

Also, ensure that you set the Content-Type header to `application/json` when sending data.

## API Endpoints

### Campaigns

#### Create a Campaign
- **Endpoint:** `POST /api/v1/campaigns`
- **Description:** Create a new email campaign.
- **Request Body Example:**
```json
{
  "name": "Campaign Name",
  "subject": "Email Subject",
  "body": "Email Body",
  "recipients": ["user1@example.com", "user2@example.com"]
}
```
- **Response Example:**
```json
{
  "id": "campaign_id",
  "status": "scheduled"
}
```

#### Get Campaign Details
- **Endpoint:** `GET /api/v1/campaigns/{campaign_id}`
- **Description:** Retrieve details for a specific campaign.
- **Response Example:**
```json
{
  "id": "campaign_id",
  "name": "Campaign Name",
  "subject": "Email Subject",
  "body": "Email Body",
  "recipients": ["user1@example.com", "user2@example.com"],
  "status": "scheduled"
}
```

#### List All Campaigns
- **Endpoint:** `GET /api/v1/campaigns`
- **Description:** Retrieve a list of all campaigns.
- **Response Example:**
```json
[
  {
    "id": "campaign_id_1",
    "name": "Campaign 1",
    "status": "completed"
  },
  {
    "id": "campaign_id_2",
    "name": "Campaign 2",
    "status": "scheduled"
  }
]
```

#### Delete a Campaign
- **Endpoint:** `DELETE /api/v1/campaigns/{campaign_id}`
- **Description:** Delete the specified campaign.
- **Response Example:**
```json
{
  "message": "Campaign deleted successfully."
}
```

### Prospects

#### Add a Prospect
- **Endpoint:** `POST /api/v1/prospects`
- **Description:** Add a new prospect to a campaign.
- **Request Body Example:**
```json
{
  "campaign_id": "campaign_id",
  "email": "prospect@example.com",
  "first_name": "First",
  "last_name": "Last"
}
```
- **Response Example:**
```json
{
  "id": "prospect_id",
  "status": "added"
}
```

#### Get Prospect Details
- **Endpoint:** `GET /api/v1/prospects/{prospect_id}`
- **Description:** Retrieve details for a specific prospect.
- **Response Example:**
```json
{
  "id": "prospect_id",
  "campaign_id": "campaign_id",
  "email": "prospect@example.com",
  "first_name": "First",
  "last_name": "Last",
  "status": "active"
}
```

### Templates

#### List Templates
- **Endpoint:** `GET /api/v1/templates`
- **Description:** Retrieve a list of available email templates.
- **Response Example:**
```json
[
  {
    "id": "template_id_1",
    "name": "Template 1",
    "subject": "Subject 1",
    "body": "Template body content..."
  },
  {
    "id": "template_id_2",
    "name": "Template 2",
    "subject": "Subject 2",
    "body": "Template body content..."
  }
]
```

### Additional Endpoints

Depending on your account and requirements, additional endpoints may include:

- **Statistics:** Retrieve metrics (opens, clicks, replies) for your campaigns.
- **Automation:** Manage automated follow-ups and email sequences.
- **Settings:** Update campaign or account configurations.

For the complete list of endpoints and parameters, refer to the official documentation.

## Example Requests

### Using cURL

Create a Campaign:
```bash
curl -X POST https://api.quickmail.com/api/v1/campaigns \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Campaign",
    "subject": "Hello, World!",
    "body": "This is a test email.",
    "recipients": ["user@example.com"]
  }'
```

Get Campaign Details:
```bash
curl -X GET https://api.quickmail.com/api/v1/campaigns/campaign_id \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Using HTTPie

Create a Campaign:
```bash
http POST https://api.quickmail.com/api/v1/campaigns \
  Authorization:"Bearer YOUR_API_KEY" \
  name="New Campaign" \
  subject="Hello, World!" \
  body="This is a test email." \
  recipients:='["user@example.com"]'
```

## Error Handling

The API uses standard HTTP status codes. Common errors include:

- **400 Bad Request:** The request is malformed or missing required parameters.
- **401 Unauthorized:** API key is missing or invalid.
- **404 Not Found:** The requested resource does not exist.
- **429 Too Many Requests:** Rate limit exceeded.
- **500 Internal Server Error:** A server error occurred.

Error responses are returned in JSON format. Example:
```json
{
  "error": "Invalid request",
  "message": "The email field is required."
}
```

## Rate Limiting

The QuickMail API enforces rate limits to ensure fair usage. If you exceed the allowed number of requests, you will receive a 429 Too Many Requests response. Check the documentation or your account details for the exact limits.

## Using the API with CLI Tools

For command-line integration (e.g., with a CLI client like Cline), make sure to:

1. Store your API key securely (e.g., in environment variables).
2. Set required HTTP headers for each request.
3. Parse JSON responses as needed.

Example using an environment variable with cURL:
```bash
export QUICKMAIL_API_KEY=your_api_key_here
curl -X GET https://api.quickmail.com/api/v1/campaigns \
  -H "Authorization: Bearer $QUICKMAIL_API_KEY"
```

## Additional Resources

- Official QuickMail API Documentation
- QuickMail Support
- Community Forums

This guide was generated to help you quickly integrate with the QuickMail API in your development environment using command-line tools.
