import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import bcrypt from "bcrypt";

const DB_NAME = "wad-01";
const COLLECTION = "user";

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/user?page=1&limit=10
 * List users (password excluded)
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
        const skip = (page - 1) * limit;

        const client = await getClientPromise();
        const db = client.db(DB_NAME);

        const total = await db.collection(COLLECTION).countDocuments({});
        const data = await db
            .collection(COLLECTION)
            .find({}, { projection: { password: 0 } })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json(
            {
                data,
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error?.toString?.() ?? "Unknown error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(req) {
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
    const password = String(data.password ?? data.pass ?? "").trim();
    const firstname = data.firstname;
    const lastname = data.lastname;

    const missing = [];
    if (!username) missing.push("username");
    if (!email) missing.push("email");
    if (!password) missing.push("password");

    if (missing.length > 0) {
        const isLoginAttempt = missing.length === 1 && missing[0] === "username" && email && password;
        return NextResponse.json(
            {
                message: "Missing mandatory data",
                missing,
                hint: isLoginAttempt ? "If you're trying to login, use POST /api/user/login with email and password." : undefined
            },
            { status: 400, headers: corsHeaders }
        );
    }

    try {
        const client = await getClientPromise();
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION).insertOne({
            username: username,
            email: email,
            password: await bcrypt.hash(password, 10),
            firstname: firstname,
            lastname: lastname,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return NextResponse.json({
            id: result.insertedId
        }, {
            status: 201,
            headers: corsHeaders
        });
    } catch (error) {
        console.log("exception", error.toString());
        const errorMsg = error.toString();
        let displayErrorMsg ="";
        if (errorMsg.includes("duplicate")) {
            if (errorMsg.includes("username")) {
                displayErrorMsg = "Duplicate Username!!"
            }
            else if (errorMsg.includes("email")) {
                displayErrorMsg = "Duplicate Email!!"
            }
    }

        return NextResponse.json({
            message: displayErrorMsg || "Create user failed"
        }, {
            status: 400,
            headers: corsHeaders
        })
    }
}
