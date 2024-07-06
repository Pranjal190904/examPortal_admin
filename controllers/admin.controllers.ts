import Admin from '../models/admin.model';
import { Request, Response } from 'express';
import crypto from "crypto";
import Question from '../models/question.model';   
import Token from '../middleware/token.middleware';
import {sendPassword} from "../utils/mailer";
import StudentModel from '../models/student.model'
import { ADMIN_PASS } from '../config/env.config';
import ResponseModel from '../models/response.model';
import Visited from '../models/visited.model';

const adminController = {
    registerAdmin : async (req: Request, res: Response): Promise<Response> => { 
        try{
            const {admin_pass , username, password} = req.body;
            if ( admin_pass !== ADMIN_PASS ) {
                return res.status(400).json({ message: "Invalid Admin Password" });
            }
            const adminExists = await Admin.findOne({username});
            if(adminExists){
                return res.status(400).json({message:"Admin already exists."});
            }
            const admin = new Admin({
                username,
                password
            });
            await admin.save();
            return res.status(201).json({message:"Admin registered successfully."});
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    login: async (req: Request, res: Response): Promise<Response> => {
        try {
            const { username, password }: { username: string; password: string } = req.body;      
             
            const admin= await Admin.findOne({ username : username });
            
            if (!admin) {
                return res.status(400).json({ message: "Invalid Username" });
            }

            if (admin.password !== password) {
                return res.status(400).json({ message: "Invalid Password" });
            }

            const accessToken = await Token.signAccessToken(admin.id);
            
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            });

            return res.status(200).json({ message: "Login Successful" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    addStudent: async(req:Request,res:Response):Promise<Response>=>{
        try {
            const {name,studentNumber,branch,gender,residency,email,phone} = req.body;
            const studentExists = await StudentModel.findOne({studentNumber});
            if(studentExists){
                return res.status(400).json({message:"Student already exists."});
            }
            const password:string= crypto.randomBytes(8).toString('hex');
            const student = new StudentModel({
                name,
                studentNumber,
                branch,
                gender,
                residency,
                email,
                phone,
                password,
                isVerified:true
            });
            await student.save();
            await sendPassword(email,studentNumber,password);
            return res.status(201).json({message:"Student registered successfully."});
        } catch (error) {
            return res.status(500).json({message:"Internal server error."});
        }
    },
    addQuestion : async (req:Request,res:Response):Promise<Response>=>{
        try {
            const {question , options , subject, answer } = req.body;
            
            const newQuestion = new Question({
                subject,
                question,
                options,
                answer
              });
        
              await newQuestion.save();
        
              return res.status(201).json({ message: "Question added successfully" });
        } catch (err) {
            console.log(err);
            return res.status(500).json({message:"Internal server error."});            
        }
    },
    updateQuestion: async(req:Request,res:Response):Promise<Response>=>{
        try {
            const {quesId,question,options,subject , answer} = req.body;
            
            const updatedQuestion = await Question.findOneAndUpdate(
                { _id:quesId },
                { question, options, subject, answer },
                { new: true } 
            );
    
            if (!updatedQuestion) {
                return res.status(404).json({ message: "Question does not exist." });
            }
    
            return res.status(200).json({message:"Question updated successfully."});
        }
        catch(error){
            return res.status(500).json({message:"internal server error"});
        }
    },
    deleteQuestion: async(req:Request,res:Response):Promise<Response>=>{
        try {
            const {quesId} = req.body;
            const questionExists = await Question.findOneAndDelete({_id:quesId});
            console.log(questionExists)
            if(!questionExists){
                return res.status(400).json({message:"Question does not exist."});
            }
            return res.status(200).json({message:"Question deleted successfully."});
        }
        catch(error){
            return res.status(500).json({message:"internal server error"});
        }
    },
    questions : async (req : Request, res : Response ) : Promise<Response>  => {
        try {
            const questions = await Question.find({});
            const groupedQuestions=questions.reduce((acc,question)=>{
                const key=question.subject;
                if(!acc[key]){
                    acc[key]=[];
                }
                acc[key].push(question);
                return acc;
            },{} as {[key: string]: any});
            return res.status(200).json(groupedQuestions);
        } catch (err) {
            console.log(err);
            return res.status(500).json({message:"Internal server error."});
        }
    },
    getStudentTypes : async (req: Request, res: Response) => {
        try {
            let boysHostelCount = 0;
            let girlsHostelCount = 0;
            let boysDayScholarCount = 0;
            let girlsDayScholarCount = 0;
    
            const students = await StudentModel.find();
            students.forEach(student => {
                if (student.gender === 'male' && student.residency === 'hostel') {
                    boysHostelCount++;
                } else if (student.gender === 'female' && student.residency === 'hostel') {
                    girlsHostelCount++;
                } else if (student.gender === 'male' && student.residency === 'day scholar') {
                    boysDayScholarCount++;
                } else if (student.gender === 'female' && student.residency === 'day scholar') {
                    girlsDayScholarCount++;
                }
            });
            res.status(200).json({
                boysHostel: boysHostelCount,
                girlsHostel: girlsHostelCount,
                boysDayScholar: boysDayScholarCount,
                girlsDayScholar: girlsDayScholarCount,
            });
        } catch (error) {
            console.error("Error fetching students: ", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

export default adminController;
