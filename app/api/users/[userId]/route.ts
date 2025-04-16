import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find user by ID
    const user = await User.findById(params.userId).select({
      password: 0, // Exclude password
      email: 0,    // Exclude email
      __v: 0       // Exclude version key
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      age: user.age,
      location: user.location,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      friends: user.friends,
      reliability: user.reliability || 100,
      photos: user.photos || []
    });
  } catch (error) {
    console.error('Error in user profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 