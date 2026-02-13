import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DB_NAME = "wad-01";
const COLLECTION = "user";
const JWT_SECRET = process.env.JWT_SECRET || "mydefaultjwtsecret";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]);
const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

async function getAuthenticatedUser(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { error: "Unauthorized (no token)", status: 401 };
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return { error: "Unauthorized (invalid token)", status: 401 };
  }

  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  const user = await db.collection(COLLECTION).findOne({ email: payload.email });

  if (!user) {
    return { error: "Unauthorized (user not found)", status: 401 };
  }

  return { user, db };
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (auth.error) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status, headers: corsHeaders }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "Missing image file" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { message: "Only image file types are allowed" },
        { status: 400, headers: corsHeaders }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json(
        { message: "Empty file is not allowed" },
        { status: 400, headers: corsHeaders }
      );
    }

    const ext = MIME_EXT[file.type] || ".img";
    const randomName = crypto.randomBytes(32).toString("hex");
    const fileName = `${randomName}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-images");
    await mkdir(uploadDir, { recursive: true });

    const savePath = path.join(uploadDir, fileName);
    await writeFile(savePath, buffer);

    const publicUrl = `/uploads/profile-images/${fileName}`;

    await auth.db.collection(COLLECTION).updateOne(
      { _id: auth.user._id },
      { $set: { profileImage: publicUrl, updatedAt: new Date() } }
    );

    return NextResponse.json(
      { success: true, profileImage: publicUrl },
      { status: 200, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
