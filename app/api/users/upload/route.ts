// app/api/users/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { verifyToken } from "@/app/api/middleware/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = verifyToken(token);

    const data = await req.formData();
    const file = data.get("file") as Blob;
    const type = data.get("type") as string;
    const photoId = data.get("photoId") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    // Upload file to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: `tapdin/${userId}/${type}`,
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    const { secure_url, public_id } = uploadResponse as any;

    let user;
    if (type === "avatar") {
      user = await User.findByIdAndUpdate(
        userId,
        { avatarUrl: secure_url },
        { new: true }
      );
    } else if (type === "banner") {
      user = await User.findByIdAndUpdate(
        userId,
        { bannerUrl: secure_url },
        { new: true }
      );
    } else if (type === "photo" && photoId) {
      user = await User.findOneAndUpdate(
        { 
          _id: userId,
          "photos._id": photoId 
        },
        { 
          $set: { 
            "photos.$.url": secure_url,
            "photos.$.publicId": public_id 
          }
        },
        { new: true }
      );
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        url: secure_url,
        publicId: public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 }
    );
  }
}