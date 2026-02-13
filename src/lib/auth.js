import jwt from "jsonwebtoken";
import cookie from "cookie";

export function verifyJWT(req) {
  try {
    const rawCookie = req.headers.get("cookie") || "";
    const { token } = cookie.parse(rawCookie);
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mydefaultjwtsecret"
    );
    return decoded;
  } catch {
    return null;
  }
}
