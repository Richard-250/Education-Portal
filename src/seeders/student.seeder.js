import mongoose from "mongoose";
import Student from "../models/students.js";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Helper function to generate student IDs using UUID
const generateStudentId = () => {
  const uuid = uuidv4();
  // Take first 8 characters of UUID and combine with year
  const shortId = uuid.split('-')[0];
  const year = new Date().getFullYear();
  return `STU-${year}-${shortId.toUpperCase()}`;
};

// Sample student data
const students = [
  {
    firstName: 'Emma',
    lastName: 'johnson',
    email: 'emma.johnson@school.edu',
    password: 'student123',
    phoneNumber: '5550102030',
    studentId: generateStudentId(),
    grade: '10',
    dateOfBirth: new Date('2007-05-15'),
    academicRecords: {
      GPA: 3.8,
      academicStanding: 'good'
    },
    primaryLanguage: 'English'
  },
  {
    firstName: 'Liam',
    lastName: 'chen',
    email: 'liam.chen@school.edu',
    password: 'student123',
    phoneNumber: '5550203040',
    studentId: generateStudentId(),
    grade: '11',
    dateOfBirth: new Date('2006-08-22'),
    academicRecords: {
      GPA: 3.5,
      academicStanding: 'good'
    },
    primaryLanguage: 'Mandarin'
  },
  {
    firstName: 'Sophia',
    lastName: 'Rodriguez',
    email: 'sophia.rodriguez@school.edu',
    password: 'student123',
    phoneNumber: '5550304050',
    studentId: generateStudentId(),
    grade: '9',
    dateOfBirth: new Date('2008-02-10'),
    academicRecords: {
      GPA: 3.2,
      academicStanding: 'good'
    },
    primaryLanguage: 'Spanish',
    specialNeeds: {
      hasSpecialNeeds: true,
      details: 'Requires additional test time'
    }
  }
];

const seedStudents = async () => {
  try {
    const isStudentCreated = await Student.findOne({ email: students[0].email });

    if (isStudentCreated) return ;
    await Student.create(students);
    console.log('students seeded successfully')
  } catch (error) {
    console.error('Error seeding students:', error);
  } 
};

export default seedStudents;