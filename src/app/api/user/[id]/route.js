import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const DB_NAME = "wad-01";
const COLLECTION = "user";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

function parseObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export async function GET(req, { params }) {
  const { id } = params;
  const objectId = parseObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { message: "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }
  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION).findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: error?.toString?.() ?? "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req, { params }) {
  const { id } = params;
  const objectId = parseObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { message: "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }

  let data = {};
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const partialUpdate = {};
  if (data.username != null || data.userName != null || data.user_name != null) {
    const username = String(data.username ?? data.userName ?? data.user_name ?? "").trim();
    if (!username) {
      return NextResponse.json(
        { message: "Invalid username" },
        { status: 400, headers: corsHeaders }
      );
    }
    partialUpdate.username = username;
  }
  if (data.email != null || data.mail != null) {
    const email = String(data.email ?? data.mail ?? "").trim();
    if (!email) {
      return NextResponse.json(
        { message: "Invalid email" },
        { status: 400, headers: corsHeaders }
      );
    }
    partialUpdate.email = email;
  }
  if (data.firstname != null) partialUpdate.firstname = data.firstname;
  if (data.lastname != null) partialUpdate.lastname = data.lastname;
  if (data.status != null) partialUpdate.status = String(data.status).trim().toLowerCase();
  if (data.password != null || data.pass != null) {
    const password = String(data.password ?? data.pass ?? "").trim();
    if (!password) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 400, headers: corsHeaders }
      );
    }
    partialUpdate.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(partialUpdate).length === 0) {
    return NextResponse.json(
      { message: "No fields to update" },
      { status: 400, headers: corsHeaders }
    );
  }

  partialUpdate.updatedAt = new Date();

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const updatedResult = await db.collection(COLLECTION).updateOne(
      { _id: objectId },
      { $set: partialUpdate }
    );
    return NextResponse.json(updatedResult, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: error?.toString?.() ?? "Unknown error" },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  const objectId = parseObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { message: "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }

  let data = {};
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const username = String(data.username ?? data.userName ?? data.user_name ?? "").trim();
  const email = String(data.email ?? data.mail ?? "").trim();
  if (!username || !email) {
    return NextResponse.json(
      { message: "Missing required fields: username, email" },
      { status: 400, headers: corsHeaders }
    );
  }

  const updateDoc = {
    username,
    email,
    firstname: data.firstname ?? "",
    lastname: data.lastname ?? "",
    status: String(data.status ?? "active").trim().toLowerCase(),
    updatedAt: new Date(),
  };

  if (data.password != null || data.pass != null) {
    const password = String(data.password ?? data.pass ?? "").trim();
    if (!password) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 400, headers: corsHeaders }
      );
    }
    updateDoc.password = await bcrypt.hash(password, 10);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const updatedResult = await db.collection(COLLECTION).updateOne(
      { _id: objectId },
      { $set: updateDoc }
    );
    return NextResponse.json(updatedResult, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: error?.toString?.() ?? "Unknown error" },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  const objectId = parseObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { message: "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION).deleteOne({ _id: objectId });
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: error?.toString?.() ?? "Unknown error" },
      { status: 400, headers: corsHeaders }
    );
  }
}
