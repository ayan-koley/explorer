import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";

const generateOTP = (): string => {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");
}

const hashOTP = (otp: string): string => {
  const saltRounds = parseInt(process.env.BCRYPT_SALTROUNDS || "10", 10);
  const hash = bcrypt.hashSync(otp, saltRounds);
  return hash; 
}

const verifyOTP = (otp: string, hash: string): boolean => {
  return bcrypt.compareSync(otp, hash);
}
  
export {
  generateOTP,
  hashOTP,
  verifyOTP
}