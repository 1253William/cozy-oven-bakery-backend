import mongoose, { Schema, Document, Model } from 'mongoose';

export type User = Document & {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    userName: string; 
    workId: string;
    telegramId?: string; // Optional for Telegram login
    phoneNumber?: string;
    email: string;
    dateOfBirth?: Date;
    gender: 'Male' | 'Female' | 'Other';
    password: string; // null for social logins
    googleId: String;    // if signed in with Google
    appleId: String;     // if signed in with Apple
    profileImage: String;
    profileImagePublicId: string;
    jobTitle: string;
    role: 'Staff' | 'Admin' | 'Human Resource Manager';
    employeeProfile?: mongoose.Types.ObjectId;
    department: 'Engineering' | 'Design' | 'Human Resources' | 'Social Media'| 'Customer Support' | 'Production';
    employmentStatus: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
    workStatus: 'remote' | 'in-person';
    attendance?: mongoose.Types.ObjectId; 
    passwordChangedAt?: Date;
    isActive?: boolean;
    isAccountVerified?: boolean;
    isAccountDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema: Schema<User> = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        userName: {
            type: String,
            required: false,
            trim: true,
        },
        workId: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
            trim: true,
            index: true 
        },
        telegramId: {
            type: String,
            required: false,
            unique: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: false,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        dateOfBirth: {
            type: Date,
            required: true,
           validate: {
            validator: function (value: Date) {
                const today = new Date();
                const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                return value <= minDate;
            },
            message: 'User must be at least 18 years old',
            }
      },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
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
        jobTitle: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['Staff', 'Admin', 'Human Resource Manager'],
            default: 'Staff',
            required: true,
        },
        employeeProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmployeeProfile',
        //     required: function () {
        //    return this.role === 'Staff';
        // }
        required: false
     },
        department: {
            type: String,
            enum: ['Engineering', 'Design', 'Human Resources', 'Production', 'Social Media', 'Customer Support'],
            default: 'Design',
            required: false,
        },
        employmentStatus: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
            default: 'Full-time',
        },
        workStatus: {
            type: String,
            enum: ['remote', 'in-person'],
            default: 'in-person',
        },
        attendance: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attendance',
            required: false,
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

UserSchema.index({ firstName: 1, lastName: 1 });

const UserModel: Model<User> = mongoose.model<User>('User', UserSchema);

export default UserModel;