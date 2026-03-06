export const authSchemas = {
  RegisterRequest: {
    type: "object",
    properties: {
      fullName: {
        type: "string",
        description: "Full name of the user"
      },
      email: {
        type: "string",
        format: "email",
        description: "User's email address"
      },
      username: {
        type: "string",
        description: "Unique username for the user"
      },
      password: {
        type: "string",
        format: "password",
        description: "User's password"
      },
      avatar: {
        type: "string",
        format: "binary",
        description: "Avatar image file"
      },
      coverImage: {
        type: "string",
        format: "binary",
        description: "Cover image file (optional)"
      }
    },
    required: ["fullName", "email", "username", "password", "avatar"]
  }
};
