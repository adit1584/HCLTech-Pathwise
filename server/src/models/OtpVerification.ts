import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpVerification extends Document {
  email: string;
  otp: string;
  name: string;
  passwordHash: string;
  attempts: number;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Expire after 10 minutes (600s)
});

export const OtpVerificationModel = mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);
