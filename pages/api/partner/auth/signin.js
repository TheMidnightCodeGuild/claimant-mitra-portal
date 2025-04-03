import { auth, signInWithEmailAndPassword } from '../../../../lib/firebase';
const cookie = require('cookie');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set a cookie with the user's UID
    const sessionCookie = cookie.serialize('session', user.uid, {
      httpOnly: false, // Change to false temporarily for debugging
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax', // Change to lax for testing
      path: '/',
    });

    console.log('Setting cookie:', sessionCookie);
    res.setHeader('Set-Cookie', sessionCookie);
    res.status(200).json({ message: 'Sign-in successful', userId: user.uid });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(401).json({ error: error.message });
  }
}