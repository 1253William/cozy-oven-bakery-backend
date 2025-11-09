//employeeProfile.model.ts
import mongoose, { Schema, Document, model } from 'mongoose';

export interface IEmployeeProfile extends Document {
  user: mongoose.Types.ObjectId; //Reference to User - Employee of the company (Staff, HR Manager, Admin (CEO/COO))
  personalInfo: {
    nationality: string;
    maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other';
    personalPronouns:string[];
  };
  contactInfo: {
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    regionOrState: string;
    postalCode: string;
  };
  emergencyContact: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    altPhoneNumber?: string;
    address: string;
    regionOrState: string;
    city: string;
  };
  employmentDetails: {
    employeeId?: string;
    jobTitle: string;
    department: string;
    dateHired: string;
    employmentType: 'Full-time' | 'Part-time' | 'Contract' |'Internship';
    workLocation: string;
    supervisorName: string;
    employmentStatus?: 'Active' | 'On Leave' | 'Terminated';
  };
  qualifications: {
    education: {
      level: string;
      degree: string;
      institution: string;
      fieldOfStudy: string;
      startDate: { month: string, year: string };
      endDate: { month: string, year: string };
      description: string;
    }[];
    certifications?: {
      name: string;
      issuedBy: string;
      issueDate: string;
      expiryDate?: string;
    }[];
    skills: string[]
  };
  documents: {
    cvUrl?: string;
    nationalIdUrl?: string;
    ssnOrTaxId?: string;
    certificatesUrls?: string[];
    offerLetterUrl?: string;
    passportPhotoUrl?: string;
  };
  healthInfo?: {
    medicalConditions?: string[];
    insuranceProvider?: string;
    insuranceId?: string;
    companyPolicy?: string;
  };
  workSchedule?: {
    preferredShift?: string;
    workDays?: string[];
    hoursPerWeek?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, //1-to-1 relationship
    },
    personalInfo: {
      nationality: String,
      maritalStatus: {
        type: String,
        enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
        default: 'Single',
      },
      personalPronouns: {
        type: [String], 
        default: ["he/him"]
      }
    },
    contactInfo: {
      email: String,
      phoneNumber: String,
      address: String,
      city: String,
      regionOrState: String,
      postalCode: String,
    },
    emergencyContact: {
      fullName: String,
      relationship: String,
      phoneNumber: String,
      altPhoneNumber: String,
      address: String,
      regionOrState: String,
      city: String
    },
    employmentDetails: {
      employeeId: String,
      jobTitle: String,
      department: String,
      dateHired: String,
      employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      },
      workLocation: String,
      supervisorName: String,
      employmentStatus: {
        type: String,
        enum: ['Active', 'On Leave', 'Terminated'],
      },
    },
    qualifications: {
      education: [
        {
          level: String,
          degree: String,
          institution: String,
          fieldOfStudy: String,
          startDate: { month: String, year: String },
          endDate: { month: String, year: String },
          description: String
        },
      ],
      certifications: [
        {
          name: String,
          issuedBy: String,
          issueDate: String,
          expiryDate: String,
        },
      ],
      skills: [String]
    },
    documents: {
      cvUrl: String,
      nationalIdUrl: String,
      ssnOrTaxId: String,
      certificatesUrls: [String],
      offerLetterUrl: String,
      passportPhotoUrl: String,
    },
    healthInfo: {
      medicalConditions: [String],
      insuranceProvider: String,
      insuranceId: String,
      companyPolicy: {
          type: String,
    default: `
      This Company Health Policy sets out the framework for safeguarding the health,
      safety, and well-being of employees. The company is committed to maintaining
      a safe working environment, providing access to health services, supporting
      mental health, and complying with occupational safety standards.
      
      Key areas:
      - Workplace safety & ergonomics
      - Health insurance & medical leave
      - Mental health & counseling
      - Preventive health measures (screenings, vaccination drives)
      - Equal access & non-discrimination
      - Confidentiality of employee health data

      Employees are expected to comply with safety protocols and report hazards,
      while management ensures regular audits, emergency preparedness, and
      continuous improvement in health standards.
    `        
      }
    },
    workSchedule: {
      preferredShift: String,
      workDays: [String],
      hoursPerWeek: Number,
    },
    createdAt: {
    type: Date,
    default: Date.now,
  },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const EmployeeProfile = model<IEmployeeProfile>(
  'EmployeeProfile',
  EmployeeProfileSchema
);
