import mongoose from 'mongoose'
import { z } from 'zod'

export const ObjectIdHexZ = z.string().regex(/^[0-9a-fA-F]{24}$/, 'invalid.objectId')

export const ObjectIdZ = z.union([ObjectIdHexZ, z.instanceof(mongoose.Types.ObjectId)])
    .transform((value) => (typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value))

export type TObjectId = z.infer<typeof ObjectIdZ>
