// app/api/plans/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = verifyToken(token);
    const { planId, content } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Add comment
    const comment = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      content,
      userName: user.name,
      userAvatar: user.avatarUrl,
      createdAt: new Date(),
    };

    plan.comments = plan.comments || [];
    plan.comments.push(comment);
    await plan.save();

    return NextResponse.json({
      comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const planId = url.searchParams.get("planId");

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const plan = await Plan.findById(planId)
      .select("comments")
      .sort({ "comments.createdAt": -1 });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      comments: plan.comments || [],
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = verifyToken(token);
    const { planId, commentId } = await req.json();

    if (
      !mongoose.Types.ObjectId.isValid(planId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Find comment and verify ownership
    const comment = plan.comments?.find(
      (c: { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId }) =>
        c._id.toString() === commentId && c.userId.toString() === userId
    );

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove comment
    plan.comments = plan.comments?.filter(
      (c: { _id: mongoose.Types.ObjectId }) => c._id.toString() !== commentId
    );

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
