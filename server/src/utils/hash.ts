import bcrypt from 'bcrypt'
import 'dotenv/config'

const generateHash = async(payload: string): Promise<string> => {
    const saltRounds = process.env.BCRYPT_SALTROUNDS;
    if(!saltRounds) {
        throw new Error('Hash saltround is missing. ');
    }
    try {
        return await bcrypt.hash(payload, Number(saltRounds));
    } catch (error: any) {
        throw new Error(`Faild hash generation ERROR ::: ${error.message}`);
    }
}

const isValidHash = async(payload: string, hashString: string): Promise<boolean> => {
    return await bcrypt.compare(payload, hashString);
}

export {
  generateHash,
  isValidHash
} 