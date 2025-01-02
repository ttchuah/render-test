import mongoose, { Document, Schema, Model, model } from 'mongoose';
mongoose.Promise = global.Promise;

interface IFolder extends Document {
    folderName: string;
    date: Date;
    organization: {
        _id: Schema.Types.ObjectId;
    };
}

const folderSchema = new Schema<IFolder>({
    folderName: {
        type: String,
        unique: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    organization: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Organization'
        }
    }
});

export const Folder: Model<IFolder> = model<IFolder>('Folder', folderSchema);

