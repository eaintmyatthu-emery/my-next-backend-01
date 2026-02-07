// import { verifyJWT } from "@/lib/auth";
// import corsHeaders from "@/lib/cors";
// import { getClientPromise } from "@/lib/mongodb";
// import { NextResponse } from "next/server";
// export async function OPTIONS(req) {
// return new Response(null, {
// status: 200,
// headers: corsHeaders,
// });
// }
// export async function GET (req) {
// const user = verifyJWT(req);
// if (!user) {
// return NextResponse.json(
// {
// message: "Unauthorized"
// },
// {
// status: 401,
// headers: corsHeaders
// }
// );
// }
// try {
// const client = await getClientPromise();
// const db = client.db("wad-01");
// const email = user.email;
// const profile = await db.collection("user").findOne({ email });
// console.log("profile: ", profile);
// return NextResponse.json(profile, {
// headers: corsHeaders
// })
// }
// catch(error) {
// console.log("Get Profile Exception: ", error.toString());
// return NextResponse.json(error.toString(), {
// headers: corsHeaders
// })
// }
// }

// /app/api/user/profile/route.js
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const DB_NAME = "wad-01";
const JWT_SECRET = process.env.JWT_SECRET || "mydefaultjwtsecret";

export async function OPTIONS(req) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized (no token)" },
        { status: 401, headers: corsHeaders }
      );
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { message: "Unauthorized (invalid token)" },
        { status: 401, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const user = await db.collection("user").findOne(
      { email: payload.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized (user not found)" },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
