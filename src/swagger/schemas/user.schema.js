export const userSchemas = {
  User: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "Unique identifier for the user"
      },
      username: {
        type: "string",
        description: "Unique username for the user"
      },
      email: {
        type: "string",
        format: "email",
        description: "User's email address"
      },
      fullName: {
        type: "string",
        description: "Full name of the user"
      },
      avatar: {
        type: "string",
        description: "URL of the user's avatar image"
      },
      coverImage: {
        type: "string",
        description: "URL of the user's cover image"
      },
      watchHistory: {
        type: "array",
        items: {
          type: "string",
          description: "Video ID"
        },
        description: "List of videos watched by the user"
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Account creation timestamp"
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Last update timestamp"
      }
    },
    required: ["_id", "username", "email", "fullName", "avatar"]
  },
  ApiResponse: {
    type: "object",
    properties: {
      statusCode: {
        type: "integer",
        description: "HTTP status code"
      },
      data: {
        type: "object",
        description: "Response data"
      },
      message: {
        type: "string",
        description: "Response message"
      },
      success: {
        type: "boolean",
        description: "Indicates if the request was successful"
      }
    }
  },
  ErrorResponse: {
    type: "object",
    properties: {
      statusCode: {
        type: "integer",
        description: "HTTP status code"
      },
      message: {
        type: "string",
        description: "Error message"
      },
      success: {
        type: "boolean",
        description: "Indicates if the request was successful (false for errors)"
      },
      errors: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of error details"
      }
    }
  }
};
