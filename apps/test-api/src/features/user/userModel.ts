import mongoose, { Document, Model, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
mongoose.Promise = global.Promise;

interface IUser extends Document {
    username: string;
    password: string;
    organizations: mongoose.Types.ObjectId[];
    isCorrectPassword(password: string): Promise<boolean>;
}

const saltRounds = 10;

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    organizations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Organization'
        }
    ]
});

// Runs before saving document to database.
UserSchema.pre('save', function (next) {
    
    if (this.isNew || this.isModified('password')) {
        const document = this as IUser;
        bcrypt.hash(document.password, saltRounds, function (err, hashedPassword) {
            if (err) {
                next(err);
            } else {
                document.password = hashedPassword;
                next();
            }
        });
    } else {
        next();
    }
});

UserSchema.methods.isCorrectPassword = function (password: string): Promise<boolean> {
    const document = this as IUser;
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, document.password, function (err, same) {
            if (err) {
                reject(err);
            } else {
                resolve(same);
            }
        });
    });
};

export const User: Model<IUser> = model<IUser>('User', UserSchema);
