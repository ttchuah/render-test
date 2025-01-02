import mongoose, { Schema, Document, Model } from 'mongoose';

interface IOrganization extends Document {
    organizationName: string;
    type: string;
}

const OrganizationSchema: Schema = new Schema<IOrganization>({
    organizationName: { 
        type: String, 
        required: true 
    },
    type: {
        type: String,
        required: true,
        enum: ['church','llh']
    }
});

export const Organization: Model<IOrganization> = mongoose.model<IOrganization>('Organization', OrganizationSchema);