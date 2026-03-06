export const authPaths = {
  "/api/v1/users/register": {
    post: {
      summary: "Register a new user",
      description: "Creates a new user account with profile information and optional images. Requires fullName, email, username, password, and avatar image. Cover image is optional.",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              $ref: "#/components/schemas/RegisterRequest"
            }
          }
        }
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiResponse"
              }
            }
          }
        },
        400: {
          description: "Bad request - Missing required fields or invalid data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        409: {
          description: "Conflict - User with this email or username already exists",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  }
};
