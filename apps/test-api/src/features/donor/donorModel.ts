import { Document, Model, model, Schema } from 'mongoose';

interface IDonor extends Document {
    referenceNumber: string;
    firstName: string;
    lastName: string;
    company?: string;
    address?: string;
    organization: {
        _id: Schema.Types.ObjectId;
    };
}

const donorSchema: Schema = new Schema({
    referenceNumber: {
        type: String,
        default: ''
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    company: {
        type: String
    },
    address: {
        type: String
    },
    organization: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Organization'
        }
    },
});

donorSchema.index({
    referenceNumber: 1,
    firstName: 1,
    lastName: 1
});

export const Donor: Model<IDonor> = model<IDonor>('Donor', donorSchema);
