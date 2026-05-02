import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: { 
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
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    birthdate: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => value <= new Date(),
            message: 'La fecha de nacimiento no puede ser futura'
        }
    },
    url_profile: {
        type: String,
        trim: true,
        default: ''
    },
    adress: {
        type: String,
        trim: true,
        default: ''
    },
    roles: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role' 
    }]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
