import mongoose, { Schema, Document, Model, model } from 'mongoose';
mongoose.Promise = global.Promise;

export interface IDonation extends Document {
    donor: mongoose.Types.ObjectId;
    type: 'Cash' | 'Cheque' | 'Bank Draft' | 'Bank Transfer' | 'Donation In Kind' | 'PayPal';
    remark?: string;
    organization: {
        _id: mongoose.Types.ObjectId;
        name: string;
    };
    folder: {
        _id: mongoose.Types.ObjectId;
        date: Date;
    };
    amount: number;
    currency: 'CAD' | 'USD' | 'HKD';
    registrationNumber?: string;
    date: Date;
}

const donationSchema = new Schema<IDonation>({
    donor: {
        type: Schema.Types.ObjectId,
        ref: 'Donor'
    },
    type: {
        type: String,
        enum: ['Cash', 'Cheque', 'Bank Draft', 'Bank Transfer', 'Donation In Kind', 'PayPal'],
    },
    remark: String,
    organization: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Organization'
        },
        name: String
    },
    folder: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Folder'
        },
        date: Date
    },
    amount: Number,
    currency: {
        type: String,
        enum: ['CAD', 'USD', 'HKD'],
    },
    registrationNumber: {
        type: String
    },
    date: Date,
});

donationSchema.index({
    "folder._id": 1,
    'organization._id': 1
});
export const Donation: Model<IDonation> = model<IDonation>("Donation", donationSchema);

