import { APIError } from './lib/api';
const err = new APIError(401, { message: "invalid username or password" });
console.log("instanceof Error:", err instanceof Error);
console.log("message:", err.message);
