import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function signup(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 chars" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "email already in use" });
  }
  const user = new User({ name, email, provider: "local" });
  await user.setPassword(password);
  await user.save();
  const token = signToken({ sub: user._id.toString() });
  res.status(201).json({ token, user: user.toSafeJSON() });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const token = signToken({ sub: user._id.toString() });
  res.json({ token, user: user.toSafeJSON() });
}

export async function googleLogin(req, res) {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: "credential required" });
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "invalid google token" });
  }
  const { sub: googleId, email, name, picture } = payload;
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      googleId,
      avatarUrl: picture,
      provider: "google",
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (picture && !user.avatarUrl) user.avatarUrl = picture;
    await user.save();
  }
  const token = signToken({ sub: user._id.toString() });
  res.json({ token, user: user.toSafeJSON() });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json({ user: user.toSafeJSON() });
}
