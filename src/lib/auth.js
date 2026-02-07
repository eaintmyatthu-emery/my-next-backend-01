import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import cookies from "cookie";
// const JWT_SECRET = process.env.JWT_SECRET || "mydefaulyjwtsecret"; // Use a strong secret in production
export function verifyJWT(req) {
    try {
        const cookies = req.headers.get("cookie") || "";
        const { token } = cookies.parse(cookies);
        if (!token) {
            return null;
        }
const decoded = jwt.verify(token, process.env.JWT_SECRET);
return decoded;
} catch (err) {
return null;
}
}
// Example usage in an API route:
// import { verifyJWT } from "@/lib/auth";
// const user = verifyJWT(req);
// if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });