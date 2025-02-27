# Conversation Intelligence Documentation

## Overview

The Conversation Intelligence object is a representation of different AI-generated entities such as Key Topics, Call Transcription, Sentiment Analysis, etc.

**Important Notes:**
- The Conversation Intelligence object is not updatable nor destroyable via the Aircall Public API.
- Access: The Conversation Intelligence object and its APIs can only be retrieved if a company has signed up for the Aircall AI Package.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| id | Integer | Unique identifier for the Conversation Intelligence event. |
| call_id | String | Unique identifier for the call. For sentiment.created event, id and call_id will have the same value. |
| call_uuid | String | Unique identifier for the call. (Available via Webhook events only) |
| number_id | Integer | Unique identifier for the number. (This field is only applicable for transcription.created event) |
| participants | Array | Participants involved in the call. |
| type | String | Type of the call. It will be call or voicemail. (This field is only applicable for transcription.created event and to retrieve a transcription) |
| content | String/Array/Object | The content of the Conversation Intelligence object.<br>• Applicable for retrieving a transcription.<br>• Applicable for retrieving topics.<br>• Applicable for retrieving a summary. |
| call_created_at | String | Timestamp when the call was created, in UTC. (This field is applicable for retrieving a transcription) |
| created_at | String | Timestamp when the topics were created, in UTC.<br>• Applicable for retrieving topics.<br>• Applicable for retrieving a summary. |

## Endpoints

### 1. Retrieve a Transcription

**Description:**  
Use this endpoint to retrieve a transcription.

To get a transcription for a call in real time, it is recommended to subscribe to the `transcription.created` event. This event notifies you when the transcription is generated, so you can then use the API to retrieve and store it.

**Note:** The Transcription API does not contain any information related to the Calls; please use the Calls API to retrieve call details.

**Path Parameter:**
- `call_id` (Integer): Unique identifier for the Call.

**HTTP Request:**
```bash
GET /v1/calls/:call_id/transcription
```

**Status Codes:**
- 200: Success.
- 400: Validation error: invalid call_id.
- 403: Forbidden access: company is not active.
- 403: Forbidden access: company is not verified.
- 500: Internal server error: unknown error.

**Sample Response:**
```json
{
    "transcription": {
        "id": 68271,
        "call_id": 5237603,
        "call_created_at": "2024-07-26T13:30:54.000Z",
        "type": "call",
        "content": {
            "language": "en",
            "utterances": [
                {
                    "start_time": 12.54,
                    "end_time": 13.8,
                    "text": "Okay,",
                    "participant_type": "external",
                    "phone_number": "+33679198915"
                },
                {
                    "start_time": 238.08,
                    "end_time": 239.48,
                    "text": "Okay, I guess that's enough.",
                    "participant_type": "internal",
                    "user_id": 123
                }
            ]
        }
    }
}
```

### 2. Retrieve Sentiments

**Description:**  
Use this endpoint to retrieve sentiments.

**Path Parameter:**
- `call_id` (Integer): Unique identifier for the Call.

**HTTP Request:**
```bash
GET /v1/calls/:call_id/sentiments
```

**Status Codes:**
- 200: Success.
- 400: Validation error: invalid call_id.
- 403: Forbidden access: company is not active.
- 403: Forbidden access: company is not verified.
- 500: Internal server error: unknown error.

**Sample Response:**
```json
{
    "sentiment": {
        "id": 5237603,
        "call_id": 5237603,
        "participants": [
            {
                "phone_number": "+33679198915",
                "value": "POSITIVE",
                "type": "external"
            }
        ]
    }
}
```

### 3. Retrieve Topics

**Description:**  
Use this endpoint to retrieve topics from a call.

**Path Parameter:**
- `call_id` (Integer): Unique identifier for the Call.

**HTTP Request:**
```bash
GET /v1/calls/:call_id/topics
```

**Status Codes:**
- 200: Success.
- 400: Validation error: invalid call_id.
- 403: Forbidden access: company is not active.
- 403: Forbidden access: company is not verified.
- 500: Internal server error: unknown error.

**Sample Response:**
```json
{
    "topic": {
        "id": 786,
        "call_id": 123,
        "created_at": "2024-08-27T10:54:16.000Z",
        "content": [
            "payment",
            "billing"
        ]
    }
}
```

### 4. Retrieve a Summary

**Description:**  
Use this endpoint to retrieve a summary from a call.

**Path Parameter:**
- `call_id` (Integer): Unique identifier for the Call.

**HTTP Request:**
```bash
GET /v1/calls/:call_id/summary
```

**Status Codes:**
- 200: Success.
- 400: Validation error: invalid call_id.
- 403: Forbidden access: company is not active.
- 403: Forbidden access: company is not verified.
- 500: Internal server error: unknown error.

**Sample Response:**
```json
{
    "summary": {
        "id": 974,
        "call_id": 786,
        "created_at": "2024-08-27T10:54:16.000Z",
        "content": "Short summary of the call"
    }
}
