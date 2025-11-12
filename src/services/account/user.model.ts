import mongoose, { Schema, Document, Model } from 'mongoose';

export type User = Document & {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string; // null for social logins
    googleId: String;    // if signed in with Google
    profileImage: String;
    profileImagePublicId: string;
    role: 'Customer' | 'Admin';
    passwordChangedAt?: Date;
    isActive?: boolean;
    isAccountVerified?: boolean;
    isAccountDeleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<User> = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },
        profileImage: {
            type: String,
            default: 'https://res.cloudinary.com/dxfq3iotg/image/upload/v1646434233/user_profile/default_profile_image_q5j98z.png'
        },
        profileImagePublicId: {
            type: String,
            default: 'user_profile/default_profile_image_q5j98z'
        },
        role: {
            type: String,
            enum: ['Customer', 'Admin'],
            default: 'Customer',
            required: true,
        },
        passwordChangedAt: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        isAccountVerified: {
            type: Boolean,
            default: false,
        },
        isAccountDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }

);

UserSchema.index({ fullName: 1, email: 1 });

const UserModel: Model<User> = mongoose.model<User>('User', UserSchema);

export default UserModel;