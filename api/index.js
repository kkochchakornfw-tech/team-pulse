// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
import { handle } from "../server/app.js";

export const config = { api: { bodyParser: false } };
export default function handler(req, res) { return handle(req, res); }
