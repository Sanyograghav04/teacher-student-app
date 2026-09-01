import { SignJWT } from 'jose';

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://teacher-student-app-n3bfz5od.livekit.cloud';
const LIVEKIT_API_KEY = import.meta.env.VITE_LIVEKIT_API_KEY || 'APIjDzyVNf6jFD8';
const LIVEKIT_API_SECRET = import.meta.env.VITE_LIVEKIT_API_SECRET || 'SLhU9LInqTIWtJ7k2uoykRcl7IvDS4VSX5eb5jkxqeS';

export async function generateLiveKitToken({ roomId, userId, userName, isTeacher }) {
  const secret = new TextEncoder().encode(LIVEKIT_API_SECRET);

  const token = await new SignJWT({
    sub: userId,
    name: userName || 'User',
    video: {
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isTeacher,
      roomRecord: isTeacher,
    },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(LIVEKIT_API_KEY)
    .setIssuedAt()
    .setExpirationTime('6h')
    .sign(secret);

  return token;
}
