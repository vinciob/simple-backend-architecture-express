import mongoose from 'mongoose'
import { z } from 'zod'

export const ObjectIdHexZ = z.string().regex(/^[0-9a-fA-F]{24}$/, 'invalid.objectId')

// This schema allows both string hex and ObjectId instances, and transforms string to ObjectId
export const ObjectIdZ = z.union([ObjectIdHexZ, z.instanceof(mongoose.Types.ObjectId)])
    .transform((value) => (typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value))

export type TObjectId = z.infer<typeof ObjectIdZ> // -> mongoose.Types.ObjectId
